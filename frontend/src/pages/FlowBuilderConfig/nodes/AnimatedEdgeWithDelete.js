import React from "react";
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from "reactflow";

const foreignObjectSize = 40;

const AnimatedEdgeWithDelete = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  data
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY
  });

  const onDelete = () => {
    try {
      if (data && typeof data.onDelete === "function") {
        data.onDelete(id);
      } else {
        console.warn("Edge sem onDelete configurado:", id);
      }
    } catch (err) {
      console.error("Erro ao deletar edge:", err);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ display: "none" }} />
      <path className="edge-line" d={edgePath} />
      <EdgeLabelRenderer>
        <foreignObject
          width={foreignObjectSize}
          height={foreignObjectSize}
          x={labelX - foreignObjectSize / 2}
          y={labelY - foreignObjectSize / 2}
          requiredExtensions="http://www.w3.org/1999/xhtml"
          style={{ overflow: "visible" }}
        >
          <div
            onClick={onDelete}
            style={{
              background: "#ff0000",
              borderRadius: "100%",
              width: "40px",
              height: "40px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "0px 0px 5px rgba(0,0,0,0.2)"
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="#fff"
              viewBox="0 0 24 24"
            >
              <path d="M9 3V4H4V6H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V6H20V4H15V3H9ZM7 6H17V20H7V6ZM9 8V18H11V8H9ZM13 8V18H15V8H13Z" />
            </svg>
          </div>
        </foreignObject>
      </EdgeLabelRenderer>
    </>
  );
};

export default AnimatedEdgeWithDelete;
