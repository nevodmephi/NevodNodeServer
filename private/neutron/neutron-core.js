/**
 * @author Alexander Lakhonin (ixav1@icloud.com)
 * модуль для обработки данных посутпающих с установки УРАН, вариационная задача (платы 100 МГц)
 */

/*list of functions:
  packs_process_100mhz;
  neutron_event;
  createEmptySpArray;
  addTwoSpectrums;
  createSpectrum;
  createCountRate;
*/

'use strict'

const nevod = require('nevod');

var txtsavefolder = null,
	filename = "unkown",
	isSaveSigs = false;

const ZERO_LINE_SLICE_BEGIN = 50;
const ZERO_LINE_SLICE_END = 300;

const SIG_THRESHOLD_DEFAULT = 15; // не используется, не изменять, используется в качестве заглушки
const SMA_POWER_DEFAULT = 16; // заглушка, не используется

const CHARGE_OFFSET_DEFAULT_VALUE = 110; // смещение от максимума, для определения нейтрон или нет, не исползуется
const NDWTHRESHOLD_DEFAULT = 80; // порог определения нейтрона по производной, стандартный, не используется
const NTHRESHOLD_DEFAULT = 0.5; // порог определения нейтрона по смещению, метод Ю.В. Стенькина, не используется

const DW_SLICE_BEGIN = 0;
const DW_SLICE_END = 1500;

class NeutronCore {
	
}

module.exports = {
	u_math:nevod.getUranMathLib(),
	txt:nevod.getTextSysLib(),
	/**
	 * инициализация модуля, для корректной работы необходимо инициализировать перед началом работы с модулем
	 * @param  {String} папка куда сохряняются текстовые файлы
	 * @param  {String} имя файла который парсится
	 * @param  {Bool} сохраняются ли сигналы
	 */
	init:function(savefolder, filename, savesigs) {
		filename = filename === undefined ? "unkown" : filename;
		txtsavefolder = savefolder === undefined ? null : savefolder;
		isSaveSigs = savesigs === undefined ? false : savesigs;
	},
	/**
	 * функция для обработки распарсенных пакетов с платы 100Mhz -> массив осцилограмм сигналов с данными
	 * @param  {Array}  packages   массив пакетов
	 * @param  {Number}  threshold  порог сигнала
	 * @param  {Number}  sma_power  степень сглаживания
	 * @param  {Boolean} isUsingSMA использовать ли сглаживание вообще
	 * @return {Array}             массив объектов сигналов 
	 */
	packs_process_100mhz:function(packages, threshold, sma_power, isUsingSMA) {
		threshold = threshold === undefined ? SIG_THRESHOLD_DEFAULT : threshold; //порог сигнала
		sma_power = sma_power === undefined ? SMA_POWER_DEFAULT : sma_power; //степень сглаживания сигнала
		isUsingSMA = isUsingSMA === undefined ? true : isUsingSMA; //используется сглаживание сигнала или нет
		var signals = []; //сигналы

		try {
			for (var i = 0; i < packages.length; i++) {
				let pack = packages[i]; //пакет
				let z_sigs = []; // массив с нулевыми линиями
				let detectors = 0; //число сработавших детекторов
				let numdet = -1; //порядковый номер сработавшего детектора

				for (var j = 0; j < pack.signal.length; j++) { //перебор сигналов в пакете
					let sig = pack.signal[j] //сигнал пакета
					let max = this.u_math.max_of_array(sig); //амплитуда 'сырого' сигнала
					let zsig = sig.slice(ZERO_LINE_SLICE_BEGIN,ZERO_LINE_SLICE_END); //область сигнала из которой считается нулевая линия
					let zline = this.u_math.avarage(zsig); //нулевая линия

					if (max > threshold + zline) {
						detectors++;
						numdet = j;
					}
				}

				if (detectors == 1) { //сигнал обрабатывается если сработал только один детектор
					let sig = pack.signal[numdet];
					let zsig = sig.slice(ZERO_LINE_SLICE_BEGIN,ZERO_LINE_SLICE_END);
					let zline = this.u_math.avarage(zsig);
					sig = isUsingSMA ? this.u_math.simple_moving_avarage(sig,sma_power) : sig;
					let max = this.u_math.max_of_array(sig) - zline;
					let mean = this.u_math.avarage(sig) - zline;

					for (let j = 0; j < sig.length; j++) {
						sig[j] -= zline;
					}

					signals.push({channel:numdet,
							signal:sig,
							time:pack.time,
							max:max,
							avg:mean,
							zero_line:zline});
				} else if (detectors >= 2) {
					this.txt.appendFileSync(txtsavefolder + "/2orMoreEvents_" + (new Date).toUTCString() + ".log", (new Date).toUTCString() + "\t" + pack.time + "\t" + detectors + "\n");
				}

				if (isSaveSigs) {
					if (txtsavefolder != null) {
						this.txt.saveSignalsTXT(txtsavefolder + "SIG_" + filename + ".dat", pack, false);
					}
				}
			}

			return signals;
		} catch(e) {
			console.error((new Date).toUTCString() + " URAN packs process 100mhz error: " + e);
		}
	},
	/**
	 * функция для обработки массив осцилограмм сигналов с данными c платы 100Mhz -> массив событий
	 * @param  {Array} data    массив объектов сигналов
	 * @param  {Object} options настройки обработки
	 * @return {Array}         массив событий
	 */
	neutron_event:function(data, options) {
		options.chip = options.chip === undefined ? "unknown" : options.chip;
		options.nthreshold = options.nthreshold === undefined ? NTHRESHOLD_DEFAULT : options.nthreshold;
		options.charge_offset = options.charge_offset === undefined ? CHARGE_OFFSET_DEFAULT_VALUE : options.charge_offset;
		options.ndwthreshold = options.ndwthreshold === undefined ? NDWTHRESHOLD_DEFAULT :  options.ndwthreshold;
		let events = []

		try {
			for (var i = 0; i < data.length; i++) {
				let event = {
					channel:data[i].channel,
					chiptype:options.chip,
					time:data[i].time,
					maximum:data[i].max,
					zero_line:data[i].zero_line,
					minimum:this.u_math.min_of_array(data[i].signal),
					avg:data[i].avg,
					dw:this.u_math.derivativeWidth(this.u_math.derivative(data[i].signal.slice(DW_SLICE_BEGIN,DW_SLICE_END))),
					charges: this.u_math.charge_ratio(data[i].signal, options.charge_offset, data[i].max)
				};

				if (isSaveSigs) {
					event.signal = data[i].signal;
				}

				event.charge_ratio = event.charges[1] / event.charges[0];
				event.neutron = event.charge_ratio > options.nthreshold ? true : false;
				event.neutronDW = event.dw > options.ndwthreshold ? true : false;

				let time = new Date();
				if (event.neutron && event.neutronDW) { // Время каждого нейтрона сохраняется в текстовый файл
					let str = "Детектор: " + event.channel + "\t" + "Время: " + event.time + "\n";
					this.txt.appendFileSync(txtsavefolder + options.chip + "/neutron_time_" + time.getDate() + (time.getMonth() + 1) + time.getFullYear() + ".dat", str);
				}

				// запись нулевых линий
				this.txt.appendFileSync(txtsavefolder + options.chip + "/zerolines/zeroline_" + event.channel + "_" + time.getDate() + (time.getMonth() + 1) + time.getFullYear() + ".dat", event.zero_line + "\n");

				if (options.timestamp !== undefined) {
					event.timestamp = options.timestamp;
				}

				events.push(event);
			}

			return events;
		} catch(e) {
			console.error((new Date).toUTCString() + " URAN neutron event error: " + e);
		}
	},
	/**
	 * создает пустой (заполненный нулями) массив спектров
	 * @param  {Number} length 
	 * @return {Array[][]}        спектры для 12 каналов
	 */
	createEmptySpArray:function(length) {
		var sp = [[],[],[],[],[],[],[],[],[],[],[],[]];

		for (var i = 0; i < length; i++) {
			for (var j = 0; j < 12; j++) {
				sp[j].push(0);
			}
		}

		return sp;
	},
	/**
	 * суммирует два спектра, спектры должны быть одинаковой длины
	 * @param {Array} sp1 
	 * @param {Array} sp2 
	 * @return {Array}
	 */
	addTwoSpectrums:function(sp1, sp2) {
		for (var i = 0; i < sp1[0].length; i++) {
			for (var j = 0; j < 12; j++) {
				sp1[j][i] += sp2[j][i];
			}
		}

		return sp1;
	},
	/**
	 * функция создает спектр апмлитуд для событий
	 * @param  {Array} data          массив событий
	 * @param  {Bool} neutronsOnly  только нейтроны записывать в спектр или нет?
	 * @param  {Array} spArray      пустой массив спекторв для 12 каналов
	 * @param  {Number} spArrayLength длина спектра
	 * @return {Array}               массив спектра
	 */
	createSpectrum:function(data, neutronsOnly, spArray, spArrayLength) {
		try{
			if (spArray == undefined) {
				spArrayLength = spArrayLength == undefined ? 1000 : spArrayLength;
				spArray = this.createEmptySpArray(1000);
			}

			for (var i = 0; i < data.length; i++) {
				if (spArray[0].length > data[i].maximum.toFixed(0)) {
					if (neutronsOnly && data[i].neutron && data[i].neutronDW) {
						spArray[data[i].channel][data[i].maximum.toFixed(0)]++;
					} else if (!neutronsOnly && (!data[i].neutron || !data[i].neutronDW)) {
						spArray[data[i].channel][data[i].maximum.toFixed(0)]++;
					}
				}
			}

			return spArray;
		} catch(e) {
			console.error((new Date).toUTCString() + " URAN createSpectrum: " + e);
		}
	},
	/**
	 * функция создает темп счета
	 * @param  {Array} data   массив событий
	 * @param  {Bool} devide  разделять на электроны и нейтроны или нет
	 * @return {Array}        массив темпов счета для 12 каналов
	 */
	createCountRate:function(data, devide) {
		try {
			if (devide) {
				var nRates = [0,0,0,0,0,0,0,0,0,0,0,0];
				var nDWRates = [0,0,0,0,0,0,0,0,0,0,0,0];
				var nSRates = [0,0,0,0,0,0,0,0,0,0,0,0];
				var elRates = [0,0,0,0,0,0,0,0,0,0,0,0];
				var elDWRates = [0,0,0,0,0,0,0,0,0,0,0,0];
				var elSRates = [0,0,0,0,0,0,0,0,0,0,0,0];

				for (var i = 0; i < data.length; i++) {
					if (data[i].neutron && data[i].neutronDW) {
						nRates[data[i].channel]++;
					} else {
						elRates[data[i].channel]++;
					}
					if (data[i].neutron) {
						nSRates[data[i].channel]++;
					} else {
						elSRates[data[i].channel]++;
					}
					if (data[i].neutronDW) {
						nDWRates[data[i].channel]++;
					} else {
						elDWRates[data[i].channel]++;
					}
				}
				return [nRates,elRates,nDWRates,nSRates,elDWRates,elSRates];
			} else {
				var rates = [0,0,0,0,0,0,0,0,0,0,0,0]

				for (var i = 0; i < data.length; i++){
					rates[data[i].channel]++;
				}

				return rates;
			}
		} catch (e) {
			console.error((new Date).toUTCString() + " URAN createCountRate: " + e);
		}
	},
	/**
	 * функция создает распределение фронтов
	 * @param  {Array} data  массив сигналов
	 * @param  {Array} fnsS  пустой массив распределения фронтов для простого отбора
	 * @param  {Array} fnsDW пустой массив распределения фронтов для отбора по производной
	 * @return {Array}       заполенные массивы распределения фронтов для двух способов
	 */
	createFrontsDistribution:function(data, fnsS, fnsDW) {
		try {
			for (var i = 0; i < data.length; i++) {
				if (fnsS[data[i].channel][(data[i].charge_ratio*100).toFixed(0)] != undefined) {
					fnsS[data[i].channel][(data[i].charge_ratio*100).toFixed(0)]++;
				}
				if (fnsDW[data[i].channel][data[i].dw.toFixed(0)] != undefined) {
					fnsDW[data[i].channel][data[i].dw.toFixed(0)]++;
				}
			}
			return [fnsS,fnsDW];
		} catch(e) {
			console.error((new Date).toUTCString() + " URAN createFrontsDistribution: " + e);
		}
	}
}
