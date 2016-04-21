//module for uran's data processing

/*list of functions:
  packs_process_100mhz;
  neutron_event;
  createEmptySpArray;
  addTwoSpectrums;
  createSpectrum;
  createCountRate;
*/
var nevod = require('nevod')

_txtsavefolder = null
_filename = "unkown"
isSaveSigs = false

module.exports = {
	u_math:nevod.getUranMathLib(),
	txt:nevod.getTextSysLib(),
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
			console.error((new Date).toUTCString()+" URAN packs process 100mhz error: " + e)
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
					channel:data[i].channel,
					chiptype:chip,
					time:data[i].time,
					maximum:data[i].max,
					zero_line:data[i].zero_line,
					minimum:this.u_math.min_of_array(data[i].signal),
					avg:data[i].avg,
					dw:this.u_math.derivativeWidth(this.u_math.derivative(data[i].signal.slice(400,1500)),dwtreshold),
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
			console.error((new Date).toUTCString()+" URAN neutron event error: " + e)
			return false
		}
	},
	//создает пустой (заполненный нулями) массив спектров
	createEmptySpArray:function(length){
		var sp = [[],[],[],[],[],[],[],[],[],[],[],[]];
		for(var i=0 ;i<length;i++){
			for(var j=0;j<12;j++){
				sp[j].push(0)
			}
		}
		return sp
	},
	//суммирует два спектра, спектры должны быть одинаковой длины
	addTwoSpectrums:function(sp1,sp2){
		for (var i in sp1[0]){
			for(var j=0 ;j<12; j++){
				sp1[j][i]+=sp2[j][i]
			}
		}
		return sp1
	},
	//функция создает спектр апмлитуд для событий
	createSpectrum:function(data,neutronsOnly,spArray,spArrayLength){
		try{
			if(spArray == undefined){
				spArrayLength = spArrayLength == undefined ? 1000 : spArrayLength
				spArray = this.createEmptySpArray(1000)
			}
			for(var i in data){
				if(spArray[0].length>data[i].maximum.toFixed(0)){
					if(neutronsOnly && data[i].neutron && data[i].neutronDW){
						spArray[data[i].channel][data[i].maximum.toFixed(0)]++
					} else if(!neutronsOnly && (!data[i].neutron || !data[i].neutronDW)){
						spArray[data[i].channel][data[i].maximum.toFixed(0)]++
					}
				}
			}
			return spArray
		} catch(e) {
			console.error((new Date).toUTCString()+" URAN createSpectrum: "+e)
			return false
		}
	},
	createCountRate:function(data,devide){
		try {
			if(devide){
				var nRates = [0,0,0,0,0,0,0,0,0,0,0,0]
				var elRates = [0,0,0,0,0,0,0,0,0,0,0,0]
				for(var i in data){
					if(data[i].neutron && data[i].neutronDW){
						nRates[data[i].channel]++
					} else {
						elRates[data[i].channel]++
					}
				}
				return [nRates,elRates]
			} else {
				var rates = [0,0,0,0,0,0,0,0,0,0,0,0]
				for (var i in data){
					rates[data[i].channel]++;
				}
				return rates
			}
		} catch (e) {
			console.error((new Date).toUTCString()+" URAN createCountRate: "+e)
			return false
		}
	},
	createFrontsDistribution:function(data,fnsS,fnsDW){
		try {
			for(var i in data){
				if(fnsS[data[i].channel][(data[i].charge_ratio*100).toFixed(0)]!=undefined){
					fnsS[data[i].channel][(data[i].charge_ratio*100).toFixed(0)]++
				}
				if(fnsDW[data[i].channel][data[i].dw.toFixed(0)]!=undefined){
					fnsDW[data[i].channel][data[i].dw.toFixed(0)]++
				}
			}
			return [fnsS,fnsDW]
		} catch(e){
			console.error((new Date).toUTCString()+" URAN createFrontsDistribution: "+e)
		}
	}
}
