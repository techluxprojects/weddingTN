const HOME_LOCATION =
  "https://www.google.com/maps/dir/?api=1&destination=Amaya+Grand%2C+No.+11%2F9%2C+Malvilawatte%2C+Giriulla%2C+Sri+Lanka&travelmode=driving";

const doorScene = document.getElementById("doorScene");
const doors = document.querySelector(".doors");
const openButton = document.getElementById("openInvitationBtn");
const invitationScene = document.getElementById("invitationScene");
const musicBtn = document.getElementById("musicBtn");
const musicIcon = document.getElementById("musicIcon");
const shareBtn = document.getElementById("shareBtn");
const toast = document.getElementById("toast");
const bgMusic = document.getElementById("bgMusic");

let audioContext = null;
let musicPlaying = false;

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(showToast.timer);

  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

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

function readWeddingDatabase() {
  try {
    const saved = localStorage.getItem("wedding-db-v1");

    if (saved) {
      const parsed = JSON.parse(saved);

      if (parsed && Array.isArray(parsed.invites)) {
        return parsed;
      }
    }
  } catch (_) {}

  return {
    event: {
      bride: "Thilini Kaushalya",
      groom: "Nimash Karunathilake",
      date: "2026-10-21",
      startTime: "10:30",
      endTime: "16:00",
      venue: "Amaya Grand, Giriulla",
      address: "No. 11/9, Malvilawatte, Giriulla, Sri Lanka",
    },
    invites: [],
  };
}

function writeWeddingDatabase(data) {
  localStorage.setItem("wedding-db-v1", JSON.stringify(data));
}

function downloadWeddingDatabaseJson() {
  const database = readWeddingDatabase();

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

function syncGuestToWeddingDatabase(
  guestId,
  guestName,
  attending,
  functionName,
) {
  const database = readWeddingDatabase();

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
    function: functionName || "Wedding Day",
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

  writeWeddingDatabase(database);

  return database;
}

function startWeddingMusic() {
  if (!bgMusic || musicPlaying) return;

  try {
    bgMusic.muted = false;
    bgMusic.volume = 0.5;
    bgMusic.loop = true;
    bgMusic.currentTime = 0;

    const playPromise = bgMusic.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        musicPlaying = false;

        if (musicBtn) {
          musicBtn.setAttribute("aria-pressed", "false");
        }

        if (musicIcon) {
          musicIcon.textContent = "♪";
        }
      });
    }

    musicPlaying = true;
  } catch (_) {
    musicPlaying = false;
  }

  if (musicBtn) {
    musicBtn.setAttribute("aria-pressed", "true");
  }

  if (musicIcon) {
    musicIcon.textContent = "❚❚";
  }
}

function stopWeddingMusic() {
  musicPlaying = false;

  if (bgMusic) {
    bgMusic.pause();

    try {
      bgMusic.currentTime = 0;
    } catch (_) {}
  }

  if (musicBtn) {
    musicBtn.setAttribute("aria-pressed", "false");
  }

  if (musicIcon) {
    musicIcon.textContent = "♪";
  }
}

function playBell() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    const ctx = audioContext || new AudioContext();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    audioContext = ctx;

    const gain = ctx.createGain();

    gain.gain.setValueAtTime(0.001, ctx.currentTime);

    gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.015);

    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.4);

    gain.connect(ctx.destination);

    [880, 1174.66, 1760].forEach((frequency, i) => {
      const osc = ctx.createOscillator();

      osc.type = "sine";
      osc.frequency.value = frequency;
      osc.detune.value = i * 3;

      osc.connect(gain);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.5);
    });
  } catch (_) {}
}

function openInvitation() {
  if (!doorScene || !doors || !invitationScene) {
    return;
  }

  if (doorScene.classList.contains("opened")) {
    return;
  }

  doors.classList.add("open");

  setTimeout(() => {
    startWeddingMusic();
  }, 700);

  setTimeout(() => {
    invitationScene.classList.remove("d-none");
  }, 800);

  setTimeout(() => {
    doorScene.classList.add("opened");
  }, 1900);
}

if (openButton) {
  openButton.addEventListener("click", openInvitation);
}

document.addEventListener(
  "pointerdown",
  () => {
    if (!musicPlaying) {
      startWeddingMusic();
    }
  },
  {
    once: true,
  },
);

if (musicBtn) {
  musicBtn.addEventListener("click", () => {
    if (musicPlaying) {
      stopWeddingMusic();
    } else {
      startWeddingMusic();
    }
  });
}

function openHomecomingDirections(event) {
  if (event) {
    event.preventDefault();
  }

  window.location.assign(HOME_LOCATION);
}

document.querySelectorAll("[data-location-link]").forEach((element) => {
  element.addEventListener("click", openHomecomingDirections);

  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openHomecomingDirections();
    }
  });
});

if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    const shareData = {
      title: "Thilini & Nimash | Homecoming Invitation",
      text: "You are warmly invited to our homecoming celebration.",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);

        showToast("Invitation link copied.");
      } else {
        window.prompt("Copy this invitation link:", window.location.href);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
      }
    }
  });
}

const RSVP_API_URL = "";

const guestSelect = document.getElementById("guestSelect");

const guestNameInput = document.getElementById("guestNameInput");

const eventType = document.getElementById("eventType");

const rsvpForm = document.getElementById("rsvpForm");

const attendance = document.getElementById("attendance");

const rsvpStatus = document.getElementById("rsvpStatus");

async function loadGuests() {
  if (!guestSelect) return;

  try {
    const response = await fetch("db.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Guest list could not be loaded.");
    }

    const data = await response.json();

    const guests = Array.isArray(data)
      ? data
      : data.guests || data.invites || [];

    guestSelect.innerHTML = '<option value="">Select your name</option>';

    guests.forEach((guest) => {
      const option = document.createElement("option");

      option.value = guest.id || guest.name;

      option.textContent = guest.name;

      guestSelect.appendChild(option);
    });

    const guestId = new URLSearchParams(window.location.search).get("guest");

    if (guestId) {
      guestSelect.value = guestId;
    }
  } catch (_) {
    guestSelect.innerHTML = '<option value="">Guest list unavailable</option>';
  }
}

if (rsvpForm) {
  rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!guestSelect || !attendance || !rsvpStatus) {
      return;
    }

    const guestId = guestSelect.value;

    const response = attendance.value;

    const typedName = (guestNameInput?.value || "").trim();

    const guestName = typedName || guestId || "Guest";

    const functionName = eventType?.value || "Wedding Day";

    const normalizedResponse = normalizeAttendanceValue(response);

    if ((!guestId && !typedName) || !normalizedResponse) {
      rsvpStatus.className = "rsvp-status";

      rsvpStatus.textContent =
        "Please type your name or select a guest and choose an attendance response.";

      return;
    }

    const payload = {
      invitation: "homecoming",
      guest: guestName,
      guestId: guestId,
      attendance: formatAttendanceLabel(response),
      attending: normalizedResponse,
      function: functionName,
      respondedAt: new Date().toISOString(),
    };

    if (RSVP_API_URL) {
      try {
        const result = await fetch(RSVP_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!result.ok) {
          throw new Error("RSVP failed.");
        }
      } catch (_) {
        rsvpStatus.className = "rsvp-status";

        rsvpStatus.textContent =
          "We could not submit your RSVP. Please try again.";

        return;
      }
    } else {
      const database = readWeddingDatabase();

      const invites = Array.isArray(database.invites) ? database.invites : [];

      const targetId = guestId || guestName || `manual-${Date.now()}`;

      const index = invites.findIndex(
        (entry) => entry.id === targetId || entry.name === guestName,
      );

      const nextEntry = {
        id: targetId,
        name: guestName,
        attendance: formatAttendanceLabel(response),
        attending: normalizedResponse,
        function: functionName,
        updatedAt: new Date().toISOString(),
      };

      if (index >= 0) {
        invites[index] = {
          ...invites[index],
          ...nextEntry,
        };
      } else {
        invites.push(nextEntry);
      }

      database.invites = invites;

      writeWeddingDatabase(database);
    }

    rsvpStatus.className = "rsvp-status";

    rsvpStatus.textContent =
      normalizedResponse === "attending"
        ? `Thank you, ${guestName}. We look forward to celebrating with you.`
        : `Thank you, ${guestName}. We appreciate your response.`;
  });
}

loadGuests();
