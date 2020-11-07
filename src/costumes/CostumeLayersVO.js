// namespace:
this.com = window.com || {};
this.com.wtv = window.com.wtv || {};
 
(function() {
	"use strict";
	// constructor:
	/**
	 * The CostumeLayersVO is a class to create layer information for a COSTUME
	 * @class CostumeLayersVO
	 * @param layer1{createjs Sprite}
	 * @param layer2{createjs Sprite}
	 * @param layer3{createjs Sprite}
	 * @param layer4{createjs Sprite}
	 * @constructor
	 */
	function CostumeLayersVO(layer1 = undefined, layer2 = undefined, layer3 = undefined, layer4 = undefined) {	
		// public properties:
		this._layer1 = layer1;//Single Layered Animation or Body Layer
		if(this._layer1 != undefined) this._layer1.name = "layer1"		
		this._layer2 = layer2;//mouth/haed layer
		if(this._layer2 != undefined) this._layer2.name = "layer2"		
		this._layer3 = layer3;//pupils layer
		if(this._layer3 != undefined) this._layer2.name = "layer3"		
		this._layer4 = layer4;//eye lids layer	
		if(this._layer4 != undefined) this._layer4.name = "layer4"		
		this._amount = 4;		
		return this;
	}
	var p = CostumeLayersVO.prototype; 
 
	// public methods:
	p.addLayer = function(sprite, layerNumber = -1){
		if(!sprite){
			console.warn("[CostumeLayersVO] NO SPRITE WAS GIVEN for method 'addLayer'. Stoping method..");
			return;
		}
		console.debug("[CostumeLayersVO]addLayer(layerNumber: "+ (layerNumber == -1) ? "New Layer(Num in nect log)" : layerNumber +")");
		if(layerNumber == -1){
			this['_layer' + (++this._amount)] = sprite;
			this['_layer' + this._amount].name = 'layer' + (this._amount);
			console.debug("[CostumeLayersVO]addLayer() -> Layers in costume = " + this._amount);
			return this['_layer' + this._amount];
		}
	};

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "CostumeLayersVO{_amount:" + this._amount + "}";
	};
	
	// private methods:
	com.wtv.CostumeLayersVO = CostumeLayersVO;
}());
 