const nevod = require('nevod')
const parser = nevod.getUranParser()
const neutron_core = require('./neutron-core.js')
const fs = require('fs')

var mongo = null
nevod.initMongoClient(true,function(client){
  mongo = client
  // mongo.getDBCollections({startsWith:collectionStat},function(cols){
  //   if(cols.length == 0){
  //     mongo.writeDocsToDb(collectionStat,[{"type":"countrates","crs":[{"birthtime":"","cr":[0,0,0,0,0,0,0,0,0,0,0,0]}]}],function(){})
  //   }
  // })
  // mongo.findDocsInDb(collection,{"chiptype":chiptype},{},{"maximum":1,"_id":0},function(data){
  //   console.log(data)
  //   // writeSpToTxt(data)
  //     data=null;
  // })
  workout.run()
})

var options = JSON.parse(process.env.options__)
var tasks = options['tasks'], _filename =  options['file'], filetype = '100Mhz',
    settings = JSON.parse(process.env.settings), isSaveSigs = options['savesigs'],
    chiptype = options['chiptype'], collection = 'chip100_'+chiptype+"events",
    collectionStat = 'chip100_'+chiptype+"stat"

if(isSaveSigs){
  collection="waveforms_"+_filename.slice(0,_filename.length-4)
}

if(settings['bin-folder'][0]=='.'){
  settings['bin-folder'] = '.'+settings['bin-folder']
}
if(settings['save-folder'][0]=='.'){
  settings['save-folder'] = '.'+settings['save-folder']
}
if(settings['watching-folder'][0]=='.'){
  settings['watching-folder'] = '.'+settings['watching-folder']
}

neutron_core.init(settings['save-folder'],_filename,isSaveSigs)

var workout = {
  run:function(){
    var donePercent = 0;
    if(tasks.indexOf("showPercent")!=-1){
      setInterval(function(){
        process.stdout.write('{"type":"percent","value":"'+donePercent+'"};')
      },1000)
    }
    if(tasks.indexOf("parse")!=-1){
      collection+="_parser"
      parser.parseFileByPart(settings['bin-folder']+_filename,filetype,function(data,info){
        if(data==null || data==undefined || data.length==0){
          process.exit()
        }
        donePercent = info.status
        var signals = neutron_core.packs_process_100mhz(data,20,16,true)
        if(signals.length!=0){
          var events = neutron_core.neutron_event(signals,0.1,0.6,chiptype,info.filestat.birthtime)
          signals = null
          var timestamp = info.filestat.birthtime
          mongo.writeDocsToDb(collection,events,function(){
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
    } else if(tasks.indexOf('watch')!=-1){
      var onFinished = function(timestamp){
        console.log("parsed")
        mongo.findDocsInDb(collection,{"chiptype":chiptype,"timestamp":timestamp},{},{},function(data){
          // console.log(data.length)
          writeCrToTxt(data)
          // console.log("cr wrote")
          // data=null;
          // writeZeroLines(data)
        });
        var date = new Date(timestamp.getFullYear(),timestamp.getMonth(),timestamp.getDate())
        mongo.findDocsInDb(collection,{"chiptype":chiptype,"timestamp":{"$gte":date}},{},{"maximum":1,"_id":0,"timestamp":1,"channel":1,"neutron":1,"neutronDW":1},function(data){
          // console.log(data)
          writeSpToTxt(data)
            // data=null;
        })
      }
      var newFileName = "?";
      var oldFileName = "??";
      var watcher = fs.watch(settings['watching-folder'])
      watcher.on('change',function(event,filename){
        var path = settings['watching-folder']
        if(event=="rename"){
          fs.readdir(path,function(err,files){
            if(files.indexOf(filename)==-1){
              return;
            }
            // if(filename.slice(0,3)!=chiptype.toString()){
            //   return;
            // }
            oldFileName = newFileName;
            newFileName = filename;
            if(oldFileName != "?" && oldFileName!=newFileName){
              console.log(chiptype+" parsing "+oldFileName)
              var fileToParse = oldFileName
              var countratesCreated = false
              parser.parseFileByPart(path+fileToParse,filetype,function(data,info){
                var signals = neutron_core.packs_process_100mhz(data,20,16,true)
                if(signals.length!=0){
                  var events = neutron_core.neutron_event(signals,0.1,0.6,chiptype,info.filestat.birthtime)
                  signals = null
                  var timestamp = info.filestat.birthtime
                  // var rates = neutron_core.createCountRate(events)
                  // console.log(rates)
                  // mongo.findDocsInDb(collectionStat,)
                  // mongo.updateCollection(collectionStat,{"type":"countrates","crs":{$elemMatch:{"birthtime":timestamp}}},{$inc:{'cr.0':rates[0],
                  //   'cr.1':rates[1],'cr.2':rates[2],'cr.3':rates[3],'cr.4':rates[4],'cr.5':rates[5],'cr.6':rates[6],'cr.7':rates[7],'cr.8':rates[8],'cr.9':rates[9],'cr.10':rates[10],
                  //   'cr.11':rates[11],'cr.12':rates[12]}},true,function(){
                  //     console.log("updated")
                  //   })
                  mongo.writeDocsToDb(collection,events,function(){
                    if(info.finished){
                      fs.unlink(path+fileToParse,function(err){
                        if(err){
                          console.log("error unlink")
                        }
                      })
                      // console.log('parsed')
                      onFinished(timestamp)
                    }
                  });
                  data = null;
                } else if (info.finished){
                  signals = null
                  fs.unlink(path+fileToParse,function(err){
                    if(err){
                      console.log("error unlink")
                    }
                  })
                  // console.log('parsed')
                  onFinished(info.filestat.birthtime)
                }
              })
            }
          })
        }
      });
    }
  },
}





var writeSpToTxt = function(data){
  var filename = "../resources/txt/"+chiptype+"/sp/"+"SP__"+data[0].timestamp.getDate()+(data[0].timestamp.getMonth()+1)+
    data[0].timestamp.getFullYear()+".dat";
  var createSP = function(data){
    var prevMaxs = [0,0,0,0,0,0,0,0,0,0,0,0];
  var sp = [[],[],[],[],[],[],[],[],[],[],[],[]];


  var newSp = function(event,channel){
    if (event.channel == channel){
        var max = Number((event.maximum).toFixed(0));
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
  //    var r = event.integrals.sabove/event.integrals.sunder;
    if(true){
      for(var ch = 0; ch<12; ch++){
        newSp(event,ch);
      }
    }
  }
  return sp
  }
  var els = []
  var ns = []
  // console.log(data.length)
  for(var i in data){
    if(data[i].neutron && data[i].neutronDW){
      ns.push(data[i])
    } else {
      els.push(data[i])
    }
  }
  // console.log(els.length)
  // console.log(ns.length)
  var sp = createSP(ns)
  var sp_el = createSP(els)

	var str ="AMPL\tN1\tE1\tN2\tE2\tN3\tE3\tN4\tE4\tN5\tE5\tN6\tE6\tN7\tE7\tN8\tE8\tN9\tE9\tN10\tE10\tN11\tE11\tN12\tE12\n";

	var maxlength = 0;
	for(var i=0;i<12;i++){
		maxlength = maxlength<sp[i].length ? sp[i].length : maxlength
    maxlength = maxlength<sp_el[i].length ? sp_el[i].length : maxlength
	}

  console.log(maxlength)
	for (var i=0;i<maxlength;i++){
		str+=i+"\t"
		for (var j=0;j<12;j++){
			if(sp[j][i]!=undefined){
				str+=sp[j][i][1]+"\t";
			} else {
				str+="0\t";
			}
      if(sp_el[j][i]!=undefined){
        str+=sp_el[j][i][1]+"\t";
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
      str ="Time\tN1\tE1\tN2\tE2\tN3\tE3\tN4\tE4\tN5\tE5\tN6\tE6\tN7\tE7\tN8\tE8\tN9\tE9\tN10\tE10\tN11\tE11\tN12\tE12\n"+data[0].timestamp.getDate()+"-"+(data[0].timestamp.getMonth()+1)+"-"+data[0].timestamp.getFullYear()+" "+data[0].timestamp.getHours()+":"+data[0].timestamp.getMinutes()+"\t";
    }
    var rates = [0,0,0,0,0,0,0,0,0,0,0,0]
    var el_rates = [0,0,0,0,0,0,0,0,0,0,0,0]
    for (var i in data){
      if(data[i].neutron && data[i].neutronDW){
        rates[data[i].channel]++;
      } else {
        el_rates[data[i].channel]++;
      }
    }
    for (var i in rates){
      str += rates[i]+"\t"
      str += el_rates[i]+"\t"
    }
    fs.appendFile(filename,str)
  })
}


var writeZeroLines = function(data){
  var filename = "../resources/txt/"+data[0].chiptype+"/"+"ZL__"+data[0].timestamp.getDate()+(data[0].timestamp.getMonth()+1)+
    data[0].timestamp.getFullYear()+".dat";
    // console.log(data.length)
  neutron_core.txt.saveZeroLines(filename,data,true)
  // fs.stat(filename,function(err){
  //   var str = ""
  //   if(err){
  //     str ="Z1\tZ2\tZ3\tZ4\tZ5\tZ6\tZ7\tZ8\tZ9\tZ10\tZ11\tZ12\n"
  //   }
  //   var z_lines = [[],[],[],[],[],[],[],[],[],[],[],[]]
  //   // console.log(data.length)
  //   for(var i in data){
  //     z_lines[data[i].channel].push(data[i].zero_line)
  //   }
  //   // console.log(data[0].zero_line)
  //   // console.log(z_lines[0].length)
  //   var maxlength = 0;
  //   for(var i=0;i<12;i++){
  //     maxlength = maxlength<z_lines[i].length ? z_lines[i].length : maxlength
  //   }
  //   for(var i=0; i<maxlength;i++){
  //     // str+=data[i].timestamp
  //     for(var j = 0;j<12;j++){
  //       if(z_lines[j][i]!=undefined){
  //         str += z_lines[j][i] + "\t"
  //       } else {
  //         str += 0 + "\t"
  //       }
  //     }
  //     str += "\n"
  //   }
  //   fs.appendFile(filename,str)
  // })
}
