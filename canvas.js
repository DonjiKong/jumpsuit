"use strict";
var canvas = document.getElementById('canvas');
var context = canvas.getContext("2d");

var resources = {}, keys = [], progress = 0, meteors = [], paused = false;
var controls = {
	spacebar: 32,
	upArrow: 38,
	downArrow: 40,
	leftArrow: 37,
	rightArrow: 39
};

function init(){
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var paths = [
		"background",
		"meteorBig",
		"meteorBig2",
		"meteorMed",
		"meteorMed2",
		"meteorSmall",
		"meteorTiny"
	];

	context.canvas.fillStyle = "black";
	context.fillRect(0,0, canvas.width, canvas.height);
  	context.font = "16px Open Sans";  	
  	context.textBaseline = "top";
  	context.textAlign = "center";

	for (var i = 0, lgt = paths.length; i != lgt; i++){
		var r = new Image();
		r.src = "assets/" + paths[i] + ".png";
		r.onload = loadProcess;
		resources[paths[i]] = r;
	}	
}

function loadProcess(e){
	progress++;
	context.fillStyle = "#121012";
	context.fillRect(0, 0, canvas.width, canvas.height);


	context.fillStyle = "#007d6c";
	context.fillRect(0, 0, (progress / 7) * canvas.width, 15);

	context.fillStyle = "#eee";
	context.font = "60px Open Sans";
	context.fillText("JumpSuit", canvas.width / 2, canvas.height * 0.35);
	context.font = "28px Open Sans";
	context.fillText("canvas game by Getkey & Fju", canvas.width / 2, canvas.height * 0.35 + 80);

	if (progress == 7) setTimeout(loop, 2000);
}

function loop() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	context.clearRect(0, 0, canvas.width, canvas.height);

	//draw bg
	for (var i = 0; i < Math.floor(canvas.width / 256) + 1; i++){
		for (var j = 0; j < Math.floor(canvas.height / 256) + 1; j++){
			context.drawImage(resources["background"], i * 256, j * 256);
		}
	}

	//check if paused
	if (paused) {
		context.fillStyle = "#eee";
		context.font = "48px Open Sans";
		context.fillText(".:paused:.", canvas.width / 2, canvas.height / 2);
		window.requestAnimationFrame(loop);
	}

	if (Math.random() < 0.01){
		//spawns a random meteor - why random? random y-position, random speed, random appearal, random angle
		var m_resources = ["meteorMed2", "meteorMed", "meteorSmall", "meteorTiny"];

		meteors[meteors.length] = {
			x: -100,
			y: Math.map(Math.random(), 0, 1, 50, canvas.height - 50),
			res: m_resources[Math.floor(Math.random() * 4)],
			speed: Math.map(Math.random(), 0, 1, 2, 4),
			ang: Math.map(Math.random(), 0, 1, 45, 135)
		};
	}

	meteors.forEach(function(m, i){
		m.x += Math.sin(m.ang * (Math.PI / 180)) * m.speed;
		m.y += Math.cos(m.ang * (Math.PI / 180)) * m.speed;
		if (m.x > canvas.width + 10 || m.y > canvas.height + 10) meteors.splice(i, 1);			
		else context.drawImage(resources[m.res], m.x, m.y);
	});	


	window.requestAnimationFrame(loop);
}

function keyInput(e){
	keys[e.keyCode] = (e.type == "keydown") | false;
}

Math.map = function(x, in_min, in_max, out_min, out_max) {
	return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


init();
window.addEventListener("keydown", keyInput);
window.addEventListener("keyup", keyInput);
