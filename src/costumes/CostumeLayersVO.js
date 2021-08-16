// namespace:
this.sjs = window.sjs || {};
 
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
	function CostumeLayersVO(costumeObject) {	
		// public properties:	
		var _theLayerNumber = 1;
		for(var i = 0; i <= costumeObject.length; i++){	
			//Remove isNewType in favor for a check to see if the Costume has layers 
			if(costumeObject[i] && costumeObject[i].isNewType && costumeObject[i].isNewType == true)continue;
			if(costumeObject[i] && costumeObject[i].s != undefined){
					this["_layer" + _theLayerNumber] = costumeObject[i].s;					
					if(this["_layer" + _theLayerNumber] != undefined) {
						this["_layer" + _theLayerNumber].name = ["layer" + _theLayerNumber];	
						this["_layer" + _theLayerNumber].type = costumeObject[i].t;	
						/*if(this.isADynamicLayer(this["_layer" + _theLayerNumber].type)){
							this["_layer" + _theLayerNumber].isDynamic = true;	
						}*/
					}
					_theLayerNumber++;
			}
		}
		this._amount = (_theLayerNumber - 1);
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
	p.isADynamicLayer = function(typeToCheck){
		if (typeToCheck == sjs.CostumeLayersVO.HEAD ||
			typeToCheck == sjs.CostumeLayersVO.EYES ||
			typeToCheck == sjs.CostumeLayersVO.LIDS) {
		   return true;
		};
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
	sjs.CostumeLayersVO = CostumeLayersVO;
	sjs.CostumeLayersVO.BODY = "body";
	sjs.CostumeLayersVO.HEAD = "head";
	sjs.CostumeLayersVO.EYES = "eyes";
	sjs.CostumeLayersVO.LIDS = "lids";
}());
 
