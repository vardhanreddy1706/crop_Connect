import api from "./api";

export const placeBid = async (requirementId, bidData) => {
	const response = await api.post("/bids", {
		requirementId,
		...bidData,
	});
	return response.data;
};

export const getFarmerBids = async () => {
	const response = await api.get("/bids/farmer");
	return response.data;
};

export const getTractorOwnerBids = async () => {
	const response = await api.get("/bids/tractor-owner");
	return response.data;
};

export const acceptBid = async (bidId) => {
	const response = await api.post(`/bids/${bidId}/accept`);
	return response.data;
};

export const rejectBid = async (bidId) => {
	const response = await api.post(`/bids/${bidId}/reject`);
	return response.data;
};
