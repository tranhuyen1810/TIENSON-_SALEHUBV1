import { contextBridge, ipcRenderer } from "electron";
import type { UserRole } from "../shared/types";

contextBridge.exposeInMainWorld("salehub", {
  appInfo: () => ipcRenderer.invoke("app:info"),
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    setDbDirectory: (directory: string) => ipcRenderer.invoke("settings:set-db-directory", directory)
  },
  auth: {
    login: (username: string, password: string) => ipcRenderer.invoke("auth:login", username, password),
    listAccounts: () => ipcRenderer.invoke("auth:list-accounts"),
    createAccount: (username: string, displayName: string, password: string, role: UserRole) =>
      ipcRenderer.invoke("auth:create-account", username, displayName, password, role)
  },
  orders: {
    list: () => ipcRenderer.invoke("orders:list"),
    create: (payload: any) => ipcRenderer.invoke("orders:create", payload),
    advance: (payload: any) => ipcRenderer.invoke("orders:advance", payload)
  }
});

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
          role: UserRole
        ) => Promise<any>;
      };
      orders: {
        list: () => Promise<any[]>;
        create: (payload: any) => Promise<any>;
        advance: (payload: any) => Promise<any>;
      };
    };
  }
}
