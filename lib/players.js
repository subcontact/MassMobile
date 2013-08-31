/*
 * Mass Mobile Hallucination.
 *
 * Copyright (c) 2012 MYOB Australia Ltd.
 *
 * Server side code to handle all messages coming from players.
 */
var playfield = require('./playfield.js');
var players = null; // passed in from mmh.
var currentGame;

module.exports = {
    playerhandlers: function (socket) {
        players[socket.id] = {};
        players[socket.id].id = socket.id;

        console.log("players: sending 'newuser' to playfield");
        connections.playfield.emit('newuser', {
            id: socket.id
        });

        socket.on('namechange', function (name) {
            console.log("player: received 'namechange'");
            players[socket.id].username = name;
            connections.playfield.emit('namechange', {
                id: socket.id,
                username: name
            });
        });

        socket.on('getgame', function() {
            socket.emit("changeGame", (currentGame)? currentGame : "intro");
        });

        socket.on('custom', function (data) {
            console.log("players: received custom message from from player" + players[socket.id].username)
            playfield.sendCustomMessage(socket.id, data);
        });

        socket.on('disconnect', function () {
            console.log("player: disconnected by " + players[socket.id].username + " sending woosout to playfield");
            playfield.woosOut(socket.id);
            delete players[socket.id];
        });
    },

    sendAdminMessage: function (control, data) {
        connections.players.emit(control, data)
    },

    changeGame: function (newGame) {
        console.log("players: sending change game to " + newGame + " to all players");
        connections.players.emit("changeGame", newGame);
        currentGame = newGame; // store for late commers
    },

    setPlayers: function (aPlayerList) {
        players = aPlayerList;


    }
}