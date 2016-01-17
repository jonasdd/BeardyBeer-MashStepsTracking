function onRead(readInfo) {
  //console.log(readInfo);
}

function onConnectAction() {
  var mbutton = document.getElementById('connect-button');
  mbutton.setAttribute('style', 'color:yellow;')
}

var NUMSAMPLES = 5;
var SERIESRESISTOR = 22000;
var THERMISTORNOMINAL = 22000;
// B natif = 3950 - B ajusté entre 40 et 80°c = 3986
var BCOEFFICIENT = 3986;
var TEMPERATURENOMINAL = 25;
var samples = [];
var connection = new Chrome2ArduinoSerialConnection();
connection.init();
connection.onConnect.addListener(onConnectAction);
connection.onDefaultReceivedListener = onRead;
connection.addOnReceivedListener({
        "dataType": "AR",
        "name": "P14",
        "removeAfter" : false,
        "callback": function (connexion, value, line, dataType, name) {
            value = parseInt(value);
            samples.push(value);
            if(samples.length >= NUMSAMPLES){
              samples.shift();
            }
            var average=0;
            samples.forEach(function(elem){
              average = average + elem;
            });
            average=Math.floor(average/samples.length);
            average = 1023 / average - 1;
            average = SERIESRESISTOR / average;
            //console.log("average =" + average);
            //float steinhart;
            var steinhart;
            steinhart = average / THERMISTORNOMINAL;
            //console.log("steinhart =" + average);
            // (R/Ro)
            steinhart = Math.log(steinhart);                  // ln(R/Ro)
            steinhart /= BCOEFFICIENT;                   // 1/B * ln(R/Ro)
            steinhart += 1.0 / (TEMPERATURENOMINAL + 273.15); // + (1/To)
            steinhart = 1.0 / steinhart;                 // Invert
            steinhart -= 273.15;
            steinhart = Math.floor(steinhart);                         // convert to C
            //console.log("la temperature est de "+ steinhart);
            var liveTemp = document.getElementById('liveValue');
            liveTemp.dataset.live = steinhart;
            liveTemp.textContent = steinhart;
        }
    });

function setStatus(status) {
  document.getElementById('status').innerText = status;
}


function buildPortPicker(connection, ports) {
  var eligiblePorts = ports.filter(function(port) {
    //return !port.path.match(/[Bb]luetooth/);
    return !port.path.match(/[Bb]luetooth/) && (port.path.match(/\/dev\/tty/) || port.path.match(/COM[12345678]/));

  });

  var portPicker = document.getElementById('port-picker');
  eligiblePorts.forEach(function(port) {
    var portOption = document.createElement('option');
    portOption.value = portOption.innerText = port.path;
    portPicker.appendChild(portOption);
  });

  var mbutton = document.getElementById('connect-button');
  mbutton.onclick = function(event){
    //console.log(event); 
    event.preventDefault(); 
    openSelectedPort();
  };
}

function openSelectedPort() {
  var portPicker = document.getElementById('port-picker');
  var selectedPort = portPicker.options[portPicker.selectedIndex].value;
  connection.connect(selectedPort);
}


onload = function() {

  /*document.getElementById('position-input').onchange = function() {
    setPosition(parseInt(this.value, 10));
  };*/

  connection.getDevices(function(ports) {
    buildPortPicker(connection, ports);
  });
};
