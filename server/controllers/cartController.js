// server/controllers/cartController.js

const Cart = require("../models/Cart");
const Crop = require("../models/Crop");

// ✅ UPDATED: GET /api/cart
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        // ✅ Populate crop details including quantity
        await cart.populate({
            path: 'items.itemId',
            select: 'cropName pricePerUnit unit quantity', // ✅ Include quantity
            model: 'Crop',
        });

        const cartItems = cart.items.map((item) => ({
            _id: item._id,
            itemId: item.itemId?._id?.toString(),
            name: item.itemId?.cropName || item.name,
            quantity: item.quantity,
            price: item.itemId?.pricePerUnit || item.price,
            unit: item.itemId?.unit || item.unit,
            image: item.image,
            availableQuantity: item.itemId?.quantity || 0, // ✅ Add available quantity
        }));

        return res.status(200).json({
            success: true,
            cart: cartItems,
        });
    } catch (error) {
        console.error("Get cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};


// ✅ ADD TO CART - With quantity validation
exports.addToCart = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid items data",
            });
        }

        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        for (const input of items) {
            const crop = await Crop.findById(input.itemId).select(
                "cropName pricePerUnit unit quantity"
            );

            if (!crop) {
                return res.status(404).json({
                    success: false,
                    message: "Crop not found",
                });
            }

            // ✅ CHECK AVAILABLE QUANTITY
            if (input.quantity > crop.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${crop.quantity} ${crop.unit} available for ${crop.cropName}`,
                });
            }

            const existingIndex = cart.items.findIndex(
                (item) => item.itemId?.toString() === input.itemId
            );

            if (existingIndex > -1) {
                // ✅ CHECK TOTAL QUANTITY
                const newQuantity = cart.items[existingIndex].quantity + input.quantity;
                
                if (newQuantity > crop.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot add more. Only ${crop.quantity} ${crop.unit} available`,
                    });
                }

                cart.items[existingIndex].quantity = newQuantity;
            } else {
                cart.items.push({
                    itemId: crop._id,
                    name: crop.cropName,
                    quantity: input.quantity,
                    price: crop.pricePerUnit,
                    unit: crop.unit,
                });
            }
        }

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Items added to cart",
            cart: cart.items,
        });
    } catch (error) {
        console.error("Add to cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
// ✅ PUT /api/cart/update - Update cart quantity with STRICT stock validation
exports.updateCartQuantity = async (req, res) => {
    try {
        const { itemId, quantity } = req.body;

        // Validate input
        if (!itemId || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1",
            });
        }

        // Find user's cart
        const userId = req.user.id || req.user._id;
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found",
            });
        }

        // ✅ CRITICAL: Check crop available quantity
        const crop = await Crop.findById(itemId).select('cropName pricePerUnit unit quantity');

        if (!crop) {
            return res.status(404).json({
                success: false,
                message: "Crop not found",
            });
        }

        // ✅ STRICT VALIDATION: Prevent exceeding available stock
        if (quantity > crop.quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${crop.quantity} ${crop.unit} available in stock`,
                availableQuantity: crop.quantity,
            });
        }

        // Find item in cart
        const itemIndex = cart.items.findIndex(
            (item) => item.itemId?.toString() === itemId.toString()
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart",
            });
        }

        // Update quantity (enforce minimum 1, maximum available)
        cart.items[itemIndex].quantity = Math.min(crop.quantity, Math.max(1, Number(quantity)));
        await cart.save();

        // Populate crop details for response
        await cart.populate({
            path: 'items.itemId',
            select: 'cropName pricePerUnit unit quantity',
            model: 'Crop',
        });

        // Return updated cart with available quantities
        const cartItems = cart.items.map((item) => ({
            _id: item._id,
            itemId: item.itemId?._id?.toString(),
            name: item.itemId?.cropName || item.name,
            quantity: item.quantity,
            price: item.itemId?.pricePerUnit || item.price,
            unit: item.itemId?.unit || item.unit,
            image: item.image,
            availableQuantity: item.itemId?.quantity || 0,
        }));

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart: cartItems,
        });
    } catch (error) {
        console.error("Update cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
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
