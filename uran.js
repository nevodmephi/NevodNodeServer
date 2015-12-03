var fs = require("fs");

//file formats: 100Mhz_notail, 200Mhz_notail, 200Mhz_tail
//hf (header format): 24b_f,  40b_f

var l_100_data = 2048*12*2; //main data length for 100 MHz, no tail 
var l_24_header = 24; //24 bytes header length, no tail 
var l_notail_ending = 4; //ending for no tail data 

var notail_ending = 'ffffffff';

module.exports = {
	parseBinaryFile: function(data,format,callback){
		var fileformat = {};
		if (data == undefined) {console.log("parser, no data"); return; }
		switch (format) {
			case "100Mhz_notail":
				fileformat.l_data = l_100_data;
				fileformat.l_header = l_24_header;
				fileformat.l_ending = l_notail_ending;
				fileformat.tail = 0;
				fileformat.packagelength = l_100_data+l_24_header+l_notail_ending;
				fileformat.ending = notail_ending;
				fileformat.hf = "24b_f"
				fileformat.sig_type = "100Mhz_signal"
				break;
			default:
				console.log("parser, wrong format");
				return;
		}
		var packages = [];
		while (data.length >= fileformat.packagelength) {
			var ending = data.slice(data.length-fileformat.l_ending,data.length);
			if (ending.toString('hex')==fileformat.ending){
				var header = data.slice(data.length-fileformat.packagelength,data.length-fileformat.packagelength+fileformat.l_header);
				var p_data = data.slice(data.length-fileformat.l_data-fileformat.l_ending,data.length-fileformat.l_ending);
				var packageObj = {
					type:fileformat.sig_type,
					signal:parsePackageData(p_data),
					time:parseHeader(header,fileformat.hf)
				}
				packages.push(packageObj);
				if (data.length == fileformat.packagelength) { data = new Buffer(0) };
				data = data.slice(0,data.length-fileformat.packagelength);
			} else {
				data = data.slice(0,data.length-1);
			}
		}
		if(data.length!=0){
			console.log("WARN, wrong package, issue in parser");
			// callback(packages,data);
			return packages
		} else {
			return packages
			// callback(packages);
		}
	}
}

var parsePackageData = function(p_data) {
	var array = [[]];
	var prevCh = 0;
	var p_data_s = p_data.toString('hex');
	// console.log(p_data.length)
	for (var i=0;i<p_data_s.length;i+=4){
		var dataS = p_data_s[i+2]+p_data_s[i+3]+p_data_s[i]+p_data_s[i+1];
		var channel = parseInt('0x'+dataS[0]);
		var sig = parseInt('0x'+dataS[1]+dataS[2]+dataS[3])
		if(channel == prevCh){
			array[channel].push(sig);
		} else {
			prevCh = channel;
			array.push([])
			array[channel].push(sig);
		}
	}
	return array;
}


var parseHeader = function(header,hf) {
	switch (hf) {
		case "24b_f":
			var d_time = header.slice(12,22), b_time = "";
			var ns = d_time[0]%0b10000000;
			var mks = (d_time[2]%0b10)*0b1000000000 + d_time[1]*0b10 + d_time[0]/0b10000000 | 0;
			var ms = (d_time[3]%0b1000)*0b10000000 + d_time[2]/0b10 | 0;
			var s = (d_time[4]%0b10)*0b100000 + d_time[3]/0b1000 | 0;
			var min =  (d_time[4]%0b10000000)/0b10;
			var hour = (d_time[5]%0b10000)*0b10 + d_time[4]/0b10000000 | 0;
			var day = (d_time[6]%0b100)*0b10000 + d_time[5]/0b10000 | 0;
			var timeString = [day,hour,min,s,ms,mks,ns*10];
			return timeString;
			break;
		default:
			console.log("parser, wrong header format");
	}
}







































