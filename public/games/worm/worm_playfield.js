/*
 * Mass Mobile Hallucination.
 * Copyright (c) 2012 MYOB Australia Ltd.
 * 
 *  implementation of the worm game.
 */
var WormPlayfield = (function (playfieldSocket) {
	var me = {};

	//
	// Publics
	//	
	me.init = function () {
		// tell the server we don't want totals (only real time updates)
		playfieldSocket.emit("admin", "yes_totals");
		playfieldSocket.emit("admin", "no_updates");
		playfieldSocket.emit("admin", {update_frequency: 100}); 
	}	
	me.newUser = function (data) 	{ }
	me.woosOut = function (data) 	{ }
	me.positionUpdates = function (updates) { /* ignore these */ }
	me.totalUpdates = function (updates) { processTotalUpdates(updates) }
	me.shutdown = function () { }
	me.admin = function(message) { }
	
	me.initPlayers = function (players) { }

	me.averageWorm = function () { return averageWorm; }
	//
	// privates
	//
	var averageWorm = 0;
	function processTotalUpdates(updates) {
		// HACK: combine left and right side updates until we fix this on the server
		totalValues = updates.left.totalTiltFB + updates.right.totalTiltFB;
		totalCount = updates.left.count + updates.right.count;
		averageWorm = totalValues/totalCount;
	}
	return me;
}(socket));