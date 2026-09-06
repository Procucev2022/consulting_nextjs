/**
 * Centralized Request Validation Middleware & Utilities (Backend)
 * 
 * Intercepts incoming HTTP requests, validates request body, query parameters,
 * and headers against centralized Zod schemas, and fails fast with HTTP 400 Bad Request.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import logger from './logger';
import { ValidationErrorDetail } from '../types/validation';

export const formatZodErrors = (error: ZodError): ValidationErrorDetail[] => {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : 'root',
    message: issue.message
  }));
};

/**
 * Validates req.body against a centralized Zod schema.
 */
export const validateBody = (schema: z.ZodType<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      logger.warn('Request body validation failed', {
        path: req.path,
        method: req.method,
        errors: formattedErrors
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: formattedErrors
      });
    }
    req.body = result.data;
    next();
  };
};

/**
 * Validates req.query against a centralized Zod schema.
 */
export const validateQuery = (schema: z.ZodType<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      logger.warn('Query parameter validation failed', {
        path: req.path,
        method: req.method,
        errors: formattedErrors
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: formattedErrors
      });
    }
    req.query = result.data as any;
    next();
  };
};

/**
 * Validates req.headers against a centralized Zod schema.
 */
export const validateHeaders = (schema: z.ZodType<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.headers);
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      logger.warn('Request headers validation failed', {
        path: req.path,
        method: req.method,
        errors: formattedErrors
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid request headers',
        errors: formattedErrors
      });
    }
    next();
  };
};
