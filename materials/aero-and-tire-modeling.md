### Aero and tire modeling

* Intro  
  * Can’t test tires and aero in same way as physical vehicle components  
  * They involve environment components we can’t fully predict or replicate  
  * Have to work to build up our models of these areas to capture a given situation  
  * Start simple and add complexity with understanding  
* Aerodynamics modeling  
  * *Aero map slide*  
  * **Vehicle aero map** \- numerical representation that defines the relationship between a vehicle’s aerodynamic force properties (outputs) and dynamic parameters which describe the state of the vehicle (inputs)  
    * Inputs may include: ride height, yaw, roll, pitch, speed  
    * Outputs may include: CLF, CLR, CD, CS, CRM, CYM  
  * **Aero offset map** \- optional addition to base map which captures aerodynamic force properties created by a specific variable  
    * Examples: Underbody shape, NACA duct configurations, track curvature  
  * *Aero map creation slide*  
  * Aero base and offset map creation  
    * Wind tunnel testing \- allows us to gather aero data for map using real car (scale or full size)  
      * Create a test plan  
        * RH, yaw, speed sweeps  
        * Establish limits of map  
        * Specific component testing  
      * Prep car and required components  
      * Collect and filter data  
    * **Computational Fluid Dynamics (CFD)** \- dedicated aerodynamic simulation tool that predicts behavior of fluid flows and their interactions with different surfaces  
      * Allows for map creation from virtual testing  
    * Create map  
      * Common numerical representations of aero data:  
        * Look-up table  
          * *Show example table*  
        * Polynomial fit  
          * *Show example poly coefficients*  
      * Visualize map, allows for:  
        * Map quality check  
        * Initial learning about aero properties  
          * *Show map visualization*  
      * Put map into expected format for simulation  
      * Store in database and publish for use  
      * *Create aero map from raw data exercise*  
  * *Other aero modeling slide*  
  * Other aero related modeling  
    * Wind, wall proximity, & traffic are examples  
    * Adds complexity but important at top level  
* Tire modeling  
  * *Tire modeling slide*  
  * **Tire model** \- mathematical or physical representation that defines the relationship between the forces a tire generates during operation (outputs) in response to parameters which describe the state of the tire or tire/track interface (inputs).  
  * Tire model creation  
    * Gather data from tire supplier  
      * Will provide at least basic data and recommended operating conditions  
    * Tire testing  
      * Example: [How F1 Tyres Are Tested](https://youtu.be/Cvn-7bAQ75k?si=MDMYrld-ZAtUm4EW&t=396)  
      * Create test plan  
        * Fz, SA, camber, pressure sweeps  
        * Boundaries  
        * *Short exercise on test plan creation*  
      * Prep tires and required components  
        * Which compounds, special wheels, etc  
      * Collect and filter data  
    * Create tire fit  
      * *Brush tire model slide*  
      * **Brush tire model** \- framework that represents a tire's contact patch as a row of independent, elastic bristles (tread elements) attached to a rigid or flexible carcass  
        * Can capture dynamic thermal / pressure trends  
        * Defined by physical parameter values rather than fit coefficients  
      * *Pacejka slide*  
      * **Pacejka magic formula** \- empirical function that fits experimental data to represent tire behavior under various slip conditions  
        * Very commonly “simple” model  
        * Formula coefficients stored in a database  
        * Not able to model dynamic thermal or pressure trends  
      * *Add PJ or spline tire model to simulation*
