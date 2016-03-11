var g_info = {}

System.thread(1000,function() {
	var getMaxOfArray = function(array){
		return Math.max.apply(null,array);
	};
	
	var signals = [];
	var zero_lines = [];
	Uran.parse200MhzTail("resources/shared/tail/TailTail1.bin",function(data,info) {
		for (var i in data){
			var pack = data[i];
			var zsigs = [], ztails = [], maxs = [];
			for (var j in pack.signal){
				var sig = pack.signal[j];
				var tail = pack.tail[j].slice(500,pack.tail[j].length);
				var max = getMaxOfArray(sig);
				if(zero_lines.length<12){
					var sum = 0
					for (var k in tail){
						sum+=tail[k];
					}
					var mean = sum/tail.length;
					zero_lines.push(mean);
				}
				var zsig = [];
				var ztail = [];
				for(var k in sig){
					zsig.push(sig[k]-zero_lines[j]);
				}
				sig = [];
				for (var k in tail){
					ztail.push(tail[k]-zero_lines[j]);
				}
				tail = [];
				zsigs.push(zsig);
				ztails.push(ztail);
				maxs.push(max-zero_lines[j]);
			}
			var signal = {
				signals:zsigs,
				time:pack.time,
				maxs:maxs,
				tails:ztails	
			}
			signals.push(signal);
		}
		log(signals.length);
		g_info = info;
		System.push(signals)
		signals = []	
	});
});










