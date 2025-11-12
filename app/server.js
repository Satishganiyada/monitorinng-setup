const express = require("express");
const client = require("prom-client");

const app = express();
const port = 8080;

// Create a registry for Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metric: total HTTP requests
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});
register.registerMetric(httpRequestCounter);

// Middleware to count all requests
app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.labels(req.method, req.path, res.statusCode).inc();
  });
  next();
});

// Routes
app.get("/", (req, res) => {
  res.send("Hello from Sample App! 🎯");
});

app.get("/slow", async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
  res.send("This was a slow request...");
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.listen(port, () => {
  console.log(`✅ Sample app running on http://localhost:${port}`);
  console.log(`📊 Metrics exposed at http://localhost:${port}/metrics`);
});
