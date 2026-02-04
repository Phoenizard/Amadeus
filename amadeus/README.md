# AMADEUS - AI 聊天系统

基于《命运石之门0》的 Amadeus AI 聊天应用。

## 快速开始

### 1. 安装 Python

**Mac 用户：**
打开「终端」应用，输入：
```bash
python3 --version
```
如果显示版本号（如 `Python 3.x.x`），说明已安装。如果没有，请访问 https://www.python.org/downloads/ 下载安装。

**Windows 用户：**
访问 https://www.python.org/downloads/ 下载安装，安装时勾选「Add Python to PATH」。

### 2. 获取 DashScope API Key

1. 访问阿里云 DashScope：https://dashscope.console.aliyun.com/
2. 注册/登录账号
3. 在「API-KEY 管理」中创建 API Key
4. 复制保存 API Key

### 3. 安装依赖

打开终端，进入项目目录：
```bash
cd amadeus
pip3 install -r requirements.txt
```

### 4. 配置 API Key

**方法一：环境变量（推荐）**

Mac/Linux：
```bash
export DASHSCOPE_API_KEY="你的API密钥"
```

Windows：
```cmd
set DASHSCOPE_API_KEY=你的API密钥
```

**方法二：直接修改配置文件**

编辑 `config.py`，找到这一行：
```python
DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "")
```
改为：
```python
DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "你的API密钥")
```

### 5. 启动服务器

```bash
python3 server.py
```

看到以下提示表示启动成功：
```
╔═══════════════════════════════════════════════════════════╗
║                      AMADEUS SYSTEM                       ║
...
服务器已启动: http://localhost:5000
```

### 6. 访问应用

**电脑访问：** 打开浏览器，访问 http://localhost:5000

**手机访问：**
1. 确保手机和电脑连接同一 WiFi
2. 在电脑上查看本机 IP 地址：
   - Mac：系统偏好设置 → 网络 → 查看 IP 地址
   - Windows：打开 cmd，输入 `ipconfig`，找到 IPv4 地址
3. 在手机浏览器输入：`http://你的电脑IP:5000`
4. 可以将网页添加到主屏幕，获得 App 般体验

## 使用本地模型 (Ollama)

如果想使用本地运行的 AI 模型：

1. 安装 Ollama：https://ollama.ai
2. 下载模型：`ollama pull qwen2.5:7b`
3. 修改启动方式：
```bash
export LLM_PROVIDER=ollama
python3 server.py
```

## 常见问题

### Q: 提示"DASHSCOPE_API_KEY 未设置"
A: 请按照步骤 4 正确配置 API Key。

### Q: 手机无法访问
A:
1. 确保手机和电脑在同一 WiFi 网络
2. 检查电脑防火墙是否允许 5000 端口
3. 确认使用的是电脑的局域网 IP（通常是 192.168.x.x）

### Q: AI 响应很慢
A: DashScope API 通常在 5-15 秒内响应。如果超过 30 秒，请检查网络连接。

### Q: 如何修改 AI 的性格？
A: 编辑 `config.py` 中的 `SYSTEM_PROMPT` 变量。

### Q: 如何更换端口？
A: 设置环境变量 `PORT=8080` 或修改 `config.py` 中的 `SERVER_PORT`。

## 文件说明

```
amadeus/
├── server.py          # 服务器程序
├── config.py          # 配置文件（API密钥、模型设置）
├── requirements.txt   # Python 依赖
├── start.sh           # 一键启动脚本
├── static/            # 前端文件
│   ├── index.html     # 主页面
│   ├── style.css      # 样式
│   ├── app.js         # 交互逻辑
│   └── assets/        # 图片资源
└── README.md          # 本文档
```

## 技术支持

如有问题，请提交 Issue 或联系开发者。

---

*El Psy Kongroo.*
