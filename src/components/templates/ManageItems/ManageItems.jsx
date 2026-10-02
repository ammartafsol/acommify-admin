"use client";

import RenderToast from "@/components/atoms/RenderToast";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import AddEditCategoryModal from "@/components/organisms/Modals/AddEditCategoryModal";
import AddEditItemModal from "@/components/organisms/Modals/AddEditItemModal";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { mergeClass } from "@/resources/utils/helper";
import {
  CategoriesTableHeader,
  ManageItemsTableHeader,
} from "@/resources/utils/tableHeaders";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { FaPen, FaTrash } from "react-icons/fa";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";
import { languageObject } from "@/i18n";

export default function ManageItems() {
  const { permissions } = useSelector((state) => state.authReducer);
  const t = useTranslations("manageItemsPage");

  const topLevelTabs = [
    { value: "items", label: t("topTabs.items") },
    { value: "categories", label: t("topTabs.categories") },
  ];

  const { Get, Patch } = useAxios();
  const [loading, setLoading] = useState("");
  const [tableData, setTableData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTopTab, setActiveTopTab] = useState(topLevelTabs[0]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [categoriesTableData, setCategoriesTableData] = useState(null);
  const searchDebounce = useDebounce(search, 500);
  const [categories, setCategories] = useState([]);
  // const [rawCategoriesData, setRawCategoriesData] = useState([]);
  const [manageItemTabs, setManageItemTabs] = useState([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState([]);
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false);
  const [rowData, setRowData] = useState(null);
  const locale = useLocale();
  const [activeLanguage, setActiveLanguage] = useState(locale);
  console.log(activeLanguage, "activeLanguage");
  const handleAddItem = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (values) => {
    await getAllItems({
      search: searchDebounce,
      page: currentPage,
      category: activeCategoryTab.value,
    });
    await getAllCategories();
  };

  const handleDeleteItem = async (item) => {
    setLoading("deleting");
    const route =
      activeTopTab.value === "categories"
        ? `admin/category/update/${item?.slug}`
        : `admin/product/update/${item?.slug}`;
    const { response } = await Patch({
      route: route,
      data: {
        status: "deleted",
      },
    });

    if (response) {
      RenderToast({
        type: "success",
        message: `Deleted ${
          activeTopTab.value === "categories" ? "category" : "item"
        } successfully`,
      });
      setRowData(null);
      setShowAreYouSureModal(false);
      await getAllItems({ search: searchDebounce, page: currentPage });
    }
    setLoading("");
  };

  const tableActions =
    permissions.includes("add-edit-product-category") &&
    permissions.includes("add-edit-product")
      ? [
          {
            renderItem: ({ data }) => (
              <FaPen
                className={mergeClass("c-p", styles.editIcon)}
                size={18}
                onClick={(e) => (e.stopPropagation(), handleEditItem(data))}
              />
            ),
          },
          {
            renderItem: ({ data }) => (
              <FaTrash
                className={mergeClass("c-p", styles.deleteIcon)}
                size={18}
                onClick={(e) => (
                  e.stopPropagation(),
                  setRowData(data),
                  setShowAreYouSureModal(true)
                )}
              />
            ),
          },
        ]
      : [];

  const categoryTableActions =
    permissions.includes("add-edit-product-category") &&
    permissions.includes("add-edit-product")
      ? [
          {
            renderItem: ({ data }) => (
              <FaPen
                className={styles.editIcon}
                size={18}
                onClick={(e) => (e.stopPropagation(), handleEditCategory(data))}
              />
            ),
          },
          {
            renderItem: ({ data }) => (
              <FaTrash
                className={styles.deleteIcon}
                size={18}
                onClick={(e) => (
                  e.stopPropagation(),
                  setRowData(data),
                  // handleDeleteItem(data),
                  setShowAreYouSureModal(true)
                )}
              />
            ),
          },
        ]
      : [];

  const getAllItems = async ({ search, page, category }) => {
    setLoading("loading");
    const query = { page, search, limit: 10 };
    if (activeTopTab.value === "categories") {
      query.crudType = "product";
    } else if (activeTopTab.value === "items") {
      query.categorySlug = category && category !== "all" ? category : "";
    }
    const queryString = new URLSearchParams(query).toString();
    const route =
      activeTopTab.value === "items"
        ? `admin/product/all?${queryString}`
        : `admin/category/all?${queryString}`;
    const { response } = await Get({
      route: route,
    });
    if (response) {
      if (activeTopTab.value === "categories") {
        // console.log(response?.data, "dataaaaaaaaaaa");
        setCategoriesTableData(response?.data || []);
      } else {
        const formattedData = response?.data?.map((item) => ({
          ...item,
          photo: item?.image || "/dev-images/dummyFood.jpg",
          itemName: item.name[activeLanguage] || "",
          stock: item.stock || 0,
          points: item.points || 0,
          dateAdded: moment(item.createdAt).format("DD MMM, YYYY"),
          shippingOption: item?.shippingOption,
          category: item?.category?.name[activeLanguage] || "NA",
          categorySlug: item?.category?.slug || "NA",
          slug: item.slug,
        }));
        setTableData(formattedData);
        setTotalRecords(response?.totalRecords);
      }
    }

    setLoading("");
  };
  const getAllCategories = async () => {
    setLoading("categories");
    const query = { crudType: "product", status: "active" };

    const queryString = new URLSearchParams(query).toString();
    const { response } = await Get({
      route: `admin/category/all?${queryString}`,
    });
    if (response) {
      setCategories(response?.data || []);
      // setCategories(
      //   response?.data?.map((item) => ({
      //     value: item?.slug,
      //     label: item?.name[activeLanguage] || languageObject,
      //   }))
      // );

      let categories = response?.data?.map((item) => ({
        value: item?.slug,
        label: item?.name[activeLanguage] || languageObject,
      }));
      setManageItemTabs([
        { value: "all", label: t("tabs.all") },
        ...categories,
      ]);

      setActiveCategoryTab({ value: "all", label: t("tabs.all") });
    }
    setLoading("");
  };

  useEffect(() => {
    getAllCategories();
  }, []);

  useEffect(() => {
    if (manageItemTabs.length > 0 && !activeCategoryTab.value) {
      setActiveCategoryTab(manageItemTabs[0]);
    }
  }, [manageItemTabs]);

  useEffect(() => {
    getAllItems({
      search: searchDebounce,
      page: 1,
      category: activeCategoryTab.value,
    });
  }, [searchDebounce, activeTopTab.value, activeCategoryTab?.value]);

  return (
    <Container className={mergeClass("containerFluid", styles.main)}>
      {/* Top-level tabs */}
      <SubHeader
        showHeader={false}
        tabsProps={{
          selected: activeTopTab,
          setSelected: setActiveTopTab,
          tabsData: topLevelTabs,
          disabled: loading === "loading",
        }}
      />

      {/* Items Tab Content */}
      {activeTopTab.value === "items" && (
        <>
          <SubHeader
            title={t("title")}
            showSearchAndFilter
            tabsProps={{
              selected: activeCategoryTab,
              setSelected: setActiveCategoryTab,
              tabsData: manageItemTabs,
              disabled: loading === "loading",
              ulCustom: styles.ulCustom,
            }}
            searchProps={{
              search: search,
              setSearch: (val) => {
                setSearch(val);
                setCurrentPage(1);
              },
            }}
            buttonProps={
              permissions.includes("add-edit-product") &&
              permissions.includes("add-edit-product-category")
                ? {
                    label: t("addItem"),
                    variant: "primary",
                    onClick: handleAddItem,
                    leftIcon: (
                      <ReactSVG
                        beforeInjection={(svg) => {
                          svg.setAttribute("width", "24px");
                          svg.setAttribute("height", "24px");
                        }}
                        src="/svg/plus.svg"
                        className="reactSvg"
                      />
                    ),
                  }
                : undefined
            }
          />
          <AppTable
            tableHeader={ManageItemsTableHeader(t)}
            data={tableData}
            actions={tableActions}
            actionStyles={{
              width: "10%",
            }}
            loading={loading === "loading"}
            page={currentPage}
            totalRecords={totalRecords}
            onPageChange={(p) => {
              setCurrentPage(p);
              getAllItems({
                page: p,
                search: searchDebounce,
                category: activeCategoryTab.value,
              });
            }}
            pagination
          />
        </>
      )}

      {/* Categories Tab Content */}
      {activeTopTab.value === "categories" && (
        <>
          <SubHeader
            title={t("categoryTitle")}
            showSearchAndFilter
            searchProps={{
              search: search,
              setSearch: setSearch,
            }}
            buttonProps={
              permissions.includes("add-edit-product-category") &&
              permissions.includes("add-edit-product")
                ? {
                    label: t("addCategory"),
                    variant: "primary",
                    onClick: handleAddCategory,
                    leftIcon: (
                      <ReactSVG
                        beforeInjection={(svg) => {
                          svg.setAttribute("width", "24px");
                          svg.setAttribute("height", "24px");
                        }}
                        src="/svg/plus.svg"
                        className="reactSvg"
                      />
                    ),
                  }
                : undefined
            }
          />
          <AppTable
            tableHeader={CategoriesTableHeader(locale, t)}
            data={categoriesTableData}
            actions={categoryTableActions}
            actionStyles={{
              width: "20%",
            }}
            loading={loading === "loading" || loading === "deleting"}
            page={currentPage}
            totalRecords={totalRecords}
            onPageChange={setCurrentPage}
            pagination
          />
        </>
      )}

      {showModal && (
        <AddEditItemModal
          show={showModal}
          setShow={setShowModal}
          editItem={editingItem}
          onClose={handleCloseModal}
          categories={categories}
          onSave={() =>
            getAllItems({
              search: searchDebounce,
              page: currentPage,
              category: activeCategoryTab.value,
            })
          }
        />
      )}

      {showCategoryModal && (
        <AddEditCategoryModal
          show={showCategoryModal}
          setShow={setShowCategoryModal}
          editCategory={editingCategory}
          onSave={handleSaveCategory}
          onClose={handleCloseCategoryModal}
        />
      )}
      {showAreYouSureModal && (
        <AreYouSureModal
          setShow={setShowAreYouSureModal}
          show={showAreYouSureModal}
          onConfirm={() => handleDeleteItem(rowData)}
          loading={loading === "deleting"}
        />
      )}
    </Container>
  );
}
