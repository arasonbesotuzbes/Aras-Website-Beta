// Yılı güncelle
document.getElementById("year").textContent = new Date().getFullYear();

// Özel scroll çubuğu işlevselliği
const contentWrapper = document.querySelector(".content-wrapper");
const customScroll = document.getElementById("customScroll");
const scrollbarTrack = document.querySelector(".scrollbar-track");

function updateScrollPosition() {
    const scrollHeight = contentWrapper.scrollHeight - contentWrapper.clientHeight;
    const scrollTop = contentWrapper.scrollTop;
    const trackHeight = scrollbarTrack.offsetHeight;
    const maxTop = trackHeight - customScroll.offsetHeight;
    const scrollRatio = scrollTop / scrollHeight;
    const newTop = scrollRatio * maxTop;
    customScroll.style.top = `${Math.min(newTop, maxTop)}px`;
}

contentWrapper.addEventListener("scroll", updateScrollPosition);

let isDragging = false;
let startY, startTop;

customScroll.addEventListener("mousedown", (e) => {
    isDragging = true;
    startY = e.clientY;
    startTop = parseInt(customScroll.style.top || "0", 10);
    e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const trackHeight = scrollbarTrack.offsetHeight;
    const maxTop = trackHeight - customScroll.offsetHeight;
    let newTop = startTop + deltaY;
    newTop = Math.max(0, Math.min(newTop, maxTop));
    customScroll.style.top = `${newTop}px`;

    const scrollHeight = contentWrapper.scrollHeight - contentWrapper.clientHeight;
    const scrollRatio = newTop / maxTop;
    contentWrapper.scrollTop = scrollRatio * scrollHeight;
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});

// Touch event support for mobile
customScroll.addEventListener("touchstart", (e) => {
    isDragging = true;
    startY = e.touches[0].clientY;
    startTop = parseInt(customScroll.style.top || "0", 10);
});

document.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    const trackHeight = scrollbarTrack.offsetHeight;
    const maxTop = trackHeight - customScroll.offsetHeight;
    let newTop = startTop + deltaY;
    newTop = Math.max(0, Math.min(newTop, maxTop));
    customScroll.style.top = `${newTop}px`;

    const scrollHeight = contentWrapper.scrollHeight - contentWrapper.clientHeight;
    const scrollRatio = newTop / maxTop;
    contentWrapper.scrollTop = scrollRatio * scrollHeight;
});

document.addEventListener("touchend", () => {
    isDragging = false;
});

document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            const targetPosition = targetElement.offsetTop;
            contentWrapper.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

window.addEventListener('load', () => {
    setTimeout(() => {
        contentWrapper.scrollTop = 0;
        updateScrollPosition();
    }, 1);
});

// Ziyaretçi Defteri
document.getElementById('guestbookForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !message) {
        document.getElementById('response').textContent = "Lütfen tüm alanları doldur!";
        document.getElementById('response').classList.remove('hidden');
        return;
    }

    const webhookURL = ""; // BURAYA WEBHOOK URL'NİZİ YAZIN (VEYA BACKEND KULLANIN)

    const payload = {
        content: `📬 **Yeni Ziyaretçi Yorumu!**\n👤 **Ad:** ${name}\n💬 **Mesaj:** ${message}`
    };

    // Mesajı Discord'a gönder
    fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (res.ok) {
            document.getElementById('response').textContent = "Mesaj başarıyla gönderildi, sağolasın!";
            document.getElementById('response').classList.remove('hidden');
            document.getElementById('guestbookForm').reset();

            // Mesajı localStorage'a kaydet ve sayfada göster
            const messages = JSON.parse(localStorage.getItem('guestbookMessages') || '[]');
            messages.push({ name, message, date: new Date().toLocaleString('tr-TR') });
            localStorage.setItem('guestbookMessages', JSON.stringify(messages));
            displayMessages();
        } else {
            throw new Error("Hata oluştu");
        }
    })
    .catch(err => {
        document.getElementById('response').textContent = "Mesaj gönderilemedi. Webhook patladı mı?";
        document.getElementById('response').classList.remove('hidden');
        console.error(err);
    });
});


// Sabit değerler (GÜVENLİK: Bunları backend'e taşı!)
const clientId = '';
const clientSecret = '';
const refreshToken = '';
let accessToken = '';

// Access token’ı yenileme
async function refreshAccessToken() {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
            },
            body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
        });

        if (!response.ok) {
            throw new Error('Token yenileme başarısız');
        }

        const data = await response.json();
        accessToken = data.access_token;
        setTimeout(refreshAccessToken, 55 * 60 * 1000); // 55 dakika
    } catch (error) {
        console.error('Token yenileme hatası:', error);
        document.getElementById('error-message').classList.remove('hidden');
    }
}

// Şu anda çalan şarkıyı alma
async function fetchCurrentlyPlaying() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error('Şarkı alınamadı.');
        }

        const data = await response.json();
        if (data && data.item) {
            const songName = data.item.name;
            const artistName = data.item.artists.map(artist => artist.name).join(', ');
            const albumCover = data.item.album.images[0].url;
            const totalDuration = data.item.duration_ms;
            const currentProgress = data.progress_ms;
            const songUrl = data.item.external_urls.spotify;
            const isPlaying = data.is_playing;

            document.getElementById('current-song').textContent = songName;
            document.getElementById('song-artist').textContent = `Sanatçı: ${artistName}`;
            document.getElementById('song-artwork').src = albumCover;
            document.getElementById('song-artwork').classList.remove('hidden');

            document.getElementById('total-time').textContent = formatDuration(totalDuration);
            updateProgress(currentProgress, totalDuration);

            const listenButton = document.getElementById('listen-button');
            listenButton.href = songUrl;
            listenButton.classList.remove('hidden');

            startProgressSync(isPlaying);
        } else {
            document.getElementById('current-song').textContent = 'Şu anda çalan şarkı yok.';
            document.getElementById('song-artist').textContent = '';
            document.getElementById('song-artwork').classList.add('hidden');
            document.getElementById('current-time').textContent = '0:00';
            document.getElementById('total-time').textContent = '0:00';
            document.getElementById('progress-bar').style.width = '0%';
            document.getElementById('listen-button').classList.add('hidden');
            stopProgressSync();
        }
    } catch (error) {
        console.error('Hata:', error);
        document.getElementById('error-message').classList.remove('hidden');
        setTimeout(fetchCurrentlyPlaying, 5000);
        stopProgressSync();
    }
}

function formatDuration(durationMs) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function updateProgress(currentMs, totalMs) {
    const progressPercentage = (currentMs / totalMs) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercentage}%`;
    document.getElementById('current-time').textContent = formatDuration(currentMs);
}

let progressInterval = null;

function startProgressSync(isPlaying) {
    if (progressInterval) clearInterval(progressInterval);

    if (isPlaying) {
        progressInterval = setInterval(async () => {
            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });

                if (!response.ok) {
                    throw new Error('Şarkı alınamadı.');
                }

                const data = await response.json();
                if (data && data.item) {
                    const totalDuration = data.item.duration_ms;
                    const currentProgress = data.progress_ms;
                    const isPlayingNow = data.is_playing;

                    updateProgress(currentProgress, totalDuration);

                    if (!isPlayingNow) {
                        clearInterval(progressInterval);
                        progressInterval = null;
                    }
                } else {
                    clearInterval(progressInterval);
                    progressInterval = null;
                    document.getElementById('current-song').textContent = 'Şu anda çalan şarkı yok.';
                    document.getElementById('song-artist').textContent = '';
                    document.getElementById('song-artwork').classList.add('hidden');
                    document.getElementById('current-time').textContent = '0:00';
                    document.getElementById('total-time').textContent = '0:00';
                    document.getElementById('progress-bar').style.width = '0%';
                    document.getElementById('listen-button').classList.add('hidden');
                }
            } catch (error) {
                console.error('Hata:', error);
                clearInterval(progressInterval);
                progressInterval = null;
            }
        }, 1000);
    }
}

function stopProgressSync() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// İlk yüklemede token’ı al ve sürekli kontrol et
window.onload = async () => {
    await refreshAccessToken();
    fetchCurrentlyPlaying();
    setInterval(fetchCurrentlyPlaying, 10000); // 10 saniye
};

// Tema değiştirme
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const body = document.body;

if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light');
    themeIcon.textContent = '🌙';
} else {
    body.classList.remove('light');
    themeIcon.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
    if (body.classList.contains('light')) {
        body.classList.remove('light');
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.add('light');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
});