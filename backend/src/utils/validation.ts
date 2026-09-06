/**
 * Centralized Request Validation Middleware & Utilities (Backend)
 * 
 * Intercepts incoming HTTP requests, validates request body, query parameters,
 * and headers against centralized Zod schemas, and fails fast with HTTP 400 Bad Request.
 */

import type { Request, Response, NextFunction } from 'express';
import type { z, ZodError } from 'zod';
import logger from './logger';
import type { ValidationErrorDetail } from '../types/validation';

export const formatZodErrors = (error: ZodError): ValidationErrorDetail[] => {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : 'root',
    message: issue.message
  }));
};

/**
 * Validates req.body against a centralized Zod schema.
 */
export const validateBody = <T>(
  schema: z.ZodType<T>
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      logger.warn('Request body validation failed', {
        path: req.path,
        method: req.method,
        errors: formattedErrors
      });
      res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: formattedErrors
      });
      return;
    }
    req.body = result.data;
    next();
  };
};

/**
 * Validates req.query against a centralized Zod schema.
 */
export const validateQuery = <T>(
  schema: z.ZodType<T>
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      logger.warn('Query parameter validation failed', {
        path: req.path,
        method: req.method,
        errors: formattedErrors
      });
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: formattedErrors
      });
      return;
    }
    req.query = result.data as unknown as Request['query'];
    next();
  };
};

/**
 * Validates req.headers against a centralized Zod schema.
 */
export const validateHeaders = <T>(
  schema: z.ZodType<T>
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.headers);
    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      logger.warn('Request headers validation failed', {
        path: req.path,
        method: req.method,
        errors: formattedErrors
      });
      res.status(400).json({
        success: false,
        message: 'Invalid request headers',
        errors: formattedErrors
      });
      return;
    }
    next();
  };
};
