export type UserRole = "boss" | "employee";

export interface Account {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: number;
  createdAt: string;
}

export interface Order {
  id: number;
  customerName: string;
  productType: string;
  quantityTon: number;
  status: string;
  createdBy: number;
  assignedDriver: string | null;
  gateInWeight: number | null;
  gateOutWeight: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: number;
  title: string;
  lane: string;
}

export interface AppSettings {
  dbDirectory: string;
}
