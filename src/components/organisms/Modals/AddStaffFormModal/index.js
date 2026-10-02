"use client";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input/Input";
import LanguageSelector from "@/components/atoms/LanguageSelector/LanguageSelector";
import PhoneInput from "@/components/atoms/PhoneInput/PhoneInput";
import RenderToast from "@/components/atoms/RenderToast";
import DropDown from "@/components/molecules/DropDown/DropDown";
import ModalSkeleton from "@/components/organisms/Modals/ModalSkeleton/ModalSkeleton";
import { permissionsList } from "@/constants/permission";
import { addNewStaffSchema } from "@/formik/schema/addNewStaffSchema";
import { languageObject, locales } from "@/i18n";
import useAxios from "@/interceptor/axios-functions";
import useDirection from "@/resources/hooks/useDirection";
import { useDynamicTranslations } from "@/resources/hooks/useDynamicTranslations";
import {
  mergeClass,
  translateText,
  validateMultiLingualForm,
} from "@/resources/utils/helper";
import { Menu, MenuItem, SubMenu } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import { useFormik } from "formik";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuClock } from "react-icons/lu";
import classes from "./style.module.css";

export default function AddStaffFormModal({ setShow, show, data, getData }) {
  const { Post, Patch, Get } = useAxios();
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(data);
  const locale = useLocale();
  const [selected, setSelected] = useState(locale);
  const { t, setLocale: setLocale1 } = useDynamicTranslations("staffsPage");
  const { t: permissionsT, setLocale: setLocale2 } =
    useDynamicTranslations("permissions");
  const [translating, setTranslating] = useState(false);
  const direction = useDirection();
  const [dir, setDir] = useState(direction);
  const [positionsData, setPositionsData] = useState([]);
  const menuAlign = dir === "ltr" ? "start" : "end";
  const [permissions, setPermissions] = useState(new Map());

  // Sync dynamic locale with selected language
  useEffect(() => {
    setLocale1(selected);
    setLocale2(selected);
  }, [selected, setLocale1, setLocale2]);

  // Make validation schema reactive to language changes
  const validationSchema = useMemo(() => {
    return addNewStaffSchema(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, selected]);

  useEffect(() => {
    async function getPositionsData() {
      setLoading("loading");

      const { response } = await Get({
        route: `admin/position/all?status=active`,
      });

      if (response) {
        setPositionsData(response?.data);
      }
      setLoading("");
    }
    getPositionsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialValues = {
    fullName: { ...languageObject },
    email: "",
    callingCode: "+44",
    phoneNumber: "",
    shiftStart: "",
    shiftEnd: "",
    positionSlug: null,
    permissions: [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: false, // Changed to false to prevent unnecessary reinitializations
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit(values) {
      handleAddEdit(values);
    },
  });

  // Reset form when data changes (for edit mode)
  useEffect(() => {
    if (data) {
      formik.setValues({
        fullName: data?.fullName || { ...languageObject },
        email: data?.email || "",
        callingCode: data?.callingCode || "+44",
        phoneNumber: data?.callingCode + data?.phoneNumber || "",
        shiftStart: data?.shiftStart || "",
        shiftEnd: data?.shiftEnd || "",
        positionSlug:
          data?.position && positionsData.length > 0
            ? {
                label:
                  positionsData.find((pos) => pos._id === data?.position)
                    ?.name?.[selected] ||
                  positionsData.find((pos) => pos._id === data?.position)
                    ?.name?.[locale],
                value: data?.positionSlug,
              }
            : null,
        permissions:
          data?.permissions?.filter((p) => p !== "view-dashboard") || [],
      });
    } else {
      formik.resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.slug, positionsData]); // Only reset when staff actually changes (using slug as identifier)

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik.touched && Object.keys(formik.touched).length > 0) {
      formik.validateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, t, validationSchema]);

  // Update permissions when data changes - keep all individual permissions
  useEffect(() => {
    if (
      data &&
      Array.isArray(data.permissions) &&
      data.permissions.length > 0
    ) {
      const individualPerms =
        data.permissions?.filter((p) => p !== "view-dashboard") || [];
      const currentPerms =
        formik.values.permissions?.filter((p) => p !== "view-dashboard") || [];
      // Only update if permissions actually changed to avoid infinite loops
      if (
        JSON.stringify(individualPerms.sort()) !==
        JSON.stringify(currentPerms.sort())
      ) {
        formik.setFieldValue("permissions", individualPerms);
        // Update permissions Map
        const newMap = new Map();
        individualPerms.forEach((p) => newMap.set(p, p));
        setPermissions(newMap);
      }
    } else if (!data) {
      // Reset permissions when modal is closed or data is cleared
      formik.setFieldValue("permissions", []);
      setPermissions(new Map());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.permissions, data]);

  // Update positionSlug label when language changes
  useEffect(() => {
    if (formik.values.positionSlug?.value && positionsData.length > 0) {
      const position = positionsData.find(
        (pos) => pos.slug === formik.values.positionSlug.value
      );
      if (position) {
        const updatedLabel =
          position.name?.[selected] || position.name?.[locale];
        if (updatedLabel !== formik.values.positionSlug.label) {
          formik.setFieldValue("positionSlug", {
            label: updatedLabel,
            value: formik.values.positionSlug.value,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, positionsData]);

  const handleAddEdit = async (values) => {
    // Proceed with submission if no missing translations
    let permissions = [...values.permissions];
    if (!permissions.includes("view-dashboard")) {
      permissions.unshift("view-dashboard");
    }

    const payload = {
      fullName: values.fullName,
      callingCode: values.callingCode,
      email: values.email,
      phoneNumber: values.phoneNumber?.replace(values.callingCode, "") || "",
      positionSlug: values.positionSlug.value,
      userRole: "staff",
      shiftStart: values.shiftStart,
      shiftEnd: values.shiftEnd,
      permissions,
    };

    setLoading(true);
    const Method = isEditMode ? Patch : Post;
    const route = isEditMode
      ? `admin/user/update/${data.slug}`
      : "admin/user/create";
    const { response } = await Method({ route, data: payload });

    const message = isEditMode
      ? t("toast.staffUpdated")
      : t("toast.staffAdded");

    if (response) {
      RenderToast({ type: "success", message: message });
      getData();
      formik.resetForm();
      setShow(false);
    }
    setLoading(false);
  };

  async function translateMessages() {
    const fields = ["fullName"];
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
        message: `${t("toast.pleaseFill")}: ${missing.join(", ")}`,
      });
      return;
    }
    setTranslating(true);
    for (const field of fields) {
      const original = formik.values[field]?.[selected] || "";
      await Promise.all(
        locales?.map(async (lang) => {
          if (lang === selected) return;
          try {
            const translated = await translateText(original, lang);
            formik.setFieldValue(`${field}.${lang}`, translated);
          } catch (err) {
            // ignore translation error
          }
        })
      );
    }
    RenderToast({
      type: "success",
      message: t("toast.translationSuccessMessage"),
    });
    setTranslating(false);
  }

  return (
    <ModalSkeleton
      setShow={setShow}
      show={show}
      header={data ? t("modal.editStaff") : t("modal.addStaff")}
    >
      <div
        className={mergeClass(
          classes.main,
          dir === "ltr" ? "ignoreRtlNested" : ""
        )}
        dir={dir}
      >
        <LanguageSelector
          selected={selected}
          setSelected={setSelected}
          setDirection={setDir}
          cb={(loc) => {
            setLocale1(loc);
            setLocale2(loc);
          }}
        />
        <Button
          label={translating ? t("modal.translating") : t("modal.autoFill")}
          onClick={translateMessages}
          disabled={loading === "submitting" || translating}
        />
        <Input
          placeholder={t("fields.namePlaceholder")}
          label={t("fields.name")}
          value={formik.values.fullName[selected]}
          setValue={(val) => formik.setFieldValue(`fullName.${selected}`, val)}
          errorText={
            formik.touched.fullName?.[selected] &&
            formik.errors.fullName?.[selected]
          }
          disabled={loading}
          dir={dir}
        />
        <DropDown
          isPortal
          customStyle={{ height: "60px" }}
          label={t("fields.position")}
          placeholder={t("fields.positionPlaceholder")}
          options={positionsData.map((pos) => ({
            label: pos.name[selected] || pos.name[locale],
            value: pos.slug,
            disabled: pos.status?.toLowerCase() === "inactive",
          }))}
          value={formik.values.positionSlug}
          setValue={(val) => {
            // Prevent selecting disabled options
            if (val && !val.disabled) {
              formik.setFieldValue("positionSlug", val);
            }
          }}
          error={formik.touched.positionSlug && formik.errors.positionSlug}
          disabled={loading}
          dir={dir}
          dropDownContainerClass={classes?.dropDownContainerClass}
        />

        <Input
          placeholder={t("fields.emailPlaceholder")}
          label={t("fields.email")}
          type="email"
          value={formik.values.email}
          setValue={(val) => formik.setFieldValue("email", val)}
          errorText={formik.touched.email && formik.errors.email}
          disabled={loading || isEditMode}
          dir={dir}
        />

        <PhoneInput
          onCountryChange={(val) => formik.setFieldValue("callingCode", val)}
          placeholder={t("fields.phonePlaceholder")}
          defaultCountry="GB"
          label={t("fields.phone")}
          value={formik.values.phoneNumber}
          setValue={(val) => formik.setFieldValue("phoneNumber", val)}
          errorText={formik.touched.phoneNumber && formik.errors.phoneNumber}
          disabled={loading || isEditMode}
          dir={dir}
        />

        <Input
          type="time"
          placeholder={t("fields.shiftStartTimePlaceholder")}
          label={t("fields.shiftStartTime")}
          value={formik.values.shiftStart}
          setValue={(val) => formik.setFieldValue("shiftStart", val)}
          errorText={formik.touched.shiftStart && formik.errors.shiftStart}
          disabled={loading}
          dir={dir}
          rightIconClass={classes.timeInputIcon}
          rightIcon={<LuClock size={20} color="#8C939B" />}
        />
        <Input
          type="time"
          placeholder={t("fields.shiftEndTimePlaceholder")}
          label={t("fields.shiftEndTime")}
          value={formik.values.shiftEnd}
          setValue={(val) => formik.setFieldValue("shiftEnd", val)}
          errorText={formik.touched.shiftEnd && formik.errors.shiftEnd}
          disabled={loading}
          dir={dir}
          rightIconClass={classes.timeInputIcon}
          rightIcon={<LuClock size={20} color="#8C939B" />}
        />

        {/* Permissions */}
        <div className={classes.permissionsSection} dir={dir}>
          <label className={classes.permissionsLabel}>
            {t("fields.permissionsLabel")}
          </label>

          <PermissionComponent
            value={permissions}
            dir={dir}
            menuAlign={menuAlign}
            t={permissionsT}
            setValue={(newMap) => {
              setPermissions(newMap);
              formik.setFieldValue("permissions", Array.from(newMap.keys()));
            }}
          />
          <p
            hidden={!(formik.touched.permissions && formik.errors.permissions)}
            className={classes.error}
          >
            *{formik.errors.permissions}
          </p>
        </div>

        <div className={classes.ButtonContainer}>
          <Button
            type="button"
            variant="outlined"
            label={t("modal.cancel")}
            onClick={() => setShow(false)}
            disabled={loading}
          />
          <Button
            type="button"
            variant="primary"
            label={loading ? t("modal.loading") : t("modal.confirm")}
            onClick={() => {
              validateMultiLingualForm({
                fields: ["fullName"],
                currentLanguage: selected,
                formik,
              });
              // handleAddEdit(formik.values); // Call your function
            }}
            loading={loading}
            showSpinner={loading}
            disabled={loading}
          />
        </div>
      </div>
    </ModalSkeleton>
  );
}

const PermissionComponent = ({ value, setValue, dir, menuAlign, t }) => {
  const buttonRef = useRef(null);
  const allPermissions = useMemo(
    () => permissionsList?.filter((p) => p.label !== "dashboard"),
    []
  );
  const dashboardItem = useMemo(
    () => permissionsList?.find((p) => p.label === "dashboard"),
    []
  );

  // Get all permissions (excluding dashboard)
  const getAllSelectablePermissions = () => {
    const allPerms = new Set();
    allPermissions.forEach((group) => {
      if (group.label !== "Dashboard") {
        group.permissions.forEach((p) => allPerms.add(p));
      }
    });
    return Array.from(allPerms);
  };

  // Check if all permissions are selected
  const allSelectablePerms = getAllSelectablePermissions();
  const isAllSelected = allSelectablePerms.every((p) => value.has(p));
  const isAllPartial =
    allSelectablePerms.some((p) => value.has(p)) && !isAllSelected;

  // Helper to check if all permissions in a group are selected
  const isGroupSelected = (groupPerms, selectedMap) => {
    return groupPerms.every((p) => selectedMap.has(p));
  };

  // Helper to check if some permissions in a group are selected
  const isGroupPartiallySelected = (groupPerms, selectedMap) => {
    return (
      groupPerms.some((p) => selectedMap.has(p)) &&
      !groupPerms.every((p) => selectedMap.has(p))
    );
  };

  // Helper to add dependencies
  const addDependencies = (permMap, dependencies) => {
    dependencies.forEach((dep) => {
      if (!permMap.has(dep)) {
        permMap.set(dep, dep);
        // Find and add transitive dependencies
        allPermissions.forEach((group) => {
          // Find and add child transitive dependencies
          group.children.forEach((child) => {
            if (
              child.permissions.includes(dep) &&
              child.dependencies.length > 0
            ) {
              addDependencies(permMap, child.dependencies);
            }
          });
          // // Find and add group transitive dependencies
          // if (
          //   group.permissions.includes(dep) &&
          //   group.dependencies.length > 0
          // ) {
          //   addDependencies(permMap, group.dependencies);
          // }
        });
      }
    });
  };

  // Helper to remove permissions from removeList
  const removePermissions = (permMap, removeList) => {
    if (!removeList || removeList.length === 0) return;

    removeList.forEach((perm) => {
      permMap.delete(perm);
      // Find and remove transitive removals
      allPermissions.forEach((group) => {
        group.children.forEach((child) => {
          if (
            child.permissions.includes(perm) &&
            child.removeList &&
            child.removeList.length > 0
          ) {
            removePermissions(permMap, child.removeList);
          }
        });
      });
    });
  };

  return (
    <Menu
      menuButton={
        <button ref={buttonRef} type="button" className={classes.menuButton}>
          {value.size + 1} {t("selected") || "selected"}
        </button>
      }
      transition
      position="anchor"
      gap={6}
      dir={dir}
      viewScroll="initial"
      overflow="auto"
      direction="top"
      align={menuAlign}
      className={classes.menu}
    >
      {/* Select All Checkbox */}
      <MenuItem
        key="select-all"
        onClick={(e) => {
          e.keepOpen = true;
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            fontWeight: "bold",
          }}
        >
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isAllPartial;
            }}
            onChange={(e) => {
              e.stopPropagation();
              const temp = new Map(value);

              if (e.target.checked) {
                // Select all permissions
                allPermissions.forEach((group) => {
                  if (group.label !== "dashboard") {
                    group.permissions.forEach((p) => temp.set(p, p));
                    if (group.dependencies && group.dependencies.length > 0) {
                      addDependencies(temp, group.dependencies);
                    }
                  }
                });
              } else {
                // Deselect all permissions (except dashboard)
                allSelectablePerms.forEach((p) => temp.delete(p));
              }

              setValue(temp);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ marginInlineEnd: "8px" }}
          />
          <label>{t("selectAll") || "Select All"}</label>
        </div>
      </MenuItem>

      <MenuItem>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}
        >
          <input
            type="checkbox"
            disabled
            checked
            style={{ marginInlineEnd: "8px" }}
          />{" "}
          <label style={{ fontWeight: "bold" }}>
            {t(`groups.${dashboardItem.label}`) || dashboardItem.label}
          </label>
        </div>
      </MenuItem>

      {allPermissions.map((group) => {
        const groupPerms = group.permissions || [];
        const hasChildren = group.children && group.children.length > 0;
        const isSelected = isGroupSelected(groupPerms, value);
        const isPartial = isGroupPartiallySelected(groupPerms, value);
        const isDashboard = group.label === "dashboard";

        if (!hasChildren) {
          // Simple checkbox for groups without children
          return (
            <MenuItem
              key={group.label}
              onClick={(e) => {
                e.keepOpen = true;
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                <input
                  type="checkbox"
                  checked={isDashboard ? true : isSelected}
                  disabled={isDashboard}
                  onChange={(e) => {
                    e.stopPropagation();
                    const temp = new Map(value);

                    if (e.target.checked) {
                      // Add all group permissions and dependencies
                      groupPerms.forEach((p) => temp.set(p, p));
                      if (group.dependencies && group.dependencies.length > 0) {
                        addDependencies(temp, group.dependencies);
                      }
                    } else {
                      // Remove all group permissions
                      groupPerms.forEach((p) => temp.delete(p));
                      // Also remove permissions from removeList
                      if (group.children && group.children.length > 0) {
                        group.children.forEach((child) => {
                          if (child.removeList && child.removeList.length > 0) {
                            removePermissions(temp, child.removeList);
                          }
                        });
                      }
                    }

                    setValue(temp);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginInlineEnd: "8px" }}
                />
                <label>{t(`groups.${group.label}`) || group.label}</label>
              </div>
            </MenuItem>
          );
        }

        // Group with children - use SubMenu
        return (
          <SubMenu
            key={group.label}
            dir={dir}
            align={menuAlign}
            label={
              <div
                style={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartial;
                  }}
                  onChange={(e) => {
                    e.stopPropagation();
                    const temp = new Map(value);

                    if (e.target.checked) {
                      // Check all in group
                      groupPerms.forEach((p) => temp.set(p, p));
                      if (group.dependencies && group.dependencies.length > 0) {
                        addDependencies(temp, group.dependencies);
                      }
                    } else {
                      // Uncheck all in group
                      groupPerms.forEach((p) => temp.delete(p));
                      // Also remove permissions from removeList
                      group.children.forEach((child) => {
                        if (child.removeList && child.removeList.length > 0) {
                          removePermissions(temp, child.removeList);
                        }
                      });
                    }

                    setValue(temp);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginInlineEnd: "8px" }}
                />
                <label>{t(`groups.${group.label}`) || group.label}</label>
              </div>
            }
          >
            {group.children.map((child) => {
              const childPerms = child.permissions || [];
              const isChildSelected = childPerms.every((p) => value.has(p));

              return (
                <MenuItem
                  key={child.label}
                  onClick={(e) => {
                    e.keepOpen = true;
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChildSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        const temp = new Map(value);

                        if (e.target.checked) {
                          // Add child permissions and dependencies
                          childPerms.forEach((p) => temp.set(p, p));
                          if (
                            child.dependencies &&
                            child.dependencies.length > 0
                          ) {
                            addDependencies(temp, child.dependencies);
                          }
                        } else {
                          // Remove child permissions
                          childPerms.forEach((p) => temp.delete(p));
                          // Also remove permissions from removeList
                          if (child.removeList && child.removeList.length > 0) {
                            removePermissions(temp, child.removeList);
                          }
                        }

                        setValue(temp);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginInlineEnd: "8px" }}
                    />
                    <label>{t(`items.${child.label}`) || child.label}</label>
                  </div>
                </MenuItem>
              );
            })}
          </SubMenu>
        );
      })}
    </Menu>
  );
};
