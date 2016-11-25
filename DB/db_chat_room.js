var db = require('./db');

exports.create_room = function(form){
	/*
	input
	{
		room_id : d1
	}
	*/
	var query = 'insert into chat_room set ?';
	return db.executeQuery(query, {
		room_id : form.room_id
	});
}

exports.delete_room = function(form){
	/*
	input
	{
		room_id : d1
	}
	*/
	var query = 'delete from chat_room where room_id=?';
	return db.executeQuery(query, [form.room_id]);
}