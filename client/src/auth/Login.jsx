import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
			const result = await login(email, password);

			if (result.success) {
				const { user } = result;

				// Redirect based on role with replace: true to prevent back button
				switch (user.role) {
					case "farmer":
						navigate("/farmer-dashboard", { replace: true });
						break;
					case "buyer":
						navigate("/buyer-dashboard", { replace: true });
						break;
					case "tractorowner":
						navigate("/tractor-dashboard", { replace: true });
						break;
					case "worker":
						navigate("/worker-dashboard", { replace: true });
						break;
					default:
						navigate("/landing", { replace: true });
				}
			} else {
				setError(result.message || "Login failed. Please try again.");
			}
		} catch (err) {
			console.error("Login error:", err);
			setError(
				err.message || "An unexpected error occurred. Please try again."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="min-h-screen relative flex items-center justify-center p-4"
			style={{
				backgroundImage: "url('/login.jpg')",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			{/* white fade overlay */}

				<Link
					to="/"
					className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-green-800 transition-colors group"
				>
					<ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
					<span className="font-medium">Back to Home</span>
				</Link>

				<div className="w-full max-w-md">
					<div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-green-100">
						<div className="text-center space-y-2">
							<div className="flex justify-center">
								<div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
									<Sprout className="w-8 h-8 text-white" />
								</div>
							</div>
							<h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
							<p className="text-gray-600">
								Sign in to your Crop Connect account
							</p>
						</div>

						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
								{error}
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-5">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email Address
								</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
										placeholder="you@example.com"
										required
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Password
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
									<input
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
										placeholder="••••••••"
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

							<button
								type="submit"
								disabled={loading}
								className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
							>
								{loading ? "Signing in..." : "Sign In"}
							</button>
						</form>

						<div className="text-center space-y-4">
							<p className="text-sm text-gray-600">
								Don't have an account?{" "}
								<Link
									to="/"
									className="text-green-600 hover:text-green-700 font-semibold"
								>
									Sign up
								</Link>
							</p>
						</div>
					</div>

					<p className="text-center text-sm text-gray-500 mt-6">
						© 2025 Crop Connect. All rights reserved.
					</p>
				</div>
			</div>
		
	);
}

export default Login;
