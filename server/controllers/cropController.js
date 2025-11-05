const mongoose = require("mongoose");
const Crop = require("../models/Crop");
const Order = require("../models/Order");

// @desc    Create new crop listing
// @route   POST /api/crops
// @access  Private (Farmer only)
exports.createCrop = async (req, res) => {
	try {
		const crop = await Crop.create({
			...req.body,
			seller: req.user._id,
		});

		res.status(201).json({
			success: true,
			message: "Crop listed successfully",
			crop,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get all crops
// @route   GET /api/crops
// @access  Public
exports.getAllCrops = async (req, res) => {
	try {
		const { status, cropName, minPrice, maxPrice, location } = req.query;

		let query = {};

		if (status) query.status = status;
		if (cropName) query.cropName = new RegExp(cropName, "i");
		if (minPrice || maxPrice) {
			query.pricePerUnit = {};
			if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
			if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
		}
		if (location) query["location.district"] = new RegExp(location, "i");

		const crops = await Crop.find(query)
			.populate("seller", "name phone email")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: crops.length,
			crops,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get single crop
// @route   GET /api/crops/:id
// @access  Public
exports.getCropById = async (req, res) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid crop ID format",
			});
		}

		const crop = await Crop.findById(req.params.id).populate(
			"seller",
			"name phone email address"
		);

		if (!crop) {
			return res.status(404).json({
				success: false,
				message: "Crop not found",
			});
		}

		res.status(200).json({
			success: true,
			crop,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Update crop
// @route   PUT /api/crops/:id
// @access  Private (Farmer - own crops only)
exports.updateCrop = async (req, res) => {
	try {
		let crop = await Crop.findById(req.params.id);

		if (!crop) {
			return res.status(404).json({
				success: false,
				message: "Crop not found",
			});
		}

		// Check ownership
		if (crop.seller.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this crop",
			});
		}

		crop = await Crop.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		res.status(200).json({
			success: true,
			message: "Crop updated successfully",
			crop,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Delete crop
// @route   DELETE /api/crops/:id
// @access  Private (Farmer - own crops only)
exports.deleteCrop = async (req, res) => {
	try {
		const crop = await Crop.findById(req.params.id);

		if (!crop) {
			return res.status(404).json({
				success: false,
				message: "Crop not found",
			});
		}

		// Check ownership
		if (crop.seller.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this crop",
			});
		}

		await crop.deleteOne();

		res.status(200).json({
			success: true,
			message: "Crop deleted successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get my crops
// @route   GET /api/crops/my-crops
// @access  Private (Farmer)
exports.getMyCrops = async (req, res) => {
	try {
		const crops = await Crop.find({ seller: req.user._id }).sort({ createdAt: -1 });

		if (!crops.length) {
			return res.status(200).json({ success: true, count: 0, crops: [] });
		}

		// Build map of sold quantities per crop from orders (exclude cancelled)
		const cropIds = crops.map((c) => c._id);
		const soldAgg = await Order.aggregate([
			{ $match: { seller: req.user._id, status: { $ne: "cancelled" } } },
			{ $unwind: "$items" },
			{ $match: { "items.crop": { $in: cropIds } } },
			{ $group: { _id: "$items.crop", soldQuantity: { $sum: "$items.quantity" } } },
		]);
		const soldMap = new Map(soldAgg.map((d) => [String(d._id), d.soldQuantity]));

		const enriched = crops.map((c) => {
			const soldQuantity = soldMap.get(String(c._id)) || 0;
			const remainingQuantity = c.quantity;
			const initialQuantity = remainingQuantity + soldQuantity;
			return {
				...c.toObject(),
				soldQuantity,
				initialQuantity,
				remainingQuantity,
			};
		});

		res.status(200).json({
			success: true,
			count: enriched.length,
			crops: enriched,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
