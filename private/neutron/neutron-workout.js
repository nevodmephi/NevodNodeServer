'use strict'

const nevod = require('nevod')
const parser = nevod.getUranParser()
const neutron_core = require('./neutron-core.js')
const logger = nevod.getLogger()
const fs = require('fs')

process.on('uncaughtException', function (err) {
	console.error((new Date).toUTCString() + ' pid('+process.pid+') uncaughtException:', err)
	process.exit(1)
})

const FRDISTRSIMPLELENGTH = 101;
const FRDISTRDWLENGTH = 500;

var options = JSON.parse(process.env.options__);
var tasks = options['tasks'],
		_filename =  options['file'],
		filetype = '100Mhz',
		settings = JSON.parse(process.env.settings),
		isSaveSigs = options['savesigs'],
		chiptype = options['chiptype'],
		collection = 'chip100_'+chiptype+"events",
		collectionStat = 'chip100_'+chiptype+"stat";

var mongo = null
nevod.initMongoClient(true,function(client){
	mongo = client
	mongo.getDBCollections({startsWith:collectionStat},function(cols){
		if(cols.length == 0){
			mongo.writeDocsToDb(collectionStat,[{"type":"countrates","crsN":[],"crsEL":[]},{"type":"spectrums","spsN":[],"spsEL":[]},{"type":"fronts","fnsSimple":[],"fnsDW":[]}],function(){
				workout.run()
			})
		} else {
			workout.run()
		}
	})
})

if(isSaveSigs){
	collection="waveforms_"+_filename.slice(0,_filename.length-4)
}

if(settings['bin-folder'][0]=='.'){
	settings['bin-folder'] = '.'+settings['bin-folder']
}
if(settings['save-folder'][0]=='.'){
	settings['save-folder'] = '.'+settings['save-folder']
}
if(settings['watching-folder'][0]=='.'){
	settings['watching-folder'] = '.'+settings['watching-folder']
}

neutron_core.init(settings['save-folder'],_filename,isSaveSigs)

var workout = {
	run:function(){
		var donePercent = 0;
		if(tasks.indexOf("showPercent")!=-1){
			setInterval(function(){
				process.stdout.write('{"type":"percent","value":"'+donePercent+'"};')
			},1000)
		}
		if(tasks.indexOf("parse")!=-1){
			collection+="_parser"
			parser.parseFileByPart(settings['bin-folder']+_filename,filetype,function(data,info){
				if (data === null || data === undefined || data.length == 0) {
					process.exit();
				}
				donePercent = info.status
				let signals = neutron_core.packs_process_100mhz(data,20,16,true)
				if(signals.length!=0){
					let events = neutron_core.neutron_event(signals,{
						chip:chiptype,
						charge_offset:110,
						nthreshold:0.6,
						ndwthreshold:110,
						timestamp:info.filestat.birthtime
					});
					signals = null;
					var timestamp = info.filestat.birthtime
					mongo.writeDocsToDb(collection,events,function(){
						if(info.finished){
							process.stdout.write('{"type":"finished"};')
							// onFinished(collection,chiptype,timestamp)
							process.exit()
						}
					});
					data = null;
				} else if (info.finished){
					signals = null
					process.stdout.write('{"type":"finished"};')
					process.exit()
					// onFinished(collection,chiptype,info.filestat.birthtime)
				}
			})
		} else if(tasks.indexOf('watch')!=-1){
			var newFileName = "?";
			var oldFileName = "??";
			var watcher = fs.watch(settings['watching-folder'])
			watcher.on('change',function(event,filename){
				var path = settings['watching-folder']
				if(event=="rename"){
					fs.readdir(path,function(err,files){
						if(files.indexOf(filename)==-1){
							return;
						}
						// if(filename.slice(0,3)!=chiptype.toString()){
						//   return;
						// }
						oldFileName = newFileName;
						newFileName = filename;
						if(oldFileName != "?" && oldFileName!=newFileName){
							console.log(chiptype+" parsing "+oldFileName)
							workout.parsingJob(path,oldFileName,1000)
						}
					})
				}
			});
		}
	},
	parsingJob:function(path,filename,spLength){
		var runNRates = [0,0,0,0,0,0,0,0,0,0,0,0];
		var runNDWRates = [0,0,0,0,0,0,0,0,0,0,0,0];
		var runNSRates = [0,0,0,0,0,0,0,0,0,0,0,0];
		var runELRates = [0,0,0,0,0,0,0,0,0,0,0,0];
		var runELDWRates = [0,0,0,0,0,0,0,0,0,0,0,0];
		var runELSRates = [0,0,0,0,0,0,0,0,0,0,0,0];
		var runNSP = neutron_core.createEmptySpArray(spLength);
		var runELSP = neutron_core.createEmptySpArray(spLength);
		var frontS = neutron_core.createEmptySpArray(FRDISTRSIMPLELENGTH);
		var frontDW = neutron_core.createEmptySpArray(FRDISTRDWLENGTH);
		var times = [];
		parser.parseFileByPart(path+filename,filetype,function(data,info){
			if (data === null || data === undefined || info === undefined) {
				return;
			}
			let signals = neutron_core.packs_process_100mhz(data,20,16,true);
			let timestamp = info.filestat.birthtime;
			let filenameCRN = settings['save-folder']+chiptype+'/cr/CRN_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat"
			let filenameCREL = settings['save-folder']+chiptype+'/cr/CREl_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat"
			let filenameSPN = settings['save-folder']+chiptype+'/sp/SPN_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat"
			let filenameSPEL = settings['save-folder']+chiptype+'/sp/SPEL_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat"
			let filenameFS = settings['save-folder']+chiptype+'/fr/FSIMPLE_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat"
			let filenameFDW = settings['save-folder']+chiptype+'/fr/FDW_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat"
			if(signals.length!=0){
				let events = neutron_core.neutron_event(signals,{
					chip:chiptype,
					charge_offset:110,
					nthreshold:0.6,
					ndwthreshold:110,
					timestamp:info.filestat.birthtime
				});
				for (var i = 0; i < events.length; i++){
					let event = events[i]
					if (event.neutron && event.neutronDW && event.timestamp !== undefined) {
						let str = event.timestamp.getDate() + "-" + (event.timestamp.getMonth()+1) + "-" + event.timestamp.getFullYear() + " " + event.timestamp.getHours() + ":" + event.timestamp.getMinutes() + "\t";
						let mseconds = event.time[0]*24*60*60*1000 + event.time[1]*60*60*1000 + event.time[2]*60*1000 + event.time[3]*1000 + event.time[4] + event.time[5]/1000.0 + event.time[6]/1000.0/100.0;
						str += mseconds + "\t" + event.channel + "\t" + event.time + "\n";
						times.push(str);
					}
				}
				signals = null;
				let rates = neutron_core.createCountRate(events,true);
				runNSP = neutron_core.createSpectrum(events,true,runNSP);
				runELSP = neutron_core.createSpectrum(events,false,runELSP)
				let fronts = neutron_core.createFrontsDistribution(events,frontS,frontDW)
				frontS = fronts[0], frontDW = fronts[1]
				fronts = null
				for(let i in runNRates){
					runNRates[i] += rates[0][i];
					runNDWRates[i] += rates[2][i];
					runNSRates[i] += rates[3][i];
					runELRates[i] += rates[1][i];
					runELDWRates[i] += rates[4][i];
					runELSRates[i] += rates[5][i];
				}
				mongo.writeDocsToDb(collection,events,function(){
					if(info.finished){
						times = times.reverse();
						for(var i = 0; i < times.length; i++){
							let str = times[i]
							neutron_core.txt.appendFile(settings['save-folder'] + chiptype + "/NEUTRONS_" + timestamp.getDate() + (timestamp.getMonth()+1) + timestamp.getFullYear() + ".dat", str);
						}
						console.log('parsed')
						fs.unlink(path+filename,function(err){
							if(err){
								console.error((new Date).toUTCString()+" error unlink file "+path+filename)
							}
						})
						neutron_core.txt.writeCountRateToFile(settings['save-folder']+chiptype+'/cr/CRNDW_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat",runNDWRates,timestamp,false);
						neutron_core.txt.writeCountRateToFile(settings['save-folder']+chiptype+'/cr/CRNS_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat",runNSRates,timestamp,false);
						neutron_core.txt.writeCountRateToFile(settings['save-folder']+chiptype+'/cr/CRELDW_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat",runELDWRates,timestamp,false);
						neutron_core.txt.writeCountRateToFile(settings['save-folder']+chiptype+'/cr/CRELS_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat",runELSRates,timestamp,false);
						workout.updateStatistic(filenameCREL,filenameCRN,filenameSPN,filenameSPEL,timestamp,runNRates,runELRates,runELSP,runNSP,spLength,filenameFS,filenameFDW,frontS,frontDW)
					}
				})
			} else if(info.finished){
				times = times.reverse();
				for(var i = 0; i < times.length; i++){
					let str = times[i]
					neutron_core.txt.appendFile(settings['save-folder'] + chiptype + "/NEUTRONS_" + timestamp.getDate() + (timestamp.getMonth()+1) + timestamp.getFullYear() + ".dat", str);
				}
				signals = null
				console.log('parsed')
				fs.unlink(path+filename,function(err){
					if(err){
						console.error((new Date).toUTCString()+" error unlink file "+path+filename)
					}
				})
				neutron_core.txt.writeCountRateToFile(settings['save-folder']+chiptype+'/cr/CRNDW_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat",runNDWRates,timestamp,false);
				neutron_core.txt.writeCountRateToFile(settings['save-folder']+chiptype+'/cr/CRNS_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat",runNSRates,timestamp,false);
				neutron_core.txt.writeCountRateToFile(settings['save-folder']+chiptype+'/cr/CRELDW_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat",runELDWRates,timestamp,false);
				neutron_core.txt.writeCountRateToFile(settings['save-folder']+chiptype+'/cr/CRELS_'+timestamp.getDate()+(timestamp.getMonth()+1)+timestamp.getFullYear()+".dat",runELSRates,timestamp,false);
				workout.updateStatistic(filenameCREL,filenameCRN,filenameSPN,filenameSPEL,timestamp,runNRates,runELRates,runELSP,runNSP,spLength,filenameFS,filenameFDW,frontS,frontDW)
			}
		})
	},
	updateStatistic:function(filenameCREL,filenameCRN,filenameSPN,filenameSPEL,timestamp,runNRates,runELRates,runELSP,runNSP,spLength,filenameFS,filenameFDW,fnsS,fnsDW){
		this.updateCountrates("crsN",timestamp,runNRates,filenameCRN)
		this.updateCountrates("crsEL",timestamp,runELRates,filenameCREL)
		let date = new Date(timestamp.getFullYear(),timestamp.getMonth(),timestamp.getDate())
		this.updateSpectrums("spectrums","spsN",spLength,date,runNSP,filenameSPN)
		this.updateSpectrums("spectrums","spsEL",spLength,date,runELSP,filenameSPEL)
		this.updateSpectrums("fronts","fnsSimple",FRDISTRSIMPLELENGTH,date,fnsS,filenameFS)
		this.updateSpectrums("fronts","fnsDW",FRDISTRDWLENGTH,date,fnsDW,filenameFDW)
	},
	updateCountrates:function(crType,timestamp,rates,file){
		let update = {$push:{}}
		update.$push[crType] = {"timestamp":timestamp,"rates":rates}
		mongo.updateCollection(collectionStat,{"type":"countrates"},update,false,function(){
			neutron_core.txt.writeCountRateToFile(file,rates,timestamp,false)
		})
	},
	updateSpectrums:function(spFamily,spType,spLength,date,spectrums,file){
		let fquery = {"type" : spFamily};
		fquery[spType] = {$elemMatch : {"date" : date}};
		let projection = {};
		projection[spType + ".$"] = 1;
		mongo.findDocsInDb(collectionStat,fquery,{},projection,function(data){
			if (data.length != 0) {
				spectrums = neutron_core.addTwoSpectrums(spectrums,data[0][spType][0].sp)
				let query = {"type":spFamily}
				query[spType+".date"] = date
				let update = {$set:{}}
				update.$set[spType+".$.sp"] = spectrums
				mongo.updateCollection(collectionStat,query,update,false,function(){
					neutron_core.txt.writeSpectrumToFile(file,spectrums,spLength)
				})
			} else {
				let query = {$push:{}}
				query.$push[spType] = {"date":date,"sp":spectrums}
				mongo.updateCollection(collectionStat,{"type":spFamily},query,false,function(){
					neutron_core.txt.writeSpectrumToFile(file,spectrums,spLength)
				})
			}
		})
	}
}
