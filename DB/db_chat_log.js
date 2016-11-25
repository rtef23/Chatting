var db = require('./db');

exports.create_log = function(form){
	/*
	input
	{
		room_id : d1,
		owner : d2,
		msg : d3,
		time_stamp : d4
	}
	*/
	var query = 'insert into chat_log set ?';
	return db.executeQuery(query, {
		room_id : form.room_id,
		owner_id : form.owner,
		msg : form.msg,
		time_stamp : form.time_stamp
	});
}

exports.read_log = function(form){
	/* 
	input
	{
		room_id : d1
	}
	*/
	var query = 'select owner_id, msg, time_stamp from chat_log where room_id=? order by time_stamp asc';
	return db.executeQuery(query, [form.room_id]);
}

