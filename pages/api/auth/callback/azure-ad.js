// pages/api/auth/callback/azure-ad.js
import axios from "axios";

export default async function handler(req, res) {
  const { code, error, error_description } = req.query;
  console.log("Received query parameters:", req.query);
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
    console.log("Token response:", tokenResponse.data);
    if (!access_token || !refresh_token) {
      throw new Error("Tokens not received from Microsoft");
    }

    // Calculate expiry time with buffer (5 minutes before actual expiry)
    const expiryTime = Date.now() + (expires_in - 300) * 1000;

    // Return HTML that stores tokens and redirects
    // res.setHeader("Content-Type", "text/html");
    // res.send(`
    //   <html>
    //     <head>
    //       <script>
    //         localStorage.setItem("outlookAccessToken", "${access_token}");
    //         localStorage.setItem("outlookRefreshToken", "${refresh_token}");
    //         localStorage.setItem("outlookTokenExpiry", "${expiryTime}");
    //         window.location.href = "/";
    //       </script>
    //     </head>
    //     <body>Redirecting...</body>
    //   </html>
    // `);
    res.redirect(
      `/#accessToken=${access_token}&refreshToken=${refresh_token}&expiresIn=${expires_in}`
    );
  } catch (error) {
    console.error(
      "Error during token exchange:",
      error.response?.data || error.message
    );
    res.redirect(`/?error=auth_failed`);
  }
}
