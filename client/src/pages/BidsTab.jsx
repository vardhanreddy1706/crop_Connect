import React, { useState, useEffect } from "react";
import { getFarmerBids, acceptBid, rejectBid } from "../services/bidService";
import {
	Phone,
	Calendar,
	MapPin,
	DollarSign,
	Clock,
	CheckCircle,
	XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const BidsTab = () => {
	const [bids, setBids] = useState([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(null);
	const [filter, setFilter] = useState("all"); // all, pending, accepted, rejected

	useEffect(() => {
		fetchBids();
	}, []);

	const fetchBids = async () => {
		try {
			setLoading(true);
			const data = await getFarmerBids();
			setBids(data.bids || []);
		} catch (error) {
			console.error("Fetch bids error:", error);
			toast.error("Failed to load bids");
		} finally {
			setLoading(false);
		}
	};

	const handleAcceptBid = async (bidId) => {
		if (!window.confirm("Accept this bid and create booking?")) return;

		try {
			setActionLoading(bidId);
			const response = await acceptBid(bidId);
			toast.success(
				`🎉 Bid accepted! Booking ${response.booking._id} created successfully`
			);
			fetchBids();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to accept bid");
		} finally {
			setActionLoading(null);
		}
	};


	const handleRejectBid = async (bidId) => {
		if (!window.confirm("Reject this bid?")) return;

		try {
			setActionLoading(bidId);
			await rejectBid(bidId);
			toast.success("Bid rejected");
			fetchBids();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to reject bid");
		} finally {
			setActionLoading(null);
		}
	};

	const filteredBids = bids.filter((bid) => {
		if (filter === "all") return true;
		return bid.status === filter;
	});

	const getStatusBadge = (status) => {
		const badges = {
			pending: "bg-yellow-100 text-yellow-800",
			accepted: "bg-green-100 text-green-800",
			rejected: "bg-red-100 text-red-800",
			cancelled: "bg-gray-100 text-gray-800",
		};
		return badges[status] || "bg-gray-100 text-gray-800";
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-gray-800">💰 Received Bids</h2>
				<div className="flex gap-2">
					<button
						onClick={() => setFilter("all")}
						className={`px-4 py-2 rounded-lg font-medium ${
							filter === "all"
								? "bg-green-600 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
					>
						All ({bids.length})
					</button>
					<button
						onClick={() => setFilter("pending")}
						className={`px-4 py-2 rounded-lg font-medium ${
							filter === "pending"
								? "bg-yellow-600 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
					>
						Pending ({bids.filter((b) => b.status === "pending").length})
					</button>
					<button
						onClick={() => setFilter("accepted")}
						className={`px-4 py-2 rounded-lg font-medium ${
							filter === "accepted"
								? "bg-green-600 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						}`}
					>
						Accepted ({bids.filter((b) => b.status === "accepted").length})
					</button>
				</div>
			</div>

			{/* Bids List */}
			{filteredBids.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 rounded-xl">
					<p className="text-gray-500 text-lg">
						{filter === "all" ? "No bids received yet" : `No ${filter} bids`}
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{filteredBids.map((bid) => (
						<div
							key={bid._id}
							className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
						>
							<div className="flex justify-between items-start mb-4">
								<div>
									<h3 className="text-xl font-bold text-gray-800 mb-1">
										{bid.requirementId?.workType || "Work"}
									</h3>
									<span
										className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
											bid.status
										)}`}
									>
										{bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
									</span>
								</div>
								<div className="text-right">
									<p className="text-2xl font-bold text-green-600">
										₹{bid.proposedAmount}
									</p>
									<p className="text-sm text-gray-500">Proposed Amount</p>
								</div>
							</div>

							{/* Tractor Owner Info */}
							<div className="bg-blue-50 rounded-lg p-4 mb-4">
								<p className="text-sm text-gray-600 mb-2">Bid from:</p>
								<p className="font-semibold text-gray-800">
									{bid.tractorOwnerId?.name}
								</p>
								<p className="text-sm text-gray-600">
									📞 {bid.tractorOwnerId?.phone}
								</p>
							</div>

							{/* Bid Details */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
								<div className="flex items-center gap-2">
									<Clock className="w-4 h-4 text-gray-500" />
									<div>
										<p className="text-xs text-gray-500">Duration</p>
										<p className="font-medium text-gray-800">
											{bid.proposedDuration}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Calendar className="w-4 h-4 text-gray-500" />
									<div>
										<p className="text-xs text-gray-500">Proposed Date</p>
										<p className="font-medium text-gray-800">
											{new Date(bid.proposedDate).toLocaleDateString()}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<MapPin className="w-4 h-4 text-gray-500" />
									<div>
										<p className="text-xs text-gray-500">Land Size</p>
										<p className="font-medium text-gray-800">
											{bid.requirementId?.landSize} acres
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Calendar className="w-4 h-4 text-gray-500" />
									<div>
										<p className="text-xs text-gray-500">Bid Placed</p>
										<p className="font-medium text-gray-800">
											{new Date(bid.createdAt).toLocaleDateString()}
										</p>
									</div>
								</div>
							</div>

							{/* Message */}
							{bid.message && (
								<div className="bg-gray-50 rounded-lg p-3 mb-4">
									<p className="text-sm text-gray-700">
										<strong>Message:</strong> {bid.message}
									</p>
								</div>
							)}

							{/* Action Buttons */}
							<div className="flex gap-3">
								{bid.status === "pending" ? (
									<>
										<button
											onClick={() => handleAcceptBid(bid._id)}
											disabled={actionLoading === bid._id}
											className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										>
											<CheckCircle className="w-5 h-5" />
											{actionLoading === bid._id
												? "Processing..."
												: "Accept Bid"}
										</button>
										<button
											onClick={() => handleRejectBid(bid._id)}
											disabled={actionLoading === bid._id}
											className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										>
											<XCircle className="w-5 h-5" />
											{actionLoading === bid._id ? "Processing..." : "Reject"}
										</button>
										<a
											href={`tel:${bid.tractorOwnerId?.phone}`}
											className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
										>
											<Phone className="w-5 h-5" />
											Call
										</a>
									</>
								) : bid.status === "accepted" ? (
									<div className="flex-1 bg-green-100 text-green-800 px-6 py-3 rounded-lg font-medium text-center">
										✅ Bid Accepted - Booking Created!
									</div>
								) : (
									<div className="flex-1 bg-gray-100 text-gray-600 px-6 py-3 rounded-lg font-medium text-center">
										❌ Bid {bid.status}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default BidsTab;
