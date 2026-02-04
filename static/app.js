/**
 * Amadeus Web App - Frontend Logic
 * iOS 15 Safari Compatible (ES2020)
 */

(function() {
    'use strict';

    // Constants
    var STORAGE_KEY = 'amadeus_settings';
    var DEFAULT_SPRITE = 'assets/kurisu.png';
    var MAX_MESSAGES = 20;
    var TYPEWRITER_SPEED = 35;

    // DOM Elements
    var splash = document.getElementById('splash');
    var app = document.getElementById('app');
    var statusDot = document.getElementById('statusDot');
    var statusText = document.getElementById('statusText');
    var messageInput = document.getElementById('messageInput');
    var sendButton = document.getElementById('sendButton');
    var soundWave = document.getElementById('soundWave');
    var dialogBubble = document.getElementById('dialogBubble');
    var dialogText = document.getElementById('dialogText');
    var characterSprite = document.getElementById('characterSprite');
    var settingsButton = document.getElementById('settingsButton');
    var settingsModal = document.getElementById('settingsModal');
    var closeSettings = document.getElementById('closeSettings');
    var modalBackdrop = settingsModal.querySelector('.modal-backdrop');
    var spriteList = document.getElementById('spriteList');
    var spriteFileInput = document.getElementById('spriteFileInput');
    var addSpriteButton = document.getElementById('addSpriteButton');
    var currentSpritePreview = document.getElementById('currentSpritePreview');

    // State
    var conversationHistory = [];
    var isTyping = false;
    var settings = null;

    // =====================
    // Settings Management
    // =====================

    function getDefaultSettings() {
        return {
            sprites: [],
            currentSpriteId: null,
            theme: 'default'
        };
    }

    function loadSettings() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                settings = JSON.parse(stored);
                // Ensure required fields exist
                if (!settings.sprites) settings.sprites = [];
                if (settings.currentSpriteId === undefined) settings.currentSpriteId = null;
            } else {
                settings = getDefaultSettings();
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
            settings = getDefaultSettings();
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    // =====================
    // Sprite Management
    // =====================

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function getCurrentSprite() {
        if (!settings.currentSpriteId || settings.sprites.length === 0) {
            return DEFAULT_SPRITE;
        }
        var sprite = settings.sprites.find(function(s) {
            return s.id === settings.currentSpriteId;
        });
        return sprite ? sprite.dataUrl : DEFAULT_SPRITE;
    }

    function applyCurrentSprite() {
        var spriteUrl = getCurrentSprite();
        characterSprite.src = spriteUrl;
        currentSpritePreview.src = spriteUrl;
    }

    function selectSprite(spriteId) {
        settings.currentSpriteId = spriteId;
        saveSettings();
        applyCurrentSprite();
        renderSpriteList();
    }

    function deleteSprite(spriteId) {
        settings.sprites = settings.sprites.filter(function(s) {
            return s.id !== spriteId;
        });
        // If deleted sprite was current, reset to default
        if (settings.currentSpriteId === spriteId) {
            settings.currentSpriteId = settings.sprites.length > 0 ? settings.sprites[0].id : null;
        }
        saveSettings();
        applyCurrentSprite();
        renderSpriteList();
    }

    function addSprite(name, dataUrl) {
        var sprite = {
            id: generateId(),
            name: name || '立绘 ' + (settings.sprites.length + 1),
            dataUrl: dataUrl
        };
        settings.sprites.push(sprite);
        // Auto-select if first sprite
        if (settings.sprites.length === 1) {
            settings.currentSpriteId = sprite.id;
        }
        saveSettings();
        applyCurrentSprite();
        renderSpriteList();
    }

    function renderSpriteList() {
        spriteList.innerHTML = '';

        // Add default sprite option
        var defaultItem = document.createElement('div');
        defaultItem.className = 'sprite-item' + (settings.currentSpriteId === null ? ' active' : '');
        defaultItem.innerHTML = '<img src="' + DEFAULT_SPRITE + '" alt="默认">';
        defaultItem.addEventListener('click', function() {
            selectSprite(null);
        });
        spriteList.appendChild(defaultItem);

        // Add user sprites
        settings.sprites.forEach(function(sprite) {
            var item = document.createElement('div');
            item.className = 'sprite-item' + (sprite.id === settings.currentSpriteId ? ' active' : '');

            var img = document.createElement('img');
            img.src = sprite.dataUrl;
            img.alt = sprite.name;
            item.appendChild(img);

            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteSprite(sprite.id);
            });
            item.appendChild(deleteBtn);

            item.addEventListener('click', function() {
                selectSprite(sprite.id);
            });

            spriteList.appendChild(item);
        });
    }

    function handleFileSelect(e) {
        var file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过 5MB');
            return;
        }

        var reader = new FileReader();
        reader.onload = function(event) {
            var dataUrl = event.target.result;
            var name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
            addSprite(name, dataUrl);
        };
        reader.onerror = function() {
            alert('读取图片失败');
        };
        reader.readAsDataURL(file);

        // Reset input
        spriteFileInput.value = '';
    }

    // =====================
    // Modal Management
    // =====================

    function openSettingsModal() {
        renderSpriteList();
        settingsModal.classList.remove('hidden');
    }

    function closeSettingsModal() {
        settingsModal.classList.add('hidden');
    }

    // =====================
    // Chat Functions
    // =====================

    function setStatus(state, text) {
        statusDot.className = 'status-dot ' + state;
        statusText.textContent = text;
    }

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

    function setInputEnabled(enabled) {
        messageInput.disabled = !enabled;
        sendButton.disabled = !enabled;
        if (enabled) {
            messageInput.focus();
        }
    }

    function showUserMessage(message) {
        // Create user message element
        var userDiv = document.createElement('div');
        userDiv.className = 'dialog-user';
        userDiv.textContent = message;

        // Clear and show user message + placeholder for AI response
        dialogBubble.innerHTML = '';
        dialogBubble.appendChild(userDiv);

        var textDiv = document.createElement('div');
        textDiv.className = 'dialog-text';
        textDiv.id = 'dialogText';
        dialogBubble.appendChild(textDiv);

        return textDiv;
    }

    function typewriterEffect(textElement, text, callback) {
        textElement.innerHTML = '<span class="cursor"></span>';

        var index = 0;
        var textSpan = document.createElement('span');
        textElement.insertBefore(textSpan, textElement.firstChild);

        function type() {
            if (index < text.length) {
                textSpan.textContent += text.charAt(index);
                index++;
                dialogBubble.scrollTop = dialogBubble.scrollHeight;
                setTimeout(type, TYPEWRITER_SPEED);
            } else {
                var cursor = textElement.querySelector('.cursor');
                if (cursor) cursor.remove();
                if (callback) callback();
            }
        }

        type();
    }

    function sendMessage() {
        var message = messageInput.value.trim();
        if (!message || isTyping) return;

        // Show user message
        var textElement = showUserMessage(message);
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
                history: conversationHistory.slice(0, -1)
            })
        })
        .then(function(response) {
            return response.json().then(function(data) {
                return { ok: response.ok, data: data };
            });
        })
        .then(function(result) {
            if (result.ok && result.data.response) {
                typewriterEffect(textElement, result.data.response, function() {
                    conversationHistory.push({
                        role: 'assistant',
                        content: result.data.response
                    });
                });
            } else {
                var errorMsg = result.data.error || '未知错误';
                textElement.textContent = errorMsg;
                textElement.style.color = 'var(--primary-red)';
                conversationHistory.pop();
            }
        })
        .catch(function(error) {
            console.error('Chat error:', error);
            textElement.textContent = '网络错误，请重试';
            textElement.style.color = 'var(--primary-red)';
            conversationHistory.pop();
        })
        .finally(function() {
            setInputEnabled(true);
            isTyping = false;
            soundWave.classList.remove('active');
        });
    }

    // =====================
    // Initialization
    // =====================

    function init() {
        // Load settings
        loadSettings();
        applyCurrentSprite();

        // Hide splash after animation
        setTimeout(function() {
            splash.classList.add('fade-out');
            setTimeout(function() {
                splash.style.display = 'none';
                app.classList.remove('hidden');
                checkHealth();
            }, 500);
        }, 1500);

        // Chat event listeners
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Settings modal event listeners
        settingsButton.addEventListener('click', openSettingsModal);
        closeSettings.addEventListener('click', closeSettingsModal);
        modalBackdrop.addEventListener('click', closeSettingsModal);

        // Sprite upload event listeners
        addSpriteButton.addEventListener('click', function() {
            spriteFileInput.click();
        });
        spriteFileInput.addEventListener('change', handleFileSelect);

        // Periodic health check
        setInterval(checkHealth, 30000);
    }

    // Start app
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
