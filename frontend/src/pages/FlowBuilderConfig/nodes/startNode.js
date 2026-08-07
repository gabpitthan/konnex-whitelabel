import { ArrowForwardIos, Message, RocketLaunch } from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";

export default memo(({ data, isConnectable }) => {
  return (
    <div
      style={{
        backgroundColor: "var(--surface-sunken)",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "var(--shadow-sm)",
        border: '1px solid var(--signal-live)'
      }}
    >
      <div
        style={{
          color: "var(--text-primary)",
          fontSize: "14px",
          flexDirection: "row",
          display: "flex"
        }}
      >
        <RocketLaunch
          sx={{
            width: "16px",
            height: "16px",
            marginRight: "4px",
            marginTop: "4px",
            color: "var(--signal-live)"
          }}
        />
        <div style={{ color: "var(--text-primary)", fontSize: "14px" }}>
          Inicio do fluxo
        </div>
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
        Este bloco marca o inicio do seu fluxo!
      </div>
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          width: "18px",
          height: "18px",
          top: "70%",
          right: "-11px",
          cursor: 'pointer'
        }}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "var(--text-secondary)",
            width: "10px",
            height: "10px",
            marginLeft: "2.9px",
            marginBottom: "1px",
            pointerEvents: 'none'
          }}
        />
      </Handle>
    </div>
  );
});
