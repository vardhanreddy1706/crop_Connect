const ImageKit = require("imagekit");

const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } =
	process.env;
if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
	const missing = [
		!IMAGEKIT_PUBLIC_KEY && "IMAGEKIT_PUBLIC_KEY",
		!IMAGEKIT_PRIVATE_KEY && "IMAGEKIT_PRIVATE_KEY",
		!IMAGEKIT_URL_ENDPOINT && "IMAGEKIT_URL_ENDPOINT",
	]
		.filter(Boolean)
		.join(", ");
	throw new Error(
		`ImageKit env missing: ${missing}. Ensure .env is loaded before requiring this file.`
	);
}

module.exports = new ImageKit({
	publicKey: IMAGEKIT_PUBLIC_KEY,
	privateKey: IMAGEKIT_PRIVATE_KEY,
	urlEndpoint: IMAGEKIT_URL_ENDPOINT,
});
