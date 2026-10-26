import { prisma } from "../lib/prisma.js";

const BATCH_SIZE = 1000;
// Level 1 se 5 tak, ROI amount ka kitna percent
const LEVEL_PERCENTS = [10, 5, 3, 2, 1];

// Ek query mein poora batch: har ROI ke 5 sponsor dhoondo, LevelIncome rows insert,
// levelWallet update, aur ROI ko done mark karo. Sab ek transaction hai.
const payLevelIncomeBatch = async () => {
    const now = new Date();
    const result = await prisma.$queryRaw`
        WITH RECURSIVE src AS (
            SELECT id, "userId", amount FROM "Roi"
            WHERE "levelIncomeDone" = false
            ORDER BY id
            LIMIT ${BATCH_SIZE}
            -- Do run ek saath chalein to ek ROI ek hi run uthayega
            FOR UPDATE SKIP LOCKED
        ),
        upline AS (
            -- Level 1: ROI lene wale ka sponsor
            SELECT s.id AS roi_id, s."userId" AS from_id, s.amount AS base, u."sponsorId" AS receiver_id, 1 AS level
            FROM src s JOIN "User" u ON u.id = s."userId"
            WHERE u."sponsorId" IS NOT NULL
            UNION ALL
            -- Level 2 se 5: sponsor ka sponsor
            SELECT up.roi_id, up.from_id, up.base, u."sponsorId", up.level + 1
            FROM upline up JOIN "User" u ON u.id = up.receiver_id
            WHERE up.level < ${LEVEL_PERCENTS.length} AND u."sponsorId" IS NOT NULL
        ),
        income AS (
            SELECT roi_id, from_id, receiver_id, level, base,
                   round(base * (${LEVEL_PERCENTS}::numeric[])[level] / 100, 4) AS amount
            FROM upline
        ),
        ins AS (
            INSERT INTO "LevelIncome" (id, "userId", "receivedFromId", "roiId", level, amount, "baseAmount", "createdAt", "updatedAt")
            SELECT uuidv7(), receiver_id, from_id, roi_id, level, amount, base, ${now}, ${now} FROM income
        ),
        wallets AS (
            -- Ek sponsor ko kai logon se income aaye to wallet ek hi baar update, total jod ke
            UPDATE "User" u SET
                "levelWallet" = u."levelWallet" + s.total,
                "updatedAt" = ${now}
            FROM (SELECT receiver_id, SUM(amount) AS total FROM income GROUP BY receiver_id) s
            WHERE u.id = s.receiver_id
        ),
        done AS (
            UPDATE "Roi" r SET "levelIncomeDone" = true, "updatedAt" = ${now}
            FROM src WHERE r.id = src.id
        )
        SELECT (SELECT count(*)::int FROM src) AS rois,
               (SELECT count(*)::int FROM income) AS incomes
    `;
    return result[0];
};

export const generateLevelIncome = async () => {
    const startedAt = Date.now();
    let rois = 0;
    let incomes = 0;

    while (true) {
        const batch = await payLevelIncomeBatch();
        rois += batch.rois;
        incomes += batch.incomes;
        if (batch.rois < BATCH_SIZE) break;
    }

    console.log(`Level income done: ${rois} ROIs, ${incomes} incomes in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
    return { rois, incomes };
};
