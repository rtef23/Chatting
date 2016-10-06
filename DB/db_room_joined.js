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

}

exports.create_roomInvitation = function(form, callback){
	/*
	input
		{
			room_id : d1
			user_id : d2
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

}