// namespace:
this.sjs = window.sjs || {};
 
(function() {
	"use strict";
	// constructor:
	var p = CostumeLayersNewVO.prototype; 	
	/**
	 * The CostumeLayersNewVO is a class to create layer information for a COSTUME
	 * @class CostumeLayersNewVO
	 * @param costumeObject{Object}
	 * @constructor
	 */
	function CostumeLayersNewVO(costumeObject) {	
		// public properties:	
		this._layers = [];
		this._layers._length = 0;
		
		for(var i = 0; i <= costumeObject.length-1; i++){	
			if(costumeObject[i] && costumeObject[i].isNewType && costumeObject[i].isNewType == true) continue;
			if(costumeObject[i] && costumeObject[i].s != undefined){
				let _sprite = costumeObject[i].s;
				_sprite.name = ("layer" + i);	
				_sprite.type = costumeObject[i].t;	
				this._layers["_layer" + i] = _sprite;
			}//END IF
			this._layers._length = i;
		}//END LOOP
		return this;
	}
 
	// public methods:
	p.addLayer = function(sprite, layerNumber = -1){
		if(!sprite){
			console.warn("[CostumeLayersNewVO] NO SPRITE WAS GIVEN for method 'addLayer'. Stoping method..");
			return;
		}
		console.debug("[CostumeLayersNewVO]addLayer(layerNumber: "+ (layerNumber == -1) ? "New Layer(Num in nect log)" : layerNumber +")");
		if(layerNumber == -1){
			this['_layer' + (++this._amount)] = sprite;
			this['_layer' + this._amount].name = 'layer' + (this._amount);
			console.debug("[CostumeLayersNewVO]addLayer() -> Layers in costume = " + this._amount);
			return this['_layer' + this._amount];
		}
	};
	//Dynamic layers are ones that have multiple animations inside of it
	p.isADynamicLayer = function(typeToCheck){
		if (typeToCheck == sjs.CostumeLayersNewVO.EYES){
		   return true;
		};
	};

	/**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "CostumeLayersNewVO{_amount:" + this._amount + "}";
	};
	
	// private methods:
	sjs.CostumeLayersNewVO = CostumeLayersNewVO;
	sjs.CostumeLayersNewVO.buildLayer = function(target, sprite, layerNumber = -1){
		if(!sprite){
			console.warn("[CostumeLayersNewVO] NO SPRITE WAS GIVEN for method 'addLayer'. Stoping method..");
			return;
		}
		layerNumber = (layerNumber == -1) ? target.children.length+1 : layerNumber;
		sprite.name = 'layer' + (layerNumber);
		return sprite;
	};
	sjs.CostumeLayersNewVO.BODY = "body";
	sjs.CostumeLayersNewVO.HEAD = "head";
	sjs.CostumeLayersNewVO.EYES = "eyes";
	sjs.CostumeLayersNewVO.LIDS = "lids";
	sjs.CostumeLayersNewVO.EYES_WITH_LID = "lidsInEyeSS";
	sjs.CostumeLayersNewVO.EXTRA = "extra";
}());
 
