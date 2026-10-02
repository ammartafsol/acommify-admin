"use client";
import React from "react";
import classes from "./HelpLineCard.module.css";
import { LuClock4, LuPhone } from "react-icons/lu";
import { useLocale } from "next-intl";

export default function HelpLineCard({ data }) {
  const locale = useLocale();
  return (
    <div className={classes.card}>
      <p>{data.title[locale]}</p>
      <p>{data.description[locale]}</p>
      <p>
        {" "}
        <span>
          <LuPhone size={13} color="#33B5F6" />
        </span>{" "}
        {data.phone}
      </p>
      <p>
        {" "}
        <span>
          <LuClock4 size={13} color="#33B5F6" />
        </span>{" "}
        {data.service}
      </p>
    </div>
  );
}
