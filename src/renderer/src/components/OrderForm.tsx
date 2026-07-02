import React, { useState } from "react";
import { useAppStore } from "../store";

export function OrderForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const account = useAppStore((s) => s.account);
  const [customerName, setCustomerName] = useState("");
  const [productType, setProductType] = useState("Xi măng");
  const [quantityTon, setQuantityTon] = useState(20);
  const [assignedDriver, setAssignedDriver] = useState("Lái xe A");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!account) {
      return;
    }

    await window.salehub.orders.create({
      customerName,
      productType,
      quantityTon,
      createdBy: account.id,
      assignedDriver
    });

    setCustomerName("");
    await onCreated();
  };

  return (
    <form className="panel form" onSubmit={submit}>
      <h3>Tạo đơn hàng</h3>
      <input
        placeholder="Tên khách hàng"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        required
      />
      <input value={productType} onChange={(e) => setProductType(e.target.value)} required />
      <input
        type="number"
        min={1}
        value={quantityTon}
        onChange={(e) => setQuantityTon(Number(e.target.value))}
        required
      />
      <input value={assignedDriver} onChange={(e) => setAssignedDriver(e.target.value)} required />
      <button type="submit">Lưu đơn</button>
    </form>
  );
}
