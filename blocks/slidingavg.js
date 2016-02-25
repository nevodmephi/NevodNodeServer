
var findSMA = function(signal,n){
  var sma = []
  for (var i=0;i<signal.length;i++){
    var sig = signal[i]
    var sum = sig
    var devide = 1
    for(var j=1;j<=n;j++){
      if(signal[i+j]!=undefined){
        sum+=signal[i+j]
        devide++
      }
      if(signal[i-j]!=undefined){
        sum+=signal[i-j]
        devide++
      }
    }
    var avg = sum/devide
    sma.push(avg)
  }
  return sma
}

var dwh = function(der,threshold){
  var info = [], y1 = 0, y2 = 0, isHillFound = false, hillMax = 0;
  for(var i=0;i<der.length;i++){
    var y = der[i];
    // log(y)
    if(y>=threshold && !isHillFound){
      y1 = i
      isHillFound = true
    }
    if(isHillFound){
      hillMax = hillMax < y ? y : hillMax
    }
    if(y<0 && isHillFound){
      y2 = i;
    //   log(y)
    //   log(y1)
      isHillFound = false;
      info.push({max:hillMax,width:y2-y1});
      y2 = 0, y1 = 0, hillMax = 0;
    }
  }
//   log(info)
  var maxDer = [], maxW = 0
  for(var i in info){
      if(maxW < info[i].width){
          maxW = info[i].width
          maxDer = [info[i].width,info[i].max]
      }
  }
  return maxW
}

var timeofgrowing = function(signal,max,tr){
  var y1 = 0, y2 = 0,isSignal = false
  for (var i=0;i<signal.length;i++){
    if(signal[i]>tr && !isSignal){
      y1 = i
      isSignal = true
    }
    if(signal[i]==max && isSignal){
      y2 = i
      break
    }
  }
  return y2-y1;
}

var findQs = function(array,max){
  var maxPos = 0;
  for(var i=0;i<array.length;i++){
    if(array[i]==max){
      maxPos = i
      break
    }
  }

  var val = maxPos<110 ? 0 : array[maxPos-110]
  val = val<0 ? 0 : val
  return[max,val]
}


System.ondata(function(data){
  var n = 32
	var smas = []
  var ders = []
  var dwhs = []
  var d = []
  var tgs = []
  var qs = []
	for(var i=0;i<data.length;i++){
    if(data[i].signal[0]>10){
      continue
    }
		var sig = data[i].signal
		smas.push(sig)
    // data[i].signal = sig
    var der = Uran.u_math.derivative(sig).slice(0,500)
    var dw = dwh(der,0.1)
    var tg = timeofgrowing(sig,data[i].max,10)
    var q = findQs(sig,data[i].max)
    data[i].max = Math.abs(Math.floor((q[1]/q[0])*100))
    if(dw[0]>120){
        d.push(data[i])
    }
    qs.push(q)
    tgs.push(tg)
    ders.push(der)
    dwhs.push(dw)
	}

	System.push(data)
	// System.push(Uran.neutron_event(data));
});
