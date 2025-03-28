// api/auth/refreshtoken.js
const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("outlookRefreshToken");
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to refresh token");
    }

    const { access_token, refresh_token, expires_in } = await response.json();
    const expiryTime = Date.now() + (expires_in - 300) * 1000;

    localStorage.setItem("outlookAccessToken", access_token);
    if (refresh_token) {
      localStorage.setItem("outlookRefreshToken", refresh_token);
    }
    localStorage.setItem("outlookTokenExpiry", expiryTime.toString());

    return access_token;
  } catch (error) {
    console.error("Refresh failed:", error);
    if (error.message.includes("invalid_grant")) {
      localStorage.removeItem("outlookAccessToken");
      localStorage.removeItem("outlookRefreshToken");
      localStorage.removeItem("outlookTokenExpiry");
    }
    throw error;
  }
};

export default refreshAccessToken;
