// "use client";
// import NoDataFound from "@/components/atoms/NoDataFound/NoDataFound";
// import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
// import Pagination from "@/components/molecules/Pagination";
// import { useTranslations } from "@/resources/hooks/useTranslations";
// import { RECORDS_LIMIT } from "@/resources/utils/constant";
// import { imageUrl, mergeClass } from "@/resources/utils/helper";
// import Image from "next/image";
// import { useEffect, useState } from "react";
// import classes from "./AppTable.module.css";
// import { useRef } from "react";
// import { useDraggable } from "react-use-draggable-scroll";

// export default function AppTable({
//   classNamePrefix = "",
//   tableMinWidth = "",
//   onRowClick = () => {},
//   onKeyClick = () => {},
//   rowClassName = "",
//   data = [],
//   tableHeader = [],
//   loading = false,
//   renderTableHeader = null,
//   pagination = false,
//   page,
//   totalRecords,
//   onPageChange,
//   actions = [],
//   actionStyles = {},
// }) {
//   const t = useTranslations("common");
//   const [tableWidth, setTableWidth] = useState("");
//   // for scroll grab
//   const bodyScrollRef = useRef(null);
//   const headerScrollRef = useRef(null);
//   const { events: bodyEvents } = useDraggable(bodyScrollRef);

//   useEffect(() => {
//     const tableBodyWidth = document.querySelector(
//       `.${classNamePrefix}tableBody`
//     )?.offsetWidth;
//     const tableHeaderWidth = document.querySelector(
//       `.${classNamePrefix}tableHeader`
//     )?.offsetWidth;
//     const width =
//       tableBodyWidth > tableHeaderWidth ? tableBodyWidth : tableHeaderWidth;
//     const cellCount = tableHeader.length + (actions?.length > 0 ? 1 : 0);
//     const minWidth =
//       tableMinWidth > cellCount * 180 ? tableMinWidth : cellCount * 180;
//     setTableWidth(width > minWidth ? width : minWidth);
//   }, []);

//   return (
//     <>
//       <style>
//         {`
//           .${classes?.tableBodyContainer} {
//             height: ${pagination ? "100%" : `calc(100% - 101px)`};
//           }
//           .row100{
//             width: 100%;
//           }
//           .cell100 {
//             width: 100%;
//           }
//           .table100-head,
//           .table100-body {
//             min-width: ${tableMinWidth ? `${tableMinWidth}` : "100%"};
//             overflow: auto;
//           }

//         `}
//       </style>
//       <div className={mergeClass(classes?.tableMainContainer)}>
//         {/* <div
//           className={mergeClass(
//             classes?.tableHeaderContainer,
//             "table100-head",
//             `${classNamePrefix}tableHeader`
//           )}
//           style={{ width: `${tableWidth}px` }}
//         > */}

//         <div
//           ref={headerScrollRef}
//           className={mergeClass(
//             classes?.tableHeaderContainer,
//             "table100-head",
//             `${classNamePrefix}tableHeader`
//           )}
//           style={{
//             overflowX: "auto",
//             cursor: "grab",
//             userSelect: "none",
//           }}
//         >
//           <table style={{ minWidth: `${tableWidth}px` }}>
//             <thead>
//               <tr>
//                 {tableHeader?.map((item, index) => (
//                   <th
//                     key={index}
//                     style={{
//                       textAlign: "start",
//                       ...(item.style && item.style),
//                     }}
//                     className={mergeClass(
//                       item?.headerClass && item?.headerClass
//                     )}
//                   >
//                     {renderTableHeader
//                       ? renderTableHeader({ item: item, index })
//                       : item?.title}
//                   </th>
//                 ))}
//                 {actions?.length > 0 && (
//                   <th
//                     style={{
//                       textAlign: "start",
//                       ...actionStyles,
//                     }}
//                   >
//                     {t("actionTitle")}
//                   </th>
//                 )}
//               </tr>
//             </thead>
//           </table>
//         </div>
//         {loading ? (
//           <SpinnerLoading />
//         ) : (
//           // <div
//           //   className={mergeClass(
//           //     classes?.tableBodyContainer,
//           //     "table100-body",
//           //     `${classNamePrefix}tableBody`
//           //   )}
//           //   style={{ width: `${tableWidth}px` }}
//           // >

//           <div
//             {...bodyEvents}
//             ref={bodyScrollRef}
//             className={mergeClass(
//               classes?.tableBodyContainer,
//               "table100-body",
//               `${classNamePrefix}tableBody`
//             )}
//             style={{
//               // width: `${tableWidth}px`,
//               overflowX: "auto",
//               overflowY: "auto",
//               cursor: "grab",
//               userSelect: "none",
//             }}
//             onScroll={(e) => {
//               // Sync header scroll
//               if (headerScrollRef.current) {
//                 headerScrollRef.current.scrollLeft = e.target.scrollLeft;
//               }
//             }}
//           >
//             <table style={{ minWidth: `${tableWidth}px` }}>
//               <tbody>
//                 {data?.length ? (
//                   data?.map((item, rowIndex) => {
//                     return (
//                       <tr
//                         key={rowIndex}
//                         className={mergeClass(
//                           "row100",
//                           classes.bodyRow,
//                           rowClassName
//                         )}
//                         onClick={() => onRowClick(item, rowIndex)}
//                       >
//                         {tableHeader?.map(
//                           (
//                             { key, style, title, renderItem, image },
//                             colIndex
//                           ) => (
//                             <td
//                               key={colIndex}
//                               className={`cell100 column${colIndex + 1}`}
//                               style={{
//                                 ...(image && { paddingBlock: "10px" }),
//                                 textAlign: "start",
//                                 ...style,
//                               }}
//                             >
//                               <div
//                                 className={image ? classes.imageContainer : ""}
//                                 style={{
//                                   ...style,
//                                   width: "100%",
//                                 }}
//                               >
//                                 {image ? (
//                                   <Image
//                                     src={imageUrl(
//                                       item[key] ||
//                                         "/images/app-images/imageFallback.png"
//                                     )}
//                                     alt="image"
//                                     fill
//                                   />
//                                 ) : renderItem ? (
//                                   renderItem({
//                                     onClick: () => onKeyClick(item, key),
//                                     item: item[key],
//                                     data: item,
//                                     colIndex,
//                                     rowIndex,
//                                     key,
//                                     title,
//                                   })
//                                 ) : (
//                                   item[key] || "NA"
//                                 )}
//                               </div>
//                             </td>
//                           )
//                         )}
//                         {actions?.length > 0 && (
//                           <td
//                             className="cell100"
//                             style={{
//                               textAlign: "start",
//                               flex: 1,
//                               ...actionStyles,
//                             }}
//                           >
//                             <div className={classes.actionContainer}>
//                               {actions.map((action, index) => {
//                                 return (
//                                   <div
//                                     key={index}
//                                     onClick={(e) => {
//                                       e.stopPropagation();
//                                       if (action?.onClick) {
//                                         action.onClick({ data: item });
//                                       }
//                                     }}
//                                   >
//                                     {action?.renderItem &&
//                                       action?.renderItem({
//                                         data: item,
//                                       })}
//                                   </div>
//                                 );
//                               })}
//                             </div>
//                           </td>
//                         )}
//                       </tr>
//                     );
//                   })
//                 ) : (
//                   <tr>
//                     <td
//                       colSpan={tableHeader.length}
//                       style={{ textAlign: "center" }}
//                     >
//                       <NoDataFound text={t("noData")} />
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//       {pagination && totalRecords > RECORDS_LIMIT && (
//         <Pagination
//           currentPage={page || 1}
//           totalRecords={totalRecords}
//           limit={RECORDS_LIMIT}
//           setCurrentPage={onPageChange}
//         />
//       )}
//     </>
//   );
// }
"use client";

import NoDataFound from "@/components/atoms/NoDataFound/NoDataFound";
import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import Pagination from "@/components/molecules/Pagination";
import { useTranslations } from "@/resources/hooks/useTranslations";
import { RECORDS_LIMIT } from "@/resources/utils/constant";
import { imageUrl, mergeClass } from "@/resources/utils/helper";
import Image from "next/image";
import { useRef, useEffect } from "react";
import { useDraggable } from "react-use-draggable-scroll";
import classes from "./AppTable.module.css";

export default function AppTable({
  classNamePrefix = "",
  tableMinWidth = "",
  onRowClick = () => {},
  onKeyClick = () => {},
  rowClassName = "",
  data = [],
  tableHeader = [],
  loading = false,
  renderTableHeader = null,
  pagination = false,
  page,
  totalRecords,
  onPageChange,
  actions = [],
  actionStyles = {},
}) {
  const t = useTranslations("common");
  const bodyScrollRef = useRef(null);
  const headerScrollRef = useRef(null);
  const isScrollingRef = useRef(false);
  const { events: bodyEvents } = useDraggable(bodyScrollRef);

  // ✅ enable scroll only if more than 6 columns
  const enableGrabScroll = tableHeader.length >= 8;

  useEffect(() => {
    if (!enableGrabScroll) return; // don't run scroll sync if not needed

    const bodyTable = bodyScrollRef.current?.querySelector("table");
    const headerTable = headerScrollRef.current?.querySelector("table");

    if (bodyTable && headerTable) {
      headerTable.style.minWidth = `${bodyTable.offsetWidth}px`;
    }
  }, [tableHeader, enableGrabScroll]);

  const calculatedMinWidth = `${
    (tableHeader.length + (actions?.length > 0 ? 1 : 0)) * 180
  }px`;

  return (
    <>
      <style>
        {`
          .${classes?.tableBodyContainer} {
            height: ${pagination ? "100%" : `calc(100% - 101px)`};
          }
          .table100-head,
          .table100-body {
            overflow: auto;
          }
        `}
      </style>

      <div className={mergeClass(classes?.tableMainContainer)}>
        {/* HEADER */}
        <div
          ref={headerScrollRef}
          className={mergeClass(
            classes?.tableHeaderContainer,
            "table100-head",
            `${classNamePrefix}tableHeader`
          )}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
          }}
          onScroll={(e) => {
            if (isScrollingRef.current) return;
            if (bodyScrollRef.current) {
              isScrollingRef.current = true;
              bodyScrollRef.current.scrollLeft = e.target.scrollLeft;
              requestAnimationFrame(() => {
                isScrollingRef.current = false;
              });
            }
          }}
        >
          <table
            style={{
              width: enableGrabScroll ? "max-content" : "100%",
              minWidth: tableMinWidth || calculatedMinWidth,
            }}
          >
            <thead>
              <tr>
                {tableHeader?.map((item, index) => (
                  <th
                    key={index}
                    style={{
                      textAlign: "start",
                      ...(item.style && item.style),
                    }}
                    className={mergeClass(
                      item?.headerClass && item?.headerClass
                    )}
                  >
                    {renderTableHeader
                      ? renderTableHeader({ item: item, index })
                      : item?.title}
                  </th>
                ))}
                {actions?.length > 0 && (
                  <th
                    style={{
                      textAlign: "start",
                      ...actionStyles,
                    }}
                  >
                    {t("actionTitle")}
                  </th>
                )}
              </tr>
            </thead>
          </table>
        </div>

        {/* BODY */}
        {loading ? (
          <SpinnerLoading />
        ) : (
          <div
            {...(enableGrabScroll ? bodyEvents : {})}
            ref={bodyScrollRef}
            className={mergeClass(
              classes?.tableBodyContainer,
              "table100-body",
              `${classNamePrefix}tableBody`
            )}
            style={{
              overflowX: "auto",
              overflowY: "auto",
            }}
            onScroll={(e) => {
              if (isScrollingRef.current) return;
              if (headerScrollRef.current) {
                isScrollingRef.current = true;
                headerScrollRef.current.scrollLeft = e.target.scrollLeft;
                requestAnimationFrame(() => {
                  isScrollingRef.current = false;
                });
              }
            }}
          >
            <table
              style={{
                width: enableGrabScroll ? "max-content" : "100%",
                minWidth: tableMinWidth || calculatedMinWidth,
              }}
            >
              <tbody>
                {data?.length ? (
                  data?.map((item, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={mergeClass(
                        "row100",
                        classes.bodyRow,
                        rowClassName
                      )}
                      onClick={() => onRowClick(item, rowIndex)}
                    >
                      {tableHeader?.map(
                        (
                          { key, style, title, renderItem, image },
                          colIndex
                        ) => (
                          <td
                            key={colIndex}
                            className={`cell100 column${colIndex + 1}`}
                            style={{
                              ...(image && { paddingBlock: "10px" }),
                              textAlign: "start",
                              ...style,
                            }}
                          >
                            <div
                              className={image ? classes.imageContainer : ""}
                              style={{ width: "100%" }}
                            >
                              {image ? (
                                <Image
                                  src={imageUrl(
                                    item[key] ||
                                      "/images/app-images/imageFallback.png"
                                  )}
                                  alt="image"
                                  fill
                                />
                              ) : renderItem ? (
                                renderItem({
                                  onClick: () => onKeyClick(item, key),
                                  item: item[key],
                                  data: item,
                                  colIndex,
                                  rowIndex,
                                  key,
                                  title,
                                })
                              ) : (
                                item[key] || "NA"
                              )}
                            </div>
                          </td>
                        )
                      )}

                      {actions?.length > 0 && (
                        <td
                          className="cell100"
                          style={{
                            textAlign: "start",
                            flex: 1,
                            ...actionStyles,
                          }}
                        >
                          <div className={classes.actionContainer}>
                            {actions.map((action, index) => (
                              <div
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (action?.onClick) {
                                    action.onClick({ data: item });
                                  }
                                }}
                              >
                                {action?.renderItem &&
                                  action?.renderItem({ data: item })}
                              </div>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={tableHeader.length}
                      style={{ textAlign: "center" }}
                    >
                      <NoDataFound text={t("noData")} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && totalRecords > RECORDS_LIMIT && (
        <Pagination
          currentPage={page || 1}
          totalRecords={totalRecords}
          limit={RECORDS_LIMIT}
          setCurrentPage={onPageChange}
        />
      )}
    </>
  );
}
