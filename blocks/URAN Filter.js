
System.ondata(function(data){
	var eventsXY = [];
	for (var i in data){
		var event = data[i];
		eventsXY.push([event.integrals.sunder,event.integrals.sabove]);
	}
	System.push([eventsXY]);
});











