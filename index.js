const express = require('express')
const pg = require('pg');
const bodyParser = require("body-parser");
var app = express();
app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
	response.render('pages/helloworld')
});

app.get('/weather_observation', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM weather_observation', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/helloworld', {results: result.rows} ); }
    });
  });
});

app.post('/weather_observation',function(req,res){
  var location=req.body.location;
  var temperature=req.body.temperature;
  var timestamp = new Date();
  console.log("location = "+location+", temperature is "+temperature);

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('INSERT INTO weather_observation (location, temperature, timestamp) VALUES ($1, $2, $3)', [location, temperature, timestamp],function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
    });
    res.end("yes");
  });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});