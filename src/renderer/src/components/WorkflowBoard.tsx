import React from "react";
import type { Order } from "@shared/types";

const lanes = [
  "PENDING_ACCOUNTING",
  "DRIVER_GATE_IN",
  "WAREHOUSE_VERIFIED",
  "SECURITY_CHECKED",
  "COMPLETED"
];

const laneTitles: Record<string, string> = {
  PENDING_ACCOUNTING: "Phòng kế toán",
  DRIVER_GATE_IN: "Lái xe",
  WAREHOUSE_VERIFIED: "Thủ kho",
  SECURITY_CHECKED: "Bảo vệ",
  COMPLETED: "Phòng tổng hợp"
};

export function WorkflowBoard({ orders }: { orders: Order[] }) {
  return (
    <div className="board-grid">
      {lanes.map((lane) => (
        <div key={lane} className="lane">
          <h3>{laneTitles[lane]}</h3>
          {orders.filter((x) => x.status === lane).map((order) => (
            <div key={order.id} className="card">
              <strong>#{order.id} - {order.customerName}</strong>
              <p>{order.productType}</p>
              <p>{order.quantityTon} tấn</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
