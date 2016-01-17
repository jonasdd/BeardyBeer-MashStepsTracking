/*
  ChromeSerial.cpp - Library for communication with a chrome app.
  Created by Thomas Blaisot, Juin 1, 2015.
  Released into the public domain.
*/

#include "Arduino.h"
#include "ChromeSerial.h"

const String FN_PREFIX = "FN:";
const String STR_PREFIX = "STR:";
const String DR_PREFIX = "DR:";
const String DW_PREFIX = "DW:";
const String AR_PREFIX = "AR:";
const String PIN_PREFIX = "P";
const String SEPARATOR = ":";
const String END = ";";

ChromeSerialClass::ChromeSerialClass(int i)
{
//constructor
}

ChromeSerialClass::~ChromeSerialClass()
{
//destructor
}

void ChromeSerialClass::begin(int baudrate)
{
    Serial.begin(baudrate);
    lastReceivedString = "";
}

void ChromeSerialClass::receive()
{
    if (Serial.available() > 0) {
        lastReceivedString = Serial.readStringUntil('\n');
    }
}

void ChromeSerialClass::clear()
{
    lastReceivedString = "";
}

void ChromeSerialClass::autoExecute()
{
    //TODO: auto executer les ordres reçus
   //TESTONLY:
   if(lastReceivedString.length()>0){
	Serial.println(">"+lastReceivedString);
   }
   //:TESTONLY

}

void ChromeSerialClass::send(String value)
{
    //raw acccess to send
    Serial.println(value);
}

void ChromeSerialClass::sendBoolean(boolean value)
{
    //DR::0
    Serial.println(DR_PREFIX + SEPARATOR + value + END);
}

void ChromeSerialClass::sendBooleanPin(int pin)
{
    //DR:P0:0
    boolean value = digitalRead(pin);
    Serial.println(DR_PREFIX + PIN_PREFIX + pin + SEPARATOR + value + END);
}

void ChromeSerialClass::sendAnalog(int value)
{
    //AR::0
    Serial.println(AR_PREFIX + SEPARATOR + value + END);
}

void ChromeSerialClass::sendAnalogPin(int pin)
{
    //AR:P0:0
    int value = analogRead(pin);
    Serial.println(AR_PREFIX + PIN_PREFIX + pin + SEPARATOR + value + END);
}

void ChromeSerialClass::sendString(String name, String value)
{
    //STR:Name:string
    Serial.println(STR_PREFIX + name + SEPARATOR + value + END);
}

String ChromeSerialClass::readFunction()
{
    //FN:Name
    int chromeLen = lastReceivedString.length();
    if (lastReceivedString.indexOf(FN_PREFIX) == 0) {
        String sub = lastReceivedString.substring(3, lastReceivedString.indexOf(END));
        clear();
        return sub;
    }
    return "";
}

boolean ChromeSerialClass::hasString(String name)
{
    //STR:Name:string
    int chromeLen = lastReceivedString.length();
    if (lastReceivedString.indexOf(STR_PREFIX) == 0) {
        int indexSeparator = lastReceivedString.indexOf(SEPARATOR, 5);
        String strName = "";
        if (indexSeparator >= 5) {
            strName = lastReceivedString.substring(4, indexSeparator);
        }
        return (strName == name);
    }
    return false;
}

String ChromeSerialClass::readString(String name)
{
    //STR:Name:string
	if(hasString(name)){
	    int indexSeparator = lastReceivedString.indexOf(SEPARATOR, 5);
	    String sub = lastReceivedString.substring(indexSeparator+1, lastReceivedString.indexOf(END));
	    clear();
	    return sub;
	}
    return "";
}

int ChromeSerialClass::readAnalog(String name)
{
    //STR:Name:string
    String value = readString(name);
    return value.toInt();
}

boolean ChromeSerialClass::readBoolean(String name)
{
    //STR:Name:string
    int intValue = readAnalog(name);
    if(intValue == 0){
        return false;
    }
    return true;
}

// preinstantiate an object
ChromeSerialClass ChromeSerial(0);

