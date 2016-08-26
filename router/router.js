module.exports = function(app){
	//bind between url and file
	app.get('/', 
		function(req, res){
			res.render('index.html');
		}
	);
}