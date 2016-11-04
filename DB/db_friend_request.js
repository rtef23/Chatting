var db = require("./db");

exports.read_friendRequest = function(form){
	/*
	input{
		id : d1
	}
	*/
	var query = 'select id as from_id, nickname as from_nick, name as from_name, request_date from member natural join (select from_id as id, request_date from friend_request where to_id=?) u1';
	return db.executeQuery(query, [form.id]);
}
exports.create_friendRequest = function(form){
	/*
	input
	{
		from_id : d1,
		to_id : d2,
		request_date : d3
	}
	*/
	var query = 'insert into friend_request set?';
	return db.executeQuery(query, {
		from_id : form.from_id,
		to_id : form.to_id,
		request_date : form.request_date
	});
}
exports.read_checkFriendRequest = function(form){
	/*
	input
	{
		id1: d1,
		id2 : d2
	}
	*/
	var query = '(select * from friend_request where from_id=? and to_id=?) union (select * from friend_request where from_id=? and to_id=?)';
	return db.executeQuery(query, [form.id1, form.id2, form.id2, form.id1]);
}
exports.delete_friendRequest = function(form){
	/*
	input
	{
		from_id : d1,
		to_id : d2
	}
	*/
	var query = 'delete from friend_request where from_id=? and to_id=?';
	return db.executeQuery(query, [form.from_id, form.to_id]);
}