/*
 * Mass Mobile Hallucination.
 *
 * Copyright (c) 2012 MYOB Australia Ltd.
 *
 */


var port    = process.env.PORT || 8080;
var express = require("express");
var app     = express(); 
var io      = require('socket.io').listen(app.listen(port));

console.log("Server listening on port %d", port);


var playfield   = require('./lib/playfield.js');
var players     = require('./lib/players.js');
var controller  = require('./lib/controller.js');

// The currently connected user list
var playerList = {};

io.set('log level', 2); // turn logging down
io.enable('browser client minification'); // send minified client
io.enable('browser client etag'); // apply etag caching logic based on version number
io.enable('browser client gzip'); // gzip the file


process.on('uncaughtException', function (err) {
    console.log('uncaught error' + err);
});

// serve up static content images, css etc...
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/images'));
app.use(express.static(__dirname + '/public/lib'));

// Give some things nice names
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/index.html');
});
app.get('/playfield', function (req, res) {
    res.sendfile(__dirname + '/public/playfield.html');
});
app.get('/control', function (req, res) {
    res.sendfile(__dirname + '/public/controller.html');
});
app.get('/pongadmin', function (req, res) {
    res.sendfile(__dirname + '/public/pongadmin.html');
});
app.get('/quizadmin', function (req, res) {
    res.sendfile(__dirname + '/public/quizadmin.html');
});

// set up socket handlers (one per namespace)
// Should this move to each of the modules???
// TODO make te full connections list not global!
connections = {
    players: io.of('/players').on('connection', players.playerhandlers),
    playfield: io.of('/playfield').on('connection', playfield.playfieldhandlers),
    controller: io.of('/control').on('connection', controller.sockethandlers)
}

// pass the player list to both modules as this is the main server state.
players.setPlayers(playerList);
playfield.setPlayers(playerList);

// start the timer that periodically sends player updates to the playfield
playfield.startUpdates();