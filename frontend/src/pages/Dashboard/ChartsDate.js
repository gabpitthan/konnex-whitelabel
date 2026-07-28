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

export const ChartsDate = () => {
    const theme = useTheme();
    const [initialDate, setInitialDate] = useState(new Date());
    const [finalDate, setFinalDate] = useState(new Date());
    const [ticketsData, setTicketsData] = useState({ data: [], count: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useContext(AuthContext);
    const companyId = user.companyId;
    const dark = theme.palette.mode === "dark" || theme.palette.type === "dark";

    useEffect(() => {
        if (companyId) handleGetTicketsInformation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: theme.palette.background.paper,
                titleColor: theme.palette.text.primary,
                bodyColor: theme.palette.text.secondary,
                borderColor: theme.palette.divider,
                borderWidth: 1,
                padding: 12,
                cornerRadius: 7,
                displayColors: false,
                callbacks: { label: context => `Total: ${context.raw}` },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: theme.palette.text.secondary, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
                border: { display: false },
            },
            y: {
                beginAtZero: true,
                grid: { color: dark ? "rgba(255,255,255,.08)" : "rgba(21,37,33,.08)" },
                ticks: { color: theme.palette.text.secondary, precision: 0 },
                border: { display: false },
            },
        },
    };

    const chartData = {
        labels: ticketsData.data.map(item => item.hasOwnProperty("horario") ? `${item.horario}h` : item.data),
        datasets: [{
            data: ticketsData.data.map(item => item.total),
            backgroundColor: "rgba(22,133,111,.72)",
            hoverBackgroundColor: "#16856f",
            borderRadius: 3,
            borderSkipped: false,
            maxBarThickness: 34,
        }],
    };

    async function handleGetTicketsInformation() {
        try {
            setIsLoading(true);
            const { data } = await api.get(`/dashboard/ticketsDay?initialDate=${format(initialDate, "yyyy-MM-dd")}&finalDate=${format(finalDate, "yyyy-MM-dd")}&companyId=${companyId}`);
            setTicketsData(data);
        } catch (error) {
            toast.error("Erro ao buscar informações dos tickets");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", overflow: "hidden" }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: 2, p: { xs: 2, md: 2.5 }, borderBottom: "1px solid", borderColor: "divider" }}>
                <Box>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{i18n.t("dashboard.users.totalAttendances")}</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 740, fontVariantNumeric: "tabular-nums", mt: .25 }}>{ticketsData.count || 0}</Typography>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "160px 160px auto" }, gap: 1, alignItems: "center" }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                        <DatePicker
                            value={initialDate}
                            onChange={setInitialDate}
                            label={i18n.t("dashboard.date.initialDate")}
                            renderInput={params => <TextField {...params} fullWidth size="small" />}
                        />
                    </LocalizationProvider>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                        <DatePicker
                            value={finalDate}
                            onChange={setFinalDate}
                            label={i18n.t("dashboard.date.finalDate")}
                            renderInput={params => <TextField {...params} fullWidth size="small" />}
                        />
                    </LocalizationProvider>
                    <Button onClick={handleGetTicketsInformation} variant="contained" disabled={isLoading} sx={{ minHeight: 40, gridColumn: { xs: "1 / -1", sm: "auto" }, textTransform: "none", fontWeight: 700 }}>
                        {isLoading ? "Atualizando…" : "Atualizar"}
                    </Button>
                </Box>
            </Box>
            {ticketsData.data.length === 0 ? (
                <Box sx={{ minHeight: 310, display: "grid", placeContent: "center", px: 2, color: "text.secondary", textAlign: "center" }}>
                    <Typography sx={{ fontSize: 14 }}>Nenhum atendimento encontrado neste período.</Typography>
                </Box>
            ) : (
                <Box sx={{ height: { xs: 300, md: 360 }, p: { xs: 1.5, md: 2.5 } }}>
                    <Bar options={options} data={chartData} />
                </Box>
            )}
        </Box>
    );
};

export default ChartsDate;
