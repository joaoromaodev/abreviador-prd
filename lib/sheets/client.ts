import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function lerPrivateKey(bruta: string): string {
  // No dashboard da Vercel a chave pode ser colada com quebras de linha reais OU como "\n"
  // literais (dependendo de como foi copiada do JSON da service account); suportamos as duas.
  return bruta.includes("\\n") ? bruta.replace(/\\n/g, "\n") : bruta;
}

interface CredenciaisSheets {
  clientEmail: string;
  privateKey: string;
  spreadsheetId: string;
}

function obterCredenciais(): CredenciaisSheets {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKeyBruta = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!clientEmail || !privateKeyBruta || !spreadsheetId) {
    throw new Error(
      "Integração com Google Sheets não configurada: defina GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY e GOOGLE_SHEETS_SPREADSHEET_ID."
    );
  }

  return { clientEmail, privateKey: lerPrivateKey(privateKeyBruta), spreadsheetId };
}

let clienteCache: sheets_v4.Sheets | null = null;

export function obterSheets(): sheets_v4.Sheets {
  if (clienteCache) return clienteCache;

  const { clientEmail, privateKey } = obterCredenciais();
  const auth = new google.auth.JWT({ email: clientEmail, key: privateKey, scopes: SCOPES });
  clienteCache = google.sheets({ version: "v4", auth });
  return clienteCache;
}

export function obterSpreadsheetId(): string {
  return obterCredenciais().spreadsheetId;
}
