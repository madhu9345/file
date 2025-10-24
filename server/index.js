import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use temporary directory in cloud (Vercel/Render) instead of local "uploads"
const UPLOAD_DIR = path.join("/tmp", "uploads"); 
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// ✅ Allowed file types
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "video/mp4",
  "video/webm"
];

// ✅ Multer storage (keep original filename)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("❌ Only allowed file types are supported"));
    }
    cb(null, true);
  },
});

// ✅ Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ message: "✅ File uploaded successfully", file: req.file.originalname });
});

// ✅ List files
app.get("/files", (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).json({ message: "Cannot read files" });
    res.json({ files });
  });
});

// ✅ Serve specific file
app.get("/files/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
  res.sendFile(filePath);
});

// ✅ Delete file
app.delete("/files/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ message: "✅ File deleted successfully" });
  });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(400).json({ message: err.message });
});

// ✅ Dynamic port for Render/Vercel
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
