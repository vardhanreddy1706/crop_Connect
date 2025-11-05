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
const { GoogleGenerativeAI } = require("@google/generative-ai");


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

// ✅ PROPER: Load nodemailer and configure email transporter ONCE
let emailTransporter = null;
try {
	const nodemailer = require("nodemailer");

	// Check if email credentials are provided
	if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
		emailTransporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST || "smtp.gmail.com",
			port: parseInt(process.env.EMAIL_PORT) || 587,
			secure: false, // true for 465, false for 587
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		// Verify connection
		emailTransporter.verify((error, success) => {
			if (error) {
				console.log("❌ Email verification failed:", error.message);
				emailTransporter = null;
			} else {
				console.log("✅ Email service verified and ready");
			}
		});
	} else {
		console.log("⚠️  Email credentials not found in .env");
	}
} catch (error) {
	console.log("⚠️  nodemailer not installed - email notifications disabled");
	console.log("   Run: npm install nodemailer");
}

// ========================
// SECURITY MIDDLEWARES
// ========================

// 1. Helmet - Set security headers
app.use(helmet());

app.get("/api/crop-prices", async (req, res) => {
	try {
		const apiKey = process.env.DATA_GOV_API_KEY;
		if (!apiKey) {
			return res.status(500).json({ success: false, message: "DATA_GOV_API_KEY missing" });
		}
		const limit = Number(req.query.limit) || 100;
		const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=${limit}`;
		const apiRes = await fetch(url);
		if (!apiRes.ok) {
			return res.status(apiRes.status).json({ success: false, message: "Failed to fetch crop prices" });
		}
		const data = await apiRes.json();
		res.header("Access-Control-Allow-Origin", "*");
		res.json(data);
	} catch (e) {
		console.error("Crop prices API error:", e);
		res.status(500).json({ success: false, message: "Internal error fetching crop prices" });
	}
});


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


// 2. Rate limiting - ✅ FIXED: More permissive for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // ✅ 1 minute window (shorter but resets faster)
  max: 100,  // ✅ 100 requests per minute (much more permissive)
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ Skip rate limiting for development
  skip: (req) => process.env.NODE_ENV === "development",
});

// ✅ Apply rate limiter AFTER CORS (so CORS headers are always sent)
// We'll move this below CORS middleware

app.use("/api/", limiter);


// 4. Compression
app.use(compression());

// ========================
// BODY PARSER MIDDLEWARES
// ========================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ✅ Make io and emailTransporter available in req object (MUST be BEFORE routes)
app.use((req, res, next) => {
	req.io = io;
	req.emailTransporter = emailTransporter;
	next();
});

// ========================
// LOGGING MIDDLEWARE (Development)
// ========================
if (process.env.NODE_ENV === "development") {
	app.use((req, res, next) => {
		console.log(`📨 ${req.method} ${req.path}`);
		next();
	});
}

// ========================
// Socket.IO Connection Handler
// ========================
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



// Initialize Gemini AI
let genAI = null;
let model = null;

try {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log("⚠️  GEMINI_API_KEY not found in .env");
  } else {
    console.log("🔑 Gemini API Key loaded:", apiKey.substring(0, 10) + "...");
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
			model: "gemini-2.5-pro",
		});
    console.log("✅ Gemini AI initialized successfully");
  }
} catch (error) {
  console.error("❌ Failed to initialize Gemini AI:", error.message);
}

// ... rest of your server setup ...

// ============================================
// Chatbot Endpoint (REPLACE existing one)
// ============================================
app.post("/api/crop-connect-chat", async (req, res) => {
	try {
		const { message } = req.body;

		// Validation
		if (
			!message ||
			typeof message !== "string" ||
			message.trim().length === 0
		) {
			return res.status(400).json({
				success: false,
				reply: "Please provide a valid message.",
			});
		}

		// Check if Gemini is initialized
		if (!model) {
			console.error("❌ Gemini model not initialized");
			return res.status(500).json({
				success: false,
				reply:
					"AI service is not available. Please check server configuration.",
			});
		}

		console.log("💬 User message:", message);

		// Enhanced prompt for better responses
		const prompt = `You are CropConnect's expert agricultural assistant. You help farmers with:
- Crop selection and seasonal advice
- Soil health and fertilization
- Pest and disease management
- Weather-based farming tips
- Market prices and selling strategies
- Irrigation and water management
- Government schemes and subsidies
- Best farming practices

User question: "${message}"

Provide a helpful, practical answer in 2-3 sentences. Be conversational and supportive.`;

		// Generate response
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();

		console.log("✅ AI Response generated");

		res.json({
			success: true,
			reply: text.trim(),
		});
	} catch (error) {
		console.error("❌ Chatbot error:", error);
		console.error("Error details:", error.message);
		console.error("Stack trace:", error.stack);

		// Handle specific error types
		if (error.message?.includes("API key")) {
			return res.status(500).json({
				success: false,
				reply: "AI service configuration error. Please contact support.",
			});
		}

		if (error.message?.includes("quota") || error.message?.includes("limit")) {
			return res.status(429).json({
				success: false,
				reply: "AI service is temporarily busy. Please try again in a moment.",
			});
		}

		res.status(500).json({
			success: false,
			reply: "I'm having trouble connecting right now. Please try again later.",
		});
	}
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
const workerHireRoutes = require("./routes/workHireRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

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
app.use("/api/worker-hires", workerHireRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

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
			bids: "/api/bids",
			debug: "/api/debug",
			subscriptions: "/api/subscriptions",
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
		emailService: emailTransporter ? "Configured ✅" : "Not configured ⚠️",
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
	console.log(`🔐 JWT Authentication: Enabled`);
	console.log(`🌐 CORS: Enabled for http://localhost:5174`);
	console.log(`🔔 Socket.IO: Enabled for real-time notifications`);
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
