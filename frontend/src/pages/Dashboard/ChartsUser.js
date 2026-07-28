import React, { useContext, useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import brLocale from "date-fns/locale/pt-BR";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { Box, Button, TextField, Typography, useTheme } from "@mui/material";
import api from "../../services/api";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export const ChatsUser = () => {
    const theme = useTheme();
    const [initialDate, setInitialDate] = useState(new Date());
    const [finalDate, setFinalDate] = useState(new Date());
    const [ticketsData, setTicketsData] = useState({ data: [] });
    const [loading, setLoading] = useState(false);
    const { user } = useContext(AuthContext);
    const dark = theme.palette.mode === "dark" || theme.palette.type === "dark";

    useEffect(() => {
        if (user.companyId) handleGetTicketsInformation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.companyId]);

    const data = {
        labels: ticketsData.data.map(item => item.nome),
        datasets: [{
            data: ticketsData.data.map(item => item.quantidade),
            backgroundColor: "rgba(22,133,111,.72)",
            hoverBackgroundColor: "#16856f",
            borderRadius: 3,
            borderSkipped: false,
            maxBarThickness: 36,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: theme.palette.background.paper,
                titleColor: theme.palette.text.primary,
                bodyColor: theme.palette.text.secondary,
                borderColor: theme.palette.divider,
                borderWidth: 1,
                displayColors: false,
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: theme.palette.text.secondary }, border: { display: false } },
            y: {
                beginAtZero: true,
                grid: { color: dark ? "rgba(255,255,255,.08)" : "rgba(21,37,33,.08)" },
                ticks: { color: theme.palette.text.secondary, precision: 0 },
                border: { display: false },
            },
        },
    };

    async function handleGetTicketsInformation() {
        try {
            setLoading(true);
            const { data: response } = await api.get(`/dashboard/ticketsUsers?initialDate=${format(initialDate, "yyyy-MM-dd")}&finalDate=${format(finalDate, "yyyy-MM-dd")}&companyId=${user.companyId}`);
            setTicketsData(response);
        } catch (error) {
            toast.error("Erro ao buscar informações dos tickets");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", overflow: "hidden" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "180px 180px auto" }, gap: 1, alignItems: "center", p: { xs: 2, md: 2.5 }, borderBottom: "1px solid", borderColor: "divider" }}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                    <DatePicker value={initialDate} onChange={setInitialDate} label={i18n.t("dashboard.date.initialDate")} renderInput={params => <TextField {...params} fullWidth size="small" />} />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                    <DatePicker value={finalDate} onChange={setFinalDate} label={i18n.t("dashboard.date.finalDate")} renderInput={params => <TextField {...params} fullWidth size="small" />} />
                </LocalizationProvider>
                <Button onClick={handleGetTicketsInformation} variant="contained" disabled={loading} sx={{ minHeight: 40, gridColumn: { xs: "1 / -1", sm: "auto" }, textTransform: "none", fontWeight: 700 }}>
                    {loading ? "Atualizando…" : "Atualizar"}
                </Button>
            </Box>
            {ticketsData.data.length ? (
                <Box sx={{ height: { xs: 300, md: 360 }, p: { xs: 1.5, md: 2.5 } }}><Bar options={options} data={data} /></Box>
            ) : (
                <Box sx={{ minHeight: 260, display: "grid", placeContent: "center", px: 2, textAlign: "center" }}>
                    <Typography sx={{ color: "text.secondary", fontSize: 14 }}>Nenhum dado de atendente neste período.</Typography>
                </Box>
            )}
        </Box>
    );
};
