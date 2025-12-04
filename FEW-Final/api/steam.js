export default async function handler(req, res) {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;

  if (!apiKey || !steamId) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    const response = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&format=json`);
    const data = await response.json();
    let games = data.response.games || [];

    games.sort((a, b) => b.playtime_forever - a.playtime_forever);
    
    // Process top 8 games to find genres
    const topGames = games.slice(0, 8);
    
    let genreStats = {}; 
    let successCount = 0;

    // Use sequential loop instead of Promise.all to avoid rate limiting
    for (const game of topGames) {
        try {
            await delay(300); // Wait 300ms between requests
            const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${game.appid}`;
            const storeRes = await fetch(storeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const storeData = await storeRes.json();
            
            if (storeData && storeData[game.appid] && storeData[game.appid].success) {
                const genres = storeData[game.appid].data.genres;
                if (genres) {
                    genres.forEach(g => {
                        const name = g.description;
                        if (!genreStats[name]) {
                            genreStats[name] = { count: 0, sampleAppId: game.appid };
                        }
                        genreStats[name].count++;
                    });
                    successCount++;
                }
            }
        } catch (e) {
            console.error(`Skipping ${game.appid}`, e);
        }
    }

    let isFallback = false;

    // Fallback System
    if (successCount === 0) {
        console.log("Using Fallback Data");
        isFallback = true;
        const fallbackMap = {
            105600: ["Adventure", "Indie", "Sandbox"],
            3590:   ["Strategy", "Tower Defense"],
            632470: ["RPG", "Indie", "Story Rich"],
            435120: ["Adventure", "Point & Click"],
            1091500:["RPG", "Cyberpunk", "Open World"],
            1082430:["Adventure", "Indie", "Story"],
            413150: ["RPG", "Simulation", "Farming"],
            744190: ["Adventure", "Point & Click"],
            1102130:["Indie", "Casual", "Story"]
        };

        topGames.forEach(game => {
            const genres = fallbackMap[game.appid];
            if (genres) {
                genres.forEach(name => {
                    if (!genreStats[name]) {
                        genreStats[name] = { count: 0, sampleAppId: game.appid };
                    }
                    genreStats[name].count++;
                });
            }
        });
    }

    const sortedGenres = Object.entries(genreStats)
        .map(([name, data]) => ({ 
            name, 
            count: data.count, 
            sampleAppId: data.sampleAppId 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    res.status(200).json({
        games: games,
        genres: sortedGenres,
        source: isFallback ? 'backup' : 'api'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}