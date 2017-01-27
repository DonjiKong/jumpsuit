import Weapon from '../shared/weapon.js';
import windowBox from './windowbox.js';
import * as model from './model/index.js';

export default class extends Weapon {
	constructor(owner) {
		super(owner);
		this.recoil = 0;
	}
	draw(context, isMe) {
		let weaponAngle = isMe ? model.controls.mouseAngle : this.aimAngle,
			weaponRotFact = this.owner.looksLeft === true ? -(weaponAngle - this.owner.box.angle + Math.PI/2) : (weaponAngle - this.owner.box.angle + 3*Math.PI/2);

		this.recoil = this.recoil < 0.05 ? 0 : this.recoil * 0.7;
		context.rotate(weaponRotFact);
		if (document.getElementById('particle-option').checked && this.muzzleFlash === true) {
			var	muzzleX = this.muzzleX*windowBox.zoomFactor + window.resources['muzzle'].width*0.5*windowBox.zoomFactor,
				muzzleY = this.muzzleY*windowBox.zoomFactor - window.resources['muzzle'].height*0.25*windowBox.zoomFactor;

			context.drawImage(window.resources[(Math.random() > 0.5 ? 'muzzle' : 'muzzle2')],
				muzzleX, muzzleY + this.offsetY*windowBox.zoomFactor,
				window.resources['muzzle'].width * windowBox.zoomFactor,
				window.resources['muzzle'].height * windowBox.zoomFactor);//muzzle flash

			this.muzzleFlash = false;
			this.recoil = 10;
		}
		context.drawImage(window.resources[this.type.toLowerCase()], // this is ugly buuuuuuut... it works
			(this.offsetX - this.recoil)*windowBox.zoomFactor,
			this.offsetY*windowBox.zoomFactor,
			window.resources[this.type.toLowerCase()].width*windowBox.zoomFactor,
			window.resources[this.type.toLowerCase()].height*windowBox.zoomFactor
		);
		context.rotate(-weaponRotFact);
	}
}
