/**
 * 英语学习助手 - Chrome扩展
 * 功能：在所有网页上快速查询单词，添加联想记忆
 * 版本：1.0
 */

class VideoWordAssistant {
  constructor() {
    this.serverUrl = "http://127.0.0.1:5000";
    this.isServerConnected = false;
    this.selectedText = "";
    this.menuElement = null;
    this.wordCardElement = null;
    this.shortcutKey = "KeyQ";
    this.shortcutModifiers = ["Control"];
    this.currentWord = "";
    this.isMenuVisible = false;
    this.isCardVisible = false;
    this.serverCheckInterval = null;
    this.videoPlatform = this.detectVideoPlatform();

    this.initialize();
  }

  /**
   * 初始化扩展
   */
  async initialize() {
    console.log("🚀 英语学习助手 - 初始化");

    // 检测视频平台
    console.log("📺 检测到视频平台:", this.videoPlatform);

    // 检查服务器连接
    await this.checkServerConnection();

    // 启动定期检查服务器连接
    this.startServerCheck();

    // 绑定事件监听
    this.bindEventListeners();

    // 注入必要的样式
    this.injectStyles();
  }

  /**
   * 检测网页类型
   */
  detectVideoPlatform() {
    const url = window.location.href;
    if (url.includes("youtube.com")) return "youtube";
    if (url.includes("bilibili.com")) return "bilibili";
    if (url.includes("netflix.com")) return "netflix";
    if (url.includes("ted.com")) return "ted";
    return "general";
  }

  /**
   * 检查服务器连接
   */
  async checkServerConnection() {
    try {
      const response = await fetch(`${this.serverUrl}/api/word/test`);
      if (response.ok) {
        this.isServerConnected = true;
        console.log("✅ 服务器连接成功");
      } else {
        this.isServerConnected = false;
        console.log("❌ 服务器连接失败");
      }
    } catch (error) {
      this.isServerConnected = false;
      console.log("❌ 服务器连接错误:", error.message);
    }
  }

  /**
   * 启动定期检查服务器连接
   */
  startServerCheck() {
    this.serverCheckInterval = setInterval(() => {
      this.checkServerConnection();
    }, 30000); // 每30秒检查一次
  }

  /**
   * 绑定事件监听
   */
  bindEventListeners() {
    // 文本选择事件
    document.addEventListener("mouseup", (e) => {
      this.handleTextSelection(e);
    });

    // 双击事件
    document.addEventListener("dblclick", (e) => {
      this.handleDoubleClick(e);
    });

    // 键盘快捷键事件
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcut(e);
    });

    // 点击其他地方关闭菜单和卡片
    document.addEventListener("click", (e) => {
      this.handleOutsideClick(e);
    });

    // 处理视频平台特定事件
    this.bindPlatformSpecificEvents();
  }

  /**
   * 绑定平台特定事件
   */
  bindPlatformSpecificEvents() {
    switch (this.videoPlatform) {
      case "youtube":
        this.bindYouTubeEvents();
        break;
      case "bilibili":
        this.bindBilibiliEvents();
        break;
      default:
        break;
    }
  }

  /**
   * 绑定YouTube特定事件
   */
  bindYouTubeEvents() {
    // 监听字幕变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          this.extractWordsFromSubtitles();
        }
      });
    });

    // 观察字幕容器
    const subtitleContainer = document.querySelector(".captions-text");
    if (subtitleContainer) {
      observer.observe(subtitleContainer, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * 绑定Bilibili特定事件
   */
  bindBilibiliEvents() {
    // 监听字幕变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          this.extractWordsFromSubtitles();
        }
      });
    });

    // 观察字幕容器
    const subtitleContainer = document.querySelector(
      ".bpx-player-subtitle-panel-content"
    );
    if (subtitleContainer) {
      observer.observe(subtitleContainer, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * 处理文本选择
   */
  handleTextSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 1 && selectedText.length < 50) {
      this.selectedText = selectedText;
      //this.showQuickMenu(e.pageX, e.pageY);
    } else {
      this.hideQuickMenu();
    }
  }

  /**
   * 处理双击事件
   */
  handleDoubleClick(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 1 && selectedText.length < 50) {
      this.selectedText = selectedText;
      this.quickLookup(selectedText);
    }
  }

  /**
   * 处理键盘快捷键
   */
  handleKeyboardShortcut(e) {
    // 检查修饰键
    const hasRequiredModifiers = this.shortcutModifiers.every((modifier) => {
      switch (modifier) {
        case "Control":
          return e.ctrlKey;
        case "Shift":
          return e.shiftKey;
        case "Alt":
          return e.altKey;
        default:
          return false;
      }
    });

    if (hasRequiredModifiers && e.code === this.shortcutKey) {
      e.preventDefault();

      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        this.selectedText = selectedText;
        this.quickLookup(selectedText);
      }
    }
  }

  /**
   * 处理点击其他地方关闭菜单和卡片
   */
  handleOutsideClick(e) {
    if (
      this.isMenuVisible &&
      this.menuElement &&
      !this.menuElement.contains(e.target)
    ) {
      this.hideQuickMenu();
    }

    if (
      this.isCardVisible &&
      this.wordCardElement &&
      !this.wordCardElement.contains(e.target)
    ) {
      this.hideWordCard();
    }
  }

  /**
   * 从字幕中提取单词
   */
  extractWordsFromSubtitles() {
    let subtitleText = "";

    switch (this.videoPlatform) {
      case "youtube":
        const youtubeSubtitles = document.querySelector(".captions-text");
        if (youtubeSubtitles) {
          subtitleText = youtubeSubtitles.innerText;
        }
        break;
      case "bilibili":
        const bilibiliSubtitles = document.querySelector(
          ".bpx-player-subtitle-panel-content"
        );
        if (bilibiliSubtitles) {
          subtitleText = bilibiliSubtitles.innerText;
        }
        break;
      case "general":
        // 在普通网页上，不提取字幕，只处理用户选择的文本
        return;
      default:
        break;
    }

    if (subtitleText) {
      const words = this.extractEnglishWords(subtitleText);
      if (words.length > 0) {
        console.log("📝 从字幕中提取到单词:", words);
        // 可以在这里添加单词高亮功能
      }
    }
  }

  /**
   * 提取英语单词
   */
  extractEnglishWords(text) {
    // 正则表达式匹配英语单词
    const wordRegex = /\b[a-zA-Z]{2,}\b/g;
    const words = text.match(wordRegex) || [];
    return [...new Set(words)]; // 去重
  }

  /**
   * 显示快速菜单
   */
  showQuickMenu(x, y) {
    // 隐藏之前的菜单
    this.hideQuickMenu();

    // 创建菜单元素
    this.menuElement = document.createElement("div");
    this.menuElement.className = "video-word-assistant-menu";
    this.menuElement.style.left = `${x}px`;
    this.menuElement.style.top = `${y}px`;

    this.menuElement.innerHTML = `
      <div class="menu-header">
        <strong>英语学习助手</strong>
      </div>
      <div class="menu-body">
        <div class="selected-text">${this.selectedText}</div>
        <div class="menu-buttons">
          <button class="menu-btn query-btn">🔍 查询单词</button>
          <button class="menu-btn add-btn">📝 添加到生词本</button>
          <button class="menu-btn close-btn">✕ 关闭</button>
        </div>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(this.menuElement);

    // 绑定按钮事件
    this.menuElement
      .querySelector(".query-btn")
      .addEventListener("click", () => {
        this.quickLookup(this.selectedText);
      });

    this.menuElement.querySelector(".add-btn").addEventListener("click", () => {
      this.addToWordList(this.selectedText);
    });

    this.menuElement
      .querySelector(".close-btn")
      .addEventListener("click", () => {
        this.hideQuickMenu();
      });

    this.isMenuVisible = true;
  }

  /**
   * 隐藏快速菜单
   */
  hideQuickMenu() {
    if (this.menuElement && this.menuElement.parentNode) {
      this.menuElement.parentNode.removeChild(this.menuElement);
    }
    this.menuElement = null;
    this.isMenuVisible = false;
  }

  /**
   * 快速查询单词
   */
  async quickLookup(word) {
    this.currentWord = word;

    try {
      console.log("🔍 查询单词:", word);

      // 隐藏菜单
      this.hideQuickMenu();

      // 先检查本地存储
      const cachedData = this.getLocalWordData(word);
      if (cachedData) {
        console.log("⚡ 从本地存储获取单词数据:", word);
        this.showWordCard(cachedData);
      }

      // 同时从服务器获取最新数据
      const encodedWord = encodeURIComponent(word);
      const url = `${this.serverUrl}/api/word/${encodedWord}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📚 单词查询结果:", data);

        // 保存到本地存储
        this.saveWordDataToLocal(word, data);
        console.log("💾 单词数据已保存到本地存储:", word);

        // 如果之前没有缓存数据，或者数据有更新，重新显示卡片
        if (!cachedData) {
          this.showWordCard(data);
        }
      } else {
        // 服务器返回错误，尝试使用在线词典API
        console.log("⚠️ 服务器返回错误，尝试使用在线词典API");
        await this.fetchWordFromOnlineAPI(word, cachedData);
      }
    } catch (error) {
      console.error("❌ 查询出错:", error);
      // 如果没有缓存数据，尝试使用在线词典API
      if (!this.getLocalWordData(word)) {
        await this.fetchWordFromOnlineAPI(word, null);
      }
    }
  }

  /**
   * 从在线词典API获取单词数据
   */
  async fetchWordFromOnlineAPI(word, cachedData) {
    try {
      console.log("🌐 从在线词典API查询单词:", word);
      const encodedWord = encodeURIComponent(word);
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodedWord}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📡 在线词典API返回结果:", data);

        // 转换数据格式
        const formattedData = this.formatOnlineDictionaryData(word, data);
        console.log("📋 格式化后的数据:", formattedData);

        // 保存到本地存储
        this.saveWordDataToLocal(word, formattedData);
        console.log("💾 在线词典数据已保存到本地存储:", word);

        // 显示单词卡片
        this.showWordCard(formattedData);
      } else {
        console.error("❌ 在线词典API请求失败:", response.status);
        // 如果在线API也失败，显示本地错误卡片
        this.showWordCardLocal(word);
      }
    } catch (error) {
      console.error("❌ 在线词典API查询出错:", error);
      // 如果在线API也失败，显示本地错误卡片
      this.showWordCardLocal(word);
    }
  }

  /**
   * 格式化在线词典API返回的数据
   */
  formatOnlineDictionaryData(word, apiData) {
    const formattedData = {
      word: word,
      phonetic: "",
      definitions: [],
      custom_mnemonics: [],
    };

    if (apiData && apiData.length > 0) {
      const firstEntry = apiData[0];

      // 获取音标
      if (firstEntry.phonetics && firstEntry.phonetics.length > 0) {
        const phonetic = firstEntry.phonetics.find((p) => p.text);
        if (phonetic) {
          formattedData.phonetic = phonetic.text;
        }
      }

      // 获取释义
      if (firstEntry.meanings && firstEntry.meanings.length > 0) {
        firstEntry.meanings.forEach((meaning) => {
          if (meaning.definitions && meaning.definitions.length > 0) {
            meaning.definitions.forEach((def) => {
              formattedData.definitions.push({
                pos: meaning.partOfSpeech || "",
                def: def.definition || "",
              });
            });
          }
        });
      }
    }

    return formattedData;
  }

  /**
   * 从本地存储获取单词数据
   */
  getLocalWordData(word) {
    try {
      const storageKey = `word_data_${word.toLowerCase()}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error("❌ 从本地存储获取数据失败:", error);
    }
    return null;
  }

  /**
   * 保存单词数据到本地存储
   */
  saveWordDataToLocal(word, data) {
    try {
      const storageKey = `word_data_${word.toLowerCase()}`;
      // 限制存储大小，只保存必要字段
      const dataToStore = {
        word: data.word,
        phonetic: data.phonetic,
        definitions: data.definitions,
        examples: data.examples,
        custom_mnemonics: data.custom_mnemonics,
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error("❌ 保存数据到本地存储失败:", error);
    }
  }

  /**
   * 显示单词卡片
   */
  showWordCard(wordData) {
    // 隐藏之前的卡片
    this.hideWordCard();

    // 创建卡片元素
    this.wordCardElement = document.createElement("div");
    this.wordCardElement.className = "video-word-assistant-card";

    // 卡片内容
    const { word, phonetic, definitions, custom_mnemonics } = wordData;

    // 构建HTML
    let cardHtml = `
      <div class="card-header">
        <div class="word-info">
          <h3 class="word">${word}</h3>
          ${phonetic ? `<div class="phonetic">${phonetic}</div>` : ""}
        </div>
        <button class="close-btn">✕</button>
      </div>
      <div class="card-body">
    `;

    // 添加释义（只显示前3个常见释义）
    if (definitions && definitions.length > 0) {
      const commonDefinitions = definitions.slice(0, 3); // 只保留前3个释义
      cardHtml += `
        <div class="card-section">
          <h4>📖 常见释义</h4>
          <div class="meanings-list">
            ${commonDefinitions
              .map(
                (def) =>
                  `<div class="meaning-item"><strong>${def.pos}</strong>: ${def.def}</div>`
              )
              .join("")}
          </div>
        </div>
      `;
    }

    // 添加复习次数
    if (wordData.review_count !== undefined) {
      cardHtml += `
        <div class="card-section">
          <h4>📊 学习统计</h4>
          <div class="review-stats">
            <div class="stat-item">
              <span class="stat-label">复习次数:</span>
              <span class="stat-value">${wordData.review_count}</span>
            </div>
          </div>
        </div>
      `;
    }

    // 添加自定义助记
    if (custom_mnemonics && custom_mnemonics.length > 0) {
      cardHtml += `
        <div class="card-section">
          <h4>💡 联想记忆</h4>
          <div class="mnemonics-list">
            ${custom_mnemonics
              .map(
                (mnemonic, index) => `
              <div class="mnemonic-item">
                <div class="mnemonic-text">${mnemonic.text}</div>
                ${
                  mnemonic.explanation
                    ? `<div class="mnemonic-explanation">${mnemonic.explanation}</div>`
                    : ""
                }
                <div class="mnemonic-actions">
                  <button class="action-btn use-btn" data-index="${index}">使用</button>
                  <button class="action-btn delete-btn" data-index="${index}">删除</button>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    // 添加功能按钮
    cardHtml += `
        <div class="card-actions">
          <button class="action-btn primary add-mnemonic-btn">➕ 添加联想记忆</button>
          <button class="action-btn record-review-btn">📊 记录复习</button>
        </div>
      </div>
    `;

    this.wordCardElement.innerHTML = cardHtml;

    // 添加到页面
    document.body.appendChild(this.wordCardElement);

    // 定位卡片
    this.positionWordCard();

    // 绑定事件
    this.wordCardElement
      .querySelector(".close-btn")
      .addEventListener("click", () => {
        this.hideWordCard();
      });

    // 绑定添加助记按钮
    const addMnemonicBtn =
      this.wordCardElement.querySelector(".add-mnemonic-btn");
    if (addMnemonicBtn) {
      addMnemonicBtn.addEventListener("click", () => {
        this.showAddMnemonicForm(word);
      });
    }

    // 绑定记录复习按钮
    const recordReviewBtn =
      this.wordCardElement.querySelector(".record-review-btn");
    if (recordReviewBtn) {
      recordReviewBtn.addEventListener("click", () => {
        this.recordReview(word);
      });
    }

    // 绑定自定义助记操作按钮
    const useBtns = this.wordCardElement.querySelectorAll(".use-btn");
    useBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.dataset.index;
        this.useCustomMnemonic(word, index);
      });
    });

    const deleteBtns = this.wordCardElement.querySelectorAll(".delete-btn");
    deleteBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.dataset.index;
        this.deleteCustomMnemonic(word, index);
      });
    });

    this.isCardVisible = true;
  }

  /**
   * 本地显示单词卡片（服务器未连接时）
   */
  showWordCardLocal(word) {
    // 隐藏之前的卡片
    this.hideWordCard();

    // 创建卡片元素
    this.wordCardElement = document.createElement("div");
    this.wordCardElement.className = "video-word-assistant-card";

    // 卡片内容
    this.wordCardElement.innerHTML = `
      <div class="card-header">
        <div class="word-info">
          <h3 class="word">${word}</h3>
        </div>
        <button class="close-btn">✕</button>
      </div>
      <div class="card-body">
        <div class="card-section">
          <h4>⚠️ 服务器未连接</h4>
          <p>请确保本地服务器已启动，然后重试。</p>
          <p>启动方法：运行 start.bat 文件</p>
        </div>
        <div class="card-actions">
          <button class="action-btn primary check-server-btn">🔄 检查连接</button>
        </div>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(this.wordCardElement);

    // 定位卡片
    this.positionWordCard();

    // 绑定事件
    this.wordCardElement
      .querySelector(".close-btn")
      .addEventListener("click", () => {
        this.hideWordCard();
      });

    // 绑定检查连接按钮
    const checkServerBtn =
      this.wordCardElement.querySelector(".check-server-btn");
    if (checkServerBtn) {
      checkServerBtn.addEventListener("click", async () => {
        await this.checkServerConnection();
        if (this.isServerConnected) {
          this.quickLookup(word);
        } else {
          alert("服务器仍然未连接，请检查本地服务器状态。");
        }
      });
    }

    this.isCardVisible = true;
  }

  /**
   * 定位单词卡片
   */
  positionWordCard() {
    if (!this.wordCardElement) return;

    // 计算位置（默认显示在屏幕中央）
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const cardWidth = 400;
    const cardHeight = 500;

    const left = (screenWidth - cardWidth) / 2;
    const top = (screenHeight - cardHeight) / 2;

    this.wordCardElement.style.left = `${left}px`;
    this.wordCardElement.style.top = `${top}px`;
  }

  /**
   * 隐藏单词卡片
   */
  hideWordCard() {
    if (this.wordCardElement && this.wordCardElement.parentNode) {
      this.wordCardElement.parentNode.removeChild(this.wordCardElement);
    }
    this.wordCardElement = null;
    this.isCardVisible = false;
  }

  /**
   * 显示添加联想记忆表单
   */
  showAddMnemonicForm(word) {
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
          <button class="action-btn primary submit-btn">提交</button>
          <button class="action-btn cancel-btn">取消</button>
        </div>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(formElement);

    // 定位表单
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const formWidth = 400;
    const formHeight = 350;

    const left = (screenWidth - formWidth) / 2;
    const top = (screenHeight - formHeight) / 2;

    formElement.style.left = `${left}px`;
    formElement.style.top = `${top}px`;

    // 绑定事件
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
        this.submitMnemonicForm(
          word,
          mnemonicText,
          mnemonicExplanation,
          isPrivate
        );
        formElement.parentNode.removeChild(formElement);
      } else {
        alert("请输入联想记忆内容");
      }
    });
  }

  /**
   * 提交联想记忆表单
   */
  async submitMnemonicForm(word, mnemonic, explanation, isPrivate) {
    try {
      const response = await fetch(`${this.serverUrl}/api/mnemonic`, {
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
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ 联想记忆添加成功:", data);
        alert("联想记忆添加成功！");

        // 删除本地存储中的旧数据，确保重新从服务器获取
        try {
          const storageKey = `word_data_${word.toLowerCase()}`;
          localStorage.removeItem(storageKey);
          console.log("🗑️ 已删除本地存储中的旧数据:", storageKey);
        } catch (e) {
          console.error("❌ 删除本地存储失败:", e);
        }

        // 重新查询单词，更新卡片
        this.quickLookup(word);
      } else {
        const errorData = await response.json();
        console.error("❌ 联想记忆添加失败:", errorData);
        alert(`添加失败: ${errorData.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("❌ 提交联想记忆出错:", error);
      alert("提交失败，请检查服务器连接。");
    }
  }

  /**
   * 记录复习
   */
  async recordReview(word) {
    try {
      const response = await fetch(`${this.serverUrl}/api/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word,
          difficulty: 2, // 默认难度 (1-5，2表示容易)
          review_time: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ 复习记录成功:", data);
        alert("复习记录成功！");

        // 重新查询单词，更新卡片显示
        try {
          // 删除本地存储的旧数据，确保从服务器获取最新数据
          const storageKey = `word_data_${word.toLowerCase()}`;
          localStorage.removeItem(storageKey);
          console.log("🗑️ 已删除本地存储的旧数据:", storageKey);

          // 重新查询单词
          await this.quickLookup(word);
        } catch (localError) {
          console.error("❌ 更新单词数据失败:", localError);
        }
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

  /**
   * 使用自定义助记
   */
  async useCustomMnemonic(word, index) {
    try {
      const response = await fetch(`${this.serverUrl}/api/mnemonic/use`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word,
          mnemonic_index: parseInt(index),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ 使用助记成功:", data);
        alert("助记使用成功！");
      } else {
        const errorData = await response.json();
        console.error("❌ 使用助记失败:", errorData);
        alert(`使用失败: ${errorData.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("❌ 使用助记出错:", error);
      alert("使用失败，请检查服务器连接。");
    }
  }

  /**
   * 删除自定义助记
   */
  async deleteCustomMnemonic(word, index) {
    if (!confirm("确定要删除这个联想记忆吗？")) {
      return;
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/mnemonic`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word,
          mnemonic_index: parseInt(index),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ 删除助记成功:", data);
        alert("助记删除成功！");

        // 删除本地存储中的旧数据，确保重新从服务器获取
        try {
          const storageKey = `word_data_${word.toLowerCase()}`;
          localStorage.removeItem(storageKey);
          console.log("🗑️ 已删除本地存储中的旧数据:", storageKey);
        } catch (e) {
          console.error("❌ 删除本地存储失败:", e);
        }

        // 重新查询单词，更新卡片
        this.quickLookup(word);
      } else {
        const errorData = await response.json();
        console.error("❌ 删除助记失败:", errorData);
        alert(`删除失败: ${errorData.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("❌ 删除助记出错:", error);
      alert("删除失败，请检查服务器连接。");
    }
  }

  /**
   * 添加到生词本
   */
  async addToWordList(word) {
    try {
      const response = await fetch(`${this.serverUrl}/api/word`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ 添加到生词本成功:", data);
        alert("添加到生词本成功！");
        this.hideQuickMenu();
      } else {
        const errorData = await response.json();
        console.error("❌ 添加到生词本失败:", errorData);
        alert(`添加失败: ${errorData.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("❌ 添加到生词本出错:", error);
      alert("添加失败，请检查服务器连接。");
    }
  }

  /**
   * 检查服务器连接
   */
  async checkServerConnection() {
    try {
      console.log("🔍 检查服务器连接...");
      const response = await fetch(`${this.serverUrl}/api/word/test`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
      });
      console.log("📡 服务器响应:", response.status, response.statusText);
      if (response.ok) {
        this.isServerConnected = true;
        console.log("✅ 服务器连接成功");
      } else {
        this.isServerConnected = false;
        console.log("❌ 服务器连接失败:", response.status, response.statusText);
      }
    } catch (error) {
      this.isServerConnected = false;
      console.log("❌ 服务器连接错误:", error.message);
      console.log("🔧 错误详情:", error);
    }
    return this.isServerConnected;
  }

  /**
   * 启动定期检查服务器连接
   */
  startServerCheck() {
    this.serverCheckInterval = setInterval(() => {
      this.checkServerConnection();
    }, 30000); // 每30秒检查一次
  }

  /**
   * 注入必要的样式
   */
  injectStyles() {
    // 检查是否已经注入样式
    if (document.getElementById("video-word-assistant-styles")) {
      return;
    }

    // 创建样式元素
    const styleElement = document.createElement("style");
    styleElement.id = "video-word-assistant-styles";

    // 样式内容
    styleElement.textContent = `
      /* 快速菜单样式 */
      .video-word-assistant-menu {
        position: fixed;
        z-index: 999999;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        width: 250px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      
      .menu-header {
        padding: 10px 15px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        border-radius: 8px 8px 0 0;
      }
      
      .menu-header strong {
        color: #333;
      }
      
      .menu-body {
        padding: 10px;
      }
      
      .selected-text {
        padding: 8px;
        background: #f9f9f9;
        border-radius: 4px;
        margin-bottom: 10px;
        font-size: 14px;
        color: #333;
      }
      
      .menu-buttons {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .menu-btn {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      }
      
      .query-btn {
        background: #1a73e8;
        color: white;
      }
      
      .query-btn:hover {
        background: #1557b0;
      }
      
      .add-btn {
        background: #34a853;
        color: white;
      }
      
      .add-btn:hover {
        background: #2d8f47;
      }
      
      .close-btn {
        background: #f8f9fa;
        color: #333;
        border: 1px solid #ddd;
      }
      
      .close-btn:hover {
        background: #e9ecef;
      }
      
      /* 手动查询样式 */
      .menu-section {
        margin-bottom: 15px;
        padding: 10px;
        background: #f9f9f9;
        border-radius: 4px;
      }
      
      .menu-section h4 {
        margin: 0 0 8px 0;
        font-size: 12px;
        color: #666;
        font-weight: 600;
      }
      
      .input-group {
        display: flex;
        gap: 5px;
      }
      
      .word-input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }
      
      .manual-query-btn {
        background: #1a73e8;
        color: white;
        white-space: nowrap;
      }
      
      .manual-query-btn:hover {
        background: #1557b0;
      }
      
      /* 单词卡片样式 */
      .video-word-assistant-card {
        position: fixed;
        z-index: 999999;
        background: white;
        border: 1px solid #ddd;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        width: 400px;
        max-height: 500px;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      
      .card-header {
        padding: 15px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        border-radius: 10px 10px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .word-info {
        flex: 1;
      }
      
      .word {
        margin: 0;
        font-size: 20px;
        color: #333;
      }
      
      .phonetic {
        font-size: 14px;
        color: #666;
        margin-top: 4px;
      }
      
      .card-body {
        padding: 15px;
      }
      
      .card-section {
        margin-bottom: 20px;
      }
      
      .card-section h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #555;
        font-weight: 600;
      }
      
      .meanings-list {
        padding: 0;
        margin: 0;
      }
      
      .meaning-item {
        padding: 6px 0;
        border-bottom: 1px solid #f0f0f0;
        font-size: 14px;
        color: #333;
      }
      
      .meaning-item:last-child {
        border-bottom: none;
      }
      
      .mnemonics-list {
        padding: 0;
        margin: 0;
      }
      
      .mnemonic-item {
        padding: 10px;
        background: #f9f9f9;
        border-radius: 4px;
        margin-bottom: 10px;
      }
      
      .mnemonic-item:last-child {
        margin-bottom: 0;
      }
      
      .auto-mnemonic,
      .mnemonic-text {
        padding: 10px;
        background: #f9f9f9;
        border-radius: 4px;
        font-size: 14px;
        color: #333;
        margin-bottom: 5px;
      }
      
      .mnemonic-explanation {
        padding: 5px 10px;
        background: #f0f0f0;
        border-radius: 4px;
        font-size: 12px;
        color: #666;
        margin-bottom: 10px;
      }
      
      .mnemonic-actions {
        display: flex;
        gap: 5px;
        margin-top: 10px;
      }
      
      .card-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #ddd;
      }
      
      .action-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      }
      
      .action-btn.primary {
        background: #1a73e8;
        color: white;
        flex: 1;
      }
      
      .action-btn.primary:hover {
        background: #1557b0;
      }
      
      .action-btn:hover {
        background: #e9ecef;
      }
      
      /* 添加联想记忆表单样式 */
      .add-mnemonic-form {
        position: fixed;
        z-index: 999999;
        background: white;
        border: 1px solid #ddd;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      
      .form-header {
        padding: 15px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        border-radius: 10px 10px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .form-header h3 {
        margin: 0;
        font-size: 16px;
        color: #333;
      }
      
      .form-body {
        padding: 15px;
      }
      
      .form-group {
        margin-bottom: 15px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-size: 14px;
        color: #555;
        font-weight: 500;
      }
      
      .form-group input,
      .form-group textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }
      
      .form-group textarea {
        resize: vertical;
      }
      
      .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      
      /* 学习统计样式 */
      .review-stats {
        background: #f9f9f9;
        border-radius: 6px;
        padding: 12px;
        margin-top: 15px;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding: 5px 0;
        border-bottom: 1px solid #eee;
      }

      .stat-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .stat-label {
        font-size: 13px;
        color: #333;
        font-weight: bold;
      }

      .stat-value {
        font-size: 13px;
        color: #1a73e8;
        font-weight: bold;
      }

      /* 响应式设计 */
      @media (max-width: 768px) {
        .video-word-assistant-menu {
          width: 200px;
        }
        
        .video-word-assistant-card {
          width: 90vw;
          max-width: 400px;
        }
        
        .add-mnemonic-form {
          width: 90vw;
          max-width: 400px;
        }
      }
    `;

    // 添加到页面
    document.head.appendChild(styleElement);
  }
}

// 初始化扩展
console.log("🚀 英语学习助手 - 加载中...");

// 等待DOM加载完成
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new VideoWordAssistant();
  });
} else {
  new VideoWordAssistant();
}
