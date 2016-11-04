module.exports = function(io, online_user){
	var member = require('../DB/db_member');
	var member_meta = require('../DB/db_member_meta');
	var friend_list = require('../DB/db_friend_list');
	var friend_request = require('../DB/db_friend_request');
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

	io.on('connect', function(socket){
		socket.on('disconnect', function(){
			if(!socket_ids.has(socket.id))
				return;
			
			var target_id = socket_ids.get(socket.id);
			var target_info = online_user.get(target_id);

			var promise = friend_list.read_friends({
				id : target_id
			});

			promise.then(function(result){
				//success on read friends
				var ret = {
					action : 'update',
					data : {
						friend_id : target_id,
						friend_nick : target_info.user_nick,
						friend_name : target_info.user_name,
						isOnline : 0
					}
				};
				for(var i in result){
					(function(i){
						process.nextTick(function(){
							if(online_user.has(result[i].friend_id)){
								var target_sock_id = online_user.get(result[i].friend_id).socket_id;
								io.to(target_sock_id).json.emit('server_friend', ret);
							}
						});
					})(i);
				}
			}, function(err){
				//error on read friends

			});
			socket_ids.remove(socket.id);
			online_user.remove(target_id);
		});
		socket.on('client_friend', function(msg){
			if(!socket_ids.has(socket.id))
				return;

			var req_id = socket_ids.get(socket.id);

			switch(msg.action){
				case 'read':
				{
					if(msg.data.target == 'all'){
						var promise = friend_list.read_friendsWithStatus({
							id : req_id
						});

						promise.then(function(result){
							for(var i in result){
								if(online_user.has(result[i].friend_id)){
									result[i].isOnline = 1;
								}else{
									result[i].isOnline = 0;
								}
							}
							socket.json.emit('server_friend', {
								action : 'response',
								about : 'r_friend_all',
								data : {
									result : 1,
									data : result
								}
							});
						}, function(err){
							console.err(err);
							socket.json.emit('server_friend', {
								action : 'response',
								about : 'r_friend_all',
								data : {
									result : 0
								}
							});
						});
					}else{

					}
				}
				break;
				case 'delete':
				{
					/*
					output
						action : 'response',
						about : 'd_friend',
						result : 
							0 : error
							1 : success
							2 : invalid request
					*/
					friend_list.read_isFriend({
						id1 : req_id,
						id2 : msg.data.target
					}).then(function(result){
						console.log('req_id : ' + req_id + '\ttarget_id : ' + msg.data.target);
						console.log(JSON.stringify(result));
						if(result.length > 0){
							friend_list.delete_friend({
								id1 : req_id,
								id2 : msg.data.target
							}).then(function(result1){
								socket.json.emit('server_friend', {
									action : 'response',
									about : 'd_friend',
									result : 1,
									data : {
										target : msg.data.target
									}
								});
								if(online_user.has(msg.data.target)){
									var target_sock = online_user.get(msg.data.target).socket_id;
									io.to(target_sock).json.emit('server_friend', {
										action : 'delete',
										data : {
											target : req_id
										}
									});
								}
							}, function(err1){
								console.log(err1);
								socket.json.emit('server_friend', {
									action : 'response',
									about : 'd_friend',
									result : 0
								});
							});
						}else{
							//result.length == 0
							socket.json.emit('server_friend', {
								action : 'response',
								about : 'd_friend',
								result : 2
							});
						}
					}, function(err){
						console.log(err);
						socket.json.emit('server_friend', {
							action : 'response',
							about : 'd_friend',
							result : 0
						});
					});
				}
				break;
			}
		});
		socket.on('client_friendRequest', function(msg){
			if(!socket_ids.has(socket.id))
				return;

			var req_id = socket_ids.get(socket.id);

			switch(msg.action){
				case 'create':
				{
					/*
					output
					{
						action : 'response',
						about : 'c_friendRequest',
						result : 
							0 : error
							1 : success
							2 : invalid friend request
							3 : already exist friend request
					}
					*/
					if(req_id == msg.data.target){
						socket.json.emit('server_friendRequest', {
							action : 'response',
							about : 'c_friendRequest',
							result : 2
						});
						return;
					}

					friend_request.read_checkFriendRequest({
						id1 : req_id,
						id2 : msg.data.target
					}).then(function(result){
						if(result.length > 0){
							socket.json.emit('server_friendRequest', {
								action : 'response',
								about : 'c_friendRequest',
								result : 3
							});
							return;		
						}else{
							friend_list.read_isFriend({
								id1 : req_id,
								id2 : msg.data.target
							}).then(function(result1){
								if(result1.length > 0){
									socket.json.emit('server_friendRequest', {
										action : 'response',
										about : 'c_friendRequest',
										result : 3
									});
									return;			
								}else{
									var cdate = new Date().format('yyyy-MM-dd HH:mm:ss');
									friend_request.create_friendRequest({
										from_id : req_id,
										to_id : msg.data.target,
										request_date : cdate
									}).then(function(result2){
										socket.json.emit('server_friendRequest', {
											action : 'response',
											about : 'c_friendRequest',
											result : 1
										});
										if(online_user.has(msg.data.target)){
											//if target is online
											var target_sock = online_user.get(msg.data.target).socket_id;
											io.to(target_sock).json.emit('server_friendRequest', {
												action : 'update',
												data : {
													from_id : req_id,
													from_nick : online_user.get(req_id).user_nick,
													from_name : online_user.get(req_id).user_name,
													request_date : cdate
												}
											});
										}
									});
								}
							});
						}
					});
				}
				break;
				case 'read':
				{
					switch(msg.data.target){
						case 'all':
						{
							friend_request.read_friendRequest({
								id : req_id
							}).then(function(result){
								socket.json.emit('server_friendRequest', {
									action : 'response',
									about : 'r_friendRequest_all',
									result : 1,
									data : result
								});
							}, function(err){
								console.log(err);
								socket.json.emit('server_friendRequest', {
									action : 'response',
									about : 'r_friendRequest_all',
									result : 0
								});
							});
						}
						break;
					}
				}
				break;
				case 'update':
				{
					/*
					ouput
					{
						action : 'response',
						about : 'u_friendRequest',
						result : 
							0 : error
							1 : success
							2 : invalid request
					}
					*/
					friend_request.read_checkFriendRequest({
						id1 : req_id,
						id2 : msg.data.target
					}).then(function(result){
						if(result.length > 0){
							//async actions
							Promise.all([
								friend_request.delete_friendRequest({
									from_id : msg.data.target,
									to_id : req_id
							}), friend_list.create_friend({
									fid1 : msg.data.target,
									fid2 : req_id
							})]).then(function(result1){
								//async actions
								if(online_user.has(msg.data.target)){
									//if target is online
									member.read_member({
										id : req_id
									}).then(function(result2){
										//because of async action, re-check whether target is online or not
										if(online_user.has(msg.data.target)){
											var target_sock = online_user.get(msg.data.target).socket_id;
											io.to(target_sock).json.emit('server_friend', {
												action : 'update',
												data : {
													friend_id : req_id,
													friend_nick : result2[0].nickname,
													friend_name : result2[0].name,
													isOnline : ((online_user.has(req_id))?1:0)
												}
											});
										}
									});
								}

								member.read_member({
									id : msg.data.target
								}).then(function(result2){
									socket.json.emit('server_friendRequest', {
										action : 'response',
										about : 'u_friendRequest',
										result : 1,
										data : {
											friend_id : msg.data.target,
											friend_nick : result2[0].nickname,
											friend_name : result2[0].name,
											isOnline : ((online_user.has(msg.data.target))?1:0)
										}
									});
								});
							}, function(err1){
								console.log(err1);
								socket.json.emit('server_friendRequest', {
									action : 'response',
									about : 'u_friendRequest',
									result : 0
								});
							});
						}else{//result.length == 0, means that there is no friend request
							socket.json.emit('server_friendRequest', {
								action : 'response',
								about : 'u_friendRequest',
								result : 2
							});
						}
					}, function(err){
						console.log(err);
						socket.json.emit('server_friendRequest', {
							action : 'response',
							about : 'u_friendRequest',
							result : 0
						});
					});
				}
				break;
				case 'delete':
				{
					/*
					output
					{
						action : 'response',
						about : 'd_friendRequest',
						result : 
							0 : error
							1 : success
							2 : invalid request
					}
					*/
					friend_request.read_checkFriendRequest({
						id1 : req_id,
						id2 : msg.data.target
					}).then(function(result){
						if(result.length > 0){
							friend_request.delete_friendRequest({
								from_id : msg.data.target,
								to_id : req_id
							});
							socket.json.emit('server_friendRequest', {
								action : 'response',
								about : 'd_friendRequest',
								result : 1,
								data : {
									friend_id : msg.data.target
								}
							});
						}else{
							socket.json.emit('server_friendRequest', {
								action : 'response',
								about : 'd_friendRequest',
								result : 2
							});
							return;
						}
					}, function(err){
						socket.json.emit('server_friendRequest', {
							action : 'response',
							about : 'd_friendRequest',
							result : 0
						});
					});	
				}
				break;
			}
		});
		socket.on('client_member', function(msg){
			if(!socket_ids.has(socket.id))
				return;

			var req_id = socket_ids.get(socket.id);

			switch(msg.action){
				case 'read':
				{
					var data = msg.data;
					switch(data.condition){
						case 'id':
						{
							member.read_member({
								id : data.value
							}).then(function(result){
								Promise.all(result.map(function(data){
									return friend_list.read_isFriend({
										id1 : req_id,
										id2 : data.id
									}).then(function(res){
										if(res.length > 0)
											data.isFriend = 1;
										else
											data.isFriend = 0;
										return data;
									});
								})).then(function(result1){
									socket.json.emit('server_member', {
										action : 'response',
										about : 'r_member',
										data : result1
									});
								}, function(err){
									console.log(err);
								});
							},function(err){
								console.log(err);
							});
						}
						break;
						case 'name':
						{
							var promise = member.read_byName({
								name : data.value
							});

							promise.then(function(result){
								Promise.all(result.map(function(data){
									return friend_list.read_isFriend({
										id1 : req_id,
										id2 : data.id
									}).then(function(res){
										if(res.length > 0)
											data.isFriend = 1;
										else
											data.isFriend = 0;
										return data;
									});
								})).then(function(result1){
									socket.json.emit('server_member', {
										action : 'response',
										about : 'r_member',
										data : result1
									});
								}, function(err){
									console.log(err);
								});
							},function(err){
								console.log(err);
							});
						}
						break;
						case 'nick':
						{
							var promise = member.read_byNick({
								nickname : data.value
							});

							promise.then(function(result){
								Promise.all(result.map(function(data){
									return friend_list.read_isFriend({
										id1 : req_id,
										id2 : data.id
									}).then(function(res){
										if(res.length > 0)
											data.isFriend = 1;
										else
											data.isFriend = 0;
										return data;
									});
								})).then(function(result1){
									socket.json.emit('server_member', {
										action : 'response',
										about : 'r_member',
										data : result1
									});
								}, function(err){
									console.log(err);
								});
							},function(err){
								console.log(err);
							});
						}
						break;
					}
				}
				break;
			}
		});
		socket.on('client_connect', function(msg){
			switch(msg.action){
				case 'create':
				{
					/*
					output
						{
							action : 'response',
							about : 'c_connect',
							result : 
								0 : error
								1 : not online user, allowed
								2 : already online user, allowed
								3 : not member
						}
					*/
					var id = msg.data.id;
					var password = msg.data.password;
					if(id == undefined || password == undefined)
						return;

					var err_ret = {
						action : 'response',
						about : 'c_connect',
						result : 0
					};
					var val_notOn_ret = {
						action : 'response',
						about : 'c_connect',
						result : 1
					};
					var val_On_ret = {
						action : 'response',
						about : 'c_connect',
						result : 2
					};
					var inval_ret = {
						action : 'response',
						about : 'c_connect',
						result : 3
					};


					var promise = member.read_extMember({
						id : id,
						password : password
					});

					promise.then(function(result){
						//on success
						if(result.length != 1){
							//not member
							socket.json.emit('server_connect', inval_ret);
						}else{
							if(online_user.has(id)){
								//already online user
								var already_user_info = online_user.get(id);
								var ret1 = {
									action : 'delete',
									data : {
										code : 'new_connect'
									}
								};
								io.to(already_user_info.socket_id).json.emit('server_connect', ret1);
								io.to(already_user_info.socket_id).emit('disconnect');
								socket_ids.remove(already_user_info.socket_id);
								online_user.remove(id);
								socket_ids.set(socket.id, id);
								online_user.set(id, {
									user_nick : already_user_info.user_nick,
									user_name : already_user_info.user_name,
									socket_id : socket.id
								});

								val_On_ret.data = {
									user_id : id,
									user_nick : result[0].nickname,
									user_name : result[0].name,
									user_cdate : result[0].cdate
								};

								socket.json.emit('server_connect', val_On_ret);
							}else{
								//not online user, valid
								online_user.set(id, {
									user_nick : result[0].nickname,
									user_name : result[0].name,
									socket_id : socket.id
								});

								val_notOn_ret.data = {
									user_id : id,
									user_nick : result[0].nickname,
									user_name : result[0].name,
									user_cdate : result[0].cdate
								};

								socket_ids.set(socket.id, id);
								socket.json.emit('server_connect', val_notOn_ret);

								var promise2 = friend_list.read_friends({
									id : id
								});

								promise2.then(function(result2){
									//success on read friends
									var ret = {
										action : 'update',
										data : {
											friend_id : id,
											friend_nick : result[0].nickname,
											friend_name : result[0].name,
											isOnline : 1
										}
									};

									for(var i in result2){
										(function(i){
											process.nextTick(function(){
												if(online_user.has(result2[i].friend_id)){
													var target_sock_id = online_user.get(result2[i].friend_id).socket_id;
													io.to(target_sock_id).json.emit('server_friend', ret);
												}
											});
										})(i);
									}
								}, function(err1){
									console.err(err);
								});
							}
						}
					}, function(err){
						//on error
						console.log(err);
						socket.json.emit('server_connect', err_ret);
					});
				}
				break;
			}
		});
	});
}