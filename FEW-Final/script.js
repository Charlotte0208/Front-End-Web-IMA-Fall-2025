const gameContainer = document.getElementById('game-container');
const genreContainer = document.getElementById('genre-container');
const accomplishmentContainer = document.getElementById('accomplishment-container');
const bgBubblesContainer = document.getElementById('bg-floating-bubbles-container');

const genreDescriptions = {
    "Action": "Adrenaline and fast reflexes.",
    "RPG": "Living another life.",
    "Indie": "Small teams, giant souls.",
    "Strategy": "Planning the perfect victory.",
    "Adventure": "Exploring the unknown.",
    "Simulation": "Mimicking reality.",
    "Casual": "Relaxing vibes only.",
    "Puzzle": "Brain teasers and logic.",
    "Story Rich": "Narratives that touch the heart.",
    "Cyberpunk": "High tech, low life."
};

const neonColors = {
    "Action": "#dd7296ff", 
    "RPG": "#9b73abff",
    "Indie": "#abe2f7ff",
    "Strategy": "#b49f81ff",
    "Adventure": "#583d57ff",
    "Simulation": "#5b6d88ff",
    "Casual": "#715d6aff",
    "Puzzle": "#4d4167ff",
    "default": "#bd9debff"
};

function formatTime(minutes) {
    if (minutes === 0) return "Not played yet";
    if (minutes < 60) return `${minutes} mins`;
    return `${(minutes / 60).toFixed(1)} hrs`;
}

function initBackgroundBubbles() {
    const bubbleCount = 18;
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bg-floating-bubble';
        
        const size = Math.random() * 200 + 80; 
        const left = Math.random() * 100;
        const duration = Math.random() * 25 + 15; 
        const delay = Math.random() * -20;
        const hue = Math.random() * 360;

        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}vw`;
        bubble.style.animationDuration = `${duration}s`;
        bubble.style.animationDelay = `${delay}s`;
        bubble.style.setProperty('--bubble-hue', hue);
        
        bgBubblesContainer.appendChild(bubble);
    }
}

function getSafePosition(scale, existingBubbles, xRange, yRange) {
    const baseSizePx = window.innerWidth > 768 ? 130 : 70;
    const radiusVw = ((baseSizePx * scale) / 2 / window.innerWidth) * 100;
    const padding = 2; 

    let bestX = 0;
    let bestY = 0;
    let success = false;
    let attempts = 0;
    const maxAttempts = 150;

    const aspectRatio = window.innerWidth / window.innerHeight;

    while (attempts < maxAttempts && !success) {
        const tryX = (Math.random() * xRange) - (xRange / 2);
        const tryY = (Math.random() * yRange) - (yRange / 2);
        let collision = false;

        for (const bubble of existingBubbles) {
            const dx = tryX - bubble.x;
            const dy = (tryY - bubble.y) * (1 / aspectRatio); 
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < (radiusVw + bubble.radius + padding)) {
                collision = true;
                break;
            }
        }

        if (!collision) {
            bestX = tryX;
            bestY = tryY;
            success = true;
        }
        attempts++;
    }

    if (!success) {
        bestX = (Math.random() * xRange) - (xRange / 2);
        bestY = (Math.random() * yRange) - (yRange / 2);
    }

    return { x: bestX, y: bestY, radius: radiusVw };
}

async function initGarden() {
    initBackgroundBubbles();

    try {
        const response = await fetch('/api/steam');
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        const games = data.games;
        const genres = data.genres;
        const achievements = data.achievements;
        
        if (!games || games.length === 0) return;

        let maxPlaytime = Math.max(...games.map(g => g.playtime_forever)) || 1;
        const minGameScale = 0.8;
        const maxGameScale = 2.2;

        games.forEach(game => {
            const bubble = document.createElement('a');
            bubble.href = `https://store.steampowered.com/app/${game.appid}`;
            bubble.target = "_blank";
            bubble.className = 'bubble game-bubble';
            bubble.classList.add(Math.random() > 0.5 ? 'float1' : 'float2');

            let scale = minGameScale;
            if (game.playtime_forever > 0) {
                const ratio = game.playtime_forever / maxPlaytime;
                scale = minGameScale + (ratio * (maxGameScale - minGameScale));
            }
            
            const xVal = (Math.random() * 60) - 30;
            const yVal = (Math.random() * 50) - 25;
            const hue = Math.floor(Math.random() * 360);
            const delay = -(Math.random() * 15);

            let borderColor = neonColors['default'];
            if (game.primary_genre && neonColors[game.primary_genre]) {
                borderColor = neonColors[game.primary_genre];
            }

            bubble.style.setProperty('--scale', scale.toFixed(2));
            bubble.style.setProperty('--x', `${xVal}vw`);
            bubble.style.setProperty('--y', `${yVal}vh`);
            bubble.style.setProperty('--hue', hue);
            bubble.style.setProperty('--border-glow', borderColor);
            bubble.style.animationDelay = `${delay}s`;

            bubble.setAttribute('data-info', `${game.name} • ${formatTime(game.playtime_forever)}`);

            const img = document.createElement('img');
            const headerUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`;
            const iconUrl = `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`;

            img.src = headerUrl;
            img.onerror = function() { if (this.src !== iconUrl) this.src = iconUrl; };

            bubble.appendChild(img);
            gameContainer.appendChild(bubble);
        });

        if (genres && genres.length > 0) {
            genreContainer.innerHTML = ''; 
            const maxCount = Math.max(...genres.map(g => g.count));
            let placedGenres = [];
            
            genres.forEach((g) => {
                const bubble = document.createElement('a');
                bubble.href = `https://store.steampowered.com/genre/${g.name}`;
                bubble.target = "_blank";
                bubble.className = 'bubble genre-bubble';

                const ratio = g.count / maxCount;
                const scale = 1.3 + (ratio * 0.8);
                
                const pos = getSafePosition(scale, placedGenres, 60, 40);
                placedGenres.push(pos);
                
                const delay = -(Math.random() * 10);
                const borderColor = neonColors[g.name] || neonColors['default'];

                bubble.style.setProperty('--scale', scale.toFixed(2));
                bubble.style.setProperty('--x', `${pos.x}vw`);
                bubble.style.setProperty('--y', `${pos.y}vh`);
                bubble.style.setProperty('--border-glow', borderColor);
                bubble.style.animationDelay = `${delay}s`;
                bubble.classList.add('float3');

                const desc = genreDescriptions[g.name] || g.name;
                bubble.setAttribute('data-info', desc);

                if (g.sampleAppId) {
                    const bgUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.sampleAppId}/header.jpg`;
                    bubble.style.backgroundImage = `url(${bgUrl})`;
                }

                bubble.innerHTML = `<span class="genre-text">${g.name}</span>`;
                genreContainer.appendChild(bubble);
            });
        }

        if (achievements && achievements.length > 0) {
            accomplishmentContainer.innerHTML = '';
            let placedAch = [];
            
            achievements.forEach((ach) => {
                const bubble = document.createElement('a');
                bubble.href = `https://steamcommunity.com/stats/${ach.appid}/achievements`;
                bubble.target = "_blank";
                bubble.className = 'bubble achievement-bubble';

                const scale = 1.0 + ((ach.percentage / 100) * 0.8);
                
                const pos = getSafePosition(scale, placedAch, 60, 40);
                placedAch.push(pos);

                const delay = -(Math.random() * 10);

                bubble.style.setProperty('--scale', scale.toFixed(2));
                bubble.style.setProperty('--x', `${pos.x}vw`);
                bubble.style.setProperty('--y', `${pos.y}vh`);
                bubble.style.animationDelay = `${delay}s`;
                bubble.classList.add('float1');

                bubble.setAttribute('data-info', `${ach.name}`);

                const bgUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${ach.appid}/header.jpg`;
                bubble.style.backgroundImage = `url(${bgUrl})`;

                bubble.innerHTML = `<span class="achievement-text">${ach.percentage}%</span>`;
                accomplishmentContainer.appendChild(bubble);
            });
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

document.addEventListener('DOMContentLoaded', initGarden);