System.ondata(function(data) {
	var g_data = [];
	var chanals = [];
	var pack = 0;
	for (var i=0;i<data.length;i++){
		if(data[i].channel==0){
			g_data.push(data[i].signal);
			chanals.push(i);
		}
	}
	Online.quickView(g_data,chanals,["x","y"],"lines");
});

