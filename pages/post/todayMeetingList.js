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
  const checkAuthStatus = async () => {
    const refreshToken = localStorage.getItem("outlookRefreshToken");
    const accessToken = localStorage.getItem("outlookAccessToken");
    const tokenExpiry = localStorage.getItem("outlookTokenExpiry");

    if (!refreshToken) {
      return { isAuthenticated: false };
    }

    if (!accessToken || isTokenExpired(tokenExpiry)) {
      try {
        const newAccessToken = await refreshAccessToken();
        return { isAuthenticated: true, accessToken: newAccessToken };
      } catch (error) {
        return { isAuthenticated: false };
      }
    }

    return { isAuthenticated: true, accessToken };
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
      console.log("Initializing component...");

      // First check URL for tokens (after redirect)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const urlAccessToken = params.get("accessToken");
      const urlRefreshToken = params.get("refreshToken");
      const urlExpiresIn = params.get("expiresIn");

      if (urlAccessToken && urlRefreshToken && urlExpiresIn) {
        console.log("Found tokens in URL");
        const expiryTime = Date.now() + (parseInt(urlExpiresIn) - 300) * 1000;

        localStorage.setItem("outlookAccessToken", urlAccessToken);
        localStorage.setItem("outlookRefreshToken", urlRefreshToken);
        localStorage.setItem("outlookTokenExpiry", expiryTime.toString());

        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }

      // Check authentication status
      console.log("Checking auth status...");
      const { isAuthenticated } = await checkAuthStatus();
      console.log("Is authenticated:", isAuthenticated);
      setShowCredentialsButton(!isAuthenticated);

      if (isAuthenticated) {
        console.log("Fetching meetings...");
        await fetchAllMeetings();
      }
    };

    initialize();

    // Set up periodic token check
    const intervalId = setInterval(async () => {
      console.log("Running background token check...");
      const tokenExpiry = localStorage.getItem("outlookTokenExpiry");
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
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  // Format time for display
  const formatLocalTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle modal open/close
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  // Handle login redirect
  const handleLogin = () => {
    window.location.href = "/api/auth/initiatelogin";
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("outlookAccessToken");
    localStorage.removeItem("outlookRefreshToken");
    localStorage.removeItem("outlookTokenExpiry");
    setShowCredentialsButton(true);
    setMeetings([]);
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
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
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
                    {meeting.subject || "No Subject"}
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
