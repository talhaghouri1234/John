import ApiError from '../utils/ApiError.js';

export default (_req, _res, next) => next(new ApiError(404, 'Route not found'));
