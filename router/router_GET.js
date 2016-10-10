module.exports = function(app){
	var fs = require("fs");
	var path = require("path");
	var url = require('url');
	var member = require('../DB/db_member');

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

	app.get('/loadSocketScript', function(req, res){
		var file_path = '../views/scripts/socket_io_scripts.js';
		var real_path = path.join(__dirname, file_path);

		fs.readFile(real_path, function(err, data){
			if(err){
				res.writeHead(404, {'Content-Type':'text/plain'});
				res.end('404 not found');
				return;
			}
			res.writeHead(200, {'Content-Type':'text/javascript'});
			res.end(data);
		});
	});

	app.get('/', function(req, res){
		res.render('static_files/chatting');
	});

	app.get('/unlogin_tab', function(req, res){
		res.render('static_files/unlogin_tab');
	});

	app.get('/friend_list', function(req, res){
		res.render('friend_list/friend_list');
	});

	app.get('/friend_requests', function(req, res){
		res.render('friend_request/friend_request_list');
	});

	app.get('/user_info', function(req, res){
		res.render('client/user_info');
	});

	app.get('/welcome', function(req, res){
		res.render('static_files/chatting_main');
	});

	app.get('/login_tab', function(req, res){
		var uri = req.url;
		var query = url.parse(uri, true).query;
		var user_id = query.user_id;

		member.read_member({
			id : user_id
		}, function(result){
			switch(result.result){
				case 0:
					res.render('static_files/login_tab');
				break;
				case 1:
					res.render('static_files/login_tab', {user_id : result.data.nickname});
				break;
			}
		});
	});

	app.get('/create_member', function(req, res){
		res.render('client/create_member');
	});

	app.get('/read_rooms', function(req, res){
		res.render('room/roomList');
	});

	app.get('/read_roomInvitation', function(req, res){
		res.render('room/roomInvitation');
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