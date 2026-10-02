import React from "react";
import ReactQuill from "react-quill-new";
import classes from "./QuillInput.module.css";
import "react-quill-new/dist/quill.snow.css";

function QuillInput({
  value,
  setValue,
  quillClass = "",
  placeholder = "",
  label,
  errorText,
  dir = "ltr",
  ...rest
}) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link"],
      ["clean"],
    ],
  };
  return (
    <>
      <style>
        {`
          .ql-editor .ql-blank::before {
           font-style: none !important;
          }
          
        `}
      </style>
      <div dir={dir}>
        {label && <label className={classes.label}>{label}</label>}
        <div className={classes.quillInput} dir={dir}>
          <ReactQuill
            className={`${classes.quill} ${quillClass}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              if (typeof setValue === "function") setValue(e);
            }}
            modules={modules}
            {...rest}
          />
        </div>
        {errorText && <p className={classes.errorText}>*{errorText}</p>}
      </div>
    </>
  );
}

export default QuillInput;
