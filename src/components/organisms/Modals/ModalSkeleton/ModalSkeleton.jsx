"use client";

import { mergeClass } from "@/resources/utils/helper";
import Image from "next/image";
import { Modal } from "react-bootstrap";
import classes from "./ModalSkeleton.module.css";
export default function ModalSkeleton({
  show,
  onHide,
  setShow,
  header,
  children,
  modalClass,
  skeletonClass,
  headerStyles,
  headerClass,
  border,
  background = "var(--Primary-White)",
  overlayBg = "#03233EB2",
  padding = "32px 20px",
  borderRadius = "16px",
  closeIconClass,
  customHeader = null,
  maxWidth = "600px", // NEW: allow dynamic maxWidth
}) {
  function handleClose() {
    onHide && onHide();
    setShow(false);
  }
  return (
    <>
      <style>{`
      html {
        overflow: ${show ? "hidden" : "auto"};
      }
      
        ${
          overlayBg &&
          `.modal-backdrop {
            background-color: ${overlayBg} !important;
            opacity: 0.95 !important;
          }`
        }

        .modal {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 !important;
        }
        .modal-dialog {
          width: auto;
          max-width: ${maxWidth};
          min-width: 0;
          margin: 0 auto;
          height: 100%;
        }
        .modal-content {
          display: flex;
          flex-direction: column;
          padding: ${padding} !important;
          background-color: ${background} !important;
          border-radius: ${borderRadius} !important;
          ${border ? "border: none;" : ""}
          margin: auto auto;
          overflow: hidden;
          height: auto !important;
          max-height: 90vh;
          box-sizing: border-box;
          border: none;
          gap: 20px;
        }
        .modal-header {
          border-bottom: none !important;
          padding: 0px !important;

        }
        .modal-backdrop {
          background: rgba(0, 0, 0, 0.10);
        }
        .${classes.header} button {
          color: var(--black-new) !important;
        }
        .modal-body {
          ${border ? "background: transparent;" : ""}
          padding: 0px !important;
          overflow: auto;
          background-color: ${background} !important;
        }
        .modal-body::-webkit-scrollbar {
          display: none;
        }
        @media screen and (max-width: 992px) {
          .modal .modal-dialog {
            max-width: 90vw;
            width: 90vw;
          }
          .modal-content {
            padding: 1.5rem !important;
          }
        }
        @media screen and (max-width: 768px) {
          .modal .modal-dialog {
            max-width: 95vw;
            width: 98vw;
          }
          .modal-content {
            padding: 1rem !important;
          }
        }
        @media screen and (max-width: 575px) {
          .modal .modal-dialog {
            max-width: 100vw;
            width: 95vw;
          }
          .modal-content {
            padding: 1.2rem !important;
          }
        }
      `}</style>

      <Modal
        show={show}
        onHide={handleClose}
        centered
        className={mergeClass(classes.modal, skeletonClass)}
      >
        {customHeader
          ? customHeader
          : header && (
              <Modal.Header className={mergeClass(classes.header, headerClass)}>
                <p style={{ ...headerStyles }}>{header}</p>

                <div
                  className={mergeClass(classes.closeIconMain, closeIconClass)}
                  onClick={() => setShow(false)}
                >
                  <Image
                    src={"/svg/CloseIconContainer.svg"}
                    height={30}
                    width={30}
                    alt="cross"
                  />
                </div>
              </Modal.Header>
            )}
        <Modal.Body className={mergeClass(classes.body, modalClass)}>
          {children}
        </Modal.Body>
      </Modal>
    </>
  );
}
