





System.ondata(function(data,info){
	var fileName = "filename"
	var str =""
	var info = g_info
	var j = 0, a = 0;
	for (var ii in data){
		var sig = data[ii]
		str+= "TIME:"+sig.time+" ";
		var lengths = sig.signals[0].length
		var lengtht = sig.tails[0].length   
	    for(var i=0;i<lengths;i++){
		    str+="\t";
		    for (var k = 0 ;k<12;k++){
				str+=Math.floor(sig.signals[k][i])+"\t";
		    }
			str+="\n";
	    }
	     for(var i=0;i<lengtht;i++){
		    str+="tail\t"
		    for (var k = 0 ;k<12;k++){
				str+=Math.floor(sig.tails[k][i])+"\t";
		    }
			str+="\n";
	    }
	    if(j>=4){
		   	Shared.writeFile("resources/txts/"+"SIG__"+fileName+"."+info.packNum+"_"+a+".dat",str);
		   	a++;
		    str = ""
		    j=0;
	    } else {
		    j++
	    }
	}
});