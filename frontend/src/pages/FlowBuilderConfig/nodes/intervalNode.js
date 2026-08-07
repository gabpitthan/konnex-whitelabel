import {
  AccessTime,
  ArrowForwardIos,
  ContentCopy,
  Delete,
  Message
} from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

  return (
    <div
      style={{
        backgroundColor: "var(--surface-sunken)",
        padding: "8px",
        borderRadius: "8px",
        minWidth: "155px",
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          width: "18px",
          height: "18px",
          top: "20px",
          left: "-12px",
          cursor: 'pointer'
        }}
        onConnect={params => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "var(--text-secondary)",
            width: "10px",
            height: "10px",
            marginLeft: "3.5px",
            marginBottom: "1px",
            pointerEvents: "none"
          }}
        />
      </Handle>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 5,
          top: 5,
          cursor: "pointer",
          gap: 6
        }}
      >
        <ContentCopy
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("duplicate");
          }}
          sx={{ width: "12px", height: "12px", color: "var(--signal-wait)" }}
        />

        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: "12px", height: "12px", color: "var(--signal-wait)" }}
        />
      </div>
      <div
        style={{
          color: "var(--text-primary)",
          fontSize: "14px",
          flexDirection: "row",
          display: "flex"
        }}
      >
        <AccessTime
          sx={{
            width: "16px",
            height: "16px",
            marginRight: "4px",
            marginTop: "4px",
            color: "var(--signal-wait)"
          }}
        />
        <div style={{ color: "var(--text-primary)", fontSize: "14px" }}>Intervalo</div>
      </div>
      <div style={{ color: "var(--text-primary)", fontSize: "12px" }}>
        {data.sec} segundos
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
            pointerEvents: "none"
          }}
        />
      </Handle>
    </div>
  );
});
