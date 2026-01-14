import express from "express";
import { compareStocks, getComprehensiveComparison } from "./stock.controller.js";

const router = express.Router();

router.post("/compare", compareStocks);
router.post("/compare/comprehensive", getComprehensiveComparison);

export default router;
