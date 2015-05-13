"use strict";
var should=require('should'),
	child_process=require('child_process'),
	util=require('util'),
	constants=require('../constants.json'),
	_prompt=constants.PROMPT,
	pkg=require('../package.json'),
	debug=require('debug')('MuMoo:Login:debug'),
	fs=require('fs'),
	async=require('async');

describe("motd", function() {
	it("should display the motd", function(done) {
		var child=child_process.exec("telnet localhost 9999", function (error, stdout, stderr) {}),
			motd=fs.readFileSync(__dirname+'/../doc/motd.txt').toString(),
			pkg=require(__dirname+'/../package.json'), stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data;
		});
		setTimeout(function() {
			child.kill();
			stdout.should.containEql( util.format(motd, pkg.version) );
			done();
		}, 500);
	});

	it("should display the server version in the motd", function(done) {
		var child=child_process.exec("telnet localhost 9999"),
			motd=fs.readFileSync(__dirname+'/../doc/motd.txt').toString(),
			pkg=require(__dirname+'/../package.json'), stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data;
		});
		setTimeout(function() {
			child.kill();
			stdout.should.match(new RegExp(pkg.version));
			done();
		}, 500);
	});
});

describe("help", function() {
	it("should display pending_login_help.txt", function(done) {
		var child=child_process.exec("telnet localhost 9999"),
			help=util.format( fs.readFileSync(__dirname+'/../doc/pending_login_help.txt').toString(), constants.ADMIN_EMAIL), stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data;
		});
		child.stdin.write("help\n");
		setTimeout(function() {
			child.kill();
			stdout.should.containEql(help);
			done();
		}, 500);
	});
});

describe("connect", function() {
	it("should connect as Guest user", function(done) {
		var child=child_process.exec("telnet localhost 9999"),
			stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data;
		});
		setTimeout(function() {
			child.stdin.write("connect Guest\n");
			setTimeout(function() {
				child.kill();
				var welcome_guest=fs.readFileSync(__dirname+"/../doc/welcome_guest.txt").toString();
				debug("stdout: %j\nwelcome_guest.txt: %j", stdout, welcome_guest);
				stdout.should.containEql(welcome_guest);
				done();
			}, 100);
		}, 100);
	});
	it("should connect as guest user", function(done) {
		var child=child_process.exec("telnet localhost 9999"),
			stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data;
		});
		setTimeout(function() {
			child.stdin.write("connect Guest\n");
			setTimeout(function() {
				child.kill();
				var welcome_guest=fs.readFileSync(__dirname+"/../doc/welcome_guest.txt").toString();
				debug("stdout: %j\nwelcome_guest.txt: %j", stdout, welcome_guest);
				stdout.should.containEql(welcome_guest);
				done();
			}, 100);
		}, 100);
	});
	it("should give usage help if no password is given", function(done) {
		var child=child_process.exec("telnet localhost 9999"),
			stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data;
		});
		setTimeout(function() {
			child.stdin.write("connect INVALIDUSER\n");
			setTimeout(function() {
				child.kill();
				stdout.should.containEql("<password> - connect with the given password");
				done();
			}, 100);
		}, 100);
	});
	it("should report an error when a wrong username/password combination is given", function(done) {
		var child=child_process.exec("telnet localhost 9999"),
			stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data;
		});
		setTimeout(function() {
			child.stdin.write("connect INVALIDUSER WRONGPASSWORD\n");
			setTimeout(function() {
				child.kill();
				stdout.should.containEql("Invalid username/password combination");
				done();
			}, 100);
		}, 100);
	});
});

describe("create", function() {
	it("should print instructions to create a new user", function(done) {
		var child=child_process.exec("telnet localhost 9999"),
			stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data.toString();
		});
		setTimeout(function() {
			child.stdin.write("create\n");
			setTimeout(function() {
				child.kill();
				debug("%j", stdout);
				stdout.should.containEql("To get a character, login as a Guest user and use the command `@request <character-name> for <email-address>'. The character will be entered in the waitlist. The password mailed to the email address when the character is created. Once on as a guest, `read *b:mpg' for details of the waitlist mechanism. Note: only one character per person.");
				done();
			}, 100);
		}, 100);
	});
});

describe("@uptime", function() {
	it("should display the number of seconds since the server started", function(done) {
		var child=child_process.exec("telnet localhost 9999"),
			stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data;
		});
		setTimeout(function() {
			child.stdin.write("@uptime\n");
			setTimeout(function() {
				child.kill();
				should(stdout.match(/up ([\d]+) seconds/)).be.ok;
				done();
			}, 100);
		}, 100);
	});
});

describe("@who", function() {
	var children=[];
	it("should list the username of everyone logged on", function(done) {
		var stdout="", 
			guests=[
				"rainbow_guest", 
				"red_guest", 
				"green_guest", 
				"blue_guest", 
				"yellow_guest",
				"magenta_guest",
				"cyan_guest", 
				"gray_guest",
				"neon_guest"
				];
		async.series([
			function connectGuests(next) {
				async.timesSeries(5, function connectGuest(n, finished) {
					debug("connecting guest");
					var child=child_process.exec("telnet localhost 9999");
					children.push(child);
					finished();
				}, function(err, results) {
					next();
				});
			}, function loginGuests(next) {
				async.eachSeries(children, function doConnect(child, finished) {
					debug("connect guest");
					child.stdin.write("connect guest\n");
					finished();
				}, next);
			}, function checkCommand(next) {
				var child=child_process.exec("telnet localhost 9999"), stdout="";

				child.stdout.on('data', function onOut(data) {
					stdout+=data.toString();
				});
				child.stdin.write("@who\n");
				setTimeout(function() {
					//debug("checking output\n%s\n%s", stdout, _prompt);
					var outlines=stdout.split('\n'), startLine=undefined, endLine=undefined, whoOutput, o;
					//console.log(outlines);
					// TODO find where the @who command starts and ends
					for( o=0; o<outlines.length; o++) {
						debug("comparing output line %s", outlines[o]);
						if( outlines[o].match(_prompt) && startLine==undefined )
							startLine=o+1;
						else
							endLine=o
					}
					whoOutput=outlines.slice(startLine, endLine);
					debug("who %j", whoOutput);
					whoOutput.length.should.equal(5);
					//every guest in whoOutput should match a guest username
					async.each( whoOutput, function(who_line, finished) {
						debug("checking %s", who_line);
						guests.should.containEql(who_line);
						finished();
					}, function(err) {
						debug("done checking guest names");
					});
					child.kill();
					next();
				}, 500);
			}], function() {
				done();
			});
	});

	after(function(done) {
		debug("killing children");
		async.each( children, function eachChild(child, finished) {
			debug("killing child");
			child.kill();
			finished();
		}, done);
	});
});

describe("@version", function() {
	it("should report the server version as specified in package.json", function(done) {
		var child=child_process.exec("telnet localhost 9999"),
			stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data;
		});
		setTimeout(function() {
			child.stdin.write("@version\n");
			setTimeout(function() {
				child.kill();
				should(stdout.match( new RegExp(pkg.version)) ).be.ok;
				done();
			}, 100);
		}, 100);
	});
});

describe("@quit", function() {
	it("should close the connection", function(done) {
		var child=child_process.exec("telnet localhost 9999"),
			stdout="";
		child.stdout.on('data', function onData(data) {
			stdout+=data;
		});
		setTimeout(function() {
			child.stdin.write("@quit\n");
			setTimeout(function() {
				stdout.should.containEql( fs.readFileSync(__dirname+"/../doc/goodbye.txt").toString() );
				done();
			}, 200);
		}, 100);
	});
});
