import OrderDetail from "@/components/templates/OrderDetail";
import React from "react";

export default async function OrderDetailPage({ params }) {
  const orderId = (await params)?.slug;
  return <OrderDetail orderId={orderId} />;
}
