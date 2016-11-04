//about db
var Promise = require('promise');

var getConn = function(){
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
};

exports.executeQuery = function(query, form){
	/*
	input{
		query : q,
		form : data
	}
	output{
		iff error
			callback arguments length == 2
		iff !error
			callback arguments length == 1
	}
	*/
	return new Promise(function(resolved,rejected){
		var conn = getConn();

		if(!conn){
			return rejected('connection fail');
		}

		conn.query(query, form, function(err, rows){
			conn.end();
			if(err){
				return rejected(err);
			}
			return resolved(rows);
		});
	});
}