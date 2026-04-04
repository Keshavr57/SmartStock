import express from "express";
import { compareStocks, getComprehensiveComparison, getStockFundamentals } from "./stock.controller.js";

const router = express.Router();

router.get("/fundamentals/:symbol", getStockFundamentals);
router.post("/compare", compareStocks);
router.post("/compare/comprehensive", getComprehensiveComparison);

export default router;
