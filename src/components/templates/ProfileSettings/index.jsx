"use client";
import Input from "@/components/atoms/Input/Input";
import PhoneInput from "@/components/atoms/PhoneInput/PhoneInput";
import TopHeader from "@/components/molecules/TopHeader/TopHeader";
import UploadPhoto from "@/components/molecules/UploadPhoto";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import classes from "./ProfileSettings.module.css";

export default function ProfileSettings() {
  const t = useTranslations("profileSettingsPage");
  const locale = useLocale();
  const { user } = useSelector((state) => state.authReducer);

  return (
    <Container className={mergeClass("containerFluid", classes.container)}>
      <TopHeader
        title={t("title")}
        icon={
          <Image
            src="/svg/profile.svg"
            alt="Profile Icon"
            height={16}
            width={16}
          />
        }
      />
      <div className={classes.main}>
        <div className={classes.left}>
          <UploadPhoto
            mainClass={classes.uploadPhotoMain}
            photo="/dev-images/dummyUser.png"
            setPhoto={() => {}}
          />
          <p>{user?.fullName?.[locale]}</p>
        </div>
        <div className={classes.right}>
          <Input
            label={t("fields.name")}
            placeholder={t("fields.namePlaceholder")}
          />
          <Input
            label={t("fields.email")}
            placeholder={t("fields.emailPlaceholder")}
          />
          <PhoneInput
            label={t("fields.phone")}
            placeholder={t("fields.phonePlaceholder")}
          />
          <Input
            label={t("fields.address")}
            placeholder={t("fields.addressPlaceholder")}
          />
        </div>
      </div>
    </Container>
  );
}
