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
    const topGames = games.slice(0, 6);
    
    let genreCounts = {};
    let successCount = 0;


    const genreRequests = topGames.map(async (game) => {
        try {

            const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${game.appid}`;
            const storeRes = await fetch(storeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });
            const storeData = await storeRes.json();
            
            if (storeData && storeData[game.appid] && storeData[game.appid].success) {
                const genres = storeData[game.appid].data.genres;
                if (genres) {
                    genres.forEach(g => {
                        const name = g.description;
                        genreCounts[name] = (genreCounts[name] || 0) + 1;
                    });
                    successCount++;
                }
            }
        } catch (e) {
            console.error(`Failed to fetch genre for ${game.appid}`, e);
        }
    });

    await Promise.all(genreRequests);


    if (successCount === 0) {
        console.log("Steam Store API blocked/failed. Using fallback dictionary.");

        const fallbackMap = {
            105600: ["Adventure", "Indie", "Sandbox"], // Terraria
            3590:   ["Strategy", "Tower Defense"],     // Plants vs Zombies
            632470: ["RPG", "Indie", "Story Rich"],    // Disco Elysium
            435120: ["Adventure", "Point & Click"],    // Rusty Lake Hotel
            1091500:["RPG", "Cyberpunk", "Open World"],// Cyberpunk 2077
            1082430:["Adventure", "Indie", "Story"],   // Before Your Eyes
            413150: ["RPG", "Simulation", "Farming"],  // Stardew Valley
            744190: ["Adventure", "Point & Click"],    // Rusty Lake Paradise
            1102130:["Indie", "Casual", "Story"]       // Florence
        };

        topGames.forEach(game => {
            const genres = fallbackMap[game.appid];
            if (genres) {
                genres.forEach(name => {
                    genreCounts[name] = (genreCounts[name] || 0) + 1;
                });
            }
        });
    }


    const sortedGenres = Object.entries(genreCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    res.status(200).json({
        games: games,
        genres: sortedGenres
    });

  } catch (error) {
    console.error("Main API Error:", error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}