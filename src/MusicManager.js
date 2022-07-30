function initMusic() {
	if (musicWasNotLoaded === false) {
		console.warn("initMusic() -> MUSIC WAS LOADED ALREADY!!");
		return;
	}	
	if (!createjs.Sound.initializeDefaultPlugins()) {
		console.warn("initMusic() -> !initializeDefaultPlugins");
		return;
	}	
	LOADERS.audio.music_loaded = true;
	musicWasNotLoaded = false;
	assignMusicPads();
}
var musicWasNotLoaded = true;//Set this if Audio is enabled and music is loaded 
var isMusicMuted = false; //When the user turns off the music

var currentSongPlaying = -1;//The current song playing by ID
var musicInstance;// The actual audio instance of the Music
var positionInterval;
var seeking = false;
var musicIsPlaying = false;// Bool for a song if one is playing
var globalMusicVolume = 1; //0.0 -> 1.0 .. 0 low and 1 loud
var isPlayingFromPad = false;// Room's use "Pads" which is an array of songs the MusicManager can pick from

function shuffle(array) {
	return array.sort(() => Math.random() - 0.5);
}		
function shufflePads() {	
	if(debug == true) console.log("musicWasNotLoaded " + (musicWasNotLoaded == false) ? " was set, music will shuffle!" : " is still TRUE, did the music load??");
	if (musicWasNotLoaded === true)return;
	
	for(i = 0; i < PADS_TO_SHUFFLE.length; i++){		
		if(PADS_TO_SHUFFLE[i]){
			PADS_TO_SHUFFLE[i] = shuffle(PADS_TO_SHUFFLE[i]);
		}
	}//End of Loop
}	

function startNextSongInPad() {
	if(musicInstance){
		musicInstance.sfx.stop();//CHANGE SFX TO INSTANCE or AUDIO
		musicInstance.callback();
	}
}

function stopSong(id) {
	if(debug == true) console.debug("[music]stop Song!");
	musicIsPlaying = false;
	if(!id && (musicInstance && musicInstance.stop)) musicInstance.stop();
	
	if(!id && (musicInstance && musicInstance.sfx.stop)) 
		musicInstance.sfx.stop();	
	else 
		stopSound(id);
	
	if(_soundMediator && musicInstance){
		var _loc1 = _soundMediator.getLayer(musicInstance.layerId);
		_loc1.numSoundsPlaying = 0;
	}
	
	musicInstance = null;
	currentSongPlaying = -1;
	_soundMediator.stopSoundsOnLayerByName("music", false);
}

function pauseMusic(){//TODO: Change all SFX reff to audio
	if(debug == true) console.debug("[music]PAUSE Song!");
	var _loc1 = (musicInstance.sfx) ? musicInstance.sfx  : musicInstance;
	_loc1.paused = true;
}

function resumeMusic(){//TODO: Change all SFX reff to audio
	var _loc1 = (musicInstance.sfx) ? musicInstance.sfx  : musicInstance;
   _loc1.paused = false;
   _loc1.play();
}

function restartRoomMusic()
{
	stopSong();
	shufflePads();
    var _loc1 = roomMovieClip.music;
	musicIndex = 0;
	currentSongPlaying = -1;
	if(musicInstance) {
		var _loc2 = _soundMediator.getLayer(musicInstance.layerId);
		_loc2.numSoundsPlaying = 0;
	}
	startRoomMusic();
}

function startRoomMusic()
{
	shufflePads();
    var _loc1 = roomMovieClip.music;
	if(debug == true) console.log("startRoomMusic() -> STARTING ROOM MUSIC!");
    if (_loc1 != undefined){		
		if((_loc1.stopCurrentSong != true) && musicIsPlaying){
			console.warn("[music]startRoomMusic() -> _loc1.stopCurrentSong = " + _loc1.stopCurrentSong + " / musicIsPlaying = " + musicIsPlaying);
			return;
		}
		if(currentSongPlaying == _loc1.ids[0]){
			console.log("[music]startRoomMusic() -> Current == song playing");
			if(_loc1.ids.length > 1){
				//musicIndex++;//More testing needs to be done...my logic is playing games on me
			}				
			return;
		}
		if(_loc1.ids.length > 1){
			playSongPad(_loc1);
		}else{
			playSong(_loc1.ids[0]);
		}
    }
    else
        console.warn("startRoomMusic() -> musicObj was not set in roomMovieClip.music. roomMovieClip.music: " + _loc1);
} // End of the function
function playSong(id, hasCustomEvents, isFromPad = false, loopOverride = false )
{
	if(debug == true) console.log("[MusicMan]playSong() -> Play song: " + id);
	if(debug == true) console.log("musicWasNotLoaded " + (musicWasNotLoaded == false) ? " was set, music will shuffle!" : " is still TRUE, did the music load??");
	if(musicWasNotLoaded) return false;
	if(isMusicMuted) return false;
	if (!isNaN(id))
	{
		stopSong();
		musicIsPlaying = true;		
		currentSongPlaying = id;
		musicDataIndex = 0;
		
		isPlayingFromPad = isFromPad;
		let _loop = (loopOverride == true) ? -1 : 0;
		var _cb = function () {
			if(_loop == 0)
				songCompleteHandler({hasCustomEvents:hasCustomEvents, isFromPad:isFromPad});
		};
		
		var _loc1 = roomMovieClip.music;
		musicInstance = _soundMediator.playSound(registerSound(id), "music", globalMusicVolume, 0, _loop, SOUND_TYPES.music, _cb);
		return true;
	} // end if
	//stopSong();
	console.warn("[MusicMan]playSong() -> MUSIC WAS UNABLE TO START! Here's the ID", id);
	return false;
} // End of the function
function playSongPad(obj)
{
	var _loc1;
	if(isNaN(obj.ids[0]) && musicIndex == 0)
	{
        if(debug == true) console.log("playSongPad() -> OBJ HAS MASTER SONG!!");
		_loc1 = obj.ids[musicIndex++].masterSong;
	}else _loc1 = obj.ids[musicIndex++];
	if(_loc1 == undefined) _loc1 = obj.ids[(musicIndex = 0)];
	if(debug == true) console.log("playSongPad() -> _loc1 = " + _loc1);
	playSong(_loc1, false, true, false);
}
function songCompleteHandler(data)
{
	if(debug == true) console.log("[songCompleteHandler]playSong() -> Song completed!");
	
	var _loc1 = roomMovieClip.music;
	musicIsPlaying = false;
	
	if (data.hasCustomEvents){
		if(debug == true) console.log("[songCompleteHandler]playSong() -> CALLING CUSTOM EVENTS");
		data.hasCustomEvents();
	}
	if(isPlayingFromPad == true && data.isFromPad == true){
		if(debug == true) console.log("[songCompleteHandler]playSong() -> Last song was from a room pad");
		if(musicIndex == _loc1.ids.length){
			if(isNaN(_loc1.ids[0])){
				musicIndex = 1;
			}else musicIndex = 0;
		}
		if(_loc1.ids.length == 1){
			console.log("[songCompleteHandler]playSong() -> PLAY SINGLE SONG");
			playSong(_loc1.ids[0], _loc1.hasCustomEvents, true, false);
		}else playSongPad(_loc1);
	}
	if(_loc1 && _loc1.loop == true){
		playSong(_loc1.ids[0], _loc1.hasCustomEvents, true, false);
	}else{
		if(isPlayingFromPad !== true) startRoomMusic();
	}
}

