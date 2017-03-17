import modulo from './modulo.js';
import Shot from '<@Shot@>';
import Player from '<@Player@>';

export function doPhysics(universe, players, planets, enemies, shots, teamScores, lobbyState) {
	let playersOnPlanets = new Array(planets.length),
		entitiesDelta = {
			addedShots: [],
			removedShots: []
		};

	function updatePlayerPosOnPlanet(player, planet) {
		player.box.center.x = planet.box.center.x + Math.sin(Math.PI - player.box.angle) * (planet.box.radius + player.box.height / 2);
		player.box.center.y = planet.box.center.y + Math.cos(Math.PI - player.box.angle) * (planet.box.radius + player.box.height / 2);
	}

	players.forEach(function(player) {
		function move(left, run) {
			if (run) run = player.decreaseStamina(3); //prevent loosing stamina when not moving but pressing run key
			player.looksLeft = left;
			let stepSize = run ? 8 : 5,
				directionFactor = left ? -1 : 1,
				arc = (directionFactor * stepSize) / planets[player.attachedPlanet].box.radius;

			player.box.angle = modulo(player.box.angle + arc, 2*Math.PI); // if there is no modulo(), rounding error accumulate which cause issues when converting to brads
		}
		player.setWalkFrame();
		if (player.attachedPlanet >= 0) {
			if (typeof playersOnPlanets[player.attachedPlanet] === 'undefined') playersOnPlanets[player.attachedPlanet] = {'alienBeige': 0, 'alienBlue': 0, 'alienGreen': 0, 'alienPink': 0, 'alienYellow': 0};
			playersOnPlanets[player.attachedPlanet][player.appearance]++;
			updatePlayerPosOnPlanet(player, planets[player.attachedPlanet]);
			player.jetpack = false;

			let walkFlag = (player.controls['moveLeft'] > 0) * 1 | (player.controls['moveRight'] > 0) * 2 | (player.controls['run'] > 0) * 4;
			if (!(walkFlag & 3)) player.increaseStamina(5);
			else if ((walkFlag & 3) !== 3) move(walkFlag & 1, walkFlag >> 2 & 1);
			player.looksLeft = modulo(player.aimAngle - player.box.angle, 2*Math.PI) > Math.PI;
			if (player.controls['jump'] > 0) player.jump();
			else {
				player.velocity.x = 0;
				player.velocity.y = 0;
			}
		} else {
			player.looksLeft = (player.aimAngle - player.box.angle + 2*Math.PI) % (2*Math.PI) > Math.PI;
			player.jetpack = false;
			for (let j = 0; j < planets.length; j++) {
				let deltaX = planets[j].box.center.x - player.box.center.x,
					deltaY = planets[j].box.center.y - player.box.center.y,
					distPowFour = Math.pow(Math.pow(deltaX, 2) + Math.pow(deltaY, 2), 2);

				player.velocity.x += 9000 * planets[j].box.radius * deltaX / distPowFour;
				player.velocity.y += 9000 * planets[j].box.radius * deltaY / distPowFour;

				if (universe.collide(planets[j].box, player.box)) {
					player.attachedPlanet = j;
					player.box.angle = Math.PI + Math.trunc(player.box.angle / (2 * Math.PI)) * Math.PI * 2 - Math.atan2(deltaX, deltaY) - Math.PI;
				}
			}
			player.updateJumpState(player.controls['jump'] > 0);
			if (player.jumpState === player.jumpStates.JETPACK && player.stamina > 0 && player.controls['crouch'] < 1){
				player.decreaseStamina(1);
				player.jetpack = (player.controls['jump'] > 0);
				player.velocity.x += (Math.sin(player.box.angle) / 6) * player.controls['jump'];
				player.velocity.y += (-Math.cos(player.box.angle) / 6) * player.controls['jump'];
			} else if (player.controls['crouch'] > 0){
				player.velocity.x = player.velocity.x * 0.987;
				player.velocity.y = player.velocity.y * 0.987;
			}
			let runMultiplicator = player.controls['run'] ? 1.7 : 1;
			if (player.controls['moveLeft'] > 0) player.box.angle -= (Math.PI / 60) * player.controls['moveLeft'] * runMultiplicator;
			if (player.controls['moveRight'] > 0) player.box.angle += (Math.PI / 60) * player.controls['moveRight'] * runMultiplicator;

			player.box.center.x += player.velocity.x;
			player.box.center.y += player.velocity.y;
			player.box.center.x = (universe.width + player.box.center.x) % universe.width;
			player.box.center.y = (universe.height + player.box.center.y) % universe.height;
		}
		if (player.controls['changeWeapon'] === 1) [player.armedWeapon, player.carriedWeapon] = [player.carriedWeapon, player.armedWeapon];

		if (player.controls['shoot'] === 1 || (player.controls['shoot'] === 2 && player.armedWeapon.canRapidFire !== undefined && player.armedWeapon.canRapidFire())) {
			for (let shot of player.armedWeapon.fire()) {
				shots.push(shot);
				entitiesDelta.addedShots.push(shot);
			}
		}
		let needsPressState = {'changeWeapon': null, 'shoot': null}; //it needs to be an Object to use the operater `in`
		for (let key in player.controls) if (player.controls[key] !== 0 && key in needsPressState) player.controls[key] = 2;
	});
	shots.forEach(function(shot, si) {
		let velocity = shot.speed[shot.type];
		shot.box.center.x += Math.sin(shot.box.angle) * velocity;
		shot.box.center.y += -Math.cos(shot.box.angle) * velocity;
		shot.box.center.x = (universe.width + shot.box.center.x) % universe.width;
		shot.box.center.y = (universe.height + shot.box.center.y) % universe.height;
		if (--shot.lifeTime <= 0) {
			entitiesDelta.removedShots.push(shot);
			shots.splice(si, 1);
		} else if (!players.some(function(player) {
			if (player.constructor !== Player) return;
			if (player.pid !== shot.origin && universe.collide(shot.box, player.box)) {
				player.health -= (player.health === 0) ? 0 : 1;
				if (player.health <= 0) {
					let suitablePlanets = [];
					planets.forEach(function(planet, pi) {
						if (planet.team === player.appearance) suitablePlanets.push(pi);
					});

					player.box.angle = 0;
					if (suitablePlanets.length === 0) player.attachedPlanet = Math.floor(Math.random() * planets.length);
					else player.attachedPlanet = suitablePlanets[Math.floor(Math.random() * suitablePlanets.length)];
					updatePlayerPosOnPlanet(player, planets[player.attachedPlanet]);

					player.health = 8;
					player.fillStamina();
					if (lobbyState === 'playing') teamScores[player.appearance] -= 5;
				}
				player.hurt = true;
				entitiesDelta.removedShots.push(shot);
				shots.splice(si, 1);
				return true;
			}
		})) planets.some(function(planet) {
			if (universe.collide(shot.box, planet.box)) {
				entitiesDelta.removedShots.push(shot);
				shots.splice(si, 1);
				return true;
			}
		});
	});
	enemies.forEach(function(enemy) {
		let playerToHit = null;
		players.forEach(function(player) {
			if (universe.collide(enemy.aggroBox, player.box) && (playerToHit === null || player.lastlyAimedAt < playerToHit.lastlyAimedAt)) {
				playerToHit = player;
			}
		});
		if (playerToHit === null) {
			enemy.fireRate = 0;
			enemy.box.angle += Math.PI/150;
		} else {
			enemy.box.angle = Math.PI - Math.atan2(enemy.box.center.x - playerToHit.box.center.x, enemy.box.center.y - playerToHit.box.center.y);
			if (++enemy.fireRate >= 20) {
				playerToHit.lastlyAimedAt = Date.now();
				enemy.fireRate = 0;
				let newShot = new Shot(enemy.box.center.x, enemy.box.center.y, enemy.box.angle - Math.PI, -1, 0);
				shots.push(newShot);
				entitiesDelta.addedShots.push(newShot);
			}
		}
	});

	for (let i = 0; i < playersOnPlanets.length; i++){
		if (typeof playersOnPlanets[i] === 'undefined') continue;
		let toArray = Object.keys(playersOnPlanets[i]).map(function (key){return playersOnPlanets[i][key];}),
			max = Math.max.apply(null, toArray),
			teams = ['alienBeige', 'alienBlue', 'alienGreen', 'alienPink', 'alienYellow'];

		if (max > 0) {
			let team, a, b = 0;
			while (toArray.indexOf(max) !== -1) {
				a = toArray.indexOf(max);
				b++;
				toArray.splice(a, 1);
			}
			if (b >= 2) return entitiesDelta;
			team = teams[a];
			if (team === planets[i].team) planets[i].progress = (planets[i].progress + (max / 3) > 100) ? 100 : planets[i].progress + (max / 3);
			else {
				planets[i].progress -= max / 3;
				if (planets[i].progress <= 0) {
					planets[i].progress = 0;
					planets[i].team = team;
				}
			}
		}
	}

	return entitiesDelta;
}
