#include <ChromeSerial.h>

void setup() {
 ChromeSerial.begin(9600);

}

void loop() {
  //receive data from your app, do not remove this line.
  ChromeSerial.receive();

  ChromeSerial.sendAnalogPin(14);


  //clear the fname to prevent from duplicating functions
  ChromeSerial.clear();
  delay(1000);
}
