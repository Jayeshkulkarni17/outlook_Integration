import axios from "axios";

export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error("Azure AD error:", error_description);
    return res.redirect(`/?error=${encodeURIComponent(error_description)}`);
  }

  if (!code) {
    return res.status(400).json({ error: "Authorization code is missing" });
  }

  try {
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET,
        code,
        redirect_uri: process.env.AZURE_AD_REDIRECT_URI,
        grant_type: "authorization_code",
        scope: "Calendars.Read offline_access",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Set HTTP-only cookies
    res.setHeader("Set-Cookie", [
      `outlookAccessToken=${access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${expires_in}`,
      `outlookRefreshToken=${refresh_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`, // 30 days
      `outlookTokenExpiry=${
        Date.now() + expires_in * 1000
      }; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${expires_in}`,
    ]);

    res.redirect("/");
  } catch (error) {
    console.error(
      "Error during token exchange:",
      error.response?.data || error.message
    );
    res.redirect(`/?error=auth_failed`);
  }
}
