import { dbRuntime } from "../db/storage";
import type { Order } from "../../shared/types";

function toOrder(row: any): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    productType: row.product_type,
    quantityTon: row.quantity_ton,
    status: row.status,
    createdBy: row.created_by,
    assignedDriver: row.assigned_driver,
    gateInWeight: row.gate_in_weight,
    gateOutWeight: row.gate_out_weight,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createOrder(payload: {
  customerName: string;
  productType: string;
  quantityTon: number;
  createdBy: number;
  assignedDriver?: string;
}): Order {
  const db = dbRuntime.getDb();
  const result = db
    .prepare(
      `INSERT INTO orders (customer_name, product_type, quantity_ton, status, created_by, assigned_driver)
       VALUES (?, ?, ?, 'PENDING_ACCOUNTING', ?, ?)`
    )
    .run(
      payload.customerName,
      payload.productType,
      payload.quantityTon,
      payload.createdBy,
      payload.assignedDriver || null
    );

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(result.lastInsertRowid);
  return toOrder(row);
}

export function listOrders(): Order[] {
  const db = dbRuntime.getDb();
  const rows = db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
  return rows.map(toOrder);
}

export function updateOrderStatus(
  orderId: number,
  status: string,
  actorId: number,
  note?: string,
  metrics?: { gateInWeight?: number; gateOutWeight?: number }
): Order {
  const db = dbRuntime.getDb();

  db.prepare(
    `UPDATE orders
     SET status = ?, gate_in_weight = COALESCE(?, gate_in_weight), gate_out_weight = COALESCE(?, gate_out_weight),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(status, metrics?.gateInWeight ?? null, metrics?.gateOutWeight ?? null, orderId);

  db.prepare("INSERT INTO workflow_events (order_id, step_code, actor_id, note) VALUES (?, ?, ?, ?)").run(
    orderId,
    status,
    actorId,
    note || null
  );

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  return toOrder(row);
}
