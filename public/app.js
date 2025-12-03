// ====== DOM 요소 ======
const inputField = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const resultBox = document.getElementById("result");
const musicContainer = document.getElementById("music-container");
const loadingBox = document.getElementById("loading");
const encouragementBox = document.getElementById("encouragementBox");
const adviceBox = document.getElementById("adviceBox");
const diaryList = document.getElementById("diaryList");
const saveDiaryBtn = document.getElementById("saveDiaryBtn");

let lastEmotion = null;
let lastAdvice = null;
let lastStress = null;
let lastText = null;

// ====== 배경 색(감정별 테마) ======
const emotionBackgrounds = {
  joy: "linear-gradient(135deg, #ffeaa7, #fdcb6e)",
  sadness: "linear-gradient(135deg, #74b9ff, #0984e3)",
  anger: "linear-gradient(135deg, #ff7675, #d63031)",
  anxiety: "linear-gradient(135deg, #a29bfe, #6c5ce7)",
  stress: "linear-gradient(135deg, #81ecec, #00cec9)",
  lethargy: "linear-gradient(135deg, #b2bec3, #636e72)",
  peace: "linear-gradient(135deg, #55efc4, #00b894)",
};

function applyEmotionTheme(emotion) {
  const bg = emotionBackgrounds[emotion] || "linear-gradient(135deg, #232526, #414345)";
  document.body.style.background = bg;
}

// ====== 로딩 표시 ======
function showLoading() {
  loadingBox.classList.remove("hidden");
}
function hideLoading() {
  loadingBox.classList.add("hidden");
}

// ====== 감정 히스토리 저장 (최근 7일, 스트레스 함께) ======
function saveEmotionHistory(emotion, stress) {
  const history = JSON.parse(localStorage.getItem("emotionHistory") || "[]");

  history.push({
    emotion,
    stress,
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const filtered = history.filter((entry) => new Date(entry.date) >= cutoff);

  localStorage.setItem("emotionHistory", JSON.stringify(filtered));
}

// ====== 감정 통계 (도넛 차트용) ======
function getEmotionStats() {
  const history = JSON.parse(localStorage.getItem("emotionHistory") || "[]");

  const counts = {
    anger: 0,
    sadness: 0,
    anxiety: 0,
    stress: 0,
    lethargy: 0,
    joy: 0,
    peace: 0,
  };

  history.forEach((h) => {
    if (counts[h.emotion] !== undefined) counts[h.emotion]++;
  });

  return counts;
}

// ====== 일별 평균 스트레스 (라인 차트용) ======
function getDailyStressTrend() {
  const history = JSON.parse(localStorage.getItem("emotionHistory") || "[]");
  const map = {};

  history.forEach((h) => {
    if (!map[h.date]) map[h.date] = { sum: 0, count: 0 };
    map[h.date].sum += h.stress;
    map[h.date].count += 1;
  });

  const labels = Object.keys(map).sort();
  const data = labels.map((d) => Math.round(map[d].sum / map[d].count));

  return { labels, data };
}

// ====== 도넛 차트 ======
let emotionChart = null;
function renderEmotionChart() {
  const canvas = document.getElementById("emotionChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const stats = getEmotionStats();

  if (emotionChart) emotionChart.destroy();

  emotionChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["화남", "슬픔", "불안", "스트레스", "무기력", "기쁨", "평온"],
      datasets: [{
        data: [
          stats.anger,
          stats.sadness,
          stats.anxiety,
          stats.stress,
          stats.lethargy,
          stats.joy,
          stats.peace,
        ],
        backgroundColor: [
          "#ff4d4d", "#4d79ff", "#6a5acd",
          "#b366ff", "#a3a3a3", "#ffd633", "#66d9b3",
        ],
      }],
    },
  });
}

// ====== 일별 스트레스 라인 차트 ======
let trendChart = null;
function renderTrendChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const { labels, data } = getDailyStressTrend();

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "일별 평균 스트레스 지수",
        data,
        borderColor: "#81ecec",
        borderWidth: 2,
        fill: false,
      }],
    },
    options: {
      scales: {
        y: { min: 0, max: 100 },
      },
    },
  });
}

// ====== 주간 최다 감정 기반 응원 메시지 ======
function renderEncouragementMessage() {
  const stats = getEmotionStats();

  let maxEmotion = "peace";
  let maxValue = -1;

  for (const emo in stats) {
    if (stats[emo] > maxValue) {
      maxValue = stats[emo];
      maxEmotion = emo;
    }
  }

  const messages = {
    anger: "요즘 많이 답답했구나… 네 감정을 무시하지 않아도 돼. 내가 여기 있어 🔥",
    sadness: "마음이 많이 지쳤던 한 주였네. 울어도 괜찮아. 너 잘 버티고 있어 💙",
    anxiety: "불안한 마음이 많았어도 괜찮아. 모든 것을 한 번에 해결하려 하지 않아도 돼 🌿",
    stress: "정말 열심히 살아온 일주일이었어. 이제는 조금 내려놓아도 괜찮아 ☕",
    lethargy: "기운이 없었던 너에게… 천천히 가도 돼. 쉬어가는 것도 성장의 일부야 🌙",
    joy: "행복한 순간들이 많았네! 너의 밝은 에너지가 주변도 따뜻하게 해 😊",
    peace: "평온한 한 주였어. 이런 흐름이 계속되면 좋겠다 ☁️",
  };

  encouragementBox.innerHTML = `
    <strong>📌 지난 7일 동안 가장 많이 느낀 감정: <span style="color:#ffd;">${maxEmotion}</span></strong><br><br>
    ${messages[maxEmotion]}
  `;
}

// ====== 음악 카드 UI ======
function renderMusicCards(tracks) {
  musicContainer.innerHTML = "";

  tracks.forEach((track) => {
    musicContainer.innerHTML += `
      <div class="track-card">
        <img src="${track.image || 'default-cover.jpg'}" class="track-cover">
        <div class="track-title">${track.title}</div>
        <a class="track-link" target="_blank" href="${track.url}">▶ 재생</a>
      </div>
    `;
  });
}

// ====== 감정 일기 렌더링 ======
function renderDiary() {
  const diary = JSON.parse(localStorage.getItem("emotionDiary") || "[]");
  diaryList.innerHTML = diary
    .map(
      (d) => `
      <div class="diary-item">
        📘 [${d.date}] (${d.emotion}, 스트레스 ${d.stress}/100)<br>
        <span class="diary-text">${d.text}</span><br>
        <span class="diary-advice">💬 ${d.advice}</span>
      </div>
    `
    )
    .join("");
}

// ====== 감정 일기 저장 버튼 ======
if (saveDiaryBtn) {
  saveDiaryBtn.addEventListener("click", () => {
    if (!lastEmotion || !lastAdvice) return;

    const diary = JSON.parse(localStorage.getItem("emotionDiary") || "[]");
    diary.push({
      emotion: lastEmotion,
      stress: lastStress,
      advice: lastAdvice,
      text: lastText || "",
      date: new Date().toLocaleString(),
    });
    localStorage.setItem("emotionDiary", JSON.stringify(diary));
    renderDiary();
  });
}

// ====== 서버에 감정 분석 요청 ======
sendBtn.addEventListener("click", async () => {
  const text = inputField.value.trim();
  if (!text) return;

  resultBox.innerHTML = "";
  musicContainer.innerHTML = "";
  adviceBox.innerHTML = "";
  showLoading();

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const result = await response.json();
    hideLoading();

    const { emotion, message, stress, advice, music } = result;

    // 최근 상태 저장 (일기용)
    lastEmotion = emotion;
    lastAdvice = advice;
    lastStress = stress;
    lastText = text;

    // 배경 테마 변경
    applyEmotionTheme(emotion);

    // 결과 표시
    resultBox.innerHTML = `
      <h2>감정: ${emotion}</h2>
      <p>${message}</p>
      <p>스트레스 지수: <b>${stress}</b> / 100</p>
    `;

    adviceBox.innerHTML = `
      <strong>💬 오늘의 조언</strong><br>
      ${advice}
    `;

    // 히스토리 저장 + 그래프/응원 업데이트
    saveEmotionHistory(emotion, stress);
    renderEmotionChart();
    renderTrendChart();
    renderEncouragementMessage();

    // 음악 카드
    renderMusicCards(music);
  } catch (e) {
    console.error(e);
    hideLoading();
    resultBox.innerHTML = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
});

// ====== 페이지 로드 시 초기 렌더 ======
window.onload = () => {
  renderEmotionChart();
  renderTrendChart();
  renderEncouragementMessage();
  renderDiary();
};

