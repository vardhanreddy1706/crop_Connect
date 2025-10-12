const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Please provide a name"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Please provide an email"],
			unique: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
		},
		password: {
			type: String,
			required: [true, "Please provide a password"],
			minlength: 6,
			select: false,
		},
		phone: {
			type: String,
			required: [true, "Please provide a phone number"],
			match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
		},
		role: {
			type: String,
			enum: ["farmer", "buyer", "tractor_owner", "worker"],
			required: [true, "Please specify user role"],
		},
		address: {
			village: { type: String },
			district: { type: String },
			state: { type: String },
			pincode: { type: String },
		},
		// Common extra fields
		age: { type: Number },
		gender: { type: String, enum: ["male", "female", "other"] },

		// Farmer-specific
		soilType: { type: String },
		noOfAcres: { type: Number },
		farmingExperience: { type: Number },

		// Buyer-specific
		transportVehicle: { type: String },
		businessExperience: { type: Number },
		companyName: { type: String },

		// Worker-specific
		workerExperience: { type: Number },
		aadhaarNumber: { type: String },

		// Tractor owner-specific
		drivingExperience: { type: Number },
		tractorRegistrationNumber: { type: String },
		ownerAadhaarNumber: { type: String },
		licenseFile: { type: String }, // Store file path or URL
		vehicleType: { type: String },

		isVerified: {
			type: Boolean,
			default: false,
		},
		profileImage: {
			type: String,
			default: "",
		},
	},
	{
		timestamps: true,
	}
);

// Hash password before saving
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
