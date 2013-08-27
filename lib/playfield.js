/*
 * Mass Mobile Hallucination.
 *
 * Copyright (c) 2012 MYOB Australia Ltd.
 *
 * Playfield socket message handlers. These are all the messages 
 * the playfield can send to the server.
 */
var players = {};
var updates = [];
var playfieldConnection = null;
var totals = {};
var no_updates = false;
var no_totals = false;
var no_uniques = true;
var metrics_on = false;
var countNumberRequests = 0;

var UPDATE_FREQUENCY        = 50; // milliseconds between updates of player states to playfield
var UNIQUE_LIFE_TIME        = 25000; // store unique values only this long, then assume user has left.
var SAMPLING_FREQUENCY      = 100; //milliseconds between samples

module.exports = {
    // Used for first time connections. Tells the playfield who is
    // currently in play.
    playfieldhandlers: function (socket) {
        console.log("playfield: received new playfield connection!");

        // send the new playfield the players list on connection
        console.log("playfield: sending 'players' list");
        socket.emit('players', players);

        // Turning on and off the type of updates the playfield should send out. These
        // come from the controller only.
        socket.on("admin", function (message) {
            console.log("socket.on 'admin' ");
            console.log("admin message: " + message);
            if (message == "no_updates") {
                no_updates = true;
            } else if (message == "yes_updates") {
                no_updates = false;
            } else if (message == "no_totals") {
                no_totals = true;
            } else if (message == "yes_totals") {
                no_totals = false;
                no_uniques = true;
            } else if (message == "yes_uniques") {
                no_uniques = false;
                no_total = true;
            } else if (message.update_frequency) {
                setUpdateFrequency(message.update_frequency);
            } else if(message =="metrics_on"){
                metrics_on = true;
                periodicSendServerMetrics();
            }
        });

        socket.on("sendToPlayers", function (data) {
            connections.players.emit("changeSettings", data);
        });

        changeGame(currentGame);
    },

    // setters
    setPlayers: function (aPlayerList) {
        players = aPlayerList;
    },

    // passthrough for the player module
    // TODO get rid of this. Other modules should call specfic methods which then do the emit.
    //		 a pass through is not "oo".
    // this is currently used for name changes.
    emit: function (message, data) {
        console.log("playfield: sending message: " + message + " with data: " + data);
        connections.playfield.emit(message, data);
    },

    sendCustomMessage: function (id, data) {
        console.log("playfield: sending custom message with data: " + data + " from client " + id);
        connections.playfield.emit("custom", {id: id, data: data});
    },

    changeServerSettings :function(data){
       setSamplingFrequency(data.serverSendFrequency) ;
    },

    sendAdminMessage: function (control, data) {
        connections.playfield.emit(control, data)
    },

    // Accept and store a acceleromter update from a client. These are stored until
    // they are ready to be sent. They are also averaged in case the particular game
    // requires that functionality. In this latter case only the average is sent to the
    // playfield, otherwise all user updates are sent to the playfield. The playfield
    // decides on a per game basis.
    addUpdate: function (update) {

        if (metrics_on)
        {
            countNumberRequests++;
        }

        // Store all updates received in an array
        updates.push(update);

        // Sum the totals of all the values. The playfield can choose the sum or an average
        // depending on the game.
        if (update.accel.playerLocation == "right") {
            totals.right.count++;
            totals.right.totalTiltLR += update.accel.tiltLR;
            totals.right.totalTiltFB += update.accel.tiltFB;
            totals.right.totalDir += update.accel.dir;
            totals.right.totalMotionUD += update.accel.motionUD;
        } else {
            totals.left.count++;
            totals.left.totalTiltLR += update.accel.tiltLR;
            totals.left.totalTiltFB += update.accel.tiltFB;
            totals.left.totalDir += update.accel.dir;
            totals.left.totalMotionUD += update.accel.motionUD;
        }

        // Also save the set of unique client totals that persist between calls. So 
        // if there is no updates from the client the old value still applies
        if (!no_uniques) {
            processUniqueTotal(update);
        }
    },

    woosOut: function(id) {
        // We don't track players here, but we do have the running totals array
        connections.playfield.emit("woosout", {id: id});
        if (!no_uniques) {
            removeUniqueTotal(id);
        }
    },

    // kick start the updates
    startUpdates: function () {
        periodicPlayfieldUpdate();
        console.log("periodic updates started.");
    },

    changeGame: function (newGame) {
        changeGame(newGame);
    }
};

//
// Privates
//

var currentGame = "intro";
var uniqueUpdates = {};
var uniqueTotals = {};

function changeGame(newGame) {            
    console.log("playfield: sending change game to " + newGame);
    connections.playfield.emit("changeGame", newGame);

    // store it so when a new playfield arrives it knows which game the is the current one
    currentGame = newGame;

    resetTotals();
    resetUniques();
}

function processUniqueTotal(update) {
    // see if there is an existing value from this user
    if (uniqueUpdates[update.id]) {
        // ASSUME: the old is not equal to the new (otherwise the client wouldn't have sent it!)
        // Take off the old value and add the new
        // TODO: check if this user has changed sides - not sure if you can, but it would kill it.
        console.log("unique: changing user input to " + update.accel.tiltFB + " for " + update.id)
        uniqueTotals[update.accel.playerLocation].totalTiltFB += (update.accel.tiltFB - uniqueUpdates[update.id].tiltFB);
    } else {
        // new users
        console.log("unique: adding new user input to " + update.accel.tiltFB + " for " + update.id)
        uniqueTotals[update.accel.playerLocation].totalTiltFB += update.accel.tiltFB;
        uniqueTotals[update.accel.playerLocation].count++;
    }

    // store the current value as the old for next time
    uniqueUpdates[update.id] = update.accel;
    uniqueUpdates[update.id].timestamp = new Date().getTime(); // so we can expire it later
}

function removeUniqueTotal(id) {
    var oldValue = uniqueUpdates[id];
    if (oldValue) {
        uniqueTotals[oldValue.playerLocation].totalTiltFB -= oldValue.tiltFB;
        uniqueTotals[oldValue.playerLocation].count--;
        delete uniqueUpdates[id];

        console.log("unique: removing id " + id);

        // send it as soon as we know about it. If there are thousands of players
        // will this slow things down???
        connections.playfield.emit("totals", uniqueTotals);  
    } else {
        console.log("unique: could'nt find unique id that woosed out.")
    }
}

var lastCleanOut = new Date().getTime();

function cleanOutOldUniques() {
    var now = new Date().getTime();
    if (now - lastCleanOut < UNIQUE_LIFE_TIME) {
        return;
    }

    var booted = 0;
    for (u in uniqueUpdates) {
        if (now - uniqueUpdates[u].timestamp > UNIQUE_LIFE_TIME) {
            removeUniqueTotal(u);
            booted++
        }
    }

    if (booted > 0) { console.log( "expired " + booted  + " idle players")}

    lastCleanOut = now;
}

//////// end uniques processing

// run every so often and sends the collection of user updates
// to the play field
// TODO Make these update/totals config items actually work!
function periodicPlayfieldUpdate() {
    // This causes a weird bug that totals are only sent if there are updates
    // otherwise the old values are kept. So this smooths out the worm if there
    // is a single client only for testing.  
    if (updates.length > 0) {
        // send updates (if not stopped)
        if (!no_updates) {
            connections.playfield.emit("updates", updates)
        };

        // send totals
        //totals.count = updates.length;
        if (!no_totals) {
            connections.playfield.emit("totals", totals);
        } else if (!no_uniques) {
            console.log("sending uniqueTotals left: " + uniqueTotals.left.totalTiltFB + " / " + uniqueTotals.left.count);
            console.log("sending uniqueTotals right: " + uniqueTotals.right.totalTiltFB + " / " + uniqueTotals.right.count);
            
            connections.playfield.emit("totals", uniqueTotals);  
        }

        // reset everything for next time (but not the uniques)
        updates = [];
        resetTotals();
    }
    if (!no_uniques) { cleanOutOldUniques(); }


    setTimeout(periodicPlayfieldUpdate, UPDATE_FREQUENCY);
}

function periodicSendServerMetrics(){
    var now = new Date().getTime();

    var metrics= {};
    metrics.messageCount =  countNumberRequests;
    metrics.memoryUsage = process.memoryUsage();
    metrics.uptime = process.uptime();
    metrics.interval = SAMPLING_FREQUENCY;
    metrics.sendtime = now;

    connections.playfield.emit("admin", metrics);

    resetServerMetrics();
   // var elapsed = new Date().getTime() - start;
   // console.log('elapsed time for periodicSendServerMetrics' + elapsed);

    setTimeout(periodicSendServerMetrics, SAMPLING_FREQUENCY);
}

function setUpdateFrequency(freq) {
    UPDATE_FREQUENCY = freq;
}
function setSamplingFrequency(freq) {
    SAMPLING_FREQUENCY = freq;
}



function resetServerMetrics()
{
    countNumberRequests =0;
}

function resetTotals() {
    totals.right = {};
    totals.right.count = 0;
    totals.right.totalTiltLR = 0;
    totals.right.totalTiltFB = 0;
    totals.right.totalDir = 0;
    totals.right.totalMotionUD = 0;

    totals.left = {};
    totals.left.count = 0;
    totals.left.totalTiltLR = 0;
    totals.left.totalTiltFB = 0;
    totals.left.totalDir = 0;
    totals.left.totalMotionUD = 0;
}

function resetUniques() {
    uniqueUpdates = {};

    uniqueTotals.left = {};
    uniqueTotals.right = {};

    uniqueTotals.left.totalTiltFB = 0;
    uniqueTotals.left.count = 0;
    uniqueTotals.right.totalTiltFB = 0;
    uniqueTotals.right.count = 0;
}

// Start with a clean slate
resetTotals();
resetUniques();
