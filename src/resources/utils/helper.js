import RenderToast from "@/components/atoms/RenderToast";
import config from "@/config";
import { languageOptions } from "@/i18n";
import React from "react";
import { formRegEx, formRegExReplacer } from "./regex";
import { Flip, toast } from "react-toastify";

export const mergeClass = (...classes) => {
  return classes.join(" ");
};

export async function getFileFromKey(
  key,
  fileName = "file",
  setValue = () => {},
  blobType = "application/pdf",
) {
  if (key) {
    const fileType = key.split(".").pop();
    const response = await fetch(imageUrl(key));
    const blob = await response.blob();
    const file = new File([blob], `${fileName}.${fileType}`, {
      type: blobType || blob.type,
    });
    setValue(file);
    return file;
  }
}

export const getFilteredObjectRemove = (object, keys) => {
  let filteredObject = { ...object };
  keys.forEach((key) => {
    delete filteredObject[key];
  });
  return filteredObject;
};

export const returnKeyEmptyAsPerType = (input) => {
  // If input is an array, recurse for each item
  if (Array.isArray(input)) {
    return input.map((item) => returnKeyEmptyAsPerType(item));
  }

  // If input is an object, recurse for each key
  if (typeof input === "object" && input !== null) {
    let emptyObject = {};
    for (let key in input) {
      if (unWantedKeys.includes(key)) continue; // Skip unwanted keys
      emptyObject[key] = returnKeyEmptyAsPerType(input[key]);
    }
    return emptyObject;
  }

  // If it's a string, return an empty string
  if (typeof input === "string") {
    return "";
  }

  // If it's anything else, return the input as is (or handle as needed)
  return input;
};

export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Formatters
export const getFormattedParams = (label) => {
  return capitalizeEachWord(label.replace(formRegEx, formRegExReplacer));
};
export const unWantedKeys = [
  "key",
  "_id",
  "__v",
  "updatedAt",
  "createdAt",
  "__comment",
  "_comment",
  "updatedAt",
  "type",
  "phase",
];

export const getFormattedPrice = (price, currency = "$", toFixed) => {
  return `${currency}${parseFloat(price).toFixed(
    toFixed !== undefined ? toFixed : 2,
  )}`;
};

export const capitalizeEachWord = (str) => {
  return str?.replace(/\w\S*/g, (w) =>
    w.replace(/^\w/, (c) => c.toUpperCase()),
  );
};

// API/URL Helpers
export const baseURL = (link) => `${config.apiBaseUrl}/api/v1/${link}`;

export const imageUrl = (url, defaultUrl = null) => {
  if (!url || url === "")
    return defaultUrl || "/app-images/default-fallback-image.png";

  if (url?.startsWith("/")) return url;

  const match = url.match(/\/d\/([^/]+)\//); // Remove this, Just for showing the image from google drive
  if (!(!match || match.length < 2)) {
    // Remove this
    const fileId = match[1]; // Remove this
    return `https://drive.google.com/uc?export=view&id=${fileId}`; // Remove this
  } // Remove this

  const result = url.indexOf("http");

  const imageRenderUrl = result === -1 ? `${config.awsBaseUrl}/${url}` : url;

  return imageRenderUrl;
};

const HTML_TAG_RE = /<\/?[a-z][^>]*>/gi;
const HTML_TAG_TEST_RE = /<\/?[a-z][^>]*>/i;

async function translatePlainText(text, targetLang) {
  if (!text?.trim()) return text;

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        text,
      )}`,
    );
    const data = await response.json();
    const translated = (data[0] || []).map((seg) => seg[0]).join("");
    return translated || text;
  } catch (err) {
    console.error(err);
    return text;
  }
}

export async function translateText(text, targetLang) {
  if (!text) return text;

  if (!HTML_TAG_TEST_RE.test(text)) {
    return translatePlainText(text, targetLang);
  }

  const parts = text.split(HTML_TAG_RE);
  const tags = text.match(HTML_TAG_RE) || [];

  const translatedParts = await Promise.all(
    parts.map(async (part) => {
      if (!part || !part.trim()) return part;
      return translatePlainText(part, targetLang);
    }),
  );

  let result = "";
  for (let i = 0; i < translatedParts.length; i++) {
    result += translatedParts[i] || "";
    if (i < tags.length) {
      result += tags[i];
    }
  }

  return result;
}

export const createFormData = (data) => {
  const formData = new FormData();
  for (let key in data) {
    if (Array.isArray(data[key])) {
      for (let d in data[key]) {
        if (typeof data[key][d] == "string") {
          formData.append(key, data[key][d]);
        } else if (
          data[key][d] instanceof File ||
          data[key][d] instanceof Date
        ) {
          formData.append(key, data[key][d]);
        } else {
          formData.append(key, JSON.stringify(data[key][d]));
        }
      }
    } else if (typeof data[key] == "object") {
      if (data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, JSON.stringify(data[key]));
      }
    } else {
      formData.append(key, data[key]);
    }
  }

  return formData;
};

export const apiHeader = (token, isFormData) => {
  if (token && !isFormData) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  }

  if (token && isFormData) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    };
  }
  if (!token && !isFormData) {
    return {
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  if (!token && isFormData) {
    return {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
  }
};

// Media Helpers
export const uploadImages = async (images, Post) => {
  if (!images.length) return null;

  const formData = new FormData();
  images.forEach((image) => {
    formData.append("photos", image);
  });

  const { response } = await Post({
    route: "media/upload",
    data: formData,
    isFormData: true,
  });

  if (response && response.data?.data?.photos) {
    return response.data.data.photos.map((item) => item?.key);
  }
  return null;
};

export const uploadImagesHelper = async ({
  images,
  setIsLoading,
  setImages,
  token,
}) => {
  if (images.length === 0) return;
  setIsLoading(true);
  uploadImages(images, token)
    .then((res) => {
      if (res) {
        setImages((prev) => [...prev, ...res]);
      }
      setIsLoading(false);
    })
    .finally(() => {
      setIsLoading(false);
    });
};

export const deleteMedia = async ({
  slug,
  key,
  setIsLoading,
  token,
  setImages,
  entity,
}) => {
  const url = baseURL("media/delete");
  const params = { slug: slug, key, type: "image", entity };
  setIsLoading(true);
  const res = await Patch(url, params, apiHeader(token));
  if (res) {
    setImages((prev) => prev.filter((item) => item !== key));
  }
  setIsLoading(false);
};

// Browser Helpers
export const getUniqueBrowserId = () => {
  const uniqueBrowserId = localStorage?.getItem("uniqueBrowserId");
  if (uniqueBrowserId) {
    return uniqueBrowserId;
  }

  if (window.navigator) {
    var navigator_info = window.navigator;
    var screen_info = window.screen;
    var uid = navigator_info.mimeTypes.length;
    uid += navigator_info.userAgent.replace(/\D+/g, "");
    uid += navigator_info.plugins.length;
    uid += screen_info.height || "";
    uid += screen_info.width || "";
    uid += screen_info.pixelDepth || "";

    localStorage.setItem("uniqueBrowserId", uid);
    return uid;
  } else {
    const theId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    localStorage.setItem("uniqueBrowserId", theId);
    return theId;
  }
};

export function splitTextIntoTags(text, tag, wordsPerLine) {
  const words = text.split(" ");
  const lines = [];

  for (let i = 0; i < words.length; i += wordsPerLine) {
    const line = words.slice(i, i + wordsPerLine).join(" ");
    lines.push(line);
  }

  return lines?.map((line, index) =>
    React.createElement(tag, { key: index }, line),
  );
}

export const formatDateTimeForInput = (dateTimeString) => {
  if (!dateTimeString) return "";

  const [datePart, timePart] = dateTimeString.split(" • ");

  let [time, modifier] = timePart.split(/(?=[AP]M)/);
  let [hours, minutes] = time.split(":");

  if (hours === "12") {
    hours = "00";
  }
  if (modifier === "PM") {
    hours = parseInt(hours, 10) + 12;
  }

  return `${datePart}T${hours}:${minutes}`;
};

// Formik Helpers
export const validateMultiLingualField = ({ fieldValue, fieldName }) => {
  if (!fieldValue) return false;
  const requiredLanguages = [];
  for (const [lang, value] of Object.entries(fieldValue)) {
    if (!value?.trim()) {
      const language = languageOptions.find((l) => l.value === lang);
      const languageLabel = language?.label || lang;
      requiredLanguages.push(languageLabel);
    }
  }
  if (requiredLanguages.length > 0) {
    toast(`Please fill the ${fieldName} in ${requiredLanguages.join(", ")}`, {
      toastId: "multiLingualFieldError",
      type: "error",
      position: "top-right",
      autoClose: 2000,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Flip,
    });

    return false;
  }

  return true;
};

export const getAgeFromDOB = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    years--;
  }

  // If less than 1 year old, return months
  if (years === 0) {
    let months = today.getMonth() - birthDate.getMonth();
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }
    if (months < 0) {
      months += 12;
    }
    // return `${months} ${months === 1 ? "month" : "months"}`;
    return `${months} ${months === 1 ? "year" : "years"}`;
  }

  return `${years} ${years === 1 ? "year" : "years"}`;
};

// Helper function to get nested value from object using string path
const getNestedValue = (obj, path) => {
  return path
    .split(/[.[\]]+/)
    .filter(Boolean)
    .reduce((acc, key) => acc?.[key], obj);
};

export const validateMultiLingualForm = ({
  fields = [],
  currentLanguage,
  formik,
}) => {
  for (const field of fields) {
    // Handle nested fields like "familyMembers[0].fullName"
    const fieldValue = getNestedValue(formik.values, field);
    const currentValue = fieldValue?.[currentLanguage] || "";
    if (!currentValue) continue;
    validateMultiLingualField({
      fieldName: capitalizeEachWord(
        field
          ?.replace(/\[(\d+)\]/g, (_, num) => ` ${Number(num) + 1}`)
          .replace(/\./g, " "),
      ),
      fieldValue: fieldValue,
    });
  }
  formik.handleSubmit();
};

export const isAdminOrBusinessOwner = (role) => {
  return ["admin", "business-owner"]?.includes(role);
};
