/**
 * @author Alexander Lakhonin (ixav1@icloud.com)
 * модуль процесса для работы с данными с установки УРАН, ШАЛ задача (платы БААК200)
 */

'use strict'

const nevod = require('nevod')

nevod.runMemoryTest((memory) => { process.stdout.write('{"type":"memory","value":"' + memory + '"}') });

/**
 * Конфигурация процесса, записваются в переменную окружения options__
 */
const options = JSON.parse(process.env.options__)
const tasks = options['tasks'],
		filename =  options['file'],
		filetype = options['type'],
		settings = JSON.parse(process.env.settings),
		isSaveSigs = options['savesigs'],
		sigampl = options['sigampl'],
		masterSaving = options['master'],
		nsumSaving = options['nsum'];

if(settings['bin-folder'][0]=='.'){
	settings['bin-folder'] = '.'+settings['bin-folder']
}
if(settings['save-folder'][0]=='.'){
	settings['save-folder'] = '.'+settings['save-folder']
}
/***/


class Workout {
	constructor() {
		this.parser = nevod.getUranParser();
		this.txtmodule = nevod.getTextSysLib();
		this.easCore = require("./eas-core.js").init({
			saveFolder: settings['save-folder'],
			binFolder: settings['bin-folder'],
		});
		this.donePercent = 0;
		this.isFirst = true;
		setInterval(() => { process.stdout.write('{"type":"percent","value":"' + this.donePercent + '"}'); }, 1000);
	}

	run() {
		let fullFilename = settings['bin-folder'] + filename;
		this.parser.parseFileByPart(fullFilename, filetype, (data, info) => {
			if (data === null || data === undefined || data.length === 0) {
				process.exit();
			}

			this.donePercent = info.status;

			if (filetype == "200Mhz_notail") {
				let signals = this.easCore.parsedPackagesHandlingNoTail(data);
				if (signals.length != 0) {
					let easEvents = this.easCore.uranEASEventNoTail(signals, filename, isSaveSigs, sigampl, masterSaving);
					signals = null;
					this.txtmodule.saveZeroLines(settings['save-folder'] + 'URANEASZlines_' + filename.slice(0,filename.length - 4) + '.dat', easEvents, false);
					this.easCore.savePrismaTypeTXTNoTail(filename.slice(0,filename.length - 4), easEvents, this.isFirst);
					this.isFirst = false;
					db.writeDocsToDb(filename, easEvents, () => {
						if (info.finished) {
							this.txtmodule.writeSpectrumToFile(settings["save-folder"] + "CHSP_" + filename + ".dat", this.easCore.chargeSp, this.easCore.chargeSp[0].length);
							process.stdout.write('{"type":"finished"}');
							process.exit();
						}
					});
				} else if (info.finished) {
					this.txtmodule.writeSpectrumToFile(settings["save-folder"] + "CHSP_" + filename + ".dat", this.easCore.chargeSp, this.easCore.chargeSp[0].length);
					process.stdout.write('{"type":"finished"}');
					process.exit();
				}
			} else if (filetype == "200Mhz_tail") {
				let signals = this.easCore.parsedPackagesHandling(data);
				if (signals.length != 0) {
					let easEvents = this.easCore.uranEASEvent(signals, filename, isSaveSigs, sigampl, nsumSaving, masterSaving);
					signals = null;
					this.txtmodule.saveZeroLines(settings['save-folder'] + 'URANEASZlines_' + filename.slice(0,filename.length - 4) + '.dat', easEvents, false);
					this.easCore.savePrismaTypeTXT(filename.slice(0,filename.length - 4), easEvents, this.isFirst);
					this.easCore.saveNeutronsInfo(filename.slice(0,filename.length - 4), easEvents, this.isFirst);
					this.isFirst = false;
					db.writeDocsToDb(filename, easEvents, () => {
						if (info.finished) {
							this.txtmodule.writeSpectrumToFile(settings["save-folder"] + "CHSP_" + filename + ".dat", this.easCore.chargeSp, this.easCore.chargeSp[0].length);
							this.txtmodule.writeSpectrumToFile(settings["save-folder"] + "NSP_" + filename + ".dat", this.easCore.neutronsSp, this.easCore.neutronsSp[0].length);
							process.stdout.write('{"type":"finished"}');
							process.exit();
						}
					});
				} else if (info.finished) {
					this.txtmodule.writeSpectrumToFile(settings["save-folder"] + "CHSP_" + filename + ".dat", this.easCore.chargeSp, this.easCore.chargeSp[0].length);
					this.txtmodule.writeSpectrumToFile(settings["save-folder"] + "NSP_" + filename + ".dat", this.easCore.neutronsSp, this.easCore.neutronsSp[0].length);
					process.stdout.write('{"type":"finished"}');
					process.exit();
				}
			}
		});
	}

}


const workout = new Workout();

let db = null //working with db
nevod.initMongoClient(true, (client) => {
	db = client;
	workout.run();
});

