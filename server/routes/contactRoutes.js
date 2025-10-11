const express = require("express");
const router = express.Router();
const {
	submitContact,
	getAllContacts,
} = require("../controllers/contactController");
const { protect } = require("../middlewares/authMiddleware");

router.route("/").get(protect, getAllContacts).post(submitContact);

module.exports = router;
