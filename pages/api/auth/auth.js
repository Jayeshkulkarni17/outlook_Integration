import axios from "axios";

// Generate access token using client credentials flow
export const getAccessToken = async () => {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append(process.env.AZURE_AD_CLIENT_ID, clientId);
  params.append(process.env.AZURE_AD_CLIENT_SECRET, clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  try {
    const response = await axios.post("http://localhost:3001/get-access-token");
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error generating access token:",
      error.response?.data || error.message
    );
    throw error;
  }
};
