
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings=require('./settings');
var flash=require('connect-flash');
var passport=require('passport'),GithubStrategy=require('passport-github').Strategy;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({keepExtensions:true,uploadDir:'./public/images'}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
    secret: settings.cookieSercet,
    key:settings.db,
    cookie:{maxAge:1000*60*60*24*30},//30 days
    store: new MongoStore({
      db: settings.db
    })
  }));
/*use remote database*/
// app.use(express.session({
//     secret: settings.cookieSercet,
//     url:settings.url
//     cookie:{maxAge:1000*60*60*24*30}//30 days
//  }));
app.use(passport.initialize());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

passport.use(new GithubStrategy({
	clientID:'c04e12dd97277597452e',
	clientSecret:'d15c32efb20d9ddb3c487e3e3601c35a869c6d6a',
	callbackURL:'http://localhost:3000/login/github/callback'
},function(accessToken, refreshToken, profile, done) {
	// done(null, profile);
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
))
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// app.get('/', routes.index);
// app.get('/users', user.list);
routes(app);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
