// pages/api/auth/refresh.js
import axios from "axios";

export default async function handler(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  try {
    const response = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "Calendars.Read offline_access",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Refresh error:", error.response?.data || error.message);
    res.status(400).json({
      error: "Failed to refresh token",
      details: error.response?.data,
    });
  }
}
