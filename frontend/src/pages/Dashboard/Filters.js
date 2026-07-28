import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { FilterList } from "@mui/icons-material";
import { i18n } from "../../translate/i18n";

const Filters = ({
    setDateStartTicket,
    setDateEndTicket,
    dateStartTicket,
    dateEndTicket,
    setQueueTicket,
    queueTicket,
    fetchData
}) => {
    const [queues] = useState(queueTicket);
    const [dateStart, setDateStart] = useState(dateStartTicket);
    const [dateEnd, setDateEnd] = useState(dateEndTicket);
    const [refreshFlag, setRefreshFlag] = useState(false);

    const apply = () => {
        setQueueTicket(queues);
        setDateStartTicket(dateStart);
        setDateEndTicket(dateEnd);
        const nextFlag = !refreshFlag;
        setRefreshFlag(nextFlag);
        fetchData(nextFlag);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", mb: 2 }}>
                Período de análise
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" }, gap: 1.5, alignItems: "center" }}>
                <TextField
                    fullWidth
                    name="dateStart"
                    label={i18n.t("dashboard.date.initialDate")}
                    InputLabelProps={{ shrink: true }}
                    type="date"
                    value={dateStart}
                    size="small"
                    onChange={event => setDateStart(event.target.value)}
                />
                <TextField
                    fullWidth
                    name="dateEnd"
                    label={i18n.t("dashboard.date.finalDate")}
                    InputLabelProps={{ shrink: true }}
                    type="date"
                    value={dateEnd}
                    size="small"
                    onChange={event => setDateEnd(event.target.value)}
                />
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FilterList />}
                    onClick={apply}
                    sx={{ minHeight: 40, px: 2.5, textTransform: "none", fontWeight: 700 }}
                >
                    Aplicar
                </Button>
            </Box>
        </Box>
    );
};

export default Filters;
