const gameContainer = document.getElementById('game-container');
const genreContainer = document.getElementById('genre-container');

function formatTime(minutes) {
    if (minutes === 0) return "Not played yet";
    if (minutes < 60) return `${minutes} mins`;
    return `${(minutes / 60).toFixed(1)} hrs`;
}

async function initGarden() {
    try {
        const response = await fetch('/api/steam');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        const games = data.games;
        const genres = data.genres;

        if (!games || games.length === 0) {
            console.log("No games found.");
            return;
        }

        let maxPlaytime = Math.max(...games.map(g => g.playtime_forever)) || 1;
        const minGameScale = 0.8;
        const maxGameScale = 2.2;

        games.forEach(game => {
            const bubble = document.createElement('a');
            bubble.href = `https://store.steampowered.com/app/${game.appid}`;
            bubble.target = "_blank";
            bubble.className = 'bubble game-bubble';
            
            const randAnim = Math.random() > 0.5 ? 'float1' : 'float2';
            bubble.classList.add(randAnim);

            let scale = minGameScale;
            if (game.playtime_forever > 0) {
                const ratio = game.playtime_forever / maxPlaytime;
                scale = minGameScale + (ratio * (maxGameScale - minGameScale));
            }
            
            const xVal = (Math.random() * 60) - 30;
            const yVal = (Math.random() * 50) - 25;
            const hue = Math.floor(Math.random() * 360);
            const delay = -(Math.random() * 15);

            bubble.style.setProperty('--scale', scale.toFixed(2));
            bubble.style.setProperty('--x', `${xVal}vw`);
            bubble.style.setProperty('--y', `${yVal}vh`);
            bubble.style.setProperty('--hue', hue);
            bubble.style.animationDelay = `${delay}s`;

            bubble.setAttribute('data-info', `${game.name} • ${formatTime(game.playtime_forever)}`);

            const img = document.createElement('img');
            const headerUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`;
            const iconUrl = `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`;

            img.src = headerUrl;
            img.onerror = function() { 
                if (this.src !== iconUrl) this.src = iconUrl; 
            };

            bubble.appendChild(img);
            gameContainer.appendChild(bubble);
        });

        if (genres && genres.length > 0) {
            genreContainer.innerHTML = ''; 
            const maxCount = Math.max(...genres.map(g => g.count));
            
            genres.forEach((g) => {
                const bubble = document.createElement('a');
                bubble.href = `https://store.steampowered.com/genre/${g.name}`;
                bubble.target = "_blank";
                bubble.className = 'bubble genre-bubble';

                const ratio = g.count / maxCount;
                const scale = 0.8 + (ratio * 0.5);
                
                const xVal = (Math.random() * 50) - 25;
                const yVal = (Math.random() * 30) - 15;
                const hue = 250 + (Math.random() * 50); 

                bubble.style.setProperty('--scale', scale.toFixed(2));
                bubble.style.setProperty('--x', `${xVal}vw`);
                bubble.style.setProperty('--y', `${yVal}vh`);
                bubble.style.setProperty('--hue', hue);
                bubble.classList.add('float3');

                bubble.setAttribute('data-info', `${g.name} (${g.count} games)`);
                
                bubble.innerHTML = `<span style="font-size: 8px; color: white; text-align: center; pointer-events: none; padding:2px;">${g.name}</span>`;

                genreContainer.appendChild(bubble);
            });
        } else {
             if (genreContainer) {
                 genreContainer.innerHTML = '<p style="text-align:center; font-size:10px; color:#aaa; margin-top:50px;">(Genres unavailable due to Steam restrictions)</p>';
             }
        }

    } catch (error) {
        console.error("Failed to load data:", error);
    }
}

document.addEventListener('DOMContentLoaded', initGarden);