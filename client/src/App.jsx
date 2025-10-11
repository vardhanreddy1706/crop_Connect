import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Crops from "./pages/Crops.jsx";
import CropDetails from "./pages/CropDetails.jsx";
import About from "./pages/About.jsx";
import SellCropPage from "./pages/SellCropPage.jsx";
import WorkerBooking from "./pages/Bookings.jsx";
import TractorBookingForm from "./pages/TractorBooking.jsx";

import HelpFaqPrices from "./help/Faq.jsx";
import TermsAndConditions from "./help/TermsAndConditions.jsx";
import PrivacyPolicy from "./help/PrivacyAndPolicy.jsx";
import ContactPage from "./help/Contact.jsx";

export default function App() {
	return (
		<AuthProvider>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/products" element={<Products />} />
				<Route path="/products/:id" element={<ProductDetails />} />
				<Route path="/crops" element={<Crops />} />
				<Route path="/crops/:id" element={<CropDetails />} />
				<Route path="/about" element={<About />} />
				<Route path="/sell-crop" element={<SellCropPage />} />
				<Route path="/booking" element={<WorkerBooking />} />
				<Route path="/book-tractor" element={<TractorBookingForm />} />

				{/* help routes */}
				<Route path="/contact" element={<ContactPage />} />
				<Route path="/faqs" element={<HelpFaqPrices />} />
				<Route path="/terms" element={<TermsAndConditions />} />
				<Route path="/privacy" element={<PrivacyPolicy />} />
			</Routes>
		</AuthProvider>
	);
}
