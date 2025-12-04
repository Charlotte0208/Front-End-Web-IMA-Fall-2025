const container = document.getElementById('game-container');
const minScale = 0.7;
const maxScale = 2.0;

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
        const games = data.response.games;

        if (!games || games.length === 0) {
            console.log("No games found.");
            return;
        }

        let maxPlaytime = 0;
        if(games.length > 0) {
            maxPlaytime = Math.max(...games.map(g => g.playtime_forever));
        }
        if (maxPlaytime === 0) maxPlaytime = 1;

        games.forEach(game => {
            const bubble = document.createElement('a');
            bubble.href = `https://store.steampowered.com/app/${game.appid}`;
            bubble.target = "_blank";
            bubble.className = 'bubble';
            
            const randAnim = Math.random() > 0.5 ? 'float1' : 'float2';
            bubble.classList.add(randAnim);

            let scale = minScale;
            if (game.playtime_forever > 0) {
                const ratio = game.playtime_forever / maxPlaytime;
                scale = minScale + (ratio * (maxScale - minScale));
            }
            
            const xVal = (Math.random() * 90) - 45;
            const yVal = (Math.random() * 60) - 30;
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
            img.alt = game.name;
            
            img.onerror = function() {
                if (this.src !== iconUrl) {
                    this.src = iconUrl;
                }
            };

            bubble.appendChild(img);
            container.appendChild(bubble);
        });

    } catch (error) {
        console.error("Failed to load Steam data:", error);
        container.innerHTML = `<p style="text-align:center; color:white;">Loading failed. Please check connection.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initGarden);