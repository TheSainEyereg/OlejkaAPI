import { api } from "./API";

api.launch().then(api.config.watchConfig);