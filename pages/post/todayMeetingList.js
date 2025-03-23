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

  const fetchAllMeetings = async () => {
    let accessToken = localStorage.getItem("outlookAccessToken");
    const tokenExpiry = localStorage.getItem("outlookTokenExpiry");

    // Check if the access token is expired
    if (!accessToken || Date.now() >= tokenExpiry) {
      try {
        // Refresh the access token
        accessToken = await refreshAccessToken();
      } catch (error) {
        console.error("Error refreshing access token:", error);
        setShowCredentialsButton(true); // Show the "Enter Credentials" button
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);

    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const today = new Date();
      const startDateTime = new Date(today); // Start of today
      startDateTime.setHours(0, 0, 0, 0); // Set to 00:00:00.000

      const endDateTime = new Date(today); // End of today
      endDateTime.setHours(23, 59, 59, 999); // Set to 23:59:59.999

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
      console.log("Fetched Meetings:", data.value);

      setMeetings(data.value);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for tokens in the URL after redirect
  useEffect(() => {
    const initialize = async () => {
      console.log("Checking for tokens in URL..."); // Debugging
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get("accessToken");
      const refreshToken = urlParams.get("refreshToken");
      const expiresIn = urlParams.get("expiresIn");

      console.log("URL Params:", { accessToken, refreshToken, expiresIn }); // Debugging

      if (accessToken && refreshToken && expiresIn) {
        // Store tokens in sessionStorage
        localStorage.setItem("outlookAccessToken", accessToken);
        localStorage.setItem("outlookRefreshToken", refreshToken);
        localStorage.setItem(
          "outlookTokenExpiry",
          Date.now() + expiresIn * 1000
        );

        console.log("Tokens stored in sessionStorage"); // Debugging

        // Clean up the URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // Fetch meetings
        await fetchAllMeetings();
      } else {
        // If no tokens are found, check if there's an existing access token
        const existingAccessToken = localStorage.getItem("outlookAccessToken");
        const existingRefreshToken = localStorage.getItem(
          "outlookRefreshToken"
        );
        const existingTokenExpiry = localStorage.getItem("outlookTokenExpiry");

        if (
          existingAccessToken &&
          existingRefreshToken &&
          existingTokenExpiry
        ) {
          // Check if the existing access token is expired
          if (Date.now() >= existingTokenExpiry) {
            try {
              // Refresh the access token
              const newAccessToken = await refreshAccessToken();
              localStorage.setItem("outlookAccessToken", newAccessToken);
              await fetchAllMeetings();
            } catch (error) {
              console.error("Error refreshing access token:", error);
              setShowCredentialsButton(true); // Show the "Enter Credentials" button
            }
          } else {
            // If the existing access token is still valid, fetch meetings
            await fetchAllMeetings();
          }
        } else {
          // If no access token is found, show the "Enter Credentials" button
          setShowCredentialsButton(true);
        }
      }
    };

    initialize();
  }, []);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleLoginSuccess = (accessToken) => {
    localStorage.setItem("outlookAccessToken", accessToken);
    setShowCredentialsButton(false);
    fetchAllMeetings();
    handleCloseModal();
  };

  const handleLogin = () => {
    window.location.href = "/api/auth/initiatelogin";
  };

  const formatLocalTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check for access token in the URL after redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("accessToken");

    if (accessToken) {
      handleLoginSuccess(accessToken);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
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
                {/* Meeting Icon */}
                <Avatar sx={{ bgcolor: "#8B5CF6", mr: 2 }}>
                  {meeting.subject
                    ? meeting.subject.charAt(0).toUpperCase()
                    : "?"}
                </Avatar>

                {/* Meeting Details */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight="bold">
                    {meeting.subject}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatLocalTime(meeting.start.dateTime)} -{" "}
                    {formatLocalTime(meeting.end.dateTime)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isToday ? "Today" : "Yesterday"}
                  </Typography>
                </Box>

                {/* Join Button */}
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

      {/* Conditionally show the "Enter Credentials" button */}
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
          Enter Credentials
        </Button>
      )}

      {/* Modal for Outlook Login */}
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
