import path from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { dbRuntime } from "./db/storage";
import { migrate } from "./db/schema";
import { createAccount, ensureSeedAccounts, listAccounts, login } from "./services/auth";
import { createOrder, listOrders, updateOrderStatus } from "./services/orders";
import { startApiServer, stopApiServer } from "./services/server";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;
let apiPort = 0;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    title: "TIENSON SALEHUB V1",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle("app:info", () => ({
    name: app.getName(),
    version: app.getVersion(),
    apiPort
  }));

  ipcMain.handle("settings:get", () => ({
    dbDirectory: dbRuntime.getDbDirectory()
  }));

  ipcMain.handle("settings:set-db-directory", async (_event, directory: string) => {
    const targetDirectory = directory || (await dialog.showOpenDialog({ properties: ["openDirectory"] })).filePaths[0];
    if (!targetDirectory) {
      return { dbDirectory: dbRuntime.getDbDirectory() };
    }

    dbRuntime.setDbDirectory(targetDirectory);
    migrate(dbRuntime.getDb());
    ensureSeedAccounts();
    return { dbDirectory: dbRuntime.getDbDirectory() };
  });

  ipcMain.handle("auth:login", (_event, username: string, password: string) => login(username, password));
  ipcMain.handle("auth:list-accounts", () => listAccounts());
  ipcMain.handle(
    "auth:create-account",
    (_event, username: string, displayName: string, password: string, role: "boss" | "employee") =>
      createAccount(username, displayName, password, role)
  );

  ipcMain.handle("orders:list", () => listOrders());
  ipcMain.handle("orders:create", (_event, payload) => createOrder(payload));
  ipcMain.handle("orders:advance", (_event, payload) =>
    updateOrderStatus(payload.orderId, payload.status, payload.actorId, payload.note, payload.metrics)
  );
}

app.whenReady().then(() => {
  migrate(dbRuntime.getDb());
  ensureSeedAccounts();
  apiPort = startApiServer(3977);
  registerIpcHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopApiServer();
    app.quit();
  }
});
