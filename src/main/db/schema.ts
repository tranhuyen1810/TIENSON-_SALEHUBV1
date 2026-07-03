import type Database from "better-sqlite3";

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((row) => row.name === column);
}

function ensureColumn(
  db: Database.Database,
  table: string,
  column: string,
  definition: string
): void {
  if (!hasColumn(db, table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('boss', 'employee')),
      department TEXT CHECK(department IN ('accounting', 'driver', 'warehouse', 'security', 'summary')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_code TEXT,
      customer_name TEXT NOT NULL,
      vehicle_plate TEXT,
      product_type TEXT NOT NULL,
      quantity_ton REAL NOT NULL,
      delivery_date TEXT,
      warehouse_location TEXT,
      accounting_document_no TEXT,
      export_document_no TEXT,
      gate_in_ticket_no TEXT,
      gate_out_ticket_no TEXT,
      note TEXT,
      status TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      assigned_driver TEXT,
      gate_in_weight REAL,
      gate_out_weight REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS workflow_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      step_code TEXT NOT NULL,
      actor_id INTEGER,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY(actor_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_order_id ON workflow_events(order_id);
  `);

  ensureColumn(
    db,
    "accounts",
    "department",
    "TEXT CHECK(department IN ('accounting', 'driver', 'warehouse', 'security', 'summary'))"
  );

  ensureColumn(db, "orders", "customer_code", "TEXT");
  ensureColumn(db, "orders", "vehicle_plate", "TEXT");
  ensureColumn(db, "orders", "delivery_date", "TEXT");
  ensureColumn(db, "orders", "warehouse_location", "TEXT");
  ensureColumn(db, "orders", "accounting_document_no", "TEXT");
  ensureColumn(db, "orders", "export_document_no", "TEXT");
  ensureColumn(db, "orders", "gate_in_ticket_no", "TEXT");
  ensureColumn(db, "orders", "gate_out_ticket_no", "TEXT");
  ensureColumn(db, "orders", "note", "TEXT");
}
