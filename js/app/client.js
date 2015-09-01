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
        /*switch(c.source._type) {
            case "SER":
                f += formStr("f","A");
                break;
            case "MOD":
                f += formStr("f","Checked");
                f += formStr("f","True");
                f += formStr("f","False");
                break;
            case "COU":
                f += formStr("f","Y1");
                f += formStr("f","Y2");
                break;
            case "SRC":
                f += formStr("f","Event");
                break;
            case "FIL":
                f += formStr("f","Event");
                break;
        }*/
        f += formStr("f","A");
        f += formStr("f","B");
        f += formStr("f","C");
        $('#inputsFrom').html(f);
/*         document.getElementById("inputsFrom").innerHTML = f; */
        /*switch(c.target._type) {
            case "SER":
                t += formStr("t","Y");
                t += formStr("t","X");
                break;
            case "MOD":
                t += formStr("t","X");
                t += formStr("t","Y");
                break;
            case "COU":
                t += formStr("t","Checked");
                t += formStr("t","True");
                t += formStr("t","False");
                break;
            case "SRC":
                break;
            case "FIL":
                break;
        }*/
        t += formStr("t","A");
        t += formStr("t","B");
        t += formStr("t","C");
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
            connector: [ "StateMachine", { curviness: 10 } ],
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
    return ('<label class="btn btn-warning ' + t + '-input' + '" id="' + t + '-' + name + '"><input type="radio" name="options" autocomplete="off">' + name + '</label>');
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
    newAddonPanelHeading.className = "panel-heading";

    newAddonPanelHeadingButton = document.createElement('button');
    newAddonPanelHeadingButton.className = "ep btn btn-warning btn-xs";
    newAddonPanelHeadingButton.innerHTML = "&nbsp;";    
    newAddonPanelSettingsButton.className = "btn btn-success btn-xs";
    newAddonPanelSettingsButton.innerHTML = "&nbsp;";    
    //newAddon.innerHTML = '<div class="panel panel-default"><div class="panel-heading"><button class="ep btn btn-warning btn-xs"><span class="ep glyphicon glyphicon-flash"></span></button>&nbsp;<a target="_blank" href="' + data.url + '"><button class="btn btn-primary btn-xs"><span class="glyphicon glyphicon-fullscreen"></span></button></a>&nbsp; ' + data.title + '<button onclick="$(\'#addonSettingsDialog\').modal({show: true});" class="btn btn-danger btn-xs pull-right"><span class="glyphicon glyphicon-wrench"></span></button></div><div class="panel-body"><div id="' + data.id + '-canvas" style="width:' + data.width + 'px;height:' + data.height + 'px;"></div></div></div>';
    newAddonPanelHeadingHeader = document.createElement('span');

    var hd;
    var ap; var bp; var gp;
    switch(type) {
        case "SER":                           
            newAddon._type = 2;     //SERVER
            hd = "Сервер";
            ap = "порог А";
            bp = "порог B";
            cp = "порог C";
            break;
        case "RND":
            newAddon._type = 1;     //Randomize
            hd = "Случ. соб.";
            ap = "ниж. гр.";
            bp = "верх. гр.";
            cp = "интервал";
            break;
        case "COU":
            newAddon._type = 3; 
            hd = "Счетчик";
            ap = "начало";
            bp = "ширина";
            cp = "число";
            break;
        case "SRC":
            newAddon._type = 4; 
            hd = "Источник";
            ap = "номер";
            bp = "вход";
            cp = "триггер";
            break;
        case "FIL":
            newAddon._type = 3;
            hd = "Файл";
            ap = "путь";
            bp = "интервал";
            cp = "пакетов";
            break;
    }
    newAddonPanelHeadingHeader.innerHTML = "&nbsp;" + hd;

    newAddonPanelHeading.appendChild(newAddonPanelHeadingButton);
    newAddonPanelHeading.appendChild(newAddonPanelSettingsButton);
    newAddonPanelHeading.appendChild(newAddonPanelHeadingHeader);
    newAddonPanel.appendChild(newAddonPanelHeading);

    newAddon.style.left = document.body.scrollLeft + window.innerWidth/2 - 300/2 + getRandomInt(-25,25) +"px";
    newAddon.style.top = document.body.scrollTop + window.innerHeight*0.6 + getRandomInt(-25,25) + "px";

    newAddon.style.width = 160 + "px";

    newAddon.appendChild(newAddonPanel);

    var newAddonTextbox = document.createElement('input');
    newAddonTextbox.placeholder = ap;
    newAddonTextbox.className = "form-control";
    newAddonTextbox.id = "block" + curid + "-alpha";
    newAddonPanel.appendChild(newAddonTextbox);
    var addonAlpha = newAddonTextbox;
    var newAddonTextbox = document.createElement('input');
    newAddonTextbox.placeholder = bp;
    newAddonTextbox.className = "form-control";
    newAddonTextbox.id = "block" + curid + "-beta";
    newAddonPanel.appendChild(newAddonTextbox);
    var addonBeta = newAddonTextbox;
    var newAddonTextbox = document.createElement('input');
    newAddonTextbox.placeholder = cp;
    newAddonTextbox.className = "form-control";
    newAddonTextbox.id = "block" + curid + "-gamma";
    newAddonPanel.appendChild(newAddonTextbox);
    var addonGamma = newAddonTextbox;

        newAddonPanelSettingsButton.onclick = function() {
        if(newAddon._flag) {
            addonAlpha.style.visibility = "hidden";
            addonBeta.style.visibility = "hidden";
            addonGamma.style.visibility = "hidden";
        } else {
            addonAlpha.style.visibility = "visible";
            addonBeta.style.visibility = "visible";
            addonGamma.style.visibility = "visible";           
        }
        newAddon._flag = !newAddon._flag;
        }
    $('#statemachine-demo').append(newAddon);
/*     document.getElementById("statemachine-demo").appendChild(newAddon); */
    window.jsp = instance;
    var windows = jsPlumb.getSelector("#" + "block" + curid);
    instance.draggable(windows);
    instance.batch(function () {
        instance.makeSource(windows, {
            filter: ".ep",
            anchor: "Continuous",
            connector: [ "StateMachine", { curviness: 10 } ],
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

    curid++;

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
  socket = io.connect(':8889');
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
  socket.on('state', function (data) {
    switch(data.state) {
        case "error":
        	$('#' + data.ip + "-row").addClass('danger');
        	$("#" + data.ip + "-state").html('error');
            clientsCount--;
            updateClientsCount();
            /*
document.getElementById(data.ip + "-row").className = "danger";
            document.getElementById(data.ip + "-state").innerHTML = "error";
*/
            break;
    }
  });
}

function getRandomInt(min, max)
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseScheme() {
    var model = {};
    var blocksNumber=0;
    var connections = [];
    var buffer = [];
    $.each(instance.getConnections(), function (idx, connection) {
        connections.push({
            from: connection.sourceId,
            to: connection.targetId,
            out: connection.getOverlay('label').getLabel().split(" ")[2],
            inp: connection.getOverlay('label').getLabel().split(" ")[0],
        });
    });
    $("#statemachine-demo .w").each(function (idx, elem) {
        blocksNumber++;
        var $elem = $(elem);
        var flag=0;
        var setting_alpha = $('#' + $elem.attr('id') + "-alpha").val(); //document.getElementById($elem.attr('id') + "-alpha").value;
        var setting_beta = $('#' + $elem.attr('id') + "-beta").val(); //document.getElementById($elem.attr('id') + "-beta").value;
        var setting_gamma = $('#' + $elem.attr('id') + "-gamma").val(); //document.getElementById($elem.attr('id') + "-gamma").value;
        buffer.push(elem._type);
        buffer.push(Math.floor(setting_alpha/0x100)); buffer.push(setting_alpha%0x100);
        buffer.push(Math.floor(setting_beta/0x100)); buffer.push(setting_beta%0x100);
        buffer.push(Math.floor(setting_gamma/0x100)); buffer.push(setting_gamma%0x100);
        flag=0;
        for(var i in connections) {
            if((connections[i].to.split("block").join("") == $elem.attr('id').split("block").join(""))&&(connections[i].out=="A")) {
                switch(connections[i].inp) {
                    case "A":
                        buffer.push(1);
                        break;
                    case "B":
                        buffer.push(2);
                        break;
                    case "C":
                        buffer.push(3);
                        break;
                }
                buffer.push(parseInt(connections[i].from.split("block").join("")));               
                flag=1;
            }
        }
        if(flag==0) {
            buffer.push(0); buffer.push(255);
        }
        flag=0;
        for(var i in connections) {
            if((connections[i].to.split("block").join("") == $elem.attr('id').split("block").join(""))&&(connections[i].out=="B")) { 
                switch(connections[i].inp) {
                    case "A":
                        buffer.push(1);
                        break;
                    case "B":
                        buffer.push(2);
                        break;
                    case "C":
                        buffer.push(3);
                        break;
                }
                buffer.push(parseInt(connections[i].from.split("block").join(""))); 
                flag=1;             
            }
        }
        if(flag==0) {
            buffer.push(0); buffer.push(255);
        }
        flag=0;
        for(var i in connections) {
            if((connections[i].to.split("block").join("") == $elem.attr('id').split("block").join(""))&&(connections[i].out=="C")) { 
                switch(connections[i].inp) {
                    case "A":
                        buffer.push(1);
                        break;
                    case "B":
                        buffer.push(2);
                        break;
                    case "C":
                        buffer.push(3);
                        break;
                }
                buffer.push(parseInt(connections[i].from.split("block").join(""))); 
                flag=1;             
            }
        }
        if(flag==0) {
            buffer.push(0); buffer.push(255);
        }
    }); 
    /*model = {
        b: blocks,
        c: connections
    }
    outstr += "BLK\n\n";
    for(var i in model.b) {
        outstr += model.b[i].id + "\n";
        outstr += model.b[i].left + "\n";
        outstr += model.b[i].top + "\n";
        outstr += model.b[i].alpha + "\n";
        outstr += model.b[i].beta + "\n";
        outstr += model.b[i].gamma + "\n\n";
    }
    outstr += "CON\n\n";
    for(var i in model.c) {
        outstr += model.c[i].from + "\n";
        outstr += model.c[i].to + "\n";
        outstr += model.c[i].out + "\n";
        outstr += model.c[i].inp + "\n";
    }
    var modelStr = JSON.stringify(model);*/
    buffer.unshift(blocksNumber % 0x100);
    buffer.unshift(Math.floor(blocksNumber/0x100));
    return buffer;
}

function installScheme(a) {
    socket.emit('scheme-install',{scheme: parseScheme(), ip: a});
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