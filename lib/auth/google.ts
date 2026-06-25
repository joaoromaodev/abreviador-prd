import { OAuth2Client } from "google-auth-library";

// Fluxo OAuth (authorization code) com o Google, usando a google-auth-library (já presente via googleapis).
// O redirectUri é derivado do host da requisição, então funciona em localhost e em produção sem variável extra
// (basta cadastrar os dois URIs no console do Google).

function clientId(): string {
  const valor = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!valor) throw new Error("GOOGLE_OAUTH_CLIENT_ID não configurado.");
  return valor;
}

function clientSecret(): string {
  const valor = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!valor) throw new Error("GOOGLE_OAUTH_CLIENT_SECRET não configurado.");
  return valor;
}

function cliente(redirectUri: string): OAuth2Client {
  return new OAuth2Client({ clientId: clientId(), clientSecret: clientSecret(), redirectUri });
}

/** URL de consentimento do Google para onde o usuário é redirecionado ao clicar em "Entrar". */
export function urlAutorizacao(redirectUri: string, state: string): string {
  return cliente(redirectUri).generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });
}

/** Troca o "code" do callback pelos dados do usuário (e-mail verificado + nome). */
export async function trocarCodigoPorUsuario(
  redirectUri: string,
  code: string
): Promise<{ email: string; nome: string } | null> {
  const oauth = cliente(redirectUri);
  const { tokens } = await oauth.getToken(code);
  if (!tokens.id_token) return null;

  const ticket = await oauth.verifyIdToken({ idToken: tokens.id_token, audience: clientId() });
  const payload = ticket.getPayload();
  if (!payload?.email || payload.email_verified !== true) return null;

  return { email: payload.email.toLowerCase(), nome: payload.name ?? payload.email };
}
