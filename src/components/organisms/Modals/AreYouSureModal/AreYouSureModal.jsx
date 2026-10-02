import Button from "@/components/atoms/Button";
import { useTranslations } from "@/resources/hooks/useTranslations";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./AreYouSureModal.module.css";

export default function AreYouSureModal({
  show,
  setShow,
  loading,
  onConfirm,
  message,
}) {
  const t = useTranslations("common");
  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      width="max-content"
      padding="30px"
      borderRadius="24px"
      // header={t("areYouSure")}
      maxWidth="360px"
    >
      <div className={classes.container}>
        <h5 className={classes.title}>{t("areYouSure")}</h5>
        <p className={classes.message}>{message || t("areYouSureMessage")}</p>
        <div className={classes.actions}>
          <Button
            label={t("cancel")}
            variant={"outlined"}
            onClick={() => setShow(false)}
          />
          <Button
            className={classes.confirmButton}
            variant={"primary"}
            onClick={onConfirm}
            label={loading ? t("proceeding") : t("confirm")}
            loading={loading}
            showSpinner
            disabled={loading}
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
