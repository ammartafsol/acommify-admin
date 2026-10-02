"use client";
import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import styles from "./DropdownMenu.module.css";
import { BsThreeDots } from "react-icons/bs";

export default function DropdownMenu({ data = [], isVertical }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.dropdown} ref={menuRef}>
      <button className={styles.iconButton} onClick={() => setOpen(!open)}>
        {isVertical ? (
          <FiMoreVertical size={18} color="#000" />
        ) : (
          <BsThreeDots size={24} color="#000" />
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className={styles.menu}>
          {data.map((item, index) => (
            <button
              key={index}
              className={styles.item}
              onClick={item.onClick}
              style={item.style}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
