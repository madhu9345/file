import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

// 🔗 Backend API (Render URL)
const API_BASE = "https://file-upload-manager-backend.onrender.com"; // ✅ Change this if needed

function FileUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [progress, setProgress] = useState(0);

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = [
    "image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "video/mp4", "video/webm"
  ];

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  useEffect(() => {
    return () => preview && URL.revokeObjectURL(preview);
  }, [preview]);

  const resetMessage = () => setTimeout(() => setMessage(""), 4000);

  // ✅ Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > MAX_SIZE) {
      setMessage("❌ File too large (max 5MB).");
      resetMessage();
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setMessage("❌ Unsupported file type.");
      resetMessage();
      return;
    }

    setFile(selected);
    if (selected.type.startsWith("image/") || selected.type.startsWith("video/") || selected.type === "application/pdf") {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  // ✅ Fetch all files from backend (Cloudinary)
  const fetchUploadedFiles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/files`);
      setUploadedFiles(res.data.files);
    } catch (err) {
      console.error("Fetch failed:", err);
      setMessage("⚠️ Failed to fetch files.");
      resetMessage();
    }
  };

  // ✅ Upload file to Cloudinary
  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress(0);
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
        },
      });

      setMessage(res.data.message);
      setUploadedFiles((prev) => [...prev, res.data]);
      setFile(null);
      setPreview(null);
      setTimeout(() => setProgress(0), 800);
      resetMessage();
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(err.response?.data?.message || "Upload failed");
      resetMessage();
      setProgress(0);
    }
  };

  // ✅ Delete file from Cloudinary
  const handleDelete = async (fileName) => {
    try {
      const publicId = fileName.split("/").pop().split(".")[0];
      await axios.delete(`${API_BASE}/files/${publicId}`);
      setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
      setMessage(`🗑️ Deleted ${fileName}`);
      resetMessage();
    } catch (err) {
      console.error("Delete error:", err);
      setMessage("Delete failed");
      resetMessage();
    }
  };

  // ✅ Render preview of selected file
  const renderPreview = () => {
    if (!file) return null;
    if (file.type.startsWith("image/")) return <img src={preview} alt="Preview" width="250" />;
    if (file.type.startsWith("video/")) return <video src={preview} width="300" controls />;
    if (file.type === "application/pdf") return <iframe src={preview} width="250" height="300" title="PDF Preview"></iframe>;
    return <p>📄 {file.name}</p>;
  };

  return (
    <div className="upload-container">
      <h2>📂 Cloud File Upload Manager</h2>

      {/* 1️⃣ Select File */}
      <div className="section">
        <h3>1. Choose File</h3>
        <input type="file" onChange={handleFileChange} />
      </div>

      {/* 2️⃣ Preview */}
      {file && (
        <div className="section">
          <h3>2. Preview File</h3>
          {renderPreview()}
        </div>
      )}

      {/* 3️⃣ Upload */}
      <div className="section">
        <h3>3. Upload File</h3>
        <button onClick={handleUpload} disabled={!file}>
          Upload
        </button>
        {progress > 0 && (
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}>
              {progress}%
            </div>
          </div>
        )}
      </div>

      {/* 4️⃣ File List */}
      <div className="section">
        <h3>4. Uploaded Files</h3>
        {uploadedFiles.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          <ul>
            {uploadedFiles.map((f, idx) => (
              <li key={idx}>
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  {f.name}
                </a>
                <button onClick={() => handleDelete(f.name)} className="delete-btn">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Message Display */}
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default FileUpload;
