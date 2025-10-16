const express = require('express')
const router = express.Router()
const controller = require('./controller')
const verifyToken = require('../../middleware/verifyToken')

router.post('/register',controller.registerUser)
router.post('/edit',verifyToken,controller.editUser)
router.post('/delete',verifyToken,controller.deleteUser)

module.exports = router