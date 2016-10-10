module.exports = function(app, online_users){
	var fs = require("fs");
	var member = require("../DB/db_member");
	var member_meta = require("../DB/db_member_meta");
	var friend_list = require('../DB/db_friend_list');
	var url = require('url');
	var crypto = require('crypto');
	require('../Util/date');
	var server = require('../server');

//################# POST ####################
	//process member create request in post method
	app.post('/client_member', function(req, res){
		/*
		input
			{	
				action : 'create/read/update/delete'
				value : 
			}
		*/
		console.log(JSON.stringify(req.body));
		switch(req.body.action){
			case 'create':
			{
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
						action : 'response',
						value : {
							call : 'c_member',
							id : d1,
							result : 
								0 : fail, already ext member id
								1 : success
								2 : error
						}
					}
				*/
				var id = req.body.value.id.trim().toLowerCase();
				var password = req.body.value.password.trim().toLowerCase();

				member.is_ext_id({
					id : id,
					password : password
				}, function(result){
					switch(result.result){
						case 0://not ext id
						break;
						case 1://ext id
						{
							var ret = {
								action : 'response',
								value : {
									call : 'c_member',
									id : id,
									result : 0
								}
							};
							res.json(ret);
						}
						return;
						case 2://error
						{
							var ret = {
								action : 'response',
								value : {
									call : 'c_member',
									id : id,
									result : 2
								}
							};
							res.json(ret);
						}
						return;
					}
					member.create_member({
						id : id,
						password : password,
						nickname : req.body.value.nickname,
						name : req.body.value.name
					}, function(result1){
						switch(result1.result){
							case 0://error
							{
								var ret = {
									action : 'response',
									value : {
										call : 'c_member',
										id : id,
										result : 2
									}
								};
								res.json(ret);
							}
							return;
							case 1://success
							{
								member_meta.create_member_meta({
									id : id
								}, function(result2){
									switch(result2.result){
										case 0://error
										{
											member.delete_member({
												id : id,
												password : password
											}, function(result3){
												switch(result3.result){
													case 0://fail, log this error
													case 1://success
													break;
												}
											});
											var ret = {
												action : 'response',
												value : {
													call : 'c_member',
													id : id,
													result : 2
												}
											};
											res.json(ret);
										}
										return;
										case 1://success
										{
											var ret = {
												action : 'response',
												value : {
													call : 'c_member',
													id : id,
													result : 1
												}
											};
											res.json(ret);
										}
										break;
									}
								});
							}
							break;
						}

					});
				});
			}
			break;
			case 'read':
			{
			}
			break;
			case 'update':
			{//process by using socket trans
			}
			break;
			case 'delete':
			{//process by using socket trans
			}
			break;
		}
	});

	//return chatting server url with port number
	app.post('/chatting_server_address', function(req, res){
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
		var chat_addr = server.getChatProtocol() + '://' + server.getChatServerIPAddr() + ':' + server.getChatServerPort();
		var result;

		result = {
			result : 1,
			chat_url : chat_addr
		};
		res.json(result);
	});

	app.post('/client_friend', function(req, res){
		/*
		input
			{
				request_id : d1,
				friend_id : d2
			}
		output
			{
				result :
					0 : error or is not friend
					1 : friend
				value : {
					friend_id : r1,
					friend_nick : r2,
					friend_name : r3
				}

			}
		*/
		switch(req.body.action){
			case 'read' : 
			{
				var req_id = req.body.value.request_id;
				var f_id = req.body.value.friend_id;

				//check whether request_id is online or not
				if(!online_users.has(req_id)){
					var ret = {
						result : 0
					};
					res.json(ret);
					return;
				}

				//check whether request_id and friend_id is friend or not
				friend_list.read_isFriend({
					id1 : req_id,
					id2 : f_id
				}, function(result){
					switch(result.result){
						case 0://error or is not friend
						{
							var ret = {
								result : 0
							};
							res.json(ret);
						}
						break;
						case 1:
						{
							member.read_member({
								id : f_id
							}, function(result1){
								switch(result1.result){
									case 0://read error
									{
										var ret = {
											result : 0
										};
										res.json(ret);
									}
									break;
									case 1:
									{//success
										var ret = {
											result : 1,
											value : {
												friend_id : result1.data.id,
												friend_nick : result1.data.nickname,
												friend_name : result1.data.name
											}
										};
										res.json(ret);
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
		}
	});
}