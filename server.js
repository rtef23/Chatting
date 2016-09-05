var port = 3000;
var express = require('express');
var session = require('express-session');
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

var server = app.listen(port, 
	function(){
		console.log("this server run on port : " + port);
	}
);

app.use(express.static('public'));
app.use(session({
	secret : 'chatting',
	resave : false,
	saveUninitialized : true
}));

var router = require('./router/router')(app);