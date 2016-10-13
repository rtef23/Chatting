module.exports = function(io, online_user){
	var member = require('../DB/db_member');
	var mem_meta = require('../DB/db_member_meta');
	var friend_list = require('../DB/db_friend_list');
	var chat_room = require('../DB/db_chat_room');
	var room_joined = require('../DB/db_room_joined');
	var room_invite = require('../DB/db_room_invite');
	var HashMap = require('hashmap');

	var crypto = require('crypto');

	/*
	input
		Key : String(64 characters) which is socket id
		Value : {
			user_id : d1
		}
	*/
	var socket_ids = new HashMap();

	var onInvalidConnect = function(invalid_sock){
		if(!socket_ids.has(invalid_sock.id))
			return;
		var invalid_info = online_user.get(socket_ids.get(invalid_sock.id));
		console.log('at invalid connect\nuser_id : ' + socket_ids.get(invalid_sock.id).user_id + '\tuser_nick : ' + invalid_info.user_nick);
		var ret = {
			action : 'delete',
			value : {
				call : 'invalid_connect'
			}
		};
		invalid_sock.json.emit('server_connect', ret);
		invalid_sock.disconnect(true);
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
								request_id : r1
							}
						}
					*/
					var id = msg.value.id.trim().toLowerCase();
					var password = msg.value.password.trim().toLowerCase();
					member.is_ext_mem({//check whether user is exist or not
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
								socket.disconnect(true);
							}
							return;
							case 1://ext member
							{
								var ret = {
									action : 'response',
									value : {
										call : 'c_connect',
										result : 1,
										request_id : id
									}
								};

								if(online_user.has(id)){//if user state is online
									//사전에 접속한 유저의 연결을 차단
									var ret1 = {
										action : 'delete',
										value : {
											call : 'new_connect'
										}
									};

									var target_user_info = online_user.get(id);
									var target_sock = io.sockets.sockets[target_user_info.socket_id];

									console.log('ban already connected user');
									if(typeof target_sock != 'undefined'){
										target_sock.json.emit('server_connect', ret1);
										target_sock.disconnect(true);
									}

									socket_ids.remove(target_user_info.socket_id);
									online_user.remove(id);

									ret.value.result = 2;
								}
								
								member.read_member({//read member info
									id : id
								}, function(result1){
									switch(result1.result){
										case 0://error, fail
										{
											ret.value.result = 3;
											socket.json.emit('server_connect', ret);
											socket.disconnect(true);
										}
										break;
										case 1://success
										{
											var new_info = {
												user_nick : result1.data.nickname,
												socket_id : socket.id
											};

											online_user.set(id, new_info);
											socket_ids.set(socket.id, {
												user_id : id
											});
											socket.json.emit('server_connect', ret);

											friend_list.read_friendList({
												id : id
											}, function(result2){
												switch(result2.result){
													case 0://fail reading friend_list
													{//log this error
													}
													break;
													case 1://success reading
													{
														var ret2 = {
															action : 'update',
															value : {
																friend_id : id,
																friend_nick : online_user.get(id).user_nick,
																isOnline : 1
															}
														};
														for(var i in result2.data){
															(function(i){
																process.nextTick(function(){
																	if(online_user.has(result2.data[i].fid)){//if fid socket is connected
																		var target_user_info = online_user.get(result2.data[i].fid);
																		io.to(target_user_info.socket_id).json.emit('server_friend', ret2);
																	}
																});
															})(i);
														}//end for
													}
													break;
												}
											});
										}
										break;
									}
								});//member.read_member
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
								socket.disconnect(true);
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
			if(!socket_ids.has(socket.id)){
				onInvalidConnect(socket);
				return;
			}

			switch(msg.action){
				case 'create':
				{//inplemented at POST
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
					var user_id = socket_ids.get(socket.id).user_id;
					mem_meta.read_detailMemberMeta({
						id : user_id
					}, function(result){
						result.call = 'r_member';
						result.target_id = user_id
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
					var user_id = socket_ids.get(socket.id).user_id;
					var nick = msg.value.nickname.trim();
					var name = msg.value.name.trim();
					member.update_member({
						id : user_id,
						nickname : nick,
						name : name
					}, function(result){
						var ret = {
							action : 'response',
							value : {
								call : 'u_member',
								result : result.result,
								target_id : user_id
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
			if(!socket_ids.has(socket.id)){
				onInvalidConnect(socket);
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
					var user_id = socket_ids.get(socket.id).user_id;

					friend_list.read_friendListWithStatus({
						id : user_id
					}, function(result){
						switch(result.result){
							case 0://fail
							{
								var ret = {
									action : 'response',
									value : {
										call : 'r_friend',
										result : 0
									}
								};
								socket.json.emit('server_friend', ret);
							}
							break;
							case 1://success
							{
								var for_count = 0;

								for(var i in result.data){
									(function(i){
										process.nextTick(function(){
											for_count++;
											if(online_user.has(result.data[i].friend_id)){
												result.data[i].isOnline = 1;
											}else{
												result.data[i].isOnline = 0;
											}

											if(for_count == result.data.length){
												var ret = {
													action : 'response',
													value : {
														call : 'r_friend',
														result : 1,
														data : result.data
													}
												};
												socket.json.emit('server_friend', ret);
											}
										});
									})(i);
								}
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
					var user_id = socket_ids.get(socket.id).user_id;

					console.log('target_id : ' + target_id);


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
						id1 : user_id,
						id2 : target_id
					}, function(result){
						if(online_user.has(target_id)){
							var ret = {
								action : 'delete',
								value : {
									friend_id : user_id
								}
							};
							io.to(online_user.get(target_id).socket_id).json.emit('server_friend', ret);
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
			if(!socket_ids.has(socket.id)){
				onInvalidConnect(socket);
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
					var user_id = socket_ids.get(socket.id).user_id;
					var user_info = online_user.get(user_id);

					if(user_id == target_id){
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
							id2 : user_id
						}, function(result1){
							switch(result1.result){
								case 0://not friend and friend request
								{
									friend_list.create_friendRequest({
										from_id : user_id,
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
										if(online_user.has(target_id)){
											var ret = {
												action : 'create',
												value : {
													friend_id : user_id,
													friend_nick : user_info.user_nick
												}
											};
											io.to(online_user.get(target_id).socket_id).json.emit('server_friendRequest', ret);
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
					var user_id = socket_ids.get(socket.id).user_id;

					friend_list.read_friendRequests({
						id : user_id
					}, function(result){
						switch(result.result){
							case 0://fail
							{
								var ret = {
									action : 'response',
									value : {
										call : 'r_friendRequest',
										result : 0
									}
								};
								socket.json.emit('server_friendRequest', ret);
							}
							break;
							case 1://success
							{
								var ret = {
									action : 'response',
									value : {
										call : 'r_friendRequest',
										result : 1,
										data : result.data
									}
								};
								socket.json.emit('server_friendRequest', ret);
							}
							break;
						}
					});
				}
				break;
				case 'update':
				{//accept friend request
					var user_id = socket_ids.get(socket.id).user_id;

					friend_list.update_friendRequest({
						from_id : msg.value.friend_id,
						to_id : user_id
					}, function(result){
						switch(result.result){
							case 0://fail
							{
								var ret = {
									action : 'response',
									value : {
										call : 'u_friendRequest',
										result : 0
									}
								};
								socket.json.emit('server_friendRequest', ret);
							}
							break;
							case 1://success
							{
								if(online_user.has(msg.value.friend_id)){//if request friend is online
									var friend_info = online_user.get(msg.value.friend_id);

									var ret = {
										action : 'response',
										value : {
											call : 'u_friendRequest',
											result : 1,
											friend_id : msg.value.friend_id,
											friend_nick : friend_info.user_nick,
											isOnline : 1
										}
									};

									socket.json.emit('server_friendRequest', ret);

									var accept_user_id = socket_ids.get(socket.id).user_id;
									var accept_user_info = online_user.get(accept_user_id);
									var ret1 = {
										action : 'update',
										value : {
											friend_id : accept_user_id,
											friend_nick : accept_user_info.user_nick,
											isOnline : 1
										}

									};
									io.to(friend_info.socket_id).json.emit('server_friendRequest', ret1);
								}else{//request user is offline
									member.read_member({
										id : msg.value.friend_id
									}, function(result1){
										switch(result1.result){
											case 0://error
											break;
											case 1://success
											var ret = {
												action : 'response',
												value : {
													call : 'u_friendRequest',
													result : result.result,
													friend_id : msg.value.friend_id,
													friend_nick : result1.data.nickname,
													isOnline : 0
												}
											};
											socket.json.emit('server_friendRequest', ret);
											break;
										}
									});	
								}
							}
							break;
						}
					});
				}
				break;
				case 'delete':
				{//reject friend request
					var user_id = socket_ids.get(socket.id).user_id;

					friend_list.delete_friendRequest({
						from_id : msg.value.friend_id,
						to_id : user_id
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
			if(!socket_ids.has(socket.id)){
				onInvalidConnect(socket);
				return;
			}

			switch(msg.action){
				case 'create':
				{
					/*
					{
						action : 'response',
						value : {
							call : 'c_room',
							result
								0 : fail
								1 : success
						}
					}
					*/
					var room_id = crypto.createHash('sha256').update(new Date().format('yyyy-MM-dd HH:mm:ss') + socket.user_id).digest('hex');
					var room_title = msg.value.room_title;
					var user_id = socket_ids.get(socket.id).user_id;
					var user_info = online_user.get(user_id);
					
					chat_room.create_room({
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
										room_title : room_title,
										result : 0
									}
								};
								socket.json.emit('server_room', ret);
							}
							break;
							case 1://success
							{
								//bind request user and created room
								room_joined.create_roomJoin({
									room_id : room_id,
									user_id : user_id
								}, function(result1){
									switch(result1.result){
										case 0://fail
										{//send fail message
											var ret = {
												action : 'response',
												value : {
													call : 'c_room',
													room_title : room_title,
													result : 0
												}
											};
											socket.json.emit('server_room', ret);
											//delete created room
											chat_room.delete_room({
												room_id : room_id
											}, function(result2){
												switch(result2.result){
													case 0://fail, log this room error
													{
													}
													break;
													case 1://success, do nothing
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
													room_title : room_title,
													room_id : room_id,
													members : [{
														member_id : user_id,
														member_nick : user_info.user_nick
													}],
													result : 1
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
				{/*
				input
					{
						action : 'read',
						value : {
							target : 
								'single' : read single room,
								'all' : read multiple rooms
						}
					}
				*/
					switch(msg.value.target){
						case 'single':
						{//read room which user joined
							/*
							output
								{
									action : 'response',
									value : {
										call : 'r_room_single',
										room_id : r1,
										room_title : r'1,
										result :
											0 : fail
											1 : success,
										members : [
											{member_id : m1, member_nick : m'1},
											...
										]
									}
								}
							*/
							var req_id = socket_ids.get(socket.id).user_id;
							var room_id = msg.value.room_id;
							room_joined.read_userJoined({
								room_id : room_id,
								user_id : req_id
							}, function(result){
								switch(result.result){
									case 0://invalid request
									{
										var ret = {
											action : 'response',
											value : {
												call : 'r_room_single',
												room_id : room_id,
												room_title : 'unknown',
												result : 0
											}
										};
										socket.json.emit('server_room', ret);
									}
									break;
									case 1://valid request
									{
										chat_room.read_room({
											room_id : room_id
										}, function(result1){
											var ret = {
												action : 'response',
												value : {
													call : 'r_room_single',
													room_id : room_id,
													result : 1
												}
											};
											switch(result1.result){
												case 0://fail
												{
													ret.value.room_title = 'unknown';
												}
												break;
												case 1://success
												{
													ret.value.room_title = result1.data.room_title;
												}
												break;
											}

											room_joined.read_joinedMember({
												room_id : room_id
											}, function(result2){
												switch(result2.result){
													case 0://fail
													{
														ret.value.result = 0;
													}
													break;
													case 1://success
													{
														ret.value.members = result2.data;
													}
													break;
												}
												socket.json.emit('server_room', ret);
											});
										});
									}
									break;
								}
							});
						}
						break;
						case 'all':
						{//read every rooms which user joined
							/*
							output
								{
									action : 'response',
									value : {
										call : 'r_room_all',
										result : 
											0 : fail
											1 : success
										data : [
											{room_id : r1, room_title : r2, joined_member : {
																				result : 
																					0 : reading error
																					1 : success
																				,members : 
																					[{member_id : m1, member_nick : m'1},
																					 {member_id : m2, member_nick : m'2}
																					 ,...]}
											},
											...
										]
									}
								}
							*/
							var req_id = socket_ids.get(socket.id).user_id;

							room_joined.read_userJoinedRooms({
								id : req_id
							}, function(result){
								switch(result.result){
									case 0://error
									{
										var ret = {
											action : 'response',
											value : {
												call : 'r_room_all',
												result : 0
											}
										};
										socket.json.emit('server_room', ret);
									}
									break;
									case 1://success
									{
										/*
										output
											{
												action : 'response',
												value : {
													call : 'r_room_all',
													result : 1,
													data : [
														{room_id : r1, room_title : r'1, joined_member : {
															result :
																0 : fail,
																1 : success
															members : [
																{member_id : m1, member_nick : m'1},
																...
															]
														}},
														...
													]
												}
											}
										*/
										var process_count = 0;
										for(var i in result.data){
											(function(i){
												process.nextTick(function(){
													room_joined.read_joinedMember({
														room_id : result.data[i].room_id
													}, function(result1){
														result.data[i].joined_member = {
															result : result1.result,
															members : result1.data
														};
														process_count++;
														if(process_count == result.data.length){
															var ret = {
																action : 'response',
																value : {
																	call : 'r_room_all',
																	result : 1,
																	data : result.data
																}
															};
															socket.json.emit('server_room', ret);
														}
													});
												});
											})(i);
										}
									}
									break;
								}
							});
						}
						break;
					}
				}
				break;
				case 'update':
				{

				}
				break;
				case 'delete':
				{
					var room_id = msg.value.room_id;
					var user_id = socket_ids.get(socket.id).user_id;
					
					chat_room.read_room({
						room_id : room_id
					}, function(result){
						var ret;
						switch(result.result){
							case 0://fail
							{
								ret = {
									action : 'response',
									value : {
										call : 'd_room',
										room_id : room_id,
										room_title : 'unknown'
									}
								};
							}
							break;
							case 1://success
							{
								ret = {
									action : 'response',
									value : {
										call : 'd_room',
										room_id : room_id,
										room_title : result.data.room_title
									}
								};
							}
							break;
						}

						room_joined.delete_leaveJoinedRoom({
							room_id : room_id,
							user_id : user_id
						}, function(result1){
							switch(result1.result){
								case 0://fail
								{
									ret.value.result = 0;
								}
								break;
								case 1://success
								{
									ret.value.result = 1;

									room_joined.read_joinedMember({
										room_id : room_id
									}, function(result2){
										switch(result2.result){
											case 0://read error
											{//log this error
											}
											break;
											case 1://read success
											{
												if(result2.data.length == 0){
													//if there is no member in room
													room_invite.read_roomInviteRoomID({
														room_id : room_id
													}, function(result3){
														switch(result3.result){
															case 0://fail
															{//log this error
															}
															break;
															case 1:
															{
																var ret1 = {
																	action : 'delete',
																	value : {
																		room_id : room_id
																	}
																};
																for(var i in result3.data){
																	(function(i){
																		process.nextTick(function(){
																			if(online_user.has(result3.data[i].to_id)){
																				io.to(online_user.get(result3.data[i].to_id).socket_id).json.emit('server_roomInvite', ret1);
																			}
																		});
																	})(i);
																}
															}
															break;
														}

														chat_room.delete_room({
															room_id : room_id
														}, function(result3){
															switch(result3.result){
																case 0://delete error
																{//log this error
																}
																break;
																case 1://delete success
																{
																}
																break;
															}
														});
													});
												}else{
													//if there is some member
													var ret1 = {
														action : 'update',
														value : {
															room_id : room_id
														}
													};
													for(var i in result2.data){
														(function(i){
															process.nextTick(function(){
																if(online_user.has(result2.data[i].member_id)){
																	var target_info = online_user.get(result2.data[i].member_id);
																	io.to(target_info.socket_id).json.emit('server_room', ret1);
																}
															});
														})(i);
													}
												}
											}
											break;
										}
									});
								}
								break;
							}
							socket.json.emit('server_room', ret);
						});
					});
				}
				break;
			}
		});

		socket.on('client_roomInvite', function(msg){
			if(!socket_ids.has(socket.id)){
				onInvalidConnect(socket);
				return;
			}

			switch(msg.action){
				case 'create':
				{//create room invitation
					/*
					input
						{
							action : 'create',
							value : {
								room_id : d1,
								target_id : d2
							}
						}
					output
						{
							action : 'response',
							value : {
								call : 'c_roomInvite',
								target_id : r1
								result : 
									0 : fail
									1 : success
							}
						}
					*/
					var req_id = socket_ids.get(socket.id).user_id;
					var room_id = msg.value.room_id;
					var target_id = msg.value.target_id;

					if(req_id == target_id){
						var ret = {
							action : 'response',
							value : {
								call : 'c_roomInvite',
								target_id : target_id,
								result : 0
							}
						};
						socket.json.emit('server_roomInvite', ret);
						return;
					}
					//check whether request user is joined or not
					room_joined.read_userJoined({
						room_id : room_id,
						user_id : req_id
					}, function(result){
						switch(result.result){
							case 0://not valid user
							{
								var ret = {
									action : 'response',
									value : {
										call : 'c_roomInvite',
										target_id : target_id,
										result : 0
									}
								};
								socket.json.emit('server_roomInvite', ret);
							}
							break;
							case 1://request user is valid user
							{
								room_joined.read_userJoined({
									room_id : room_id,
									user_id : target_id
								}, function(result1){
									switch(result1.result){
										case 0:
										{//target user is not joined room
											room_invite.create_roomInvite({
												room_id : room_id,
												from_id : req_id,
												to_id : target_id
											}, function(result2){
												switch(result2.result){
													case 0:
													{//fail
														var ret = {
															action : 'response',
															value : {
																call : 'c_roomInvite',
																target_id : target_id,
																result : 0
															}
														};
														socket.json.emit('server_roomInvite', ret);
													}
													break;
													case 1:
													{//success
														var ret = {
															action : 'response',
															value : {
																call : 'c_roomInvite',
																target_id : target_id,
																result : 1
															}
														};
														socket.json.emit('server_roomInvite', ret);

														if(online_user.has(target_id)){
															chat_room.read_room({
																room_id : room_id
															}, function(result3){
																switch(result3.result){
																	case 0://fail
																	{//log this error
																	}
																	break;
																	case 1://success
																	{
																		ret = {
																			action : 'update',
																			value : {
																				from_id : req_id,
																				from_nick : online_user.get(target_id).user_nick,
																				room_id : room_id,
																				room_title : result3.data.room_title
																			}
																		};
																		if(online_user.has(target_id)){
																			//if target id is online, then send room invitation
																			io.to(online_user.get(target_id).socket_id).json.emit('server_roomInvite', ret);
																		}
																	}
																	break;
																}
															});
														}
													}
													break;
												}
											});
										}
										break;
										case 1:
										{//target user already joined room
											var ret = {
												action : 'response',
												value : {
													call : 'c_roomInvite',
													result : 0
												}
											};
											socket.json.emit('server_roomInvite', ret);
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
					switch(msg.value.target){
						case 'single':
						{
						}
						break;
						case 'all':
						{
							var req_id = socket_ids.get(socket.id).user_id;
							room_invite.read_roomInvite({
								user_id : req_id
							}, function(result){
								switch(result.result){
									case 0:
									{
										var ret = {
											action : 'response',
											value : {
												call : 'r_roomInvite_all',
												result : 0
											}
										};
										socket.json.emit('server_roomInvite', ret);
									}
									break;
									case 1:
									{
										var ret = {
											action : 'response',
											value : {
												call : 'r_roomInvite_all',
												result : 1,
												data : result.data
											}
										};
										socket.json.emit('server_roomInvite', ret);
									}
									break;
								}
							});
						}
						break;
					}	
				}
				break;
				case 'update':
				{//accept room invitation
					var room_id = msg.value.room_id;
					var user_id = socket_ids.get(socket.id).user_id;

					room_invite.read_hasRoomInvite({
						room_id : room_id,
						user_id : user_id
					}, function(result){
						switch(result.result){
							case 0://there is no room invite
							{
								var ret = {
									action : 'response',
									value : {
										call : 'u_roomInvite',
										result : 0,
										room_id : room_id,
										room_title : 'unknown'
									}
								};
								socket.json.emit('server_roomInvite', ret);
							}
							break;
							case 1:
							{//there is room invite
								room_title = result.data.room_title;

								room_joined.create_roomJoin({
									room_id : room_id,
									user_id : user_id
								}, function(result1){
									switch(result1.result){
										case 0://fail
										{
											var ret = {
												action : 'response',
												value : {
													call : 'u_roomInvite',
													result : 0,
													room_id : room_id,
													room_title : room_title
												}
											};
											socket.json.emit('server_roomInvite', ret);
										}
										break;
										case 1://success
										{
											room_invite.delete_roomInvite({
												room_id : room_id,
												user_id : user_id
											}, function(result2){
												switch(result2.result){
													case 0://error
													{//log this error
													}
													break;
													case 1://success
													{//do nothing
													}
													break;
												}
											});
											room_joined.read_joinedMember({
												room_id : room_id
											}, function(result2){
												var ret;
												switch(result2.result){
													case 0:
													{
														ret = {
															action : 'response',
															value : {
																call : 'u_roomInvite',
																result : 1,
																room_id : room_id,
																room_title : room_title,
																members : []
															}
														};
													}
													break;
													case 1:
													{
														ret = {
															action : 'response',
															value : {
																call : 'u_roomInvite',
																result : 1,
																room_id : room_id,
																room_title : room_title,
																members : result2.data
															}
														};
													}
													break;
												}
												socket.json.emit('server_roomInvite', ret);

												var ret1 = {
													action : 'update',
													value : {
														room_id : room_id
													}
												};
												for(var i in result2.data){
													(function(i){
														process.nextTick(function(){
															if(online_user.has(result2.data[i].member_id)){
																var target_info = online_user.get(result2.data[i].member_id);
																io.to(target_info.socket_id).json.emit('server_room', ret1);
															}
														});
													})(i);
												}
											});
										}
										break;
									}
								});
							}
							break;
							case 2://error
							{
								var ret = {
									action : 'response',
									value : {
										call : 'u_roomInvite',
										result : 2,
										room_id : room_id,
										room_title : 'unknown'
									}
								};
								socket.json.emit('server_roomInvite', ret);
							}
							break;
						}
					});
				}
				break;
				case 'delete':
				{//reject room invitation
					var room_id = msg.value.room_id;
					var user_id = socket_ids.get(socket.id).user_id;

					room_invite.read_hasRoomInvite({
						room_id : room_id,
						user_id : user_id
					}, function(result){
						switch(result.result){
							case 0://no room
							{
								var ret = {
									action : 'response',
									value : {
										call : 'd_roomInvite',
										result : 0,
										room_id : room_id,
										room_title : 'unknown'
									}
								};
								socket.json.emit('server_roomInvite', ret);
							}
							break;
							case 1:
							{
								var room_title = result.data.room_title;

								room_invite.delete_roomInvite({
									room_id : room_id,
									user_id : user_id
								}, function(result1){
									var ret = {
										action : 'response',
										value : {
											call : 'd_roomInvite',
											result : result1.result,
											room_id : room_id,
											room_title : room_title
										}
									};
									socket.json.emit('server_roomInvite', ret);
								});
							}
							break;
							case 2://error
							{
								var ret = {
									action : 'response',
									value : {
										call : 'd_roomInvite',
										result : 2,
										room_id : room_id,
										room_title : 'unknown'
									}
								};
							}
							break;
						}
					});
				}
				break;
			}
		});

		socket.on('client_chat', function(msg){
			if(!socket_ids.has(socket.id)){
				onInvalidConnect(socket);
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
			if(!socket_ids.has(socket.id)){
				onInvalidConnect(socket);
				return;
			}

			var target_id = socket_ids.get(socket.id).user_id;
			var target_info = online_user.get(target_id);
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
							if(online_user.has(result1.data[i].fid)){//if fid socket is connected
								var target_friend_info = online_user.get(result1.data[i].fid);
								var ret = {
									action : 'update',
									value : {
										friend_id : target_id,
										friend_nick : target_info.user_nick,
										isOnline : 0
									}
								};
								io.to(target_friend_info.socket_id).json.emit('server_friend', ret);
							}
						});
					})(i);
				}
			});

			online_user.remove(target_id);
			socket_ids.remove(socket.id);
		});
	});
}