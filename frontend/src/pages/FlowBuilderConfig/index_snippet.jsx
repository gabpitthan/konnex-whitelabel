
<div style={{ width: "100%", height: "calc(100vh - 120px)", flex: 1 }}>
  <ReactFlow
    nodes={nodes}
    edges={edges}
    deleteKeyCode={["Backspace", "Delete"]}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onNodeDoubleClick={doubleClick}
    onNodeClick={clickNode}
    onEdgeClick={clickEdge}
    onConnect={onConnect}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    fitView
    panOnScroll
    zoomOnScroll
    panOnDrag
    minZoom={0.2}
    maxZoom={2}
    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
    className="react-flow"
    defaultEdgeOptions={{
      animated: true,
      className: "edge-line"
    }}
  >
    <Controls />
    <MiniMap />
    <Background variant="dots" gap={12} size={1} />
  </ReactFlow>
</div>
