import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
	Sprout,
	Mail,
	Lock,
	Eye,
	EyeOff,
	ArrowLeft,
	AlertTriangle,
} from "lucide-react";

function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	// NEW: form + system messaging
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
	const [capsLock, setCapsLock] = useState(false);
	const [loading, setLoading] = useState(false);
	const [offline, setOffline] = useState(!navigator.onLine);

	const navigate = useNavigate();
	const { login } = useAuth();

	// --- helpers ---------------------------------------------------------------

	const isValidEmail = (val) =>
		/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(val).trim());

	// Button disabled state like modern apps
	const formInvalid = useMemo(() => {
		if (!email || !password) return true;
		if (!isValidEmail(email)) return true;
		return false;
	}, [email, password]);

	// Map backend/axios errors -> friendly messages
	const mapError = (status, message = "") => {
		if (!navigator.onLine) return "No internet connection.";
		if (status === 400 && /email.*password/i.test(message))
			return "Please enter your email and password.";
		if (status === 400 && /validation/i.test(message))
			return "Invalid input. Please check your email/password.";
		if (status === 401) return "Invalid email or password.";
		if (status === 403) return "Access denied for this account.";
		if (status === 404 && /route not found/i.test(message))
			return "Login service is unavailable. Try again shortly.";
		if (status === 429)
			return "Too many attempts. Please try again in a minute.";
		if (status >= 500) return "Server error — please try again.";
		return message || "Something went wrong. Please try again.";
	};

	// --- effects ---------------------------------------------------------------

	// Offline/online banner like native apps
	useEffect(() => {
		const handleOnline = () => setOffline(false);
		const handleOffline = () => setOffline(true);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	// --- handlers --------------------------------------------------------------

	const validateLocally = () => {
		const next = { email: "", password: "" };
		if (!email) next.email = "Email is required.";
		else if (!isValidEmail(email)) next.email = "Enter a valid email address.";

		if (!password) next.password = "Password is required.";
		setFieldErrors(next);
		return !next.email && !next.password;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		if (!validateLocally()) return;

		setLoading(true);
		try {
			// your existing auth call
			const result = await login(email.trim(), password);

			if (result?.success) {
				const { user } = result;

				// role-based redirect (unchanged)
				switch (user?.role) {
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
				// result may contain { status, message }
				const friendly = mapError(result?.status, result?.message);
				setError(friendly);
			}
		} catch (err) {
			// supports both thrown Errors and axios-like errors
			const status =
				err?.status || err?.response?.status || err?.response?.data?.status;
			const message =
				err?.message || err?.response?.data?.message || err?.data?.message;
			setError(mapError(status, message));
			// eslint-disable-next-line no-console
			console.error("Login error:", err);
		} finally {
			setLoading(false);
		}
	};

	// CapsLock indicator for password field
	const onPasswordKeyUp = (e) => {
		try {
			setCapsLock(!!e.getModifierState?.("CapsLock"));
		} catch {
			/* no-op */
		}
	};

	// --- render ----------------------------------------------------------------

	return (
		<div
			className="min-h-screen relative flex items-center justify-center p-4"
			style={{
				backgroundImage: "url('/login.jpg')",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			{/* Back to home */}
			<Link
				to="/"
				className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-green-200 transition-colors group"
				aria-label="Back to Home"
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

					{/* System banner (offline) */}
					{offline && (
						<div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
							<AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
							You’re offline. Check your connection and try again.
						</div>
					)}

					{/* Form-level error */}
					{error && (
						<div
							className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
							role="alert"
							aria-live="assertive"
						>
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-5" noValidate>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Email Address
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
								<input
									type="email"
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
										if (fieldErrors.email)
											setFieldErrors((f) => ({ ...f, email: "" }));
									}}
									className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
										fieldErrors.email ? "border-red-300" : "border-gray-300"
									}`}
									placeholder="you@example.com"
									autoComplete="email"
									inputMode="email"
									aria-invalid={!!fieldErrors.email}
								/>
							</div>
							{fieldErrors.email && (
								<p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Password
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => {
										setPassword(e.target.value);
										if (fieldErrors.password)
											setFieldErrors((f) => ({ ...f, password: "" }));
									}}
									onKeyUp={onPasswordKeyUp}
									className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
										fieldErrors.password ? "border-red-300" : "border-gray-300"
									}`}
									placeholder="••••••••"
									autoComplete="current-password"
									aria-invalid={!!fieldErrors.password}
								/>
								<button
									type="button"
									onClick={() => setShowPassword((s) => !s)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ? (
										<EyeOff className="w-5 h-5" />
									) : (
										<Eye className="w-5 h-5" />
									)}
								</button>
							</div>
							{capsLock && (
								<p className="mt-1 text-xs text-amber-700">
									Caps Lock is on — your password may be entered incorrectly.
								</p>
							)}
							{fieldErrors.password && (
								<p className="mt-1 text-xs text-red-600">
									{fieldErrors.password}
								</p>
							)}
						</div>

						<div className="flex items-center justify-between mb-4">
							<Link
								to="/forgot-password"
								className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
							>
								Forgot Password?
							</Link>
						</div>

						<button
							type="submit"
							disabled={loading || formInvalid || offline}
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
