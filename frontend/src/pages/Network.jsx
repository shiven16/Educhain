import React, { useEffect, useState } from "react";
import NodeCard from "../components/NodeCard";
import { fetchNodeData } from "../utils/api";
import "../styles/Network.css";

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
    <div className="network-container">
      <header className="network-header">
        <div className="title-badge">System Monitor</div>
        <h1 className="network-title">
          EduChain Network
        </h1>
        <p className="network-subtitle">
          Real-time visualization of network nodes, peers, and ledger status.
        </p>
      </header>

      <div className="network-grid">
        {nodes.map((node, index) => (
          <NodeCard key={index} node={node} />
        ))}
      </div>

      <div className="refresh-indicator">
        <span className="spin">🔄</span>
        Live Feedback (3s)
      </div>
    </div>
  );
}
