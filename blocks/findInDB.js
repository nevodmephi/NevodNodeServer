var query = {"time.0":1,"time.1":1,"time.2":1,
	"time.3":1,"time.4":1,
	"time.5":1,"time.6":1};

System.findInDb("test30112015",{"channel":"0"},query,function(data){
	System.push(data);
});








