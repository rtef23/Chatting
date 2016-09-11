//about mem_meta table
var db = require('./db');

exports.member_meta_update = function(form, callback){
	/*
		update member meta information
		input : 
			form = {
				id : data1,
				update_info : {
					last_login : data2,
					isOnline : data3
				}
			}
		return {result : 
			true : if successing in updating
			false : error or there is no member in DB
		}
	*/
	var id = form.id;
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : false};
		callback(form, result);
		return result;
	}

	conn.query("update mem_meta set isOnline=? last_login=? where user_id=?", [form.update_info.isOnline, form.update_info.last_login, id], function(err, row){
		if(err){
			conn.end();
			result = {result : false};
			callback(form, result);
			return result;
		}
		result = {result : true};
		callback(form, result);
		return result;
	});
}

exports.member_meta_info = function(form, callback){
	/*
	return member meta information
		result : 
			true : if there is member
			false : if there is no member or error
		data  : {
			isonline : 
				true : if member is online
				false : if member is not online
			,
			lastlogin : 
				date type
		}
	*/
	var conn = db.getConn();
	var id = form.id;
	var result;

	if(!conn){
		conn.end();
		result = {result : false, data : {}};
		callback(form, result);
		return result;
	}

	conn.query("select * from mem_meta where id=?", [id], function(err, row){
		if(err){
			conn.end();
			result = {result : false, data : {}};
			callback(form, result);
			return result;
		}
		result = {result : true, data : {isonline : row[0].isOnline, lastlogin : row[0].lastlogin}};
	});
}
