export async function fetchNodeData(baseUrl) {
  try {
    const health = await fetch(`${baseUrl}/health`).then(res => res.json());
    const stats = await fetch(`${baseUrl}/stats`).then(res => res.json());

    return {
      id: health.nodeName,
      name: health.nodeName,
      type: health.nodeType,
      status: "active",
      peers: stats.peerIds.length,
      credentials: stats.credentialsInLedger,
      baseUrl
    };
  } catch (err) {
    return {
      name: baseUrl,
      type: "unknown",
      status: "offline",
      peers: 0,
      credentials: 0,
      baseUrl
    };
  }
}
