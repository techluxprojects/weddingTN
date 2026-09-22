const CONFIG = {
  // Keep blank for GitHub Pages-only mode.
  // Set this to your deployed backend endpoint later if you want shared RSVP persistence.
  RSVP_API_URL: "",

  // Wedding venue
  LOCATION_QUERY:
    "Resheen Hotel and Banquets, Kurunegala Road, Kotadeniyawa, Divulapitiya, Sri Lanka",
};

// ============================================================
// DOM ELEMENTS
// ============================================================

const doorScene = document.getElementById("doorScene");
const invitationScene = document.getElementById("invitationScene");
const openButton = document.getElementById("openInvitationBtn");

const musicButton = document.getElementById("musicBtn");
const musicIcon = document.getElementById("musicIcon");

const shareButton = document.getElementById("shareBtn");

const guestSelect = document.getElementById("guestSelect");
const guestNameInput = document.getElementById("guestNameInput");
const eventType = document.getElementById("eventType");

const rsvpForm = document.getElementById("rsvpForm");
const rsvpStatus = document.getElementById("rsvpStatus");
const submitRsvpBtn = document.getElementById("submitRsvpBtn");

const toast = document.getElementById("toast");
const bgMusic = document.getElementById("bgMusic");

// ============================================================
// GLOBAL VARIABLES
// ============================================================

let guests = [];

let audioContext = null;
let musicTimer = null;
let musicRunning = false;

const storageKey = "wedding-rsvp-v1";

// ============================================================
// TOAST
// ============================================================

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  window.clearTimeout(showToast.timer);

  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// ============================================================
// GOOGLE MAPS
// ============================================================

function directionsUrl() {
  const params = new URLSearchParams({
    api: "1",
    destination: CONFIG.LOCATION_QUERY,
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/*
 * Open Google Maps directions.
 *
 * IMPORTANT:
 *
 * We use the standard HTTPS Google Maps URL.
 *
 * We DO NOT use:
 *
 * comgooglemaps://
 *
 * We DO NOT use:
 *
 * window.open()
 *
 * This avoids popup blockers and custom URL-scheme problems
 * on mobile browsers.
 *
 * Android / iPhone can decide whether to open the Google Maps
 * application or Google Maps in the browser.
 */
function openDirections(event) {
  if (event) {
    event.preventDefault();
  }

  const url = directionsUrl();

  window.location.assign(url);
}

// ============================================================
// AUDIO
// ============================================================

function initAudio() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn("Web Audio API is not available.", error);
      return;
    }
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

function playBell(time = 0) {
  if (!audioContext) return;

  try {
    const now = audioContext.currentTime + time;

    const master = audioContext.createGain();

    master.gain.setValueAtTime(0.0001, now);

    master.gain.exponentialRampToValueAtTime(0.22, now + 0.015);

    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);

    master.connect(audioContext.destination);

    [660, 990, 1320].forEach((freq, index) => {
      const osc = audioContext.createOscillator();

      const gain = audioContext.createGain();

      osc.type = index === 0 ? "sine" : "triangle";

      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.0001, now);

      gain.gain.exponentialRampToValueAtTime(
        index === 0 ? 0.75 : 0.28,
        now + 0.015,
      );

      gain.gain.exponentialRampToValueAtTime(0.0001, now + (1.7 + index * 0.3));

      osc.connect(gain).connect(master);

      osc.start(now);

      osc.stop(now + 2.4);
    });
  } catch (error) {
    console.warn("Bell sound could not be played.", error);
  }
}

// ============================================================
// BACKGROUND MUSIC
// ============================================================

function startBackgroundMusic() {
  if (!bgMusic || musicRunning) return;

  try {
    bgMusic.muted = false;

    bgMusic.volume = 0.52;

    bgMusic.loop = true;

    bgMusic.currentTime = 0;

    const playPromise = bgMusic.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        musicRunning = false;

        if (musicButton) {
          musicButton.setAttribute("aria-pressed", "false");
        }

        if (musicIcon) {
          musicIcon.textContent = "♪";
        }
      });
    }

    musicRunning = true;
  } catch (error) {
    musicRunning = false;

    console.warn("Background music could not be started.", error);
  }

  if (musicButton) {
    musicButton.setAttribute("aria-pressed", "true");
  }

  if (musicIcon) {
    musicIcon.textContent = "Ⅱ";
  }
}

function stopBackgroundMusic() {
  musicRunning = false;

  if (musicButton) {
    musicButton.setAttribute("aria-pressed", "false");
  }

  if (musicIcon) {
    musicIcon.textContent = "♪";
  }

  if (bgMusic) {
    bgMusic.pause();

    try {
      bgMusic.currentTime = 0;
    } catch (_) {}
  }

  window.clearInterval(musicTimer);

  musicTimer = null;
}

// ============================================================
// OPEN INVITATION
// ============================================================

async function openInvitation() {
  initAudio();

  // Optional wedding bell.
  // Uncomment if you want the bell sound.
  //
  // playBell(0);
  // playBell(0.55);

  startBackgroundMusic();

  // Open doors
  if (doorScene) {
    doorScene.classList.add("open");
  }

  // Show invitation
  window.setTimeout(() => {
    if (invitationScene) {
      invitationScene.classList.remove("d-none");

      invitationScene.classList.add("fade-in");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, 1350);

  // Remove door scene completely
  window.setTimeout(() => {
    if (doorScene) {
      doorScene.classList.add("d-none");
    }
  }, 2600);
}

// ============================================================
// LOCAL RSVP RESPONSES
// ============================================================

function readLocalResponses() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch (error) {
    return {};
  }
}

// ============================================================
// ATTENDANCE NORMALIZATION
// ============================================================

function normalizeAttendanceValue(value) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (
    ["attending", "coming", "comming", "yes", "accepted", "going"].includes(raw)
  ) {
    return "attending";
  }

  if (["notattending", "notcoming", "decline", "no", "sorry"].includes(raw)) {
    return "not_attending";
  }

  if (value === "Coming" || value === "Comming") {
    return "attending";
  }

  if (value === "Not Coming" || value === "NotComing") {
    return "not_attending";
  }

  return "";
}

function formatAttendanceLabel(value) {
  const normalized = normalizeAttendanceValue(value);

  if (normalized === "attending") {
    return "Coming";
  }

  if (normalized === "not_attending") {
    return "Not Coming";
  }

  return "Pending";
}

// ============================================================
// DATABASE
// ============================================================

function readDatabase() {
  try {
    const saved = localStorage.getItem("wedding-db-v1");

    if (saved) {
      const parsed = JSON.parse(saved);

      if (parsed && Array.isArray(parsed.invites)) {
        return parsed;
      }
    }
  } catch (error) {
    // Ignore malformed storage and use default.
  }

  return {
    event: {
      bride: "Thilini Kaushalya",

      groom: "Nimash Karunathilake",

      date: "2026-10-21",

      startTime: "10:30",

      endTime: "16:00",

      venue: "Resheen Hotel and Banquets",

      address: "Kurunegala Road, Kotadeniyawa, Divulapitiya, Sri Lanka",
    },

    invites: [],
  };
}

function writeDatabase(data) {
  localStorage.setItem("wedding-db-v1", JSON.stringify(data));
}

// ============================================================
// DOWNLOAD DATABASE
// ============================================================

function downloadDatabaseJson() {
  const database = readDatabase();

  const payload = JSON.stringify(database, null, 2);

  const blob = new Blob([payload], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "db.json";

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// ============================================================
// SAVE LOCAL RESPONSE
// ============================================================

function saveLocalResponse(guestId, attending) {
  const all = readLocalResponses();

  all[guestId] = {
    attending,

    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(storageKey, JSON.stringify(all));
}

// ============================================================
// SYNC GUEST TO DATABASE
// ============================================================

function syncGuestToDatabase(guestId, guestName, attending, selectedEventType) {
  const database = readDatabase();

  const invites = Array.isArray(database.invites) ? database.invites : [];

  const targetId = guestId || guestName || `manual-${Date.now()}`;

  const normalizedAttendance = normalizeAttendanceValue(attending);

  const attendanceLabel = formatAttendanceLabel(attending);

  const index = invites.findIndex(
    (entry) => entry.id === targetId || entry.name === guestName,
  );

  const value = {
    id: targetId,

    name: guestName,

    attendance: attendanceLabel,

    attending: normalizedAttendance,

    function: selectedEventType || "Wedding Day",

    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    invites[index] = {
      ...invites[index],
      ...value,
    };
  } else {
    invites.push(value);
  }

  database.invites = invites;

  writeDatabase(database);

  return database;
}

// ============================================================
// RENDER GUEST LIST
// ============================================================

function renderGuestList() {
  if (!guestSelect) return;

  guestSelect.innerHTML = '<option value="">Select your name</option>';

  guests.forEach((guest) => {
    const option = document.createElement("option");

    option.value = guest.id;

    option.textContent = guest.name;

    guestSelect.appendChild(option);
  });

  const query = new URLSearchParams(window.location.search);

  const guestId = query.get("guest") || query.get("id");

  if (guestId && guests.some((g) => g.id === guestId)) {
    guestSelect.value = guestId;
  }

  updateExistingResponse();
}

// ============================================================
// EXISTING RESPONSE
// ============================================================

function updateExistingResponse() {
  if (!guestSelect || !rsvpStatus) {
    return;
  }

  const id = guestSelect.value;

  const responses = readLocalResponses();

  const saved = id ? responses[id] : null;

  if (saved) {
    const attendanceElement = document.getElementById("attendance");

    if (attendanceElement) {
      attendanceElement.value = saved.attending;
    }

    rsvpStatus.textContent =
      "A response is already saved on this device. You can update it and confirm again.";

    rsvpStatus.classList.remove("d-none");
  } else {
    rsvpStatus.classList.add("d-none");
  }
}

// ============================================================
// LOAD GUESTS
// ============================================================

async function loadGuests() {
  if (!guestSelect) return;

  try {
    const response = await fetch("db.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("db.json could not be loaded");
    }

    const data = await response.json();

    guests = Array.isArray(data.invites) ? data.invites : [];

    renderGuestList();
  } catch (error) {
    guestSelect.innerHTML =
      '<option value="">Could not load invitation list</option>';

    showToast("Please check that db.json is in the same GitHub Pages folder.");

    console.error(error);
  }
}

// ============================================================
// SUBMIT RSVP
// ============================================================

async function submitRsvp(event) {
  event.preventDefault();

  if (!guestSelect) return;

  const guestId = guestSelect.value;

  const guest = guests.find((g) => g.id === guestId);

  const attendanceElement = document.getElementById("attendance");

  const attending = attendanceElement ? attendanceElement.value : "";

  const typedName = (guestNameInput?.value || "").trim();

  const selectedEventType = eventType?.value || "Wedding Day";

  const finalName = guest ? guest.name : typedName;

  const normalizedAttendance = normalizeAttendanceValue(attending);

  if ((!guest && !typedName) || !normalizedAttendance) {
    if (rsvpStatus) {
      rsvpStatus.textContent =
        "Please select your name or type it manually, and choose your attendance response.";

      rsvpStatus.classList.remove("d-none");
    }

    return;
  }

  if (submitRsvpBtn) {
    submitRsvpBtn.disabled = true;

    submitRsvpBtn.textContent = "Saving...";
  }

  try {
    // --------------------------------------------------------
    // Optional backend API
    // --------------------------------------------------------

    if (CONFIG.RSVP_API_URL) {
      const response = await fetch(CONFIG.RSVP_API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          guestId: guestId || "manual",

          name: finalName,

          attending,

          function: selectedEventType,
        }),
      });

      if (!response.ok) {
        throw new Error(`RSVP API returned ${response.status}`);
      }
    }

    // --------------------------------------------------------
    // Local payload
    // --------------------------------------------------------

    const payload = {
      guestId: guestId || "manual",

      name: finalName,

      attending: normalizedAttendance,

      attendance: formatAttendanceLabel(normalizedAttendance),

      function: selectedEventType,

      updatedAt: new Date().toISOString(),
    };

    // Keep payload available for debugging
    // without affecting the application.
    console.debug("RSVP payload:", payload);

    // --------------------------------------------------------
    // Save locally
    // --------------------------------------------------------

    saveLocalResponse(guestId || finalName, normalizedAttendance);

    // --------------------------------------------------------
    // Update local database
    // --------------------------------------------------------

    syncGuestToDatabase(
      guestId || finalName,

      finalName,

      normalizedAttendance,

      selectedEventType,
    );

    // --------------------------------------------------------
    // Download updated database
    // --------------------------------------------------------

    downloadDatabaseJson();

    // --------------------------------------------------------
    // Success message
    // --------------------------------------------------------

    const message =
      normalizedAttendance === "attending"
        ? `Thank you, ${finalName}. We will be delighted to see you.`
        : `Thank you, ${finalName}. We are sorry you cannot join us.`;

    if (rsvpStatus) {
      rsvpStatus.textContent = message;

      rsvpStatus.classList.remove("d-none");
    }

    showToast("RSVP confirmed");
  } catch (error) {
    if (rsvpStatus) {
      rsvpStatus.textContent =
        "The RSVP service could not be reached. Your response was not sent to the shared database.";

      rsvpStatus.classList.remove("d-none");
    }

    console.error(error);
  } finally {
    if (submitRsvpBtn) {
      submitRsvpBtn.disabled = false;

      submitRsvpBtn.textContent = "Confirm RSVP";
    }
  }
}

// ============================================================
// SHARE INVITATION
// ============================================================

async function shareInvitation() {
  const shareData = {
    title: "Thilini & Nimash | Wedding Invitation",

    text: "You are warmly invited to the wedding of Thilini Kaushalya & Nimash Karunathilake.",

    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);

      showToast("Invitation link copied");
    } else {
      window.prompt("Copy this invitation link:", window.location.href);
    }
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error(error);
    }
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Open invitation
if (openButton) {
  openButton.addEventListener("click", openInvitation);
}

// Start music after first user interaction
document.addEventListener(
  "pointerdown",
  () => {
    if (!musicRunning) {
      initAudio();

      startBackgroundMusic();
    }
  },
  {
    once: true,
  },
);

// Music button
if (musicButton) {
  musicButton.addEventListener("click", () => {
    initAudio();

    if (musicRunning) {
      stopBackgroundMusic();
    } else {
      startBackgroundMusic();
    }
  });
}

// Share button
if (shareButton) {
  shareButton.addEventListener("click", shareInvitation);
}

// RSVP form
if (rsvpForm) {
  rsvpForm.addEventListener("submit", submitRsvp);
}

// Guest selection
if (guestSelect) {
  guestSelect.addEventListener("change", updateExistingResponse);
}

// ============================================================
// LOCATION LINKS
// ============================================================

document.querySelectorAll("[data-location-link]").forEach((element) => {
  // Mouse / touch click
  element.addEventListener("click", openDirections);

  // Keyboard accessibility
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      openDirections();
    }
  });
});

// ============================================================
// INITIALIZE
// ============================================================

loadGuests();
