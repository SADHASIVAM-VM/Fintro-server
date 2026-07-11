"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protect all endpoints under user routes router
router.use(auth_1.authenticate);
router.get('/', userController_1.getUsers);
router.get('/:id', userController_1.getUserById);
router.post('/', (0, auth_1.authorize)(['admin']), userController_1.createUser);
router.patch('/:id', userController_1.updateUser);
router.delete('/:id', (0, auth_1.authorize)(['admin']), userController_1.deleteUser);
exports.default = router;
