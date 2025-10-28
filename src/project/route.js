const router = require("express").Router();
const controller = require("./controller");
const verifyToken = require("../../middleware/verifyToken");
const verifyRole = require("../../middleware/verifyRole");

router.post("/register", verifyToken, controller.addProject);

exports = router;