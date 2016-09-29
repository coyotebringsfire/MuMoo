function Mixin() {
	this.id='0';
	this.name="Object";
	this.description="An object";
	this.aliases=[ 'obj', 'o' ];
	this.location="#2"
	this.owner="#1";
	this.contents=[];
	this.parent=null;
	this.children=[ "#2", "#3"];
	this.isPlayer=false;
	this.acl=[];

	this.verbs.examine=[ function doExamine() {
		var directObject;
		//verify this is the d-o of the command
		//support both 'examine object' and 'look at object'
		if( arguments.length === 0 ) {
			return this.description;
		} else {
			directObject=cmd.match(/at (.*)/)[1];
			//find the direct objects
		}
	}, {
		aliases: [ "l", "look" ]
	}];

	this.verbs.give=[ function doGive() {
		//verify this is the d-o of the command
	}, {
		aliases: [ 'g' ]
	}];

	this.verbs.clone=[ function doClone() {
		//verify this is the d-o of the command
	}, {
		aliases: [ "c" ]
	}];

	this.verbs.drop=[ function doDrop() {
		//verify this is the d-o of the command
	}, {
		aliases: [ 'd' ]
	}];

	this.verbs.take=[ function doTake() {
		//verify this is the d-o of the command
	}, {
		aliases: [ 't' ]
	}];
}

module.exports=Mixin;