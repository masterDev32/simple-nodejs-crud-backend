const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const AWS = require('aws-sdk');
const { Handler } = require('./handlers/handler');

require('dotenv').config();
AWS.config.update({ region: 'ca-central-1' });

const PORT = process.env.PORT || 3000;
const db = new AWS.DynamoDB.DocumentClient();
const handler = new Handler(db);

// app middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((error, req, res, next) => {
  res.status(error.status || 500).send({
    error: {
      status: error.status || 500,
      message: error.message || 'Internal Server Error',
    },
  });
});

//routes
app.get('/counters', async (req, res) => {
  const response = await handler.getAllCounters();
  res.send(response);
});
app.post('/counters', async (req, res) => {
  const response = await handler.createCounter(req);
  res.send(response);
});
app.get('/counters/:counterId', async (req, res) => {
  const response = await handler.getSingleCounter(req);
  res.send(response);
});
app.put('/counters/:counterId', async (req, res) => {
  const response = await handler.updateCounter(req);
  res.send(response);
});
app.delete('/counters/:counterId', async (req, res) => {
  const response = await handler.deleteCounter(req);
  res.send(response);
});

app.listen(PORT, () => {
  console.log(`Running on ${PORT}...`);
});

module.exports = app;
