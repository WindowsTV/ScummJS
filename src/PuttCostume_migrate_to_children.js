// namespace:
this.sjs = window.sjs || {}; 									
 
(function() {
	"use strict"; 
 
// constructor:
	/**
	 * PuttCostume is a class to create a "costume" type specifically for Putt-Putt.
	 * @class PuttCostume
	 * @param {CodeBlock} _controller is the manager of all Actors and their Costumes.
	 * @param {Number} _actorNumber is the actor's identifier number.
	 * @param {Boolean} isPlayer is set true or false to tell if this Costume belongs to the player.
	 * @constructor
	 */
	function PuttCostume(_controller, _actorNumber, isPlayer = false) {	
		// public properties:
		this.CLASS_NAME = "Actor";
		this.COSTUME = new createjs.Container();
		this.controller = _controller;

		//COSTUME VARS
		this.color = "purple";								   
		this.isIdle = false;
		
		/**_layers_ and _layers are being phased
		* out for DisplayObject.getChildAt() or 
		* DisplayObject.children[INDEX] in createjs**/
		this._layers_deprcateMsg = false;
		this._layers_ = undefined;
		Object.defineProperties(this, {
			_layers: { 

				get: function(value) { 
					if(this._layers_deprcateMsg == false){
						createjs.deprecate(undefined, "PuttCostume._layers")();
						this._layers_deprcateMsg = true;
					}
					if(this._layers_ == undefined) this._layers_ = new Object();
					return this._layers_; 
				},
				
				set: function(value) { 
					this._layers_ = value; 
				}}
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
				console.log("[test]set canBlink() -> _canBlink = " + value);
		  }
		});	
		this._interactsWithCursor = "";
		Object.defineProperty(this, 'interactsWithCursor', {
		  get() {
				return this._interactsWithCursor;
		  },
		  set(value) {
				if(!this.actorID) return;
				for(i = 0; i <=  this._layers._amount; i++){	
					console.log("[test]set interactsWithCursor() -> " + value);
					if(this._layers["_layer" + i] != undefined){
						this._layers["_layer" + i].interactsWithCursor = value;				
						continue;
					}
				}
				this._interactsWithCursor = value;
		  }
		});		
		this.eyeState = "normal";
		this.normalEyeState = "normal";
		this.tempEyeState = "";
		this.roomRef = _controller.roomReference;
		this.costInitFunc = null;//Only works when Actor was created...Ex. addEmptyActor was called before setting costInitFunc
		
		//EVENTS AND SIGNALS
		this.animationendFunc;		
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
								
		console.log("[CostumeTrunk]constructor() -> CostumeTrunk for Actor: " + this.actorID + " / Room Actors: " + (this.controller.actors));
		return this;
	}
	var p = PuttCostume.prototype; 
 
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
			console.warn("[CostumeTrunk]Actor: " + this.actorID + " is not in room...");
			return;
		}
		this.COSTUME.isCost = true;//Give an identifier to the Display Object it self
		
		if(this.isTalking == true && this.canSwitchWhileTalking == false)this.stopTalking();//Stop talking first!!
		this.TalkingCompleted.removeAll();	//Stop talking first!!
		if(typeof costumeObject === 'string' || costumeObject instanceof String){// Get the sprite as the costume
			if(debug == true)console.log("[CostumeTrunk]STRING WAS PASED THROUGH as costumeObject");
			costumeObject = [COSTUMES_DIRECTORY[roomTemps.currentRoomID][costumeObject], costumeObject];
			if(costumeObject[0] === undefined){
				if(debug == true)console.warn("[CostumeTrunk]Dumb warning..This Costume is not in the current room");
				costumeObject[0] = this.controller.getCostume(costumeObject[1]);//Maybe set back to return if slowler machines strugle??
				//return;
			}
		}		
		if(this.COSTUME.name === costumeObject[1]){//Check if a Costume change  is needed
			console.debug("[CostumeTrunk]Actor: " + this.actorID + " is already wearing: " + this.COSTUME.name);
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
		this._layers = new Object();//Will be removed
		this._layers._amount = 1;
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
		this._layers._layer1 =_sprite;//Quick patch while _layers is being removed..
		this.COSTUME.addChild(_sprite);
		_sprite.visible = true;

		this.animationendFunc = _sprite.on("animationend", function (e){
			e.target.off("animationend", this.animationendFunc);
			this.animationendFunc = null;
			//if(!_actor.isIdle){ 
			if(_actor.isIdle === false){ 
				//_sprite.visible = false;//Possible fix for one second black-out, see stage.cache() in Engine
				if(_sprite.currentAnimation !== null)//Possible fix for one second black-out, see stage.cache() in Engine
					_sprite.gotoAndStop(e.target.currentFrame);
				else
					_sprite.gotoAndStop(e.next);
				this.AnimationFinishedSignal.dispatch(this.actorID);
			}
		}, this, true);		
			
		console.log("[CostumeTrunk]Actor: " + this.actorID + " goto frame: " +  frameInit);
		_sprite.gotoAndPlay(frameInit);
		
		if(this.color == "purple" || this.color == "normal")_sprite.removeFilter();	
		else _sprite.applyFilter(this.color);//apply the filter	
		
		return this.COSTUME;		
		
	};
		
	//Consider removing _layers and using getChildAt();
	p.setLayeredCostume = function(_index, costumeObject, options = {"play": 0}){
		//TODO: Change _layer# refs to getChildAt or DisplayObject.children[#]
		console.debug("[CostumeTrunk]Setup a layered costume...");
		let _actor = this.controller.actors[this.actorID];
		
		//START OF NEW CODE TO USE CONTAINER CHILDREN
		let _layers = this._layers = new sjs.CostumeLayersNewVO(costumeObject)._layers;
		_layers._amount = _layers._length;//Patch as we migrate from _layers 
		_layers._layer1.onAddedListener = _layers._layer1.on("added", this.costInit, this, true);//Allows for FrameScripts
		//END OF NEW CODE		
		
		for(i = 1; i <= this._layers._length; i++){	//Loop through the layers and start attatching to COSTUME
			let _currentLayer = this._layers["_layer" + i];
			let _currentLayerType = _currentLayer.type;
			
			//If the layer is not the EYES layer:
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
						if(this.isPuttPutt == true)this._body.gotoAndPlay(0);
						break;
					default:
						console.warn("[CostumeTrunk]Unkown layer type was passed through");
				}
				//Set the original FPS and make it read-only
				if(typeof(_currentLayer.spriteSheet) != 'undefined' && !_currentLayer.spriteSheet.orginalFPS){
					Object.defineProperty(_currentLayer.spriteSheet, "orginalFPS", {
						value: parseInt(_currentLayer.spriteSheet.framerate),
						writable: false
					});					
				}
				let _ogFPS = (_currentLayer.spriteSheet) ? _currentLayer.spriteSheet.orginalFPS : _FPS; 
				//sjs.Test.setAnimationSpeed(_currentLayer, ((fastMode == true) ? _fastFPS : _ogFPS ));//Enables Fast Mode
				
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
		
		if(typeof options.stop !== 'undefined' && _layers._layer1.type != sjs.CostumeLayersNewVO.HEAD){			
			_layers._layer1.gotoAndPlay(options.stop);
		}else if(_layers._layer1.type != sjs.CostumeLayersNewVO.HEAD) _layers._layer1.gotoAndPlay(options.play);	
		
		this.animationendFunc = _layers._layer1.on("animationend", function (e){
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
	p.getHead = function(_layer){
		return this._head;
	};
	p.addEyes = function(_layer){
		var _loc1 = new createjs.Container();
		for(var i = 0; i < _layer.length; i++){	
			var _loc2 = _loc1.addChild(_layer[i].sprite);
			_loc2.visible = false;
			_loc2.name = _layer[i].eyeState;
		}		
		this._eyes = _loc1;
		this._eyes.getChildAt(0).visible = true;
		this._eyes.getChildAt(0).gotoAndStop(0);
		this._eyes.type = sjs.CostumeLayersNewVO.EYES;
		this.COSTUME.addChild(this._eyes);
	};
	p.addLayer = function(sprite, frameData = {}, layerNumber){
		if(!sprite){
			console.warn("[CostumeTrunk] NO SPRITE WAS GIVEN for method 'addLayer'. Stoping method..");
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
		var _returnLayer;
		//console.log("FIND LAYER WITH TYPE: " + type);
		for(var i = 1; i <= this._layers._amount; i++){	
			if(this._layers["_layer" + i].type == type){
				_returnLayer = this._layers["_layer" + i];
				break;
			}
		}
		return _returnLayer;
	};
	p.handleAnimationDone = function(){
		console.debug("[CostumeTrunk]handleAnimationDone() -> Animation finished on " + this.actorID);		
	};

	p.costInit = function(e){
		console.debug("[CostumeTrunk]costInit() -> Costume initiation on actor:", this.actorID,  e.currentTarget.spriteSheet._relativeOffsets);
		this.scopeIssue = e.currentTarget;
		if(this.isIdle == true){
			console.debug("[CostumeTrunk]costInit() -> Make the Actor a VERB!!");
			this.controller.stage.setupClickPoint(this.COSTUME, sjs.PuttCostume.createDelegate(this.handleActorClicked, this), true, false);
		}//end
		if(this.isPuttPutt){
			console.debug("[CostumeTrunk]costInit() -> Hi, I'm Putt-Putt!");
			if(e.currentTarget.spriteSheet._relativeOffsets.length >= 1)//Testing relOffs
				e.currentTarget.on("tick", this.relativeOffseting, this);
			else
				e.currentTarget.on("tick", this.movePuttsHead, this);//Remove this..
		}//end
		if(this.costInitFunc?.constructor !== undefined){//Only works when Actor was already created...Ex. addEmptyActor was called before setting costInitFunc
			this.costInitFunc(e);
			this.costInitFunc = null;
		}//end
		e.currentTarget.on("tick", this.updateCostumeColor, this);
		e.currentTarget.on("change", this.doFrameScripts, this);
		e.currentTarget.on("tick", this.handleAudioUpdates, this);
		//let _event = new createjs.Event("added");
		//this.COSTUME.dispatchEvent("added");;
		if(e.target !== undefined && e.target.hasEventListener("added"))
			e.target.off("added", e.target.onAddedListener);
	};
	p.lidsInitFramesScriptVer = function(e){
		if(this._lids){
			console.debug("[CostumeTrunk]costInit() -> ADD BLINK RANDOM SCRIPTS");
			var that = this;
			this.frameScipts = [{f:0,s:function (){
				if(getRandomInt(0, 80) == 25){
					that.doBlink();
					//console.log("BLINK SCRIPT");
				}else that._lids.gotoAndStop(0);
			}, checkTarget:this._lids},
			{f:"lids_end",s:function (){
				that._lids.visible = false;
				that._lids.gotoAndStop(0);
			}, checkTarget:this._lids}];				
		}
	};
	p.lidsInit = function(e){
		if(this._lids){
			//console.debug("[CostumeTrunk]lidsInit() -> DO BLINK SCRIPT");
			const _lidsAsTarget = e.target;
			const _currentFrame = _lidsAsTarget.currentFrame;
			const _currentAnimation = _lidsAsTarget.currentAnimation;
			if(_currentFrame == 0){
				if(getRandomInt(0, 80) == 25){
					this.doBlink();
					if (debug == true) console.log("BLINK..");
				}else _lidsAsTarget.gotoAndStop(0);
			};
			if(_lidsAsTarget.spriteSheet.getAnimation("lids_end") && _currentAnimation == "lids_end"){
				_lidsAsTarget.visible = false;
				_lidsAsTarget.gotoAndStop(0);
			};
		}
	};
		
	p.handleActorClicked = function(){	
		if(this.isPuttPutt == true){
			_mm_can_skip = false;
			this.talk(ROOM_PLAYER_AUDIO[getRandomInt(0, (ROOM_PLAYER_AUDIO.length - 1))], null, "player", false);
			this.stopClickedTalkingDelegate = sjs.PuttCostume.createDelegate(this.stopTalking, this, true);
			SignalsObject.EscapeSignal.addOnce(this.stopClickedTalkingDelegate);
			if(this.ActorClicked.getNumListeners() > 0)
				this.ActorClicked.dispatch(this.actorID)
		}else this.ActorClicked.dispatch(this.actorID);
	}
	
	p.talk = function(whichTalkie, talkieCompletedCallback, _eyeState, ignoresStopFlag = false, tag){	
		//if(!this.actorID) throw '[CostumeTrunk]This Actor is not here?? What should I do?';
		_mm_can_skip = false;
		console.debug("[CostumeTrunk]talk() -> actorID: " + this.actorID + " IS ABOUT TO TALK: " + whichTalkie + " / ignoresStopFlag: " + ignoresStopFlag);	
		if(whichTalkie.lookAt){
			this.tempEyeState = whichTalkie.lookAt;
			whichTalkie = whichTalkie.audio;
		}else this.tempEyeState = (_eyeState == undefined) ? "normal" : _eyeState;
		
		if(!ignoresStopFlag){//Allows for talking overrides
			if(this.controller.currentActorTalking == this.actorID){
				//if it's the same actor talking just prep them for the new audio
				this.stopTalkieAudio();
				this.isTalkingFromArray = false; 
				this.isTalking = false; 
				console.debug("[CostumeTrunk]talk() -> actorID: " + this.actorID + " IS TALKING AGAIN!");	
				if(SignalsObject.EscapeSignal.has(this.stopClickedTalkingDelegate)) SignalsObject.EscapeSignal.remove(this.stopClickedTalkingDelegate);
				/*if(this.TalkingCompleted.getNumListeners() >= 1)
					this.TalkingCompleted.dispatch(this.actorID);*/
			}else{
				//If it's a new actor talking stop everyone from talking
				if(debug == true) console.debug("[CostumeTrunk]talk() -> Stop current actor talking to start new convo...");
				this.controller.stopAllTalking();
			}
			this.currentTalkingArray = null;
		}
		
		if(Array.isArray(whichTalkie)){
			this.talkieArrayIndex = 0;
			this.talkArray(whichTalkie, tag);
			return;
		}
		if(whichTalkie.wait){//This will add a wait in between Talkie Arrarys
			//Example: ActorController.actors[1].talk(["PUTTPUTT.013", {wait:1000}, "PUTTPUTT.0014"]);
			console.log("[CostumeTrunk]talk() .wait !!!");
			updateClosedCaptions(false);//Hide last talkie captions
			this.lastTalkie = whichTalkie;//Update the last talkie
			this._talkieCompletedCallback = talkieCompletedCallback;//set the talkie callbak since it won't get set in playTalkieAudio
			this.stopFlappingMouth("talk(wait!!)", false);//Stop flapping the mouth but keep last eye state
			if(this._eyes)this._eyes.getChildByName(this.eyeState || this.tempEyeState).gotoAndStop(0);
			
			this._waitDelegate = new JiffyWait(sjs.PuttCostume.createDelegate(this.checkIfWaitIsStillActive, this), whichTalkie.wait);//Do after the time has elapsed
			sjs.ActorController.currentActorInTalkWait = this.actorID;//Set the current Actor in waiting..
			this._talkWaitActive = true;//Now set them as activly waiting.
			console.log(this._waitDelegate);
		}
		this.lipSyncDataIndex = 0;
		if(this.isTalkingFromArray == true && !whichTalkie.wait)this.playTalkieAudio(whichTalkie, talkieCompletedCallback, tag);
		if(this.isTalking == false && !whichTalkie.wait)this.playTalkieAudio(whichTalkie, talkieCompletedCallback, tag);
		this.controller.currentActorTalking = this.actorID;
		sjs.ActorController.currentTalking = this.actorID;
		if(!whichTalkie.wait)this.flapMouth((lipSyncData[this.controller.currentTalkiePlaying.name]) ? true : false);	
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
			var instance = playTalkieSnd(registerSound(whichTalkie), sjs.PuttCostume.createDelegate(this.handleAudioComplete, this), tag);//make sure to make a seperate function for playing talkies	
			 if (instance == false || !instance || !instance.sfx) {
				if(debug == true)console.warn("[CostumeTrunk]playTalkieAudio()-> PLAY FAILED!");
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
		console.error("[CostumeTrunk]playTalkieAudio() MADE IT TO THE END OF FUNCTION...WHAT HAPPENED?!?! / whichTalkie: " + whichTalkie);
		this.isTalkingFromArray = false;
		this.currentTalkingArray = null;
		this.handleAudioComplete();
		return false;
	} // End of the function
	
	p.handleTextComplete = function(event) {
		if (multiTextCCObj.hasOwnProperty('_multiPartText') && (multiTextCCObj._multiPartText.length > 1 && multiTextCCObj._multiPartIndex >= 0)){
			return;
		}
		if(debug == true)console.log("[CostumeTrunk] Text is hidden..continue playing talkies...");
		if(this.talkieLoadError)SignalsObject.CCTimeout.remove(this.handleTextComplete, this);
		if(this._talkieCompletedCallback) this._talkieCompletedCallback();
		this.handleAudioComplete();
	}	
	
	p.handleAudioComplete = function(event) {
		if(debug == true) console.debug("[CostumeTrunk] Actor: " + this.actorID + " IS DONE TALKING!!!!");		
		
		if(this.talkieLoadError == false) updateClosedCaptions(false);
		if(this.isTalkingFromArray){
			if((this.talkieArrayIndex + 1) == this.currentTalkingArray.length){
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
		if(debug == true) console.debug("[CostumeTrunk] handleAudioComplete() -> DISPATCH TALKING COMPLETED! ");
		this.TalkingCompleted.dispatch(this.actorID);
		if(this._talkieCompletedCallback) this._talkieCompletedCallback();
		this._talkWaitActive = false;
		if(SignalsObject.EscapeSignal.has(this.stopClickedTalkingDelegate))
			SignalsObject.EscapeSignal.remove(this.stopClickedTalkingDelegate);
		_mm_can_skip = true;
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
		if(this._eyes instanceof createjs.Container)this._eyes.getChildByName(this.eyeState).gotoAndStop(0);//12/9/21
		if(this._eyes instanceof createjs.Container && this._eyes.children.length >= 1 && updateEyes == true){
			if(this._eyes.getChildByName(this.eyeState))this._eyes.getChildByName(this.eyeState).visible = false;
			this._eyes.getChildByName(this.normalEyeState).visible = true;
			this._eyes.getChildByName(this.normalEyeState).gotoAndStop(0);
			this.eyeState = this.normalEyeState.valueOf();
		}
		this.isMouthFlapping = false;
	}
 
	p.flapMouth = function(hasLipSync = false){	
		if(debug == true) console.debug("[CostumeTrunk] flapMouth(_eyeState: " + this.eyeState + ")");
		var _eyeLayer = this._eyes;		
		if(this._lids)this._lids.removeAllEventListeners("animationend");		
		let _eyeStateUpdate = this.lookAt(this.tempEyeState);
		if(debug == true)console.debug("[CostumeTrunk] flapMouth -> _eyeStateUpdate: " + _eyeStateUpdate); 
	
		//if player needs to blink check if audio should start after blink
		if (_eyeStateUpdate == true) {
			var _that = this;			
			if(this.flapWaitsForLids == true){
				if(debug == true)console.debug("[CostumeTrunk] flapMouth -> isFlapWaitingForLids: " + this.isFlapWaitingForLids); 
				var _animationEndFunc = function (){//Do me after lids
					if(debug == true)console.debug("[CostumeTrunk] flapMouth -> animationend"); 
					_that.isFlapWaitingForLids = false;
					if(_that.isTalking == false) return;
					if(_that.mouthFlappingAnimation == undefined) _that.mouthFlappingAnimation = 2;
					if(_that.getHead() && !hasLipSync )_that.getHead().gotoAndPlay(_that.mouthFlappingAnimation);					
					if(!hasLipSync)_eyeLayer.getChildByName(_that.eyeState).gotoAndPlay(2);
					else _eyeLayer.getChildByName(_that.eyeState).gotoAndStop(0);
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
			if(debug == true)console.debug("[CostumeTrunk] flapMouth -> Inside the last if.."); 
			/** If there is no Lip Sync Data
			** then just play through the mouth frames.
			** Otherwise, don't play through the frames..
			** ..method 'handleAudioUpdates will handle the frames **/
			if(this.mouthFlappingAnimation == undefined) this.mouthFlappingAnimation = 2;
			if(this.getHead() && !hasLipSync )this.getHead().gotoAndPlay(this.mouthFlappingAnimation);
			if(_eyeStateUpdate !== undefined){
				if(!hasLipSync)_eyeLayer.getChildByName(this.eyeState).gotoAndPlay(2);
				else _eyeLayer.getChildByName(this.eyeState).gotoAndStop(0);
			}
			this.tempEyeState = "";
		}else console.warn("[CostumeTrunk] flapMouth -> made it elsewehere.."); 
		this.isMouthFlapping = true;
	}

	p.handleAudioUpdates = function(e) {
		if(!this.actorID) return;
		if(!this.controller.stage.canUpdate)return;	
	} // End of the function
		
	p.movePuttsHead = function(evt){	
		if(!this.actorID) return;
		if(this.isIdle == false){console.debug("[CostumeTrunk]movePuttsHead() -> Don't do head updates if is not idle.."); evt.remove(); return;}
		if(!this._body){console.warn("[CostumeTrunk]movePuttsHead() -> BODY LAYER IS MISSING! No body to get frame data from..");return;}
		if(!this._head){console.warn("[CostumeTrunk]movePuttsHead() -> HEAD LAYER IS MISSING!");return;}
		var _yPos = this._body.currentFrame;
		if(this._head)this._head.y = _yPos;//Head
		if(this._eyes)this._eyes.y = _yPos;//Dynamic Eyes
		if(this._lids)this._lids.y = _yPos;//Eye Lids
   
	};
		
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
	
	p.updateCostumeColor = function(evt){	
		if(!this.actorID) return;
	};
	
	/**key 's' is the function that'll be called
	* varirable 'a' is the local var stored to tell a frame script to be invoked once
	* key 'once' is the programer's key to make a frame script be invoked once**/
	p.doFrameScripts = function(e){
		if(this.FramesSignal.getNumListeners() > 0)this.FramesSignal.dispatch(e);	
		if(!this.frameScipts)return;
		//if(!this.isIdle)console.log("[CostumeTrunk]doFrameScripts() -> currentTarget: " + e.currentTarget.name +" is on FRAME: " + e.currentTarget.currentFrame);
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
				console.log("[CostumeTrunk]doFrameScripts() -> Is AN ANIMATION FRAME!!");
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
			else 
				this._lids.gotoAndPlay( ( (this._lids.spriteSheet.getAnimation("lids") ) ? "lids" : 2) );
			return true;
		}
		this.isFlapWaitingForLids = false;
		return false;
	};
	
	p.lookAt = function(eyeState){		
		if(!this.actorID)return false;//Check if Actor ID is set		
		if(!this._eyes)return undefined;//Check if layer exists		
		if(eyeState == "nothing")eyeState = "normal";
		
		var _eyeLayer = this._eyes;
		if(this._lids && this.eyeState == eyeState)return false;
		if(_eyeLayer instanceof createjs.Container){			
			/** If this.eyeState is not available **/
			if(!_eyeLayer.getChildByName(eyeState)) eyeState = this.normalEyeState.valueOf();
			
			if(this._lids && this.eyeState != eyeState)this.doBlink();
			/** If eyeState is not visible make it. **/
			if(_eyeLayer.getChildByName(eyeState).visible == false){
				this.hideAllEyes();// Hide all eyese before showing proper ones				
				_eyeLayer.getChildByName(eyeState).visible = true; // Show needed eye state
			}
			if(!this.isMouthFlapping)_eyeLayer.getChildByName(eyeState).gotoAndStop(0);
			this.eyeState = eyeState;
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
	p.setOriginalFPS = function(){
		if(!this.actorID)return false;
		console.log("[CostumeTrunk][setOriginalFPS]_layers: "+ this._layers._amount);
		var _loc1 = 0;
		var _loc2 = this._layers._amount;
		var _loc3 = this._layers;
		for(i = 0; i <= _loc2; i++){	
			if(!this._layers["_layer" + i]){
				continue;
			}
			if(this._layers["_layer" + i] != undefined){
				this._layers["_layer" + i].spriteSheet.framerate = parseInt(this._layers["_layer" + i].spriteSheet.orginalFPS);
				continue;
			}
		}
		return true;
	};
	
	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "PuttCostume{name:" + this.COSTUME.name + ", actorID:" + this.actorID + ", isPlayer:" + this.isPuttPutt + ", isPuttPutt:" + this.isPuttPutt + "}";
	};
 
	
	// private methods:
	sjs.PuttCostume = PuttCostume;
	sjs.PuttCostume.createDelegate = function(func, target) {
		return function() { 
			return func.apply(target, arguments);
		};
	};
	
}());
 
