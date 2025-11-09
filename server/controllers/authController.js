// // authController.js

// const User = require("../models/User");
// const generateToken = require("../utils/generateToken");
// const NotificationService = require("../services/notificationService");
// const { encryptAadhaar, hashAadhaar, validateAadhaar } = require("../utils/aadhaar");

// // @desc Register user
// // @route POST /api/auth/register
// // @access Public
// exports.register = async (req, res) => {
// 	console.log("REGISTER ENDPOINT HIT:", req.body);

// 	try {
// 		// Extract all possible fields from req.body
// 		const {
// 			name,
// 			email,
// 			password,
// 			phone,
// 			role,
// 			address,
// 			age,
// 			gender,
// 			soilType,
// 			noOfAcres,
// 			farmingExperience,
// 			transportVehicle,
// 			businessExperience,
// 			companyName,
// 			workerExperience,
// 			aadhaarNumber,
// 			drivingExperience,
// 			tractorRegistrationNumber,
// 			ownerAadhaarNumber,
// 			licenseFile,
// 			vehicleType,
// 		} = req.body;

// 		// Basic validation for required fields
// 		if (!name || !email || !password || !phone || !role || !address) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "Please provide all required fields",
// 			});
// 		}

// 		// Check if user already exists
// 		const userExists = await User.findOne({ email });
// 		if (userExists) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "User already exists with this email",
// 			});
// 		}

// 		// Aadhaar handling (only for worker / tractor_owner)
// 		let aadhaarEncrypted, aadhaarHash, aadhaarLast4;
// 		let providedAadhaar = aadhaarNumber || ownerAadhaarNumber;
// 		if ((role === "worker" || role === "tractor_owner") && providedAadhaar) {
// 			if (!validateAadhaar(providedAadhaar)) {
// 				return res.status(400).json({ success: false, message: "Aadhaar must be a 12-digit number" });
// 			}
// 			aadhaarHash = hashAadhaar(providedAadhaar);
// 			const exists = await User.findOne({ aadhaarHash }).lean();
// 			if (exists) {
// 				return res.status(400).json({ success: false, message: "Aadhaar already registered" });
// 			}
// 			aadhaarEncrypted = encryptAadhaar(providedAadhaar);
// 			aadhaarLast4 = String(providedAadhaar).slice(-4);
// 		}

// 		// Create user with all fields (exclude plaintext Aadhaar)
// 		const user = await User.create({
// 			name,
// 			email,
// 			password,
// 			phone,
// 			role,
// 			address,
// 			age,
// 			gender,
// 			soilType,
// 			noOfAcres,
// 			farmingExperience,
// 			transportVehicle,
// 			businessExperience,
// 			companyName,
// 			workerExperience,
// 			drivingExperience,
// 			tractorRegistrationNumber,
// 			licenseFile,
// 			vehicleType,
// 			...(aadhaarEncrypted
// 				? { aadhaarEncrypted, aadhaarHash, aadhaarLast4 }
// 				: {}),
// 		});

// 		// Respond with user info and token
// 		if (user) {
// 			const token = generateToken(user._id);

// 			// Send registration email notification (non-blocking) with emailTransporter
// 			NotificationService.notifyRegistration(user, req.emailTransporter).catch(
// 				(err) => console.error("Registration notification error:", err)
// 			);

// 			res.status(201).json({
// 				success: true,
// 				message: "User registered successfully",
// 				user: {
// 					_id: user._id,
// 					name: user.name,
// 					email: user.email,
// 					phone: user.phone,
// 					role: user.role,
// 					address: user.address,
// 					age: user.age,
// 					gender: user.gender,
// 					soilType: user.soilType,
// 					noOfAcres: user.noOfAcres,
// 					farmingExperience: user.farmingExperience,
// 					transportVehicle: user.transportVehicle,
// 					businessExperience: user.businessExperience,
// 					companyName: user.companyName,
// 					workerExperience: user.workerExperience,
// 					// Do not return Aadhaar; return last 4 digits only if present
// 					aadhaarLast4: user.aadhaarLast4,
// 					drivingExperience: user.drivingExperience,
// 					tractorRegistrationNumber: user.tractorRegistrationNumber,
// 					licenseFile: user.licenseFile,
// 					vehicleType: user.vehicleType,
// 				},
// 				token,
// 			});
// 		}
// 	} catch (error) {
// 		console.error("Registration error:", error);
// 		res.status(500).json({
// 			success: false,
// 			message: error.message || "Server error during registration",
// 		});
// 	}
// };

// // @desc Login user
// // @route POST /api/auth/login
// // @access Public
// exports.login = async (req, res) => {
// 	try {
// 		console.log("Login attempt:", { email: req.body.email });

// 		const { email, password } = req.body;

// 		// Validation
// 		if (!email || !password) {
// 			console.log("Missing email or password");
// 			return res.status(400).json({
// 				success: false,
// 				message: "Please provide email and password",
// 			});
// 		}

// 		// Declare 'user' FIRST before using it
// 		const user = await User.findOne({ email }).select("+password");

// 		if (!user) {
// 			console.log("User not found:", email);
// 			return res.status(401).json({
// 				success: false,
// 				message: "Invalid email or password",
// 			});
// 		}

// 		// Check password
// 		const isMatch = await user.matchPassword(password);

// 		if (!isMatch) {
// 			console.log("Invalid password for:", email);
// 			return res.status(401).json({
// 				success: false,
// 				message: "Invalid email or password",
// 			});
// 		}

// 		console.log("Login successful:", user.email);

// 		const token = generateToken(user._id);

// 		// Send login notification AFTER user is declared (non-blocking) with emailTransporter
// 		NotificationService.notifySuccessfulLogin(user, req.emailTransporter).catch(
// 			(err) => console.error("Login notification error:", err)
// 		);

// 		res.status(200).json({
// 			success: true,
// 			message: "Login successful",
// 			user: {
// 				_id: user._id,
// 				name: user.name,
// 				email: user.email,
// 				phone: user.phone,
// 				role: user.role,
// 				address: user.address,
// 			},
// 			token,
// 		});
// 	} catch (error) {
// 		console.error("Login error:", error);
// 		res.status(500).json({
// 			success: false,
// 			message: error.message || "Server error during login",
// 		});
// 	}
// };

// // @desc Get current user
// // @route GET /api/auth/me
// // @access Private
// exports.getMe = async (req, res) => {
// 	try {
// 		const user = await User.findById(req.user._id);
// 		res.status(200).json({
// 			success: true,
// 			user,
// 		});
// 	} catch (error) {
// 		res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };

// // @desc Update user profile
// // @route PUT /api/auth/profile
// // @access Private
// exports.updateProfile = async (req, res) => {
// 	try {
// 		const user = await User.findById(req.user._id);

// 		if (user) {
// 			user.name = req.body.name || user.name;
// 			user.email = req.body.email || user.email;
// 			user.phone = req.body.phone || user.phone;
// 			user.address = req.body.address || user.address;

// 			// Optional Aadhaar update
// 			const newAadhaar = req.body.aadhaarNumber || req.body.ownerAadhaarNumber;
// 			if (newAadhaar) {
// 				if (!validateAadhaar(newAadhaar)) {
// 					return res.status(400).json({ success: false, message: "Aadhaar must be a 12-digit number" });
// 				}
// 				const h = hashAadhaar(newAadhaar);
// 				const exists = await User.findOne({ aadhaarHash: h, _id: { $ne: user._id } }).lean();
// 				if (exists) {
// 					return res.status(400).json({ success: false, message: "Aadhaar already registered" });
// 				}
// 				user.aadhaarEncrypted = encryptAadhaar(newAadhaar);
// 				user.aadhaarHash = h;
// 				user.aadhaarLast4 = String(newAadhaar).slice(-4);
// 			}

// 			if (req.body.password) {
// 				user.password = req.body.password;
// 			}

// 			const updatedUser = await user.save();

// 			res.status(200).json({
// 				success: true,
// 				message: "Profile updated successfully",
// 				user: {
// 					_id: updatedUser._id,
// 					name: updatedUser.name,
// 					email: updatedUser.email,
// 					phone: updatedUser.phone,
// 					role: updatedUser.role,
// 					address: updatedUser.address,
// 					aadhaarLast4: updatedUser.aadhaarLast4,
// 				},
// 				token: generateToken(updatedUser._id),
// 			});
// 		} else {
// 			res.status(404).json({
// 				success: false,
// 				message: "User not found",
// 			});
// 		}
// 	} catch (error) {
// 		res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };

// authController.js
const crypto = require('crypto');

const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const NotificationService = require("../services/notificationService");
const { encryptAadhaar, hashAadhaar, validateAadhaar } = require("../utils/aadhaar");
const imagekit = require("../config/imagekit");

/** ---------------- ImageKit helpers ---------------- **/

function stripDataUrlPrefix(str = "") {
  // Accept both raw base64 and data URLs like "data:image/png;base64,AAAA..."
  const i = str.indexOf("base64,");
  return i !== -1 ? str.slice(i + 7) : str;
}

function safeFileName(name = "license.png") {
  const stamp = Date.now();
  const clean = String(name)
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
  return `${stamp}_${clean || "license.png"}`;
}

/**
 * Uploads base64 (or data URL) to ImageKit.
 * Returns { url, fileId, name }.
 */
async function uploadLicenseToImageKit(licenseFileBase64, licenseFileName = "license.png") {
  if (!licenseFileBase64) return null;

  // If client already sent a hosted URL (from ImageKit browser upload), just keep it.
  if (/^https?:\/\//i.test(licenseFileBase64)) {
    return { url: licenseFileBase64, fileId: null, name: licenseFileName };
  }

  const file = stripDataUrlPrefix(licenseFileBase64);

  const res = await imagekit.upload({
    file, // base64 (no prefix)
    fileName: safeFileName(licenseFileName),
    folder: "/licenses",     // customize folder if needed
    useUniqueFileName: true,
  });

  return { url: res.url, fileId: res.fileId, name: res.name };
}

/** -------------------------------------------------- **/

// @desc Register user
// @route POST /api/auth/register
// @access Public
exports.register = async (req, res) => {
  console.log("REGISTER ENDPOINT HIT:", req.body?.email);

  try {
    // Extract fields from req.body
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
      vehicleType,

      // NEW: ImageKit inputs
      licenseFileBase64,     // base64 string or data URL OR already-hosted URL
      licenseFileName,       // optional original filename (e.g., "license.png")
    } = req.body;

    // Basic validation
    if (!name || !email || !password || !phone || !role || !address) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Aadhaar handling (only for worker / tractor_owner)
    let aadhaarEncrypted, aadhaarHash, aadhaarLast4;
    let providedAadhaar = aadhaarNumber; // on register you used aadhaarNumber (ownerAadhaarNumber used for tractor owners—add if needed)

    if ((role === "worker" || role === "tractor_owner") && providedAadhaar) {
      if (!validateAadhaar(providedAadhaar)) {
        return res.status(400).json({ success: false, message: "Aadhaar must be a 12-digit number" });
      }
      aadhaarHash = hashAadhaar(providedAadhaar);
      const exists = await User.findOne({ aadhaarHash }).lean();
      if (exists) {
        return res.status(400).json({ success: false, message: "Aadhaar already registered" });
      }
      aadhaarEncrypted = encryptAadhaar(providedAadhaar);
      aadhaarLast4 = String(providedAadhaar).slice(-4);
    }

    // Upload license to ImageKit if present
    let license = null;
    if (licenseFileBase64) {
      license = await uploadLicenseToImageKit(licenseFileBase64, licenseFileName);
    }

    // Create user
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
      drivingExperience,
      tractorRegistrationNumber,
      vehicleType,

      // Store ImageKit results
      licenseFile: license?.url || null,     // keep compatibility if your schema already uses 'licenseFile'
      licenseFileId: license?.fileId || null, // optional—add to schema if you want to support deletion/replacement

      ...(aadhaarEncrypted
        ? { aadhaarEncrypted, aadhaarHash, aadhaarLast4 }
        : {}),
    });

    if (user) {
      const token = generateToken(user._id);

      // non-blocking email notification
      NotificationService
        .notifyRegistration(user, req.emailTransporter)
        .catch(err => console.error("Registration notification error:", err));

      return res.status(201).json({
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
          aadhaarLast4: user.aadhaarLast4,
          drivingExperience: user.drivingExperience,
          tractorRegistrationNumber: user.tractorRegistrationNumber,
          licenseFile: user.licenseFile,       // ImageKit URL
          licenseFileId: user.licenseFileId,   // optional
          vehicleType: user.vehicleType,
        },
        token,
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    NotificationService
      .notifySuccessfulLogin(user, req.emailTransporter)
      .catch(err => console.error("Login notification error:", err));

    return res.status(200).json({
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
    return res.status(500).json({
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
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
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

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Basic fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;

    // Optional Aadhaar update
    const newAadhaar = req.body.aadhaarNumber || req.body.ownerAadhaarNumber;
    if (newAadhaar) {
      if (!validateAadhaar(newAadhaar)) {
        return res.status(400).json({ success: false, message: "Aadhaar must be a 12-digit number" });
      }
      const h = hashAadhaar(newAadhaar);
      const exists = await User.findOne({ aadhaarHash: h, _id: { $ne: user._id } }).lean();
      if (exists) {
        return res.status(400).json({ success: false, message: "Aadhaar already registered" });
      }
      user.aadhaarEncrypted = encryptAadhaar(newAadhaar);
      user.aadhaarHash = h;
      user.aadhaarLast4 = String(newAadhaar).slice(-4);
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    // Handle license replacement (ImageKit)
    const { licenseFileBase64, licenseFileName } = req.body;
    if (licenseFileBase64) {
      // If you want to delete the previous ImageKit file:
      // if (user.licenseFileId) {
      //   try { await imagekit.deleteFile(user.licenseFileId); } catch (e) { console.warn("IK delete failed:", e?.message); }
      // }

      const uploaded = await uploadLicenseToImageKit(licenseFileBase64, licenseFileName);
      user.licenseFile = uploaded?.url || user.licenseFile;       // keep URL in existing 'licenseFile' field
      user.licenseFileId = uploaded?.fileId || user.licenseFileId; // optional: store fileId for later deletion
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        address: updatedUser.address,
        aadhaarLast4: updatedUser.aadhaarLast4,
        licenseFile: updatedUser.licenseFile,       // ImageKit URL
        licenseFileId: updatedUser.licenseFileId,   // optional
      },
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





// @desc Request password reset
// @route POST /api/auth/forgot-password
// @access Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email address'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and save to user
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour validity

    // 🧩 FIXED: Save without running full validation
    await user.save({ validateBeforeSave: false });

    // Create frontend reset URL
    const frontendUrl =
      process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';
    const cleanUrl = frontendUrl.replace(/\/$/, ''); // remove trailing slash
    const resetUrl = `${cleanUrl}/reset-password/${resetToken}`;

    // Log for debugging
    console.log('✅ Reset URL generated:', resetUrl);
    console.log('🔒 Hashed token stored in DB:', hashedToken);
    console.log('⏰ Token expires at:', new Date(user.resetPasswordExpires).toLocaleString());

    // Email content
    const mailOptions = {
      from: `${process.env.EMAIL_FROM || 'Crop Connect'} <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request - Crop Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">Password Reset Request</h2>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>You requested to reset your password for your Crop Connect account.</p>
            <p>Please click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
                        color: white;
                        padding: 15px 40px;
                        text-decoration: none;
                        border-radius: 8px;
                        display: inline-block;
                        font-weight: bold;
                        font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #16a34a; word-break: break-all;">${resetUrl}</p>
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="color: #dc2626; margin: 0;">⚠️ This link will expire in 1 hour.</p>
            </div>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
        </div>
      `,
    };

    // Send email
    if (req.emailTransporter) {
      await req.emailTransporter.sendMail(mailOptions);
    } else {
      console.error('❌ Email transporter not available');
      return res.status(500).json({
        success: false,
        message: 'Email service not configured'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending password reset email',
      error: error.message
    });
  }
  const verifyUser = await User.findById(user._id).select("resetPasswordToken resetPasswordExpires email");
console.log("🧾 DB after save:", verifyUser);
};

// @desc Reset password
// @route POST /api/auth/reset-password/:token
// @access Public
// exports.resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     // Validate password
//     if (!password || password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: 'Password must be at least 6 characters long'
//       });
//     }

//     // Hash the token from URL
//     const hashedToken = crypto
//       .createHash('sha256')
//       .update(token)
//       .digest('hex');

//     // Find user with valid token
//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpires: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid or expired reset token'
//       });
//     }

//     // Update password (pre-save hook will hash it)
//     user.password = password;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;

//     await user.save();

//     // Send confirmation email
//     if (req.emailTransporter) {
//       const mailOptions = {
//         from: `${process.env.EMAIL_FROM || "Crop Connect"} <${process.env.EMAIL_USER}>`,
//         to: user.email,
//         subject: 'Password Changed Successfully - Crop Connect',
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//             <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
//               <h2 style="color: white; margin: 0; text-align: center;">Password Changed Successfully</h2>
//             </div>
//             <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
//               <p style="font-size: 16px; color: #374151;">Hello <strong>${user.name}</strong>,</p>
//               <p style="font-size: 16px; color: #374151;">Your password has been changed successfully.</p>
//               <p style="font-size: 16px; color: #374151;">You can now login with your new password.</p>
//               <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
//                 <p style="color: #dc2626; margin: 0;">⚠️ If you didn't make this change, please contact support immediately.</p>
//               </div>
//               <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
//               <p style="color: #9ca3af; font-size: 12px; text-align: center;">
//                 This is an automated message from Crop Connect.
//               </p>
//             </div>
//           </div>
//         `
//       };

//       await req.emailTransporter.sendMail(mailOptions);
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Password reset successful. You can now login with your new password.'
//     });

//   } catch (error) {
//     console.error('Reset password error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error resetting password',
//       error: error.message
//     });
//   }
// };
// @desc Reset password
// @route POST /api/auth/reset-password/:token
// @access Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log("➡️ Raw token from URL:", token);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    console.log("➡️ Hashed token:", hashedToken);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log("❌ No user found for that token or token expired");
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // ✅ Send confirmation email
    const mailOptions = {
      from: `${process.env.EMAIL_FROM || "Crop Connect"} <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Password Has Been Reset - Crop Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 25px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0; text-align: center;">Password Reset Successful</h2>
          </div>
          <div style="background: #f9fafb; padding: 25px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">Hi <strong>${user.name}</strong>,</p>
            <p style="font-size: 16px; color: #374151;">
              This is to confirm that your password for your Crop Connect account was successfully reset.
            </p>
            <p style="font-size: 16px; color: #374151;">
              If you did not perform this action, please contact our support team immediately.
            </p>
            <div style="margin: 25px 0;">
              <a href="${process.env.CLIENT_URL || "http://localhost:5173/login"}"
                 style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
                        color: white;
                        padding: 12px 35px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: bold;">
                Login Now
              </a>
            </div>
            <hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              This is an automated security notification from Crop Connect. Please do not reply.
            </p>
          </div>
        </div>
      `,
    };

    try {
      if (req.emailTransporter) {
        await req.emailTransporter.sendMail(mailOptions);
        console.log(`📧 Password reset confirmation sent to ${user.email}`);
      } else {
        console.warn("⚠️ Email transporter not available; skipping confirmation mail.");
      }
    } catch (mailError) {
      console.error("❌ Failed to send password reset confirmation email:", mailError);
      // Don't block response even if mail fails
    }

    return res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};