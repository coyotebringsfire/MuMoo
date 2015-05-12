"use strict";
var should=require('should'),
	child_process=require('child_process'),
	util=require('util'),
	constants=require('../constants.json'),
	pkg=require('../package.json'),
	debug=require('debug')('MuMoo:Login:debug'),
	fs=require('fs');

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
	it("should give usage help if no password is given", function(done) {
		should.fail();
		done();
	});
	it("should report an error when a wrong username/password cobination is given", function(done) {
		should.fail();
		done();
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
	it("should list the username of everyone logged on", function(done) {
		should.fail();
		done();
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
