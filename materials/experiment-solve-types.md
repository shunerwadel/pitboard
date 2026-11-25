### Experiment solve types

* *Experiment type slide (with table)*  
* Quasi-static \- simulation solve type that assumes changes happen infinitely slowly and thus acceleration and inertia terms are neglected  
  * Advantages: speed  
  * Disadvantages: reduced fidelity  
  * Experiment types: cornering, straight-line, lap sim, static  
* Quasi-steady state \- assumes vehicle moves only at steady velocity or under steady operating condition thus steady-state centrifugal and centripetal forces are present, but transient acceleration dynamics are ignored  
  * Advantages: speed (as compared to fully dynamic)  
  * Disadvantages: reduced (as compared to fully dynamic)  
  * Experiment types: cornering, straight-line, lap sim, static  
* Dynamic \- solves the complete set of time-domain differential-algebraic equations or ordinary differential equations of motion with no inherent simplifications  
  * Advantages: high fidelity  
  * Disadvantages: slow (compared to QS/QSS)  
  * Experiment types: Lap sim, DiL, setup experiment
