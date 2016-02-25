var aprox = function(data,power){
	var N = data.length, K = power;
	var a = [] //неизвестные коэффициенты полинома
	var b = [] //столбец свободных членов
	var x=[],y=[];
	var sums = [];//суммы степеней x,y при неизвестных коэффициентах полинома

	for(var i=0;i<N;i++){
		x.push(i+1);
		y.push(data[i]);
	}

	for(var i=0; i<K+1; i++){
       	a[i]=0;
	   	b[i]=0;
	   	for(var j=0; j<K+1; j++){
// 	   		sums[i][j] = 0;
			sums.push([]);
			sums[i].push(0);
       	}
   }

	for(var i=0;i<K+1;i++){
		for(var j=0;j<K+1;j++){
// 			sums.push([]);
// 			sums[i].push(0);
			sums[i][j]=0;
			for(var k = 0;k<N;k++){
				sums[i][j] += Math.pow(x[k],i+j);
			}
		}
	}

	for(var i=0;i<K+1;i++){
		for(var j=0;j<N;j++){
			b[i] += Math.pow(x[j],i)*y[j];
		}
	}

	var temp = 0;
	for(var i=0;i<K+1;i++){
		if(sums[i][i]==0){
			for(var j=0; j<K+1; j++){
				if(j==i) {continue;}
				if(sums[j][i] !=0 && sums[i][j]!=0){
					for(var k=0; k<K+1; k++){
						temp = sums[j][k];
						sums[j][k] = sums[i][k];
						sums[i][k] = temp;
			   		}
			   		temp = b[j];
			   		b[j] = b[i];
			   		b[i] = temp;
			   		break;
	       		}
	   		}
       }
	}

	for(var k=0; k<K+1; k++){
		for(var i=k+1; i<K+1; i++){
			if(sums[k][k]==0){
		       log("Solution is not exist.");
		       return;
		    }
		    var M = sums[i][k] / sums[k][k];
		    for(var j=k; j<K+1; j++){
			    sums[i][j] -= M * sums[k][j];
			}
			b[i] -= M*b[k];
		}
	}

	for(var i=(K+1)-1; i>=0; i--){
		var s = 0;
		for(var j = i; j<K+1; j++){
			s = s + sums[i][j]*a[j];
		}
		a[i] = (b[i] - s) / sums[i][i];
	}
// 	log(a);
	return a;
}


var funcs = function(sigs){
	var b = 10
	var results = [];
	for (var i in sigs){
		var sig = sigs[i];
		var a = aprox(sig,b);
		var g = [];
		for(var x=0;x<sig.length;x++){
			var y = a[0];
			for (var i =1; i<=b;i++){
				y += a[i]*Math.pow(x,i);
			}
		    g.push([x,y])
		}
		results.push(g);
	}
	return results;
}



System.ondata(function(data){

    log(data[0].signal.length)
    var f = [];
    var sigs = [];
    for (var i in data){
        if(data[i].channel == 1){
            sig=data[i].signal;
            sigs.push(sig);
            if(sigs.length == 3){
	            break;
            }
        }
    }
    f = funcs(sigs)
    log("done");

	System.push(f);
});
