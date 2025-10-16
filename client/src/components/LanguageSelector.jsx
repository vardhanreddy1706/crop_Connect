import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Globe } from "lucide-react";

const LanguageSelector = () => {
	const { language, changeLanguage } = useLanguage();

	return (
		<div className="relative inline-block">
			<select
				value={language}
				onChange={(e) => changeLanguage(e.target.value)}
				className="appearance-none bg-white border-2 border-green-600 rounded-lg px-4 py-2 pr-10 text-gray-700 font-medium cursor-pointer hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
			>
				<option value="en">🇬🇧 English</option>
				<option value="hi">🇮🇳 हिंदी</option>
				<option value="te">🇮🇳 తెలుగు</option>
			</select>
			<Globe
				className="absolute right-3 top-2.5 pointer-events-none text-green-600"
				size={18}
			/>
		</div>
	);
};

export default LanguageSelector;
