import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import * as Joi from "joi";
import { join } from "path";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "..", "uploads"),
      serveRoot: "/uploads",
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
      validationSchema: Joi.object({
        APPLICATION_PORT: Joi.string().default("3003"),
        NODE_ENV: Joi.string()
          .valid("development", "production", "test")
          .default("development"),
        ALLOWED_ORIGIN: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        REDIS_URI: Joi.string()
          .uri({ scheme: [/redis|rediss|redis\+srv/] })
          .required(),
        SESSION_FOLDER: Joi.string().default("sess:"),
        SESSION_NAME: Joi.string().default("session"),
        SESSION_SECRET: Joi.string().min(16).required(),
        SESSION_DOMAIN: Joi.string().allow("", null).default(""),
        SESSION_SECURE: Joi.string().valid("true", "false").default("false"),
        SESSION_HTTP_ONLY: Joi.string().valid("true", "false").default("true"),
        SESSION_SAME_SITE: Joi.string()
          .valid("lax", "strict", "none", "true", "false")
          .default("lax"),
        SESSION_MAX_AGE: Joi.string().default("7d"),
        VAPID_PUBLIC_KEY: Joi.string().required(),
        VAPID_PRIVATE_KEY: Joi.string().required(),
        OPENAI_API_KEY: Joi.string().required(),
        VAPID_SUBJECT: Joi.string().required(),
      }),
    }),
  ],
})
export class AppConfigModule {}
