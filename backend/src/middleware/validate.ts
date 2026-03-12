import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { AppError } from "./errorHandler";

export function validate(chains: ValidationChain[]) {
  return [
    ...chains,
    (req: Request, _res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new AppError(400, "VALIDATION_ERROR", errors.array()[0].msg));
      }
      next();
    },
  ];
}
