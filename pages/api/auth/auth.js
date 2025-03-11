import axios from "axios";

// Generate access token using client credentials flow
export const getAccessToken = async () => {
  const tenantId = "48b12b95-fafa-4dd2-b3fc-a40a38506f93"; // Replace with your Azure AD tenant ID
  const clientId = "38434d63-6a09-4f6f-8714-cbce49950a69"; // Replace with your Azure AD client ID
  const clientSecret = "mXf8Q~e2tgoIU63s5y4ksqfr0hLnOBqYCOconazc"; // Replace with your Azure AD client secret

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("38434d63-6a09-4f6f-8714-cbce49950a69", clientId);
  params.append("mXf8Q~e2tgoIU63s5y4ksqfr0hLnOBqYCOconazc", clientSecret);
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

// Fetch calendar events for a user
export const fetchCalendarEvents = async (accessToken, userId) => {
  const url = `https://graph.microsoft.com/v1.0/users/${userId}/calendar/events`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data.value;
  } catch (error) {
    console.error(
      "Error fetching calendar events:",
      error.response?.data || error.message
    );
    throw error;
  }
};
