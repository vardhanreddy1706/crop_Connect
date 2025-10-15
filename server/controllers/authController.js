// authController.js

const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const NotificationService = require("../services/notificationService");

// @desc Register user
// @route POST /api/auth/register
// @access Public
exports.register = async (req, res) => {
	console.log("REGISTER ENDPOINT HIT:", req.body);

	try {
		// Extract all possible fields from req.body
		const {
			name,
			email,
			password,
			phone,
			role,
			address,
			age,
			gender,
			soilType,
			noOfAcres,
			farmingExperience,
			transportVehicle,
			businessExperience,
			companyName,
			workerExperience,
			aadhaarNumber,
			drivingExperience,
			tractorRegistrationNumber,
			ownerAadhaarNumber,
			licenseFile,
			vehicleType,
		} = req.body;

		// Basic validation for required fields
		if (!name || !email || !password || !phone || !role || !address) {
			return res.status(400).json({
				success: false,
				message: "Please provide all required fields",
			});
		}

		// Check if user already exists
		const userExists = await User.findOne({ email });
		if (userExists) {
			return res.status(400).json({
				success: false,
				message: "User already exists with this email",
			});
		}

		// Create user with all fields
		const user = await User.create({
			name,
			email,
			password,
			phone,
			role,
			address,
			age,
			gender,
			soilType,
			noOfAcres,
			farmingExperience,
			transportVehicle,
			businessExperience,
			companyName,
			workerExperience,
			aadhaarNumber,
			drivingExperience,
			tractorRegistrationNumber,
			ownerAadhaarNumber,
			licenseFile,
			vehicleType,
		});

		// Respond with user info and token
		if (user) {
			const token = generateToken(user._id);

			// Send registration email notification (non-blocking) with emailTransporter
			NotificationService.notifyRegistration(user, req.emailTransporter).catch(
				(err) => console.error("Registration notification error:", err)
			);

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
					age: user.age,
					gender: user.gender,
					soilType: user.soilType,
					noOfAcres: user.noOfAcres,
					farmingExperience: user.farmingExperience,
					transportVehicle: user.transportVehicle,
					businessExperience: user.businessExperience,
					companyName: user.companyName,
					workerExperience: user.workerExperience,
					aadhaarNumber: user.aadhaarNumber,
					drivingExperience: user.drivingExperience,
					tractorRegistrationNumber: user.tractorRegistrationNumber,
					ownerAadhaarNumber: user.ownerAadhaarNumber,
					licenseFile: user.licenseFile,
					vehicleType: user.vehicleType,
				},
				token,
			});
		}
	} catch (error) {
		console.error("Registration error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Server error during registration",
		});
	}
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
exports.login = async (req, res) => {
	try {
		console.log("Login attempt:", { email: req.body.email });

		const { email, password } = req.body;

		// Validation
		if (!email || !password) {
			console.log("Missing email or password");
			return res.status(400).json({
				success: false,
				message: "Please provide email and password",
			});
		}

		// Declare 'user' FIRST before using it
		const user = await User.findOne({ email }).select("+password");

		if (!user) {
			console.log("User not found:", email);
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		// Check password
		const isMatch = await user.matchPassword(password);

		if (!isMatch) {
			console.log("Invalid password for:", email);
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		console.log("Login successful:", user.email);

		const token = generateToken(user._id);

		// Send login notification AFTER user is declared (non-blocking) with emailTransporter
		NotificationService.notifySuccessfulLogin(user, req.emailTransporter).catch(
			(err) => console.error("Login notification error:", err)
		);

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
			token,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Server error during login",
		});
	}
};

// @desc Get current user
// @route GET /api/auth/me
// @access Private
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

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
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
