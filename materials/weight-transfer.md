---
title: Lateral weight transfer
topic: dynamics
tags: [suspension, roll, balance]
---

# Lateral weight transfer

In steady-state cornering, lateral acceleration shifts vertical load from the inside tires to the outside tires.

## Core relation

Total lateral transfer (both axles):

```
ΔFz_total = (m · ay · h) / t
```

- `m` — vehicle mass  
- `ay` — lateral acceleration  
- `h` — CG height  
- `t` — track width  

How that total splits **front vs rear** is set by roll stiffness distribution (springs + anti-roll bars) and unsprung / geometric contribution.

## Why it matters on a race car

- More front roll stiffness → more front load transfer → front tires work harder → tends to **understeer**.
- More rear roll stiffness → tends to **oversteer**.
- Lower CG and wider track reduce total transfer — both free grip if packaging allows.

## Talk track

1. Draw the free-body: inertia at CG, contact patches at the ground.  
2. Separate **total** transfer from **distribution**.  
3. Connect ARB clicks to the understeer gradient students feel on track.
