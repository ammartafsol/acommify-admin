"use client";
import React from "react";
import { PieChart, Pie, Cell } from "recharts";
import { BsThreeDots } from "react-icons/bs";
import classes from "./TotalVisitorChart.module.css";

const COLORS = ["#00B383", "#274754", "#F86969", "#E8C468", "#f4a461"];

export default function TotalVisitorChart({ title, data }) {
  const totalVisitors = data || 0;

  // Create simple data for pie chart visualization
  const chartData =
    totalVisitors > 0
      ? [{ name: "Visitors", value: totalVisitors }]
      : [{ name: "No Data", value: 1 }];

  return (
    <div className={classes.main}>
      <div className={classes.headerTop}>
        <div className={classes.header}>
          <p>{title}</p>
          {/* <BsThreeDots size={24} color="#000" /> */}
        </div>
      </div>
      <div className={classes.chartWrapper}>
        <PieChart width={220} height={220} tabIndex={-1}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={totalVisitors > 0 ? COLORS[0] : "#E0E0E0"}
              />
            ))}
          </Pie>
        </PieChart>
        <div className={classes.centerLabel}>
          <div className={classes.value}>{totalVisitors.toLocaleString()}</div>
          <div className={classes.subLabel}>Visitors</div>
        </div>
      </div>
    </div>
  );
}
