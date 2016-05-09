const nevod = require('nevod')

const parser = nevod.getUranParser() //parser
const u_math = nevod.getUranMathLib() //math functions
const txtsys = nevod.getTextSysLib() //save wraper and some uran txt save functions

nevod.runMemoryTest(function(mem){ //show memory usage
	process.stdout.write('{"type":"memory","value":"'+mem+'"}')
})

var db = null //working with db
nevod.initMongoClient(true,function(client){
	db = client
	workout.run()
})

var options = JSON.parse(process.env.options__)
var _tasks = options['tasks'],
		_filename =  options['file'],
		_filetype = options['type'],
		_settings = JSON.parse(process.env.settings),
		isSaveSigs = options['savesigs'],
		sigampl = options['sigampl'],
		masterSaving = options['master'],
		nsumSaving = options['nsum'];

if(_settings['bin-folder'][0]=='.'){
	_settings['bin-folder'] = '.'+_settings['bin-folder']
}
if(_settings['save-folder'][0]=='.'){
	_settings['save-folder'] = '.'+_settings['save-folder']
}

var donePercent = 0;
setInterval(function(){
	process.stdout.write('{"type":"percent","value":"'+donePercent+'"}')
},1000)

const easCore = require("./eas-core.js").init({
	saveFolder: _settings['save-folder'],
	binFolder: _settings['bin-folder'],
});

var isFirst = true;
var workout = {
	run:function(){
		parser.parseFileByPart(_settings['bin-folder']+_filename,_filetype,function(data,info){
			if(data==null || data==undefined || data.length==0){
				process.exit()
			}
			donePercent = info.status
			var signals = []
			if(_filetype=="200Mhz_notail"){
				var signals = parsedPackagesHandlingNoTail(data)
				if(signals.length!=0){
					var events = uranEASEventNoTail(signals)
					signals = null
					txtsys.saveZeroLines(_settings['save-folder']+'URANEASZlines_'+_filename.slice(0,_filename.length-4)+'.dat',events,false)
					savePrismaTypeTXTNoTail(events,_settings['save-folder'],_filename.slice(0,_filename.length-4))
					isFirst=false
					db.writeDocsToDb(_filename,events,function(){
						if(info.finished){
							process.stdout.write('{"type":"finished"}')
							process.exit()
						}
					})
				} else if(info.finished){
					signals = null;
					process.stdout.write('{"type":"finished"}')
					process.exit()
				}
			} else if(_filetype=="200Mhz_tail"){
				var signals = parsedPackagesHandling(data)
				if(signals.length!=0){
					var events = uranEASEvent(signals)
					signals = null
					txtsys.saveZeroLines(_settings['save-folder']+'URANEASZlines_'+_filename.slice(0,_filename.length-4)+'.dat',events,true)
					savePrismaTypeTXT(events,_settings['save-folder'],_filename.slice(0,_filename.length-4))
					isFirst = false
					db.writeDocsToDb(_filename,events,function(){
						if(info.finished){
							process.stdout.write('{"type":"finished"}')
							process.exit()
						}
					})
				} else if(info.finished){
					signals = null;
					process.stdout.write('{"type":"finished"}')
					process.exit()
				}
			}
		})
	},
}

// var savePrismaTypeTXT = function(data,path,name){
//   var str = ""
//   if(isFirst){
//     str = "N\tTime\tNSUM\tM\tA1\tN1\tA2\tN2\tA3\tN3\tA4\tN4\tA5\tN5\tA6\tN6\tA7\tN7\tA8\tN8\tA9\tN9\tA10\tN10\tA11\tN11\tA12\tN12\n";
//   }

// 	for (var i in data){
// 		var event = data[i]
//     str+=event.number+"\t"
// 		for (var j in event.time) { str+= event.time[j]+"."}
// 		str = str.substring(0, str.length - 1);
// 		str+="\t"+event.nsum+"\t"+event.master+"\t";
// 		for(var j=0; j<12; j++){
// 			str+=event.maxs[j].toFixed(2)+"\t"+event.neutrons[j]+"\t";
// 		}
// 		str+="\n";
// 	}
//   txtsys.appendFile(path+'URANEAS_'+name+'.dat',str)
// }

// var savePrismaTypeTXTNoTail = function(data,path,name){
//   var str = ""
//   if(isFirst){
//     str = "N\tTime\tM\tA1\tA2\tA3\tA4\tA5\tA6\tA7\tA8\tA9\tA10\tA11\tA12\n";
//   }

// 	for (var i in data){
// 		var event = data[i]
//     str+=event.number+"\t"
// 		for (var j in event.time) { str+= event.time[j]+"."}
// 		str = str.substring(0, str.length - 1);
// 		str+="\t"+event.master+"\t";
// 		for(var j=0; j<12; j++){
// 			str+=event.maxs[j].toFixed(2)+"\t";
// 		}
// 		str+="\n";
// 	}
//   txtsys.appendFile(path+'URANEAS_'+name+'.dat',str)
// }

// var uranEASEvent = function(data){
// 	var events = [];
// 	var nlvl = 10;
// 	var ampllvl = 10;
// 	for(i in data){
// 		var master = 0;
// 		var event = {
// 			time:data[i].time,
// 			maxs:data[i].maxs,
// 			number:data[i].number
// 		}
// 		var tails = data[i].tails;
// 		// console.log(tails[0].length)
// 		var neutrons = [0,0,0,0,0,0,0,0,0,0,0,0];
// 		for (j in tails){
// 			var tail = tails[j];
// 			// console.log(tail.length)
// 			var xs = 0, xe = 0, isN = false;
// 			// console.log(tail.length)
// 			for(k=0;k<tail.length-1;k++){
// 				// var ampl2behind = tail[k-2]
// 				// var ampl1behind = tail[k-1]
// 				var tampl = tail[k];
// 				if(tampl>=nlvl && tail[k+1]>=4){
// 					neutrons[j]++;
// 				}
// 				// var d1 = tampl - ampl1behind
// 				// var d2 = ampl1behind - ampl2behind
// 				// if(d1+d2>=nlvl){
// 				// 	neutrons[j]++;
// 				// }
// 				// if(tampl>=nlvl && !isN) {
// 				// 	xs = k;
// 				// 	isN = true;
// 				// }
// 				// if(tampl<nlvl && isN) {
// 				// 	xe = k;
// 				// 	isN = false;
// 				// 	var dt = xe - xs;
// 				// 	if(dt>=2){
// 				// 		neutrons[j]++;
// 				// 	}
// 				// }
// 			}
// 		}
// 		event.neutrons = neutrons;
// 		event.zero_lines = data[i].z_lines;
// 		var nsum = 0; //number of neutrons
// 		for (var j in neutrons){ nsum+=neutrons[j]; }
// 		event.nsum = nsum;
// 		var msum = 0; //sum of ampls
// 		var ndet = 0; //number of triggered detectors
// 		for (var j in data[i].maxs) {
// 			msum+=data[i].maxs[j]
// 			if (data[i].maxs[j]>=ampllvl){ ndet++; }
// 		}
// 		master = ndet>=2?master+1:master;
// 		master = msum>=150?master+2:master;
// 		master = nsum>=5?master+4:master;
// 		event.master = master;
// 		if(isSaveSigs && msum>=sigampl && nsum>=nsumSaving){
// 			if(masterSaving>7){
// 				txtsys.saveSignalsTXT(_settings['save-folder']+"SIG_"+_filename.slice(0,_filename.length-4)+".dat",data[i],false)
// 			} else if(master==masterSaving){
// 				txtsys.saveSignalsTXT(_settings['save-folder']+"SIG_"+_filename.slice(0,_filename.length-4)+".dat",data[i],false)
// 			}
// 		}
// 		events.push(event);
// 	}
// 	return events;
// }

// var uranEASEventNoTail = function(data){
// 	var events = []
// 	var ampllvl = 10;
// 	for(var i in data){
// 		var master = 0
// 		var event = {
// 			time:data[i].time,
// 			maxs:data[i].maxs,
// 			zero_lines:data[i].z_lines,
// 			number:data[i].number
// 		}
// 		var msum = 0 //sum of ampls
// 		var ndet = 0; //number of triggered detectors
// 		for (var j in data[i].maxs) {
// 			msum+=data[i].maxs[j]
// 			if (data[i].maxs[j]>=ampllvl){ ndet++; }
// 		}
// 		master = ndet>=2?master+1:master;
// 		master = msum>=150?master+2:master;
// 		event.master = master
// 		if(isSaveSigs && msum>=sigampl){
// 			if(masterSaving>7){
// 				txtsys.saveSignalsTXT(_settings['save-folder']+"SIG_"+_filename.slice(0,_filename.length-4)+".dat",data[i],false)
// 			} else if(master==masterSaving){
// 				txtsys.saveSignalsTXT(_settings['save-folder']+"SIG_"+_filename.slice(0,_filename.length-4)+".dat",data[i],false)
// 			}
// 		}
// 		events.push(event)
// 	}
// 	return events;
// }

// var parsedPackagesHandling = function(data){
// 	var signals = [];
// 	var zero_lines = [];
// 	for (var i in data){
// 		var pack = data[i];
// 		var zsigs = [], ztails = [], maxs = [];
// 		for (var j in pack.signal){
// 			var sig = pack.signal[j];
// 			// var tail = pack.tail[j].slice(500,pack.tail[j].length);
// 			var tail = pack.tail[j]
// 			var max = Math.round(u_math.max_of_array(sig));
// 			if(zero_lines.length<12){
// 				zero_lines.push(Math.round(u_math.avarage(sig.slice(50,200))));
// 			}
// 			var zsig = [];
// 			var ztail = [];
// 			for(var k in sig){
// 				zsig.push(sig[k]-zero_lines[j]);
// 			}
// 			sig = [];
// 			for (var k in tail){
// 				ztail.push(tail[k]-zero_lines[j]);
// 			}
// 			tail = [];
// 			zsigs.push(zsig);
// 			ztails.push(ztail);
// 			maxs.push(max-zero_lines[j]);
// 		}
// 		var signal = {
// 			signal:zsigs,
// 			time:pack.time,
// 			maxs:maxs,
// 			tails:ztails,
// 			z_lines:zero_lines,
// 			number:pack.number
// 		}
// 		signals.push(signal);
// 	}
// 	return signals
// }

// var parsedPackagesHandlingNoTail = function(data){
// 	var signals = []
// 	for(var i in data){
// 		var pack = data[i]
// 		var zsigs = [], maxs = [];
// 		var zero_lines = [];
// 		for (var j in pack.signal){
// 			var sig = pack.signal[j];
// 			var zline = sig.slice(20,80)
// 			zero_lines.push(Math.round(u_math.avarage(zline)));
// 			var max = Math.round(u_math.max_of_array(sig)-zero_lines[j]);
// 			var zsig = []
// 			for(var k in sig){
// 				zsig.push(sig[k]-zero_lines[j]);
// 			}
// 			zsigs.push(zsig)
// 			maxs.push(max)
// 		}
// 		var signal = {
// 			signal:zsigs,
// 			time:pack.time,
// 			maxs:maxs,
// 			z_lines:zero_lines,
// 			number:pack.number
// 		}
// 		signals.push(signal)
// 	}
// 	return signals
// }
