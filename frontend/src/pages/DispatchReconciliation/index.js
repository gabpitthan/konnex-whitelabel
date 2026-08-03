import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
  root: { minHeight: "100%", padding: theme.spacing(3), [theme.breakpoints.down("sm")]: { padding: theme.spacing(1.5) } },
  header: { display: "flex", justifyContent: "space-between", gap: theme.spacing(2), alignItems: "flex-start", marginBottom: theme.spacing(2), [theme.breakpoints.down("sm")]: { flexDirection: "column" } },
  eyebrow: { color: theme.palette.text.secondary, fontSize: 11, fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase" },
  title: { fontSize: 26, fontWeight: 800, letterSpacing: "-.03em" },
  summary: { maxWidth: 720, marginTop: 5, color: theme.palette.text.secondary, lineHeight: 1.5 },
  panel: { overflow: "hidden", border: `1px solid ${theme.palette.divider}`, boxShadow: "none" },
  tabs: { borderBottom: `1px solid ${theme.palette.divider}` },
  content: { padding: theme.spacing(2) },
  notice: { padding: theme.spacing(1.5), marginBottom: theme.spacing(2), borderLeft: "4px solid #b36b16", background: theme.palette.type === "dark" ? "rgba(179,107,22,.12)" : "#fff8ed", lineHeight: 1.45 },
  tableWrap: { width: "100%", overflowX: "auto" },
  table: { width: "100%", minWidth: 820, borderCollapse: "collapse", "& th": { textAlign: "left", padding: "10px 12px", color: theme.palette.text.secondary, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: `1px solid ${theme.palette.divider}` }, "& td": { padding: "12px", borderBottom: `1px solid ${theme.palette.divider}`, verticalAlign: "top" } },
  mono: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  empty: { padding: theme.spacing(6, 2), textAlign: "center", color: theme.palette.text.secondary },
  loading: { display: "grid", placeItems: "center", padding: theme.spacing(6) },
  danger: { color: theme.palette.error.main, marginTop: theme.spacing(1), lineHeight: 1.45 },
  reason: { marginTop: theme.spacing(2) },
  auditReason: { maxWidth: 360, whiteSpace: "normal", lineHeight: 1.4 }
}));

const typeLabel = type => type === "SCHEDULE" ? "Agendamento" : "Campanha";
const phaseLabel = phase => ({ MESSAGE: "Mensagem", CONFIRMATION: "Confirmação", CONTENT: "Conteúdo" }[phase] || phase);
const actionLabel = action => action === "ACKNOWLEDGE" ? "Efeito reconhecido" : "Rearmado";
const formatDate = value => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value)) : "—";

const DispatchReconciliation = () => {
  const classes = useStyles();
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState([]);
  const [audits, setAudits] = useState([]);
  const [staleBefore, setStaleBefore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingResponse, auditResponse] = await Promise.all([
        api.get("/dispatch-reconciliations", { params: { limit: 200 } }),
        api.get("/dispatch-reconciliations/audits", { params: { limit: 200 } })
      ]);
      setItems(pendingResponse.data.items || []);
      setStaleBefore(pendingResponse.data.staleBefore || null);
      setAudits(auditResponse.data.records || []);
    } catch (error) {
      toastError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const validReason = useMemo(() => reason.trim().length >= 10 && reason.trim().length <= 500, [reason]);
  const openDecision = (item, action) => { setDecision({ item, action }); setReason(""); };
  const closeDecision = () => { if (!saving) setDecision(null); };
  const submitDecision = async () => {
    if (!decision || !validReason) return;
    setSaving(true);
    try {
      await api.post(`/dispatch-reconciliations/${decision.item.entityType}/${decision.item.entityId}`, {
        action: decision.action,
        expectedDispatchKey: decision.item.reconciliationToken,
        reason: reason.trim()
      });
      toast.success("Decisão registrada com auditoria.");
      setDecision(null);
      await load();
    } catch (error) {
      toastError(error);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={classes.root}>
      <header className={classes.header}>
        <div>
          <div className={classes.eyebrow}>Integridade operacional</div>
          <Typography component="h1" className={classes.title}>Reconciliação de envios</Typography>
          <Typography className={classes.summary}>Resolva somente casos em que o processo parou depois de iniciar um envio. Nenhuma tentativa é repetida automaticamente porque o efeito no WhatsApp pode já ter acontecido.</Typography>
        </div>
        <Button variant="outlined" onClick={load} disabled={loading}>Atualizar</Button>
      </header>

      <Paper className={classes.panel}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} className={classes.tabs} variant="scrollable">
          <Tab label={`Aguardando decisão (${items.length})`} />
          <Tab label={`Histórico (${audits.length})`} />
        </Tabs>
        <div className={classes.content}>
          {tab === 0 && <div className={classes.notice}><strong>Antes de decidir:</strong> confira o aparelho e o histórico do WhatsApp. “Reconhecer efeito” registra que o envio ocorreu; “Rearmar” permite nova tentativa e pode duplicar uma mensagem já entregue. Limite atual: iniciados até {formatDate(staleBefore)}.</div>}
          {loading ? <div className={classes.loading}><CircularProgress size={28} /></div> : tab === 0 ? (
            items.length === 0 ? <div className={classes.empty}>Nenhum envio ambíguo exige decisão.</div> :
            <div className={classes.tableWrap}><table className={classes.table}>
              <thead><tr><th>Origem</th><th>Fase</th><th>Referências</th><th>Iniciado em</th><th>Contexto</th><th>Decisão</th></tr></thead>
              <tbody>{items.map(item => <tr key={`${item.entityType}-${item.entityId}-${item.startedAt}`}>
                <td>{typeLabel(item.entityType)}</td>
                <td>{phaseLabel(item.phase)}</td>
                <td className={classes.mono}>envio #{item.entityId}<br />{item.parentId ? `campanha #${item.parentId}` : ""}{item.contactId ? ` · contato #${item.contactId}` : ""}</td>
                <td>{formatDate(item.startedAt)}</td>
                <td>{item.parentStatus}</td>
                <td><div className={classes.actions}><Button size="small" variant="contained" color="primary" onClick={() => openDecision(item, "ACKNOWLEDGE")}>Reconhecer efeito</Button><Button size="small" variant="outlined" color="secondary" onClick={() => openDecision(item, "REARM")}>Rearmar</Button></div></td>
              </tr>)}</tbody>
            </table></div>
          ) : audits.length === 0 ? <div className={classes.empty}>Nenhuma decisão foi registrada.</div> :
            <div className={classes.tableWrap}><table className={classes.table}>
              <thead><tr><th>Quando</th><th>Operador</th><th>Origem</th><th>Decisão</th><th>Transição</th><th>Justificativa</th></tr></thead>
              <tbody>{audits.map(record => <tr key={record.id}>
                <td>{formatDate(record.createdAt)}</td><td>{record.actor ? record.actor.name : "Usuário removido"}</td>
                <td>{typeLabel(record.entityType)} <span className={classes.mono}>#{record.entityId}</span><br />{phaseLabel(record.phase)}</td>
                <td>{actionLabel(record.action)}</td><td className={classes.mono}>{record.previousStatus} → {record.nextStatus}</td>
                <td className={classes.auditReason}>{record.reason}</td>
              </tr>)}</tbody>
            </table></div>}
        </div>
      </Paper>

      <Dialog open={Boolean(decision)} onClose={closeDecision} fullWidth maxWidth="sm" aria-labelledby="reconciliation-title">
        <DialogTitle id="reconciliation-title">{decision?.action === "REARM" ? "Rearmar este envio?" : "Reconhecer o efeito externo?"}</DialogTitle>
        <DialogContent>
          <Typography>{decision && `${typeLabel(decision.item.entityType)} #${decision.item.entityId}, fase ${phaseLabel(decision.item.phase).toLowerCase()}.`}</Typography>
          {decision?.action === "REARM" && <Typography className={classes.danger}>Esta ação autoriza uma nova tentativa. Se a mensagem anterior já chegou ao destinatário, ela poderá ser duplicada.</Typography>}
          <TextField className={classes.reason} label="Justificativa operacional" value={reason} onChange={event => setReason(event.target.value)} multiline minRows={3} fullWidth variant="outlined" inputProps={{ maxLength: 500 }} helperText={`${reason.trim().length}/500 · mínimo de 10 caracteres · não inclua telefone, mensagem ou token`} autoFocus />
        </DialogContent>
        <DialogActions><Button onClick={closeDecision} disabled={saving}>Cancelar</Button><Button onClick={submitDecision} disabled={saving || !validReason} color={decision?.action === "REARM" ? "secondary" : "primary"} variant="contained">{saving ? "Registrando…" : "Confirmar decisão"}</Button></DialogActions>
      </Dialog>
    </main>
  );
};

export default DispatchReconciliation;
