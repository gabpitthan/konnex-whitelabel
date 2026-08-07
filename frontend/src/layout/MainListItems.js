import React, { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import ChatBubbleOutlineIcon from "@material-ui/icons/ChatBubbleOutline";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import ViewWeekOutlinedIcon from "@material-ui/icons/ViewWeekOutlined";
import EventNoteOutlinedIcon from "@material-ui/icons/EventNoteOutlined";
import FlashOnOutlinedIcon from "@material-ui/icons/FlashOnOutlined";
import LocalOfferOutlinedIcon from "@material-ui/icons/LocalOfferOutlined";
import ForumOutlinedIcon from "@material-ui/icons/ForumOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import CallSplitOutlinedIcon from "@material-ui/icons/CallSplitOutlined";
import MemoryOutlinedIcon from "@material-ui/icons/MemoryOutlined";
import ExtensionOutlinedIcon from "@material-ui/icons/ExtensionOutlined";
import CodeOutlinedIcon from "@material-ui/icons/CodeOutlined";
import RecordVoiceOverOutlinedIcon from "@material-ui/icons/RecordVoiceOverOutlined";
import ListAltOutlinedIcon from "@material-ui/icons/ListAltOutlined";
import TuneOutlinedIcon from "@material-ui/icons/TuneOutlined";
import AssessmentOutlinedIcon from "@material-ui/icons/AssessmentOutlined";
import TimelineOutlinedIcon from "@material-ui/icons/TimelineOutlined";
import PeopleOutlineIcon from "@material-ui/icons/PeopleOutline";
import QueuePlayNextOutlinedIcon from "@material-ui/icons/QueuePlayNextOutlined";
import SettingsInputAntennaOutlinedIcon from "@material-ui/icons/SettingsInputAntennaOutlined";
import FolderOutlinedIcon from "@material-ui/icons/FolderOutlined";
import ReceiptOutlinedIcon from "@material-ui/icons/ReceiptOutlined";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import SyncProblemOutlinedIcon from "@material-ui/icons/SyncProblemOutlined";
import BusinessOutlinedIcon from "@material-ui/icons/BusinessOutlined";
import CampaignIcon from "@material-ui/icons/AnnouncementOutlined";
import HelpOutlineOutlinedIcon from "@material-ui/icons/HelpOutlineOutlined";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import api from "../services/api";
import usePlans from "../hooks/usePlans";
import toastError from "../errors/toastError";

const packageVersion = require("../../package.json").version;

/**
 * Navegação principal.
 *
 * Estrutura em seções planas com rótulo discreto, não accordion aninhado. O
 * padrão anterior exigia abrir um grupo antes de ver qualquer destino, o que
 * custava um clique extra em toda navegação e escondia o mapa do produto.
 * Aqui a seção é só um rótulo; os itens ficam sempre visíveis e a barra rola.
 *
 * O estado ativo usa superfície de marca discreta mais o texto em cor de
 * marca — nunca bloco saturado.
 */
const useStyles = makeStyles(() => ({
  navigation: {
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    color: "var(--text-primary)",
  },
  brand: {
    height: "var(--topbar-height)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "var(--space-4)",
    padding: (props) => (props.compact ? "0 var(--space-5)" : "0 var(--space-5)"),
    borderBottom: "1px solid var(--border-subtle)",
    overflow: "hidden",
  },
  mark: {
    width: 26,
    height: 26,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "var(--radius-md)",
    color: "var(--on-brand)",
    background: "var(--brand-base)",
    fontSize: "var(--text-xs)",
    fontWeight: 600,
  },
  brandCopy: {
    minWidth: 0,
    display: (props) => (props.compact ? "none" : "block"),
  },
  brandName: {
    display: "block",
    fontSize: "var(--text-base)",
    fontWeight: 600,
    letterSpacing: "var(--tracking-tight)",
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    overscrollBehavior: "contain",
    padding: "var(--space-4) var(--space-3) var(--space-8)",
    "&::-webkit-scrollbar": { width: 6 },
    "&::-webkit-scrollbar-thumb": {
      background: "var(--border-default)",
      borderRadius: "var(--radius-full)",
    },
  },
  section: { marginBottom: "var(--space-5)" },
  // Rótulo de seção: pequeno, muted, em caixa alta, sem competir com os itens.
  sectionLabel: {
    display: (props) => (props.compact ? "none" : "block"),
    padding: "0 var(--space-3)",
    marginBottom: "var(--space-2)",
    fontSize: "var(--text-2xs)",
    fontWeight: 500,
    letterSpacing: "var(--tracking-wide)",
    textTransform: "uppercase",
    color: "var(--text-muted)",
  },
  // Separador usado no modo recolhido, onde o rótulo textual some.
  sectionRule: {
    display: (props) => (props.compact ? "block" : "none"),
    height: 1,
    margin: "var(--space-4) var(--space-3)",
    background: "var(--border-subtle)",
  },
  item: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: (props) => (props.compact ? "20px" : "20px minmax(0,1fr) auto"),
    alignItems: "center",
    gap: "var(--space-4)",
    height: "var(--nav-item-height)",
    padding: (props) => (props.compact ? "0 var(--space-4)" : "0 var(--space-3)"),
    justifyContent: (props) => (props.compact ? "center" : undefined),
    borderRadius: "var(--radius-md)",
    color: "var(--text-secondary)",
    textDecoration: "none",
    fontSize: "var(--text-sm)",
    fontWeight: 500,
    transition:
      "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
    "&:hover": { background: "var(--surface-hover)", color: "var(--text-primary)" },
    "&:focus-visible": { outline: "2px solid var(--border-focus)", outlineOffset: -2 },
  },
  itemActive: {
    background: "var(--brand-soft)",
    color: "var(--text-brand)",
    fontWeight: 500,
    "&:hover": { background: "var(--brand-soft)", color: "var(--text-brand)" },
    "& $icon": { color: "var(--text-brand)" },
  },
  icon: {
    display: "grid",
    placeItems: "center",
    color: "var(--text-muted)",
    "& .MuiSvgIcon-root": { fontSize: 18 },
  },
  label: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: (props) => (props.compact ? "none" : "block"),
  },
  // Ponto de atenção: acompanha o item, não vira badge colorida chamativa.
  alert: {
    width: 6,
    height: 6,
    borderRadius: "var(--radius-full)",
    background: "var(--signal-wait)",
    flexShrink: 0,
  },
  footer: {
    minHeight: 34,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    padding: (props) => (props.compact ? "0 var(--space-5)" : "0 var(--space-5)"),
    borderTop: "1px solid var(--border-subtle)",
    color: "var(--text-muted)",
    fontSize: "var(--text-2xs)",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD") return action.payload || [];
  if (action.type === "CHANGE") {
    const chats = [...state];
    const index = chats.findIndex((chat) => chat.id === action.payload.id);
    if (index !== -1) chats[index] = action.payload;
    else chats.unshift(action.payload);
    return chats;
  }
  return state;
};

const Admin = ({ user, children, connections = false }) => (
  <Can
    role={
      connections && user.profile === "user" && user.allowConnections === "enabled"
        ? "admin"
        : user.profile
    }
    perform={connections ? "drawer-admin-items:view" : "dashboard:view"}
    yes={() => children}
  />
);

const NavItem = ({ to, label, icon, warning, onNavigate, compact }) => {
  const classes = useStyles({ compact });
  const location = useLocation();
  const active =
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
  return (
    <RouterLink
      to={to}
      className={`${classes.item} ${active ? classes.itemActive : ""}`}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={compact ? label : undefined}
    >
      <span className={classes.icon}>{icon}</span>
      <span className={classes.label}>{label}</span>
      {warning && !compact && <span className={classes.alert} aria-label="Requer atenção" />}
    </RouterLink>
  );
};

const Section = ({ label, compact, children }) => {
  const classes = useStyles({ compact });
  // Se todos os filhos foram filtrados por permissão ou plano, a seção some
  // junto — rótulo sem item é ruído.
  const temItem = React.Children.toArray(children).some(Boolean);
  if (!temItem) return null;
  return (
    <section className={classes.section}>
      <div className={classes.sectionRule} />
      {label && <div className={classes.sectionLabel}>{label}</div>}
      {children}
    </section>
  );
};

const MainListItems = ({ compact = false, onNavigate, onExpand }) => {
  const classes = useStyles({ compact });
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
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.companyId]);

  useEffect(() => {
    api
      .get("/chats/")
      .then(({ data }) => dispatch({ type: "LOAD", payload: data.records }))
      .catch(toastError);
  }, []);

  useEffect(() => {
    if (!socket || typeof socket.on !== "function" || !user.companyId) return undefined;
    const event = `company-${user.companyId}-chat`;
    const handler = (data) => dispatch({ type: "CHANGE", payload: data });
    socket.on(event, handler);
    return () => {
      if (typeof socket.off === "function") socket.off(event, handler);
    };
  }, [socket, user.companyId]);

  const unreadChat = useMemo(
    () =>
      chats.some((chat) =>
        (chat.users || []).some((item) => item.userId === user.id && item.unreads > 0)
      ),
    [chats, user.id]
  );

  const connectionWarning = useMemo(
    () =>
      whatsApps.some(({ status }) =>
        ["qrcode", "PAIRING", "DISCONNECTED", "TIMEOUT", "OPENING"].includes(status)
      ),
    [whatsApps]
  );

  const nav = { onNavigate, compact };

  return (
    <div className={classes.navigation}>
      <header className={classes.brand} onClick={compact && onExpand ? onExpand : undefined}>
        <span className={classes.mark}>K</span>
        <span className={classes.brandCopy}>
          <span className={classes.brandName}>{user?.company?.name || "Konnex"}</span>
        </span>
      </header>

      <nav className={classes.scroll} aria-label="Navegação principal">
        <Section compact={compact}>
          <Admin user={user}>
            <NavItem to="/" label="Visão geral" icon={<DashboardOutlinedIcon />} {...nav} />
          </Admin>
          <NavItem
            to="/tickets"
            label="Conversas"
            icon={<ChatBubbleOutlineIcon />}
            {...nav}
          />
          <NavItem
            to="/contacts"
            label="Contatos"
            icon={<ContactPhoneOutlinedIcon />}
            {...nav}
          />
        </Section>

        <Section label="Rotina" compact={compact}>
          {flags.useKanban && (
            <NavItem to="/kanban" label="Kanban" icon={<ViewWeekOutlinedIcon />} {...nav} />
          )}
          {flags.useSchedules && (
            <NavItem to="/schedules" label="Agenda" icon={<EventNoteOutlinedIcon />} {...nav} />
          )}
          <NavItem
            to="/quick-messages"
            label="Respostas rápidas"
            icon={<FlashOnOutlinedIcon />}
            {...nav}
          />
          <NavItem to="/tags" label="Tags" icon={<LocalOfferOutlinedIcon />} {...nav} />
          {flags.useInternalChat && (
            <NavItem
              to="/chats"
              label="Chat da equipe"
              icon={<ForumOutlinedIcon />}
              warning={unreadChat}
              {...nav}
            />
          )}
        </Section>

        <Admin user={user}>
          <Section label="Automação" compact={compact}>
            <NavItem
              to="/flowbuilders"
              label="Fluxos de conversa"
              icon={<AccountTreeOutlinedIcon />}
              {...nav}
            />
            <NavItem
              to="/phrase-lists"
              label="Fluxos de campanha"
              icon={<CallSplitOutlinedIcon />}
              {...nav}
            />
            {flags.useOpenAi && (
              <NavItem to="/prompts" label="Prompts e IA" icon={<MemoryOutlinedIcon />} {...nav} />
            )}
            {flags.useIntegrations && (
              <NavItem
                to="/queue-integration"
                label="Integrações"
                icon={<ExtensionOutlinedIcon />}
                {...nav}
              />
            )}
            {flags.useExternalApi && (
              <NavItem
                to="/messages-api"
                label="API e webhooks"
                icon={<CodeOutlinedIcon />}
                {...nav}
              />
            )}
          </Section>
        </Admin>

        {flags.useCampaigns && (
          <Admin user={user}>
            <Section label="Campanhas" compact={compact}>
              <NavItem
                to="/campaigns"
                label="Campanhas"
                icon={<RecordVoiceOverOutlinedIcon />}
                {...nav}
              />
              <NavItem
                to="/contact-lists"
                label="Listas de contatos"
                icon={<ListAltOutlinedIcon />}
                {...nav}
              />
              <NavItem
                to="/campaigns-config"
                label="Preferências"
                icon={<TuneOutlinedIcon />}
                {...nav}
              />
            </Section>
          </Admin>
        )}

        <Admin user={user}>
          <Section label="Análises" compact={compact}>
            <NavItem
              to="/reports"
              label="Relatórios"
              icon={<AssessmentOutlinedIcon />}
              {...nav}
            />
            <NavItem
              to="/moments"
              label="Tempo real"
              icon={<TimelineOutlinedIcon />}
              {...nav}
            />
          </Section>
        </Admin>

        <Section label="Administração" compact={compact}>
          <Admin user={user}>
            <NavItem to="/users" label="Equipe" icon={<PeopleOutlineIcon />} {...nav} />
          </Admin>
          <Admin user={user}>
            <NavItem
              to="/queues"
              label="Filas"
              icon={<QueuePlayNextOutlinedIcon />}
              {...nav}
            />
          </Admin>
          <Admin user={user} connections>
            <NavItem
              to="/connections"
              label="Conexões"
              icon={<SettingsInputAntennaOutlinedIcon />}
              warning={connectionWarning}
              {...nav}
            />
          </Admin>
          {user.super && (
            <NavItem
              to="/allConnections"
              label="Todas as conexões"
              icon={<SettingsInputAntennaOutlinedIcon />}
              {...nav}
            />
          )}
          <Admin user={user}>
            <NavItem to="/files" label="Arquivos" icon={<FolderOutlinedIcon />} {...nav} />
          </Admin>
          <Admin user={user}>
            <NavItem
              to="/financeiro"
              label="Financeiro"
              icon={<ReceiptOutlinedIcon />}
              {...nav}
            />
          </Admin>
          <Admin user={user}>
            <NavItem
              to="/settings"
              label="Configurações"
              icon={<SettingsOutlinedIcon />}
              {...nav}
            />
          </Admin>
          <Admin user={user}>
            <NavItem
              to="/dispatch-reconciliation"
              label="Reconciliação"
              icon={<SyncProblemOutlinedIcon />}
              {...nav}
            />
          </Admin>
          {user.super && (
            <NavItem to="/companies" label="Empresas" icon={<BusinessOutlinedIcon />} {...nav} />
          )}
          {user.super && (
            <NavItem to="/announcements" label="Comunicados" icon={<CampaignIcon />} {...nav} />
          )}
          <NavItem to="/helps" label="Ajuda" icon={<HelpOutlineOutlinedIcon />} {...nav} />
        </Section>
      </nav>

      <footer className={classes.footer}>{compact ? "K" : `Konnex · ${packageVersion}`}</footer>
    </div>
  );
};

export default MainListItems;
