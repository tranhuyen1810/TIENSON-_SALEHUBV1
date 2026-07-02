import React, { useEffect, useState } from "react";
import type { Account } from "@shared/types";
import { useAppStore } from "./store";
import { WorkflowBoard } from "./components/WorkflowBoard";
import { OrderForm } from "./components/OrderForm";

async function loadOrders() {
  return window.salehub.orders.list();
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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const logged = await window.salehub.auth.login(username, password);
    if (!logged) {
      alert("Sai tài khoản hoặc mật khẩu");
      return;
    }
    setAccount(logged);
  };

  const advance = async (orderId: number, status: string) => {
    if (!account) {
      return;
    }

    await window.salehub.orders.advance({ orderId, status, actorId: account.id });
    await refresh();
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
          <p>Role: {account.role}</p>
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
                if (!usernameNew || !displayNameNew || !passwordNew) return;
                await window.salehub.auth.createAccount(
                  usernameNew,
                  displayNameNew,
                  passwordNew,
                  roleNew
                );
                await refresh();
              }}
            >
              Tạo tài khoản
            </button>
            <ul>
              {accounts.map((acc) => (
                <li key={acc.id}>{acc.username} - {acc.role}</li>
              ))}
            </ul>
          </article>
        )}
      </section>

      <section className="panel">
        <h3>Sơ đồ luồng xử lý đơn hàng</h3>
        <WorkflowBoard orders={orders} />
        <div className="actions">
          {orders.map((order) => (
            <div key={order.id} className="action-item">
              <span>#{order.id} - {order.customerName}</span>
              <button onClick={() => advance(order.id, "DRIVER_GATE_IN")}>B6: Cân vào</button>
              <button onClick={() => advance(order.id, "WAREHOUSE_VERIFIED")}>B8-9: Xuất kho</button>
              <button onClick={() => advance(order.id, "SECURITY_CHECKED")}>B15: Bảo vệ</button>
              <button onClick={() => advance(order.id, "COMPLETED")}>B18-19: Tổng hợp</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
