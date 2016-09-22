var db = require('./db');
/*
	createNewRoom
	inviteRoom
	joinRoom
	deleteRoom
	leaveRoom
	numOfUserRoom
	usersInRoom
	usersNotInRoom
	userJoinedRoomIDList
	userUnjoinedRoomIDList
*/


exports.createNewRoom = function(form, callback){
	/*
	input
		{
			id : d1
		}
	output
		{
			result : 
				0 : fail
				1 : success
		}	
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('insert into chat_room set ?', {
		user_id : form.id,
		isJoined : 1
	}, function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1};
		callback(result);
		return result;
	});
}
exports.inviteRoom = function(form, callback){
	/*
	input
		{
			id : d1,
			room_id : d2
		}
	ourput
		{
			result : 
				0 : fail
				1 : success
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('insert into chat_room set ?', {
		user_id : form.id,
		room_id : form.room_id
	},function(err, rows){
		if(!conn){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1};
		callback(result);
		return result;
	});
}
exports.joinRoom = function(form, callback){
	/*
	input
		{
			id : d1,
			room_id : d2
		}
	ourput
		{
			result : 
				0 : fail
				1 : success
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('update chat_room set isJoined=1 where user_id=? and room_id=?', [form.id, form.room_id],function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1};
		callback(result);
		return result;
	});
}
exports.deleteRoom = function(form, callback){
	/*
	input
		{
			room_id : d1
		}
	ourput
		{
			result : 
				0 : fail
				1 : success
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('delete from chat_room where room_id=?', [form.room_id],function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1};
		callback(result);
		return result;
	});
}
exports.leaveRoom = function(form, callback){
	/*
	input
		{
			room_id : d1,
			id : d2
		}
	ourput
		{
			result : 
				0 : fail
				1 : success
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('delete from chat_room where room_id=? and id=?', [form.room_id, form.id],function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1};
		callback(result);
		return result;
	});
}
exports.numOfUserRoom = function(form, callback){
	/*
	input
		{
			room_id : d1
		}
	ourput
		{
			result : 
				0 : fail
				1 : success
			, data : 
				r1
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('select count(*) as cnt from chat_room where room_id=? and isJoined=1', [form.room_id],function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1, data : rows[0].cnt};
		callback(result);
		return result;
	});
}
exports.usersInRoom = function(form, callback){
	/*
	input
		{
			room_id : d1
		}
	ourput
		{
			result : 
				0 : fail
				1 : success
			data : 
			[
				{user_id : r1},
				{user_id : r2} ...
			]
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('select user_id from chat_room where room_id=? and isJoined=1', [form.room_id],function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1, data : rows};
		callback(result);
		return result;
	});
}
exports.usersNotInRoom = function(form, callback){
	/*
	input
		{
			room_id : d1
		}
	output
		{
			result : 
				0 : fail
				1 : success
			data : 
			[
				{user_id : r1},
				{user_id : r2} ...
			]
		}
	*/
	var conn = db.getConn();
	var result;
	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('select user_id from chat_room where room_id=? and isJoined=0', [form.room_id],function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1, data : rows};
		callback(result);
		return result;
	});
}
exports.userJoinedRoomIDList = function(form, callback){
	/*
	input
		{
			id : d1
		}
	ourput
		{
			result : 
				0 : fail
				1 : success
			data : 
			[
				{room_id : r1},
				{room_id : r2} ...
			]
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('select room_id from chat_room where user_id=? and isJoined=1', [form.id],function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1, data : rows};
		callback(result);
		return result;
	});
}
exports.userUnjoinedRoomIDList = function(form, callback){
	/*
	input
		{
			id : d1
		}
	output
		{
			result :
				0 : fail
				1 : success
			data : 
			[
				{room_id : r1},
				{room_id : r2} ...
			]
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('select room_id from chat_room where user_id=? and isJoined=0', [form.id], function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1, data : rows};
		callback(result);
		return result;
	});
}