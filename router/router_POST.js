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
						about : 'c_member',
						value : {
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
				var name = req.body.value.name;
				var nick = req.body.value.nickname;

				var promise = member.read_isExtID({
					id : id
				});
				promise.then(function(result){
					//on read success
					if(result.length >= 1){
						//already ext id
						var ret = {
							action : 'response',
							about : 'c_member',
							value : {
								id : id,
								result : 0
							}
						};
						res.json(ret);
					}else{
						//not ext id
						var promise1 = member.create_member({
							id : id,
							password : password,
							nickname : nick,
							name : name
						});

						promise1.then(function(result1){
							//on create success
							var promise2 = member_meta.create_member_meta({
								id : id
							});

							promise2.then(function(result){
								//on success create meta info
								var ret = {
									action : 'response',
									about : 'c_member',
									value : {
										id : id,
										result : 1
									}
								};
								res.json(ret);
							}, function(err){
								//on error create meta info
								//log this error
								var ret = {
									action : 'response',
									about : 'c_member',
									value : {
										id : id,
										result : 1
									}
								};
								res.json(ret);
							});
						}, function(err){
							//on create fail
							var ret = {
								action : 'response',
								about : 'c_member',
								value : {
									id : id,
									result : 2
								}
							};
							res.json(ret);
						});
					}
				}, function(err){
					//on read fail
					var ret = {
						action : 'response',
						about : 'c_member',
						value : {
							id : id,
							result : 2
						}
					};
					res.json(ret);
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
			}
			break;
		}
	});
}