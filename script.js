const STORAGE_KEY = "overload-fitness-tracker";
const DAILY_STORAGE_KEY = "overload-fitness-daily-log";
const MAX_STORAGE_KEY = "overload-fitness-max-log";
const REDEMPTION_STORAGE_KEY = "overload-fitness-redemptions";
const CARDIO_STORAGE_KEY = "overload-fitness-cardio-log";
const GOALS_STORAGE_KEY = "overload-fitness-goals";
const CREATED_WORKOUTS_STORAGE_KEY = "overload-fitness-created-workouts";
const COMPLETED_WORKOUTS_STORAGE_KEY = "overload-fitness-completed-workouts";
const WORKOUT_DRAFT_STORAGE_KEY = "overload-fitness-workout-draft";

const logTypeSelect = document.querySelector("#logTypeSelect");
const logForm = document.querySelector("#logForm");
const cardioForm = document.querySelector("#cardioForm");
const maxForm = document.querySelector("#maxForm");
const dateInput = document.querySelector("#dateInput");
const cardioDateInput = document.querySelector("#cardioDateInput");
const maxDateInput = document.querySelector("#maxDateInput");
const exerciseInput = document.querySelector("#exerciseInput");
const exerciseMemory = document.querySelector("#exerciseMemory");
const setsInput = document.querySelector("#setsInput");
const repsInput = document.querySelector("#repsInput");
const weightInput = document.querySelector("#weightInput");
const workoutNotesInput = document.querySelector("#workoutNotesInput");
const cardioMilesInput = document.querySelector("#cardioMilesInput");
const cardioTimeInput = document.querySelector("#cardioTimeInput");
const cardioNotesInput = document.querySelector("#cardioNotesInput");
const maxMovementInput = document.querySelector("#maxMovementInput");
const maxMemory = document.querySelector("#maxMemory");
const maxValueInput = document.querySelector("#maxValueInput");
const maxUnitInput = document.querySelector("#maxUnitInput");
const maxNotesInput = document.querySelector("#maxNotesInput");
const calendar = document.querySelector("#calendar");
const monthTitle = document.querySelector("#monthTitle");
const prevMonth = document.querySelector("#prevMonth");
const nextMonth = document.querySelector("#nextMonth");
const overloadList = document.querySelector("#overloadList");
const logList = document.querySelector("#logList");
const cardioList = document.querySelector("#cardioList");
const maxList = document.querySelector("#maxList");
const badgeList = document.querySelector("#badgeList");
const prList = document.querySelector("#prList");
const streakCount = document.querySelector("#streakCount");
const totalWorkouts = document.querySelector("#totalWorkouts");
const totalVolume = document.querySelector("#totalVolume");
const xpText = document.querySelector("#xpText");
const xpFill = document.querySelector("#xpFill");
const clearAll = document.querySelector("#clearAll");
const weekRange = document.querySelector("#weekRange");
const dayModal = document.querySelector("#dayModal");
const dayModalTitle = document.querySelector("#dayModalTitle");
const dayModalBody = document.querySelector("#dayModalBody");
const closeDayModal = document.querySelector("#closeDayModal");
const restTimerDisplay = document.querySelector("#restTimerDisplay");
const stopRestTimer = document.querySelector("#stopRestTimer");
const starterPath = document.querySelector("#starterPath");
const todayMissionList = document.querySelector("#todayMissionList");
const homeGoalReminder = document.querySelector("#homeGoalReminder");
const homeActivityList = document.querySelector("#homeActivityList");
const coachInsight = document.querySelector("#coachInsight");
const coachMood = document.querySelector("#coachMood");
const homeMissionStatus = document.querySelector("#homeMissionStatus");
const homeQuestText = document.querySelector("#homeQuestText");
const homeQuestFill = document.querySelector("#homeQuestFill");
const homeNextAction = document.querySelector("#homeNextAction");
const workoutTodayList = document.querySelector("#workoutTodayList");
const workoutTodayHint = document.querySelector("#workoutTodayHint");
const workoutModeButtons = document.querySelectorAll("[data-workout-mode-button]");
const workoutModeSections = document.querySelectorAll("[data-workout-mode]");
const addExerciseBox = document.querySelector("#addExerciseBox");
const fillExampleWorkout = document.querySelector("#fillExampleWorkout");
const exerciseBoxList = document.querySelector("#exerciseBoxList");
const createWorkoutButton = document.querySelector("#createWorkoutButton");
const newWorkoutName = document.querySelector("#newWorkoutName");
const repeatDayInputs = document.querySelectorAll("input[name='repeatDay']");
const savedWorkoutSelect = document.querySelector("#savedWorkoutSelect");
const savedWorkoutGrid = document.querySelector("#savedWorkoutGrid");
const selectedWorkoutPreview = document.querySelector("#selectedWorkoutPreview");
let restTimerId = null;
let restSeconds = 90;

let logs = loadLogs();
let cardioEntries = loadCardioEntries();
let dailyEntries = loadDailyEntries();
let maxEntries = loadMaxEntries();
let redemptions = loadRedemptions();
let goals = loadGoals();
let createdWorkouts = loadCreatedWorkouts();
let completedWorkouts = loadCompletedWorkouts();
let visibleMonth = new Date();
let workoutSession = null;
let workoutTimerId = null;
let editingWorkoutId = null;

if (dateInput) dateInput.value = toDateKey(new Date());
if (cardioDateInput) cardioDateInput.value = toDateKey(new Date());
if (maxDateInput) maxDateInput.value = toDateKey(new Date());
render();
renderLogType();
if (window.location.hash === "#log") {
  setWorkoutMode("log");
  selectBestWorkoutForToday();
}

if (logTypeSelect) logTypeSelect.addEventListener("change", renderLogType);

workoutModeButtons.forEach((button) => {
  button.addEventListener("click", () => setWorkoutMode(button.dataset.workoutModeButton));
});

if (addExerciseBox) addExerciseBox.addEventListener("click", addWorkoutExerciseBox);
if (fillExampleWorkout) fillExampleWorkout.addEventListener("click", fillExampleCreatedWorkout);
if (createWorkoutButton) createWorkoutButton.addEventListener("click", createWorkout);
if (savedWorkoutSelect) savedWorkoutSelect.addEventListener("change", () => {
  renderSelectedWorkout();
  renderSavedWorkoutGrid([...createdWorkouts].sort((a, b) => Number(b.favorite) - Number(a.favorite) || (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)));
});
if (savedWorkoutGrid) savedWorkoutGrid.addEventListener("click", handleSavedWorkoutGridClick);
if (selectedWorkoutPreview) selectedWorkoutPreview.addEventListener("click", handleWorkoutRunnerClick);
if (newWorkoutName) newWorkoutName.addEventListener("input", saveWorkoutDraft);
if (exerciseBoxList) exerciseBoxList.addEventListener("input", saveWorkoutDraft);
repeatDayInputs.forEach((input) => input.addEventListener("change", saveWorkoutDraft));
restoreWorkoutDraft();

document.querySelectorAll("[data-template]").forEach((button) => {
  button.addEventListener("click", () => applyTemplate(button.dataset.template));
});

document.querySelectorAll("[data-workout-template]").forEach((button) => {
  button.addEventListener("click", () => applyWorkoutTemplate(button.dataset.workoutTemplate));
});

document.querySelectorAll("[data-rest]").forEach((button) => {
  button.addEventListener("click", () => startRestTimer(Number(button.dataset.rest)));
});

if (stopRestTimer) stopRestTimer.addEventListener("click", stopRestTimerNow);

if (logForm) logForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const beforeStats = getStats();

  const entry = {
    id: crypto.randomUUID(),
    date: dateInput.value,
    exercise: exerciseInput.value.trim(),
    sets: Number(setsInput.value),
    reps: Number(repsInput.value),
    weight: Number(weightInput.value) || 0,
    notes: workoutNotesInput.value.trim(),
    createdAt: Date.now(),
  };

  if (!entry.date || !entry.exercise || entry.sets < 1 || entry.reps < 1 || entry.weight < 0) return;

  logs = [entry, ...logs];
  saveLogs();
  exerciseInput.value = "";
  workoutNotesInput.value = "";
  exerciseInput.focus();
  visibleMonth = parseDateKey(entry.date);
  render();
  celebrateProgress("Workout saved", beforeStats, getStats());
});

if (cardioForm) cardioForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const beforeStats = getStats();

  const entry = {
    id: crypto.randomUUID(),
    date: cardioDateInput.value,
    miles: Number(cardioMilesInput.value),
    time: cardioTimeInput.value.trim(),
    notes: cardioNotesInput.value.trim(),
    createdAt: Date.now(),
  };

  if (!entry.date || entry.miles < 0 || !entry.time) return;

  cardioEntries = [entry, ...cardioEntries];
  saveCardioEntries();
  cardioMilesInput.value = "";
  cardioTimeInput.value = "";
  cardioNotesInput.value = "";
  cardioMilesInput.focus();
  visibleMonth = parseDateKey(entry.date);
  render();
  celebrateProgress("Cardio saved", beforeStats, getStats());
});

if (maxForm) maxForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const entry = {
    id: crypto.randomUUID(),
    date: maxDateInput.value,
    movement: maxMovementInput.value.trim(),
    value: Number(maxValueInput.value),
    unit: maxUnitInput.value.trim() || "lb",
    notes: maxNotesInput.value.trim(),
    createdAt: Date.now(),
  };

  if (!entry.date || !entry.movement || entry.value < 0) return;

  maxEntries = [entry, ...maxEntries];
  saveMaxEntries();
  maxMovementInput.value = "";
  maxValueInput.value = "";
  maxNotesInput.value = "";
  maxMovementInput.focus();
  visibleMonth = parseDateKey(entry.date);
  render();
  showToast("Max saved", "+record", false);
  burstConfetti(18);
});

if (prevMonth) prevMonth.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  render();
});

if (nextMonth) nextMonth.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  render();
});

if (clearAll) clearAll.addEventListener("click", () => {
  if (!logs.length) return;
  const confirmed = confirm("Clear every workout log?");
  if (!confirmed) return;
  logs = [];
  saveLogs();
  render();
});

if (logList) logList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;
  logs = logs.filter((log) => log.id !== button.dataset.deleteId);
  saveLogs();
  render();
});

if (calendar) calendar.addEventListener("click", (event) => {
  const day = event.target.closest("[data-date]");
  if (!day) return;
  openDayDetails(day.dataset.date);
});

if (closeDayModal) closeDayModal.addEventListener("click", closeDayDetails);

if (dayModal) dayModal.addEventListener("click", (event) => {
  if (event.target === dayModal) closeDayDetails();
});

function render() {
  renderSummary();
  renderStarterPath();
  renderCalendar();
  renderOverload();
  renderLogs();
  renderCardioLogs();
  renderMaxLogs();
  renderMemories();
  renderBadges();
  renderPersonalRecords();
  renderSavedWorkoutOptions();
  renderGoalReminder();
  renderCoachInsight();
  renderHomeDashboard();
  renderWorkoutTodayPanel();
  renderHomeActivity();
}

function renderLogType() {
  if (!logTypeSelect) return;
  document.querySelectorAll("[data-log-type]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.logType === logTypeSelect.value);
  });
}

function setWorkoutMode(mode) {
  workoutModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.workoutModeButton === mode);
  });
  workoutModeSections.forEach((section) => {
    const isActive = section.dataset.workoutMode === mode;
    section.classList.toggle("active", isActive);
    section.hidden = !isActive;
  });
  if (mode === "log") selectBestWorkoutForToday();
}

function selectBestWorkoutForToday() {
  if (!savedWorkoutSelect || savedWorkoutSelect.value || !createdWorkouts.length) return;

  const todayScheduled = getScheduledWorkoutsForDate(new Date());
  const favorite = createdWorkouts.find((workout) => workout.favorite);
  const pick = todayScheduled[0] || favorite || createdWorkouts[0];
  if (pick) renderSavedWorkoutOptions(pick.id);
}

function handleWorkoutRunnerClick(event) {
  const actionButton = event.target.closest("[data-workout-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.workoutAction;
  if (action === "start") startSelectedWorkout();
  if (action === "edit") editSelectedWorkout();
  if (action === "duplicate") duplicateSelectedWorkout();
  if (action === "delete") deleteSelectedWorkout();
  if (action === "favorite") toggleFavoriteWorkout();
  if (action === "complete") completeCurrentExercise();
  if (action === "fail") showFailForm();
  if (action === "save-fail") saveFailedExercise();
  if (action === "claim") claimWorkoutSession();
  if (action === "finish") finishWorkoutSession();
}

function addWorkoutExerciseBox(values = {}) {
  if (!exerciseBoxList) return;

  const box = document.createElement("article");
  box.className = "exercise-builder-box";
  box.innerHTML = `
    <label>
      Exercise
      <input type="text" placeholder="Bench press, squats, curls..." value="${escapeHtml(values.exercise || "")}" />
    </label>
    <label>
      Sets
      <input type="text" placeholder="3" value="${escapeHtml(values.sets || "")}" />
    </label>
    <label>
      Reps
      <input type="text" placeholder="10" value="${escapeHtml(values.reps || "")}" />
    </label>
    <label>
      Weight
      <input type="text" placeholder="135 lb, bodyweight..." value="${escapeHtml(values.weight || "")}" />
    </label>
    <label>
      Rest
      <input type="text" placeholder="90 sec, 2 min..." value="${escapeHtml(values.rest || "")}" />
    </label>
    <button class="delete-button remove-exercise-button" type="button">Remove</button>
  `;
  box.querySelector(".remove-exercise-button").addEventListener("click", () => {
    box.remove();
    saveWorkoutDraft();
  });
  exerciseBoxList.append(box);
  saveWorkoutDraft();
}

function fillExampleCreatedWorkout() {
  if (!newWorkoutName || !exerciseBoxList) return;

  applyWorkoutTemplate("push");
}

function applyWorkoutTemplate(templateName) {
  const templates = {
    push: {
      name: "Push Day",
      days: ["Mon", "Thu"],
      exercises: [
        { exercise: "Bench Press", sets: "3", reps: "8", weight: "95 lb", rest: "90 sec" },
        { exercise: "Shoulder Press", sets: "3", reps: "10", weight: "40 lb", rest: "90 sec" },
        { exercise: "Push Ups", sets: "2", reps: "AMRAP", weight: "Bodyweight", rest: "60 sec" },
      ],
    },
    pull: {
      name: "Pull Day",
      days: ["Tue", "Fri"],
      exercises: [
        { exercise: "Lat Pulldown", sets: "3", reps: "10", weight: "70 lb", rest: "90 sec" },
        { exercise: "Seated Row", sets: "3", reps: "10", weight: "60 lb", rest: "90 sec" },
        { exercise: "Bicep Curl", sets: "3", reps: "12", weight: "20 lb", rest: "60 sec" },
      ],
    },
    legs: {
      name: "Leg Day",
      days: ["Wed", "Sat"],
      exercises: [
        { exercise: "Squat", sets: "3", reps: "8", weight: "95 lb", rest: "2 min" },
        { exercise: "Romanian Deadlift", sets: "3", reps: "10", weight: "75 lb", rest: "90 sec" },
        { exercise: "Walking Lunge", sets: "2", reps: "12", weight: "Bodyweight", rest: "60 sec" },
      ],
    },
    conditioning: {
      name: "Conditioning Day",
      days: ["Sun"],
      exercises: [
        { exercise: "Treadmill Run", sets: "1", reps: "20 min", weight: "Easy pace", rest: "0 sec" },
        { exercise: "Plank", sets: "3", reps: "45 sec", weight: "Bodyweight", rest: "45 sec" },
        { exercise: "Jump Rope", sets: "5", reps: "60 sec", weight: "Fast", rest: "30 sec" },
      ],
    },
  };
  const template = templates[templateName];
  if (!template || !newWorkoutName || !exerciseBoxList) return;

  newWorkoutName.value = template.name;
  repeatDayInputs.forEach((input) => {
    input.checked = template.days.includes(input.value);
  });
  exerciseBoxList.innerHTML = "";
  template.exercises.forEach((exercise) => addWorkoutExerciseBox(exercise));
  saveWorkoutDraft();
  showToast("Template loaded", template.name, false);
}

function celebrateCreatedWorkout() {
  showToast("Workout created", "routine ready", true);
  burstConfetti(46);
}

function createWorkout() {
  const exercises = getCreatedExerciseBoxes();
  const namedExercises = exercises.filter((exercise) => exercise.exercise);
  if (!namedExercises.length) {
    showToast("Add one exercise", "then create workout", false);
    return;
  }

  const fallbackName = editingWorkoutId ? "Updated Workout" : `Workout ${createdWorkouts.length + 1}`;
  const workout = {
    id: editingWorkoutId || crypto.randomUUID(),
    name: newWorkoutName?.value.trim() || fallbackName,
    exercises: namedExercises,
    repeatDays: getSelectedRepeatDays(),
    createdAt: createdWorkouts.find((item) => item.id === editingWorkoutId)?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  createdWorkouts = editingWorkoutId
    ? createdWorkouts.map((item) => (item.id === editingWorkoutId ? workout : item))
    : [workout, ...createdWorkouts];
  editingWorkoutId = null;
  saveCreatedWorkouts();
  clearWorkoutDraft();
  resetCreateWorkoutForm();
  renderSavedWorkoutOptions(workout.id);
  setWorkoutMode("log");
  celebrateCreatedWorkout();
}

function getSelectedRepeatDays() {
  return [...repeatDayInputs]
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function getCreatedExerciseBoxes() {
  if (!exerciseBoxList) return [];

  return [...exerciseBoxList.querySelectorAll(".exercise-builder-box")].map((box) => {
    const inputs = box.querySelectorAll("input");
    return {
      exercise: inputs[0]?.value.trim() || "",
      sets: inputs[1]?.value.trim() || "",
      reps: inputs[2]?.value.trim() || "",
      weight: inputs[3]?.value.trim() || "",
      rest: inputs[4]?.value.trim() || "",
    };
  });
}

function saveWorkoutDraft() {
  if (!newWorkoutName || !exerciseBoxList) return;
  const draft = {
    name: newWorkoutName.value,
    exercises: getCreatedExerciseBoxes(),
    repeatDays: getSelectedRepeatDays(),
    updatedAt: Date.now(),
  };
  localStorage.setItem(WORKOUT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function restoreWorkoutDraft() {
  if (!newWorkoutName || !exerciseBoxList) return;
  const draft = loadWorkoutDraft();

  if (!draft || (!draft.name && !draft.exercises?.length && !draft.repeatDays?.length)) {
    if (!exerciseBoxList.children.length) addWorkoutExerciseBox();
    return;
  }

  newWorkoutName.value = draft.name || "";
  repeatDayInputs.forEach((input) => {
    input.checked = (draft.repeatDays || []).includes(input.value);
  });
  exerciseBoxList.innerHTML = "";
  const exercises = draft.exercises?.length ? draft.exercises : [{}];
  exercises.forEach((exercise) => addWorkoutExerciseBox(exercise));
}

function clearWorkoutDraft() {
  localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
}

function renderSavedWorkoutOptions(selectedId = savedWorkoutSelect?.value || "") {
  if (!savedWorkoutSelect) return;

  if (!createdWorkouts.length) {
    savedWorkoutSelect.innerHTML = `<option value="">No workouts created yet</option>`;
    renderSavedWorkoutGrid([]);
    renderSelectedWorkout();
    return;
  }

  const sortedWorkouts = [...createdWorkouts].sort((a, b) => Number(b.favorite) - Number(a.favorite) || (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

  savedWorkoutSelect.innerHTML = `
    <option value="">Choose a workout...</option>
    ${sortedWorkouts.map((workout) => `<option value="${workout.id}">${workout.favorite ? "★ " : ""}${escapeHtml(workout.name)}</option>`).join("")}
  `;
  savedWorkoutSelect.value = selectedId;
  renderSavedWorkoutGrid(sortedWorkouts);
  renderSelectedWorkout();
}

function renderSavedWorkoutGrid(workouts) {
  if (!savedWorkoutGrid) return;
  if (!workouts.length) {
    savedWorkoutGrid.innerHTML = `<p class="empty-state">No saved workouts yet. Use a template or create your first one.</p>`;
    return;
  }

  savedWorkoutGrid.innerHTML = workouts
    .map((workout) => {
      const completedCount = completedWorkouts.filter((entry) => entry.workoutId === workout.id).length;
      const selected = savedWorkoutSelect?.value === workout.id;
      const planStats = getWorkoutPlanStats(workout);
      return `
        <article class="workout-library-card ${selected ? "active" : ""}">
          <div>
            <strong>${workout.favorite ? "★ " : ""}${escapeHtml(workout.name)}</strong>
            <span>${workout.exercises.length} exercises · ${getWorkoutFocus(workout)} · ${formatRepeatDays(workout.repeatDays)}</span>
            <small>${completedCount ? `${completedCount} clears logged` : "No clears yet"} · ${planStats.estimatedTime} · next ${planStats.nextScheduled}</small>
          </div>
          <div class="workout-card-actions">
            <button type="button" data-select-workout="${workout.id}">View</button>
            <button type="button" data-start-workout="${workout.id}">Start</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function handleSavedWorkoutGridClick(event) {
  const selectButton = event.target.closest("[data-select-workout]");
  const startButton = event.target.closest("[data-start-workout]");
  const workoutId = selectButton?.dataset.selectWorkout || startButton?.dataset.startWorkout;
  if (!workoutId || !savedWorkoutSelect) return;

  savedWorkoutSelect.value = workoutId;
  renderSelectedWorkout();
  renderSavedWorkoutGrid([...createdWorkouts].sort((a, b) => Number(b.favorite) - Number(a.favorite) || (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)));
  if (startButton) startSelectedWorkout();
}

function renderSelectedWorkout() {
  if (!savedWorkoutSelect || !selectedWorkoutPreview) return;
  const workout = createdWorkouts.find((item) => item.id === savedWorkoutSelect.value);

  if (!workout) {
    selectedWorkoutPreview.innerHTML = createdWorkouts.length
      ? `<p class="empty-state">Choose a saved workout to see its exercises.</p>`
      : `<p class="empty-state">Create a workout first, then it will show here.</p>`;
    return;
  }

  selectedWorkoutPreview.innerHTML = `
    <h3>${escapeHtml(workout.name)}</h3>
    <p class="repeat-preview">${getWorkoutFocus(workout)} · ${formatRepeatDays(workout.repeatDays)}</p>
    ${renderWorkoutPlanStats(workout)}
    ${renderWorkoutCoachPlan(workout)}
    <div class="selected-exercise-list">
      ${workout.exercises.length ? workout.exercises.map(formatCreatedExercise).join("") : `<p class="empty-state">No exercises added yet.</p>`}
    </div>
    ${renderSelectedWorkoutHistory(workout)}
    <div class="selected-workout-actions">
      <button class="create-workout-button" type="button" data-workout-action="start">Begin Workout</button>
      <button type="button" data-workout-action="favorite">${workout.favorite ? "Unfavorite" : "Favorite"}</button>
      <button type="button" data-workout-action="edit">Edit</button>
      <button type="button" data-workout-action="duplicate">Duplicate</button>
      <button class="delete-button" type="button" data-workout-action="delete">Delete</button>
    </div>
    <div id="workoutRunner" class="workout-runner"></div>
  `;
}

function renderSelectedWorkoutHistory(workout) {
  const sessions = completedWorkouts
    .filter((entry) => entry.workoutId === workout.id)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, 3);

  if (!sessions.length) {
    return `<p class="runner-hint">No completed sessions yet. First clear sets the baseline.</p>`;
  }

  const latest = sessions[0];
  const previous = sessions[1];
  const comparison = previous ? renderSessionComparison(latest, previous) : `<span>Baseline session set. Next clear will compare against this.</span>`;

  return `
    <div class="selected-history">
      <strong>Recent clears</strong>
      ${comparison}
      ${sessions
        .map((session) => `<span>${formatDate(session.date)} · ${formatSeconds(session.duration || 0)} · ${session.results?.length || 0} exercises</span>`)
        .join("")}
    </div>
  `;
}

function renderSessionComparison(latest, previous) {
  const latestVolume = getSessionVolume(latest);
  const previousVolume = getSessionVolume(previous);
  const volumeDiff = latestVolume - previousVolume;
  const effortDiff = (Number(latest.effort) || 0) - (Number(previous.effort) || 0);
  const volumeText = volumeDiff >= 0 ? `+${formatNumber(volumeDiff)} volume` : `-${formatNumber(Math.abs(volumeDiff))} volume`;
  const effortText = effortDiff >= 0 ? `+${formatNumber(effortDiff)} effort` : `-${formatNumber(Math.abs(effortDiff))} effort`;

  return `<span>Last vs previous: ${volumeText} · ${effortText}</span>`;
}

function getSessionVolume(session) {
  return (session?.results || []).reduce((total, result) => {
    const weight = Number(result.weight) || 0;
    return total + (Number(result.sets) || 0) * (Number(result.reps) || 0) * (weight || 1);
  }, 0);
}

function renderWorkoutPlanStats(workout) {
  const stats = getWorkoutPlanStats(workout);
  return `
    <div class="workout-plan-stats">
      <span><strong>${stats.totalSets}</strong> sets</span>
      <span><strong>${formatNumber(stats.targetVolume)}</strong> target volume</span>
      <span><strong>${stats.estimatedTime}</strong> estimated</span>
      <span><strong>${stats.lastCleared}</strong> last clear</span>
    </div>
  `;
}

function getWorkoutPlanStats(workout) {
  const totalSets = (workout.exercises || []).reduce((sum, exercise) => sum + (parsePositiveNumber(exercise.sets) || 1), 0);
  const targetVolume = (workout.exercises || []).reduce((sum, exercise) => {
    const sets = parsePositiveNumber(exercise.sets) || 1;
    const reps = parsePositiveNumber(exercise.reps) || 1;
    const weight = parsePositiveNumber(exercise.weight) || 0;
    return sum + sets * reps * (weight || 1);
  }, 0);
  const estimatedSeconds = (workout.exercises || []).reduce((sum, exercise) => {
    const sets = parsePositiveNumber(exercise.sets) || 1;
    return sum + sets * 45 + Math.max(0, sets - 1) * parseRestSeconds(exercise.rest);
  }, 0);
  const latestSession = completedWorkouts
    .filter((entry) => entry.workoutId === workout.id)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];

  return {
    totalSets,
    targetVolume,
    estimatedTime: formatCompactDuration(estimatedSeconds),
    lastCleared: latestSession ? formatDate(latestSession.date) : "never",
    nextScheduled: getNextScheduledLabel(workout),
  };
}

function getNextScheduledLabel(workout) {
  const repeatDays = workout.repeatDays || [];
  if (!repeatDays.length) return "any day";
  const today = new Date();
  for (let offset = 0; offset < 14; offset += 1) {
    const date = addDays(today, offset);
    const label = WEEKDAYS[date.getDay()];
    if (repeatDays.includes(label)) return offset === 0 ? "today" : offset === 1 ? "tomorrow" : label;
  }
  return repeatDays.join("/");
}

function formatCompactDuration(seconds) {
  if (!seconds) return "quick";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

function getWorkoutFocus(workout) {
  const groups = (workout.exercises || []).map((exercise) => getMuscleGroupName(exercise.exercise)).filter(Boolean);
  const counts = groups.reduce((all, group) => {
    all[group] = (all[group] || 0) + 1;
    return all;
  }, {});
  const topGroups = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([group]) => group);

  return topGroups.length ? topGroups.join(" + ") : "Full body";
}

function getMuscleGroupName(exercise = "") {
  const name = String(exercise || "").toLowerCase();
  if (/bench|push|chest|fly/.test(name)) return "Chest";
  if (/row|pull|lat|deadlift|back/.test(name)) return "Back";
  if (/squat|leg|lunge|calf|hamstring|quad/.test(name)) return "Legs";
  if (/shoulder|press|raise|delt/.test(name)) return "Shoulders";
  if (/curl|tricep|bicep|arm/.test(name)) return "Arms";
  if (/plank|core|abs|sit/.test(name)) return "Core";
  if (/run|treadmill|bike|jump|cardio|conditioning/.test(name)) return "Conditioning";
  return "Full body";
}

function formatRepeatDays(days = []) {
  return days.length ? `Repeats: ${days.map(escapeHtml).join(", ")}` : "Repeats: not set";
}

function formatCreatedExercise(exercise) {
  return `
    <article class="selected-exercise">
      <strong>${escapeHtml(exercise.exercise || "Exercise")}</strong>
      <span>Sets: ${escapeHtml(exercise.sets || "-")}</span>
      <span>Reps: ${escapeHtml(exercise.reps || "-")}</span>
      <span>Weight: ${escapeHtml(exercise.weight || "-")}</span>
      <span>Rest: ${escapeHtml(exercise.rest || "-")}</span>
    </article>
  `;
}

function renderWorkoutCoachPlan(workout) {
  const suggestions = (workout.exercises || []).slice(0, 4).map(getExerciseSuggestion).filter(Boolean);
  if (!suggestions.length) {
    return `<p class="runner-hint">Coach plan: run this workout once and I’ll start giving next-session targets.</p>`;
  }

  return `
    <div class="coach-plan">
      <strong>Coach Plan</strong>
      ${suggestions.map((suggestion) => `<span>${escapeHtml(suggestion)}</span>`).join("")}
    </div>
  `;
}

function getExerciseSuggestion(exercise) {
  const name = exercise.exercise || "";
  const history = logs
    .filter((log) => String(log.exercise || "").toLowerCase() === name.toLowerCase())
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  const last = history[0];

  if (!last) return `${name}: set a clean baseline.`;

  const lastSession = completedWorkouts.find((session) => session.id === last.sourceSessionId);
  const effort = Number(lastSession?.effort) || 0;
  const failedLastTime = lastSession?.results?.some((result) => String(result.exercise || "").toLowerCase() === name.toLowerCase() && result.status === "failed");

  if (failedLastTime || effort >= 92) return `${name}: repeat the same target and win cleaner.`;
  if (Number(last.weight) > 0) return `${name}: try +5 lb or one cleaner rep.`;
  return `${name}: try +1 rep per set.`;
}

function editSelectedWorkout() {
  const workout = getSelectedCreatedWorkout();
  if (!workout) return;

  editingWorkoutId = workout.id;
  fillWorkoutBuilder(workout);
  if (createWorkoutButton) createWorkoutButton.textContent = "Update Workout";
  setWorkoutMode("create");
  showToast("Workout loaded", "edit mode", false);
}

function duplicateSelectedWorkout() {
  const workout = getSelectedCreatedWorkout();
  if (!workout) return;

  const copy = {
    ...workout,
    id: crypto.randomUUID(),
    name: `${workout.name} Copy`,
    exercises: workout.exercises.map((exercise) => ({ ...exercise })),
    repeatDays: [...(workout.repeatDays || [])],
    favorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  createdWorkouts = [copy, ...createdWorkouts];
  saveCreatedWorkouts();
  renderSavedWorkoutOptions(copy.id);
  showToast("Workout copied", "ready to edit", false);
}

function toggleFavoriteWorkout() {
  const workout = getSelectedCreatedWorkout();
  if (!workout) return;
  workout.favorite = !workout.favorite;
  createdWorkouts = createdWorkouts.map((item) => (item.id === workout.id ? workout : item));
  saveCreatedWorkouts();
  renderSavedWorkoutOptions(workout.id);
  showToast(workout.favorite ? "Favorited" : "Unfavorited", workout.name, false);
}

function deleteSelectedWorkout() {
  const workout = getSelectedCreatedWorkout();
  if (!workout) return;
  const confirmed = confirm(`Delete ${workout.name}?`);
  if (!confirmed) return;

  createdWorkouts = createdWorkouts.filter((item) => item.id !== workout.id);
  saveCreatedWorkouts();
  renderSavedWorkoutOptions();
  render();
  showToast("Workout deleted", "schedule updated", false);
}

function getSelectedCreatedWorkout() {
  return createdWorkouts.find((item) => item.id === savedWorkoutSelect?.value);
}

function fillWorkoutBuilder(workout) {
  if (!newWorkoutName || !exerciseBoxList) return;
  newWorkoutName.value = workout.name || "";
  repeatDayInputs.forEach((input) => {
    input.checked = (workout.repeatDays || []).includes(input.value);
  });
  exerciseBoxList.innerHTML = "";
  (workout.exercises || []).forEach((exercise) => addWorkoutExerciseBox(exercise));
  if (!exerciseBoxList.children.length) addWorkoutExerciseBox();
}

function resetCreateWorkoutForm() {
  if (!newWorkoutName || !exerciseBoxList) return;
  newWorkoutName.value = "";
  repeatDayInputs.forEach((input) => {
    input.checked = false;
  });
  exerciseBoxList.innerHTML = "";
  addWorkoutExerciseBox();
  if (createWorkoutButton) createWorkoutButton.textContent = "Create Workout";
}

function startSelectedWorkout() {
  const workout = getSelectedCreatedWorkout();
  if (!workout || !workout.exercises.length) return;

  stopWorkoutTimer();
  workoutSession = {
    workout,
    index: 0,
    phase: "exercise",
    exerciseStartedAt: Date.now(),
    exerciseElapsed: 0,
    startedAt: Date.now(),
    restRemaining: 0,
    results: [],
    failOpen: false,
  };
  workoutTimerId = setInterval(tickWorkoutSession, 1000);
  renderWorkoutRunner();
}

function tickWorkoutSession() {
  if (!workoutSession) return;

  if (workoutSession.phase === "exercise") {
    workoutSession.exerciseElapsed = Math.floor((Date.now() - workoutSession.exerciseStartedAt) / 1000);
  }

  if (workoutSession.phase === "rest") {
    workoutSession.restRemaining -= 1;
    if (workoutSession.restRemaining <= 0) {
      goToNextExercise();
    }
  }

  renderWorkoutRunner();
}

function completeCurrentExercise() {
  if (!workoutSession || workoutSession.phase !== "exercise") return;
  const exercise = getCurrentSessionExercise();
  workoutSession.results.push({
    exercise: exercise.exercise,
    status: "complete",
    planned: `${exercise.sets || "-"} sets x ${exercise.reps || "-"} reps`,
    sets: parsePositiveNumber(exercise.sets) || 1,
    reps: parsePositiveNumber(exercise.reps) || 1,
    weight: parsePositiveNumber(exercise.weight) || 0,
    elapsed: workoutSession.exerciseElapsed,
  });
  startRestOrFinish();
}

function showFailForm() {
  if (!workoutSession || workoutSession.phase !== "exercise") return;
  workoutSession.failOpen = true;
  renderWorkoutRunner();
}

function saveFailedExercise() {
  if (!workoutSession || workoutSession.phase !== "exercise") return;
  const exercise = getCurrentSessionExercise();
  const actualSets = document.querySelector("#actualSetsInput")?.value.trim() || "-";
  const actualReps = document.querySelector("#actualRepsInput")?.value.trim() || "-";
  workoutSession.results.push({
    exercise: exercise.exercise,
    status: "failed",
    planned: `${exercise.sets || "-"} sets x ${exercise.reps || "-"} reps`,
    actual: `${actualSets} sets x ${actualReps} reps`,
    sets: parsePositiveNumber(actualSets) || 1,
    reps: parsePositiveNumber(actualReps) || 1,
    weight: parsePositiveNumber(exercise.weight) || 0,
    elapsed: workoutSession.exerciseElapsed,
  });
  workoutSession.failOpen = false;
  startRestOrFinish();
}

function startRestOrFinish() {
  const exercise = getCurrentSessionExercise();
  const isLast = workoutSession.index >= workoutSession.workout.exercises.length - 1;

  if (isLast) {
    workoutSession.phase = "review";
    stopWorkoutTimer();
    renderWorkoutRunner();
    return;
  }

  const restSeconds = parseRestSeconds(exercise.rest);
  if (restSeconds <= 0) {
    goToNextExercise();
    return;
  }

  workoutSession.phase = "rest";
  workoutSession.restRemaining = restSeconds;
  renderWorkoutRunner();
}

function markWorkoutComplete() {
  const todayKey = toDateKey(new Date());
  const sessionId = crypto.randomUUID();
  const effort = clampNumber(document.querySelector("#sessionEffortInput")?.value, 1, 100);
  const notes = document.querySelector("#sessionNotesInput")?.value.trim() || "";

  const completedSession = {
    id: sessionId,
    workoutId: workoutSession.workout.id,
    workoutName: workoutSession.workout.name,
    date: todayKey,
    completedAt: Date.now(),
    duration: Math.round((Date.now() - workoutSession.startedAt) / 1000),
    effort,
    notes,
    results: workoutSession.results,
  };
  workoutSession.savedSession = completedSession;
  completedWorkouts = [completedSession, ...completedWorkouts];

  const sessionLogs = workoutSession.workout.exercises
    .map((exercise, index) => {
      const result = workoutSession.results[index] || {};
      const sets = result.sets || parsePositiveNumber(exercise.sets) || 1;
      const reps = result.reps || parsePositiveNumber(exercise.reps) || 1;
      const weight = result.weight || parsePositiveNumber(exercise.weight) || 0;
      const statusNote = result.status === "failed" ? `Attempted: ${result.actual || "less than planned"}` : "Completed from workout runner";

      return {
        id: crypto.randomUUID(),
        date: todayKey,
        exercise: exercise.exercise || `Exercise ${index + 1}`,
        sets,
        reps,
        weight,
        notes: `${workoutSession.workout.name} · ${statusNote}`,
        sourceSessionId: sessionId,
        createdAt: Date.now() + index,
      };
    })
    .filter((entry) => entry.exercise);

  logs = [...sessionLogs, ...logs];
  saveLogs();
  saveCompletedWorkouts();
  announceSessionRecords(sessionLogs);
  render();
  return true;
}

function claimWorkoutSession() {
  if (!workoutSession || workoutSession.phase !== "review") return;
  markWorkoutComplete();
  workoutSession.phase = "done";
  renderWorkoutRunner();
  showToast("Workout finished", "+XP claimed", true);
  burstConfetti(50);
}

function goToNextExercise() {
  if (!workoutSession) return;
  workoutSession.index += 1;
  workoutSession.phase = "exercise";
  workoutSession.exerciseStartedAt = Date.now();
  workoutSession.exerciseElapsed = 0;
  workoutSession.restRemaining = 0;
  workoutSession.failOpen = false;
  showToast("Next exercise", getCurrentSessionExercise().exercise || "Go", false);
  renderWorkoutRunner();
}

function finishWorkoutSession() {
  stopWorkoutTimer();
  workoutSession = null;
  renderSelectedWorkout();
}

function renderWorkoutRunner() {
  const runner = document.querySelector("#workoutRunner");
  if (!runner || !workoutSession) return;
  const exercise = getCurrentSessionExercise();
  const progress = `${Math.min(workoutSession.index + 1, workoutSession.workout.exercises.length)} / ${workoutSession.workout.exercises.length}`;

  if (workoutSession.phase === "done") {
    const session = workoutSession.savedSession;
    const xpEarned = 100 + (Number(session?.effort) || 0);
    runner.innerHTML = `
      <section class="runner-card done">
        <p class="eyebrow">Workout complete</p>
        <h3>${escapeHtml(workoutSession.workout.name)}</h3>
        <div class="mission-complete-stats">
          <span>+${xpEarned} XP</span>
          <span>${formatSeconds(session?.duration || 0)}</span>
          <span>${workoutSession.results.length} exercises</span>
        </div>
        <div class="runner-results">${workoutSession.results.map(formatWorkoutResult).join("")}</div>
        <div class="session-next-actions">
          <a href="index.html">Home</a>
          <a href="shop.html">Spend XP</a>
          <a href="progression.html">See Progress</a>
        </div>
        <button type="button" data-workout-action="finish">Close Session</button>
      </section>
    `;
    return;
  }

  if (workoutSession.phase === "review") {
    const duration = Math.round((Date.now() - workoutSession.startedAt) / 1000);
    runner.innerHTML = `
      <section class="runner-card done">
        <p class="eyebrow">Session review</p>
        <h3>${escapeHtml(workoutSession.workout.name)}</h3>
        <p class="runner-hint">${workoutSession.results.length} exercises cleared · ${formatSeconds(duration)}</p>
        <div class="fail-form session-review-form">
          <label>
            Effort 1-100
            <input id="sessionEffortInput" type="number" min="1" max="100" value="80" />
          </label>
          <label>
            Session notes
            <input id="sessionNotesInput" type="text" placeholder="How did it feel?" />
          </label>
          <button class="complete-exercise-button" type="button" data-workout-action="claim">Claim XP</button>
        </div>
      </section>
    `;
    return;
  }

  if (workoutSession.phase === "rest") {
    runner.innerHTML = `
      <section class="runner-card rest">
        <p class="eyebrow">Rest time</p>
        <h3>Next exercise starts soon</h3>
        <div class="runner-timer">${formatSeconds(workoutSession.restRemaining)}</div>
        <p class="item-meta">Next: ${escapeHtml(workoutSession.workout.exercises[workoutSession.index + 1]?.exercise || "Done")}</p>
      </section>
    `;
    return;
  }

  runner.innerHTML = `
    <section class="runner-card">
      <div class="runner-topline">
        <p class="eyebrow">Exercise ${progress}</p>
        <span>${formatSeconds(workoutSession.exerciseElapsed)}</span>
      </div>
      <h3>${escapeHtml(exercise.exercise || "Exercise")}</h3>
      ${renderExerciseHistoryHint(exercise.exercise)}
      <div class="runner-prescription">
        <span>Sets: ${escapeHtml(exercise.sets || "-")}</span>
        <span>Reps: ${escapeHtml(exercise.reps || "-")}</span>
        <span>Weight: ${escapeHtml(exercise.weight || "-")}</span>
        <span>Rest: ${escapeHtml(exercise.rest || "-")}</span>
      </div>
      ${renderWarmupPlan(exercise)}
      ${renderPlateCalculator(exercise)}
      <div class="runner-actions">
        <button class="complete-exercise-button" type="button" data-workout-action="complete">✓ Complete</button>
        <button class="delete-button" type="button" data-workout-action="fail">Failed</button>
      </div>
      ${workoutSession.failOpen ? renderFailForm() : ""}
    </section>
  `;
}

function renderFailForm() {
  return `
    <div class="fail-form">
      <label>
        Actual sets
        <input id="actualSetsInput" type="text" placeholder="Sets done" />
      </label>
      <label>
        Actual reps
        <input id="actualRepsInput" type="text" placeholder="Reps done" />
      </label>
      <button type="button" data-workout-action="save-fail">Save Actual</button>
    </div>
  `;
}

function formatWorkoutResult(result) {
  const actual = result.actual ? ` · Actual: ${escapeHtml(result.actual)}` : "";
  return `<article class="runner-result"><strong>${escapeHtml(result.exercise || "Exercise")}</strong><span>${escapeHtml(result.status)} · ${escapeHtml(result.planned)}${actual} · ${formatSeconds(result.elapsed)}</span></article>`;
}

function renderExerciseHistoryHint(exerciseName = "") {
  const exerciseLogs = logs.filter((log) => String(log.exercise || "").toLowerCase() === String(exerciseName).toLowerCase());
  if (!exerciseLogs.length) {
    return `<p class="runner-hint">First time logging this one. Set the baseline.</p>`;
  }

  const last = [...exerciseLogs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)[0];
  const best = [...exerciseLogs].sort((a, b) => getVolume(b) - getVolume(a))[0];
  return `
    <p class="runner-hint">
      Last: ${formatLog(last)} · Best volume: ${formatNumber(getVolume(best))}
    </p>
  `;
}

function renderWarmupPlan(exercise = {}) {
  const weight = parsePositiveNumber(exercise.weight);
  if (!weight || weight < 45) return "";
  const warmups = [
    { percent: 0.5, reps: 5 },
    { percent: 0.7, reps: 3 },
    { percent: 0.85, reps: 1 },
  ].map((set) => `${roundToNearestFive(weight * set.percent)} x ${set.reps}`);

  return `
    <details class="warmup-plan">
      <summary>Warm-up plan</summary>
      <div>${warmups.map((set) => `<span>${set}</span>`).join("")}</div>
    </details>
  `;
}

function renderPlateCalculator(exercise = {}) {
  const weight = parsePositiveNumber(exercise.weight);
  if (!weight || weight <= 45) return "";

  const plates = getPlatesPerSide(weight);
  const plateText = plates.length ? plates.join(" + ") : "empty bar";

  return `
    <details class="plate-plan">
      <summary>Plate math</summary>
      <p>${formatNumber(weight)} lb total · each side: ${plateText}</p>
    </details>
  `;
}

function getPlatesPerSide(totalWeight) {
  let remaining = Math.max(0, (roundToNearestFive(totalWeight) - 45) / 2);
  const plateSizes = [45, 35, 25, 10, 5, 2.5];
  const plates = [];

  plateSizes.forEach((plate) => {
    while (remaining >= plate - 0.01) {
      plates.push(`${plate}`);
      remaining -= plate;
    }
  });

  return plates;
}

function roundToNearestFive(value) {
  return Math.max(5, Math.round(value / 5) * 5);
}

function announceSessionRecords(sessionLogs) {
  const recordLogs = sessionLogs.filter((entry) => {
    const previousBest = logs
      .filter((log) => log.sourceSessionId !== entry.sourceSessionId && String(log.exercise || "").toLowerCase() === String(entry.exercise || "").toLowerCase())
      .reduce((best, log) => Math.max(best, getVolume(log)), 0);
    return getVolume(entry) > previousBest;
  });

  if (!recordLogs.length) return;
  showToast(`${recordLogs.length} PR${recordLogs.length > 1 ? "s" : ""}!`, "new best volume", true);
  burstConfetti(36);
}

function getCurrentSessionExercise() {
  return workoutSession.workout.exercises[workoutSession.index] || {};
}

function stopWorkoutTimer() {
  clearInterval(workoutTimerId);
  workoutTimerId = null;
}

function parseRestSeconds(value) {
  const text = String(value || "").trim().toLowerCase();
  const clockMatch = text.match(/^(\d+):(\d{1,2})$/);
  if (clockMatch) return Number(clockMatch[1]) * 60 + Number(clockMatch[2]);

  const number = Number(text.match(/\d+(\.\d+)?/)?.[0]) || 0;
  if (text.includes("min")) return Math.max(0, Math.round(number * 60));
  return Math.max(0, Math.round(number));
}

function parseActualResult(actual = "") {
  const numbers = String(actual).match(/\d+(\.\d+)?/g) || [];
  return {
    sets: Number(numbers[0]) || null,
    reps: Number(numbers[1]) || null,
  };
}

function parsePositiveNumber(value) {
  const number = Number(String(value || "").match(/\d+(\.\d+)?/)?.[0]) || 0;
  return number > 0 ? number : null;
}

function clampNumber(value, min, max) {
  const number = Number(value) || min;
  return Math.min(max, Math.max(min, number));
}

function formatSeconds(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function applyTemplate(template) {
  if (!logTypeSelect) return;
  const today = toDateKey(new Date());

  if (template === "Push") {
    logTypeSelect.value = "exercise";
    renderLogType();
    dateInput.value = today;
    exerciseInput.value = "Bench Press";
    setsInput.value = 3;
    repsInput.value = 8;
    workoutNotesInput.value = "Push day";
  }

  if (template === "Legs") {
    logTypeSelect.value = "exercise";
    renderLogType();
    dateInput.value = today;
    exerciseInput.value = "Squat";
    setsInput.value = 3;
    repsInput.value = 8;
    workoutNotesInput.value = "Leg day";
  }

  if (template === "Cardio") {
    logTypeSelect.value = "cardio";
    renderLogType();
    cardioDateInput.value = today;
    cardioMilesInput.value = 1;
    cardioTimeInput.value = "10 min";
    cardioNotesInput.value = "Conditioning";
  }

  if (template === "Max") {
    logTypeSelect.value = "max";
    renderLogType();
    maxDateInput.value = today;
    maxMovementInput.value = "Bench Press";
    maxUnitInput.value = "lb";
    maxNotesInput.value = "Max attempt";
  }
}

function startRestTimer(seconds) {
  restSeconds = seconds;
  updateRestTimer();
  clearInterval(restTimerId);
  restTimerId = setInterval(() => {
    restSeconds -= 1;
    updateRestTimer();
    if (restSeconds <= 0) {
      clearInterval(restTimerId);
      showToast("Rest done", "Next set", false);
      burstConfetti(10);
    }
  }, 1000);
}

function stopRestTimerNow() {
  clearInterval(restTimerId);
  restSeconds = 90;
  updateRestTimer();
}

function updateRestTimer() {
  const minutes = String(Math.floor(restSeconds / 60)).padStart(2, "0");
  const seconds = String(restSeconds % 60).padStart(2, "0");
  restTimerDisplay.textContent = `${minutes}:${seconds}`;
}

function renderSummary() {
  if (!streakCount || !totalWorkouts || !totalVolume || !xpText || !xpFill) return;
  const { uniqueDays, volume, streak, xp, level, levelProgress, rank } = getStats();

  streakCount.textContent = streak;
  totalWorkouts.textContent = uniqueDays;
  totalVolume.textContent = formatNumber(volume);
  xpText.textContent = `Level ${level} · ${rank} · ${xp} XP`;
  xpFill.style.width = `${levelProgress}%`;
}

function renderStarterPath() {
  if (!starterPath) return;
  const hasWorkout = createdWorkouts.length > 0;
  const hasGoal = Boolean(localStorage.getItem(GOALS_STORAGE_KEY));
  const hasCompleted = completedWorkouts.length > 0;
  const hasRedeemed = redemptions.length > 0;
  const completeCount = [hasWorkout, hasGoal, hasCompleted, hasRedeemed].filter(Boolean).length;

  if (completeCount >= 3) {
    starterPath.hidden = true;
    return;
  }

  starterPath.hidden = false;
  const steps = [
    { done: hasWorkout, label: "Create one workout", href: "workout.html" },
    { done: hasGoal, label: "Set your weekly goal", href: "goals.html" },
    { done: hasCompleted, label: "Complete a workout", href: "workout.html#log" },
    { done: hasRedeemed, label: "Redeem your first reward", href: "shop.html" },
  ];

  starterPath.innerHTML = `
    <div class="panel-header simple">
      <h2>Starter Path</h2>
      <span>${completeCount}/4</span>
    </div>
    <div class="starter-path-list">
      ${steps
        .map((step) => `<a class="${step.done ? "done" : ""}" href="${step.href}"><span>${step.done ? "✓" : "→"}</span>${step.label}</a>`)
        .join("")}
    </div>
  `;
}

function renderHomeDashboard() {
  if (!todayMissionList || !homeQuestText || !homeQuestFill || !homeNextAction || !homeMissionStatus) return;

  const today = new Date();
  const todayKey = toDateKey(today);
  const scheduled = getScheduledWorkoutsForDate(today);
  const favorites = createdWorkouts.filter((workout) => workout.favorite);
  const completedToday = completedWorkouts.filter((entry) => entry.date === todayKey);
  const workoutDays = getWorkoutDays();
  const weekDates = getCurrentWeekDates();
  const weeklyGoal = Number(goals.weeklyWorkoutGoal) || 7;
  const weekDone = countCompleted(weekDates, workoutDays);
  const weekPercent = Math.min(100, (weekDone / Math.max(1, weeklyGoal)) * 100);

  homeMissionStatus.textContent = completedToday.length ? "complete" : scheduled.length ? "scheduled" : "open";
  homeQuestText.textContent = `${weekDone}/${weeklyGoal}`;
  homeQuestFill.style.width = `${weekPercent}%`;
  homeNextAction.textContent = completedToday.length
    ? "Nice. Today is checked. Keep the chain alive tomorrow."
    : scheduled.length
      ? "Start one scheduled workout today to earn the check."
      : "No workout scheduled today. Create one or run any saved workout.";

  const missionWorkouts = scheduled.length ? scheduled : favorites.slice(0, 2);
  todayMissionList.innerHTML = missionWorkouts.length
    ? missionWorkouts.map((workout) => renderMissionItem(workout, completedToday.some((entry) => entry.workoutId === workout.id))).join("")
    : `<article class="mission-item"><strong>Free Training Day</strong><span>Run any saved workout or create a new one.</span></article>`;
}

function renderCoachInsight() {
  if (!coachInsight || !coachMood) return;

  const todayKey = toDateKey(new Date());
  const yesterdayKey = toDateKey(addDays(new Date(), -1));
  const scheduledToday = getScheduledWorkoutsForDate(new Date());
  const completedToday = completedWorkouts.some((entry) => entry.date === todayKey);
  const yesterdaySession = completedWorkouts
    .filter((entry) => entry.date === yesterdayKey)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];
  const streak = getWorkoutStreak();
  const favorite = createdWorkouts.find((workout) => workout.favorite);

  let title = "Build today’s win";
  let detail = "Create or start a workout so the app can begin learning your training rhythm.";
  let action = { href: "workout.html", label: "Create Workout" };
  let mood = "ready";

  if (completedToday) {
    title = "Today is checked";
    detail = "You already protected the streak. Review your progress or plan the next workout.";
    action = { href: "progression.html", label: "View Progress" };
    mood = "complete";
  } else if (scheduledToday.length) {
    title = `${scheduledToday[0].name} is on deck`;
    detail = "Start the scheduled workout to keep the chain alive and earn XP.";
    action = { href: "workout.html#log", label: "Start Mission" };
    mood = "mission";
  } else if (yesterdaySession && Number(yesterdaySession.effort) >= 90) {
    title = "Heavy effort yesterday";
    detail = "You went hard last session. Today can be lighter, but still get a check if you move.";
    action = { href: "workout.html#log", label: "Pick Workout" };
    mood = "recovery";
  } else if (favorite) {
    title = `${favorite.name} is ready`;
    detail = "No scheduled workout today, so your favorite is the best quick start.";
    action = { href: "workout.html#log", label: "Use Favorite" };
    mood = "favorite";
  } else if (streak > 0) {
    title = `${streak}-day streak alive`;
    detail = "One completed workout today keeps the flame going.";
    action = { href: "workout.html#log", label: "Keep Streak" };
    mood = "streak";
  }

  coachMood.textContent = mood;
  coachInsight.innerHTML = `
    <div>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    </div>
    <a class="connected-action" href="${action.href}">${action.label}</a>
  `;
}

function renderGoalReminder() {
  if (!homeGoalReminder) return;
  const periods = ["daily", "weekly", "monthly", "yearly"];
  const cards = periods
    .map((period) => {
      const goal = goals[period];
      if (!goal) return null;
      const target = goal.target ?? "";
      const type = formatGoalType(goal.type);
      const detail = goal.details?.exercise || goal.details?.notes || "";
      return {
        period,
        title: `${capitalize(period)}: ${target} ${type}`,
        detail,
      };
    })
    .filter(Boolean);

  homeGoalReminder.innerHTML = cards.length
    ? cards.map((goal) => `<article class="goal-reminder-item"><strong>${escapeHtml(goal.title)}</strong>${goal.detail ? `<span>${escapeHtml(goal.detail)}</span>` : ""}</article>`).join("")
    : `<p class="empty-state">Set goals to see reminders here.</p>`;
}

function formatGoalType(type = "workouts") {
  const labels = {
    workouts: "workouts",
    cardio: "cardio miles",
    max: "maxes",
    streak: "streak days",
    volume: "volume",
    bodyweight: "bodyweight",
  };
  return labels[type] || type;
}

function capitalize(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function renderWorkoutTodayPanel() {
  if (!workoutTodayList || !workoutTodayHint) return;
  const today = new Date();
  const todayKey = toDateKey(today);
  const scheduled = getScheduledWorkoutsForDate(today);
  const completedToday = completedWorkouts.filter((entry) => entry.date === todayKey);

  workoutTodayHint.textContent = scheduled.length ? `${scheduled.length} scheduled` : "none scheduled";
  workoutTodayList.innerHTML = scheduled.length
    ? scheduled.map((workout) => renderMissionItem(workout, completedToday.some((entry) => entry.workoutId === workout.id))).join("")
    : `<article class="mission-item"><strong>No scheduled workout today</strong><span>You can still choose any available workout below.</span></article>`;
}

function renderHomeActivity() {
  if (!homeActivityList) return;
  const recentSessions = completedWorkouts
    .slice()
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, 4);

  homeActivityList.innerHTML = recentSessions.length
    ? recentSessions.map(renderActivityItem).join("")
    : `<p class="empty-state">Finish a workout and your recent sessions will show here.</p>`;
}

function renderActivityItem(session) {
  const resultCount = session.results?.length || 0;
  return `
    <article class="activity-item">
      <div>
        <strong>${escapeHtml(session.workoutName)}</strong>
        <span>${formatDate(session.date)} · ${resultCount} exercises · ${formatSeconds(session.duration || 0)} · ${session.effort || 0}/100 effort</span>
        ${session.notes ? `<span>${escapeHtml(session.notes)}</span>` : ""}
      </div>
      <em>+${100 + (Number(session.effort) || 0)} XP</em>
    </article>
  `;
}

function renderMissionItem(workout, done) {
  const exerciseCount = workout.exercises?.length || 0;
  return `
    <article class="mission-item ${done ? "done" : ""}">
      <strong>${escapeHtml(workout.name)}</strong>
      <span>${exerciseCount} exercises${workout.repeatDays?.length ? ` · ${workout.repeatDays.join(", ")}` : ""}</span>
      <em>${done ? "Checked" : "Ready"}</em>
    </article>
  `;
}

function renderCalendar() {
  if (!calendar || !monthTitle) return;
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  monthTitle.textContent = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  calendar.innerHTML = "";

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendar.append(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);
    const dayLogs = logs.filter((log) => log.date === dateKey);
    const dayCardio = cardioEntries.filter((entry) => entry.date === dateKey);
    const dayMaxes = maxEntries.filter((entry) => entry.date === dateKey);
    const dayCompletedWorkouts = completedWorkouts.filter((entry) => entry.date === dateKey);
    const scheduledWorkouts = getScheduledWorkoutsForDate(date);
    const cell = document.createElement("article");
    cell.className = `day${dateKey === todayKey ? " today" : ""}`;
    cell.dataset.date = dateKey;
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    cell.setAttribute("aria-label", `Open details for ${formatDate(dateKey)}`);

    const volume = dayLogs.reduce((sum, log) => sum + getVolume(log), 0);
    const workedOut = dayLogs.length > 0 || dayCardio.length > 0 || dayCompletedWorkouts.length > 0;

    cell.innerHTML = `
      <div class="day-number">
        <span>${day}</span>
        ${dayMaxes.length ? `<span class="max-emoji" title="Max logged">💪</span>` : volume ? `<span class="badge">${volume}</span>` : ""}
      </div>
      <div class="day-symbols" aria-hidden="true">
        <span class="${dayLogs.length ? "lit" : ""}">🏋️</span>
        <span class="${dayCardio.length ? "lit" : ""}">👟</span>
        <span class="${dayMaxes.length ? "lit" : ""}">⭐</span>
      </div>
      ${
        scheduledWorkouts.length
          ? `<div class="scheduled-workouts">${scheduledWorkouts
              .slice(0, 2)
              .map((workout) => `<span>${escapeHtml(workout.name)}</span>`)
              .join("")}${scheduledWorkouts.length > 2 ? `<span>+${scheduledWorkouts.length - 2} more</span>` : ""}</div>`
          : ""
      }
      <div class="day-checks">
        <span class="check-box ${dayCompletedWorkouts.length || dayLogs.length ? "done" : ""}">Workout</span>
        <span class="check-box ${dayCardio.length ? "done cardio" : ""}">Cardio</span>
      </div>
      <div class="effort-strip ${workedOut ? "" : "empty"}">
        ${workedOut ? "Completed" : "No log"}
      </div>
    `;

    calendar.append(cell);
  }

  const totalCells = firstDay.getDay() + daysInMonth;
  const trailingCells = (7 - (totalCells % 7)) % 7;

  for (let index = 0; index < trailingCells; index += 1) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendar.append(empty);
  }
}

function openDayDetails(dateKey) {
  if (!dayModal || !dayModalTitle || !dayModalBody) return;
  const dayLogs = logs.filter((log) => log.date === dateKey);
  const dayCardio = cardioEntries.filter((entry) => entry.date === dateKey);
  const dayMaxes = maxEntries.filter((entry) => entry.date === dateKey);
  const dayCompletedWorkouts = completedWorkouts.filter((entry) => entry.date === dateKey);
  const scheduledWorkouts = getScheduledWorkoutsForDate(parseDateKey(dateKey));
  const dailyEntry = dailyEntries[dateKey];
  const volume = dayLogs.reduce((sum, log) => sum + getVolume(log), 0);
  const miles = dayCardio.reduce((sum, entry) => sum + (Number(entry.miles) || 0), 0);
  const dayXp = dayLogs.length || dayCardio.length || dayCompletedWorkouts.length ? 100 : 0;
  const oldNotes = dailyEntry?.notes ? escapeHtml(dailyEntry.notes) : "";
  const workoutHtml = dayLogs.length
    ? dayLogs
        .map((log) => {
          return `
            <article class="detail-row">
              <strong>${escapeHtml(log.exercise)}</strong>
              <span>${formatLog(log)} = ${formatNumber(getVolume(log))} volume</span>
              ${log.notes ? `<p class="daily-note">${escapeHtml(log.notes)}</p>` : ""}
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">No workouts logged for this day.</p>`;
  const cardioHtml = dayCardio.length
    ? dayCardio
        .map((entry) => {
          return `
            <article class="detail-row cardio-detail">
              <strong>${formatNumber(entry.miles)} miles</strong>
              <span>${escapeHtml(entry.time)}</span>
              ${entry.notes ? `<p class="daily-note">${escapeHtml(entry.notes)}</p>` : ""}
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">No cardio logged for this day.</p>`;
  const maxHtml = dayMaxes.length
    ? dayMaxes
        .map((entry) => {
          const notes = entry.notes ? ` · ${escapeHtml(entry.notes)}` : "";
          return `
            <article class="detail-row max-detail">
              <strong>${escapeHtml(entry.movement)}</strong>
              <span>${formatNumber(entry.value)} ${escapeHtml(entry.unit)}${notes}</span>
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">No maxes logged for this day.</p>`;
  const scheduledHtml = scheduledWorkouts.length
    ? scheduledWorkouts
        .map((workout) => {
          const exercises = workout.exercises?.length ? ` · ${workout.exercises.length} exercises` : "";
          return `
            <article class="detail-row scheduled-detail">
              <strong>${escapeHtml(workout.name)}</strong>
              <span>Scheduled workout${exercises}</span>
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">No created workouts scheduled for this day.</p>`;
  const completedHtml = dayCompletedWorkouts.length
    ? dayCompletedWorkouts
        .map((entry) => {
          return `
            <article class="detail-row completed-detail">
              <strong>${escapeHtml(entry.workoutName)}</strong>
              <span>Completed workout · ${entry.effort || 0}/100 effort · ${formatSeconds(entry.duration || 0)}</span>
              ${entry.notes ? `<p class="daily-note">${escapeHtml(entry.notes)}</p>` : ""}
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">No created workouts completed for this day.</p>`;

  dayModalTitle.textContent = formatDate(dateKey);
  dayModalBody.innerHTML = `
    <div class="detail-stats">
      <div><strong>${formatNumber(volume)}</strong><span>volume</span></div>
      <div><strong>${formatNumber(miles)}</strong><span>cardio miles</span></div>
      <div><strong>${dayLogs.length}</strong><span>exercise logs</span></div>
      <div><strong>${dayXp}</strong><span>XP earned</span></div>
    </div>
    <h3>Scheduled Workouts</h3>
    ${scheduledHtml}
    <h3>Completed Workouts</h3>
    ${completedHtml}
    <h3>Workouts</h3>
    ${workoutHtml}
    <h3>Cardio</h3>
    ${cardioHtml}
    <h3>Maxes</h3>
    ${maxHtml}
    ${oldNotes ? `<h3>Old Daily Notes</h3><p class="detail-notes">${oldNotes}</p>` : ""}
  `;
  dayModal.hidden = false;
}

function getScheduledWorkoutsForDate(date) {
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  return createdWorkouts.filter((workout) => (workout.repeatDays || []).includes(dayName));
}

function closeDayDetails() {
  if (!dayModal) return;
  dayModal.hidden = true;
}

function renderOverload() {
  if (!overloadList || !weekRange) return;
  const now = new Date();
  const currentStart = startOfWeek(now);
  const currentEnd = addDays(currentStart, 7);
  const previousStart = addDays(currentStart, -7);

  weekRange.textContent = `${shortDate(currentStart)} - ${shortDate(addDays(currentEnd, -1))}`;

  const current = totalsByExercise(currentStart, currentEnd);
  const previous = totalsByExercise(previousStart, currentStart);
  const exercises = [...new Set([...Object.keys(current), ...Object.keys(previous)])].sort();

  if (!exercises.length) {
    overloadList.innerHTML = `<p class="empty-state">Add a workout and this will compare your training volume this week against last week.</p>`;
    return;
  }

  overloadList.innerHTML = exercises
    .map((exercise) => {
      const thisWeek = current[exercise] || 0;
      const lastWeek = previous[exercise] || 0;
      const diff = thisWeek - lastWeek;
      const status = diff > 0 ? "up" : diff < 0 ? "down" : "same";
      const label = diff > 0 ? `+${formatNumber(diff)}` : diff < 0 ? `-${formatNumber(Math.abs(diff))}` : "same";

      return `
        <article class="overload-item">
          <div>
            <div class="item-title">${escapeHtml(exercise)}</div>
            <div class="item-meta">This week: ${formatNumber(thisWeek)} volume · Last week: ${formatNumber(lastWeek)} volume</div>
          </div>
          <span class="status ${status}">${label}</span>
        </article>
      `;
    })
    .join("");
}

function renderLogs() {
  if (!logList) return;
  if (!logs.length) {
    logList.innerHTML = `<p class="empty-state">No workouts yet. Log your first set on the left.</p>`;
    return;
  }

  logList.innerHTML = logs
    .slice(0, 24)
    .map((log) => {
      const notes = log.notes ? `<p class="daily-note">${escapeHtml(log.notes)}</p>` : "";
      return `
        <article class="log-item">
          <div>
            <div class="item-title">${escapeHtml(log.exercise)}</div>
            <div class="item-meta">${formatDate(log.date)} · ${formatLog(log)} = ${formatNumber(getVolume(log))} volume</div>
            ${notes}
          </div>
          <button class="delete-button" type="button" data-delete-id="${log.id}">Delete</button>
        </article>
      `;
    })
    .join("");
}

function renderCardioLogs() {
  if (!cardioList) return;
  const entries = [...cardioEntries].sort((a, b) => b.date.localeCompare(a.date));

  if (!entries.length) {
    cardioList.innerHTML = `<p class="empty-state">No cardio yet. Log your first cardio session above.</p>`;
    return;
  }

  cardioList.innerHTML = entries
    .slice(0, 14)
    .map((entry) => {
      const notes = entry.notes ? `<p class="daily-note">${escapeHtml(entry.notes)}</p>` : "";

      return `
        <article class="daily-item">
          <div>
            <div class="item-title">${formatNumber(entry.miles)} miles</div>
            <div class="item-meta">${formatDate(entry.date)} · ${escapeHtml(entry.time)}</div>
            ${notes}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMaxLogs() {
  if (!maxList) return;
  if (!maxEntries.length) {
    maxList.innerHTML = `<p class="empty-state">No maxes yet. Save your first max attempt on the left.</p>`;
    return;
  }

  maxList.innerHTML = maxEntries
    .slice(0, 12)
    .map((entry) => {
      const notes = entry.notes ? `<p class="daily-note">${escapeHtml(entry.notes)}</p>` : "";
      return `
        <article class="daily-item max-item">
          <div>
            <div class="item-title">${escapeHtml(entry.movement)} · ${formatNumber(entry.value)} ${escapeHtml(entry.unit)}</div>
            <div class="item-meta">${formatDate(entry.date)}</div>
            ${notes}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMemories() {
  if (!exerciseMemory || !maxMemory) return;
  exerciseMemory.innerHTML = [...new Set(logs.map((log) => log.exercise).filter(Boolean))]
    .sort()
    .map((exercise) => `<option value="${escapeHtml(exercise)}"></option>`)
    .join("");
  maxMemory.innerHTML = [...new Set(maxEntries.map((entry) => entry.movement).filter(Boolean))]
    .sort()
    .map((movement) => `<option value="${escapeHtml(movement)}"></option>`)
    .join("");
}

function renderBadges() {
  if (!badgeList) return;
  const stats = getStats();
  const totalMiles = cardioEntries.reduce((sum, entry) => sum + (Number(entry.miles) || 0), 0);
  const badges = [
    { name: "First Log", earned: stats.uniqueDays >= 1 },
    { name: "3 Day Spark", earned: stats.streak >= 3 },
    { name: "7 Day Flame", earned: stats.streak >= 7 },
    { name: "10K Volume", earned: stats.volume >= 10000 },
    { name: "Road Work", earned: totalMiles >= 10 },
    { name: "Max Hunter", earned: maxEntries.length >= 3 },
  ];

  badgeList.innerHTML = badges
    .map((badge) => `<span class="game-badge ${badge.earned ? "earned" : ""}">${badge.earned ? "★" : "☆"} ${badge.name}</span>`)
    .join("");
}

function renderPersonalRecords() {
  if (!prList) return;
  const maxVolumeLog = [...logs].sort((a, b) => getVolume(b) - getVolume(a))[0];
  const maxCardio = [...cardioEntries].sort((a, b) => Number(b.miles) - Number(a.miles))[0];
  const heaviestMax = [...maxEntries].sort((a, b) => Number(b.value) - Number(a.value))[0];
  const records = [
    maxVolumeLog ? { title: "Highest Exercise Volume", meta: `${maxVolumeLog.exercise} · ${formatNumber(getVolume(maxVolumeLog))} volume` } : null,
    maxCardio ? { title: "Longest Cardio", meta: `${formatNumber(maxCardio.miles)} miles · ${formatDate(maxCardio.date)}` } : null,
    heaviestMax ? { title: "Top Max", meta: `${heaviestMax.movement} · ${formatNumber(heaviestMax.value)} ${heaviestMax.unit}` } : null,
    { title: "Longest Current Streak", meta: `${getWorkoutStreak()} days` },
  ].filter(Boolean);

  prList.innerHTML = records.length
    ? records.map((record) => `<article class="daily-item"><div class="item-title">${escapeHtml(record.title)}</div><div class="item-meta">${escapeHtml(record.meta)}</div></article>`).join("")
    : `<p class="empty-state">No records yet. Start logging to set your first PR.</p>`;
}

function totalsByExercise(start, end) {
  return logs.reduce((totals, log) => {
    const date = parseDateKey(log.date);
    if (date >= start && date < end) {
      totals[log.exercise] = (totals[log.exercise] || 0) + getVolume(log);
    }
    return totals;
  }, {});
}

function getVolume(log) {
  const weight = Number(log.weight) || 0;
  return log.sets * log.reps * (weight || 1);
}

function getStats() {
  const uniqueDays = getWorkoutDays().size;
  const volume = logs.reduce((sum, log) => sum + getVolume(log), 0);
  const streak = getWorkoutStreak();
  const xp = getTotalXp();
  const level = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100;
  const rank = getRank(level);

  return { uniqueDays, volume, streak, xp, level, levelProgress, rank };
}

function getTotalXp() {
  const workoutDays = getWorkoutDays();
  const questXp = getQuestXp(workoutDays);
  const bonusXp = getBonusChallengeXp();

  const workoutXp = [...workoutDays].reduce((total, dateKey) => {
    const effort = dailyEntries[dateKey]?.effort;
    const effortXp = Number.isFinite(effort) ? effort : 0;
    return total + 100 + effortXp;
  }, 0);
  const sessionEffortXp = completedWorkouts.reduce((total, session) => total + (Number(session.effort) || 0), 0);

  const earnedXp = workoutXp + sessionEffortXp + questXp + bonusXp;
  const spentXp = redemptions.reduce((total, redemption) => total + (Number(redemption.cost) || 0), 0);

  return Math.max(0, earnedXp - spentXp);
}

function getBonusChallengeXp() {
  const weekDates = new Set(getCurrentWeekDates());
  const weekLogs = logs.filter((log) => weekDates.has(log.date));
  const weekSessions = completedWorkouts.filter((session) => weekDates.has(session.date));
  const uniqueExercises = new Set(weekLogs.map((log) => log.exercise).filter(Boolean));
  const totalEffort = weekSessions.reduce((sum, session) => sum + (Number(session.effort) || 0), 0);
  const avgEffort = weekSessions.length ? Math.round(totalEffort / weekSessions.length) : 0;
  const weeklyVolume = weekLogs.reduce((sum, log) => sum + getVolume(log), 0);
  let xp = 0;

  if (uniqueExercises.size >= 5) xp += 75;
  if (avgEffort >= 80) xp += 75;
  if (weeklyVolume >= 5000) xp += 100;

  return xp;
}

function getQuestXp(workoutDays) {
  const weekDone = countCompleted(getCurrentWeekDates(), workoutDays);
  const monthDone = countCompleted(getCurrentMonthDates(), workoutDays);
  let xp = 0;

  if (weekDone >= goals.weeklyWorkoutGoal) xp += 100;
  if (monthDone >= goals.monthlyWorkoutGoal) xp += 200;

  return xp;
}

function countCompleted(dateKeys, workoutDays) {
  return dateKeys.filter((dateKey) => workoutDays.has(dateKey)).length;
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

function getWorkoutStreak() {
  const workoutDays = getWorkoutDays();
  let date = new Date();
  let streak = 0;
  let streakSavers = redemptions.filter((redemption) => redemption.name === "Streak Saver").length;

  while (workoutDays.has(toDateKey(date)) || streakSavers > 0) {
    if (workoutDays.has(toDateKey(date))) {
      streak += 1;
    } else {
      streakSavers -= 1;
      streak += 1;
    }
    date = addDays(date, -1);
  }

  return streak;
}

function getWorkoutDays() {
  return new Set([...logs.map((log) => log.date), ...cardioEntries.map((entry) => entry.date), ...completedWorkouts.map((entry) => entry.date)]);
}

function getRank(level) {
  if (level >= 30) return "Champion";
  if (level >= 20) return "Beast";
  if (level >= 10) return "Grinder";
  if (level >= 5) return "Starter";
  return "Rookie";
}

function celebrateProgress(message, before, after) {
  const leveledUp = after.level > before.level;
  const streakMilestone = after.streak > 0 && after.streak !== before.streak && after.streak % 3 === 0;
  const volumeMilestone = Math.floor(after.volume / 5000) > Math.floor(before.volume / 5000);
  const isParty = leveledUp || streakMilestone || volumeMilestone;
  const title = leveledUp ? `Level ${after.level}!` : streakMilestone ? `${after.streak} day streak!` : volumeMilestone ? "Volume milestone!" : message;
  const detail = isParty ? "Party bonus unlocked" : "+XP";

  showToast(title, detail, isParty);
  burstConfetti(isParty ? 42 : 14);
  pulsePlayerHud(isParty);
}

function showToast(title, detail, isParty) {
  const toast = document.createElement("div");
  toast.className = `reward-toast${isParty ? " party" : ""}`;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(detail)}</span>
  `;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 1800);
}

function burstConfetti(amount) {
  const colors = ["#ff2d95", "#00d4ff", "#9dff3f", "#ffd166", "#7c3aed", "#ff7a00"];

  for (let index = 0; index < amount; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--x", `${Math.random() * 100}vw`);
    piece.style.setProperty("--delay", `${Math.random() * 0.12}s`);
    piece.style.setProperty("--spin", `${Math.random() * 540 + 180}deg`);
    piece.style.background = colors[index % colors.length];
    document.body.append(piece);
    setTimeout(() => piece.remove(), 1300);
  }
}

function pulsePlayerHud(isParty) {
  const targets = [xpText, xpFill, streakCount].filter(Boolean);
  targets.forEach((target) => {
    target.classList.remove("pop", "party-pop");
    void target.offsetWidth;
    target.classList.add(isParty ? "party-pop" : "pop");
  });
}

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadDailyEntries() {
  try {
    return JSON.parse(localStorage.getItem(DAILY_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function loadCardioEntries() {
  try {
    return JSON.parse(localStorage.getItem(CARDIO_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadMaxEntries() {
  try {
    return JSON.parse(localStorage.getItem(MAX_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadRedemptions() {
  try {
    return JSON.parse(localStorage.getItem(REDEMPTION_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadGoals() {
  try {
    return {
      weeklyWorkoutGoal: 7,
      monthlyWorkoutGoal: 31,
      ...JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY)),
    };
  } catch {
    return { weeklyWorkoutGoal: 7, monthlyWorkoutGoal: 31 };
  }
}

function loadCreatedWorkouts() {
  try {
    return JSON.parse(localStorage.getItem(CREATED_WORKOUTS_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadWorkoutDraft() {
  try {
    return JSON.parse(localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

function loadCompletedWorkouts() {
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_WORKOUTS_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLogs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function saveDailyEntries() {
  localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(dailyEntries));
}

function saveCardioEntries() {
  localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(cardioEntries));
}

function saveMaxEntries() {
  localStorage.setItem(MAX_STORAGE_KEY, JSON.stringify(maxEntries));
}

function saveCreatedWorkouts() {
  localStorage.setItem(CREATED_WORKOUTS_STORAGE_KEY, JSON.stringify(createdWorkouts));
}

function saveCompletedWorkouts() {
  localStorage.setItem(COMPLETED_WORKOUTS_STORAGE_KEY, JSON.stringify(completedWorkouts));
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDate(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatLog(log) {
  const weight = Number(log.weight) || 0;
  const weightText = weight ? ` x ${formatNumber(weight)} lb` : "";
  return `${log.sets} sets x ${log.reps} reps${weightText}`;
}

function formatDailyEntry(entry) {
  const parts = [];
  if (entry.bodyweight) parts.push(`${formatNumber(entry.bodyweight)} lb`);
  if (entry.effort !== null && entry.effort !== undefined) parts.push(`${entry.effort}/100 effort`);
  if (entry.goalHit) parts.push("goal hit");
  if (entry.notes) parts.push(entry.notes);
  return parts.join(" | ");
}

function formatNumber(value) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
