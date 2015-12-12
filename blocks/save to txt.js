


System.ondata(function(data){
	var str = "";
	var ch =0;
	for (var i in data){
		var pack = data[i];
		if(pack.channel == ch){
			for (var j in pack.signal){
				var sig = pack.signal[j];
				str += sig+"\n";
			}
		}
	}
	Shared.writeFile("resources/txts/test.txt",str);
/*
	for (var i = -1; i<2048; i++){
		for(var j in data){
			var pack = data[j];
			if (pack.channel == ch && i== -1){
				str += pack.channel+"	";
			} else if(pack.channel == ch){
				str += pack.signal[i]+"	";
			}		
		}
		str+="\n";
		log("wrote")
		Shared.writeFile("resources/txts/test.txt",str);
		str = "";
	}
*/
});




















