import { PrismaModule } from "@/prisma/prisma.module";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { SentryModule } from "@sentry/nestjs/setup";
import { LoggerModule } from "nestjs-pino";
import { AuthModule } from "./auth/auth.module";
import { AppConfigModule } from "./config/config.module";
import { FilesModule } from "./files/files.module";
import { UsersModule } from "./users/users.module";
import {OpenaiService} from "@/ai/openai.service";
import {SpeechController} from "@/ai/speech.controller";
import {ChatController} from "@/ai/chat.controller";

@Module({
  imports: [
    SentryModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 20 }],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== "production" ? "debug" : "info",

        transport:
          process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: {
                  colorize: true,
                  singleLine: true,
                },
              }
            : undefined,

        autoLogging: true,
        customSuccessMessage: (req, res) => {
          return `${req.method} ${req.url} completed`;
        },
        customErrorMessage: (req, res, err) => {
          return `${req.method} ${req.url} failed with error: ${err.message}`;
        },
      },
    }),
    AppConfigModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    FilesModule,
  ],
  controllers: [SpeechController, ChatController],
  providers: [
    OpenaiService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
