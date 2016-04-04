//kernel module

const db = require("./db.js"),
      fs = require("fs");
var _task = null
const child_process = require("child_process"),
      spawn = child_process.spawn;

module.exports.settings = null
module.exports.io = null
module.exports.processes = []

module.exports.init = function(task){
  _task = task
}

module.exports.load = function(){
  db.findDocsInDb('settings',{'type':_task},{},{},function(data){
    if(data.length==0){
      var settings = JSON.parse(fs.readFileSync('./private/'+_task+'/'+_task+'-default-settings.json').toString())
      module.exports.settings = settings
      db.writeDocsToDb("settings",[settings],function(){
        console.log("default kernel loading successful")
        run()
      })
    } else {
      module.exports.settings = data[0]
      console.log("kernel loading successful")
      run()
    }
  })
}

var run = function(){
  if(_task=="neutron"){
    module.exports.runBGProcess({proc:"node",options:{tasks:['watch'],chiptype:182}})
  }
}

module.exports.updateSettings = function(data){
  for(i in data){
    var set = data[i]
    module.exports.settings["settings"][set.field]=set.val
  }
  db.updateCollection('settings',{"type":_task},{$set:module.exports.settings},false,function(){
    console.log("update settings successful")
  })
}

module.exports.getBinFiles = function(callback){
  fs.readdir(module.exports.settings["settings"]['bin-folder'],function(err,files){
    if(err){
      console.log(err)
    } else {
      var binfiles = []
      for(var i in files){
        if(files[i].slice(files[i].length-4,files[i].length)==".bin"){
          binfiles.push(files[i])
        }
      }
      callback(binfiles)
    }
  })
}

module.exports.getDBCollections = function(options,callback){
  db.getCollections(options,callback)
}

module.exports.getDataFromDB = function(opts,callback){
  db.findDocsInDb(opts.collection,opts.query,opts.sorting,opts.projection,callback)
}

module.exports.runBGProcess = function(config){
  var env = Object.create(process.env)
  env.options__ = JSON.stringify(config.options)
  env.settings = JSON.stringify(module.exports.settings['settings'])
  const proc = spawn(config.proc,[_task+'/'+_task+'-workout.js'],{cwd:'./private/',env:env})
  proc.fname = config.options['file']
  module.exports.processes.push(proc)
  module.exports.io.emit('proc-run','{"filename":"'+proc.fname+'","pid":"'+proc.pid+'","type":"'+config.options['type']+'"}')
  proc.stdout.on('data',function(data){
    var msgs = data.toString().split(";")
    for(var i in msgs){
      var msg = msgs[i]
      if(msg.length == 0){
        continue
      }
      try {
        msg = JSON.parse(msg)
      } catch(e) {
        console.log("error parsing proc msg: "+msg)
        continue
      }
      switch (msg["type"]) {
        case "finished":
          module.exports.io.emit('proc-finished-success','{"pid":"'+proc.pid+'","filename":"'+config.options.file+'"}')
          break;
        case "memory":
          module.exports.io.emit('proc-ram','{"pid":"'+proc.pid+'","ram":"'+Math.round( msg["value"] * 10 ) / 10+'"}')
          break;
        case "percent":
          module.exports.io.emit('proc-status','{"pid":"'+proc.pid+'","value":"'+Math.round( msg["value"] * 10 ) / 10+'"}')
          break;
        default:
          console.log("other message type: "+data)
      }
    }
  })
  proc.stderr.on('data',function(err){
    console.log(err+"")
    module.exports.io.emit('proc-error','{"pid":"'+proc.pid+'","error":"'+err+'"}')
  })
  proc.on('close',function(code){
    module.exports.io.emit('proc-closed',proc.pid)
    module.exports.processes.splice(module.exports.processes.indexOf(proc), 1)
    proc = null
    console.log("proc closed")

  })
}
