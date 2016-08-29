exports.mem_check = function (form){
	//check that there is member whose info matches in DB
	/*
	return	true : if there is matched member
			false : there is no member whose info matches
	*/
	var conn = getConn();
	var id = form.id_input;
	var pass = form.pass_input;
	var query = "select count(id) from member where id = '" + id + "', pass = '" + pass + "'";

	console.log("id : " + id);
	console.log("pass : " + pass);
	return 
}

function getConn(){
	var mysql = require("mysql");
	mysql.createConnection();
}