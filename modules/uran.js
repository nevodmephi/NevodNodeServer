var fs = require("fs");

//file formats: 100Mhz_notail, 200Mhz_notail, 200Mhz_tail
//hf (header format): 24b_f,  40b_f

var l_100_data = 2048*12*2; //main data length for 100 MHz, no tail  
var l_24_header = 24; //24 bytes header length, no tail 
var l_notail_ending = 4; //ending for no tail data 

var l_200_data = 1024*12*2;
var l_tail_ending = 8;
var l_40_header = 40;
var l_tail = 20000*12*2;

var notail_ending = 'ffffffff';
var tail_ending = 'eeeeeeeeffffffff';



module.exports = {
	readWholeFileSync:function(fileName,format,callback){
		try {
			var data = fs.readFileSync(fileName);
			try {
				module.exports.parseBinaryFile(data,format,callback)
			} catch (e){
				console.log("PARSER_CALLBACK_ERROR: "+e);
			}
		} catch (e) {
			console.log(e);
		}
	},
	readWholeFile:function(fileName,format,callback){
		fs.readFile(fileName,function(err,data){
			try {
				if(err) {
					console.log(err);
					return;
				}
				try {
					module.exports.parseBinaryFile(data,format,callback)
				} catch (e){
					console.log("PARSER_CALLBACK_ERROR: "+e);
				}
			} catch (e) {
				console.log(e);
			}
		})
	},
	readFileByPart:function(fileName,format,callback){
		
	},
	parseBinaryFile: function(data,format,callback){
		var i = 0;
		var fileformat = {
			l_data:l_100_data,
			l_header:l_24_header,
			l_ending:l_notail_ending,
			l_tail:0,
			packagelength:l_100_data+l_24_header+l_notail_ending,
			ending:notail_ending,
			hf:"",
			sig_type:"no signal",
			packCount: 2000
		};
		if (data == undefined) { console.log("parser, no data"); return; }
		switch (format) {
			case "100Mhz":
				fileformat.hf = "24b_f"
				fileformat.sig_type = "100Mhz_signal"
				break;
			case "200Mhz_tail":
				fileformat.l_data = l_200_data;
				fileformat.l_header = l_40_header;
				fileformat.l_ending = l_tail_ending;
				fileformat.l_tail = l_tail;
				fileformat.packagelength = l_200_data+l_40_header+l_tail_ending+l_tail;
				fileformat.ending = tail_ending;
				fileformat.hf = "40b_f";
				fileformat.sig_type = "200MhzTail_signal";
				fileformat.packCount = 100;
				break;
			case "200Mhz_notail":
				fileformat.hf = "24b_f";
				fileformat.sig_type = "200Mhz_notail";
				fileformat.l_data = l_200_data;
				fileformat.packagelength = l_200_data+l_24_header+l_notail_ending
			default:
				console.log("parser, wrong format");
				return;
		}
		var packages = [];
		while (data.length >= fileformat.packagelength) {
			var ending = data.slice(data.length-fileformat.l_ending,data.length);
			if (ending.toString('hex')==fileformat.ending){
				var header = data.slice(data.length-fileformat.packagelength+fileformat.l_tail,data.length-fileformat.packagelength+fileformat.l_tail+fileformat.l_header);
				var p_data = data.slice(data.length-fileformat.l_data-fileformat.l_ending,data.length-fileformat.l_ending);
				var tail = [];
				if(fileformat.l_tail!=0){
					tail = data.slice(data.length-fileformat.packagelength,data.length-fileformat.packagelength+fileformat.l_tail);
				}
				data = data.slice(0,data.length-fileformat.packagelength);
				p_data = parsePackageData(p_data,tail); 
				tail = [];
				var packageObj = {
					type:fileformat.sig_type,
					signal:p_data[0],
					time:parseHeader(header,fileformat.hf)
				}
				if(fileformat.l_tail!=0){
					packageObj.tail = p_data[1];
				}
				packages.push(packageObj)
			} else {
				data = data.slice(0,data.length-1);
			}
			if(packages.length>=fileformat.packCount){
				callback(packages,{done:false,wrong:false,packNum:i});
				packages = []
				i++;
			} 
		}
		if(data.length!=0){
			console.log("WARN, wrong package, issue in parser");
			callback(packages,{done:true,wrong:true,packNum:i});
		} else {
			callback(packages,{done:true,wrong:false,packNum:i});
		}
	}
}

var parsePackageData = function(p_data,tail) {
	try {
		var array = [[],[],[],[],[],[],[],[],[],[],[],[]];
		var tailarray = [[],[],[],[],[],[],[],[],[],[],[],[]];
		for (var i=0;i<p_data.length;i+=2){
			var sig_data = p_data.slice(i,i+2).toString('hex');
			array[parseInt('0x'+sig_data[2])].push(parseInt('0x'+sig_data[3]+sig_data[0]+sig_data[1]));
		}
		if(tail.length!=0){
			for (var i=0;i<tail.length;i+=2){
				var sig = tail.slice(i,i+2).toString('hex');
				tailarray[parseInt('0x'+sig[2])].push(parseInt('0x'+sig[3]+sig[0]+sig[1]));
			}
		}
		return [array,tailarray];
	} catch (e){
		console.log("PARSER_ERROR: "+e);
	}
}



var parseHeader = function(header,hf) {
	var d_time = new Buffer(8);
	switch (hf) {
		case "24b_f":
			d_time = header.slice(12,20);
			break;
		case "40b_f":
			d_time = header.slice(8,16);
			break;
		default:
			console.log("parser, wrong header format");
	}
	var ns = d_time[0]%0b10000000;
	var mks = (d_time[2]%0b10)*0b1000000000 + d_time[1]*0b10 + d_time[0]/0b10000000 | 0;
	var ms = (d_time[3]%0b1000)*0b10000000 + d_time[2]/0b10 | 0;
	var s = (d_time[4]%0b10)*0b100000 + d_time[3]/0b1000 | 0;
	var min =  (d_time[4]%0b10000000)/0b10;
	var hour = (d_time[5]%0b10000)*0b10 + d_time[4]/0b10000000 | 0;
	var day = (d_time[6]%0b100)*0b10000 + d_time[5]/0b10000 | 0;
	var time = [Math.floor(day),Math.floor(hour),Math.floor(min),Math.floor(s),Math.floor(ms),Math.floor(mks),Math.floor(ns*10)];
	return time;
}







































