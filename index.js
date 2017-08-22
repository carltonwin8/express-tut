const express = require('express');

const app = express();

app.set('port', process.env.PORT || 3000);

app.get('/', (req, res) => res.send('Express Works'));

app.listen(app.get('port'), () =>
  console.log(`Express running on port ${app.get('port')}`));
