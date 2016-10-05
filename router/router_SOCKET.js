module.exports = function(io, client_socket_ids){
	var member = require('../DB/db_member');
	var mem_meta = require('../DB/db_member_meta');
	var friend_list = require('../DB/db_friend_list');
	var chat_room = require('../DB/db_chat_room');
	var room_joined = require('../DB/db_room_joined');
	var room_invite = require('../DB/db_room_invite');

	var crypto = require('crypto');

	var onInvalidConnect = function(invalid_sock){
		var ret = {
			action : 'delete',
			value : {
				call : 'invalid_connect'
			}
		};
		invalid_sock.json.emit('server_connect', ret);
	};

	io.on('connect', function(socket){
		socket.on('client_connect', function(msg){
			//client connect
			switch(msg.action){
				case 'create':
				{
					/*
					output
						{
							action : 'response',
							value : {
								call : 'c_connect',
								result : 
									0 : no member
									1 : exist member, not online
									2 : exist member, online 
									3 : error
							}
						}
					*/
					var id = msg.value.id.trim().toLowerCase();
					var password = msg.value.password.trim().toLowerCase();
					member.is_ext_mem({
						id : id,
						password : password
					}, function(result){
						switch(result.result){
							case 0://no member
							{
								var ret = {
									action : 'response',
									value : {
										call : 'c_connect',
										result : 0
									}
								};
								socket.json.emit('server_connect', ret);
							}
							return;
							case 1://ext member
							{
								mem_meta.member_meta_isOnline({
									id : id
								}, function(result1){
									switch(result1.result){
										case 0://not online
										{
											mem_meta.update_memberMetaOnLogin({
												id : id
											}, function(result2){
												switch(result2.result){
													case 0://fail log this info
													break;
													case 1://success
													client_socket_ids.set(id, socket.id);//enroll this client at server client table
													socket.user_id = id;
													break;
												}
												var ret = {
													action : 'response',
													value : {
														call : 'c_connect',
														result : result2.result
													}
												};
												socket.json.emit('server_connect', ret);
											});
										}
										break;
										case 1://online
										{
											//사전에 접속한 유저의 연결을 차단
											var ret = {
												action : 'delete',
												value : {
													call : 'new_connect'
												}
											};
											var target_sock = io.sockets.sockets[client_socket_ids.get(id)];
											if(typeof target_sock != 'undefined'){
												target_sock.json.emit('server_connect', ret);
												target_sock.user_id = undefined;
											}

											client_socket_ids.remove(id);
											client_socket_ids.set(id, socket.id);//enroll this client at server client table
											socket.user_id = id;
											ret = {
												action : 'response',
												value : {
													call : 'c_connect',
													result : 2
												}
											};
											socket.json.emit('server_connect', ret);
										}
										break;
										case 2://error
										{
											var ret = {
												action : 'response',
												value : {
													call : 'c_connect',
													result : 3
												}
											};
											socket.json.emit('server_connect', ret);
										}
										return;
									}

									member.read_member({
										id : id
									}, function(result2){
										switch(result2.result){
											case 0://fail log this info
											return;
											case 1:
											break;
										}
										socket.user_nick = result2.data.nickname;

										friend_list.read_friendList({
											id : id
										}, function(result3){
											switch(result3.result){
												case 0://error log this error
												return;
												case 1://success
												break;
											}

											for(var i in result3.data){
												(function(i){
													process.nextTick(function(){
														if(client_socket_ids.has(result3.data[i].fid)){//if fid socket is connected
															var ret = {
																action : 'update',
																value : {
																	friend_id : id,
																	friend_nick : result2.data.nickname,
																	isOnline : 1
																}
															};
															io.sockets.sockets[client_socket_ids.get(result3.data[i].fid)].json.emit('server_friend', ret);
														}
													});
												})(i);
											}
										});
									});
								});
							}
							break;
							case 2://error
							{
								var ret = {
									action : 'response',
									value : {
										call : 'c_connect',
										result : 3
									}
								};
								socket.json.emit('server_connect', ret);
							}
							break;
						}
					});
				}
				break;
				case 'update':
				{

				}
				break;
			}
		});

		socket.on('client_member', function(msg){
			if(!client_socket_ids.has(socket.user_id)){
				onInvalidConnect(socket);
				socket.disconnect(true);
				return;
			}

			switch(msg.action){
				case 'create':
				{

				}
				break;
				case 'read':
				{
					/*
					output
						{
							action : 'response',
							value : {
								call : 'r_member',
								target_id : r'1,
								result : 
									0 : fail
									1 : success,
								data : {
									id : r1,
									nickname : r2,
									name : r3,
									cdate : r4
								}
							}
						}
					*/
					mem_meta.read_detailMemberMeta({
						id : socket.user_id
					}, function(result){
						result.call = 'r_member';
						result.target_id = socket.user_id
						var ret = {
							action : 'response',
							value : result
						};
						socket.json.emit('server_member', ret);
					});
				}
				break;
				case 'update':
				{
					/*
					input
						{
							action : 'update',
							value : {
								nickname : d1,
								name : d2
							}
						}
					output
						{
							action : 'response',
							value : {
								call : 'u_member',
								result : r1,
								target_id : r'1
							}
						}
					*/
					var nick = msg.value.nickname.trim();
					var name = msg.value.name.trim();
					member.update_member({
						id : socket.user_id,
						nickname : nick,
						name : name
					}, function(result){
						var ret = {
							action : 'response',
							value : {
								call : 'u_member',
								result : result.result,
								target_id : socket.user_id
							}
						};
						socket.json.emit('server_member', ret);
					});
				}
				break;
				case 'delete':
				{

				}
				break;
			}
		});

		socket.on('client_friend', function(msg){
			if(!client_socket_ids.has(socket.user_id)){
				onInvalidConnect(socket);
				socket.disconnect(true);
				return;
			}

			switch(msg.action){
				case 'create':
				{

				}
				break;
				case 'read':
				{
					/*
					output
						{
							action:'response',
							value : {
								call : 'r_friend',
								result : 
									0 : fail
									1 : success
								data : [
									{friend_id : r1, isOnline : r'1}
									...
								]	
							}
						}
					*/
					friend_list.read_friendListWithStatus({
						id : socket.user_id
					}, function(result){
						switch(result.result){
							case 0://fail
							{
								var ret = {
									action : 'response',
									value : {
										call : 'r_friend',
										result : result.result
									}
								};
								socket.json.emit('server_friend', ret);
							}
							break;
							case 1://success
							{
								var ret = {
									action : 'response',
									value : {
										call : 'r_friend',
										result : result.result,
										data : result.data
									}
								};
								socket.json.emit('server_friend', ret);
							}
							break;
						}
					});
				}
				break;
				case 'update':
				{

				}
				break;
				case 'delete':
				{
					/*
					input
						{
							action : 'delete',
							value : {
								friend_id : d1
							}
						}
					output
						{
							action : 'response',
							value : {
								call : 'd_friend',
								result : 
									0 : fail
									1 : success
								friend_id : r1
							}
						}
					*/
					var target_id = msg.value.friend_id.trim().toLowerCase();

					if(target_id == socket.user_id){
						var ret = {
							action : 'response',
							value : {
								call : 'd_friend',
								friend_id : target_id,
								result : 0
							}
						};
						socket.json.emit('server_friend', ret);
						return;
					}

					friend_list.delete_friend({
						id1 : socket.user_id,
						id2 : target_id
					}, function(result){
						if(client_socket_ids.has(target_id)){
							var ret = {
								action : 'delete',
								value : {
									friend_id : socket.user_id
								}
							};
							io.sockets.sockets[client_socket_ids.get(target_id)].json.emit('server_friend', ret);
						}
						var ret = {
							action : 'response',
							value : {
								call : 'd_friend',
								result : result.result,
								friend_id : target_id
							}
						};
						socket.json.emit('server_friend', ret);
					});
				}
				break;
			}
		});

		socket.on('client_friendRequest', function(msg){
			if(!client_socket_ids.has(socket.user_id)){
				onInvalidConnect(socket);
				socket.disconnect(true);
				return;
			}

			switch(msg.action){
				case 'create':
				{
					/*
					output
						{
							action : 'response',
							value : {
								call : 'c_friendRequest',
								friend_id : d1
								result : 
									0 : there is already friend request or already friend
									1 : success
									2 : error
							}	
						}
					*/
					var target_id = msg.value.friend_id.trim().toLowerCase();

					if(socket.user_id == target_id){
						var ret = {
							action : 'response',
							value : {
								call : 'c_friendRequest',
								friend_id : target_id,
								result : 0
							}
						};
						socket.json.emit('server_friendRequest', ret);
						return;
					}else{
						friend_list.read_hasFriendRequest({
							id1 : target_id,
							id2 : socket.user_id
						}, function(result1){
							switch(result1.result){
								case 0://not friend and friend request
								{
									friend_list.create_friendRequest({
										from_id : socket.user_id,
										to_id : target_id
									}, function(result){
										var ret = {
											action : 'response',
											value : {
												call : 'c_friendRequest',
												friend_id : target_id,
												result : result.result
											}
										};
										socket.json.emit('server_friendRequest', ret);
										if(client_socket_ids.has(target_id)){
											var ret = {
												action : 'create',
												value : {
													friend_id : socket.user_id,
													friend_nick : socket.user_nick
												}
											};
											io.sockets.sockets[client_socket_ids.get(target_id)].json.emit('server_friendRequest', ret);
										}
									});
								}
								break;
								case 1://friend or friend request
								{
									var ret = {
										action : 'response',
										value : {
											call : 'c_friendRequest',
											friend_id : target_id,
											result : 0
										}
									};
									socket.json.emit('server_friendRequest', ret);
								}
								break;
								case 2://error, log this error
								{
									var ret = {
										action : 'response',
										value : {
											call : 'c_friendRequest',
											friend_id : target_id,
											result : 2
										}
									};
									socket.json.emit('server_friendRequest', ret);
								}
								break;
							}
						});
					}
				}
				break;

				case 'read':
				{
					friend_list.read_friendRequests({
						id : socket.user_id
					}, function(result){
						var ret = {
							action : 'response',
							value : {
								call : 'r_friendRequest',
								result : result.result,
								data : result.data
							}
						};
						socket.json.emit('server_friendRequest', ret);
					});
				}
				break;
				case 'update':
				{//accept friend request
					friend_list.update_friendRequest({
						from_id : msg.value.friend_id,
						to_id : socket.user_id
					}, function(result){
						switch(result.result){
							case 0://fail
							{
								var ret = {
									action : 'response',
									value : {
										call : 'u_friendRequest',
										result : result.result
									}
								};
								socket.json.emit('server_friendRequest', ret);
							}
							break;
							case 1://success
							{
								member.read_member({
									id : msg.value.friend_id
								}, function(result1){
									switch(result1.result){
										case 0://error
										break;
										case 1://success
										var isOn = client_socket_ids.has(msg.value.friend_id)?1:0;
										var ret = {
											action : 'response',
											value : {
												call : 'u_friendRequest',
												result : result.result,
												friend_id : msg.value.friend_id,
												friend_nick : result1.data.nickname,
												isOnline : isOn
											}
										};
										socket.json.emit('server_friendRequest', ret);
										break;
									}
								});
								
								if(client_socket_ids.has(msg.value.friend_id)){
									var target_sock = io.sockets.sockets[client_socket_ids.get(msg.value.friend_id)];
									var ret = {
										action : 'update',
										value : {
											friend_id : socket.user_id,
											friend_nick : socket.user_nick,
											isOnline : 1
										}
									};
									target_sock.json.emit('server_friendRequest', ret);
								}
							}
							break;
						}
					});
				}
				break;
				case 'delete':
				{//reject friend request
					friend_list.delete_friendRequest({
						from_id : msg.value.friend_id,
						to_id : socket.user_id
					}, function(result){
						var ret = {
							action : 'response',
							value : {
								call : 'd_friendRequest',
								result : result.result,
								friend_id : msg.value.friend_id
							}
						};
						socket.json.emit('server_friendRequest', ret);
					});
				}
				break;
			}
		});

		socket.on('client_room', function(msg){
			if(!client_socket_ids.has(socket.user_id)){
				onInvalidConnect(socket);
				socket.disconnect(true);
				return;
			}

			switch(msg.action){
				case 'create':
				{
					var room_id = crypto.createHash('sha256').update(new Date().format('yyyy-MM-dd HH:mm:ss') + socket.user_id).digest('hex');
					var room_title = msg.value.room_title;
					chat_room.create_NewRoom({
						room_id : room_id,
						room_title : room_title
					}, function(result){
						switch(result.result){
							case 0://fail
							{
								var ret = {
									action : 'response',
									value : {
										call : 'c_room',
										result : 0,
										room_title : room_title
									}
								};
								socket.json.emit('server_room', ret);
							}
							break;
							case 1://success
							{
								room_joined.create_roomJoined({
									room_id : room_id,
									id : socket.user_id,
								}, function(result1){
									switch(result1.result){
										case 0://fail
										{
											var ret = {
												action : 'response',
												value : {
													call : 'c_room',
													result : 0,
													room_title : room_title
												}
											};
											socket.json.emit('server_room', ret);

											chat_room.delete_Room({
												room_id : room_id
											}, function(result2){
												switch(result2.result){
													case 0://fail, log this error info
													{}
													break;
													case 1://success, do nothing
													{}
													break;
												}
											});
										}
										break;
										case 1://success
										{
											var ret = {
												action : 'response',
												value : {
													call : 'c_room',
													result : 1,
													room_id : room_id,
													room_title : room_title,
													members : [
														{member_id : socket.user_id, member_nick : socket.user_nick}
													]
												}
											};
											socket.json.emit('server_room', ret);
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
				case 'read':
				{
					room_joined.read_userJoinedRooms({
						id : socket.user_id
					}, function(result){
						switch(result.result){
							case 0://fail
							{
								var ret = {
									action : 'response',
									value : {
										call : 'r_room',
										result : 0
									}
								};
								socket.json.emit(ret);
							}
							break;
							case 1://success
							{
								var isAllDone = 0;
								result.data.forEach(function(element){
									room_joined.read_joinedMember({
										room_id : element.room_id
									}, function(result1){
										isAllDone++;
										switch(result1.result){
											case 0://fail
											{}
											break;
											case 1://success
											{
												element.members = result1.data;
											}
											break;
										}

										if(isAllDone == result.data.length){
												var ret = {
												action : 'response',
												value : {
													call : 'r_room', 
													result : 1,
													data : result.data
												}
											};
											socket.json.emit('server_room', ret);
										}	
									});
								});

							}
							break;
						}

					});
				}
				break;
				case 'update':
				{

				}
				break;
				case 'delete':
				{
					
				}
				break;
			}
		});

		socket.on('client_roomInvite', function(msg){
			if(!client_socket_ids.has(socket.user_id)){
				onInvalidConnect(socket);
				socket.disconnect(true);
				return;
			}

			switch(msg.action){
				case 'create':
				{//create room invitation
					/*
					output
						{
							action : 'response',
							value : {
								call : 'c_roomInvite',
								result : 
									0 : fail
									1 : success
							}
						}
					*/
					var target_id = msg.value.target_id.trim().toLowerCase();
					//check whether user request is valid or not
					room_joined.read_userJoined({
						user_id : socket.user_id,
						room_id : msg.value.room_id
					}, function(result){
						switch(result.result){
							case 0://not joined
							{
								var ret = {
									action : 'response',
									value : {
										call : 'c_roomInvite',
										result : 0,
										target_id : target_id
									}
								};
								socket.json.emit('server_roomInvite', ret);
							}
							break;
							case 1://joined => valid request
							{
								room_joined.create_roomInvitation({
									room_id : msg.value.room_id,
									user_id : target_id
								}, function(result1){
									var ret = {
										action : 'response',
										value : {
											call : 'c_roomInvite',
											result : result1.result,
											target_id : target_id
										}
									};
									socket.json.emit('server_roomInvite', ret);
									
									if(client_socket_ids.has(target_id)){
										chat_room.read_room({
											room_id : msg.value.room_id
										}, function(result2){
											switch(result2.result){
												case 0://fail, log this error
												{
												}
												break;
												case 1://success
												{
													if(client_socket_ids.has(target_id)){
														var target_sock = io.sockets.sockets[client_socket_ids.get(target_id)];
														if(typeof target_sock != 'undefined'){
															var ret1 = {
																action : 'create',
																value : {
																	room_id : msg.value.room_id,
																	room_title : result2.data.room_title,
																	from_nick : socket.user_nick
																}
															};
															target_sock.json.emit('server_roomInvite', ret1);
														}
													}
												}
												break;
											}
										});
									}
								});
							}
							break;
						}
					});
					console.log(JSON.stringify(msg));
				}
				break;
				case 'read':
				{
					room_joined.read_userUnjoinedRooms({
						id : socket.user_id
					}, function(result){
						var ret;
						switch(result.result){
							case 0://fail
							{
								ret = {
									action : 'response',
									value : {
										call : 'r_roomInvite',
										result : 0
									}
								};
							}
							break;
							case 1://success
							{
								ret = {
									action : 'response',
									value : {
										call : 'r_roomInvite',
										result : 1,
										data : result.data
									}
								};
							}
							break;
						}
						socket.json.emit('server_roomInvite', ret);
					});
				}
				break;
				case 'update':
				{

				}
				break;
				case 'delete':
				{
					
				}
				break;
			}
		});

		socket.on('client_chat', function(msg){
			if(!client_socket_ids.has(socket.user_id)){
				onInvalidConnect(socket);
				socket.disconnect(true);
				return;
			}

			switch(msg.action){
				case 'create':
				{

				}
				break;
				case 'read':
				{

				}
				break;
				case 'update':
				{

				}
				break;
				case 'delete':
				{
					
				}
				break;
			}
		});

		socket.on('disconnect', function(msg){
			if(!client_socket_ids.has(socket.user_id)){
				onInvalidConnect(socket);
				socket.disconnect(true);
				return;
			}

			var target_id = socket.user_id;
			if(target_id == undefined)
				return;

			console.log('disconnect id : ' + target_id);

			friend_list.read_friendList({
				id : target_id
			}, function(result1){
				switch(result1.result){
					case 0://fail, log this info
					console.log('read friendList error');
					return;
					case 1://success
					break;
				}
				for(var i in result1.data){
					(function(i){
						process.nextTick(function(){
							if(client_socket_ids.has(result1.data[i].fid)){//if fid socket is connected
								var ret = {
									action : 'update',
									value : {
										friend_id : target_id,
										friend_nick : socket.user_nick,
										isOnline : 0
									}
								};
								io.sockets.sockets[client_socket_ids.get(result1.data[i].fid)].json.emit('server_friend', ret);
							}
						});
					})(i);
				}
			});
			mem_meta.update_memberMetaOnLogout({
				id : socket.user_id
			}, function(result){
				switch(result){
					case 0://fail, log this info
						console.log('fail disconnect id : ' + socket.user_id);
					break;
					case 1://success
					break;
				}
			});

			client_socket_ids.remove(socket.user_id);
			socket.user_id = undefined;
		});
	});
}