//about friend_list table

var db = require("./db");

exports.read_isFriend = function(form, callback){
	/*
	input
		{
			id1 : d1,
			id2 : d2
		}
	output
		{
			result : 
				0 : error or not friend
				1 : friend
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		conn.end();
		result = {
			result : 0
		};
		callback(result);
		return result;
	}

	conn.query('select count(uid) as cnt from ((select from_id as uid from friend_list where from_id=? and to_id=? and isFriend=1) union (select to_id as uid from friend_list where from_id=? and to_id=? and isFriend=1)) u1',[
			form.id1,
			form.id2,
			form.id2,
			form.id1
		], function(err, rows){
			if(err){
				conn.end();
				result = {
					result : 0
				};
				callback(result);
				return result;
			}
			conn.end();
			if(rows[0].cnt > 0)
				result = {
					result : 1
				};
			else
				result = {
					result : 0
				};
			callback(result);
			return result;
	});
}

exports.read_friendListWithStatus = function(form, callback){
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
				{friend_nick : d1, friend_id : d'1},
				{friend_nick : d2, friend_id : d'2},
				and so on...
			]
		}
	*/
	var conn = db.getConn();
	var id = form.id;
	var result;

	if(!conn){
		conn.end();
		result = {result : 0, data : []};
		callback(result);
		return result;
	}

	conn.query('select t1.id as friend_id, t2.nickname as friend_nick from (select user_id as id from ((select from_id as user_id from friend_list where to_id=? and isFriend=1) union (select to_id as user_id from friend_list where from_id=? and isFriend=1)) as uni_table natural join mem_meta) as t1 natural join member as t2', [id, id], function(err, rows){
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

exports.read_friendList = function(form, callback){
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
				{fid : id1},
				{fid : id2},
				and so on...
			]
		}
	*/
	var conn = db.getConn();
	var id = form.id;
	var result;
	
	if(!conn){
		conn.end();
		result = {result : 0, data : []}
		callback(result);
		return result;
	}
	conn.query(
		"(select from_id as fid from friend_list where to_id=? and isFriend=1) union (select to_id as fid from friend_list where from_id=? and isFriend=1) order by fid", [id, id], function(err, rows){
			if(err){
				result = {result : 0, data : {}}
				conn.end();
				callback(result);
				return result;
			}
			result = {
				result : 1,
				data : rows
			};
			conn.end();
			callback(result);
			return result;
		});
}

exports.create_friendRequest = function(form, callback){
	/*
	insert friend list
	input
		{
			from_id : d1, 
			to_id : d2
		}
	output
		{result : 
			1 : if success in inserting value
			0 : if fail in inserting value
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		conn.end();
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query("insert into friend_list set ?", {
		from_id : form.from_id,
		to_id : form.to_id
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

exports.get_friendRequestNum = function(form, callback){
	/*
	input
		{
			to_id : d1
		}
	output
		{
			result : 
				0 : fail
				1 : success
			data : d2(int)
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		conn.end();
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('select count(*) as cnt from friend_list where isFriend=0 and to_id=?', [form.to_id], function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1, data : rows[0].cnt};
		callback(result);
		return result;
	});
}

exports.read_friendRequests = function(form, callback){
	/*
	input
		{
			id : d1
		}
	output
		{
			result : 
				0 : fail
				1 : success
			data : 
			[
				{from_id : d1, from_nick : d'1},
				{from_id : d2, from_nick : d'2}
				...
			]
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		conn.end();
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('select id as from_id, nickname as from_nick from member where member.id in (select from_id as id from friend_list where isFriend=0 and to_id=?)', [form.id], function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1, data : rows};
		callback(result);
		return result;
	});
}
exports.update_friendRequest = function(form, callback){
	/*
	input
		{
			to_id : d1,
			from_id : d2
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
		conn.end();
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('update friend_list set isFriend=1 where from_id=? and to_id=?', [form.from_id, form.to_id], function(err, rows){
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
exports.delete_friendRequest = function(form, callback){
	/*
	input
		{
			from_id : d1,
			to_id : d2
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
		conn.end();
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('delete from friend_list where isFriend=0 and from_id=? and to_id=?', [form.from_id, form.to_id], function(err, rows){
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
exports.delete_friend = function(form, callback){
	/*
	input
		{
			id1 : d1,
			id2 : d2
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
		conn.end();
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('delete from friend_list where isFriend=1 and ((from_id=? and to_id=?) or (to_id=? and from_id=?))', [form.id1, form.id2, form.id1, form.id2], function(err, rows){
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
exports.read_hasFriendRequest = function(form, callback){
	/*
	input
		{
			id1 : d1,
			id2 : d2
		}
	output
		{
			result : 
				0:no request
				1:there is friend request
				2:error
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		conn.end();
		result = {result : 2};
		callback(result);
		return result;
	}

	conn.query('select count(fid) as cnt from ((select from_id as fid from friend_list where to_id=? and from_id=?) union (select from_id as fid from friend_list where to_id=? and from_id=?)) as t1', [form.id1, form.id2, form.id2, form.id1], function(err, rows){
		if(err){
			conn.end();
			result = {result : 2};
			callback(result);
			return result;
		}
		conn.end();
		if(rows[0].cnt > 0)
			result = {result : 1};
		else
			result = {result : 0};
		callback(result);
		return result;
	});
}