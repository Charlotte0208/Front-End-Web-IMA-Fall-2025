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
    
    const topGames = games.slice(0, 12);
    
    let genreCounts = {};
    let gameGenreMap = {};

    for (const game of topGames) {
        try {
            await delay(250); 
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
                    gameGenreMap[game.appid] = [];
                    genres.forEach(g => {
                        const name = g.description;
                        gameGenreMap[game.appid].push(name);
                        genreCounts[name] = (genreCounts[name] || 0) + 1;
                    });
                }
            }
        } catch (e) {
            console.error(`Skipping ${game.appid}`, e);
        }
    }


    const sortedGenreKeys = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
    let finalGenres = [];
    let usedGameIds = new Set();

    sortedGenreKeys.forEach(genreName => {

        const eligibleGames = topGames.filter(g => 
            gameGenreMap[g.appid] && gameGenreMap[g.appid].includes(genreName)
        );

        let selectedGame = eligibleGames.find(g => !usedGameIds.has(g.appid));

        if (!selectedGame) {
            selectedGame = eligibleGames[0];
        }

        if (selectedGame) {
            usedGameIds.add(selectedGame.appid);
            finalGenres.push({
                name: genreName,
                count: genreCounts[genreName],
                sampleAppId: selectedGame.appid
            });
        }
    });


    const resultGenres = finalGenres.slice(0, 6);

    res.status(200).json({
        games: games,
        genres: resultGenres,
        source: 'api'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}