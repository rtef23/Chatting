var mysql = require('mysql');
var db_config = require('db_info.js');
var conn = mysql.createConnection(db_config);
var id;
var password;
var name;

var query = 'insert into member (id, password, name) values (' + id + ', ' + password + ', ' + name + ')';

conn.query(query, function(err, tuples){
	if(err)
		throw err;
});

console.log("create member successed!");
conn.end();