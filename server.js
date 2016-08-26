var port = 3000;
var express = require('express');
var app = express();

var server = app.listen(port, 
	function(){
		console.log("this server run on port : " + port);
	}
);