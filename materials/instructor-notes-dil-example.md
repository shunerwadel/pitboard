---
title: Instructor notes — systems overview
topic: systems
tags: [instructor notes, DiL, HIL, overview]
---

# Course opener

- Welcome students and set expectations for the lab sequence.
- Safety briefing and track-day logistics come first every session.
- Point people at the syllabus checklist before diving into tech.

## Weight transfer warm-up

- Lateral transfer scales with mass, ay, and CG height over track.
- Roll stiffness distribution sets front vs rear share of that transfer.
- Use this as a bridge into tire load sensitivity later.

## Driver-in-the-Loop (DiL)

- DiL couples a human driver to a simulated vehicle plant in real time.
- Use DiL when you need subjective feel, driver adaptation, or maneuver development that pure offline sims miss.
- Keep latency low: steering, visuals, and motion cues must stay coherent or the driver adapts to the wrong car.
- Typical teaching cue: contrast DiL with Model-in-the-Loop and Hardware-in-the-Loop on the same slide.
- Classroom question: what fails first when frame time spikes — the model, the driver model of the car, or both?

## Hardware-in-the-Loop (HIL)

- HIL puts real ECUs or actuators against a simulated rest-of-vehicle.
- Good for firmware bring-up and fault injection without a full vehicle.
