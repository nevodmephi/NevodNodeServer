const express = require("express");
const nevod = require("nevod");
var io = require("socket.io");

const task = (process.env.TASK || "neutron")
if(task != "eas" && task != "neutron" && task != "all"){
  console.log(task+" - is unkown task environment variable, use ONLY: 'eas' or 'neutron' or 'all' for TASK ")
  process.exit()
}

var kernel = nevod.initServerKernel(task)

//http server
var app = express();
const port = (process.env.PORT || 80);
app.set('port',port);
app.use(express.static(__dirname + '/public/'));
app.get('/', function(req,res){
	res.sendFile(__dirname + '/public/'+task+'/'+task+'.html');
});
var server = app.listen(app.get('port'),function(){})
var io = io.listen(server);
kernel.io = io

console.log("Node app started, HTTP server: @ https://localhost:"+app.get('port')+"/");

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
    // kernel.mongo.getDBCollections(data,function(cols){
    //   socket.emit('db-col-names-list',cols)
    // })
  })

  socket.on('db-get',function(data){
    // kernel.mongo.getDataFromDB(data,function(db_data){
    //   socket.emit(data.res,db_data)
    //   db_data=null
    // })
  })

});

//net socket
// var msg = '{"jsonrpc":"2.0","method":"maxz","params":{"first":2,"second":3},"id":"2"}'
// console.log(msg)
// var options = {
//   hostname:"192.168.1.189",
//   port:8383,
//   path:'/',
//   method:"POST",
//   headers: {
//     'Content-Type': 'application/x-www-form-urlencoded',
//     'Content-Length': msg.length
//   }
// }
//
// var req =http.request(options,function(res){
//   console.log(`STATUS: ${res.statusCode}`);
//   console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
//   res.setEncoding('utf8');
//   res.on('data', (chunk) => {
//     console.log(`BODY: ${chunk}`);
//   });
//   res.on('end', () => {
//     console.log('No more data in response.')
//   })
// })
//
// req.on('error',function(err){
//   console.log("error: "+err.message)
// })
//
// req.write(msg)
// req.end()

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
