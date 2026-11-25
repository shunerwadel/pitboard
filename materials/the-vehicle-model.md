### The vehicle model

* *Vehicle model slide*  
* **Vehicle model** \- mathematical / computational code within a simulation toolchain that represents the physical vehicle and its sub systems  
  * Wide range of complexity  
    * Simple example: bicycle model  
    * Complex example: fully dynamic multi-body vehicle model  
      * This is what we would have in high level motorsports  
* Parametric vs dynamic multi-body  
  * *Parameteric vehicle model slide*  
  * Parametric \- reduces vehicle model to set of tables, coefficients, and rates/stiffnesses.  
    * Advantages: low computational overhead, fast, ease of development  
    * Disadvantages: lacks physical accuracy, less predictive, not great for high frequency, no internal suspension loads  
    * Example inputs: camber versus wheel travel curve  
    * You parametric models up to capture different effects  
  * *Multi-body vehicle model slide*  
  * Multi-body \- models each component of the suspension (or other sub-system)  
    * Advantages: high fidelity, predictive, captures many states  
    * Disadvantages: slow, computationally expensive  
    * Example inputs: stiffness, mass properties, attachment points (X,Y,Z)  
    * Once you build a MB model, you capture the vehicle as a whole and extract data out of the model  
* *Exercise: Build basic lateral load transfer simulation*
