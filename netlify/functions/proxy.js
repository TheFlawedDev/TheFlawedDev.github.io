async function fetchFromAPI(endpoint, word1, word2, apiKey) {
  const apiBaseUrl = "https://synonym-network-api.onrender.com/api/path";
  const apiUrl = `${apiBaseUrl}/${endpoint}?word1=${word1}&word2=${word2}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    // If one of the parallel requests fails, we throw an error
    // which will be caught by the handler.
    throw new Error(
      `API request failed for endpoint: ${endpoint} with status: ${response.status}`,
    );
  }
  return response.json();
}

exports.handler = async function (event, context) {
  // Get the query parameters sent from the frontend
  const { endpoint, word1, word2 } = event.queryStringParameters;

  // Get the secret API key from Netlify's environment variables
  const apiKey = process.env.API_SECURITY_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key is not configured." }),
    };
  }

  // We are creating a special 'explore' endpoint in our proxy
  if (endpoint === "explore") {
    try {
      // Use Promise.all to make all three API calls in parallel
      const [path, level, synonyms] = await Promise.all([
        fetchFromAPI("shortest", word1, word2, apiKey),
        fetchFromAPI("level", word1, word2, apiKey),
        fetchFromAPI("synonyms", word1, word2, apiKey),
      ]);

      // Bundle the results into a single JSON object
      const responsePayload = {
        path,
        level,
        synonyms,
      };

      return {
        statusCode: 200,
        body: JSON.stringify(responsePayload),
      };
    } catch (error) {
      console.error("Proxy Error during parallel fetch:", error);
      return {
        statusCode: 502, // Bad Gateway, indicates an issue with an upstream server
        body: JSON.stringify({ error: error.message }),
      };
    }
  } else {
    // Fallback for other potential endpoints if needed, otherwise return an error.
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid or unsupported endpoint. Use "explore".',
      }),
    };
  }
};
