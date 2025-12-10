import React from "react";
import "../styles/NodeCard.css";

export default function NodeCard({ node }) {
  const emojis = {
    university: "🎓",
    employer: "💼",
    relay: "🔗",
    unknown: "❓",
  };

  const isActive = node.status === "active";

  return (
    <div className="node-card">
      <div className="card-decoration" />

      <div className="node-icon-wrapper">
        {emojis[node.type] || emojis.unknown}
      </div>

      <h3 className="node-name">{node.name}</h3>

      <div className="node-type">
        {node.type?.toUpperCase() || "UNKNOWN"}
      </div>

      <div className={`status-badge ${isActive ? "active" : "offline"}`}>
        <span className="status-indicator" />
        {isActive ? "Active" : "Offline"}
      </div>
    </div>
  );
}
