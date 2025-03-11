require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.post("/get-access-token", async (req, res) => {
  const tenantId = "48b12b95-fafa-4dd2-b3fc-a40a38506f93";
  const clientId = "38434d63-6a09-4f6f-8714-cbce49950a69";
  const clientSecret = "mXf8Q~e2tgoIU63s5y4ksqfr0hLnOBqYCOconazc";

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Missing Azure AD credentials" });
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  try {
    const response = await axios.post(url, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    res.json({ access_token: response.data.access_token });
  } catch (error) {
    console.error(
      "Error generating access token:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to generate access token" });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
