---
layout: post
title:  "The infinite square well"
categories: physics
permalink: /the-infinite-square-well
emoji: 😋
mathjax: true
---

The infinite square well is a toy problem in Modern Physics (a sophomore Physics course) that is interesting (to me) because it is an example of a solvable Schrodinger equation. The general time-independent version of this is the following:

$$ \hat {H} \Psi = E \Psi $$

We are looking for eigenfunctions of the Hamiltonian which we call the wave functions. The classical Hamiltonian in one dimension (x) is the following:

$$ H(x, p) = \frac { p^2 } { 2m } + V(x) $$

This operator represents momentum in Quantum Mechanics: 

$$ \frac { \hbar } { i } \frac { \delta } { \delta x } $$

With these substitutions, the following is the Schrodinger equation to solve:

$$ - \frac { \hbar^2 } { 2m } \frac { d^2 \Psi } { d x^2 } + V(x) \Psi = E \Psi $$

The following potential completes the definition of the problem:

$$ V(x)= 
\begin{cases}
0 & 0\leq x \leq a \\ 
\infty & \text{elsewhere}
\end{cases} $$

The particle cannot exist outside of the square well because the potential energy there would be $$ \infty $$. We only need to solve the equation where $$ V(x) = 0 $$.

If we define k in the following way:

$$ k = \frac { \sqrt {2mE} } { \hbar } $$

Then inside the well, this is the equation we need to solve:

$$ \frac { d^2 \Psi } { dx^2 } = -k^2 \Psi $$

By inspection, this is a very common differential equation (a mass on a spring with no friction and a pendulum with the small angle approximation are examples) with the following solution:

$$ \Psi(x) = A \sin(kx) + B \cos(kx) $$

To determine the specific form of the solution, we need to consider the boundary conditions. $$ \Psi = 0 $$ at $$ x = 0 $$ implies that $$ B = 0 $$. It also follows from $$ \Psi = 0 $$ at $$ x = a $$ that:

$$ ka = 0, \pm \pi, \pm 2 \pi, ... $$

With this and the definition of $$ k $$ from before, this is what we have so far:

$$ \Psi_{n}(x) = A \sin( \frac { n \pi } { a } x) $$

$$ E_{n} = \frac {n^2 \pi^2 \hbar^2} {2 m a^2} = \frac {n^2 h^2} {8 m a^2} $$

where the last simplification is due to $$ \hbar = h/2\pi $$. We can see from this that the allowed energy states are discrete, which is a fundamental result.

To determine A, we just need to normalize the solution. The probability density of finding the particle is $$ \Psi^{*}\Psi $$ and the probability of finding the particle in $$ 0 < x < a $$ is 1:

$$ 1 = \int_0^a A^{2} \sin^{2}( \frac { n \pi } { a } x) \, dx $$

Introduce the u-substitution $$ u = n \pi x/a $$, from which it follows $$ du = n \pi dx/a $$. With this trigonometric identity:

$$ \sin^2{u} = \frac {1-\cos(2u)} {2} $$

The integral can be evaluated:

$$ 1 = \int_0^{n\pi} A^{2} \frac{a} {n \pi} \sin^{2}(u) \, du 
  \\ = A^{2} \frac{a} {n \pi} \int_0^{n\pi}  \frac {1-\cos(2u)} {2} \, du
  \\ = A^{2} \frac{a} {2n \pi} [(n\pi - \sin(2n\pi)) - (0 - \frac {\sin(0)} {2})] 
  \\ = A^{2}a $$

That whole step can be skipped with an integral table, but anyway, this is the solution:

$$ \Psi_{n}(x) = \sqrt{\frac {2} {a}} \sin( \frac { n \pi } { a } x) $$

You can imagine how involved the math becomes for a problem such as the Hydrogen atom where the Schrodinger equation is three-dimensional with spherical symmetry. 

If you add a second electron to the atom, i.e. Helium, it becomes a three-body problem (two electrons and the nucleus). No closed-form solutions are believed to exist for this class of problems, although computational methods such as the Hartree-Fock theory can be used.