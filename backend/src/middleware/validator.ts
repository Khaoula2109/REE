import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      next();
      return;
    }

    // Format errors
    const extractedErrors: { [key: string]: string[] } = {};
    errors.array().forEach((err) => {
      if (err.type === 'field') {
        if (!extractedErrors[err.path]) {
          extractedErrors[err.path] = [];
        }
        extractedErrors[err.path].push(err.msg);
      }
    });

    res.status(400).json({
      error: 'Erreur de validation',
      errors: extractedErrors,
    });
  };
};
