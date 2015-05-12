"use strict";

var telnet=require('telnet'),
	util=require('util'),
	fs=require('fs'),
	Login=require('./lib/Login'), login,
	parser=require('./lib/Parser'),
	debug=require('debug')('MuMoo:debug'),
	log=require('debug')('MuMoo:log'),
	constants=require('./constants.json'),
	_prompt=constants.PROMPT,
	pkg=require('./package.json'),
	connection_count=0,
	start_of_day=Date.now(),
	Q=require('Q');

function onMongoLoginSuccess() {
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g, "");
	};

	log("Connected to MongoDB");
	var _db=login.db, _id=undefined;
	log("Starting server on %d", constants.LISTEN_PORT);
	telnet.createServer( onIncomingConnection ).listen(constants.LISTEN_PORT);
}

function onMongoLoginError(err) {
	debug(arguments);
	debug("Error connecting to MongoDB %j", err);
}

function onIncomingConnection(client) {
	var _id=undefined;
	
	log("Incoming connection");
	connection_count++;
	var connection_status=constants.PENDING_LOGIN;

	function onClose() {
		function onMongoLogout(err) {
			_id=undefined;
			client.end();
		}
		
	 	if( _id ) {
		 	login.db.collection('users').findAndModify({_id:_id}, { "$set": { "logged_in":false } }, onMongoLogout);
		 	return false;
		 } else {
		 	log("Client disconnected");
		 	connection_count--;
		 }
	}

	function onPendingLogin(data) {
		var _data=data.toString().trim().split(' ');

		function onLoginSuccess(result) {
			function onLoggedIn(data) {
				var _data=data.toString().trim().split(' ');
				log("Processing command %j", _data);
				//TODO search for _data[0] in verbs attached to the current player, objects on the player, objects in the room that the player is in, and global verbs
				client.write("coming soon\n"+_prompt);
			}
			debug("login success:\n %j", result);
			_id=result._id;
			client.removeListener('data', onPendingLogin);
			// login success
			debug("status: %s");
			connection_status=constants.LOGGED_IN;
			client.on('data', onLoggedIn);
		}

		function onLoginError(err) {
			client.stdout.write("Invalid username/password combination\n"+_prompt);
			debug("caught login error");
		}

		function onFin() {
			debug("fin %j", arguments);
		}

		log("Processing command %j", _data);
		switch(_data[0]) {
			case 'help':
				login.help(client);
				break;
			case 'connect':
				debug("login.connect");
				login.connect( client, data.toString().split(' ').slice(1) )
					.then(onLoginSuccess) 
					.catch(onLoginError)
					.fin(onFin);
				break;
			case 'create':
				client.write("To get a character, login as a Guest user and use the command `@request <character-name> for <email-address>'. The character will be entered in the waitlist. The password mailed to the email address when the character is created. Once on as a guest, `read *b:mpg' for details of the waitlist mechanism. Note: only one character per person.");
				client.write("\n"+_prompt);
				break;
			case '@who':
				login.who(client);
				break;
			case '@uptime':
				var uptime=Date.now() - start_of_day,
					uptimeString="";
				var diffSeconds = Math.floor(uptime / 1000); 

				log(util.format("up %d seconds", diffSeconds));
				client.write( util.format("up %d seconds\n", diffSeconds) );
				client.write( "\n"+_prompt );
				break;
			case '@version':
				log(pkg.version);
				client.write( pkg.version );
				client.write( "\n"+_prompt);
				break;
			case '@quit':
				login.quit(client);
				break;
			default:
				client.write( util.format( motd, pkg.version) );
				client.write( util.format("There are %d people connected.\n", connection_count) );
				client.write( _prompt );
		}
	}

	function onTelnetWindowSizeEvent(e) {
	   if (e.command === 'sb') {
	     log('telnet window resized to %d x %d', e.width, e.height);
	   }
	}

	// make unicode characters work properly
	client.do.transmit_binary();

	// make the client emit 'window size' events
	client.do.window_size();

	// listen for the window size events from the client
	client.on('window size', onTelnetWindowSizeEvent);

	// listen for commands from the client
	client.on('data', onPendingLogin);

	client.on('close', onClose);

	var motd=fs.readFileSync('doc/motd.txt').toString();

	client.write( util.format( motd, pkg.version) );
	client.write( util.format("There are %d people connected.\n", connection_count) );
	client.write( _prompt );

	log('client connected');
}

log("Connecting to MongoDB");
login=new Login("mongodb://localhost:27017/MuMoo");
Q(login.connectPromise)
	.then( onMongoLoginSuccess )
	.catch( onMongoLoginError);
