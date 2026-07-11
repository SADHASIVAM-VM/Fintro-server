"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportsController_1 = require("../controllers/reportsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/expenses/csv', auth_1.authenticate, reportsController_1.exportExpensesCSV);
exports.default = router;
