const express = require("express");
const router = express.Router();
const controller = require("./controller");
const verifyToken = require("../../middleware/verifyToken");

router.post("/register", verifyToken, controller.registerUser);
router.post("/edit", verifyToken, controller.editUser);
router.post("/delete", verifyToken, controller.deleteUser);
router.get("/view/:id", verifyToken, controller.viewUser);
router.get("/list", verifyToken, controller.listUser);

module.exports = router;
