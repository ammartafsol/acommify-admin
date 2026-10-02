import BusBookingDetailTemplate from "@/components/templates/BusBookingDetail";
import React from "react";

export default async function BusBookingDetails({ params }) {
  const { slug } = await params;
  return <BusBookingDetailTemplate slug={slug} />;
}
