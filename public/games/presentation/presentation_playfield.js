/*
 * Mass Mobile Hallucination.
 * PresentationPlayField
 *
 * Copyright (c) 2012 MYOB Australia Ltd.
 *
 */

var PresentationPlayField = (function (playfieldSocket) {
    var me = {};

    me.init = function () {
        playfieldSocket.emit("admin", "no_updates");
        playfieldSocket.emit("admin", "no_totals");

    }
    me.newUser = function (data) 	{ /* doesn't matter  */}
    me.woosOut = function (data) 	{  }
    me.positionUpdates = function (updates) { }
    me.totalUpdates = function (updates) { }
    me.shutdown = function () { }
    me.admin = function(message) { }
    me.nameChange = function() {}
    me.processCustomMessage = function (message) {}

    me.initPlayers = function (players) {
        // can ignore this. Just need totals
    }

    me.changingToSlide = function(slide){
       var data = {};
        data.game="presso";
        data.message = slide;
       playfieldSocket.emit("sendToPlayers",data);
    }

    return me;
}(socket));
