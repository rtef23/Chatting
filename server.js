var port = 3000;
var chat_port = 3100;
var express = require('express');
var session = require('express-session');
var app = express();
var os = require('os');
var sock_io = require("socket.io");
var io = sock_io.listen(chat_port);
var HashMap = require('hashmap');
var bodyParser = require("body-parser");

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

//http server
var getWebServerIP = function () {
	//return server's ip
	var ifaces = os.networkInterfaces();
	var result = '';
	for (var dev in ifaces) {
		var alias = 0;
		ifaces[dev].forEach(function(details) {
			if (details.family == 'IPv4' && details.internal === false) {
				result = details.address;
				++alias;
			}
		});
	}

	return result;
}

var getWebServerProtocol = function(){
	return 'http';
}

var getWebServerPort = function(){
	return port;
}

//chat server
var getChatProtocol = function(){
	//return chatting server's protocol
	return 'http';
}

var getChatServerIPAddr = function(){
	return getWebServerIP();
}

var getChatServerPort = function(){
	return chat_port;
}

/*
	input
		Key : String which is user_id
		Value : {
			user_nick : d1,
			user_name : d'1,
			socket_id : d''1
		}
*/
var online_users = new HashMap();

//export
exports.getWebServerProtocol = getWebServerProtocol;
exports.getWebServerIP = getWebServerIP;
exports.getWebServerPort = getWebServerPort;

exports.getChatProtocol = getChatProtocol;
exports.getChatServerIPAddr = getChatServerIPAddr;
exports.getChatServerPort = getChatServerPort;


var server = app.listen(port, 
	function(){
		console.log("Web server address : " + getWebServerProtocol() + '://' + getWebServerIP() + ':' + port);
	}
);

console.log("chatting server address : " + getChatProtocol() + "://" + getChatServerIPAddr() + ":" + getChatServerPort());

app.use(express.static('public'));
app.use(session({//using redis or mongoDB store session info, not implemented
	key : 'sessionkey',
	secret : 'MysIGn#@!%!@%^',
	resave : false,
	saveUninitialized : true
}));

app.use(bodyParser.json());//to support json encoded body
app.use(bodyParser.urlencoded({
	extended : true
}));//to support url encoded body


var router_POST = require('./router/router_POST')(app, online_users);
var router_GET = require('./router/router_GET')(app);
var router_SOCKET = require('./router/router_SOCKET')(io, online_users);