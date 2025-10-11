const express = require("express");
const router = express.Router();
const {
	getAllProducts,
	getProductById,
	createProduct,
} = require("../controllers/productController");
const { protect } = require("../middlewares/authMiddleware");

router.route("/").get(getAllProducts).post(protect, createProduct);

router.get("/:id", getProductById);

module.exports = router;
