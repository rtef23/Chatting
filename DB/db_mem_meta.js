//about mem_meta table
var db = require('./db');
require('../Util/date');

exports.member_meta_isOnline = function(form, callback){
	/*
	input : 
		{
			id : data1
		}
	output : 
		{
			result : 
				0 : if not online member
				1 : online user
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
	conn.query('select isOnline from mem_meta where user_id=?', [form.id], function(err, rows){
		if(err){
			result = {result : 2};
			callback(result);
			return result;
		}
		if(rows[0].isOnline == 1){
			result = {result : 1};
			callback(result);
			return result;
		}else{
			result = {result : 0};
			callback(result);
			return result;
		}
	});
}

exports.member_meta_update_onLogin = function(form, callback){
	/*
		update member meta information
		input : 
			form = {
				id : data1
			}
		output
		{
			result : 
				1 : if successing in updating
				0 : error or there is no member in DB
		}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}

	conn.query("update mem_meta set isOnline=?, last_login=? where user_id=?", [true, new Date().format('yyyy-MM-dd HH:mm:ss'), form.id], function(err, row){
		if(err){
			conn.end();
			result = {result : 0};
			callback(form, result);
			return result;
		}
		result = {result : 1};
		callback(result);
		return result;
	});
}
exports.member_meta_update_onLogout = function(form, callback){
	/*
	input
	{
		id : data1
	}
	output
	{
		result : 
			0 : error or there is no member in DB
			1 : if successing in updating
	}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(form, result);
		return result;
	}
	conn.query("update mem_meta set isOnline=? where user_id=?", [false, form.id], function(err, rows){
		if(err){
			conn.end();
			result = {result : 0};
			callback(result);
		}
		result = {result : 1};
		callback(result);
		return result;
	});
}

exports.member_meta_get = function(form, callback){
	/*
	return member meta information
	input
	{
		id : data1
	}
	output
	{
		result : 
			1 : if there is member
			0 : if there is no member or error
		data  : {
			isonline : 
				1 : if member is online
				0 : if member is not online
			,
			lastlogin : 
				datetime type
			,
			create_date : 
				datetime type
		}
	}
	*/
	var conn = db.getConn();
	var id = form.id;
	var result;

	if(!conn){
		conn.end();
		result = {result : 0, data : {}};
		callback(result);
		return result;
	}

	conn.query("select * from mem_meta where id=?", [id], function(err, row){
		if(err){
			conn.end();
			result = {result : 0, data : {}};
			callback(result);
			return result;
		}
		result = {result : 1, data : {isonline : row[0].isOnline, lastlogin : row[0].lastlogin}};
		callback(result);
		return result;
	});
}

exports.member_meta_create = function(form, callback){
	/*
	input
	{
		id : data1
	}
	output
	{
		result : 
			0 : error
			1 : success in creating meta info
	}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}
	conn.query('insert into mem_meta set ?',{
		user_id : form.id,
		isOnline : false,
		create_date : new Date().format('yyyy-MM-dd HH:mm:ss')
	}, function(err, rows){
		if(err){
			console.error(err);
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
