var _exitToRoom = 0;//Some rooms like HELOGO(room 1) uses this
var enteredFrom = roomTemps.lastRoomId;//Where did we enter from?
var hasEnterScriptEnded = false;//A safe flag from having a room setup again while in it
SignalsObject.roomInitiated.dispatch();//Let the Engine know the room code is here

function enter(){	
	hasEnterScriptEnded = false;
	SignalsObject.EscapeSignal.removeAll();//Remove all lingering skip listeners
	SignalsObject.EscapeSignal.addOnce(this.skipEnterScript, this);//Add skip listener
	showInterface(true);
	setRoomHintTo();
	handleEnterScriptEnded();//Force room to enable input..
}

//Set the Player's hit audio, this is what the player will say when clicked on
function setRoomHintTo(hintType = undefined){
	switch(hintType) {
		  default:
			ROOM_PLAYER_AUDIO = [
				"AUDIO.001",
				"AUDIO.002",
			];	
			break;
	}
}

function handleEnterScriptEnded(){
	if(hasEnterScriptEnded == true) return;//Only do this once..
	SignalsObject.removeAllSignals();//Remove All global Signals 
	this.hasEnterScriptEnded = true;//Set to true!
}

function skipEnterScript(){
	/*Do specific signal removes here 
	* or anything else that needs to be fixed because we skipped the enter of a room
	* and then run handleEnterScriptEnded()*/
	this.handleEnterScriptEnded();
}//end of the function

//ADD ROOM STUFFZ
//createHotspot(name, shape(0 = Rectangle, 1=Circle), x, y, width, height, cursorType, interactsWithCursor, targetParent(need to remove), interactsWithFunction)
//createHotspot will generate a createjs Container() with properties to be a "clickpoint"
var _exitDoor = createHotspot('exitDebugDoor', 0, 9, 10, 130, 108, 'hw_cursorNWDeep');
roomMovieClip.addChild(_exitDoor);//Add the hotspot to the room. See createjs docs for info on addChild()
setupClickPoint(_exitDoor, function (){	//What the clickpoint will do when clicked
	exit(2);
}, true);

var _hotspot = createHotspot('lilAnimationHotspot', 0, 153, 133, 41, 56, 'curHigh');
roomMovieClip.addChild(_hotspot);
setupClickPoint(_hotspot, function (){	
	var _actor = ActorController.addActor("DEB_LIL_ANIMATION");
	disableAndHideClickpoint(_hotspot);
	ActorController.actors[_actor.actorID].AnimationFinishedSignal.addOnce(function() {
		ActorController.removeActor(_actor.actorID);
		enableClickpoint(_hotspot);
	}, this);
}, true);

function exit(roomId, exitCostume, _gotoFrame){//Generic exit room function
	_exitToRoom = roomId;
	hideMouse({isBusy:true});//hides mouse and sets it busy
	if(exitCostume && ActorController.actors[1]){
		SignalsObject.EscapeSignal.addOnce(this.skipExitScript, this);//add skip listener
		ActorController.actors[1].setCostume(exitCostume, false, _gotoFrame);
		ActorController.actors[1].AnimationFinishedSignal.addOnce(function() {
			this.cleanUpRoom();
			this.addRoom(_exitToRoom);
		}, this);	
	}else{
		this.cleanUpRoom();
		addRoom(_exitToRoom);
	}
}//end of the function
function skipExitScript(){//What to do when you skip the script
	/*90% of the time nothing will be here other than addRoom()
	* mostly because signals should be destroyed in cleanUpRoom()*/
	addRoom(_exitToRoom);
}//end of the function
function cleanUpRoom(){
	/*Do room clean up here.
	* Any lingering items can be removed now.
	* The engine will call this on a game restart
	* or before the new room is added.*/
}//end of the function