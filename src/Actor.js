// namespace:
this.sjs = window.sjs || {}; 									
 
(function() {
	"use strict"; 
 
// constructor:
	/**
	 * The Actor class is used to create the DisplayObject as well as handles certain animations
	 * @class Actor
	 * @param {CodeBlock} _controller is the manager of all Actors and their Costumes.
	 * @param {Number} _actorNumber is the actor's identifier number.
	 * @param {Boolean} isPlayer is set true or false to tell if this Costume belongs to the player.
	 * @constructor
	 */
	function Actor(_controller, _actorNumber, isPlayer = false) {	
		// public properties:
		this.CLASS_NAME = "Actor";//CONSIDER: Private var?
		this.CLASS_STRING = "["+this.CLASS_NAME+"]";//CONSIDER: Private var?
		this.COSTUME = new createjs.Container();
		this.controller = _controller;
		this.isPlayer = isPlayer;

		//COSTUME VARS
		this.color = "purple";								   
		this.isIdle = false;
		
		/**_layers_ and _layers are being phased
		* out for DisplayObject.getChildAt() or 
		* DisplayObject.children[INDEX] in createjs**/
		this._layers_deprcateMsg = false;
		this._layers_ = undefined;
		Object.defineProperties(this, {
			//Use COSTUME.getChildAt(INDEX); instead!!
			_layers: { 
				get: function(value) { 
					if(this._layers_ != undefined && this._layers_deprcateMsg == false){
						createjs.deprecate(undefined, "Actor._layers")();
						this._layers_deprcateMsg = true;
					}//End if
					if(this._layers_ == undefined){
						this._layers_ = new Object();	
						if(this.COSTUME)
							this._layers_._layer1 = this.COSTUME.getChildAt(0);
					}//End if
					if(this.COSTUME) this._layers_._amount = this.COSTUME.numChildren;
					else this._layers_._amount = 1;
					return this._layers_; 
				},//End GET			
				set: function(value) {this._layers_ = value;}}//End SET
		});				
		this._body = undefined;
		this._head = undefined;
		this._eyes = undefined;
		this._lids = undefined;
		this.actorID = _actorNumber;
						   
		this.isPuttPutt = false;
		this._canBlink = true;
		Object.defineProperty(this, 'canBlink', {
		  get() {
				return this._canBlink;
		  },
		  set(value) {
				if(value === false) this._lids.gotoAndStop(0);
				this._canBlink = value;
				console.log("["+this.CLASS_NAME+"] set canBlink() -> _canBlink = " + value);
		  }
		});	
		this._interactsWithCursor = "";
		Object.defineProperty(this, 'interactsWithCursor', {
		  get() {
			return this._interactsWithCursor;
		  },
		  set(value) {
			if(!this.actorID && !this.COSTUME) return;				
			for (const _child in this.COSTUME.children) {
				let _sprite = this.COSTUME.children[_child];
				_sprite.interactsWithCursor = value;
				continue;
			}//End Loop
			this._interactsWithCursor = this.COSTUME._interactsWithCursor = value;
		  }
		});		
		this.eyeState = "normal";
		this.normalEyeState = "normal";
		this.tempEyeState = "";
		this.lockEyeState = false;
		this.roomRef = _controller.roomReference;
		this.costInitFunc = null;//Only works when Actor was created...Ex. addEmptyActor was called before setting costInitFunc
		
		//EVENTS AND SIGNALS
		this.animationendFunc;		
		this.dispatchAnimationEnd = true;		
		this.isAnimatiing = false;	
		this.AnimationFinishedSignal = new signals.Signal(Number);	
		this.TalkingCompleted = new signals.Signal(Number);	
		this.ActorClicked = new signals.Signal(Number);	
		this.FramesSignal = new signals.Signal();	
		this.frameScipts = new Array();	
		
		//DIALOGE RELATED VARIABLES
		this.CCColor = "#ffa6ff";		
		this.flapWaitsForLids = false;		
		this.isFlapWaitingForLids = false;		
		this.isMouthFlapping  = false;		
		this.mouthFlappingAnimation = undefined;		
		this._waitDelegate = null;		
		this._talkWaitActive = false;		
		this.isTalking = false;		
		this.canSwitchWhileTalking = false;		
		this.canTalkOverOthers = false;		
		this.talkieLoadError = false;		
		this.isTalkingFromArray = false;		
		this.lastTalkie;		
		this.stopClickedTalkingDelegate;		
		this.skipDioPressed = false;		
		this.talkieArrayIndex = 0;		
		this.lipSyncDataIndex = 0;		
		this._mouthFrame = 10;
		this._streachSqaushRoot = {"U":"Root", "C_D_Z":"Root", "C_S":"Root", "W_Q":"Root", L:"Root",
								"O":"stretch", "A":"stretch" , "I":"stretch",
								"E":"squash", "M_B_P":"squash", "F_V":"squash"};
								
		console.log(this.CLASS_STRING, "constructor() -> Creating Actor:", this.actorID, "/ Room Actors:", (this.controller.actors));
		return this;
	}
	var p = Actor.prototype; 
 
// public methods:
	/**
	 * Set's the costume of an Actor and then returns it's costume{Container}.
	 * @method setCostume
	 * @param costumeObject {Object/String}, when passing a string through you 
	 * should be passing the Costume's name from "COSTUMES_DIRECTORY". Otherwise,
	 * pass through the costume object, such as, COSTUMES_DIRECTORY[ROOM_ID_NUMBER]["COSTUME_NAME_IN_DIRECTORY"].
	 * @param isIdle {Bool}, setting this to false will invoke "costInit" 
	 * It should also be notted that this will also allow the costume to become
	 * a clickable hot-spot to the player.
	 * @param frameInit {Number/String} is the frame the Costume will start on. 
	 * @return COSTUME {Container} a representation of the Actor's state.
	 **/

	p.setCostume = function(costumeObject, isIdle = false, frameInit = null){
		let _index = this.actorID; //this.controller.getActorIndexByID(this.actorID);
		let _actor = this.controller.actors[this.actorID];
		
		if (!_actor){//If Actor has not been defined by ActorController
			console.warn("["+this.CLASS_NAME+"]Actor: " + this.actorID + " is not in room...");
			return;
		}
		this.COSTUME.isCost = true;//Give an identifier to the Display Object it self
		
		if(this.isTalking == true && this.canSwitchWhileTalking == false)this.stopTalking();//Stop talking first!!
		this.TalkingCompleted.removeAll();	//Stop talking first!!
		if(typeof costumeObject === 'string' || costumeObject instanceof String){// Get the sprite as the costume
			if(debug == true)console.log(this.CLASS_STRING, "STRING WAS PASED THROUGH as costumeObject");
			costumeObject = [COSTUMES_DIRECTORY[roomTemps.currentRoomID][costumeObject], costumeObject];
			if(costumeObject[0] === undefined){
				if(debug == true)console.warn(this.CLASS_STRING, "Dumb warning..This Costume is not in the current room");
				costumeObject[0] = this.controller.getCostume(costumeObject[1]);//Maybe set back to return if slowler machines strugle??
				if(costumeObject[0] == false)
					return;
			}
		}		
		if(this.COSTUME.name === costumeObject[1]){//Check if a Costume change  is needed
			console.debug(this.CLASS_STRING, "Actor: " + this.actorID + " is already wearing: " + this.COSTUME.name);
			if(frameInit !== null) this.gotoAndPlay(frameInit);
			return;
		}else if(frameInit === null)frameInit = 0;

		if(this.COSTUME.numChildren >= 1){//Before we set a costume we have to make sure the Actor's children have been cleared
			let kids = this.COSTUME.children;
			while (kids.length){ 
				kids[0].removeAllEventListeners();
				this.COSTUME._removeChildAt(0);
			}
		}
		
		//Setup the layers of the Costume
		this._layers = undefined;
		this._body = undefined;
		this._head = undefined;
		this._eyes = undefined;
		this._lids = undefined;
		if(costumeObject == -1){
			this.COSTUME.name = "empty_costume";
			this.COSTUME.addChild(new createjs.Container());//May need to set _layer1 as name
			return this.COSTUME;		
		}
		
		this.isIdle = isIdle;//Is the costume Idle??
		this.COSTUME.name = costumeObject[1];//get costume name
		costumeObject = costumeObject[0];//then override costumeObject to just get the layer data
		
		//this.AnimationFinishedSignal.addOnce(this.handleAnimationDone, this);	
		if(costumeObject[0] && costumeObject[0].isNewType == true){
			return(this.setLayeredCostume(_index, costumeObject, {"play": frameInit}));//Look into if setCostume Fully removes old data..
		}
				
		var _sprite = costumeObject;	
		if(typeof(_sprite.spriteSheet) != 'undefined' && !_sprite.spriteSheet.orginalFPS){
			Object.defineProperty(_sprite.spriteSheet, "orginalFPS", {
				value: parseInt(_sprite.spriteSheet.framerate),
				writable: false
			});					
		}
		let _ogFPS = (_sprite.spriteSheet) ? _sprite.spriteSheet.orginalFPS : _FPS; 
		
		_sprite.onAddedListener = _sprite.on("added", this.costInit, this);		
		this.COSTUME.addChild(_sprite);
		_sprite.visible = true;

		this.animationendFunc = _sprite.on("animationend", function (e){
			e.target.off("animationend", this.animationendFunc);
			this.animationendFunc = null;
			if(_actor.dispatchAnimationEnd === false) return; 
			if(_actor.isIdle === false){ 
				//_sprite.visible = false;//Possible fix for one second black-out, see stage.cache() in Engine
				if(_sprite.currentAnimation !== null)//Possible fix for one second black-out, see stage.cache() in Engine
					_sprite.gotoAndStop(e.target.currentFrame);
				else
					_sprite.gotoAndStop(e.next);
				//this.AnimationFinishedSignal.dispatch(this.actorID);
			}
			this.AnimationFinishedSignal.dispatch(this.actorID);
		}, this, true);		
			
		console.log(this.CLASS_STRING, "Actor: " + this.actorID + " goto frame: " +  frameInit);
		_sprite.gotoAndPlay(frameInit);
		
		if(this.color == "purple" || this.color == "normal")_sprite.removeFilter();	
		else _sprite.applyFilter(this.color);//apply the filter	

		return this.COSTUME;		
		
	};
		
	p.setLayeredCostume = function(_index, costumeObject, options = {"play": 0}){
		//TODO: Change _layer# refs to getChildAt or DisplayObject.children[#]
		console.debug(this.CLASS_STRING, "Setup a layered costume...");
		let _actor = this.controller.actors[this.actorID];
		
		this._layers = new sjs.CostumeLayersNewVO(costumeObject)._layers;
		var _lyr1 = this._layers._layer1;
		_lyr1.onAddedListener = _lyr1.on("added", this.costInit, this, true);//Allows for FrameScripts
		
		for(i = 1; i <= this._layers._length; i++){	//Loop through the layers and start attatching to COSTUME
			let _currentLayer = this._layers["_layer" + i];
			let _currentLayerType = _currentLayer.type;
			
			//If the layer is not the EYES layer and is NOT hidden..
			//if(_currentLayerType != sjs.CostumeLayersNewVO.EYES && !costumeObject[i].isHidden){
			if(_currentLayerType != sjs.CostumeLayersNewVO.EYES){
				switch(_currentLayerType) {
					case sjs.CostumeLayersNewVO.HEAD:
						this.setHead(_currentLayer);
						break;
					case sjs.CostumeLayersNewVO.LIDS:
					case sjs.CostumeLayersNewVO.EYES_WITH_LID:
						this._lids = _currentLayer;
					  //this._lids.on("added", this.lidsInit, this, true);//Allows for FrameScripts
						this._lids.on("tick", this.lidsInit, this);
						this._lids.visible = ((_currentLayerType == sjs.CostumeLayersNewVO.EYES_WITH_LID) ? false : true);
						//If the eyes json holds the lids as well ^
						break;
					case sjs.CostumeLayersNewVO.BODY: //Body setup
						this.setBody(_currentLayer);
						if(this.isIdle == true)this._body.gotoAndPlay(0);
						break;
					default:
						console.warn(this.CLASS_STRING, "Unkown layer type was passed through");
				}
				//Set the original FPS and make it read-only
				if(typeof(_currentLayer.spriteSheet) != 'undefined' && !_currentLayer.spriteSheet.orginalFPS){
					Object.defineProperty(_currentLayer.spriteSheet, "orginalFPS", {
						value: parseInt(_currentLayer.spriteSheet.framerate),
						writable: false
					});					
				}
				let _ogFPS = (_currentLayer.spriteSheet) ? _currentLayer.spriteSheet.orginalFPS : _FPS; 
				
				let _child = this.COSTUME.addChild(_currentLayer);//Add layer to COSTUME
				if(costumeObject[i].isHidden && costumeObject[i].isHidden === true) _child.visible = false;	//Hide it if need be
				
			}else if(_currentLayerType == sjs.CostumeLayersNewVO.EYES) {//Eyes case..
				this.addEyes(_currentLayer);//Setup dynamix eyes allowing the actor to look at something
			}
			
			//Do ColorBook
			if((this.color == "purple" || this.color == "normal") && _currentLayer.removeFilter)
				_currentLayer.removeFilter();	
			else{
				if(_currentLayer.applyFilter)
					_currentLayer.applyFilter(this.color);//apply the filter	
			}
		}// END OF LOOP
		
		if(typeof options.stop !== 'undefined' && _lyr1.type != sjs.CostumeLayersNewVO.HEAD){			
			_lyr1.gotoAndStop(options.stop);
		}else if(_lyr1.type != sjs.CostumeLayersNewVO.HEAD) _lyr1.gotoAndPlay(options.play);	
		
		this.animationendFunc = _lyr1.on("animationend", function (e){
			e.target.off("animationend", this.animationendFunc);
			this.animationendFunc = null;
			if(!_actor.isIdle) this.AnimationFinishedSignal.dispatch(this.actorID);
		}, this, true);				
				
		return this.COSTUME;	
	};
	p.setBody = function(_layer){
		this._body = _layer;
	};
	p.setHead = function(_layer){
		this._head = _layer;
		this._head.gotoAndStop(0);
	};
	p.getHead = function(){
		return this._head;
	};
	p.addEyes = function(_layer){
		var _loc1 = new createjs.Container();
		for(var i = 0; i < _layer.length; i++){	
			var _loc2 = _loc1.addChild(_layer[i].sprite);
			_loc2.visible = false;
			_loc2.name = _layer[i].eyeState;
		}//end loop	
		this._eyes = _loc1;
		this._eyes.getChildAt(0).visible = true;
		this._eyes.getChildAt(0).gotoAndStop(0);
		this._eyes.type = sjs.CostumeLayersNewVO.EYES;
		this.COSTUME.addChild(this._eyes);
	};
	p.addLayer = function(sprite, frameData = {}, layerNumber){
		if(!sprite){
			console.warn("["+this.CLASS_NAME+"] NO SPRITE WAS GIVEN for method 'addLayer'. Stoping method..");
			return;
		}
		let _frameInit = frameData.frameInit;
		let _sprite = sjs.ActorController.getSprite(sprite);
		let _layer = sjs.CostumeLayersNewVO.buildLayer(this.COSTUME, _sprite, layerNumber);
		let _childAdded = this.COSTUME.addChild(_layer);
		
		if(frameData.stop == true || frameData.gotoAndStop == true || frameData.stopOn == true){
			_layer.gotoAndStop(_frameInit);
		}else _layer.gotoAndPlay(((_frameInit) ? _frameInit : 0));
		return _childAdded;
	};
	p.getLayerByType = function(type){
		if(this.COSTUME){
			for (const _child in this.COSTUME.children) {
				if(this.COSTUME.children[_child].type && this.COSTUME.children[_child].type == type)
					return this.COSTUME.children[_child];
			}//End Loop
		}//End If
		return undefined;
	};
	p.handleAnimationDone = function(){
		console.debug("["+this.CLASS_NAME+"]handleAnimationDone() -> Animation finished on " + this.actorID);		
	};

	p.costInit = function(e){
		console.debug("["+this.CLASS_NAME+"]costInit() -> Costume initiation on actor:", this.actorID);
		this.scopeIssue = e.currentTarget;
		if(this.isIdle == true || this.ActorClicked.getNumListeners() > 0){
			console.debug("["+this.CLASS_NAME+"]costInit() -> Make Actor", this.actorID, "a VERB!!");
			this.controller.stage.setupClickPoint(this.COSTUME, sjs.Actor.createDelegate(this.handleActorClicked, this), true, false);
		}//end
		if(this.isPuttPutt) console.debug("["+this.CLASS_NAME+"]costInit() -> Hi, I'm Putt-Putt!");//TODO: Remove flag
		if(e.currentTarget.spriteSheet && e.currentTarget.spriteSheet._relativeOffsets.length >= 1)//Testing relOffs
			e.currentTarget.on("tick", this.relativeOffseting, this);
		if(this.costInitFunc?.constructor !== undefined){//Only works when Actor was already created...Ex. addEmptyActor was called before setting costInitFunc
			this.costInitFunc(e);
			this.costInitFunc = null;
		}//end
		e.currentTarget.on("change", this.doFrameScripts, this);
		e.currentTarget.on("tick", this.handleAudioUpdates, this);
		if(e.target !== undefined && e.target.hasEventListener("added"))
			e.target.off("added", e.target.onAddedListener);
	};
	p.lidsInit = function(e){
		if(this._lids && (this.COSTUME && this.COSTUME.visible === true)){
			const _lidsAsTarget = e.target;
			const _currentFrame = _lidsAsTarget.currentFrame;
			const _currentAnimation = _lidsAsTarget.currentAnimation;
			if(_currentFrame === 0){
				let _rand = getRandomInt(0, 200);
				let _randTwo = getRandomInt(0, 100);
				//console.log(_rand, _randTwo);
				if(_rand == _randTwo){
					if (debug == true) console.log("BLINK..", this.actorID);
					this.doBlink();
				}else _lidsAsTarget.gotoAndStop(0);
			};
			if((_lidsAsTarget.spriteSheet.getAnimation("lids_end") && _currentAnimation == "lids_end") ||
				(_lidsAsTarget.spriteSheet.getAnimation("empty") && _currentAnimation == "empty")){
				_lidsAsTarget.visible = false;
				_lidsAsTarget.gotoAndStop(0);
			};
			return;
		}
	}		
	p.handleActorClicked = function(){	
		if(this.isPlayer == true && ROOM_PLAYER_AUDIO){
			_mm_can_skip = false;//TODO: This needs to be rethunk
			this.talk(ROOM_PLAYER_AUDIO[getRandomInt(0, (ROOM_PLAYER_AUDIO.length - 1))], null, "player", false);
			this.stopClickedTalkingDelegate = sjs.Actor.createDelegate(this.stopTalking, this, true);
			SignalsObject.EscapeSignal.addOnce(this.stopClickedTalkingDelegate);
		}
		if(this.ActorClicked.getNumListeners() > 0)
			this.ActorClicked.dispatch(this.actorID)
	}
	
	p.talk = function(whichTalkie, talkieCompletedCallback, _eyeState, ignoresStopFlag = false, tag){	
		//if(!this.actorID) throw '[CostumeTrunk]This Actor is not here?? What should I do?';
		_mm_can_skip = false;//TODO: This needs to be rethunk
		console.debug(this.CLASS_STRING, "talk()-> Actor:", this.actorID, "IS ABOUT TO TALK:", whichTalkie, "/ ignoresStopFlag:", ignoresStopFlag, "/ While lookingAt:", _eyeState);	
		if((typeof whichTalkie === 'object' || whichTalkie instanceof Object) && !Array.isArray(whichTalkie)){
			console.log(this.CLASS_STRING, "talk()-> OpCodes:",  whichTalkie);
			let _returned = this.processTalkieObject(whichTalkie, _eyeState);
			if(typeof(_returned) !== 'undefined'){
				if(_returned.audio) whichTalkie = _returned.audio;
				else whichTalkie = _returned;
			}
		}else this.tempEyeState = (_eyeState == undefined) ? "normal" : _eyeState;
	
		if(!ignoresStopFlag){//Allows for talking overrides
			if(this.controller.currentActorTalking == this.actorID){
				//if it's the same actor talking just prep them for the new audio
				this.stopTalkieAudio();
				this.isTalkingFromArray = false; 
				this.isTalking = false; 
				this.checkIfWaitIsStillActive();
				console.debug("["+this.CLASS_NAME+"]talk() -> actorID: " + this.actorID + " IS TALKING AGAIN!");	
				if(SignalsObject.EscapeSignal.has(this.stopClickedTalkingDelegate)) SignalsObject.EscapeSignal.remove(this.stopClickedTalkingDelegate);
				/*if(this.TalkingCompleted.getNumListeners() >= 1)
					this.TalkingCompleted.dispatch(this.actorID);*/
			}else{
				//If it's a new actor talking stop everyone from talking
				if(debug == true) console.debug("["+this.CLASS_NAME+"]talk() -> Stop current actor talking to start new convo...");
				this.controller.stopAllTalking();
			}
			this.currentTalkingArray = null;
		}else this.canTalkOverOthers = true;
		
		if(Array.isArray(whichTalkie)){
			this.talkieArrayIndex = 0;
			this.talkArray(whichTalkie, tag);
			return;
		}
		if(typeof(whichTalkie) !== 'undefined' && whichTalkie.wait){//This will add a wait in between Talkie Arrarys
			//Example: ActorController.actors[1].talk(["PUTTPUTT.013", {wait:1000}, "PUTTPUTT.0014"]);
			console.log("["+this.CLASS_NAME+"]talk() .wait !!!");
			updateClosedCaptions(false);//Hide last talkie captions
			this.lastTalkie = whichTalkie;//Update the last talkie
			this._talkieCompletedCallback = talkieCompletedCallback;//set the talkie callbak since it won't get set in playTalkieAudio
			this.stopFlappingMouth("talk(wait!!)", false);//Stop flapping the mouth but keep last eye state
			if(this._eyes)this._eyes.getChildByName(this.eyeState || this.tempEyeState).gotoAndStop(0);
			
			this._waitDelegate = new JiffyWait(sjs.Actor.createDelegate(this.checkIfWaitIsStillActive, this), whichTalkie.wait);//Do after the time has elapsed
			sjs.ActorController.currentActorInTalkWait = this.actorID;//Set the current Actor in waiting..
			this._talkWaitActive = true;//Now set them as activly waiting.
			console.log(this._waitDelegate);
		}
		this.lipSyncDataIndex = 0;
		if(typeof(whichTalkie) !== 'undefined'){
			if(this.isTalkingFromArray == true && !whichTalkie.wait)this.playTalkieAudio(whichTalkie, talkieCompletedCallback, tag);
			if(this.isTalking == false && !whichTalkie.wait)this.playTalkieAudio(whichTalkie, talkieCompletedCallback, tag);
		}
		this.controller.currentActorTalking = this.actorID;
		sjs.ActorController.currentTalking = this.actorID;
		if(typeof(whichTalkie) !== 'undefined' && !whichTalkie.wait)this.flapMouth((lipSyncData[this.controller.currentTalkiePlaying.name]) ? true : false);	
	}// end of the function	

	
	p.checkIfWaitIsStillActive = function(){
		if(this._talkWaitActive == true){
			if(debug == true)console.log("TALKER IS NO LONGER IN WAIT");
			sjs.ActorController.stopWaitingTalkie();
			this.handleAudioComplete();
		}
	}
	
	p.talkArray = function(array, tag){	
		this.isTalkingFromArray = true; 
		//talk(whichTalkie, talkieCompletedCallback, _eyeState, ignoresStopFlag = false, tag)
		this.talk(array[this.talkieArrayIndex], null, this.tempEyeState, true, tag);
		this.currentTalkingArray = array;
		this.currentTalkingArray.tag = tag;
	}// end of the function
	
	p.nextTalkieInArr = function(){	
		this.isTalking = true;
		this.isTalkingFromArray = true; 
		if(this._talkWaitActive){
			this._waitDelegate.pause();
			this._talkWaitActive = false;
		}
		//If the Talkie Array want's to change who's talking
		if(this.currentTalkingArray[this.talkieArrayIndex + 1].changeTalker){
			if(debug == true) console.log("FOUND changeTalker!");
			var _newTalker = this.currentTalkingArray[++this.talkieArrayIndex].changeTalker; //New Talker's ID
			this.stopFlappingMouth("changeTalker", false);//Stop the last actor's mouth flaps but keep their eye state
			this.controller.currentActorTalking = _newTalker;//set the new talker as the current
			this.isTalking = false;
			var _adjustedArr = this.currentTalkingArray.slice(++this.talkieArrayIndex);//Get what's left of the talkie arr after the actor change

			if(this.currentTalkingArray[this.talkieArrayIndex - 1].lookAt)//if there is a look at attached to the change actor
				this.controller.actors[_newTalker].lookAt(this.currentTalkingArray[this.talkieArrayIndex - 1].lookAt);
			if(this.currentTalkingArray[this.talkieArrayIndex])//If a talkie is next in the arr
				this.controller.actorTalk(_newTalker, _adjustedArr);
			else this.stopTalking();//Otherwise stop talking..
			
			this.isTalkingFromArray = false; 
			this.talkieArrayIndex = 0;
			
		}else this.talk(this.currentTalkingArray[++this.talkieArrayIndex], null, this.eyeState, true, this.currentTalkingArray.tag);
	}// end of the function
	
	p.stopTalkieAudio = function(){	
		//this.TalkingCompleted.removeAll();
		_soundEffectsMediator.stopSoundsOnLayerByName('talkies', false);
	}// end of the function
	
	p.stopTalking = function(dispatchEvent = false){
		if((multiTextCCObj && multiTextCCObj._multiPartText && multiTextCCObj._multiPartText.length > 1) && multiTextCCObj._multiPartIndex >= 0)multiTextCCObj._multiPartIndex = -1;
		this.stopTalkieAudio();
		this.stopFlappingMouth("stopTalking");
		this.isTalking = false;
		this.isTalkingFromArray = false; 
		this.talkieArrayIndex = 0;
		if(this.controller.currentActorTalking == this.actorID) this.controller.currentActorTalking = null;
		if(this.talkieLoadError == false) updateClosedCaptions(false);
		if(dispatchEvent == true) this.TalkingCompleted.dispatch(this.actorID);
		if(SignalsObject.EscapeSignal.has(this.stopClickedTalkingDelegate)) SignalsObject.EscapeSignal.remove(this.stopClickedTalkingDelegate);
		if(dispatchEvent == true)if(this._talkieCompletedCallback) this._talkieCompletedCallback();
		_mm_can_skip = true;								
	}// end of the function
	
	p.playTalkieAudio = function(whichTalkie, talkieCompletedCallback, tag){
		if (whichTalkie){
			this.lastTalkie = whichTalkie;
			this._talkieCompletedCallback = talkieCompletedCallback;
			var instance = playTalkieSnd(registerSound(whichTalkie), sjs.Actor.createDelegate(this.handleAudioComplete, this), tag);//make sure to make a seperate function for playing talkies	
			 if (instance == false || !instance || !instance.sfx) {
				if(debug == true)console.warn("["+this.CLASS_NAME+"]playTalkieAudio()-> PLAY FAILED!");
				this.talkieLoadError = true;
				SignalsObject.CCTimeout.addOnce(this.handleTextComplete, this);
				this.controller.currentTalkiePlaying = whichTalkie;
			 }else{
				this.talkieLoadError = false;
				this.controller.currentTalkiePlaying = instance.sfx;
				this.controller.currentTalkiePlaying.name = whichTalkie;
			 }
			 if(this.talkieLoadError || usingCaptions == true ){
				if(CCText[whichTalkie])updateClosedCaptions(true, CCText[whichTalkie], this.CCColor, this.talkieLoadError);	
				else updateClosedCaptions(true, whichTalkie, this.CCColor, this.talkieLoadError);
			}
			this.isTalking = true;
			return true;
		} // end if
		console.error("["+this.CLASS_NAME+"]playTalkieAudio() MADE IT TO THE END OF FUNCTION...WHAT HAPPENED?!?! / whichTalkie: " + whichTalkie);
		this.isTalkingFromArray = false;
		this.currentTalkingArray = null;
		this.handleAudioComplete();
		return false;
	} // End of the function
	
	p.handleTextComplete = function(event) {
		if (multiTextCCObj.hasOwnProperty('_multiPartText') && (multiTextCCObj._multiPartText.length > 1 && multiTextCCObj._multiPartIndex >= 0)){
			return;
		}
		if(debug == true)console.log("["+this.CLASS_NAME+"] Text is hidden..continue playing talkies...");
		if(this.talkieLoadError)SignalsObject.CCTimeout.remove(this.handleTextComplete, this);
		if(this._talkieCompletedCallback) this._talkieCompletedCallback();
		this.handleAudioComplete();
	}	
	
	p.handleAudioComplete = function(event) {
		if(debug == true) console.debug("["+this.CLASS_NAME+"] Actor: " + this.actorID + " IS DONE TALKING!!!!");			
		if(this.talkieLoadError == false) updateClosedCaptions(false);
		if(this.isTalkingFromArray){
			if(this.currentTalkingArray && (this.talkieArrayIndex + 1) == this.currentTalkingArray.length){
				this.isTalkingFromArray = false; 
				this.currentTalkingArray = null;
			}else{		
				this.nextTalkieInArr();
				return;
			}
		}
		this.controller.currentActorTalking	= null;
		this.isTalking = false;
		this.stopFlappingMouth("handleAudioComplete");
		if(debug == true) console.debug("["+this.CLASS_NAME+"] handleAudioComplete() -> DISPATCH TALKING COMPLETED! ");
		this.TalkingCompleted.dispatch(this.actorID);
		if(this._talkieCompletedCallback) this._talkieCompletedCallback();
		this._talkWaitActive = false;
		if(SignalsObject.EscapeSignal.has(this.stopClickedTalkingDelegate))
			SignalsObject.EscapeSignal.remove(this.stopClickedTalkingDelegate);
		_mm_can_skip = true;
	}
	
	p.processTalkieObject = function(talkieObject, _eyeState){
		var _talkie = undefined;
		if(talkieObject.lookAt){
			this.tempEyeState = talkieObject.lookAt;
		}else this.tempEyeState = (_eyeState == undefined) ? "normal" : _eyeState;
		//if(this.flapWaitsForLids !== true) this.lookAt(this.tempEyeState);// May be needed for Freddi Fish
		if(talkieObject.audio){
			_talkie = talkieObject.audio;
		}
		if(talkieObject.func){
			talkieObject.func();
		}
		return _talkie;
	}	
	
	p.hideAllEyes = function(){
		var _loc1 = this._eyes;
		for(i = 0; i < _loc1.numChildren; i++){	
			if(_loc1.getChildAt(i).visible == true){
				_loc1.getChildAt(i).visible = false;
				_loc1.getChildAt(i).gotoAndStop(0);
				if(debug == true) console.debug("hide eyes: " + _loc1.getChildAt(i).name);
			}
		}
	}	
	
	p.stopFlappingMouth = function(caller, updateEyes = true){	
		if(this._head)this._head.gotoAndStop((this._head.customTimeline && this._head.customTimeline.start) | 0);
		if(this._eyes instanceof createjs.Container){//04/9/23
			var _theStopper = (this._lids && this._lids.type == sjs.CostumeLayersNewVO.EYES_WITH_LID) ? this.eyeState : 0;
			this._eyes.getChildByName(this.eyeState).gotoAndStop(_theStopper);//12/9/21
		}
		if(this._eyes instanceof createjs.Container && this._eyes.children.length >= 1 && updateEyes == true){
			//this.doBlink();
			if(this.lockEyeState == false){
				if(this._eyes.getChildByName(this.eyeState))this._eyes.getChildByName(this.eyeState).visible = false;
				this._eyes.getChildByName(this.normalEyeState).visible = true;
				this._eyes.getChildByName(this.normalEyeState).gotoAndStop(0);
				this.eyeState = this.normalEyeState.valueOf();
			}
		}
		this.isMouthFlapping = false;
	}
 
	p.flapMouth = function(hasLipSync = false){	
		if(debug == true) console.debug(this.CLASS_STRING, "flapMouth(_eyeState: " + this.eyeState + ")");
		var _eyeLayer = this._eyes;		
		if(this._lids)this._lids.removeAllEventListeners("animationend");
		let _eyesOnLidsSpriteSheet = (this._lids && this._lids.type == sjs.CostumeLayersNewVO.EYES_WITH_LID)
		let _eyeStateUpdate = this.lookAt(this.tempEyeState);
		if(debug == true)console.debug(this.CLASS_STRING, "flapMouth -> _eyeStateUpdate: " + _eyeStateUpdate); 
		if(debug == true)console.debug(this.CLASS_STRING, "flapMouth -> tempEyeState: " + this.tempEyeState); 
	
		//if player needs to blink check if audio should start after blink
		if (_eyeStateUpdate == true) {
			var _that = this;			
			if(this.flapWaitsForLids == true){
				if(debug == true)console.debug(_that.CLASS_STRING, "flapMouth -> isFlapWaitingForLids: " + this.isFlapWaitingForLids); 
				var _animationEndFunc = function (){//Do me after lids
					if(debug == true)console.debug(_that.CLASS_STRING, "flapMouth -> animationend"); 
					_that.isFlapWaitingForLids = false;
					if(_that.isTalking == false) return;
					if(_that.mouthFlappingAnimation == undefined) _that.mouthFlappingAnimation = 2;
					if(_that.getHead() && !hasLipSync )_that.getHead().gotoAndPlay(_that.mouthFlappingAnimation);					
					if(!hasLipSync)_eyeLayer.getChildByName(_that.eyeState).gotoAndPlay(( _eyesOnLidsSpriteSheet ) ? _that.eyeState : 2);
					else _eyeLayer.getChildByName(_that.eyeState).gotoAndStop(( _eyesOnLidsSpriteSheet ) ? _that.eyeState : 0);
					_that.tempEyeState = "";
					
				    var _mapped = _soundEffectsMediator.getActiveSoundFromMap(_that.controller.currentTalkiePlaying.name);
					if(_mapped) _mapped.isActive = true;
					_that.controller.currentTalkiePlaying.play();
					_that._lids.removeAllEventListeners("animationend");
				}
				
				if (this.isFlapWaitingForLids == true){//wait for lids
					this._lids.addEventListener("animationend", _animationEndFunc, this);	
				    var _mapped = _soundEffectsMediator.getActiveSoundFromMap(this.controller.currentTalkiePlaying.name);
					_mapped.isActive = false;
					this.controller.currentTalkiePlaying.paused = true;
				}
				else _animationEndFunc();//no wait!
			}			
		}
		
		//if player does not need to blink	
		if((_eyeStateUpdate == true && this.flapWaitsForLids == false) || _eyeStateUpdate === false || _eyeStateUpdate === undefined){
			if(debug == true)console.debug(this.CLASS_STRING, "flapMouth -> Inside the last if..with an eye update?", this.eyeState); 
			/** If there is no Lip Sync Data
			** then just play through the mouth frames.
			** Otherwise, don't play through the frames..
			** ..method 'handleAudioUpdates will handle the frames **/
			if(this.mouthFlappingAnimation == undefined) this.mouthFlappingAnimation = 2;
			if(this.getHead() && !hasLipSync )this.getHead().gotoAndPlay(this.mouthFlappingAnimation);
			if(_eyeStateUpdate !== undefined){
				if(!hasLipSync)_eyeLayer.getChildByName(this.eyeState).gotoAndPlay(( _eyesOnLidsSpriteSheet ) ? this.eyeState : 2);
				else _eyeLayer.getChildByName(this.eyeState).gotoAndStop(( _eyesOnLidsSpriteSheet ) ? this.eyeState : 0);
			}
			this.tempEyeState = "";
		}else console.warn(this.CLASS_STRING, "flapMouth -> made it elsewehere.."); 
		this.isMouthFlapping = true;
	}

	p.handleAudioUpdates = function(e) {
		if(!this.actorID) return;
		if(!this.controller.stage.canUpdate)return;
		if(!this.isTalking)return;	
	} // End of the function
				
	p.relativeOffseting = function(e){	
		if(!this.actorID) return;	
		if(!this.COSTUME) return;	
		if(e.target.spriteSheet._relativeOffsets.length < 1) return;	
		let kids = this.COSTUME.children;
		for (var i=0; i<=kids.length-1;i++) {
			if(kids[i] == e.target) continue;
			if(kids[i].spriteSheet && kids[i].spriteSheet._ignoresRelativeOffs === true) continue;
			let _offs = e.target.spriteSheet._relativeOffsets;
			let _curFrame = e.target.currentFrame;
			kids[i].x = _offs[_curFrame][0];
			kids[i].y = _offs[_curFrame][1];
		}//EOL   
	}; // End of the function
	
	p.changeColor = function(_color, _ccColor = undefined){	
		if(!this.actorID) return;
		if(!this.COSTUME) return;
		let kids = this.COSTUME.children;
		for (var i=0; i<=kids.length-1;i++) {
			let _defaultColor = (roomTemps && roomTemps._actorColors && roomTemps._actorColors[this.actorID]) ? roomTemps._actorColors[this.actorID].default : undefined;
			if((_color == "normal" || _color == "default" || _color == "none" || _color == _defaultColor) && kids[i].removeFilter){//Add a flag to check for a defualt color?
				kids[i].removeFilter();	
				if(_defaultColor) _color = _defaultColor
			}
			else if(kids[i].applyFilter) {
				kids[i].applyFilter(_color);
			}
		}
		if(roomTemps && roomTemps._actorColors && roomTemps._actorColors[this.actorID])
			roomTemps._actorColors[this.actorID].current = _color;
		this.color = _color;								   
		this.CCColor = (_ccColor != undefined) ? _ccColor : roomTemps._PCCColor[_color];	
	};
	
	p.removeColor = function(){	
		if(!this.actorID) return;
		if(!this.COSTUME) return;						   
		this.changeColor("default");	
	};
	
	/**key 's' is the function that'll be called
	* varirable 'a' is the local var stored to tell a frame script to be invoked once
	* key 'once' is the programer's key to make a frame script be invoked once**/
	p.doFrameScripts = function(e){
		if(this.FramesSignal.getNumListeners() > 0)this.FramesSignal.dispatch(e);	
		if(!this.frameScipts)return;
		if(this.COSTUME && !this.COSTUME.visible)return;
		//TODO: Debug this to see if looping on every frame causes issues on low powered machines
		for(i = 0; i < this.frameScipts.length; i++){	
			var _checkTarget = (this.frameScipts[i].checkTarget) ? this.frameScipts[i].checkTarget : e.currentTarget;
			//If frame to be check is a number
			if(!isNaN(this.frameScipts[i].f) && this.frameScipts[i].f === _checkTarget.currentFrame && this.frameScipts[i].s && !this.frameScipts[i].a){
				if(this.frameScipts[i].once == true) this.frameScipts[i].a = true;
				this.frameScipts[i].s();
				break;
			}
			//If frame to be check is a string
			if((typeof this.frameScipts[i].f === 'string' || this.frameScipts[i].f instanceof String)
					&& this.frameScipts[i].f === _checkTarget.currentAnimation  && this.frameScipts[i].s && !this.frameScipts[i].a){
				if(this.frameScipts[i].once == true) this.frameScipts[i].a = true;
				console.log("["+this.CLASS_NAME+"]doFrameScripts() -> Is AN ANIMATION FRAME!!");
				this.frameScipts[i].s();
				break;
			}
		}
	};
	
	p.doBlink = function(){
		if(!this.actorID)return false;
		if(this.isMouthFlapping == false && this._canBlink == true){
			this.isFlapWaitingForLids = true;
			if(this._lids.type == sjs.CostumeLayersNewVO.EYES_WITH_LID)
				this._lids.visible = true;
			//else 
			this._lids.gotoAndPlay( ( (this._lids.spriteSheet.getAnimation("lids") ) ? "lids" : 2) );
			return true;
		}
		this.isFlapWaitingForLids = false;
		return false;
	};
	
	p.lookAt = function(eyeState, _lockNewState = undefined){		
		if(!this.actorID)return false;//Check if Actor ID is set		
		if(!this._eyes)return undefined;//Check if layer exists		
		if(_lockNewState === false) this.lockEyeState = false;
		if(this.lockEyeState == true)return false;//Check if eyes can update		
		if(eyeState == "nothing")eyeState = "normal";
		
		var _eyeLayer = this._eyes;
		if(this._lids && this.eyeState == eyeState && this._lids != sjs.CostumeLayersNewVO.EYES_WITH_LID)return false;
		if(_eyeLayer instanceof createjs.Container){			
			/** If this.eyeState is not available **/
			if(!_eyeLayer.getChildByName(eyeState)) eyeState = this.normalEyeState.valueOf();
			
			if(this._lids && this.eyeState != eyeState)this.doBlink();
			/** If eyeState is not visible make it. **/
			if(_eyeLayer.getChildByName(eyeState).visible == false){
				this.hideAllEyes();// Hide all eyese before showing proper ones				
				_eyeLayer.getChildByName(eyeState).visible = true; // Show needed eye state
			}
			if(!this.isMouthFlapping)_eyeLayer.getChildByName(eyeState).gotoAndStop(eyeState);
			this.eyeState = eyeState;
			if(_lockNewState === true) this.lockEyeState = true;
			return true;
		}
		return false;
	};
	
	p.play = function(){
		if(!this.actorID)return false;
		if(!this.COSTUME)return false;
		let kids = this.COSTUME.children;
		for (var i = 0; i < kids.length; i++) {
			if(kids[i].type == sjs.CostumeLayersNewVO.EYES || kids[i].type == sjs.CostumeLayersNewVO.EYES_WITH_LID){
				kids[i].getChildAt(0).play();
			}else kids[i].play();
		}//end loop	
	};//eof
	
	p.gotoAndPlay = function(f){
		if(!this.actorID)return false;
		if(!this.COSTUME)return false;
		let kids = this.COSTUME.children;
		for (var i = 0; i < kids.length; i++) {
			if(kids[i].type == sjs.CostumeLayersNewVO.EYES || kids[i].type == sjs.CostumeLayersNewVO.EYES_WITH_LID){
				kids[i].getChildAt(0).gotoAndPlay(f);
			}else kids[i].gotoAndPlay(f);
		}//end loop	
	};
	p.gotoAndStop = function(f, _layersAr){
		if(!this.actorID)return false;
		if(!this.COSTUME)return false;
		let kids = this.COSTUME.children;
		for (var i = 0; i < kids.length; i++) {
			if(kids[i].type == sjs.CostumeLayersNewVO.EYES || kids[i].type == sjs.CostumeLayersNewVO.EYES_WITH_LID){
				kids[i].getChildAt(0).gotoAndStop(f);
			}else kids[i].gotoAndStop(f);
		}//end loop	
	};
	p.stop = function(f){
		if(!this.actorID)return false;
		if(!this.COSTUME)return false;
		let kids = this.COSTUME.children;
		for (var i = 0; i < kids.length; i++) {
			if(kids[i].type == sjs.CostumeLayersNewVO.EYES || kids[i].type == sjs.CostumeLayersNewVO.EYES_WITH_LID){
				kids[i].getChildAt(0).stop();
			}else kids[i].stop();
		}//end loop	
	};//eof
	p.getChildAt = function(_index){
		if(!this.actorID)return false;
		if(!this.COSTUME)return false;
		if(this.COSTUME.children);
			return this.COSTUME.getChildAt(_index);
	};//eof
	p.setFramerate = function(_framerate, _toOrginal = false){
		if(!this.actorID)return false;		
		if(this.COSTUME){
			for (const _child in this.COSTUME.children) {
				let _sprite = this.COSTUME.children[_child];
				if(_sprite.spriteSheet && _sprite.spriteSheet.framerate){
					if(!_sprite.spriteSheet.orginalFPS)
						_sprite.spriteSheet.orginalFPS = parseInt(_sprite.spriteSheet.framerate);
					if(_toOrginal == true)
						_framerate = parseInt(_sprite.spriteSheet.orginalFPS);
					_sprite.spriteSheet.framerate = _framerate;
					continue;
				}//End If
			}//End Loop
		}//End If
	};
	p.setOriginalFPS = function(){
		if(!this.actorID)return false;		
		if(this.COSTUME)
			this.setFramerate(undefined, true);
	};
	
	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "Actor{COST:" + this.COSTUME.name + ", actorID:" + this.actorID + ", isPlayer:" + this.isPlayer + "}";
	};
 
	
	// private methods:
	sjs.Actor = Actor;
	sjs.Actor.createDelegate = function(func, target) {
		//TODO: Remove and use sjs.createDelegate
		return function() { 
			return func.apply(target, arguments);
		};
	};
	
	// private vars:
	
}());
 
