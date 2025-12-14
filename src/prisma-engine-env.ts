// Ensure Prisma engine type uses binary to avoid adapter requirement in Prisma 7

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
}

