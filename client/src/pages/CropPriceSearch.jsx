import React, { useState, useEffect } from "react";

const CropPriceSearch = () => {
	const [priceData, setPriceData] = useState([]);
	const [filteredData, setFilteredData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchFilters, setSearchFilters] = useState({
		state: "",
		district: "",
		commodity: "",
		market: "",
	});

	const [uniqueValues, setUniqueValues] = useState({
		states: [],
		districts: [],
		commodities: [],
		markets: [],
	});

	const API_KEY = "579b464db66ec23bdd000001c1cf9a43e05746694f244a7f25d954f9";
	const API_URL = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&limit=all`;

	// Fetch data from Government API
	const fetchPriceData = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(API_URL);
			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}
			const data = await response.json();

			if (data.records) {
				setPriceData(data.records);
				setFilteredData(data.records);

				// Extract unique values for dropdowns
				const states = [...new Set(data.records.map((r) => r.state))].sort();
				const commodities = [
					...new Set(data.records.map((r) => r.commodity)),
				].sort();
				const markets = [...new Set(data.records.map((r) => r.market))].sort();

				setUniqueValues({
					states,
					commodities,
					markets,
					districts: [],
				});
			} else {
				setError("No price data found");
			}
		} catch (err) {
			setError(err.message || "Failed to fetch prices");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPriceData();
	}, []);

	// Update districts when state changes
	useEffect(() => {
		if (searchFilters.state) {
			const districts = [
				...new Set(
					priceData
						.filter((r) => r.state === searchFilters.state)
						.map((r) => r.district)
				),
			].sort();
			setUniqueValues((prev) => ({
				...prev,
				districts,
			}));
			setSearchFilters((prev) => ({
				...prev,
				district: "",
			}));
		} else {
			setUniqueValues((prev) => ({
				...prev,
				districts: [],
			}));
		}
	}, [searchFilters.state, priceData]);

	// Handle filter change
	const handleFilterChange = (e) => {
		const { name, value } = e.target;
		setSearchFilters((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Apply filters
	useEffect(() => {
		let filtered = priceData;

		if (searchFilters.state) {
			filtered = filtered.filter((r) => r.state === searchFilters.state);
		}
		if (searchFilters.district) {
			filtered = filtered.filter((r) => r.district === searchFilters.district);
		}
		if (searchFilters.commodity) {
			filtered = filtered.filter((r) =>
				r.commodity
					.toLowerCase()
					.includes(searchFilters.commodity.toLowerCase())
			);
		}
		if (searchFilters.market) {
			filtered = filtered.filter((r) =>
				r.market.toLowerCase().includes(searchFilters.market.toLowerCase())
			);
		}

		setFilteredData(filtered);
	}, [searchFilters, priceData]);

	// Calculate price trend
	const calculateTrend = (minPrice, modalPrice) => {
		const min = parseInt(minPrice) || 0;
		const modal = parseInt(modalPrice) || 0;
		const trend = ((modal - min) / min) * 100;
		return isFinite(trend) ? trend.toFixed(2) : 0;
	};

	// Reset filters
	const handleResetFilters = () => {
		setSearchFilters({
			state: "",
			district: "",
			commodity: "",
			market: "",
		});
		setFilteredData(priceData);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-green-800 mb-2">
						Real-Time Crop Prices India
					</h1>
					<p className="text-gray-600">
						Live market data from Government of India - Agricultural Markets
					</p>
				</div>

				{/* Search Filters */}
				<div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-green-200">
					<h2 className="text-lg font-bold text-gray-800 mb-4">
						Search & Filter
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						{/* State Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								State
							</label>
							<select
								name="state"
								value={searchFilters.state}
								onChange={handleFilterChange}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
							>
								<option value="">All States</option>
								{uniqueValues.states.map((state) => (
									<option key={state} value={state}>
										{state}
									</option>
								))}
							</select>
						</div>

						{/* District Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								District
							</label>
							<select
								name="district"
								value={searchFilters.district}
								onChange={handleFilterChange}
								disabled={!searchFilters.state}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-100"
							>
								<option value="">All Districts</option>
								{uniqueValues.districts.map((district) => (
									<option key={district} value={district}>
										{district}
									</option>
								))}
							</select>
						</div>

						{/* Commodity Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Commodity
							</label>
							<input
								type="text"
								name="commodity"
								placeholder="Search commodity..."
								value={searchFilters.commodity}
								onChange={handleFilterChange}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
							/>
						</div>

						{/* Market Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Market
							</label>
							<input
								type="text"
								name="market"
								placeholder="Search market..."
								value={searchFilters.market}
								onChange={handleFilterChange}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
							/>
						</div>

						{/* Reset Button */}
						<div className="flex items-end">
							<button
								onClick={handleResetFilters}
								className="w-full px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
							>
								Reset
							</button>
						</div>
					</div>
				</div>

				{/* Loading State */}
				{loading && (
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
							<p className="text-gray-600 font-medium">
								Loading crop prices...
							</p>
						</div>
					</div>
				)}

				{/* Error State */}
				{error && !loading && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
						<h3 className="font-semibold text-red-800 mb-2">Error</h3>
						<p className="text-red-700">{error}</p>
						<button
							onClick={fetchPriceData}
							className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
						>
							Try Again
						</button>
					</div>
				)}

				{/* No Results */}
				{!loading &&
					!error &&
					filteredData.length === 0 &&
					priceData.length > 0 && (
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
							<p className="text-yellow-800 font-medium">
								No prices found for the selected filters
							</p>
						</div>
					)}

				{/* Results Summary */}
				{!loading && !error && priceData.length > 0 && (
					<div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
						<p>
							<strong>Showing:</strong> {filteredData.length} results out of{" "}
							{priceData.length} total
						</p>
					</div>
				)}

				{/* Price Data Table with Scroll */}
				{!loading && !error && filteredData.length > 0 && (
					<div className="bg-white rounded-xl shadow-lg border border-green-100">
						<div className="overflow-hidden">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 sticky top-0 z-10">
										<th className="px-4 py-3 text-left text-sm font-semibold text-white">
											State
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-white">
											District
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-white">
											Market
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-white">
											Commodity
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-white">
											Min Price
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-white">
											Max Price
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-white">
											Modal Price
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-white">
											Trend
										</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-white">
											Date
										</th>
									</tr>
								</thead>
							</table>
						</div>

						{/* Scrollable Body Container */}
						<div className="overflow-y-auto" style={{ height: "560px" }}>
							<table className="w-full">
								<tbody>
									{filteredData.slice(0, 15).map((item, idx) => {
										const trend = calculateTrend(
											item.min_price,
											item.modal_price
										);
										const isPositive = trend >= 0;

										return (
											<tr
												key={idx}
												className="border-b border-gray-100 hover:bg-green-50 transition"
											>
												<td className="px-4 py-3 text-sm text-gray-800 font-medium">
													{item.state}
												</td>
												<td className="px-4 py-3 text-sm text-gray-700">
													{item.district}
												</td>
												<td className="px-4 py-3 text-sm text-gray-700">
													{item.market}
												</td>
												<td className="px-4 py-3 text-sm text-gray-800 font-medium">
													{item.commodity}
												</td>
												<td className="px-4 py-3 text-sm">
													<span className="bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
														₹{item.min_price}
													</span>
												</td>
												<td className="px-4 py-3 text-sm">
													<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
														₹{item.max_price}
													</span>
												</td>
												<td className="px-4 py-3 text-sm">
													<span className="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
														₹{item.modal_price}
													</span>
												</td>
												<td className="px-4 py-3 text-sm">
													<span
														className={`font-semibold ${
															isPositive ? "text-green-600" : "text-red-600"
														}`}
													>
														{isPositive ? "▲" : "▼"} {trend}%
													</span>
												</td>
												<td className="px-4 py-3 text-sm text-gray-700">
													{item.arrival_date}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						{/* Info Footer */}
						{filteredData.length > 15 && (
							<div className="bg-gray-50 px-4 py-3 text-sm text-gray-600 border-t border-gray-200">
								Showing 15 of {filteredData.length} results (Use scrollbar to
								view)
							</div>
						)}
					</div>
				)}

				{/* Data Info */}
				{!loading && !error && priceData.length > 0 && (
					<div className="mt-6 text-center text-sm text-gray-600">
						<p>
							Data source: Government of India - Ministry of Agriculture &
							Farmers Welfare
						</p>
						<p>Last updated: {new Date().toLocaleDateString("en-IN")}</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default CropPriceSearch;
