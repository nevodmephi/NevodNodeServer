var prevMaxs = [0,0,0,0,0,0,0,0,0,0,0,0];
var sp = [[],[],[],[],[],[],[],[],[],[],[],[]];


var createSp = function(event,channel){
	if (event.channel == channel){
	    var max = Number((event.max).toFixed(0));
	    max = max < 0 ? -max : max;
	    var isNewMax = false
	    if(max>prevMaxs[channel]){
        isNewMax = true
        prevMaxs[channel] = max
	    }
	    if(sp[channel].length == 0){
	    	for (var j=0;j<=max;j++){
		    	sp[channel].push([j,0]);
		    }
	    } else if(isNewMax){
	        for(var j=sp[channel].length;j<=max;j++){
	            sp[channel].push([j,0])
	        }
	    }
	    sp[channel][max][1]++;
	}
};


System.ondata(function(data){
    log("sp_start")
    
	for (var i in data){
		var event = data[i];
		var r = event.integrals.sabove/event.integrals.sunder;
		if(r >= 0.5){
			for(var ch = 0; ch<12; ch++){
				createSp(event,ch);
			}
		}
	}
	System.push(sp);
	log("sp_end")
});












