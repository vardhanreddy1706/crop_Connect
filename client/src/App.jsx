import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LandingPage from "./auth/LandingPage";
import Login from "./auth/Login";
import Register from "./auth/Register";
import RegistrationFB from "./auth/RegistrationFB";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./help/Contact";
import Crops from "./pages/Crops";
import CropDetails from "./pages/CropDetails";
import SellCropPage from "./pages/SellCropPage";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import TractorBooking from "./pages/TractorBooking";
import Bookings from "./pages/Bookings";

// Dashboards
import BuyerDashboard from "./dashboards/BuyerDashboard";
import TractorDashboard from "./dashboards/TractorDashboard";
import WorkerDashboard from "./dashboards/WorkerDashboard";

// Help Pages
import HelpLayout from "./help/HelpLayout";
import Faq from "./help/Faq";
import PrivacyAndPolicy from "./help/PrivacyAndPolicy";
import TermsAndConditions from "./help/TermsAndConditions";

import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-xl">Loading...</div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (allowedRoles && !allowedRoles.includes(user.role)) {
		return <Navigate to="/" replace />;
	}

	return children;
};

// Public Route - Redirect to home if already logged in
const PublicRoute = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-xl">Loading...</div>
			</div>
		);
	}

	if (user) {
		return <Navigate to="/" replace />;
	}

	return children;
};

function AppRoutes() {
	const { user } = useAuth();

	return (
		<Routes>
			{/* Landing Page - Show only when not authenticated */}
			<Route
				path="/landing"
				element={
					<PublicRoute>
						<LandingPage />
					</PublicRoute>
				}
			/>

			{/* Authentication Routes */}
			<Route
				path="/login"
				element={
					<PublicRoute>
						<Login />
					</PublicRoute>
				}
			/>
			<Route
				path="/register"
				element={
					<PublicRoute>
						<Register />
					</PublicRoute>
				}
			/>
			<Route
				path="/register-farmer-buyer"
				element={
					<PublicRoute>
						<RegistrationFB />
					</PublicRoute>
				}
			/>

			{/* Protected Routes */}
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<Home />
					</ProtectedRoute>
				}
			/>
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
				path="/my-bookings"
				element={
					<ProtectedRoute>
						<Bookings />
					</ProtectedRoute>
				}
			/>

			{/* Role-Based Dashboards */}
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

			{/* Help Routes */}
			<Route path="/help" element={<HelpLayout />}>
				<Route index element={<Faq />} />
				<Route path="faq" element={<Faq />} />
				<Route path="privacy" element={<PrivacyAndPolicy />} />
				<Route path="terms" element={<TermsAndConditions />} />
			</Route>

			{/* Default Route */}
			<Route
				path="*"
				element={<Navigate to={user ? "/" : "/landing"} replace />}
			/>
		</Routes>
	);
}

function App() {
	return (
		<Router>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</Router>
	);
}

export default App;
