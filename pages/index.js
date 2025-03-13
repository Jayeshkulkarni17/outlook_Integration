import React from "react";
import { Grid, Paper, Typography } from "@mui/material";
import TodaysMeetings from "./post/todayMeetingList";
import { useSession } from "next-auth/react";
const Index = () => {
  const { data: session } = useSession();
  if (session) {
    // console.log("Access Token:", session.accessToken);
    // console.log("refresh Token", session.refreshToken);
    sessionStorage.setItem("outlookAccessToken", session.accessToken);
  }
  return (
    <>
      <Grid item xs={12} sm={6} md={6}>
        <Paper
          sx={{
            height: "100%",
            borderRadius: 2,
            boxShadow: 3,
            padding: 2,
          }}
        >
          <TodaysMeetings />

          {/* <CredentialsForm /> */}
        </Paper>
      </Grid>
      <Typography></Typography>
    </>
  );
};

export default Index;
