# commonjs-play-lsystems

## Setup

    npm install
    npm install -g tiny-server
    npm serve & # Starts a tiny-server, then open http://localhost:3000/eg/2d.html
    npm run # npm debug

## 2d

2d is solid, but 3d is just a wip experiment.

## Sound

This module does not include the sound generation.

## Sample Input

The sample GUI contains several presets, using the following style:

    #define W    0.5
    #define AS 	 2
    #define BS 	 1
    #define R 	 1
    #define L    -1


    w : !(W)F(BS,R)
    p1 : F(s,o) : s == AS && o == R -> F(AS,L)F(BS,R)
    p2 : F(s,o) : s == AS && o == L -> F(BS,L)F(AS,R)
    p3 : F(s,o) : s == BS	        -> F(AS,o)

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
