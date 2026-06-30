const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3002;

const NOTIFICATION_API = 'http://4.224.186.213/evaluation-service/notifications';

async function fetchNotifications() {
  const res = await fetch(NOTIFICATION_API);
  if (!res.ok) throw new Error(`Notification API returned ${res.status}`);
  const data = await res.json();
  return data.notifications || [];
}

app.get('/notifications', async (req, res) => {
  try {
    const notifications = await fetchNotifications();
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Campus notifications service listening on port ${port}`);
});