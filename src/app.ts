import express from "express";
import urlRoutes from './routes/url.routes.js';
const app = express();

app.use(express.json());

app.get('/health', (_req, res)=>{
    res.status(200).json({
        status: "ok"
    });
});

app.use("/api/urls", urlRoutes)

export default app;