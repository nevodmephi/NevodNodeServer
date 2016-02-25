

System.thread(1000,function() {
	Parser.parse100Mhz("resources/shared/long.bin",function(data) {
		var signals = Uran.packs_process_100mhz(data,20,32,true)
		System.push(signals)
	})
});
