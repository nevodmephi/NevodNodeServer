var order = -1

var sortquery = {"time.0":order,"time.1":order,"time.2":order,
	"time.3":order,"time.4":order,
	"time.5":order,"time.6":order};

System.findInDb("test30112015",{},sortquery,function(data){
	System.push(data);
});



 




