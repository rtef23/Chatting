var db = require('./db');

exports.create_roomJoin = function(form, callback){
	/*
	input
		{
			room_id : d1,
			user_id : d2,
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
	
	conn.query('insert into room_joined set ?', {
		room_id : form.room_id,
		user_id : form.user_id
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

exports.read_userJoinedRooms = function(form, callback){
	/*
	input
		{
			id : d1
		}
	output
		{
			result : 
				0:fail
				1:success
			data:
			[
				{room_id : r1, room_title : r'1},
				{room_id : r2, room_title : r'2}
				...
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

	conn.query('select room_id, room_title from room_joined natural join chat_room where user_id=?', [form.id], function(err, rows){
		if(err){
			conn.end();
			result = {
				result : 0
			};
			callback(result);
			return result;
		}
		conn.end();
		result = {
			result : 1,
			data : rows
		};
		callback(result);
		return result;
	});
}


exports.read_joinedMember = function(form, callback){
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
				{member_id : r1, member_nick : r'1},
				{member_id : r2, member_nick : r'2}...
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

	conn.query('select m.id as member_id, m.nickname as member_nick from (select user_id as id from room_joined where room_id=?) rj natural join member m', [
		form.room_id
	], function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {
			result : 1,
			data : rows
		};
		callback(result);
		return result;
	});
}

exports.read_userJoined = function(form, callback){
	/*
	input
		{
			room_id : d1,
			user_id : d2
		}
	output
		{
			result : 
				0 : unjoined user
				1 : joined user
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}

	conn.query('select room_id from room_joined where user_id=? and room_id=?', [
		form.user_id,
		form.room_id
	], function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		if(rows.length > 0){
			result = {result : 1};
		}else{
			result = {result : 0};
		}
		callback(result);
		return result;
	});
}
