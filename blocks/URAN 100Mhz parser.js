

System.thread(1000,function() {
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
	var signals = []; //события
	
	Uran.parse100Mhz("resources/shared/long.bin",function(data,info) {
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
		log(signals.length);
		System.push(signals)
		signals = []	
	});
});










