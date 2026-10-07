export default function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || err.status || 500;
  let message = status < 500 ? err.message : 'Internal server error';
  if (err.code === 11000) { status = 409; message = 'A record with that value already exists'; }
  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  if (err.name === 'ValidationError') { status = 400; message = 'Validation failed'; }
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body'; }
  res.status(status).json({ success: false, message, ...(err.errors && status < 500 ? { errors: err.errors } : {}) });
}
