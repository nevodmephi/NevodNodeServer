/**
 * @author Alexander Lakhonin (ixav1@icloud.com)
 * модуль для обработки данных посутпающих с установки УРАН, ШАЛ задача (платы БААК200)
 */

'use strict'

const nevod = require('nevod');

const NEUTRON_THRESHOLD = 5; // порог для нейтронов в хвосте
const CHARGE_THRESHOLD = 10; //порог для электромагнитной компоненты

/**
 * константы влияющие на мастер
 * @type {Number}
 */
const NUM_OF_DETECTORS = 2; //количество сработавших детекторов от которого меняется мастер
const SUM_OF_AMPLS = 150; //сумма амплитуд заряженых частих которая влияет на мастер
const NUM_OF_NEUTRONS = 5; //количество нейронов в одном детекторе, увеличивает мастер
/***/

const ZERO_LINE_SLICE_BEGIN = 50; //начало среза нулевой линии
const ZERO_LINE_SLICE_END = 200; //конец среза нулевой линии
const TAIL_BEGIN_SLICE = 500; //длина удаляемого участка хвоста из обработки (при сохранении сигналов в файл он сохраняется в файл)
const ZERO_LINE_SLICE_BEGIN_NT = 20; //начало среза нулевой линии без хвоста
const ZERO_LINE_SLICE_END_NT = 80; //конец среза нулевой линии без хвоста

const CHARGE_SP_LENGTH = 1000; //длина спектра для электромагнитной компоненты
const NEUTRONS_SP_DEVIDE_FACTOR = 500; //окно построения спектров для нейтронов


/**
 * инициализация модуля
 */
module.exports.init = function(options) {
	return new EasCore(options.saveFolder,options.binFolder);
}

/**
 * класс для работы с данными с установки УРАН, задача ШАЛ
 */
class EasCore {
	/**
	 * конструктор класса EasCore
	 */
	constructor(save_folder, bin_folder){
		this.save_folder = save_folder;
		this.bin_folder = bin_folder;
		this.txtsys = nevod.getTextSysLib();
		this.u_math = nevod.getUranMathLib();

		this.charge_sp = this.u_math.createEmptySpArray(CHARGE_SP_LENGTH);
		let nsp_length = Math.floor((20000 - TAIL_BEGIN_SLICE)/NEUTRONS_SP_DEVIDE_FACTOR);
		this.neutrons_sp = this.u_math.createEmptySpArray(nsp_length);
	}

	/**
	 * геттеры
	 */
	get saveFolder() {
		return this.save_folder;
	}

	get binFolder() {
		return this.bin_folder;
	}

	get chargeSp() {
		return this.charge_sp;
	}

	get neutronsSp() {
		return this.neutrons_sp;
	}

	/**
	 * сеттеры
	 */
	set saveFolder(newValue) {
		this.save_folder = newValue;
	}

	set binFolder(newValue) {
		this.bin_folder = newValue;
	}

	//основные алгоритмические функции для работы с данными
	
	/**
	 * Сохраняет в текстовый файл, данные по работе установки, тип файла как в ПРИЗМЕ
	 * @param  {String}  name    имя файла, куда сохраняются данные
	 * @param  {Array}  data    массив обработанных данных, которые необходимо сохранить
	 * @param  {Boolean} isFirst первое ли событие
	 * @param  {String}  path    путь
	 */
	savePrismaTypeTXTNoTail(name, data, isFirst, path) {
		path = path === undefined ? this.save_folder : path;
		let str = "";

		if (data === null) {
			console.error((new Date).toUTCString() + " EasCore savePrismaTypeTXTNoTail error: data is null");
			return;
		}

		if (isFirst) {
			str = "N\tTime\tM\tA1\tA2\tA3\tA4\tA5\tA6\tA7\tA8\tA9\tA10\tA11\tA12\n";
		}

		for (let i = 0; i < data.length; i++) {
			let event = data[i];
			str += event.number + "\t";

			for (let j = 0; j < event.time.length; j++) { 
				str += event.time[j] + ".";
			}

			str = str.substring(0, str.length - 1);
			str += "\t" + event.master + "\t";

			for (let j = 0; j < 12; j++) {
				str += event.maxs[j].toFixed(2) + "\t";
			}

			str += "\n";
		}

		this.txtsys.appendFile(path + 'URANEASnt_' + name + '.dat', str);
	}

	saveNeutronsInfo(name, data, isFirst, path) {
		path = path === undefined ? this.save_folder : path;

		if (data === null) {
			console.error((new Date).toUTCString() + " EasCore saveNeutronsInfo error: data is null");
			return;
		}

		let str = "";

		if (isFirst) {
			str = "N\tTime\tAmplN1\tPosN1\tAmplN2\tPosN2\tAmplN3\tPosN3\tAmplN4\tPosN4\tAmplN5\tPosN5\tAmplN6\tPosN6\tAmplN7\tPosN7\tAmplN8\tPosN8\tAmplN9\tPosN9\tAmplN10\tPosN10\tAmplN11\tPosN11\tAmplN12\tPosN12\n";
		}

		for (let i = 0; i < data.length; i++) {
			let event = data[i];

			let length = this.u_math.max_of_array(event.neutrons);

			for (let j = 0; j < length; j++) {
				str += event.number + "\t";

				for (let j = 0; j < event.time.length; j++) { 
					str += event.time[j] + "."; 
				}

				str = str.substring(0, str.length - 1);
				str += "\t";


				for (let k = 0; k < 12; k++) {
					if (event.neutronsAmpl[k][j] !== undefined) {
						str += event.neutronsAmpl[k][j];
					} else {
						str += "-";
					}

					if (event.neutronsPos[k][j] !== undefined) {
						str += "\t" + event.neutronsPos[k][j] + "\t";
					} else {
						str += "\t-\t";
					}
				}
				str += "\n";
			}

			str += "\n";
		}

		this.txtsys.appendFile(path + "URAN_NEUTRONS_INFO_" + name + ".dat", str);
	}

	savePrismaTypeTXT(name, data, isFirst, path) {
		path = path === undefined ? this.save_folder : path;

		if (data === null) {
			console.error((new Date).toUTCString() + " EasCore savePrismaTypeTXT error: data is null");
			return;
		}

		let str = "";

		if (isFirst) {
			str = "N\tTime\tNSUM\tM\tA1\tN1\tA2\tN2\tA3\tN3\tA4\tN4\tA5\tN5\tA6\tN6\tA7\tN7\tA8\tN8\tA9\tN9\tA10\tN10\tA11\tN11\tA12\tN12\n";
		}

		for (let i = 0; i < data.length; i++) {
			let event = data[i];
			str += event.number + "\t";

			for (let j = 0; j < event.time.length; j++) { 
				str += event.time[j] + "."; 
			}

			str = str.substring(0, str.length - 1);
			str += "\t" + event.nsum + "\t" + event.master + "\t";

			for (let j = 0; j < 12; j++) {
				str += event.maxs[j].toFixed(2) + "\t" + event.neutrons[j] + "\t";
			}

			str += "\n";
		}

		this.txtsys.appendFile(path + 'URANEAS_' + name + '.dat', str);
	}

	uranEASEvent(data, filename, isSaveSigs, sigampl, nsumSaving, masterSaving) {
		let events = [];
		let nlvl = NEUTRON_THRESHOLD;
		let ampllvl = CHARGE_THRESHOLD;

		for (let i = 0; i < data.length; i++) {
			let master = 0;

			let event = {
				time:data[i].time,
				maxs:data[i].maxs,
				number:data[i].number
			};

			let tails = data[i].tails;
			let neutrons = [0,0,0,0,0,0,0,0,0,0,0,0];
			let neutronsAmpl = [[],[],[],[],[],[],[],[],[],[],[],[]];
			let neutronsPos = [[],[],[],[],[],[],[],[],[],[],[],[]];

			for (let j = 0; j < tails.length; j++) {
				let tail = tails[j].slice(TAIL_BEGIN_SLICE,tails[j].length);;
				let xs = 0, xe = 0, isN = false;
				let nampl = 0;

				for (let k = 0; k < tail.length; k++) {
					let tampl = tail[k];

					if (tampl >= nlvl && !isN) {
						xs = k;
						isN = true;
						nampl = tail[k];
					}

					if (tampl < nlvl && isN) {
						xe = k;
						isN = false;
						let dt = xe - xs;
						if (dt >= 2) {
							neutrons[j]++;
							this.neutrons_sp[j][Math.floor(k/NEUTRONS_SP_DEVIDE_FACTOR)]++;
							neutronsAmpl[j].push(nampl);
							neutronsPos[j].push(xs);
						}
					}
				}
			}

			event.neutrons = neutrons;
			event.neutronsAmpl = neutronsAmpl;
			event.neutronsPos = neutronsPos;
			event.zero_lines = data[i].z_lines;
			let nsum = 0; //number of neutrons

			for (let j = 0; j < neutrons.length; j++) { 
				nsum += neutrons[j]; 
			}

			event.nsum = nsum;
			let msum = 0; //sum of ampls
			let ndet = 0; //number of triggered detectors

			for (let j = 0; j < data[i].maxs.length; j++) {
				if (this.charge_sp[0].length > data[i].maxs[j].toFixed(0)) {
					this.charge_sp[j][data[i].maxs[j].toFixed(0)]++;
				}

				msum += data[i].maxs[j];

				if (data[i].maxs[j] >= ampllvl) { 
					ndet++; 
				}
			}

			master = ndet >= NUM_OF_DETECTORS ? master + 1 : master;
			master = msum >= SUM_OF_AMPLS ? master + 2 : master;
			master = nsum >= NUM_OF_NEUTRONS ? master + 4 : master;
			event.master = master;

			//сохранение сигналов в текстовый файл
			if (isSaveSigs && msum >= sigampl && nsum >= nsumSaving) {
				if (masterSaving > 7) {
					this.txtsys.saveSignalsTXT(this.save_folder + "SIG_" + filename.slice(0,filename.length-4) + ".dat", data[i], false);
				} else if (master == masterSaving) {
					this.txtsys.saveSignalsTXT(this.save_folder + "SIG_" + filename.slice(0,filename.length-4) + ".dat", data[i], false);
				}
			}

			events.push(event);
		}

		return events;
	}

	uranEASEventNoTail(data, filename, isSaveSigs, sigampl, masterSaving) {
		let events = [];
		let ampllvl = CHARGE_THRESHOLD;

		for (let i = 0; i < data.length; i++) {
			let master = 0;
			let event = {
				time:data[i].time,
				maxs:data[i].maxs,
				zero_lines:data[i].z_lines,
				number:data[i].number
			};

			let msum = 0 //sum of ampls
			let ndet = 0; //number of triggered detectors

			for (let j = 0; j < data[i].maxs.length; j++) {
				if (this.charge_sp[0].length > data[i].maxs[j].toFixed(0)) {
					this.charge_sp[j][data[i].maxs[j].toFixed(0)]++;
				}

				msum += data[i].maxs[j];

				if (data[i].maxs[j] >= ampllvl) { 
					ndet++; 
				}
			}

			master = ndet >= NUM_OF_DETECTORS ? master + 1 : master;
			master = msum >= SUM_OF_AMPLS ? master + 2 : master;
			event.master = master;

			if (isSaveSigs && msum >= sigampl) {
				if (masterSaving > 7) {
					this.txtsys.saveSignalsTXT(this.save_folder + "SIG_" + filename.slice(0,filename.length-4) + ".dat", data[i], false);
				} else if (master == masterSaving) {
					this.txtsys.saveSignalsTXT(this.save_folder + "SIG_" + filename.slice(0,filename.length-4) + ".dat", data[i], false);
				}
			}
			events.push(event)
		}

		return events;
	}

	parsedPackagesHandling(data) {
		let signals = [];
		let zero_lines = [];

		for (let i = 0; i < data.length; i++) {
			let pack = data[i];
			let zsigs = [], ztails = [], maxs = [];
			for (let j = 0; j < pack.signal.length; j++) {
				let sig = pack.signal[j];
				let tail = pack.tail[j];
				let max = Math.round(this.u_math.max_of_array(sig));

				if (zero_lines.length < 12) {
					zero_lines.push(Math.round(this.u_math.avarage(sig.slice(ZERO_LINE_SLICE_BEGIN,ZERO_LINE_SLICE_END))));
				}

				let zsig = [];
				let ztail = [];

				for (let k = 0; k < sig.length; k++) {
					zsig.push(sig[k] - zero_lines[j]);
				}

				sig = [];

				for (let k = 0; k < tail.length; k++) {
					ztail.push(tail[k] - zero_lines[j]);
				}

				tail = [];
				zsigs.push(zsig);
				ztails.push(ztail);
				maxs.push(max - zero_lines[j]);
			}

			let signal = {
				signal:zsigs,
				time:pack.time,
				maxs:maxs,
				tails:ztails,
				z_lines:zero_lines,
				number:pack.number
			};
			signals.push(signal);
		}

		return signals
	}

	parsedPackagesHandlingNoTail(data) {
		let signals = [];
		for (let i = 0; i < data.length; i++) {
			let pack = data[i];
			let zsigs = [], maxs = [];
			let zero_lines = [];

			for (let j = 0; j < pack.signal.length; j++) {
				let sig = pack.signal[j];
				let zline = sig.slice(ZERO_LINE_SLICE_BEGIN_NT,ZERO_LINE_SLICE_END_NT);

				if (zero_lines.length < 12) {
					zero_lines.push(Math.round(this.u_math.avarage(zline)));
				}

				let max = Math.round(this.u_math.max_of_array(sig) - zero_lines[j]);
				let zsig = [];

				for (let k = 0; k < sig.length; k++) {
					zsig.push(sig[k] - zero_lines[j]);
				}

				zsigs.push(zsig);
				maxs.push(max);
			}

			let signal = {
				signal:zsigs,
				time:pack.time,
				maxs:maxs,
				z_lines:zero_lines,
				number:pack.number
			};
			signals.push(signal);
		}

		return signals;
	}

} 