// const express = require("express");
// const authController = require("../controllers/authController");
// const router = express.Router();
// const {
// 	register,
// 	login,
// 	getMe,
// 	updateProfile,
// } = require("../controllers/authController");
// const { protect } = require("../middlewares/authMiddleware");
// const multer = require("multer");
// const upload = multer({ dest: "uploads/" }); // or configure as needed
// router.post("/register", upload.single("licenseFile"), authController.register);

// router.post("/register", register);
// router.post("/login", login);
// router.get("/me", protect, getMe);
// router.put("/profile", protect, updateProfile);

// module.exports = router;
const express = require("express");
const router = express.Router();

const {
	register,
	login,
	getMe,
	updateProfile,
	forgotPassword,  
  resetPassword, 
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

// Expect JSON body with optional licenseFileBase64
router.post("/register", register);

router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/forgot-password", forgotPassword);    
router.post("/reset-password/:token", resetPassword); 
module.exports = router;
