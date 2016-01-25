var fs = require('fs'),
    uran = require("./uran.js"),
    db = require("./db.js");

process.on("message",function(msg){
  switch (msg) {
    case "bgParsing-100":
      watchForChanges("resources/shared/100mhz/");
      break;
    default:
    console.log("CP: unkown task")
    process.exit();
  }
});


var collection= "multitest"

var watchForChanges = function(path){
  var newFileName = "?";
  var oldFileName = "??";
  var watcher = fs.watch(path)
  watcher.on('change',function(event,filename){
    if(event=="rename"){
      fs.stat(path+filename,function(err,stats){
        if(err){
          console.log(err);
          return;
        }
        console.log(stats);
      })
      fs.readdir(path,function(err,files){
        for (var i in files){
          var file = files[i]

          fs.stat(path+file,function(err,stats){
            console.log(file+":")
            console.log(stats);
          });
        }
        // if(files.indexOf(filename)==-1){
        //   return;
        // }
        // oldFileName = newFileName;
        // newFileName = filename;
        // if(oldFileName != "?" && oldFileName!=newFileName){
        //   console.log("parse "+oldFileName)
        //   uran.readWholeFileSync(path+oldFileName,"100Mhz",function(data){
        //     doWork(data)
        //   })
        // }
      })
    }
  });
};





var doWork = function(data){
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
  doEvent(signals)
  signals = []
}


var doEvent = function(data){

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
  db.writeDocsToDb(collection,events);
}
