export default async function handler(req, res) {

  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;


  console.log("Checking environment variables...");
  
  if (!apiKey || !steamId) {
    console.error("Error: Missing API Key or Steam ID");
    return res.status(500).json({ error: 'Missing environment variables in Vercel' });
  }


  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&format=json`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Steam API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error("Fetch Error Details:", error);
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}