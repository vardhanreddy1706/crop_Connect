const router = require("express").Router();
const { subscribe, list } = require("../controllers/subscriptionController");

// POST /api/subscriptions/subscribe
router.post("/subscribe", subscribe);

// GET /api/subscriptions (simple listing for admin/debug)
router.get("/", list);

module.exports = router;
