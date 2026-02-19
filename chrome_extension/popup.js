document.addEventListener("DOMContentLoaded", function () {
  // 获取DOM元素
  const wordInput = document.getElementById("wordInput");
  const searchBtn = document.getElementById("searchBtn");
  const resultDiv = document.getElementById("result");

  // 单词查询函数
  async function searchWord() {
    const word = wordInput.value.trim();

    if (!word) {
      resultDiv.innerHTML = '<div class="error-message">请输入单词</div>';
      return;
    }

    // 显示加载状态
    resultDiv.innerHTML = '<div class="loading-message">查询中...</div>';

    try {
      console.log(`🔍 查询单词: ${word}`);
      const response = await fetch(
        `http://127.0.0.1:5000/api/word/${encodeURIComponent(word)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
        }
      );

      console.log("📡 服务器响应:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        displayResult(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `查询失败: ${response.status} ${response.statusText}`
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
                  }</li>`
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
            `
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
  searchBtn.addEventListener("click", searchWord);

  // 回车键查询
  wordInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchWord();
    }
  });

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
          formElement
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
    formElement
  ) {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/mnemonic", {
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
      const response = await fetch("http://127.0.0.1:5000/api/review", {
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
