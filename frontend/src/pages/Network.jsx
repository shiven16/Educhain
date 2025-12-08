import React, { useEffect, useState } from "react";
import NodeCard from "../components/NodeCard";
import NetworkGraph from "../components/NetworkGraph";
import { fetchNodeData } from "../utils/api";

export default function Network() {
  const [nodes, setNodes] = useState([]);
  
  // URLs of your Docker nodes
  const nodeUrls = [
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004"
  ];

  async function loadNodes() {
    const results = await Promise.all(nodeUrls.map(url => fetchNodeData(url)));
    setNodes(results);
  }

  useEffect(() => {
    loadNodes();

    const interval = setInterval(loadNodes, 3000); // refresh every 3 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        EduChain Network Visualization
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          justifyItems: "center",
        }}
      >
        {nodes.map((node, idx) => (
          <NodeCard key={idx} node={node} />
        ))}
      </div>

      <NetworkGraph nodes={nodes} />
    </div>
  );
}
