import { getCorsConfig } from "@/config/cors.config";
import { StringValue, ms, parseBoolean, parseSameSite } from "@/libs/common/utils";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { RedisStore } from "connect-redis";
import session from "express-session";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { createClient } from "redis";
import { AppModule } from "./app.module";
import { generateOpenAPI } from "./config/openapi.config";
import "./instrument";

async function bootstrap() {
  // try {
  //   execSync('pnpx prisma migrate deploy', { stdio: 'inherit' });
  //   console.log('Миграции успешно применены');
  // } catch (error) {
  //   console.error('Ошибка при применении миграций:', error);
  // }
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  const config = app.get(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    })
  );
  app.setGlobalPrefix("api");
  app.set("trust proxy", true);
  await generateOpenAPI(app);

  const redis = createClient({ url: config.getOrThrow("REDIS_URI") });
  await redis.connect();

  app.use(
    session({
      store: new RedisStore({
        client: redis,
        prefix: config.getOrThrow<string>("SESSION_FOLDER"),
      }),
      name: config.getOrThrow<string>("SESSION_NAME"),
      secret: config.getOrThrow<string>("SESSION_SECRET"),
      resave: true,
      saveUninitialized: false,
      cookie: {
        path: "/",
        // domain: config.getOrThrow<string>("SESSION_DOMAIN"),
        secure: parseBoolean(config.getOrThrow<string>("SESSION_SECURE")),
        httpOnly: parseBoolean(config.getOrThrow<string>("SESSION_HTTP_ONLY")),
        sameSite: parseSameSite(config.getOrThrow<string>("SESSION_SAME_SITE")),
        maxAge: ms(config.getOrThrow<StringValue>("SESSION_MAX_AGE")),
      },
    })
  );
  app.use(helmet());

  app.enableCors(getCorsConfig(config));

  await app.listen(config.getOrThrow<number>("APPLICATION_PORT"));
}
bootstrap();
