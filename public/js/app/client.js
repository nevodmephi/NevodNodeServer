var socket;

var selectedConnection;
var instance;

var curConnection;

var curid=0;

var plot;
var oscScreen;
var oscBuf = [];
var oscRec = false;

var oscPlay = true;
var logPlay = true;

var deadSchemes = 0;
var warningSchemes = 0;
var normalSchemes = 0;

var colors = ["#FF6600", "#330099", "#FFCC00", "#CC0000", "#339900", "#CC3333", "#996600", "#CC00FF", "#0066CC","#6600CC","#FF6699","#00CC99","#FF6666","#666699","#CCFF33","#999966"];
var colorIt = -1;

var clientsCount=0;

function initjsPlumb() {
    instance = jsPlumb.getInstance({
        Endpoint: ["Dot", {radius: 1}],
        HoverPaintStyle: {strokeStyle: "#ffa500", lineWidth: 2 },
        ConnectionOverlays: [
            [ "Arrow", {
                location: 1,
                id: "arrow",
                length: 14,
                foldback: 0.9
            } ],
            [ "Label", { label: "", id: "label", cssClass: "aLabel" }]
        ],
        Container: "statemachine-demo"
    });
    window.jsp = instance;
    var windows = jsPlumb.getSelector(".statemachine-demo .w");
    instance.bind("click", function (c) {
        var f = "";
        var t = "";
        $('#inputsFrom').html('');
        $('#inputsTo').html('');
        /*
document.getElementById("inputsFrom").innerHTML = "";
        document.getElementById("inputsTo").innerHTML = "";
*/
        switch(c.source._type) {
            case 2:
                f += formStr("f","<b>q<sub>1</sub>(t)</b>, кАЦП");
                f += formStr("f","<b>q<sub>2</sub>(t)</b>, кАЦП");
                f += formStr("f","<b>q<sub>3</sub>(t)</b>, кАЦП");
                break;
            case 4:
                f += formStr("f","<b>q<sub>1</sub>(t)</b>, кАЦП");
                f += formStr("f","<b>q<sub>2</sub>(t)</b>, кАЦП");
                f += formStr("f","<b>q<sub>3</sub>(t)</b>, кАЦП");
                break;
            case 3:
                f += formStr("t","<b>N(q)</b>, событий");
                f += formStr("t","<b>n(q)</b>, %");
                f += formStr("t","<b>n(q)</b>, 1/1000");
                break;
            case "SRC":
                f += formStr("f","Event");
                break;
            case "FIL":
                f += formStr("f","Event");
                break;
        }
        $('#inputsFrom').html(f);
/*         document.getElementById("inputsFrom").innerHTML = f; */
        switch(c.target._type) {
            case 2:
                t += formStr("f","<b>q<sub>1</sub>(t)</b>, кАЦП");
                t += formStr("f","<b>q<sub>2</sub>(t)</b>, кАЦП");
                t += formStr("f","<b>q<sub>3</sub>(t)</b>, кАЦП");
                break;
            case 4:
                f += formStr("f","<b>S<sub>1</sub>(t)</b>, синхр");
                f += formStr("f","<b>S<sub>2</sub>(t)</b>, синхр");
                f += formStr("f","<b>S<sub>3</sub>(t)</b>, синхр");
                break;
            case 3:
                t += formStr("f","<b>q<sub>1</sub>(t)</b>, кАЦП");
                t += formStr("f","<b>q<sub>2</sub>(t)</b>, кАЦП");
                t += formStr("f","<b>q<sub>3</sub>(t)</b>, кАЦП");
                break;
            case "SRC":
                break;
            case "FIL":
                break;
        }
        $('#inputsTo').html(t);
/*         document.getElementById("inputsTo").innerHTML = t; */
        var l = c.getOverlay('label').getLabel();
        if(l!="not set") {
        	$('#f-' + l.split(" ")[0]).addClass('active');
        	$('#t-' + l.split(" ")[2]).addClass('active');
           /*
 document.getElementById("f-" + l.split(" ")[0]).className += " active";
            document.getElementById("t-" + l.split(" ")[2]).className += " active";
*/
        }
        $('#connectionSettings').modal('show');
        curConnection = c;
    });
    instance.bind("connection", function (info) {
        info.connection.getOverlay('label').setLabel("not set");
    });
    instance.batch(function () {
        instance.makeSource(windows, {
            filter: ".ep",
            anchor: "Continuous",
            connector: [ "StateMachine", { curviness: 1 } ],
            connectorStyle: { strokeStyle: "#ffa500", lineWidth: 2, outlineColor: "transparent", outlineWidth: 10 },
            maxConnections: 5,
            onMaxConnections: function (info, e) {
                alert("Maximum connections (" + info.maxConnections + ") reached");
            }
        });
        instance.makeTarget(windows, {
            dropOptions: { hoverClass: "dragHover" },
            anchor: "Continuous",
            allowLoopback: true
        });
    });
    jsPlumb.fire("jsPlumbDemoLoaded", instance);
}

function formStr(t, name) {
    return ('<label class="btn btn-default btn-sm ' + t + '-input' + '" id="' + t + '-' + name + '"><input type="radio" name="options" autocomplete="off">' + name + '</label>');
}

function deleteConnection() {
    jsPlumb.detach(curConnection);
}

function setConnection() {
    var from; var to;
    $( ".btn.btn-warning.f-input.active" ).each(function(i,o) {
        from = o.id.split("-")[1];
    });
    $( ".btn.btn-warning.t-input.active" ).each(function(i,o) {
        to = o.id.split("-")[1];
    });
    if((from!=undefined)&&(to!=undefined)) {
        curConnection.getOverlay('label').setLabel(from + " &rarr; " + to);
    }
}

function newBlock(type) {
    var newAddon = document.createElement('div');
    newAddon.className = "w";
    newAddon.id = "block" + curid;
    newAddon._flag = true;
    newAddonPanel = document.createElement('div');
    newAddonPanel.className = "panel panel-default";
    newAddonPanelHeading = document.createElement('div');
    newAddonPanelSettingsButton = document.createElement('button');
    newAddonPanelDeleteButton = document.createElement('button');
    newAddonPanelHeading.className = "panel-heading";

    newAddonPanelHeadingButton = document.createElement('button');
    newAddonPanelHeadingButton.className = "ep btn btn-default btn-xs";
    newAddonPanelHeadingButton.innerHTML = "↰";
    newAddonPanelSettingsButton.className = "btn btn-default btn-xs";
    newAddonPanelSettingsButton.innerHTML = "<span class='glyphicon glyphicon-cog'></span>";
    newAddonPanelDeleteButton.className = "btn btn-default btn-xs pull-right";
    newAddonPanelDeleteButton.innerHTML = "<span class='glyphicon glyphicon-remove'></span>";
    //newAddon.innerHTML = '<div class="panel panel-default"><div class="panel-heading"><button class="ep btn btn-warning btn-xs"><span class="ep glyphicon glyphicon-flash"></span></button>&nbsp;<a target="_blank" href="' + data.url + '"><button class="btn btn-primary btn-xs"><span class="glyphicon glyphicon-fullscreen"></span></button></a>&nbsp; ' + data.title + '<button onclick="$(\'#addonSettingsDialog\').modal({show: true});" class="btn btn-danger btn-xs pull-right"><span class="glyphicon glyphicon-wrench"></span></button></div><div class="panel-body"><div id="' + data.id + '-canvas" style="width:' + data.width + 'px;height:' + data.height + 'px;"></div></div></div>';
    newAddonPanelHeadingHeader = document.createElement('span');
    newAddonPanelHeadingHeader.className = "header";
    newAddonPanelHeadingHeader.id = "block" + curid + "-header";
    newAddonPanelHeadingHeader.style.color = "#fff";

    var hd;
    var ap; var bp; var gp;

    newAddonPanelHeadingFile = document.createElement('input');
    newAddonPanelHeadingFile.type = "file";
    newAddonPanelHeadingFile.style.visibility = "hidden";
    newAddonPanelHeadingFile.className = "file-input";
    newAddonPanelHeadingFile.title = "block" + curid;
    newAddonPanelHeadingFile.setAttribute("onchange","readSingleFile(event,this)");

    newAddonPanelHeadingHeader.innerHTML = "VOID";

    newAddonPanelHeading.appendChild(newAddonPanelHeadingButton);
    newAddonPanelHeading.appendChild(newAddonPanelSettingsButton);
    newAddonPanelHeading.appendChild(newAddonPanelDeleteButton);
    newAddonPanelHeading.appendChild(newAddonPanelHeadingFile);
    newAddonPanelHeading.appendChild(newAddonPanelHeadingHeader);

    newAddonPanel.appendChild(newAddonPanelHeading);

    newAddon.style.left = document.body.scrollLeft + window.innerWidth/2 - 300/2 + getRandomInt(-25,25) +"px";
    newAddon.style.top = document.body.scrollTop + window.innerHeight*0.6 + getRandomInt(-25,25) + "px";

    newAddon.style.width = 25 + "em";
    newAddon.style.height = 8 + "em";

    newAddon.appendChild(newAddonPanel);

    var newAddonEditor = document.createElement('div');
    newAddonEditor.id = "block" + curid + "-editor";

    newAddonPanel.appendChild(newAddonEditor);

    $('#statemachine-demo').append(newAddon);

    if(type=="file") $(newAddonPanelHeadingFile).trigger('click');

    newAddonEditor._dom = new Object();
    newAddonEditor._dom = new ace.edit("block" + curid + "-editor");
    newAddonEditor._dom._mode = false;
    newAddonEditor._dom.setTheme("ace/theme/xcode");
    newAddonEditor._dom.getSession().setMode("ace/mode/javascript");
    newAddonEditor.style.width = "1em";
    newAddonEditor.style.height = "1em";

    if(type!="file") {
        getBlock(type,"block" + curid + "-editor");
    }

    newAddonEditor.style.visibility = "hidden";

    newAddonEditor._dom.setOptions({
	    fontFamily: "Consolas",
        fontSize: "14px",
        showLineNumbers: false,
        wrapBehavioursEnabled: false
    });

    window.jsp = instance;
    var windows = jsPlumb.getSelector("#" + "block" + curid);
    instance.draggable(windows);
    instance.batch(function () {
        instance.makeSource(windows, {
            filter: ".ep",
            anchor: "Continuous",
            connector: [ "StateMachine", { curviness: 1 } ],
            connectorStyle: { strokeStyle: "#ffa500", lineWidth: 2, outlineColor: "transparent", outlineWidth: 10 },
            maxConnections: 5,
            onMaxConnections: function (info, e) {
                alert("Maximum connections (" + info.maxConnections + ") reached");
            }
        });
        instance.makeTarget(windows, {
            dropOptions: { hoverClass: "dragHover" },
            anchor: "Continuous",
            allowLoopback: true
        });
            jsPlumb.fire("jsPlumbDemoLoaded", instance);
    });
    jsPlumb.fire("jsPlumbDemoLoaded", instance);

    newAddonPanelDeleteButton.setAttribute('onclick','jsPlumb.detachAllConnections("block' + curid + '");jsPlumb.empty("block' + curid + '");$("#block' + curid + '").remove();');
    newAddonPanelSettingsButton.setAttribute('onclick','flipMode(document.getElementById("block' + curid + '-editor"),document.getElementById("block' + curid + '"))');
    curid++;
}

function getBlock(f,d) {
    socket.emit('get-block',{name: f,id: d});
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
    oscScreen = $.plot($("#oscilloscope"), plot_data, options);
};

function readSingleFile(t,sender) {
  var file = t.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
    document.getElementById(sender.title + "-editor")._dom.setValue(contents);
    document.getElementById(sender.title + "-header").innerHTML = t.target.value.split("\\").join("/").split("/")[t.target.value.split("\\").join("/").split("/").length-1].toUpperCase().split(".JS").join("");
  };
  reader.readAsText(file);
}

function flipMode(o,b) {
    editor = o._dom;
    if(editor._mode == false) {
        o.style.visibility = "visible";
        o.style.width = "43em";
        o.style.height = "33em";
        b.style.width = "60em";
        b.style.height = "51em";
    } else {
        o.style.visibility = "hidden";
        o.style.width = "1em";
        o.style.height = "1em";
        b.style.width = "25em";
        b.style.height = "8em";
        /*editor._settings = editor.getValue();
        editor.setTheme("ace/theme/clouds");
        editor.getSession().setMode("ace/mode/javascript");
        editor.setOptions({
            fontSize: "8pt"
        });*/
    }
    editor.resize();
    editor._mode = !editor._mode;
}

function bufToString(b) {
    var r = "";
    for(var i in b) {
        r += String.fromCharCode(b[i]);
    }
    return r;
}

function main() {
  var schemeDiv = $('#statemachine-demo'); //document.getElementById("statemachine-demo");
  socket = io();
  socket.on('event', function (data) {
    if(data.data.length == 4) {
    	$('#' + data.ip + "-prefix").html(bufToString(data.data));
/*         document.getElementById(data.ip + "-prefix").innerHTML = bufToString(data.data); */
    } else {
        showEvent(data.data,data.id);
    }
    $('#' + data.ip + "-row").addClass('info');
/*     document.getElementById(data.ip + "-row").className = "info"; */
    setTimeout(function() {
    	$('#' + data.ip + "-row").addClass('success');
/*         document.getElementById(data.ip + "-row").className = "success";         */
    }, 50);
  });
  socket.on('client', function(data) {
  	$('#clients').append('<tr id="' + data.ip + '-row" class="success"><td>' + data.ip + '</td><td id="' + data.ip + '-prefix"></td><td id="' + data.ip + '-state">ok</td><td><button type="button" class="btn btn-default btn-xs" data-toggle="button" aria-pressed="false" autocomplete="off">экран</button><button type="button" class="btn btn-default btn-xs" data-toggle="button" aria-pressed="false" autocomplete="off">звук</button></td><td><button type="button" class="btn btn-default btn-xs" onclick="installScheme(\'' + data.ip + '\')"><span class="glyphicon glyphicon-upload"></span></button></td></tr>');
    clientsCount++;
    updateClientsCount();
    /* document.getElementById('clients').innerHTML += '<tr id="' + data.ip + '-row" class="success"><td>' + data.ip + '</td><td id="' + data.ip + '-prefix"></td><td id="' + data.ip + '-state">ok</td><td><button type="button" class="btn btn-default btn-xs" data-toggle="button" aria-pressed="false" autocomplete="off">экран</button><button type="button" class="btn btn-default btn-xs" data-toggle="button" aria-pressed="false" autocomplete="off">звук</button></td><td><button type="button" class="btn btn-default btn-xs" onclick="installScheme(\'' + data.ip + '\')"><span class="glyphicon glyphicon-upload"></span></button></td></tr>'; */
  });
  socket.on('blocks', function(data) {
    document.getElementById("blocks-menu").innerHTML = "";
    for(var i in data) {
        document.getElementById("blocks-menu").innerHTML +='<li><a href="#" onclick="newBlock(\'' +  data[i] + '\')">' + data[i] + '</a></li>';
    }
    document.getElementById("blocks-menu").innerHTML += '<li role="separator" class="divider"></li>';
    document.getElementById("blocks-menu").innerHTML += '<li><a href="#" onclick="newBlock(\'file\')"><span class="glyphicon glyphicon-floppy-open" aria-hidden="true"></span>&nbsp;&nbsp;Из файла</a></li>'

  });
  socket.on('block', function(data) {
    //alert([data.text,data.id])
    document.getElementById(data.id)._dom.setValue(data.text);
    document.getElementById(data.id.split("-editor").join("-header")).innerHTML = data.title.toUpperCase().split(".JS").join("");

  })

    socket.on('handshake',function(data) {
        deadSchenes = 0;
        warningSchemes = 0;
        for(var i in data) {
            switch(data[i].status) {
                case "dead":
                    deadSchemes++;
                    break;
                case "unstable working":
                    warningSchemes++;
                    break;
                default:
                    normalSchemes++;
                    break;
            }
            $('#clients').append('<tr class="scheme-status-string scheme-' + data[i].name +'"><td class="scheme-status-string"><button class="btn btn-link btn-xs download-scheme-' + data[i].name + '" onclick="downloadScheme(\'' + data[i].name + '\')">' + data[i].name + '</button><td><td id="scheme-status-' + data[i].name + '">installed</td><td><div class="btn-group" data-toggle="buttons"><label class="btn btn-default btn-xs active stop-scheme-' + data[i].name + '" onclick="stopScheme(\'' + data[i].name + '\')"><input type="radio" autocomplete="off" checked><span class="glyphicon glyphicon-stop" aria-hidden="true"></span></label>&nbsp;<label class="btn btn-default btn-xs pause-scheme-' + data[i].name + '" onclick=""><input type="radio" autocomplete="off"><span class="glyphicon glyphicon-pause" aria-hidden="true"></span></label>&nbsp;<label class="btn btn-default btn-xs play-scheme-' + data[i].name + '" onclick="playScheme(\'' + data[i].name + '\')"><input type="radio" autocomplete="off" checked><span class="glyphicon glyphicon-play" aria-hidden="true"></span></label></div></td><td><button onclick="removeScheme(\'' + data[i].name + '\')" class="btn btn-xs btn-danger"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button></td></tr>');
        }
        updateStatus();
    })

    socket.on('scheme-installed', function(data) {
        $('#clients').append('<tr class="scheme-status-string scheme-' + data.name +'"><td class="scheme-status-string"><button class="btn btn-link btn-xs download-scheme-' + data.name + '" onclick="downloadScheme(\'' + data.name + '\')">' + data.name + '</button><td><td id="scheme-status-' + data.name + '">installed</td><td><div class="btn-group" data-toggle="buttons"><label class="btn btn-default btn-xs active stop-scheme-' + data.name + '" onclick="stopScheme(\'' + data.name + '\')"><input type="radio" autocomplete="off" checked><span class="glyphicon glyphicon-stop" aria-hidden="true"></span></label>&nbsp;<label class="btn btn-default btn-xs pause-scheme-' + data.name + '" onclick=""><input type="radio" autocomplete="off"><span class="glyphicon glyphicon-pause" aria-hidden="true"></span></label>&nbsp;<label class="btn btn-default btn-xs play-scheme-' + data.name + '" onclick="playScheme(\'' + data.name + '\')"><input type="radio" autocomplete="off" checked><span class="glyphicon glyphicon-play" aria-hidden="true"></span></label></div></td><td><button onclick="removeScheme(\'' + data.name + '\')" class="btn btn-xs btn-danger"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button></td></tr>');
        normalSchemes++;
    });

    socket.on('scheme-ran', function(data) {
        document.getElementById('scheme-status-' + data.name).innerHTML = data.status;
        switch(data.status) {
            case "stable working":
                $(".scheme-" + data.name).removeClass("danger");
                $(".scheme-" + data.name).removeClass("warning");
                $(".scheme-" + data.name).removeClass("success");
                $(".scheme-" + data.name).addClass("info");
                break;
            case "unstable working":
                $(".scheme-" + data.name).removeClass("danger");
                $(".scheme-" + data.name).removeClass("success");
                $(".scheme-" + data.name).addClass("info");
                $(".scheme-" + data.name).addClass("warning");
                warningSchemes++;
                break;
        }
        $(".play-scheme-" + data.name).button('toggle');
    })

    socket.on('scheme-dead', function(data) {
        document.getElementById('scheme-status-' + data.name).innerHTML = "<span title='" + data.error + "'>dead</span>";
        $(".scheme-" + data.name).removeClass("warning");
        $(".scheme-" + data.name).removeClass("success");
        $(".scheme-" + data.name).addClass("danger");
        $(".stop-scheme-" + data.name).button('toggle');
        deadSchemes++;
        updateStatus();
    })

    socket.on('scheme-stopped', function(data) {
        document.getElementById('scheme-status-' + data.name).innerHTML = "stopped";
        $(".scheme-" + data.name).removeClass("warning");
        $(".scheme-" + data.name).removeClass("success");
        $(".scheme-" + data.name).removeClass("info");
        $(".stop-scheme-" + data.name).button('toggle');
    })

    socket.on('scheme-removed', function(data) {
        if(document.getElementById('scheme-status-' + data.name).innerHTML == "dead") deadSchemes--;
        if(document.getElementById('scheme-status-' + data.name).innerHTML == "unstable working") warningSchemes--;
        $('.scheme-' + data.name).each(function (idx, elem) {
            $(elem).remove();
        });
    })

    socket.on('scheme-wrong', function(data) {
        alert("ошибка установки схемы "+ 0);
    })

    socket.on('quick-view', function(data) {
      plotList(data.data,data.legend,data.axes,data.type)
    })

    socket.on('controll-state',function(data){
      setControllState(data.data);
    })
}

function getRandomInt(min, max)
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateStatus() {
    if(warningSchemes>0) {
        document.getElementById("schemesStatus").innerHTML = "Схемы!";
        document.getElementById("schemesStatus").className = "btn navbar-btn  btn-warning";
    }
    if(deadSchemes>0) {
        document.getElementById("schemesStatus").innerHTML = "Схемы!";
        document.getElementById("schemesStatus").className = "btn navbar-btn  btn-danger";
        return 0;
    }
    document.getElementById("schemesStatus").innerHTML = "Схемы";
    document.getElementById("schemesStatus").className = "btn navbar-btn  btn-success";
}

function parseScheme() {
    var scheme = new Object();
    var blocksNumber=0;
    var connections = [];
    var blocks = [];
    $.each(instance.getConnections(), function (idx, connection) {
        connections.push({
            from: connection.sourceId,
            to: connection.targetId
        });
    });
    $("#statemachine-demo .w").each(function (idx, elem) {
        blocksNumber++;
        var $elem = $(elem);
        blocks.push({id: elem.id, code: document.getElementById(elem.id + "-editor")._dom.getValue()});
    });
    for(var j in blocks) {
        blocks[j].connects = [];
    }
    for(var i in connections) {
        for(var j in blocks) {
            if(connections[i].from == blocks[j].id) {
                blocks[j].connects.push(connections[i].to);
            }
        }
    }
    scheme.blocks = blocks;
    scheme.name = document.getElementById('schemeName').value;
    return scheme;
}

function getBlocks() {
    socket.emit("get-blocks");
}

function downloadScheme(name) {
    // cgh
}

function checkSchemeName(n) {
    var flag = false;
    $('.scheme-status-string').each(function (idx, elem) {
        if(n==elem.innerHTML) {
            document.getElementById("schemeInstallButton").innerHTML = "Обновить схему";
            flag = true;
        }
    });
    if (flag==false) document.getElementById("schemeInstallButton").innerHTML = "Установить схему";
    return false;
}

function installScheme(a) {
    socket.emit('scheme-install',{scheme: parseScheme(), ip: a});
}

function removeScheme(a) {
    socket.emit('scheme-remove',{name: a});
}

function playScheme(a) {
    socket.emit('scheme-run',{name: a});
}

function stopScheme(a) {
    socket.emit('scheme-stop',{name: a});
}

function initOsc() {
	var options = {grid:{backgroundColor:"white"}};
    oscScreen = $.plot($("#oscilloscope"), [[0,0]]);
}

function showEvent(ev,id) {
    var d = [];
    //alert(ev[14]*0x100+ev[15]);
    for(var i=0;i<(ev[14]*0x100+ev[15])*2;i+=2) {
        d.push([(ev[ev.length-(ev[14]*0x100+ev[15])*2*2+i]*0x100+ev[ev.length-(ev[14]*0x100+ev[15])*2*2+i+1])*Math.pow(10,-ev[16]), (ev[ev.length-(ev[14]*0x100+ev[15])*2+i]*0x100+ev[ev.length-(ev[14]*0x100+ev[15])*2+i+1])*Math.pow(10,-ev[17])]);
    }
    //alert(ev);
    var time = ev[0] + "." + ev[1] + "." + ev[2] + " " + ev[3] + ":" + ev[4] + ":" + ev[5] + ":" + (ev[6]*0x100 + ev[7]*1) + ":" + (ev[8]*0x100 + ev[9]*1) + ":" + (ev[10]*0x100 + ev[11]*1);
    var prefixLength = ev[12]*0x100 + ev[13]*1;
    var prefixBuffer = ev.slice(18,18+prefixLength);
    var prefix = "";
    for(var i in prefixBuffer) prefix+=String.fromCharCode(prefixBuffer[i]);
    //alert(prefixBuffer);
    colorIt++; if(colorIt==16) colorIt=0;
    var options = {
    series: {
        lines: {
            show: true,
            fill: false,
            fillColor: { colors: [{ opacity: 0.7 }, { opacity: 0.1}] }
        }
    },
    colors: ["#FF6600", "#330099", "#FFCC00", "#CC0000", "#339900", "#CC3333", "#996600", "#CC00FF", "#0066CC","#6600CC","#FF6699","#00CC99","#FF6666","#666699","#CCFF33","#999966"],
    grid: {
        hoverable: true
    }
    }
    if(((oscRec==false) || (oscBuf.length>15))&&(oscPlay==true)) {
        $(".log-string").each(function(i,o) {
            o.style.color = "#000000";
        });
    }
    if(oscPlay==true) {
        oscBuf.push(d);
        if(logPlay==true) logEvent(id,prefix,time,colors[colorIt]);
        oscScreen = $.plot($("#oscilloscope"), oscBuf, options);
    } else {
        if(logPlay==true) logEvent(id,prefix,time,"#000000");
    }
    if((oscRec==false) || (oscBuf.length>15)) {
        oscBuf = [];
        colorIt=-1;
    }
}

function switchOscRec() {
    oscRec = !oscRec;
    if(oscRec==true) {
        $(".log-string").each(function(i,o) {
            o.style.color = "#000000";
        });
    }
}

function logEvent(id,prefix,time,color) {
	$('#eventLog').html("<tr class='log-string' style='color:" + color + "'><td>" + id + "</td><td>" + prefix + "</td><td>" + time + "</td></tr>" + $('#eventLog').html());
    /* document.getElementById("eventLog").innerHTML = "<tr class='log-string' style='color:" + color + "'><td>" + id + "</td><td>" + prefix + "</td><td>" + time + "</td></tr>" + document.getElementById("eventLog").innerHTML; */
}

function getRandomArbitary(min, max)
{
  return Math.random() * (max - min) + min;
}


function openOsc() {
	$('#oscill-container').css('visibility','visible');
	$('#constructor-navbar').css('visibility','hidden');
    /*
document.getElementById('oscill-container').style.visibility = "visible";
    document.getElementById('constructor-navbar').style.visibility = "hidden";
*/
}

function closeOsc() {
	$('#oscill-container').css('visibility','hidden');
	$('#constructor-navbar').css('visibility','visible');
   /*
 document.getElementById('oscill-container').style.visibility = "hidden";
    document.getElementById('constructor-navbar').style.visibility = "visible";
*/
}

function setMode(m) {
        $("#btnConstructor").removeClass("active");
        $("#btnconstrid").removeClass("sliding-u-l-r-active");
        $("#btnScreen").removeClass("active");
        $("#btnscreenid").removeClass("sliding-u-l-r-active");
        $("#btnLog").removeClass("active");
        $("#btnlogid").removeClass("sliding-u-l-r-active");
        $("#btncontroll").removeClass("active");
        $("#btnsetid").removeClass("sliding-u-l-r-active");
        $("#btnEasyMode").removeClass("active");
        $("#emodeid").removeClass("sliding-u-l-r-active");

        $('#oscill-container').css('visibility','hidden');
		$('#constructor-navbar').css('visibility','hidden');
		$('#log-container').css('visibility','hidden');
		$('#controll-container').css('visibility','hidden');
		$('#statemachine-demo').css('display','none');
        /*
document.getElementById('oscill-container').style.visibility = "hidden";
        document.getElementById('constructor-navbar').style.visibility = "hidden";
        document.getElementById('log-container').style.visibility = "hidden";
        document.getElementById('settings-container').style.visibility = "hidden";
*/
    switch(m) {
	    case "esmode":
	    	$("#btnEasyMode").addClass("active");
	    	$("#emodeid").addClass("sliding-u-l-r-active");
	    	break;
        case "screen":
        	$('#oscill-container').css('visibility','visible');
/*             document.getElementById('oscill-container').style.visibility = "visible"; */
            $("#btnScreen").addClass("active");
            $("#btnscreenid").addClass("sliding-u-l-r-active");
            break;
        case "constructor":
        	$('#constructor-navbar').css('visibility','visible');
/*             document.getElementById('constructor-navbar').style.visibility = "visible"; */
            $("#btnConstructor").addClass("active");
            $("#btnconstrid").addClass("sliding-u-l-r-active");
            $('#statemachine-demo').css('display','block');
            break;
        case "log":
        	$('#log-container').css('visibility','visible');
/*             document.getElementById('log-container').style.visibility = "visible"; */
            $("#btnLog").addClass("active");
            $("#btnlogid").addClass("sliding-u-l-r-active");
            break;
        case "controll":
        	$('#controll-container').css('visibility','visible')
          updateControllState();
          $("#btncontroll").addClass("active");
          $("#btnsetid").addClass("sliding-u-l-r-active");
          break;
    }
}

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
	var s = Snap("#svg");
	s.clear();
	var w = $("#svg").width(), h = $("#svg").height();
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

function deleteDisconnected() {
    $('#clients').children('tr').each(function (i,o) {
        if(o.className=="danger") {
            $(o).remove();
        }
    });
}

function clearOsc() {
    var options = {
    series: {
        lines: {
            show: true,
            fill: false,
            fillColor: { colors: [{ opacity: 0.7 }, { opacity: 0.1}] }
        }
    },
    colors: ["#FF6600", "#330099", "#FFCC00", "#CC0000", "#339900", "#CC3333", "#996600", "#CC00FF", "#0066CC","#6600CC","#FF6699","#00CC99","#FF6666","#666699","#CCFF33","#999966"],
    grid: {
        hoverable: true
    }
    }
    oscScreen = $.plot($("#oscilloscope"), [[0,0]], options);
        $(".log-string").each(function(i,o) {
            o.style.color = "#000000";
        });
}

function clearLog() {
	$('#eventLog').html('');
/*     document.getElementById("eventLog").innerHTML = ""; */
}

function switchLogPlay() {
    logPlay = !logPlay;

}

function updateClientsCount() {
    $('#cloudButton').html(clientsCount + ' расчетных узлов готовы');
}

function hotKey(event) {
    switch(event.keyCode) {
        case 27:
            document.body.style.webkitTransform = "scale(0.7)";
            document.body.style.mozTransform = "scale(0.7)";
            document.body.style.oTransform = "scale(0.7)";
            document.body.style.transform = "scale(0.7)";
            break;
    }
}
