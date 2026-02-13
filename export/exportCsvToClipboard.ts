import * as Clipboard from "expo-clipboard";

export async function exportCsvToClipboard(csv: string) {
  await Clipboard.setStringAsync(csv);
  if (__DEV__) {
    console.log("CSV copied to clipboard");
  }
}


