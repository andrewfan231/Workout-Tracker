const PROFILE_STORAGE_KEY = "overload-fitness-profile";
const WORKOUT_STORAGE_KEY = "overload-fitness-tracker";
const CARDIO_STORAGE_KEY = "overload-fitness-cardio-log";
const COMPLETED_WORKOUTS_STORAGE_KEY = "overload-fitness-completed-workouts";
const REDEMPTION_STORAGE_KEY = "overload-fitness-redemptions";
const BODY_METRICS_STORAGE_KEY = "overload-fitness-body-metrics";
const CUSTOM_REWARDS_STORAGE_KEY = "overload-fitness-custom-rewards";

const profileForm = document.querySelector("#profileForm");
const bodyMetricForm = document.querySelector("#bodyMetricForm");
const displayNameInput = document.querySelector("#displayNameInput");
const trainingStyleInput = document.querySelector("#trainingStyleInput");
const mainGoalInput = document.querySelector("#mainGoalInput");
const weeklyPromiseInput = document.querySelector("#weeklyPromiseInput");
const bodyMetricDate = document.querySelector("#bodyMetricDate");
const bodyMetricWeight = document.querySelector("#bodyMetricWeight");
const bodyMetricNotes = document.querySelector("#bodyMetricNotes");
const bodyMetricList = document.querySelector("#bodyMetricList");
const profileSaved = document.querySelector("#profileSaved");
const profileInitial = document.querySelector("#profileInitial");
const profileNamePreview = document.querySelector("#profileNamePreview");
const profileStylePreview = document.querySelector("#profileStylePreview");
const profileStats = document.querySelector("#profileStats");
const profileRecommendation = document.querySelector("#profileRecommendation");
const athleteSnapshot = document.querySelector("#athleteSnapshot");
const athleteSnapshotStatus = document.querySelector("#athleteSnapshotStatus");
const copySiteLink = document.querySelector("#copySiteLink");
const exportAllData = document.querySelector("#exportAllData");
const importAllData = document.querySelector("#importAllData");
const clearLocalData = document.querySelector("#clearLocalData");
const profileBackupBox = document.querySelector("#profileBackupBox");
const dataSafety = document.querySelector("#dataSafety");

const logs = load(WORKOUT_STORAGE_KEY, []);
const cardioEntries = load(CARDIO_STORAGE_KEY, []);
const completedWorkouts = load(COMPLETED_WORKOUTS_STORAGE_KEY, []);
const redemptions = load(REDEMPTION_STORAGE_KEY, []);
let bodyMetrics = load(BODY_METRICS_STORAGE_KEY, []);
let profile = load(PROFILE_STORAGE_KEY, {});

if (bodyMetricDate) bodyMetricDate.value = toDateKey(new Date());
hydrateProfile();
renderProfile();
renderStats();
renderRecommendation();
renderBodyMetrics();
renderAthleteSnapshot();
renderDataSafety();

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  profile = {
    displayName: displayNameInput.value.trim(),
    trainingStyle: trainingStyleInput.value,
    mainGoal: mainGoalInput.value.trim(),
    weeklyPromise: weeklyPromiseInput.value.trim(),
    updatedAt: Date.now(),
  };
  save(PROFILE_STORAGE_KEY, profile);
  renderProfile();
  renderRecommendation();
  renderAthleteSnapshot();
  profileSaved.hidden = false;
  setTimeout(() => {
    profileSaved.hidden = true;
  }, 1600);
});

bodyMetricForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const entry = {
    id: crypto.randomUUID(),
    date: bodyMetricDate.value || toDateKey(new Date()),
    weight: bodyMetricWeight.value.trim(),
    notes: bodyMetricNotes.value.trim(),
    createdAt: Date.now(),
  };
  if (!entry.weight && !entry.notes) return;

  bodyMetrics = [entry, ...bodyMetrics];
  save(BODY_METRICS_STORAGE_KEY, bodyMetrics);
  bodyMetricWeight.value = "";
  bodyMetricNotes.value = "";
  renderStats();
  renderBodyMetrics();
  renderAthleteSnapshot();
});

copySiteLink.addEventListener("click", async () => {
  const link = "https://andrewsworkouttracker.netlify.app/";
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link);
    copySiteLink.textContent = "Copied";
    setTimeout(() => {
      copySiteLink.textContent = "Copy Link";
    }, 1400);
  }
});

exportAllData.addEventListener("click", () => {
  const backup = getBackupData();
  profileBackupBox.value = JSON.stringify(backup, null, 2);
});

importAllData.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    Object.entries(data).forEach(([key, value]) => {
      if (getBackupKeys().includes(key)) save(key, value);
    });
    profileBackupBox.value = "Import complete. Refresh the app to load the restored data.";
  } catch {
    profileBackupBox.value = "Import failed. Use a backup file exported from this app.";
  }
  importAllData.value = "";
});

clearLocalData.addEventListener("click", () => {
  const confirmed = confirm("Clear all local workout data from this browser? Export first if you want a backup.");
  if (!confirmed) return;

  Object.keys(getBackupData()).forEach((key) => localStorage.removeItem(key));
  profileBackupBox.value = "Local data cleared. Refresh the app to start fresh.";
});

function hydrateProfile() {
  displayNameInput.value = profile.displayName || "";
  trainingStyleInput.value = profile.trainingStyle || "";
  mainGoalInput.value = profile.mainGoal || "";
  weeklyPromiseInput.value = profile.weeklyPromise || "";
}

function renderProfile() {
  const name = profile.displayName || "Player";
  profileInitial.textContent = name.trim().charAt(0).toUpperCase() || "P";
  profileNamePreview.textContent = name;
  profileStylePreview.textContent = profile.trainingStyle || "Training style not set";
}

function renderStats() {
  const workoutDays = new Set([...logs.map((log) => log.date), ...cardioEntries.map((entry) => entry.date), ...completedWorkouts.map((entry) => entry.date)]);
  const volume = logs.reduce((sum, log) => sum + getVolume(log), 0);
  const miles = cardioEntries.reduce((sum, entry) => sum + (Number(entry.miles) || 0), 0);
  const latestBodyweight = [...bodyMetrics].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))[0];
  const effortAverage = completedWorkouts.length
    ? Math.round(completedWorkouts.reduce((sum, entry) => sum + (Number(entry.effort) || 0), 0) / completedWorkouts.length)
    : 0;

  profileStats.innerHTML = [
    { label: "Training days", value: workoutDays.size },
    { label: "Completed workouts", value: completedWorkouts.length },
    { label: "Total volume", value: formatNumber(volume) },
    { label: "Cardio miles", value: formatNumber(miles) },
    { label: "Latest bodyweight", value: latestBodyweight?.weight || "-" },
    { label: "Avg effort", value: effortAverage ? `${effortAverage}/100` : "-" },
    { label: "Rewards claimed", value: redemptions.length },
  ]
    .map((stat) => `<article><strong>${stat.value}</strong><span>${stat.label}</span></article>`)
    .join("");
}

function renderAthleteSnapshot() {
  if (!athleteSnapshot || !athleteSnapshotStatus) return;
  const workoutDays = new Set([...logs.map((log) => log.date), ...cardioEntries.map((entry) => entry.date), ...completedWorkouts.map((entry) => entry.date)]);
  const profileItems = [profile.displayName, profile.trainingStyle, profile.mainGoal, profile.weeklyPromise].filter(Boolean).length;
  const profileScore = Math.round((profileItems / 4) * 100);
  const latestSession = [...completedWorkouts].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
  const latestBodyweight = [...bodyMetrics].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))[0];
  const streak = getStreak(workoutDays);
  const status = profileScore >= 100 ? "ready" : profileScore >= 50 ? "almost set" : "needs setup";

  athleteSnapshotStatus.textContent = status;
  athleteSnapshot.innerHTML = `
    <article>
      <strong>${profileScore}%</strong>
      <span>profile complete</span>
      <i style="--meter:${profileScore}%"></i>
    </article>
    <article>
      <strong>${streak}</strong>
      <span>day streak</span>
      <i style="--meter:${Math.min(100, streak * 14)}%"></i>
    </article>
    <article>
      <strong>${latestSession ? escapeHtml(latestSession.workoutName) : "No session yet"}</strong>
      <span>${latestSession ? `last clear · ${Number(latestSession.effort) || 0}/100 effort` : "complete a workout to start history"}</span>
      <i style="--meter:${latestSession ? Number(latestSession.effort) || 30 : 12}%"></i>
    </article>
    <article>
      <strong>${latestBodyweight?.weight || "Not logged"}</strong>
      <span>latest body check-in</span>
      <i style="--meter:${latestBodyweight ? 70 : 12}%"></i>
    </article>
  `;
}

function renderRecommendation() {
  const style = profile.trainingStyle || "General fitness";
  const recommendations = {
    Strength: ["Use Push/Pull/Legs", "Track weight and reps every session.", "Check Progression after 2-3 workouts."],
    Basketball: ["Use Basketball Performance", "Log effort after each session.", "Watch cardio miles and leg volume."],
    Bodybuilding: ["Use Push/Pull/Legs", "Chase clean volume and consistent sets.", "Use Past Workouts to compare pumps and effort."],
    Conditioning: ["Use Conditioning Day", "Track effort and cardio miles.", "Redeem rewards after consistency, not random days."],
    "Weight loss": ["Use No Equipment or Conditioning", "Focus on weekly consistency.", "Keep rewards planned and specific."],
    Mobility: ["Use Mobility Reset", "Protect the streak on recovery days.", "Pair mobility with light cardio."],
    "No equipment": ["Use No Equipment", "Log reps and effort.", "Add difficulty when workouts feel easy."],
    "General fitness": ["Use Full Body Starter", "Set one weekly workout goal.", "Complete one session and check Past Workouts."],
  };
  const templateByStyle = {
    Strength: "push",
    Basketball: "basketball",
    Bodybuilding: "push",
    Conditioning: "conditioning",
    "Weight loss": "bodyweight",
    Mobility: "mobility",
    "No equipment": "bodyweight",
    "General fitness": "fullBody",
  };
  const picks = recommendations[style] || recommendations["General fitness"];
  const templateName = templateByStyle[style] || "fullBody";

  profileRecommendation.innerHTML = `
    <article class="recommendation-card">
      <strong>${style} path</strong>
      ${picks.map((pick) => `<span>${pick}</span>`).join("")}
      <a class="connected-action" href="workout.html#template-${templateName}">Load My Starter Workout</a>
    </article>
  `;
}

function renderBodyMetrics() {
  if (!bodyMetricList) return;
  const entries = [...bodyMetrics]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 6);

  bodyMetricList.innerHTML = entries.length
    ? entries
        .map((entry) => `
          <article>
            <strong>${escapeHtml(entry.weight || "Check-in")}</strong>
            <span>${escapeHtml(formatDate(entry.date))}${entry.notes ? ` · ${escapeHtml(entry.notes)}` : ""}</span>
          </article>
        `)
        .join("")
    : `<p class="empty-state">Save bodyweight or notes here to track your longer progress.</p>`;
}

function renderDataSafety() {
  if (!dataSafety) return;
  const backup = getBackupData();
  const filledKeys = Object.values(backup).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return Boolean(value);
  }).length;
  const percent = Math.round((filledKeys / getBackupKeys().length) * 100);

  dataSafety.innerHTML = `
    <strong>${percent}% data footprint</strong>
    <span>${filledKeys} of ${getBackupKeys().length} local data groups have saved information. Export before switching browsers or clearing storage.</span>
    <i style="--meter:${percent}%"></i>
  `;
}

function getVolume(log) {
  const weight = Number(log.weight) || 0;
  return (Number(log.sets) || 0) * (Number(log.reps) || 0) * (weight || 1);
}

function getStreak(workoutDays) {
  let streak = 0;
  let date = new Date();
  while (workoutDays.has(toDateKey(date))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function getBackupKeys() {
  return [
    PROFILE_STORAGE_KEY,
    WORKOUT_STORAGE_KEY,
    CARDIO_STORAGE_KEY,
    COMPLETED_WORKOUTS_STORAGE_KEY,
    REDEMPTION_STORAGE_KEY,
    BODY_METRICS_STORAGE_KEY,
    CUSTOM_REWARDS_STORAGE_KEY,
    "overload-fitness-goals",
    "overload-fitness-max-log",
    "overload-fitness-created-workouts",
  ];
}

function getBackupData() {
  return getBackupKeys().reduce((data, key) => {
    data[key] = load(key, null);
    return data;
  }, {});
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateKey) {
  if (!dateKey) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}
