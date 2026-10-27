import cron from "node-cron";
import { generateRoi } from "../services/generateRoi.js";
import { generateLevelIncome } from "../services/generateLevelIncome.js";

let isRunning = false;

// Roz raat 12:00 baje India time
export const startRoiCron = () => {
    cron.schedule("0 0 * * *", async () => {
        if (isRunning) return;
        isRunning = true;
        try {
            await generateRoi();
            await generateLevelIncome();
        } catch (error) {
            console.error("ROI cron failed:", error.message);
        } finally {
            isRunning = false;
        }
    }, { timezone: "Asia/Kolkata" });

    console.log("ROI cron scheduled");
};
