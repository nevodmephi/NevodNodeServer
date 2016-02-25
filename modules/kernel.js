//virtual machine module

var db = require("./db.js"),
    parser = require("./parser.js"),
    vm = require("vm");

var state = 0;

var STR = [
  "Схема с таким именем уже существует!",
  "Такая схема уже существует: "
]

module.exports = {
  io:null,
  schemes:[],
  installScheme:function(socket,scheme) {
    var newScheme = new Object();
    for(var i in this.schemes) {
      if(scheme.name == this.schemes[i].name) {
        socket.emit('scheme-wrong',{error: STR[0]});
        return false;
      }
      if(JSON.stringify(scheme.blocks) == JSON.stringify(this.schemes[i].blocks)) {
        socket.emit('scheme-wrong',{error: (STR[1] + this.schemes[i].name)});
        return false;
      };
    }
    newScheme = {
      status: "stopped",
      name: scheme.name,
      errors: 0,
      blocks: scheme.blocks
    }
    this.schemes.push(newScheme);
    this.io.sockets.emit('scheme-installed',{name: scheme.name});
    return true;
  },
  removeScheme:function(socket,name) {
    for(var i in this.schemes) {
      if(name == this.schemes[i].name) {
        this.schemes.splice(i);
        this.io.sockets.emit('scheme-removed',{name: name});
        return true;
      }
    }
    return false;
  },
  downloadScheme:function(socket,name) {
    var data = new Object();
    for(var i in this.schemes) {
      if(name == this.schemes[i].name) {
        data.name = this.schemes[i].name;
        data.blocks = this.schemes[i].blocks;
        socket.emit('scheme-downloaded',{scheme: data});
        return true;
      }
    }
    return false;
  },
  runScheme:function(socket,name) {
    for(var i in this.schemes) {
      if(name == this.schemes[i].name) {
        if(this.schemes[i].vmc == undefined) {
          this.schemes[i].vmc = "";
        }
        //console.log(this.schemes[i]);
        for(var j in this.schemes[i].blocks) {
          this.schemes[i].vmc += parseCode(this.schemes[i].blocks[j].code,this.schemes[i].blocks[j].id,this.schemes[i].blocks[j].connects) + "\n\n\n";
        }
        // console.log(this.schemes[i].vmc);
        try {
          this.schemes[i].vm = new vm.createContext(kernel(socket,this.schemes[i].name));
          vm.runInContext(this.schemes[i].vmc,this.schemes[i].vm);
        } catch (e) {
          console.log(e)
          this.schemes[i].status = "dead";
          this.io.sockets.emit('scheme-dead',{name: name, error: e.toString()});
          return false;
        }
        if(this.schemes[i].errors == 0) {
          this.schemes[i].status = "stable working";
        } else {
          this.schemes[i].status = "unstable working";
        }
        this.io.sockets.emit('scheme-ran',{name: name, status: this.schemes[i].status});
        return true;
      }
    }
    return false;
  },
  pauseScheme:function(socket,name) {
    for(var i in this.schemes) {
      if(name == this.schemes[i].name) {
        this.schemes[i].status = "paused";
        this.io.sockets.emit('scheme-paused',{});
        return true;
      }
    }
    return false;
  },
  stopScheme:function(socket,name) {
    for(var i in this.schemes) {
      if(name == this.schemes[i].name) {
        if(this.schemes[i].vmc !== undefined) {delete this.schemes[i].vmc;};
        if(this.schemes[i].data !== undefined) {delete this.schemes[i].data;};
        this.schemes[i].status = "stopped";
        this.io.sockets.emit('scheme-stopped',{name: name});
        return true;
      }
    }
    return false;
  }
}

function kernel(socket,name) {
  var k = new Object();
  k.System = new Object();
  k.Parser = new Object();
  k.Stat = new Object();
  k.Online = new Object();
  k.Uran = require("./uran.js")
  k.log = function(text) {
    console.log(text);
  }
  k.System.push = function(blocks,data) {
    for(var i in blocks) {
      k[blocks[i]] = data;
    }
  }
  k.System.ondata = function(__THISBLOCK,callback) {
    k.__defineSetter__(__THISBLOCK,callback);
  }
  k.finish = function() {
    module.exports.io.sockets.emit("scheme-finished");
  }
  k.System.raiseError = function() {
    for(var i in module.exports.schemes) {
      if(module.exports.schemes[i].name == name) {
        module.exports.schemes[i].errors++;
      }
    }
  }
  k.System.thread = function(offset,callback) {
    var cb_errhandling = function(){
      try {
        callback();
      } catch (e) {
        console.log(e)
      }
    }
    setTimeout(cb_errhandling,offset);
  }
  k.System.saveToDb = function(data,collection,callback){
     db.writeDocsToDb(collection,data,callback);
  }
  k.System.findInDb = function(collection,query,sorting,callback){
     db.findDocsInDb(collection,query,sorting,callback);
  }
  k.Parser.parse100Mhz = function(path,callback) {
     parser.parseWholeFileSync(path,"100Mhz",callback);
  }
  k.Parser.parse200MhzTail = function(path,callback) {
     parser.parseWholeFileSync(path,"200Mhz_tail",callback);
  }
  k.Parser.parse200MhzNoTail = function(path,callback){
     parser.parseWholeFileSync(path,"200Mhz_notail",callback);
  }
  k.Online.quickView = function(data,legend,axes,type) {
     socket.emit('quick-view',{data: data,legend: legend, axes: axes,type:type});
  }
  k.Online.controllState = function(data){
     socket.emit('controll-state',{data:data});
  }
  return k;
}

function parseCode(code,block,connections) {
  c = code;
  c = c.split("System.push(").join("System.push(" + JSON.stringify(connections) + ",");
  c = c.split("System.ondata(").join("System.ondata(\"" + block + "\",");
  return c;
}
