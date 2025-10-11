const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// ========================
// SECURITY MIDDLEWARES
// ========================

// 1. Helmet - Set security headers
app.use(helmet());

// 2. Rate limiting - Prevent brute force attacks
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: "Too many requests from this IP, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});
app.use("/api/", limiter);

// 3. CORS Configuration - Allow frontend to access backend
const corsOptions = {
	origin: function (origin, callback) {
		const allowedOrigins = [
			process.env.CLIENT_URL,
			"http://localhost:5173",
			"http://localhost:3000",
			"http://127.0.0.1:5173",
		];

		// Allow requests with no origin (mobile apps, Postman, etc.)
		if (!origin || allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	credentials: true, // Allow cookies
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	exposedHeaders: ["Content-Range", "X-Content-Range"],
	maxAge: 600, // Cache preflight request for 10 minutes
};

app.use(cors(corsOptions));

// 4. Compression - Compress responses
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
		console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
		next();
	});
}

// ========================
// IMPORT ROUTES
// ========================
const authRoutes = require("./routes/authRoutes");
const cropRoutes = require("./routes/cropRoutes");
const productRoutes = require("./routes/productRoutes");
const tractorRoutes = require("./routes/tractorRoutes");
const workerRoutes = require("./routes/workerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const contactRoutes = require("./routes/contactRoutes");

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
		},
		documentation: {
			postman: "Import collection for API testing",
			github: "Check repository for detailed docs",
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
	});
});

// ========================
// ERROR HANDLERS
// ========================

// 404 Handler - Route not found
app.use((req, res, next) => {
	const error = new Error(`Route not found - ${req.originalUrl}`);
	res.status(404);
	next(error);
});

// Global Error Handler
app.use(errorHandler);

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
	console.log("\n ========================================");
	console.log(
		` Server running in ${process.env.NODE_ENV || "development"} mode`
	);
	console.log(` Server URL: http://localhost:${PORT}`);
	console.log(` API Base: http://localhost:${PORT}/api`);
	console.log(` JWT Authentication: Enabled`);
	console.log(`CORS: Enabled for ${process.env.CLIENT_URL}`);
	
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
	console.log(` Error: ${err.message}`);
	// Close server & exit process
	server.close(() => process.exit(1));
});
