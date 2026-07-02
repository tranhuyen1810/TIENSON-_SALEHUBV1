import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Database from "better-sqlite3";
import { app } from "electron";

interface RuntimeConfig {
  dbDirectory: string;
}

const CONFIG_FILE = "runtime-config.json";
const DB_FILE = "salehub.db";

function getDefaultDbDirectory(): string {
  return path.join(os.homedir(), "Documents", "TIENSON_SALEHUB_DATA");
}

function getConfigPath(): string {
  const appDataDir = app.getPath("userData");
  fs.mkdirSync(appDataDir, { recursive: true });
  return path.join(appDataDir, CONFIG_FILE);
}

function readConfig(): RuntimeConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return { dbDirectory: getDefaultDbDirectory() };
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<RuntimeConfig>;
    return {
      dbDirectory: parsed.dbDirectory || getDefaultDbDirectory()
    };
  } catch {
    return { dbDirectory: getDefaultDbDirectory() };
  }
}

function writeConfig(config: RuntimeConfig): void {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export class DbRuntime {
  private db: Database.Database | null = null;
  private config: RuntimeConfig;

  constructor() {
    this.config = readConfig();
  }

  getDbDirectory(): string {
    return this.config.dbDirectory;
  }

  setDbDirectory(nextDirectory: string): void {
    this.config.dbDirectory = nextDirectory;
    fs.mkdirSync(nextDirectory, { recursive: true });
    writeConfig(this.config);
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  getDb(): Database.Database {
    if (this.db) {
      return this.db;
    }

    fs.mkdirSync(this.config.dbDirectory, { recursive: true });
    const dbPath = path.join(this.config.dbDirectory, DB_FILE);
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    return this.db;
  }
}

export const dbRuntime = new DbRuntime();
