import React, { useEffect, useState } from "react";
import NodeCard from "../components/NodeCard";
import { fetchNodeData } from "../utils/api";

export default function Network() {
  const [nodes, setNodes] = useState([]);

  const nodeUrls = [
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
  ];

  async function loadNodes() {
    const result = await Promise.all(nodeUrls.map(fetchNodeData));
    setNodes(result);
  }

  useEffect(() => {
    loadNodes();
    const interval = setInterval(loadNodes, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        padding: "50px",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef2ff, #fafafa)",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "40px",
          fontSize: "36px",
          fontWeight: "800",
          background: "linear-gradient(90deg, #6366f1, #3b82f6)",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        🌐 EduChain Network Visualization
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "30px",
          justifyItems: "center",
        }}
      >
        {nodes.map((node, index) => (
          <NodeCard key={index} node={node} />
        ))}
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: "40px",
          opacity: 0.7,
        }}
      >
        (Nodes auto-refresh every 3 seconds 🔄)
      </p>
    </div>
  );
}
