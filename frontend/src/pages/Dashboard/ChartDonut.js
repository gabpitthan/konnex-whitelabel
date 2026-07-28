import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const parseData = data => {
  try {
    return JSON.parse(`[${String(data).replace(/'/g, '"')}]`);
  } catch (_) {
    return [];
  }
};

const DonutChart = ({ title, value, data, color, featured = false }) => {
  const theme = useTheme();
  const chartData = parseData(data);
  const colors = Array.isArray(color) ? color : [color];

  return (
    <Box
      sx={{
        minWidth: 0,
        p: { xs: 2, md: featured ? 3 : 2.5 },
        borderRight: { md: "1px solid" },
        borderBottom: { xs: "1px solid", md: 0 },
        borderColor: "divider",
        bgcolor: featured ? "action.hover" : "transparent",
      }}
    >
      <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 1 }}>{title}</Typography>
      <Box sx={{ height: featured ? 190 : 160, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={featured ? 78 : 65}
              innerRadius={featured ? 65 : 55}
              startAngle={90}
              endAngle={-270}
              paddingAngle={chartData.length > 1 ? 2 : 0}
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length] || theme.palette.primary.main} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 7,
                boxShadow: "none",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center", pointerEvents: "none" }}>
          <Typography sx={{ fontSize: featured ? 32 : 25, fontWeight: 750, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-.05em" }}>
            {value}{title === "NPS" ? "" : "%"}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 10, mt: .5 }}>{featured ? "score" : "do total"}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DonutChart;
