var MESSAGE_ERROR = 0,
	MESSAGE_CONNECT = 1,
	MESSAGE_GET_LOBBIES = 2,
	MESSAGE_SENT_LOBBIES = 3,
	MESSAGE_SETTINGS_CHANGED = 4,
	MESSAGE_CREATE_LOBBY = 5,
	MESSAGE_CONNECT_ERR_FULL = 6,
	MESSAGE_CONNECT_SUCCESSFUL = 7,
	MESSAGE_PLAYER_DATA = 8,
	MESSAGE_PLAYER_POSITIONS = 9,
	MESSAGE_CHUNKS = 10,
	MESSAGE_CHECK_ALIVE = 11,
	MESSAGE_DISCONNECT = 12,
	MESSAGE_LEAVE_LOBBY = 13;

function connection(){
	this.socket = new WebSocket("ws://localhost:8080");
	this.alive = function (){ return this.socket.readyState === 1; }
	var pid = -1;

	this.socket.onopen = function(e){
		// this.socket.send(JSON.stringify({ msgType: MESSAGE_CONNECT, data: {name: player.playerName, appearance: player.name, lobby: 0}})); use if lobby is selected
		this.send(JSON.stringify({ msgType: MESSAGE_GET_LOBBIES }));
		document.getElementById("button-3").disabled = false;
		document.getElementById("button-2").textContent = "Refresh";
		document.getElementById("button-2").disabled = false;
	};
	this.socket.onerror = function(e){
		document.getElementById("button-3").disabled = true;
		document.getElementById("button-2").disabled = true;
		this.close();		
	};
	this.socket.onmessage = function(message){	
		try{
			msg = JSON.parse(message.data);
			switch(msg.msgType){
				case MESSAGE_SENT_LOBBIES:
					var i, list = document.getElementById("player-list"), el, li;
					while (list.firstChild) {
   						list.removeChild(list.firstChild);
					}
					for (i = 0; i != msg.data.length; i++){
						li = document.createElement("li");
						el = document.createElement("a");
						el.href = "#c:" + msg.data[i].uid;
						el.textContent = msg.data[i].name + " | (" + msg.data[i].players + " of " + msg.data[i].maxplayers + ")";
						li.appendChild(el);
						list.appendChild(li);
					}
					break;
				case MESSAGE_CONNECT_SUCCESSFUL:					
					pid = msg.data.pid;
					document.getElementById("button-2").textContent = "Leave Lobby";
					break;
				case MESSAGE_PLAYER_DATA:
					msg.data.player;
					break;
				case MESSAGE_ERROR:
					alert(msg.data.content);
					break;
			}
		} catch(err) {
			console.log("Badly formated JSON message received:", err);
		}
	};
	this.close = function(){
		this.socket.send(JSON.stringify({
			msgType: MESSAGE_DISCONNECT,
			data: {uid: location.hash.substr(3), pid: pid}
		}));
		location.hash = "";
		this.alive = false;
		this.socket.close();		
	};
	this.connectLobby = function (){
		this.socket.send(JSON.stringify({
			msgType: MESSAGE_CONNECT,
			data: {uid: location.hash.substr(3), name: player.playerName, appearance: player.name}
		}));
	};
	this.refreshLobbies = function(){
		this.socket.send(JSON.stringify({ msgType: MESSAGE_GET_LOBBIES }));
	}
	this.leaveLobby = function(){
		this.socket.send(JSON.stringify({
			msgType: MESSAGE_LEAVE_LOBBY,
			data: {pid: pid, uid: location.hash.substr(3)}
		}));
		location.hash = "";
	}
	this.sendSettings = function (){
		this.socket.send(JSON.stringify({
			msgType: MESSAGE_PLAYER_DATA,
			data: {pid: pid, uid: location.hash.substr(3), name: player.playerName, appearance: player.name}
		}));
	};
}

var currentConnection = new connection();

function closeSocket(){
	document.getElementById("button-3").disabled = true;
	document.getElementById("button-2").textContent = "Refresh";
	document.getElementById("button-2").disabled = true;
	currentConnection.close();
}
function openSocket(){
	currentConnection = new connection();
}
function newLobby(){
	if (!currentConnection.alive()) return;

	currentConnection.socket.send(JSON.stringify({
		msgType: MESSAGE_CREATE_LOBBY,//TODO: replace string value with some kind of enum
		data: {name: prompt("Give your lobby a name!"), privateLobby: confirm("Private?") }
	}));
}

function refreshLobbies(){
	if (!currentConnection.alive()) return;
	currentConnection.refreshLobbies();
}
function leaveLobby(){
	if (!currentConnection.alive()) return;
	currentConnection.leaveLobby();
	document.getElementById("button-2").textContent = "Refresh";
}

function hashChange() {
	if (!currentConnection.alive()) return;
	if (location.hash.indexOf("c:") === 1){
		currentConnection.connectLobby();
	}
}
window.addEventListener("hashchange", hashChange);

function settingsChanged(){
	if (!currentConnection.alive() || location.hash.indexOf("c:") !== 1) return; 
	currentConnection.sendSettings();
}
