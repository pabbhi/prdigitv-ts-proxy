const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Health check
app.get("/", (req, res) => {
  res.send("PR DigiTV TS Proxy is running");
});

// TS stream proxy
app.get("/stream", async (req, res) => {
  const tsUrl = req.query.url;

  if (!tsUrl) {
    return res.status(400).send("Missing ?url=");
  }

  try {
    const response = await axios({
      method: "GET",
      url: tsUrl,
      responseType: "stream",
      timeout: 15000
    });

    // CORS headers (CRITICAL)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", "video/mp2t");

    // Pipe TS stream to browser
    response.data.pipe(res);

    response.data.on("error", err => {
      console.error("Stream error:", err.message);
      res.end();
    });

  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).send("Failed to fetch TS stream");
  }
});

app.listen(PORT, () => {
  console.log("PR DigiTV TS Proxy running on port", PORT);
});
