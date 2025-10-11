// src/pages/ContactPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Mail,
	Phone,
	MapPin,
	Clock,
	Send,
	User,
	MessageSquare,
	ArrowLeft,
	Facebook,
	Twitter,
	Instagram,
	Linkedin,
	CheckCircle,
	MapPinned,
} from "lucide-react";

const ContactPage = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		subject: "",
		message: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 2000));

		setIsSubmitting(false);
		setSubmitSuccess(true);

		// Reset form after 3 seconds
		setTimeout(() => {
			setSubmitSuccess(false);
			setFormData({
				name: "",
				email: "",
				phone: "",
				subject: "",
				message: "",
			});
		}, 3000);
	};

	const contactInfo = [
		{
			icon: <Phone className="w-6 h-6" />,
			title: "Call Us",
			detail: "+91 98765 43210",
			link: "tel:+919876543210",
			color: "from-blue-500 to-blue-600",
		},
		{
			icon: <Mail className="w-6 h-6" />,
			title: "Email Us",
			detail: "support@cropconnect.com",
			link: "mailto:support@cropconnect.com",
			color: "from-green-500 to-emerald-600",
		},
		{
			icon: <MapPin className="w-6 h-6" />,
			title: "Visit Us",
			detail: "Bangalore, Karnataka, India",
			link: "#",
			color: "from-purple-500 to-pink-600",
		},
		{
			icon: <Clock className="w-6 h-6" />,
			title: "Working Hours",
			detail: "Mon-Sat: 9AM - 6PM IST",
			link: "#",
			color: "from-orange-500 to-red-600",
		},
	];

	const socialLinks = [
		{
			icon: <Facebook className="w-6 h-6" />,
			link: "https://facebook.com",
			color: "bg-blue-600 hover:bg-blue-700",
		},
		{
			icon: <Twitter className="w-6 h-6" />,
			link: "https://twitter.com",
			color: "bg-sky-500 hover:bg-sky-600",
		},
		{
			icon: <Instagram className="w-6 h-6" />,
			link: "https://instagram.com",
			color:
				"bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
		},
		{
			icon: <Linkedin className="w-6 h-6" />,
			link: "https://linkedin.com",
			color: "bg-blue-700 hover:bg-blue-800",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute top-0 left-0 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
			<div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
			<div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

			{/* Hero Section */}
			<div
				className="relative h-[300px] flex items-center justify-center"
				style={{
					backgroundImage:
						"linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070')",
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundAttachment: "fixed",
				}}
			>
				<div className="relative z-10 text-center px-4">
					<button
						onClick={() => navigate(-1)}
						className="absolute left-4 top-0 flex items-center gap-2 text-white hover:text-green-300 font-medium transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
						Back
					</button>
					<Mail className="w-16 h-16 text-white mx-auto mb-4 animate-bounce" />
					<h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
						Get In Touch
					</h1>
					<p className="text-xl text-green-100 max-w-2xl mx-auto">
						We'd love to hear from you. Send us a message and we'll respond as
						soon as possible.
					</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				{/* Contact Cards Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
					{contactInfo.map((info, index) => (
						<a
							key={index}
							href={info.link}
							className="group relative bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/50 overflow-hidden"
						>
							{/* Gradient Background on Hover */}
							<div
								className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
							></div>

							{/* Icon */}
							<div
								className={`relative w-14 h-14 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
							>
								{info.icon}
							</div>

							{/* Content */}
							<h3 className="relative text-lg font-bold text-gray-800 mb-2">
								{info.title}
							</h3>
							<p className="relative text-gray-600 text-sm">{info.detail}</p>
						</a>
					))}
				</div>

				{/* Main Contact Section */}
				<div className="grid lg:grid-cols-2 gap-8">
					{/* Contact Form */}
					<div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10 border border-white/50">
						<h2 className="text-3xl font-bold text-gray-800 mb-2">
							Send us a Message
						</h2>
						<p className="text-gray-600 mb-8">
							Fill out the form below and we'll get back to you shortly
						</p>

						{submitSuccess && (
							<div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg flex items-center gap-3 animate-slide-in">
								<CheckCircle className="w-6 h-6" />
								<span className="font-medium">
									Message sent successfully! We'll be in touch soon.
								</span>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Name Input */}
							<div className="relative">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Your Name <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleChange}
										className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm"
										placeholder="Enter your full name"
										required
									/>
								</div>
							</div>

							{/* Email and Phone */}
							<div className="grid md:grid-cols-2 gap-6">
								<div className="relative">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Email Address <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
										<input
											type="email"
											name="email"
											value={formData.email}
											onChange={handleChange}
											className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm"
											placeholder="your@email.com"
											required
										/>
									</div>
								</div>

								<div className="relative">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Phone Number
									</label>
									<div className="relative">
										<Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
										<input
											type="tel"
											name="phone"
											value={formData.phone}
											onChange={handleChange}
											className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm"
											placeholder="+91 98765 43210"
										/>
									</div>
								</div>
							</div>

							{/* Subject */}
							<div className="relative">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Subject <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="subject"
									value={formData.subject}
									onChange={handleChange}
									className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm"
									placeholder="How can we help you?"
									required
								/>
							</div>

							{/* Message */}
							<div className="relative">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Message <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<MessageSquare className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
									<textarea
										name="message"
										value={formData.message}
										onChange={handleChange}
										rows={6}
										className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none bg-white/50 backdrop-blur-sm"
										placeholder="Tell us more about your inquiry..."
										required
									/>
								</div>
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
							>
								{isSubmitting ? (
									<>
										<svg
											className="animate-spin h-5 w-5 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Sending...
									</>
								) : (
									<>
										<Send className="w-5 h-5" />
										Send Message
									</>
								)}
							</button>
						</form>
					</div>

					{/* Company Info & Map */}
					<div className="space-y-8">
						{/* Company Details Card */}
						<div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl shadow-2xl p-8 md:p-10 text-white">
							<h2 className="text-3xl font-bold mb-6">CropConnect</h2>
							<div className="space-y-6">
								<div className="flex items-start gap-4">
									<div className="bg-white/20 p-3 rounded-xl">
										<MapPinned className="w-6 h-6" />
									</div>
									<div>
										<h3 className="font-semibold mb-1">Corporate Office</h3>
										<p className="text-green-100">
											CropConnect Technologies Pvt. Ltd.
											<br />
											123 Tech Park, Whitefield
											<br />
											Bangalore 560066, Karnataka
											<br />
											India
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<div className="bg-white/20 p-3 rounded-xl">
										<Phone className="w-6 h-6" />
									</div>
									<div>
										<h3 className="font-semibold mb-1">Phone Numbers</h3>
										<p className="text-green-100">
											Main: +91 98765 43210
											<br />
											Support: +91 98765 43211
											<br />
											Toll Free: 1800-123-4567
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<div className="bg-white/20 p-3 rounded-xl">
										<Mail className="w-6 h-6" />
									</div>
									<div>
										<h3 className="font-semibold mb-1">Email Addresses</h3>
										<p className="text-green-100">
											General: info@cropconnect.com
											<br />
											Support: support@cropconnect.com
											<br />
											Sales: sales@cropconnect.com
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<div className="bg-white/20 p-3 rounded-xl">
										<Clock className="w-6 h-6" />
									</div>
									<div>
										<h3 className="font-semibold mb-1">Business Hours</h3>
										<p className="text-green-100">
											Monday - Friday: 9:00 AM - 6:00 PM
											<br />
											Saturday: 10:00 AM - 4:00 PM
											<br />
											Sunday: Closed
										</p>
									</div>
								</div>
							</div>

							{/* Social Media */}
							<div className="mt-8 pt-8 border-t border-white/20">
								<h3 className="font-bold text-lg mb-4">Follow Us</h3>
								<div className="flex gap-4">
									{socialLinks.map((social, index) => (
										<a
											key={index}
											href={social.link}
											target="_blank"
											rel="noopener noreferrer"
											className={`${social.color} p-3 rounded-xl transition-all transform hover:scale-110 shadow-lg`}
										>
											{social.icon}
										</a>
									))}
								</div>
							</div>
						</div>

						{/* Google Maps Embed */}
						<div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/50">
							<iframe
								src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248849.90089943655!2d77.49085281640629!3d12.953959988118138!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1634567890123!5m2!1sen!2sin"
								width="100%"
								height="300"
								style={{ border: 0 }}
								allowFullScreen=""
								loading="lazy"
								title="CropConnect Location"
							></iframe>
						</div>
					</div>
				</div>

				{/* FAQ Quick Links */}
				<div className="mt-16 bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10 border border-white/50">
					<h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
						Quick Help
					</h2>
					<div className="grid md:grid-cols-4 gap-6">
						{[
							{ title: "General FAQs", link: "/help/faq-general", icon: "❓" },
							{ title: "Crop Prices", link: "/help/faq-prices", icon: "💰" },
							{ title: "Bookings", link: "/help/faq-bookings", icon: "📅" },
							{ title: "Payments", link: "/help/faq-payments", icon: "💳" },
						].map((item, index) => (
							<a
								key={index}
								href={item.link}
								className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:-translate-y-1 border border-green-100 hover:shadow-xl"
							>
								<div className="text-4xl mb-3">{item.icon}</div>
								<h3 className="font-bold text-gray-800">{item.title}</h3>
							</a>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ContactPage;
