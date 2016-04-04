// working with text files
// saving signals, spectrums ... in text files
var fs = require("fs")


module.exports = {
  writeFileSync:function(file,data){
    try{
      fs.writeFileSync(file,data)
    } catch(e) {
      console.log("TXTSYS_ERRWRS: "+e)
      return false
    }
    return true
  },
  writeFile:function(file,data){
    fs.writeFile(file,data,function(err){
      if(err){
        console.log("TXTSYS_ERRWR: "+err)
      }
    })
  },
  appendFile:function(file,data){
    fs.appendFile(file,data,function(err){
      if(err){
        console.log("TXTSYS_ERRAPND: "+err)
      }
    })
  },
  appendFileSync:function(file,data){
    try{
      fs.appendFileSync(file,data)
    } catch(e) {
      console.log("TXTSYS_ERRAPNDS: "+e)
      return false
    }
    return true
  },
  writeSpectrumToFile(filename,data,sync){
    try{
      sync = sync == undefined ? true:false
      var str ="N\tCh1\tCh2\tCh3\tCh4\tCh5\tCh6\tCh7\tCh8\tCh9\tCh10\tCh11\tCh12\n";
    	var maxlength = 0;
    	for(var i=0;i<12;i++){
    		maxlength = maxlength<data[i].length ? data[i].length : maxlength
    	}
    	for (var i=0;i<maxlength;i++){
    		str+=i+"\t"
    		for (var j=0;j<12;j++){
    			if(data[j][i]!=undefined){
    				str+=data[j][i][1]+"\t";
    			} else {
    				str+="-\t";
    			}
    		}
    		str+="\n";
    	}
    } catch (e){
      console.log("TXTSYS_ERRSP: "+e)
    }
    if(sync){
      var result = this.writeFileSync("resources/txts/"+"SP__"+filename+".dat",str)
      str = null
      return result
    } else {
      this.writeFile("resources/txts/"+"SP__"+filename+".dat",str)
    }
  },
  writeCountRateToFile:function(filename,data,sync){
    fs.stat(filename,function(err){
      var str = "\n"+data[0].timestamp.getDate()+"-"+(data[0].timestamp.getMonth()+1)+"-"+data[0].timestamp.getFullYear()+" "+data[0].timestamp.getHours()+":"+data[0].timestamp.getMinutes()+"\t"
      if(err){
        str ="Time\tCh1\tCh2\tCh3\tCh4\tCh5\tCh6\tCh7\tCh8\tCh9\tCh10\tCh11\tCh12\n"+data[0].timestamp.getDate()+"-"+(data[0].timestamp.getMonth()+1)+"-"+data[0].timestamp.getFullYear()+" "+data[0].timestamp.getHours()+":"+data[0].timestamp.getMinutes()+"\t";
      }
      for (var i in data){
        str+=data[i]+"\t"
      }
      if(sync){
        var result = this.appendFileSync("resources/txts/"+"CR__"+filename+".dat",str)
        str = null
        return result
      } else {
        this.appendFile("resources/txts/"+"CR__"+filename+".dat",str)
      }
    })
  },
  saveSignalsTXT:function(filename,data,sync){
    var str = "\nTIME:"+data.time+"\n"
    var length = data.signal[0].length
    for(var i=0;i<length;i++){
      str+="\t"
      for(var j in data.signal){
        str+=data.signal[j][i]+"\t"
      }
      str+="\n"
    }
    if(data.tail!=undefined){
      var lengtht = data.tail[0].length
      for(var i=0;i<lengtht;i++){
        str+="tail\t"
        for (var k = 0 ;k<12;k++){
          str+=Math.floor(data.tail[k][i])+"\t";
        }
       str+="\n";
       }
    }
    if(sync){
      var result = this.appendFileSync(filename,str)
      str = null
      return result
    } else {
      this.appendFile(filename,str)
    }
  },
  saveZeroLines:function(filename,data,sync){
    for(var i in data){
      var str = data[i].number+"\t"+data[i].time+"\t"
      for(var j in data[i].zero_lines){
        str+=data[i].zero_lines[j]+"\t"
      }
      str+="\n"
      if(sync){
        var result = this.appendFileSync(filename,str)
        str = null
        return result
      } else {
        this.appendFile(filename,str)
      }
    }
  }
}
