import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Clear,
  SaveAlt,
  Tune,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { isArray, isEmpty } from "lodash";
import moment from "moment";

import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import { AuthContext } from "../../context/Auth/AuthContext";
import useDashboard from "../../hooks/useDashboard";
import { ChatsUser } from "./ChartsUser";
import ChartDonut from "./ChartDonut";
import Filters from "./Filters";
import { ChartsDate } from "./ChartsDate";
import ForbiddenPage from "../../components/ForbiddenPage";
import { i18n } from "../../translate/i18n";

const signalColors = {
  live: "var(--signal-live)",
  attention: "var(--signal-wait)",
  quiet: "var(--text-muted)",
  danger: "var(--signal-fail)",
};

const Dashboard = () => {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [dateStartTicket, setDateStartTicket] = useState(moment().startOf("month").format("YYYY-MM-DD"));
  const [dateEndTicket, setDateEndTicket] = useState(moment().format("YYYY-MM-DD"));
  const [queueTicket, setQueueTicket] = useState(false);
  const [fetchDataFilter, setFetchDataFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { find } = useDashboard();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const timer = setTimeout(fetchData, 1000);
    return () => clearTimeout(timer);
    // The existing refresh contract is intentionally driven by this flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDataFilter]);

  async function fetchData() {
    setLoading(true);
    let params = {};
    if (!isEmpty(dateStartTicket) && moment(dateStartTicket).isValid()) {
      params.date_from = moment(dateStartTicket).format("YYYY-MM-DD");
    }
    if (!isEmpty(dateEndTicket) && moment(dateEndTicket).isValid()) {
      params.date_to = moment(dateEndTicket).format("YYYY-MM-DD");
    }
    if (Object.keys(params).length === 0) {
      toast.error("Parametrize o filtro");
      setLoading(false);
      return;
    }
    try {
      const data = await find(params);
      setCounters(data.counters || {});
      setAttendants(isArray(data.attendants) ? data.attendants : []);
    } finally {
      setLoading(false);
    }
  }

  const online = attendants.filter(attendant => attendant.online === true).length;
  const waiting = Number(counters.supportPending || 0);
  const happening = Number(counters.supportHappening || 0);
  const finished = Number(counters.supportFinished || 0);

  const operationalMessage = waiting > 0
    ? `${waiting} ${waiting === 1 ? "conversa aguarda" : "conversas aguardam"} entrada em atendimento.`
    : happening > 0
      ? "A operação está fluindo sem fila de espera."
      : "Não há conversas aguardando ou em andamento neste momento.";

  const metrics = useMemo(() => [
    { label: i18n.t("dashboard.cards.waiting"), value: waiting, tone: waiting ? "attention" : "live" },
    { label: i18n.t("dashboard.cards.inAttendance"), value: happening, tone: "live" },
    { label: i18n.t("dashboard.cards.finalized"), value: finished, tone: "quiet" },
    { label: i18n.t("dashboard.cards.newContacts"), value: Number(counters.leads || 0), tone: "quiet" },
    { label: i18n.t("dashboard.cards.groups"), value: Number(counters.supportGroups || 0), tone: "quiet" },
  ], [counters, finished, happening, waiting]);

  const exportarGridParaExcel = () => {
    const table = document.getElementById("grid-attendants");
    if (!table) return;
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RelatorioDeAtendentes");
    XLSX.writeFile(wb, "relatorio-de-atendentes.xlsx");
  };

  if (user.profile === "user" && user.showDashboard === "disabled") {
    return <ForbiddenPage />;
  }

  const surface = {
    border: "1px solid var(--border-default)",
    backgroundColor: "var(--surface-raised)",
    boxShadow: "none",
  };

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default", color: "text.primary", pb: 5 }}>
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2.5, lg: 4 }, pt: { xs: 1.5, md: 3 } }}>
        <Box
          component="header"
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: { xs: 2.5, md: 4 },
          }}
        >
          <Box>
            <Typography
              component="p"
              sx={{ color: "var(--text-muted)", fontSize: "var(--text-2xs)", fontWeight: 500, letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", mb: .5 }}
            >
              Central operacional
            </Typography>
            <Typography component="h1" sx={{ fontSize: { xs: 18, md: 20 }, fontWeight: 600, letterSpacing: "var(--tracking-tight)", lineHeight: 1.25 }}>
              O que está acontecendo agora
            </Typography>
            <Typography sx={{ color: "var(--text-secondary)", mt: .5, fontSize: "var(--text-sm)" }}>
              {moment(dateStartTicket).format("DD/MM/YYYY")} — {moment(dateEndTicket).format("DD/MM/YYYY")}
            </Typography>
          </Box>
          <Button
            variant={showFilter ? "contained" : "outlined"}
            color="primary"
            startIcon={showFilter ? <Clear /> : <Tune />}
            onClick={() => setShowFilter(value => !value)}
            sx={{ flexShrink: 0, minHeight: 42, textTransform: "none", fontWeight: 700 }}
          >
            {compact ? (showFilter ? "Fechar" : "Período") : (showFilter ? "Fechar filtros" : "Alterar período")}
          </Button>
        </Box>

        {showFilter && (
          <Box sx={{ ...surface, mb: 3, borderRadius: 1.5, overflow: "hidden" }}>
            <Filters
              setDateStartTicket={setDateStartTicket}
              setDateEndTicket={setDateEndTicket}
              dateStartTicket={dateStartTicket}
              dateEndTicket={dateEndTicket}
              setQueueTicket={setQueueTicket}
              queueTicket={queueTicket}
              fetchData={setFetchDataFilter}
            />
          </Box>
        )}

        <Box
          sx={{
            ...surface,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(280px, .85fr) minmax(0, 2.15fr)" },
            borderRadius: 2,
            overflow: "hidden",
            mb: 3,
          }}
        >
          <Box sx={{ p: { xs: 2.25, sm: 3 }, borderRight: { md: `1px solid ${theme.palette.divider}` }, borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 0 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Box
                aria-hidden="true"
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  bgcolor: waiting ? signalColors.attention : signalColors.live,
                  boxShadow: `0 0 0 5px ${waiting ? "rgba(199,131,18,.12)" : "rgba(22,133,111,.12)"}`,
                }}
              />
              <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>
                Estado da operação
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: 20, md: 24 }, lineHeight: 1.25, fontWeight: 700, letterSpacing: "-.025em" }}>
              {operationalMessage}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 3 }}>
              <Typography sx={{ fontSize: 42, fontWeight: 750, letterSpacing: "-.06em", fontVariantNumeric: "tabular-nums" }}>
                {online}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                de {attendants.length} atendentes online
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(5, 1fr)" } }}>
            {metrics.map((metric, index) => (
              <Box
                key={metric.label}
                sx={{
                  minWidth: 0,
                  p: { xs: 2, md: 2.5 },
                  borderRight: {
                    xs: index % 2 === 0 ? `1px solid ${theme.palette.divider}` : 0,
                    sm: index < metrics.length - 1 ? `1px solid ${theme.palette.divider}` : 0,
                  },
                  borderBottom: {
                    xs: index < metrics.length - 2 ? `1px solid ${theme.palette.divider}` : 0,
                    sm: 0,
                  },
                  gridColumn: { xs: index === metrics.length - 1 ? "span 2" : "auto", sm: "auto" },
                  position: "relative",
                }}
              >
                <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, bgcolor: signalColors[metric.tone], opacity: metric.tone === "quiet" ? .22 : 1 }} />
                <Typography sx={{ color: "text.secondary", fontSize: 12, minHeight: 34, lineHeight: 1.35 }}>
                  {metric.label}
                </Typography>
                <Typography sx={{ mt: 1, fontSize: { xs: 27, md: 32 }, fontWeight: 720, fontVariantNumeric: "tabular-nums", letterSpacing: "-.04em" }}>
                  {metric.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant={compact ? "scrollable" : "standard"}
            scrollButtons={false}
            aria-label="Visões do painel operacional"
            sx={{
              minHeight: 45,
              "& .MuiTab-root": { minHeight: 45, px: { xs: 1.5, sm: 2.5 }, textTransform: "none", fontWeight: 700 },
            }}
          >
            <Tab label={i18n.t("dashboard.tabs.performance")} />
            <Tab label={i18n.t("dashboard.tabs.assessments")} />
            <Tab label={i18n.t("dashboard.tabs.attendants")} />
          </Tabs>
          <Typography sx={{ display: { xs: "none", md: "block" }, color: "text.secondary", fontSize: 12 }}>
            Dados atualizados para o período selecionado
          </Typography>
        </Box>

        {activeTab === 0 && (
          <Box component="section" aria-label="Desempenho">
            <SectionHeading eyebrow="Volume" title="Ritmo dos atendimentos" description="Distribuição das conversas iniciadas ao longo do período." />
            <ChartsDate />
          </Box>
        )}

        {activeTab === 1 && (
          <Box component="section" aria-label="Avaliações">
            <SectionHeading eyebrow="Experiência" title="Sinal de satisfação" description="Leitura consolidada das avaliações recebidas após o atendimento." />
            <Box sx={{ ...surface, borderRadius: 2, overflow: "hidden" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.25fr repeat(3, 1fr)" } }}>
                <ChartDonut
                  data={[
                    `{'name': 'Promotores', 'value': ${counters.npsPromotersPerc || 100}}`,
                    `{'name': 'Detratores', 'value': ${counters.npsDetractorsPerc || 0}}`,
                    `{'name': 'Neutros', 'value': ${counters.npsPassivePerc || 0}}`,
                  ]}
                  value={counters.npsScore || 0}
                  title="NPS"
                  color={(Number(counters.npsPromotersPerc || 0) + Number(counters.npsDetractorsPerc || 0) + Number(counters.npsPassivePerc || 0)) === 0
                    ? ["var(--text-muted)"] : ["var(--signal-live)", "var(--signal-fail)", "var(--signal-wait)"]}
                  featured
                />
                <ChartDonut title={i18n.t("dashboard.assessments.prosecutors")} value={counters.npsPromotersPerc || 0} data={[`{'name':'Promotores','value':100}`]} color={["var(--signal-live)"]} />
                <ChartDonut title={i18n.t("dashboard.assessments.neutral")} value={counters.npsPassivePerc || 0} data={[`{'name':'Neutros','value':100}`]} color={["var(--signal-wait)"]} />
                <ChartDonut title={i18n.t("dashboard.assessments.detractors")} value={counters.npsDetractorsPerc || 0} data={[`{'name':'Detratores','value':100}`]} color={["var(--signal-fail)"]} />
              </Box>
              <Divider />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
                <SummaryDatum label={i18n.t("dashboard.assessments.totalCalls")} value={counters.tickets || 0} />
                <SummaryDatum label={i18n.t("dashboard.assessments.ratedCalls")} value={counters.withRating || 0} />
                <SummaryDatum
                  label={i18n.t("dashboard.assessments.evaluationIndex")}
                  value={Number(counters.percRating / 100 || 0).toLocaleString(undefined, { style: "percent" })}
                  last
                />
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 2 && (
          <Box component="section" aria-label="Equipe">
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: 2 }}>
              <SectionHeading eyebrow="Equipe" title="Presença e desempenho" description="Disponibilidade e volume processado por atendente." noMargin />
              <Button
                onClick={exportarGridParaExcel}
                startIcon={<SaveAlt />}
                variant="outlined"
                size="small"
                sx={{ flexShrink: 0, textTransform: "none", fontWeight: 700 }}
              >
                {compact ? "Exportar" : "Exportar relatório"}
              </Button>
            </Box>
            <Box id="grid-attendants" sx={{ ...surface, borderRadius: 2, overflow: "auto" }}>
              {attendants.length > 0 ? (
                <TableAttendantsStatus attendants={attendants} loading={loading} />
              ) : (
                <Box sx={{ p: 5, textAlign: "center", color: "text.secondary" }}>
                  Nenhum atendente encontrado para este período.
                </Box>
              )}
            </Box>
            <Box sx={{ mt: 4 }}>
              <SectionHeading eyebrow="Distribuição" title={i18n.t("dashboard.charts.userPerformance")} description="Compare o volume de conversas processado pela equipe." />
              <ChatsUser />
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

const SectionHeading = ({ eyebrow, title, description, noMargin = false }) => (
  <Box sx={{ mb: noMargin ? 0 : 2 }}>
    <Typography sx={{ color: "primary.main", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>
      {eyebrow}
    </Typography>
    <Typography component="h2" sx={{ mt: .5, fontSize: { xs: 20, md: 24 }, fontWeight: 730, letterSpacing: "-.025em" }}>
      {title}
    </Typography>
    <Typography sx={{ color: "text.secondary", fontSize: 13, mt: .5 }}>{description}</Typography>
  </Box>
);

const SummaryDatum = ({ label, value, last }) => (
  <Box sx={{ p: { xs: 2, md: 2.5 }, borderRight: { sm: last ? 0 : "1px solid" }, borderBottom: { xs: last ? 0 : "1px solid", sm: 0 }, borderColor: "divider" }}>
    <Typography sx={{ color: "text.secondary", fontSize: 12 }}>{label}</Typography>
    <Typography sx={{ mt: .75, fontSize: 25, fontWeight: 720, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
  </Box>
);

export default Dashboard;
