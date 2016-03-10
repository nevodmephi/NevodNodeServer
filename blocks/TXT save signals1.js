





System.ondata(function(data,info){
	log("saving")
	var fileName = "filename"
	var ch = 0
	var str =""
	var signals = [[],[],[],[],[],[],[],[],[],[],[],[]]
	for(var i=10800;i<13200;i++){
		var sig = data[i]
		log(i)
		signals[sig.channel]=signals[sig.channel].concat(sig.signal)
		// signals[sig.channel]
		// if(sig.channel == ch){
		// 	for(var i in sig.signal){
		// 		str+=sig.signal[i]+"\n"
		// 	}
		// }
		// signals[sig.channel].push(sig.signal);
	}
	data=null
	// log(signals)
	var max = 0
	var maxs = []
	// for(var i in signals){
	// 	maxs.push(Uran.u_math.max_of_array(signals[i]))
	// }
	// max = Uran.u_math.max_of_array(maxs)
	// log(maxs)
	// log(max)
	for (var i=0;i<500*2048;i++){
		for (var j in signals){
			if(signals[j][i]!=undefined){
				str+=signals[j][i]+""
			}else{
				str+="0"
			}
			str+="\t"
		}
		str+="\n"
	}
	log("jj")
	// log(signals.length)
	// for(var i in data){
	// 	var sig = data[i]
	// 	zlines[sig.channel].push(sig.signal);
	// }
	Uran.txt.appendFile("resources/txts/"+"SIG__"+fileName+"."+ch+".dat",str);
	// var maxl = 0
	// for(var i in signals){
	// 	maxl = signals[i].length>maxl?signals[i].length:maxl;
	// }

	// for(var i=0;i<maxl;i++){
	// 	for(var j in signals){
	// 		var sig = signals[j];
	// 		if(zl[i]){
	// 			str+=sig[i]+"\t";
	// 		} else {
	// 			str+="-\t";
	// 		}
	// 	}
	// 	str+="\n";
	// }
	// var info = g_info
	// var j = 0, a = 0;
	// for (var ii in data){
	// 	var sig = data[ii]
	// 	str+= "TIME:"+sig.time+" ";
	// 	var lengths = sig.signals[0].length
	// 	var lengtht = sig.tails[0].length
	//     for(var i=0;i<lengths;i++){
	// 	    str+="\t";
	// 	    for (var k = 0 ;k<12;k++){
	// 			str+=Math.floor(sig.signals[k][i])+"\t";
	// 	    }
	// 		str+="\n";
	//     }
	//      for(var i=0;i<lengtht;i++){
	// 	    str+="tail\t"
	// 	    for (var k = 0 ;k<12;k++){
	// 			str+=Math.floor(sig.tails[k][i])+"\t";
	// 	    }
	// 		str+="\n";
	//     }
	//     if(j>=4){
	// 	   	Shared.writeFile("resources/txts/"+"SIG__"+fileName+"."+info.packNum+"_"+a+".dat",str);
	// 	   	a++;
	// 	    str = ""
	// 	    j=0;
	//     } else {
	// 	    j++
	//     }
	// }
});
