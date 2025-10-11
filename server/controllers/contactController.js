const Contact = require("../models/Contact");

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
exports.submitContact = async (req, res) => {
	try {
		const contact = await Contact.create(req.body);

		res.status(201).json({
			success: true,
			message:
				"Your message has been sent successfully. We will contact you soon.",
			contact,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get all contact messages (Admin)
// @route   GET /api/contact
// @access  Private/Admin
exports.getAllContacts = async (req, res) => {
	try {
		const contacts = await Contact.find().sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: contacts.length,
			contacts,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
