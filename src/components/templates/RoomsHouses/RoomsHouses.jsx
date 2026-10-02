"use client";
import DropDown from "@/components/molecules/DropDown/DropDown";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import { RenderStatusCell } from "@/components/organisms/AppTable/tableHelper";
import AddEditRoomHouseModal from "@/components/organisms/Modals/AddEditRoomHouseModal/AddEditRoomHouseModal";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { capitalizeEachWord, mergeClass } from "@/resources/utils/helper";
import {
  RoomsHousesTableHeader,
  RoomsHousesVisitorTableHeader,
} from "@/resources/utils/tableHeaders";
import moment from "moment-timezone";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";
import MenuComponent from "@/components/atoms/MenuComponent";
import { TbDotsVertical } from "react-icons/tb";
import AreYouSureModal from "@/components/organisms/Modals/AreYouSureModal/AreYouSureModal";
import RenderToast from "@/components/atoms/RenderToast";

export default function RoomsHouses() {
  const { permissions } = useSelector((state) => state.authReducer);
  const [show, setShow] = useState(false);
  const t = useTranslations("roomsHouses");
  const c = useTranslations("common");
  const [showDetail, setShowDetail] = useState(false);
  const [modalData, setModalData] = useState(null);
  const { Get, Patch } = useAxios();
  const [data, setData] = useState();
  const [originalData, setOriginalData] = useState(); // Store original unsorted data
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sortValue, setSortValue] = useState(""); // Add sort state
  const filterOptions = [
    {
      label: t("filterOptions.beds"),
      value: "beds",
      type: "range",
    },
    {
      label: t("filterOptions.status"),
      value: "occupancyStatus",
      type: "select",
      choices: [
        { label: t("filterOptions.occupied"), value: "occupied" },
        { label: t("filterOptions.UnOccupied"), value: "unoccupied" },
        {
          label: t("filterOptions.partiallyOccupied"),
          value: "partially-occupied",
        },
      ],
    },
    {
      label: t("filterOptions.accommodationType"),
      value: "type",
      type: "select",
      choices: [
        { label: t("filterOptions.apartment"), value: "apartment" },
        { label: t("filterOptions.house"), value: "house" },
        { label: t("filterOptions.room"), value: "room" },
      ],
    },
  ];

  const filterOptionsVisitor = [
    {
      label: t("filterOptions.accommodationType"),
      value: "type",
      type: "select",
      choices: [
        { label: t("filterOptions.apartment"), value: "apartment" },
        { label: t("filterOptions.house"), value: "house" },
        { label: t("filterOptions.room"), value: "room" },
      ],
    },
  ];

  const [selectedFilters, setSelectedFilters] = useState({});
  const tabOptions = [
    { label: t("tabs.resident"), value: "resident" },
    { label: t("tabs.visitor"), value: "visitor" },
  ];
  const [activeTab, setActiveTab] = useState(tabOptions[0]);

  const tableActions = [
    {
      renderItem: ({ data }) => {
        const row = data; 
  
        const menuItems = [
          {
            title: t("actions.edit"),
            onClick: () => {
              setModalData(row);
              setShow(true);
            },
            style: { color: "var(--Black)", fontWeight: 500 },
          },
        ];
  
        // Add delete only if unoccupied
        if (row?.occupancyStatus === "unoccupied" ) {
          menuItems.push({
            title: t("actions.delete"),
            onClick: () => {
              setModalData(row);
              setShowDeleteModal(true);
            },
            style: { color: "var(--Red)", fontWeight: 500 },
          });
        }
  
        return (
          <MenuComponent
            portal
            items={menuItems}
            menuButton={
              <TbDotsVertical
                color="#B2B5BA"
                onClick={(e) => e.stopPropagation()}
                className="pointer"
                size={20}
              />
            }
            value={row}
          />
        );
      },
    },
  ];
  
  const handleSave = () => {
    setModalData(null);
    getData();
  };

  const handleCloseModal = () => {
    if (loading === "loading") return;
    setModalData(null);
    setShow(false);
  };

  async function getData({
    _search = search,
    _selectedFilters = selectedFilters,
    _page = page,
  } = {}) {
    setLoading("loading");
    const params = new URLSearchParams({
      search: _search?.trim() || "",
      page: _page,
      limit: 10,
      userType: activeTab.value,
    });

    // Occupancy Status filter
    if (_selectedFilters?.occupancyStatus)
      params.append("occupancyStatus", _selectedFilters.occupancyStatus);

    // User Type filter
    if (_selectedFilters?.type) params.append("type", _selectedFilters.type);

    // Number of Beds Range filter
    if (_selectedFilters?.beds?.min)
      params.append("noOfBedsStart", _selectedFilters.beds.min);
    if (_selectedFilters?.beds?.max)
      params.append("noOfBedsEnd", _selectedFilters.beds.max);

    const { response } = await Get({
      route: `admin/accommodation/all?${params.toString()}`,
    });

    if (response?.status === "success") {
      setData(response?.data);
      setOriginalData(response?.data); // Store original data
      setTotalRecords(response?.totalRecords);
    }
    setLoading("");
  }

  const getSelectedLabel = (value) => {
    const options = {
      "a-z": "A-Z",
      "z-a": "Z-A",
    };
    return options[value] || "";
  };

  const handleSort = (sortValue) => {
    if (!originalData) return;

    setSortValue(sortValue); // Update sort state
    let sortedData = [...originalData];

    switch (sortValue) {
      case "a-z":
        sortedData.sort((a, b) =>
          (a.accommodationNumber || "").localeCompare(
            b.accommodationNumber || ""
          )
        );
        break;
      case "z-a":
        sortedData.sort((a, b) =>
          (b.accommodationNumber || "").localeCompare(
            a.accommodationNumber || ""
          )
        );
        break;
      default:
        sortedData = [...originalData];
        setSortValue(""); // Reset sort state
    }

    setData(sortedData);
  };

  const handleDelete = async () => {
    setLoading("deleting");
    const { response } = await Patch({
      route: `admin/accommodation/update/${modalData?.slug}`,
      data: {
        status: "deleted",
      },
    });
    if (response?.status === "success") {
      RenderToast({
        type: "success",
        message: t("toasts.deletedRoomHouse"),
      });
      setShowDeleteModal(false);
      await getData();
    }
    setLoading("");
  };

  // Clear filters and reset page when tab changes
  useEffect(() => {
    setSelectedFilters({});
    setPage(1);
    setSortValue("");
    // Call getData with empty filters when tab changes
    getData({ _page: 1, _search: debounceSearch, _selectedFilters: {} });
  }, [activeTab]);

  useEffect(() => {
    // Only call getData when search changes, not when tab changes (handled above)
    getData({
      _search: debounceSearch,
      _page: 1,
      _selectedFilters: selectedFilters,
    });
  }, [debounceSearch]);

  useEffect(() => {
    if (!show && !showDetail) {
      setModalData(null);
    }
  }, [show, showDetail]);

  return (
    <>
      <Container className={mergeClass("containerFluid", styles.main)}>
        <SubHeader
          title={t("title")}
          showSearchAndFilter
          searchAndFilterAtTop
          showMultipleFilters
          tabsProps={{
            tabsData: tabOptions,
            selected: activeTab,
            setSelected: setActiveTab,
            disabled: loading === "loading",
          }}
          multipleFilterProps={{
            options:
              activeTab.value === "resident"
                ? filterOptions
                : filterOptionsVisitor,
            selected: selectedFilters,
            setSelected: setSelectedFilters,
            onApply: (filters) => {
              setSelectedFilters(filters);
              getData({ _page: 1, _selectedFilters: filters });
            },
          }}
          buttonProps={
            permissions.includes("add-edit-accommodation")
              ? {
                  label: t("addRoom"),
                  variant: "primary",
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
                  onClick: () => {
                    setModalData(null);
                    setShow(true);
                  },
                }
              : undefined
          }
          searchProps={{
            search,
            setSearch,
          }}
          children={
            <DropDown
              isSearchable={false}
              placeholder={t("filterOptions.sortBy")}
              className={styles?.sortBy}
              value={
                sortValue
                  ? { label: getSelectedLabel(sortValue), value: sortValue }
                  : null
              }
              customStyle={{
                backgroundColor: "transparent",
                border: "none",
                padding: "0",
                width: "fit-content",
              }}
              options={[
                { label: "A-Z", value: "a-z" },
                { label: "Z-A", value: "z-a" },
              ]}
              setValue={(option) => handleSort(option?.value || "")}
            />
          }
        />
        <AppTable
          rowClassName="cursorPointer"
          tableHeader={
            activeTab.value === "resident"
              ? RoomsHousesTableHeader(t)
              : RoomsHousesVisitorTableHeader(t)
          }
          data={data}
          actions={tableActions}
          actionStyles={{
            width: "10%",
          }}
          onRowClick={(data) => {
            setModalData(data);
            setShowDetail(true);
          }}
          page={page}
          pagination
          onPageChange={(p) => {
            setPage(p);
            getData({ _page: p, _search: debounceSearch });
          }}
          totalRecords={totalRecords}
          loading={loading === "loading"}
        />
      </Container>

      {show && (
        <AddEditRoomHouseModal
          show={show}
          setShow={handleCloseModal}
          data={modalData}
          onSave={handleSave}
        />
      )}

      {showDetail && (
        <DetailModal
          title={t("viewModalTitle")}
          show={showDetail}
          setShow={setShowDetail}
        >
          <div className={styles.modalMain}>
            <div className={styles.item}>
              <p>{t("table.houseRoomNumber")}</p>
              <p>{capitalizeEachWord(modalData?.accommodationNumber || "-")}</p>
            </div>
            {modalData?.userType === "resident" && (
              <div className={styles.item}>
                <p>{t("table.numberOfBeds")}</p>
                <p>{modalData?.noOfBeds || "-"}</p>
              </div>
            )}
            <div className={styles.item}>
              <p>{t("table.accommodationType")}</p>
              <p>{capitalizeEachWord(modalData?.type) || "-"}</p>
            </div>
            <div className={styles.item}>
              <p>{t("table.occupancyStatus")}</p>
              <RenderStatusCell status={modalData?.occupancyStatus || "-"} />
            </div>
            <div className={styles.item}>
              <p>{t("table.userType")}</p>
              <p>{capitalizeEachWord(modalData?.userType) || "-"}</p>
            </div>
            <div className={styles.item}>
              <p>{t("table.createdAt")}</p>
              <p>{moment(modalData?.createdAt).format("DD-MM-YYYY") || "-"}</p>
            </div>
            {/* <div className={styles.item}>
              <p>{t("table.status")}</p>
              <RenderStatusCell status={modalData?.status || "-"} />
            </div> */}
          </div>
        </DetailModal>
      )}

      {showDeleteModal && (
        <AreYouSureModal
          title={c("areYouSure")}
          show={showDeleteModal}
          setShow={setShowDeleteModal}
          onConfirm={handleDelete}
          loading={loading === "deleting"}
          disabled={loading === "deleting"}
        />
      )}
    </>
  );
}
