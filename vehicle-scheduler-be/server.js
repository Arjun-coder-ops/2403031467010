const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3001;

const DEPOT_API = process.env.DEPOT_API || 'http://4.224.186.213/evaluation/service/depots';
const VEHICLES_API = process.env.VEHICLES_API || 'http://4.224.186.213/evaluation/service/vehicles';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

function selectVehicles(vehicles, capacity) {
  const n = vehicles.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));
  const keep = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(false));

  for (let i = 1; i <= n; i += 1) {
    const { serviceDuration, importanceScore } = vehicles[i - 1];
    const weight = Math.min(serviceDuration, capacity);
    for (let w = 0; w <= capacity; w += 1) {
      if (weight <= w && dp[i - 1][w - weight] + importanceScore > dp[i - 1][w]) {
        dp[i][w] = dp[i - 1][w - weight] + importanceScore;
        keep[i][w] = true;
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  let w = capacity;
  const selected = [];
  for (let i = n; i > 0; i -= 1) {
    if (keep[i][w]) {
      selected.push(vehicles[i - 1]);
      w -= Math.min(vehicles[i - 1].serviceDuration, capacity);
    }
  }

  const totalDuration = selected.reduce((sum, v) => sum + v.serviceDuration, 0);
  const totalScore = selected.reduce((sum, v) => sum + v.importanceScore, 0);
  return { selected: selected.reverse(), totalDuration, totalScore };
}

app.get('/depots', async (req, res) => {
  const depots = await fetchJson(DEPOT_API);
  res.json(depots);
});

app.get('/vehicles', async (req, res) => {
  const vehicles = await fetchJson(VEHICLES_API);
  res.json(vehicles);
});

app.get('/schedule', async (req, res) => {
  const depotId = req.query.depotId;
  const hours = Number(req.query.hours);
  if (!depotId || Number.isNaN(hours)) {
    return res.status(400).json({ error: 'depotId and hours query params required' });
  }

  const vehicles = await fetchJson(`${VEHICLES_API}?depotId=${encodeURIComponent(depotId)}`);
  const result = selectVehicles(vehicles, hours);

  res.json({
    depotId,
    availableHours: hours,
    selectedVehicles: result.selected,
    totalDuration: result.totalDuration,
    totalImportanceScore: result.totalScore,
  });
});

app.listen(port, () => {
  console.log(`Vehicle scheduler listening on port ${port}`);
});