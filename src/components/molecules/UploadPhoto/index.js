"use client";

import React, { useRef, useState, useCallback } from "react";
import classes from "./UploadPhoto.module.css";
import Image from "next/image";
import { imageUrl, mergeClass } from "@/resources/utils/helper";
import { FaCamera } from "react-icons/fa6";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import ModalSkeleton from "@/components/organisms/Modals/ModalSkeleton/ModalSkeleton";
import Button from "@/components/atoms/Button";

export default function UploadPhoto({
  photo = "/app-images/default-user.png",
  setPhoto,
  mainClass,
  label,
  onFileUpload,
  errorText,
  ClassCustom = "",
  title,
  disabled = false,
  onRemove,
  circularCrop = true, // Default to circular crop for profile photos
  minWidth = 300, // Minimum width for crop area (in pixels)
  minHeight = 300, // Minimum height for crop area (in pixels)
}) {
  const fileInputRef = useRef();
  const imgRef = useRef(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState({
    unit: "px",
    width: 90,
    height: 90,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [currentCropDimensions, setCurrentCropDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [imageScale, setImageScale] = useState({ scaleX: 1, scaleY: 1 });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create image preview for cropping
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImgSrc(reader.result.toString() || "");
      setShowCropModal(true);
      // Reset crop to default and scale
      setCrop({
        unit: "px",
        width: 90,
        height: 90,
        x: 0,
        y: 0,
      });
      setImageScale({ scaleX: 1, scaleY: 1 });
    });
    reader.readAsDataURL(file);
  };

  // Calculate current crop dimensions in pixels
  const calculateCropDimensions = useCallback((cropValue) => {
    if (!imgRef.current || !cropValue) {
      setCurrentCropDimensions({ width: 0, height: 0 });
      return;
    }

    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    let width, height;

    if (cropValue.unit === "%") {
      // For percentage, calculate based on displayed image size, then scale to natural
      const displayWidth = (cropValue.width / 100) * image.width;
      const displayHeight = cropValue.height
        ? (cropValue.height / 100) * image.height
        : displayWidth / (cropValue.aspect || 1);

      width = displayWidth * scaleX;
      height = displayHeight * scaleY;
    } else {
      // For pixels, scale from displayed to natural size
      width = cropValue.width * scaleX;
      height = cropValue.height ? cropValue.height * scaleY : width;
    }

    setCurrentCropDimensions({
      width: Math.round(width),
      height: Math.round(height),
    });
  }, []);

  const onImageLoad = useCallback(
    (e) => {
      const {
        naturalWidth,
        naturalHeight,
        width: displayedWidth,
        height: displayedHeight,
      } = e.currentTarget;

      // Calculate scale factors between displayed and natural dimensions
      const scaleX = naturalWidth / displayedWidth;
      const scaleY = naturalHeight / displayedHeight;

      // Store scale factors for later use
      setImageScale({ scaleX, scaleY });

      // Convert min dimensions from natural pixels to displayed pixels
      const minDisplayedWidth = minWidth / scaleX;
      const minDisplayedHeight = minHeight / scaleY;

      // Set initial crop to center of displayed image
      // Use 80% of the smaller displayed dimension, but ensure it meets minimums
      let cropDisplayedWidth = Math.min(displayedWidth, displayedHeight) * 0.8;
      let cropDisplayedHeight = cropDisplayedWidth;

      // Ensure crop size respects minimum dimensions
      if (minDisplayedWidth && cropDisplayedWidth < minDisplayedWidth) {
        cropDisplayedWidth = Math.min(minDisplayedWidth, displayedWidth);
      }
      if (minDisplayedHeight && cropDisplayedHeight < minDisplayedHeight) {
        cropDisplayedHeight = Math.min(minDisplayedHeight, displayedHeight);
      }

      // Ensure we don't exceed image bounds
      cropDisplayedWidth = Math.min(cropDisplayedWidth, displayedWidth);
      cropDisplayedHeight = Math.min(cropDisplayedHeight, displayedHeight);

      const newCrop = {
        unit: "px",
        width: cropDisplayedWidth,
        height: cropDisplayedHeight,
        x: (displayedWidth - cropDisplayedWidth) / 2,
        y: (displayedHeight - cropDisplayedHeight) / 2,
      };

      setCrop(newCrop);
      // Calculate initial dimensions
      setTimeout(() => calculateCropDimensions(newCrop), 0);
    },
    [minWidth, minHeight, calculateCropDimensions]
  );

  const getCroppedImg = useCallback(
    async (image, crop) => {
      if (!crop || !image) {
        return null;
      }

      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = crop.width * scaleX * pixelRatio;
      canvas.height = crop.height * scaleY * pixelRatio;

      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = "high";

        const cropX = crop.x * scaleX;
        const cropY = crop.y * scaleY;

        ctx.save();

        if (circularCrop) {
          // Create circular crop
          ctx.beginPath();
          ctx.arc(
            canvas.width / (2 * pixelRatio),
            canvas.height / (2 * pixelRatio),
            Math.min(canvas.width, canvas.height) / (2 * pixelRatio),
            0,
            2 * Math.PI
          );
          ctx.clip();
        }

        ctx.drawImage(
          image,
          cropX,
          cropY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width * scaleX,
          crop.height * scaleY
        );

        ctx.restore();
      }

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            const file = new File([blob], "cropped-image.png", {
              type: "image/png",
            });
            resolve(file);
          },
          "image/png",
          1
        );
      });
    },
    [circularCrop]
  );

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) {
      setShowCropModal(false);
      return;
    }

    const croppedImage = await getCroppedImg(imgRef.current, completedCrop);
    if (croppedImage) {
      setPhoto(croppedImage);
      if (onFileUpload) {
        onFileUpload(croppedImage, 0);
      }
    }

    setShowCropModal(false);
    setImgSrc("");
    setCompletedCrop(null);
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setImgSrc("");
    setCompletedCrop(null);
    setImageScale({ scaleX: 1, scaleY: 1 });
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleRemove = () => {
    setPhoto(null);
    if (onRemove) onRemove();
  };

  // Helper to handle both string and File for photo
  function getPhotoSrc(photo) {
    if (!photo) return "/svg/upload.svg";
    if (typeof photo === "string") return imageUrl(photo);
    if (
      typeof photo === "object" &&
      (photo instanceof File || photo.type?.startsWith("image/"))
    )
      return URL.createObjectURL(photo);
    return "/svg/userGroup.svg";
  }

  // Calculate displayed min dimensions for ReactCrop
  // ReactCrop works with displayed image coordinates, not natural pixels
  const getDisplayedMinDimensions = () => {
    if (imgRef.current && imageScale.scaleX > 0 && imageScale.scaleY > 0) {
      return {
        minWidth: minWidth / imageScale.scaleX,
        minHeight: minHeight / imageScale.scaleY,
      };
    }
    return { minWidth, minHeight };
  };

  const displayedMinDims = getDisplayedMinDimensions();

  return (
    <>
      <div className={mergeClass(mainClass, classes.main)}>
        <div className={classes.photoContainer}>
          {label && (
            <p>
              {label} <span className={classes.required}>*</span>
            </p>
          )}
          <div>
            <div
              className={ClassCustom ? ClassCustom : classes.photo}
              style={{ cursor: disabled ? "not-allowed" : "pointer" }}
              onClick={() =>
                !disabled &&
                fileInputRef.current &&
                fileInputRef.current.click()
              }
            >
              <Image src={getPhotoSrc(photo)} alt="Upload Photo" fill />
              <div className={classes.add}>
                <FaCamera size={20} color="#8C939B" />
              </div>
            </div>
            {title && <p className={classes.title}>{title}</p>}
          </div>
          {errorText && <p className={classes.errorText}>*{errorText}</p>}
        </div>
        <div className={classes.btnsMain}>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleUpload}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Crop Modal */}
      <ModalSkeleton
        show={showCropModal}
        setShow={setShowCropModal}
        header="Crop Image"
        maxWidth="600px"
        padding="24px"
        borderRadius="16px"
      >
        <div className={classes.cropContainer}>
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => {
                setCrop(c);
                calculateCropDimensions(c);
              }}
              onComplete={(c) => {
                setCompletedCrop(c);
                calculateCropDimensions(c);
              }}
              minWidth={displayedMinDims.minWidth}
              minHeight={displayedMinDims.minHeight}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt="Crop"
                src={imgSrc}
                onLoad={onImageLoad}
                style={{ maxWidth: "100%", maxHeight: "70vh" }}
              />
            </ReactCrop>
          )}

          <div className={classes.cropDimensionsInfo}>
            <div className={classes.dimensionItem}>
              <span className={classes.dimensionLabel}>Current Size:</span>
              <span
                className={`${classes.dimensionValue} ${
                  currentCropDimensions.width < minWidth ||
                  currentCropDimensions.height < minHeight
                    ? classes.dimensionWarning
                    : ""
                }`}
              >
                {currentCropDimensions.width} x {currentCropDimensions.height}{" "}
                px
              </span>
            </div>
            <div className={classes.dimensionItem}>
              <span className={classes.dimensionLabel}>
                Minimum Recommended:
              </span>
              <span className={classes.dimensionValue}>
                {minWidth} x {minHeight} px
              </span>
            </div>
          </div>

          <div className={classes.cropActions}>
            <Button
              label="Cancel"
              variant="outlined"
              onClick={handleCancelCrop}
              className={classes.cropButton}
            />
            <Button
              label="Crop"
              variant="primary"
              onClick={handleCropComplete}
              className={classes.cropButton}
              disabled={
                !completedCrop ||
                currentCropDimensions.width < minWidth ||
                currentCropDimensions.height < minHeight
              }
            />
          </div>
        </div>
      </ModalSkeleton>
    </>
  );
}
