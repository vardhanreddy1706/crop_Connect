import React, { useState } from "react";
import axios from "axios";

const CropYieldPredictor = () => {
	const [formData, setFormData] = useState({
		year: new Date().getFullYear(),
		rainfall: "",
		pesticides: "",
		temperature: "",
		area: "",
		item: "",
	});

	const [prediction, setPrediction] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setPrediction(null);

		try {
			const response = await axios.post(
				"http://localhost:5001/api/predict",
				formData
			);

			if (response.data.success) {
				setPrediction(response.data);
			} else {
				setError(response.data.error);
			}
		} catch (err) {
			setError(
				err.response?.data?.error ||
					"Failed to get prediction. Please check your inputs."
			);
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{/* Header */}
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
					<span className="text-4xl">🌾</span>
					Crop Yield Prediction
				</h2>
				<p className="text-gray-600">
					Get AI-powered crop yield predictions based on environmental factors
				</p>
			</div>

			{/* Main Card */}
			<div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Form Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{/* Year */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Year
							</label>
							<input
								type="number"
								name="year"
								value={formData.year}
								onChange={handleChange}
								placeholder="e.g., 2025"
								required
								className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
							/>
						</div>

						{/* Rainfall */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Average Rainfall (mm/year)
							</label>
							<input
								type="number"
								name="rainfall"
								value={formData.rainfall}
								onChange={handleChange}
								placeholder="e.g., 1200"
								required
								className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
							/>
						</div>

						{/* Pesticides */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Pesticides (tonnes)
							</label>
							<input
								type="number"
								name="pesticides"
								value={formData.pesticides}
								onChange={handleChange}
								placeholder="e.g., 100"
								required
								className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
							/>
						</div>

						{/* Temperature */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Average Temperature (°C)
							</label>
							<input
								type="number"
								name="temperature"
								value={formData.temperature}
								onChange={handleChange}
								placeholder="e.g., 25"
								required
								className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
							/>
						</div>

						{/* Country Name - TEXT INPUT */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Country Name
							</label>
							<input
								type="text"
								name="area"
								value={formData.area}
								onChange={handleChange}
								placeholder="e.g., India"
								required
								className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
							/>
						</div>

						{/* Crop Name - TEXT INPUT */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Crop Name
							</label>
							<input
								type="text"
								name="item"
								value={formData.item}
								onChange={handleChange}
								placeholder="e.g., Maize"
								required
								className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
							/>
						</div>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
					>
						{loading ? (
							<>
								<svg
									className="animate-spin h-5 w-5"
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
								Predicting...
							</>
						) : (
							<>
								<span className="text-xl">📊</span>
								Predict Yield
							</>
						)}
					</button>
				</form>

				{/* Prediction Result */}
				{prediction && (
					<div className="mt-8 animate-fadeIn">
						<div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
							<h3 className="text-2xl font-bold text-center text-gray-800 mb-6 flex items-center justify-center gap-2">
								<span className="text-3xl">📈</span>
								Prediction Result
							</h3>

							{/* Result Cards */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{/* Primary Result */}
								<div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
									<div className="flex items-center gap-3 mb-3">
										<span className="text-4xl">🌾</span>
										<div>
											<p className="text-sm opacity-90 font-medium">
												Predicted Yield
											</p>
											<h2 className="text-3xl font-bold">
												{prediction.prediction}
											</h2>
											<p className="text-xs opacity-80 mt-1">
												hg/ha (hectograms/hectare)
											</p>
										</div>
									</div>
								</div>

								{/* Kilograms */}
								<div className="bg-white rounded-lg p-6 shadow-md border-2 border-gray-100 transform hover:scale-105 transition-transform duration-200">
									<div className="flex items-center gap-3 mb-3">
										<span className="text-4xl">⚖️</span>
										<div>
											<p className="text-sm text-gray-600 font-medium">
												In Kilograms
											</p>
											<h2 className="text-3xl font-bold text-gray-800">
												{(prediction.prediction / 10).toFixed(2)}
											</h2>
											<p className="text-xs text-gray-500 mt-1">kg/ha</p>
										</div>
									</div>
								</div>

								{/* Tonnes - Highlighted */}
								<div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-lg p-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
									<div className="flex items-center gap-3 mb-3">
										<span className="text-4xl">🚜</span>
										<div>
											<p className="text-sm opacity-90 font-medium">
												In Tonnes
											</p>
											<h2 className="text-3xl font-bold">
												{prediction.tonnes_per_hectare}
											</h2>
											<p className="text-xs opacity-80 mt-1">tonnes/ha</p>
										</div>
									</div>
								</div>
							</div>

							{/* Info Box */}
							<div className="mt-4 bg-white bg-opacity-60 rounded-lg p-4 text-center">
								<p className="text-sm text-gray-700">
									<strong>Note:</strong> 1 hectogram (hg) = 0.1 kg | 10,000 hg =
									1 tonne
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Error Message */}
				{error && (
					<div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-fadeIn">
						<div className="flex items-center gap-2">
							<span className="text-2xl">⚠️</span>
							<p className="text-red-700 font-medium">{error}</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CropYieldPredictor;
