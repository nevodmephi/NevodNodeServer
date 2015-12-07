System.ondata(function(data){
	var signals = [];
	for (var i=0;i<data.length;i++){
		if(data[i].channel==0){
			signals.push(data[i].signal);
		}
	}
	System.push(signals);
});