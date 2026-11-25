### Simulation

* **Vehicle dynamics simulation** \- mathematical replication of a vehicle's physical movements and behaviors within a virtual environment  
      * Basic goal \- predict different states of the car, static or dynamic, based on a set of inputs  
    * Developement  
      * Commercial \- can buy “off the shelf” (Canopy, Adams, CarSim)  
      * Bespoke \- Built in-house by race team  
        * Larger teams build their own simulation toolchain  
        * Provides ability to create competitive advantage when exploring new ideas (quick implementation)  
      * Motorsports software is typically developed using common software engineering practices  
        * Scrum teams  / sprints  
        * Source control (git)  
        * Development vs production environments  
    * How it is utilized  
      * Offline \- cornering, straightline, or lap simulations run on a single users computer (i.e. engineers laptop)  
        * Console app or API (application programming interface) \- way to run simulations from a script or programmatically  
        * Installed application or web page with full UI  
      * Batch \- collection of simulations we want to run at once  
        * Remote or local  
        * Variations on a baseline setup or multiple distinct setups  
      * DiL \- driver in loop simulator  
    * Race engineer will always use a combination of theoretical results from simulation and lived experience (historical) to make final decisions

* ## Simulation toolchain
