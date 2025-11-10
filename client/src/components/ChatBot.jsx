import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

export default function Chatbot() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const endRef = useRef();
	const inputRef = useRef();

	// Scroll to bottom on new message
	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, loading]);

	// Focus input when opened
	useEffect(() => {
		if (isOpen) {
			inputRef.current?.focus();
		}
	}, [isOpen]);

	// Welcome message when opened
	useEffect(() => {
		if (isOpen && messages.length === 0) {
			setMessages([
				{
					id: 1,
					text: "🌾 Hello! I'm your CropConnect Assistant. Ask me anything about farming, crops, soil, weather, or market prices!",
					sender: "bot",
					timestamp: new Date(),
				},
			]);
		}
	}, [isOpen, messages.length]);

	const handleSend = async (e) => {
		e.preventDefault();

		if (!input.trim()) return;

		const userMessage = {
			id: Date.now(),
			text: input.trim(),
			sender: "user",
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);
		setError(null);

		try {
			console.log("Sending message to API...");

			const response = await fetch("/api/crop-connect-chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ message: userMessage.text }),
			});

			console.log("API Response status:", response.status);

			if (!response.ok) {
				throw new Error(`Server error: ${response.status}`);
			}

			const data = await response.json();
			console.log("API Response data:", data);

			const botMessage = {
				id: Date.now() + 1,
				text: data.reply || "Sorry, I couldn't generate a response.",
				sender: "bot",
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, botMessage]);
		} catch (err) {
			console.error("Chat error:", err);

			const errorMessage = {
				id: Date.now() + 1,
				text: "😔 Sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
				sender: "bot",
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, errorMessage]);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend(e);
		}
	};

	return (
		<>
			{/* Chat Window (responsive: full-screen on mobile, fixed-size on desktop) */}
			<div
				className={`fixed z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 transform ${
					isOpen
						? "opacity-100 translate-x-0"
						: "opacity-0 pointer-events-none translate-x-4"
				} w-96 h-[500px] bottom-6 right-6 rounded-2xl max-sm:w-full max-sm:h-full max-sm:top-0 max-sm:left-0 max-sm:rounded-none`}
			>
				{/* Header */}
				<div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-5 rounded-t-2xl flex justify-between items-center shadow-md">
					<div className="flex items-center gap-3">
						<div className="bg-white bg-opacity-20 p-2 rounded-full">
							<MessageCircle size={24} />
						</div>
						<div>
							<h3 className="font-bold text-lg">CropConnect AI</h3>
							<p className="text-xs text-green-100">Your farming assistant</p>
						</div>
					</div>
					<button
						onClick={() => setIsOpen(false)}
						className="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				{/* Messages */}
				<div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
					{messages.map((msg) => (
						<div
							key={msg.id}
							className={`flex ${
								msg.sender === "user" ? "justify-end" : "justify-start"
							} animate-fadeIn`}
						>
							<div
								className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
									msg.sender === "user"
										? "bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-br-none"
										: "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
								}`}
							>
								<p className="text-sm leading-relaxed whitespace-pre-wrap">
									{msg.text}
								</p>
								<p
									className={`text-xs mt-1 ${
										msg.sender === "user" ? "text-green-100" : "text-gray-400"
									}`}
								>
									{msg.timestamp?.toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						</div>
					))}

					{loading && (
						<div className="flex justify-start animate-fadeIn">
							<div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
								<Loader2 className="animate-spin text-green-600" size={16} />
								<span className="text-sm text-gray-600">Thinking...</span>
							</div>
						</div>
					)}

					{error && (
						<div className="text-center">
							<p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
								{error}
							</p>
						</div>
					)}

					<div ref={endRef} />
				</div>

				{/* Input */}
				<form
					onSubmit={handleSend}
					className="p-4 border-t border-gray-200 bg-white rounded-b-2xl"
				>
					<div className="flex gap-2">
						<input
							ref={inputRef}
							type="text"
							className="flex-1 px-4 py-3 border-2 border-gray-500 text-gray-800 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyPress={handleKeyPress}
							disabled={loading}
							placeholder="Ask about crops, weather, prices..."
						/>
						<button
							type="submit"
							disabled={loading || !input.trim()}
							className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
						>
							{loading ? (
								<Loader2 className="animate-spin" size={20} />
							) : (
								<Send size={20} />
							)}
						</button>
					</div>
				</form>
			</div>

			{/* Toggle Button pinned to bottom-right */}
			{!isOpen && (
				<button
					aria-label="Open chat assistant"
					onClick={() => setIsOpen(true)}
					className="fixed z-50 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-full shadow-2xl hover:shadow-xl transition-all transform hover:scale-110 animate-bounce"
					style={{ bottom: 24, right: 24 }}
				>
					<MessageCircle size={28} />
				</button>
			)}

			<style jsx>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				.animate-fadeIn {
					animation: fadeIn 0.3s ease-out;
				}
			`}</style>
		</>
	);
}
