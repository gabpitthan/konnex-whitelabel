import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Avatar, Badge, IconButton, Menu, MenuItem, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import MenuIcon from "@material-ui/icons/Menu";
import CloseIcon from "@material-ui/icons/Close";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import CachedIcon from "@material-ui/icons/Cached";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import { i18n } from "../translate/i18n";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";
import ChatPopover from "../pages/Chat/ChatPopover";
import UserLanguageSelector from "../components/UserLanguageSelector";
import ColorModeContext from "./themeContext";
import { getBackendUrl } from "../config";
import VersionControl from "../components/VersionControl";

const backendUrl = getBackendUrl();
const menuWidth = 236;
const compactWidth = 68;

/**
 * Estilos do casco da aplicação, escritos sobre os tokens do design system
 * (ADR-0004). `makeStyles` aceita `var(--token)`, então o casco acompanha o
 * tema sem precisar sair do Material UI de uma vez.
 *
 * O que mudou em relação ao layout anterior, e por quê:
 * - a barra com gradiente decorativo saiu: não carregava informação;
 * - a navegação passou a viver sobre superfície recuada, para o conteúdo ficar
 *   sendo a camada mais clara e portanto o foco;
 * - a topbar deixou de empilhar sete ícones soltos e passou a separar
 *   contexto (esquerda) de ações (direita) com um divisor real.
 */
const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    height: "100dvh",
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: (props) => `${props.compact ? compactWidth : menuWidth}px minmax(0, 1fr)`,
    overflow: "hidden",
    background: "var(--surface-page)",
    transition: "grid-template-columns var(--duration-normal) var(--ease-standard)",
    [theme.breakpoints.down("sm")]: { display: "block" },
  },
  sidebar: {
    position: "relative",
    minHeight: 0,
    overflow: "hidden",
    background: "var(--surface-sunken)",
    borderRight: "1px solid var(--border-subtle)",
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  collapseButton: {
    position: "absolute",
    zIndex: 2,
    bottom: "var(--space-6)",
    right: "var(--space-5)",
    width: 24,
    height: 24,
    padding: 0,
    borderRadius: "var(--radius-md)",
    color: "var(--text-muted)",
    background: "var(--surface-raised)",
    border: "1px solid var(--border-subtle)",
    "&:hover": { color: "var(--text-primary)", background: "var(--surface-hover)" },
    "& .MuiSvgIcon-root": { fontSize: 15 },
  },
  stage: {
    minWidth: 0,
    minHeight: 0,
    height: "100dvh",
    display: "grid",
    gridTemplateRows: "var(--topbar-height) minmax(0,1fr)",
    overflow: "hidden",
  },
  topbar: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    padding: "0 var(--space-6)",
    background: "var(--surface-raised)",
    borderBottom: "1px solid var(--border-subtle)",
    [theme.breakpoints.down("sm")]: {
      height: 52,
      padding: "0 var(--space-3) 0 max(var(--space-3), env(safe-area-inset-left))",
    },
  },
  mobileMenuButton: {
    display: "none",
    color: "var(--text-secondary)",
    [theme.breakpoints.down("sm")]: { display: "inline-flex" },
  },
  context: { minWidth: 0, flex: 1, display: "flex", alignItems: "center" },
  title: {
    overflow: "hidden",
    color: "var(--text-primary)",
    fontSize: "var(--text-md)",
    fontWeight: 600,
    letterSpacing: "var(--tracking-tight)",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: 1.3,
  },
  crumb: {
    display: "block",
    color: "var(--text-muted)",
    fontSize: "var(--text-2xs)",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  // Separa contexto de ações. Sem isso a topbar vira uma fileira de ícones sem
  // hierarquia, que foi uma das queixas do layout anterior.
  utilities: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-1)",
    paddingLeft: "var(--space-5)",
    marginLeft: "var(--space-4)",
    borderLeft: "1px solid var(--border-subtle)",
    color: "var(--text-secondary)",
    "& .MuiIconButton-root": { color: "var(--text-secondary)", padding: 7 },
    "& .MuiIconButton-root:hover": {
      color: "var(--text-primary)",
      background: "var(--surface-hover)",
    },
    "& .MuiSvgIcon-root": { fontSize: 19 },
    [theme.breakpoints.down("sm")]: {
      paddingLeft: 0,
      marginLeft: 0,
      borderLeft: "none",
    },
  },
  desktopUtility: {
    display: "inline-flex",
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  avatar: {
    width: 28,
    height: 28,
    cursor: "pointer",
    marginLeft: "var(--space-3)",
    border: "1px solid var(--border-default)",
  },
  content: {
    minWidth: 0,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    overscrollBehavior: "contain",
    WebkitOverflowScrolling: "touch",
    background: "var(--surface-page)",
    ...theme.scrollbarStyles,
  },
  backdrop: {
    position: "fixed",
    zIndex: "var(--z-overlay)",
    inset: 0,
    background: "hsl(var(--shadow-color) / 0.55)",
  },
  drawer: {
    position: "absolute",
    inset: "0 auto 0 0",
    width: "min(86vw, 300px)",
    minHeight: 0,
    overflow: "hidden",
    background: "var(--surface-sunken)",
    borderRight: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-xl)",
  },
  drawerClose: {
    position: "absolute",
    zIndex: 3,
    top: "var(--space-5)",
    right: "var(--space-4)",
    color: "var(--text-muted)",
  },
}));

const StyledBadge = withStyles(() => ({
  badge: {
    backgroundColor: "var(--signal-live)",
    color: "var(--signal-live)",
    boxShadow: "0 0 0 2px var(--surface-raised)",
  },
}))(Badge);
const routeTitles = [
  ["/tickets", "Conversas"], ["/contacts", "Contatos"], ["/quick-messages", "Respostas rápidas"], ["/schedules", "Agenda"],
  ["/flowbuilder", "Flow Builder"], ["/phrase-lists", "Fluxos de campanha"], ["/campaign", "Campanhas"],
  ["/connections", "Conexões"], ["/reports", "Relatórios"], ["/settings", "Configurações"], ["/users", "Usuários"],
  ["/queues", "Filas"], ["/financeiro", "Financeiro"], ["/kanban", "Kanban"], ["/chats", "Chat interno"],
  ["/files", "Arquivos"], ["/prompts", "Prompts e IA"], ["/companies", "Empresas"], ["/moments", "Tempo real"],
  ["/tags", "Tags"], ["/helps", "Ajuda"],
];

const LoggedInLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [compact, setCompact] = useState(() => localStorage.getItem("konnex-menu-compact") === "true");
  const classes = useStyles({ compact });
  const location = useLocation();
  const { colorMode } = useContext(ColorModeContext);
  const { handleLogout, loading, user, socket } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(null);
  const [utilitiesMenu, setUtilitiesMenu] = useState(null);
  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);
  const [profileUrl, setProfileUrl] = useState(null);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (user.defaultTheme === "dark" && theme.mode === "light") colorMode.toggleColorMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.defaultTheme]);
  useEffect(() => {
    if (!user.companyId || !socket || typeof socket.on !== "function" || typeof socket.emit !== "function") return undefined;
    setProfileUrl(user.profileImage ? `${backendUrl}/public/avatar/${user.profileImage}` : "/nopicture.png");
    const event = `company-${user.companyId}-auth`;
    const handler = (data) => {
      if (data.user.id === +user.id) {
        toastError("Sua conta foi acessada em outro computador.");
        setTimeout(() => { localStorage.clear(); window.location.reload(); }, 1000);
      }
    };
    socket.on(event, handler);
    socket.emit("userStatus");
    const interval = setInterval(() => socket.emit("userStatus"), 1000 * 60 * 5);
    return () => {
      if (typeof socket.off === "function") socket.off(event, handler);
      clearInterval(interval);
    };
  }, [socket, user.companyId, user.id, user.profileImage]);

  const pageTitle = useMemo(() => {
    const match = routeTitles.find(([path]) => location.pathname.toLowerCase().startsWith(path.toLowerCase()));
    return match ? match[1] : "Visão geral";
  }, [location.pathname]);
  const toggleCompact = () => {
    setCompact((current) => {
      localStorage.setItem("konnex-menu-compact", String(!current));
      return !current;
    });
  };

  if (loading) return <BackdropLoading />;
  return (
    <div className={classes.root}>
      <aside className={classes.sidebar} aria-label="Menu principal">
        <MainListItems compact={compact} onExpand={() => setCompact(false)} />
        <IconButton className={classes.collapseButton} onClick={toggleCompact} aria-label={compact ? "Expandir menu" : "Recolher menu"}>
          {compact ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </aside>
      <section className={classes.stage}>
        <header className={classes.topbar}>
          <IconButton className={classes.mobileMenuButton} onClick={() => setMobileMenuOpen(true)} aria-label="Abrir navegação"><MenuIcon /></IconButton>
          <div className={classes.context}>
            <Typography component="h1" className={classes.title}>
              <span className={classes.crumb}>{user?.company?.name || "Operação"}</span>
              {pageTitle}
            </Typography>
          </div>
          <div className={classes.utilities}>
            <span className={classes.desktopUtility}><VersionControl /></span>
            <span className={classes.desktopUtility}><UserLanguageSelector /></span>
            <IconButton className={classes.desktopUtility} onClick={colorMode.toggleColorMode} aria-label="Alternar tema">{theme.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}</IconButton>
            <span className={classes.desktopUtility}><NotificationsVolume setVolume={setVolume} volume={volume} /></span>
            <IconButton className={classes.desktopUtility} onClick={() => window.location.reload(false)} aria-label="Atualizar"><CachedIcon /></IconButton>
            {user.id && <NotificationsPopOver volume={volume} />}
            <span className={classes.desktopUtility}><AnnouncementsPopover /></span>
            <span className={classes.desktopUtility}><ChatPopover /></span>
            {isMobile && <IconButton onClick={(event) => setUtilitiesMenu(event.currentTarget)} aria-label="Mais ações"><MoreHorizIcon /></IconButton>}
            <StyledBadge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }} variant="dot"><Avatar className={classes.avatar} src={profileUrl} onClick={(event) => setProfileMenu(event.currentTarget)} /></StyledBadge>
          </div>
        </header>
        <main className={classes.content}>{children || null}</main>
      </section>
      {mobileMenuOpen && <div className={classes.backdrop} onMouseDown={(event) => event.target === event.currentTarget && setMobileMenuOpen(false)}><aside className={classes.drawer}><IconButton className={classes.drawerClose} onClick={() => setMobileMenuOpen(false)} aria-label="Fechar navegação"><CloseIcon /></IconButton><MainListItems onNavigate={() => setMobileMenuOpen(false)} /></aside></div>}
      <UserModal open={userModalOpen} onClose={() => setUserModalOpen(false)} onImageUpdate={setProfileUrl} userId={user?.id} />
      <Menu anchorEl={profileMenu} keepMounted open={Boolean(profileMenu)} onClose={() => setProfileMenu(null)} getContentAnchorEl={null} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <MenuItem onClick={() => { setProfileMenu(null); setUserModalOpen(true); }}>{i18n.t("mainDrawer.appBar.user.profile")}</MenuItem>
        <MenuItem onClick={() => { setProfileMenu(null); handleLogout(); }}>{i18n.t("mainDrawer.appBar.user.logout")}</MenuItem>
      </Menu>
      <Menu anchorEl={utilitiesMenu} keepMounted open={Boolean(utilitiesMenu)} onClose={() => setUtilitiesMenu(null)} getContentAnchorEl={null} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <MenuItem onClick={colorMode.toggleColorMode}>Alternar tema</MenuItem><MenuItem onClick={() => window.location.reload(false)}>Atualizar página</MenuItem><MenuItem><UserLanguageSelector /></MenuItem>
      </Menu>
    </div>
  );
};

export default LoggedInLayout;
