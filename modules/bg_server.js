var fs = require('fs'),
    uran = require("./uran.js"),
    db = require("./db.js"),
    path = require("path")


// var str = "hello alex\n ssccs";
// console.log(str)
// var b = new Buffer(str,"utf8")
// console.log(b)
// console.log(b.toString("utf8"))
// fs.appendFile("resources/index.uran",b,function(err){})


process.on("message",function(msg){
  switch (msg) {
    case "bgParsing-100":
      // watchForChanges("resources/shared/100mhz/","100Mhz","chip100","181")
      watchForChanges("e:\\БААК100\\100 181 плата с запуском нового файла по таймеру\\ADC_12CH\\bin\\Debug\\","100Mhz","chip100","181");
      watchForChanges("e:\\БААК100\\100 183 плата с запуском нового файла по таймеру\\ADC_12CH\\bin\\Debug\\","100Mhz","chip100","183")
      break;
    default:
    console.log("CP: unkown task")
    process.exit();
  }
});


var watchForChanges = function(path,format,collection,chiptype){
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
          uran.readFileByPart(path+oldFileName,format,function(data,info){
            doWork(data,collection,info,chiptype)
          })
        }
      })
    }
  });
};





var doWork = function(data,collection,info,chiptype){
  var null_mean_delta = 10; //порог при привышении которого считаем что есть сигнал
	var getMaxOfArray = function(array){
		return Math.max.apply(null,array);
	};
	var findAvg = function(array){
		var sum = 0.0;
		for (var i in array){
			sum+=array[i];
		}
		return sum/array.length;
	};
	var findNoise = function(array,zline){
		var noises = []
		for (var i in array){
			if(array[i]>zline){
				noises.push(array[i])
			}
		}
		return {
			maxNoise:getMaxOfArray(noises),
			avgNoise:findAvg(noises)
		}
	};
	var signals = [];
  for (var i in data){
    var pack = data[i];
    for (var j in pack.signal){
      var sig = pack.signal[j];
      var mean = findAvg(sig) //  среднее сигнала
      var max = getMaxOfArray(sig); // максимум амплитуды сигнала
      var delta = max - mean;
      if(delta>null_mean_delta){
        var zsig = sig.slice(10,150);
        var zline = findAvg(zsig);
        var noise = findNoise(zsig,zline)
        signals.push({
          channel:j,
          signal:sig,
          time:pack.time,
          max:max,
          avg:mean,
          zero_line:zline,
          noise:noise
        });
      }
    }
  }

  for(var i in signals){
    var sig = signals[i];
    sig.max -= sig.zero_line;
    for (var j in sig.signal){
      sig.signal[j]-=sig.zero_line;
    }
  }
  console.log(signals.length);
  doEvent(signals,collection,info,chiptype)
  signals = []
}


var doEvent = function(data,collection,info,chiptype){

  var getMinOfArray = function(array){
  	return Math.min.apply(null,array);
  };

  var getMaxOfArray = function(array){
  	return Math.max.apply(null,array);
  };
  var events = [];
	var lvl = 5;
	for(var i in data){
		var event = {
      chip:chiptype,
      timestamp:info.filestat.birthtime,
			channel:data[i].channel,
			time:data[i].time,
			max:data[i].max,
			zero_line:data[i].zero_line,
			noise:data[i].noise,
			min:getMinOfArray(data[i].signal),
// 			integrals:findQs(data[i].signal,lvl,data[i].max),
			// derivative:findDerivative(data[i].signal,lvl,data[i].max),
			avg:data[i].avg
		};
		// event.dwh = findDWH(event.derivative);
		// event.derivative = [];
		events.push(event);
	}
  db.writeDocsToDb(collection,events,function(){
    if(info.finished){
      db.findDocsInDb(collection,{"chip":chiptype,"timestamp":events[0].timestamp},{},function(data){
        writeCrToTxt(data)
      });
      var date = new Date(events[0].timestamp.getFullYear(),events[0].timestamp.getMonth(),events[0].timestamp.getDate())
      // console.log(date);
      // console.log(events[0].timestamp)
      db.findDocsInDb(collection,{"chip":chiptype,"timestamp":{"$gte":date}},{},function(data){
        // console.log(data)
        writeSpToTxt(data)
      });
    }
  });
}

var writeSpToTxt = function(data){
  var prevMaxs = [0,0,0,0,0,0,0,0,0,0,0,0];
  var sp = [[],[],[],[],[],[],[],[],[],[],[],[]];
  var filename = "e:\\БААК100\\100 "+data[0].chip+" плата с запуском нового файла по таймеру\\ADC_12CH\\txt\\sp\\"+"SP__"+data[0].timestamp.getDate()+(data[0].timestamp.getMonth()+1)+
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
        sp[channel][max][1]++;
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
  var filename = "e:\\БААК100\\100 "+data[0].chip+" плата с запуском нового файла по таймеру\\ADC_12CH\\txt\\cr\\"+"CR__"+data[0].timestamp.getDate()+(data[0].timestamp.getMonth()+1)+
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
