





System.ondata(function(data){

	var fileName = "filename";
	var str ="Ch1\tCh2\tCh3\tCh4\tCh5\tCh6\tCh7\tCh8\tCh9\tCh10\tCh11\tCh12\n";
	
	var maxlength = 0;
	for(var i=0;i<12;i++){
		maxlength = maxlength<data[i].length ? data[i].length : maxlength
	}
	
	for (var i=0;i<maxlength;i++){
		for (var j=0;j<12;j++){
			if(data[j][i]!=undefined){
				str+=data[j][i][1]+"\t";
			} else {
				str+="-\t";
			}
			
		}
		str+="\n";
	}
	Shared.writeFile("resources/txts/"+"SP__"+fileName+".dat",str);

});