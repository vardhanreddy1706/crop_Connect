import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import CropConnectLanding from "./auth/LandingPage";
import Login from "./auth/Login";
import Register from "./auth/Register";
import RegisterFB from "./auth/RegistrationFB";

import About from "./pages/About";
import Contact from "./help/Contact";
import Crops from "./pages/Crops";
import CropDetails from "./pages/CropDetails";
import SellCropPage from "./pages/SellCropPage";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import TractorBooking from "./pages/TractorBooking";
import WorkerBookings from "./pages/Bookings";
import FarmerBookings from "./pages/BookingsHistory";
import TransactionHistory from "./pages/TransactionHistory";
import { NotificationProvider } from "./context/NotificationContext";
import FarmerMyBookings from "./pages/FarmerBookings";
import { LanguageProvider } from "./context/LanguageContext";
import FarmerOrders from "./pages/FarmerOrders";
// Dashboards
import BuyerDashboard from "./dashboards/BuyerDashboard";
import TractorDashboard from "./dashboards/TractorDashboard";
import WorkerDashboard from "./dashboards/WorkerDashboard";
import FarmerDashboard from "./dashboards/Home";

// Help Pages
import HelpLayout from "./help/HelpLayout";
import Faq from "./help/Faq";
import PrivacyAndPolicy from "./help/PrivacyAndPolicy";
import TermsAndConditions from "./help/TermsAndConditions";

import "./App.css";

// Loading Component
const LoadingSpinner = () => (
	<div className="flex items-center justify-center min-h-screen bg-gray-50">
		<div className="text-center">
			<div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
			<p className="text-gray-600 text-lg">Loading...</p>
		</div>
	</div>
);

// Protected Route - Requires authentication and optional role check
const ProtectedRoute = ({ children, allowedRoles }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return <LoadingSpinner />;
	}

	if (!user) {
		// Not logged in - redirect to login
		return <Navigate to="/login" replace />;
	}

	if (allowedRoles && !allowedRoles.includes(user.role)) {
		// Logged in but wrong role - redirect to their dashboard
		return <Navigate to={getDashboardPath(user.role)} replace />;
	}

	return children;
};

// Public Route - Only for unauthenticated users (Login, Register, Landing)
const PublicRoute = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return <LoadingSpinner />;
	}

	// If already logged in, redirect to their dashboard
	if (user) {
		return <Navigate to={getDashboardPath(user.role)} replace />;
	}

	// Not logged in - show the public page
	return children;
};

// Helper function to get dashboard path based on role
const getDashboardPath = (role) => {
	switch (role) {
		case "farmer":
			return "/farmer-dashboard";
		case "buyer":
			return "/buyer-dashboard";
		case "tractor_owner":
			return "/tractor-dashboard";
		case "worker":
			return "/worker-dashboard";
		default:
			return "/";
	}
};

function AppRoutes() {
	const { user, loading } = useAuth();

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<Routes>
			{/* Landing Page - Public (redirects if logged in) */}
			<Route
				path="/"
				element={
					<PublicRoute>
						<CropConnectLanding />
					</PublicRoute>
				}
			/>

			{/* Authentication Routes - Public only */}
			<Route
				path="/login"
				element={
					<PublicRoute>
						<Login />
					</PublicRoute>
				}
			/>
			<Route
				path="/register-wt"
				element={
					<PublicRoute>
						<Register />
					</PublicRoute>
				}
			/>
			<Route
				path="/register-fb"
				element={
					<PublicRoute>
						<RegisterFB />
					</PublicRoute>
				}
			/>

			{/* Protected Routes - Require Authentication */}
			<Route
				path="/about"
				element={
					<ProtectedRoute>
						<About />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/contact"
				element={
					<ProtectedRoute>
						<Contact />
					</ProtectedRoute>
				}
			/>

			{/* Crop Routes */}
			<Route
				path="/crops"
				element={
					<ProtectedRoute>
						<Crops />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/crops/:id"
				element={
					<ProtectedRoute>
						<CropDetails />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/sell-crop"
				element={
					<ProtectedRoute allowedRoles={["farmer"]}>
						<SellCropPage />
					</ProtectedRoute>
				}
			/>

			{/* Product Routes */}
			<Route
				path="/products"
				element={
					<ProtectedRoute>
						<Products />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/products/:id"
				element={
					<ProtectedRoute>
						<ProductDetails />
					</ProtectedRoute>
				}
			/>

			{/* Tractor & Worker Booking */}
			<Route
				path="/tractor-booking"
				element={
					<ProtectedRoute allowedRoles={["farmer"]}>
						<TractorBooking />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/worker-bookings"
				element={
					<ProtectedRoute>
						<WorkerBookings />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/transaction-history"
				element={
					<ProtectedRoute>
						<TransactionHistory />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/farmer/my-bookings"
				element={
					<ProtectedRoute allowedRoles={["farmer"]}>
						<FarmerMyBookings />
					</ProtectedRoute>
				}
			/>

			<Route
				path="booking-history"
				element={
					<ProtectedRoute>
						<FarmerBookings />
					</ProtectedRoute>
				}
			/>

			<Route path="/farmer/orders" element={<FarmerOrders />} />

			{/* Role-Based Dashboards - Protected */}
			<Route
				path="/farmer-dashboard"
				element={
					<ProtectedRoute allowedRoles={["farmer"]}>
						<FarmerDashboard />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/buyer-dashboard"
				element={
					<ProtectedRoute allowedRoles={["buyer"]}>
						<BuyerDashboard />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/tractor-dashboard"
				element={
					<ProtectedRoute allowedRoles={["tractor_owner"]}>
						<TractorDashboard />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/worker-dashboard"
				element={
					<ProtectedRoute allowedRoles={["worker"]}>
						<WorkerDashboard />
					</ProtectedRoute>
				}
			/>

			{/* Help Routes - Protected */}
			<Route
				path="/help"
				element={
					<ProtectedRoute>
						<HelpLayout />
					</ProtectedRoute>
				}
			>
				<Route index element={<Faq />} />
				<Route path="faq" element={<Faq />} />
				<Route path="privacy" element={<PrivacyAndPolicy />} />
				<Route path="terms" element={<TermsAndConditions />} />
			</Route>

			{/* Catch all - Redirect based on auth status */}
			<Route
				path="*"
				element={
					user ? (
						<Navigate to={getDashboardPath(user.role)} replace />
					) : (
						<Navigate to="/" replace />
					)
				}
			/>
		</Routes>
	);
}

function App() {
	return (
		<LanguageProvider>
			<NotificationProvider>
				<Router>
					<AuthProvider>
						<AppRoutes />
					</AuthProvider>
				</Router>
			</NotificationProvider>
		</LanguageProvider>
	);
}

export default App;
