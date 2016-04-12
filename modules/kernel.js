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

module.exports.gen_uuid = function(){
  var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}



//TESTTESTTESTTEST

// function ttt(){
//   // db.findDocsInDb(collection,{"chiptype":chiptype,"timestamp":timestamp,$and:["neutron":{$ne:true},"neutronDW":{$ne:true}]},{},{},function(data){
//   //         // console.log(data.length)
//   //         writeCrToTxt(data)
//   //       });
// console.log("ttt")
// var timestamp = new Date()
//   var date = new Date(timestamp.getFullYear(),timestamp.getMonth(),timestamp.getDate())
//         db.findDocsInDb('chip100_182',{"chiptype":182,"timestamp":{"$gte":date},$or:[{"neutron":{$ne:true}},{"neutronDW":{$ne:true}}]},{},{},function(data){
//           console.log(data.length)
//           // var crs = []
//           // for(var i in data){
//           //   // console.log(i)

//           //   if(crs.length==0){
//           //       console.log('pushed '+i)
//           //       crs.push({"time":data[i].timestamp,data:[data[i]]})
//           //       // console.log(data[i].timestamp)
//           //     } else {
//           //       var found = false
//           //       for(var j in crs){
//           //         // var date1 = new Date(crs[j]['time'])
//           //         // var date2 = new Date(data[i].timestamp)
//           //         // console.log(crs[j]['time'].getTime()==data[i].timestamp.getTime())

//           //         if(crs[j]['time'].getTime()==data[i].timestamp.getTime()){
//           //           // console.log('found')
//           //           crs[j]['data'].push(data[i])
//           //           found = true
//           //           break
//           //         }
//           //       }
//           //      if(!found){
//           //      console.log('pushed '+i+"--"+crs.length)
//           //       crs.push({"time":data[i].timestamp,data:[data[i]]})
//           //      }
//           //     }

//           // }
//           // console.log(crs.length)
//           // for(var i in crs){
//           //   writeCrToTxt(crs[i]['data'])
//           // }
//           // writeSpToTxt(data)
//         })



//         var writeSpToTxt = function(data){
//   var prevMaxs = [0,0,0,0,0,0,0,0,0,0,0,0];
//   var sp = [[],[],[],[],[],[],[],[],[],[],[],[]];
//   var filename = "./resources/txt/"+data[0].chiptype+"/sp/"+"SPCH__"+data[0].timestamp.getDate()+(data[0].timestamp.getMonth()+1)+
//     data[0].timestamp.getFullYear()+".dat";

//   var createSp = function(event,channel){
//     if (event.channel == channel){
//         var max = Number((event.max).toFixed(0));
//         max = max < 0 ? -max : max;
//         var isNewMax = false
//         if(max>prevMaxs[channel]){
//             isNewMax = true
//         prevMaxs[channel] = max
//         }
//         if(sp[channel].length == 0){
//           for (var j=0;j<=max;j++){
//             sp[channel].push([j,0]);
//           }
//         } else if(isNewMax){
//             for(var j=sp[channel].length;j<=max;j++){
//                 sp[channel].push([j,0])
//             }
//         }
//         if(sp[channel][max]!=undefined){
//           sp[channel][max][1]++;
//         }
//     }
//   }
//   for (var i in data){
//     var event = data[i];
//   //    var r = event.integrals.sabove/event.integrals.sunder;
//     if(true){
//       for(var ch = 0; ch<12; ch++){
//         createSp(event,ch);
//       }
//     }
//   }
//   var str ="N\tCh1\tCh2\tCh3\tCh4\tCh5\tCh6\tCh7\tCh8\tCh9\tCh10\tCh11\tCh12\n";

//   var maxlength = 0;
//   for(var i=0;i<12;i++){
//     maxlength = maxlength<sp[i].length ? sp[i].length : maxlength
//   }

//   for (var i=0;i<maxlength;i++){
//     str+=i+"\t"
//     for (var j=0;j<12;j++){
//       if(sp[j][i]!=undefined){
//         str+=sp[j][i][1]+"\t";
//       } else {
//         str+="0\t";
//       }

//     }
//     str+="\n";
//   }
//   fs.writeFile(filename,str);
//   // log("sp_end")
// }

// var writeCrToTxt = function(data){
//   var filename = "./resources/txt/"+data[0].chiptype+"/cr/"+"CRCH__"+data[0].timestamp.getDate()+(data[0].timestamp.getMonth()+1)+
//     data[0].timestamp.getFullYear()+".dat";
//   fs.stat(filename,function(err){
//     var str = "\n"+data[0].timestamp.getDate()+"-"+(data[0].timestamp.getMonth()+1)+"-"+data[0].timestamp.getFullYear()+" "+data[0].timestamp.getHours()+":"+data[0].timestamp.getMinutes()+"\t"
//     if(err){
//       str ="Time\tCh1\tCh2\tCh3\tCh4\tCh5\tCh6\tCh7\tCh8\tCh9\tCh10\tCh11\tCh12\n"+data[0].timestamp.getDate()+"-"+(data[0].timestamp.getMonth()+1)+"-"+data[0].timestamp.getFullYear()+" "+data[0].timestamp.getHours()+":"+data[0].timestamp.getMinutes()+"\t";
//     }
//     var rates = [0,0,0,0,0,0,0,0,0,0,0,0]
//     for (var i in data){
//       rates[data[i].channel]++;
//     }
//     for (var i in rates){
//       str+=rates[i]+"\t"
//     }
//     fs.appendFile(filename,str)
//   })
// }
// }


// ttt()
