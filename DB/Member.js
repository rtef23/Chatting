exports.is_ext_mem = function (form){
	//check that there is member whose info matches in DB
	/*
	return	true : if there is matched member
			false : there is no member whose info matches, or there is error
	*/
	var conn = getConn();
	var id = form.id;
	var pass = form.pass;
	var query = "select count(id) from member where id = '" + id + "', pass = '" + pass + "'";

	console.log("id : " + id);
	console.log("pass : " + pass);
	if(conn == null)
		return false;
	var result = Boolean(conn.query(query, function(err, rows){
		if(err)
			return false;
		return (rows.length > 0)?true:false;
	}));
	console.log("result : " + result);
	conn.end();
	return result;
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
		callback(2);
		return 2;
	}
	conn.query("select id from member where id='" + id + "'", function(err, rows){
		if(err){
			conn.end();
			callback(2);
			return 2;
		}
		var tmp_res;
		if(rows.length > 0)
			tmp_res = 0;
		else
			tmp_res = 1;
		conn.end();
		callback(tmp_res);
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
		callback(1);
		return 1;
	}
	var q = conn.query("insert into member set ?", form, function(err, result){
		if(err){
			conn.end();
			console.log("2");
			callback(1);
			return 1;
		}
		conn.end();
		callback(0);
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