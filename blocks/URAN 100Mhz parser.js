var null_mean_delta = 10;

var getMaxOfArray = function(array){
	return Math.max.apply(null,array);
};

var signals = [];
var zero_lines = [];


System.thread(1000,function() {
	Uran.parse100Mhz("resources/shared/long.bin",function(data,info) {
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
						time:pack.time,
						max:max,
						avg:mean
					});
				} else if(zero_lines.length<12) {
					zero_lines.push(mean);
				}

			}
		}
		for(var i in signals){
			var sig = signals[i];
			sig.max -= zero_lines[sig.channel];
			for (var j in sig.signal){
				sig.signal[j]-=zero_lines[sig.channel];
			}
		}
		log(signals.length);
		System.push(signals)
		signals = []	
	});
});










