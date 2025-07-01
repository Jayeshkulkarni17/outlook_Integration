// pages/api/auth/set-tokens.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { accessToken, refreshToken, expiresIn } = req.body;

  if (!accessToken || !refreshToken || !expiresIn) {
    return res.status(400).json({ error: "Missing token data" });
  }

  try {
    const expiryTime = Date.now() + (parseInt(expiresIn) - 300) * 1000;

    // Set HTTP-only cookies
    res.setHeader("Set-Cookie", [
      `outlookAccessToken=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${expiresIn}`,
      `outlookRefreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`, // 30 days
      `outlookTokenExpiry=${expiryTime}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${expiresIn}`,
    ]);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error setting tokens:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
