


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
	
/*
	
	var lengths = data[0].signals[0].length
	var lengtht = data[0].tails[0].length
//     log(length)
    str += data[0].time +"\t"+data[1].time+"\t"+data[2].time+"\n";
   
    for(var i=0;i<lengths;i++){
	    for (var j in data){
		    for (var k = 0 ;k<12;k++){
				str+=data[j].signals[k][i]+"\t";
	    	}
	    }
		str+="\n";
    }
     for(var i=0;i<lengtht;i++){
	    for (var j in data){
		    for (var k = 0 ;k<12;k++){
				str+=data[j].tails[k][i]+"\t";
	    	}
	    }
		str+="\n";
    }
    
*/
/*
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
*/
	
	Shared.writeFile("resources/txts/TailTail1.dat",str);

});




















