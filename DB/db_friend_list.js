//about friend_list table
var db = require("./db");

exports.get_friend_list = function(form, callback){
	/*
	return friend list about form.id
	input
		{id : data}
	output
		{
			result : 
				true : when finding friend successes
				false : failed in finding friend
			data : {
				fid : id1,
				fid : id2,
				and so on...
			}
		}
	*/
	var conn = db.getConn();
	var id = form.id;
	var result;
	
	if(!conn){
		conn.end();
		result = {result : false, data : {}}
		callback(result);
		return result;
	}
	conn.query(
		"select f1_id as fid from friend_list where f2_id=? union select f2_id as fid from friend_list where f1_id=? order by fid", [id, id], function(err, rows){
			if(err){
				result = {result : false, data : {}}
				conn.end();
				callback(result);
				console.log(err);
				return result;
			}
			result = {
				result : true,
				data : rows
			}
			conn.end();
			callback(result);
			return result;
		});
}

exports.insert_friend_list = function(form, callback){
	/*
	insert friend list
	input
		{id1 : data1, id2 : data2}
	output
		{result : 
			true : if success in inserting value
			false : if fail in inserting value
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		conn.end();
		result = {result : false};
		callback(result);
		return result;
	}
	conn.query("insert into friend_list set ?", {
		f1_id : form.id1,
		f2_id : form.id2
	}, function(err, rows){
		if(err){
			conn.end();
			result = {result : false};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : true};
		callback(result);
		return result;
	});
}