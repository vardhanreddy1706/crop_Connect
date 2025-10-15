// server/routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
	getCart,
	addToCart,
	updateCartQuantity,
	removeFromCart,
} = require("../controllers/cartController");

router.use(protect);
router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCartQuantity);
router.delete("/remove/:itemId", removeFromCart);

module.exports = router;
