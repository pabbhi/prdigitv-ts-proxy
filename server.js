import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const STREAM_DIR = "./streams";

if (!fs.existsSync(STREAM_DIR)) {
  fs.mkdirSync(STREAM_DIR);
}

// 🔥 Convert TS → HLS
app.get("/hls", (req, res) => {
  const tsUrl = req.query.url;
  if (!tsUrl) return res.status(400).send("Missing url");

  const id = Buffer.from(tsUrl).toString("base64").replace(/=/g, "");
  const outDir = path.join(STREAM_DIR, id);
  const playlist = path.join(outDir, "index.m3u8");

  if (fs.existsSync(playlist)) {
    return res.sendFile(path.resolve(playlist));
  }

  fs.mkdirSync(outDir, { recursive: true });

  const cmd = `
    ffmpeg -loglevel error -i "${tsUrl}" \
    -c copy -f hls \
    -hls_time 4 \
    -hls_list_size 6 \
    -hls_flags delete_segments \
    "${playlist}"
  `;

  exec(cmd, err => {
    if (err) {
      console.error(err);
      return res.status(500).send("FFmpeg failed");
    }
    res.sendFile(path.resolve(playlist));
  });
});

// Serve HLS segments
app.use("/streams", express.static("streams"));

app.listen(PORT, () => {
  console.log("TS→HLS server running on port", PORT);
});
