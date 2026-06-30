const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;
const LOG_SERVER_URL = process.env.LOG_SERVER_URL || 'http://4.224.186.213/evaluation/service/logs';

async function Log(stack, level, packageName, message) {
  const payload = { stack, level, package: packageName, message };
  console.log('Log:', payload);

  try {
    await fetch(LOG_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to send log:', error);
  }
}

app.use(express.json());

app.use((req, res, next) => {
  Log('request-middleware', 'info', 'logging-middleware', `${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', async (req, res) => {
  await Log('root-handler', 'info', 'logging-middleware', 'Root route accessed');
  res.send({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});