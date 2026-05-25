const CREATED_WORKOUTS_STORAGE_KEY = "overload-fitness-created-workouts";
const WORKOUT_STORAGE_KEY = "overload-fitness-tracker";
const CARDIO_STORAGE_KEY = "overload-fitness-cardio-log";
const MAX_STORAGE_KEY = "overload-fitness-max-log";
const REDEMPTION_STORAGE_KEY = "overload-fitness-redemptions";
const CUSTOM_REWARDS_STORAGE_KEY = "overload-fitness-custom-rewards";
const GOALS_STORAGE_KEY = "overload-fitness-goals";
const COMPLETED_WORKOUTS_STORAGE_KEY = "overload-fitness-completed-workouts";
const ADMIN_CODE = "overload";

const adminLockPanel = document.querySelector("#adminLockPanel");
const adminDashboard = document.querySelector("#adminDashboard");
const adminCodeInput = document.querySelector("#adminCodeInput");
const unlockAdminButton = document.querySelector("#unlockAdminButton");
const adminWorkoutList = document.querySelector("#adminWorkoutList");
const exportAdminData = document.querySelector("#exportAdminData");
const clearCreatedWorkouts = document.querySelector("#clearCreatedWorkouts");
const adminDataBox = document.querySelector("#adminDataBox");

let createdWorkouts = load(CREATED_WORKOUTS_STORAGE_KEY, []);

unlockAdminButton.addEventListener("click", unlockAdmin);
adminCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") unlockAdmin();
});

adminWorkoutList.addEventListener("input", (event) => {
  const card = event.target.closest("[data-workout-id]");
  if (!card) return;
  updateWorkoutFromCard(card);
});

adminWorkoutList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-workout]");
  if (!deleteButton) return;
  createdWorkouts = createdWorkouts.filter((workout) => workout.id !== deleteButton.dataset.deleteWorkout);
  save(CREATED_WORKOUTS_STORAGE_KEY, createdWorkouts);
  renderWorkouts();
});

exportAdminData.addEventListener("click", () => {
  adminDataBox.value = JSON.stringify(
    {
      createdWorkouts,
      workoutLogs: load(WORKOUT_STORAGE_KEY, []),
      completedWorkouts: load(COMPLETED_WORKOUTS_STORAGE_KEY, []),
      cardioLogs: load(CARDIO_STORAGE_KEY, []),
      maxLogs: load(MAX_STORAGE_KEY, []),
      redemptions: load(REDEMPTION_STORAGE_KEY, []),
      customRewards: load(CUSTOM_REWARDS_STORAGE_KEY, []),
      goals: load(GOALS_STORAGE_KEY, {}),
    },
    null,
    2,
  );
});

clearCreatedWorkouts.addEventListener("click", () => {
  const confirmed = confirm("Delete all created workouts?");
  if (!confirmed) return;
  createdWorkouts = [];
  save(CREATED_WORKOUTS_STORAGE_KEY, createdWorkouts);
  renderWorkouts();
});

function unlockAdmin() {
  if (adminCodeInput.value.trim() !== ADMIN_CODE) {
    alert("Wrong admin code.");
    return;
  }

  adminLockPanel.hidden = true;
  adminDashboard.hidden = false;
  renderWorkouts();
}

function renderWorkouts() {
  if (!createdWorkouts.length) {
    adminWorkoutList.innerHTML = `<p class="empty-state">No created workouts yet.</p>`;
    return;
  }

  adminWorkoutList.innerHTML = createdWorkouts.map(renderWorkoutCard).join("");
}

function renderWorkoutCard(workout) {
  return `
    <article class="admin-workout-card" data-workout-id="${workout.id}">
      <div class="panel-header simple">
        <label>
          Workout name
          <input data-workout-name type="text" value="${escapeHtml(workout.name)}" />
        </label>
        <button class="delete-button" type="button" data-delete-workout="${workout.id}">Delete</button>
      </div>
      <div class="admin-exercise-list">
        ${(workout.exercises || []).map((exercise, index) => renderExerciseRow(exercise, index)).join("")}
      </div>
    </article>
  `;
}

function renderExerciseRow(exercise, index) {
  return `
    <div class="admin-exercise-row" data-exercise-index="${index}">
      <label>Exercise <input data-field="exercise" type="text" value="${escapeHtml(exercise.exercise || "")}" /></label>
      <label>Sets <input data-field="sets" type="text" value="${escapeHtml(exercise.sets || "")}" /></label>
      <label>Reps <input data-field="reps" type="text" value="${escapeHtml(exercise.reps || "")}" /></label>
      <label>Weight <input data-field="weight" type="text" value="${escapeHtml(exercise.weight || "")}" /></label>
      <label>Rest <input data-field="rest" type="text" value="${escapeHtml(exercise.rest || "")}" /></label>
    </div>
  `;
}

function updateWorkoutFromCard(card) {
  const workout = createdWorkouts.find((item) => item.id === card.dataset.workoutId);
  if (!workout) return;

  workout.name = card.querySelector("[data-workout-name]").value.trim();
  workout.exercises = [...card.querySelectorAll("[data-exercise-index]")].map((row) => {
    return [...row.querySelectorAll("[data-field]")].reduce((exercise, input) => {
      exercise[input.dataset.field] = input.value.trim();
      return exercise;
    }, {});
  });

  save(CREATED_WORKOUTS_STORAGE_KEY, createdWorkouts);
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
