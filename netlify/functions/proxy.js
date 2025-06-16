exports.handler = async function (event, context) {
  // Get the words from the query string parameters sent by the frontend
  const { word1, word2 } = event.queryStringParameters;

  // The base URL of your API on Render
  const apiUrl = `https://synonym-network-api.onrender.com/api/path/shortest?word1=${word1}&word2=${word2}`;

  // Get the secret API key from the environment variables you set in the Netlify UI
  const apiKey = process.env.API_SECURITY_KEY;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey, // Add the secret API key here
        "Content-Type": "application/json",
      },
    });

    // If the API returns a "not found" or other error, handle it
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to fetch data from the API." }),
      };
    }

    const data = await response.json();

    // Return the successful response from the API to the frontend
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    // Handle any network errors
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong." }),
    };
  }
};
