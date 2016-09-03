module.exports = function(app){
	var fs = require("fs");
	var path = require("path");
	var bodyParser = require("body-parser");
	var member = require("../DB/Member");

	app.use(bodyParser.json());//to support json encoded body
	app.use(bodyParser.urlencoded({
		extended : true
	}));//to support url encoded body
	//bind between url and file

//################## GET #####################
	//base
	app.get('/', 
		function(req, res){
			res.render('index.html');
		});

	//process image request
	app.get('/img*',
		function(req, res){
			var file_path = req.query.file_path.replace(/\'/g, "");//make every single quater in file path blank
			var total_path = path.join(__dirname, "../views/" , file_path);//join path
			var ext = path.extname(file_path).replace(".", "");

			fs.readFile(total_path, function(err, data){
				if(err){//if there is no file
					res.writeHead(404, {"Content-Type":"text/plain"});
					res.end("404 not found");
					return;
				}

				res.writeHead(200, {"Content-Type":("image/" + ext)});//return header with file extension type
				res.end(data, "binary");
			});
		});
	//show create member window
	app.get("/member_create", function(req, res){
		res.render("client/createMem.html");
	});

//################# POST ####################
	//process member check request in post method
	app.post('/member_check', function(req, res){
		member.is_ext_mem(req.body, function(result){
			res.writeHead(200, {"Content-Type":"text/plain"});
			res.end(result);
		});
	});
	//process member create request in post method
	app.post('/member_create', function(req, res){
		console.log(req.body);
		member.is_ext_mem_id(req.body, function(altered_form){
			switch(altered_form[result]){
				case 0://already ext id
				case 2://error
					res.writeHead(200, {"Content-Type" : "text/plain"});
					res.end(JSON.stringify({"result" : altered_form.result}));
					break;
				case 1://not ext id
					member.member_create(altered_form, function(altered_form){
						/*
						flag
							0 : success
							1 : error
						*/
						console.log("flag1 : " + altered_form.result);
						res.writeHead(200, {"Content-Type":"text/plain"});
						res.end(JSON.stringify({"result" : altered_form.result}));						
					});
			}
		});
	});
}