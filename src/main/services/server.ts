import express from "express";
import type { Server } from "node:http";
import { listOrders } from "./orders";

let server: Server | null = null;
let currentPort = 0;

export function startApiServer(port = 3977): number {
  if (server) {
    return currentPort;
  }

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "salehub-local-api" });
  });

  app.get("/orders", (_req, res) => {
    res.json({ items: listOrders() });
  });

  server = app.listen(port);
  currentPort = port;
  return currentPort;
}

export function stopApiServer(): void {
  if (server) {
    server.close();
    server = null;
    currentPort = 0;
  }
}
