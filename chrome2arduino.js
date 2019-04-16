"use strict"
/**
 * Messages Format :

 * chrome to arduino
 * ===================
 * DW:P0:0; ou DW:P0:1; = booleanWrite Pin P0 0
 * AW:P0:255; = analogWrite Pin P0 255
 * DR:P0; = booleanRead Pin P0
 * AR:P0; = analogRead Pin P0
 * FN:fonction1; = execute fonction1 on arduino (need specifique code on arduino)
 * STR:Name:data; = send raw data with name Name

 * arduino to chrome
 * ===================
 * DR:P0:0; ou DR:P0:1; = sendBooleanPin(pin)
 * DR::0; ou DR::1; = sendBoolean(value)
 * AR:P0:255; = sendAnalogPin(pin)
 * AR::255; = sendAnalog(value)
 * STR:Name:data; = sendString(name, value)
 * STR:Name:data; = readString(name)
 * STR:Name:data; = readBinary(name)
 * STR:Name:data; = readAnalog(name)
 *
 */

////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////

/**
 *  Interprets an ArrayBuffer as UTF-8 encoded string data.
 */
var ab2str = function (buf) {
    var bufView = new Uint8Array(buf);
    var encodedString = String.fromCharCode.apply(null, bufView);
    return decodeURIComponent(escape(encodedString));
};

/**
 * Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer.
 */
var str2ab = function (str) {
    var encodedString = unescape(encodeURIComponent(str));
    var bytes = new Uint8Array(encodedString.length);
    for (var i = 0; i < encodedString.length; ++i) {
        bytes[i] = encodedString.charCodeAt(i);
    }
    return bytes.buffer;
};


/** ************************
 * 
 */

class JonasEvent {
    constructor(eventName) {
        this.name = eventName;
    }

    dispatch(payload) {
        document.dispatchEvent(new CustomEvent(this.name, { detail: payload }));
    }

    addListener(fn) {

        document.addEventListener(this.name, function (event) {
            fn(event.detail)
            //console.log_(event.detail)
        });
    }

}

/**********************************************************
*   Basic SerialConnection
***********************************************************/

/**
 * SerialConnection object to encapsulate some generic code
 * @constructor
 */
class SerialConnection {
    constructor() {
        this.connectionId = -1;
        this.lineBuffer = "";
        this.boundOnReceive = this.onReceive.bind(this);
        this.boundOnReceiveError = this.onReceiveError.bind(this);
        this.onConnect = new JonasEvent('serial:connect');
        this.onReadLine = new JonasEvent('serial:readline');
        this.onError = new JonasEvent('serial:error');
    }

    /**
     * function called when the connection is established
     * @private
     * @param connectionInfo
     *      result of the connection
     */
    onConnectComplete(connectionInfo) {
        if (!connectionInfo) {
            console.log("Connection failed.");
            return;
        }
        this.connectionId = connectionInfo.connectionId;
        chrome.serial.onReceive.addListener(this.boundOnReceive);
        chrome.serial.onReceiveError.addListener(this.boundOnReceiveError);
        this.onConnect.dispatch();
    }

    /**
     * function called when a message is received on the serial bus
     * @private
     * @param receiveInfo
     *      message received on the serial bus
     */
    onReceive(receiveInfo) {
        //console.log(receiveInfo);
        if (receiveInfo.connectionId !== this.connectionId) {
            return;
        }

        this.lineBuffer += ab2str(receiveInfo.data);

        var index;
        while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
            var line = this.lineBuffer.substr(0, index + 1);
            this.onReadLine.dispatch(line);
            this.lineBuffer = this.lineBuffer.substr(index + 1);
        }

    }

    /**
     * function called when an error is catched
     * @private
     * @param errorInfo
     *      error
     */
    onReceiveError(errorInfo) {
        if (errorInfo.connectionId === this.connectionId) {
            this.onError.dispatch(errorInfo.error);
        }
    }

    /**
     * Connect to a port
     * @param path
     *      port to use
     */
    connect(path) {
        //TODO: accept connexionOptions
        chrome.serial.connect(path, this.onConnectComplete.bind(this))
    }

    /**
     * Send a string to the serial bus
     * @param msg
     *      the message to send
     */
    send(msg) {
        if (this.connectionId < 0) {
            throw 'Invalid connection';
        }
        chrome.serial.send(this.connectionId, str2ab(msg), function () {
        });
    }

    /**
     * Disconnect the communication
     */
    disconnect() {
        if (this.connectionId < 0) {
            throw 'Invalid connection';
        }
        chrome.serial.disconnect(this.connectionId, function () {
        });
    }

    getDevices(callback) {
        chrome.serial.getDevices(callback);
    }

};
////////////////////////////////////////////////////////
// Exemple Code
////////////////////////////////////////////////////////

/*
 var connection = new SerialConnection();

 connection.onConnect.addListener(function() {
 log('connected to: ' + DEVICE_PATH);
 connection.send("hello arduino");
 });

 connection.onReadLine.addListener(function(line) {
 logJSON(line);
 });

 connection.connect(DEVICE_PATH);

 var connexion = new SerialConnection();
 */


/** ********************************************************
 *   More Complexe SerialConnection
 ***********************************************************/

const FN_PREFIX = "FN";
const STR_PREFIX = "STR";
const DR_PREFIX = "DR";
const DW_PREFIX = "DW";
const AR_PREFIX = "AR";
const PIN_PREFIX = "P";
const SEPARATOR = ":";
const END = ";";

/**
 * SerialConnection object to encapsulate specific code to the defined protocol
 * @constructor
 */
class Chrome2ArduinoSerialConnection extends SerialConnection {
    constructor() {
        super();
        this.onReceivedListeners = [];
        this.onDefaultReceivedListener = function (line) {
            console.log_('line', line);
        };
    }

    /**
     * init function to make the magic happen
     * bind the dispatcher to the SerialConnection  readLine event
     */
    init() {
        //DW:P0:0;
        var self = this;
        var generalListener = function (line) {
            //decoupage
            var dataType = "";
            var name = "";
            var value = "";
            var re = /([A-Z]{2,3}):(.*):(.*);/i;
            var found = line.match(re);
            if (found != null && found.length == 4) {
                dataType = found[1];
                name = found[2];
                value = found[3];
            }
            //console.log_(found);
            var arrayLength = self.onReceivedListeners.length;
            var eventProcessed = false;
            for (var i = 0; i < arrayLength; i++) {
                var listener = self.onReceivedListeners[i];
                if (!eventProcessed && (listener.dataType === dataType || listener.dataType === "*")
                    && (listener.name === name || listener.name === "*")) {
                    listener.callback(this, value, line, dataType, name);
                    eventProcessed = true;
                    if (listener.removeAfter) {
                        delete self.onReceivedListeners[i];
                    }
                    return;
                }
            }
            if (!eventProcessed) {
                self.onDefaultReceivedListener(line);
            }
        };
        //console.log_(this.onReadLine);
        //console.log(generalListener);
        this.onReadLine.addListener(generalListener);
    }
    /**
     * Add a listener to specific data
     * @param listener
     *      {dataType : "", name:"", removeAfter : true|false, callback: function}
     *      dataType is one of "FN", "STR", "DR", "DW", "AR"
     *      name is a string with no ":" char or * if should match everything
     *      removeAfter is a boolean to tell if the listener should only be called one time
     *      callback is the function executed with the received value : function(connexion, value, line, dataType, name)
     */
    addOnReceivedListener(listener) {
        var self = this;
        self.onReceivedListeners.push(listener);
        console.log_("listener",listener)
    }

    /**
     * Send a message to tell the arduino to output a HIGH or LOW signal to a pin
     * @param pin
     *      pin number
     * @param value
     *      value (true|false)
     */
    booleanWrite(pin, value) {
        //DW:P0:0;
        var self = this;
        //normalisation
        var svalue = 1;
        if (!value) {
            svalue = 0;
        }
        self.send(DW_PREFIX + SEPARATOR + PIN_PREFIX + pin + SEPARATOR + svalue + END);
    }

    /**
     * Send a message to tell the arduino to output a PWM signal to a pin
     * @param pin
     *      pin number
     * @param value
     *      value (0-255)
     */
    analogWrite(pin, value) {
        //AW:P0:255;
        var self = this;
        self.send(AW_PREFIX + SEPARATOR + PIN_PREFIX + pin + SEPARATOR + value + END);
    }

    /**
     * Send a message to tell the arduino to execute a function (need specific code on arduino)
     * @param value
     *      function name
     */
    executeFunction(value) {
        //FN:fonction1;
        var self = this;
        self.send(FN_PREFIX + SEPARATOR + value + END);
    }

    /**
     * Send a message to the arduino
     * @param name
     *      string name
     * @param value
     *      string
     */
    sendString(name, value) {
        //STR:Name:data;  
        var self = this;
        self.send(STR_PREFIX + SEPARATOR + name + SEPARATOR + value + END);

    }

    /**
     * Send a message to tell the arduino to send back the value of a pin eighter HIGH or LOW
     * @param pin
     *      pin number
     * @param callback
     *      the function to execute when receiving the value (0|1) : callback = function(value){}
     */
    booleanReadPin(pin, callback) {
        //DR:P0;
        var self = this;
        self.send(DR_PREFIX + SEPARATOR + PIN_PREFIX + pin + END);
        self.addOnReceivedListener({
            "dataType": DR_PREFIX,
            "name": PIN_PREFIX + pin,
            "removeAfter": true,
            "callback": function (connexion, value, line, dataType, name) {
                callback(value);
                //console.log_(callback(value))
            }
        });
    }

    /**
     * Send a message to tell the arduino to send back the analog value of a pin
     * @param pin
     *      pin number
     * @param callback
     *      the function to execute when receiving the value (0-255) : callback = function(value){}
     */
    analogReadPin(pin, callback) {
        //AR:P0;
        var self = this;
        self.send(AR_PREFIX + SEPARATOR + PIN_PREFIX + pin + END);
        self.addOnReceivedListener({
            "dataType": AR_PREFIX,
            "name": PIN_PREFIX + pin,
            "removeAfter": true,
            "callback": function (connexion, value, line, dataType, name) {
                callback(value);
                //console.log_(callback(value))

            }
        });
    }

};
