const express = require('express');
const handlebars = require('express-handlebars').create({defaultLayout:'main'});
const formidable = require('formidable');
const credentials = require('./credentials.js');
const session = require('express-session');
const parseurl = require('parseurl');
const fs = require('fs');

const app = express();
app.disable('x-powered-by'); // block server info
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: credentials.cookieSecret,
}));

app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));

app.use((req, res, next) => {
  console.log(`Looking for URL: ${req.url}`);
  let views = req.session.views;
  if (!views) { views = req.session.views = {} }
  const pathname = parseurl(req).pathname;
  views[pathname] = (views[pathname] || 0) + 1;
  next();
});

app.get('/readfile', (req,res) => {
  fs.readFile('./public/randomfile.txt', (e,d) => {
    if (e) console.error(e);
    else res.send(d.toString());
  });
});

app.get('/writefile', (req,res) => {
  fs.writeFile('./public/randomfileRec.txt', 'this is the data', (e) => {
    if (e) console.error(e);
    else {
      fs.readFile('./public/randomfileRec.txt', (e,d) => {
        if (e) console.error(e);
        else res.send(d.toString());
      });
    };
  });
});

app.get('/viewcount', (req, res) => {
  res.send(`You viewed this page ${req.session.views['/viewcount']} times.`);
});
app.get('/', (req, res) => res.render('home'));
app.get('/about', (req, res) => res.render('about'));
app.get('/contact', (req, res) => res.render('contact', { csrf: 'CSRF token here'}));
app.post('/process', (req,res) => {
  console.log('Form: ' + req.query.form);
  console.log('CSRF token: ' + req.body._csrf);
  console.log('Email: ' + req.body.email);
  console.log('Question: ' + req.body.ques);
  res.redirect(303, 'thankyou');
});
app.get('/thankyou', (req, res) => res.render('thankyou'));
app.get('/file-upload', (req, res) => {
  const now = new Date();
  res.render('file-upload',{
    year: now.getFullYear(),
    month: now.getMonth()
  })
});
app.post('/file-upload/:year/:month', (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, file) => {
    if (err) return res.redirect(303, 'error');
    console.log('Received File')
    console.log(file);
    res.redirect(303, '/thankyou');
  });
});

app.get('/cookie', (req, res) => {
  res.cookie('username', 'Carlton Joseph', {expire: new Date() + 9999})
    .send('username has the value of Carlton Joseph');

});

app.get('/listcookies', (req, res) => {
  console.log('Cookies: ', req.cookies)
  res.send('Look in the console for cookies');
});

app.get('/deletecookie', (req, res) => {
  res
    .clearCookie('username')
    .send('username cookie deleted');
});
app.get('/junk', (req, res) => {
  console.log('Tried to access /junk');
  throw new Error('/junk does not exist');
});

app.use((err, req, res, next) => {
  console.log('Error : ' + err.message);
  next();
});

app.use((req, res) => {
  res.type('text/html');
  res.status(404);
  res.render('404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.type('text/html');
  res.status(500);
  res.render('500');
  next();
});

app.listen(app.get('port'), () =>
  console.log(`Express running on port ${app.get('port')}`));
