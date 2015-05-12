var Q=require('Q'),
	debug=require('debug')('MuMoo:Login:debug'),
	log=require('debug')('MuMoo:log'),
	util=require('util'),
	fs=require('fs'),
	constants=require('../constants.json'),
	mongo=require('mongodb'),
	_prompt=constants.PROMPT,
	_db=undefined;

/**
 * print pending_login_help.txt
 * @param {TelnetConnection} client connection object returned by telnet server
 *
 * @return undefined
 */	

function help(client) {
	log("returning pending_login_help.txt");
	client.write( util.format( fs.readFileSync(__dirname+'/../doc/pending_login_help.txt').toString(), constants.ADMIN_EMAIL) );
	client.write( "\n"+_prompt);
}

/**
 * executes user connect command
 * @param {TelnetConnection} client connection object returned by telnet server
 * @param {Array} args [ username, password ] or [ "Guest"]
 * @return {Promise} login promisory note returned by login() function failure=>reject success=>resolve
 */

function connect(client, args) {
	var debug_promise=Q.defer();
	debug('trying to connect %s', args.join(' '));
	debug("%j", args);
	switch(args[0] ? args[0].trim() : args[0]) {
		case undefined:
			debug("undefined");
			client.write("usage:\n"+
				"\tconnect <username> <password> - connect with the given username and password\n"+
				"\tconnect Guest - connect as a guest user\n"+
				_prompt);
			setTimeout( function() { 
				debug_promise.reject("badusage"); 
			}, 0);
			return debug_promise.promise;
			break;
		case "Guest":
		case "guest":
			debug("[Gg]uest");
			client.write( fs.readFileSync(__dirname+"/../doc/welcome_guest.txt")+_prompt );
			return login("Guest");
			break
		default:
			debug("%j", args);
			if( args[1] === undefined ) {
				client.write("usage:\n"+
					"\tconnect "+args[0]+" <password> - connect with the given password\n"+
					_prompt);
				setTimeout( function() { 
					debug_promise.reject("nopassword"); 
				}, 0);
				return debug_promise.promise;
			} else {
				return login(args[0], args[1]);
			}
	}
}

/**
 * check username and password, update logged_in status
 * @param {String} username username
 * @param {String} password password
 * @return {Promise} promisory note failure=>reject success=>resolve
 * @private
 */

function login(username, password) {
	var login_promise=Q.defer();
	debug("username: %s password: %s", username, password);
	if( username === "Guest" && password === undefined ) {
		// generate a temporary Guest account
		debug("creating guest account");
		var guestUser={ 
			"email_address":"Guest@localhost", 
			"username": "Guest_"+Date.now(), 
			"logged_in": true,
			"acls": ["Guest"] 
		};
		_db.collection("users").insert(guestUser, function(err) {
			if(err) {
				debug("rejecting login promise");
				login_promise.reject(err);
			} else {
				debug("resolving login promise");
				login_promise.resolve(guestUser);
			}
		});
	} else {
		// look up username in db
		debug("looking-up user");
	 	_db.collection("users").findOne({ username: username, password: password }, function login_hollaback(err, results) {
	 		debug("err %j results %j", err, results);
	 		if( err || !results ) {
	 			debug("rejecting promise");
	 			login_promise.reject(new Error("invalid username/password combination"));
		 	} else {
			 	_db.collection("users").update({ _id:results._id },  { $set:{ logged_in:true } }, function(err, results) {
			 		debug("update results err %j results %j", err, results);
			 		login_promise.resolve(results);
			 	});
			}
		 	debug("findOne results %j", results);
	 	});
	 }
	 debug("returning promise");
	 return login_promise.promise;
}

/**
 * print list of everyone logged in to client connection
 * @param {TelnetConnection} client connection object returned by telnet server
 * @return undefined
 */

function who(client) {
	_db.collection("users").find({logged_in:true}, function whoResults(err, results) {
		if(err) {
			client.write("Error getting logged-in users\n");
			client.write( JSON.stringify(err) );
			client.write( "\n"+_prompt );
		} else {
			results.forEach( function eachLoggedInUser(user) {
				client.write( util.format("%s", user.username) );
			});
			client.write("\n"+_prompt);
		}
	});
}

/**
 * cleanup on quit
 * @param {TelnetConnection} client connection object returned by telnet server
 * @return undefined
 */

function quit(client) {
	debug("quit");
	client.write(fs.readFileSync(__dirname+"/../doc/goodbye.txt").toString());
	client.end();
}

/**
 * @constructor
 * @param {String} connectionString mongodb connection string
 * @return {Promise} promisory note failure=>reject success=>resolve
 */
function Login(connectionString) {
	var _connectPromise, _this=this;
	this.connect=connect;
	this.who=who;
	this.help=help;
	this.quit=quit;

	_connectPromise = this.connectPromise = Q.defer();
	//connect to mongo db
	mongo.MongoClient.connect(connectionString, function onConnect(err, db) {
	    if(err) {
	    	debug("error connecting to DB %j", err);
	    	_connectPromise.reject(err);
	    } else {
		    debug("connected to mongo");
		    _this.db = _db = db;
		    _connectPromise.resolve("SUCCESS");
		}
	});
}
module.exports=Login;