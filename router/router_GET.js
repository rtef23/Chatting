module.exports = function(app){
	var fs = require("fs");
	var path = require("path");
	var url = require('url');
	var member = require('../DB/db_member');
	var server = require('../server');

	//################## GET #####################
		//return socket.io.js file
	app.get('/script/socket.io.js', function(req, res){
		var file_path = '../node_modules/socket.io-client/socket.io.js';
		var real_path = path.join(__dirname, file_path);

		fs.readFile(real_path, function(err, data){
			if(err){
				res.writeHead(404, {"Content-Type" : "text/plain"});
				res.end("404 not found");
				return;
			}
			res.writeHead(200, {"Content-Type" : "text/javascript"});
			res.end(data);
		});
	});

	app.get('/', function(req, res){
		res.render('static_files/chatting', {
			addr : {
				chat_addr : (server.getChatProtocol() + '://' + server.getChatServerIPAddr() + ':' + server.getChatServerPort())
			}
		});
	});

	app.get('/loadClientSocketScript', function(req, res){
		var file_path = '../views/scripts/client_socket_io.ejs';
		var real_path = path.join(__dirname, file_path);

		fs.readFile(real_path, function(err, data){
			if(err){
				res.writeHead(404, {'Content-Type':'text/plain'});
				res.end('404 not found');
				return;
			}
			res.writeHead(200, {'Content-Type':'text/javascript'});
			res.end(data.toString().replace(/<script>/g, '').replace(/<\/script>/g, ''));
		});
	});

	app.get('/create_member', function(req, res){
		res.render('client/create_member');
	});

	//process image request
	app.get('/img*', function(req, res){
		var file_name = req.query.file_name.replace(/\'/g, "");//make every single quater in file path blank
		var total_path = path.join(__dirname, "../views/images/", file_name);//join path
		var ext = path.extname(file_name).replace(".", "");

		fs.readFile(total_path, function(err, data){
			if(err){//if there is no file
				res.writeHead(404, {"Content-Type":"text/plain"});
				res.end("404 not found");
				return;
			}

			res.writeHead(200, {"Content-Type":("image/" + ext)});//return header with file extension type
			res.end(data, "binary");
		});
	});
}