import React, { useEffect, useState } from "react";
import type { Account, Department, Order, OrderStatus, WorkflowEvent } from "@shared/types";
import { useAppStore } from "./store";
import { WorkflowBoard } from "./components/WorkflowBoard";
import { OrderForm } from "./components/OrderForm";

async function loadOrders() {
  return window.salehub.orders.list();
}

const departmentLabels: Record<Department, string> = {
  accounting: "Phòng kế toán",
  driver: "Lái xe",
  warehouse: "Thủ kho",
  security: "Bảo vệ",
  summary: "Phòng tổng hợp"
};

const nextStatusMeta: Array<{
  status: OrderStatus;
  label: string;
  department: Department;
  step: string;
}> = [
  { status: "DRIVER_GATE_IN", label: "Ghi cân vào", department: "driver", step: "B6" },
  { status: "WAREHOUSE_VERIFIED", label: "Xác nhận xuất kho", department: "warehouse", step: "B8-9" },
  { status: "SECURITY_CHECKED", label: "Kiểm tra bảo vệ + cân ra", department: "security", step: "B14-17" },
  { status: "COMPLETED", label: "Hoàn tất tổng hợp", department: "summary", step: "B18-19" }
];

function getNextAction(order: Order) {
  return nextStatusMeta.find((item) => {
    if (item.status === "DRIVER_GATE_IN") return order.status === "PENDING_ACCOUNTING";
    if (item.status === "WAREHOUSE_VERIFIED") return order.status === "DRIVER_GATE_IN";
    if (item.status === "SECURITY_CHECKED") return order.status === "WAREHOUSE_VERIFIED";
    return order.status === "SECURITY_CHECKED";
  });
}

function canAdvance(account: Account, department: Department) {
  return account.role === "boss" || account.department === department;
}

function formatDepartment(account: Account) {
  if (account.role === "boss") {
    return "Boss quản lý";
  }

  return account.department ? departmentLabels[account.department] : "Chưa gán bộ phận";
}

export function App() {
  const account = useAppStore((s) => s.account);
  const orders = useAppStore((s) => s.orders);
  const dbDirectory = useAppStore((s) => s.dbDirectory);
  const setAccount = useAppStore((s) => s.setAccount);
  const setOrders = useAppStore((s) => s.setOrders);
  const setDbDirectory = useAppStore((s) => s.setDbDirectory);

  const [username, setUsername] = useState("boss");
  const [password, setPassword] = useState("boss123");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [appInfo, setAppInfo] = useState<{ name: string; version: string; apiPort: number } | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [history, setHistory] = useState<WorkflowEvent[]>([]);

  const activeOrder = orders.find((item) => item.id === selectedOrderId) || orders[0] || null;

  const refresh = async () => {
    setOrders(await loadOrders());
    setAccounts(await window.salehub.auth.listAccounts());
  };

  useEffect(() => {
    window.salehub.settings.get().then((x) => setDbDirectory(x.dbDirectory));
    window.salehub.appInfo().then(setAppInfo);
  }, [setDbDirectory]);

  useEffect(() => {
    if (account) {
      refresh();
    }
  }, [account]);

  useEffect(() => {
    if (!account || !activeOrder) {
      setHistory([]);
      return;
    }

    window.salehub.orders.history(activeOrder.id).then(setHistory);
  }, [account, activeOrder?.id]);

  useEffect(() => {
    if (!selectedOrderId && orders.length > 0) {
      setSelectedOrderId(orders[0].id);
      return;
    }

    if (selectedOrderId && !orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0]?.id ?? null);
    }
  }, [orders, selectedOrderId]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const logged = await window.salehub.auth.login(username, password);
    if (!logged) {
      alert("Sai tài khoản hoặc mật khẩu");
      return;
    }
    setAccount(logged);
  };

  const advance = async (order: Order, status: OrderStatus) => {
    if (!account) {
      return;
    }

    const note = prompt("Ghi chú bước xử lý", "");
    const payload: {
      orderId: number;
      status: OrderStatus;
      actorId: number;
      note?: string;
      metrics?: { gateInWeight?: number; gateOutWeight?: number };
      documents?: { gateInTicketNo?: string; gateOutTicketNo?: string; exportDocumentNo?: string };
    } = {
      orderId: order.id,
      status,
      actorId: account.id,
      note: note || undefined
    };

    if (status === "DRIVER_GATE_IN") {
      const gateInTicketNo = prompt("Số phiếu cân vào", order.gateInTicketNo || "");
      const gateInWeight = prompt("Khối lượng cân vào", order.gateInWeight?.toString() || "");
      payload.documents = { gateInTicketNo: gateInTicketNo || undefined };
      payload.metrics = gateInWeight ? { gateInWeight: Number(gateInWeight) } : undefined;
    }

    if (status === "WAREHOUSE_VERIFIED") {
      const exportDocumentNo = prompt("Số phiếu xuất kho", order.exportDocumentNo || "");
      payload.documents = { exportDocumentNo: exportDocumentNo || undefined };
    }

    if (status === "SECURITY_CHECKED") {
      const gateOutTicketNo = prompt("Số phiếu cân ra", order.gateOutTicketNo || "");
      const gateOutWeight = prompt("Khối lượng cân ra", order.gateOutWeight?.toString() || "");
      payload.documents = { gateOutTicketNo: gateOutTicketNo || undefined };
      payload.metrics = gateOutWeight ? { gateOutWeight: Number(gateOutWeight) } : undefined;
    }

    try {
      await window.salehub.orders.advance(payload);
      await refresh();
      setSelectedOrderId(order.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.");
    }
  };

  if (!account) {
    return (
      <main className="login-wrap">
        <form className="panel form" onSubmit={handleLogin}>
          <h1>TIENSON SALEHUB</h1>
          <p>Đăng nhập mô hình Boss ↔ Nhân viên</p>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Đăng nhập</button>
          <small>Tài khoản mẫu: boss/boss123 hoặc nhanvien/nv123</small>
        </form>
      </main>
    );
  }

  return (
    <main className="layout">
      <header className="topbar">
        <div>
          <h1>{appInfo?.name || "TIENSON SALEHUB V1"}</h1>
          <p>Version {appInfo?.version} - API localhost:{appInfo?.apiPort}</p>
        </div>
        <div>
          <strong>{account.displayName}</strong>
          <p>{formatDepartment(account)}</p>
        </div>
      </header>

      <section className="row">
        <OrderForm onCreated={refresh} />

        <article className="panel">
          <h3>Runtime & Data</h3>
          <p>SQLite cục bộ: {dbDirectory}</p>
          <button
            onClick={async () => {
              const next = prompt("Nhập thư mục lưu SQLite mới", dbDirectory);
              if (!next) return;
              const result = await window.salehub.settings.setDbDirectory(next);
              setDbDirectory(result.dbDirectory);
              await refresh();
            }}
          >
            Đổi thư mục dữ liệu
          </button>
        </article>

        {account.role === "boss" && (
          <article className="panel">
            <h3>Đa tài khoản</h3>
            <button
              onClick={async () => {
                const usernameNew = prompt("Username mới");
                const displayNameNew = prompt("Tên hiển thị");
                const passwordNew = prompt("Mật khẩu");
                const roleNew = (prompt("Role (boss|employee)", "employee") || "employee") as
                  | "boss"
                  | "employee";
                const departmentNew = roleNew === "boss"
                  ? null
                  : ((prompt(
                      "Bộ phận (accounting|driver|warehouse|security|summary)",
                      "accounting"
                    ) || "accounting") as Department);
                if (!usernameNew || !displayNameNew || !passwordNew) return;
                await window.salehub.auth.createAccount(
                  usernameNew,
                  displayNameNew,
                  passwordNew,
                  roleNew,
                  departmentNew
                );
                await refresh();
              }}
            >
              Tạo tài khoản
            </button>
            <ul>
              {accounts.map((acc) => (
                <li key={acc.id}>{acc.username} - {acc.role} - {acc.department ? departmentLabels[acc.department] : "boss"}</li>
              ))}
            </ul>
          </article>
        )}
      </section>

      <section className="panel">
        <h3>Sơ đồ luồng xử lý đơn hàng</h3>
        <WorkflowBoard orders={orders} />
      </section>

      <section className="workflow-layout">
        <article className="panel actions-panel">
          <div className="panel-header">
            <div>
              <h3>Điều phối đơn hàng</h3>
              <p>Chọn từng đơn để xử lý theo đúng lane của quy trình.</p>
            </div>
            <div className="summary-chip">Tổng đơn: {orders.length}</div>
          </div>
          <div className="actions">
            {orders.map((order) => {
              const nextAction = getNextAction(order);
              const allowed = nextAction ? canAdvance(account, nextAction.department) : false;

              return (
                <button
                  key={order.id}
                  type="button"
                  className={`order-list-item ${selectedOrderId === order.id ? "selected" : ""}`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <span>#{order.id} - {order.customerName}</span>
                  <span>{order.productType} - {order.quantityTon} tấn</span>
                  <span>{order.vehiclePlate || order.assignedDriver || "Chưa có xe"}</span>
                  <span>{order.status}</span>
                  {nextAction ? (
                    <span className="next-step">
                      {nextAction.step}: {nextAction.label} {allowed ? "" : `(cần ${departmentLabels[nextAction.department]})`}
                    </span>
                  ) : (
                    <span className="next-step">Đơn đã hoàn tất</span>
                  )}
                </button>
              );
            })}
          </div>
        </article>

        <article className="panel detail-panel">
          <div className="panel-header">
            <div>
              <h3>Chi tiết đơn hàng</h3>
              <p>Biểu mẫu bám các thông tin cần tổng hợp sang file Excel báo cáo.</p>
            </div>
            {activeOrder && <div className="summary-chip">#{activeOrder.id}</div>}
          </div>
          {activeOrder ? (
            <>
              <div className="detail-grid">
                <div><strong>Mã khách hàng</strong><span>{activeOrder.customerCode || "-"}</span></div>
                <div><strong>Tên khách hàng</strong><span>{activeOrder.customerName}</span></div>
                <div><strong>Biển số xe</strong><span>{activeOrder.vehiclePlate || "-"}</span></div>
                <div><strong>Lái xe</strong><span>{activeOrder.assignedDriver || "-"}</span></div>
                <div><strong>Phiếu nhận đơn</strong><span>{activeOrder.accountingDocumentNo || "-"}</span></div>
                <div><strong>Phiếu xuất kho</strong><span>{activeOrder.exportDocumentNo || "-"}</span></div>
                <div><strong>Phiếu cân vào</strong><span>{activeOrder.gateInTicketNo || "-"}</span></div>
                <div><strong>Phiếu cân ra</strong><span>{activeOrder.gateOutTicketNo || "-"}</span></div>
                <div><strong>Khối lượng cân vào</strong><span>{activeOrder.gateInWeight ?? "-"}</span></div>
                <div><strong>Khối lượng cân ra</strong><span>{activeOrder.gateOutWeight ?? "-"}</span></div>
                <div><strong>Số lượng xuất</strong><span>{activeOrder.quantityTon} tấn</span></div>
                <div><strong>Khối lượng tính ra</strong><span>{activeOrder.netWeight ?? "-"}</span></div>
                <div><strong>Kho</strong><span>{activeOrder.warehouseLocation || "-"}</span></div>
                <div><strong>Ngày giao</strong><span>{activeOrder.deliveryDate || "-"}</span></div>
              </div>
              <div className="detail-note">
                <strong>Ghi chú</strong>
                <p>{activeOrder.note || "Không có ghi chú"}</p>
              </div>
              <div className="detail-actions">
                {(() => {
                  const nextAction = getNextAction(activeOrder);
                  if (!nextAction) {
                    return <p className="hint-text">Đơn đã hoàn tất và sẵn sàng tổng hợp báo cáo ngày.</p>;
                  }

                  if (!canAdvance(account, nextAction.department)) {
                    return (
                      <p className="hint-text">
                        Bước tiếp theo thuộc {departmentLabels[nextAction.department]}.
                      </p>
                    );
                  }

                  return (
                    <button type="button" onClick={() => advance(activeOrder, nextAction.status)}>
                      {nextAction.step}: {nextAction.label}
                    </button>
                  );
                })()}
              </div>
            </>
          ) : (
            <p>Chưa có đơn hàng.</p>
          )}
        </article>

        <article className="panel history-panel">
          <div className="panel-header">
            <div>
              <h3>Nhật ký workflow</h3>
              <p>Theo dõi tuần tự các bước để đối chiếu chứng từ nội bộ.</p>
            </div>
          </div>
          <div className="history-list">
            {history.map((event) => (
              <div key={event.id} className="history-item">
                <strong>{event.stepCode}</strong>
                <span>{event.createdAt}</span>
                <p>{event.note || "Không có ghi chú"}</p>
              </div>
            ))}
            {history.length === 0 && <p>Chưa có lịch sử xử lý.</p>}
          </div>
        </article>
      </section>
    </main>
  );
}
