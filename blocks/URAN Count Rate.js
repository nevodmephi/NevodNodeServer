

var convertToHours = function(time){
	var hours = time[0]*24+time[1]+time[2]/60.0+time[3]/3600.0+time[4]/(3600.0*1000)+time[5]/(3600.0*1000000)+time[6]/(3600.0*1000000000);
	return hours;
}

var convertToMins = function(time){
	var mins = time[0]*24*60+time[1]*60+time[2]+time[3]/60+time[4]/(60*1000)+time[5]/(60.0*1000000)+time[6]/(60.0*1000000000);
	return mins;
}


var getCountRatePerHour = function(data){
	var times = [convertToHours(data[0].time),convertToHours(data[data.length-1].time)];
	var rates = [0,0,0,0,0,0,0,0,0,0,0,0];
	var dt = times[1] - times[0];
	
	for (var i in data){
		var sig = data[i];
		var time = sig.time;
		rates[sig.channel]++;
	}
	for(var i=0;i<rates.length;i++){
		rates[i]/=dt;
	}
	return rates
};

var getCountRate = function(data){
	var times = [convertToMins(data[0].time),convertToMins(data[data.length-1].time)];
	var dt = times[1] - times[0];
	var rates = []
	for (var i=0;i<dt/5+1;i++){
		rates.push(0);
	}
	for (var i=0;i<data.length;i++){
		var sig = data[i];
		var time = convertToMins(sig.time)-times[0]
		var index = Math.round(time/5);
		if(time-index!=0){
			rates[index+1]++;
		} else {
			rates[index]++;
		}
	}
// 	log(rates);
	return rates;
}

System.ondata(function(data){
// 	var rh = getCountRatePerHour(data)
	var rates = getCountRate(data);
	System.push([rates]);
	
// 	log(rates.length);
})












