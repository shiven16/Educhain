import React from "react";

export default function NetworkGraph({ nodes }) {
  return (
    <div style={{
      marginTop: "40px",
      textAlign: "center",
      opacity: 0.7
    }}>
      <h3>Network Topology</h3>
      <p>(Conceptual Visualization)</p>

      <div style={{
        marginTop: "20px",
        display: "flex",
        justifyContent: "center",
        gap: "40px"
      }}>
        {nodes.map(n => (
          <div key={n.id} style={{ fontSize: "12px" }}>
            🔵 {n.name}
          </div>
        ))}
      </div>
    </div>
  );
}
