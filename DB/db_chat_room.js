var db = require('./db');

exports.create_NewRoom = function(form, callback){
	/*
	input
		{
			room_id : d1,
			room_title : d2
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
		room_id : form.room_id,
		room_title : form.room_title
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

exports.delete_Room = function(form, callback){
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
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}

	conn.query('delete from chat_room where room_id=?', [form.room_id], function(err, rows){
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
exports.read_room = function(form, callback){
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
			data : {
				room_title : r1
			}
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}

	conn.query('select room_title from chat_room where room_id=?', [form.room_id], function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1, data : rows[0].room_title};
		callback(result);
		return result;
	});
}
