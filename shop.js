const WORKOUT_STORAGE_KEY = "overload-fitness-tracker";
const DAILY_STORAGE_KEY = "overload-fitness-daily-log";
const CARDIO_STORAGE_KEY = "overload-fitness-cardio-log";
const REDEMPTION_STORAGE_KEY = "overload-fitness-redemptions";
const GOALS_STORAGE_KEY = "overload-fitness-goals";
const COMPLETED_WORKOUTS_STORAGE_KEY = "overload-fitness-completed-workouts";
const CUSTOM_REWARDS_STORAGE_KEY = "overload-fitness-custom-rewards";

const shopXp = document.querySelector("#shopXp");
const spentXp = document.querySelector("#spentXp");
const weekQuestProgress = document.querySelector("#weekQuestProgress");
const monthQuestProgress = document.querySelector("#monthQuestProgress");
const rewardHistory = document.querySelector("#rewardHistory");
const rewardHistoryStatus = document.querySelector("#rewardHistoryStatus");
const rewardPace = document.querySelector("#rewardPace");
const rewardBudget = document.querySelector("#rewardBudget");
const rewardBudgetStatus = document.querySelector("#rewardBudgetStatus");
const customRewardForm = document.querySelector("#customRewardForm");
const customRewardName = document.querySelector("#customRewardName");
const customRewardCost = document.querySelector("#customRewardCost");
const customRewardDescription = document.querySelector("#customRewardDescription");
const customRewardList = document.querySelector("#customRewardList");
const fastFoodXpInput = document.querySelector("#fastFoodXpInput");
const fastFoodXpSlider = document.querySelector("#fastFoodXpSlider");
const fastFoodValue = document.querySelector("#fastFoodValue");
const shopBoard = document.querySelector(".shop-board");
const unlockFocus = document.querySelector("#unlockFocus");
const unlockFocusStatus = document.querySelector("#unlockFocusStatus");
const nextUnlockStatus = document.querySelector("#nextUnlockStatus");
const nextUnlockList = document.querySelector("#nextUnlockList");
const shopBadgeList = document.querySelector("#shopBadgeList");
const bonusChallengeList = document.querySelector("#bonusChallengeList");
const logs = load(WORKOUT_STORAGE_KEY, []);
const cardioEntries = load(CARDIO_STORAGE_KEY, []);
const completedWorkouts = load(COMPLETED_WORKOUTS_STORAGE_KEY, []);
const dailyEntries = load(DAILY_STORAGE_KEY, {});
let redemptions = load(REDEMPTION_STORAGE_KEY, []);
let customRewards = load(CUSTOM_REWARDS_STORAGE_KEY, []);
const goals = loadGoals();

renderBalance();
renderQuests();
renderFastFoodValue();
renderRewardCardStates();
renderRewardHistory();
renderRewardBudget();
renderUnlockFocus();
renderNextUnlocks();
renderShopBadges();
renderBonusChallenges();
renderCustomRewards();

fastFoodXpInput.addEventListener("input", () => {
  fastFoodXpSlider.value = clampXp(fastFoodXpInput.value);
  renderFastFoodValue();
  renderRewardCardStates();
});

fastFoodXpSlider.addEventListener("input", () => {
  fastFoodXpInput.value = fastFoodXpSlider.value;
  renderFastFoodValue();
  renderRewardCardStates();
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
  renderRewardCardStates();
  renderRewardHistory();
  renderRewardBudget();
  renderUnlockFocus();
  renderNextUnlocks();
  renderShopBadges();
  showShopToast("Redemption undone", "XP returned", false);
});

customRewardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = customRewardName.value.trim();
  const cost = Number(customRewardCost.value) || 0;
  const description = customRewardDescription.value.trim();
  if (!name || cost <= 0) {
    showShopToast("Reward needs a name", "add a cost too", false);
    return;
  }

  customRewards = [
    ...customRewards,
    {
      id: crypto.randomUUID(),
      name,
      cost,
      description,
      createdAt: Date.now(),
    },
  ].sort((a, b) => Number(a.cost) - Number(b.cost));
  save(CUSTOM_REWARDS_STORAGE_KEY, customRewards);
  customRewardForm.reset();
  renderCustomRewards();
  renderRewardBudget();
  renderUnlockFocus();
  renderNextUnlocks();
  renderBalance();
  renderRewardCardStates();
  showShopToast("Reward added", `${name} · ${cost.toLocaleString()} XP`, false);
});

customRewardList.addEventListener("click", (event) => {
  const redeemButton = event.target.closest("[data-custom-redeem]");
  const deleteButton = event.target.closest("[data-custom-delete]");

  if (redeemButton) {
    const reward = customRewards.find((item) => item.id === redeemButton.dataset.customRedeem);
    if (reward) redeemReward(reward.name, Number(reward.cost) || 0);
  }

  if (deleteButton) {
    customRewards = customRewards.filter((item) => item.id !== deleteButton.dataset.customDelete);
    save(CUSTOM_REWARDS_STORAGE_KEY, customRewards);
    renderCustomRewards();
    renderRewardBudget();
    renderUnlockFocus();
    renderNextUnlocks();
    renderRewardCardStates();
    showShopToast("Reward removed", "custom list updated", false);
  }
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

function renderRewardCardStates() {
  const availableXp = getAvailableXp();

  document.querySelectorAll(".shop-slot.reward-ready").forEach((card) => {
    const button = card.querySelector("[data-reward-name]");
    if (!button) return;

    const rewardName = button.dataset.rewardName || "Reward";
    const inputId = button.dataset.variableInput;
    const fixedCost = Number(button.dataset.rewardCost) || 0;
    const selectedCost = inputId ? Number(document.querySelector(`#${inputId}`)?.value) || 0 : fixedCost;
    const targetCost = selectedCost || fixedCost || 200;
    const needed = Math.max(0, targetCost - availableXp);
    const workoutEstimate = Math.max(1, Math.ceil(needed / 175));
    let status = "";

    card.classList.toggle("reward-affordable", needed === 0 && targetCost > 0);
    card.classList.toggle("reward-locked", needed > 0);

    if (inputId && selectedCost <= 0) {
      status = availableXp >= 200 ? "Pick a 200 XP chunk, then redeem when it feels earned." : "Earn 200 XP to unlock your first fast food dollar.";
      card.classList.remove("reward-affordable");
    } else if (needed === 0) {
      status = `${rewardName} is ready to redeem.`;
    } else {
      status = `${needed.toLocaleString()} XP away · about ${workoutEstimate} strong workout${workoutEstimate === 1 ? "" : "s"}.`;
    }

    let statusEl = card.querySelector(".reward-card-status");
    if (!statusEl) {
      statusEl = document.createElement("div");
      statusEl.className = "reward-card-status";
      const redeemButton = card.querySelector(".redeem-button");
      if (redeemButton) card.insertBefore(statusEl, redeemButton);
      else card.append(statusEl);
    }

    statusEl.textContent = status;
  });
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
  renderRewardCardStates();
  renderRewardHistory();
  renderRewardBudget();
  renderUnlockFocus();
  renderNextUnlocks();
  renderShopBadges();
  renderBonusChallenges();
  renderCustomRewards();
  showShopToast("Reward redeemed", `${name} · ${cost.toLocaleString()} XP`, true);
  burstShopConfetti(28);
}

function renderRewardHistory() {
  renderRewardPace();
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

function renderRewardPace() {
  if (!rewardPace || !rewardHistoryStatus) return;
  const spent = getSpentXp();
  const earned = getEarnedXp();
  const ratio = earned ? Math.round((spent / earned) * 100) : 0;
  const last = [...redemptions].sort((a, b) => (b.redeemedAt || 0) - (a.redeemedAt || 0))[0];
  const status = ratio <= 30 ? "controlled" : ratio <= 65 ? "active" : "high spend";
  const note = spent
    ? `${ratio}% of earned XP redeemed${last ? ` · last: ${escapeHtml(last.name)}` : ""}`
    : "No XP spent yet. Save for something that feels earned.";

  rewardHistoryStatus.textContent = status;
  rewardPace.innerHTML = `
    <div>
      <strong>${spent.toLocaleString()} XP spent</strong>
      <span>${note}</span>
    </div>
    <div class="quest-meter"><i style="width:${Math.min(100, ratio)}%"></i></div>
  `;
}

function renderRewardBudget() {
  if (!rewardBudget || !rewardBudgetStatus) return;
  const earned = getEarnedXp();
  const spent = getSpentXp();
  const available = getAvailableXp();
  const rewards = getRewardCatalog();
  const nextLocked = rewards.find((reward) => reward.cost > available);
  const affordableRewards = rewards.filter((reward) => reward.cost <= available);
  const flexibleSpend = Math.max(0, Math.floor((available * 0.25) / 50) * 50);
  const savedPercent = earned ? Math.round((available / earned) * 100) : 0;
  const status = available >= 5000 ? "premium bank" : affordableRewards.length ? "ready" : "building";
  const recommendation = nextLocked
    ? `Save ${Math.max(0, nextLocked.cost - available).toLocaleString()} more XP for ${nextLocked.name}.`
    : "You can afford every listed reward. Pick something that supports tomorrow too.";

  rewardBudgetStatus.textContent = status;
  rewardBudget.innerHTML = `
    <article>
      <strong>${flexibleSpend.toLocaleString()} XP</strong>
      <span>Suggested fun spend</span>
    </article>
    <article>
      <strong>${available.toLocaleString()} XP</strong>
      <span>Available right now</span>
    </article>
    <article>
      <strong>${savedPercent}% saved</strong>
      <span>${spent.toLocaleString()} XP already redeemed</span>
    </article>
    <p>${escapeHtml(recommendation)}</p>
  `;
}

function renderUnlockFocus() {
  if (!unlockFocus || !unlockFocusStatus) return;
  const availableXp = getAvailableXp();
  const rewards = getRewardCatalog();
  const next = rewards.find((reward) => reward.cost > availableXp) || rewards[rewards.length - 1];
  const needed = Math.max(0, next.cost - availableXp);
  const percent = Math.min(100, (availableXp / Math.max(1, next.cost)) * 100);
  const workoutEstimate = Math.max(1, Math.ceil(needed / 175));

  unlockFocusStatus.textContent = needed ? `${needed.toLocaleString()} XP away` : "ready";
  unlockFocus.innerHTML = `
    <strong>${escapeHtml(next.name)}</strong>
    <span>${needed ? `${needed.toLocaleString()} XP left · about ${workoutEstimate} strong workout${workoutEstimate === 1 ? "" : "s"}` : "You can unlock this now."}</span>
    <div class="quest-meter"><i style="width:${percent}%"></i></div>
    <a href="${needed ? "workout.html#log" : "#rewardBoard"}">${needed ? "Earn XP" : "Choose Reward"}</a>
  `;
}

function renderCustomRewards() {
  if (!customRewardList) return;
  const availableXp = getAvailableXp();
  const sorted = [...customRewards].sort((a, b) => Number(a.cost) - Number(b.cost));

  customRewardList.innerHTML = sorted.length
    ? sorted
        .map((reward) => {
          const affordable = availableXp >= Number(reward.cost);
          return `
            <article class="custom-reward-card">
              <div>
                <strong>${escapeHtml(reward.name)}</strong>
                <span>${Number(reward.cost).toLocaleString()} XP${reward.description ? ` · ${escapeHtml(reward.description)}` : ""}</span>
              </div>
              <div class="custom-reward-actions">
                <button type="button" data-custom-redeem="${reward.id}" ${affordable ? "" : "disabled"}>Redeem</button>
                <button class="text-button" type="button" data-custom-delete="${reward.id}">Remove</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">Add rewards that actually motivate you. Keep them specific and earned.</p>`;
}

function renderNextUnlocks() {
  if (!nextUnlockList || !nextUnlockStatus) return;
  const availableXp = getAvailableXp();
  const rewards = getRewardCatalog();
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

function getRewardCatalog() {
  return [
    { name: "Fast Food", cost: 200, detail: "$1 reward chunks" },
    { name: "1 Serving of Candy", cost: 1000, detail: "ONE serving" },
    { name: "Soda", cost: 1000, detail: "one can or serving" },
    { name: "Streak Saver", cost: 5000, detail: "protect one day" },
    ...customRewards.map((reward) => ({
      name: reward.name,
      cost: Number(reward.cost) || 0,
      detail: reward.description || "custom reward",
    })),
  ].sort((a, b) => a.cost - b.cost);
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
