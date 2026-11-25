### Inputs

* *Inputs intro slide*  
* To make the simulation representative, we have to characterize all the subsystems and elements and provide them as inputs  
* Process follows general steps:  
  * Measure static properties  
    * Mass properties, length, nominal rate, etc  
  * Measure dynamic properties  
    * Lab equipment (raters, rigs, dynos)  
  * Create simulation input  
    * Filter and organize data from measurements into format expected by simulation  
  * Document measurements and input in a database  
* Examples  
  * Chassis  
    * *Chassis measurements slide*  
    * Static measurements  
      * Suspension mounting locations \- CAD / CMM  
      * Fuel cell & driver location \- CAD / CMM  
      * Mass  
    * Dynamic measurements  
      * Moment of inertia \- CAD / Rig  
        * **Moment of inertia (MOI)** \- a rigid body's resistance to changes in rotation rate about a specific axis  
        * Care about this for all large masses  
      * Compliance \- K\&C machine  
  * ARB system  
    * *ARB measurement slide*  
    * Static measurements  
      * Lengths, pivot locations, mass \- CAD / CMM  
    * Dynamic measurements  
      * System rate (torque per deg of twist) \- Rig  
        * Vary configurations  
      * Capture “near zero behavior” (i.e. lash)  
  * Springs and dampers  
    * *Spring and damper measurement slide*  
    * Static measurements  
      * Min/max lengths, mass  
    * Dynamic measurements  
      * Force vs displacement/velocity curves \- Rater  
    * Raters can be stand-alone (Roehrig) or as installed on the car (pull-down/push-up rigs, 7-post)  
  * ICE  
    * *ICE measurement slide*  
    * Static measurements  
      * Mass, mounting position within vehicle  
    * Dynamic measurements  
      * Torque vs throttle vs RPM curve \- engine dyno  
      * Fuel consumption rate \- engine dyno
