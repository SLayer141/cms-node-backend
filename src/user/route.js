const express = require("express");
const router = express.Router();
const controller = require("./controller");
const verifyToken = require("../../middleware/verifyToken");
const verifyRole = require("../../middleware/verifyRole");

router.post("/register", verifyToken, controller.registerUser);
router.post("/edit", verifyRole(["ADMIN"]), verifyToken, controller.editUser);
router.post("/delete", verifyToken, controller.deleteUser);
router.get("/view/:id", verifyToken, controller.viewUser);
router.get("/list", verifyToken, verifyRole(["ADMIN"]), controller.listUser);

module.exports = router;
