System.ondata(function(data) {
	var h = [];
	for(var i in data) {
		for(var j in data[i]) {
			if(Array.isArray(data[i][j])) {
				h = h.concat(data[i][j]);
			}
		}
	}
	System.push([Stat.histogram(h,2000,2400,300)]);		
});

