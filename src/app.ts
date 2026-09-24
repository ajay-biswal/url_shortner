import express from "express";
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);

export default app;
