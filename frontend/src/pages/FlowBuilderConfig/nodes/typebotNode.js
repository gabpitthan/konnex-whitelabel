import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  ConfirmationNumber,
} from "@mui/icons-material";
import React, { memo } from "react";
import TextField from "@mui/material/TextField";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Handle } from "react-flow-renderer";
import { Typography, Box } from "@material-ui/core";
import typebotIcon from "../../../assets/typebot-ico.png";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  console.log(12, "ticketNode", data);
  return (
    <div
      style={{
        backgroundColor: "var(--text-secondary)",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border-default)",
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
          cursor: "pointer",
        }}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "var(--text-secondary)",
            width: "10px",
            height: "10px",
            marginLeft: "2.9px",
            marginBottom: "1px",
            pointerEvents: "none",
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
          gap: 6,
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
          display: "flex",
        }}
      >
        <Box
          component="img"
          sx={{
            width: 16,
            height: 16,
            marginRight: 4,
            marginTop: 4,
            color: "var(--signal-live)",
          }}
          src={typebotIcon}
          alt="icon"
        />
        <div style={{ color: "var(--text-primary)", fontSize: "14px" }}>TypeBot</div>
      </div>
      <div style={{ color: "var(--text-primary)", fontSize: "12px", width: 180 }}>
        <div
          style={{
            backgroundColor: "var(--surface-sunken)",
            marginBottom: "3px",
            borderRadius: "5px",
          }}
        >
          <div style={{ gap: "5px", padding: "6px" }}>
            <div style={{ textAlign: "center" }}>TypeBot</div>
          </div>
        </div>
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
          cursor: "pointer",
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
            pointerEvents: "none",
          }}
        />
      </Handle>
    </div>
  );
});
