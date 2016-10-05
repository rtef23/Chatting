module.exports = function(app){
	var fs = require("fs");
	var member = require("../DB/db_member");
	var member_meta = require("../DB/db_member_meta");
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
								'success'
								'fail'
								'error'
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
									result : 'fail'
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
									result : 'error'
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
										result : 'error'
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
													result : 'error'
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
													result : 'success'
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
}