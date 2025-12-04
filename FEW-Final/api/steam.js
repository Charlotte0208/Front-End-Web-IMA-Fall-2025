export default async function handler(req, res) {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;

  if (!apiKey || !steamId) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    const response = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&format=json`);
    const data = await response.json();
    let games = data.response.games || [];

    games.sort((a, b) => b.playtime_forever - a.playtime_forever);
    const topGames = games.slice(0, 15);
    

    const appIds = topGames.map(g => g.appid).join(',');
    const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appIds}&filters=genres`;

    let genreCounts = {};

    try {
        const storeResponse = await fetch(storeUrl);
        const storeData = await storeResponse.json();


        for (const appId in storeData) {
            if (storeData[appId].success && storeData[appId].data && storeData[appId].data.genres) {
                const genres = storeData[appId].data.genres;
                genres.forEach(g => {
                    const name = g.description;
                    if (genreCounts[name]) {
                        genreCounts[name]++;
                    } else {
                        genreCounts[name] = 1;
                    }
                });
            }
        }
    } catch (storeError) {
        console.error("Genre fetch failed:", storeError);

    }

    const sortedGenres = Object.entries(genreCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    res.status(200).json({
        games: games,
        genres: sortedGenres
    });

  } catch (error) {
    console.error("Main API Error:", error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}