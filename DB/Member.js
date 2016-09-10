exports.getUserInfo = function(form, callback){
	/*
		return 
			data : if there is user
			empty string(\0) : if there is no user, or error
	*/
	var conn = getConn();
	var id = form.id;

	if(!conn){
		callback(form, '\0');
		return '\0';
	}
	conn.query("select id, nickname, name from member where id=?", [id], function(err, rows){
		if(err){
			conn.end();
			callback(form, '\0');
			return '\0';
		}
		conn.end();
		callback(form, rows[0]);
		return rows[0];
	});
}

exports.member_friend_list = function(form, callback){
	/*
	return friend list
		{
			result : 
				true : when finding friend successes
				false : failed in finding friend
			data : {
				id1,
				id2,
				and so on...
			}
		}
	*/
	var conn = getConn();
	var id = form.id;
	var result;
	
	if(!conn){
		conn.end();
		result = {result : false, data : {}}
		callback(form, result);
		return result;
	}
	conn.query(
		"select f1_id as fid from friend_list where f2_id=? union select f2_id as fid from friend_list where f1_id=? order by fid", [id, id], function(err, rows){
			if(err){
				result = {result : false, data : {}}
				conn.end();
				callback(form, result);
				console.log(err);
				return result;
			}
			result = {
				result : true,
				data : rows
			}
			conn.end();
			callback(form, result);
			return result;
		});
}

exports.member_update = function(form, callback){
	/*
		update user information
		return 
			true : if server successes in updating
			false : error or if fails in updating 
	*/
	var conn = getConn();

	if(!conn){
		callback(form, false);
		return false;
	}

	var id = form.id;
	var nickname = form.nickname;
	var name = form.name;
	conn.query("update member set nickname=?, name=? where id=?", [nickname, name, id], function(err, rows){
		if(err){
			console.log(err);
			conn.end();
			callback(form, false);
			return false;
		}
		conn.end();
		callback(form, true);
		return true;
	});
}

exports.is_ext_mem = function (form, callback){
	//check that there is member whose info matches in DB
	/*
	return	true : if there is matched member
			false : there is no member whose info matches, or there is error
	*/
	var conn = getConn();
	var id = form.id;
	var pass = form.password;

	if(conn == null){
		callback(form, false);
		return false;
	}
	conn.query("select count(id) as cnt from member where id=? and password=?", [id, pass], function(err, rows){
		if(err){
			conn.end();
			callback(form, false);
			console.log(err);
			return false;
		}
		conn.end();
		var resu = ((rows[0].cnt == 1)?true:false);
		callback(form, resu);
		return resu;
	});
}
exports.member_create = function(form, callback){
	/*
	create member
	
	form 
		id : val1(char(30))
		nickname : val2(varchar(40))
		password : val3(char30)
		name : char(20)
	return 
		0 : success in creating member
		1 : already exist member therefore creating member failed
		2 : error
	*/
	var conn = getConn();
	if(!conn){
		callback(form, 2);
		return 2;
	}
	conn.query("select id from member where id = ?", [form.id], function(err, rows){
		if(err){
			conn.end();
			callback(form, 2);
			console.error(err);
			return 2;
		}
		console.log("row : " + JSON.stringify(rows));
		console.log("row len : " + rows.length);
		if(rows.length > 0){
			//in case there is ID in DB
			conn.end();
			callback(form, 1);
			return 1;
		}else{
			//in case there is no ID in DB
			conn.end();
			conn = getConn();
			if(!conn){
				callback(form, 2);
				return 2;
			}
			conn.query("insert into member set ?", 
				{
					id : form.id,
					password : form.password,
					nickname : form.nickname,
					name : form.name
				}, function(err1, rows1){
				if(err1){
					conn.end();
					callback(form, 2);
					console.error(err1);
					return 2;
				}
				conn.end();
				callback(form, 0);
				return 0;
			});
		}

	});
}
function getConn(){
	/*
	connect mysql function
	*/
	var db_info = require("./db_info.json");
	var mysql = require("mysql");
	var conn = mysql.createConnection(db_info);

	conn.connect(function(err){
		if(err){
			console.error("mysql connection error");
			console.error(err);
			return null;
		}
	});
	return conn;
}