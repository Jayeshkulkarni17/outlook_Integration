const refreshAccessToken = async () => {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Important for sending cookies
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    // The actual token is in the HTTP-only cookie, but we can return a flag
    return { success: true };
  } catch (error) {
    console.error("Refresh failed:", error);
    throw error;
  }
};

export default refreshAccessToken;
