export type UserRole = "boss" | "employee";

export type Department = "accounting" | "driver" | "warehouse" | "security" | "summary";

export type OrderStatus =
  | "PENDING_ACCOUNTING"
  | "DRIVER_GATE_IN"
  | "WAREHOUSE_VERIFIED"
  | "SECURITY_CHECKED"
  | "COMPLETED";

export interface Account {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
  department: Department | null;
  isActive: number;
  createdAt: string;
}

export interface Order {
  id: number;
  customerCode: string | null;
  customerName: string;
  vehiclePlate: string | null;
  productType: string;
  quantityTon: number;
  deliveryDate: string | null;
  warehouseLocation: string | null;
  accountingDocumentNo: string | null;
  exportDocumentNo: string | null;
  gateInTicketNo: string | null;
  gateOutTicketNo: string | null;
  note: string | null;
  status: OrderStatus;
  createdBy: number;
  assignedDriver: string | null;
  gateInWeight: number | null;
  gateOutWeight: number | null;
  netWeight: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowEvent {
  id: number;
  orderId: number;
  stepCode: OrderStatus;
  actorId: number | null;
  note: string | null;
  createdAt: string;
}

export interface OrderCreatePayload {
  customerCode?: string;
  customerName: string;
  vehiclePlate?: string;
  productType: string;
  quantityTon: number;
  deliveryDate?: string;
  warehouseLocation?: string;
  accountingDocumentNo?: string;
  exportDocumentNo?: string;
  note?: string;
  createdBy: number;
  assignedDriver?: string;
}

export interface OrderAdvancePayload {
  orderId: number;
  status: OrderStatus;
  actorId: number;
  note?: string;
  metrics?: {
    gateInWeight?: number;
    gateOutWeight?: number;
  };
  documents?: {
    gateInTicketNo?: string;
    gateOutTicketNo?: string;
    exportDocumentNo?: string;
  };
}

export interface WorkflowStep {
  id: number;
  title: string;
  lane: string;
}

export interface AppSettings {
  dbDirectory: string;
}
