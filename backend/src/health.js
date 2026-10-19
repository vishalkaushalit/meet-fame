export function createHealthHandler(connection, env = process.env) {
  return async (req, res) => {
    const requiresDatabase = connection.status().configured || Boolean(env.VERCEL);
    if (requiresDatabase) {
      try { await connection.connect(); } catch { /* The safe category is exposed below. */ }
    }
    const database = connection.status();
    const connected = database.state === 'connected';
    const healthy = !requiresDatabase || connected;
    res.set('Cache-Control', 'no-store');
    return res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'degraded',
      app: 'MeetFame API',
      version: '1.0.0',
      time: new Date().toISOString(),
      mongoConnected: connected,
      database,
      vercelBlobEnabled: Boolean(env.BLOB_READ_WRITE_TOKEN)
    });
  };
}
