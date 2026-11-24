var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
async function startServer() {
  const app = (0, import_express.default)();
  app.use((0, import_cors.default)());
  app.use(import_express.default.json({ limit: "100mb" }));
  app.use(import_express.default.urlencoded({ limit: "100mb", extended: true }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/backup/status", (req, res) => {
    try {
      const backupPath = import_path.default.join(process.cwd(), "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645.json");
      if (import_fs.default.existsSync(backupPath)) {
        const stats = import_fs.default.statSync(backupPath);
        res.json({
          exists: true,
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
          path: "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645.json"
        });
      } else {
        res.json({
          exists: false,
          path: "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645.json"
        });
      }
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });
  app.get("/api/backup", (req, res) => {
    try {
      const backupPath = import_path.default.join(process.cwd(), "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645.json");
      if (import_fs.default.existsSync(backupPath)) {
        const content = import_fs.default.readFileSync(backupPath, "utf8");
        res.setHeader("Content-Type", "application/json");
        res.send(content);
      } else {
        res.status(404).json({ error: "\u0645\u0644\u0641 \u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u062D\u0627\u0644\u064A\u0627\u064B" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });
  app.post("/api/backup", (req, res) => {
    try {
      const data = req.body;
      const backupPath = import_path.default.join(process.cwd(), "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645.json");
      import_fs.default.writeFileSync(backupPath, JSON.stringify(data, null, 2), "utf8");
      res.json({
        success: true,
        message: "\u062A\u0645 \u062D\u0641\u0638 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0628\u0646\u062C\u0627\u062D \u0639\u0644\u0649 \u0627\u0644\u0642\u0631\u0635",
        path: "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645.json",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      console.error("Local backup failed:", err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });
  app.post("/api/export/download", (req, res) => {
    try {
      const { fileName, fileDataBase64, mimeType, textContent } = req.body;
      const rawName = fileName || "export.dat";
      const encodedName = encodeURIComponent(rawName);
      res.setHeader("Content-Type", mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
      if (textContent) {
        return res.send(Buffer.from(textContent, "utf8"));
      }
      if (fileDataBase64) {
        const buffer = Buffer.from(fileDataBase64, "base64");
        return res.send(buffer);
      }
      return res.status(400).send("No file content");
    } catch (err) {
      console.error("Download proxy error:", err);
      return res.status(500).send(err.message || "Download error");
    }
  });
  app.get(["/api/download/apk", "/api/download/app-release.apk", "/api/download/smart_account.apk"], (req, res) => {
    const directGitHubApkUrl = "https://github.com/azamfahd/account20/releases/download/latest/app-release.apk";
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", 'attachment; filename="smart_account.apk"');
    res.redirect(directGitHubApkUrl);
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_fs.default.existsSync(import_path.default.join(process.cwd(), "dist")) ? import_path.default.join(process.cwd(), "dist") : import_path.default.join(process.cwd(), "build");
    app.use(import_express.default.static(distPath));
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        res.sendFile(import_path.default.join(distPath, "index.html"));
      } else {
        next();
      }
    });
  }
  const PORT = 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
