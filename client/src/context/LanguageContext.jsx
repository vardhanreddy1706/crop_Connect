/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";

import hi from "../locales/hi.json";
import te from "../locales/te.json";

const LanguageContext = createContext();

const translations = {  hi, te };

export const LanguageProvider = ({ children }) => {
	const [language, setLanguage] = useState(() => {
		// Load saved language from localStorage
		return localStorage.getItem("appLanguage") || "en";
	});

	useEffect(() => {
		// Save language preference
		localStorage.setItem("appLanguage", language);
		// Update HTML lang attribute
		document.documentElement.lang = language;
	}, [language]);

	const t = (key) => {
		const keys = key.split(".");
		let translation = translations[language];

		for (const k of keys) {
			translation = translation?.[k];
		}

		return translation || key;
	};

	const changeLanguage = (lang) => {
		if (translations[lang]) {
			setLanguage(lang);
		}
	};

	return (
		<LanguageContext.Provider value={{ language, changeLanguage, t }}>
			{children}
		</LanguageContext.Provider>
	);
};

 const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error("useLanguage must be used within LanguageProvider");
	}
	return context;
};

export default LanguageProvider;
export { useLanguage };