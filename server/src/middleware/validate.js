import ApiError from '../utils/ApiError.js';

export default (schema) => (req, _res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) return next(new ApiError(400, 'Validation failed', result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))));
  for (const [key, value] of Object.entries(result.data)) req[key] = value;
  next();
};
