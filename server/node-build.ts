import path from "path";
import express from "express";
import fs from "fs";
import { createServer } from "./src/server";

const app = createServer();
const port = parseInt(process.env.PORT || "10000", 10);

/* FRONTEND BUILD PATH */
const primaryDistPath = path.join(process.cwd(), "dist");
const fallbackDistPath = path.join(process.cwd(), "client", "dist");
const distPath = fs.existsSync(path.join(primaryDistPath, "index.html"))
  ? primaryDistPath
  : fallbackDistPath;

app.use(express.static(distPath));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${port}`);
});