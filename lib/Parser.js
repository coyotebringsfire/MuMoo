"use strict";

var prepositions=[
	"with",
	"using",
	"at", 
	"to",
	"in front of",
	"in",
	"inside",
	"into",
	"on top of",
	"on",
	"onto",
	"upon",
	"out of",
	"from inside",
	"from",
	"over",
	"through",
	"under",
	"underneath",
	"beneath",
	"behind",
	"beside",
	"for",
	"about",
	"is",
	"as",
	"off",
	"off of"
];

/**
 @args cmd - user command to parse
 @returns parsedCommand object
 */
 
function parseCommand(cmd) {
	var parsedCommand={
		verb: null,
		direct_object: null,
		indirect_object: null,
		preposition: null,
		execute: function(client) {
			client.write( util.format("%s %s %s %s", parsedCommand.verb, parsedCommand.direct_object, parsedCommand.preposition, parsedCommand.indirect_object) );
		}
	}, words, verb;
	// replace " : ; if it's the first character
 	switch(cmd[0]) {
 		case '"':
 			cmd=cmd.replace(/^"(.*)/, "say $1");
 			break;
 		case ':':
 			cmd=cmd.replace(/^:(.*)/, "emote $1");
 			break;
			case ';':
 			cmd=cmd.replace(/^;(.*)/, "eval $1");
 			break;
 	}
 	
 	words=cmd.split(' '); 
 	verb=words.shift();
 	
 	// match the first word to verbs

	cmd.match(/(verb [^ ]+) (direct_object [^ ]+) (preposition) (indirect_object [^ ]+)/);
	return parsedCommand;
}

function Parser() {
	this.parseCommand=parseCommand;
}

module.exports=Parser;