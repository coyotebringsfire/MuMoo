var util={};

util.parseCommand(cmd) {
	// {verb} {d-o} {preposition} {i-o}
	var verbMatch==cmd.match(/([^\s])\s(.*)/)[1];
}

module.exports = util;