# commonjs-play-lsystems

    cd $PROJECT_ROOT/htdocs/browsify
    npm install
	npm run watch2d

    grunt mochaTest

    grunt see


# To Do

Browserify — should have stuck with Require.js

# Sample Programs

```
Sample Programs
===============

#define W   0.5
#define AS   2
#define BS   1
#define R    1
#define L   -1


 w : !(W)F(BS,R)
p1 : F(s,o) : s == AS && o == R -> F(AS,L)F(BS,R)
p2 : F(s,o) : s == AS && o == L -> F(BS,L)F(AS,R)
p3 : F(s,o) : s == BS           -> F(AS,o)

p1 : F(s,o) : s == 2 && o ==  1 -> F(2,-1)F(1, 1)
p2 : F(s,o) : s == 2 && o == -1 -> F(1,-1)F(2, 1)
p3 : F(s,o) : s == 1 &&         -> F(2, o)

!(0.5)F(1,1)
!(0.5)F(2,1)
!(0.5)F(2,-1)F(1,1)
!(0.5)F(1,-1)F(2,1)F(2,1)

rule p2
F(1,-1)F(2,1)F(2,1)
rule p3
```
