MassMobileHallucination (aka the MASS MOBILE EXPERIMENT)

><<       ><<><<       ><<><<<<<<<<
>< ><<   ><<<>< ><<   ><<<><<
><< ><< > ><<><< ><< > ><<><<
><<  ><<  ><<><<  ><<  ><<><<<<<<
><<   ><  ><<><<   ><  ><<><<
><<       ><<><<       ><<><<
><<       ><<><<       ><<><<<<<<<<


A game for playing with lots of people on mobiles looking at the same web page at the same time.

Suited to conference talks. This is really just an all-JavaScript experiment.

To try the app, run node.js on server.js on your local machine and then launch a few browser
windows.
In one put the playfield http://localhost:8080/playfield.
In the others put a regular client pointed http://localhost:8080
In another launch the controller (with great power comes great responsibility!)  http://localhost:8080/control

... enjoy!

TODOs
=====
x move the players to their own module
o use a smaller socket.id to save bandwidth
x collate different update types
x group updates and send periodically to playfield.
x write the REAL game
x Fix the type in the repo name.
x get a basic socket.io example working so I know how it works
x static file server for the mobile page and graphics - USED EXPRESS
x set up game viewing page
x socket commands for receving updated screen positions for online viewer
x set up server on Heroku
x game engine to play the game - moved to client
x and update based on inpnceut and actions.
x sign up page to put in your name.
x Test controls with two buttons Left Right
x Gets accelerometer detection working for iphone/android and windows mobile
x sockets for receiving telematray data from mobiles
x give a diffent page for each mobile controller

Games Idea's
===============
x pong
o flying stars
o tetris
o guess the color - collectively
o tug of war - a pull only lasts for 2 seconds, so must be coordinated. Two halfs of the auditorium
o capture the bricks - run, get bricks, bring back to home base.
x debate with worm
o real helicopter
o capture the flag - someone has the flag
o rowers rowing
o choose your own adventure
o a grid of 100 iPhones that become a big screen - touchable!
o maze - small section on your phone, big picture on screen. Race to the end.
o bounce
x quiz
o mexican wave
o memory game - you need to find the matching tiles and you can only turn over one tile at a time

The Model
=========
The server is lightweight and really dumb. The game engine will be in the client. The server
will only act as a relay of client messages to the playfield. 

Downside: if the playfield browser craps out, the game is lost.
Upside: server does not have to maintain state and can be quite thin.

Requirements
===========
npm install socket.io
npm install express

Cheers,
Simon & Aidan
simonraikallen@gmail.com
aidancasey@gmail.com
