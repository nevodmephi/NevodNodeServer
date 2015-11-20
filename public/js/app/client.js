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

var colors = ["#FF6600", "#330099", "#FFCC00", "#CC0000", "#339900", "#CC3333", "#996600", "#CC00FF", "#0066CC","#6600CC","#FF6699","#00CC99","#FF6666","#666699","#CCFF33","#999966"];
var colorIt = -1;

var clientsCount=0;

function initjsPlumb() {
    instance = jsPlumb.getInstance({
        Endpoint: ["Dot", {radius: 1}],
        HoverPaintStyle: {strokeStyle: "#333333", lineWidth: 1 },
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
            connectorStyle: { strokeStyle: "#333333", lineWidth: 1, outlineColor: "transparent", outlineWidth: 10 },
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
    newAddonPanelHeadingButton.className = "ep btn btn-warning btn-xs";
    newAddonPanelHeadingButton.innerHTML = "↰";    
    newAddonPanelSettingsButton.className = "btn btn-default btn-xs";
    newAddonPanelSettingsButton.innerHTML = "<span class='glyphicon glyphicon-cog'></span>";
    newAddonPanelDeleteButton.className = "btn btn-danger btn-xs pull-right";
    newAddonPanelDeleteButton.innerHTML = "<span class='glyphicon glyphicon-remove'></span>";   
    //newAddon.innerHTML = '<div class="panel panel-default"><div class="panel-heading"><button class="ep btn btn-warning btn-xs"><span class="ep glyphicon glyphicon-flash"></span></button>&nbsp;<a target="_blank" href="' + data.url + '"><button class="btn btn-primary btn-xs"><span class="glyphicon glyphicon-fullscreen"></span></button></a>&nbsp; ' + data.title + '<button onclick="$(\'#addonSettingsDialog\').modal({show: true});" class="btn btn-danger btn-xs pull-right"><span class="glyphicon glyphicon-wrench"></span></button></div><div class="panel-body"><div id="' + data.id + '-canvas" style="width:' + data.width + 'px;height:' + data.height + 'px;"></div></div></div>';
    newAddonPanelHeadingHeader = document.createElement('span');

    var hd;
    var ap; var bp; var gp;

    newAddonPanelHeadingHeader.innerHTML = "&nbsp;" + hd;

    newAddonPanelHeading.appendChild(newAddonPanelHeadingButton);
    newAddonPanelHeading.appendChild(newAddonPanelSettingsButton);
    newAddonPanelHeading.appendChild(newAddonPanelHeadingHeader);
    newAddonPanelHeading.appendChild(newAddonPanelDeleteButton);
    newAddonPanel.appendChild(newAddonPanelHeading);

    newAddon.style.left = document.body.scrollLeft + window.innerWidth/2 - 300/2 + getRandomInt(-25,25) +"px";
    newAddon.style.top = document.body.scrollTop + window.innerHeight*0.6 + getRandomInt(-25,25) + "px";

    //newAddon.style.width = 30 + "em";
    //newAddon.style.height = 30 + "em";

    newAddon.appendChild(newAddonPanel);

    var newAddonEditor = document.createElement('div');
    newAddonEditor.id = "block" + curid + "-editor";

    newAddonPanel.appendChild(newAddonEditor);

    $('#statemachine-demo').append(newAddon);

    newAddonEditor._dom = new Object();
    newAddonEditor._dom = new ace.edit("block" + curid + "-editor");
    newAddonEditor._dom._mode = false;
    newAddonEditor._dom.setTheme("ace/theme/clouds");
    newAddonEditor._dom.getSession().setMode("ace/mode/javascript");
    newAddonEditor.style.width = "40em";
    newAddonEditor.style.height = "35em";

    newAddonEditor._dom.setOptions({
        fontFamily: "monospace",
        fontSize: "8pt"
    });

/*     document.getElementById("statemachine-demo").appendChild(newAddon); */
    window.jsp = instance;
    var windows = jsPlumb.getSelector("#" + "block" + curid);
    instance.draggable(windows);
    instance.batch(function () {
        instance.makeSource(windows, {
            filter: ".ep",
            anchor: "Continuous",
            connector: [ "StateMachine", { curviness: 1 } ],
            connectorStyle: { strokeStyle: "#333333", lineWidth: 1, outlineColor: "transparent", outlineWidth: 10 },
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

    newAddonPanelDeleteButton.setAttribute('onclick','jsPlumb.detachAllConnections("block' + curid + '");jsPlumb.empty("block' + curid + '")');
    newAddonPanelSettingsButton.setAttribute('onclick','flipMode(document.getElementById("block' + curid + '-editor")._dom)');
    curid++;
}

function flipMode(editor) {
    if(editor._mode == false) {
        editor.setTheme("ace/theme/solarized_light"); 
        editor.getSession().setMode("ace/mode/plain_text");
    } else {
        editor.setTheme("ace/theme/clouds");
        editor.getSession().setMode("ace/mode/javascript");
    }
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

    socket.on('handshake',function(data) {
        for(var i in data) {
            $('#clients').append('<tr class="scheme-status-string scheme-' + data[i].name +'"><td class="scheme-status-string"><button class="btn btn-link btn-xs">' + data[i].name + '</button><td><td id="scheme-status-' + data[i].name + '">' + data[i].status + '</td><td><button class="btn btn-default btn-xs" onclick=""><span class="glyphicon glyphicon-stop" aria-hidden="true"></span></button>&nbsp;<button class="btn btn-default btn-xs" onclick=""><span class="glyphicon glyphicon-pause" aria-hidden="true"></span></button>&nbsp;<button class="btn btn-default btn-xs" onclick="playScheme(\'' + data.name + '\')"><span class="glyphicon glyphicon-play" aria-hidden="true"></span></button></td><td><button onclick="removeScheme(\'' + data[i].name + '\')" class="btn btn-xs btn-danger"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button></td></tr>');                
        }             
    })
    
    socket.on('scheme-installed', function(data) {
        $('#clients').append('<tr class="scheme-status-string scheme-' + data.name +'"><td class="scheme-status-string"><button class="btn btn-link btn-xs">' + data.name + '</button><td><td id="scheme-status-' + data.name + '">installed</td><td><button class="btn btn-default btn-xs" onclick=""><span class="glyphicon glyphicon-stop" aria-hidden="true"></span></button>&nbsp;<button class="btn btn-default btn-xs" onclick=""><span class="glyphicon glyphicon-pause" aria-hidden="true"></span></button>&nbsp;<button class="btn btn-default btn-xs" onclick="playScheme(\'' + data.name + '\')"><span class="glyphicon glyphicon-play" aria-hidden="true"></span></button></td><td><button onclick="removeScheme(\'' + data.name + '\')" class="btn btn-xs btn-danger"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button></td></tr>');        
    });

    socket.on('scheme-ran', function(data) {
        document.getElementById('scheme-status-' + data.name).innerHTML = data.status;
    })

    socket.on('scheme-removed', function(data) {
        $('.scheme-' + data.name).each(function (idx, elem) {
            $(elem).remove();
        });
    })

    socket.on('scheme-wrong', function(data) {
        alert(0);
    })
}

function getRandomInt(min, max)
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

function initOsc() {
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
        $("#btnScreen").removeClass("active");
        $("#btnLog").removeClass("active");
        $("#btnSettings").removeClass("active");
        
        $('#oscill-container').css('visibility','hidden');
		$('#constructor-navbar').css('visibility','hidden');
		$('#log-container').css('visibility','hidden');
		$('#settings-container').css('visibility','hidden');
        /*
document.getElementById('oscill-container').style.visibility = "hidden";
        document.getElementById('constructor-navbar').style.visibility = "hidden";
        document.getElementById('log-container').style.visibility = "hidden";
        document.getElementById('settings-container').style.visibility = "hidden";
*/
    switch(m) {
        case "screen":
        	$('#oscill-container').css('visibility','visible');
/*             document.getElementById('oscill-container').style.visibility = "visible"; */
            $("#btnScreen").addClass("active");
            break;
        case "constructor":
        	$('#constructor-navbar').css('visibility','visible');
/*             document.getElementById('constructor-navbar').style.visibility = "visible"; */
            $("#btnConstructor").addClass("active"); 
            break;
        case "log":
        	$('#log-container').css('visibility','visible');
/*             document.getElementById('log-container').style.visibility = "visible"; */
            $("#btnLog").addClass("active");
            break;
        case "settings":
        	$('#settings-container').css('visibility','visible')
/*             document.getElementById('settings-container').style.visibility = "visible"; */
            $("#btnSettings").addClass("active");
            break;
    }
}

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