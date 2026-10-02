import React from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import Button from "@/components/atoms/Button";
import Image from "next/image";
import classes from "./Style.module.css";
import { useTranslations } from "@/resources/hooks/useTranslations";

export default function SuccessModal({
  show,
  setShow,
  icon = "/svg/successSparkles.svg",
  title,
  btnText,
  content = "modal.SuccessModal",
  onClickbutton,
}) {
  const t = useTranslations(content);

  return (
    <ModalSkeleton
      show={show}
      setShow={setShow}
      header={" "}
      maxWidth={"486px"}
    >
      <div className={classes.main}>
        <Image src={icon} alt={"icon"} width={236} height={190} />
        <div>
          <h5>{title || t("title")}</h5>
        </div>
        <Button
          variant={"primary"}
          label={btnText || t("btnText")}
          onClick={() => {
            setShow(false);
            onClickbutton && onClickbutton();
          }}
        />
      </div>
    </ModalSkeleton>
  );
}
