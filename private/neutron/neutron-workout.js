const parser = require('../parser.js') //parser
const db = require('../../modules/db.js') //working with db
const neutron_core = require('./neutron-core.js')
const fs = require('fs')

var options = JSON.parse(process.env.options__)
var _tasks = options['tasks'], _filename =  options['file'], _filetype = '100Mhz',
    _settings = JSON.parse(process.env.settings), isSaveSigs = options['savesigs'],
    chiptype = options['chiptype'], collection = 'chip100_'+chiptype

if(isSaveSigs){
  collection="waveforms_"+_filename.slice(0,_filename.length-4)
}

if(_settings['bin-folder'][0]=='.'){
  _settings['bin-folder'] = '.'+_settings['bin-folder']
}
if(_settings['save-folder'][0]=='.'){
  _settings['save-folder'] = '.'+_settings['save-folder']
}
if(_settings['watching-folder'][0]=='.'){
  _settings['watching-folder'] = '.'+_settings['watching-folder']
}

neutron_core.init(_settings['save-folder'],_filename,isSaveSigs)

var workout = {
  run:function(){
    var donePercent = 0;
    if(_tasks.indexOf("showPercent")!=-1){
      setInterval(function(){
        process.stdout.write('{"type":"percent","value":"'+donePercent+'"};')
      },1000)
    }
    if(_tasks.indexOf("parse")!=-1){
      parser.parseFileByPart(_settings['bin-folder']+_filename,_filetype,function(data,info){
        if(data==null || data==undefined || data.length==0){
          process.exit()
        }
        donePercent = info.status
        var signals = neutron_core.packs_process_100mhz(data,20,32,true)
        if(signals.length!=0){
          var events = neutron_core.neutron_event(signals,0.1,0.6,chiptype,info.filestat.birthtime)
          signals = null
          var timestamp = info.filestat.birthtime
          collection+="_parser"
          db.writeDocsToDb(collection,events,function(){
            if(info.finished){
              process.stdout.write('{"type":"finished"};')
              // onFinished(collection,chiptype,timestamp)
              process.exit()
            }
          });
          data = null;
        } else if (info.finished){
          signals = null
          process.stdout.write('{"type":"finished"};')
          process.exit()
          // onFinished(collection,chiptype,info.filestat.birthtime)
        }
      })
    } else if(_tasks.indexOf('watch')!=-1){
      var onFinished = function(collection,chiptype,timestamp){
        console.log("parsed")
        db.findDocsInDb(collection,{"chiptype":chiptype,"timestamp":timestamp,"neutron":true,"neutronDW":true},{},{},function(data){
          // console.log(data.length)
          writeCrToTxt(data)
        });
        var date = new Date(timestamp.getFullYear(),timestamp.getMonth(),timestamp.getDate())
        db.findDocsInDb(collection,{"chiptype":chiptype,"timestamp":{"$gte":date},"neutron":true,"neutronDW":true},{},{},function(data){
          // console.log(data.length)
          writeSpToTxt(data)
        })
      }
      var newFileName = "?";
      var oldFileName = "??";
      var watcher = fs.watch(_settings['watching-folder'])
      watcher.on('change',function(event,filename){
        var path = _settings['watching-folder']
        if(event=="rename"){
          fs.readdir(path,function(err,files){
            if(files.indexOf(filename)==-1){
              return;
            }
            oldFileName = newFileName;
            newFileName = filename;
            if(oldFileName != "?" && oldFileName!=newFileName){
              console.log("parsing "+oldFileName)
              var fileToParse = oldFileName
              parser.parseFileByPart(path+fileToParse,_filetype,function(data,info){
                var signals = neutron_core.packs_process_100mhz(data,20,32,true)
                if(signals.length!=0){
                  var events = neutron_core.neutron_event(signals,0.1,0.6,chiptype,info.filestat.birthtime)
                  signals = null
                  var timestamp = info.filestat.birthtime
                  db.writeDocsToDb(collection,events,function(){
                    if(info.finished){
                      fs.unlink(path+fileToParse)
                      onFinished(collection,chiptype,timestamp)
                    }
                  });
                  data = null;
                } else if (info.finished){
                  signals = null
                  fs.unlink(path+fileToParse)
                  onFinished(collection,chiptype,info.filestat.birthtime)
                }
              })
            }
          })
        }
      });
    }
  },
}
workout.run()





var writeSpToTxt = function(data){
  var prevMaxs = [0,0,0,0,0,0,0,0,0,0,0,0];
  var sp = [[],[],[],[],[],[],[],[],[],[],[],[]];
  var filename = "../resources/txt/"+data[0].chiptype+"/sp/"+"SP__"+data[0].timestamp.getDate()+(data[0].timestamp.getMonth()+1)+
    data[0].timestamp.getFullYear()+".dat";

  var createSp = function(event,channel){
    if (event.channel == channel){
        var max = Number((event.max).toFixed(0));
        max = max < 0 ? -max : max;
        var isNewMax = false
        if(max>prevMaxs[channel]){
            isNewMax = true
        prevMaxs[channel] = max
        }
        if(sp[channel].length == 0){
          for (var j=0;j<=max;j++){
            sp[channel].push([j,0]);
          }
        } else if(isNewMax){
            for(var j=sp[channel].length;j<=max;j++){
                sp[channel].push([j,0])
            }
        }
        if(sp[channel][max]!=undefined){
          sp[channel][max][1]++;
        }
    }
  }
  for (var i in data){
    var event = data[i];
  // 		var r = event.integrals.sabove/event.integrals.sunder;
    if(true){
      for(var ch = 0; ch<12; ch++){
        createSp(event,ch);
      }
    }
  }
	var str ="N\tCh1\tCh2\tCh3\tCh4\tCh5\tCh6\tCh7\tCh8\tCh9\tCh10\tCh11\tCh12\n";

	var maxlength = 0;
	for(var i=0;i<12;i++){
		maxlength = maxlength<sp[i].length ? sp[i].length : maxlength
	}

	for (var i=0;i<maxlength;i++){
		str+=i+"\t"
		for (var j=0;j<12;j++){
			if(sp[j][i]!=undefined){
				str+=sp[j][i][1]+"\t";
			} else {
				str+="0\t";
			}

		}
		str+="\n";
	}
  fs.writeFile(filename,str);
  // log("sp_end")
}

var writeCrToTxt = function(data){
  var filename = "../resources/txt/"+data[0].chiptype+"/cr/"+"CR__"+data[0].timestamp.getDate()+(data[0].timestamp.getMonth()+1)+
    data[0].timestamp.getFullYear()+".dat";
  fs.stat(filename,function(err){
    var str = "\n"+data[0].timestamp.getDate()+"-"+(data[0].timestamp.getMonth()+1)+"-"+data[0].timestamp.getFullYear()+" "+data[0].timestamp.getHours()+":"+data[0].timestamp.getMinutes()+"\t"
    if(err){
      str ="Time\tCh1\tCh2\tCh3\tCh4\tCh5\tCh6\tCh7\tCh8\tCh9\tCh10\tCh11\tCh12\n"+data[0].timestamp.getDate()+"-"+(data[0].timestamp.getMonth()+1)+"-"+data[0].timestamp.getFullYear()+" "+data[0].timestamp.getHours()+":"+data[0].timestamp.getMinutes()+"\t";
    }
    var rates = [0,0,0,0,0,0,0,0,0,0,0,0]
    for (var i in data){
      rates[data[i].channel]++;
    }
    for (var i in rates){
      str+=rates[i]+"\t"
    }
    fs.appendFile(filename,str)
  })
}
