window.sjs = window.sjs || {};
window.sjs.SoundManager = class SoundManager{
	constructor(target) {
		// target is the child where the sound layer will be added to
		// ...

		// Use "this" to set class variables
		console.log("SoundManager was loaded in!");
		this.globalMasterVolume = 1; //0.0 -> 1.0 .. 0 low and 1 loud
        this._layersMap = new Object();
        this._target = target;
        this._nextSoundId = 0;
        this._nextSymbolId = 0;
        this._nextLayerId = 0;
        this._nextDelayedSoundId = 0;
        this._nextLoopId = 0;
        this.init();
		
	}	
	init(){
        this._defaultLayer = this.addLayer("default", -1);
        this._talkiesLayer = this.addLayer("talkies", -1);
        this._musicLayer = this.addLayer("music", 1);
        this._roomLayer = this.addLayer("room", 9000);
        this._activeSoundsMap = new Object();
        this._registeredSymbolNamesMap = new Object();
        this._soundLoopsMap = new Object();
        this._delayedSoundsMap = new Object();
        this._layerNameMap = new Object();
        this._nextSoundId = 0;
        this._nextSymbolId = 0;
        this._nextLayerId = 0;
        this._nextDelayedSoundId = 0;
        this._nextLoopId = 0;
		//console.debug("_sfxHolder made!" + this._sfxHolder);
    } // End of the function
		
    destroy(){
        for (var _loc5 in this._activeSoundsMap){
			var _loc2 = this._activeSoundsMap[_loc5];
			if (createjs.Sound.isReady()) {
				_loc2.sfx.stop();//TODO: Change all SFX reff to audio
				_loc2.isActive = false;
				var _loc4 = this.getLayer(_loc2.layerId);
				_loc4.numSoundsPlaying = 0;
			}//end if			
        } // end of for...in
        this._sfxHolder = null;
       // this._layersMap = new Object();
        this._activeSoundsMap = new Object();
        this._registeredSymbolNamesMap = new Object();
        this._soundLoopsMap = new Object();
        this._delayedSoundsMap = new Object();
        this._layerNameMap = new Object();
        this._nextSoundId = 0;
        this._nextSymbolId = 0;
        this._nextLayerId = 0;
        this._nextDelayedSoundId = 0;
        this._nextLoopId = 0;
		console.debug("_sfxHolder DESTROYED!!!");
    } // End of the function
	
    stopAllSoundsButMusic(){
		var _musicSoundMapID;
		for (var _loc5 in this._activeSoundsMap){
			var _loc2 = this._activeSoundsMap[_loc5];
			if (createjs.Sound.isReady()) {
				if(_loc2.layerName !== "music"){
					_loc2.sfx.stop();//TODO: Change all SFX reff to audio
					_loc2.isActive = false;
					var _loc4 = this.getLayer(_loc2.layerId);
					_loc4.numSoundsPlaying = 0;
				}
				if(_loc2.layerName === "music"){
					//console.log(_loc2);
				}
			}//end if			
		} // end of for...in
		
		this._registeredSymbolNamesMap = new Object();	
    } // End of the function
	
    registerSymbolName(symbolName){
		++this._nextSymbolId;
		for (var _loc3 in this._registeredSymbolNamesMap) {
			if (this._registeredSymbolNamesMap[_loc3] == symbolName){
				var _id = this.getRegisteredSymbolId(symbolName);
				this._registeredSymbolNamesMap[_id] = symbolName;
				return (_id);
			} // end if
		}	
        this._registeredSymbolNamesMap[this._nextSymbolId] = symbolName;
        return (this._nextSymbolId);
    } // End of the function
	
    getRegisteredSymbolId(symbolName) {
		for (var _loc3 in this._registeredSymbolNamesMap) {
			if (this._registeredSymbolNamesMap[_loc3] == symbolName){
                return (Number(_loc3));
            } // end if
        } // end of for...in
        return (null);
    } // End of the function
	
    addLayer(layerName, maxConcurrent)
    {
        var _loc2 = this.getLayerId(layerName);
        if (this.getLayer(_loc2) == null)
        {
            this._layersMap[_loc2] = new sjs.SoundLayer(_loc2, layerName, maxConcurrent);			
        } // end if
        return (this._layersMap[_loc2]);
    } // End of the function
	
    removeLayer(layerId)
    {
        var _loc2 = _this.layersMap[layerId];
        if (_loc2 != null)
        {
            delete this._layerNameMap[_loc2.name];
            delete this._layersMap[layerId];
        } // end if
    } // End of the function
	
    getLayer(layerId)
    {
        return (this._layersMap[layerId]);
    } // End of the function
	
    getLayerId(layerName = undefined)
    {
        if (layerName == undefined) return "No Layer Name Given..";
        if (this._layersMap == undefined){
			this._layersMap = new Object();
		}
		
        if (this._layersMap[layerName] != null){
            return (this._layersMap[layerName]);
        }
		
		this._layersMap[layerName] = ++this._nextLayerId;
		return (this._layersMap[layerName]);
    } // End of the function
    getSoundId(fromLayerByName, _layer)
    {
        ++this._nextSoundId;
		for (var _loc3 in this._activeSoundsMap) {
			if(_layer.canPlaySound()){
				return (this._nextSoundId);
			}else{
				if (this._activeSoundsMap[_loc3].layerName == fromLayerByName){
					return (this._activeSoundsMap[_loc3].soundId);
				} // end if
			}
		}//end loop		
        return (this._nextSoundId);
    } // End of the function
	
    getActiveSoundFromMap(soundNameOrID){
		var _map = this._activeSoundsMap;
        for (var _loc1 in _map){
			if(_map[_loc1].sfx.name == soundNameOrID){
				return _map[_loc1];
			}
		}
		
    } // End of the function
	
	//playSound(id, soundDoneFunction, delay, loop, volume) {
    playSound(symbolId, layerName, volume, delay, loop, tag, callback)
    {
		//console.debug("playSound(symbolId: "+symbolId+", layerName: "+layerName+", volume: "+volume+", tag: "+tag+", callback: "+callback+")");
		this.checkForNoLongerActiveSounds();
		if (!createjs.Sound.isReady()) {
			console.warn("SOUNDJS IS NOT READY!!");
			return (-2);
		}		
        if (!volume){
            volume = 1;
        } // end if
		
        var _loc5 = this.getLayerId(layerName);
        var _loc4 = this.getLayer(_loc5);
        if (_loc4 == null){
            _loc4 = this._defaultLayer;
        } // end if
        if (_loc4.canPlaySound()){
            var _loc7 = this._registeredSymbolNamesMap[symbolId];
            if (!_loc7)  {
				console.warn("_loc7 = " + _loc7);
                return (-1);
            } // end if		
			console.log("[SoundManager]sound to play: " + _loc7);			
            var _loc3 = createjs.Sound.createInstance(_loc7);
			//_loc3.name = "aud_" + symbolId;	// Use _loc7 instead 		
			_loc3.name = _loc7;	// Using _loc7 instead 		
			console.log("[SoundManager]created instance: " + _loc3);

            if (_loc3)
            {
                var _loc2 = new Object();
                var _loc6 = this.getSoundId(layerName, _loc4);
                _loc2.soundId = _loc6;
                _loc2.tag = tag;
                _loc2.sfx = _loc3;//TODO: Change all SFX reff to audio
                _loc2.layer = _loc4;
                _loc2.layerName = layerName;
                _loc2.layerId = _loc5;
                _loc2.isActive = true;
                _loc2.callback = callback;
                _loc2.symbolId = symbolId;
                this._activeSoundsMap[_loc6] = _loc2;
                ++_loc4.numSoundsPlaying;
				
				//Play the sound: play (src, interrupt, delay, offset, loop, volume, pan)
				//createjs.Sound.play(_loc3, {delay:delay, loop:loop, volume:volume});
				var props = new createjs.PlayPropsConfig().set({volume:volume, delay:delay, loop:loop})
				if(this._target.canUpdate)_loc3.play(props);
				if (_loc3 == null || _loc3.playState == null || _loc3.playState == createjs.Sound.PLAY_FAILED) {
					console.error("[SoundManager] playSound()-> PLAY_FAILED due to playState");
					_loc2.isActive = false;
					_loc4.numSoundsPlaying -= 1;
					if(callback && layerName != "talkies") callback(_loc3);
					return false;
				}//end if		
				if(_loc3._playbackResource == undefined && layerName != "talkies"){
					console.error("[SoundManager] playSound()-> PLAY_FAILED due to _playbackResource");
					_loc2.isActive = false;
					var _loc4 = this.getLayer(_loc2.layerId);
					_loc4.numSoundsPlaying -= 1;
					if(callback && layerName != "talkies") callback(_loc3);
					return false;
				}	
				
				_loc3.addEventListener("complete", function () {
					_loc3.removeAllEventListeners();
					_loc2.isActive = false;
					_loc4.numSoundsPlaying -= 1;
					if(callback) callback(_loc3);
					//console.log("SOUND: " + _loc2.soundId +" ENEDED!");
				});//end of the function				
				
                return (_loc2);
            } // end if
        } // end if
        return (-1);
    } // End of the function
		
	//Prone to issues..
	checkForNoLongerActiveSounds(){
		 if(debug == true) console.debug("WARNING! This may cause issues..");
        for (var _loc1 in this._activeSoundsMap){
			var _loc2 = this._activeSoundsMap[_loc1];
			if(_loc2.isActive == false){
				//console.log("checkForNoLongerActiveSounds -> Sound: " +  _loc2.sfx.name);
				delete this._activeSoundsMap[_loc1]; 
			}//end of if
        } // end of for...in		
	} // End of the function
	
	pauseSoundEffects(){//TODO: change to pauseAllAudio
		//console.log("pauseSoundEffects()!!!");
        for (var _loc5 in this._activeSoundsMap){
			//console.log(this._activeSoundsMap[_loc5]);
			var _loc2 = this._activeSoundsMap[_loc5].sfx;//TODO: Change all SFX reff to audio
			_loc2.paused = true;
			//_loc2.paused ? _loc2.paused = false : _loc2.paused = true;
        } // end of for...in		
    } // End of the function
	
	unPauseSoundEffects(){//TODO: change to unPauseAllAudio
        for (var _loc5 in this._activeSoundsMap){
			var _loc2 = this._activeSoundsMap[_loc5];
			if(_loc2.isActive == true){
				//console.log("resume Sound: " +  _loc2.sfx.name);
				_loc2.sfx.play();//TODO: Change all SFX reff to audio
			}
        } // end of for...in		
    } // End of the function
	
    stopSoundsOnLayerByName(layerName, doEvents = true, doDelete = true){
		for (var _loc6 in this._activeSoundsMap){
			var _loc2 = this._activeSoundsMap[_loc6];
			if (_loc2.layerName == layerName){
				console.debug("[SoundManager]FOUND layer: " + layerName);
				console.debug("[SoundManager]stopSoundsOnLayerByName() -> _loc2.layer: " + _loc2.layer);
				_loc2.sfx.stop();//TODO: Change all SFX reff to audio
				_loc2.isActive = false;
				if(doEvents == true) _loc2.sfx.dispatchEvent("complete");
				if(doDelete == true) delete this._activeSoundsMap[_loc2.soundId];
			} // end if
		} // end of for...in
	} // End of the function	
	
    stopSoundsForTag(tag, doEvents = true, doDelete = true){
		for (var _loc6 in this._activeSoundsMap){
			var _loc2 = this._activeSoundsMap[_loc6];
			if (_loc2.tag == tag){
				//console.debug("FOUND TAG: " + tag);
				_loc2.sfx.stop();//TODO: Change all SFX reff to audio
				_loc2.isActive = false;
				if(doEvents == true)_loc2.sfx.dispatchEvent("complete");
				if(doDelete == true) delete this._activeSoundsMap[_loc2.soundId];
			} // end if
		} // end of for...in
	} // End of the function	
}


