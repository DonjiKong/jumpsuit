import vinage from 'vinage';
import modulo from '../shared/modulo.js';
import * as entities from './model/entities.js';

let canvas = document.getElementById('canvas'),
	windowBox = new vinage.Rectangle(new vinage.Point(null, null), canvas.clientWidth, canvas.clientHeight);
windowBox.zoomFactor = 1;
windowBox.wrapX = function(entityX) {//get the position where the entity can be drawn on the screen
	return (modulo(entityX + entities.universe.width/2 - this.center.x, entities.universe.width) -entities.universe.width/2 + canvas.width/2 - (this.width*this.zoomFactor - this.width)/2) * this.zoomFactor;
};
windowBox.wrapY = function(entityY) {//get the position where the entity can be drawn on the screen
	return (modulo(entityY + entities.universe.height/2 - this.center.y, entities.universe.height) -entities.universe.height/2 + canvas.height/2 - (this.height*this.zoomFactor - this.height)/2) * this.zoomFactor;
};
windowBox.strokeAtmos = function(context, cx, cy, r, sw) {
	context.beginPath();
	context.arc(cx, cy, r*this.zoomFactor, 0, 2 * Math.PI, false);
	context.globalAlpha = 0.1;
	context.fill();
	context.globalAlpha = 1;
	context.lineWidth = sw*this.zoomFactor;
	context.stroke();
	context.closePath();
};
windowBox.drawRotatedImage = function(context, image, x, y, angle, sizeX, sizeY, mirrorX, mirrorY) {
	sizeX *= this.zoomFactor;
	sizeY *= this.zoomFactor;

	context.translate(x, y);
	context.rotate(angle);
	context.scale(mirrorX === true ? -1 : 1, mirrorY === true ? -1 : 1);
	let wdt = sizeX || image.width*this.zoomFactor,
		hgt = sizeY || image.height*this.zoomFactor;
	context.drawImage(image, -(wdt / 2), -(hgt / 2), wdt, hgt);
	context.resetTransform();
};

export default windowBox;
