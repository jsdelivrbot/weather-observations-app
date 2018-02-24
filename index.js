const express = require('express')
const pg = require('pg');
const bodyParser = require("body-parser");
var app = express();
var weather = require('./weather.js')

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
	var locations = {};
	
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		["helsinki", "tokio", "new york", "amsterdam", "dubai"].map(function(location){
			locations[location] = {}
			client.query("select max(temperature), min(temperature) from weather_observation where location = $1 AND timestamp >= now()::date + interval '1h';", [location]
			, function(err, result){
				done();
				if (err) {
					console.error(err); response.send("Error " + err); 
				} else {
					locations[location]["min"] = result.rows[0].min;
					locations[location]["max"] = result.rows[0].max;
				}
			})
			client.query("select temperature from weather_observation where location = $1 order by timestamp desc limit 1;", [location]
			, function(err, result){
				done();
				if (err) {
					console.error(err); response.send("Error " + err); 
				} else {
					if(result.rowCount!=0){
						locations[location]["latest"] = result.rows[0].temperature;
					} else {
						locations[location]["latest"] = null;
					}
				}
				if(location=="dubai"){
					response.render('pages/main',{"locations": locations});
				}
			})
		})
	});
	
});

app.get('/weather_observation', function (request, response) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		client.query('SELECT * FROM weather_observation', function(err, result) {
			done();
			if (err) {
				console.error(err); response.send("Error " + err);
			} else {
				response.render('pages/helloworld', {results: result.rows} );
			}
		});
	});
});

app.post('/weather_observation',function(request,response){
	var location=request.body.location;
	var temperature=request.body.temperature;
	var timestamp = new Date();
	console.log("location = "+location+", temperature is "+temperature);

	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		client.query('INSERT INTO weather_observation (location, temperature, timestamp) VALUES ($1, $2, $3)', [location, temperature, timestamp],function(err, result) {
			done();
			if (err) {
				console.error(err); response.send("Error " + err);
			}
		});
		response.end("It worked!");
	});
});

app.get('/weather_observation/:location', function(request,response){
	var location = request.params.location;
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		client.query("select * from weather_observation where location = $1", [location],
		function(err, result) {
			done();
			if (err) {
				console.error(err); response.send("Error " + err);
			} else { 
				response.contentType("json");
				response.end(JSON.stringify(result.rows)); 
			}
		});
	});
});

app.get('/weather_observation/:location/info', function(request,response){
	var location = request.params.location;
	var info = {}
	//couldn't get min, max and latest temperature in one query so I made two.
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		client.query("select max(temperature), min(temperature) from weather_observation where location = $1 AND timestamp >= now()::date + interval '1h';", [location]
		, function(err, result){
			done();
			if (err) {
				console.error(err); response.send("Error " + err); 
			} else {
				info.min = result.rows[0].min;
				info.max = result.rows[0].max;
			}
		});
		client.query("select temperature from weather_observation where location = $1 order by timestamp desc limit 1;", [location]
		, function(err, result){
			done();
			if (err) {
				console.error(err); response.send("Error " + err); 
			} else {
				if(result.rowCount!=1){
					info.latest = null;
				} else {
					info.latest = result.rows[0].temperature;
				}
				response.contentType("json");
				response.end(JSON.stringify(info));
			}
		});
	});
});

app.listen(app.get('port'), function() {
		console.log('Node app is running on port', app.get('port'));
});