// Every limit of the AI update path in one place (ops/AI-UPDATES.ko.md section 9).
// web/ops/ai-sync-check.py keeps the workflow-side copies; ops/test_ai_sync_check.py
// fails when the two differ, so change both together.
export const AI_SYNC_LIMITS={
 maxItemsPerFile:100,
 maxFileBytes:1_000_000,
 maxFilesPerRun:5,
 scanWindowFiles:20,
 maxApplyStartsPerHour:6,
 maxCallsPerHour:60,
 itemsPerApplyCall:20,
 maxImagesPerItem:30,
 maxImagesPerFile:200,
 maxImageBytes:40_000_000,
 leaseMs:300_000,
 maxFieldsJsonBytes:65_536,
 callHistoryDays:7,
} as const;
