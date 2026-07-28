import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Avatar,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import MenuIcon from "@material-ui/icons/Menu";
import CloseIcon from "@material-ui/icons/Close";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import CachedIcon from "@material-ui/icons/Cached";
import MainListItems, { WORKSPACES, workspaceForPath } from "./MainListItems";
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
const railWidth = 76;
const toolsWidth = 238;
const mobileBarHeight = 66;

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    height: "100dvh",
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: `${railWidth}px ${toolsWidth}px minmax(0, 1fr)`,
    overflow: "hidden",
    background: theme.palette.background.default,
    [theme.breakpoints.down("sm")]: {
      display: "flex",
      flexDirection: "column",
    },
  },
  rail: {
    minHeight: 0,
    zIndex: 1300,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "13px 9px",
    background: theme.mode === "light" ? "#0d2825" : "#081a19",
    color: "#d7ebe7",
    borderRight: "1px solid rgba(255,255,255,.07)",
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  brand: {
    width: 42,
    height: 42,
    display: "grid",
    placeItems: "center",
    marginBottom: 19,
    border: "1px solid rgba(255,255,255,.15)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 18,
    fontWeight: 850,
    letterSpacing: "-.06em",
    background: "rgba(255,255,255,.06)",
  },
  spaces: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  spaceButton: {
    position: "relative",
    width: 52,
    height: 49,
    border: 0,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    color: "rgba(222,244,239,.68)",
    background: "transparent",
    transition: "color 140ms ease, background 140ms ease",
    "&:hover": { color: "#fff", background: "rgba(255,255,255,.08)" },
    "&::after": {
      content: '""',
      position: "absolute",
      left: -9,
      top: 15,
      height: 19,
      width: 2,
      borderRadius: 2,
      background: "transparent",
    },
  },
  spaceButtonActive: {
    color: "#fff",
    background: "rgba(93, 214, 186, .14)",
    "&::after": { background: "#69d7bf" },
  },
  spaceGlyph: {
    fontSize: 13,
    fontWeight: 850,
    letterSpacing: ".02em",
  },
  spaceLabel: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },
  toolPanel: {
    minHeight: 0,
    overflow: "hidden",
    background: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  stage: {
    minWidth: 0,
    minHeight: 0,
    display: "grid",
    gridTemplateRows: "64px minmax(0, 1fr)",
    overflow: "hidden",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
      height: "100dvh",
      gridTemplateRows: `56px minmax(0, 1fr) ${mobileBarHeight}px`,
    },
  },
  topbar: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: 6,
    background: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down("sm")]: { padding: "0 8px 0 12px" },
  },
  mobileMenuButton: {
    display: "none",
    [theme.breakpoints.down("sm")]: { display: "inline-flex" },
  },
  context: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 11,
  },
  signal: {
    width: 4,
    height: 26,
    flexShrink: 0,
    borderRadius: 3,
    background: "linear-gradient(180deg, #64d4bb 0%, #107864 100%)",
  },
  title: {
    overflow: "hidden",
    color: theme.palette.text.primary,
    fontSize: 15,
    fontWeight: 760,
    letterSpacing: "-.015em",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  crumb: {
    display: "block",
    color: theme.palette.text.secondary,
    fontSize: 10,
    fontWeight: 650,
    letterSpacing: ".04em",
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  desktopUtility: {
    display: "inline-flex",
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  avatar: {
    width: 32,
    height: 32,
    cursor: "pointer",
    border: `2px solid ${theme.palette.background.paper}`,
  },
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
  mobileNav: {
    display: "none",
    [theme.breakpoints.down("sm")]: {
      zIndex: 1200,
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      padding: "5px max(5px, env(safe-area-inset-right)) calc(5px + env(safe-area-inset-bottom)) max(5px, env(safe-area-inset-left))",
      background: theme.palette.background.paper,
      borderTop: `1px solid ${theme.palette.divider}`,
    },
  },
  mobileNavButton: {
    minWidth: 0,
    border: 0,
    background: "transparent",
    color: theme.palette.text.secondary,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    fontSize: 9,
    fontWeight: 700,
  },
  mobileNavActive: { color: theme.mode === "light" ? "#0c725f" : "#69d7bf" },
  mobileGlyph: { fontSize: 14, fontWeight: 850 },
  mobileSheet: {
    position: "fixed",
    zIndex: 1400,
    inset: 0,
    display: "flex",
    background: "rgba(4,16,15,.5)",
    backdropFilter: "blur(2px)",
  },
  mobileSheetPanel: {
    width: "min(88vw, 340px)",
    height: "100dvh",
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "68px minmax(0, 1fr)",
    background: theme.palette.background.paper,
    boxShadow: "18px 0 60px rgba(0,0,0,.22)",
  },
  mobileRail: {
    minHeight: 0,
    padding: "12px 8px",
    overflowY: "auto",
    background: theme.mode === "light" ? "#0d2825" : "#081a19",
  },
  sheetClose: {
    position: "absolute",
    top: 7,
    left: "min(calc(88vw - 44px), 296px)",
    zIndex: 2,
  },
}));

const StyledBadge = withStyles((theme) => ({
  badge: {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  },
}))(Badge);

const routeTitles = [
  ["/tickets", "Conversas"], ["/contacts", "Contatos"], ["/quick-messages", "Respostas rápidas"],
  ["/schedules", "Agenda"], ["/flowbuilder", "Flow Builder"], ["/phrase-lists", "Fluxos de campanha"],
  ["/campaign", "Campanhas"], ["/connections", "Conexões"], ["/reports", "Relatórios"],
  ["/settings", "Configurações"], ["/users", "Usuários"], ["/queues", "Filas"],
  ["/financeiro", "Financeiro"], ["/kanban", "Kanban"], ["/chats", "Chat interno"],
  ["/files", "Arquivos"], ["/prompts", "Prompts e IA"], ["/companies", "Empresas"],
  ["/moments", "Tempo real"], ["/tags", "Tags"], ["/helps", "Ajuda"],
];

const LoggedInLayout = ({ children }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();
  const { colorMode } = useContext(ColorModeContext);
  const { handleLogout, loading, user, socket } = useContext(AuthContext);
  const [workspace, setWorkspace] = useState(() => workspaceForPath(location.pathname));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(null);
  const [utilitiesMenu, setUtilitiesMenu] = useState(null);
  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);
  const [profileUrl, setProfileUrl] = useState(null);

  useEffect(() => {
    setWorkspace(workspaceForPath(location.pathname));
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user.defaultTheme === "dark" && theme.mode === "light") colorMode.toggleColorMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.defaultTheme]);

  useEffect(() => {
    if (!user.companyId) return undefined;
    setProfileUrl(user.profileImage
      ? `${backendUrl}/public/avatar/${user.profileImage}`
      : `${process.env.FRONTEND_URL}/nopicture.png`);
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
      socket.off(event, handler);
      clearInterval(interval);
    };
  }, [socket, user.companyId, user.id, user.profileImage]);

  const pageTitle = useMemo(() => {
    const match = routeTitles.find(([path]) => location.pathname.toLowerCase().startsWith(path.toLowerCase()));
    return match ? match[1] : "Visão geral";
  }, [location.pathname]);
  const workspaceLabel = WORKSPACES.find(({ id }) => id === workspace)?.label || "Central";

  const chooseWorkspace = (id) => {
    setWorkspace(id);
    if (isMobile) setMobileMenuOpen(true);
  };

  const WorkspaceButtons = ({ mobile = false }) => (
    <div className={mobile ? classes.mobileRail : classes.spaces}>
      {!mobile && <div className={classes.brand} aria-label="Konnex">K</div>}
      {WORKSPACES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${classes.spaceButton} ${workspace === item.id ? classes.spaceButtonActive : ""}`}
          onClick={() => chooseWorkspace(item.id)}
          title={item.label}
          aria-label={item.label}
          aria-pressed={workspace === item.id}
        >
          <span className={classes.spaceGlyph}>{item.glyph}</span>
          <span className={classes.spaceLabel}>{item.label}</span>
        </button>
      ))}
    </div>
  );

  if (loading) return <BackdropLoading />;

  return (
    <div className={classes.root}>
      <aside className={classes.rail} aria-label="Espaços de trabalho"><WorkspaceButtons /></aside>
      <aside className={classes.toolPanel}>
        <MainListItems workspace={workspace} />
      </aside>
      <section className={classes.stage}>
        <header className={classes.topbar}>
          <IconButton className={classes.mobileMenuButton} onClick={() => setMobileMenuOpen(true)} aria-label="Abrir navegação">
            <MenuIcon />
          </IconButton>
          <div className={classes.context}>
            <span className={classes.signal} />
            <Typography component="h1" className={classes.title}>
              <span className={classes.crumb}>{workspaceLabel} / {user?.company?.name || "Operação"}</span>
              {pageTitle}
            </Typography>
          </div>
          <span className={classes.desktopUtility}><VersionControl /></span>
          <span className={classes.desktopUtility}><UserLanguageSelector /></span>
          <IconButton className={classes.desktopUtility} onClick={colorMode.toggleColorMode} aria-label="Alternar tema">
            {theme.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <span className={classes.desktopUtility}><NotificationsVolume setVolume={setVolume} volume={volume} /></span>
          <IconButton className={classes.desktopUtility} onClick={() => window.location.reload(false)} aria-label="Atualizar"><CachedIcon /></IconButton>
          {user.id && <NotificationsPopOver volume={volume} />}
          <span className={classes.desktopUtility}><AnnouncementsPopover /></span>
          <span className={classes.desktopUtility}><ChatPopover /></span>
          {isMobile && (
            <IconButton onClick={(event) => setUtilitiesMenu(event.currentTarget)} aria-label="Mais ações">
              <MoreHorizIcon />
            </IconButton>
          )}
          <StyledBadge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }} variant="dot">
            <Avatar className={classes.avatar} src={profileUrl} onClick={(event) => setProfileMenu(event.currentTarget)} />
          </StyledBadge>
        </header>
        <main className={classes.content}>{children || null}</main>
        <nav className={classes.mobileNav} aria-label="Navegação principal">
          {[
            WORKSPACES[0],
            WORKSPACES[1],
            WORKSPACES[2],
            { id: "mais", label: "Mais", glyph: "•••" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${classes.mobileNavButton} ${workspace === item.id ? classes.mobileNavActive : ""}`}
              onClick={() => item.id === "mais" ? setMobileMenuOpen(true) : chooseWorkspace(item.id)}
            >
              <span className={classes.mobileGlyph}>{item.glyph}</span>{item.label}
            </button>
          ))}
        </nav>
      </section>

      {mobileMenuOpen && (
        <div className={classes.mobileSheet} onMouseDown={(event) => event.target === event.currentTarget && setMobileMenuOpen(false)}>
          <div className={classes.mobileSheetPanel}>
            <IconButton className={classes.sheetClose} onClick={() => setMobileMenuOpen(false)} aria-label="Fechar navegação"><CloseIcon /></IconButton>
            <WorkspaceButtons mobile />
            <MainListItems workspace={workspace} onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onImageUpdate={setProfileUrl}
        userId={user?.id}
      />
      <Menu
        anchorEl={profileMenu}
        keepMounted
        open={Boolean(profileMenu)}
        onClose={() => setProfileMenu(null)}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => { setProfileMenu(null); setUserModalOpen(true); }}>{i18n.t("mainDrawer.appBar.user.profile")}</MenuItem>
        <MenuItem onClick={() => { setProfileMenu(null); handleLogout(); }}>{i18n.t("mainDrawer.appBar.user.logout")}</MenuItem>
      </Menu>
      <Menu
        anchorEl={utilitiesMenu}
        keepMounted
        open={Boolean(utilitiesMenu)}
        onClose={() => setUtilitiesMenu(null)}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={colorMode.toggleColorMode}>Alternar tema</MenuItem>
        <MenuItem onClick={() => window.location.reload(false)}>Atualizar página</MenuItem>
        <MenuItem><UserLanguageSelector /></MenuItem>
      </Menu>
    </div>
  );
};

export default LoggedInLayout;
