"use client";
import { useEffect, useState } from "react";

export default function useDimensions() {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    // Set initial dimensions
    updateDimensions();

    // Add event listeners for resize
    window.addEventListener("resize", updateDimensions);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  return { width, height };
}
