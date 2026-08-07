import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { messages } from "./languages";

// O produto é vendido no Brasil: o idioma padrão é pt, e a preferência salva
// pelo próprio usuário tem prioridade sobre o que o navegador informa. Antes
// disso o detector seguia o locale do navegador, então um cliente com Chrome
// em inglês via o CRM inteiro em inglês mesmo com "Português" no seletor.
i18n.use(LanguageDetector).init({
	debug: false,
	defaultNS: ["translations"],
	lng: localStorage.getItem("i18nextLng") || "pt",
	fallbackLng: "pt",
	supportedLngs: ["pt", "en", "es", "tr"],
	nonExplicitSupportedLngs: true,
	detection: {
		order: ["localStorage", "htmlTag"],
		lookupLocalStorage: "i18nextLng",
		caches: ["localStorage"],
	},
	ns: ["translations"],
	resources: messages,
});

export { i18n };
