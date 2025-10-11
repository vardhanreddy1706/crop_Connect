const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Please provide your name"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Please provide your email"],
			match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
		},
		phone: {
			type: String,
			match: [/^[0-9]{10}$/, "Please provide a valid phone number"],
		},
		subject: {
			type: String,
			required: [true, "Please provide a subject"],
			trim: true,
		},
		message: {
			type: String,
			required: [true, "Please provide a message"],
			maxlength: 1000,
		},
		status: {
			type: String,
			enum: ["new", "in_progress", "resolved"],
			default: "new",
		},
		response: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Contact", contactSchema);
