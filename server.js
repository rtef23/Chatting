var port = 3000;
var express = require('express');
var session = require('express-session');
var app = express();
var os = require('os');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

exports.getWebServerIP = function () {
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
function getWebServerProtocol(){
	return 'http';
}

var server = app.listen(port, 
	function(){
		console.log("Web server address : " + getWebServerProtocol() + '://' + require('./server').getWebServerIP() + ':' + port);
	}
);

app.use(express.static('public'));
app.use(session({//using redis or mongoDB store session info, not implemented
	key : 'sessionkey',
	secret : 'MysIGn#@!%!@%^',
	resave : false,
	saveUninitialized : true
}));

var router = require('./router/router')(app);