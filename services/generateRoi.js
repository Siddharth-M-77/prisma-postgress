import { prisma } from "../lib/prisma.js";

const BATCH_SIZE = 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getTodayStartIST = () => {
    const ist = new Date(Date.now() + IST_OFFSET_MS);
    ist.setUTCHours(0, 0, 0, 0);
    return new Date(ist.getTime() - IST_OFFSET_MS);
};

// Ek query mein poora batch: investments update, ROI rows insert, wallets update.
// Sab ek transaction hai, kuch fail hua to poora batch rollback.
const payRoiBatch = async (todayStart) => {
    const now = new Date();
    const result = await prisma.$queryRaw`
        WITH due AS (
            SELECT id FROM "Investment"
            WHERE status = 'ACTIVE'
              AND "createdAt" < ${todayStart}
              AND ("lastRoiAt" IS NULL OR "lastRoiAt" < ${todayStart})
            ORDER BY id
            LIMIT ${BATCH_SIZE}
            -- Do run ek saath chalein to ek investment ek hi run uthayega
            FOR UPDATE SKIP LOCKED
        ),
        upd AS (
            UPDATE "Investment" i SET
                "daysPaid" = i."daysPaid" + 1,
                "lastRoiAt" = ${now},
                status = (CASE WHEN i."daysPaid" + 1 >= i."totalDays" THEN 'COMPLETED' ELSE 'ACTIVE' END)::"InvestmentStatus",
                "updatedAt" = ${now}
            FROM due
            WHERE i.id = due.id
            RETURNING i.id, i."userId", i.amount, i."daysPaid" AS day,
                      round(i.amount * i."dailyRoiPercent" / 100, 4) AS roi
        ),
        ins AS (
            INSERT INTO "Roi" (id, "userId", "investmentId", day, "baseAmount", amount, "createdAt", "updatedAt")
            SELECT uuidv7(), "userId", id, day, amount, roi, ${now}, ${now} FROM upd
        ),
        wallets AS (
            -- Ek user ki kai investments hon to wallet ek hi baar update, total jod ke
            UPDATE "User" u SET
                "roiWallet" = u."roiWallet" + s.total,
                "updatedAt" = ${now}
            FROM (SELECT "userId", SUM(roi) AS total FROM upd GROUP BY "userId") s
            WHERE u.id = s."userId"
        )
        SELECT count(*)::int AS paid FROM upd
    `;
    return result[0].paid;
};

export const generateRoi = async () => {
    const todayStart = getTodayStartIST();
    const startedAt = Date.now();
    let paid = 0;

    while (true) {
        const count = await payRoiBatch(todayStart);
        paid += count;
        if (count < BATCH_SIZE) break;
    }

    console.log(`ROI done: ${paid} paid in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
    return { paid };
};
