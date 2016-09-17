//about friend_list table
var db = require("./db");

exports.get_friend_list_with_status = function(form, callback){
	/*
	return friend list with friend meta data
	input
		{id : data}
	output
		{
			result : 
				1 : when finding friend successes
				0 : failed in finding friend
			data : [
				{fid : d1, isOnline : i_d1, last_login : l_d1},
				{fid : d2, isOnline : i_d2, last_login : l_d2},
				and so on...
			]
		}
	*/
	var conn = db.getConn();
	var id = form.id;
	var result;

	if(!conn){
		result = {result : 0, data : []};
		callback(result);
		return result;
	}
	conn.query('select mem_meta.user_id as fid, isOnline from ((select f2_id as user_id from friend_list where f1_id=?) union (select f1_id as user_id from friend_list where f2_id=?)) uni_fl natural join mem_meta', [id, id], function(err, rows){
		if(err){
			conn.end();
			result = {result : 0, data : []};
			callback(result);
			return result;
		}
		result = {result : 1, data : rows};
		conn.end();
		callback(result);
		return result;
	});
}

exports.get_friend_list = function(form, callback){
	/*
	return friend list about form.id
	input
		{id : data}
	output
		{
			result : 
				1 : when finding friend successes
				0 : failed in finding friend
			data : [
				fid : id1,
				fid : id2,
				and so on...
			]
		}
	*/
	var conn = db.getConn();
	var id = form.id;
	var result;
	
	if(!conn){
		result = {result : 0, data : []}
		callback(result);
		return result;
	}
	conn.query(
		"select f1_id as fid from friend_list where f2_id=? union select f2_id as fid from friend_list where f1_id=? order by fid", [id, id], function(err, rows){
			if(err){
				result = {result : 0, data : {}}
				conn.end();
				callback(result);
				console.log(err);
				return result;
			}
			result = {
				result : 1,
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