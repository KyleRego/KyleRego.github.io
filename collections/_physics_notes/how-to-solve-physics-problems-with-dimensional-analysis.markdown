---
layout: post
title:  "Dimensional analysis"
categories: physics
permalink: /dimensional-analysis
emoji: 🫠
mathjax: true
note_category: Physics
---

I will demonstrate how this works by solving a simple problem in a standard way and then again using the dimensional analysis technique.

# Problem

Determine the horizontal distance $$ d $$ a projectile travels before hitting the ground after being fired at 45 degrees above the horizontal at a speed of $$ v $$. Ignore non-conservative forces and the curvature of the Earth.

# Solution using elementary Physics

The equation of motion is Newton's second law where the mass is constant:

$$ \vec {F} = m \vec {a} $$

By defining the x- and y-axes to be in the plane the projectile travels, we have the following:

$$ F_{x} = m a_{x} = 0 \rightarrow a_{x} = 0$$

$$ F_{y} = m a_{y} = -mg \rightarrow a_{y} = -g $$

Acceleration is the derivative of velocity:

$$ a_{x} = 0 = \frac{dv_{x}}{dt} \rightarrow v_{x} = C = v_{xi} $$

$$ a_{y} = -g = \frac{dv_{y}}{dt} \rightarrow v_{y}(t) = -gt + C = -gt + v_{yi} $$

Velocity is the derivative of position:

$$ v_{x} = \frac{dx}{dt} = v_{xi} \rightarrow x(t) = v_{xi}t + C = v_{xi}t + x_{i} $$

$$ v_{y} = \frac{dy}{dt} = -gt + v_{yi} \\
\rightarrow y(t) = -\frac{1}{2}gt^{2} + v_{yi}t + C = -\frac{1}{2}gt^{2} + v_{yi}t + y_{i} $$

By definition $$ x_{i} = y_{i} = 0 $$ and from trigonometry we also have the following:

$$ v_{xi} = v \cos(\pi/4) = \frac{\sqrt 2}{2}v $$

$$ v_{yi} = v \sin(\pi/4) = \frac{\sqrt 2}{2}v $$

So basically we have the following two equations:

$$ x(t) = \frac{\sqrt 2}{2}vt $$

$$ y(t) = -\frac{1}{2}gt^{2} + \frac{\sqrt 2}{2}vt $$

If you're wondering why I derived these equations which you probably learned in high school, it's because it takes me about 30 seconds to do so and it's a more general approach which also works when the net force on the mass is not constant (such as if there was a drag force negatively proportional to the velocity).

Now comes the physical intuition part, where we will use this equation that we noted earlier:

$$ v_{y}(t) = -gt + v_{yi} = -gt + \frac{\sqrt 2}{2}v $$

The physical intuition is that at the top of the trajectory, $$ v_{y} = 0 $$ at the very moment $$ t = t_{f}/2 $$ which means:

$$ 0 = -gt_{f}/2 + \frac{\sqrt 2}{2}v \rightarrow t_{f} = \frac{\sqrt 2}{g}v $$

Since $$ x(t_{f}) = x_{f} $$ this is the solution:

$$ d = x_{f} = \frac{\sqrt 2}{2} v \frac{\sqrt 2}{g} v \rightarrow d = \frac{v^2}{g} $$

This is a nice special case of the general solution which would treat the angle, which was 45 degrees in this case, generally.

# Solution using dimensional analysis

To solve the problem using the dimensional analysis, just think about the units. The solution $$ d $$ has units of length and it will be a function of $$ v $$, $$ g $$, and $$ \theta $$, which have units of length/time, length/time$$^2$$, and angular units (technically a ratio of lengths, and thus unitless) respectively. The units on the right-hand side and left-hand side of the solution must be equal. This is only satisfied by:

$$ d = \alpha(\theta)\frac{v^2}{g} $$

In this case there are only a few parameters and figuring out how to arrange them is simple. When there are more parameters, it becomes an algebra problem. According to [Wikipedia](https://en.wikipedia.org/wiki/Range_of_a_projectile), the general solution is this:

$$ d = \sin(2\theta)\frac{v^2}{g} $$

It is a limitation of the dimensional analysis that we cannot calculate the dimensionless constant. However, we could experimentally measure $$ d $$ for different $$ \theta $$ and constant $$ v $$ and curve fit the measurements. By doing so, we could determine $$ \alpha(\theta) = \sin(2\theta) $$.

There are other limitations too. Some of the physical parameters could be combined in such a way that they produce additional dimensionless parameters that could appear in the solution. Even so, since this can be used to find solutions to some problems that would very difficult to solve, it is a good technique to keep in mind.