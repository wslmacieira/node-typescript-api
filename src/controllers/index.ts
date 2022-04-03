import { Response } from 'express';
import mongoose from 'mongoose';
import logger from '../logger';
import { CUSTOM_VALIDATION } from '../models/users';
import ApiError, { APIError } from '../util/errors/api-error';

export abstract class BaseController {
  protected sendCreatedUpdatedErrorResponse(
    res: Response,
    error: mongoose.Error.ValidationError | Error
  ): void {
    if (error instanceof mongoose.Error.ValidationError) {
      const clientErrors = this.handleClientErrors(error);
      res.status(clientErrors.code).send(
        ApiError.format({
          code: clientErrors.code,
          message: clientErrors.error,
        })
      );
    } else {
      logger.error(error);
      res
        .status(500)
        .send(ApiError.format({ code: 500, message: 'Something went wrong!' }));
    }
  }

  private handleClientErrors(error: mongoose.Error.ValidationError): {
    code: number;
    error: string;
  } {
    const duplicatedKindErrors = Object.values(error.errors).filter(
      (err) => err.kind === CUSTOM_VALIDATION.DUPLICATED
    );
    if (duplicatedKindErrors.length) {
      return { code: 409, error: error.message };
    }
    return { code: 400, error: error.message };
  }

  protected sendErrorResponse(res: Response, apiErro: APIError): Response {
    return res.status(apiErro.code).send(ApiError.format(apiErro));
  }
}
