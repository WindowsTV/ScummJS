/*
* SoundLayer
*
* Rights Reserved (r) 2020 WindowsTV.
*
* Any person obtaining a copy of this software and associated documentation
* files (the "Software")including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, is strictly prohibited.
*/
 
// namespace:
this.com = window.com || {};
this.com.wtv = window.com.wtv || {};
//this.alphapenguin = this.alphapenguin||{};
 
(function() {
	"use strict"; 
// constructor:
	/**
	 * The SoundLayer is a class to create interactions between the multiplayer server and the client.
	 * @class SoundLayer
	 * @param {CodeBlock} target The instance to manage.
	 * @constructor
	 */
	function SoundLayer(id, name, maxConcurrent) {	
	// public properties:
        this.id = id;
        this.name = name;
        this.maxConcurrent = maxConcurrent;
        this.numSoundsPlaying = 0;		
		return this;
	}
	var p = SoundLayer.prototype; 
 
// public methods:
	/**
	 * Returns a bool representation of if sound can play.
	 * @method canPlaySound
	 * @return {Bool} a string representation of the playable state.
	 **/

	p.canPlaySound = function() {
		console.log("[SoundLayer]CanPlaySound ? " + (this.numSoundsPlaying < this.maxConcurrent || this.maxConcurrent == -1));
		return (this.numSoundsPlaying < this.maxConcurrent || this.maxConcurrent == -1);
	};
	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "SoundLayer{name:" + this.name + ", maxConcurrent:" + this.maxConcurrent + ", numSoundsPlaying:" + this.numSoundsPlaying + "}";
	};
 
 
// private methods:
	com.wtv.SoundLayer = SoundLayer;
}());
 