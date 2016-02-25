

System.ondata(function(data){
	var events = Uran.neutron_event(data)
	System.push(events);
});
