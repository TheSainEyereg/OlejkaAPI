import { env } from "node:process";
import dotenv from "dotenv";
import Fastify from "fastify";

dotenv.config();

const app = Fastify();

app.listen({ port: Number(env.PORT) || 5050 });