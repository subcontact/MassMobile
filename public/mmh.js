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
		//socket = io.connect('/players'); // SHOULD THIS BE HERE? WILL IT LISTEN MULTIPLE TIMES IF CALLED REPEATADLY?

		// listen to the admin messages
		socket.on('admin', function(data){
			if (data.control == "changeSettings") { // TODO rename to changeSendFrequency
				SEND_FREQUENCY = data.data.freq;
			}
		});
	}


    // performSlowCrappyGyroscopeDetection
    // This is LAME but it works - there is a more elegant way to do this so let's revisit later.
    // bottom line is that this is UGLY but it works
    // Gyroscope detection relies on the event deviceorientation firing with non null values
    // turns out that if the browser supports a gyroscope but the device doesn't this event may fire once
    // so the detection relies on the event firing more than once and a hard coded setTimeout function to then
    // check the result


    me.performSlowCrappyGyroscopeDetection    = function(){

        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleOrientation, false);
        }
        else
        {
            gyroscopeDetectionComplete = true;
        }

        //ugly as a CRT TV !
        var t=setTimeout(function(){

            if (window.DeviceOrientationEvent) {
                window.removeEventListener("deviceorientation", handleOrientation, false);
            }
            gyroscopeDetectionComplete = true;
        },200);
    }

    var gyroscopeDetected = false;
    var gyroscopeDetectionComplete = false;


    me.setPlayerLocation = function (location) {
        playerLocation = location;
    };

    me.getPlayerLocation = function () {
        return playerLocation;
    };


    // listen for movements and start sending them to the server. Optionally
	// send them to a callback as well.
	me.listenForMovements = function (preProcessCallback, postProcessor, use_accelerometers) {
        try {
			if (use_accelerometers && me.clientHasAccelerometers()) {
				startListeningForAccelerometers(accelerometerDeviceListener, accelerometerMozDeviceListener);
			}
			// listen for the mouse as well as gyroscopes (can't hurt!)
			startListeningForMouseMovements();

			// save the client callback if they have passed in one.
			preProcessCallbackFunction = (preProcessCallback)? preProcessCallback : function (a) { return a; }; 
			postProcessCallback = (postProcessor)? postProcessor : function () {}; 
        } catch(error) {
            alert(error);
        }
	}

	me.stopListeningForMovements = function () {
		stopListeningForMouseMovements();
		if (me.clientHasAccelerometers()) {
			stopListeningForAccelerometers();
		}
	}
	
	// from the start stop game stuff.
	me.shutdown = function () {
		me.stopListeningForMovements();
		me.stopSendingOrientationToServer();
	}
	
	me.startSendingOrientationToServer = function () {
		// do it again in a few millis...
		orientationTimer = setInterval(sendOrientationToGameServer, SEND_FREQUENCY);
	}
	
	me.sendOrientationToServer = sendOrientationToGameServer;

	me.stopSendingOrientationToServer = function() {
		clearTimeout(orientationTimer);
	}
	
	me.getOrientation = function () {
		return accel;
	}

	me.sendAnswerToServer = function(data){
		sendAnswerToServer(data);
	}

	//
    // You MUST call performSlowCrappyGyroscopeDetection at least 200 ms before you call this function
    // you have been warned !
    // this is UGLY and will be fixed up later

	me.clientHasAccelerometers = function() {
        return gyroscopeDetected;
	}

	me.storeOrientation = function (x,y) { 
		storeOrientation(x,y, 0,0,playerLocation) }

	//
	// Private stuff
	//
    var playerLocation = "right"; // default players to RHS but player can change
	var socket = null;
	var SEND_FREQUENCY = 50; // can get throttled from server
	var accel = {};
	var orientationTimer = null;
	var preProcessCallbackFunction = null;
	var postProcessor = null;

    function handleOrientation(e){
        // can fire with null values on devices with no gyroscope
        if (e.alpha != undefined && e.beta != undefined && e.gamma != undefined)
        {
            gyroscopeDetected = true;
        }
        else
        {
            gyroscopeDetected = false;
        }
    }

    function accelerometerMozDeviceListener(eventData) {
		// x is the left-to-right tilt from -1 to +1, so we need to convert to degress
		var tiltLR = eventData.x * 90;
		
		// y is the front-to-back tilt from -1 to +1, so we need to convert to degress
		// We also need to invert the value so tilting the device towards us (forward) 
		// results in a positive value. 
		var tiltFB = eventData.y * -90;
		
		// MozOrientation does not provide this data
		var dir = null;
		
		// z is the vertical acceleration of the device
		var motUD = eventData.z;

		storeOrientation(scaleFactor(tiltLR), scaleFactor(tiltFB), dir, motUD,playerLocation,"accel");
	}

    // event handler which deals with accelerometer events
    function accelerometerDeviceListener(eventData) {
		// gamma is the left-to-right tilt in degrees, where right is positive
		var tiltLR = eventData.gamma;

		// beta is the front-to-back tilt in degrees, where front is positive
		var tiltFB = eventData.beta;
		
		// alpha is the compass direction the device is facing in degrees
		var dir = eventData.alpha
		
		// deviceorientation does not provide this data
		var motUD = null;
		
		// call our orientation event handler
		storeOrientation(scaleFactor(tiltLR), scaleFactor(tiltFB), dir, motUD,playerLocation,"accel");
    }

    var stopListeningForAccelorometersHandler;
    function stopListeningForAccelerometers() {
    	if (stopListeningForAccelorometersHandler) {
    		stopListeningForAccelorometersHandler();
    	}
    }

	// Listening for accelerometer changes
	// SRA: I have no idea when either of these gets called.
	// Update: Aidan reckons the Moz one is not used by modern browsers.
	function startListeningForAccelerometers(accelHandler, accelMozHandler) {
		if (window.DeviceOrientationEvent) {
			window.addEventListener('deviceorientation', accelerometerDeviceListener, false);
		} else if (window.OrientationEvent) {
			window.addEventListener('MozOrientation', accelMozHandler, false);
		}

		// A sweet little closure from SRA! WOO HOO!
		stopListeningForAccelorometersHandler = function() {
			window.removeEventListener('deviceorientation', accelHandler, false);
			window.removeEventListener('MozOrientation', accelMozHandler, false);
		}
	}

	var SCALE_FACTOR = 1.8;
	
	// Scale this number up so that the user doesn't have to tilt the phone all the way to vertical 
	// to get the top value.
	function scaleFactor(num) {
		num *= SCALE_FACTOR;
		if (num > 90) num = 90;
		if (num < -90) num = -90;
		return num;
	}


	// Used to track the mouse on regular browsers.
	// NOTE: document level events don't trigger. Need to use an object.
	function startListeningForMouseMovements() {
		var handler = function(e) {
			storeOrientation(
				(e.pageX / $(document).width()) * 180 - 90,
                (e.pageY / $("#main").innerHeight()) * 180 - 90 ,
                //we have flipped the direction of the arrows on pong, I'm reversing everything here
//                ((e.pageY / $("#main").innerHeight()) * 180 - 90 ) *-1,
				0,
				0 ,
                playerLocation
			,"mouse");
		};

		$("#main").mousemove(handler);
		$("#main").mouseover(handler);
		$("#main").mousedown(handler);
	}
	
	function stopListeningForMouseMovements() {
		$("#main").unbind("mousemove");
		$("#main").unbind("mousedown");
		$("#main").unbind("mouseover");
	}

	// This is just the last change recorded. The last one recorded gets sent
	// according to the throttle.
	function storeOrientation(tiltLR, tiltFB, dir, motionUD, location,source) {
		accel = preProcessCallbackFunction ({
			tiltLR: 		tiltLR,
			tiltFB: 		tiltFB,
			dir: 			dir,
			motionUD: 		motionUD,
            playerLocation: location
		},source);

		// See if the user wants to do anything after a value has been captured
		postProcessCallback(accel);
	}

	//
	// This is a periodic function.
	//
	function sendOrientationToGameServer() {
		// send the current data we have at this point in time 
		// note, it does not send every reading we have had since the last send.
	//	console.log("Sending tilt to server: " + accel.tiltFB + "/" + accel.tiltLR);
		socket.emit("accel", accel);
	}

	function sendAnswerToServer(data){
        socket.emit("answer",data);
	}
	
	return me;
}());