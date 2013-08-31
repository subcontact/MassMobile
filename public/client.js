
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

// 
// Socket messages received by each client
//
var socket = io.connect('/players', {'sync disconnect on unload' : true});

socket.on('changeSettings', function (data) {
    changeSettings(data);
});

socket.on('changeGame', function (game) {
    // not sure what to do if the game is intro for now!?
    changeGame(game);
});

//
// client helper functions
//

// Change the game on request of the controller and initialize the screens and data
function changeGame(gameName) {

    if (typeof stopClient === "function") { stopClient(); }

    $("#main").load("/games/" + gameName + "/client.html", function () {
        initClient();
    });
}

// Admin message from controller
function changeSettings(data) {
    
    if (typeof updateGameSettings === "function") { updateGameSettings(data); }
}

function setPlayerLocation(input){

    MMH.setPlayerLocation(input);
}

function getPlayerLocation(){
    return MMH.getPlayerLocation();
}

// TODO move to MMH.js
function changeName() {
    socket.emit("namechange", document.getElementById('username').value);
}

function getGame() {
    socket.emit("getgame");
}

