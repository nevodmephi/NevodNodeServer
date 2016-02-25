





System.ondata(function(data,info){
	var fileName = "filename"
	var ch = 0
	var str =""
	var signals = [[],[],[],[],[],[],[],[],[],[],[],[]]
	for(var i in data){
		var sig = data[i]
		if(sig.channel == ch){
			for(var i in sig.signal){
				str+=sig.signal[i]+"\n"
			}
		}
		signals[sig.channel].push(sig.signal);
	}
	// for(var i in data){
	// 	var sig = data[i]
	// 	zlines[sig.channel].push(sig.signal);
	// }
	Shared.writeFile("resources/txts/"+"SIG__"+fileName+"."+ch+".dat",str);
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