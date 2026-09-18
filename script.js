document.addEventListener("DOMContentLoaded", () => {

  const screens = {
    landing:   document.getElementById("screen-landing"),
    reveal:    document.getElementById("screen-reveal"),
    celebrate: document.getElementById("screen-celebrate"),
    cake:      document.getElementById("screen-cake"),
    wishes:    document.getElementById("screen-wishes"),
  };

  function showScreen(name){
    Object.values(screens).forEach(s => s.classList.remove("is-active"));
    screens[name].classList.add("is-active");
  }

  // -----------------------------------------------------------------
  // Load content from the Flask API
  // -----------------------------------------------------------------
  let pageData = { recipient_name: "", sender_name: "", intro_message: "", wishes: [] };

  fetch("/api/data")
    .then(res => res.json())
    .then(data => {
      pageData = data;
      document.getElementById("landing-eyebrow").textContent = data.intro_message;
      document.getElementById("celebrate-heading").textContent = `Happy Birthday To My Favorite Person ❤️ `;
      document.getElementById("celebrate-sub").textContent = `I made page with  my efforts for see your Face happy on your birthday and too much love.from ${data.sender_name}.`;
      buildCards(data.wishes);
    })
    .catch(() => {
      // Fall back to whatever is already in the markup if the API call fails.
      buildCards([]);
    });

  // -----------------------------------------------------------------
  // Background music — browsers never allow sound to auto-play the
  // instant a page opens (every browser blocks that on purpose). The
  // closest thing that IS allowed automatically is MUTED autoplay, so:
  //   1. The song starts playing muted the moment the page loads.
  //   2. On the very first click/tap ANYWHERE on the page, it unmutes
  //      itself — so in practice it feels like it "just plays" since
  //      people click almost immediately (e.g. hitting "Show me").
  // The toggle button lets the visitor mute/unmute at any point after.
  // -----------------------------------------------------------------
  const song = document.getElementById("bg-song");
  const musicToggle = document.getElementById("music-toggle");
  let musicStarted = false;
  let userUnmuted = false;

  function startMutedAutoplay(){
    song.volume = 0.6;
    song.muted = true;
    song.play()
      .then(() => { musicStarted = true; })
      .catch(() => {
        // Even muted autoplay can be blocked in rare cases (e.g. some
        // mobile settings) — it will simply start on first click instead.
      });
  }

  function unmuteSong(){
    if (userUnmuted) return;
    userUnmuted = true;
    song.muted = false;
    if (!musicStarted) {
      song.play().catch(() => {});
    }
    musicToggle.classList.add("is-playing");
    musicToggle.setAttribute("aria-pressed", "true");
  }

  // Try muted autoplay as soon as the page is ready.
  startMutedAutoplay();

  // Unmute on the first interaction anywhere on the page.
  document.addEventListener("click", unmuteSong, { once: true });
  document.addEventListener("touchstart", unmuteSong, { once: true });

  musicToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!userUnmuted) {
      unmuteSong();
      return;
    }
    if (song.paused) {
      song.play();
      musicToggle.classList.add("is-playing");
      musicToggle.setAttribute("aria-pressed", "true");
    } else {
      song.pause();
      musicToggle.classList.remove("is-playing");
      musicToggle.setAttribute("aria-pressed", "false");
    }
  });

  // -----------------------------------------------------------------
  // 1. Landing — the "No" button playfully dodges a couple of times
  // -----------------------------------------------------------------
  const btnYes = document.getElementById("btn-yes");
  const btnNo = document.getElementById("btn-no");
  let dodgeCount = 0;

  btnNo.addEventListener("click", (e) => {
    if (dodgeCount < 2) {
      e.preventDefault();
      dodgeCount += 1;
      const dx = (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 60);
      const dy = -(10 + Math.random() * 20);
      btnNo.style.transform = `translate(${dx}px, ${dy}px)`;
      btnNo.classList.add("is-dodging");
      return;
    }
    // After a couple of dodges, let it work — everyone gets to say no.
    showScreen("landing");
  });

  btnYes.addEventListener("click", () => {
    showScreen("reveal");
    runReveal();
  });

  // -----------------------------------------------------------------
  // 2. Reveal — a short progress bar, then straight into the celebration
  // -----------------------------------------------------------------
  function runReveal(){
    const fill = document.getElementById("reveal-progress");
    fill.style.width = "0%";
    let pct = 0;
    const timer = setInterval(() => {
      pct += 4;
      fill.style.width = Math.min(pct, 100) + "%";
      if (pct >= 100) {
        clearInterval(timer);
        showScreen("celebrate");
        burstConfetti(24);
      }
    }, 45);
  }

  // -----------------------------------------------------------------
  // 3. Celebration -> Cake
  // -----------------------------------------------------------------
  document.getElementById("btn-to-cake").addEventListener("click", () => {
    showScreen("cake");
  });

  // -----------------------------------------------------------------
  // 4. Cake — blow out the candle, then move on
  // -----------------------------------------------------------------
  document.getElementById("btn-wish-made").addEventListener("click", () => {
    screens.cake.classList.add("is-blown");
    setTimeout(() => {
      showScreen("wishes");
      burstConfetti(36);
    }, 350);
  });

  // -----------------------------------------------------------------
  // 5. Wish cards
  // -----------------------------------------------------------------
  const cardsWrap = document.getElementById("cards-wrap");
  const wishesProgress = document.getElementById("wishes-progress");
  const wishesStatus = document.getElementById("wishes-status");
  let totalWishes = 0;
  let revealedCount = 0;

  function buildCards(wishes){
    totalWishes = wishes.length;
    revealedCount = 0;
    cardsWrap.innerHTML = "";
    updateWishesProgress();

    wishes.forEach((wish, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card__inner">
          <div class="card__face card__face--front">
            <span class="card__index">${String(i + 1).padStart(2, "0")}</span>
            <span class="card__hint">Tap to reveal</span>
          </div>
          <div class="card__face card__face--back">
            <p class="card__message">${escapeHtml(wish.message)}</p>
            <span class="card__hint">Tap to flip back</span>
          </div>
        </div>
      `;
      card.addEventListener("click", () => {
        const wasFlipped = card.classList.contains("is-flipped");
        card.classList.toggle("is-flipped");
        if (!wasFlipped) {
          revealedCount += 1;
          updateWishesProgress();
        }
      });
      cardsWrap.appendChild(card);
    });
  }

  function updateWishesProgress(){
    const pct = totalWishes === 0 ? 0 : Math.round((revealedCount / totalWishes) * 100);
    wishesProgress.style.width = pct + "%";
    wishesStatus.textContent = totalWishes === 0
      ? "No wishes yet"
      : (revealedCount >= totalWishes
          ? "All wishes revealed"
          : `${revealedCount} of ${totalWishes} revealed`);
  }

  function escapeHtml(str){
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // -----------------------------------------------------------------
  // Confetti — a quick DOM-based burst, cleaned up after it falls
  // -----------------------------------------------------------------
  const confettiColors = ["#B4425A", "#FFD3B0", "#E3A6B5", "#8F2E45", "#FFFFFF"];
  const confettiLayer = document.getElementById("confetti-layer");

  function burstConfetti(count){
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      piece.style.animationDuration = (2.2 + Math.random() * 1.6) + "s";
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiLayer.appendChild(piece);
      setTimeout(() => piece.remove(), 4200);
    }
  }

});
