---
title: Tire load sensitivity
topic: tires
tags: [grip, friction, load transfer]
---

# Tire load sensitivity

Race tires do **not** scale grip linearly with vertical load. As normal load rises, the friction coefficient available at the contact patch falls — this is load sensitivity.

## Teaching points

- Peak lateral force ≈ μ(Fz) × Fz, where μ decreases as Fz increases.
- Consequence: **equalizing** left/right (and front/rear) loads usually increases total grip.
- Soft springs, anti-roll bar choice, and aero balance all change the load distribution that tires see mid-corner.

## Simple model

A common teaching model:

```
Fy ≈ (a · Fz) / (1 + b · Fz)
```

Where `a` and `b` are tire-specific. The important classroom takeaway is the **shape**, not the coefficients: diminishing returns with load.

## Classroom cue

Ask: “If we move 100 N of load from the inside tire to the outside, does total Fy go up or down?”  
Answer with load sensitivity: usually **down**, because the outside tire was already in the flatter part of the curve.
