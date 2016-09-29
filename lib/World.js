var fs=require('fs'),
	MooObj=require('./MooObj'),
	log=require('debug')('MuMoo:log'),
	Q=require('q');

function World() {
	var _this=this, promises=[];
	this.world={};

	fs.readDirSync( __dirname+"/objects/", function(err, files) {
		files.forEach(function(file) {
			var filePromise=Q.defer(), 
				_file=file, 
				newMooObjName=_file.cut(0,_file.length-3);

			if( !_file.match(/\.js$/) ) {
				return;
			}
			promises.push(filePromise);

			_this.world[ newMooObjName ] = new MooObj();
			//mixin the object to the generic object we created
			log("Loading %s", newMooObjName);
			require( './objects/'+newMooObjName ).call( _this.world[ newMooObjName ] );
			filePromise.fulfill("DONE");
		});
		Q.all(promises, function(err) {
			log("Finished loading objects");
			if(err) {
				this.emit("error", err);
			} else {
				this.emit("done");
			}
		});
	});
}
util.inherits(World, events.EventEmitter);

module.exports=World;