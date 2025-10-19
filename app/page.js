"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Folder,
  Trash2,
  Download,
  RefreshCw,
  FolderPlus,
  File,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

// Get max file size from environment variable (default: 200KB)
const MAX_UPLOAD_SIZE =
  parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 204800; // 200KB in bytes

// Client-side utility function for formatting file sizes
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function FileManager() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [fileSizeWarnings, setFileSizeWarnings] = useState([]);

  const fileInputRef = useRef(null);

  // Fetch files and folders on component mount
  useEffect(() => {
    fetchData();
  }, [currentFolder]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [filesRes, foldersRes] = await Promise.all([
        fetch(`/api/files${currentFolder ? `?folderId=${currentFolder}` : ""}`),
        fetch("/api/folders"),
      ]);

      const filesData = await filesRes.json();
      const foldersData = await foldersRes.json();

      setFiles(filesData.files || []);
      setFolders(foldersData.folders || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Validate file sizes
    const oversizedFiles = [];
    const validFiles = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.size > MAX_UPLOAD_SIZE) {
        oversizedFiles.push({
          name: file.name,
          size: file.size,
          maxSize: MAX_UPLOAD_SIZE,
        });
      } else {
        validFiles.push(file);
      }
    }

    // Show warnings for oversized files
    if (oversizedFiles.length > 0) {
      setFileSizeWarnings(oversizedFiles);
      // Don't proceed with upload if there are oversized files
      if (validFiles.length === 0) {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
    } else {
      setFileSizeWarnings([]);
    }

    // Only upload valid files
    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < validFiles.length; i++) {
        formData.append("files", validFiles[i]);
      }
      if (currentFolder) {
        formData.append("folderId", currentFolder);
      }

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await fetchData();
        setSelectedFiles([]);
        setFileSizeWarnings([]);
      } else {
        console.error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFiles = async () => {
    if (selectedFiles.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedFiles.length} file(s)?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileIds: selectedFiles }),
      });

      if (response.ok) {
        await fetchData();
        setSelectedFiles([]);
      } else {
        console.error("Delete failed");
      }
    } catch (error) {
      console.error("Error deleting files:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (response.ok) {
        await fetchData();
        setNewFolderName("");
        setShowNewFolder(false);
      } else {
        console.error("Create folder failed");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (
      !confirm("Are you sure you want to delete this folder and all its files?")
    ) {
      return;
    }

    try {
      const response = await fetch("/api/folders", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderId }),
      });

      if (response.ok) {
        await fetchData();
        if (currentFolder === folderId) {
          setCurrentFolder(null);
        }
      } else {
        console.error("Delete folder failed");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const handleFileSelect = (fileId) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file) => file._id));
    }
  };

  const handleDownload = (file) => {
    const link = document.createElement("a");
    link.href = file.path;
    link.download = file.name;
    link.click();
  };

  const getFileIcon = (file) => {
    const type = file.type.toLowerCase();
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎥";
    if (type.startsWith("audio/")) return "🎵";
    if (type.includes("pdf")) return "📄";
    if (type.includes("text")) return "📝";
    return "📁";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 glass rounded-r-2xl p-6 border-r border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">File Manager</h1>
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
            >
              <FolderPlus className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* New Folder Input */}
          {showNewFolder && (
            <div className="mb-4 p-3 glass rounded-lg">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full bg-transparent text-white placeholder-white/60 border-none outline-none"
                onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCreateFolder}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Folders List */}
          <div className="space-y-2">
            <button
              onClick={() => setCurrentFolder(null)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                currentFolder === null
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              <Folder className="w-5 h-5" />
              All Files
            </button>

            {folders.map((folder) => (
              <div key={folder._id} className="flex items-center group">
                <button
                  onClick={() => setCurrentFolder(folder._id)}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    currentFolder === folder._id
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Folder className="w-5 h-5" />
                  {folder.name}
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* File Size Warnings */}
          {fileSizeWarnings.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-red-400 font-semibold">
                  File Size Exceeded
                </h3>
              </div>
              <p className="text-red-300 text-sm mb-3">
                The following files exceed the maximum size limit of{" "}
                {formatFileSize(MAX_UPLOAD_SIZE)}:
              </p>
              <div className="space-y-1">
                {fileSizeWarnings.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-red-200 truncate flex-1 mr-2">
                      {file.name}
                    </span>
                    <span className="text-red-300">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setFileSizeWarnings([])}
                className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="glass border-b border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="flex flex-col">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? "Uploading..." : "Upload Files"}
                  </button>
                  <span className="text-xs text-white/60 mt-1">
                    Max size: {formatFileSize(MAX_UPLOAD_SIZE)}
                  </span>
                </div>

                <button
                  onClick={fetchData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>

                {selectedFiles.length > 0 && (
                  <button
                    onClick={handleDeleteFiles}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedFiles.length})
                  </button>
                )}
              </div>

              <div className="text-white/70">
                {files.length} file{files.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 p-6 overflow-auto">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-white/50 animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/50">
                <File className="w-16 h-16 mb-4" />
                <p className="text-lg">No files found</p>
                <p className="text-sm">Upload some files to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select All */}
                <div className="flex items-center gap-3 p-3 glass rounded-lg">
                  <input
                    type="checkbox"
                    checked={
                      selectedFiles.length === files.length && files.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-purple-600 bg-transparent border-white/30 rounded focus:ring-purple-500"
                  />
                  <span className="text-white/70 text-sm">
                    Select All ({selectedFiles.length}/{files.length})
                  </span>
                </div>

                {/* Files */}
                {files.map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center gap-4 p-4 glass rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file._id)}
                      onChange={() => handleFileSelect(file._id)}
                      className="w-4 h-4 text-purple-600 bg-transparent border-white/30 rounded focus:ring-purple-500"
                    />

                    <div className="text-2xl">{getFileIcon(file)}</div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-white font-medium truncate"
                        style={{ maxWidth: "400px" }}
                      >
                        {file.name}
                      </p>
                      <p className="text-white/60 text-sm">
                        {formatFileSize(file.size)} •{" "}
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-white/10 rounded transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
