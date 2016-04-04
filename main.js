var io = require("socket.io"),
    express = require("express")

const task = (process.env.TASK || "eas")
if(task != "eas" && task != "neutron"){
  console.log(task+" - is unkown task environment variable, use ONLY: 'eas' or 'neutron' for TASK ")
  process.exit()
}
const kernel = require("./modules/kernel.js")
kernel.init(task)
kernel.load()

//http server
var app = express();
const port = (process.env.PORT || 80);
app.set('port',port);
app.use(express.static(__dirname + '/public/'+task));
app.get('/', function(req,res){
	res.sendFile(__dirname + '/public/'+task+'/'+task+'.html');
});
var server = app.listen(app.get('port'),function(){})
var io = io.listen(server);
kernel.io = io

console.log(task+" server started @ http://localhost:"+app.get('port')+"/");

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
