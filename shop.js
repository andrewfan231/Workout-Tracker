const WORKOUT_STORAGE_KEY = "overload-fitness-tracker";
const DAILY_STORAGE_KEY = "overload-fitness-daily-log";
const CARDIO_STORAGE_KEY = "overload-fitness-cardio-log";
const REDEMPTION_STORAGE_KEY = "overload-fitness-redemptions";
const GOALS_STORAGE_KEY = "overload-fitness-goals";
const COMPLETED_WORKOUTS_STORAGE_KEY = "overload-fitness-completed-workouts";

const shopXp = document.querySelector("#shopXp");
const spentXp = document.querySelector("#spentXp");
const weekQuestProgress = document.querySelector("#weekQuestProgress");
const monthQuestProgress = document.querySelector("#monthQuestProgress");
const rewardHistory = document.querySelector("#rewardHistory");
const fastFoodXpInput = document.querySelector("#fastFoodXpInput");
const fastFoodXpSlider = document.querySelector("#fastFoodXpSlider");
const fastFoodValue = document.querySelector("#fastFoodValue");
const shopBoard = document.querySelector(".shop-board");
const nextUnlockStatus = document.querySelector("#nextUnlockStatus");
const nextUnlockList = document.querySelector("#nextUnlockList");
const shopBadgeList = document.querySelector("#shopBadgeList");
const bonusChallengeList = document.querySelector("#bonusChallengeList");
const logs = load(WORKOUT_STORAGE_KEY, []);
const cardioEntries = load(CARDIO_STORAGE_KEY, []);
const completedWorkouts = load(COMPLETED_WORKOUTS_STORAGE_KEY, []);
const dailyEntries = load(DAILY_STORAGE_KEY, {});
let redemptions = load(REDEMPTION_STORAGE_KEY, []);
const goals = loadGoals();

renderBalance();
renderQuests();
renderFastFoodValue();
renderRewardHistory();
renderNextUnlocks();
renderShopBadges();
renderBonusChallenges();

fastFoodXpInput.addEventListener("input", () => {
  fastFoodXpSlider.value = clampXp(fastFoodXpInput.value);
  renderFastFoodValue();
});

fastFoodXpSlider.addEventListener("input", () => {
  fastFoodXpInput.value = fastFoodXpSlider.value;
  renderFastFoodValue();
});

shopBoard.addEventListener("click", (event) => {
  const button = event.target.closest("[data-reward-name]");
  if (!button) return;

  const inputId = button.dataset.variableInput;
  const cost = inputId ? Number(document.querySelector(`#${inputId}`).value) || 0 : Number(button.dataset.rewardCost) || 0;
  redeemReward(button.dataset.rewardName, cost);
});

rewardHistory.addEventListener("click", (event) => {
  const button = event.target.closest("[data-refund-reward]");
  if (!button) return;

  redemptions = redemptions.filter((redemption) => redemption.id !== button.dataset.refundReward);
  save(REDEMPTION_STORAGE_KEY, redemptions);
  renderBalance();
  renderFastFoodValue();
  renderRewardHistory();
  renderNextUnlocks();
  renderShopBadges();
  showShopToast("Redemption undone", "XP returned", false);
});

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

function renderBalance() {
  const earnedXp = getEarnedXp();
  const usedXp = getSpentXp();
  const availableXp = getAvailableXp();

  shopXp.textContent = `${availableXp.toLocaleString()} XP`;
  spentXp.textContent = `${usedXp.toLocaleString()} XP spent`;
  fastFoodXpSlider.max = Math.max(5000, Math.ceil(availableXp / 200) * 200);

  document.querySelectorAll("[data-reward-cost]").forEach((button) => {
    const cost = Number(button.dataset.rewardCost) || 0;
    button.disabled = availableXp < cost;
  });
}

function renderFastFoodValue() {
  const points = clampXp(fastFoodXpInput.value);
  const dollars = points / 200;
  fastFoodXpInput.value = points;
  fastFoodValue.textContent = `$${dollars.toFixed(2)} fast food value`;
}

function clampXp(value) {
  const availableXp = getAvailableXp();
  const number = Math.max(0, Number(value) || 0);
  const stepped = Math.floor(number / 200) * 200;
  return Math.min(stepped, Math.floor(availableXp / 200) * 200);
}

function redeemReward(name, cost) {
  const availableXp = getAvailableXp();

  if (cost <= 0) {
    showShopToast("Pick XP first", "choose an amount to redeem", false);
    return;
  }

  if (cost > availableXp) {
    showShopToast("Not enough XP", "finish more workouts first", false);
    return;
  }

  redemptions = [
    {
      id: crypto.randomUUID(),
      name,
      cost,
      redeemedAt: Date.now(),
    },
    ...redemptions,
  ];

  save(REDEMPTION_STORAGE_KEY, redemptions);
  renderBalance();
  renderFastFoodValue();
  renderRewardHistory();
  renderNextUnlocks();
  renderShopBadges();
  renderBonusChallenges();
  showShopToast("Reward redeemed", `${name} · ${cost.toLocaleString()} XP`, true);
  burstShopConfetti(28);
}

function renderRewardHistory() {
  if (!redemptions.length) {
    rewardHistory.innerHTML = `<p class="empty-state">No rewards redeemed yet.</p>`;
    return;
  }

  rewardHistory.innerHTML = redemptions
    .slice(0, 8)
    .map((redemption) => {
      const date = new Date(redemption.redeemedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      return `
        <article class="daily-item">
          <div>
            <div class="item-title">${escapeHtml(redemption.name)}</div>
            <div class="item-meta">${Number(redemption.cost).toLocaleString()} XP · ${date}</div>
          </div>
          <button class="text-button" type="button" data-refund-reward="${redemption.id}">Undo</button>
        </article>
      `;
    })
    .join("");
}

function renderNextUnlocks() {
  if (!nextUnlockList || !nextUnlockStatus) return;
  const availableXp = getAvailableXp();
  const rewards = [
    { name: "Fast Food", cost: 200, detail: "$1 reward chunks" },
    { name: "1 Serving of Candy", cost: 1000, detail: "ONE serving" },
    { name: "Soda", cost: 1000, detail: "one can or serving" },
    { name: "Streak Saver", cost: 5000, detail: "protect one day" },
  ].sort((a, b) => a.cost - b.cost);
  const nextRewards = rewards.filter((reward) => reward.cost > availableXp).slice(0, 3);
  const affordable = rewards.filter((reward) => reward.cost <= availableXp);

  nextUnlockStatus.textContent = affordable.length ? `${affordable.length} affordable` : "keep earning";
  nextUnlockList.innerHTML = nextRewards.length
    ? nextRewards
        .map((reward) => {
          const needed = reward.cost - availableXp;
          const percent = Math.min(100, (availableXp / reward.cost) * 100);
          return `
            <article class="unlock-card">
              <div>
                <strong>${escapeHtml(reward.name)}</strong>
                <span>${needed.toLocaleString()} XP away · ${escapeHtml(reward.detail)}</span>
              </div>
              <div class="quest-meter"><i style="width:${percent}%"></i></div>
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">Everything is affordable. Spend smart or save for bigger rewards.</p>`;
}

function renderShopBadges() {
  if (!shopBadgeList) return;
  const workoutDays = getWorkoutDays();
  const volume = logs.reduce((sum, log) => sum + getVolume(log), 0);
  const streak = getWorkoutStreak(workoutDays);
  const spent = getSpentXp();
  const redemptionsCount = redemptions.length;
  const badges = [
    { name: "First Clear", earned: workoutDays.size >= 1 },
    { name: "3 Day Flame", earned: streak >= 3 },
    { name: "7 Day Flame", earned: streak >= 7 },
    { name: "10K Volume", earned: volume >= 10000 },
    { name: "First Reward", earned: redemptionsCount >= 1 },
    { name: "Big Saver", earned: getAvailableXp() >= 5000 || spent >= 5000 },
  ];

  shopBadgeList.innerHTML = badges
    .map((badge) => `<span class="game-badge ${badge.earned ? "earned" : ""}">${badge.earned ? "★" : "☆"} ${badge.name}</span>`)
    .join("");
}

function renderBonusChallenges() {
  if (!bonusChallengeList) return;
  const challenges = getBonusChallenges();

  bonusChallengeList.innerHTML = challenges
    .map((challenge) => {
      const percent = Math.min(100, (challenge.done / challenge.target) * 100);
      const complete = challenge.done >= challenge.target;
      return `
        <article class="bonus-challenge ${complete ? "complete" : ""}">
          <div>
            <strong>${challenge.name}</strong>
            <span>${challenge.detail}</span>
          </div>
          <em>${complete ? "Complete" : `${formatNumber(challenge.done)}/${formatNumber(challenge.target)}`} · ${challenge.reward}</em>
          <div class="quest-meter"><i style="width:${percent}%"></i></div>
        </article>
      `;
    })
    .join("");
}

function getAvailableXp() {
  return Math.max(0, getEarnedXp() - getSpentXp());
}

function getSpentXp() {
  return redemptions.reduce((total, redemption) => total + (Number(redemption.cost) || 0), 0);
}

function getEarnedXp() {
  const workoutDays = getWorkoutDays();
  const questXp = getQuestXp(workoutDays);
  const bonusXp = getBonusChallengeXp();

  const workoutXp = [...workoutDays].reduce((total, dateKey) => {
    const effort = dailyEntries[dateKey]?.effort;
    const effortXp = Number.isFinite(effort) ? effort : 0;
    return total + 100 + effortXp;
  }, 0);

  const effortXp = completedWorkouts.reduce((total, session) => total + (Number(session.effort) || 0), 0);
  return workoutXp + effortXp + questXp + bonusXp;
}

function getBonusChallengeXp() {
  return getBonusChallenges()
    .filter((challenge) => challenge.done >= challenge.target)
    .reduce((total, challenge) => total + challenge.xp, 0);
}

function getBonusChallenges() {
  const weekDates = new Set(getCurrentWeekDates());
  const weekLogs = logs.filter((log) => weekDates.has(log.date));
  const weekSessions = completedWorkouts.filter((session) => weekDates.has(session.date));
  const uniqueExercises = new Set(weekLogs.map((log) => log.exercise).filter(Boolean));
  const totalEffort = weekSessions.reduce((sum, session) => sum + (Number(session.effort) || 0), 0);
  const avgEffort = weekSessions.length ? Math.round(totalEffort / weekSessions.length) : 0;
  const weeklyVolume = weekLogs.reduce((sum, log) => sum + getVolume(log), 0);

  return [
    { name: "Variety Quest", detail: "Log 5 different exercises this week", done: uniqueExercises.size, target: 5, xp: 75, reward: "+75 XP" },
    { name: "Intensity Quest", detail: "Average 80 effort this week", done: avgEffort, target: 80, xp: 75, reward: "+75 XP" },
    { name: "Volume Quest", detail: "Reach 5,000 weekly volume", done: weeklyVolume, target: 5000, xp: 100, reward: "+100 XP" },
  ];
}

function renderQuests() {
  const workoutDays = getWorkoutDays();
  const weekDates = getCurrentWeekDates();
  const monthDates = getCurrentMonthDates();
  const weekDone = countCompleted(weekDates, workoutDays);
  const monthDone = countCompleted(monthDates, workoutDays);
  const weeklyGoal = goals.weeklyWorkoutGoal;
  const monthlyGoal = goals.monthlyWorkoutGoal;

  weekQuestProgress.textContent = weekDone >= weeklyGoal ? "Complete · reward added" : `${weekDone}/${weeklyGoal} days complete`;
  monthQuestProgress.textContent = monthDone >= monthlyGoal ? "Complete · reward added" : `${monthDone}/${monthlyGoal} days complete`;
}

function getQuestXp(workoutDays) {
  const weekDone = countCompleted(getCurrentWeekDates(), workoutDays);
  const monthDone = countCompleted(getCurrentMonthDates(), workoutDays);
  let xp = 0;

  if (weekDone >= goals.weeklyWorkoutGoal) xp += 100;
  if (monthDone >= goals.monthlyWorkoutGoal) xp += 200;

  return xp;
}

function getWorkoutDays() {
  return new Set([...logs.map((log) => log.date), ...cardioEntries.map((entry) => entry.date), ...completedWorkouts.map((entry) => entry.date)]);
}

function getWorkoutStreak(workoutDays) {
  let date = new Date();
  let streak = 0;

  while (workoutDays.has(toDateKey(date))) {
    streak += 1;
    date = addDays(date, -1);
  }

  return streak;
}

function getVolume(log) {
  const weight = Number(log.weight) || 0;
  return Number(log.sets) * Number(log.reps) * (weight || 1);
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

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function showShopToast(title, detail, isParty) {
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

function burstShopConfetti(amount) {
  const colors = ["#ff2d95", "#00d4ff", "#9dff3f", "#ffd166", "#2f80ff"];
  for (let index = 0; index < amount; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    document.body.append(piece);
    setTimeout(() => piece.remove(), 1500);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
