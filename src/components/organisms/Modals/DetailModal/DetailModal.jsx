"use client";
import React from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";

export default function DetailModal({ show, setShow, children, title }) {
  return (
    <ModalSkeleton header={title} show={show} setShow={setShow}>
      {children}
    </ModalSkeleton>
  );
}
