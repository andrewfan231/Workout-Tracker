const GOALS_STORAGE_KEY = "overload-fitness-goals";
const WORKOUT_STORAGE_KEY = "overload-fitness-tracker";
const CARDIO_STORAGE_KEY = "overload-fitness-cardio-log";
const MAX_STORAGE_KEY = "overload-fitness-max-log";
const COMPLETED_WORKOUTS_STORAGE_KEY = "overload-fitness-completed-workouts";

const goalsForm = document.querySelector("#goalsForm");
const goalsSaved = document.querySelector("#goalsSaved");
const exportData = document.querySelector("#exportData");
const importData = document.querySelector("#importData");
const backupBox = document.querySelector("#backupBox");
const goalCoach = document.querySelector("#goalCoach");
const goalCoachStatus = document.querySelector("#goalCoachStatus");
const weeklyMeterText = document.querySelector("#weeklyMeterText");
const monthlyMeterText = document.querySelector("#monthlyMeterText");
const yearlyMeterText = document.querySelector("#yearlyMeterText");
const weeklyMeterFill = document.querySelector("#weeklyMeterFill");
const monthlyMeterFill = document.querySelector("#monthlyMeterFill");
const yearlyMeterFill = document.querySelector("#yearlyMeterFill");
const periods = ["daily", "weekly", "monthly", "yearly"];

let goals = loadGoals();
periods.forEach((period) => {
  document.querySelector(`#${period}GoalType`).value = goals[period]?.type || defaultGoals()[period].type;
  document.querySelector(`#${period}GoalTarget`).value = goals[period]?.target ?? defaultGoals()[period].target;
  loadGoalDetails(period, goals[period]?.details || {});
});
renderGoalMeters();
renderGoalCoach();

goalsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const nextGoals = periods.reduce((saved, period) => {
    const type = document.querySelector(`#${period}GoalType`).value;
    const target = Number(document.querySelector(`#${period}GoalTarget`).value) || defaultGoals()[period].target;
    saved[period] = { type, target, details: readGoalDetails(period) };
    return saved;
  }, {});

  nextGoals.weeklyWorkoutGoal = nextGoals.weekly.type === "workouts" ? clamp(nextGoals.weekly.target, 1, 7) : 7;
  nextGoals.monthlyWorkoutGoal = nextGoals.monthly.type === "workouts" ? clamp(nextGoals.monthly.target, 1, 31) : 31;
  nextGoals.streakGoal = nextGoals.daily.type === "streak" ? clamp(nextGoals.daily.target, 1, 365) : 7;
  nextGoals.cardioMilesGoal = nextGoals.weekly.type === "cardio" ? nextGoals.weekly.target : 10;
  nextGoals.bodyweightGoal = null;
  nextGoals.maxGoal = "";

  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(nextGoals));
  goals = nextGoals;
  renderGoalMeters();
  renderGoalCoach();
  goalsSaved.hidden = false;
  setTimeout(() => {
    goalsSaved.hidden = true;
  }, 1600);
});

exportData.addEventListener("click", () => {
  const keys = [
    "overload-fitness-tracker",
    "overload-fitness-cardio-log",
    "overload-fitness-max-log",
    "overload-fitness-created-workouts",
    "overload-fitness-completed-workouts",
    "overload-fitness-redemptions",
    "overload-fitness-custom-rewards",
    "overload-fitness-goals",
  ];
  const backup = keys.reduce((data, key) => {
    data[key] = JSON.parse(localStorage.getItem(key) || "null");
    return data;
  }, {});
  backupBox.value = JSON.stringify(backup, null, 2);
});

importData.addEventListener("change", async () => {
  const file = importData.files[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  backupBox.value = "Imported. Refresh the app pages to see restored data.";
});

function loadGoals() {
  try {
    return {
      ...defaultGoals(),
      ...JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY)),
    };
  } catch {
    return defaultGoals();
  }
}

function readGoalDetails(period) {
  return {
    date: document.querySelector(`#${period}GoalDate`).value,
    exercise: document.querySelector(`#${period}GoalExercise`).value.trim(),
    weight: readOptionalNumber(`#${period}GoalWeight`),
    miles: readOptionalNumber(`#${period}GoalMiles`),
    sets: readOptionalNumber(`#${period}GoalSets`),
    reps: readOptionalNumber(`#${period}GoalReps`),
    notes: document.querySelector(`#${period}GoalNotes`).value.trim(),
  };
}

function loadGoalDetails(period, details) {
  document.querySelector(`#${period}GoalDate`).value = details.date || "";
  document.querySelector(`#${period}GoalExercise`).value = details.exercise || "";
  document.querySelector(`#${period}GoalWeight`).value = details.weight ?? "";
  document.querySelector(`#${period}GoalMiles`).value = details.miles ?? "";
  document.querySelector(`#${period}GoalSets`).value = details.sets ?? "";
  document.querySelector(`#${period}GoalReps`).value = details.reps ?? "";
  document.querySelector(`#${period}GoalNotes`).value = details.notes || "";
}

function readOptionalNumber(selector) {
  const value = document.querySelector(selector).value;
  return value === "" ? null : Number(value);
}

function renderGoalMeters() {
  updateMeter(weeklyMeterText, weeklyMeterFill, getGoalProgress("weekly"));
  updateMeter(monthlyMeterText, monthlyMeterFill, getGoalProgress("monthly"));
  updateMeter(yearlyMeterText, yearlyMeterFill, getGoalProgress("yearly"));
}

function renderGoalCoach() {
  if (!goalCoach || !goalCoachStatus) return;
  const progressItems = ["weekly", "monthly", "yearly"].map((period) => {
    const progress = getGoalProgress(period);
    const target = Math.max(1, Number(progress.target) || 1);
    const percent = Math.min(100, (progress.done / target) * 100);
    return { period, ...progress, percent };
  });
  const priority = progressItems
    .filter((item) => item.percent < 100)
    .sort((a, b) => a.percent - b.percent)[0] || progressItems[0];
  const cleared = progressItems.every((item) => item.percent >= 100);
  const title = cleared ? "All main goals are cleared" : `${capitalize(priority.period)} goal needs attention`;
  const detail = cleared
    ? "Strong work. Keep the targets honest or raise one slowly."
    : `${formatNumber(priority.done)}/${formatNumber(priority.target)} ${priority.unit} complete. One focused session can move this forward.`;

  goalCoachStatus.textContent = cleared ? "clear" : `${Math.round(priority.percent)}%`;
  goalCoach.innerHTML = `
    <div>
      <strong>${title}</strong>
      <span>${detail}</span>
    </div>
    <a class="connected-action" href="workout.html#log">Work On It</a>
  `;
}

function updateMeter(text, fill, progress) {
  const { done, target, unit } = progress;
  const safeTarget = Math.max(1, Number(target) || 1);
  const percent = Math.min(100, (done / safeTarget) * 100);
  const hue = Math.round((percent / 100) * 120);
  text.textContent = `${formatNumber(done)}/${formatNumber(safeTarget)} ${unit}`;
  fill.style.width = `${percent}%`;
  fill.style.background = `linear-gradient(90deg, hsl(${hue}, 85%, 48%), hsl(${Math.min(120, hue + 25)}, 90%, 55%))`;
}

function getGoalProgress(period) {
  const goal = goals[period] || defaultGoals()[period];
  const dates = new Set(period === "weekly" ? getCurrentWeekDates() : period === "monthly" ? getCurrentMonthDates() : getCurrentYearDates());
  const target = Number(goal.target) || defaultGoals()[period].target;

  if (goal.type === "cardio") {
    const cardio = load(CARDIO_STORAGE_KEY, []).filter((entry) => dates.has(entry.date));
    return { done: cardio.reduce((sum, entry) => sum + (Number(entry.miles) || 0), 0), target, unit: "mi" };
  }

  if (goal.type === "max") {
    const maxes = load(MAX_STORAGE_KEY, []).filter((entry) => dates.has(entry.date));
    return { done: maxes.length, target, unit: "maxes" };
  }

  if (goal.type === "volume") {
    const logs = load(WORKOUT_STORAGE_KEY, []).filter((log) => dates.has(log.date));
    return { done: logs.reduce((sum, log) => sum + getVolume(log), 0), target, unit: "vol" };
  }

  const workoutDays = getWorkoutDays();
  return { done: countCompleted([...dates], workoutDays), target, unit: "days" };
}

function getWorkoutDays() {
  const logs = load(WORKOUT_STORAGE_KEY, []);
  const cardio = load(CARDIO_STORAGE_KEY, []);
  const completed = load(COMPLETED_WORKOUTS_STORAGE_KEY, []);
  return new Set([...logs.map((log) => log.date), ...cardio.map((entry) => entry.date), ...completed.map((entry) => entry.date)]);
}

function countCompleted(dateKeys, workoutDays) {
  return dateKeys.filter((dateKey) => workoutDays.has(dateKey)).length;
}

function getVolume(log) {
  const sets = Number(log.sets) || 0;
  const reps = Number(log.reps) || 0;
  const weight = Number(log.weight) || 0;
  return sets * reps * (weight || 1);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function capitalize(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function getCurrentWeekDates() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(start, index)));
}

function getCurrentMonthDates() {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => toDateKey(new Date(today.getFullYear(), today.getMonth(), index + 1)));
}

function getCurrentYearDates() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  const days = Math.floor((new Date(today.getFullYear(), 11, 31) - start) / 86400000) + 1;
  return Array.from({ length: days }, (_, index) => toDateKey(addDays(start, index)));
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

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function defaultGoals() {
  return {
    daily: { type: "workouts", target: 1 },
    weekly: { type: "workouts", target: 7 },
    monthly: { type: "workouts", target: 31 },
    yearly: { type: "workouts", target: 200 },
    weeklyWorkoutGoal: 7,
    monthlyWorkoutGoal: 31,
    streakGoal: 7,
    cardioMilesGoal: 10,
    bodyweightGoal: null,
    maxGoal: "",
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
