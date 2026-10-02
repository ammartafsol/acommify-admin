import React, { useEffect, useRef, useState } from "react";
import classes from "./UploadMedia.module.css";
import Image from "next/image";
import { IoMdCloseCircle } from "react-icons/io";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import { useLocale } from "next-intl";

// Stateless, controlled upload component
export default function UploadMedia({
  dir,
  locale,
  title,
  files = [],
  handleFileChange = () => {},
  handleRemoveFile = () => {},
  error = "",
  multiple = false,
  accept = "*",
  maxFiles = 1,
  maxSizeMB = 5,
  fileDisplayName = "",
  onValidationFail = () => {},
  uploadMessage,
  fileFormats,
  loading = false,
}) {
  const t = useTranslations("uploadMedia");

  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState(null); // Store as { key, params } instead of translated string
  const localLocale = useLocale();
  const { t: ct, setLocale: setLocale1 } = useDynamicTranslations("uploadMedia");

  // Sync dynamic locale with locale prop or local locale
  useEffect(() => {
    if (locale) {
      setLocale1(locale);
    } else {
      setLocale1(localLocale);
    }
  }, [locale, localLocale, setLocale1]);

  const openPicker = () => inputRef.current?.click();

  const validateAndApply = (selected) => {
    if (!selected.length) return;
    let filtered = selected;
    // size check
    const oversize = selected.find((f) => f.size / 1024 / 1024 > maxSizeMB);
    if (oversize) {
      const errorKey = "errors.fileSizeExceeded";
      const errorParams = {
        fileName: oversize.name,
        maxSize: maxSizeMB,
      };
      const msg = ct(errorKey, errorParams);
      setLocalError({ key: errorKey, params: errorParams });
      onValidationFail(msg);
      return;
    }
    // count check
    const existingCount = files.length;
    const allowedRemaining = maxFiles - existingCount;
    if (allowedRemaining <= 0) {
      const errorKey = "errors.maxFilesReached";
      const errorParams = { maxFiles };
      const msg = ct(errorKey, errorParams);
      setLocalError({ key: errorKey, params: errorParams });
      onValidationFail(msg);
      return;
    }
    if (filtered.length > allowedRemaining) {
      filtered = filtered.slice(0, allowedRemaining);
      const errorKey = "errors.tooManyFiles";
      const errorParams = { allowedRemaining };
      const msg = ct(errorKey, errorParams);
      setLocalError({ key: errorKey, params: errorParams });
      onValidationFail(msg);
    } else {
      setLocalError(null);
    }
    handleFileChange(multiple ? filtered : [filtered[0]]);
  };

  const onChange = (e) => {
    const selected = Array.from(e.target.files || []);
    validateAndApply(selected);
  };

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragEnter = (e) => {
    prevent(e);
    setDragActive(true);
  };
  const onDragOver = (e) => {
    prevent(e);
    setDragActive(true);
  };
  const onDragLeave = (e) => {
    prevent(e);
    setDragActive(false);
  };
  const onDrop = (e) => {
    prevent(e);
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    validateAndApply(dropped);
  };


  return (
    <div
      className={mergeClass(
        classes.uploadContainer,
        dir === "ltr" ? "ignoreRtlNested" : ""
      )}
      dir={dir}
    >
      {title && <p className={classes.title}>{title}</p>}
      <div
        className={`${classes.dragAndDropContainer} ${
          dragActive ? classes.dragActive : ""
        }`}
        onClick={openPicker}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
      >
        <div className={classes.dragAndDropMessage}>
          <Image
            src="/svg/Image.svg"
            alt={t("uploadIconAlt")}
            width={43}
            height={43}
          />
          <p>{uploadMessage || t("uploadMessage")}</p>
          <h1>{fileFormats || t("fileFormats")}</h1>
        </div>
        <input
          ref={inputRef}
          hidden
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={onChange}
        />
      </div>
      {files.length > 0 && (
        <div className={classes.filePreview}>
          {files.map((file, idx) => {
            const displayName = (() => {
              if (!file) return "";
              if (typeof file === "string") {
                // attempt to derive human-readable name from key/path
                const parts = file.split("/");
                return parts[parts.length - 1] || file;
              }
              if (file.name) return file.name;
              if (file.key) return file.key.split("/").pop();
              return t("defaultFileName");
            })();
            return (
              <div key={idx} className={classes.fileItem}>
                <span>{fileDisplayName ? fileDisplayName : displayName}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className={classes.removeFileButton}
                >
                  <IoMdCloseCircle color="red" size={20} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {(() => {
        const errorMessage = typeof error === "string" && error 
          ? error 
          : localError && typeof localError === "object" && localError.key
            ? ct(localError.key, localError.params || {})
            : null;
        
        return errorMessage ? (
          <p className={classes.error}>*{String(errorMessage)}</p>
        ) : null;
      })()}
    </div>
  );
}
