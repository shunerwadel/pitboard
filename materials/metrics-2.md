### Metrics

* **Tire vertical force and variation \-**   
    * **Lateral load transfer \-**   
    * **Roll stiffness** \- combined rate of all suspension spring elements when the car is rolling (rotating about the x axis)  
      * Ride metric  
    * **Heave stiffness** \- combined rate of all suspension spring element when the car is in heave (moving up and down relative to ground)  
      * Driver feel, ride metric  
    * **Ride height** \- height of car off the ground at a given location  
      * Length, generally inches or mm  
      * Vehicle state metric, key for bottoming and aero map  
      * Very interested in how close the car is to the ground  
        * Lower generally equals more downforce

* ## Data acquisition systems (telemetry)

  * *DAQ slide*  
  * **Data acquisition (DAQ)** \- system which records analog signals from physical sensor inputs and translates these signals into data for analysis  
    * Many sensors across car  
    * Looms connecting all sensors back to central computer  
  * *Sensors slide(s)*  
  * Common sensors  
    * Laser \- measures height to ground \-  ride height  
    * Linear potentiometers (pot) \- measures linear distance between two points \- shock or rocker pot  
    * Rotary potentiometers (pot) \- measures rotation angle \- steering shaft  
    * Accelerometer \- measures acceleration in one or more directions  
    * GPS position \- measures latitude, longitude, and elevation of the vehicle  
    * Pitot tube \- measures air speed  
    * Wheel speed sensor \- measures rotational velocity of wheels  
    * Temperature sensor \- measures heat  
    * Pressure taps \- measures air pressure \- typically in array  
    * Strain gauge \- measures deformation due to stretching or compression of suspension member \- converted into force  
    * ECU / SECU \- Driver controls, power unit, differential, and other control system related channels  
  * Different series have different rules regarding what DAQ can be done and when  
    * NASCAR is limited to only gps and ECU channels during race events, but can run additional sensors for testing  
    * F1 allows for running many sensors in addition to the SECU channels for all sessions  
  * Other concepts  
    * Setting gains \- All sensors will come with a documentation about the relationship between their change in state to output voltage which is read by the DAQ system  
      * Example: a damper pot may produce a voltage of 0 when fully extended and 5 when fully compressed.  
    * Zeroing \- concept of establishing a state of the vehicle in which various sensors on the car are at a value of “0” for the purpose of measuring displacement from this state  
      * Example: We may have a calculated channel for wheel travel that we want to read zero at the setup state of the car so we can tell how much the wheel has traveled in bump or droop from setup.   
    * Thermal drift \- behavior of sensors, especially strain gauges, can change significantly with heat  
    * Always question the DAQ system if something does not look right  
  * Typical DAQ setup workflow:  
1. Car is instrumented with sensor, looms, computers  
2. Gains for each sensor are input into DAQ software  
3. Car is put into “zero state” and sensors are checked/zeroed  
4. Car moves to another static state, maybe OOG with engine running  
5. Car goes on track and telemetry is streamed back or collected upon return

* ## Data viewers
