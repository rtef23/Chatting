//about member table
var db = require('./db');
var member = require('./db_member');

exports.get_member_info = function(form, callback){
	/*
		input
			{
				id : data1
			}
		output
			{
				result : 
					0 : error
					1 : if success in get info
				,data : {
					id : d1,
					nickname : d2,
					name : d3
				}
			}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0, data : {}};
		callback(result);
		return result;
	}
	conn.query("select id, nickname, name from member where id = ?", [form.id], function(err, rows){
		if(err){
			conn.end();
			result = {result : 0, data : {}};
			callback(result);
			return result;
		}
		conn.end();
		result = {
			result : 1,
			data : {
				id : rows[0].id,
				nickname : rows[0].nickname,
				name : rows[0].name
			}
		};
		callback(result);
		return result;
	});
}

exports.member_update = function(form, callback){
	/*
		update user information
		input
			{
				id : data1,
				name : data2,
				nickname : data3
			}
		output
			{
				result : 
					0 : error
					1 : success in updating
			}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 0};
		callback(result);
		return result;
	}

	conn.query("update member set nickname=?, name=? where id=?", [form.nickname, form.name, form.id], function(err, rows){
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

exports.is_ext_mem = function (form, callback){
	//check that there is member whose info matches in DB
	/*
	input 
		{
			id : data1,
			password : data2
		}
	output
		{
			result : 
				0 : if there is no member
				1 : if there same tuple which values equals to input
				2 : error
		}
	*/
	var conn = db.getConn();
	var id = form.id;
	var pass = form.password;
	var result;

	if(!conn){
		result = {result : 2};
		callback(result);
		return result;
	}
	conn.query("select count(id) as cnt from member where id=? and password=?", [id, pass], function(err, rows){
		if(err){
			conn.end();
			result = {result : 2};
			callback(result);
			return result;
		}
		conn.end();
		if(rows[0].cnt == 1)
			result = {result : 1};
		else
			result = {result : 0};
		callback(result);
		return result;
	});
}
exports.is_ext_id = function(form, callback){
	/*
	input
		{
			id : data1
		}
	output
		{
			result : 
				0 : if there is no id
				1 : if there is id
				2 : error
		}
	*/
	var conn = db.getConn();
	var result;
	var id = form.id;

	if(!conn){
		result = {result : 2};
		callback(result);
		return result;
	}
	conn.query("select count(id) as cnt from member where id = ?", [id], function(err, rows){
		if(err){
			conn.end();
			result = {result : 2};
			callback(result);
			return result;
		}
		conn.end();
		if(rows[0].cnt == 1)
			result = {result : 1};
		else
			result = {result : 0};
		callback(result);
		return result;
	});
}
exports.member_create = function(form, callback){
	/*
	create member
	input
		{
			id : data1,
			nickname : data2,
			password : data3,
			name : data4
		}
	output
		{
			result : 
				0 : error
				1 : success in creating member
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
	conn.query("insert into member set ?", {
		id : form.id,
		nickname : form.nickname,
		password : form.password,
		name : form.name
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

exports.member_delete = function(form, callback){
	/*
	input
	{
		id : data1,
		password : data2
	}
	output
	{
		result : 
			0 : fail in delete member or error
			1 : success in delete member
	}
	*/
	var conn = db.getConn();
	var result;

	if(!conn){
		result = {result : 2};
		callback(result);
		return result;
	}
	conn.query('delete from member where id=? and password=?',[form.id, form.password], function(err, rows){
		if(err){
			conn.end();
			result = {result : 2};
			callback(result);
			return result;
		}
		conn.end();
		result = {result : 1};
		callback(result);
		return result;
	});
}
