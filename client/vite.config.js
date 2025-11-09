import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mkcert from "vite-plugin-mkcert";


export default defineConfig({
	plugins: [react(), tailwindcss(), mkcert()],
	resolve: {
		extensions: [".jsx", ".js", ".ts", ".tsx", ".json"],
	},
	server: {
		// Allow Vite to run on any available port
		port: 5173,
		strictPort: false, // Try next available port if 5173 is busy
		host: true, // Listen on all addresses including localhost and 127.0.0.1
		open: false, // Don't auto-open browser
		proxy: {
			"/api": {
				target: "http://localhost:8000",
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/api/, "/api"),
				configure: (proxy, options) => {
					proxy.on('error', (err, req, res) => {
						console.log('Proxy error:', err);
					});
					proxy.on('proxyReq', (proxyReq, req, res) => {
						console.log('Proxying:', req.method, req.url);
					});
				},
			},
		},
		cors: true, // Enable CORS for dev server
	},
	build: {
		outDir: 'dist',
		sourcemap: true,
		// Increase chunk size warning limit
		chunkSizeWarningLimit: 1000,
	},
	optimizeDeps: {
		include: ['react', 'react-dom', 'react-router-dom'],
	},
});





