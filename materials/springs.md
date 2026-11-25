### Springs

* *Springs slide*  
* **Spring** \- compliant mechanical component that generates a force proportional to its displacement  
  * Store energy when compressed and release it when returned to an unloaded state  
  * Can work (i.e. be displaced) in heave, roll, or both  
  * Control how much the car moves  
* Main types of springs are torsional vs translational  
  * Torsional springs generate force when twisted  
  * Translational springs generate force when compressed  
* Common spring configurations used in motorsports  
  * Corner spring \- torsional or translational spring that displacements with suspension movement (typically in both heave and roll)  
    * Coil over is an example  
    * Called a “corner” spring because there is typically one per corner of the car  
  * Third spring \- translational spring that works only in heave  
    * Typically found in “formula” type cars like IndyCar or F1  
    * Displaced when rockers rotate in opposite directions (like they do in heave)  
  * Bumpstop \- translational spring, generally with a very “stiff” rate  
    * Used to stop the car from traveling in heave and making excessive contact with the ground  
    * Many topology options for where the bumpstop might be located  
      * Inside a corner damper  
      * On the shaft of a corner damper  
      * On a third spring/damper  
  * *Anti-roll bar slide*  
  * **Anti-roll bar (ARB, sway bar)** \- torsional spring which connects both sides of an axle and resists lateral body roll during cornering  
  * More complex than other springs, how they work:  
    * Can be a single piece or consist of a bar with arms  
    * Use “drop links” to connect the ARB to suspension   
    * Often the droplinks are compliant and introduce some non-linear rate to the “ARB system”   
    * *Review scenario on whiteboard*  
      * During cornering we build lateral acceleration and body rolls onto the outside tires   
      * If we freeze the car mid corner and rotate it from a front view to make the chassis “flat” (i.e. go from global to chassis frame) we would see the outside suspension is displaced upward and the inside tire has displaced downward relative to the chassis/body  
      * Intuitively, we know the wheels need to displace roughly the same amount in the same direction to keep the body flat (which is our goal with an ARB)  
      * Now imagine, anytime the outside wheel moves up, we could also force the inside wheel to go up thus limiting the roll? This is the idea behind an ARB.   
      * Connects to both sides of the suspension so that when one is displaced upwards, so is the other  
    * Can be a single piece (common in passenger cars) or consist of a bar with arms  
      * Both use “drop links” to connect the ARB to each side of the suspension  
      * Droplinks are often compliant to introduce some non-linear rate to the “ARB system”   
    * The tradeoff \- ARBs can provide a better aero platform but increase lateral load transferThe tradeoff \- ARB gives us a better aero platform but increased lateral load transfer  
  * Good example of typical tradeoffs we have to make as engineers as race engineers  
  * **Spring rate** \- amount of force or torque required to displace a spring a given amount  
  * Most common way to characterize a spring  
  * Can be defined as:   
    * Spring linear rate  
    * Table of displacement and associated force/torque  
  * *Spreadsheet of force/torque vs displacement*
