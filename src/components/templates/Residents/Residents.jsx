"use client";
import MenuComponent from "@/components/atoms/MenuComponent";
import RenderToast from "@/components/atoms/RenderToast";
import SubHeader from "@/components/molecules/SubHeader/SubHeader";
import AppTable from "@/components/organisms/AppTable/AppTable";
import {
  RenderStatusCell,
  RenderSwitchCell,
} from "@/components/organisms/AppTable/tableHelper";
import AddNewResidentModal from "@/components/organisms/Modals/AddNewResidentModal";
import DetailModal from "@/components/organisms/Modals/DetailModal/DetailModal";
import { useRouter } from "@/i18n/navigation";
import useAxios from "@/interceptor/axios-functions";
import useDebounce from "@/resources/hooks/useDebounce";
import useDirection from "@/resources/hooks/useDirection";
import { useTranslations } from "@/resources/hooks/useTranslations";
import {
  capitalizeEachWord,
  getAgeFromDOB,
  mergeClass,
} from "@/resources/utils/helper";
import { ResidentsTableHeader } from "@/resources/utils/tableHeaders";
import moment from "moment-timezone";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { TbDotsVertical } from "react-icons/tb";
import { useSelector } from "react-redux";
import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";

export default function Residents() {
  const { permissions } = useSelector((state) => state.authReducer);
  const t = useTranslations("residentsPage");
  const { Get, Patch } = useAxios();
  const locale = useLocale();
  const dir = useDirection();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [roomOnly, setRoomOnly] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState("");
  const [residentsData, setResidentsData] = useState();
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);
  const [page, setPage] = useState();
  const [totalRecords, setTotalRecords] = useState(0);

  const menuItems = [
    {
      title: t("actions.edit"),
      onClick: (data) => {
        setRoomOnly(false);
        setModalData(data?.value);
        setShow(true);
      },
      style: {
        color: "var(--Black)",
        fontWeight: 500,
      },
    },
  ];

  const canEditResident = permissions?.includes("add-edit-resident");

  const switchItem = {
    key: "status",
    title: t("table.status"),
    style: {
      width: "150px",
      minWidth: "150px",
      whiteSpace: "nowrap",
    },
    preventRowClick: true,
    renderItem: ({ data }) => (
      <RenderSwitchCell
        isActive={data?.status === "active"}
        disabled={!canEditResident || loading === "status"}
        onChange={(newValue) => toggleStatus(newValue, data)}
      />
    ),
  };

  const tableActions = canEditResident
    ? [
        {
          renderItem: ({ data }) => (
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
              value={data}
            />
          ),
        },
      ]
    : [];

  async function getResidentsData({ _search = search, _page = page } = {}) {
    const params = new URLSearchParams({
      role: "resident",
      search: _search?.trim(),
      page: _page,
      limit: 10,
    });
    setLoading("loading");
    const { response } = await Get({
      route: `admin/user/all?${params.toString()}`,
    });

    if (response) {
      setResidentsData(response?.data || []);
      setTotalRecords(response?.totalRecords);
    }
    setLoading("");
  }

  useEffect(() => {
    getResidentsData({ _search: debounceSearch, _page: 1 });
  }, [debounceSearch]);

  const toggleStatus = async (newValue, item) => {
    if (!canEditResident || !item?.slug) return;

    setLoading("status");
    const { response } = await Patch({
      route: `admin/user/update/${item.slug}`,
      data: { status: newValue ? "active" : "inactive" },
    });

    if (response) {
      RenderToast({
        type: "success",
        message: t("modal.toasts.residentStatus"),
      });
      await getResidentsData({ _search: debounceSearch, _page: page || 1 });
    }
    setLoading("");
  };

  useEffect(() => {
    if (!show) {
      setRoomOnly(false);
      if (modalData) {
        setModalData(null);
        setPage(1);
      }
    }
  }, [show]);

  useEffect(() => {
    if (modalData && !showViewModal) {
      setModalData(null);
    }
  }, [showViewModal]);

  return (
    <>
      <Container className={mergeClass("containerFluid", styles.main)}>
        <SubHeader
          title={t("title")}
          showSearchAndFilter
          searchAndFilterAtTop
          buttonProps={
            permissions?.includes("add-edit-resident")
              ? {
                  label: t("addResident"),
                  variant: "primary",
                  onClick: () => {
                    setRoomOnly(false);
                    setModalData(null);
                    setShow(true);
                  },
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
          searchProps={{
            search: search,
            setSearch: setSearch,
            placeholder: t("searchPlaceholder"),
            dir: dir,
          }}
        />

        <AppTable
          loading={loading === "loading" || loading === "status"}
          tableHeader={[...ResidentsTableHeader(t, locale), switchItem]}
          data={residentsData}
          actions={tableActions}
          actionStyles={{
            width: "110px",
            minWidth: "110px",
            whiteSpace: "nowrap",
          }}
          rowClassName="c-p"
          onRowClick={(data) => {
            setModalData(data);
            setShowViewModal(true);
          }}
          pagination
          page={page}
          onPageChange={(p) => {
            setPage(p);
            getResidentsData({ _page: p, _search: debounceSearch });
          }}
          totalRecords={totalRecords}
        />
      </Container>

      {show && (
        <AddNewResidentModal
          show={show}
          setShow={setShow}
          modalData={modalData}
          roomOnly={roomOnly}
          onSubmit={() => getResidentsData({ _page: 1, _search: "" })}
          setModalData={setModalData}
        />
      )}

      {showViewModal && (
        <DetailModal
          show={showViewModal}
          setShow={setShowViewModal}
          title={t("viewModalTitle")}
        >
          <div className={styles.modalMain}>
            <div className={styles.item}>
              <p>{t("table.residentName")}</p>
              <p>{modalData?.fullName?.[locale] || "NA"}</p>
            </div>

            <div className={styles.item}>
              <p>{t("table.email")}</p>
              <p className="lowercase">
                {" "}
                {capitalizeEachWord(modalData?.email || "NA")}
              </p>
            </div>

            <div className={styles.item}>
              <p>{t("table.phone")}</p>
              <p>
                ({modalData?.callingCode}) {modalData?.phoneNumber || "NA"}
              </p>
            </div>

            <div className={styles.item}>
              <p>{t("table.roomNo")}</p>
              <p>
                {capitalizeEachWord(
                  modalData?.accommodation?.accommodationNumber || "NA"
                )}
              </p>
            </div>

            <div className={styles.item}>
              <p>{t("table.residentStatus")}</p>

              <RenderStatusCell status={modalData?.residentStatus} />
            </div>

            <div className={styles.item}>
              <p>{t("modal.noOfBeds")}</p>
              <p>{modalData?.noOfBeds || "NA"}</p>
            </div>

            <div className={styles.item}>
              <p>{t("table.arrivalDate")}</p>
              <p>
                {moment(modalData?.dateOfArrival).format("DD MMM, YYYY") ||
                  "NA"}
              </p>
            </div>
            <div className={styles.item}>
              <p>{t("table.dob")}</p>
              <p>
                {moment(modalData?.dateOfBirth).format("DD MMM, YYYY") || "NA"}
              </p>
            </div>
            <div className={styles.item}>
              <p>{t("table.age")}</p>
              <p>
                {modalData?.familyMembers?.[0]?.dob
                  ? getAgeFromDOB(modalData?.familyMembers?.[0]?.dob)
                  : "NA"}
              </p>
            </div>
            <div className={styles.item}>
              <p>{t("table.gender")}</p>
              <p>
                {capitalizeEachWord(modalData?.familyMembers?.[0]?.gender) ||
                  "NA"}
              </p>
            </div>
            {modalData?.trcNumber && (
              <div className={styles.item}>
                <p>{t("modal.trcNumber")}</p>
                <p>{modalData?.trcNumber || "NA"}</p>
              </div>
            )}
            {modalData?.ppsnNumber && (
              <div className={styles.item}>
                <p>{t("modal.ppsnNumber")}</p>
                <p>{modalData?.ppsnNumber || "NA"}</p>
              </div>
            )}
            {modalData?.medicalCardNumber && (
              <div className={styles.item}>
                <p>{t("modal.medicalCardNumber")}</p>
                <p>{modalData?.medicalCardNumber || "NA"}</p>
              </div>
            )}
            {modalData?.familyMembers?.length > 1 && (
              <h4 className={styles.familyMembersTitle}>
                {t("modal.familyMembers")}
              </h4>
            )}
            {modalData?.familyMembers?.length > 1 &&
              modalData?.familyMembers?.slice(1).map((member, index) => (
                <div key={index} className={styles.familyMemberMain}>
                  <h6>
                    {t("modal.familyMember")} {index + 1}:
                  </h6>
                  <div className={styles.item} key={`name-${index}`}>
                    <p>{t("modal.familyMemberName")}</p>
                    <p>
                      {capitalizeEachWord(member?.fullName?.[locale] || "NA")}
                    </p>
                  </div>
                  <div className={styles.item} key={`relation-${index}`}>
                    <p>{t("modal.familyMemberRelation")}</p>
                    <p>{capitalizeEachWord(member?.relationship || "NA")}</p>
                  </div>
                  <div className={styles.item} key={`age-${index}`}>
                    <p>{t("modal.age")}</p>
                    <p>{getAgeFromDOB(member?.dob) || "NA"}</p>
                  </div>
                  <div className={styles.item} key={`gender-${index}`}>
                    <p>{t("modal.gender")}</p>
                    <p>{capitalizeEachWord(member?.gender) || "NA"}</p>
                  </div>
                  <div className={styles.item} key={`trc-${index}`}>
                    <p>{t("modal.trcNumber")}</p>
                    <p>{member?.trcNumber || "NA"}</p>
                  </div>

                  {member?.relationship === "children" && (
                    <>
                      <div className={styles.item}>
                        <p>{t("modal.schoolPlacement.label")}</p>
                        <p>
                          {member?.schoolPlacement === "placed"
                            ? t("modal.schoolPlacement.placed")
                            : member?.schoolPlacement === "notPlaced"
                            ? t("modal.schoolPlacement.notPlaced")
                            : "NA"}
                        </p>
                      </div>

                      {member?.schoolPlacement === "placed" && (
                        <>
                          <div className={styles.item}>
                            <p>{t("modal.schoolName")}</p>
                            <p>{member?.schoolName?.[locale] || "NA"}</p>
                          </div>

                          <div className={styles.item}>
                            <p>{t("modal.year")}</p>
                            <p>{member?.year || "NA"}</p>
                          </div>

                          <div className={styles.item}>
                            <p>{t("modal.transportType.label")}</p>
                            <p>
                              {member?.transportType === "bus"
                                ? t("modal.transportType.bus")
                                : member?.transportType === "carpool"
                                ? t("modal.transportType.carpool")
                                : member?.transportType === "family"
                                ? t("modal.transportType.family")
                                : "NA"}
                            </p>
                          </div>

                          {member?.books &&
                            member?.books.length > 0 &&
                            member?.books.some((book) => book?.trim()) && (
                              <div className={styles.item}>
                                <p>{t("modal.books.label")}</p>
                                <div className={styles.booksList}>
                                  {member.books
                                    .filter((book) => book?.trim())
                                    .map((book, bookIndex) => (
                                      <span
                                        key={bookIndex}
                                        className={styles.bookItem}
                                      >
                                        {book}
                                        {bookIndex <
                                          member.books.filter((b) => b?.trim())
                                            .length -
                                            1 && ", "}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
          </div>
        </DetailModal>
      )}
    </>
  );
}
