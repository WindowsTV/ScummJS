window.sjs = window.sjs || {};
window.com = window.com || {};
window.com.wtv = window.com.wtv || {};
window.sjs.ActorController = class ActorController{
	constructor(stage, room) {
		// Stage(createJS Canvas Stage) and room(roomMovieClip:CreateJS.MovieClip) 
		// is set when class file is constructed
		// ...

		// Use "this" to set class variables
		this.stage = stage;		
		this._actors = {0:undefined};
		Object.defineProperty(this, "actors", {
			get : function () {
				return this._actors;
			},
			set : function (value) {
				this.stage.actors = value;
				this._actors = value;
			}
		});		
		this.actorLayer = room;		
		this.talkie;		
		this.currentTalkiePlaying;		
		this.currentActorTalking;
		this.cantAddNewActors = false;
	}
	
	addEmptyActor(isPlayer = false, target)
	{
		console.log("[ActorController]addEmptyActor(isPlayer = "+ isPlayer + ") -> Adding actor with NO COSTUME!");
		console.warn("[ActorController]addEmptyActor() -> Actor will have no starting costume! Please set a costume after.");													
		if(this.cantAddNewActors == true) return;
		return (this.addActor(-1, false, isPlayer, undefined, 0, target));
	}// end of the function
		
	//When PuttCostume class is turned into Actor class then remove isPlayerOrType
	addActor(startingCostume = -1, isIdle = false, isPlayerOrType = false, roomOverride = undefined, startFrame = 0, target = undefined, color = undefined)
	{ 				
		if(this.cantAddNewActors == true) return;
		/*Does isCostumeInUse use a lot of resources??
		* It's only here because the sprites are iniated at boot
		* Createjs will break actors if a new actor is assigned an in 
		* use sprite from Boot*/
		if(this.isCostumeInUse(startingCostume)) return;
		
		var _actorID = this.getNextActorID();	
		if(isPlayerOrType === "putt"){
			this.actors[_actorID] = new sjs.PuttCostume(this, _actorID, true);	
			this.actors[_actorID].isPuttPutt = true;	
		}else if(isPlayerOrType === window.sjs.ActorController.SIMPLE_ACTOR){
			this.actors[_actorID] = new sjs.SimpleCostume(this, _actorID, true);	
		}else{
			this.actors[_actorID] = new sjs.Test(this, _actorID, isPlayerOrType);	
		}

		if(!isPlayerOrType !== window.sjs.ActorController.SIMPLE_ACTOR){
			this.actors[_actorID].color = (color == undefined) ? roomTemps._playerCurrentColor : color;
			this.actors[_actorID].CCColor = (color == undefined) ? roomTemps._PCCColor[roomTemps._playerCurrentColor] : color;
		}
		
		var _cost;
		if(startingCostume !== -1){
			if(roomOverride == undefined && (COSTUMES_DIRECTORY[roomTemps.currentRoomID] == undefined || !COSTUMES_DIRECTORY[roomTemps.currentRoomID][startingCostume])){
				if(isInRestart == true) 
					console.log("IS IN RESTART..");
					return;
			}
			else _cost = this.actors[_actorID].setCostume([COSTUMES_DIRECTORY[((roomOverride == undefined) ? roomTemps.currentRoomID : roomOverride)][startingCostume], startingCostume], isIdle, startFrame);
		}else _cost = this.actors[_actorID].setCostume(-1, false);
		
		this.actors[_actorID].name = (startingCostume == -1) ? "empty_actor" : startingCostume;
		this.stage.actors = this.actors;
		console.log("[ActorController] addActor()-> _actorID: " + _actorID + " / " + this.actors[_actorID].COSTUME);
		
		if(target == "addActorAt")//addActor was called from addActorAt()
			return ({cost:_cost, actorID:_actorID});
		
		if(target == undefined){
			this.actorLayer.addChild(_cost);
		}else {target.addChild(_cost); this.actors[_actorID].target = target;}

		return ({actor:this.actors[_actorID], actorID:_actorID});
	}// end of the function
	
	addActorAt(startingCostume, depthLevel = 1, payload = {isIdle: false, isPlayer: false, type: null, roomOverride: undefined, startFrame: 0, target: undefined, color: ""})
	{
		if(this.cantAddNewActors == true) return ({actor:null, actorID:-1});
		if(debug == true) console.debug("[ActorController]addActorAt called!");
		
		var _actor = this.addActor(startingCostume, payload.isIdle, payload.isPlayer, payload.roomOverride, payload.startFrame, "addActorAt", payload.color);	
		if(_actor.cost){
			var target = payload.target;
			if(target == undefined){
				this.actorLayer.addChildAt(_actor.cost, depthLevel);
			}else {target.addChildAt(_actor.cost, depthLevel); this.actors[_actorID].target = target;}
		}else return;

		return ({actor:this.actors[_actor.actorID], actorID:_actor.actorID});
	}// end of the function
	
	// ActorController.getActorIndexByID is @deprecated.. Remove for full release
	getActorIndexByID = createjs.deprecate(function(actorID, caller = ""){
		return actorID;
	}, "sjs.ActorController.getActorIndexByID");
	
	getActorIDByName(actorName, caller = ""){
		for(var key in this.actors){
			if(this.actors[key] && this.actors[key].name == actorName){
				return key;
			}
		};
		return undefined;
	}// end of the function
	
	actorTalk(actorIndex, whichTalkie, dispatchStopTalkingEvent = false){			
		if(this.currentActorTalking && this.actors[this.currentActorTalking])
				this.actors[this.currentActorTalking].stopTalking(dispatchStopTalkingEvent);
		if(this.actors[actorIndex] && this.actors[actorIndex].talk) this.actors[actorIndex].talk(whichTalkie);
		else updateClosedCaptions(true, CCText.NO_ACTOR_ERROR, null, true);
	}// end of the function	

	skipDialogue(){				
		//If there is an actor talking and that actor has been defined
		if(this.currentActorTalking && this.actors[this.currentActorTalking]){			
			if(this.actors[this.currentActorTalking].isTalkingFromArray && this.actors[this.currentActorTalking].currentTalkingArray){
				if((this.actors[this.currentActorTalking].talkieArrayIndex + 1) != this.actors[this.currentActorTalking].currentTalkingArray.length){
					this.actors[this.currentActorTalking].stopTalkieAudio();
					this.actors[this.currentActorTalking].nextTalkieInArr();
				}else {this.actors[this.currentActorTalking].currentTalkingArray = null; this.actors[this.currentActorTalking].stopTalking(true); }
			}
			else {
				this.actors[this.currentActorTalking].currentTalkingArray = null; 
				this.actors[this.currentActorTalking].stopTalking(true);
			}//End if...else
			return;
		}//End of if statement
		if(debug == true)console.log("[ActorController]skipDialogue -> No dialogue to skip..");
	}// end of the function
	stopActorTalking(actorID){	
		if(this.currentActorTalking == actorID)this.actors[actorID].stopTalking();
	}// end of the function
	
	stopAllTalking(){	
		sjs.ActorController.stopWaitingTalkie();
		for(i = 0; i <= Object.getOwnPropertyNames(actors).length; i++){
			if(this.actors[i]  && this.actors[i].isTalking == true){					
				this.actors[i].stopTalking();
			}	
	
		}
	}// end of the function
					
	removeActor(actorID, doDelete = true, removeTarget = true)	{
		let index = actorID;
		let actor = this.actors[index];	
		if(debug == true) console.debug("[ActorController][CostumeTrunk]removeActor(actorID: " + actorID +") / " + this.actors[index].COSTUME);
		if(!actor){
			console.warn("[ActorController]Actor: " + actorID + " was not available to remove!!");
			return;
		}
		this.actors[index].COSTUME.removeAllChildren();
		if(removeTarget){
			if(this.actors[index].target){
				this.actors[index].target.removeChild(this.actors[index].COSTUME);
			}else this.actorLayer.removeChild(this.actors[index].COSTUME);
		}
		delete this.actors[index].COSTUME;
		if(this.actors[index]._layers && this.actors[index]._layers._layer1)
			this.actors[index]._layers._layer1.removeAllEventListeners();	
		if(this.currentActorTalking == actorID){
			this.actors[index].stopTalking();
			this.currentActorTalking = null;
		}
		this.actors[index].FramesSignal.removeAll();	
		this.actors[index].AnimationFinishedSignal.removeAll();	
		if(this.actors[index].TalkingCompleted) this.actors[index].TalkingCompleted.removeAll();	
		this.actors[index].ActorClicked.removeAll();	
		this.actors[index].animationendFunc = null;	
		this.actors[index].actorID = null;
		this.actors[index].frameScipts = null;	

		if(doDelete == true){
			delete this.actors[index]; 
		}
	}// end of the function
	
	removeAllActors(setCantAddNewActors = false){
		removeAllActorsFromRoom(setCantAddNewActors);
	}
	
	removeAllActorsFromRoom(setCantAddNewActors = false){
		for(var key in this.actors){
			if(this.actors[key] && this.actors[key].actorID){
				this.removeActor(this.actors[key].actorID, false, false);
			}
		};
		this.actorLayer.removeAllChildren();
		this.refreshActorsList();
		this.cantAddNewActors = setCantAddNewActors;
	}// end of the function
	
	refreshActorsList(){
		this.actors = new Object();
	}// end of the function
			
	hideCostume(actor){
		this.actors[actor].COSTUME.visible = false;
	}// end of the function
	
	showCostume(actor){
		this.actors[actor].COSTUME.visible = true;
	}// end of the function
	
	isCostumeInUse(_costName){
		if(_costName == -1) return false; 
		for(var key in this.actors){
			if(this.actors[key] && this.actors[key].actorID){
				if(this.actors[key].COSTUME && this.actors[key].COSTUME.name == _costName){
					return true;
				}
			}
		};
		return false;
	}// end of the function
	
	getCostume(_costName){
		//COSTUMES_DIRECTORY[roomTemps.currentRoomID][costumeObject]
		for(var _room in COSTUMES_DIRECTORY){
			if(COSTUMES_DIRECTORY[_room][_costName]){
				return COSTUMES_DIRECTORY[_room][_costName];
			}//end if
		};//end loop
		return false;
	}// end of the function
			
	getNextActorID(){
		let id = -2;
		
		Object.keys(this.actors).map(index =>{
			id = Math.max(id, index);
		});		
		return id + 1;
	}		
}
window.sjs.ActorController.SIMPLE_ACTOR = "simp";
window.sjs.ActorController.currentActorInTalkWait = -1;
window.sjs.ActorController.currentTalking = -1;
window.sjs.ActorController.staticStopAllTalking = function (dispatchEvents = false){
	var _actorIdex = sjs.ActorController.currentTalking;
	if(_actorIdex == undefined) sjs.ActorController.currentTalking = null;
	if(sjs.ActorController){
		sjs.ActorController.stopWaitingTalkie();	
		window.actors[_actorIdex].stopTalking(dispatchEvents);
	}
}
window.sjs.ActorController.stopWaitingTalkie = function (){
	if(sjs.ActorController.currentActorInTalkWait != -1){		
		if(window.actors[sjs.ActorController.currentActorInTalkWait]._waitDelegate !== null) window.actors[sjs.ActorController.currentActorInTalkWait]._waitDelegate.pause();
		window.actors[sjs.ActorController.currentActorInTalkWait]._talkWaitActive = false;
		sjs.ActorController.currentActorInTalkWait = -1;
	}
}
window.sjs.ActorController.getSprite = function (spriteSheet){
	var _loc1 = LOADERS.costumes.loader;
	return new createjs.Sprite(_loc1.getResult(spriteSheet));
}
window.sjs.ActorController.createColorBookSprite = function (spriteSheet, colorLookUp, colorReplace, doApply){	
	// ensure loaded via your own means
	var ss = spriteSheet;
	if(!colorLookUp) colorLookUp = ["#FBA7FF", "#BF63BB", "#833F7F"];
	if(!colorReplace){
		var redColor = new createjs.ChangeColors(["#FBA7FF", "#BF63BB", "#833F7F"], ["#FF6D62", "#E60400", "#8B0000"]);  //color change filter
		ss.createFilter("red", [redColor]); //Create Color Change Filter
		var greenColor = new createjs.ChangeColors(["#FBA7FF", "#BF63BB", "#833F7F"], ["#08D639", "#089D18", "#006910"]);  //color change filter
		ss.createFilter("green", [greenColor]); //Create Color Change Filter
		var blueColor = new createjs.ChangeColors(["#FBA7FF", "#BF63BB", "#833F7F"],  ["#5A85FF", "#294CBD", "#183083"]);  //color change filter
		ss.createFilter("blue", [blueColor]); //Create Color Change Filter
		var yellowColor = new createjs.ChangeColors(["#FBA7FF", "#BF63BB", "#833F7F"], ["#E6E64A", "#DEB900", "#A48510"]);  //color change filter
		ss.createFilter("yellow", [yellowColor]); //Create Color Change Filter
	}
	
	var s = new createjs.Sprite(ss);//create the sprite
	if(doApply === true)s.applyFilter("colorChange");//apply the filter	
	return s;
}
