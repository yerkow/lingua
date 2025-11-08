import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    fullname?: string;
    person?: string;
    jwt?: string;
  }
}

