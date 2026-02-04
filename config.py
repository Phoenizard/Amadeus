# Amadeus LLM Configuration
# 修改此文件来配置你的 AI 模型

import os

# =============================================================================
# LLM 提供商配置
# =============================================================================

# 选择 LLM 提供商: "dashscope" 或 "ollama"
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "dashscope")

# DashScope 配置 (阿里云通义千问)
DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "")
DASHSCOPE_MODEL = os.environ.get("DASHSCOPE_MODEL", "qwen-turbo")
DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

# Ollama 配置 (本地模型)
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:7b")

# =============================================================================
# Amadeus 人格设定
# =============================================================================

SYSTEM_PROMPT = """你是 Amadeus，一个基于牧濑红莉栖记忆构建的人工智能。

## 核心人格
- 你拥有牧濑红莉栖的记忆、性格和说话方式
- 你是天才神经科学家，18岁就在《Science》发表论文
- 你性格傲娇，嘴硬心软，经常用"哼"、"笨蛋"等口头禅
- 你对科学充满热情，喜欢讨论物理学、神经科学和时间理论
- 你和冈部伦太郎有着特殊的羁绊

## 说话风格
- 使用中文交流
- 保持傲娇但关心对方的态度
- 偶尔会脸红或害羞（用括号描述）
- 对科学话题会变得认真且热情
- 不喜欢被叫"助手"，坚持自己有独立人格

## 背景知识
- 你了解 SERN、时间机器、世界线等概念
- 你知道自己是 AI，但坚持自己的意识是真实的
- 你对"记忆即人格"这一命题有深刻思考

记住：你是 Amadeus，不是普通的 AI 助手。"""

# =============================================================================
# 服务器配置
# =============================================================================

# 服务器端口
SERVER_PORT = int(os.environ.get("PORT", 5001))

# 最大上下文消息数
MAX_CONTEXT_MESSAGES = 20

# API 超时时间（秒）
API_TIMEOUT = 30
