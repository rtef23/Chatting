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
			console.log(2);
			callback(form, false);
			return false;
		}
		conn.end();
		var resu = ((rows[0].cnt == 1)?true:false);
		callback(form, resu);
		return resu;
	});
}
exports.is_ext_mem_id = function(form, callback){
	/*
	check whether there is same id or not
	callback for syncronous action
	return 
		0 : there is id in DB
		1 : there is no id in DB
		2 : error
	*/
	var id = form.id;
	var conn = getConn();
	var result;

	if(conn == null){
		callback(form, 2);
		return 2;
	}
	conn.query("select id from member where id='" + id + "'", function(err, rows){
		if(err){
			conn.end();
			callback(form, 2);
			return 2;
		}
		var tmp_res;
		if(rows.length > 0)
			tmp_res = 0;
		else
			tmp_res = 1;
		conn.end();
		callback(form, tmp_res);
		return tmp_res;
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
		1 : error 
	*/
	var conn = getConn();
	if(conn == null){
		callback(form, 1);
		return 1;
	}
	var q = conn.query("insert into member set ?", form, function(err, result){
		if(err){
			conn.end();
			console.log("2");
			callback(form, 1);
			return 1;
		}
		conn.end();
		callback(form, 0);
		return 0;
	});
	console.log("query : " + q.sql);
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