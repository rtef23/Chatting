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
}