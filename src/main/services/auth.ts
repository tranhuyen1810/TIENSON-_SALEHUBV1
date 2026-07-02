import crypto from "node:crypto";
import { dbRuntime } from "../db/storage";
import type { Account, UserRole } from "../../shared/types";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function toAccount(row: any): Account {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at
  };
}

export function ensureSeedAccounts(): void {
  const db = dbRuntime.getDb();
  const existing = db.prepare("SELECT COUNT(*) AS total FROM accounts").get() as { total: number };
  if (existing.total > 0) {
    return;
  }

  const insert = db.prepare(
    "INSERT INTO accounts (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)"
  );

  insert.run("boss", "Boss quản lý", hashPassword("boss123"), "boss");
  insert.run("nhanvien", "Nhân viên kế toán", hashPassword("nv123"), "employee");
}

export function login(username: string, password: string): Account | null {
  const db = dbRuntime.getDb();
  const row = db
    .prepare("SELECT * FROM accounts WHERE username = ? AND password_hash = ? AND is_active = 1")
    .get(username, hashPassword(password));

  return row ? toAccount(row) : null;
}

export function listAccounts(): Account[] {
  const db = dbRuntime.getDb();
  const rows = db.prepare("SELECT * FROM accounts ORDER BY id DESC").all();
  return rows.map(toAccount);
}

export function createAccount(
  username: string,
  displayName: string,
  password: string,
  role: UserRole
): Account {
  const db = dbRuntime.getDb();
  const result = db
    .prepare(
      "INSERT INTO accounts (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)"
    )
    .run(username, displayName, hashPassword(password), role);

  const row = db.prepare("SELECT * FROM accounts WHERE id = ?").get(result.lastInsertRowid);
  return toAccount(row);
}
