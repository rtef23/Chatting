var port = 3000;
var express = require('express');
var app = express();
var router = require('./router/router')(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

var server = app.listen(port, 
	function(){
		console.log("this server run on port : " + port);
	}
);