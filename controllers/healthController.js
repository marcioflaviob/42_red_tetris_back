export const getHealth = (req, res) => {
  const startTime = process.hrtime.bigint();
  const isHealthy = true;

  const endTime = process.hrtime.bigint();
  const processingTimeMs = Number(endTime - startTime) / 1_000_000;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'KO',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    processingTime: `${processingTimeMs.toFixed(3)}ms`,
  });
};
