// server/controllers/cartController.js

const Cart = require("../models/Cart");
const Crop = require("../models/Crop");

// GET /api/cart
exports.getCart = async (req, res) => {
	try {
		let cart = await Cart.findOne({ user: req.user._id });
		if (!cart) {
			cart = await Cart.create({ user: req.user._id, items: [] });
		}
		const cartItems = cart.items.map((item) => ({
			_id: item._id,
			itemId: item.itemId?.toString(),
			name: item.name,
			quantity: item.quantity,
			price: item.price,
			unit: item.unit,
			image: item.image,
		}));
		return res.status(200).json({ success: true, cart: cartItems });
	} catch (error) {
		console.error("Get cart error:", error);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
};

// POST /api/cart/add
exports.addToCart = async (req, res) => {
	try {
		const { items } = req.body;
		if (!items || !Array.isArray(items) || items.length === 0) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid items data" });
		}

		let cart = await Cart.findOne({ user: req.user._id });
		if (!cart) {
			cart = await Cart.create({ user: req.user._id, items: [] });
		}

		// Normalize each item based on the Crop record
		for (const input of items) {
			const crop = await Crop.findById(input.itemId).select(
				"cropName pricePerUnit unit image"
			);
			if (!crop) continue;

			const idx = cart.items.findIndex(
				(i) => i.itemId?.toString() === crop._id.toString()
			);
			if (idx > -1) {
				cart.items[idx].quantity += Math.max(1, Number(input.quantity) || 1);
			} else {
				cart.items.push({
					itemId: crop._id,
					name: crop.cropName,
					quantity: Math.max(1, Number(input.quantity) || 1),
					price: crop.pricePerUnit,
					unit: crop.unit || "quintal",
					image: crop.image,
				});
			}
		}

		await cart.save();

		const cartItems = cart.items.map((item) => ({
			_id: item._id,
			itemId: item.itemId?.toString(),
			name: item.name,
			quantity: item.quantity,
			price: item.price,
			unit: item.unit,
			image: item.image,
		}));

		return res
			.status(200)
			.json({ success: true, message: "Item added to cart", cart: cartItems });
	} catch (error) {
		console.error("Add to cart error:", error);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
};

// PUT /api/cart/update
exports.updateCartQuantity = async (req, res) => {
	try {
		const { itemId, quantity } = req.body;
		if (!itemId || Number(quantity) < 1) {
			return res
				.status(400)
				.json({ success: false, message: "Quantity must be at least 1" });
		}

		const cart = await Cart.findOne({ user: req.user._id });
		if (!cart)
			return res
				.status(404)
				.json({ success: false, message: "Cart not found" });

		const idx = cart.items.findIndex(
			(i) => i.itemId?.toString() === itemId.toString()
		);
		if (idx === -1)
			return res
				.status(404)
				.json({ success: false, message: "Item not found in cart" });

		cart.items[idx].quantity = Math.max(1, Number(quantity));
		await cart.save();

		const cartItems = cart.items.map((item) => ({
			_id: item._id,
			itemId: item.itemId?.toString(),
			name: item.name,
			quantity: item.quantity,
			price: item.price,
			unit: item.unit,
			image: item.image,
		}));

		return res
			.status(200)
			.json({ success: true, message: "Cart updated", cart: cartItems });
	} catch (error) {
		console.error("Update cart error:", error);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
};

// DELETE /api/cart/remove/:itemId
exports.removeFromCart = async (req, res) => {
	try {
		const { itemId } = req.params;
		const cart = await Cart.findOne({ user: req.user._id });
		if (!cart)
			return res
				.status(404)
				.json({ success: false, message: "Cart not found" });

		cart.items = cart.items.filter(
			(i) => i.itemId?.toString() !== itemId.toString()
		);
		await cart.save();

		const cartItems = cart.items.map((item) => ({
			_id: item._id,
			itemId: item.itemId?.toString(),
			name: item.name,
			quantity: item.quantity,
			price: item.price,
			unit: item.unit,
			image: item.image,
		}));

		return res
			.status(200)
			.json({
				success: true,
				message: "Item removed from cart",
				cart: cartItems,
			});
	} catch (error) {
		console.error("Remove from cart error:", error);
		return res.status(500).json({ success: false, message: "Server Error" });
	}
};
