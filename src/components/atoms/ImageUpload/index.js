"use client";
import { mergeClass } from "@/resources/utils/helper";
import Image from "next/image";
import { IoCloseCircle } from "react-icons/io5";
import classes from "./ImageUpload.module.css";
// import { mediaUrl } from "@/config";
import { imageUrl } from "@/resources/utils/helper";

export default function ImageUpload({ image, setImage, label, errorText }) {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file); // set file object directly
    }
  };

  const handleRemoveImage = () => {
    setImage("");
    document.getElementById("upload-input").value = null;
  };

  const getImageSrc = (img) => {
    if (typeof img === "string") {
      return imageUrl(img);
    }
    return URL.createObjectURL(img);
  };

  return (
    <div>
      <p className={classes.labelText}>{label}</p>
      <div className={classes.mainDiv}>
        {image ? (
          <Image
            src={getImageSrc(image)}
            alt="image"
            width={64}
            height={64}
            style={{
              borderRadius: "10px",
              objectFit: "contain",
            }}
          />
        ) : (
          <div
            className={mergeClass(classes.upload, "pointer")}
            onClick={() => document.getElementById("upload-input").click()}
          >
            <Image
              src="/images/svgs/camera.svg"
              alt="upload"
              width={32}
              height={32}
            />
          </div>
        )}
        {image && (
          <div className={classes.btnDiv}>
            <IoCloseCircle
              className="pointer"
              size={36}
              onClick={handleRemoveImage}
              color="var(--error-v1)"
            />
          </div>
        )}
      </div>
      <input
        id="upload-input"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />
      {errorText && <p className={`${classes.error}`}>*{errorText}</p>}
    </div>
  );
}
