//about member_meta table
var db = require('./db');
require('../Util/date');

exports.update_memberMetaOnLogin = function(form){
	/*
		update member meta information
		input : 
			form = {
				id : data1
			}
	*/
	var query = 'update member_meta set last_login=? where user_id=?';
	return db.executeQuery(query, [new Date().format('yyyy-MM-dd HH:mm:ss'), form.id]);
}

exports.read_detailMemberMeta = function(form){
	/*
	return member meta information
	input
	{
		id : data1
	}
	*/
	var query = 'select id, nickname, name, date_format(create_date, "%Y-%m-%d %H:%i:%s") as cdate from (select user_id as id, create_date from member_meta where user_id=?) t1 natural join member';
	return db.executeQuery(query, [form.id]);
}

exports.create_member_meta = function(form){
	/*
	input
	{
		id : data1
	}
	*/
	var query = 'insert into member_meta set ?';
	return db.executeQuery(query, {
		user_id : form.id,
		create_date : new Date().format('yyyy-MM-dd HH:mm:ss')
	});
}
