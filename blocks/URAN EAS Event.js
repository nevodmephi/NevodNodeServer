

System.ondata(function(data){
	var events = [];
	var nlvl = 4;
	var ampllvl = 10;
	for(i in data){
		var master = 0;
		var event = {
			time:data[i].time,
			maxs:data[i].maxs
		}
		var tails = data[i].tails;
		var neutrons = [0,0,0,0,0,0,0,0,0,0,0,0];
		for (j in tails){
			var tail = tails[j];
			var xs = 0, xe = 0, isN = false;
			for(k in tail){
				var tampl = tail[k];
				
				if(tampl>=nlvl && !isN) {
					xs = k;
					isN = true;
				}
				if(tampl<nlvl && isN) {
					xe = k;
					isN = false;
					var dt = xe - xs;
					if(dt>=2){
						neutrons[j]++;
					}
				}
			}
		}
		event.neutrons = neutrons;
		var nsum = 0; //number of neutrons
		for (var j in neutrons){ nsum+=neutrons[j]; }
		event.nsum = nsum;
		var msum = 0; //sum of ampls
		var ndet = 0; //number of triggered detectors 
		for (var j in data[i].maxs) { 
			msum+=data[i].maxs[j] 
			if (data[i].maxs[j]>=ampllvl){ ndet++; }
		}
		master = ndet>=2?master+1:master;
		master = msum>=150?master+2:master;
		master = nsum>=5?master+4:master;
		event.master = master;
		events.push(event);
	}
	System.push(events);
});









