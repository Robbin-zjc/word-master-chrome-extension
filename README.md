# English Learning Assistant

一个功能强大的英语学习助手，支持本地词典查询、在线 API 集成、Chrome 浏览器插件等功能。

## 🚀 功能特性

- **本地词典查询**：基于 ECDICT 数据库，离线快速查询单词中文释义
- **在线词典 API 集成**：支持多种在线词典服务，获取更丰富的单词信息
- **Chrome 浏览器插件**：支持网页划词查询，提升学习效率
- **单词记忆与复习**：基于间隔重复算法，优化记忆效果
- **自定义联想记忆**：支持添加和管理单词的联想记忆
- **API 服务**：提供 RESTful API 接口，方便集成到其他应用
- **ECdict 数据库相似单词推荐**：输入字母即可获得基于整个 ECdict 数据库的相似度排序推荐

## 📦 安装与使用

### 环境要求

- Python 3.8+
- pip
- Chrome/Edge 浏览器（如需使用插件）

### 安装步骤

#### 1. 克隆或下载项目

```bash
git clone https://github.com/your-username/English-Learning-Assistant.git
cd English-Learning-Assistant
```

或直接下载项目 ZIP 包并解压。

#### 2. 创建虚拟环境（推荐）

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

#### 3. 安装依赖

```bash
pip install -r requirements.txt
```

#### 4. 配置 ECDICT 数据库（必选）

本项目依赖 ECDICT 数据库提供中文释义，请按以下步骤配置：

##### 方法一：使用预编译的数据库（推荐）

1. 访问 ECDICT 项目的 GitHub 仓库：https://github.com/skywind3000/ECDICT
2. 下载 `ecdict-sqlite-28.zip` 或最新版本的 SQLite 数据库文件
3. 解压下载的文件，找到 `ecdict.db` 数据库文件
4. 将 `ecdict.db` 文件复制到项目根目录（与 `english_assistant.py` 同级）

##### 方法二：从源码构建数据库

如果您想自己构建数据库：

1. 克隆 ECDICT 仓库：
   ```bash
   git clone https://github.com/skywind3000/ECDICT.git
   ```

2. 按照 ECDICT 项目的说明构建 SQLite 数据库

3. 将生成的 `ecdict.db` 复制到项目根目录

##### 验证数据库配置

运行以下脚本检查数据库是否配置正确：

```bash
python inspect_ecdict.py
```

如果能看到数据库表结构和示例数据，说明配置成功。

#### 5. 配置 API 密钥（可选）

如果您想使用在线翻译服务，编辑 `config.json` 文件，填入您的 API 密钥：

```json
{
  "database_path": "english_learning.db",
  "cache_expiry": 3600,
  "api_keys": {
    "youdao": {
      "app_key": "your_youdao_app_key",
      "app_secret": "your_youdao_app_secret"
    },
    "bing": {
      "subscription_key": "your_bing_subscription_key"
    }
  },
  "review_intervals": [1, 3, 7, 14, 30],
  "max_cache_size": 1000,
  "enable_auto_mnemonic": true,
  "enable_custom_mnemonic": true,
  "language": "zh-CN"
}
```

**注意**：即使不配置 API 密钥，项目仍可正常使用 ECDICT 本地数据库查询中文释义。

#### 6. 启动 API 服务器

```bash
python api_server.py
```

服务器启动后，您会看到类似以下输出：

```
🚀 启动API服务器...
📡 服务器地址: http://localhost:5001
📱 浏览器插件可以连接此服务器
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5001
```

#### 7. 安装 Chrome/Edge 浏览器插件

1. 打开 Chrome 或 Edge 浏览器
2. 进入扩展管理页面：
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目中的 `chrome_extension` 目录
6. 插件安装成功！

## 🎯 使用指南

### 浏览器插件使用

1. **双击查询**：在任意网页上双击英文单词，即可弹出单词卡片显示中文释义
2. **插件图标查询**：点击浏览器工具栏中的插件图标，在输入框中输入单词查询
3. **相似单词推荐**：在插件搜索框中输入字母时，会自动从 ECdict 数据库推荐相似单词
4. **添加联想记忆**：在单词卡片中点击「添加联想记忆」按钮
5. **记录复习**：查询单词后可点击「记录复习」来更新学习进度

### API 接口使用

#### 查询单词信息

- **URL**: `http://127.0.0.1:5001/api/word/{word}`
- **方法**: GET
- **响应示例**:
  ```json
  {
    "word": "example",
    "phonetic": "/ɪɡˈzɑːmpl/",
    "definitions": [
      {
        "pos": "noun",
        "part_of_speech": "noun",
        "def": "n. 例子；范例；榜样",
        "meaning": "n. 例子；范例；榜样"
      }
    ],
    "review_count": 0,
    "master_level": 0.0
  }
  ```

#### 搜索相似单词

- **URL**: `http://127.0.0.1:5001/api/word/similar?q={word}&limit={limit}`
- **方法**: GET
- **参数**:
  - `q`: 要搜索的单词（必填）
  - `limit`: 返回结果数量（可选，默认 20）
- **响应示例**:
  ```json
  {
    "words": [
      {"word": "example", "score": 1.0},
      {"word": "examples", "score": 0.88},
      {"word": "examine", "score": 0.75}
    ],
    "count": 3
  }
  ```

## 🛠️ 项目结构

```
English-Learning-Assistant/
├── api_server.py              # API 服务器
├── english_assistant.py       # 核心功能实现
├── config.json                # 配置文件
├── requirements.txt           # 依赖包
├── inspect_ecdict.py          # ECDICT 数据库检查脚本
├── ecdict.db                  # ECDICT 数据库（需要自行配置）
├── english_learning.db        # 用户数据数据库（自动生成）
├── chrome_extension/          # Chrome/Edge 浏览器插件
│   ├── manifest.json          # 插件配置文件
│   ├── popup.html             # 插件弹窗页面
│   ├── popup.js               # 插件弹窗逻辑
│   ├── content.js             # 页面内容脚本
│   ├── styles.css             # 样式文件
│   └── icon.png               # 插件图标
├── templates/                 # Web 控制台模板
└── README.md                  # 项目说明
```

## ⚙️ 配置说明

### config.json 配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| database_path | 用户数据数据库路径 | english_learning.db |
| cache_expiry | 缓存过期时间（秒） | 3600 |
| api_keys.youdao | 有道词典 API 密钥 | 空 |
| api_keys.bing | Bing 词典 API 密钥 | 空 |
| review_intervals | 复习间隔（天） | [1, 3, 7, 14, 30] |
| max_cache_size | 最大缓存大小 | 1000 |
| enable_auto_mnemonic | 是否启用自动生成助记 | true |
| enable_custom_mnemonic | 是否启用自定义助记 | true |
| language | 界面语言 | zh-CN |

## 🔧 常见问题

### Q: 双击单词显示英文释义而不是中文？

A: 请确保：
1. 已正确配置 `ecdict.db` 数据库文件在项目根目录
2. 重启 API 服务器
3. 刷新浏览器页面，重新加载插件

### Q: 插件无法连接到服务器？

A: 请检查：
1. API 服务器是否正常启动（运行 `python api_server.py`）
2. 防火墙是否阻止了 5001 端口
3. 浏览器是否允许访问本地地址

### Q: 相似单词推荐没有结果？

A: 请确认：
1. `ecdict.db` 数据库已正确配置
2. API 服务器已重启
3. 输入的单词拼写正确

### Q: 如何更新 ECDICT 数据库？

A: 下载最新版本的 `ecdict.db` 并替换项目根目录中的旧文件，然后重启 API 服务器即可。

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
- [Flask-CORS](https://flask-cors.readthedocs.io/) - 跨域支持

---

**享受学习英语的乐趣！** 🎉
