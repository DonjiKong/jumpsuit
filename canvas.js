"use strict";
var canvas = document.getElementById("canvas"),
context = canvas.getContext("2d"),
resources = {},
keys = [],
meteors = [],
pause = 0,
player = {
	x: 0.2 * canvas.width, y: 0.6 * canvas.height, health: 10, facesLeft: false, name: "alienBeige",
	walkFrame: "_stand", walkCounter: 0, walkState: 0,
	attachedPlanet: 0, leavePlanet: false
},
offsetX = 0, offsetY = 0,
controls = {
	escape: 27,
	spacebar: 32,
	upArrow: 38,
	downArrow: 40,
	leftArrow: 37,
	rightArrow: 39,
	leftShift: 16,
	tab: 9
},
planets = [
	{
		get cx() { return 0.1 * canvas.width },
		get cy() { return 0.5 * canvas.height },
		radius: 150,
		colour: "rgb(255,51,51)",
		player: -1
	},
	{
		get cx() { return 0.8 * canvas.width },
		get cy() { return 1.5 * canvas.height },
		radius: 220,
		colour: "rgb(220,170,80)",
		player: -1
	},
	{
		get cx() { return 3 * canvas.width },
		get cy() { return -0.2 * canvas.height },
		radius: 80,
		colour: "rgb(120,240,60)",
		player: -1
	}
];



function init(){
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	init.paths = [
		"background",
		"meteorBig", "meteorBig2", "meteorMed",	"meteorMed2", "meteorSmall", "meteorTiny",
		"shield", "pill_red",
		"controlsUp", "controlsDown", "controlsLeft", "controlsRight",
		"alienBlue_badge", "alienBlue_duck", "alienBlue_hurt", "alienBlue_jump", "alienBlue_stand", "alienBlue_walk1", "alienBlue_walk2",
		"alienBeige_badge", "alienBeige_duck", "alienBeige_hurt", "alienBeige_jump", "alienBeige_stand", "alienBeige_walk1", "alienBeige_walk2"
	];

	context.canvas.fillStyle = "black";
	context.fillRect(0,0, canvas.width, canvas.height);
  	context.font = "16px Open Sans";  	
  	context.textBaseline = "top";
  	context.textAlign = "center";

	for (var i = 0, lgt = init.paths.length; i != lgt; i++){
		var r = new Image();
		r.src = "assets/" + init.paths[i] + ".png";
		r.onload = loadProcess;
		resources[init.paths[i]] = r;
	}	
}

function loadProcess(e){
	loadProcess.progress = loadProcess.progress === undefined ? 1 : ++loadProcess.progress;

	context.fillStyle = "#121012";
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = "#007d6c";
	context.fillRect(0, 0, (loadProcess.progress / init.paths.length) * canvas.width, 15);

	context.fillStyle = "#eee";
	context.font = "60px Open Sans";
	context.fillText("JumpSuit", canvas.width / 2, canvas.height * 0.35);
	context.font = "28px Open Sans";
	context.fillText("A canvas game by Getkey & Fju", canvas.width / 2, canvas.height * 0.35 + 80);

	if (loadProcess.progress == init.paths.length) setTimeout(loop, 1000);
}

function loop() {
	function drawRotatedImage(image, x, y, angle, mirror) {
		//courtesy of Seb Lee-Delisle
		context.save();
		context.translate(x, y);		
		context.rotate(angle);
		if (mirror === true) context.scale(-1, 1);
		context.drawImage(image, -(image.width/2), -(image.height/2));
		context.restore();
	}

	function fillCircle(cx, cy, r){
		context.save();

		context.beginPath();
		context.arc(cx, cy, r, 0, 2 * Math.PI, false);	
		context.closePath();
		context.fill();

		context.clip();

		context.lineWidth = 12;
		context.shadowColor = "black";
		context.shadowBlur = 30;
		context.shadowOffsetX = -10;
		context.shadowOffsetY = -10;

		context.beginPath();
		context.arc(cx, cy + 1, r + 7, -1/7 * Math.PI, 3/5 * Math.PI);
		context.stroke();

		context.restore();
	}

	function drawCircle(cx, cy, r, sw){
		context.save();		
		context.beginPath();
		context.arc(cx, cy, r, 0, 2 * Math.PI, false);
		context.globalAlpha = 0.1;
		context.fill();
		context.globalAlpha = 1;
		context.strokeStyle = context.fillStyle;
		context.lineWidth = sw;
		context.stroke();
		context.restore();
	}

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	context.globalAlpha = 1;
	context.clearRect(0, 0, canvas.width, canvas.height);

	//layer 0: background
	for (var i = 0; i < Math.floor(canvas.width / 256) + 1; i++){
		for (var j = 0; j < Math.floor(canvas.height / 256) + 1; j++){
			context.drawImage(resources["background"], i * 256, j * 256);
		}
	}


	//layer 1: meteors
	if (Math.random() < 0.05){		
		var m_resources = ["meteorMed2", "meteorMed", "meteorSmall", "meteorTiny"],
			chosen_img = m_resources[Math.floor(Math.random() * 4)];

		meteors[meteors.length] = {
			x: -resources[chosen_img].width,
			y: Math.map(Math.random(), 0, 1, 50, canvas.height - 50),
			res: chosen_img,
			speed: Math.map(Math.random(), 0, 1, 2, 4),
			ang: Math.map(Math.random(), 0, 1, 45, 135),
			rotAng: Math.map(Math.random(), 0, 1, 0, 2 * Math.PI),
			rotSpeed: Math.map(Math.random(), 0, 1, -0.05, 0.05),
			depth: Math.map(Math.random(), 0, 1, 0.2, 0.6)
		};
	}
	
	meteors.forEach(function(m, i){		
		m.x += Math.sin(m.ang * (Math.PI / 180)) * m.speed;
		m.y += Math.cos(m.ang * (Math.PI / 180)) * m.speed;
		context.globalAlpha = m.depth;
		m.rotAng += m.rotSpeed;
		if (m.x > canvas.width + 10 || m.y > canvas.height + 10) meteors.splice(i, 1);			
		else drawRotatedImage(resources[m.res], m.x, m.y, m.rotAng);
	});


	//layer 2: HUD / GUI
	context.globalAlpha = 1;

	context.font = "20px Open Sans";
	context.textAlign = "left";
	context.textBaseline = "hanging";

	context.fillStyle = "#eee";
	context.fillText("Health: ", 8, 20);
	for (var i = 0; i < player.health; i++){
		context.drawImage(resources["shield"], 80 + i * 22, 20, 18, 18);
	}

	if (isMobile.any() !== null){
		context.drawImage(resources["controlsUp"], 0, 0, resources["controlsUp"].width, resources["controlsUp"].height, 20, canvas.height - 70, 50, 50);
		context.drawImage(resources["controlsDown"], 0, 0, resources["controlsDown"].width, resources["controlsDown"].height, 80, canvas.height - 70, 50, 50);
	}


	//layer 3: the game	
	if(player.attachedPlanet >= 0) offsetX = ((planets[player.attachedPlanet].cx + Math.sin(planets[player.attachedPlanet].player / (180 / Math.PI)) * (planets[player.attachedPlanet].radius + resources[player.name + player.walkFrame].height / 2) - canvas.width / 2) + 19 * offsetX) / 20;
	if(player.attachedPlanet >= 0) offsetY = ((planets[player.attachedPlanet].cy + Math.cos(planets[player.attachedPlanet].player / (180 / Math.PI)) * (planets[player.attachedPlanet].radius + resources[player.name + player.walkFrame].height / 2) - canvas.height / 2) + 19 * offsetY) / 20;
	planets.forEach(function (element){
		context.fillStyle = element.colour;
		
		fillCircle(element.cx - offsetX, element.cy - offsetY, element.radius, 5);
		drawCircle(element.cx - offsetX, element.cy - offsetY, element.radius * 1.5);

		if (player.attachedPlanet < 0) element.player = -1;
	});

	if (keys[controls.spacebar] && !player.leavePlanet) {
		player.leavePlanet = player.attachedPlanet;
		player.attachedPlanet = -1;
	}

	if (player.attachedPlanet >= 0){
		if (keys[controls.leftArrow]) {
			planets[player.attachedPlanet].player += (keys[controls.leftShift]) ? 1.4 : 0.8;
			player.looksLeft = true;
		}
		if (keys[controls.rightArrow]) {
			planets[player.attachedPlanet].player -= (keys[controls.leftShift]) ? 1.4 : 0.8;
			player.looksLeft = false;
		}
		player.walkState = (keys[controls.leftArrow] || keys[controls.rightArrow]);
		
		if (!player.walkState) player.walkFrame = (keys[controls.downArrow]) ? "_duck" : "_stand";
		if (++player.walkCounter > ((keys[controls.leftShift]) ? 5 : 9)) {
			player.walkCounter = 0;
			if (player.walkState) player.walkFrame = (player.walkFrame === "_walk1") ? "_walk2" : "_walk1";
		}

		player.x = planets[player.attachedPlanet].cx + Math.sin(planets[player.attachedPlanet].player / (180 / Math.PI)) * (planets[player.attachedPlanet].radius + resources[player.name + player.walkFrame].height / 2) - offsetX;
		player.y = planets[player.attachedPlanet].cy + Math.cos(planets[player.attachedPlanet].player / (180 / Math.PI)) * (planets[player.attachedPlanet].radius + resources[player.name + player.walkFrame].height / 2) - offsetY;
		player.rot = Math.PI - planets[player.attachedPlanet].player / (180 / Math.PI)
	} else {
		planets.forEach(function (element, index){
			if(Math.pow(element.cx - player.x - offsetX, 2) + Math.pow(element.cy - player.y - offsetY, 2) <= Math.pow(element.radius * 1.5, 2) && index !== player.leavePlanet) {//player is in a planet's attraction area
				player.attachedPlanet = index;
				player.leavePlanet = false;
				//TODO: place the player correctly
			}
		});
		offsetX += Math.sin(player.rot) * 4;
		offsetY -= Math.cos(player.rot) * 4;
	}
	drawRotatedImage(resources[player.name + player.walkFrame],
		player.x,
		player.y,
		player.rot,
		player.looksLeft);

	window.requestAnimationFrame(loop);
}

function handleInput(e){
	if (isMobile.any() !== null){
	

	} else {
		if (e.type == "keydown") {
			if (e.keyCode == controls.escape) {
				var box = document.getElementById("info-box");
				box.className = (box.className == "info-box hidden") ?  "info-box" : "info-box hidden";
			} else if (e.keyCode == controls.tab){
				if (++player.attachedPlanet === planets.length) player.attachedPlanet = 0;
			}
		}
		keys[e.keyCode] = (e.type == "keydown") | false;	
	}
	
	console.log(e.keyCode);
}

Math.map = function(x, in_min, in_max, out_min, out_max) {
	return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

var isMobile = {
	//code by Cory LaViska - http://www.abeautifulsite.net/detecting-mobile-devices-with-javascript/
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

init();
window.addEventListener("keydown", handleInput);
window.addEventListener("keyup", handleInput);
window.addEventListener("touchstart", handleInput);
window.addEventListener("touchend", handleInput);
