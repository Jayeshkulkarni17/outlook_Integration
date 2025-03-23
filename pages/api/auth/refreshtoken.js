import axios from "axios";
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("outlookRefreshToken");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Update the stored tokens
    localStorage.setItem("outlookAccessToken", access_token);
    localStorage.setItem("outlookRefreshToken", refresh_token);
    localStorage.setItem("outlookTokenExpiry", Date.now() + expires_in * 1000);

    return access_token;
  } catch (error) {
    console.error(
      "Error refreshing access token:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export default refreshAccessToken;
