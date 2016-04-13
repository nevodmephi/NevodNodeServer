//module for uran's data processing

/*list of functions:
  packs_process_100mhz;
  neutron_event;
  createSpectrum;
  createCountRate;
*/
_txtsavefolder = null
_filename = "unkown"
isSaveSigs = false

module.exports = {
  u_math:require("../uran_math.js"),
  txt:require("../textsys.js"),
  init:function(savefolder,filename,savesigs){
    _filename = filename == undefined ? "unkown" : filename
    _txtsavefolder = savefolder == undefined ? null : savefolder
    isSaveSigs = savesigs == undefined ? false : savesigs
  },
  // функция для обработки распарсенных пакетов с платы 100Mhz -> массив осцилограмм сигналов с данными
  packs_process_100mhz:function(packages,threshold,sma_power,isUsingSMA){
    threshold = threshold == undefined ? 15:threshold
    sma_power = sma_power == undefined ? 16:sma_power
    isUsingSMA = isUsingSMA == undefined ? true:isUsingSMA
    var signals = []
    try {
      for (var i in packages){
  			var pack = packages[i];
        var z_sigs=[]
  			for (var j in pack.signal){
  				var sig = pack.signal[j]
  				var max = this.u_math.max_of_array(sig);
          var zsig = sig.slice(50,300);
          var zline = this.u_math.avarage(zsig);
  				if(max>threshold+zline){
            sig = isUsingSMA ? this.u_math.simple_moving_avarage(pack.signal[j],sma_power) : pack.signal[j]
            max = this.u_math.max_of_array(sig);
            var mean = this.u_math.avarage(sig)
  					signals.push({channel:j,signal:sig,time:pack.time,max:max,avg:mean,zero_line:zline});
  				}
  			}
        if(isSaveSigs){
          if(_txtsavefolder!=null){
            this.txt.saveSignalsTXT(_txtsavefolder+"SIG_"+_filename.slice(0,_filename.length-4)+".dat",pack,false)
          }
        }
  		}
  		for(var i in signals){
  			var sig = signals[i];
  			sig.max -= sig.zero_line;
  			for (var j in sig.signal){
  				sig.signal[j] -= sig.zero_line;
  			}
  		}
  		return signals
    } catch(e) {
      console.log("URAN packs process 100mhz error: " + e)
      return false
    }
  },
  // функция для обработки массив осцилограмм сигналов с данными c платы 100Mhz -> массив событий
  neutron_event:function(data,dwtreshold,threshold,chip,timestamp){
    dwtreshold = dwtreshold == undefined ? 0.1 : dwtreshold
    chip = chip == undefined ? "unknown" : chip
    threshold = threshold == undefined ? 0.6 : threshold
    var events = []
    try {
      for(var i in data){
    		var event = {
          zero_lines:data[i].zero_lines,
    			channel:data[i].channel,
          chiptype:chip,
    			time:data[i].time,
    			max:data[i].max,
    			zero_line:data[i].zero_line,
    			min:this.u_math.min_of_array(data[i].signal),
    			avg:data[i].avg,
          dw:this.u_math.derivativeWidth(this.u_math.derivative(data[i].signal.slice(0,1200)),dwtreshold),
          charges: this.u_math.charge_ratio(data[i].signal,110,data[i].max)
    		};
        if(isSaveSigs){
          event.signal = data[i].signal
        }
        event.charge_ratio = event.charges[1]/event.charges[0]
        event.neutron = event.charge_ratio>threshold ? true : false
        event.neutronDW = event.dw>110?true:false
        if(timestamp != undefined){
          event.timestamp = timestamp
        }
    		events.push(event);
    	}
      return events
    } catch(e) {
      console.log("URAN neutron event error: " + e)
      return false
    }
  },
  //функция создает спектр апмлитуд для событий
  createSpectrum:function(data){
    try{
      var prevMaxs = [0,0,0,0,0,0,0,0,0,0,0,0];
      var sp = [[],[],[],[],[],[],[],[],[],[],[],[]];
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
      };
      for (var i in data){
        var event = data[i];
        for(var ch = 0; ch<12; ch++){
          createSp(event,ch);
        }
      }
      return sp
    } catch(e) {
      console.log("URAN createSpectrum: "+e)
      return false
    }
  },
  createCountRate:function(data){
    try {
      var rates = [0,0,0,0,0,0,0,0,0,0,0,0]
      for (var i in data){
        rates[data[i].channel]++;
      }
      return rates
    } catch (e) {
      console.log("URAN createCountRate: "+e)
      return false
    }
  }
}
