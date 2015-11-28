System.thread(1000,function() {
	Uran.parse100Mhz("resources/shared/long.bin",function(data) {
		var a = [];		
		var r = {};
		for(var i in data) {
			r.time = data[i].time;
			r.ch1 = data[i].signal[0];
			r.ch2 = data[i].signal[1];
			r.ch3 = data[i].signal[2];
			r.ch4 = data[i].signal[3];
			r.ch5 = data[i].signal[4];
			r.ch6 = data[i].signal[5];
			r.ch7 = data[i].signal[6];
			r.ch8 = data[i].signal[7];
			r.ch9 = data[i].signal[8];
			r.ch10 = data[i].signal[9];
			r.ch11 = data[i].signal[10];
			r.ch12 = data[i].signal[11];
			a.push(r);			
		}
		//log(a);
		System.push(a);		
	});
});

