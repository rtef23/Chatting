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
	
	var clients = [];
	var clients_ids = [];

	io.on('connect', function(socket){
		socket.on('client_request_newUser', function(msg){
			if(socket.user_id)
				return;

			var msg_data = JSON.parse(msg);
			if(typeof msg_data.id =='undefined' || typeof msg_data.password == 'undefined')//check valid form
				return;

			var id = msg_data.id.trim().toLowerCase();
			var password = msg_data.password.trim().toLowerCase();

			member.is_ext_mem({
				id : id,
				password : password
			}, function(result1){
				switch(result1.result){
					case 0://no member
					case 2://error
						socket.emit('server_response_newUser', JSON.stringify(result1));
					return;
					case 1://valid member
					{
						mem_meta.member_meta_isOnline({
							id : id
						}, function(result2){
							switch(result2.result){
								case 0://not online member
								break;
								case 1://online member
								socket.emit('server_response_newUser', JSON.stringify({result : 0}));
								return;
								case 2://error
								socket.emit('server_response_newUser', JSON.stringify(result2));
								return;
							}
							mem_meta.member_meta_update_onLogin({//update meta info
								id : id
							},function(result3){
								switch(result3.result){
									case 0://fail
										socket.emit('server_response_newUser', JSON.stringify(result3));
									return;
									case 1://success
										socket.emit('server_response_newUser', JSON.stringify(result3));
										clients[id] = socket.id;
										clients_ids[socket.id] = id;
										socket.user_id = id;
									break;
								}

								friend_list.get_friend_list({
									id : id
								}, function(result3){
									switch(result3.result){
										case 0://fail
										break;
										case 1://success
										{
											for(var i in result3.data){
												if(typeof clients[result3.data[i].fid] != 'undefined'){
													process.nextTick((function(num){
														return function(){
															var sock = io.sockets.sockets[clients[result3.data[num].fid]];
															sock.emit('server_change_friendList');
														}
													})(i));
												}
											}
										}
										break;
									}
								});


							});
						});
					}
					break;
				}
			})
		});

		socket.on('disconnect', function(){
			console.log('disconnect ' + socket.user_id);
			
			if(!socket.user_id)
				return;

			mem_meta.member_meta_update_onLogout({id : socket.user_id}, function(result){
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
			});

			friend_list.get_friend_list({id : socket.user_id}, function(result3){
				switch(result3.result){
					case 0://fail
					break;
					case 1://success
					for(var i in result3.data){
						if(typeof clients[result3.data[i].fid] != "undefined"){//check whether this member is online or not
							process.nextTick((function(num){
								return function(){
									friend_list.get_friend_list_with_status({id : result3.data[num].fid}, function(result4){
										var sock = io.sockets.sockets[clients[result3.data[num].fid]];
										sock.emit('server_change_friendList', JSON.stringify(result4));
									});
								}
							})(i));
						}
					}
					break;
				}
			});
			delete clients[socket.user_id];
		});
		socket.on('client_request_ID', function(){
			if(!socket.user_id)
				return;
			socket.emit('server_response_ID', JSON.stringify({id : socket.user_id}));
		});

		socket.on('client_request_friendList', function(){
			if(!socket.user_id)
				return;
			//request friend list
			friend_list.get_friend_list_with_status({
				id : socket.user_id
			}, function(result2){
				var sock = io.sockets.sockets[clients[socket.user_id]];
				sock.emit('server_response_friendList', JSON.stringify(result2));
			});
		});

		socket.on('client_request_friendRequestNum', function(){
			if(!socket.user_id)
				return;
			friend_list.get_friendRequestNum({
				to_id : socket.user_id
			}, function(result){
				socket.emit('server_response_friendRequestNum', JSON.stringify(result));
			});
		});

		socket.on('client_request_friendRequests', function(){
			if(!socket.user_id)
				return;
			friend_list.get_friendRequests({
				id : socket.user_id
			}, function(result){
				socket.emit('server_response_friendRequests', JSON.stringify(result));
			});
		});

		socket.on('client_add_friendRequest', function(msg){
			//add friend request
			/*
			input
				{
					nfid : d1
				}
			output
				{
					result :
						0 : fail
						1 : success
						2 : error
				}
			*/
			if(!socket.user_id)
				return;
			var msg_data = JSON.parse(msg);
			if(typeof msg_data.nfid == 'undefined')//check form valid
				return;

			var result;
			var nfid = msg_data.nfid.trim().toLowerCase();
			if(nfid == socket.user_id.trim().toLowerCase()){
				result = {result : 0};
				socket.emit('server_response_addFriendRequest', JSON.stringify(result));
				return;
			}

			friend_list.insert_friend_list({
				from_id : socket.user_id,
				to_id : nfid
			}, function(result){
				socket.emit('server_response_addFriendRequest', JSON.stringify(result));
				if(typeof clients[nfid] != 'undefined'){
					//if target user is online, occur event
					io.sockets.sockets[clients[nfid]].emit('server_update_friendRequestNum');
				}
			});
		});

		socket.on('client_action_onFriendRequest', function(msg){
			/*
			input
				{
					action : 
						accept
						reject ,
					from_id : 
						d1
				}
			output
				{
					result : 
						0:
						1:
					from_id : r1,
					to_id : r2
					action : 
						accept
						reject
				}
			*/
			if(!socket.user_id)
				return;
			var msg_data = JSON.parse(msg);
			
			if(typeof msg_data.action == 'undefined' || typeof msg_data.from_id == 'undefined')//form valid check
				return;

			var action = msg_data.action.trim().toLowerCase();
			var from_id = msg_data.from_id.trim().toLowerCase();

			if(action == 'accept'){
				//타인의 친구 요청에 수락했을때 수행되는 함수
				friend_list.update_friendRequest({
					from_id : from_id,
					to_id : socket.user_id
				}, function(result){
					result.from_id = from_id;
					result.to_id = socket.user_id;
					result.action = 'accept';
					socket.emit('server_response_actionFriendRequest', JSON.stringify(result));
					if(clients[from_id]){
						var sock = io.sockets.sockets[clients[from_id]];
						sock.emit('server_change_friendList');
					}
				});
			}else if(action == 'reject'){
				//타인의 친구 요청을 거부 했을 때 수행되는 함수
				friend_list.delete_friendRequest({
					from_id : from_id,
					to_id : socket.user_id
				}, function(result){
					result.from_id = from_id;
					result.to_id = socket.user_id;
					result.action = 'reject';
					socket.emit('server_response_actionFriendRequest', JSON.stringify(result));
				});
			}
		});
		
		socket.on('client_remove_friend', function(msg){
			console.log('client remove friend');
			if(!socket.user_id)
				return;
			var msg_data = JSON.parse(msg);
			if(typeof msg_data.id == 'undefined')
				return;
			var id1 = socket.user_id.trim().toLowerCase();
			var id2 = msg_data.id.trim().toLowerCase();
			if(id1 == id2)
				return;
			friend_list.remove_friend({
				id1 : id1,
				id2 : id2
			}, function(result){
				socket.emit('server_response_removeFriend', JSON.stringify(result));
				if(clients[id2]){
					var sock = io.sockets.sockets[clients[id2]];
					sock.emit('server_change_friendList');
				}
				socket.emit('server_change_friendList');
			});
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
			res.render('Chatting/chatting');
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

	app.get('/friend_request_list', function(req, res){
		res.render('client/friend_request_list');
	});

	app.get('/friend_request_card', function(req, res){
		res.render('client/friend_request_card');
	});

	//show create member window
	app.get('/member_create', function(req, res){
		res.render("client/create_member");
	});

	app.get('/friend_list', function(req, res){
		res.render('client/friend_list');
	});

	//rendering user tab
	app.get('/user_tab_login', function(req, res){
		res.render("client/user_tab_login");
	});

	app.get('/user_tab_unlogin', function(req, res){
		res.render('client/user_tab_unlogin');
	});

	//rendering user_info
	app.get('/user_info', function(req, res){
		res.render("client/user_info");
	});

	//rendering chatting
	app.get('/chatting', function(req, res){
		res.render("Chatting/chatting");
	});

	app.get('/friend_card', function(req, res){
		res.render('client/friend_card');
	});

	//rendering chatting_main
	app.get('/chatting_main', function(req, res){
		res.render("Chatting/chatting_main");
	});

	app.get('/room_list', function(req, res){
		res.render('Chatting/room_list');
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

	app.get('/friend_info/', function(req, res){
		var uri = req.url;
		var query = url.parse(uri, true).query;
		res.render('client/friend_card_info');
	});

	app.get('/room_invitation_list', function(req, res){
		res.render('Chatting/room_request_list');
	});
//################# POST ####################
	//process member create request in post method
	app.post('/member_create', function(req, res){
		/*
		input
			{
				id : d1,
				password : d2,
				nickname : d3,
				name : d4
			}
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
		member.get_member_info({id : req.body.id}, function(result){
			res.writeHead(200, {"Content-Type" : "text/plain"});
			res.end(JSON.stringify(result));
		});
	});

	//update user information
	app.post('/member_update', function(req, res){
	/*
	input
		{
			id : data1,
			password : data2,
			nickname : data3,
			name : data4
		}
	output
		{
			result : 
				0 : error
				1 : success
		}
	*/
		member.member_info_update(req.body, function(result){
			res.writeHead(200, {"Content-Type" : "text/plain"});
			res.end(JSON.stringify(result));
		});
	});	
}