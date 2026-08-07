import React, { useState, useEffect, useMemo } from "react";
import api from "./services/api";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useMediaQuery } from "@material-ui/core";
import ColorModeContext from "./layout/themeContext";
import { ActiveMenuProvider } from "./context/ActiveMenuContext";
import Favicon from "react-favicon";
import { getBackendUrl } from "./config";
import Routes from "./routes";
import defaultLogoLight from "./assets/logo.png";
import defaultLogoDark from "./assets/logo-black.png";
import defaultLogoFavicon from "./assets/favicon.ico";
import useSettings from "./hooks/useSettings";
import applyTokens from "./design-system/applyTokens";
import {
  muiPaletteFromTokens,
  muiTypographyFromTokens,
  muiShapeFromTokens,
} from "./design-system/muiThemeFromTokens";
import overridesFromTokens, { muiPropsDefaults } from "./design-system/muiOverrides";
import { resolveBrand } from "./design-system/brand";

const queryClient = new QueryClient();

const App = () => {
  const [locale, setLocale] = useState();
  // Vazio significa "usar o token de marca do design system".
  const appColorLocalStorage = localStorage.getItem("primaryColorLight") || localStorage.getItem("primaryColorDark") || "";
  const appNameLocalStorage = localStorage.getItem("appName") || "";
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const [mode, setMode] = useState(preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light");
  const [primaryColorLight, setPrimaryColorLight] = useState(appColorLocalStorage);
  const [primaryColorDark, setPrimaryColorDark] = useState(appColorLocalStorage);
  const [appLogoLight, setAppLogoLight] = useState(defaultLogoLight);
  const [appLogoDark, setAppLogoDark] = useState(defaultLogoDark);
  const [appLogoFavicon, setAppLogoFavicon] = useState(defaultLogoFavicon);
  const [appName, setAppName] = useState(appNameLocalStorage);
  const { getPublicSetting } = useSettings();
  // Estado para controlar o prompt de instalação do PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          window.localStorage.setItem("preferredTheme", newMode); // Persistindo o tema no localStorage
          return newMode;
        });
      },
      setPrimaryColorLight,
      setPrimaryColorDark,
      setAppLogoLight,
      setAppLogoDark,
      setAppLogoFavicon,
      setAppName,
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      mode,
    }),
    [appLogoLight, appLogoDark, appLogoFavicon, appName, mode]
  );

  // Cor de whitelabel do tenant, vazia quando ele não configurou nenhuma.
  // Alimenta o tema do Material UI e as custom properties, para que a marca do
  // cliente valha nas 44 telas e não só nas migradas.
  const tenantColor = mode === "light" ? primaryColorLight : primaryColorDark;

  const theme = useMemo(
    () =>
      createTheme(
        {
          scrollbarStyles: {
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)",
              backgroundColor: mode === "light" ? primaryColorLight : primaryColorDark,
            },
          },
          scrollbarStylesSoft: {
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: mode === "light" ? "#F3F3F3" : "#333333",
            },
          },
          // Paleta, tipografia e raio vêm dos tokens do design system
          // (ADR-0004). Isso mantém as telas ainda não migradas visualmente
          // coerentes com as migradas, em vez de conviverem duas identidades
          // durante a transição.
          palette: muiPaletteFromTokens(mode, tenantColor),
          typography: muiTypographyFromTokens(),
          shape: muiShapeFromTokens(),
          props: muiPropsDefaults,
          overrides: overridesFromTokens(mode, tenantColor),
          mode,
          appLogoLight,
          appLogoDark,
          appLogoFavicon,
          appName,
          calculatedLogoDark: () => {
            if (appLogoDark === defaultLogoDark && appLogoLight !== defaultLogoLight) {
              return appLogoLight;
            }
            return appLogoDark;
          },
          calculatedLogoLight: () => {
            if (appLogoDark !== defaultLogoDark && appLogoLight === defaultLogoLight) {
              return appLogoDark;
            }
            return appLogoLight;
          },
        },
        locale
      ),
    [appLogoLight, appLogoDark, appLogoFavicon, appName, locale, mode, tenantColor, primaryColorDark, primaryColorLight]
  );

  // Detecta quando o navegador está pronto para mostrar o prompt de instalação do PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Previne o comportamento padrão do navegador
      e.preventDefault();
      // Armazena o evento para uso posterior
      setDeferredPrompt(e);
      
      // Mostra o prompt de instalação imediatamente
      setTimeout(() => {
        showInstallPrompt();
      }, 2000); // Pequeno delay para garantir que a página já carregou
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Função para mostrar o prompt de instalação
  const showInstallPrompt = () => {
    if (deferredPrompt) {
      // Verifica se o PWA já está instalado
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        // Mostra o prompt de instalação
        deferredPrompt.prompt();
        
        // Espera pela resposta do usuário
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('Usuário aceitou instalar o app');
          } else {
            console.log('Usuário recusou instalar o app');
          }
          // Limpa o prompt armazenado, só pode ser usado uma vez
          setDeferredPrompt(null);
        });
      }
    }
  };

  useEffect(() => {
    // O produto é brasileiro: pt é o padrão, e a ausência da chave não pode
    // quebrar o boot (antes um `substring` em null derrubava o App).
    const i18nlocale = localStorage.getItem("i18nextLng") || "pt";
    if (i18nlocale.startsWith("pt")) {
      setLocale(ptBR);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("preferredTheme", mode);
    document.documentElement.setAttribute("data-konnex-theme", mode);
  }, [mode]);

  useEffect(() => {
    console.log("|=========== handleSaveSetting ==========|")
    console.log("APP START")
    console.log("|========================================|")
   
    
    getPublicSetting("primaryColorLight")
      .then((color) => {
        // Sem cor configurada pelo tenant, o padrão é o token de marca do
        // design system. O default anterior era #0000FF (azul puro), que
        // sobrescrevia a identidade com uma cor que ninguém escolheu.
        setPrimaryColorLight(color || "");
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("primaryColorDark")
      .then((color) => {
        setPrimaryColorDark(color || "");
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoLight")
      .then((file) => {
        setAppLogoLight(file ? getBackendUrl() + "/public/" + file : defaultLogoLight);
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoDark")
      .then((file) => {
        setAppLogoDark(file ? getBackendUrl() + "/public/" + file : defaultLogoDark);
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoFavicon")
      .then((file) => {
        setAppLogoFavicon(file ? getBackendUrl() + "/public/" + file : defaultLogoFavicon);
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appName")
      .then((name) => {
        setAppName(name || "Konnex");
      })
      .catch((error) => {
        console.log("!==== Erro ao carregar temas: ====!", error);
        setAppName("Konnex");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Publica os tokens do design system como custom properties. Roda antes do
  // whitelabel de cor abaixo, para que a cor por tenant possa sobrescrever a
  // marca sem afetar superfícies, texto, bordas e sinais de status.
  useEffect(() => {
    applyTokens(mode);
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    const brand = resolveBrand(mode, tenantColor);

    root.style.setProperty("--primaryColor", brand.base);
    // Whitelabel: a cor do tenant substitui apenas a marca. Os sinais de
    // conexão, entrega e falha permanecem constantes — são semântica de
    // produto, não identidade de cliente.
    //
    // A escala inteira é reescrita, não só a base: com apenas `--brand-base`
    // trocada, o hover e o estado ativo continuariam no azul do token e o botão
    // mudaria de cor ao passar o mouse.
    root.style.setProperty("--brand-base", brand.base);
    root.style.setProperty("--brand-hover", brand.hover);
    root.style.setProperty("--brand-active", brand.active);
    root.style.setProperty("--brand-soft", brand.soft);
    root.style.setProperty("--on-brand", brand.onBrand);
  }, [tenantColor, mode]);

  useEffect(() => {
    async function fetchVersionData() {
      try {
        const response = await api.get("/version");
        const { data } = response;
        window.localStorage.setItem("frontendVersion", data.version);
      } catch (error) {
        console.log("Error fetching data", error);
      }
    }
    fetchVersionData();
  }, []);

  return (
    <>
      <Favicon url={appLogoFavicon || defaultLogoFavicon} />
      <ColorModeContext.Provider value={{ colorMode }}>
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <ActiveMenuProvider>
  <div style={{ position: "relative", overflow: "visible", zIndex: 0, minHeight: "100vh" }}>
    <Routes />
  </div>
            </ActiveMenuProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </>
  );
};

export default App;
