import React from "react";
import type { Order, OrderStatus } from "@shared/types";

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

const laneDescriptions: Record<OrderStatus, string> = {
  PENDING_ACCOUNTING: "Tiếp nhận đơn, lập phiếu và giao chứng từ cho lái xe.",
  DRIVER_GATE_IN: "Cân xe vào và bàn giao phiếu xuất kho cho thủ kho.",
  WAREHOUSE_VERIFIED: "Đối chiếu chứng từ, xuất hàng và ký xác nhận.",
  SECURITY_CHECKED: "Kiểm tra chứng từ, cân xe ra và xác nhận bảo vệ.",
  COMPLETED: "Nhập số liệu hoàn tất để tổng hợp theo ngày và báo cáo Excel."
};

export function WorkflowBoard({ orders }: { orders: Order[] }) {
  return (
    <div className="board-grid">
      {lanes.map((lane) => (
        <div key={lane} className="lane">
          <h3>{laneTitles[lane]}</h3>
          <p className="lane-copy">{laneDescriptions[lane as OrderStatus]}</p>
          {orders.filter((x) => x.status === lane).map((order) => (
            <div key={order.id} className="card">
              <strong>#{order.id} - {order.customerName}</strong>
              <p>{order.customerCode || "Chưa có mã KH"}</p>
              <p>{order.productType} - {order.quantityTon} tấn</p>
              <p>Xe: {order.vehiclePlate || order.assignedDriver || "Chưa gán"}</p>
              <p>PXK: {order.exportDocumentNo || "Chưa có"}</p>
              <p>Cân vào/ra: {order.gateInWeight ?? "-"} / {order.gateOutWeight ?? "-"}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
