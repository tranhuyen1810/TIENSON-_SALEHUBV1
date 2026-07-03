import type { Department, UserRole } from "@shared/types";

declare global {
  interface Window {
    salehub: {
      appInfo: () => Promise<{ name: string; version: string; apiPort: number }>;
      settings: {
        get: () => Promise<{ dbDirectory: string }>;
        setDbDirectory: (directory: string) => Promise<{ dbDirectory: string }>;
      };
      auth: {
        login: (username: string, password: string) => Promise<any>;
        listAccounts: () => Promise<any[]>;
        createAccount: (
          username: string,
          displayName: string,
          password: string,
          role: UserRole,
          department: Department | null
        ) => Promise<any>;
      };
      orders: {
        list: () => Promise<any[]>;
        create: (payload: any) => Promise<any>;
        advance: (payload: any) => Promise<any>;
        history: (orderId: number) => Promise<any[]>;
      };
    };
  }
}

export {};
