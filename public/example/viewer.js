
var data = [ 1,2,3,4,5,6 ];
var d2 = [[0, 3], [4, 8], [8, 5], [9, 13]];
var d3 = [[1, 4], [9, 1], [0, 3], [4, 10]];

$(document).ready(function(){
	plotList([data,d2,d3],["data","d2"],["number"],"bar");
});





var plotList = function(data,legendName,axesName,graphType){
	var plot_data = [];
	for (var i=0;i<data.length;i++) {
		var pd = data[i];
		if(!Array.isArray(pd[0])) {
			var newData = [];
			for (j=0;j<pd.length;j++){
				newData.push([j+1,pd[j]]);
			}
			plot_data.push({label:legendName[i],data:newData});
		} else { plot_data.push({label:legendName[i],data:pd}); }
	}
	data=[];
	var options = {};
	if (legendName.length!=0){
		options.legend = {
			show:true,
			labelBoxBorderColor:"black",
			position:"ne",
			backgroundColor: "gray",
			backgroundOpacity: 0.5,
			noColumns: 1
		};
	}
	if(axesName.length!=0){
		options.axisLabels = {show:true};
		options.xaxes = [{axisLabel:axesName[0]}];
		options.yaxes = [{axisLabel:axesName[1]}];
	}
	switch (graphType) {
		case "dots": 
			options.series = {points: {show: true,radius: 5}};
		case "dotsLines":
			options.series = {points: {show: true, radius: 5},lines: {show:true}};
		case "lines":
			options.series = {lines: {show:true}};
		case "bar":
			options.series = { bars: { show: true } };
		default: 
			options.series = {lines: {show:true}};
	}
	var plot = $.plot("#plot", plot_data, options);
};
