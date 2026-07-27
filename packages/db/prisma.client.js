import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/index.js";

// Singleton Prisma client (MariaDB/MySQL driver adapter). Never `new PrismaClient()`
// elsewhere — import `prisma` from `@aya/db/prisma.client.js`.
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  port: process.env.DATABASE_PORT || 3306,
});

const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "stdout", level: "error" },
    { emit: "stdout", level: "warn" },
  ],
  errorFormat: "pretty",
});

export { prisma };
