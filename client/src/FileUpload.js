import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function FileUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [specificFile, setSpecificFile] = useState("");
  const [progress, setProgress] = useState(0);

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "video/mp4",
    "video/webm"
  ];

  useEffect(() => {
  const fetchUploadedFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/files");
      setUploadedFiles(res.data.files);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch files");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  fetchUploadedFiles();
}, []);

  // ✅ Cleanup preview URL when file changes
  useEffect(() => {
    return () => preview && URL.revokeObjectURL(preview);
  }, [preview]);

  const resetMessage = () => setTimeout(() => setMessage(""), 4000);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > MAX_SIZE) {
      setMessage("❌ File too large. Max 5MB allowed.");
      resetMessage();
      setFile(null);
      setPreview(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setMessage("❌ Unsupported file type.");
      resetMessage();
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selected);

    if (
      selected.type.startsWith("image/") ||
      selected.type.startsWith("video/") ||
      selected.type === "application/pdf"
    ) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress(0);
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        },
      });

      setMessage(res.data.message);
      setUploadedFiles((prev) => [...prev, res.data.file]);
      setFile(null);
      setPreview(null);
      setTimeout(() => setProgress(0), 1000);
      resetMessage();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Upload failed");
      setProgress(0);
      resetMessage();
    }
  };

  const handleDelete = async (filename) => {
    try {
      await axios.delete(`http://localhost:5000/files/${filename}`);
      setUploadedFiles((prev) => prev.filter((f) => f !== filename));
      setMessage(`Deleted ${filename}`);
      resetMessage();
    } catch (err) {
      console.error(err);
      setMessage("Delete failed");
      resetMessage();
    }
  };

  const handleReadSpecific = () => {
    if (!specificFile) return alert("Enter a file name!");
    const fileNameOnly = specificFile.split("/").pop();
    const ext = fileNameOnly.split(".").pop().toLowerCase();

    if (["doc", "docx", "xls", "xlsx"].includes(ext)) {
      const url = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        `http://localhost:5000/files/${fileNameOnly}`
      )}`;
      window.open(url, "_blank");
    } else {
      window.open(`http://localhost:5000/files/${fileNameOnly}`, "_blank");
    }
  };

  const renderPreview = () => {
    if (!file) return null;
    if (file.type.startsWith("image/"))
      return <img src={preview} alt="Preview" width="250" />;
    if (file.type.startsWith("video/"))
      return <video src={preview} width="300" controls />;
    if (file.type === "application/pdf")
      return (
        <iframe src={preview} width="250" height="300" title="PDF Preview"></iframe>
      );
    return <p>📄 {file.name}</p>;
  };

  return (
    <div className="upload-container">
      <h2>📂 Secure File Upload Manager</h2>

      <div className="section">
        <h3>1. Choose File</h3>
        <input type="file" onChange={handleFileChange} />
      </div>

      {file && (
        <div className="section">
          <h3>2. Preview File</h3>
          {renderPreview()}
        </div>
      )}

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

      <div className="section">
        <h3>4. Delete Uploaded Files</h3>
        {uploadedFiles.length === 0 && <p>No files uploaded yet.</p>}
        <ul>
          {uploadedFiles.map((f) => (
            <li key={f}>
              {f}{" "}
              <button onClick={() => handleDelete(f)} className="delete-btn">
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h3>5. Read Uploaded Files</h3>
        <ul>
          {uploadedFiles.map((f) => (
            <li key={f}>
              <a
                href={`http://localhost:5000/files/${f}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {f}
              </a>
            </li>
          ))}
        </ul>
        <input
          type="text"
          placeholder="Enter filename"
          value={specificFile}
          onChange={(e) => setSpecificFile(e.target.value)}
        />
        <button onClick={handleReadSpecific}>Open File</button>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default FileUpload;
