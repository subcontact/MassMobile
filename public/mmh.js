// mmh.js
//
// Share functions that are needed by many of the MassMobileHallucination clients.
//
var MMH = (function () {
	
	var me = {};
	
	// 
	// Public methods
	// 

	me.init = function (playerSocket) {
		socket = playerSocket;

		// listen to the admin messages
		socket.on('admin', function(data){
			if (data.control == "changeSettings") { // TODO rename to changeSendFrequency
				SEND_FREQUENCY = data.data.freq;
			}
		});
	}

    me.setPlayerLocation = function (location) {
        playerLocation = location;
    };

    me.getPlayerLocation = function () {
        return playerLocation;
    };


	//
	// Private stuff
	//
    var playerLocation = "right"; // default players to RHS but player can change
	var socket = null;
	var SEND_FREQUENCY = 50; // can get throttled from server
	var preProcessCallbackFunction = null;
	var postProcessor = null;

	function sendAnswerToServer(data){
        socket.emit("answer",data);
	}
	
	return me;
}());