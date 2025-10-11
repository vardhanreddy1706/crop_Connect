// src/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Sprout, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const navigate = useNavigate();
	const { login } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			// Replace this with your actual API call
			const response = await fetch("http://localhost:8080/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (response.ok) {
				// Store user data and token
				login(data.user, data.token);
				// Redirect to home/dashboard
				navigate("/home");
			} else {
				setError(data.message || "Login failed. Please try again.");
			}
		} catch (err) {
			setError(err||"Network error. Please check your connection.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute top-0 left-0 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
			<div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
			<div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

			<div className="max-w-md w-full relative z-10">
				{/* Back to Landing Button */}
				<button
					onClick={() => navigate("/landing")}
					className="flex items-center gap-2 text-gray-600 hover:text-green-700 mb-6 font-medium transition-colors"
				>
					<ArrowLeft className="w-5 h-5" />
					Back to Home
				</button>

				{/* Logo and Title */}
				<div className="text-center mb-8">
					<div className="flex items-center justify-center mb-4">
						<div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-xl">
							<Sprout className="w-10 h-10 text-white" />
						</div>
					</div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent mb-2">
						Welcome Back to CropConnect
					</h1>
					<p className="text-gray-600">Login to access your account</p>
				</div>

				{/* Login Form Card */}
				<div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/50">
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Error Message */}
						{error && (
							<div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg animate-shake">
								<p className="text-sm font-medium">{error}</p>
							</div>
						)}

						{/* Email Input */}
						<div>
							<label className="block text-gray-700 font-semibold mb-2 text-sm">
								Email Address
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white"
									placeholder="your@email.com"
									required
								/>
							</div>
						</div>

						{/* Password Input */}
						<div>
							<label className="block text-gray-700 font-semibold mb-2 text-sm">
								Password
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white"
									placeholder="Enter your password"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
								>
									{showPassword ? (
										<EyeOff className="w-5 h-5" />
									) : (
										<Eye className="w-5 h-5" />
									)}
								</button>
							</div>
						</div>

						{/* Remember Me & Forgot Password */}
						<div className="flex items-center justify-between">
							<label className="flex items-center">
								<input
									type="checkbox"
									className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
								/>
								<span className="ml-2 text-sm text-gray-600">Remember me</span>
							</label>
							<Link
								to="/forgot-password"
								className="text-sm text-green-600 hover:text-green-700 font-semibold transition-colors"
							>
								Forgot Password?
							</Link>
						</div>

						{/* Submit Button */}
						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
						>
							{loading ? (
								<span className="flex items-center justify-center gap-2">
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
									Logging in...
								</span>
							) : (
								"Login"
							)}
						</button>
					</form>

					{/* Divider */}
					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-300"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-4 bg-white text-gray-500">
								or continue with
							</span>
						</div>
					</div>

					{/* Social Login Buttons */}
					<div className="grid grid-cols-2 gap-4">
						<button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700">
							<svg className="w-5 h-5" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Google
						</button>
						<button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
							</svg>
							Facebook
						</button>
					</div>

					{/* Register Link */}
					<div className="mt-6 text-center">
						<p className="text-gray-600">
							Don't have an account?{" "}
							<Link
								to="/register"
								className="text-green-600 hover:text-green-700 font-semibold transition-colors"
							>
								Register here
							</Link>
						</p>
					</div>
				</div>

				{/* Additional Links */}
				<div className="mt-6 text-center space-y-2">
					<Link
						to="/terms"
						className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
					>
						Terms & Conditions
					</Link>
					<span className="text-gray-400 mx-2">•</span>
					<Link
						to="/privacy"
						className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
					>
						Privacy Policy
					</Link>
				</div>
			</div>
		</div>
	);
}

export default Login;
