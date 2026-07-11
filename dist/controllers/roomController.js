"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoomInventoryItem = exports.updateRoomInventoryItem = exports.createRoomInventoryItem = exports.getRoomInventory = exports.createRoomPurchase = exports.getRoomPurchases = exports.payRoomBill = exports.createRoomBill = exports.getRoomBills = exports.payRoomRent = exports.createRoomRent = exports.getRoomRents = void 0;
const RoomRent_1 = require("../models/RoomRent");
const RoomBill_1 = require("../models/RoomBill");
const RoomInventory_1 = require("../models/RoomInventory");
const RoomPurchase_1 = require("../models/RoomPurchase");
// --- ROOM RENT ENDPOINTS ---
const getRoomRents = async (req, res) => {
    try {
        const query = req.user?.role === 'admin' ? {} : { createdBy: req.user?.id };
        const rents = await RoomRent_1.RoomRent.find(query).sort({ month: -1 });
        res.status(200).json(rents);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching room rents' });
    }
};
exports.getRoomRents = getRoomRents;
const createRoomRent = async (req, res) => {
    const { month, rentAmount, dueDate } = req.body;
    try {
        const rent = new RoomRent_1.RoomRent({
            month,
            rentAmount: Number(rentAmount),
            isPaid: false,
            dueDate,
            createdBy: req.user?.id,
        });
        await rent.save();
        res.status(201).json(rent);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error creating rent record' });
    }
};
exports.createRoomRent = createRoomRent;
const payRoomRent = async (req, res) => {
    const { id } = req.params;
    const { paidDate } = req.body;
    try {
        const rent = await RoomRent_1.RoomRent.findById(id);
        if (!rent) {
            res.status(404).json({ message: 'Rent record not found' });
            return;
        }
        rent.isPaid = true;
        rent.paidDate = paidDate || new Date().toISOString().split('T')[0];
        await rent.save();
        res.status(200).json(rent);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error updating rent' });
    }
};
exports.payRoomRent = payRoomRent;
// --- ROOM UTILITY BILLS ENDPOINTS ---
const getRoomBills = async (req, res) => {
    try {
        const query = req.user?.role === 'admin' ? {} : { createdBy: req.user?.id };
        const bills = await RoomBill_1.RoomBill.find(query).sort({ month: -1 });
        res.status(200).json(bills);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error loading bills' });
    }
};
exports.getRoomBills = getRoomBills;
const createRoomBill = async (req, res) => {
    const { month, type, amount, units, dueDate } = req.body;
    try {
        const bill = new RoomBill_1.RoomBill({
            month,
            type,
            amount: Number(amount),
            units: units ? Number(units) : undefined,
            isPaid: false,
            dueDate,
            createdBy: req.user?.id,
        });
        await bill.save();
        res.status(201).json(bill);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error creating bill' });
    }
};
exports.createRoomBill = createRoomBill;
const payRoomBill = async (req, res) => {
    const { id } = req.params;
    try {
        const bill = await RoomBill_1.RoomBill.findById(id);
        if (!bill) {
            res.status(404).json({ message: 'Bill record not found' });
            return;
        }
        bill.isPaid = true;
        await bill.save();
        res.status(200).json(bill);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error updating bill payment' });
    }
};
exports.payRoomBill = payRoomBill;
// --- ROOM PURCHASES ENDPOINTS ---
const getRoomPurchases = async (req, res) => {
    try {
        const query = req.user?.role === 'admin' ? {} : { createdBy: req.user?.id };
        const purchases = await RoomPurchase_1.RoomPurchase.find(query).sort({ date: -1 });
        res.status(200).json(purchases);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error loading room purchases' });
    }
};
exports.getRoomPurchases = getRoomPurchases;
const createRoomPurchase = async (req, res) => {
    const { name, price, quantity, shop, date, warrantyMonths, category } = req.body;
    try {
        const billImage = req.file ? `/uploads/${req.file.filename}` : undefined;
        const purchase = new RoomPurchase_1.RoomPurchase({
            name,
            price: Number(price),
            quantity: Number(quantity),
            shop,
            date,
            warrantyMonths: warrantyMonths ? Number(warrantyMonths) : 0,
            billImage,
            category,
            createdBy: req.user?.id,
        });
        await purchase.save();
        res.status(201).json(purchase);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error saving room purchase' });
    }
};
exports.createRoomPurchase = createRoomPurchase;
// --- ROOM INVENTORY ENDPOINTS ---
const getRoomInventory = async (req, res) => {
    try {
        const query = req.user?.role === 'admin' ? {} : { createdBy: req.user?.id };
        const inventory = await RoomInventory_1.RoomInventory.find(query);
        res.status(200).json(inventory);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error loading inventory' });
    }
};
exports.getRoomInventory = getRoomInventory;
const createRoomInventoryItem = async (req, res) => {
    const { item, customName, quantity, status } = req.body;
    try {
        const inv = new RoomInventory_1.RoomInventory({
            item,
            customName,
            quantity: Number(quantity),
            status: status || 'working',
            lastChecked: new Date().toISOString().split('T')[0],
            createdBy: req.user?.id,
        });
        await inv.save();
        res.status(201).json(inv);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error adding inventory item' });
    }
};
exports.createRoomInventoryItem = createRoomInventoryItem;
const updateRoomInventoryItem = async (req, res) => {
    const { id } = req.params;
    const { status, quantity } = req.body;
    try {
        const item = await RoomInventory_1.RoomInventory.findById(id);
        if (!item) {
            res.status(404).json({ message: 'Inventory item not found' });
            return;
        }
        if (status)
            item.status = status;
        if (quantity)
            item.quantity = Number(quantity);
        item.lastChecked = new Date().toISOString().split('T')[0];
        await item.save();
        res.status(200).json(item);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error updating inventory' });
    }
};
exports.updateRoomInventoryItem = updateRoomInventoryItem;
const deleteRoomInventoryItem = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await RoomInventory_1.RoomInventory.findByIdAndDelete(id);
        if (!item) {
            res.status(404).json({ message: 'Inventory item not found' });
            return;
        }
        res.status(200).json({ success: true, id });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting inventory item' });
    }
};
exports.deleteRoomInventoryItem = deleteRoomInventoryItem;
