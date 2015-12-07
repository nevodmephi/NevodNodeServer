 
var getMinOfArray = function(array){
	return Math.min.apply(null,array);
};

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


System.ondata(function(data){
	var events = [];
	var lvl = 5;
	for(var i in data){
		var event = {
			channel:data[i].channel,
			time:data[i].time,
			max:data[i].max,
			min:getMinOfArray(data[i].signal),
			integrals:findQs(data[i].signal,lvl,data[i].max),
			avg:data[i].avg
		};
		events.push(event);
	}
	System.push(events);
});










