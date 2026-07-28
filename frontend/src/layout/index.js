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
const menuWidth = 272;
const compactWidth = 76;

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    height: "100dvh",
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: (props) => `${props.compact ? compactWidth : menuWidth}px minmax(0, 1fr)`,
    overflow: "hidden",
    background: theme.palette.background.default,
    transition: "grid-template-columns 180ms ease",
    [theme.breakpoints.down("sm")]: { display: "block" },
  },
  sidebar: {
    position: "relative",
    minHeight: 0,
    overflow: "hidden",
    background: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  collapseButton: {
    position: "absolute",
    zIndex: 2,
    top: 78,
    right: -1,
    width: 26,
    height: 30,
    padding: 0,
    borderRadius: "7px 0 0 7px",
    color: theme.palette.text.secondary,
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRight: 0,
    "& .MuiSvgIcon-root": { fontSize: 17 },
  },
  stage: { minWidth: 0, minHeight: 0, height: "100dvh", display: "grid", gridTemplateRows: "64px minmax(0,1fr)", overflow: "hidden" },
  topbar: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "0 18px",
    background: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down("sm")]: { height: 56, padding: "0 7px 0 max(8px, env(safe-area-inset-left))" },
  },
  mobileMenuButton: { display: "none", [theme.breakpoints.down("sm")]: { display: "inline-flex" } },
  context: { minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 10 },
  signal: { width: 3, height: 25, flexShrink: 0, borderRadius: 3, background: "linear-gradient(180deg,#68d8bd,#14715f)" },
  title: { overflow: "hidden", color: theme.palette.text.primary, fontSize: 15, fontWeight: 760, letterSpacing: "-.015em", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  crumb: { display: "block", color: theme.palette.text.secondary, fontSize: 10, fontWeight: 650, letterSpacing: ".035em", [theme.breakpoints.down("sm")]: { display: "none" } },
  desktopUtility: { display: "inline-flex", [theme.breakpoints.down("sm")]: { display: "none" } },
  avatar: { width: 32, height: 32, cursor: "pointer", border: `2px solid ${theme.palette.background.paper}` },
  content: {
    minWidth: 0,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    overscrollBehavior: "contain",
    WebkitOverflowScrolling: "touch",
    background: theme.palette.background.default,
    ...theme.scrollbarStyles,
  },
  backdrop: { position: "fixed", zIndex: 1390, inset: 0, background: "rgba(4,16,15,.52)", backdropFilter: "blur(2px)" },
  drawer: {
    position: "absolute",
    inset: "0 auto 0 0",
    width: "min(88vw, 328px)",
    minHeight: 0,
    overflow: "hidden",
    background: theme.palette.background.paper,
    boxShadow: "18px 0 60px rgba(0,0,0,.24)",
  },
  drawerClose: { position: "absolute", zIndex: 3, top: 14, right: 10 },
}));

const StyledBadge = withStyles((theme) => ({ badge: { backgroundColor: "#44b700", color: "#44b700", boxShadow: `0 0 0 2px ${theme.palette.background.paper}` } }))(Badge);
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
          <div className={classes.context}><span className={classes.signal} /><Typography component="h1" className={classes.title}><span className={classes.crumb}>{user?.company?.name || "Operação"} / CRM</span>{pageTitle}</Typography></div>
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
