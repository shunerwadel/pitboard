### Experiments

* In order to learn about the vehicle we have modeled, we need to subject our vehicle model to different virtual experiments  
* **Vehicle dynamics simulation experiment** \- virtual testing of the vehicle model which mimics lab or track conditions and outputs data for engineering analysis  
* *Static experiments slide*  
* Static experiments  
  * Assembly / Assembler \- Kinematic assemble of virtual vehicle components in order to achieve wheel alignment targets and exercise vehicle in heave and roll  
    * Kinematic only, no force / moment balancing  
    * Inputs: virtual component definitions, wheel alignment and ride height targets  
    * Outputs: Shims, heave / roll results vs wheel travel (kin curves), element lengths  
    * *Review example kin graphs*  
  * Setup \- experiment that places the virtual vehicle at the prescribed setup state by tuning force elements, shims amounts, and CofG position to balance forces and achieve wheel alignment targets  
    * Force / moment balance returning results from a known state  
    * Input: results from assembler, setup targets, force element definitions, compliance values  
    * Outputs: Shims, spring element preloads, element lengths, CofG position  
    * *Review example of setup results*  
  * Static / Out of Garage / Pit Lane \- experiment that places the virtual vehicle at the prescribed static state by applying user defined conditions  
    * Force / moment balance returning results from an unknown state(s)  
    * Input: results from setup, user defined conditions  
    * Output: Loads, heights, element lengths, CofG position  
    * *Review example of static results*  
* Dynamic  
  * *Speed-path-follow lap sim slide*  
  * **Speed-path-follow lap sim** \- virtual dynamic experiment in which the vehicle model follows a given trajectory at a given speed around a particular track  
    * Main experiment type for correlation to track data  
    * Can provide lap time sim sensitivity by evaluating available Fx and Fy and iterating on target speed trace  
    * Inputs: the defined vehicle model (typically results from OOG or pit lane state), trajectory and speed target, track model, driver model parameters  
    * Outputs: time histories of all available data channels, calculated metrics  
    * *Track model slide*  
    * **Track model** \- digital representation of road surface created from scans of a physical track using in lap simulations  
      * Specific companies specialize in scanning and creation of tracks  
    * **Driver model** \- closed-loop control algorithm responsible for commanding steering angle, throttle, and braking pressure to precisely navigate target trajectory at target speed profile  
  * *Optimization lap sim slide*  
  * **Optimization lap sim** \- lap sim experiment which seeks to optimize the vehicle’s path, speed, driver control, and/or setup by treating these inputs as free variables to be solved during the simulation  
    * Commonly used for EMS deployment/regen strategy  
    * Often simplified vehicle model  
  * *Cornering and straight-line sim slide*  
  * **Cornering sim** \- virtual dynamic experiment in which the vehicle model is run through a generically defined smooth surface corner at or through a specified speed range until reaching a given termination criteria  
    * Example: corner radius is 200m, 50-250 kph, 98% saturation or gLat=3  
    * Inputs: the defined vehicle model, experiment settings  
    * Outputs: time histories of all available data channels, calculated metrics  
    * Commonly used by race engineers for during session quick mid corner balance adjustment across different speed corners  
  * **Straight-line sim** \- virtual dynamic experiment in which the vehicle model is run in a straight-line on smooth surface through a specified speed range until reaching a given termination criteria  
    * Example: 50-350 kph, 8 gear  
    * Inputs: the defined vehicle model, experiment settings  
    * Outputs: time histories of all available data channels, calculated metrics  
    * Commonly used by race engineers for during session quick ride height adjustments  
  * *Exercise: Add simple cornering and straightline experiments*
