// check-pg.js - run with: node check-pg.js
import { prisma } from "./lib/prisma.js";

const [{ server_version }] = await prisma.$queryRaw`SHOW server_version`;
const [{ timezone }] = await prisma.$queryRaw`SHOW timezone`;

// Check whether uuidv7() exists on this server
const [{ has_uuidv7 }] = await prisma.$queryRaw`
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'uuidv7') AS has_uuidv7
`;

console.log({ server_version, timezone, has_uuidv7 });
await prisma.$disconnect();