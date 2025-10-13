import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import {
	CreditCard,
	TrendingUp,
	TrendingDown,
	Calendar,
	Filter,
	Search,
	Download,
	IndianRupee,
	ArrowUpRight,
	ArrowDownLeft,
	CheckCircle,
	Clock,
	XCircle,
	FileText,
} from "lucide-react";

function TransactionHistory() {
	const { user } = useAuth();
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [filterType, setFilterType] = useState("all"); // all, debit, credit
	const [searchQuery, setSearchQuery] = useState("");
	const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month

	useEffect(() => {
		if (user) {
			fetchTransactions();
		}
	}, [user]);

	const fetchTransactions = async () => {
		try {
			setLoading(true);
			setError(null);

			// Fetch all bookings and requirements
			const [
				tractorBookingsRes,
				workerBookingsRes,
				tractorRequirementsRes,
				workerRequirementsRes,
			] = await Promise.all([
				api.get("/bookings/farmer/tractors"),
				api.get("/bookings/farmer/workers"),
				api.get("/bookings/farmer/tractor-requirements"),
				api.get("/bookings/farmer/worker-requirements"),
			]);

			// Format transactions
			const tractorTransactions =
				tractorBookingsRes.data.bookings?.map((booking) => ({
					id: booking._id,
					type: "debit",
					category: "Tractor Rental",
					description: `${booking.workType || "Tractor Service"} - ${
						booking.serviceProvider?.name || "N/A"
					}`,
					amount: booking.totalCost || 0,
					status: booking.status,
					date: booking.bookingDate,
					createdAt: booking.createdAt,
					icon: "tractor",
				})) || [];

			const workerTransactions =
				workerBookingsRes.data.bookings?.map((booking) => ({
					id: booking._id,
					type: "debit",
					category: "Worker Service",
					description: `Worker Service - ${
						booking.serviceProvider?.name || "N/A"
					}`,
					amount: booking.totalCost || 0,
					status: booking.status,
					date: booking.bookingDate,
					createdAt: booking.createdAt,
					icon: "worker",
				})) || [];

			const tractorRequirementTxns =
				tractorRequirementsRes.data.requirements?.map((req) => ({
					id: req._id,
					type: "pending",
					category: "Tractor Request",
					description: `${req.workType} - Posted Requirement`,
					amount: req.maxBudget || 0,
					status: req.status,
					date: req.expectedDate,
					createdAt: req.createdAt,
					icon: "tractor",
					responses: req.responses || 0,
				})) || [];

			const workerRequirementTxns =
				workerRequirementsRes.data.requirements?.map((req) => ({
					id: req._id,
					type: "pending",
					category: "Worker Request",
					description: `${req.workType} - Posted Requirement`,
					amount: req.wagesOffered || 0,
					status: req.status,
					date: req.startDate,
					createdAt: req.createdAt,
					icon: "worker",
					applicants: req.applicants || 0,
				})) || [];

			// Combine and sort by date
			const allTransactions = [
				...tractorTransactions,
				...workerTransactions,
				...tractorRequirementTxns,
				...workerRequirementTxns,
			].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

			setTransactions(allTransactions);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to load transactions");
		} finally {
			setLoading(false);
		}
	};

	const filterTransactions = (txns) => {
		let filtered = txns;

		// Type filter
		if (filterType !== "all") {
			filtered = filtered.filter((txn) => txn.type === filterType);
		}

		// Search filter
		if (searchQuery) {
			filtered = filtered.filter(
				(txn) =>
					txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
					txn.category.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Date filter
		if (dateFilter !== "all") {
			const now = new Date();
			filtered = filtered.filter((txn) => {
				const txnDate = new Date(txn.createdAt);
				if (dateFilter === "today") {
					return txnDate.toDateString() === now.toDateString();
				} else if (dateFilter === "week") {
					const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					return txnDate >= weekAgo;
				} else if (dateFilter === "month") {
					const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					return txnDate >= monthAgo;
				}
				return true;
			});
		}

		return filtered;
	};

	const filteredTransactions = filterTransactions(transactions);

	// Calculate stats
	const totalSpent = transactions
		.filter((t) => t.type === "debit" && t.status === "completed")
		.reduce((sum, t) => sum + t.amount, 0);

	const pendingAmount = transactions
		.filter((t) => t.status === "pending")
		.reduce((sum, t) => sum + t.amount, 0);

	const completedCount = transactions.filter(
		(t) => t.status === "completed"
	).length;

	const getStatusColor = (status) => {
		const colors = {
			pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
			confirmed: "bg-blue-100 text-blue-800 border-blue-200",
			completed: "bg-green-100 text-green-800 border-green-200",
			cancelled: "bg-red-100 text-red-800 border-red-200",
			open: "bg-purple-100 text-purple-800 border-purple-200",
		};
		return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
	};

	const getStatusIcon = (status) => {
		const icons = {
			pending: <Clock className="w-3 h-3" />,
			confirmed: <CheckCircle className="w-3 h-3" />,
			completed: <CheckCircle className="w-3 h-3" />,
			cancelled: <XCircle className="w-3 h-3" />,
			open: <FileText className="w-3 h-3" />,
		};
		return icons[status] || <Clock className="w-3 h-3" />;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
					<p className="mt-4 text-gray-600 font-medium">
						Loading transactions...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
						<CreditCard className="w-10 h-10 text-green-600" />
						Transaction History
					</h1>
					<p className="text-gray-600">
						View and manage all your financial transactions
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Total Spent</p>
								<p className="text-3xl font-bold text-red-600 flex items-center gap-1">
									<IndianRupee className="w-6 h-6" />
									{totalSpent.toLocaleString("en-IN")}
								</p>
							</div>
							<div className="p-3 bg-red-100 rounded-lg">
								<TrendingDown className="w-6 h-6 text-red-600" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Pending Amount</p>
								<p className="text-3xl font-bold text-yellow-600 flex items-center gap-1">
									<IndianRupee className="w-6 h-6" />
									{pendingAmount.toLocaleString("en-IN")}
								</p>
							</div>
							<div className="p-3 bg-yellow-100 rounded-lg">
								<Clock className="w-6 h-6 text-yellow-600" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Completed</p>
								<p className="text-3xl font-bold text-green-600">
									{completedCount}
								</p>
							</div>
							<div className="p-3 bg-green-100 rounded-lg">
								<CheckCircle className="w-6 h-6 text-green-600" />
							</div>
						</div>
					</div>
				</div>

				{/* Filters */}
				<div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
					{/* Search Bar */}
					<div className="mb-6">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input
								type="text"
								placeholder="Search transactions..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
							/>
						</div>
					</div>

					<div className="flex flex-wrap gap-4 items-center justify-between">
						{/* Type Filter */}
						<div className="flex gap-2">
							<span className="flex items-center gap-2 text-gray-600 font-medium">
								<Filter className="w-4 h-4" />
								Type:
							</span>
							{["all", "debit", "pending"].map((type) => (
								<button
									key={type}
									onClick={() => setFilterType(type)}
									className={`px-4 py-2 rounded-lg font-medium transition-all ${
										filterType === type
											? "bg-green-600 text-white shadow-md"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
									{type.charAt(0).toUpperCase() + type.slice(1)}
								</button>
							))}
						</div>

						{/* Date Filter */}
						<div className="flex gap-2">
							<span className="flex items-center gap-2 text-gray-600 font-medium">
								<Calendar className="w-4 h-4" />
								Period:
							</span>
							{["all", "today", "week", "month"].map((period) => (
								<button
									key={period}
									onClick={() => setDateFilter(period)}
									className={`px-4 py-2 rounded-lg font-medium transition-all ${
										dateFilter === period
											? "bg-green-600 text-white shadow-md"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
									{period.charAt(0).toUpperCase() + period.slice(1)}
								</button>
							))}
						</div>

						{/* Export Button */}
						<button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
							<Download className="w-4 h-4" />
							Export
						</button>
					</div>
				</div>

				{/* Error Message */}
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
						{error}
					</div>
				)}

				{/* Transactions List */}
				{filteredTransactions.length === 0 ? (
					<div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
						<div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<CreditCard className="w-10 h-10 text-gray-400" />
						</div>
						<h3 className="text-xl font-semibold text-gray-900 mb-2">
							No transactions found
						</h3>
						<p className="text-gray-600">
							{searchQuery || filterType !== "all" || dateFilter !== "all"
								? "Try adjusting your filters"
								: "Your transaction history will appear here"}
						</p>
					</div>
				) : (
					<div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 border-b border-gray-200">
									<tr>
										<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
											Date
										</th>
										<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
											Description
										</th>
										<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
											Category
										</th>
										<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
											Status
										</th>
										<th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
											Amount
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{filteredTransactions.map((transaction) => (
										<tr
											key={transaction.id}
											className="hover:bg-gray-50 transition-colors"
										>
											<td className="px-6 py-4 text-sm text-gray-600">
												{new Date(transaction.createdAt).toLocaleDateString(
													"en-IN",
													{
														day: "numeric",
														month: "short",
														year: "numeric",
													}
												)}
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-3">
													<div
														className={`p-2 rounded-lg ${
															transaction.type === "debit"
																? "bg-red-100"
																: "bg-purple-100"
														}`}
													>
														{transaction.type === "debit" ? (
															<ArrowUpRight
																className={`w-4 h-4 ${
																	transaction.type === "debit"
																		? "text-red-600"
																		: "text-purple-600"
																}`}
															/>
														) : (
															<FileText
																className={`w-4 h-4 ${
																	transaction.type === "debit"
																		? "text-red-600"
																		: "text-purple-600"
																}`}
															/>
														)}
													</div>
													<div>
														<p className="text-sm font-medium text-gray-900">
															{transaction.description}
														</p>
														{transaction.type === "pending" && (
															<p className="text-xs text-gray-500">
																{transaction.responses
																	? `${transaction.responses} responses`
																	: transaction.applicants
																	? `${transaction.applicants} applicants`
																	: ""}
															</p>
														)}
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
													{transaction.category}
												</span>
											</td>
											<td className="px-6 py-4">
												<span
													className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStatusColor(
														transaction.status
													)}`}
												>
													{getStatusIcon(transaction.status)}
													{transaction.status}
												</span>
											</td>
											<td className="px-6 py-4 text-right">
												<p
													className={`text-sm font-semibold flex items-center justify-end gap-1 ${
														transaction.type === "debit"
															? "text-red-600"
															: "text-purple-600"
													}`}
												>
													<IndianRupee className="w-4 h-4" />
													{transaction.amount.toLocaleString("en-IN")}
												</p>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default TransactionHistory;
