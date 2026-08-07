// Sem valor embutido. O fallback anterior ("mysecret") é público — o código
// deriva de projeto aberto — e transformava um `.env` incompleto em bypass
// silencioso de autenticação. A ausência é validada no boot por
// `config/requiredSecrets.ts`, que impede a aplicação de subir.
export default {
  secret: process.env.JWT_SECRET as string,
  expiresIn: "15m",
  refreshSecret: process.env.JWT_REFRESH_SECRET as string,
  refreshExpiresIn: "7d"
};
