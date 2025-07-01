import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Button,
  Dialog,
} from "@mui/material";
import { GroupsOutlined as GroupsOutlinedIcon } from "@mui/icons-material";
import refreshAccessToken from "../api/auth/refreshtoken";

const TodaysMeetings = ({ accountId }) => {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialsButton, setShowCredentialsButton] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  // Utility function to check token expiry with buffer
  const isTokenExpired = (expiryTime) => {
    if (!expiryTime) return true;
    return Date.now() >= parseInt(expiryTime);
  };

  // Check authentication status and refresh token if needed
  // Update the checkAuthStatus function
  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/status", {
        credentials: "include", // Important for receiving cookies
      });

      if (!response.ok) {
        throw new Error("Failed to check auth status");
      }

      const { isAuthenticated, accessToken, tokenExpiry } =
        await response.json();

      if (!isAuthenticated) {
        return { isAuthenticated: false };
      }

      if (isTokenExpired(tokenExpiry)) {
        await refreshAccessToken();
        // After refresh, we need to check status again
        const newResponse = await fetch("/api/auth/status", {
          credentials: "include",
        });
        const newData = await newResponse.json();
        return { isAuthenticated: true, accessToken: newData.accessToken };
      }

      return { isAuthenticated: true, accessToken };
    } catch (error) {
      console.error("Error checking auth status:", error);
      return { isAuthenticated: false };
    }
  };

  // Update the logout handler
  const handleLogout = () => {
    // Clear cookies via API
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).then(() => {
      setShowCredentialsButton(true);
      setMeetings([]);
    });

    // Also redirect to Microsoft logout
    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(
      "http://localhost:3000"
    )}`;
  };

  // Fetch all meetings for today
  const fetchAllMeetings = async () => {
    setIsLoading(true);

    try {
      const { isAuthenticated, accessToken } = await checkAuthStatus();

      if (!isAuthenticated) {
        setShowCredentialsButton(true);
        setIsLoading(false);
        return;
      }

      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const today = new Date();
      const startDateTime = new Date(today);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(today);
      endDateTime.setHours(23, 59, 59, 999);

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendar/calendarView?startDateTime=${startDateTime.toISOString()}&endDateTime=${endDateTime.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Prefer: `outlook.timezone="${userTimeZone}"`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch meetings");
      }

      const data = await response.json();
      setMeetings(data.value);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setShowCredentialsButton(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize component and check auth status
  useEffect(() => {
    const initialize = async () => {
      console.log("Checking for tokens in URL...");
      console.log(window.location.href);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      console.log(window.location.hash.substring(1));
      const urlaccessToken = hashParams.get("accessToken");
      const refreshToken = hashParams.get("refreshToken");
      const expiresIn = hashParams.get("expiresIn");

      console.log("URL Params:", { urlaccessToken, refreshToken, expiresIn });

      if (urlaccessToken && refreshToken && expiresIn) {
        // Instead of storing in localStorage, we'll send to an API endpoint
        // that will set the HTTP-only cookies
        try {
          const response = await fetch("/api/auth/set-tokens", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accessToken: urlaccessToken,
              refreshToken,
              expiresIn,
            }),
            credentials: "include", // Important for cookies
          });

          if (!response.ok) {
            throw new Error("Failed to set tokens");
          }

          // Clean up URL
          window.location.hash = "";
        } catch (error) {
          console.error("Error setting tokens:", error);
        }
      }

      // Check authentication status via API
      try {
        const authStatus = await checkAuthStatus();
        setShowCredentialsButton(!authStatus.isAuthenticated);

        if (authStatus.isAuthenticated) {
          await fetchAllMeetings();
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setShowCredentialsButton(true);
      }
    };

    initialize();

    // Set up periodic token check
    const intervalId = setInterval(async () => {
      console.log("Running background token check...");

      try {
        // Get token expiry from API instead of localStorage
        const statusResponse = await fetch("/api/auth/status", {
          credentials: "include",
        });

        if (!statusResponse.ok) {
          throw new Error("Failed to check token status");
        }

        const { tokenExpiry } = await statusResponse.json();

        if (isTokenExpired(tokenExpiry)) {
          try {
            console.log("Token expired or about to expire, refreshing...");
            await refreshAccessToken();
            await fetchAllMeetings();
          } catch (error) {
            console.error("Background refresh failed:", error);
            setShowCredentialsButton(true);
          }
        }
      } catch (error) {
        console.error("Error in background token check:", error);
        setShowCredentialsButton(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  const formatLocalTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleLogin = () => {
    window.location.href = "/api/auth/initiatelogin";
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Today's Meetings
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography color="text.secondary">Meetings</Typography>
        <GroupsOutlinedIcon
          sx={{ color: "text.secondary", fontSize: "20px" }}
        />
      </Box>

      {isLoading ? (
        <CircularProgress />
      ) : meetings.length > 0 ? (
        <Box>
          {meetings.map((meeting, index) => {
            const meetingDate = new Date(meeting.start.dateTime)
              .toISOString()
              .split("T")[0];
            const today = new Date().toISOString().split("T")[0];
            const isToday = meetingDate === today;

            return (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: isToday ? "background.paper" : "action.hover",
                }}
              >
                <Avatar sx={{ bgcolor: "#8B5CF6", mr: 2 }}>
                  {meeting.subject
                    ? meeting.subject.charAt(0).toUpperCase()
                    : "?"}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight="bold">
                    {meeting.subject}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatLocalTime(meeting.start.dateTime)} -{" "}
                    {formatLocalTime(meeting.end.dateTime)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isToday ? "Today" : "Other Day"}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{
                    textTransform: "none",
                    bgcolor: "#8B5CF6",
                    "&:hover": { bgcolor: "#7C3AED" },
                  }}
                  onClick={() =>
                    window.open(meeting.onlineMeeting?.joinUrl, "_blank")
                  }
                  disabled={!meeting.onlineMeeting?.joinUrl}
                >
                  Join
                </Button>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography color="text.secondary">
          No meetings scheduled for today.
        </Typography>
      )}

      {showCredentialsButton && (
        <Button
          variant="outlined"
          sx={{
            mt: 2,
            width: "100%",
            bgcolor: "#8B5CF6",
            color: "#fff",
            "&:hover": { bgcolor: "#7C3AED" },
          }}
          onClick={handleOpenModal}
        >
          Connect Outlook Calendar
        </Button>
      )}

      {!showCredentialsButton && (
        <Button
          variant="outlined"
          sx={{ mt: 2, width: "100%" }}
          onClick={handleLogout}
        >
          Disconnect Outlook
        </Button>
      )}

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
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
      </Dialog>
    </Box>
  );
};

export default TodaysMeetings;
