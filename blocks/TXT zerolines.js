

System.ondata(function(data){

	var fileName = "filename";
	var str ="maxnoise:\t";
	
	var mnoises = [0,0,0,0,0,0,0,0,0,0,0,0]
	var countnoises = [0,0,0,0,0,0,0,0,0,0,0,0]
	var zero_lines = [0,0,0,0,0,0,0,0,0,0,0,0]
	var countzero_lines = [0,0,0,0,0,0,0,0,0,0,0,0]
	
	
	for(var i in data){
		var event = data[i]
		mnoises[event.channel]+=event.noise.maxNoise;
		countnoises[event.channel]++;
		zero_lines[event.channel]+=event.zero_line;
		countzero_lines[event.channel]++;
	}
	for(var i=0;i<12;i++){
		mnoises[i]/=countnoises[i]
		zero_lines[i]/=countzero_lines[i]
	}
	for(var i=0;i<12;i++){
		str+=mnoises[i]+"\t"
	}
	str+="\nzero line:\t"
	for(var i=0;i<12;i++){
		str+=zero_lines[i]+"\t"
	}
	Shared.writeFile("resources/txts/"+"NOISE__"+fileName+".dat",str);

});