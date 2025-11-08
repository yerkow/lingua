import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { writeFileSync } from "fs";
import { RedocModule, RedocOptions } from "nestjs-redoc";
import * as fs from "fs";
/**
 * Настраивает и публикует OpenAPI-документацию для приложения NestJS с использованием Swagger и Redoc.
 *
 * @param app - Экземпляр приложения NestJS, для которого генерируется документация.
 *
 * @remark
 * Документация доступна по маршруту `/api` с базовой аутентификацией (логин: admin, пароль: 123).
 */
export async function generateOpenAPI(app: INestApplication): Promise<void> {
  const options = new DocumentBuilder()
    .setTitle("ABU KPI API")
    .setVersion("0.1")
    .addCookieAuth("session", { type: "apiKey", in: "cookie" })
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    deepScanRoutes: true,
  });

  const uploadPath = "./uploads/openapi";

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  writeFileSync(
    `${uploadPath}/openapi-spec.json`,
    JSON.stringify(document, null, 2)
  );

  // console.log('Generated OpenAPI JSON:', JSON.stringify(document, null, 2));

  const redocOptions: RedocOptions = {
    title: "ABU KPI Backend API",
    sortPropsAlphabetically: true,
    hideDownloadButton: true,
    hideHostname: true,
    // auth: {
    //   enabled: true,
    //   user: "abu_kpi_doc",
    //   password: "abu_kpi_doc2025",
    // },
  };

  RedocModule.setup("docs", app, document, redocOptions);
}
