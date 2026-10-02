import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import UploadPhoto from "@/components/molecules/UploadPhoto";
import { addEditItemSchema } from "@/formik/schema/addEditItemSchema";
import { languageObject } from "@/i18n";
import { locales } from "@/i18n/routing";
import useAxios from "@/interceptor/axios-functions";
import useDirection from "@/resources/hooks/useDirection";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import {
  createFormData,
  imageUrl,
  mergeClass,
  translateText,
  validateMultiLingualForm,
} from "@/resources/utils/helper";
import { useFormik } from "formik";
import { useLocale } from "next-intl";
import { useState, useMemo, useEffect } from "react";
import ModalSkeleton from "../ModalSkeleton/ModalSkeleton";
import classes from "./styles.module.css";

export default function AddEditItemModal({
  show,
  setShow,
  editItem = null,
  onSave,
  onClose = () => {},
  categories = [],
}) {
  console.log(editItem, "editItem");
  const isEdit = Boolean(editItem);
  const locale = useLocale();
  const direction = useDirection(locale);
  const [dir, setDir] = useState(direction);
  const [loading, setLoading] = useState("");
  const { Post, Patch } = useAxios();
  const [selected, setSelected] = useState(locale);
  const [translating, setTranslating] = useState(false);
  const { t, setLocale } = useDynamicTranslations("manageItemsPage");

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale(selected);
  }, [selected, setLocale]);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return addEditItemSchema(t);
  }, [t, selected]);

  // Memoize shipping options to prevent unnecessary reinitializations
  const shippingOptions = useMemo(
    () => [
      { label: t("modal.deliverOptions.pickup"), value: "pickup" },
      { label: t("modal.deliverOptions.delivery"), value: "delivery" },
      {
        label: t("modal.deliverOptions.pickupDelivery"),
        value: "pickup-delivery",
      },
    ],
    [t]
  );

  // Transform categories based on selected language
  const transformedCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((item) => ({
        value: item?.slug,
        label: item?.name?.[selected] || item?.name?.[locale] || "",
      }));
    }
    return categories;
  }, [categories, selected, locale]);

  const initialValues = {
    itemName: { ...languageObject },
    stock: "",
    points: "",
    image: "",
    shippingOptions: null,
    category: null,
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: false, // Changed to false to prevent unnecessary reinitializations
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      createItemHandler(values);
    },
  });

  // Reset form when editItem changes (for edit mode)
  useEffect(() => {
    if (editItem) {
      formik.setValues({
        itemName: editItem?.name || { ...languageObject },
        stock: editItem?.stock || "",
        points: editItem?.points || "",
        image: editItem?.image || "",
        shippingOptions:
          shippingOptions?.find(
            (opt) => opt.value === editItem?.shippingOption
          ) || null,
        category:
          transformedCategories?.find(
            (c) =>
              c.value === (editItem?.categorySlug || editItem?.category?.slug)
          ) || null,
      });
    } else {
      formik.resetForm();
    }
  }, [editItem?.slug]);

  const createItemHandler = async (values) => {
    setLoading("creating");
    const formData = createFormData({
      ...locales?.reduce((acc, locale) => {
        acc[`name[${locale}]`] = values.itemName[locale] || "";
        return acc;
      }, {}),
      stock: values.stock,
      points: values.points,
      image: values.image,
      shippingOption: values.shippingOptions?.value,
      categorySlug: values?.category?.value,
    });

    const method = isEdit ? Patch : Post;
    const route = isEdit
      ? `admin/product/update/${editItem?.slug}`
      : "admin/product/create";
    const { response } = await method({
      route,
      data: formData,
      isFormData: true,
    });
    if (response) {
      RenderToast({
        type: "success",
        message: isEdit
          ? t("modal.toast.itemUpdatedSuccess")
          : t("modal.toast.itemCreatedSuccess"),
      });
      setShow(false);
      formik.resetForm();
      onSave(values);
    }
    setLoading("");
  };

  async function translateMessages() {
    const fields = ["itemName"];
    let missing = [];

    for (const field of fields) {
      const original = formik.values[field]?.[selected] || "";
      if (!original) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      RenderToast({
        type: "error",
        message: `${t("pleaseFill")}: ${missing.join(", ")}`,
      });
      return;
    }

    setTranslating(true);

    for (const field of fields) {
      const original = formik.values[field]?.[selected] || "";

      await Promise.all(
        locales.map(async (lang) => {
          if (lang === selected) return;
          try {
            const translated = await translateText(original, lang);
            formik.setFieldValue(`${field}.${lang}`, translated);
          } catch (err) {
            // ignore translation errors
          }
        })
      );
    }

    setTranslating(false);
    RenderToast({
      type: "success",
      message: t("modal.toast.translationSuccess"),
    });
  }

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
  }, [selected, t, validationSchema]);

  // Update category label when language changes
  useEffect(() => {
    if (formik.values.category && formik.values.category.value) {
      const updatedCategory = transformedCategories.find(
        (c) => c.value === formik.values.category.value
      );
      if (
        updatedCategory &&
        updatedCategory.label !== formik.values.category.label
      ) {
        formik.setFieldValue("category", updatedCategory);
      }
    }
  }, [selected, transformedCategories]);

  // Update shippingOptions label when language changes
  useEffect(() => {
    if (formik.values.shippingOptions && formik.values.shippingOptions.value) {
      const updatedShippingOption = shippingOptions.find(
        (opt) => opt.value === formik.values.shippingOptions.value
      );
      if (
        updatedShippingOption &&
        updatedShippingOption.label !== formik.values.shippingOptions.label
      ) {
        formik.setFieldValue("shippingOptions", updatedShippingOption);
      }
    }
  }, [selected, shippingOptions]);

  // const imageUploadHandler = async (val) => {
  //   setLoading("uploading");
  //   const formData = createFormData({ images: val });
  //   const { response } = await Post({
  //     route: "media/upload",
  //     data: formData,
  //     isFormData: true,
  //   });
  //   if (response) {
  //     const image = response.data.image.key;
  //     formik.setFieldValue("image", image);
  //   } else {
  //     RenderToast({
  //       type: "error",
  //       message: t("modal.toast.imageUploadError"),
  //     });
  //   }
  //   setLoading("");
  // };

  return (
    <ModalSkeleton
      setShow={setShow}
      onHide={() => {
        formik.resetForm();
        onClose();
      }}
      show={show}
      padding="20px 32px"
      header={isEdit ? t("modal.editHeader") : t("modal.addHeader")}
    >
      <div
        dir={dir}
        className={mergeClass(
          classes.main,
          dir === "ltr" ? "ignoreRtlNested" : ""
        )}
      >
        <LanguageSelector
          selected={selected}
          setSelected={(newSelected) => {
            setSelected(newSelected);
            setLocale(newSelected);
          }}
          setDirection={setDir}
        />
        <Button
          label={translating ? t("modal.translating") : t("modal.autoFill")}
          onClick={translateMessages}
          disabled={loading === "creating" || translating}
        />
        <UploadPhoto
          label={t("modal.photo")}
          photo={formik.values.image}
          setPhoto={(val) => formik.setFieldValue("image", val)}
          // setPhoto={(val) => imageUploadHandler(val)}
          errorText={formik.touched.image && formik.errors.image}
          dir={dir}
        />
        <Input
          dir={dir}
          placeholder={t("modal.itemNamePlaceholder")}
          label={t("modal.itemName")}
          value={formik.values.itemName?.[selected] || ""}
          setValue={(val) => formik.setFieldValue(`itemName.${selected}`, val)}
          errorText={
            formik.touched.itemName?.[selected] &&
            formik.errors.itemName?.[selected]
          }
          disabled={loading === "creating"}
        />
        <Input
          dir={dir}
          placeholder={t("modal.stockPlaceholder")}
          label={t("modal.stock")}
          type="number"
          value={formik.values.stock || ""}
          setValue={(val) => formik.setFieldValue("stock", val)}
          errorText={formik.touched.stock && formik.errors.stock}
          disabled={loading === "creating"}
          min={0}
        />
        <Input
          dir={dir}
          placeholder={t("modal.pointsPlaceholder")}
          label={t("modal.points")}
          type="number"
          value={formik.values.points || ""}
          setValue={(val) => formik.setFieldValue("points", val)}
          errorText={formik.touched.points && formik.errors.points}
          disabled={loading === "creating"}
          min={0}
        />

        <DropDown
          isPortal
          customStyle={{ height: "60px" }}
          label={t("modal.shippingOptions")}
          dir={dir}
          options={shippingOptions}
          dropDownContainerClass={classes.dropDownContainerClass}
          placeholder={t("modal.selectShippingOptions")}
          value={formik.values.shippingOptions || null}
          setValue={(val) => formik.setFieldValue("shippingOptions", val)}
          error={
            formik.touched.shippingOptions && formik.errors.shippingOptions
          }
        />

        <DropDown
          isPortal
          label={t("modal.categoryLabel")}
          dir={dir}
          options={transformedCategories}
          dropDownContainerClass={classes.dropDownContainerClass}
          placeholder={t("modal.categoryPlaceholder")}
          value={formik.values.category || null}
          setValue={(val) => formik.setFieldValue("category", val)}
          error={formik.touched.category && formik.errors.category}
          menuPlacement="top"
        />

        <div className={classes.ButtonContainer}>
          <Button
            variant="outlined"
            label={t("modal.cancel")}
            onClick={() => {
              onClose();
              formik.resetForm();
            }}
            disabled={loading === "creating"}
          />
          <Button
            variant="primary"
            label={isEdit ? t("modal.update") : t("modal.add")}
            disabled={loading === "creating" || translating}
            loading={loading === "creating"}
            showSpinner
            onClick={() => {
              validateMultiLingualForm({
                fields: ["itemName"],
                currentLanguage: selected,
                formik: formik,
              });
            }}
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}
