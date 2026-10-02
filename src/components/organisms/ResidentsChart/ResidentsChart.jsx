"use client";
import { BsThreeDots } from "react-icons/bs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import classes from "./ResidentsChart.module.css";

const localeOptions = {
  en: "English",
  ar: "Arabic",
  uk: "Ukrainian",
  ps: "Pashto",
  ka: "Georgian",
  ha: "Hausa",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
};

const getLanguageName = (code) => localeOptions[code] || code;

export default function ResidentsChart({ title, data }) {
  return (
    <div className={classes.chartContainer}>
      <div className={classes.header}>
        <p>{title}</p>
        {/* <BsThreeDots size={24} color="#000" /> */}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} tabIndex={-1}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="language"
            axisLine={false}
            tickLine={false}
            tickFormatter={getLanguageName}
            tick={{
              fontSize: 13,
              fontWeight: 400,
              fill: "rgba(0, 0, 0, 0.60)",
            }}
          />
          <YAxis
            tickFormatter={(v) => `${v}`}
            axisLine={false}
            tick={{
              fontSize: 13,
              fontWeight: 400,
              fill: "rgba(0, 0, 0, 0.60)",
            }}
          />
          <Tooltip
            formatter={(v) => `${v}`}
            labelFormatter={getLanguageName}
            cursor={{ fill: "transparent" }}
          />
          <Bar dataKey="count" fill="#1997ED" barSize={52} activeDot={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
