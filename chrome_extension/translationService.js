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
  async translate(text, from = 'auto', to = 'en') {
    try {
      const response = await fetch(`${this.apiUrl}?apikey=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: from,
          to: to,
          src_text: text
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.length > 0) {
          const sentences = data.data[0].sentences;
          if (sentences && sentences.length > 0) {
            return sentences[0].data;
          }
        }
        throw new Error('翻译失败: 无效的响应格式');
      } else {
        throw new Error(`翻译失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('翻译API错误:', error);
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'auto',
          to: 'en',
          src_text: text
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.length > 0) {
          const sentences = data.data[0].sentences;
          if (sentences && sentences.length > 0) {
            return sentences[0].sourceLanguageAbbreviation;
          }
        }
        throw new Error('语言检测失败: 无效的响应格式');
      } else {
        throw new Error(`语言检测失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('语言检测API错误:', error);
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
  async batchTranslate(texts, from = 'auto', to = 'en') {
    const promises = texts.map(text => this.translate(text, from, to));
    return Promise.all(promises);
  }

  /**
   * 获取支持的语言列表
   * @returns {Object} - 支持的语言列表
   */
  getSupportedLanguages() {
    return {
      'auto': '自动检测',
      'zh': '中文',
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'ru': '俄语',
      'es': '西班牙语',
      'ar': '阿拉伯语',
      'pt': '葡萄牙语',
      'it': '意大利语',
      'nl': '荷兰语',
      'pl': '波兰语',
      'th': '泰语',
      'vi': '越南语',
      'id': '印尼语',
      'ms': '马来语',
      'hi': '印地语'
    };
  }
}

// 导出单例
const translationService = new TranslationService();
export default translationService;