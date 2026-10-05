const { validateSeedSource } = await import("../src/services/seed/seedDataService.js");

const result = await validateSeedSource({ expand: true });
const output = {
  status: result.status,
  counts: result.counts,
  gameTypeCounts: result.gameTypeCounts,
  missingAssets: result.missingAssets,
  warnings: result.warnings,
  errors: result.errors
};

console.log(JSON.stringify(output, null, 2));
if (result.status !== "PASS") process.exit(1);
