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
    const topGames = games.slice(0, 30);

    const fetchGenres = async () => {
        let genreCounts = {};
        let gameGenreMap = {};
        
        for (const game of topGames) {
            try {
                await delay(200); 
                const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${game.appid}`;
                const storeRes = await fetch(storeUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const storeData = await storeRes.json();
                
                if (storeData && storeData[game.appid] && storeData[game.appid].success) {
                    const genres = storeData[game.appid].data.genres;
                    if (genres) {
                        gameGenreMap[game.appid] = [];
                        genres.forEach(g => {
                            gameGenreMap[game.appid].push(g.description);
                            genreCounts[g.description] = (genreCounts[g.description] || 0) + 1;
                        });
                    }
                }
            } catch (e) {}
        }

        const sortedGenreKeys = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
        let finalGenres = [];
        let usedGameIds = new Set();

        sortedGenreKeys.forEach(genreName => {
            const eligibleGames = topGames.filter(g => 
                gameGenreMap[g.appid] && gameGenreMap[g.appid].includes(genreName)
            );
            let selectedGame = eligibleGames.find(g => !usedGameIds.has(g.appid)) || eligibleGames[0];

            if (selectedGame) {
                usedGameIds.add(selectedGame.appid);
                finalGenres.push({
                    name: genreName,
                    count: genreCounts[genreName],
                    sampleAppId: selectedGame.appid
                });
            }
        });

        return finalGenres.slice(0, 6);
    };


    const fetchAchievements = async () => {
        let achievementList = [];
        
        for (const game of topGames) {
            try {
                await delay(200);
                const achUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${game.appid}&key=${apiKey}&steamid=${steamId}`;
                const achRes = await fetch(achUrl);
                
                if (achRes.ok) {
                    const achData = await achRes.json();
                    if (achData.playerstats && achData.playerstats.achievements) {
                        const all = achData.playerstats.achievements;
                        const unlocked = all.filter(a => a.achieved === 1).length;
                        const total = all.length;
                        
                        if (total > 0 && unlocked > 0) {
                            achievementList.push({
                                appid: game.appid,
                                name: game.name,
                                percentage: Math.round((unlocked / total) * 100)
                            });
                        }
                    }
                }
            } catch (e) {}
        }
        
        return achievementList.sort((a, b) => b.percentage - a.percentage).slice(0, 10);
    };

    const [genresResult, achievementsResult] = await Promise.all([fetchGenres(), fetchAchievements()]);

    let source = 'api';
    if (genresResult.length === 0) {
        source = 'backup';

        genresResult.push({name: 'RPG', count: 5, sampleAppId: 632470});
        genresResult.push({name: 'Indie', count: 4, sampleAppId: 105600});
        genresResult.push({name: 'Adventure', count: 4, sampleAppId: 435120});
    }
    
    if (achievementsResult.length === 0) {
        achievementsResult.push({appid: 105600, name: 'Terraria', percentage: 85});
        achievementsResult.push({appid: 632470, name: 'Disco Elysium', percentage: 72});
        achievementsResult.push({appid: 435120, name: 'Rusty Lake Hotel', percentage: 100});
        achievementsResult.push({appid: 413150, name: 'Stardew Valley', percentage: 60});
        achievementsResult.push({appid: 1102130, name: 'Florence', percentage: 100});
    }

    res.status(200).json({
        games: games,
        genres: genresResult,
        achievements: achievementsResult,
        source: source
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}