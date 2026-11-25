### Steering

* *Steering system slide*  
    * **Rack and pinion steering** \- the steering wheel rotates a gear (pinion) that moves a horizontal toothed bar (rack) left and right. This pushes or pulls the steering arms attached to the front wheels and steers the car.  
      * By far the most common type of steering system used in auto racing.  
    * Power assistance  
      * Hydraulic power steering  
        * Uses hydraulic pressure to assist the movement of the rack as the pinion rotates  
        * System used by F1 and NASCAR Cup Series  
      * Electronic power steering  
        * Uses an electronically controlled motor to assist the movement of the rack  
        * Used in LMDh, WEC, and other sports cars   
      * No power assist  
        * Used in IndyCar and Formula E  
    * **Steering ratio** \- ratio of degrees of steering wheel angle turned by the driver to angle front wheels actually pivot  
      * Example: if you turn the steering wheel 15 deg and wheels actually pivot 1 deg, the ratio is 15:1  
      * Racing cars typically have faster ratios (maybe 8:1 to 14:1) as compared to passenger cars (15:1+)  
        * Allows for quicker corrections  
      * Very important characteristic of a steering system  
        * Set based on driver preference and track configuration  
    * *Mechanical linkage & ackerman slide*  
    * Mechanical linkage  
      * **Tierod (trackrod)** \- mechanical connection between the steering system on the upright  
        * Inboard and outboard pivot positions often adjustable  
        * Attachment at the upright is either in front of or behind the steering axis to allow for creating of moment to turn wheels  
        * **Ackerman** \- steering geometry principal that accounts for the inside front tire needing to turn at a greater angle (due to smaller cornering radius) than the outside tire

* ## Powertrain

  * *Powertrain slide*  
  * **Powertrain** \- system on a car that delivers energy from the power source to the track surface and controls the vehicle’s forward or backward motion  
  * Power sources  
    * Very complex system, we will focus on what concerns race engineers  
    * Internal combustion engine (ICE)  
      * Outside of Formula E, all mainstream race series use an ICE power source  
      * ICEs convert a petroleum based fuel into mechanical energy  
      * Fuel can only be added manually while the car is stopped  
      * Fuel burns thus reducing its weight and potentially shifting the spring CofG and mechanical balance  
        * F1 case:  
          * You carry enough fuel to complete the entire race without refueling (110kg, 140 liters, 37 gal)  
          * Car gets lighter as the race goes, typically run fastest laps towards the end of the race  
          * Since the fuel cell is near the CofG balance shift isn’t a huge concern  
        * NASCAR case:   
          * Must refuel multiple times throughout the race (only carry 20 gal, 75 liters)  
          * Fuel cell is just behind the rear axle (i.e. far from the CofG)  
          * Balance can change significantly due to fuel burn multiple times during the race  
    * Electric motor  
      * Series like F1 and IndyCar utilize an electric motor and ICE as power sources  
        * I.e. they are hybrids  
      * Batteries that power the motors are continuously recharged by “harvesting” kinetic energy while braking or off throttle  
        * This is a gross over simplification, the systems on different vehicles are highly specific and thus it is out of scope to cover here  
        * A lot study and optimization goes into the strategy around when during the course of a lap the energy is harvested and when it is deployed  
    * As a race engineer, we care about our power source’s performance relative to our competition (helps with tradeoff decisions) but there is not much we can do about it so it is not a big area of focus for us  
  * *Differential slide*  
  * **Differential (diff)** \- allows inside and outside drive wheels to rotate at different speeds while still delivering power from the power unit  
    * During cornering, the outside tires have to travel a greater distance than the inside tires, thus must rotate faster  
    * Race cars use tunable Limited-Slip Differentials (LSD) which limits the difference in rotation speed between the wheels to prevent sending all the power to the wheel with the least traction

* ## Brakes

  * *Disc brake slide*  
  * Modern race cars use disc brakes  
    * Slow car by clamping down brake disc which is fixed to hub  
      * Converts wheel/disc’s kinetic energy into heat using friction  
    * Brake caliper is mechanism used to clamp brake pads onto disc  
      * Contains pistons which push against the brake pad when driver presses brake pedal  
  * As a race engineer, the main things we care about are:  
    * Cooling the brakes  
      * Ducting configurations and required air flow to cool sufficiently  
        * Less air flow (opening) usually better for aero  
    * Adjusting the braking system for driver  
      * Typically don’t have many options for discs or calipers  
      * Can easily adjust the pad to change initial “bite” and feel of the brakes to the driver  
    * Brake bias   
      * Amount of braking done at front compared to rear  
      * Common adjustment to brake system (generally driver adjustable)  
      * Typical, most braking is done by front axle  
      * Impacts balance on entry to heavy braking corners  
        * More front bias \= more understeer  
          * Front tires generating more longitudinal force, less lateral

# Week 2: Simulation

* ## Review/questions from last week

* ## 5 mins of sim time: ice breaker

  * Top laps recorded

* ## Determining the setup
