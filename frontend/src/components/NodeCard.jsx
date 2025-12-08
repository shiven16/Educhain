import React from "react";

export default function NodeCard({ node }) {
  const colors = {
    university: "#3B82F6",
    employer: "#22C55E",
    relay: "#F59E0B",
  };

  return (
    <div style={{
      padding: "18px",
      borderRadius: "12px",
      background: colors[node.type] || "#6B7280",
      color: "white",
      width: "180px",
      textAlign: "center",
      transition: "0.2s",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
    }}>
      <strong style={{ fontSize: "16px" }}>{node.name}</strong>

      <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.9 }}>
        {node.type?.toUpperCase() || "UNKNOWN"}
      </div>

      <div
        style={{
          marginTop: "10px",
          padding: "4px 10px",
          background: node.status === "active" ? "green" : "red",
          borderRadius: "6px",
          display: "inline-block",
          fontSize: "11px",
        }}
      >
        {node.status}
      </div>

      {node.status === "active" && (
        <>
          <p style={{ marginTop: "12px", fontSize: "13px" }}>
            Peers: <strong>{node.peers}</strong>
          </p>

          <p style={{ fontSize: "13px", marginTop: "-6px" }}>
            Credentials: <strong>{node.credentials}</strong>
          </p>
        </>
      )}
    </div>
  );
}
