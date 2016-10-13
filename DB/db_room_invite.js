var db = require('./db');

exports.create_roomInvite = function(form, callback){
	/*
	input
		{
			room_id : d1,
			from_id : d2,
			to_id : d3
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

	conn.query('insert into room_invite set ?', {
		room_id : form.room_id,
		from_id : form.from_id,
		to_id : form.to_id
	}, function(err, rows){
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
			result : 1
		};
		callback(result);
		return result;
	});
}

exports.read_roomInvite = function(form, callback){
	/*
	input
		{
			user_id : d1			
		}
	output
		{
			result : 
				0 : fail
				1 : success
			data : [
				{room_id : r1, room_title : r'1, from_id : r''1, from_nick : r'''1},
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

	conn.query('select id as from_id, nickname as from_nick, room_id, room_title from (select room_title, room_id, from_id as id from room_invite natural join chat_room where to_id=?) ri natural join member', [
		form.user_id
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

exports.read_roomInviteRoomID = function(form, callback){
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
			data : [
				{from_id : m1, to_id : m'1},
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
	conn.query('select from_id, to_id from room_invite where room_id=?',[
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

exports.read_hasRoomInvite = function(form, callback){
	/*
	input
		{
			room_id : d1,
			user_id : d2
		}
	output
		{
			result :
				0 : there is no room invite
				1 : there is room invite
					{
						room_title : r1
					}
				2 : error
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 2};
		callback(result);
		return result;
	}
	conn.query('select room_title from room_invite natural join chat_room where room_id=? and to_id=?', [
		form.room_id,
		form.user_id
	], function(err, rows){
		if(err){
			conn.end();
			result = {result : 2};
			callback(result);
			return result;
		}
		conn.end();
		if(rows.length >= 1)
			result = {
				result : 1,
				room_title : rows[0].room_title
			};
		else
			result = {result : 0};
		callback(result);
		return result;
	});
}

exports.delete_roomInvite = function(form, callback){
	/*
	input
		{
			room_id : d1,
			user_id : d2
		}
	output
		{
			result : 
				0:fail
				1:success
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}

	conn.query('delete from room_invite where room_id=? and to_id=?', [
		form.room_id,
		form.user_id
	], function(err, rows){
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