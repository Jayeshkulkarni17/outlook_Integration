import React, { useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";

const CredentialsForm = ({ onClose, onLoginSuccess }) => {
  const handleLogin = () => {
    const tenantId = "48b12b95-fafa-4dd2-b3fc-a40a38506f93";
    const clientId = "38434d63-6a09-4f6f-8714-cbce49950a69";
    // const clientId = process.env.AZURE_AD_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      "http://localhost:3000/api/auth/callback/azure-ad"
    );
    const scope = encodeURIComponent("Calendars.Read");
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}&response_mode=fragment`;
    // Open the Microsoft login page in a popup
    const popup = window.open(authUrl, "Outlook Login", "width=500,height=600");

    // Listen for messages from the popup
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      const { access_token } = event.data;
      if (access_token) {
        onLoginSuccess(access_token); // Pass the access token to the parent component
        popup.close();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Connect Outlook Calendar
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Click the button below to sign in with your Microsoft account and
        connect your Outlook Calendar.
      </Typography>
      <Button
        variant="contained"
        fullWidth
        sx={{
          mt: 2,
          bgcolor: "#8B5CF6",
          color: "#fff",
          "&:hover": { bgcolor: "#7C3AED" },
        }}
        onClick={handleLogin}
      >
        Sign In with Microsoft
      </Button>
    </Box>
  );
};

export default CredentialsForm;
