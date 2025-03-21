require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.post("/get-access-token", async (req, res) => {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Missing Azure AD credentials" });
  }

  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;

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

    res.json({
      access_token: response.data.access_token,
    });
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
