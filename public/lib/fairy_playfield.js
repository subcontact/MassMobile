/*
 * Mass Mobile Hallucination.
 * Copyright (c) 2012 MYOB Australia Ltd.
 * 
 * Fairy.js - implementation of the fairy game. Client side playfield.
 */

var FairyPlayfield = (function () {
	var me = {};
	var socket;
	
	//
	// Publics
	//	
	me.newUser 			= function (data) 	 { newUser(data) }
	me.woosOut 			= function (data) 	 { woosOut(data) }
	me.players 			= function (players) { players(data) }
	me.positionUpdates 	= function (updates) { processPositionUpdates(updates) }
	me.totalUpdates 	= function (updates) { processTotalUpdates(updates) }
	me.admin 			= function (message) { alert("Fairy playfield got an admin message: " + message); }
	me.processUserAnswer = function (answer) {}


	me.init = function (theSocket) {
alert("fairinig initialized");
		socket = theSocket;
		
		// tell the server we don't want totals (only real time updates)
		socket.emit("admin", "no_totals");

		// Start the timer that measures timing statistics
		stats();
		
		// redraw the board when we come back here. On the first time it might do nothing.
		updateBoard(); 
	}

	me.shutdown = function () { 
		// stop the stats timer
		clearTimeout(timer);
	}
	
	// place players randomly on the screen
	me.initPlayers = function (players) {
		theBoard = {};
		numberOfPlayers = 0;
		for (p in players) {
			theBoard[players[p].id] = {};
			if (players[p].username) theBoard[players[p].id].username = players[p].username;
			theBoard[players[p].id].x = Math.random()*MAX_X;
			theBoard[players[p].id].y = Math.random()*MAX_Y;
			theBoard[players[p].id].xaccel = 0;
			theBoard[players[p].id].yaccel = 0;
			numberOfPlayers++;
		}
		updateBoard();
    };
	
	//
	// Privates 
	//

	var theBoard = {};
	var numberOfPlayers = 0;
	var numberOfCalls = 0;

	var times = 0;
	var totalTime = 0;

	MAX_X = 900;
	MAX_Y = 600;

	processTotalUpdates = function (updates) {
		// ignore these. Shouldn't receive too many because the clients are instructed not to send them.
	}
	
	me.processPositionUpdates = function (updates) {
		// record the change for stats
		numberOfCalls += updates.length;

		// start a timer
		var start = new Date().getTime();

		// process the player move			
		for (update in updates) {
			var data = updates[update];

			if (!theBoard[data.id]) { // boundary condition on playfield restart
				continue;
			}
		
			//
			// Algorithm: convert a value from -90 to +90 into a range of -10 to 10 and 
			// 			  move the acceleration towards it.
			//
		
			// left right tilt acceleration
			var val = parseInt(data.accel.tiltLR) / 90 * 10; 
			var accel = theBoard[data.id].xaccel;
			var delta = Math.abs(accel - val) * .2; // how fast to move towards the new accel
			if (val > accel) { theBoard[data.id].xaccel += delta; }
			else { theBoard[data.id].xaccel -= delta; }

			theBoard[data.id].x += theBoard[data.id].xaccel * 2;
			document.getElementById("log").innerHTML = "val " + val + " accel " + accel + " delta " + delta + " x " + theBoard[data.id].x;

			// Forward back tilt acceleration
			var val = parseInt(data.accel.tiltFB) / 90 * 10; 
			var accel = theBoard[data.id].yaccel;
			var delta = Math.abs(accel - val) * .2; // how fast to move towards the new accel
			if (val > accel) { theBoard[data.id].yaccel += delta; }
			else { theBoard[data.id].yaccel -= delta; }

			theBoard[data.id].y += theBoard[data.id].yaccel * 2;
			document.getElementById("log2").innerHTML = "val " + val + " accel " + accel + " delta " + delta + " y " + theBoard[data.id].y;

			// don't let them go off the board
			if (theBoard[data.id].y > MAX_Y) { theBoard[data.id].y = MAX_Y; } 
			if (theBoard[data.id].x > MAX_X) { theBoard[data.id].x = MAX_X; } 
			if (theBoard[data.id].y < 0) { theBoard[data.id].y = 0; } 
			if (theBoard[data.id].x < 0) { theBoard[data.id].x = 0; } 
		}

		updateBoard();

		// end timer
		var end = new Date().getTime();
		totalTime += end - start;
		times ++;
	}

	// user changed their name
	// Sometimes the player with data.id is not found. Not sure why!
	function nameChange(data) {
		theBoard[data.id].username = data.username;
		updateBoard();
	}

	// handle the arrival of a new user to the game
	function newUser(data) {
		theBoard[data.id] = {};
		theBoard[data.id].x = Math.random()*MAX_X;
		theBoard[data.id].y = Math.random()*MAX_Y;
		theBoard[data.id].xaccel = 0;
		theBoard[data.id].yaccel = 0;
		numberOfPlayers++;

		updateBoard();
	}

	// Color them out on woosing out of the game
	function woosOut(data) {
		theBoard[data.id].dead = true;
		updateBoard();
	}

	function updateBoard() {
		var c=document.getElementById("playfield");
		var ctx=c.getContext("2d");
		var x,y;
		
		ctx.clearRect (0,0,MAX_X,MAX_Y);
		for (p in theBoard) {
			x = theBoard[p].x;
			y = theBoard[p].y;
			if (!theBoard[p].dead ) { 
				ctx.fillStyle="#ff4411"; 
			} else { 
				ctx.fillStyle="#113311"; // black
			}
			ctx.fillRect(x,y,50,50);
			ctx.fillStyle="#ffffff"; 
			ctx.fillRect(x+10,y+10,30,30);
			ctx.fillStyle="#113322"; 
			ctx.strokeRect(x+12,y+12,28,28);

			if (theBoard[p].username) {
				ctx.fillStyle="#ff1144"; 
				ctx.font = "bold 15px arial";     // different font
				ctx.fillText(theBoard[p].username, x, y);
			}
		}	
	}

	// every second see how many user updates were received		
	var lastCount = 0;
	var timer = null;
	
	// write the stats to the playfield
	function stats() {
		callsInThisPeriod = numberOfCalls - lastCount;
		document.getElementById("stats").innerHTML = callsInThisPeriod;
		lastCount = numberOfCalls;

		document.getElementById("timer").innerHTML = totalTime/times;
		totalTime=0;times=0;

		timer = setTimeout(stats, 1000);
	}
	
	return me;
}());