const express = require("express");
const fs = require("fs");
const http = require('http');
const https = require("https");
const net = require("net");
const bodyParser  = require('body-parser');
const jwt = require('jsonwebtoken');
const kernel = require("./modules/kernel.js");
var io = require("socket.io");

const security_settings = JSON.parse(fs.readFileSync('./security/users.json'))
const users = security_settings['users']
const key  = fs.readFileSync('./security/nevod-key.pem');
const cert = fs.readFileSync('./security/nevod-cert.pem');
var token_secret = security_settings['token_secret']
var https_options = {
    key: key,
    cert: cert
};


const task = (process.env.TASK || "all")
if(task != "eas" && task != "neutron" && task != "all"){
  console.log(task+" - is unkown task environment variable, use ONLY: 'eas' or 'neutron' or 'all' for TASK ")
  process.exit()
}

kernel.init(task)
// kernel.load()

//http server
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = (process.env.PORT || 443);
const https_server = https.createServer(https_options,app).listen(port);
app.set('port',port);
app.use(express.static(__dirname + '/public/'));
app.get('/', function(req,res){
	res.sendFile(__dirname + '/public/index.html');
});

var router = express.Router()
router.get('/',function(req,res){
  res.json({ message: 'Welcome to the coolest API on earth! Oops you might be waiting for something else.' });
})
router.post('/authenticate',function(req,res){
  var accept = false
  users.forEach(function(user){
    if(user['name']==req.body.user && user['password']==req.body.pass){
      accept = true
      return
    }
  })
  if(accept){
    var token = jwt.sign(req.body,token_secret,{exexpiresInMinutes:1440})
    res.json({success:accept,token:token})
  } else {
    res.json({success:accept})
  }
})
app.use('/api',router)
var io = io.listen(https_server);
kernel.io = io

console.log("Node app started, HTTPS server: @ https://localhost:"+app.get('port')+"/");

io.sockets.on('connection', function (socket) {

  socket.on('load-settings',function(){
    socket.emit('settings',kernel.settings)
  })

  socket.on('update-settings',function(data){
    kernel.updateSettings(data)
    socket.emit('settings',kernel.settings)
  })

  socket.on('parse-file',function(data){
    kernel.runBGProcess(data,socket)
  })

  socket.on('browse-file',function(){
    kernel.getBinFiles(function(files){
      socket.emit('bin-files',files)
    })
  })

  socket.on('db-col-names',function(data){
    kernel.getDBCollections(data,function(cols){
      socket.emit('db-col-names-list',cols)
    })
  })

  socket.on('db-get',function(data){
    kernel.getDataFromDB(data,function(db_data){
      socket.emit(data.res,db_data)
      db_data=null
    })
  })

});

//net socket
var msg = '{"jsonrpc":"2.0","method":"sum","params":{},"id":"2"}'
console.log(msg)
var options = {
  hostname:"192.168.1.189",
  port:8383,
  path:'/',
  method:"POST",
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': msg.length
  }
}

var req =http.request(options,function(res){
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.')
  })
})

req.on('error',function(err){
  console.log("error: "+err.message)
})

req.write(msg)
req.end()

// var socket = new net.Socket()
// // var serv = net.createServer(3000)
// var PORT = 2222
// var HOST = "192.168.1.189"
//
//
// // serv.listen(3000,function(){
// //   console.log("tcp listening 3000")
// // })
// //
// // serv.on('connection',function(){
// //   console.log("someone connected")
// // })
//
// socket.connect(PORT,"192.168.1.189",function(){
//   console.log('CONNECTED TO: ' + HOST + ':' + PORT);
//   socket.write("hello")
// })
//
// socket.on('data',function(data){
//   console.log(data.toString())
// })
