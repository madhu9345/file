const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, "uploads");

// Create uploads folder if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// ✅ Allowed file types (secure filtering)
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ✅ Multer storage with secure filtering and limits
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only images and document files are allowed"));
    }
    cb(null, true);
  },
});

// ✅ Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "No file uploaded" });

  res.json({
    message: "File uploaded successfully",
    file: req.file.filename,
  });
});

// ✅ List all files
app.get("/files", (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).json({ message: "Cannot read files" });
    res.json({ files });
  });
});

// ✅ Serve specific file securely
app.get("/files/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ message: "File not found" });
  res.sendFile(filePath);
});

// ✅ Delete specific file
app.delete("/files/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ message: "File not found" });

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ message: "File deleted successfully" });
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(400).json({ message: err.message });
});

// Start server
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
