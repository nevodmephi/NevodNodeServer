
var makeBezier = function(data){
	var bezier = [];
	for (var t=0;t<1;t+=0.05){
		var x = (1-t)*(1-t)*(1-t)*data[0][0] + 3*(1-t)*(1-t)*t*data[1][0] + 3*(1-t)*t*t*data[2][0] + t*t*t*data[3][0];
		var y = (1-t)*(1-t)*(1-t)*data[0][1] + 3*(1-t)*(1-t)*t*data[1][1] + 3*(1-t)*t*t*data[2][1] + t*t*t*data[3][1];
		bezier.push([x,y]);
	}
	return bezier;
};


System.ondata(function(data){
	
	var data = [[1,0],[1,5],[3,7],[5,7]];
	var b = makeBezier(data);
	System.push([data,b]);

});










