import { Router } from "express";
import { createURL } from "../controller/url.controller.js";
const router = Router();

router.post("/", createURL);

export default router;