export function toCsv(rows: any[]): string {
  if (!rows || rows.length === 0) return "";

  const headers = Object.keys(rows[0]);

  const csvRows = [
    headers.join(","), // header row
    ...rows.map((row) =>
      headers
        .map((key) => {
          const value = row[key];
          if (value === null || value === undefined) return "";

          // Format speed values to 4 decimal places for export
          if (key === "speed_mps" || key === "speed_kmph") {
            // Convert to number if it's a string, then format
            const numValue = typeof value === "string" ? parseFloat(value) : value;
            if (typeof numValue === "number" && Number.isFinite(numValue)) {
              return numValue.toFixed(4);
            }
            // If conversion fails, return 0.0000
            return "0.0000";
          }

          // safely stringify values (handles commas, nulls, strings)
          return JSON.stringify(value);
        })
        .join(",")
    ),
  ];

  return csvRows.join("\n");
}
