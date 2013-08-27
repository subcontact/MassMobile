/*
* Mass Mobile Hallucination.
* Copyright (c) 2012 MYOB Australia Ltd.
* 
* intro
*/

var IntroPlayfield = (function () {
	var me = {};

	var socket;
	//
	// Publics
	//	
	me.init = function (socket) {
		// tell the server we don't want jack
		socket.emit("admin", "no_updates");
		socket.emit("admin", "no_totals");
	}	
	me.newUser 		= function (data) 	{ addUser(data); }
	me.woosOut 		= function (data) 	{ removeUser(data); }
	me.nameChange 	= function (data) 	{ nameChange(data); }
	me.players = function (players) {  }
	me.positionUpdates = function (updates) { processPositionUpdates(updates) }
	me.totalUpdates = function (updates) { processTotalUpdates(updates) }
	me.shutdown = function () { }
	me.admin = function(message) {  }

	me.initPlayers = function (players) { }

	//
	// privates
	//

	var users=0;
	function addUser(data) {
		users++;
		showUsers();
	}
	function removeUser(data) {
		users--;
		showUsers();
	}
	function showUsers() {
		$("#users").html(users);
	}
	function nameChange(data) {
		var newDiv = $('div').css({position: 'absolute', left: '100px', top: '100px'}).text(data.username).appendTo($('body'));
		newDiv.fadeOut(5000);
	}
	function processPositionUpdates(updates) {
		// ignoring for now
	}

	function processTotalUpdates(updates) {
		// ignoring for now
	}
	return me;
}());