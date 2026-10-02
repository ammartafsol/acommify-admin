import React from "react";
import { Flip, toast } from "react-toastify";

const RenderToast = ({
  type = "error",
  message = "Internal Server Error",
  ...props
}) => {
  let toastId =
    typeof window !== "undefined" &&
    localStorage.getItem("RT_ERROR_IDENTIFIER");
  let toastDetailObject = {
    position: "top-right",
    autoClose: 2000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Flip,
    ...props,
  };
  const HandleSetErrorOnLocalStorage = () => {
    typeof window !== "undefined" &&
      localStorage.setItem("RT_ERROR_IDENTIFIER", "Error Render");
    return toast[type](message, {
      ...toastDetailObject,
      toastId: "Error Render",
    });
  };
  return (
    <div>
      {toast.isActive(toastId)
        ? toast.update(toastId, {
            ...toastDetailObject,
            render: message,
            type: type,
          })
        : HandleSetErrorOnLocalStorage()}
    </div>
  );
};

export default RenderToast;
