import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { z } from 'zod';
import { AuthGuard, Identity, type VerifiedIdentity } from './auth/auth';
import { parse } from './common/zod';
import { DATA_SOURCE } from './db/database';
import {
  CATEGORIES,
  DOCUMENT_TYPES,
  confirmDocumentSchema,
  createItemSchema,
  deleteItemSchema,
  photoUploadUrlSchema,
  putMeSchema,
  uploadUrlSchema,
} from './rules/schemas';
import { AccountService } from './services/account.service';
import { DocumentsService } from './services/documents.service';
import { ItemsService } from './services/items.service';
import { UsersService } from './services/users.service';
import { ValueService } from './services/value.service';

const uuid = new ParseUUIDPipe({ version: '4' });

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get()
  get(@Identity() id: VerifiedIdentity) {
    return this.users.getMe(id);
  }

  /** Décision P8 : écran dédié « Compléter le profil ». */
  @Put()
  put(@Identity() id: VerifiedIdentity, @Body() body: unknown) {
    return this.users.putMe(id, parse(putMeSchema, body).full_name);
  }
}

@Controller('metadata')
@UseGuards(AuthGuard)
export class MetadataController {
  constructor(@Inject(DATA_SOURCE) private readonly ds: DataSource) {}

  @Get('controlled-other-types')
  async otherTypes() {
    const rows = await this.ds.query(
      'select id, label_fr, label_en, unique_id_label from controlled_other_types where active order by label_fr',
    );
    return { items: rows };
  }

  @Get('certificate-issuers')
  async issuers() {
    return { items: await this.ds.query('select id, label_fr, label_en from certificate_issuers order by position') };
  }
}

@Controller('items')
@UseGuards(AuthGuard)
export class ItemsController {
  constructor(
    private readonly users: UsersService,
    private readonly items: ItemsService,
    private readonly docs: DocumentsService,
    private readonly value: ValueService,
  ) {}

  @Get()
  async list(@Identity() id: VerifiedIdentity, @Query('view') view?: string, @Query('sort') sort?: string) {
    const user = await this.users.resolve(id);
    const v = view === 'vault' ? 'vault' : 'collection';
    const s = sort === 'oldest' ? 'oldest' : 'recent';
    return { items: await this.items.list(user, v, s) };
  }

  @Get(':id')
  async get(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string) {
    return this.items.get(await this.users.resolve(id), itemId);
  }

  @Post()
  async create(@Identity() id: VerifiedIdentity, @Body() body: unknown) {
    return this.items.create(await this.users.resolve(id), parse(createItemSchema, body));
  }

  @Patch(':id')
  async patch(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string) {
    return this.items.patch(await this.users.resolve(id), itemId);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string, @Body() body: unknown) {
    const b = parse(deleteItemSchema, body);
    await this.items.delete(await this.users.resolve(id), itemId, b.reason, b.free_text);
  }

  // ── Certificat ──
  @Post(':id/certificate/upload-url')
  async certUploadUrl(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string, @Body() body: unknown) {
    const b = parse(uploadUrlSchema, body);
    return this.items.certificateUploadUrl(await this.users.resolve(id), itemId, b.content_type);
  }

  @Post(':id/certificate/confirm')
  @HttpCode(200)
  async certConfirm(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string, @Body() body: unknown) {
    const b = parse(z.object({ category: z.enum(CATEGORIES).optional() }), body ?? {});
    return this.items.certificateConfirm(await this.users.resolve(id), itemId, b.category ?? null);
  }

  @Get(':id/certificate')
  async cert(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string) {
    return this.docs.certificate(await this.users.resolve(id), itemId);
  }

  // ── Photo principale (décision P11, ajoutée pendant le flow d'ajout) ──
  @Post(':id/photo/upload-url')
  async photoUploadUrl(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string, @Body() body: unknown) {
    const b = parse(photoUploadUrlSchema, body);
    return this.items.photoUploadUrl(await this.users.resolve(id), itemId, b.content_type);
  }

  // ── Documents ──
  @Post(':id/documents/upload-url')
  async docUploadUrl(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string, @Body() body: unknown) {
    const b = parse(uploadUrlSchema.extend({ type: z.enum(DOCUMENT_TYPES).optional() }), body);
    return this.docs.uploadUrl(await this.users.resolve(id), itemId, b.content_type, b.type);
  }

  @Post(':id/documents/confirm')
  @HttpCode(200)
  async docConfirm(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string, @Body() body: unknown) {
    const b = parse(confirmDocumentSchema, body);
    return this.docs.confirm(await this.users.resolve(id), itemId, b.upload_key, b.type);
  }

  @Get(':id/documents')
  async docs_(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string) {
    return this.docs.list(await this.users.resolve(id), itemId);
  }

  // ── Valeur ──
  @Get(':id/value')
  async getValue(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string) {
    return this.value.get(await this.users.resolve(id), itemId);
  }

  @Post(':id/value/refresh')
  @HttpCode(202)
  async refresh(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string) {
    return this.value.refresh(await this.users.resolve(id), itemId);
  }

  @Get(':id/value/timeseries')
  async series(@Identity() id: VerifiedIdentity, @Param('id', uuid) itemId: string) {
    return this.value.timeseries(await this.users.resolve(id), itemId);
  }
}

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly users: UsersService, private readonly docs: DocumentsService) {}

  /** Page Documents : tous les documents de l'utilisateur, groupés par type. */
  @Get()
  async all(@Identity() id: VerifiedIdentity) {
    return this.docs.listAll(await this.users.resolve(id));
  }
}

@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private readonly users: UsersService, private readonly account: AccountService) {}

  @Delete()
  @HttpCode(204)
  async remove(@Identity() id: VerifiedIdentity) {
    await this.account.delete(await this.users.resolve(id));
  }
}
