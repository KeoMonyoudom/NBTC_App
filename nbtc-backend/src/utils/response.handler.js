export const successResponse = (res, statusCode, message, data) => {
  const statusText = getStatusText(statusCode);
  return res.status(statusCode).json({
    code: statusText,
    message,
    data,
  });
};

export const errorResponse = (res, statusCode, message, error = null) => {
  const statusText = getStatusText(statusCode);
  return res.status(statusCode).json({
    code: statusText,
    message,
    error,
  });
};

// 👇 Add this new one
export const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    code: "ValidationError",
    errors,
  });
};

const getStatusText = (statusCode) => {
  const codes = {
    200: "OK",
    201: "Created",
    400: "BadRequest",
    401: "Unauthorized",
    403: "Forbidden",
    404: "NotFound",
    500: "ServerError",
  };
  return codes[statusCode] || "Unknown";
};
