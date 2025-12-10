import React, { useEffect, useState } from "react";
import NodeCard from "../components/NodeCard";
import { fetchNodeData } from "../utils/api";
import "../styles/Network.css";

export default function Network() {
  const [nodes, setNodes] = useState([]);

  async function loadNodes() {
    try {
      // 1. Fetch active nodes from Registry
      const res = await fetch("http://localhost:3000/network/nodes");
      const registryNodes = await res.json();

      // 2. Construct URLs (Registry + all active nodes)
      // We assume running locally, so we use localhost + httpPort
      // Filter out the registry node itself from the visualization
      const urls = [];

      registryNodes.forEach(node => {
        if (node.httpPort && node.nodeType !== 'registry' && node.nodeName !== 'registry') {
          urls.push(`http://localhost:${node.httpPort}`);
        }
      });

      // 3. Fetch details for each node
      const result = await Promise.all(urls.map(fetchNodeData));
      setNodes(result);
    } catch (err) {
      console.error("Failed to load network nodes:", err);
    }
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
