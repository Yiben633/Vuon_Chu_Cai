export function sendData(req, res, data, status = 200, meta) {
  res.status(status).json({
    data,
    ...(meta ? { meta } : {}),
    requestId: req.requestId
  });
}

export function sendNoContent(res) {
  res.status(204).end();
}
