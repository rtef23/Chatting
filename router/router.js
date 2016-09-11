module.exports = function(app){
	var chat_port = 3100;
	var fs = require("fs");
	var path = require("path");
	var bodyParser = require("body-parser");
	var member = require("../DB/db_member");
	var mem_meta = require("../DB/db_mem_meta");
	var friend_list = require("../DB/db_friend_list");
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
	
	io.on('connection', function(socket){
		console.log("connection allowed");

		socket.on('get_friend_list_with_status', function(msg){
				console.log("msg : " + msg);

				socket.emit('update_friend_list', JSON.stringify("result"));
		});
	});

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
		/*
		output
			{
				result : 
					0 : fail in connecting to chatting server
					1 : success in connecting to chatting server
				,chat_url : 
					data1
			}
		*/
		if(!req.session.user_id){
			on_session_fault_action();
			return;
		}
		var tmp_url = url.protocol + "//" + url.host;
		var chat_addr = getChatProtocol() + '://' + getChatServerIPAddr() + ':' + getChatServerPort();
		var result;

		result = {
			result : 1,
			chat_url : chat_addr
		};
		res.writeHead(200, {"Content-Type" : "text/plain"});
		res.end(JSON.stringify(result));
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
		res.render('error_action/login_fail');
	});

	app.get('/session_fault', function(req, res){
		res.render('error_action/session_lost');
	});

	app.get('/error_on_server', function(req, res){
		res.render('error_action/error_on_server');
	});
//################# POST ####################
	//login
	app.post('/signin', function(req, res){
		member.is_ext_mem(req.body, function(result){
			switch(result.result){
				case 0://if there is no member
					{
						res.writeHead(302, {"Content-Type":"text/plain", "Location":"/login_fail"});
						res.end();
					}
					break;
				case 1://there is member
					{
						mem_meta.member_meta_update_onLogin({
							id : req.body.id
						}, function(result){
							switch(result.result){
								case 0://fail in updating
								{
									res.writeHead(302, {"Content-Type":"text/javascript", "Location" : '/error_on_server'});
									res.end();
								}
								break;
								case 1://success in updating
								{	
									req.session.user_id = req.body.id;
									res.writeHead(302, {"Content-Type":"text/javascript", "Location" : '/chatting'});
									res.end();
								}
								break;
							}
						});
					}
					break;
				case 2://error
					{
						res.writeHead(302, {"Content-Type":"text/javascript", "Location" : '/error_on_server'});
						res.end();
					}
					break;
			}
		});
	});

	//logout
	app.post('/signout', function(req, res){
		mem_meta.member_meta_update_onLogout({id : req.session.user_id}, function(result){
			switch(result.result){
				case 0://fail in logout, log this id
				{//do logging
				}
				break;
				case 1://success in logout
				{//do nothing
				}
				break;
			}
			req.session.destroy();
			res.clearCookie('sessionkey');
		});
	});

	//process member create request in post method
	app.post('/member_create', function(req, res){
		/*
		output
			{
				result : 
					0 : success in creating member
					1 : already exist member
					2 : error
			}
		*/
		member.is_ext_id({id : req.body.id}, function(result1){
			switch(result1.result){
				case 0://if there is no id
					{
						member.member_create({
							id : req.body.id,
							password : req.body.password,
							nickname : req.body.nickname,
							name : req.body.name
						}, function(result1){
							switch(result1.result){
								case 0://error
									{
										res.writeHead(200, {"Content-Type" : "text/plain"});
										res.end(JSON.stringify({result : 2}));
									}
									break;
								case 1://success in creating
									{
										mem_meta.member_meta_create({
											id : req.body.id}, function(result2){
												switch(result2.result){
													case 0://fail in creating meta info
													{
														member.member_delete({
															id : req.body.id,
															password : req.body.password
														}, function(result3){
															switch(result3.result){
																case 0://fail in delete member ==> log this id, password
																{//logging
																}
																break;
																case 1://success in delete member
																{//do nothing
																}
																break;
															}
															res.writeHead(200, {"Content-Type" : "text/plain"});
															res.end(JSON.stringify({result : 2}));
														});
													}
													break;
													case 1://success in creating meta info
													{
														res.writeHead(200, {"Content-Type" : "text/plain"});
														res.end(JSON.stringify({result : 0}));
													}
													break;
												}
											});
									}
									break;
							}
						});
					}
					break;
				case 1://if there is id
					{
						res.writeHead(200, {"Content-Type" : "text/plain"});
						res.end(JSON.stringify({result : 1}));
					}
					break;
				case 2://error
					{
						res.writeHead(200, {"Content-Type" : "text/plain"});
						res.end(JSON.stringify({result : 2}));
					}
					break;
			}
		});
	});

	//if request is valid, then return user information
	app.post('/member_info', function(req, res){
		/*
		input
			{
				id : data1
			}
		output
			{
				result : 
					0 : error
					1 : if success in get info
				data : {
					id : d1,
					nickname : d2,
					name : d3
				}
			}
		*/
		if(!req.session.user_id){
			on_session_fault_action(req, res);
			return;
		}
		member.get_member_info({id : req.session.user_id}, function(result){
			res.writeHead(200, {"Content-Type" : "text/plain"});
			res.end(JSON.stringify(result));
		});
	});

	//update user information
	app.post('/member_update', function(req, res){
		if(!req.session.user_id){
			on_session_fault_action(req, res);
			return;
		}
		member.member_update(req.body, function(result){
			res.writeHead(200, {"Content-Type" : "text/plain"});
			res.end(JSON.stringify(result));
		});
	});	
}