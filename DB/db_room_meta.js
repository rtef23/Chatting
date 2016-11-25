var db = require('./db');

exports.create_roomMeta = function(form){
	/*
	input
	{
		room_id : d1,
		user_id : d2
	}
	*/
	var query = 'insert into room_meta set ?';
	return db.executeQuery(query, {
		room_id : form.room_id,
		user_id : form.user_id
	});
}
exports.read_roomByUser = function(form){
	/*
	input
	{
		user_id : d1
	}
	*/
	var query = 'select room_id from room_meta where user_id=?';
	return db.executeQuery(query, [form.user_id]);
}
exports.read_roomByRoom = function(form){
	/*
	input
	{
		room_id : d1
	}
	*/
	var query = 'select user_id from room_meta where room_id=?';
	return db.executeQuery(query, [form.room_id]);
}
exports.delete_roomMeta = function(form){
	/*
	input
	{
		room_id : d1,
		user_id : d2
	}
	*/
	var query = 'delete from room_meta where room_id=? and user_id=?';
	return db.executeQuery(query, [form.room_id, form.user_id]);
}