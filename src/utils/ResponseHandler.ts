import { Response } from 'express';

interface ErrorWithMessage extends Error {
  message: string;
}

export const successResponse = (
  res: Response,
  statusCode: number,
  message: string | object,
  data: object = {}
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string | object,
  error: ErrorWithMessage | null = null
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    error: error ? error.message : null,
  });
};

// Optional: If you need CommonJS compatibility
export default { successResponse, errorResponse };
