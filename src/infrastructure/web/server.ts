import express, { type Express } from "express";

import { createRoutes } from "./routes";

export function createServer(): Express {
  const app = express();

  app.use(express.json());
  app.use(createRoutes());

  return app;
}

