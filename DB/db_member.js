//about member table
var db = require('./db');
var member = require('./db_member');

exports.read_member = function(form){
	/*
		input
			{
				id : data1
			}
	*/
	var query = 'select id, nickname, name from member where id=?';
	return db.executeQuery(query, [form.id]);
}

exports.update_member = function(form){
	/*
		update user information
		input
			{
				id : data1,
				name : data2,
				nickname : data3
			}
	*/
	var query = 'update member set nickname=?, name=? where id=?';
	return db.executeQuery(query, [form.nickname, form.name, form.id]);
}

exports.read_extMember = function (form){
	//check that there is member whose info matches in DB
	/*
	input 
		{
			id : data1,
			password : data2
		}
	*/
	var query = 'select id, nickname, name, t2.create_date as cdate from member natural join (select user_id as id, create_date from member_meta) t2 where id=(select id from member where id=? and password=?)';
	return db.executeQuery(query, [form.id, form.password]);
}

exports.read_isExtID = function(form){
	/*
	input
		{
			id : data1
		}
	*/
	var query = 'select * from member where id = ?';
	return db.executeQuery(query, [form.id]);
}
exports.create_member = function(form){
	/*
	create member
	input
		{
			id : data1,
			nickname : data2,
			password : data3,
			name : data4
		}
	*/
	var query = 'insert into member set ?';
	return db.executeQuery(query, {
		id : form.id,
		nickname : form.nickname,
		password : form.password,
		name : form.name
	});
}

exports.delete_member = function(form){
	/*
	input
	{
		id : data1,
		password : data2
	}
	*/
	var query = 'delete from member where id=? and password=?';
	return db.executeQuery(query, [form.id, form.password]);
}

exports.read_byNick = function(form){
	/*
	input
	{
		nickname : d1
	}
	*/
	var query = 'select id, nickname, name from member where nickname = ?';
	return db.executeQuery(query, [form.nickname]);
}

exports.read_byName = function(form){
	/*
	input
	{
		name : d1
	}
	*/
	var query = 'select id, nickname, name from member where name = ?';
	return db.executeQuery(query, [form.name]);
}