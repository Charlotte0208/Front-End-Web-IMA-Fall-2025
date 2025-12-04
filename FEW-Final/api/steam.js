export default async function handler(req, res) {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;
  
  if (!apiKey || !steamId) {
    return res.status(500).json({ error: 'Missing API Key or Steam ID' });
  }

  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=916A5948C31B7EFCC8BECDE020647DD4&steamid=76561199649950499&include_appinfo=1&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data from Steam' });
  }
}