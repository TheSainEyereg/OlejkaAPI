import ConfigManager from "./ConfigManager";
import Database from "./Database";

export const config = new ConfigManager("dynamic.toml");
export const database = new Database();