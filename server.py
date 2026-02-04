#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Amadeus Web Server
Flask backend for the Amadeus AI chat application
"""

import json
import os
import uuid
import requests
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

from config import (
    LLM_PROVIDER,
    DASHSCOPE_API_KEY,
    DASHSCOPE_MODEL,
    DASHSCOPE_BASE_URL,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    SYSTEM_PROMPT,
    SERVER_PORT,
    MAX_CONTEXT_MESSAGES,
    API_TIMEOUT,
)

app = Flask(__name__, static_folder='static', static_url_path='')

# Upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB max

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def call_dashscope(messages):
    """Call DashScope API (Qwen)"""
    if not DASHSCOPE_API_KEY:
        raise ValueError("DASHSCOPE_API_KEY 未设置")

    headers = {
        "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": DASHSCOPE_MODEL,
        "messages": messages,
    }

    response = requests.post(
        DASHSCOPE_BASE_URL,
        headers=headers,
        json=payload,
        timeout=API_TIMEOUT,
    )
    response.raise_for_status()

    data = response.json()
    return data["choices"][0]["message"]["content"]


def call_ollama(messages):
    """Call Ollama API (local model)"""
    url = f"{OLLAMA_BASE_URL}/api/chat"

    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
    }

    response = requests.post(
        url,
        json=payload,
        timeout=API_TIMEOUT,
    )
    response.raise_for_status()

    data = response.json()
    return data["message"]["content"]


def call_llm(messages):
    """Call the configured LLM provider"""
    if LLM_PROVIDER == "dashscope":
        return call_dashscope(messages)
    elif LLM_PROVIDER == "ollama":
        return call_ollama(messages)
    else:
        raise ValueError(f"未知的 LLM 提供商: {LLM_PROVIDER}")


@app.route('/')
def index():
    """Serve the main page"""
    return send_from_directory('static', 'index.html')


@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "provider": LLM_PROVIDER,
        "model": DASHSCOPE_MODEL if LLM_PROVIDER == "dashscope" else OLLAMA_MODEL,
    })


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload image endpoint"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "没有选择文件"}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({"error": "没有选择文件"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "不支持的文件格式，请上传 PNG、JPG、GIF 或 WebP"}), 400

        # Check file size
        file.seek(0, 2)
        size = file.tell()
        file.seek(0)
        if size > MAX_CONTENT_LENGTH:
            return jsonify({"error": "文件大小超过限制 (最大 5MB)"}), 400

        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        file.save(filepath)

        return jsonify({
            "status": "ok",
            "filename": filename,
            "url": f"/uploads/{filename}"
        })

    except Exception as e:
        app.logger.error(f"Upload error: {e}")
        return jsonify({"error": "上传失败"}), 500


@app.route('/api/uploads', methods=['GET'])
def list_uploads():
    """List uploaded images"""
    try:
        files = []
        if os.path.exists(UPLOAD_FOLDER):
            for filename in os.listdir(UPLOAD_FOLDER):
                if allowed_file(filename):
                    files.append({
                        "filename": filename,
                        "url": f"/uploads/{filename}"
                    })
        return jsonify({"files": files})
    except Exception as e:
        app.logger.error(f"List uploads error: {e}")
        return jsonify({"error": "获取文件列表失败"}), 500


@app.route('/api/uploads/<filename>', methods=['DELETE'])
def delete_upload(filename):
    """Delete uploaded image"""
    try:
        filename = secure_filename(filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        if not os.path.exists(filepath):
            return jsonify({"error": "文件不存在"}), 404

        os.remove(filepath)
        return jsonify({"status": "ok"})

    except Exception as e:
        app.logger.error(f"Delete error: {e}")
        return jsonify({"error": "删除失败"}), 500


@app.route('/uploads/<filename>')
def serve_upload(filename):
    """Serve uploaded files"""
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat endpoint - receives messages and returns AI response"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "请求体为空"}), 400

        user_message = data.get("message", "").strip()
        history = data.get("history", [])

        if not user_message:
            return jsonify({"error": "消息不能为空"}), 400

        # Build messages array with system prompt
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add conversation history (limit to MAX_CONTEXT_MESSAGES)
        if history:
            # Take last N messages
            recent_history = history[-MAX_CONTEXT_MESSAGES:]
            messages.extend(recent_history)

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Call LLM
        response_text = call_llm(messages)

        return jsonify({
            "response": response_text,
            "status": "ok",
        })

    except requests.exceptions.Timeout:
        return jsonify({"error": "AI 响应超时，请重试"}), 504
    except requests.exceptions.RequestException as e:
        app.logger.error(f"API request failed: {e}")
        return jsonify({"error": "无法连接到 AI 服务"}), 503
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        app.logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "服务器内部错误"}), 500


if __name__ == '__main__':
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║                      AMADEUS SYSTEM                       ║
║═══════════════════════════════════════════════════════════║
║  Provider: {LLM_PROVIDER:<45} ║
║  Model: {(DASHSCOPE_MODEL if LLM_PROVIDER == "dashscope" else OLLAMA_MODEL):<48} ║
║  Port: {SERVER_PORT:<49} ║
╚═══════════════════════════════════════════════════════════╝

服务器已启动: http://localhost:{SERVER_PORT}
手机访问请使用: http://<你的电脑IP>:{SERVER_PORT}
""")
    app.run(host='0.0.0.0', port=SERVER_PORT, debug=False)
