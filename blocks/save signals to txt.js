var fileName = "filename"





System.ondata(function(data,info){
	var str =""
	var info = g_info
	var j = 0, a = 0;
	for (var ii in data){
		var sig = data[ii]
		str+= "TIME:"+sig.time+"\t";
		var lengths = sig.signals[0].length
		var lengtht = sig.tails[0].length
	//     log(length)
// 	    str += data[0].time +"\t"+data[1].time+"\t"+data[2].time+"\n";
	   
	    for(var i=0;i<lengths;i++){
// 		    for (var j in data){
		    for (var k = 0 ;k<12;k++){
				str+=sig.signals[k][i]+"\t";
		    }
// 		    }
			str+="\n";
	    }
	     for(var i=0;i<lengtht;i++){
// 		    for (var j in data){
		    for (var k = 0 ;k<12;k++){
				str+=sig.tails[k][i]+"\t";
		    }
// 		    }
			str+="\n";
	    }
	    
	    if(j>4){
		   	Shared.writeFile("resources/txts/"+"SIG__"+fileName+"."+a+"_"+info.packNum+".dat",str);
		   	a++;
		    str = ""
		    j=0;
	    }
	    j++;
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
    


	
	Shared.writeFile("resources/txts/"+fileName+"/.dat",str);
*/

});