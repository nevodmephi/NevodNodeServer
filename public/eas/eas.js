var socket = null
var _settings = null
var fileToParse = ""

$(document).ready(function(){})

var main = function(){
  socket = io()
  socket.on("settings",function(data){
    _settings = data
    $("#id_bin-path").html(_settings['settings']['bin-folder'])
    $("#id_save-path").html(_settings['settings']['save-folder'])
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
    console.log(result)
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
    var result = JSON.parse(data.toString())
  })
  socket.on("proc-closed",function(data){
    var result = JSON.parse(data.toString())
  })

  socket.on('bin-files',function(data){
    $('.dropdown-binfiles').html("")
    for(var i in data){
      $('.dropdown-binfiles').append('<li><a href="#" onclick="chooseBinFile(\''+data[i]+'\')">'+data[i]+'</a></li>')
    }
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
  var type = $("input[name='parser-type']:checked").val()
  var isSaveSigs = $("#id_save-sigs").is(":checked")
  var sigampl = parseInt($("#id_parser-sig-ampl").val())
  if(fileToParse.length==0 || fileToParse.slice(fileToParse.length-3,fileToParse.length) != "bin"){return;}
  socket.emit('parse-file',{proc:"node",options:{tasks:['parse','dbsave','prismatxt'],file:fileToParse,type:"200Mhz_"+type,savesigs:isSaveSigs,sigampl:sigampl}})
}

var setMode = function(mode){
  $("#id_main-menu").removeClass("active");
  $("#id_main-menu-tab").removeClass("sliding-tab-active");
  $("#id_controll").removeClass("active");
  $("#id_controll-tab").removeClass("sliding-tab-active");
  $("#id_osc").removeClass("active");
  $("#id_osc-tab").removeClass("sliding-tab-active");
  $("#id_bd").removeClass("active");
  $("#id_bd-tab").removeClass("sliding-tab-active");
  $("#id_settings").removeClass("active");
  $("#id_settings-tab").removeClass("sliding-tab-active");
  $('.main-menu-container').css('visibility','hidden');
  $('.controll-container').css('visibility','hidden');
  $('.osc-container').css('visibility','hidden');
  $('.bd-container').css('visibility','hidden');
  $('.settings-container').css('visibility','hidden');
  switch (mode) {
    case 'main-menu':
      $("#id_main-menu").addClass("active");
      $("#id_main-menu-tab").addClass("sliding-tab-active");
      $('.main-menu-container').css('visibility','visible');
      break;
    case 'controll':
      $("#id_controll").addClass("active");
      $("#id_controll-tab").addClass("sliding-tab-active");
      $('.controll-container').css('visibility','visible');
      updateControllState()
      break;
    case 'osc':
      $("#id_osc").addClass("active");
      $("#id_osc-tab").addClass("sliding-tab-active");
      $('.osc-container').css('visibility','visible');
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


//controll state
var setControllState = function(data){
  //data format: {energy:[],neutrons:[]}
	var max = 2048
	for (var i in detectors){
		var det = detectors[i].detector;
		var d = data.energy[i];
    detectors[i].energylbl.attr({text:Math.round(d)});
    detectors[i].neutronslbl.attr({text:data.neutrons[i]})
		if (d<=50){
			var val = Math.round(d*255.0/50).toString(16);
			val = val.length==1?"0"+val:val;
			det.animate({fill:"#00"+val+"FF"},500)
		} else if(d>50 && d<=100){
			var val = Math.round(255-((d-50)*255.0/50)).toString(16);
			val = val.length==1?"0"+val:val;
			det.animate({fill:"#00FF"+val},500)
		} else if(d>100 && d<=200){
			var val = Math.round((d-100)*255.0/100).toString(16);
			val = val.length==1?"0"+val:val;
			det.animate({fill:"#"+val+"FF00"},500)
		} else if(d>200){
			var val = Math.round(255-((d-200)*255.0/(max-200))).toString(16);
			val = val.length==1?"0"+val:val;
			det.animate({fill:"#FF"+val+"00"},500)
		}
	}
};
var detectors = [];
var updateControllState = function(){
  if(detectors.length!=0) { return; }
	detectors = [];
	var s = Snap("#id_svg");
	s.clear();
	var w = $("#id_svg").width(), h = $("#id_svg").height();
	var x = bw = w*0.35, bh = h*0.9, x = w*0.5-bw/2, y = h*0.05;
	var colorLegend = s.rect(w*0.9,h*0.5-125,50,250,20);
	colorLegend.attr({stroke:"#000",strokeOpacity:1,strokeWidth:0,
		fill:"l(0,1,0,0)#0000FF-#00FFFF-#00FF00-#FFFF00-#FF0000"
	});
	var bl1 = s.text(colorLegend.getBBox().x+colorLegend.getBBox().w+10,colorLegend.getBBox().y+colorLegend.getBBox().h*0.05,"2047").attr({fontWeight:200})
	var bl2 = s.text(colorLegend.getBBox().x+colorLegend.getBBox().w+10,colorLegend.getBBox().y+colorLegend.getBBox().h*0.25,"200").attr({fontWeight:200})
	var bl3 = s.text(colorLegend.getBBox().x+colorLegend.getBBox().w+10,colorLegend.getBBox().y+colorLegend.getBBox().h*0.5,"100").attr({fontWeight:200})
	var bl4 = s.text(colorLegend.getBBox().x+colorLegend.getBBox().w+10,colorLegend.getBBox().y+colorLegend.getBBox().h*0.75,"50").attr({fontWeight:200})
	var bl1 = s.text(colorLegend.getBBox().x+colorLegend.getBBox().w+10,colorLegend.getBBox().y+colorLegend.getBBox().h*0.99,"0").attr({fontWeight:200})

	var border = s.rect(x,y,bw,bh,20);
  var borderinfo = s.rect(x,y+bh*0.85,bw,bh*0.15,20).attr({fill:"white",fillOpacity:0.8,stroke:"black",strokeWidth:3});
	var name = s.text(x+bw/2,y+bh*0.05,"1 кластер (корп. 47б)").attr({fontSize:20,textAnchor:"middle",fontWeight:300});
	var grid = [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
	var j=1,k=1,gw=bw+200,gh=bh;
	for (var i in grid){
		grid[i][0]=x-100+(gw/4)*k;
		grid[i][1]=y-20+(gh/5)*j;
		j++;
		if (j>4){k++;}
		j = j>4?1:j;
	}
	for (var i in grid){
		var detector = s.circle(grid[i][0],grid[i][1],25);
		detector.attr({fill:"#fff",stroke:"#000",strokeWidth:2});
    var n = s.circle(detector.getBBox().x-3,detector.getBBox().y-10,12).attr({fill:"black",fillOpacity:0.5});
    var u = s.circle(detector.getBBox().x-8,detector.getBBox().y-13,5).attr({fill:"red",fillOpacity:0.5});
    var d1 = s.circle(detector.getBBox().x+2,detector.getBBox().y-13,5).attr({fill:"blue",fillOpacity:0.5});
    var d2 = s.circle(detector.getBBox().x-3,detector.getBBox().y-5,5).attr({fill:"blue",fillOpacity:0.5});
    var energy = s.text(detector.getBBox().x+25,detector.getBBox().y+29,"0").attr({"text-anchor":"middle"})
    var neutrons = s.text(detector.getBBox().x+20,detector.getBBox().y-6,"0").attr({"text-anchor":"middle"})
    var det = {detector:detector,energylbl:energy,neutronslbl:neutrons};
		detectors.push(det);
	}
  var p = s.path("M10-5-10,15M15,0,0,15M0-5-20,15").attr({fill: "none",stroke: "#bada55",strokeWidth: 5});
  p = p.pattern(0, 0, 10, 10);
  border.attr({fill: p,stroke: "#000",fillOpacity:0.7,strokeWidth: 3});

};
