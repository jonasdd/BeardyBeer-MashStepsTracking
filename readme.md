#Readme

##Synopsis

**BeardyBeer MashStepTracking** is a Arduino/ChromeApp project that helps homeBrewers to have a better visualisation on mash steps temperatures.

##Motivation

Getting precise Mash temperature is very important when breewing, but in homebrewing conditions, these temperatures are not easy to maintain.

Through a simple thermistor connected to an Arduino, this ChromeApp gives the ability to :

1. Setup up your mash profile from one to four steps (update will come to add more steps)
 1. Setup each mash step target temperature 
 2. Setup each mash step target duration
2. Start/pause/GoToNext Mash step
3. Indicates to the brewer when to Heat up or Heat down
4. Gives live graph tracking and export features (give the ablility to compare mash graph from one brew to an other).

##Installation

1. Install folder in chrome. Go to 
 * (chrome://extensions/)
 * then click on *load unpacked extension* button and locate the paquage
2. Connect your arduino
3. Use arduino_thermistor_circuit.png to connect your thermistor to your arduino
4. Take care to adjust analog port in arduino.ino (if fallowing the circuit, notice that pin is 14 and not 0 because of the use of AREF )
5. Also adjust in mash.js (see below) file : 
 * Thermistor nominal temperature (TEMPERATURENOMINAL)
 * Beta coeficient value (BCOEFFICIENT)
 * Thermistor nominal value (THERMISTORNOMINAL)
 * 1% serie resistor (SERIESRESISTOR)

```
// in arduino.io file
	ChromeSerial.sendAnalogPin(14);
```

```javascript
// in mash.js file
var SERIESRESISTOR = 22000;
var THERMISTORNOMINAL = 22000;
var BCOEFFICIENT = 3986;
var TEMPERATURENOMINAL = 25;
```

*NB : when uploading your arduino sketch, do not forget to add the ChromeSerial.h library which you can find in arduino/library/ChromeSerial.h and arduino/library/ChromeSerial.cpp. Also notice that temperature is °C not Farenheint. If needed you can convert temperature unit in mash.js file*

##Basic Usage :

Click on the help icon on top right corner and follow the tour.

![Screenshot](https://github.com/jonasdd/BeardyBeer-MashStepsTracking/blob/master/screenshot.png)

##Advanced usage
##API Reference

The project in based on :

1. [ChromeSerial API](http://developer.chrome.com/apps/serial)
2. ArduinoSerial: Source an API doc will come soon.
Actualy the project is using only one arduino analog port but you can go well further.
3. [Project uses Arduino basics] (https://www.arduino.cc/en/Reference/HomePage)


##License

The MIT Licence (MIT)

##What next ?

I am thinking of making power automaticaly increase/decrese by using servoMotor and PID script but for now i'm using a gas heater and i have to be sure to get this to a safe way.

##How to help ?

- Convert this chrome app to an android app. 
- Can be tricky to get serial from OTG cable. Maybe easyer through bluetooth serial.
- Maybe we'll have to go to native app instead of Cordova App which seems downgrading performances

