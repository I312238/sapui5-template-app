var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var proxy = require('http-proxy-middleware');
var logger = require('morgan');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'webapp')));
app.use('/resources', express.static(path.join(__dirname, 'bower_components/sapui5/resources')))

// We don need index router for SAPUI5 app
//var indexRouter = require('./routes/index');
//app.use('/', indexRouter);

// Proxy settings (development only)
if (app.get('env') === 'development') {
    app.use('/api/v1', proxy({
        target: 'http://localhost:8080',
        pathRewrite: {
            '^/api/v1': '/api/v1'
        },
        logLevel: 'debug'
    }));
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
