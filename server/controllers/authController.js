const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
	try {
		const { name, email, password, phone, role, address } = req.body;

		// Check if user exists
		const userExists = await User.findOne({ email });

		if (userExists) {
			return res.status(400).json({
				success: false,
				message: "User already exists with this email",
			});
		}

		// Create user
		const user = await User.create({
			name,
			email,
			password,
			phone,
			role,
			address,
		});

		if (user) {
			res.status(201).json({
				success: true,
				message: "User registered successfully",
				user: {
					_id: user._id,
					name: user.name,
					email: user.email,
					phone: user.phone,
					role: user.role,
					address: user.address,
				},
				token: generateToken(user._id),
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message || "Server error during registration",
		});
	}
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Check for user
		const user = await User.findOne({ email }).select("+password");

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		// Check password
		const isMatch = await user.matchPassword(password);

		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		res.status(200).json({
			success: true,
			message: "Login successful",
			user: {
				_id: user._id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				role: user.role,
				address: user.address,
			},
			token: generateToken(user._id),
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message || "Server error during login",
		});
	}
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);

		res.status(200).json({
			success: true,
			user,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);

		if (user) {
			user.name = req.body.name || user.name;
			user.email = req.body.email || user.email;
			user.phone = req.body.phone || user.phone;
			user.address = req.body.address || user.address;

			if (req.body.password) {
				user.password = req.body.password;
			}

			const updatedUser = await user.save();

			res.status(200).json({
				success: true,
				message: "Profile updated successfully",
				user: {
					_id: updatedUser._id,
					name: updatedUser.name,
					email: updatedUser.email,
					phone: updatedUser.phone,
					role: updatedUser.role,
					address: updatedUser.address,
				},
				token: generateToken(updatedUser._id),
			});
		} else {
			res.status(404).json({
				success: false,
				message: "User not found",
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
