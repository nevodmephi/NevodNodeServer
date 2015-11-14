var http = require("http"),
    url = require("url"),
    path = require("path"),
    net = require('net'),
    io = require("socket.io"),
    express = require("express"),
    fs = require("fs"),
    vm = require("vm")

var state = 0;
var schemes = [];

var STR = [
  "Схема с таким именем уже существует!",
  "Такая схема уже существует: "
]

http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);

  var contentTypesByExtension = {
    '.html': "text/html",
    '.css':  "text/css",
    '.js':   "text/javascript"
  };

  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      c = {"a": 4,"b": 5};
      
      var headers = {};
      var contentType = contentTypesByExtension[path.extname(filename)];
      if (contentType) headers["Content-Type"] = contentType;
      response.writeHead(200, headers);
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(80);

console.log("HTTP Server started @ http://localhost:" + 80 + "/");

var app = express();
var server = http.createServer(app);
var io = io.listen(server);
server.listen(8889);

console.log("Socket server started @ http://localhost:8889/");

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
      for(var j in schemes[i].blocks) {
        schemes[i].vmc += parseCode(schemes[i].blocks[j].code,schemes[i].blocks[i].id,schemes[i].blocks[j].connects) + "\n\n\n";  
      }
      schemes[i].vm = new vm.createContext(kernel());      
      vm.runInContext(schemes[i].vmc,schemes[i].vm);
      if(schemes[i].errors == 0) {
        schemes[i].status = "stable working";
      } else {
        schemes[i].status = "unstable working";
      }
      io.sockets.emit('scheme-ran',{});
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
      if(schemes[i].vms !== undefined) {delete schemes[i].vms;};
      if(schemes[i].data !== undefined) {delete schemes[i].data;};      
      schemes[i].status = "stopped";
      io.sockets.emit('scheme-stopped',{});
      return true;
    }    
  }
  return false;  
}

function parseCode(code,block,connections) {
  c = code;
  c = c.split("push(").join("push(" + connections.toString() + ",");
  c = c.split("ondata(").join("ondata(" + block + ",");
  return c;
}

function kernel() {
  var k = new Object();
  k.log = function(text) {
    console.log(text);
  }
  k.sin = Math.sin;
  k.cos = Math.cos;
  k.push = function(blocks,data) {
    for(var i in blocks) {
      k[blocks[i]] = data;
    } 
  }
  k.ondata = function(__THISBLOCK,callback) {
    k.__defineSetter__(__THISBLOCK,callback(data));
  }
  return k;
}