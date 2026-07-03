import { dbRuntime } from "../db/storage";
import type {
  Account,
  Department,
  Order,
  OrderAdvancePayload,
  OrderCreatePayload,
  OrderStatus,
  WorkflowEvent
} from "../../shared/types";

const TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  PENDING_ACCOUNTING: null,
  DRIVER_GATE_IN: "PENDING_ACCOUNTING",
  WAREHOUSE_VERIFIED: "DRIVER_GATE_IN",
  SECURITY_CHECKED: "WAREHOUSE_VERIFIED",
  COMPLETED: "SECURITY_CHECKED"
};

const STATUS_DEPARTMENT: Record<Exclude<OrderStatus, "PENDING_ACCOUNTING">, Department> = {
  DRIVER_GATE_IN: "driver",
  WAREHOUSE_VERIFIED: "warehouse",
  SECURITY_CHECKED: "security",
  COMPLETED: "summary"
};

function toWorkflowEvent(row: any): WorkflowEvent {
  return {
    id: row.id,
    orderId: row.order_id,
    stepCode: row.step_code,
    actorId: row.actor_id,
    note: row.note,
    createdAt: row.created_at
  };
}

function getActor(actorId: number): Account {
  const db = dbRuntime.getDb();
  const row = db.prepare("SELECT * FROM accounts WHERE id = ? AND is_active = 1").get(actorId);
  if (!row) {
    throw new Error("Tài khoản thao tác không hợp lệ.");
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    department: row.department,
    isActive: row.is_active,
    createdAt: row.created_at
  };
}

function ensureCreatePermission(actor: Account): void {
  if (actor.role === "boss") {
    return;
  }

  if (actor.department !== "accounting") {
    throw new Error("Tài khoản này không có quyền tạo đơn hàng.");
  }
}

function ensureTransitionPermission(actor: Account, status: OrderStatus): void {
  if (actor.role === "boss") {
    return;
  }

  const expectedDepartment = STATUS_DEPARTMENT[status as Exclude<OrderStatus, "PENDING_ACCOUNTING">];
  if (!expectedDepartment || actor.department !== expectedDepartment) {
    throw new Error("Tài khoản này không có quyền cập nhật trạng thái này.");
  }
}

function validateTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): void {
  const expectedPrevious = TRANSITIONS[nextStatus];
  if (expectedPrevious !== currentStatus) {
    throw new Error(`Không thể chuyển từ ${currentStatus} sang ${nextStatus}.`);
  }
}

function validateDocuments(payload: OrderAdvancePayload): void {
  if (payload.status === "DRIVER_GATE_IN" && payload.metrics?.gateInWeight == null) {
    throw new Error("Bước cân vào yêu cầu khối lượng xe vào.");
  }

  if (payload.status === "SECURITY_CHECKED" && payload.metrics?.gateOutWeight == null) {
    throw new Error("Bước bảo vệ yêu cầu khối lượng xe ra.");
  }
}

function toOrder(row: any): Order {
  const gateInWeight = row.gate_in_weight == null ? null : Number(row.gate_in_weight);
  const gateOutWeight = row.gate_out_weight == null ? null : Number(row.gate_out_weight);

  return {
    id: row.id,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    vehiclePlate: row.vehicle_plate,
    productType: row.product_type,
    quantityTon: row.quantity_ton,
    deliveryDate: row.delivery_date,
    warehouseLocation: row.warehouse_location,
    accountingDocumentNo: row.accounting_document_no,
    exportDocumentNo: row.export_document_no,
    gateInTicketNo: row.gate_in_ticket_no,
    gateOutTicketNo: row.gate_out_ticket_no,
    note: row.note,
    status: row.status,
    createdBy: row.created_by,
    assignedDriver: row.assigned_driver,
    gateInWeight,
    gateOutWeight,
    netWeight: gateInWeight != null && gateOutWeight != null ? Number((gateOutWeight - gateInWeight).toFixed(3)) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function createOrder(payload: OrderCreatePayload): Order {
  const db = dbRuntime.getDb();
  ensureCreatePermission(getActor(payload.createdBy));

  const result = db
    .prepare(
      `INSERT INTO orders (
        customer_code,
        customer_name,
        vehicle_plate,
        product_type,
        quantity_ton,
        delivery_date,
        warehouse_location,
        accounting_document_no,
        export_document_no,
        note,
        status,
        created_by,
        assigned_driver
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_ACCOUNTING', ?, ?)`
    )
    .run(
      payload.customerCode || null,
      payload.customerName,
      payload.vehiclePlate || null,
      payload.productType,
      payload.quantityTon,
      payload.deliveryDate || null,
      payload.warehouseLocation || null,
      payload.accountingDocumentNo || null,
      payload.exportDocumentNo || null,
      payload.note || null,
      payload.createdBy,
      payload.assignedDriver || null
    );

  db.prepare("INSERT INTO workflow_events (order_id, step_code, actor_id, note) VALUES (?, ?, ?, ?)").run(
    result.lastInsertRowid,
    "PENDING_ACCOUNTING",
    payload.createdBy,
    payload.note || "Tạo đơn hàng"
  );

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(result.lastInsertRowid);
  return toOrder(row);
}

export function listOrders(): Order[] {
  const db = dbRuntime.getDb();
  const rows = db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
  return rows.map(toOrder);
}

export function listWorkflowEvents(orderId: number): WorkflowEvent[] {
  const db = dbRuntime.getDb();
  const rows = db
    .prepare("SELECT * FROM workflow_events WHERE order_id = ? ORDER BY id DESC")
    .all(orderId);

  return rows.map(toWorkflowEvent);
}

export function updateOrderStatus(payload: OrderAdvancePayload): Order {
  const db = dbRuntime.getDb();
  const actor = getActor(payload.actorId);
  ensureTransitionPermission(actor, payload.status);
  validateDocuments(payload);

  const currentRow = db.prepare("SELECT * FROM orders WHERE id = ?").get(payload.orderId);
  if (!currentRow) {
    throw new Error("Không tìm thấy đơn hàng.");
  }

  validateTransition(currentRow.status, payload.status);

  db.prepare(
    `UPDATE orders
     SET status = ?,
         gate_in_weight = COALESCE(?, gate_in_weight),
         gate_out_weight = COALESCE(?, gate_out_weight),
         gate_in_ticket_no = COALESCE(?, gate_in_ticket_no),
         gate_out_ticket_no = COALESCE(?, gate_out_ticket_no),
         export_document_no = COALESCE(?, export_document_no),
         note = COALESCE(?, note),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    payload.status,
    payload.metrics?.gateInWeight ?? null,
    payload.metrics?.gateOutWeight ?? null,
    payload.documents?.gateInTicketNo ?? null,
    payload.documents?.gateOutTicketNo ?? null,
    payload.documents?.exportDocumentNo ?? null,
    payload.note ?? null,
    payload.orderId
  );

  db.prepare("INSERT INTO workflow_events (order_id, step_code, actor_id, note) VALUES (?, ?, ?, ?)").run(
    payload.orderId,
    payload.status,
    payload.actorId,
    payload.note || null
  );

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(payload.orderId);
  return toOrder(row);
}
