import React, { useEffect, useState, useContext } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import brLocale from 'date-fns/locale/pt-BR';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { Button, Grid, TextField } from '@material-ui/core';
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { i18n } from '../../translate/i18n';
import { AuthContext } from "../../context/Auth/AuthContext";
import { useTheme } from '@material-ui/core';

// Registrar componentes do Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const ChartsDate = () => {
    const theme = useTheme();
    const [initialDate, setInitialDate] = useState(new Date());
    const [finalDate, setFinalDate] = useState(new Date());
    const [ticketsData, setTicketsData] = useState({ data: [], count: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useContext(AuthContext);

    const companyId = user.companyId;
    const isDarkMode = theme.palette.type === 'dark';

    useEffect(() => {
        if (companyId) {
            handleGetTicketsInformation();
        }
    }, [companyId]);

    // Gerar cor com transparência baseada no tema
    const getColorWithOpacity = (color, opacity) => {
        // Converter hex para rgba ou usar color diretamente se já for rgba
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        // Se a cor já for rgba, tenta extrair valores e substituir opacidade
        const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/);
        if (rgbaMatch) {
            return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
        }
        // Fallback para cor original
        return color;
    };

    // Configurações do gráfico adaptadas ao tema
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: isDarkMode ? '#424242' : '#ffffff',
                titleColor: isDarkMode ? '#ffffff' : '#212121',
                bodyColor: isDarkMode ? '#e0e0e0' : '#757575',
                borderColor: isDarkMode ? '#616161' : '#e0e0e0',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 4,
                displayColors: false,
                callbacks: {
                    title: (context) => context[0].label,
                    label: (context) => `Total: ${context.raw}`,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: isDarkMode ? '#bdbdbd' : '#757575',
                    maxRotation: 30,
                    minRotation: 30,
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    drawBorder: false,
                },
                ticks: {
                    color: isDarkMode ? '#bdbdbd' : '#757575',
                    padding: 8,
                },
            },
        },
    };

    // Dados do gráfico com cores adaptadas ao tema
    const dataCharts = {
        labels: ticketsData?.data.length > 0 ? ticketsData.data.map((item) => (
            item.hasOwnProperty('horario') ? `${item.horario}:00-${item.horario}:59` : item.data
        )) : [],
        datasets: [
            {
                data: ticketsData?.data.length > 0 ? ticketsData.data.map(item => item.total) : [],
                backgroundColor: getColorWithOpacity(theme.palette.primary.main, 0.8),
                hoverBackgroundColor: theme.palette.primary.main,
                borderWidth: 0,
                borderRadius: 4,
                barThickness: 30,
                maxBarThickness: 40,
            },
        ],
    };

    const handleGetTicketsInformation = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get(`/dashboard/ticketsDay?initialDate=${format(initialDate, 'yyyy-MM-dd')}&finalDate=${format(finalDate, 'yyyy-MM-dd')}&companyId=${companyId}`);
            setTicketsData(data);
        } catch (error) {
            toast.error('Erro ao buscar informações dos tickets');
        } finally {
            setIsLoading(false);
        }
    };

    // Estilos considerando tema claro e escuro
    const styles = {
        container: {
            padding: 16,
            borderRadius: 8,
            boxShadow: theme.shadows[isDarkMode ? 4 : 1],
            backgroundColor: theme.palette.background.paper,
        },
        countBadge: {
            marginLeft: 8,
            padding: '4px 8px',
            backgroundColor: getColorWithOpacity(theme.palette.primary.main, 0.15),
            borderRadius: 4,
            fontSize: '0.875rem',
            color: theme.palette.primary.main,
        },
        chartContainer: {
            height: 280,
            position: 'relative',
            marginTop: 8,
        },
        emptyState: {
            height: 280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? 'rgba(66, 66, 66, 0.3)' : 'rgba(245, 245, 245, 0.7)',
            borderRadius: 4,
        },
        filterButton: {
            textTransform: 'none',
            borderRadius: 6,
            padding: '8px 16px',
        },
        datePickerContainer: {
            marginBottom: 24,
            marginTop: 8,
        }
    };

    return (
        <Paper style={styles.container} elevation={isDarkMode ? 2 : 1}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                {i18n.t("dashboard.users.totalAttendances")} 
                <span style={styles.countBadge}>
                    {ticketsData?.count || 0}
                </span>
            </Typography>

            <Grid container spacing={2} style={styles.datePickerContainer}>
                <Grid item xs={12} sm={4} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                        <DatePicker
                            value={initialDate}
                            onChange={(newValue) => setInitialDate(newValue)}
                            label={i18n.t("dashboard.date.initialDate")}
                            renderInput={(params) => <TextField fullWidth {...params} variant="outlined" size="small" />}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                        <DatePicker
                            value={finalDate}
                            onChange={(newValue) => setFinalDate(newValue)}
                            label={i18n.t("dashboard.date.finalDate")}
                            renderInput={(params) => <TextField fullWidth {...params} variant="outlined" size="small" />}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={4} md="auto" style={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                        onClick={handleGetTicketsInformation} 
                        variant="contained" 
                        color="primary"
                        disabled={isLoading}
                        style={styles.filterButton}
                    >
                        {isLoading ? 'Carregando...' : 'Filtrar'}
                    </Button>
                </Grid>
            </Grid>

            {ticketsData?.data.length === 0 ? (
                <div style={styles.emptyState}>
                    <Typography color="textSecondary">Nenhum dado disponível para o período selecionado</Typography>
                </div>
            ) : (
                <div style={styles.chartContainer}>
                    <Bar options={options} data={dataCharts} />
                </div>
            )}
        </Paper>
    );
};

export default ChartsDate;