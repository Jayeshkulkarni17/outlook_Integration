//pages/api/auth/initiatelogin.js
export default async function handler(req, res) {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const redirectUri = encodeURIComponent(
    "http://localhost:3000/api/auth/callback/azure-ad"
  );
  const scope = encodeURIComponent("Calendars.Read offline_access");

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query`;

  res.redirect(authUrl);
}
