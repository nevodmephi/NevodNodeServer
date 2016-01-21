 
var getMinOfArray = function(array){
	return Math.min.apply(null,array);
};

var getMaxOfArray = function(array){
	return Math.max.apply(null,array);
};

/*
var findQs = function(signal,lvl,max){
	var offsets = []
	var isMinOffFound = false;
	var offset = {
		min:0,
		max:0
	}
	for(var i in signal){
		if(signal[i]>lvl && !isMinOffFound){
			offset.min = i;
			isMinOffFound = true;
		}
		if(signal[i]==max){
			isMinOffFound = false;
			offset.max = i;
			offsets.push(offset);
			break;
		}
	}
	var sm = 0;
	var s = 0;
	var min = signal[offsets[0].min]
	var imin = offsets[0].min, imax = offsets[0].max
	for(var i=imin;i<imax;i++){
		s += ((signal[i]-min)+(signal[i+1]-min))/2;
		sm += ((max-signal[i])+(max-signal[i+1]))/2;
	}
	return {sunder:s,sabove:sm};
	
}
*/

var findDerivative = function(signal,lvl,max){
	var f = [];
	var isMinXFound = false;
	for (var i=0;i<signal.length;i++){
		var sig = signal[i];
		if (sig>lvl) {
			if (!isMinXFound) {
				for (var j=10;j>0;j--){
					if(signal[i-j]==undefined){
						continue;
					}
			        f.push([i-j,signal[i-j]])
			    }
			}
			f.push([i,sig]);
			isMinXFound = true;
		}
		if(sig == max){
		    for (var j=1;j<=10;j++){
		        f.push([i+j,signal[i+j]])
		    }
			break;
		}
	}
	var der = [];
	for (var i=0;i<f.length;i++){
		var p = f[i];
		if (i == f.length-1){
			der.push(p[0],signal[p[0]+1]-p[1])
		} else {
			der.push([p[0],(f[i+1][1]-p[1])])
		}
	}
	return der; // WARN SAVING ARRAYS
};

var findDWH = function(ders){
	var x = [];
	var y = [];
	var max = 0;
	var maxi = 0;
	for(var i=0;i<ders.length;i++){
		if(ders[i][1]>max){
			max = ders[i][1]
			maxi = i
		}
	}
	var mini1 = 0;
	var mini2 = 0;
	for(var i = maxi;i>0;i--){
		if(ders[i][1]==0){
			mini1 = ders[i][0];
			break;
		}
	}
	for(var i = maxi;i<ders.length;i++){
		if(ders[i][1]==0){
			mini2 = ders[i][0];
			break;
		}
	}
	return [mini2,mini1,max];
};


System.ondata(function(data){
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
			derivative:findDerivative(data[i].signal,lvl,data[i].max),
			avg:data[i].avg
		};
		event.dwh = findDWH(event.derivative);
		event.derivative = [];
		events.push(event);
	}
	System.push(events);
});










