/*
 * Mass Mobile Hallucination.
 *
 * Copyright (c) 2012 MYOB Australia Ltd.
 *
 * Server side controller code for handling messages from the controller dashboard.
 */
var players = require("./players.js");
var playfield = require("./playfield.js");

module.exports = {
    sockethandlers: function (socket) {

        // Administrative messages
        socket.on('admin', function (message) {
            console.log("socket.on 'admin'");
            if (message.scope == "players")
            {
                console.log('player admin message');
                players.sendAdminMessage(message.control, message.data);
            }
            else if (message.scope=="playfield")
            {
                console.log('playfield admin message');
                playfield.sendAdminMessage('admin', message.data);
            }
            else if (message.scope=="server")
            {
                console.log('server admin message');
                playfield.changeServerSettings( message.data);
            }
        });

        // Handle the change game event. Tells the playfield to change the game. This
        // in turn triggers a broadcast to the players. But we'll leave that up to the
        // playfield to deal with.
        socket.on('changeGame', function (gameName) {
            console.log("controller: received 'changeGame' to " + gameName);
            playfield.changeGame(gameName);
            players.changeGame(gameName);
        });
    }
}