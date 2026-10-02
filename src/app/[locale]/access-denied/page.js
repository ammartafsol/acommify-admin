"use client";
import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "@/resources/hooks/useTranslations";
import styles from "./styles.module.css";
import { useLocaleAwareBack } from "@/resources/hooks/useLocaleAwareBack";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const back = useLocaleAwareBack();
  const t = useTranslations("common");

  const route = searchParams.get("route");
  const required = searchParams.get("required");
  console.log("Required Permissions:", { required });
  const userRole = searchParams.get("user_role");
  const userPermissions = searchParams.get("user_permissions");
  const reason = searchParams.get("reason");

  const handleGoBack = () => {
    back();
  };

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.content}>
          {/* Error Icon */}
          <div className={styles.iconContainer}>
            <svg
              className={styles.icon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className={styles.title}>Access Denied</h1>

          {/* Message based on reason */}
          {reason === "admin_required" ? (
            <p className={styles.message}>
              This page requires administrator privileges. Please contact your
              system administrator if you believe you should have access.
            </p>
          ) : (
            <p className={styles.message}>
              You don&apos;t have the necessary permissions to access this page.
              Please contact your administrator to request access.
            </p>
          )}

          {/* Development Info */}
          {process.env.NODE_ENV === "development" && (
            <div className={styles.debugInfo}>
              <h3 className={styles.debugTitle}>Debug Information</h3>
              <div className={styles.debugContent}>
                {route && (
                  <div className={styles.debugItem}>
                    <span className={styles.debugLabel}>Route:</span> {route}
                  </div>
                )}
                {userRole && (
                  <div className={styles.debugItem}>
                    <span className={styles.debugLabel}>Your Role:</span>{" "}
                    {userRole}
                  </div>
                )}
                {required && (
                  <div className={styles.debugItem}>
                    <span className={styles.debugLabel}>
                      Required Permissions:
                    </span>{" "}
                    {required.split(",").join(", ")}
                  </div>
                )}
                {userPermissions && (
                  <div className={styles.debugItem}>
                    <span className={styles.debugLabel}>Your Permissions:</span>{" "}
                    {userPermissions.split(",").join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.buttonGroup}>
            <button
              onClick={handleGoBack}
              className={`${styles.button} ${styles.backButton}`}
            >
              Go Back
            </button>
            <button
              onClick={handleGoHome}
              className={`${styles.button} ${styles.homeButton}`}
            >
              Go to Dashboard
            </button>
          </div>

          {/* Contact Info */}
          <div className={styles.contact}>
            <p className={styles.contactText}>
              Need help? Contact your system administrator or{" "}
              <a
                href="mailto:support@acommify.com"
                className={styles.contactLink}
              >
                support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
