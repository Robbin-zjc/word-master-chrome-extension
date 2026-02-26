# Word Master“不止于查询单词，更让您轻松记住单词”

一个功能强大的英语学习助手，支持本地词典查询、在线 API 集成、Chrome 浏览器插件等功能。

## 🚀 功能特性

- **本地词典查询**：基于 ECDICT 数据库，离线快速查询单词释义
- **在线词典 API 集成**：支持多种在线词典服务，获取更丰富的单词信息
- **Chrome 浏览器插件**：支持网页划词查询，提升学习效率
- **单词记忆与复习**：基于间隔重复算法，优化记忆效果
- **API 服务**：提供 RESTful API 接口，方便集成到其他应用

## 📦 安装与使用

### 环境要求

- Python 3.8+
- pip

### 安装步骤

1. **克隆仓库**

   ```bash
   git clone https://github.com/your-username/English-Learning-Assistant.git
   cd English-Learning-Assistant
   ```

2. **安装依赖**

   ```bash
   pip install -r requirements.txt
   ```

3. **配置 API 密钥（可选）**
   编辑 `config.json` 文件，填入你的 API 密钥：

   ```json
   {
     "api_keys": {
       "youdao": {
         "app_key": "your_youdao_app_key",
         "app_secret": "your_youdao_app_secret"
       },
       "bing": {
         "subscription_key": "your_bing_subscription_key"
       }
     }
   }
   ```

4. **启动 API 服务器**

   ```bash
   python api_server.py
   ```

5. **安装 Chrome 插件**
   - 打开 Chrome 浏览器，进入 `chrome://extensions/`
   - 开启「开发者模式」
   - 点击「加载已解压的扩展程序」，选择 `chrome_extension` 目录

## 🛠️ 项目结构

```
English-Learning-Assistant/
├── api_server.py          # API服务器
├── english_assistant.py   # 核心功能实现
├── config.json            # 配置文件
├── chrome_extension/      # Chrome浏览器插件
├── requirements.txt       # 依赖包
└── README.md              # 项目说明
```

## 📚 API 文档

### 单词查询

- **URL**: `/api/word/{word}`
- **方法**: GET
- **响应示例**:
  ```json
  {
    "word": "example",
    "phonetic": "/ɪɡˈzɑːmpl/",
    "pos": "n",
    "definitions": "n. 例子；范例；榜样"
  }
  ```

## 🤝 贡献

欢迎提交 Issue 或 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- [ECDICT](https://github.com/skywind3000/ECDICT) - 提供本地词典数据
- [Flask](https://flask.palletsprojects.com/) - API 服务器框架

---

**享受学习英语的乐趣！** 🎉
