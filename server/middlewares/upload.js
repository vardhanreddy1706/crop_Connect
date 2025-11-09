const multer = require("multer");

// keep file in memory; we'll send the buffer to ImageKit
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
