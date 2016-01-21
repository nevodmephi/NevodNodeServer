


System.ondata(function(data){
// 	var str =""
	var str = "Time\tN\tNSUM\tM\tA1\tN1\tA2\tN2\tA3\tN3\tA4\tN4\tA5\tN5\tA6\tN6\tA7\tN7\tA8\tN8\tA9\tN9\tA10\tN10\tA11\tN11\tA12\tN12\n";
	
	data.reverse()
	for (var i in data){
		var event = data[i]
		for (var j in event.time) { str+= event.time[j]+"."}
		str = str.substring(0, str.length - 1);
		str+="\t"+i+"\t"+event.nsum+"\t"+event.master+"\t";
		for(var j=0; j<12; j++){
			str+=event.maxs[j].toFixed(2)+"\t"+event.neutrons[j]+"\t";
		}
		str+="\n";
	}
	
	Shared.writeFile("resources/txts/TailTail1.dat",str);

});




















