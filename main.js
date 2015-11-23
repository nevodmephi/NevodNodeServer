var url = require("url"),
    path = require("path"),
    net = require('net'),
    io = require("socket.io"),
    express = require("express"),
    fs = require("fs"),
    vm = require("vm"),
    uran = require("./uran.js")

var state = 0;
var schemes = [];

var STR = [
  "Схема с таким именем уже существует!",
  "Такая схема уже существует: "
]

var app = express();
var port = (process.env.PORT || 80);
app.set('port',port);
app.use(express.static(__dirname + '/public'));
app.get('/', function(req,res){
	res.sendFile(__dirname + '/public/index.html');
});
var server = app.listen(app.get('port'),function(){
	//console.log('node app is running on port', app.get('port'));
})
var io = io.listen(server);

console.log("Socket server started @ http://localhost:"+app.get('port')+"/");

io.sockets.on('connection', function (socket) {
  socket.on('scheme-install', function (data) {
    installScheme(socket,data.scheme);
  });

  socket.on('scheme-remove', function(data) {
    removeScheme(socket,data.name);
  })

  socket.on('scheme-run', function(data) {
    runScheme(socket,data.name);
  })

  socket.on('scheme-pause', function(data) {
    pauseScheme(socket,data.name);
  })

  socket.on('scheme-stop', function(data) {
    stopScheme(socket,data.name);
  })

  var handshakeData = new Array();
  for(var i in schemes) {
    handshakeData.push({name: schemes[i].name,status: schemes[i].status})
  }
  socket.emit('handshake',handshakeData);
  console.log("[H] " + socket.handshake.address);

});

function installScheme(socket,scheme) {
  var newScheme = new Object();
  for(var i in schemes) {
    if(scheme.name == schemes[i].name) {
      socket.emit('scheme-wrong',{error: STR[0]});
      return false;
    }
    if(JSON.stringify(scheme.blocks) == JSON.stringify(schemes[i].blocks)) {
      socket.emit('scheme-wrong',{error: (STR[1] + schemes[i].name)});
      return false;
    };
  }
  newScheme = {
    status: "stopped",
    name: scheme.name,
    errors: 0,
    blocks: scheme.blocks
  }
  schemes.push(newScheme);
  io.sockets.emit('scheme-installed',{name: scheme.name});
  return true;
}

function removeScheme(socket,name) {
  for(var i in schemes) {
    if(name == schemes[i].name) {
      schemes.splice(i);
      io.sockets.emit('scheme-removed',{name: name});
      return true;
    }    
  }

  return false;

}

function downloadScheme(socket,name) {
  var data = new Object();
  for(var i in schemes) {
    if(name == schemes[i].name) {
      data.name = schemes[i].name;
      data.blocks = schemes[i].blocks;
      socket.emit('scheme-downloaded',{scheme: data});
      return true;
    }    
  }
  return false;  
}

function runScheme(socket,name) {
  for(var i in schemes) {
    if(name == schemes[i].name) {
      if(schemes[i].vmc == undefined) {
        schemes[i].vmc = "";
      }
      //console.log(schemes[i]);
      for(var j in schemes[i].blocks) {
        schemes[i].vmc += parseCode(schemes[i].blocks[j].code,schemes[i].blocks[j].id,schemes[i].blocks[j].connects) + "\n\n\n";  
      }
      //console.log(schemes[i].vmc);
      try {
        schemes[i].vm = new vm.createContext(kernel(socket,schemes[i].name));      
        vm.runInContext(schemes[i].vmc,schemes[i].vm);
      } catch (e) {
        schemes[i].status = "dead";
        io.sockets.emit('scheme-dead',{name: name, error: e.toString()});
        return false;
      }
      if(schemes[i].errors == 0) {
        schemes[i].status = "stable working";
      } else {
        schemes[i].status = "unstable working";
      }
      io.sockets.emit('scheme-ran',{name: name, status: schemes[i].status});
      return true;
    }    
  }
  return false;  
}

function pauseScheme(socket,name) {
  for(var i in schemes) {
    if(name == schemes[i].name) {
      schemes[i].status = "paused";
      io.sockets.emit('scheme-paused',{});
      return true;
    }    
  }
  return false;  
}

function stopScheme(socket,name) {
  for(var i in schemes) {
    if(name == schemes[i].name) {
      if(schemes[i].vmc !== undefined) {delete schemes[i].vmc;};
      if(schemes[i].data !== undefined) {delete schemes[i].data;};      
      schemes[i].status = "stopped";
      io.sockets.emit('scheme-stopped',{name: name});
      return true;
    }    
  }
  return false;  
}

function parseCode(code,block,connections) {
  c = code;
  c = c.split("System.push(").join("System.push(" + JSON.stringify(connections) + ",");
  c = c.split("System.ondata(").join("System.ondata(\"" + block + "\",");
  return c;
}

function kernel(socket,name) {
  var k = new Object();
  k.Shared = new Object();
  k.System = new Object();
  k.Uran = new Object();
  k.Stat = new Object();
  k.Online = new Object();
  k.log = function(text) {
    console.log(text);
  }
  k.sin = Math.sin;
  k.cos = Math.cos;
  k.System.push = function(blocks,data) {
    for(var i in blocks) {
      k[blocks[i]] = data;
    } 
  }
  k.System.ondata = function(__THISBLOCK,callback) {
    k.__defineSetter__(__THISBLOCK,callback);
  }
  k.finish = function() {
    io.sockets.emit("scheme-finished");
  }
  k.Shared.readFile = function(path) {
    var f = undefined;
    try {
      f = fs.readFileSync("resources/shared/" + path);
    } catch (e) {
      k.raiseError();
    }
    return f;
  }
  k.System.raiseError = function() {
    for(var i in schemes) {
      if(schemes[i].name == name) {
        schemes[i].errors++;
      }
    }
  };
  k.System.thread = function(offset,callback) {
    setTimeout(callback,offset);
  }
  k.Uran.parse100Mhz = function(path,callback) {
    uran.parseBinaryFile(fs.readFileSync(path),"100Mhz_notail",callback);
  }
  k.Stat.histogram = function(signal,from,to,bars) {
    var r = [];
    w = (to-from)/bars;
    for(var i=0;i<bars;i++) r[i]=0;
    for(var i in signal) {
      for(var j=0;j<bars;j++) {
        if((signal[i]>=from+j*w)&&(signal[i]<from+(j+1)*w)) {
          r[j]++;
        }  
      }
    }
    for(var i in r) r[i] = [from+i*w,r[i]];
    return r;
  }
  k.Online.quickView = function(data) {
    io.sockets.emit('quick-view',data);
  }

  return k;
}