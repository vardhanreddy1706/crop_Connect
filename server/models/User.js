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
			village: String,
			district: String,
			state: String,
			pincode: String,
		},
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
		next();
	}
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
