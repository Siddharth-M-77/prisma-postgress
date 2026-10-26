const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Aaj raat 12 baje (India time) ka moment
export const getTodayStartIST = () => {
    const ist = new Date(Date.now() + IST_OFFSET_MS);
    ist.setUTCHours(0, 0, 0, 0);
    return new Date(ist.getTime() - IST_OFFSET_MS);
};
