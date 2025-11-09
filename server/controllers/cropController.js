// const mongoose = require("mongoose");
// const Crop = require("../models/Crop");
// const Order = require("../models/Order");

// // @desc    Create new crop listing
// // @route   POST /api/crops
// // @access  Private (Farmer only)
// exports.createCrop = async (req, res) => {
// 	try {
// 		const crop = await Crop.create({
// 			...req.body,
// 			seller: req.user._id,
// 		});

// 		res.status(201).json({
// 			success: true,
// 			message: "Crop listed successfully",
// 			crop,
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };

// // @desc    Get all crops
// // @route   GET /api/crops
// // @access  Public
// exports.getAllCrops = async (req, res) => {
// 	try {
// 		const { status, cropName, minPrice, maxPrice, location } = req.query;

// 		let query = {};

// 		if (status) query.status = status;
// 		if (cropName) query.cropName = new RegExp(cropName, "i");
// 		if (minPrice || maxPrice) {
// 			query.pricePerUnit = {};
// 			if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
// 			if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
// 		}
// 		if (location) query["location.district"] = new RegExp(location, "i");

// 		const crops = await Crop.find(query)
// 			.populate("seller", "name phone email")
// 			.sort({ createdAt: -1 });

// 		res.status(200).json({
// 			success: true,
// 			count: crops.length,
// 			crops,
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };

// // @desc    Get single crop
// // @route   GET /api/crops/:id
// // @access  Public
// exports.getCropById = async (req, res) => {
// 	try {
// 		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "Invalid crop ID format",
// 			});
// 		}

// 		const crop = await Crop.findById(req.params.id).populate(
// 			"seller",
// 			"name phone email address"
// 		);

// 		if (!crop) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "Crop not found",
// 			});
// 		}

// 		res.status(200).json({
// 			success: true,
// 			crop,
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };

// // @desc    Update crop
// // @route   PUT /api/crops/:id
// // @access  Private (Farmer - own crops only)
// exports.updateCrop = async (req, res) => {
// 	try {
// 		let crop = await Crop.findById(req.params.id);

// 		if (!crop) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "Crop not found",
// 			});
// 		}

// 		// Check ownership
// 		if (crop.seller.toString() !== req.user._id.toString()) {
// 			return res.status(403).json({
// 				success: false,
// 				message: "Not authorized to update this crop",
// 			});
// 		}

// 		crop = await Crop.findByIdAndUpdate(req.params.id, req.body, {
// 			new: true,
// 			runValidators: true,
// 		});

// 		res.status(200).json({
// 			success: true,
// 			message: "Crop updated successfully",
// 			crop,
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };

// // @desc    Delete crop
// // @route   DELETE /api/crops/:id
// // @access  Private (Farmer - own crops only)
// exports.deleteCrop = async (req, res) => {
// 	try {
// 		const crop = await Crop.findById(req.params.id);

// 		if (!crop) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "Crop not found",
// 			});
// 		}

// 		// Check ownership
// 		if (crop.seller.toString() !== req.user._id.toString()) {
// 			return res.status(403).json({
// 				success: false,
// 				message: "Not authorized to delete this crop",
// 			});
// 		}

// 		await crop.deleteOne();

// 		res.status(200).json({
// 			success: true,
// 			message: "Crop deleted successfully",
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };

// // @desc    Get my crops
// // @route   GET /api/crops/my-crops
// // @access  Private (Farmer)
// exports.getMyCrops = async (req, res) => {
// 	try {
// 		const crops = await Crop.find({ seller: req.user._id }).sort({ createdAt: -1 });

// 		if (!crops.length) {
// 			return res.status(200).json({ success: true, count: 0, crops: [] });
// 		}

// 		// Build map of sold quantities per crop from orders (exclude cancelled)
// 		const cropIds = crops.map((c) => c._id);
// 		const soldAgg = await Order.aggregate([
// 			{ $match: { seller: req.user._id, status: { $ne: "cancelled" } } },
// 			{ $unwind: "$items" },
// 			{ $match: { "items.crop": { $in: cropIds } } },
// 			{ $group: { _id: "$items.crop", soldQuantity: { $sum: "$items.quantity" } } },
// 		]);
// 		const soldMap = new Map(soldAgg.map((d) => [String(d._id), d.soldQuantity]));

// 		const enriched = crops.map((c) => {
// 			const soldQuantity = soldMap.get(String(c._id)) || 0;
// 			const remainingQuantity = c.quantity;
// 			const initialQuantity = remainingQuantity + soldQuantity;
// 			return {
// 				...c.toObject(),
// 				soldQuantity,
// 				initialQuantity,
// 				remainingQuantity,
// 			};
// 		});

// 		res.status(200).json({
// 			success: true,
// 			count: enriched.length,
// 			crops: enriched,
// 		});
// 	} catch (error) {
// 		res.status(500).json({ success: false, message: error.message });
// 	}
// };

// controllers/cropController.js

const mongoose = require("mongoose");
const Crop = require("../models/Crop");
const Order = require("../models/Order");
const imagekit = require("../config/imagekit");

/* -------------------------- ImageKit helpers -------------------------- */
function stripDataUrlPrefix(str = "") {
  const i = str.indexOf("base64,");
  return i !== -1 ? str.slice(i + 7) : str;
}
function safeFileName(name = "crop.jpg") {
  const stamp = Date.now();
  const clean = String(name).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
  return `${stamp}_${clean || "crop.jpg"}`;
}
async function uploadOne(base64OrUrl, idx = 0) {
  // Allow already-hosted URLs to pass through
  if (/^https?:\/\//i.test(base64OrUrl)) {
    return { url: base64OrUrl, fileId: null, name: `external_${idx}` };
  }
  const file = stripDataUrlPrefix(base64OrUrl);
  const res = await imagekit.upload({
    file, // base64 without the data URL prefix
    fileName: safeFileName(`crop_${idx}.jpg`),
    folder: "/crops",
    useUniqueFileName: true,
  });
  return { url: res.url, fileId: res.fileId, name: res.name };
}
async function deleteFromImageKit(fileId) {
  if (!fileId) return;
  try {
    await imagekit.deleteFile(fileId);
  } catch (e) {
    // Don't crash the request on delete failures; just log.
    console.warn("ImageKit delete failed:", e?.message || e);
  }
}
/* --------------------------------------------------------------------- */

// @desc    Create new crop listing
// @route   POST /api/crops
// @access  Private (Farmer only)
exports.createCrop = async (req, res) => {
  try {
    const {
      cropName, variety, quantity, unit, pricePerUnit,
      state, district, location, description,
      images = [], // array of base64/dataURL/https URLs
    } = req.body;

    // basic validation
    for (const f of ["cropName","variety","quantity","unit","pricePerUnit","state","district","location"]) {
      if (!req.body[f]) {
        return res.status(400).json({ success:false, message:`${f} is required` });
      }
    }
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success:false, message:"At least one image is required" });
    }
    if (images.length > 5) {
      return res.status(400).json({ success:false, message:"Maximum 5 images allowed" });
    }

    // upload to ImageKit
    const uploaded = [];
    for (let i = 0; i < images.length; i++) {
      uploaded.push(await uploadOne(images[i], i));
    }

    const crop = await Crop.create({
      cropName, variety, quantity, unit, pricePerUnit,
      state, district, location, description,
      images: uploaded,                 // <- hosted images
      seller: req.user._id,             // <- authenticated farmer
      farmer: req.user._id,             // optional: if you also store farmer separately
    });

    return res.status(201).json({
      success: true,
      message: "Crop listed successfully",
      crop,
    });
  } catch (error) {
    console.error("createCrop error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all crops
// @route   GET /api/crops
// @access  Public
exports.getAllCrops = async (req, res) => {
  try {
    const { status, cropName, minPrice, maxPrice, location, state, district } = req.query;

    const query = {};
    if (status) query.status = status;
    if (cropName) query.cropName = new RegExp(cropName, "i");
    if (state) query.state = new RegExp(state, "i");
    if (district) query.district = new RegExp(district, "i");
    if (location) query.location = new RegExp(location, "i"); // your schema uses a flat "location" string

    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
    }

    const crops = await Crop.find(query)
      .populate("seller", "name phone email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: crops.length,
      crops,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single crop
// @route   GET /api/crops/:id
// @access  Public
exports.getCropById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid crop ID format" });
    }

    const crop = await Crop.findById(req.params.id)
      .populate("seller", "name phone email address");

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    return res.status(200).json({ success: true, crop });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update crop
// @route   PUT /api/crops/:id
// @access  Private (Farmer - own crops only)
//
// Body options for images:
// - imagesReplace: [base64/url,...]     // replaces ALL existing images with these
// - imagesAdd:     [base64/url,...]     // appends images
// - imagesRemoveFileIds: [fileId,...]   // removes specific images (and deletes from IK)
exports.updateCrop = async (req, res) => {
  try {
    let crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }
    if (crop.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this crop" });
    }

    const {
      imagesReplace,
      imagesAdd,
      imagesRemoveFileIds,
      ...fields
    } = req.body;

    // Update simple fields
    Object.assign(crop, fields);

    // Handle image removals
    if (Array.isArray(imagesRemoveFileIds) && imagesRemoveFileIds.length) {
      const keep = [];
      for (const img of crop.images) {
        if (img.fileId && imagesRemoveFileIds.includes(img.fileId)) {
          await deleteFromImageKit(img.fileId);
        } else {
          keep.push(img);
        }
      }
      crop.images = keep;
    }

    // Handle full replace
    if (Array.isArray(imagesReplace)) {
      // delete old files (only those with fileId)
      for (const img of crop.images) {
        if (img.fileId) await deleteFromImageKit(img.fileId);
      }
      const uploaded = [];
      for (let i = 0; i < imagesReplace.length; i++) {
        uploaded.push(await uploadOne(imagesReplace[i], i));
      }
      crop.images = uploaded;
    }

    // Handle append
    if (Array.isArray(imagesAdd) && imagesAdd.length) {
      for (let i = 0; i < imagesAdd.length; i++) {
        crop.images.push(await uploadOne(imagesAdd[i], i + (crop.images?.length || 0)));
      }
    }

    // Enforce max 5 images
    if (crop.images.length > 5) {
      return res.status(400).json({ success:false, message:"Maximum 5 images allowed" });
    }

    crop = await crop.save();

    return res.status(200).json({
      success: true,
      message: "Crop updated successfully",
      crop,
    });
  } catch (error) {
    console.error("updateCrop error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete crop
// @route   DELETE /api/crops/:id
// @access  Private (Farmer - own crops only)
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }
    if (crop.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this crop" });
    }

    // delete images from ImageKit (best-effort)
    for (const img of crop.images || []) {
      if (img.fileId) await deleteFromImageKit(img.fileId);
    }

    await crop.deleteOne();

    return res.status(200).json({ success: true, message: "Crop deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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

    return res.status(200).json({ success: true, count: enriched.length, crops: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};