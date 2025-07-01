import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { outlookRefreshToken } = req.cookies;

  if (!outlookRefreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  try {
    const response = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET,
        refresh_token: outlookRefreshToken,
        grant_type: "refresh_token",
        scope: "Calendars.Read offline_access",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    const isProduction = process.env.NODE_ENV === "production";
    const secureFlag = isProduction ? "Secure; " : "";

    // Set new HTTP-only cookies
    res.setHeader("Set-Cookie", [
      `outlookAccessToken=${access_token}; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Max-Age=${expires_in}`,
      `outlookRefreshToken=${refresh_token}; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Max-Age=2592000`, // 30 days
      `outlookTokenExpiry=${
        Date.now() + expires_in * 1000
      }; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Max-Age=${expires_in}`,
    ]);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Refresh error:", error.response?.data || error.message);

    // Clear cookies if refresh fails
    res.setHeader("Set-Cookie", [
      "outlookAccessToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      "outlookRefreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      "outlookTokenExpiry=; HttpOnly; Secure; SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ]);

    res.status(400).json({
      error: "Failed to refresh token",
      details: error.response?.data,
    });
  }
}
