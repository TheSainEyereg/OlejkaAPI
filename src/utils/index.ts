import ConfigManager from "./ConfigManager.ts";
import Database from "./Database.ts";

export const config = new ConfigManager("dynamic.toml");
export const database = new Database();
