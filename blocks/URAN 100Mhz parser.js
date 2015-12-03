var null_mean_delta = 10;

var getMaxOfArray = function(array){
	return Math.max.apply(null,array);
};

System.thread(1000,function() {
	Uran.parse100Mhz("resources/shared/long.bin",function(data) {
		var signals = [];
		var zero_lines = [];
		for (var i in data){
			var pack = data[i];
			for (var j in pack.signal){
				var sig = pack.signal[j];
				var sum = 0
				for (var k in sig){
					sum+=sig[k];
				}
				var mean = sum/sig.length;
				var max = getMaxOfArray(sig);
				var delta = max - mean;
				if(delta>null_mean_delta){
					signals.push({
						channel:j,
						signal:sig,
						time:pack.time
					});
				} else if(zero_lines.length<12) {
					zero_lines.push(mean);
				}

			}
		}
		for(var i in signals){
			var sig = signals[i];
			for (var j in sig.signal){
				sig.signal[j]-=zero_lines[sig.channel];
			}
		}
		System.push(signals)		
	});
});

