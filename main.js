const express = require("express");
const nevod = require("nevod");
var io = require("socket.io");

process.on('uncaughtException', function (err) {
	console.error((new Date).toUTCString() + ' uncaughtException:', err)
	process.exit(1)
})

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
app.use(express.static(__dirname + '/public/'+task));

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
		kernel.mongo.getDBCollections(data,function(cols){
			socket.emit('db-col-names-list',cols)
		})
	})

	socket.on('db-get',function(data){
		kernel.mongo.findDocsInDb(data.collection,data.query,{},{},function(db_data){
			socket.emit(data.res,db_data)
			db_data=null
		})
	})

});
