var socket = null
var _settings = null
var fileToParse = ""

$(document).ready(function(){})

var main = function(){
  $( ".info" ).tooltip();
  $(".oscs-choose-button").tooltip({position:{ my:"right-20 top-50"}});
  initOsc()
  socket = io()
  socket.on("settings",function(data){
    _settings = data
    $("#id_bin-path").html(_settings['settings']['bin-folder'])
    $("#id_save-path").html(_settings['settings']['save-folder'])
    $("#id_watching-path").html(_settings['settings']['watching-folder'])
  })
  socket.emit("load-settings")

  socket.on("proc-finished-success",function(data){
    var result = JSON.parse(data.toString())
    $('#'+result["pid"]+' .progress-bar').addClass("progress-bar-success")
    $('#'+result["pid"]+' .progress-bar').attr("aria-valuenow","100%")
    $('#'+result["pid"]+' .progress-bar').css("width","100%")
    $('#'+result["pid"]+' .progress-bar').html("100%")
  })
  socket.on("proc-run",function(data){
    var result = JSON.parse(data.toString())
    $("#id_no-procs").css('display','none')
    $(".parser-tbody").append('<tr class="parser-table"id="'+result["pid"]+'">'+
                                '<td style="width:20%">'+result["filename"]+'</td><td style="width:45%">'+
                                  '<div class="progress">'+
                                    '<div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%; min-width:3em;">'+
                                      '0%'+
                                    '</div>'+
                                  '</div>'+
                                '</td><td>-</td><td>'+result["type"]+'</td><td class="ram-info">-</td><td><div class="btn-group btn-group-xs" role="group" aria-label="..."><button type="button" class="btn btn-danger">x</button></div></td></tr>')
  })
  socket.on("proc-ram",function(data){
    var result = JSON.parse(data.toString())
    $('#'+result["pid"]+' .ram-info').html(result["ram"])
  })
  socket.on("proc-status",function(data){
    var result = JSON.parse(data.toString())
    $('#'+result["pid"]+' .progress-bar').attr("aria-valuenow",result["value"])
    $('#'+result["pid"]+' .progress-bar').css("width",result["value"]+"%")
    $('#'+result["pid"]+' .progress-bar').html(result["value"]+"%")
  })
  socket.on("proc-error",function(data){
    // var result = JSON.parse(data.toString())
  })
  socket.on("proc-closed",function(data){
    var result = JSON.parse(data.toString())
  })

  socket.on('bin-files',function(data){
    $('.dropdown-binfiles').html("")
    for(var i in data){
      $('.dropdown-binfiles').append('<li><a onclick="chooseBinFile(\''+data[i]+'\')">'+data[i]+'</a></li>')
    }
  })

  socket.on('db-col-names-list',function(data){
    $('.dropdown-oscs-files').html("")
    if(data.length==0){
      $('.dropdown-oscs-files').append('<li class="dropdown-header">Нет доступных осциллограм</li>')
    } else {
      $('.dropdown-oscs-files').append('<li class="dropdown-header">Осциллограмы</li>')
      for(var i in data){
        $('.dropdown-oscs-files').append('<li><a onclick="getOscsFromDB(\''+data[i]+'\')">'+data[i]+'</a></li>')
      }
    }
  })

  socket.on('data-view',function(data){
    console.log(data)
    var signals = []
    for(var i in data){
      signals.push(data[i].signal)
    }
    plotList(signals,[],['x','y'],'lines')
  })
}

var changeSettings = function(setting,elem){
  if(elem.val().length==0){
    return
  }
  socket.emit('update-settings',[{field:setting,val:elem.val()}])
}

var browseFiles = function(){
  socket.emit('browse-file')
}

var chooseBinFile = function(file){
  fileToParse = file
  $(".bin-name").html("")
  $(".bin-name").html(file)
  $(".begin-parse").removeClass("btn-warning")
  $(".begin-parse").addClass("btn-success")
}

var parseFile = function(){
  var isSaveSigs = $("#id_save-sigs").is(":checked")
  if(fileToParse.length==0 || fileToParse.slice(fileToParse.length-3,fileToParse.length) != "bin"){return;}
  socket.emit('parse-file',{proc:"node",options:{tasks:['parse','dbsave','showPercent'],file:fileToParse,savesigs:isSaveSigs,chiptype:182}})
}

var setMode = function(mode){
  $("#id_main-menu").removeClass("active");
  $("#id_main-menu-tab").removeClass("sliding-tab-active");
  $("#id_osc").removeClass("active");
  $("#id_osc-tab").removeClass("sliding-tab-active");
  $("#id_bd").removeClass("active");
  $("#id_bd-tab").removeClass("sliding-tab-active");
  $("#id_settings").removeClass("active");
  $("#id_settings-tab").removeClass("sliding-tab-active");
  $('.main-menu-container').css('visibility','hidden');
  $('.osc-container').css('visibility','hidden');
  $('.bd-container').css('visibility','hidden');
  $('.settings-container').css('visibility','hidden');
  $('.osc-navbar').css('visibility','hidden');
  switch (mode) {
    case 'main-menu':
      $("#id_main-menu").addClass("active");
      $("#id_main-menu-tab").addClass("sliding-tab-active");
      $('.main-menu-container').css('visibility','visible');
      break;
    case 'osc':
      $("#id_osc").addClass("active");
      $("#id_osc-tab").addClass("sliding-tab-active");
      $('.osc-container').css('visibility','visible');
      $('.osc-navbar').css('visibility','visible');
      break;
    case 'bd':
      $("#id_bd").addClass("active");
      $("#id_bd-tab").addClass("sliding-tab-active");
      $('.bd-container').css('visibility','visible');
      break;
    case 'settings':
      $("#id_settings").addClass("active");
      $("#id_settings-tab").addClass("sliding-tab-active");
      $('.settings-container').css('visibility','visible');
      break;
    default:
    console.log("wrong mode")
  }
}

function showSavedOscs(){
  var handler = function(){
    $(".oscs-choose-button").removeClass("oscs-choose-button-clicked")
    $(document).unbind('click',handler)
  }
  if($(".oscs-choose-button").attr("aria-expanded")=="false"){
    $(".oscs-choose-button").addClass("oscs-choose-button-clicked")
    $(document).bind('click',handler)
  } else {
    $(document).unbind('click',handler)
    $(".oscs-choose-button").removeClass("oscs-choose-button-clicked")
  }
  socket.emit('db-col-names',{startsWith:"waveforms_"})
}

function getOscsFromDB(file){
  socket.emit('db-get',{res:"data-view",collection:file,query:{"neutron":true,"neutronDW":true,'channel':"10"},sorting:{},projection:{signal:1,_id:0}})
}

function initOsc() {
	var options = {grid:{backgroundColor:"white"}};
    oscScreen = $.plot($(".oscilloscope"), [[0,0]], options);
}

var plotList = function(data,legendName,axesName,graphType){
    var plot_data = [];
    for (var i=0;i<data.length;i++) {
        var pd = data[i];
        if(!Array.isArray(pd[0])) {
            var newData = [];
            for (j=0;j<pd.length;j++){
                newData.push([j+1,pd[j]]);
            }
            plot_data.push({label:legendName[i],data:newData});
        } else { plot_data.push({label:legendName[i],data:pd}); }
    }
    data=[];
    var options = {grid:{backgroundColor:"white"}};
    if (legendName.length!=0){
        options.legend = {
            show:true,
            labelBoxBorderColor:"black",
            position:"ne",
            backgroundColor: "gray",
            backgroundOpacity: 0.5,
            noColumns: 1
        };
    }
    if(axesName.length!=0){
        options.axisLabels = {show:true};
        options.xaxes = [{axisLabel:axesName[0]}];
        options.yaxes = [{axisLabel:axesName[1]}];
    }
    switch (graphType) {
        case "dots":
            options.series = {points: {show: true,radius: 5}};
            break;
        case "dotsLines":
            options.series = {points: {show: true, radius: 5},lines: {show:true}};
            break;
        case "lines":
            options.series = {lines: {show:true}};
            break;
        case "bar":
            options.series = { bars: { show: true } };
            break;
        default:
            options.series = {lines: {show:true}};
            break;
    }
    oscScreen = $.plot($(".oscilloscope"), plot_data, options);
};
