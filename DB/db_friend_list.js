//about friend_list table

var db = require("./db");

exports.read_isFriend = function(form){
	/*
	input
		{
			id1 : d1,
			id2 : d2
		}
	*/
	var query = '(select * from friend_list where fid1=? and fid2=?) union (select * from friend_list where fid2=? and fid1=?)';
	return db.executeQuery(query, [
		form.id1,
		form.id2,
		form.id2,
		form.id1
	]);
}

exports.read_friendsWithStatus = function(form){
	/*
	return friend list with friend meta data
	input
		{id : data}
	output
		{
			[
				{friend_id : r1, friend_nick : r2, friend_name : r3},
				...
			]
		}
	*/
	var query = '(select id as friend_id, nickname as friend_nick, name as friend_name from member where id in (select fid1 as id from friend_list where fid2=?)) union (select id as friend_id, nickname as friend_nick, name as friend_name from member where id in (select fid2 as id from friend_list where fid1=?))';
	return db.executeQuery(query, [form.id, form.id]);
}

exports.read_friends = function(form){
	/*
	return friend list about form.id
	input
		{id : data}
	*/
	var query = '(select fid1 as friend_id from friend_list where fid2=?) union (select fid2 as friend_id from friend_list where fid1=?)';
	return db.executeQuery(query, [form.id, form.id]);
}

exports.create_friend = function(form){
	/*
	input
	{
		fid1 : d1,
		fid2 : d2
	}
	*/
	var query = 'insert into friend_list set ?';
	return db.executeQuery(query, {
		fid1 : form.fid1,
		fid2 : form.fid2
	});
}