const express = require("express");
const fs = require("fs");
const https = require("https");
const net = require("net");
const bodyParser  = require('body-parser');
const jwt = require('jsonwebtoken');
const kernel = require("./modules/kernel.js");
var io = require("socket.io");

const key  = fs.readFileSync('./security/nevod-key.pem');
const cert = fs.readFileSync('./security/nevod-cert.pem');
var token_secret = "nevod11secret22key8-0-$0"
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
const port = (process.env.PORT || 3000);
const https_server = https.createServer(https_options,app).listen(port);
app.set('port',port);
app.use(express.static(__dirname + '/public/'));
app.get('/', function(req,res){
  console.log('get')
	res.sendFile(__dirname + '/public/index.html');
});

var router = express.Router()
router.get('/',function(req,res){
  res.json({ message: 'Welcome to the coolest API on earth! Oops you might be waiting for something else.' });
})
router.post('/authenticate',function(req,res){
  var token = jwt.sign(req.body,token_secret,{
    exexpiresInMinutes: 1440
  })
  res.json({success: true,token: token});
})
app.use('/api',router)
// var server = app.listen(app.get('port'),function(){})
var io = io.listen(https_server);
kernel.io = io

// console.log(task+" server started @ http://localhost:"+app.get('port')+"/");

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


//net server-client
