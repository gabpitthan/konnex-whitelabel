import React, { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Badge, Collapse, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import ChatBubbleOutlineIcon from "@material-ui/icons/ChatBubbleOutline";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import ViewWeekOutlinedIcon from "@material-ui/icons/ViewWeekOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import RecordVoiceOverOutlinedIcon from "@material-ui/icons/RecordVoiceOverOutlined";
import AssessmentOutlinedIcon from "@material-ui/icons/AssessmentOutlined";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import api from "../services/api";
import usePlans from "../hooks/usePlans";
import toastError from "../errors/toastError";

const packageVersion = require("../../package.json").version;

const useStyles = makeStyles((theme) => ({
  navigation: {
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    color: theme.palette.text.primary,
  },
  brand: {
    height: 72,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: (props) => props.compact ? "0 17px" : "0 20px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    overflow: "hidden",
  },
  mark: {
    width: 38,
    height: 38,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: 9,
    color: "#eafff9",
    background: theme.mode === "light" ? "#123d37" : "#2b7668",
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: "-.08em",
  },
  brandCopy: { minWidth: 0, opacity: (props) => props.compact ? 0 : 1, transition: "opacity 120ms ease" },
  brandName: { display: "block", fontSize: 15, fontWeight: 800, letterSpacing: "-.025em" },
  brandMeta: { display: "block", marginTop: 1, color: theme.palette.text.secondary, fontSize: 10, letterSpacing: ".04em" },
  scroll: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    overscrollBehavior: "contain",
    padding: "14px 10px 20px",
    ...theme.scrollbarStyles,
  },
  group: { marginBottom: 4 },
  groupButton: {
    width: "100%",
    minHeight: 42,
    border: 0,
    borderRadius: 7,
    padding: (props) => props.compact ? "7px 13px" : "7px 10px",
    display: "grid",
    gridTemplateColumns: (props) => props.compact ? "32px" : "32px minmax(0,1fr) 20px",
    alignItems: "center",
    gap: 8,
    color: theme.palette.text.secondary,
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 130ms ease, color 130ms ease",
    "&:hover": { color: theme.palette.text.primary, background: theme.mode === "light" ? "rgba(12,68,58,.055)" : "rgba(255,255,255,.055)" },
  },
  groupActive: { color: theme.mode === "light" ? "#0a6756" : "#76d8c2" },
  icon: {
    width: 32,
    display: "grid",
    placeItems: "center",
    "& .MuiSvgIcon-root": { fontSize: 20 },
  },
  groupLabel: { fontSize: 12, fontWeight: 760, letterSpacing: ".005em", whiteSpace: "nowrap" },
  chevron: { fontSize: 18, transition: "transform 150ms ease" },
  chevronOpen: { transform: "rotate(180deg)" },
  children: { margin: "2px 0 8px 40px", paddingLeft: 9, borderLeft: `1px solid ${theme.palette.divider}` },
  link: {
    position: "relative",
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 9px",
    margin: "1px 0",
    borderRadius: 6,
    color: theme.palette.text.secondary,
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 600,
    transition: "background 130ms ease, color 130ms ease",
    "&:hover": { color: theme.palette.text.primary, background: theme.mode === "light" ? "rgba(12,68,58,.05)" : "rgba(255,255,255,.05)" },
  },
  linkActive: {
    color: theme.mode === "light" ? "#075f50" : "#86e2ce",
    background: theme.mode === "light" ? "rgba(18,132,109,.095)" : "rgba(76,205,175,.1)",
    fontWeight: 740,
  },
  directLink: {
    gridTemplateColumns: (props) => props.compact ? "32px" : "32px minmax(0,1fr)",
  },
  directLabel: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  footer: {
    minHeight: 45,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    padding: (props) => props.compact ? "0 23px" : "0 20px",
    borderTop: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: ".09em",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD") return action.payload || [];
  if (action.type === "CHANGE") return state.map((chat) => chat.id === action.payload.chat.id ? action.payload.chat : chat);
  return state;
};

const Admin = ({ user, children, connections = false }) => (
  <Can
    role={connections && user.profile === "user" && user.allowConnections === "enabled" ? "admin" : user.profile}
    perform={connections ? "drawer-admin-items:view" : "dashboard:view"}
    yes={() => children}
  />
);

const NavItem = ({ to, label, warning, onNavigate }) => {
  const classes = useStyles({ compact: false });
  const location = useLocation();
  const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
  return (
    <RouterLink to={to} className={`${classes.link} ${active ? classes.linkActive : ""}`} onClick={onNavigate} aria-current={active ? "page" : undefined}>
      <span>{label}</span>
      {warning && <Badge color="error" variant="dot" />}
    </RouterLink>
  );
};

const Group = ({ id, label, icon, paths, children, openGroups, setOpenGroups, compact, onExpand }) => {
  const classes = useStyles({ compact });
  const location = useLocation();
  const active = paths.some((path) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));
  const open = Boolean(openGroups[id]);
  const toggle = () => {
    if (compact && onExpand) {
      onExpand();
      setOpenGroups((current) => ({ ...current, [id]: true }));
      return;
    }
    setOpenGroups((current) => ({ ...current, [id]: !current[id] }));
  };
  return (
    <section className={classes.group}>
      <button type="button" className={`${classes.groupButton} ${active ? classes.groupActive : ""}`} onClick={toggle} title={compact ? label : undefined} aria-expanded={open}>
        <span className={classes.icon}>{icon}</span>
        {!compact && <><span className={classes.groupLabel}>{label}</span><ExpandMoreIcon className={`${classes.chevron} ${open ? classes.chevronOpen : ""}`} /></>}
      </button>
      {!compact && <Collapse in={open} timeout={150}><div className={classes.children}>{children}</div></Collapse>}
    </section>
  );
};

const MainListItems = ({ compact = false, onNavigate, onExpand }) => {
  const classes = useStyles({ compact });
  const location = useLocation();
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, socket } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();
  const [flags, setFlags] = useState({});
  const [chats, dispatch] = useReducer(reducer, []);
  const [openGroups, setOpenGroups] = useState({
    routine: /^\/(kanban|schedules|quick-messages|tags|chats)/.test(location.pathname),
    automation: /^\/(flowbuilders|flowbuilder|phrase-lists|prompts|queue-integration|messages-api)/.test(location.pathname),
    campaigns: /^\/(campaigns|contact-lists|campaigns-config)/.test(location.pathname),
    analytics: /^\/(reports|moments)/.test(location.pathname),
    admin: /^\/(users|queues|connections|allConnections|files|financeiro|settings|companies|announcements|helps)/.test(location.pathname),
  });

  useEffect(() => {
    let mounted = true;
    getPlanCompany(undefined, user.companyId).then(({ plan }) => mounted && setFlags(plan || {})).catch(toastError);
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.companyId]);
  useEffect(() => { api.get("/chats/").then(({ data }) => dispatch({ type: "LOAD", payload: data.records })).catch(toastError); }, []);
  useEffect(() => {
    if (!socket || typeof socket.on !== "function" || !user.companyId) return undefined;
    const event = `company-${user.companyId}-chat`;
    const handler = (data) => dispatch({ type: "CHANGE", payload: data });
    socket.on(event, handler);
    return () => {
      if (typeof socket.off === "function") socket.off(event, handler);
    };
  }, [socket, user.companyId]);

  const unreadChat = useMemo(() => chats.some((chat) => (chat.users || []).some((item) => item.userId === user.id && item.unreads > 0)), [chats, user.id]);
  const connectionWarning = useMemo(() => whatsApps.some(({ status }) => ["qrcode", "PAIRING", "DISCONNECTED", "TIMEOUT", "OPENING"].includes(status)), [whatsApps]);
  const groupProps = { openGroups, setOpenGroups, compact, onExpand };

  return (
    <div className={classes.navigation}>
      <header className={classes.brand}>
        <span className={classes.mark}>K</span>
        <span className={classes.brandCopy}><Typography className={classes.brandName}>Konnex</Typography><span className={classes.brandMeta}>Central de relacionamento</span></span>
      </header>
      <nav className={classes.scroll} aria-label="Navegação principal">
        <Admin user={user}><Group id="overview" label="Visão geral" icon={<DashboardOutlinedIcon />} paths={["/"]} {...groupProps}><NavItem to="/" label="Painel da operação" onNavigate={onNavigate} /></Group></Admin>
        <Group id="conversations" label="Conversas" icon={<ChatBubbleOutlineIcon />} paths={["/tickets"]} {...groupProps}><NavItem to="/tickets" label="Caixa de entrada" onNavigate={onNavigate} /></Group>
        <Group id="contacts" label="Contatos" icon={<ContactPhoneOutlinedIcon />} paths={["/contacts"]} {...groupProps}><NavItem to="/contacts" label="Base de contatos" onNavigate={onNavigate} /></Group>
        <Group id="routine" label="Rotina" icon={<ViewWeekOutlinedIcon />} paths={["/kanban", "/schedules", "/quick-messages", "/tags", "/chats"]} {...groupProps}>
          {flags.useKanban && <NavItem to="/kanban" label="Quadros Kanban" onNavigate={onNavigate} />}
          {flags.useSchedules && <NavItem to="/schedules" label="Agenda" onNavigate={onNavigate} />}
          <NavItem to="/quick-messages" label="Respostas rápidas" onNavigate={onNavigate} />
          <NavItem to="/tags" label="Organização por tags" onNavigate={onNavigate} />
          {flags.useInternalChat && <NavItem to="/chats" label="Chat da equipe" warning={unreadChat} onNavigate={onNavigate} />}
        </Group>
        <Admin user={user}><Group id="automation" label="Automação" icon={<AccountTreeOutlinedIcon />} paths={["/flowbuilders", "/flowbuilder", "/phrase-lists", "/prompts", "/queue-integration", "/messages-api"]} {...groupProps}>
          <NavItem to="/flowbuilders" label="Fluxos de conversa" onNavigate={onNavigate} />
          <NavItem to="/phrase-lists" label="Fluxos de campanha" onNavigate={onNavigate} />
          {flags.useOpenAi && <NavItem to="/prompts" label="Prompts e IA" onNavigate={onNavigate} />}
          {flags.useIntegrations && <NavItem to="/queue-integration" label="Integrações" onNavigate={onNavigate} />}
          {flags.useExternalApi && <NavItem to="/messages-api" label="API e webhooks" onNavigate={onNavigate} />}
        </Group></Admin>
        {flags.useCampaigns && <Admin user={user}><Group id="campaigns" label="Campanhas" icon={<RecordVoiceOverOutlinedIcon />} paths={["/campaigns", "/contact-lists", "/campaigns-config"]} {...groupProps}>
          <NavItem to="/campaigns" label="Gestão de campanhas" onNavigate={onNavigate} />
          <NavItem to="/contact-lists" label="Listas de contatos" onNavigate={onNavigate} />
          <NavItem to="/campaigns-config" label="Preferências" onNavigate={onNavigate} />
        </Group></Admin>}
        <Admin user={user}><Group id="analytics" label="Análises" icon={<AssessmentOutlinedIcon />} paths={["/reports", "/moments"]} {...groupProps}>
          <NavItem to="/reports" label="Relatórios" onNavigate={onNavigate} />
          <NavItem to="/moments" label="Operação em tempo real" onNavigate={onNavigate} />
        </Group></Admin>
        <Group id="admin" label="Administração" icon={<SettingsOutlinedIcon />} paths={["/users", "/queues", "/connections", "/allConnections", "/files", "/financeiro", "/settings", "/companies", "/announcements", "/helps"]} {...groupProps}>
          <Admin user={user}><NavItem to="/users" label="Equipe e usuários" onNavigate={onNavigate} /></Admin>
          <Admin user={user}><NavItem to="/queues" label="Filas de atendimento" onNavigate={onNavigate} /></Admin>
          <Admin user={user} connections><NavItem to="/connections" label="Canais e conexões" warning={connectionWarning} onNavigate={onNavigate} /></Admin>
          {user.super && <NavItem to="/allConnections" label="Todas as conexões" onNavigate={onNavigate} />}
          <Admin user={user}><NavItem to="/files" label="Biblioteca de arquivos" onNavigate={onNavigate} /></Admin>
          <Admin user={user}><NavItem to="/financeiro" label="Financeiro" onNavigate={onNavigate} /></Admin>
          <Admin user={user}><NavItem to="/settings" label="Configurações" onNavigate={onNavigate} /></Admin>
          {user.super && <NavItem to="/companies" label="Empresas" onNavigate={onNavigate} />}
          {user.super && <NavItem to="/announcements" label="Comunicados" onNavigate={onNavigate} />}
          <NavItem to="/helps" label="Central de ajuda" onNavigate={onNavigate} />
        </Group>
      </nav>
      <footer className={classes.footer}>{compact ? "K" : `KONNEX SIGNAL · ${packageVersion}`}</footer>
    </div>
  );
};

export default MainListItems;
