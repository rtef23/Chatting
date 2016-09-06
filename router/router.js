module.exports = function(app){
	var chat_port = 3100;
	var fs = require("fs");
	var path = require("path");
	var bodyParser = require("body-parser");
	var member = require("../DB/Member");
	var io = require("socket.io").listen(chat_port);

	app.use(bodyParser.json());//to support json encoded body
	app.use(bodyParser.urlencoded({
		extended : true
	}));//to support url encoded body

	//act by url
//################# Chatting ####################
	console.log("chatting port : " + chat_port);

//################## GET #####################
	//base
	app.get('/', 
		function(req, res){
			res.render('index');
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
	app.get('/member_create', function(req, res){
		res.render("client/create_member");
	});

	//rendering user tab
	app.get('/user_tab', function(req, res){
		res.render("client/user_tab", {id : req.session.user_id});
	});

	//rendering chatting
	app.get('/chatting', function(req, res){
		if(!req.session.user_id){
			//when unpermitted user accessed in illegal way
			req.session.destroy();
			res.clearCookie('sessionkey');
			res.writeHead(302, {"Content-Type" : "text/plain", "Location":"/"});
			res.end();
			return;
		}
		res.render("Chatting/chatting", {id : req.session.user_id});
	});

	app.get('/chatting_main', function(req, res){
		res.render("Chatting/chatting_main");
	});

	app.get('/login_fail', function(req, res){
		res.render('client/login_fail');
	});
//################# POST ####################
	//login
	app.post('/signin', function(req, res){
		member.is_ext_mem(req.body, function(form, result){
			if(result){//if there is member
				req.session.user_id = form.id;
				res.writeHead(302, {"Content-Type":"text/plain", "Location":"/chatting"});
				res.end();
			}else{//there is no member
				res.writeHead(302, {"Content-Type":"text/plain", "Location":"/login_fail"});
				res.end();
			}
		});
	});

	//logout
	app.post('/signout', function(req, res){
		req.session.destroy();
		res.clearCookie('sessionkey');
	});

	//process member create request in post method
	app.post('/member_create', function(req, res){
		member.member_create(req.body, function(form, result){
			res.writeHead(200, {"Content-Type":"text/plain"});
			res.end(JSON.stringify({result : result.toString()}));
		});
	});

	//if request is valid, then return user information
	app.post('/member_info', function(req, res){
		console.log("member_info");
		if(!req.session.user_id){
			//when unpermitted user accessed in illegal way
			req.session.destroy();
			res.clearCookie('sessionkey');
			res.writeHead(302, {"Content-Type" : "text/plain", "Location":"/"});
			res.end();
			return;
		}
		member.getUserInfo({id : req.session.user_id}, function(form, result){
			res.writeHead(200, {"Content-Type" : "text/plain"});
			res.end(JSON.stringify({result : JSON.stringify(result)}));
		});
	});
}