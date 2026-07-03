import React, { useState } from "react";
import { useAppStore } from "../store";

export function OrderForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const account = useAppStore((s) => s.account);
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [productType, setProductType] = useState("Xi măng");
  const [quantityTon, setQuantityTon] = useState(20);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("Kho chính");
  const [accountingDocumentNo, setAccountingDocumentNo] = useState("");
  const [exportDocumentNo, setExportDocumentNo] = useState("");
  const [assignedDriver, setAssignedDriver] = useState("Lái xe A");
  const [note, setNote] = useState("");

  const canCreateOrder = account?.role === "boss" || account?.department === "accounting";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!account || !canCreateOrder) {
      return;
    }

    await window.salehub.orders.create({
      customerCode,
      customerName,
      vehiclePlate,
      productType,
      quantityTon,
      deliveryDate,
      warehouseLocation,
      accountingDocumentNo,
      exportDocumentNo,
      note,
      createdBy: account.id,
      assignedDriver
    });

    setCustomerCode("");
    setCustomerName("");
    setVehiclePlate("");
    setAccountingDocumentNo("");
    setExportDocumentNo("");
    setNote("");
    await onCreated();
  };

  if (!canCreateOrder) {
    return (
      <article className="panel form">
        <h3>Tạo đơn hàng</h3>
        <p>Chỉ bộ phận kế toán hoặc boss được tạo đơn mới.</p>
      </article>
    );
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h3>Tạo đơn hàng</h3>
      <div className="field-grid two-columns">
        <label>
          <span>Mã khách hàng</span>
          <input
            placeholder="Ví dụ: 01X29"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
          />
        </label>
        <label>
          <span>Biển số xe</span>
          <input
            placeholder="29H-66479"
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value)}
          />
        </label>
      </div>
      <input
        placeholder="Tên khách hàng"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        required
      />
      <div className="field-grid two-columns">
        <label>
          <span>Chủng loại</span>
          <input value={productType} onChange={(e) => setProductType(e.target.value)} required />
        </label>
        <label>
          <span>Số lượng xuất (tấn)</span>
          <input
            type="number"
            min={1}
            step="0.001"
            value={quantityTon}
            onChange={(e) => setQuantityTon(Number(e.target.value))}
            required
          />
        </label>
      </div>
      <div className="field-grid two-columns">
        <label>
          <span>Ngày giao hàng</span>
          <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
        </label>
        <label>
          <span>Kho</span>
          <input value={warehouseLocation} onChange={(e) => setWarehouseLocation(e.target.value)} />
        </label>
      </div>
      <div className="field-grid two-columns">
        <label>
          <span>Phiếu nhận đơn</span>
          <input value={accountingDocumentNo} onChange={(e) => setAccountingDocumentNo(e.target.value)} />
        </label>
        <label>
          <span>Phiếu xuất kho</span>
          <input value={exportDocumentNo} onChange={(e) => setExportDocumentNo(e.target.value)} />
        </label>
      </div>
      <label>
        <span>Lái xe phụ trách</span>
        <input value={assignedDriver} onChange={(e) => setAssignedDriver(e.target.value)} required />
      </label>
      <label>
        <span>Ghi chú</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </label>
      <button type="submit">Lưu đơn</button>
    </form>
  );
}
