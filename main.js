var http = require("http"),
    url = require("url"),
    path = require("./node_modules/path"),
    net = require('net'),
    io = require("socket.io"),
    express = require("express"),
    fs = require("fs"),
    vm = require("vm")
    port = process.argv[2] || 80;

var state = 0;
var scheme = {};
var eventLog = [];

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

      var headers = {};
      var contentType = contentTypesByExtension[path.extname(filename)];
      if (contentType) headers["Content-Type"] = contentType;
      response.writeHead(200, headers);
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(80);

console.log("HTTP Server started @ http://localhost:" + port + "/");

var app = express();
var server = http.createServer(app);
var io = io.listen(server);
server.listen(8889);

console.log("Socket server started @ http://localhost:8889/");

io.sockets.on('connection', function (socket) {

  for(var i in clients) {
    socket.emit('client',{ip: clients[i].name});
    socket.emit('state',{ip: clients[i].name, state: clients[i].state});
  }

  socket.on('play', function (data) {
    console.log("[PLAY]\n");
    state = 0;
  });

  socket.on('stop', function (data) {
    console.log("[STOP]\n");
    state = 2;    
  });

  socket.on('pause', function (data) {
    if(state==2) {
      console.log("[ERR] Can't pause if stopped\n"); 
      state=1
    } else {     
      console.log("[PAUSE]\n");
    }
  });

  socket.on('refresh', function (data) {
      scheme = JSON.parse(data);
      console.log("Scheme refreshed\n");
  });

  socket.on('scheme-install', function (data) {
      for(var i in clients) {
        console.log(data);
        if(clients[i].name == data.ip) {
          clients[i].write(new Buffer(data.scheme));  
        }
      }
  });

});

// TCP Server for data

var clients = [];
 
net.createServer(function (socket) {
  console.log("Connected!");
  socket.bufferSize = 10000; // WARNING
  socket.name = socket.remoteAddress + ":" + socket.remotePort
  socket._evt = new Object();
  socket._evt.data = new Array();
  clients.push(socket);
  io.sockets.emit("client",{ip:socket.name});
  socket.on('data', function (data) {
    var d = data.toJSON();
    for(var i in d.data) socket._evt.data.push(d.data[i]);
    if((d.data[d.data.length-1]==0xFF)&&(d.data[d.data.length-2]==0xFF)&&(d.data[d.data.length-3]==0xFF)&&(d.data[d.data.length-4]==0xFF)) {
      socket._evt.ip = socket.name;
      socket._evt.data = socket._evt.data.slice(0,socket._evt.data.length-4);
      eventLog.push(socket._evt);
      socket._evt.id = eventLog.length-1;
      io.sockets.emit("event",socket._evt);
      delete socket._evt.data;
      delete socket._evt;
      socket._evt = new Object();
      socket._evt.data = new Array();
    }
  });
  socket.on('end', function () {
    console.log("END");
    clients.splice(clients.indexOf(socket), 1);
  });
  socket.on('error', function(err) {
    console.log("ERR");
    io.sockets.emit("state",{ip:socket.name,state:"error"});
    clients.splice(clients.indexOf(socket), 1);
  });
}).listen(5001);

console.log("TCP server started @ http://localhost:5001/");