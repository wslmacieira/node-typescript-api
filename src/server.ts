import './util/module-alias';
import express, { Application, Request, Response } from 'express';
import { Server } from '@overnightjs/core';
import * as database from '@src/database';
import * as http from 'http';
import expressPino from 'express-pino-logger';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiSchema from './api.schema.json';
import * as OpenApiValidator from 'express-openapi-validator';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

import { BeachesController } from './controllers/beaches';
import { ForecastController } from './controllers/forecast';
import { UsersController } from './controllers/users';
import logger from './logger';
import { httpLoggerMiddleware } from './middlewares/http-logger';
import { randomUUID } from 'crypto';
import { apiErrorValidator } from './middlewares/api-error-validator';

export class SetupServer extends Server {
  private server?: http.Server;
  constructor(private port = 3000) {
    super();
  }

  public async init(): Promise<void> {
    this.setupExpress();
    await this.docsSetup();
    this.setupControllers();
    await this.databaseSetup();
    this.setupErrorHandlers();
  }

  public getApp(): Application {
    return this.app;
  }

  private async docsSetup(): Promise<void> {
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(apiSchema));
    this.app.use(
      OpenApiValidator.middleware({
        apiSpec: apiSchema as OpenAPIV3.Document,
        validateRequests: true, //will be implemented in step2
        validateResponses: true, //will be implemented in step2
      })
    );
  }

  private setupExpress(): void {
    this.app.use(express.json());
    this.app.use(httpLoggerMiddleware);
    this.app.use(
      expressPino({
        logger,
        serializers: {
          req: (req) => {
            req.requestBody = req.raw.body;
            req.id = randomUUID();
            return req;
          },
          res: (res) => {
            res.responseBody = res.raw.contentBody;
            return res;
          },
        },
      })
    );
    this.app.use(cors({ origin: '*' }));
  }

  private setupErrorHandlers(): void {
    this.app.use(apiErrorValidator);
  }

  private setupControllers(): void {
    const forecastController = new ForecastController();
    const beachesController = new BeachesController();
    const usersController = new UsersController();
    this.addControllers([
      forecastController,
      beachesController,
      usersController,
    ]);
  }

  private async databaseSetup(): Promise<void> {
    await database.connect();
  }

  public async close(): Promise<void> {
    await database.close();
    if (this.server) {
      await new Promise((resolve, reject) => {
        this.server?.close((err) => {
          if (err) {
            return reject(err);
          }
          resolve(true);
        });
      });
    }
  }

  public async dropDatabase(): Promise<void> {
    await database.dropDatabase();
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info('Server listening on port: ' + this.port);
    });
  }
}
