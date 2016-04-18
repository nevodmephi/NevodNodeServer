const nevod = require('nevod')
const parser = nevod.getUranParser()
const neutron_core = require('./neutron-core.js')
const fs = require('fs')

var mongo = null
nevod.initMongoClient(true,function(client){
  mongo = client
  mongo.getDBCollections({startsWith:collectionStat},function(cols){
    if(cols.length == 0){
      mongo.writeDocsToDb(collectionStat,[{"type":"countrates","crsN":[],"crsEl":[]},{"type":"spectrums","spsN":[],"spsEl":[]}],function(){
        workout.run()
      })
    } else {
      workout.run()
    }
  })
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
              var runNRates = [0,0,0,0,0,0,0,0,0,0,0,0]
              var runElRates = [0,0,0,0,0,0,0,0,0,0,0,0]
              var spLength = 1000
              var runNSP = neutron_core.createEmptySpArray(spLength)
              var runELSP = neutron_core.createEmptySpArray(spLength)
              parser.parseFileByPart(path+fileToParse,filetype,function(data,info){
                var signals = neutron_core.packs_process_100mhz(data,20,16,true)
                var timestamp = info.filestat.birthtime
                var filenameCRN = settings['save-folder']+chiptype+'/cr/CRN_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat"
                var filenameCREL = settings['save-folder']+chiptype+'/cr/CREl_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat"
                var filenameSPN = settings['save-folder']+chiptype+'/sp/SPN_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat"
                var filenameSPEL = settings['save-folder']+chiptype+'/sp/SPEL_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat"
                if(signals.length!=0){
                  var events = neutron_core.neutron_event(signals,0.1,0.6,chiptype,info.filestat.birthtime)
                  signals = null
                  var rates = neutron_core.createCountRate(events,true)
                  runNSP = neutron_core.createSpectrum(events,true,runNSP)
                  runELSP = neutron_core.createSpectrum(events,false,runELSP)
                  for(var i in runNRates){
                    runNRates[i]+=rates[0][i]
                    runElRates[i]+=rates[1][i]
                  }
                  mongo.writeDocsToDb(collection,events,function(){
                    if(info.finished){
                      console.log('parsed')
                      fs.unlink(path+fileToParse,function(err){
                        if(err){
                          console.log("error unlink")
                        }
                      })
                      mongo.updateCollection(collectionStat,{"type":"countrates"},{$push:{"crsN":{"timestamp":timestamp,"rates":runNRates}}},false,function(){
                        neutron_core.txt.writeCountRateToFile(filenameCRN,runNRates,timestamp,false)
                      })
                      mongo.updateCollection(collectionStat,{"type":"countrates"},{$push:{"crsEl":{"timestamp":timestamp,"rates":runElRates}}},false,function(){
                        neutron_core.txt.writeCountRateToFile(filenameCREL,runElRates,timestamp,false)
                      })
                      var today = new Date(timestamp.getFullYear(),timestamp.getMonth(),timestamp.getDate())
                      mongo.findDocsInDb(collectionStat,{"type":"spectrums","spsN":{$elemMatch:{"date":today}}},{},{},function(data){
                        if(data.length!=0){
                          runNSP = neutron_core.addTwoSpectrums(runNSP,data[0].spsN[0].sp)
                          mongo.updateCollection(collectionStat,{"type":"spectrums","spsN.date":today},{$set:{"spsN.$.sp":runNSP}},false,function(){
                            neutron_core.txt.writeSpectrumToFile(filenameSPN,runNSP,spLength)
                          })
                        } else {
                          mongo.updateCollection(collectionStat,{"type":"spectrums"},{$push:{"spsN":{"date":today,"sp":runNSP}}},false,function(){
                            neutron_core.txt.writeSpectrumToFile(filenameSPN,runNSP,spLength)
                          })
                        }
                      })
                      mongo.findDocsInDb(collectionStat,{"type":"spectrums","spsEl":{$elemMatch:{"date":today}}},{},{},function(data){
                        if(data.length!=0){
                          runELSP = neutron_core.addTwoSpectrums(runELSP,data[0].spsEl[0].sp)
                          mongo.updateCollection(collectionStat,{"type":"spectrums","spsEl.date":today},{$set:{"spsEl.$.sp":runELSP}},false,function(){
                            neutron_core.txt.writeSpectrumToFile(filenameSPEL,runELSP,spLength)
                          })
                        } else {
                          mongo.updateCollection(collectionStat,{"type":"spectrums"},{$push:{"spsEl":{"date":today,"sp":runELSP}}},false,function(){
                            neutron_core.txt.writeSpectrumToFile(filenameSPEL,runELSP,spLength)
                          })
                        }
                      })
                    }
                  });
                  data = null;
                } else if (info.finished){
                  signals = null
                  console.log('parsed')
                  fs.unlink(path+fileToParse,function(err){
                    if(err){
                      console.log("error unlink")
                    }
                  })
                  mongo.updateCollection(collectionStat,{"type":"countrates"},{$push:{"crsN":{"timestamp":timestamp,"rates":runNRates}}},false,function(){
                    neutron_core.txt.writeCountRateToFile(filenameCRN,runNRates,timestamp,false)
                  })
                  mongo.updateCollection(collectionStat,{"type":"countrates"},{$push:{"crsEl":{"timestamp":timestamp,"rates":runElRates}}},false,function(){
                    neutron_core.txt.writeCountRateToFile(filenameCREL,runElRates,timestamp,false)
                  })
                  var today = new Date(timestamp.getFullYear(),timestamp.getMonth(),timestamp.getDate())
                  mongo.findDocsInDb(collectionStat,{"type":"spectrums","spsN":{$elemMatch:{"date":today}}},{},{},function(data){
                    if(data.length!=0){
                      runNSP = neutron_core.addTwoSpectrums(runNSP,data[0].spsN[0].sp)
                      mongo.updateCollection(collectionStat,{"type":"spectrums","spsN.date":today},{$set:{"spsN.$.sp":runNSP}},false,function(){
                        neutron_core.txt.writeSpectrumToFile(filenameSPN,runNSP,spLength)
                      })
                    } else {
                      mongo.updateCollection(collectionStat,{"type":"spectrums"},{$push:{"spsN":{"date":today,"sp":runNSP}}},false,function(){
                        neutron_core.txt.writeSpectrumToFile(filenameSPN,runNSP,spLength)
                      })
                    }
                  })
                  mongo.findDocsInDb(collectionStat,{"type":"spectrums","spsEl":{$elemMatch:{"date":today}}},{},{},function(data){
                    if(data.length!=0){
                      runELSP = neutron_core.addTwoSpectrums(runELSP,data[0].spsEl[0].sp)
                      mongo.updateCollection(collectionStat,{"type":"spectrums","spsEl.date":today},{$set:{"spsEl.$.sp":runELSP}},false,function(){
                        neutron_core.txt.writeSpectrumToFile(filenameSPEL,runELSP,spLength)
                      })
                    } else {
                      mongo.updateCollection(collectionStat,{"type":"spectrums"},{$push:{"spsEl":{"date":today,"sp":runELSP}}},false,function(){
                        neutron_core.txt.writeSpectrumToFile(filenameSPEL,runELSP,spLength)
                      })
                    }
                  })
                  // neutron_core.txt.writeCountRateToFile(filenameCRN,runNRates,timestamp,false)
                  // neutron_core.txt.writeCountRateToFile(filenameCREL,runElRates,timestamp,false)
                }
              })
            }
          })
        }
      });
    }
  },
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
