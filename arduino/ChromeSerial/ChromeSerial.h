/*
  ChromeSerial.h - Library for communication with a chrome app.
  Created by Thomas Blaisot, Juin 1, 2015.
  Released into the public domain.
*/
#ifndef ChromeSerial_h
#define ChromeSerial_h

#include "Arduino.h"

class ChromeSerialClass
{
  public:
    ChromeSerialClass(int i);
    ~ChromeSerialClass();
    void begin(int baudrate);
    void receive();
    void clear();
    void autoExecute();
    void send(String value);
    void sendBoolean(boolean value);
    void sendBooleanPin(int pin);
    void sendAnalog(int value);
    void sendAnalogPin(int pin);
    void sendString(String name, String value);
    String readFunction();
    boolean hasString(String name);
    String readString(String name);
    int readAnalog(String name);
    boolean readBoolean(String name);
  private:
    String lastReceivedString;
};

extern ChromeSerialClass ChromeSerial;

#endif
