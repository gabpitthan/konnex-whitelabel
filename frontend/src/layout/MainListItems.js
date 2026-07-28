import React, { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import { Badge, Typography } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import ScheduleIcon from "@material-ui/icons/Schedule";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import BusinessIcon from "@material-ui/icons/Business";
import ViewKanban from "@mui/icons-material/ViewKanban";
import {
  AllInclusive,
  AttachFile,
  Description,
  DeviceHubOutlined,
  GridOn,
  ListAlt,
  PhonelinkSetup,
} from "@material-ui/icons";
import { Campaign, ShapeLine } from "@mui/icons-material";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import api from "../services/api";
import usePlans from "../hooks/usePlans";
import toastError from "../errors/toastError";

const packageVersion = require("../../package.json").version;

export const WORKSPACES = [
  { id: "central", label: "Central", glyph: "C" },
  { id: "atendimento", label: "Atendimento", glyph: "A" },
  { id: "campanhas", label: "Campanhas", glyph: "M" },
  { id: "automacao", label: "Automação", glyph: "F" },
  { id: "gestao", label: "Gestão", glyph: "G" },
  { id: "sistema", label: "Sistema", glyph: "S" },
];

export const workspaceForPath = (pathname) => {
  if (/^\/(tickets|contacts|quick-messages|kanban|schedules|tags|chats)/.test(pathname)) return "atendimento";
  if (/^\/(campaigns|contact-lists|campaigns-config)/.test(pathname)) return "campanhas";
  if (/^\/(phrase-lists|flowbuilders|flowbuilder|prompts|queue-integration|messages-api)/.test(pathname)) return "automacao";
  if (/^\/(users|queues|financeiro|reports|moments)/.test(pathname)) return "gestao";
  if (/^\/(connections|allConnections|files|settings|companies|announcements|helps)/.test(pathname)) return "sistema";
  return "central";
};

const useStyles = makeStyles((theme) => ({
  panel: {
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    color: theme.palette.text.primary,
  },
  panelHeader: {
    padding: "22px 18px 14px",
    flexShrink: 0,
  },
  eyebrow: {
    display: "block",
    color: theme.palette.text.secondary,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: ".13em",
    textTransform: "uppercase",
  },
  panelTitle: {
    marginTop: 5,
    fontSize: 19,
    fontWeight: 760,
    letterSpacing: "-.025em",
  },
  tools: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "4px 10px 18px",
    ...theme.scrollbarStyles,
  },
  sectionLabel: {
    display: "block",
    padding: "14px 10px 6px",
    color: theme.palette.text.secondary,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: ".1em",
    textTransform: "uppercase",
  },
  link: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "30px minmax(0, 1fr) auto",
    alignItems: "center",
    minHeight: 43,
    gap: 9,
    padding: "5px 10px",
    margin: "2px 0",
    borderRadius: 7,
    color: theme.palette.text.secondary,
    textDecoration: "none",
    transition: "background 140ms ease, color 140ms ease, transform 140ms ease",
    "&:hover": {
      color: theme.palette.text.primary,
      background: theme.mode === "light" ? "rgba(17, 45, 41, .055)" : "rgba(255,255,255,.055)",
      transform: "translateX(2px)",
    },
    "&::before": {
      content: '""',
      position: "absolute",
      left: 0,
      top: 11,
      bottom: 11,
      width: 2,
      borderRadius: 2,
      background: "transparent",
    },
  },
  active: {
    color: theme.mode === "light" ? "#0b6758" : "#79d8c3",
    background: theme.mode === "light" ? "rgba(20, 132, 111, .09)" : "rgba(68, 196, 166, .1)",
    "&::before": {
      background: theme.mode === "light" ? "#11836d" : "#60d0b7",
    },
  },
  linkIcon: {
    width: 30,
    height: 30,
    display: "grid",
    placeItems: "center",
    "& .MuiSvgIcon-root": { fontSize: 19 },
  },
  linkLabel: {
    overflow: "hidden",
    fontSize: 13,
    fontWeight: 640,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  footer: {
    flexShrink: 0,
    padding: "12px 18px 16px",
    borderTop: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    fontSize: 10,
    letterSpacing: ".06em",
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD") return action.payload || [];
  if (action.type === "CHANGE") {
    return state.map((chat) => chat.id === action.payload.chat.id ? action.payload.chat : chat);
  }
  return state;
};

const NavItem = ({ to, label, icon, warning, onNavigate }) => {
  const classes = useStyles();
  const location = useLocation();
  const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
  return (
    <RouterLink
      to={to}
      className={`${classes.link} ${active ? classes.active : ""}`}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
    >
      <span className={classes.linkIcon}>
        {warning ? <Badge color="error" variant="dot">{icon}</Badge> : icon}
      </span>
      <span className={classes.linkLabel}>{label}</span>
    </RouterLink>
  );
};

const Admin = ({ user, children, connections = false }) => (
  <Can
    role={connections && user.profile === "user" && user.allowConnections === "enabled" ? "admin" : user.profile}
    perform={connections ? "drawer-admin-items:view" : "dashboard:view"}
    yes={() => children}
  />
);

const Section = ({ label, children }) => {
  const classes = useStyles();
  return (
    <section>
      {label && <Typography className={classes.sectionLabel}>{label}</Typography>}
      {children}
    </section>
  );
};

const MainListItems = ({ workspace, onNavigate }) => {
  const classes = useStyles();
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, socket } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();
  const [flags, setFlags] = useState({});
  const [chats, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    let mounted = true;
    getPlanCompany(undefined, user.companyId)
      .then(({ plan }) => mounted && setFlags(plan || {}))
      .catch(toastError);
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.companyId]);

  useEffect(() => {
    api.get("/chats/")
      .then(({ data }) => dispatch({ type: "LOAD", payload: data.records }))
      .catch(toastError);
  }, []);

  useEffect(() => {
    if (!socket || !user.companyId) return undefined;
    const event = `company-${user.companyId}-chat`;
    const handler = (data) => dispatch({ type: "CHANGE", payload: data });
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket, user.companyId]);

  const unreadChat = useMemo(() => chats.some((chat) =>
    (chat.users || []).some((chatUser) => chatUser.userId === user.id && chatUser.unreads > 0)
  ), [chats, user.id]);

  const connectionWarning = useMemo(() => whatsApps.some(({ status }) =>
    ["qrcode", "PAIRING", "DISCONNECTED", "TIMEOUT", "OPENING"].includes(status)
  ), [whatsApps]);

  const title = WORKSPACES.find((item) => item.id === workspace)?.label || "Central";

  return (
    <div className={classes.panel}>
      <header className={classes.panelHeader}>
        <span className={classes.eyebrow}>Espaço de trabalho</span>
        <Typography component="h2" className={classes.panelTitle}>{title}</Typography>
      </header>
      <nav className={classes.tools} aria-label={`Ferramentas de ${title}`}>
        {workspace === "central" && (
          <>
            <Section label="Visão da operação">
              <Admin user={user}><NavItem to="/" label="Visão geral" icon={<DashboardOutlinedIcon />} onNavigate={onNavigate} /></Admin>
              <Admin user={user}><NavItem to="/reports" label="Relatórios" icon={<Description />} onNavigate={onNavigate} /></Admin>
              <Admin user={user}><NavItem to="/moments" label="Tempo real" icon={<GridOn />} onNavigate={onNavigate} /></Admin>
            </Section>
            <Section label="Acesso rápido">
              <NavItem to="/tickets" label="Abrir atendimentos" icon={<WhatsAppIcon />} onNavigate={onNavigate} />
              <NavItem to="/contacts" label="Consultar contatos" icon={<ContactPhoneOutlinedIcon />} onNavigate={onNavigate} />
            </Section>
          </>
        )}
        {workspace === "atendimento" && (
          <>
            <Section label="Operação">
              <NavItem to="/tickets" label="Conversas" icon={<WhatsAppIcon />} onNavigate={onNavigate} />
              {flags.useKanban && <NavItem to="/kanban" label="Kanban" icon={<ViewKanban />} onNavigate={onNavigate} />}
              <NavItem to="/contacts" label="Contatos" icon={<ContactPhoneOutlinedIcon />} onNavigate={onNavigate} />
              {flags.useSchedules && <NavItem to="/schedules" label="Agenda" icon={<ScheduleIcon />} onNavigate={onNavigate} />}
            </Section>
            <Section label="Recursos">
              <NavItem to="/quick-messages" label="Respostas rápidas" icon={<FlashOnIcon />} onNavigate={onNavigate} />
              <NavItem to="/tags" label="Tags" icon={<LocalOfferIcon />} onNavigate={onNavigate} />
              {flags.useInternalChat && <NavItem to="/chats" label="Chat interno" icon={<ForumIcon />} warning={unreadChat} onNavigate={onNavigate} />}
            </Section>
          </>
        )}
        {workspace === "campanhas" && flags.useCampaigns && (
          <Admin user={user}>
            <Section label="Campanhas">
              <NavItem to="/campaigns" label="Campanhas" icon={<Campaign />} onNavigate={onNavigate} />
              <NavItem to="/contact-lists" label="Listas de contatos" icon={<ListAlt />} onNavigate={onNavigate} />
              <NavItem to="/campaigns-config" label="Configuração" icon={<SettingsOutlinedIcon />} onNavigate={onNavigate} />
            </Section>
          </Admin>
        )}
        {workspace === "automacao" && (
          <Admin user={user}>
            <Section label="Construtores">
              <NavItem to="/flowbuilders" label="Fluxos de conversa" icon={<ShapeLine />} onNavigate={onNavigate} />
              <NavItem to="/phrase-lists" label="Fluxos de campanha" icon={<Campaign />} onNavigate={onNavigate} />
            </Section>
            <Section label="Inteligência e integração">
              {flags.useOpenAi && <NavItem to="/prompts" label="Prompts e IA" icon={<AllInclusive />} onNavigate={onNavigate} />}
              {flags.useIntegrations && <NavItem to="/queue-integration" label="Integrações" icon={<DeviceHubOutlined />} onNavigate={onNavigate} />}
              {flags.useExternalApi && <NavItem to="/messages-api" label="API e webhooks" icon={<CodeRoundedIcon />} onNavigate={onNavigate} />}
            </Section>
          </Admin>
        )}
        {workspace === "gestao" && (
          <Admin user={user}>
            <Section label="Equipe">
              <NavItem to="/users" label="Usuários" icon={<PeopleAltOutlinedIcon />} onNavigate={onNavigate} />
              <NavItem to="/queues" label="Filas" icon={<AccountTreeOutlinedIcon />} onNavigate={onNavigate} />
            </Section>
            <Section label="Desempenho">
              <NavItem to="/reports" label="Relatórios" icon={<Description />} onNavigate={onNavigate} />
              <NavItem to="/moments" label="Tempo real" icon={<GridOn />} onNavigate={onNavigate} />
              <NavItem to="/financeiro" label="Financeiro" icon={<LocalAtmIcon />} onNavigate={onNavigate} />
            </Section>
          </Admin>
        )}
        {workspace === "sistema" && (
          <>
            <Section label="Canais e dados">
              <Admin user={user} connections><NavItem to="/connections" label="Conexões" icon={<SyncAltIcon />} warning={connectionWarning} onNavigate={onNavigate} /></Admin>
              {user.super && <NavItem to="/allConnections" label="Todas as conexões" icon={<PhonelinkSetup />} onNavigate={onNavigate} />}
              <Admin user={user}><NavItem to="/files" label="Arquivos" icon={<AttachFile />} onNavigate={onNavigate} /></Admin>
            </Section>
            <Section label="Administração">
              <Admin user={user}><NavItem to="/settings" label="Configurações" icon={<SettingsOutlinedIcon />} onNavigate={onNavigate} /></Admin>
              {user.super && <NavItem to="/companies" label="Empresas" icon={<BusinessIcon />} onNavigate={onNavigate} />}
              {user.super && <NavItem to="/announcements" label="Comunicados" icon={<AnnouncementIcon />} onNavigate={onNavigate} />}
              <NavItem to="/helps" label="Ajuda" icon={<HelpOutlineIcon />} onNavigate={onNavigate} />
            </Section>
          </>
        )}
      </nav>
      <footer className={classes.footer}>KONNEX SIGNAL · {packageVersion}</footer>
    </div>
  );
};

export default MainListItems;
