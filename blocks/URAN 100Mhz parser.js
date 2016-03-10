

System.thread(1000,function() {
	d = []
	Parser.parse100Mhz("resources/shared/test_t4.bin",function(data) {
		var signals = Uran.packs_process_100mhz(data,20,32,false)
// 		log("done")
		d=d.concat(signals)
// 		log(data.length)
// 		System.push(signals)
	})
	log(d.length)
	System.push(d)
});
