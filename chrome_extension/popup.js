// 翻译服务类
class TranslationService {
  constructor() {
    this.apiKey = "6e1c0a345e9cd475f1919dc5af1dc43e";
    this.apiUrl = "https://trans.neo.edu.cn/transTextTranslation";
  }

  /**
   * 翻译文本
   * @param {string} text - 要翻译的文本
   * @param {string} from - 源语言代码 (默认: 'auto')
   * @param {string} to - 目标语言代码 (默认: 'en')
   * @returns {Promise<string>} - 翻译结果
   */
  async translate(text, from = "auto", to = "en") {
    try {
      const response = await fetch(`${this.apiUrl}?apikey=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from,
          to: to,
          src_text: text,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.length > 0) {
          const sentences = data.data[0].sentences;
          if (sentences && sentences.length > 0) {
            return sentences[0].data;
          }
        }
        throw new Error("翻译失败: 无效的响应格式");
      } else {
        throw new Error(`翻译失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("翻译API错误:", error);
      throw error;
    }
  }

  /**
   * 检测语言
   * @param {string} text - 要检测的文本
   * @returns {Promise<string>} - 语言代码
   */
  async detectLanguage(text) {
    try {
      // 由于API不直接提供语言检测功能，我们使用翻译API的auto检测
      const response = await fetch(`${this.apiUrl}?apikey=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "auto",
          to: "en",
          src_text: text,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.length > 0) {
          const sentences = data.data[0].sentences;
          if (sentences && sentences.length > 0) {
            return sentences[0].sourceLanguageAbbreviation;
          }
        }
        throw new Error("语言检测失败: 无效的响应格式");
      } else {
        throw new Error(
          `语言检测失败: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("语言检测API错误:", error);
      throw error;
    }
  }

  /**
   * 批量翻译
   * @param {string[]} texts - 要翻译的文本数组
   * @param {string} from - 源语言代码
   * @param {string} to - 目标语言代码
   * @returns {Promise<string[]>} - 翻译结果数组
   */
  async batchTranslate(texts, from = "auto", to = "en") {
    const promises = texts.map((text) => this.translate(text, from, to));
    return Promise.all(promises);
  }

  /**
   * 获取支持的语言列表
   * @returns {Object} - 支持的语言列表
   */
  getSupportedLanguages() {
    return {
      auto: "自动检测",
      zh: "中文",
      en: "英语",
      ja: "日语",
      ko: "韩语",
      fr: "法语",
      de: "德语",
      ru: "俄语",
      es: "西班牙语",
      ar: "阿拉伯语",
      pt: "葡萄牙语",
      it: "意大利语",
      nl: "荷兰语",
      pl: "波兰语",
      th: "泰语",
      vi: "越南语",
      id: "印尼语",
      ms: "马来语",
      hi: "印地语",
    };
  }
}

// 创建翻译服务实例
const translationService = new TranslationService();

document.addEventListener("DOMContentLoaded", function () {
  // 获取DOM元素
  const wordInput = document.getElementById("wordInput");
  const searchBtn = document.getElementById("searchBtn");
  const resultDiv = document.getElementById("result");
  const similarityHints = document.getElementById("similarityHints");

  // 翻译功能元素
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  const sourceLang = document.getElementById("sourceLang");
  const targetLang = document.getElementById("targetLang");
  const swapLangsBtn = document.getElementById("swapLangs");
  const translateInput = document.getElementById("translateInput");
  const translateBtn = document.getElementById("translateBtn");
  const translateResult = document.getElementById("translateResult");

  // 复习功能元素
  const reviewLoading = document.getElementById("reviewLoadingMessage");
  const reviewError = document.getElementById("reviewErrorMessage");
  const reviewCardContainer = document.getElementById("reviewCardContainer");
  const reviewDaySelect = document.getElementById("reviewDaySelect");
  const reviewFilterBtn = document.getElementById("reviewFilterBtn");
  const reviewRangeRow = document.getElementById("reviewRangeRow");

  // 标签切换功能
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const tab = this.dataset.tab;

      // 更新标签状态
      tabBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      // 更新面板状态
      tabPanels.forEach((panel) => panel.classList.remove("active"));
      document.getElementById(`${tab}-panel`).classList.add("active");

      // 切换到复习面板时，自动加载待复习单词
      if (tab === "review") {
        loadNextReviewWord();
      }
    });
  });

  // 语言切换按钮
  swapLangsBtn.addEventListener("click", function () {
    const temp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = temp;
  });

  // 翻译按钮点击事件
  translateBtn.addEventListener("click", translateText);

  // 回车键翻译
  translateInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      translateText();
    }
  });

  // 翻译文本函数
  async function translateText() {
    const text = translateInput.value.trim();
    const from = sourceLang.value;
    const to = targetLang.value;

    if (!text) {
      translateResult.innerHTML = '<div class="error">请输入要翻译的文本</div>';
      return;
    }

    // 显示加载状态
    translateResult.innerHTML = '<div class="loading">翻译中...</div>';

    try {
      console.log("开始翻译请求:", {
        text: text,
        from: from,
        to: to,
        apiUrl: translationService.apiUrl,
      });

      const result = await translationService.translate(text, from, to);
      console.log("翻译成功:", result);
      translateResult.textContent = result;
    } catch (error) {
      console.error("翻译错误:", error);

      let errorMessage = "翻译失败";
      if (error.message) {
        errorMessage += ": " + error.message;
      }

      // 添加网络连接提示
      if (error.message === "Failed to fetch") {
        errorMessage +=
          "<br>请确保您已连接到校园网或使用VPN，并且可以访问 trans.neo.edu.cn";
      }

      translateResult.innerHTML = `<div class="error">${errorMessage}</div>`;
    }
  }

  // ===== 单词检索增强（相似度候选） =====

  const LOCAL_WORD_INDEX_KEY = "word_similarity_index_v2";
  const LOCAL_WORD_INDEX_TS_KEY = "word_similarity_index_v2_ts";
  const WORD_INDEX_TTL_MS = 10 * 60 * 1000;
  let localWordIndex = [];
  let selectedReviewDate = "";
  let selectedReviewRangeDays = "";
  let currentHintCandidates = [];
  let activeHintIndex = -1;

  function normalizeWord(raw) {
    return String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z'-]/g, "");
  }

  function levenshteinDistance(a, b) {
    const s = normalizeWord(a);
    const t = normalizeWord(b);
    if (!s) return t.length;
    if (!t) return s.length;

    const dp = Array.from({ length: s.length + 1 }, () =>
      new Array(t.length + 1).fill(0),
    );

    for (let i = 0; i <= s.length; i++) dp[i][0] = i;
    for (let j = 0; j <= t.length; j++) dp[0][j] = j;

    for (let i = 1; i <= s.length; i++) {
      for (let j = 1; j <= t.length; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    return dp[s.length][t.length];
  }

  function calcWordSimilarity(input, candidate) {
    const a = normalizeWord(input);
    const b = normalizeWord(candidate);
    if (!a || !b) return 0;

    const dist = levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length) || 1;
    let score = 1 - dist / maxLen;

    if (b.startsWith(a) || a.startsWith(b)) score += 0.08;
    if (b.includes(a) || a.includes(b)) score += 0.05;

    return Math.max(0, Math.min(1, score));
  }

  function persistLocalWordIndex() {
    localStorage.setItem(LOCAL_WORD_INDEX_KEY, JSON.stringify(localWordIndex));
    localStorage.setItem(LOCAL_WORD_INDEX_TS_KEY, String(Date.now()));
  }

  function upsertWordToLocalIndex(word) {
    const normalized = normalizeWord(word);
    if (!normalized) return;

    const exists = localWordIndex.some((w) => normalizeWord(w) === normalized);
    if (exists) return;

    localWordIndex.push(word);
    if (localWordIndex.length > 20000) {
      localWordIndex = localWordIndex.slice(localWordIndex.length - 20000);
    }
    persistLocalWordIndex();
  }

  async function loadLocalWordIndex() {
    try {
      const raw = localStorage.getItem(LOCAL_WORD_INDEX_KEY);
      localWordIndex = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(localWordIndex)) localWordIndex = [];
    } catch (e) {
      console.error("读取本地相似词索引失败:", e);
      localWordIndex = [];
    }

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("word_data_")) continue;
        const word = key.replace("word_data_", "");
        upsertWordToLocalIndex(word);
      }
    } catch (e) {
      console.error("扫描本地词索引失败:", e);
    }

    const lastTs = Number(localStorage.getItem(LOCAL_WORD_INDEX_TS_KEY) || 0);
    const shouldRefreshFromServer = Date.now() - lastTs > WORD_INDEX_TTL_MS;
    if (shouldRefreshFromServer) {
      await hydrateIndexFromServer();
    }
  }

  async function hydrateIndexFromServer() {
    const endpointCandidates = [
      "http://127.0.0.1:5001/api/word/index?limit=50000",
      "http://127.0.0.1:5001/api/word/list?limit=50000",
      "http://127.0.0.1:5001/api/review/list?limit=50000",
    ];

    for (const url of endpointCandidates) {
      try {
        const resp = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
        });
        if (!resp.ok) continue;

        const data = await resp.json();
        const list = Array.isArray(data.words)
          ? data.words
          : Array.isArray(data.items)
            ? data.items
            : Array.isArray(data)
              ? data
              : [];

        if (!list.length) continue;

        let added = 0;
        list.forEach((item) => {
          const word = typeof item === "string" ? item : item.word;
          if (!word) return;
          if (!isItemEligibleForLists(item)) return;
          const before = localWordIndex.length;
          upsertWordToLocalIndex(word);
          if (localWordIndex.length > before) added++;
        });

        if (added > 0) {
          persistLocalWordIndex();
        } else {
          localStorage.setItem(LOCAL_WORD_INDEX_TS_KEY, String(Date.now()));
        }
        return;
      } catch (e) {
        console.error("加载数据库词索引失败:", e);
      }
    }
  }

  async function getSimilarityCandidates(input, limit = 8) {
    const q = normalizeWord(input);
    if (!q) return [];

    // 首先尝试从ECdict数据库获取相似单词
    try {
      const response = await fetch(
        `http://127.0.0.1:5001/api/word/similar?q=${encodeURIComponent(q)}&limit=${limit * 2}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.words && data.words.length > 0) {
          // 合并本地和ECdict的结果，去重，并按相似度排序
          const localCandidates =
            localWordIndex.length > 0
              ? [
                  ...new Set(
                    localWordIndex.map((w) => normalizeWord(w)).filter(Boolean),
                  ),
                ]
                  .map((candidate) => ({
                    word: candidate,
                    score: calcWordSimilarity(q, candidate),
                  }))
                  .filter((item) => item.score >= 0.34)
              : [];

          // 合并并去重
          const allCandidates = new Map();

          // 先添加ECdict的结果
          data.words.forEach((item) => {
            allCandidates.set(item.word.toLowerCase(), item);
          });

          // 再添加本地的结果（不会覆盖ECdict的结果）
          localCandidates.forEach((item) => {
            if (!allCandidates.has(item.word.toLowerCase())) {
              allCandidates.set(item.word.toLowerCase(), item);
            }
          });

          // 转换回数组并排序
          const finalCandidates = Array.from(allCandidates.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

          return finalCandidates;
        }
      }
    } catch (e) {
      console.error("从ECdict获取相似单词失败:", e);
    }

    // 如果ECdict查询失败，回退到本地
    if (localWordIndex.length === 0) return [];

    const unique = [
      ...new Set(localWordIndex.map((w) => normalizeWord(w)).filter(Boolean)),
    ];
    const scored = unique
      .map((candidate) => ({
        word: candidate,
        score: calcWordSimilarity(q, candidate),
      }))
      .filter((item) => item.score >= 0.34)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  function hideSimilarityHints() {
    if (!similarityHints) return;
    similarityHints.style.display = "none";
    similarityHints.innerHTML = "";
  }

  function renderSimilarityHints(candidates) {
    if (!similarityHints) return;

    if (!candidates || candidates.length === 0) {
      currentHintCandidates = [];
      activeHintIndex = -1;
      hideSimilarityHints();
      return;
    }

    currentHintCandidates = candidates;
    if (activeHintIndex >= currentHintCandidates.length) {
      activeHintIndex = currentHintCandidates.length - 1;
    }

    similarityHints.innerHTML = candidates
      .map(
        (item, idx) => `
          <div class="hint-item ${idx === activeHintIndex ? "active" : ""}" data-word="${item.word}" data-index="${idx}">
            <span>${item.word}</span>
            <span class="hint-score">相似度 ${Math.round(item.score * 100)}%</span>
          </div>
        `,
      )
      .join("");

    similarityHints.style.display = "block";
  }

  function chooseHintByIndex(index) {
    if (index < 0 || index >= currentHintCandidates.length) return;
    const pickedWord = currentHintCandidates[index].word;
    if (!pickedWord) return;
    wordInput.value = pickedWord;
    hideSimilarityHints();
    searchWord(pickedWord);
  }

  function moveActiveHint(step) {
    if (!currentHintCandidates.length) return;
    if (activeHintIndex < 0) {
      activeHintIndex = step > 0 ? 0 : currentHintCandidates.length - 1;
    } else {
      activeHintIndex =
        (activeHintIndex + step + currentHintCandidates.length) %
        currentHintCandidates.length;
    }
    renderSimilarityHints(currentHintCandidates);
  }

  function bindSimilarityInput() {
    if (!wordInput) return;

    let debounceTimer = null;

    wordInput.addEventListener("input", async function () {
      activeHintIndex = -1;
      const value = wordInput.value.trim();
      if (!value) {
        hideSimilarityHints();
        return;
      }

      // 防抖处理，避免频繁请求
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(async () => {
        const candidates = await getSimilarityCandidates(value, 8);
        renderSimilarityHints(candidates);
      }, 300); // 300ms延迟
    });

    wordInput.addEventListener("keydown", function (e) {
      if (!currentHintCandidates.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveActiveHint(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveActiveHint(-1);
      } else if (e.key === "Enter" && activeHintIndex >= 0) {
        e.preventDefault();
        chooseHintByIndex(activeHintIndex);
      } else if (e.key === "Escape") {
        hideSimilarityHints();
      }
    });

    if (similarityHints) {
      similarityHints.addEventListener("click", function (e) {
        const target = e.target.closest(".hint-item");
        if (!target) return;
        const pickedIndex = Number(target.dataset.index || -1);
        if (pickedIndex < 0) return;
        chooseHintByIndex(pickedIndex);
      });
    }
  }

  // ===== 单词复习相关逻辑 =====

  function calcReviewPriority(item) {
    const reviewCount = Number(item.review_count || 0);
    const masterLevel = Number(item.master_level || 0);
    const hasMnemonic = Number(item.custom_mnemonics_count || 0) > 0;

    // 行业常见做法：优先低掌握度 + 高遗忘风险词；无记忆线索词适当提前
    let score = 0;
    score += (1 - Math.min(Math.max(masterLevel, 0), 1)) * 100;
    score += Math.min(reviewCount, 20) * 2;
    if (!hasMnemonic) score += 10;

    return score;
  }

  function pickBestReviewWord(words) {
    if (!Array.isArray(words) || words.length === 0) return null;

    const sorted = [...words].sort((a, b) => {
      return calcReviewPriority(b) - calcReviewPriority(a);
    });

    return sorted[0] || null;
  }

  async function loadReviewDayOptions() {
    if (!reviewDaySelect) return;

    const oldValue = reviewDaySelect.value;
    reviewDaySelect.innerHTML = '<option value="">全部日期</option>';

    try {
      const resp = await fetch(
        "http://127.0.0.1:5001/api/review/list?limit=300",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
        },
      );

      if (!resp.ok) return;

      const list = await resp.json();
      const words = (Array.isArray(list.words) ? list.words : []).filter(
        (item) => isItemEligibleForLists(item),
      );
      const dateSet = new Set();

      words.forEach((item) => {
        const d = parseItemDate(item);
        if (!d) return;
        const day = d.toISOString().slice(0, 10);
        dateSet.add(day);
      });

      [...dateSet]
        .sort((a, b) => (a < b ? 1 : -1))
        .forEach((day) => {
          const opt = document.createElement("option");
          opt.value = day;
          opt.textContent = day;
          reviewDaySelect.appendChild(opt);
        });

      if (oldValue && [...dateSet].includes(oldValue)) {
        reviewDaySelect.value = oldValue;
        selectedReviewDate = oldValue;
      }
    } catch (e) {
      console.error("加载复习日期选项失败:", e);
    }
  }

  function parseItemDate(item) {
    const raw =
      item.added_at || item.created_at || item.created_time || item.inserted_at;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  function filterWordsBySelectedDate(words) {
    const filteredByDefinition = words.filter((item) =>
      isItemEligibleForLists(item),
    );

    let result = filteredByDefinition;

    if (selectedReviewRangeDays) {
      const days = Number(selectedReviewRangeDays);
      const now = Date.now();
      const threshold = now - days * 24 * 60 * 60 * 1000;
      result = result.filter((item) => {
        const d = parseItemDate(item);
        if (!d) return false;
        return d.getTime() >= threshold;
      });
    }

    if (selectedReviewDate) {
      result = result.filter((item) => {
        const d = parseItemDate(item);
        if (!d) return false;
        return d.toISOString().slice(0, 10) === selectedReviewDate;
      });
    }

    return result;
  }

  async function loadNextReviewWord() {
    if (!reviewLoading || !reviewError || !reviewCardContainer) return;
    reviewError.style.display = "none";
    reviewLoading.style.display = "block";
    reviewCardContainer.innerHTML = "";

    try {
      const resp = await fetch(
        "http://127.0.0.1:5001/api/review/list?limit=300",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
        },
      );

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(text || resp.statusText);
      }

      const list = await resp.json();
      const allWords = Array.isArray(list.words) ? list.words : [];
      if (allWords.length === 0) {
        reviewLoading.style.display = "none";
        reviewCardContainer.innerHTML =
          '<div class="loading-message">当前没有需要复习的单词。</div>';
        return;
      }

      const words = filterWordsBySelectedDate(allWords);
      if (words.length === 0) {
        reviewLoading.style.display = "none";
        reviewCardContainer.innerHTML =
          '<div class="loading-message">当前筛选日期下没有可复习单词。</div>';
        return;
      }

      const item = pickBestReviewWord(words);
      if (!item || !item.word) {
        reviewLoading.style.display = "none";
        reviewCardContainer.innerHTML =
          '<div class="loading-message">当前没有可用复习词。</div>';
        return;
      }

      const detailResp = await fetch(
        `http://127.0.0.1:5001/api/word/${encodeURIComponent(item.word)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
        },
      );

      if (!detailResp.ok) {
        const text = await detailResp.text().catch(() => "");
        throw new Error(text || detailResp.statusText);
      }

      const detail = await detailResp.json();
      if (!hasValidDefinitions(detail)) {
        reviewCardContainer.innerHTML =
          '<div class="loading-message">当前筛选条件下没有带释义的可复习单词。</div>';
        return;
      }
      renderReviewCard(detail);
    } catch (e) {
      reviewCardContainer.innerHTML = "";
      reviewError.style.display = "block";
      reviewError.textContent =
        "加载复习单词失败，请检查本地服务器是否已启动。";
      console.error("加载复习单词失败:", e);
    } finally {
      reviewLoading.style.display = "none";
    }
  }

  function renderReviewCard(data) {
    if (!reviewCardContainer) return;

    const defs = (data.definitions || []).slice(0, 3);
    const customMnemonics = data.custom_mnemonics || [];

    let defsHtml = "";
    defs.forEach((def) => {
      defsHtml += `<li><strong>${def.part_of_speech || def.pos || ""}</strong>: ${
        def.meaning || def.def || ""
      }</li>`;
    });
    if (!defsHtml) {
      defsHtml =
        '<li class="mnemonic-content">暂无释义，请稍后重试或手动添加。</li>';
    }

    let mnsHtml = "";
    if (customMnemonics.length > 0) {
      mnsHtml = customMnemonics
        .map(
          (m, index) => `
          <li>
            <div class="mnemonic-content">${index + 1}. ${m.text || ""}</div>
            ${
              m.explanation
                ? `<div class="mnemonic-explanation">${m.explanation}</div>`
                : ""
            }
          </li>
        `,
        )
        .join("");
    } else {
      mnsHtml =
        '<li class="mnemonic-content">还没有自定义联想记忆，可以在网页或这里添加。</li>';
    }

    reviewCardContainer.innerHTML = `
      <div class="card-header">
        <div class="word-info">
          <h3 class="word">${data.word}</h3>
          ${data.phonetic ? `<div class="phonetic">${data.phonetic}</div>` : ""}
        </div>
      </div>
      <div class="card-body">
        <div class="card-section">
          <h4>📖 常见释义</h4>
          <ul class="meanings-list">
            ${defsHtml}
          </ul>
        </div>
        <div class="card-section">
          <h4>💡 联想记忆</h4>
          <div class="mnemonics-list">
            <div id="popupMnemonicToggle" class="mnemonic-content" style="cursor:pointer;">
              已保存 ${customMnemonics.length} 条联想记忆，点击展开
            </div>
            <ul id="popupMnemonicContent" style="display:none;margin-top:6px;">
              ${mnsHtml}
            </ul>
          </div>
        </div>
        <div class="card-section">
          <h4>📊 学习统计</h4>
          <div class="review-stats">
            <div class="stat-item">
              <span class="stat-label">复习次数:</span>
              <span class="stat-value">${data.review_count ?? 0}</span>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button class="action-btn primary review-diff-btn" data-word="${
            data.word
          }" data-difficulty="1">很容易</button>
          <button class="action-btn review-diff-btn" data-word="${
            data.word
          }" data-difficulty="2">一般</button>
          <button class="action-btn review-diff-btn" data-word="${
            data.word
          }" data-difficulty="3">有点难</button>
          <button class="action-btn review-diff-btn" data-word="${
            data.word
          }" data-difficulty="4">完全忘了</button>
          <button class="action-btn add-mnemonic-btn" data-word="${
            data.word
          }">➕ 添加联想记忆</button>
        </div>
      </div>
    `;

    const toggle = document.getElementById("popupMnemonicToggle");
    const content = document.getElementById("popupMnemonicContent");
    if (toggle && content) {
      toggle.addEventListener("click", () => {
        const hidden = content.style.display === "none";
        content.style.display = hidden ? "block" : "none";
        toggle.textContent = hidden
          ? "点击收起联想记忆"
          : `已保存 ${customMnemonics.length} 条联想记忆，点击展开`;
      });
    }
  }

  function hasValidDefinitions(data) {
    if (
      !data ||
      !Array.isArray(data.definitions) ||
      data.definitions.length === 0
    ) {
      return false;
    }

    return data.definitions.some((def) => {
      const meaning = (
        def && (def.meaning || def.def) ? String(def.meaning || def.def) : ""
      ).trim();
      return meaning.length > 0;
    });
  }

  function isItemEligibleForLists(item) {
    if (!item) return false;
    if (typeof item === "string") return normalizeWord(item).length > 0;

    if (Array.isArray(item.definitions)) {
      return hasValidDefinitions(item);
    }

    if (item.has_definitions === false || item.has_meaning === false) {
      return false;
    }

    return normalizeWord(item.word || "").length > 0;
  }

  // 单词查询函数
  async function searchWord(overrideWord = "") {
    const word = (overrideWord || wordInput.value || "").trim();

    if (!word) {
      resultDiv.innerHTML = '<div class="error-message">请输入单词</div>';
      return;
    }

    hideSimilarityHints();

    // 显示加载状态
    resultDiv.innerHTML = '<div class="loading-message">查询中...</div>';

    try {
      console.log(`🔍 查询单词: ${word}`);
      const response = await fetch(
        `http://127.0.0.1:5001/api/word/${encodeURIComponent(word)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
        },
      );

      console.log("📡 服务器响应:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();

        if (!hasValidDefinitions(data)) {
          const candidates = await getSimilarityCandidates(word, 8);
          if (candidates.length > 0) {
            renderSimilarityHints(candidates);
            resultDiv.innerHTML =
              '<div class="error-message">未找到完全匹配单词，可从下方相似候选中选择。</div>';
          } else {
            resultDiv.innerHTML =
              '<div class="error-message">未找到该单词释义，该词不会加入复习计划。</div>';
          }
          return;
        }

        upsertWordToLocalIndex(data.word || word);
        displayResult(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `查询失败: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("❌ 查询错误:", error.message);
      resultDiv.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
  }

  // 显示查询结果
  function displayResult(data) {
    if (!data || !data.word) {
      resultDiv.innerHTML = '<div class="error-message">未找到单词信息</div>';
      return;
    }

    let html = `
      <div class="card-header">
        <div class="word-info">
          <h3 class="word">${data.word}</h3>
          ${data.phonetic ? `<div class="phonetic">${data.phonetic}</div>` : ""}
        </div>
        <button class="close-btn" data-action="close">✕</button>
      </div>
      <div class="card-body">
    `;

    // 显示释义（只显示前3个常见释义）
    if (data.definitions && data.definitions.length > 0) {
      const commonDefinitions = data.definitions.slice(0, 3); // 只保留前3个释义
      html += `
        <div class="card-section">
          <h4>📖 常见释义</h4>
          <ul class="meanings-list">
            ${commonDefinitions
              .map(
                (def) =>
                  `<li><strong>${def.part_of_speech || def.pos}</strong>: ${
                    def.meaning || def.def
                  }</li>`,
              )
              .join("")}
          </ul>
        </div>
      `;
    }

    // 显示复习次数
    if (data.review_count !== undefined) {
      html += `
        <div class="card-section">
          <h4>📊 学习统计</h4>
          <div class="review-stats">
            <div class="stat-item">
              <span class="stat-label">复习次数:</span>
              <span class="stat-value">${data.review_count}</span>
            </div>
          </div>
        </div>
      `;
    }

    // 显示联想记忆
    if (data.custom_mnemonics && data.custom_mnemonics.length > 0) {
      html += `
        <div class="card-section">
          <h4>💡 联想记忆</h4>
          <ul class="mnemonics-list">
            ${data.custom_mnemonics
              .map(
                (mnemonic, index) => `
              <li>
                <div class="mnemonic-content">${index + 1}. ${
                  mnemonic.text
                }</div>
                ${
                  mnemonic.explanation
                    ? `<div class="mnemonic-explanation">${mnemonic.explanation}</div>`
                    : ""
                }
              </li>
            `,
              )
              .join("")}
          </ul>
        </div>
      `;
    }

    // 添加功能按钮
    html += `
        <div class="card-actions">
          <button class="action-btn primary add-mnemonic-btn" data-word="${data.word}">➕ 添加联想记忆</button>
          <button class="action-btn record-review-btn" data-word="${data.word}">📊 记录复习</button>
        </div>
      </div>
    `;
    resultDiv.innerHTML = html;
  }

  // 绑定事件
  searchBtn.addEventListener("click", () => searchWord());

  // 回车键查询
  wordInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchWord();
    }
  });

  if (reviewFilterBtn && reviewDaySelect) {
    reviewFilterBtn.addEventListener("click", () => {
      selectedReviewDate = reviewDaySelect.value || "";
      loadNextReviewWord();
    });

    reviewDaySelect.addEventListener("change", () => {
      selectedReviewDate = reviewDaySelect.value || "";
      if (selectedReviewDate) {
        selectedReviewRangeDays = "";
        if (reviewRangeRow) {
          reviewRangeRow
            .querySelectorAll(".review-range-btn")
            .forEach((btn) => btn.classList.remove("active"));
        }
      }
    });
  }

  if (reviewRangeRow) {
    reviewRangeRow.addEventListener("click", (e) => {
      const btn = e.target.closest(".review-range-btn");
      if (!btn) return;

      const days = btn.dataset.days || "";
      const isSame = selectedReviewRangeDays === days;

      reviewRangeRow
        .querySelectorAll(".review-range-btn")
        .forEach((item) => item.classList.remove("active"));

      if (isSame) {
        selectedReviewRangeDays = "";
      } else {
        selectedReviewRangeDays = days;
        btn.classList.add("active");
        selectedReviewDate = "";
        if (reviewDaySelect) reviewDaySelect.value = "";
      }
    });
  }

  bindSimilarityInput();
  loadLocalWordIndex();
  loadReviewDayOptions();

  // 委托事件监听器 - 添加联想记忆按钮和关闭按钮
  resultDiv.addEventListener("click", function (e) {
    if (e.target.classList.contains("add-mnemonic-btn")) {
      const word = e.target.dataset.word;
      showAddMnemonicForm(word);
    } else if (e.target.classList.contains("close-btn")) {
      resultDiv.innerHTML = "";
    }
  });

  // 委托事件监听器 - 记录复习按钮
  resultDiv.addEventListener("click", function (e) {
    if (e.target.classList.contains("record-review-btn")) {
      const word = e.target.dataset.word;
      recordReview(word);
    }
  });

  // 复习卡片中的难度按钮
  if (reviewCardContainer) {
    reviewCardContainer.addEventListener("click", function (e) {
      const target = e.target;
      if (target.classList.contains("review-diff-btn")) {
        const word = target.dataset.word;
        const difficulty = parseInt(target.dataset.difficulty || "2", 10);
        (async () => {
          try {
            await fetch("http://127.0.0.1:5001/api/review", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                word: word,
                difficulty: difficulty,
              }),
              mode: "cors",
            });
            alert("复习记录成功！");
            loadNextReviewWord();
          } catch (error) {
            console.error("❌ 记录复习出错:", error);
            alert("记录失败，请检查服务器连接。");
          }
        })();
      }
    });
  }

  // 显示添加联想记忆表单
  function showAddMnemonicForm(word) {
    // 创建表单元素
    const formElement = document.createElement("div");
    formElement.className = "add-mnemonic-form";

    formElement.innerHTML = `
      <div class="form-header">
        <h3>添加联想记忆 - ${word}</h3>
        <button class="close-btn">✕</button>
      </div>
      <div class="form-body">
        <div class="form-group">
          <label for="mnemonic-text">联想记忆:</label>
          <textarea id="mnemonic-text" placeholder="请输入联想记忆..." rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="mnemonic-explanation">解释:</label>
          <textarea id="mnemonic-explanation" placeholder="请输入解释..." rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="mnemonic-private"> 设为私有
          </label>
        </div>
        <div class="form-actions">
          <button class="action-btn primary submit-btn" data-word="${word}">提交</button>
          <button class="action-btn cancel-btn">取消</button>
        </div>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(formElement);

    // 绑定表单事件
    formElement.querySelector(".close-btn").addEventListener("click", () => {
      formElement.parentNode.removeChild(formElement);
    });

    formElement.querySelector(".cancel-btn").addEventListener("click", () => {
      formElement.parentNode.removeChild(formElement);
    });

    formElement.querySelector(".submit-btn").addEventListener("click", () => {
      const mnemonicText = document
        .getElementById("mnemonic-text")
        .value.trim();
      const mnemonicExplanation = document
        .getElementById("mnemonic-explanation")
        .value.trim();
      const isPrivate = document.getElementById("mnemonic-private").checked;

      if (mnemonicText) {
        submitMnemonicForm(
          word,
          mnemonicText,
          mnemonicExplanation,
          isPrivate,
          formElement,
        );
      } else {
        alert("请输入联想记忆内容");
      }
    });
  }

  // 提交联想记忆表单
  async function submitMnemonicForm(
    word,
    mnemonic,
    explanation,
    isPrivate,
    formElement,
  ) {
    try {
      const response = await fetch("http://127.0.0.1:5001/api/mnemonic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word,
          mnemonic: mnemonic,
          explanation: explanation,
          private: isPrivate,
        }),
        mode: "cors",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ 联想记忆添加成功:", data);
        alert("联想记忆添加成功！");

        // 重新查询单词，更新结果
        searchWord();
      } else {
        const errorData = await response.json();
        console.error("❌ 联想记忆添加失败:", errorData);
        alert(`添加失败: ${errorData.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("❌ 提交联想记忆出错:", error);
      alert("提交失败，请检查服务器连接。");
    } finally {
      // 关闭表单
      if (formElement && formElement.parentNode) {
        formElement.parentNode.removeChild(formElement);
      }
    }
  }

  // 记录复习
  async function recordReview(word) {
    try {
      const response = await fetch("http://127.0.0.1:5001/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word,
          difficulty: 2, // 默认难度
        }),
        mode: "cors",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ 复习记录成功:", data);
        alert("复习记录成功！");

        // 重新查询单词，更新结果
        searchWord();
      } else {
        const errorData = await response.json();
        console.error("❌ 复习记录失败:", errorData);
        alert(`记录失败: ${errorData.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("❌ 记录复习出错:", error);
      alert("记录失败，请检查服务器连接。");
    }
  }
});
