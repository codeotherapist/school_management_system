// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // Allows global prisma instance to persist across hot reloads in dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Use pooled URL in production (serverless) to avoid exhausting Postgres connections
const isProduction = process.env.NODE_ENV === 'production'
const databaseUrl = isProduction
  ? process.env.DATABASE_URL_POOLED
  : process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL or DATABASE_URL_POOLED is not set')
}

const prisma = global.prisma ?? new PrismaClient({
  datasources: { db: { url: databaseUrl } },
})

if (!isProduction) global.prisma = prisma

export default prisma
