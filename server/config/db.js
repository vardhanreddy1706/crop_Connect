const mongoose = require("mongoose");

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		console.log(` MongoDB Connected Successfully!`);
		console.log(`Database: ${conn.connection.db.databaseName}`);
		console.log(` Host: ${conn.connection.host}`);
		console.log(`Collections will be auto-created on first data insert`);

		// List existing collections
		const collections = await conn.connection.db.listCollections().toArray();
		console.log(
			` Existing Collections: ${
				collections.length > 0
					? collections.map((c) => c.name).join(", ")
					: "None yet"
			}`
		);
	} catch (error) {
		console.error(` MongoDB Connection Error: ${error.message}`);
		process.exit(1);
	}
};

module.exports = connectDB;
