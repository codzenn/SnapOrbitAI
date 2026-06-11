import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL ?? "";

const globalForPrisma = globalThis as unknown as {
  adapter?: PrismaPg;
  prisma?: PrismaClient;
};

const adapter =
  globalForPrisma.adapter ?? new PrismaPg({ connectionString });

const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.adapter = adapter;
  globalForPrisma.prisma = prisma;
}

export { prisma };
