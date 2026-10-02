"use client";
import { useLinkStatus } from "next/link";
import { Spinner } from "react-bootstrap";
import classes from "./styles.module.css";

export default function PageLoader() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <div className={classes.overlay}>
      <Spinner className={classes.spinner} />
    </div>
  );
}
