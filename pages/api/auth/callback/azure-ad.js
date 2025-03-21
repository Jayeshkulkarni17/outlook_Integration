// pages/api/auth/callback/azure-ad.js
import axios from "axios";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is missing" });
  }

  try {
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    // Exchange the code for an access token
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET,
        code,
        redirect_uri: process.env.AZURE_AD_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // Redirect to the home page with the access token as a query parameter
    res.redirect(`/?accessToken=${access_token}`);
  } catch (error) {
    console.error(
      "Error during token exchange:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to authenticate" });
  }
}
