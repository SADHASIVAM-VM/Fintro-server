"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roomController_1 = require("../controllers/roomController");
const auth_1 = require("../middleware/auth");
const imageUpload_1 = require("../services/imageUpload");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Rent Routes
router.get('/rents', roomController_1.getRoomRents);
router.post('/rents', roomController_1.createRoomRent);
router.post('/rents/:id/pay', roomController_1.payRoomRent);
// Bills Routes
router.get('/bills', roomController_1.getRoomBills);
router.post('/bills', roomController_1.createRoomBill);
router.post('/bills/:id/pay', roomController_1.payRoomBill);
// Purchases Routes
router.get('/purchases', roomController_1.getRoomPurchases);
router.post('/purchases', imageUpload_1.upload.single('bill'), roomController_1.createRoomPurchase);
// Inventory Routes
router.get('/inventory', roomController_1.getRoomInventory);
router.post('/inventory', roomController_1.createRoomInventoryItem);
router.patch('/inventory/:id', roomController_1.updateRoomInventoryItem);
router.delete('/inventory/:id', roomController_1.deleteRoomInventoryItem);
exports.default = router;
