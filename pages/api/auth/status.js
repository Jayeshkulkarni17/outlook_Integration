export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const accessToken = req.cookies.outlookAccessToken;
  const refreshToken = req.cookies.outlookRefreshToken;
  const tokenExpiry = req.cookies.outlookTokenExpiry;

  res.status(200).json({
    isAuthenticated: !!refreshToken,
    accessToken,
    refreshToken,
    tokenExpiry,
  });
}
