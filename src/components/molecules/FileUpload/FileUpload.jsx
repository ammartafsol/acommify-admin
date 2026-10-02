"use client";
import { mergeClass } from "@/resources/utils/helper";
import { useRef } from "react";
import { FaUpload, FaTimes } from "react-icons/fa";
import classes from "./FileUpload.module.css";

export default function FileUpload({
  file = null,
  setFile,
  label,
  accept = "*",
  error,
  required = false,
  placeholder = "Click to upload or drag and drop",
  className = "",
  dir = "ltr",
}) {
  const fileInputRef = useRef();

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={mergeClass(classes.main, className)} dir={dir}>
      {label && (
        <label className={classes.label}>
          {label}
          {required && <span className={classes.required}>*</span>}
        </label>
      )}

      <div
        className={mergeClass(
          classes.uploadArea,
          error ? classes.error : "",
          file ? classes.hasFile : ""
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className={classes.hiddenInput}
        />

        {file ? (
          <div className={classes.fileInfo}>
            <div className={classes.fileDetails}>
              <div className={classes.fileName}>{file.name}</div>
              <div className={classes.fileSize}>
                {formatFileSize(file.size)}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className={classes.removeButton}
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <div className={classes.uploadContent}>
            <FaUpload className={classes.uploadIcon} />
            <div className={classes.uploadText}>{placeholder}</div>
          </div>
        )}
      </div>

      {error && <div className={classes.errorText}>*{error}</div>}
    </div>
  );
}
