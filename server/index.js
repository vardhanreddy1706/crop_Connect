const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
	cors: {
		origin: [
			"http://localhost:5174",
			"http://localhost:5173",
			"http://localhost:3000",
			"http://127.0.0.1:5174",
			"http://127.0.0.1:5173",
			process.env.CLIENT_URL,
		].filter(Boolean),
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true,
	},
});

// 🆕 SAFER: Try to load nodemailer, but don't crash if it's not available
let emailTransporter = null;
try {
	const nodemailer = require("nodemailer");

	if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
		emailTransporter = nodemailer.createTransporter({
			service: "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});
		console.log("✅ Email service configured");
	} else {
		console.log(
			"⚠️  Email credentials not found in .env - email notifications disabled"
		);
	}
} catch (error) {
	console.log("⚠️  nodemailer not installed - email notifications disabled");
	console.log("   Run: npm install nodemailer");
}

// Make io and emailTransporter available in req object
app.use((req, res, next) => {
	req.io = io;
	req.emailTransporter = emailTransporter;
	next();
});

// ========================
// SECURITY MIDDLEWARES
// ========================

// 1. Helmet - Set security headers
app.use(helmet());

// 2. Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: "Too many requests from this IP, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});
app.use("/api/", limiter);

// 3. CORS Configuration
const corsOptions = {
	origin: function (origin, callback) {
		if (!origin) return callback(null, true);

		const allowedOrigins = [
			"http://localhost:5174",
			"http://localhost:5173",
			"http://localhost:3000",
			"http://127.0.0.1:5174",
			"http://127.0.0.1:5173",
			process.env.CLIENT_URL,
		].filter(Boolean);

		if (allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			console.log("❌ CORS blocked origin:", origin);
			callback(null, true); // Allow anyway for development
		}
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	exposedHeaders: ["Content-Range", "X-Content-Range"],
	maxAge: 600,
};

app.use(cors(corsOptions));

// 4. Compression
app.use(compression());

// ========================
// BODY PARSER MIDDLEWARES
// ========================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ========================
// LOGGING MIDDLEWARE (Development)
// ========================
if (process.env.NODE_ENV === "development") {
	app.use((req, res, next) => {
		console.log(`📨 ${req.method} ${req.path}`);
		next();
	});
}

// Socket.IO Connection Handler
io.on("connection", (socket) => {
	console.log(`🔌 User connected: ${socket.id}`);

	socket.on("join", (userId) => {
		socket.join(userId);
		console.log(`👤 User ${userId} joined their notification room`);
	});

	socket.on("disconnect", () => {
		console.log(`🔌 User disconnected: ${socket.id}`);
	});
});

// ========================
// IMPORT ROUTES
// ========================
const authRoutes = require("./routes/authRoutes");
const cropRoutes = require("./routes/cropRoutes");
const productRoutes = require("./routes/productRoutes");
const tractorRoutes = require("./routes/tractorRoutes");
const workerRoutes = require("./routes/workerRoutes");
const contactRoutes = require("./routes/contactRoutes");
const workerRequirementRoutes = require("./routes/workerRequirementRoutes");
const tractorRequirementRoutes = require("./routes/tractorRequirementRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const debugRoutes = require("./routes/debugRoutes");
const bidRoutes = require("./routes/bidRoutes");
// ========================
// API ROUTES
// ========================
app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/products", productRoutes);
app.use("/api/tractors", tractorRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/worker-requirements", workerRequirementRoutes);
app.use("/api/tractor-requirements", tractorRequirementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/bids", bidRoutes);




// ========================
// WELCOME ROUTE
// ========================
app.get("/", (req, res) => {
	res.json({
		success: true,
		message: "🌾 Welcome to Crop Connect API",
		version: "1.0.0",
		timestamp: new Date().toISOString(),
		endpoints: {
			authentication: "/api/auth",
			crops: "/api/crops",
			products: "/api/products",
			tractorServices: "/api/tractors",
			workerServices: "/api/workers",
			bookings: "/api/bookings",
			contact: "/api/contact",
			workerRequirements: "/api/worker-requirements",
			tractorRequirements: "/api/tractor-requirements",
			notifications: "/api/notifications",
			transactions: "/api/transactions",
		},
	});
});

// ========================
// HEALTH CHECK ROUTE
// ========================
app.get("/api/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Server is running",
		uptime: process.uptime(),
		timestamp: Date.now(),
		socketIO: "Connected",
		emailService: emailTransporter ? "Configured" : "Not configured",
	});
});

// ========================
// ERROR HANDLERS
// ========================

// 404 Handler
app.use((req, res, next) => {
	res.status(404).json({
		success: false,
		message: `Route not found - ${req.originalUrl}`,
	});
});

// Global Error Handler
app.use(errorHandler);

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
	console.log("\n🚀 ========================================");
	console.log(
		`✅ Server running in ${process.env.NODE_ENV || "development"} mode`
	);
	console.log(`🌐 Server URL: http://localhost:${PORT}`);
	console.log(`📡 API Base: http://localhost:${PORT}/api`);
	console.log(`🔒 JWT Authentication: Enabled`);
	console.log(`🌍 CORS: Enabled for http://localhost:5174`);
	console.log(`🔌 Socket.IO: Enabled for real-time notifications`);
	console.log(
		`📧 Email Service: ${
			emailTransporter ? "Configured ✅" : "Not configured ⚠️"
		}`
	);
	console.log("🚀 ========================================\n");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
	console.log(`❌ Error: ${err.message}`);
	server.close(() => process.exit(1));
});

// Graceful shutdown
process.on("SIGINT", () => {
	console.log("\n🛑 Shutting down server gracefully...");
	server.close(() => {
		console.log("✅ Server closed");
		process.exit(0);
	});
});





module.exports = { app, io, emailTransporter };
