module.exports = function(app){
	var chat_port = 3100;
	var fs = require("fs");
	var path = require("path");
	var bodyParser = require("body-parser");
	var member = require("../DB/Member");
	var sock_io = require("socket.io");
	var io = sock_io.listen(chat_port);
	var url = require("url");

	app.use(bodyParser.json());//to support json encoded body
	app.use(bodyParser.urlencoded({
		extended : true
	}));//to support url encoded body

	//act by url
//################# EXTRA functions ####################
	function on_session_fault_action(req, res){
		//when unpermitted user accessed in illegal way
		req.session.destroy();
		res.clearCookie('sessionkey');
		res.writeHead(302, {"Content-Type" : "text/plain", "Location":"/session_fault"});
		res.end();
		return;
	}
//################# Chatting ####################
	console.log("chatting server address : " + getChatProtocol() + "://" + getChatServerIPAddr() + ":" + getChatServerPort());
	
	function getChatProtocol(){
		//return chatting server's protocol
		return 'http';
	}

	function getChatServerIPAddr(){
		return require('../server').getWebServerIP();
	}

	function getChatServerPort(){
		return chat_port;
	}

	
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

	//return chatting server url with port number
	app.get('/get_chat_url', function(req, res){
		if(!req.session.user_id){
			on_session_fault_action();
			return;
		}
		var tmp_url = url.protocol + "//" + url.host;
		var server_addr = getChatProtocol() + '://' + getServerIp() + ':' + chat_port;
		res.writeHead(200, {"Content-Type" : "text/plain"});
		res.end(server_addr);
	});

	//base
	app.get('/', 
		function(req, res){
			res.render('index');
		});

	//process image request
	app.get('/img*',
		function(req, res){
			var file_path = req.query.file_path.replace(/\'/g, "");//make every single quater in file path blank
			var total_path = path.join(__dirname, "../views/" , file_path);//join path
			var ext = path.extname(file_path).replace(".", "");

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

	//show create member window
	app.get('/member_create', function(req, res){
		res.render("client/create_member");
	});

	//rendering user tab
	app.get('/user_tab', function(req, res){
		if(!req.session.user_id){
			on_session_fault_action(req, res);
			return;
		}
		res.render("client/user_tab", {id : req.session.user_id});
	});

	//rendering user_info
	app.get('/user_info', function(req, res){
		res.render("client/user_info", req.query);
	});

	//rendering chatting
	app.get('/chatting', function(req, res){
		if(!req.session.user_id){
			on_session_fault_action(req, res);
			return;
		}
		res.render("Chatting/chatting", {id : req.session.user_id});
	});

	//rendering chatting_main
	app.get('/chatting_main', function(req, res){
		res.render("Chatting/chatting_main");
	});

	app.get('/login_fail', function(req, res){
		res.render('client/login_fail');
	});

	app.get('/session_fault', function(req, res){
		res.render('client/session_lost');
	});

//################# POST ####################
	//login
	app.post('/signin', function(req, res){
		member.is_ext_mem(req.body, function(form, result){
			if(result){//if there is member
				req.session.user_id = form.id;
				res.writeHead(302, {"Content-Type":"text/plain", "Location":"/chatting"});
				res.end();
			}else{//there is no member
				res.writeHead(302, {"Content-Type":"text/plain", "Location":"/login_fail"});
				res.end();
			}
		});
	});

	//logout
	app.post('/signout', function(req, res){
		req.session.destroy();
		res.clearCookie('sessionkey');
	});

	//process member create request in post method
	app.post('/member_create', function(req, res){
		member.member_create(req.body, function(form, result){
			res.writeHead(200, {"Content-Type":"text/plain"});
			res.end(JSON.stringify({result : result.toString()}));
		});
	});

	//if request is valid, then return user information
	app.post('/member_info', function(req, res){
		if(!req.session.user_id){
			on_session_fault_action(req, res);
			return;
		}
		member.getUserInfo({id : req.session.user_id}, function(form, result){
			res.writeHead(200, {"Content-Type" : "text/plain"});
			res.end(JSON.stringify({result : result}));
		});
	});

	//update user information
	app.post('/member_update', function(req, res){
		if(!req.session.user_id){
			on_session_fault_action(req, res);
			return;
		}
		member.member_update(req.body, function(form, result){
			res.writeHead(200, {"Content-Type" : "text/plain"});
			res.end(JSON.stringify({result : result.toString()}));
		});
	});	
}