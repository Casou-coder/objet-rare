import { Controller, Get, Inject, Put, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppError } from '../common/errors';
import { STORAGE, type MemoryStorage } from './storage';

/**
 * Émule les URLs présignées S3 en développement (STORAGE_MODE=memory uniquement,
 * jamais enregistré en production). Les URLs sont signées HMAC et expirent.
 */
@Controller('dev-storage')
export class DevStorageController {
  constructor(@Inject(STORAGE) private readonly storage: MemoryStorage) {}

  private key(req: Request): string {
    return decodeURIComponent(req.path.replace(/^\/dev-storage\//, ''));
  }

  @Put('*')
  put(@Req() req: Request, @Res() res: Response, @Query('expires') expires: string, @Query('sig') sig: string) {
    const key = this.key(req);
    if (!this.storage.verify('PUT', key, Number(expires), sig ?? '')) throw new AppError('FORBIDDEN');
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    this.storage.put(key, body, req.header('content-type') ?? 'application/octet-stream');
    res.status(200).end();
  }

  @Get('*')
  async get(@Req() req: Request, @Res() res: Response, @Query('expires') expires: string, @Query('sig') sig: string) {
    const key = this.key(req);
    if (!this.storage.verify('GET', key, Number(expires), sig ?? '')) throw new AppError('FORBIDDEN');
    const obj = await this.storage.get(key);
    if (!obj) throw new AppError('NOT_FOUND');
    res.setHeader('Content-Type', obj.contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).send(obj.body);
  }
}
