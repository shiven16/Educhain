import React from "react";

export default function NodeCard({ node }) {
  const colors = {
    university: "linear-gradient(135deg, #4f46e5, #6366f1)",
    employer: "linear-gradient(135deg, #059669, #10b981)",
    relay: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    unknown: "linear-gradient(135deg, #6b7280, #9ca3af)",
  };

  const emojis = {
    university: "🎓",
    employer: "💼",
    relay: "🔗",
    unknown: "❓",
  };

  return (
    <div
      style={{
        padding: "22px",
        borderRadius: "20px",
        background: colors[node.type] || colors.unknown,
        width: "200px",
        textAlign: "center",
        color: "white",
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        transition: "transform 0.2s",
        cursor: "pointer",
        transform: node.status === "active" ? "scale(1.05)" : "scale(1)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.transform =
          node.status === "active" ? "scale(1.05)" : "scale(1)")
      }
    >
      <div style={{ fontSize: "40px", marginBottom: "10px" }}>
        {emojis[node.type] || emojis.unknown}
      </div>

      <strong style={{ fontSize: "18px" }}>{node.name}</strong>

      <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "4px" }}>
        {node.type?.toUpperCase() || "UNKNOWN"}
      </div>

      <div
        style={{
          marginTop: "12px",
          padding: "6px 12px",
          borderRadius: "12px",
          background: node.status === "active" ? "#16a34a" : "#dc2626",
          display: "inline-block",
          fontSize: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        }}
      >
        {node.status === "active" ? "🟢 Active" : "🔴 Offline"}
      </div>

      {node.status === "active" && (
        <div style={{ marginTop: "14px", fontSize: "13px" }}>
          <p>👥 Peers: <strong>{node.peers}</strong></p>
          <p>📜 Credentials: <strong>{node.credentials}</strong></p>
        </div>
      )}
    </div>
  );
}
