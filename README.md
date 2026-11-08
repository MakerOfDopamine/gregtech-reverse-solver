# gregtech-reverse-solver
 
this is a project i made for convenience when i was playing the Minecraft mod GregTech.

in the mod, frequently there will be large lines of processing chain with interleaving dependencies, which were usually solved with Excel spreadsheets. however, doing that manually is unwieldy and takes much more time per additional input the more inputs you already have to keep track of. furthermore, the more dense the output is (which drives it away from being a single, calculator-optimizable ratio chain), the less easy it is to optimize manually.

## what's in this repo

the page `index.html` is the main page of the solver. this page can be opened for the solver. it is also available at https://makerofdopamine.github.io/gregtech-reverse-solver.

## why this took me ten hours

you may be wondering: hey, this is only a basic webpage without even that much css! how did this take you ten whole hours to make?

to that, i answer: the difficulty is in the technicalities (`solver.js`). the file contains an almost full implementation of the classic simplex method solver for linear programming. basically, it solves problems like:
```
Minimize a + b + c
Given that:
- a, b, c >= 0 // this is almost always assumed in any real system
- a + b >= 5
- c - b >= 3
- 4a + 5b - 3c <= 2
```
by treating the potential solution space as a simplex (an n-dimensional tetrahedron: each separate variable is another dimension in which the solution can change). for this context, each separate process is another dimension the solver travels through.

the technical bits: the solver implements the simplex tableau with consistent conventions (which took up much of the time of the debugging unfortunately), the phase 1 pre-optimization through adding artificial variable columns to find at least one feasible solution, and the phase 2 optimization using Bland's rule to avoid degeneracy and cycles while finding the optimal solution to the problem.

(if you are interested, further information may be found in a plethora of linear programming textbooks on the internet, chief of which (this is also what i used for reference) was Matoušek & Gärtner, "Understanding and Using Linear Programming")

the answer to the secondary very obvious question of "why don't you just use a library?" is that i wanted to simultaneously test my coding prowess and my mathematical understanding of the concept of linear algebra (of which linear programming and optimization is a subset of) through this project, while simultaneously solving a very real problem i encounter in my everyday life.

unfortunately, although my programming ability was roughly up to the cut, my mathematical understanding of optimization was decisively not. this leads into...

## AI usage

Getting more serious here. AI was used in this project to explain a majority of the mathematical concepts, after repeated failures of my imagine to understand what was being described. No large snippets of AI code were pasted directly into the codebase. Any potential AI snippets (as I do not fully remember the history) is limited to 3~5 lines.

AI was also used to debug the tableau sign conventions after I had spent ample time attempting to debug it myself (the majority of which were spent in the console and thus not logged in HackaTime) and decided that it would neither be a productive use of my time nor my mood to continue to do so.

Other than that, all code is my own.