"use client";

import { ReactSVG } from "react-svg";
import styles from "./styles.module.css";
import Image from "next/image";
import { mergeClass } from "@/resources/utils/helper";
import useDimensions from "@/resources/hooks/useDimensions";

/**
 * @typedef {'53-seater' | '36-seater' | '13-seater' | '11-seater'} BusType
 */

export const BUS_LAYOUTS = {
  "53-seater": {
    rows: 12,
    cols: 4,
    frontRowSeats: 0,
    lastRowSeats: 5,
  },
  "36-seater": {
    rows: 8,
    cols: 4,
    frontRowSeats: 0,
    lastRowSeats: 5,
  },
  "15-seater": {
    rows: 4,
    cols: 3,
    frontRowSeats: 2,
    frontRowSeatsReverse: false,
    lastRowSeats: 4,
  },
  "13-seater": {
    rows: 3,
    cols: 3,
    frontRowSeats: 0,
    lastRowSeats: 4,
  },

  "11-seater": {
    rows: 3,
    cols: 3,
    frontRowSeats: 1,
    frontRowSeatsReverse: true,
    lastRowSeats: 4,
  },
  "8-seater": {
    rows: 2,
    cols: 3,
    frontRowSeats: 2,
    lastRowSeats: 3,
  } 
};

/**
 * @typedef {Object} BusLayout
 * @property {number} rows - Number of rows in the bus
 * @property {number} cols - Number of columns per row
 * @property {number} [frontRowSeats=0] - Number of seats in the front row (cannot exceed cols)
 * @property {boolean} [frontRowSeatsReverse=false] - Whether the front row seats are reversed
 * @property {number} lastRowSeats - Number of seats in the last row
 */

/**
 * @typedef {Object} BusSeatSelectorProps
 * @property {BusType} [busType="53-seater"] - The type of bus
 * @property {string[]} [seatData=[]] - Array of seat numbers that are already occupied/filled
 * @property {string[]} [selectedSeats=[]] - Array of currently selected seat numbers
 * @property {(seats: string[]) => void} [onSelectSeat] - Callback function when a seat is selected/deselected
 * @property {BusLayout} [customLayout] - Custom layout configuration for the bus
 * @property {boolean} [showVertical=false] - Force vertical layout regardless of screen width
 */

/**
 * BusSeatSelector component for selecting bus seats
 * @param {BusSeatSelectorProps} props - Component props
 * @returns {JSX.Element} The BusSeatSelector component
 */
export default function BusSeatSelector({
  busType = "53-seater",
  seatData = [],
  selectedSeats = [],
  onSelectSeat = () => {},
  customLayout = null,
  showVertical = false,
}) {
  const { width } = useDimensions();
  const isVertical = width < 992 || showVertical;

  const selectedSeatMap = selectedSeats.reduce((acc, seat) => {
    acc[seat] = true;
    return acc;
  }, {});

  const legends = [
    {
      type: "available",
      label: "Available",
      color: "#8C939B",
      icon: "/app-images/busAssets/availableSeat.svg",
    },
    {
      type: "selected",
      label: "Selected",
      color: "#FF7A19",
      icon: "/app-images/busAssets/selectedSeat.svg",
    },
    {
      type: "filled",
      label: "Filled",
      color: "#33B5F6",
      icon: "/app-images/busAssets/filledSeat.svg",
    },
  ];

  if (BUS_LAYOUTS.hasOwnProperty(busType) === false) {
    busType = "53-seater";
  }

  /**
   * Handles seat selection/deselection
   * @param {string} seatNo - The seat number to select or deselect
   */
  function handleSelect(seatNo) {
    if (selectedSeats.includes(seatNo)) {
      onSelectSeat(selectedSeats.filter((seat) => seat !== seatNo));
    } else {
      onSelectSeat([...selectedSeats, seatNo]);
    }
  }

  // Validate and sanitize layout
  const layout = customLayout || BUS_LAYOUTS[busType];
  // Ensure frontRowSeats doesn't exceed available columns
  if (layout.frontRowSeats > layout.cols) {
    layout.frontRowSeats = layout.cols;
  }
  // If frontRowSeats is not defined or 0, set it to 0 to maintain previous behavior
  if (!layout.frontRowSeats) {
    layout.frontRowSeats = 0;
  }

  return (
    <div
      className={styles.main}
      dir={document?.documentElement?.dir}
      data-vertical={isVertical}
    >
      <div className={styles.legends}>
        {legends.map((legend) => (
          <div key={legend.type} className={styles.legendItem}>
            <ReactSVG src={legend.icon} className={styles.legendIcon} />
            <p>{legend.label}</p>
          </div>
        ))}
      </div>
      <div className={styles.busLayout}>
        <div className={styles.busFront}>
          <Image
            className={styles.busFrontImage}
            src={
              isVertical
                ? "/app-images/busAssets/busFrontMobile.png"
                : "/app-images/busAssets/busFront.png"
            }
            fill
            alt={`${busType} layout`}
            style={{ objectFit: "fill", zIndex: 1 }}
          />
          <div className={styles.driver}>
            <Image
              src={"/app-images/busAssets/driver.svg"}
              width={118}
              height={54}
              alt={`${busType} layout driver`}
            />
          </div>
          <div className={styles.stairs}>
            <Image
              src={"/app-images/busAssets/stairs.svg"}
              width={66}
              height={58}
              alt={`${busType} layout stairs`}
            />
          </div>
        </div>
        <div
          className={styles.seatArea}
          style={{
            gap: layout.rows > 8 ? "16px" : layout.rows > 5 ? "20px" : "24px",
          }}
        >
          {/* Front Row */}
          {layout.frontRowSeats > 0 && (
            <div className={styles.seatRow}>
              {Array.from({
                length: layout.cols + 1,
              }).map((_, seatIndex) => {
                const midColIndex = Math.floor((layout.cols + 1) / 2);
                const seatNumber =
                  String.fromCharCode(
                    65 + seatIndex - (seatIndex > midColIndex ? 1 : 0)
                  ) + "1";
                const adjustedIndex =
                  seatIndex + (midColIndex > seatIndex ? 1 : 0);
                const isSelected = selectedSeatMap[seatNumber];
                const isFilled = seatData.includes(seatNumber);
                if (seatIndex === midColIndex) {
                  return (
                    <div key={seatIndex} className={styles.aisle}>
                      1
                    </div>
                  );
                }
                const nonReversedCondition =
                  adjustedIndex > layout.frontRowSeats;
                const reversedCondition =
                  layout.cols + 1 - adjustedIndex > layout.frontRowSeats;
                if (
                  (layout.frontRowSeatsReverse && reversedCondition) ||
                  (!layout.frontRowSeatsReverse && nonReversedCondition)
                ) {
                  return <HiddenSeat key={seatIndex} />;
                }
                return (
                  <Seat
                    key={seatIndex}
                    isSelected={isSelected}
                    isFilled={isFilled}
                    seatNumber={seatNumber}
                    handleSelect={handleSelect}
                  />
                );
              })}
            </div>
          )}

          <div
            className={styles.seatGrid}
            style={{
              gridTemplateColumns: `repeat(${
                layout.frontRowSeats > 0 ? layout.rows - 1 : layout.rows
              }, 1fr)`,
              ...(isVertical && {
                gridTemplateColumns: "none",
                gridTemplateRows: `repeat(${
                  layout.frontRowSeats > 0 ? layout.rows - 1 : layout.rows
                }, 1fr)`,
              }),
              gap: layout.rows > 8 ? "16px" : layout.rows > 5 ? "20px" : "24px",
            }}
          >
            {Array.from({
              length: layout.frontRowSeats > 0 ? layout.rows - 1 : layout.rows,
            }).map((_, rowIndex) => (
              <div key={rowIndex} className={styles.seatRow}>
                {Array.from({ length: layout.cols + 1 }).map((_, colIndex) => {
                  const midColIndex = Math.floor((layout.cols + 1) / 2);
                  const actualRowNumber =
                    layout.frontRowSeats > 0 ? rowIndex + 2 : rowIndex + 1;
                  const seatNumber =
                    String.fromCharCode(
                      65 + colIndex - (colIndex > midColIndex ? 1 : 0)
                    ) + actualRowNumber.toString();
                  const isSelected = selectedSeatMap[seatNumber];
                  const isFilled = seatData.includes(seatNumber);
                  if (colIndex === midColIndex) {
                    return (
                      <div key={colIndex} className={styles.aisle}>
                        {actualRowNumber}
                      </div>
                    );
                  }
                  return (
                    <Seat
                      key={colIndex}
                      isFilled={isFilled}
                      isSelected={isSelected}
                      seatNumber={seatNumber}
                      handleSelect={handleSelect}
                    />
                  );
                })}
              </div>
            ))}
            {/* Last Row */}
          </div>
          <div className={mergeClass(styles.seatRow, styles.lastRow)}>
            {Array.from({ length: layout.lastRowSeats }).map((_, seatIndex) => {
              const lastRow = layout.rows + 1;
              const seatNumber = String.fromCharCode(65 + seatIndex) + lastRow;
              const isSelected = selectedSeatMap[seatNumber];
              const isFilled = seatData.includes(seatNumber);
              return (
                <Seat
                  key={seatIndex}
                  isSelected={isSelected}
                  isFilled={isFilled}
                  seatNumber={seatNumber}
                  handleSelect={handleSelect}
                />
              );
            })}
          </div>
        </div>
        {/* Wheels */}
        {Array.from({ length: 4 }).map((_, wheelIndex) => (
          <Image
            key={wheelIndex}
            className={mergeClass(
              styles.busWheels,
              styles[`wheelNum${wheelIndex + 1}`]
            )}
            src={"/app-images/busAssets/busWheel.svg"}
            width={93}
            height={13}
            style={{
              width:
                layout.rows > 8 ? "93px" : layout.rows > 5 ? "80px" : "60px",
            }}
            alt={`${busType} wheels`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * @typedef {Object} SeatProps
 * @property {string} seatNumber - The seat number/identifier
 * @property {boolean} isSelected - Whether the seat is currently selected
 * @property {boolean} isFilled - Whether the seat is already occupied
 * @property {(seatNumber: string) => void} handleSelect - Function to handle seat selection
 */

/**
 * Individual seat component
 * @param {SeatProps} props - Component props
 * @returns {JSX.Element} The Seat component
 */
function Seat({ seatNumber, isSelected, isFilled, handleSelect }) {
  const seatImg = isFilled
    ? "/app-images/busAssets/filledSeat.svg"
    : isSelected
    ? "/app-images/busAssets/selectedSeat.svg"
    : "/app-images/busAssets/availableSeat.svg";

  return (
    <div
      style={{
        backgroundImage: `url('${seatImg}')`,
        cursor: isFilled ? "not-allowed" : "pointer",
      }}
      key={seatNumber}
      className={styles.seat}
      onClick={() => {
        if (isFilled) return;
        handleSelect(seatNumber);
      }}
    >
      <p>{seatNumber}</p>
    </div>
  );
}

/**
 * Hidden seat component - renders an invisible placeholder seat
 * @returns {JSX.Element} The HiddenSeat component
 */
function HiddenSeat() {
  return <div className={styles.hiddenSeat} />;
}

/**
 * Returns all possible seat numbers for a given bus layout.
 * @param {Object} layout
 * @param {number} layout.rows
 * @param {number} layout.cols
 * @param {number} [layout.frontRowSeats=0]
 * @param {boolean} [layout.frontRowSeatsReverse=false]
 * @param {number} layout.lastRowSeats
 * @returns {string[]} Array of seat numbers (e.g. "A1", "B2", ...)
 */
export function getAllPossibleSeats({
  rows,
  cols,
  frontRowSeats = 0,
  frontRowSeatsReverse = false,
  lastRowSeats,
}) {
  const seats = [];
  const midColIndex = Math.floor((cols + 1) / 2);

  // Front row seats
  if (frontRowSeats > 0) {
    for (let colIndex = 0; colIndex < cols + 1; colIndex++) {
      if (colIndex === midColIndex) continue; // skip aisle
      const adjustedIndex = colIndex + (midColIndex > colIndex ? 1 : 0);
      const nonReversedCondition = adjustedIndex > frontRowSeats;
      const reversedCondition = cols + 1 - adjustedIndex > frontRowSeats;
      if (
        (frontRowSeatsReverse && reversedCondition) ||
        (!frontRowSeatsReverse && nonReversedCondition)
      ) {
        continue;
      }
      seats.push(
        String.fromCharCode(65 + colIndex - (colIndex > midColIndex ? 1 : 0)) +
          "1"
      );
    }
  }

  // Main rows
  const mainRows = frontRowSeats > 0 ? rows - 1 : rows;
  for (let rowIndex = 0; rowIndex < mainRows; rowIndex++) {
    const actualRowNumber = frontRowSeats > 0 ? rowIndex + 2 : rowIndex + 1;
    for (let colIndex = 0; colIndex < cols + 1; colIndex++) {
      if (colIndex === midColIndex) continue; // skip aisle
      seats.push(
        String.fromCharCode(65 + colIndex - (colIndex > midColIndex ? 1 : 0)) +
          actualRowNumber.toString()
      );
    }
  }

  // Last row
  const lastRowNumber = rows + 1;
  for (let seatIndex = 0; seatIndex < lastRowSeats; seatIndex++) {
    seats.push(String.fromCharCode(65 + seatIndex) + lastRowNumber);
  }

  return seats;
}
