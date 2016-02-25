System.ondata(function(data){
	var signals = [];
	for (var i=0;i<data.length;i++){
		if(data[i].channel==0){
			signals.push(data[i].signal);
		}
		if(signals.length == 3){
			break
		}
	}
	Online.quickView(signals,[],["x","y"],"lines");
});
