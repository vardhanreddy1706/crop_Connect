import api from "../config/api";

export const subscriptionService = {
  subscribe: async (email, source = "footer") => {
    const { data } = await api.post("/subscriptions/subscribe", { email, source });
    return data;
  },
};
