import ApiError from '../utils/ApiError.js';

export function browserSecurity(config) {
  const origins = new Set(config.CLIENT_ORIGINS);
  return {
    corsOptions: {
      origin(origin, callback) {
        // Health checks and other non-browser reads need no CORS response header.
        if (origin === undefined) return callback(null, false);
        if (origins.has(origin)) return callback(null, true);
        return callback(new ApiError(403, 'Origin not allowed'));
      },
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Protection'],
    },
    protectWrites(req, _res, next) {
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
      let origin = req.headers.origin;
      // Fall back only when Origin is absent, never when it is invalid or "null".
      if (origin === undefined && req.headers.referer) {
        try {
          const referrer = new URL(req.headers.referer);
          if (!referrer.username && !referrer.password) origin = referrer.origin;
        } catch { /* Invalid browser provenance fails closed below. */ }
      }
      if (!origins.has(origin)) return next(new ApiError(403, 'Origin not allowed'));
      // Forms cannot supply this header. Cross-origin scripts must pass the
      // exact-origin CORS preflight first, including multipart uploads.
      if (req.get('X-CSRF-Protection') !== '1' || req.get('Sec-Fetch-Mode') === 'navigate' ||
          (req.get('Sec-Fetch-Dest') && req.get('Sec-Fetch-Dest') !== 'empty')) {
        return next(new ApiError(403, 'CSRF protection required'));
      }
      // Sec-Fetch-Site=cross-site is legitimate only after the checks above.
      return next();
    },
  };
}
