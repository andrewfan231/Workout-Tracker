const WORKOUT_STORAGE_KEY = "overload-fitness-tracker";
const MAX_STORAGE_KEY = "overload-fitness-max-log";
const CARDIO_STORAGE_KEY = "overload-fitness-cardio-log";
const COMPLETED_WORKOUTS_STORAGE_KEY = "overload-fitness-completed-workouts";
const BODY_METRICS_STORAGE_KEY = "overload-fitness-body-metrics";

const progressSummary = document.querySelector("#progressSummary");
const personalBestList = document.querySelector("#personalBestList");
const nextTargetList = document.querySelector("#nextTargetList");
const consistencyMap = document.querySelector("#consistencyMap");
const muscleBalance = document.querySelector("#muscleBalance");
const recentSessionList = document.querySelector("#recentSessionList");
const trainingReadiness = document.querySelector("#trainingReadiness");
const readinessLabel = document.querySelector("#readinessLabel");
const progressCoach = document.querySelector("#progressCoach");
const progressCoachStatus = document.querySelector("#progressCoachStatus");
const repsExerciseSelect = document.querySelector("#repsExerciseSelect");
const maxMovementSelect = document.querySelector("#maxMovementSelect");
const repsChart = document.querySelector("#repsChart");
const maxChart = document.querySelector("#maxChart");
const repsEmpty = document.querySelector("#repsEmpty");
const maxEmpty = document.querySelector("#maxEmpty");
const cardioChart = document.querySelector("#cardioChart");
const cardioEmpty = document.querySelector("#cardioEmpty");
const volumeChart = document.querySelector("#volumeChart");
const volumeEmpty = document.querySelector("#volumeEmpty");
const effortChart = document.querySelector("#effortChart");
const effortEmpty = document.querySelector("#effortEmpty");
const bodyChart = document.querySelector("#bodyChart");
const bodyEmpty = document.querySelector("#bodyEmpty");

const logs = load(WORKOUT_STORAGE_KEY, []);
const maxEntries = load(MAX_STORAGE_KEY, []);
const cardioEntries = load(CARDIO_STORAGE_KEY, []);
const completedWorkouts = load(COMPLETED_WORKOUTS_STORAGE_KEY, []);
const bodyMetrics = load(BODY_METRICS_STORAGE_KEY, []);

setupSelect(repsExerciseSelect, uniqueValues(logs, "exercise"));
setupSelect(maxMovementSelect, uniqueValues(maxEntries, "movement"));
renderSummaryCards();
renderTrainingReadiness();
renderProgressCoach();
renderPersonalBests();
renderNextTargets();
renderConsistencyMap();
renderMuscleBalance();
renderRecentSessions();
renderEffortChart();
renderRepsChart();
renderMaxChart();
renderCardioChart();
renderWeeklyVolumeChart();
renderBodyChart();

repsExerciseSelect.addEventListener("change", renderRepsChart);
maxMovementSelect.addEventListener("change", renderMaxChart);

function renderSummaryCards() {
  const totalVolume = logs.reduce((sum, log) => sum + getVolume(log), 0);
  const totalReps = logs.reduce((sum, log) => sum + Number(log.sets) * Number(log.reps), 0);
  const totalMiles = cardioEntries.reduce((sum, entry) => sum + (Number(entry.miles) || 0), 0);
  const totalTime = completedWorkouts.reduce((sum, session) => sum + (Number(session.duration) || 0), 0);
  const workoutDays = getWorkoutDays();
  const currentStreak = getStreak(workoutDays);
  const latestBodyweight = [...bodyMetrics].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))[0];

  progressSummary.innerHTML = [
    { label: "Current streak", value: `${currentStreak} days`, note: "completed workouts" },
    { label: "Total volume", value: formatNumber(totalVolume), note: "sets x reps x weight" },
    { label: "Training time", value: formatDuration(totalTime), note: "completed sessions" },
    { label: "Cardio miles", value: formatNumber(totalMiles), note: "conditioning work" },
    { label: "Bodyweight", value: latestBodyweight?.weight || "-", note: "latest check-in" },
  ]
    .map((card) => {
      return `
        <article class="progress-stat-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
          <small>${card.note}</small>
        </article>
      `;
    })
    .join("");
}

function renderTrainingReadiness() {
  if (!trainingReadiness || !readinessLabel) return;
  const recent = completedWorkouts
    .slice()
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, 3);
  const avgEffort = recent.length ? recent.reduce((sum, session) => sum + (Number(session.effort) || 0), 0) / recent.length : 0;
  const last = recent[0];

  let label = "Build Base";
  let message = "Complete a few workouts and this will start reading your training rhythm.";
  let percent = 35;

  if (recent.length) {
    if (avgEffort >= 88) {
      label = "High Strain";
      message = "Recent sessions were intense. Train today, but consider lower volume or longer rests.";
      percent = 48;
    } else if (avgEffort >= 65) {
      label = "Ready";
      message = "Good spot. You can push for a small PR or cleaner reps today.";
      percent = 82;
    } else {
      label = "Fresh";
      message = "Effort has been moderate. This is a good day to build momentum.";
      percent = 72;
    }
  }

  readinessLabel.textContent = label;
  trainingReadiness.innerHTML = `
    <div class="readiness-ring" style="--ready:${percent}%"><strong>${Math.round(percent)}</strong><span>/100</span></div>
    <div>
      <strong>${label}</strong>
      <span>${message}</span>
      ${last ? `<small>Last: ${last.workoutName} · ${Number(last.effort) || 0}/100 effort</small>` : ""}
    </div>
  `;
}

function renderProgressCoach() {
  if (!progressCoach || !progressCoachStatus) return;
  const currentWeekStart = startOfWeek(new Date());
  const previousWeekStart = addDays(currentWeekStart, -7);
  const currentWeekLogs = logs.filter((log) => {
    const date = parseDateKey(log.date);
    return date >= currentWeekStart;
  });
  const previousWeekLogs = logs.filter((log) => {
    const date = parseDateKey(log.date);
    return date >= previousWeekStart && date < currentWeekStart;
  });
  const currentVolume = currentWeekLogs.reduce((sum, log) => sum + getVolume(log), 0);
  const previousVolume = previousWeekLogs.reduce((sum, log) => sum + getVolume(log), 0);
  const volumeDiff = currentVolume - previousVolume;
  const currentSessions = completedWorkouts.filter((session) => parseDateKey(session.date) >= currentWeekStart);
  const previousSessions = completedWorkouts.filter((session) => {
    const date = parseDateKey(session.date);
    return date >= previousWeekStart && date < currentWeekStart;
  });
  const avgEffort = currentSessions.length
    ? Math.round(currentSessions.reduce((sum, session) => sum + (Number(session.effort) || 0), 0) / currentSessions.length)
    : 0;

  let status = "build base";
  let title = "Set the baseline";
  let detail = "Log a few workouts this week and the app will start comparing your training trend.";
  let action = { href: "workout.html#log", label: "Log Workout" };

  if (currentSessions.length || currentWeekLogs.length) {
    if (previousVolume && volumeDiff > 0) {
      status = "trending up";
      title = `Volume is up ${formatNumber(volumeDiff)}`;
      detail = avgEffort >= 88
        ? "You are pushing hard and volume is rising. Keep the next session clean, not reckless."
        : "Good trend. Add progress slowly so the streak stays sustainable.";
      action = { href: "workout.html#log", label: "Train Next" };
    } else if (previousVolume && volumeDiff < 0) {
      status = "rebuild";
      title = `Volume is down ${formatNumber(Math.abs(volumeDiff))}`;
      detail = "Not a failure. Make the next workout simple and finish it. Momentum first.";
      action = { href: "workout.html#log", label: "Rebuild Momentum" };
    } else {
      status = "baseline set";
      title = `${currentSessions.length || currentWeekLogs.length} training touch${(currentSessions.length || currentWeekLogs.length) === 1 ? "" : "es"} this week`;
      detail = "You have a real baseline now. Next week, beat one small detail.";
      action = { href: "workout.html#past", label: "Review Sessions" };
    }
  }

  progressCoachStatus.textContent = status;
  progressCoach.innerHTML = `
    <div>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
      <small>${previousSessions.length ? `${previousSessions.length} sessions last week` : "No full prior week yet"} · ${currentSessions.length} sessions this week</small>
    </div>
    <a class="connected-action" href="${action.href}">${action.label}</a>
  `;
}

function renderRecentSessions() {
  if (!recentSessionList) return;
  const sessions = completedWorkouts
    .slice()
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, 5);

  recentSessionList.innerHTML = sessions.length
    ? sessions
        .map((session) => {
          const resultCount = session.results?.length || 0;
          return `
            <a class="progress-mini-card progress-link-card" href="workout.html#past">
              <strong>${escapeHtml(session.workoutName)}</strong>
              <span>${shortDate(session.date)} · ${resultCount} exercises · ${formatDuration(session.duration || 0)} · View details</span>
            </a>
          `;
        })
        .join("")
    : `<p class="empty-state">Complete a workout and your sessions will show here.</p>`;
}

function renderEffortChart() {
  if (!effortChart || !effortEmpty) return;
  const points = completedWorkouts
    .filter((session) => Number(session.effort))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.completedAt || 0) - (b.completedAt || 0))
    .map((session) => ({
      label: shortDate(session.date),
      value: Number(session.effort) || 0,
    }));

  drawLineChart(effortChart, points, "effort");
  effortEmpty.hidden = points.length > 0;
  effortChart.hidden = points.length === 0;
}

function renderBodyChart() {
  if (!bodyChart || !bodyEmpty) return;
  const points = bodyMetrics
    .map((entry) => ({
      date: entry.date,
      label: shortDate(entry.date),
      value: parsePositiveNumber(entry.weight),
    }))
    .filter((point) => Number(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));

  drawLineChart(bodyChart, points, "bodyweight");
  bodyEmpty.hidden = points.length > 0;
  bodyChart.hidden = points.length === 0;
}

function renderPersonalBests() {
  const bestVolume = [...logs].sort((a, b) => getVolume(b) - getVolume(a))[0];
  const bestMax = [...maxEntries].sort((a, b) => Number(b.value) - Number(a.value))[0];
  const bestCardio = [...cardioEntries].sort((a, b) => Number(b.miles) - Number(a.miles))[0];
  const bestReps = [...logs].sort((a, b) => Number(b.sets) * Number(b.reps) - Number(a.sets) * Number(a.reps))[0];
  const bestEstimatedOneRep = [...logs]
    .filter((log) => Number(log.weight) > 0 && Number(log.reps) > 0)
    .sort((a, b) => estimateOneRepMax(b) - estimateOneRepMax(a))[0];
  const cards = [
    bestVolume ? { title: "Biggest Volume", meta: `${bestVolume.exercise} · ${formatNumber(getVolume(bestVolume))} volume` } : null,
    bestEstimatedOneRep ? { title: "Estimated Strength", meta: `${bestEstimatedOneRep.exercise} · ${formatNumber(estimateOneRepMax(bestEstimatedOneRep))} lb est. 1RM` } : null,
    bestMax ? { title: "Top Max", meta: `${bestMax.movement} · ${formatNumber(bestMax.value)} ${bestMax.unit}` } : null,
    bestCardio ? { title: "Longest Cardio", meta: `${formatNumber(bestCardio.miles)} miles · ${shortDate(bestCardio.date)}` } : null,
    bestReps ? { title: "Most Reps", meta: `${bestReps.exercise} · ${formatNumber(Number(bestReps.sets) * Number(bestReps.reps))} reps` } : null,
  ].filter(Boolean);

  personalBestList.innerHTML = cards.length
    ? cards.map(renderProgressCard).join("")
    : `<p class="empty-state">Log workouts and maxes to unlock records.</p>`;
}

function renderNextTargets() {
  const latestByExercise = getLatestLogsByExercise();
  const targets = Object.values(latestByExercise)
    .slice(0, 6)
    .map((log) => {
      const nextWeight = Number(log.weight) > 0 ? `${formatNumber(Number(log.weight) + 5)} lb` : "add weight";
      const nextReps = Number(log.reps) + 1;
      return {
        title: log.exercise,
        meta: Number(log.weight) > 0 ? `Next: ${log.sets} x ${log.reps} at ${nextWeight}` : `Next: ${log.sets} x ${nextReps} reps`,
      };
    });

  nextTargetList.innerHTML = targets.length
    ? targets.map(renderProgressCard).join("")
    : `<p class="empty-state">Log an exercise, then this will suggest a tiny next upgrade.</p>`;
}

function renderConsistencyMap() {
  const workoutDays = getWorkoutDays();
  const today = new Date();
  const days = Array.from({ length: 28 }, (_, index) => addDays(today, index - 27));

  consistencyMap.innerHTML = days
    .map((date) => {
      const dateKey = toDateKey(date);
      const complete = workoutDays.has(dateKey);
      return `<span class="${complete ? "complete" : ""}" title="${shortDate(dateKey)}"></span>`;
    })
    .join("");
}

function renderMuscleBalance() {
  const weekStart = startOfWeek(new Date());
  const groups = logs.reduce((totals, log) => {
    const logDate = parseDateKey(log.date);
    if (logDate < weekStart) return totals;
    const group = getMuscleGroup(log.exercise);
    totals[group] = (totals[group] || 0) + getVolume(log);
    return totals;
  }, {});
  const max = Math.max(...Object.values(groups), 1);
  const orderedGroups = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio/Other"];

  muscleBalance.innerHTML = orderedGroups
    .map((group) => {
      const value = groups[group] || 0;
      const percent = Math.round((value / max) * 100);
      return `
        <article class="muscle-row">
          <span>${group}</span>
          <div><i style="width:${percent}%"></i></div>
          <strong>${formatNumber(value)}</strong>
        </article>
      `;
    })
    .join("");
}

function renderRepsChart() {
  const exercise = repsExerciseSelect.value;
  const points = logs
    .filter((log) => log.exercise === exercise)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => ({
      label: shortDate(log.date),
      value: Number(log.sets) * Number(log.reps),
    }));

  drawLineChart(repsChart, points, "total reps");
  repsEmpty.hidden = points.length > 0;
  repsChart.hidden = points.length === 0;
}

function renderMaxChart() {
  const movement = maxMovementSelect.value;
  const points = maxEntries
    .filter((entry) => entry.movement === movement)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      label: shortDate(entry.date),
      value: Number(entry.value),
    }));

  drawLineChart(maxChart, points, "max");
  maxEmpty.hidden = points.length > 0;
  maxChart.hidden = points.length === 0;
}

function renderCardioChart() {
  const points = cardioEntries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      label: shortDate(entry.date),
      value: Number(entry.miles) || 0,
    }));

  drawLineChart(cardioChart, points, "miles");
  cardioEmpty.hidden = points.length > 0;
  cardioChart.hidden = points.length === 0;
}

function renderWeeklyVolumeChart() {
  const totals = logs.reduce((weeks, log) => {
    const week = weekKey(log.date);
    const weight = Number(log.weight) || 0;
    weeks[week] = (weeks[week] || 0) + Number(log.sets) * Number(log.reps) * (weight || 1);
    return weeks;
  }, {});
  const points = Object.entries(totals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));

  drawLineChart(volumeChart, points, "volume");
  volumeEmpty.hidden = points.length > 0;
  volumeChart.hidden = points.length === 0;
}

function renderProgressCard(card) {
  return `
    <article class="progress-mini-card">
      <strong>${escapeHtml(card.title)}</strong>
      <span>${escapeHtml(card.meta)}</span>
    </article>
  `;
}

function drawLineChart(canvas, points, label) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 44;
  const top = 28;
  const bottom = height - padding;
  const left = padding;
  const right = width - 24;

  ctx.clearRect(0, 0, width, height);
  if (!points.length) return;

  const values = points.map((point) => point.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(18, 21, 40, 0.12)";
  ctx.fillStyle = "#626b83";
  ctx.font = "700 13px system-ui";

  for (let index = 0; index < 4; index += 1) {
    const y = top + ((bottom - top) / 3) * index;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  const coords = points.map((point, index) => {
    const x = points.length === 1 ? (left + right) / 2 : left + ((right - left) / (points.length - 1)) * index;
    const y = bottom - ((point.value - min) / range) * (bottom - top);
    return { ...point, x, y };
  });

  ctx.lineWidth = 5;
  ctx.strokeStyle = "#2f80ff";
  ctx.beginPath();
  coords.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();

  coords.forEach((point) => {
    ctx.beginPath();
    ctx.fillStyle = "#38d5ff";
    ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#10132d";
    ctx.stroke();
  });

  const last = coords.at(-1);
  ctx.fillStyle = "#121528";
  ctx.font = "900 16px system-ui";
  ctx.fillText(`${last.value.toLocaleString()} ${label}`, left, 22);

  ctx.fillStyle = "#626b83";
  ctx.font = "800 12px system-ui";
  coords.forEach((point, index) => {
    if (index === 0 || index === coords.length - 1 || coords.length <= 4) {
      ctx.fillText(point.label, point.x - 22, height - 14);
    }
  });
}

function getLatestLogsByExercise() {
  return [...logs]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .reduce((latest, log) => {
      if (!latest[log.exercise]) latest[log.exercise] = log;
      return latest;
    }, {});
}

function getVolume(log) {
  const weight = Number(log.weight) || 0;
  return Number(log.sets) * Number(log.reps) * (weight || 1);
}

function estimateOneRepMax(log) {
  const weight = Number(log.weight) || 0;
  const reps = Number(log.reps) || 1;
  return Math.round(weight * (1 + reps / 30));
}

function getWorkoutDays() {
  return new Set([...logs.map((log) => log.date), ...cardioEntries.map((entry) => entry.date), ...completedWorkouts.map((entry) => entry.date)]);
}

function getStreak(workoutDays) {
  let date = new Date();
  let streak = 0;
  while (workoutDays.has(toDateKey(date))) {
    streak += 1;
    date = addDays(date, -1);
  }
  return streak;
}

function getMuscleGroup(exercise = "") {
  const name = String(exercise || "").toLowerCase();
  if (/bench|push|chest|fly/.test(name)) return "Chest";
  if (/row|pull|lat|deadlift|back/.test(name)) return "Back";
  if (/squat|leg|lunge|calf|hamstring|quad/.test(name)) return "Legs";
  if (/shoulder|press|raise|delt/.test(name)) return "Shoulders";
  if (/curl|tricep|bicep|arm/.test(name)) return "Arms";
  if (/plank|core|abs|sit/.test(name)) return "Core";
  return "Cardio/Other";
}

function setupSelect(select, values) {
  select.innerHTML = "";

  if (!values.length) {
    const option = document.createElement("option");
    option.textContent = "No data yet";
    option.value = "";
    select.append(option);
    select.disabled = true;
    return;
  }

  values.forEach((value) => {
    const option = document.createElement("option");
    option.textContent = value;
    option.value = value;
    select.append(option);
  });
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
}

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function shortDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function weekKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - date.getDay());
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function parsePositiveNumber(value) {
  const match = String(value ?? "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
