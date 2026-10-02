"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BsThreeDots } from "react-icons/bs";
import classes from "./MaintenanceBarChart.module.css";

export default function MaintenanceBarChart({ title, data }) {
  return (
    <div className={classes.main}>
      <div className={classes.headerTop}>
        <div className={classes.header}>
          <p>{title}</p>
          {/* <BsThreeDots size={24} color="#000" /> */}
        </div>
        {/* <div className={classes.businessDetails}>
          <span className={classes.revenueValue}>1,200</span>
          <span className={classes.percentage}>5%</span>
        </div> */}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={24}
          tabIndex={-1}
        >
          <CartesianGrid stroke="#E0E0E0" vertical={false} horizontal={true} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={0}
            padding={{ left: 24, right: 0 }}
            tick={{ fontSize: 12, fontWeight: 400, fill: "60646C" }}
            tickMargin={10}
          />
          <YAxis
            // axisLine={false}
            // tickLine={false}
            // tick={false}
            width={0}
            domain={[0, "dataMax + 5"]}
          />
          <Tooltip formatter={(v) => v.toLocaleString()} cursor={false} />
          <Bar dataKey="count" fill="#33B5F6" barSize={22} radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
