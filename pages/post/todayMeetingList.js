import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Button,
} from "@mui/material";
import { GroupsOutlined as GroupsOutlinedIcon } from "@mui/icons-material";
import { Dialog } from "@mui/material";
import CredentialsForm from "../post/credentialsForm";

const TodaysMeetings = ({ accountId }) => {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCredentialsButton, setShowCredentialsButton] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const fetchAllMeetings = async () => {
    const accessToken = sessionStorage.getItem("outlookAccessToken");

    if (!accessToken) {
      setShowCredentialsButton(true);
      setIsLoading(false);
      return;
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

  useEffect(() => {
    fetchAllMeetings();
  }, []);

  // Open the modal for Outlook login
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  // Handle successful login (store access token and fetch meetings)
  const handleLoginSuccess = (accessToken) => {
    sessionStorage.setItem("outlookAccessToken", accessToken);
    setShowCredentialsButton(false);
    fetchAllMeetings();
    handleCloseModal();
  };

  // Function to format date and time in the user's local timezone
  const formatLocalTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
          No meetings scheduled for yesterday or today.
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
        <CredentialsForm
          onClose={handleCloseModal}
          onLoginSuccess={handleLoginSuccess}
        />
      </Dialog>
    </Box>
  );
};

export default TodaysMeetings;
