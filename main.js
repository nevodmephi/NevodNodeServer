var io = require("socket.io"),
    express = require("express"),
    fs = require("fs"),
    kernel = require("./modules/kernel.js");


const child_process = require("child_process");
var children = [];
// createChildProcess("bgParsing-100");


//http server part
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
kernel.io = io;


console.log("Socket server started @ http://localhost:"+app.get('port')+"/");

io.sockets.on('connection', function (socket) {
  socket.on('scheme-install', function (data) {
    kernel.installScheme(socket,data.scheme);
  });

  socket.on('scheme-remove', function(data) {
    kernel.removeScheme(socket,data.name);
  })

  socket.on('scheme-run', function(data) {
    kernel.runScheme(socket,data.name);
  })

  socket.on('scheme-pause', function(data) {
    kernel.pauseScheme(socket,data.name);
  })

  socket.on('scheme-stop', function(data) {
    kernel.stopScheme(socket,data.name);
  })

  socket.on('get-blocks', function(data) {
    fs.readdir("blocks",function(err, files) {
      socket.emit('blocks',files);
    })
  })

  socket.on('get-block', function(data) {
    fs.readFile("blocks/" + data.name, 'utf8', function(err,file) {
      socket.emit('block',{text:file, id:data.id, title: data.name});
    });
  })

  var handshakeData = new Array();
  for(var i in kernel.schemes) {
    handshakeData.push({name: kernel.schemes[i].name,status: kernel.schemes[i].status})
  }
  socket.emit('handshake',handshakeData);
  console.log("[H] " + socket.handshake.address);

});


//other functions
function loadSettings(){

}

function createChildProcess(task){
  if(children.length>5){
    console.log("WARN to much child processes, max = 5")
    return;
  }
  const child = child_process.fork("./modules/bg_server.js")
  child.task = task;
  children.push(child)
  child.on('exit',function(code,signal){
    children.splice(children.indexOf(child), 1);
  });
  child.send(task)
}
