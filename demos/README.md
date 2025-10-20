# Playable Demos:

A few playable demos are currently available to showcase ScummJS in action. Please note that ScummJS is still in beta, and features and structure are subject to change.

New Room Structure Demo - https://windowstv.net/beta/roomTest/ - 
Demonstrates the updated room architecture, now using localized classes rather than relying on the global JavaScript scope.

Interaction Demo (Legacy) - https://windowstv.net/beta/fap/ - 
An earlier demo featuring multiple interactive points within the scene.

---

# ScummJS Room Guide using the ROOM.js Template

This guide explains how to make a basic room using the provided template as your foundation for new Scummjs rooms.  
It covers how the room lifecycle works, what each function does, and how to extend it safely.

## 1. Purpose of This Template

This room is a lightweight, engine-safe base for new ScummJS rooms.  
It contains everything the engine needs - entry, interactivity, exit, and cleanup - without extra complexity.  
It's ideal for testing room transitions, simple animations, and learning how the system works.

## 2. Room Lifecycle Overview

Every ScummJS room follows a predictable flow:

| Stage | What Happens |
|-------|---------------|
| **Initialization** | The engine loads your room and runs `SignalsObject.roomInitiated.dispatch()`. |
| **Enter Script** | The `enter()` function runs after the engine receives the `roomInitiated` signal. Have your character's entry animation play here. |
| **Handling the End of the Enter Script** | Typically, `handleEnterScriptEnded()` is called through the `AnimationFinishedSignal` on an actor that just finished their entry animation. |
| **Exit Script** | Triggered by `exit()` plays exit animations and loads the next room. |
| **Cleanup** | Removes old signals, actors, and animations to prevent memory leaks. |



## 3. The Core Functions

Your room includes a handful of essential functions that define its behavior.

### `enter()` - Used by the engine
Called when the player enters the room.  
It sets up signals, hints, animations, and (sometimes) hotspots or clickpoints, then finally calls `handleEnterScriptEnded()` to allow player interaction.

### `setRoomHintTo()` - Not used by the engine
Sets the player's "hint" audio, what they say when clicked.  
Hint audio is defined using the global variable `ROOM_PLAYER_AUDIO`, an array of Talkies.

Example:
```js
ROOM_PLAYER_AUDIO = ["sam.0005", "sam.0006", "sam.0007", "sam.0010", "sam.0011", "sam.0012"];
```

### `handleEnterScriptEnded()` - Not used by the engine
Finalizes setup after the entry sequence.  
This is where you can start animations, play sounds, or enable hotspots.

### `skipEnterScript()` - Used by the engine
Runs when the player skips the entry script (for example, by pressing Escape).  
It is also called automatically whenever you exit a room thatâ€™s classified as a **menu**.  
Use it to safely call `handleEnterScriptEnded()`.

### `cleanUpRoom()` - Used by the engine
Runs automatically at the top of `addRoom()`.  
Remove all old signals, actors, and animations to prevent memory leaks.



## 4. Skipping a Script

Anything can be skipped!  
By adding an `EscapeSignal` to a function such as `skipEnterScript()`, you can make parts of your enter script skippable.

Example:
```js
SignalsObject.EscapeSignal.addOnce(this.skipEnterScript, this);
```



## 5. Adding Interactive Elements

This room includes two examples: an **exit door** and a **small animated hotspot**.

### Example: Exit Door
```js
var _exitDoor = createHotspot('exitDebugDoor', 0, 9, 10, 130, 108, 'hw_cursorNWDeep');
roomMovieClip.addChild(_exitDoor);
setupClickPoint(_exitDoor, function (){
    exit(2);
}, true);
```

### Example: Small Animation Hotspot
```js
var _hotspot = createHotspot('lilAnimationHotspot', 0, 153, 133, 41, 56, 'curHigh');
roomMovieClip.addChild(_hotspot);

setupClickPoint(_hotspot, function (){
    var _actor = ActorController.addActor("DEB_LIL_ANIMATION");
    disableAndHideClickpoint(_hotspot);
    actors[_actor.actorID].AnimationFinishedSignal.addOnce(function() {
        ActorController.removeActor(_actor.actorID);
        enableClickpoint(_hotspot);
    }, this);
}, true);
```



## 6. Exiting a Room

When leaving the room, use the `exit()` function.  
It plays an exit animation (if available) and hides the mouse.

```js
function exit(roomId, exitCostume, _gotoFrame) {
    console.log("[Room] exit()");
    // Ask ActorController to stop all talking
    ActorController.stopAllTalking();
    // Save to the global scope
    _exitToRoom = roomId;
    // Hide mouse and set it busy
    hideMouse({isBusy:true}); 

    if (exitCostume) {
        SignalsObject.EscapeSignal.addOnce(this.skipExitScript, this);

        // Remove all signals so there is a clean setup for the new costume
        actors[1].AnimationFinishedSignal.removeAll();

        actors[1].setCostume(exitCostume, false, _gotoFrame);
        actors[1].AnimationFinishedSignal.addOnce(function() {
            console.log("[Room] exit");
            this.handleLeftRoom();
        }, this);
    } else {
        this.handleLeftRoom();
    }
}

function skipExitScript() {
    handleLeftRoom();
}

function handleLeftRoom() {
    addRoom(_exitToRoom);
}
```



## 7. How to Use This Template

1. Copy this file and rename it to match your new room (for example, `ROOM_1.js` or `ROOM_2.js`).  
2. Replace hotspot coordinates with positions from your new background image.  
3. Update the `exit()` function to lead to your next room.  
4. If desired, add animations or sound effects to make it livelier.  
5. Test by loading the room in your game - the console will show logs like *â€śRoom Initiatedâ€ť* and *â€śEnter Script Endedâ€ť*.



## 8. Pro Tips

- Keep `hasEnterScriptEnded` accurate - this prevents duplicate setups.  
- Use `SignalsObject.EscapeSignal.addOnce()` for skippable scripts.  
- Avoid adding actors without cleanup - always remove them when animations end.  
- When testing, enable debug logs (`debug = true`) to see real-time signal events.
