/**
 * Amadeus Web App - Frontend Logic
 * iOS 15 Safari Compatible (ES2020)
 */

(function() {
    'use strict';

    // DOM Elements
    var splash = document.getElementById('splash');
    var app = document.getElementById('app');
    var statusDot = document.getElementById('statusDot');
    var statusText = document.getElementById('statusText');
    var chatMessages = document.getElementById('chatMessages');
    var messageInput = document.getElementById('messageInput');
    var sendButton = document.getElementById('sendButton');
    var soundWave = document.getElementById('soundWave');

    // State
    var conversationHistory = [];
    var isTyping = false;
    var MAX_MESSAGES = 20;
    var TYPEWRITER_SPEED = 35; // ms per character

    // Initialize
    function init() {
        // Hide splash after animation
        setTimeout(function() {
            splash.classList.add('fade-out');
            setTimeout(function() {
                splash.style.display = 'none';
                app.classList.remove('hidden');
                checkHealth();
            }, 500);
        }, 1500);

        // Event listeners
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Periodic health check
        setInterval(checkHealth, 30000);
    }

    // Health check
    function checkHealth() {
        fetch('/api/health')
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.status === 'ok') {
                    setStatus('connected', '已连接');
                } else {
                    setStatus('error', '服务异常');
                }
            })
            .catch(function() {
                setStatus('error', '连接失败');
            });
    }

    // Set connection status
    function setStatus(state, text) {
        statusDot.className = 'status-dot ' + state;
        statusText.textContent = text;
    }

    // Send message
    function sendMessage() {
        var message = messageInput.value.trim();
        if (!message || isTyping) return;

        // Add user message to UI
        addMessage('user', message);
        messageInput.value = '';

        // Add to history
        conversationHistory.push({
            role: 'user',
            content: message
        });

        // Trim history if needed
        if (conversationHistory.length > MAX_MESSAGES) {
            conversationHistory = conversationHistory.slice(-MAX_MESSAGES);
        }

        // Disable input
        setInputEnabled(false);
        isTyping = true;
        soundWave.classList.add('active');

        // Call API
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                history: conversationHistory.slice(0, -1) // Exclude current message
            })
        })
        .then(function(response) {
            return response.json().then(function(data) {
                return { ok: response.ok, data: data };
            });
        })
        .then(function(result) {
            if (result.ok && result.data.response) {
                // Add assistant message with typewriter effect
                typewriterEffect(result.data.response, function() {
                    conversationHistory.push({
                        role: 'assistant',
                        content: result.data.response
                    });
                });
            } else {
                var errorMsg = result.data.error || '未知错误';
                addMessage('error', errorMsg);
                // Remove failed user message from history
                conversationHistory.pop();
            }
        })
        .catch(function(error) {
            console.error('Chat error:', error);
            addMessage('error', '网络错误，请重试');
            // Remove failed user message from history
            conversationHistory.pop();
        })
        .finally(function() {
            setInputEnabled(true);
            isTyping = false;
            soundWave.classList.remove('active');
        });
    }

    // Add message to chat
    function addMessage(role, content) {
        var messageEl = document.createElement('div');
        messageEl.className = 'message ' + role;
        messageEl.textContent = content;
        chatMessages.appendChild(messageEl);
        scrollToBottom();

        // Keep only last messages visible (for performance)
        var messages = chatMessages.querySelectorAll('.message');
        if (messages.length > 10) {
            messages[0].remove();
        }
    }

    // Typewriter effect for AI responses
    function typewriterEffect(text, callback) {
        var messageEl = document.createElement('div');
        messageEl.className = 'message assistant';
        messageEl.innerHTML = '<span class="cursor"></span>';
        chatMessages.appendChild(messageEl);
        scrollToBottom();

        var index = 0;
        var textSpan = document.createElement('span');
        messageEl.insertBefore(textSpan, messageEl.firstChild);

        function type() {
            if (index < text.length) {
                textSpan.textContent += text.charAt(index);
                index++;
                scrollToBottom();
                setTimeout(type, TYPEWRITER_SPEED);
            } else {
                // Remove cursor when done
                var cursor = messageEl.querySelector('.cursor');
                if (cursor) cursor.remove();
                if (callback) callback();
            }
        }

        type();
    }

    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Enable/disable input
    function setInputEnabled(enabled) {
        messageInput.disabled = !enabled;
        sendButton.disabled = !enabled;
        if (enabled) {
            messageInput.focus();
        }
    }

    // Start app
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
