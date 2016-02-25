var fs = require('fs'),
    parser = require("./parser.js"),
    db = require("./db.js"),
    uran = require("./uran.js")
    heapdump = require("./heapdump.js").init("resources/")

process.on("message",function(msg){
  switch (msg) {
    case "bgParsing-100":
      try {
        watchForChanges("resources/shared/100mhz/","100Mhz","chip100","181")
        // watchForChanges("e:\\БААК100\\100 181 плата с запуском нового файла по таймеру\\ADC_12CH\\bin\\Debug\\","100Mhz","chip100","181");
        // watchForChanges("e:\\БААК100\\100 183 плата с запуском нового файла по таймеру\\ADC_12CH\\bin\\Debug\\","100Mhz","chip100","183");
      } catch(e) {
        console.log(e);
        process.exit();
      }
      break;
    default:
    console.log("CP: unkown task")
    process.exit();
  }
});


var watchForChanges = function(path,format,collection,chiptype){
  // var indexCollection = "index"+chiptype
  var onFinished = function(collection,chiptype,timestamp){
    console.log("parsed")
    db.findDocsInDb(collection,{"chiptype":chiptype,"timestamp":timestamp,"neutron":true,"neutronDW":true},{},function(data){
      console.log(data.length)
      writeCrToTxt(data)
    });
    var date = new Date(timestamp.getFullYear(),timestamp.getMonth(),timestamp.getDate())
    db.findDocsInDb(collection,{"chiptype":chiptype,"timestamp":{"$gte":date},"neutron":true,"neutronDW":true},{},function(data){
      console.log(data.length)
      writeSpToTxt(data)
    });
  }

  var newFileName = "?";
  var oldFileName = "??";
  var watcher = fs.watch(path)
  watcher.on('change',function(event,filename){
    if(event=="rename"){
      fs.readdir(path,function(err,files){
        if(files.indexOf(filename)==-1){
          return;
        }
        oldFileName = newFileName;
        newFileName = filename;
        if(oldFileName != "?" && oldFileName!=newFileName){
          console.log("parsing "+oldFileName)
          parser.parseFileByPart(path+oldFileName,format,function(data,info){
            var signals = uran.packs_process_100mhz(data,20,32,true)
            if(signals.length!=0){
              var events = uran.neutron_event(signals,0.1,0.6,chiptype,info.filestat.birthtime)
              signals = null
              var timestamp = info.filestat.birthtime
              db.writeDocsToDb(collection,events,function(){
                if(info.finished){
                  onFinished(collection,chiptype,timestamp)
                }
              });
              data = null;
            } else if (info.finished){
              signals = null
              onFinished(collection,chiptype,info.filestat.birthtime)
            }
          })
        }
      })
    }
  });
  // db.removeCollection(indexCollection,function(){
  //   fs.readdir(path,function(err,files){
  //     if(err){
  //       console.log("bg-server err: "+err)
  //       return
  //     }
  //     var binfiles = []
  //     for(var i in files){
  //       if(files[i].slice(files[i].length-4,files[i].length)==".bin"){
  //         binfiles.push(files[i])
  //       }
  //     }
  //     db.findDocsInDb(indexCollection,{"chiptype":chiptype},{},function(data){
  //       var indexes = []
  //       if(data.length==0){
  //         for(var i in binfiles){
  //           var file = binfiles[i]
  //           var index = {chiptype:chiptype,file:file,error:false,parsed:false}
  //           indexes.push(index)
  //         }
  //       } else {
  //         var exists = false
  //         for(var i in binfiles){
  //           var file = binfiles[i]
  //           for(var j in data){
  //             if(file==data[j].file){
  //               exists = true
  //               break
  //             }
  //           }
  //           if(!exists){
  //             var index = {chiptype:chiptype,file:file,error:false,parsed:false}
  //             indexes.push(index)
  //           }
  //           exists = false
  //         }
  //       }
  //       if(indexes.length!=0){
  //         db.writeDocsToDb(indexCollection,indexes,function(){})
  //       }
  //     })
  //   })
  //   var newFileName = "?";
  //   var oldFileName = "??";
  //   var watcher = fs.watch(path)
  //   watcher.on('change',function(event,filename){
  //     if(event=="rename"){
  //       fs.readdir(path,function(err,files){
  //         if(files.indexOf(filename)==-1){
  //           db.removeDocsFromDb(indexCollection,{"file":filename},function(){})
  //           return;
  //         }
  //         oldFileName = newFileName;
  //         newFileName = filename;
  //         if(oldFileName != "?" && oldFileName!=newFileName){
  //           db.findDocsInDb(indexCollection,{"file":oldFileName},{},function(data){
  //             if(data.length==0){
  //               var index = [{chiptype:chiptype,file:oldFileName,error:false,parsed:false}]
  //               db.writeDocsToDb(indexCollection,index,function(){})
  //             } else {
  //               console.log("error online indexing")
  //             }
  //           })
  //         }
  //       })
  //     }
  //   });
  // })
};

// parser.parseFileByPart(path+oldFileName,format,function(data,info){
//   var signals = uran.packs_process_100mhz(data,20,32,true)
//   var events = uran.neutron_event(signals,0.1,chiptype,info.)
//   signals = null
//   db.writeDocsToDb(collection,events,function(){
//     if(info.finished){
//       db.findDocsInDb(collection,{"chip":chiptype,"timestamp":events[0].timestamp},{},function(data){
//         writeCrToTxt(data)
//       });
//       var date = new Date(events[0].timestamp.getFullYear(),events[0].timestamp.getMonth(),events[0].timestamp.getDate())
//       db.findDocsInDb(collection,{"chip":chiptype,"timestamp":{"$gte":date}},{},function(data){
//         writeSpToTxt(data)
//       });
//       events = null
//     }
//   });
//   data = null; info = null;
// })

var writeSpToTxt = function(data){
  var prevMaxs = [0,0,0,0,0,0,0,0,0,0,0,0];
  var sp = [[],[],[],[],[],[],[],[],[],[],[],[]];
  var filename = "resources/txts/"+data[0].chiptype+"/sp/"+"SP__"+data[0].timestamp.getDate()+(data[0].timestamp.getMonth()+1)+
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
  var filename = "resources/txts/"+data[0].chiptype+"/cr/"+"CR__"+data[0].timestamp.getDate()+(data[0].timestamp.getMonth()+1)+
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
