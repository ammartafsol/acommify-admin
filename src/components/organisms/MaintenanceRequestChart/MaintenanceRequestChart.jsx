import SpinnerLoading from "@/components/atoms/SpinnerLoading/SpinnerLoading";
import DropDown from "@/components/molecules/DropDown/DropDown";
import useDirection from "@/resources/hooks/useDirection";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import classes from "./MaintenanceRequestChart.module.css";

export default function MaintenanceRequestChart({
  data,
  title,
  showTicks,
  setResidentsFilterBy,
  residentsFilterBy,
  loading,

}) {
  // Years options for dropdown
  const dropdownOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;

    return { label: year.toString(), value: year };
  });
  const direction = useDirection();

  const selectedOption =
    dropdownOptions.find((opt) => opt.value === residentsFilterBy) ||
    dropdownOptions[0];
  return (
    <div className={classes.main}>
      <div className={classes.headerTop}>
        <div className={classes.header}>
          <p>{title}</p>
         {residentsFilterBy && <DropDown
            className={classes.dropDownFilter}
            dir={direction}
            options={dropdownOptions}
            mainClass={classes.dropDownContainerClass}
            placeholder={"Select Month or Year"}
            value={selectedOption}
            setValue={(val) => {
              setResidentsFilterBy(val?.value || val);
            }}
          />}
        </div>
        <div className={classes.businessDetails}>
          <br />
          <br />
        </div>
      </div>
      {loading === "loading" ? (
        <SpinnerLoading />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            tabIndex={-1}
          >
            <defs>
              <linearGradient id="colorBusiness" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#56AB5A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#56AB5A" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E0E0E0" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              // tick={false}
              tick={showTicks || false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 13,
                fontWeight: 500,
                fill: "rgba(33, 33, 33, 0.62)",
              }}
              domain={[0, "dataMax + 5"]}
            />
            <Tooltip formatter={(v) => v.toLocaleString()} />
            <Area
              // type="monotone"
              type="linear"
              dataKey="count"
              stroke="#56AB5A"
              fill="url(#colorBusiness)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
