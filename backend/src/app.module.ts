import { DynamicModule, Module, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { AuthGuard, DevTokenVerifier, FirebaseTokenVerifier, TOKEN_VERIFIER, type TokenVerifier } from './auth/auth';
import { CONFIG, type AppConfig } from './config';
import {
  AccountController,
  DocumentsController,
  HealthController,
  ItemsController,
  MeController,
  MetadataController,
} from './controllers';
import { DATA_SOURCE, createDataSource } from './db/database';
import {
  MARKET_PROVIDER,
  NoopMarketProvider,
  NoopOcrProvider,
  OCR_PROVIDER,
  type MarketProvider,
  type OcrProvider,
} from './providers/providers';
import { AccountService } from './services/account.service';
import { DocumentsService } from './services/documents.service';
import { ItemsService } from './services/items.service';
import { UsersService } from './services/users.service';
import { ValueService } from './services/value.service';
import { DevStorageController } from './storage/dev-storage.controller';
import { MemoryStorage, S3Storage, STORAGE, type Storage } from './storage/storage';

export interface AppOverrides {
  dataSource?: DataSource;
  storage?: Storage;
  verifier?: TokenVerifier;
  ocr?: OcrProvider;
  market?: MarketProvider;
}

class DraftJanitor implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(private readonly items: ItemsService, @Inject(CONFIG) private readonly config: AppConfig) {}
  onModuleInit() {
    if (this.config.nodeEnv === 'test') return;
    this.timer = setInterval(() => void this.items.purgeStaleDrafts().catch(() => undefined), 60 * 60 * 1000);
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}

@Module({})
export class AppModule {
  static register(config: AppConfig, o: AppOverrides = {}): DynamicModule {
    return {
      module: AppModule,
      controllers: [
        HealthController, MeController, MetadataController, ItemsController, DocumentsController, AccountController,
        ...(config.storageMode === 'memory' && config.nodeEnv !== 'production' ? [DevStorageController] : []),
      ],
      providers: [
        { provide: CONFIG, useValue: config },
        {
          provide: DATA_SOURCE,
          useFactory: async () => {
            const ds = o.dataSource ?? createDataSource(config.databaseUrl);
            if (!ds.isInitialized) await ds.initialize();
            return ds;
          },
        },
        {
          provide: STORAGE,
          useValue: o.storage ?? (config.storageMode === 'memory' ? new MemoryStorage(config.publicUrl) : new S3Storage(config.s3)),
        },
        {
          provide: TOKEN_VERIFIER,
          useFactory: () =>
            o.verifier ?? (config.authMode === 'dev' ? new DevTokenVerifier() : new FirebaseTokenVerifier(config.firebaseProjectId)),
        },
        { provide: OCR_PROVIDER, useValue: o.ocr ?? new NoopOcrProvider() },
        { provide: MARKET_PROVIDER, useValue: o.market ?? new NoopMarketProvider() },
        AuthGuard,
        UsersService,
        ItemsService,
        DocumentsService,
        ValueService,
        AccountService,
        DraftJanitor,
      ],
    };
  }
}
