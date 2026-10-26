import { prisma } from "../lib/prisma.js";

const BATCH_SIZE = 3000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

const getTodayStartIST = () => {
    const ist = new Date(Date.now() + IST_OFFSET_MS);
    ist.setUTCHours(0, 0, 0, 0);
    return new Date(ist.getTime() - IST_OFFSET_MS);
}

// CTE (Common Table Expression) - WITH
//  due As (SELECT ...)
// upd As (UPDATE ...)
// ins As (INSERT ...)
// wallets AS (UPDATE ...)
// SELECT count(*) AS paid FROM upd
//  With due As (...)
// Is bracket (...) ke andar jo subquery chalegi, uske result ko poori query ke liye ek temporary naam due de diya gaya hai.
// ye CTEs hai

// PostgreSQL mein do colon :: ka matlab hota hai Type Cast (Convert) karna.

// INSERT INTO "Roi" (col1, col2, col3, col4, col5, col6, col7, col8)
// SELECT            val1, val2, val3, val4, val5, val6, val7, val8 FROM upd

const payRoiBatch = async (todayStart) => {
    const now = new Date();
    const result = await prisma.$queryRaw`

     With due As (
      Select id From "Investment"
     WHERE status = 'ACTIVE'
       And "createdAt" < ${todayStart}
       And ("lastRoiAt" IS NULL OR "lastRoiAt" < ${todayStart})
       ORDER BY id
       LIMIT ${BATCH_SIZE}
       FOR UPDATE SKIP LOCKED
     ),

     upd As (
     UPDATE "Investment" i SET
         "daysPaid" = i."daysPaid" + 1,
         "lastRoiAt" = ${now},
       "status" = (CASE WHEN i."daysPaid" + 1 >= i."totalDays" THEN 'COMPLETED' ELSE 'ACTIVE' END)::"InvestmentStatus"
       FROM due
       WHERE i.id = due.id
       RETURNING i.id, i."userId", i.amount,
       round(i."amount" * i."dailyRoiPercent" / 100, 4) AS roi,
       i."daysPaid" AS day
     ) ,
      ins As (
      INSERT INTO "Roi" (id, "userId", "investmentId", day, "baseAmount", amount, "createdAt", "updatedAt")
      SELECT uuidv7(), "userId", id, day, amount, roi, ${now}, ${now} FROM upd
      ),

      Wallet As (
      UPDATE "User" u SET
       "roiWallet" = u."roiWallet" + s.total,
       "updatedAt" = ${now}
       FROM (SELECT "userId", SUM(roi) as total FROM upd GROUP BY "userId" ) s
       WHERE u.id = s."userId"
      )

     SELECT count(*)::int as paid FROM upd

     
    `;
    return result[0].paid;
}

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
