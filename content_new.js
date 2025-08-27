class SpanishDictionary {
  constructor() {
    this.instanceId = Math.random().toString(36).substr(2, 9);
    this.tooltip = null;
    this.currentWord = null;
    this.isTooltipVisible = false;
    this.hideTooltipTimer = null;
    this.lastMouseMoveTime = 0;
    this.mouseMoveDelay = 100;
    this.currentHighlightedElement = null;
    this.currentWordInfo = null;
    this.openaiApiKey = null;
    this.selectedModel = 'gpt-4o-mini';
    this.explanationCache = new Map();
    this.pendingRequests = new Map();
    this.extensionEnabled = true;
    this.currentOriginalElement = null;
    this.currentOriginalText = null;
    
    console.log(`[Spanish Dictionary NEW ${this.instanceId}] Starting initialization`);
    this.init();
  }

  async init() {
    try {
      console.log('[Spanish Dictionary NEW] Creating tooltip...');
      this.createTooltip();
      console.log('[Spanish Dictionary NEW] Attaching event listeners...');
      this.attachEventListeners();
      console.log('[Spanish Dictionary NEW] Loading API key...');
      await this.loadApiKey();
      console.log('[Spanish Dictionary NEW] Setting up message listener...');
      this.setupMessageListener();
      console.log('[Spanish Dictionary NEW] ✅ Initialization complete');
    } catch (error) {
      console.error('[Spanish Dictionary NEW] ❌ Initialization failed:', error);
    }
  }

  async loadApiKey() {
    try {
      const result = await chrome.storage.sync.get(['openaiApiKey', 'extensionEnabled', 'selectedModel']);
      this.openaiApiKey = result.openaiApiKey || null;
      this.selectedModel = result.selectedModel || 'gpt-4o-mini';
      this.extensionEnabled = result.extensionEnabled !== false;
      console.log(`[Spanish Dictionary NEW] Settings loaded:`, {
        hasApiKey: !!this.openaiApiKey,
        model: this.selectedModel,
        enabled: this.extensionEnabled
      });
    } catch (error) {
      console.error('[Spanish Dictionary NEW] Error loading settings:', error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[Spanish Dictionary NEW] Received message:', message);
      if (message.action === 'settingsUpdated') {
        this.openaiApiKey = message.apiKey;
        this.selectedModel = message.selectedModel;
        console.log(`[Spanish Dictionary NEW] Settings updated - API Key: ${!!this.openaiApiKey}, Model: ${this.selectedModel}`);
      } else if (message.action === 'extensionToggled') {
        this.extensionEnabled = message.enabled;
        console.log(`[Spanish Dictionary NEW] Extension ${message.enabled ? 'enabled' : 'disabled'}`);
        if (!message.enabled) {
          this.hideTooltip();
          this.removeHighlight();
        }
      }
    });
  }

  createTooltip() {
    // 移除任何現有的 tooltip
    const existingTooltip = document.getElementById('spanish-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    this.tooltip = document.createElement('div');
    this.tooltip.id = 'spanish-tooltip';
    this.tooltip.style.display = 'none';
    this.tooltip.innerHTML = `
      <div class="tooltip-content">
        <div class="word-title"></div>
        <div class="explanation"></div>
        <button class="copy-btn" title="Copiar palabra y explicación">📋</button>
      </div>
    `;
    document.body.appendChild(this.tooltip);
    console.log('[Spanish Dictionary NEW] Tooltip created');
  }

  attachEventListeners() {
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('click', (e) => this.handleClick(e));
    
    this.tooltip.addEventListener('mouseenter', () => this.cancelHideTooltip());
    this.tooltip.addEventListener('mouseleave', () => this.scheduleHideTooltip());
    console.log('[Spanish Dictionary NEW] Event listeners attached');
  }

  handleMouseMove(event) {
    // DISABLED: Mouse hover highlighting completely disabled to prevent layout issues
    // Only click-to-show-tooltip functionality remains active
    return;
  }

  handleClick(event) {
    if (!this.extensionEnabled) {
      return;
    }

    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element || element.closest('#spanish-tooltip')) return;

    // 先移除之前的高亮
    this.removeHighlight();

    // 檢測點擊位置的詞彙
    const wordInfo = this.getWordAtPreciseMousePosition(event, element);
    console.log('[Spanish Dictionary] Click detected wordInfo:', wordInfo);
    
    if (wordInfo && this.isComplexWord(wordInfo.word)) {
      if (this.isTooltipVisible && this.currentWord === wordInfo.word) {
        this.hideTooltip();
      } else {
        // 顯示 tooltip 並進行安全的高亮
        this.currentWord = wordInfo.word;
        this.currentWordInfo = wordInfo;
        this.highlightWordAtPosition(wordInfo);
        this.showTooltip(wordInfo.word, event);
      }
    } else {
      if (this.isTooltipVisible) {
        this.hideTooltip();
      }
    }
  }

  getWordAtPreciseMousePosition(event, element) {
    if (!element || !element.textContent) {
      console.log('[Spanish Dictionary] No element or text content');
      return null;
    }

    console.log(`[Spanish Dictionary] Checking element at click: ${element.tagName}, text: "${element.textContent.substring(0, 30)}..."`);

    // 首先嘗試使用瀏覽器的精確位置API - 這是最準確的方法
    let range = null;
    try {
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(event.clientX, event.clientY);
        console.log(`[Spanish Dictionary] caretRangeFromPoint result:`, range);
      } else if (document.caretPositionFromPoint) {
        const caretPosition = document.caretPositionFromPoint(event.clientX, event.clientY);
        console.log(`[Spanish Dictionary] caretPositionFromPoint result:`, caretPosition);
        if (caretPosition) {
          range = document.createRange();
          range.setStart(caretPosition.offsetNode, caretPosition.offset);
        }
      }
    } catch (error) {
      console.log('[Spanish Dictionary] Caret API error:', error);
    }

    // 如果有精確範圍，分析範圍內的文本
    if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer;
      const text = textNode.textContent;
      const offset = range.startOffset;
      
      console.log(`[Spanish Dictionary] Precise text node found. Offset ${offset} in text: "${text.substring(0, 100)}..."`);
      
      // 找到滑鼠位置附近的單詞
      const wordMatch = this.findWordAtOffset(text, offset);
      if (wordMatch && this.isComplexWord(wordMatch.word)) {
        console.log(`[Spanish Dictionary] Found precise word: "${wordMatch.word}"`);
        return {
          word: wordMatch.word,
          element: textNode.parentElement || element,
          originalWord: wordMatch.originalWord,
          isPrecise: true,
          textNode: textNode,
          wordStart: wordMatch.start,
          wordEnd: wordMatch.end
        };
      }
      // 如果精確方法找到了文本節點但沒有找到有效單詞，直接返回null
      console.log('[Spanish Dictionary] Precise method found text node but no valid word, stopping here');
      return null;
    }

    // 精確方法失敗，但要非常小心的回退
    console.log('[Spanish Dictionary] No precise range found, checking if element is suitable for fallback');
    
    // 只有對非常簡單的元素才使用回退方法
    const text = element.textContent.trim();
    if (text.length > 20 || text.split(' ').length > 2) {
      console.log(`[Spanish Dictionary] Element too complex for fallback (${text.length} chars, ${text.split(' ').length} words), rejecting`);
      return null;
    }
    
    console.log('[Spanish Dictionary] Using limited fallback for simple element');
    return this.getWordAtMousePosition(event, element);
  }

  findWordAtOffset(text, offset) {
    if (!text || offset < 0 || offset > text.length) {
      console.log(`[Spanish Dictionary] Invalid text or offset: text=${!!text}, offset=${offset}, textLength=${text ? text.length : 0}`);
      return null;
    }

    console.log(`[Spanish Dictionary] Finding word at offset ${offset} in text: "${text.substring(Math.max(0, offset-10), offset+10)}" (context)`);

    // 檢查當前位置是否在字母上
    if (offset < text.length && /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/.test(text[offset])) {
      // 直接在字母上，使用當前位置
      console.log(`[Spanish Dictionary] Click directly on letter at offset ${offset}`);
    } else {
      // 不在字母上，但允許小幅調整（最多2個字符，更嚴格）
      let adjustedOffset = -1;
      const maxAdjustment = 2;
      
      // 往後找最多2個字符
      for (let i = 1; i <= maxAdjustment && offset + i < text.length; i++) {
        if (/[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/.test(text[offset + i])) {
          adjustedOffset = offset + i;
          break;
        }
      }
      
      // 如果往後沒找到，往前找最多2個字符
      if (adjustedOffset === -1) {
        for (let i = 1; i <= maxAdjustment && offset - i >= 0; i++) {
          if (/[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/.test(text[offset - i])) {
            adjustedOffset = offset - i;
            break;
          }
        }
      }
      
      if (adjustedOffset === -1) {
        console.log(`[Spanish Dictionary] No Spanish letter found within ${maxAdjustment} chars of offset ${offset}`);
        return null;
      }
      
      offset = adjustedOffset;
      console.log(`[Spanish Dictionary] Adjusted offset to ${offset} to find Spanish letter`);
    }

    // 找到包含offset的單詞的邊界 - 使用西班牙語字母模式
    let wordStart = offset;
    let wordEnd = offset;

    // 向前找到單詞開始
    while (wordStart > 0 && /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/.test(text[wordStart - 1])) {
      wordStart--;
    }

    // 向後找到單詞結束  
    while (wordEnd < text.length && /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/.test(text[wordEnd])) {
      wordEnd++;
    }

    if (wordStart === wordEnd) {
      console.log(`[Spanish Dictionary] No word boundaries found`);
      return null;
    }

    const word = text.substring(wordStart, wordEnd);
    const cleanWord = word.toLowerCase().replace(/[.,!?;:()""''¡¿]/g, '').trim();
    
    console.log(`[Spanish Dictionary] Found word at offset ${offset}: "${cleanWord}" (original: "${word}")`);
    
    // 更嚴格的長度檢查和基本驗證
    if (cleanWord.length >= 4 && this.isValidSpanishWord(cleanWord)) {
      return {
        word: cleanWord,
        originalWord: word,
        start: wordStart,
        end: wordEnd
      };
    }

    console.log(`[Spanish Dictionary] Word rejected: "${cleanWord}" (length: ${cleanWord.length})`);
    return null;
  }

  isValidSpanishWord(word) {
    // 檢查是否是有效的西班牙語單詞模式
    const cleanWord = word.toLowerCase().trim();
    
    // 至少4個字母
    if (cleanWord.length < 4) return false;
    
    // 不能是數字或包含太多數字
    if (/\d/.test(cleanWord)) return false;
    
    // 不能全是大寫（可能是縮寫）
    if (word === word.toUpperCase() && word.length < 6) return false;
    
    // 檢查西班牙語字母模式
    if (!/^[a-záéíóúñü]+$/.test(cleanWord)) return false;
    
    // 避免明顯的截斷詞（以常見前綴結尾）
    const truncatedPrefixes = ['sebasti', 'francisc', 'antoni', 'eduard', 'ricard'];
    if (truncatedPrefixes.includes(cleanWord)) {
      console.log(`[Spanish Dictionary] Rejecting truncated word: "${cleanWord}"`);
      return false;
    }
    
    return true;
  }

  getWordAtMousePosition(event, element) {
    if (!element.textContent || !element.textContent.trim()) {
      return null;
    }

    const text = element.textContent.trim();
    console.log(`[Spanish Dictionary] Analyzing element with text length: ${text.length}`);
    
    // 極其嚴格的文本長度限制 - 防止段落高亮
    if (text.length > 100) {
      console.log(`[Spanish Dictionary] Text too long (${text.length} chars), rejecting to prevent paragraph highlighting`);
      return null;
    }
    
    // 安全高亮策略：NEVER高亮長段落
    // 1. 單詞元素（1個單詞）：直接檢測
    // 2. 短片語（2-3個單詞，≤30字符）：檢測單個詞  
    // 3. 任何長文本：直接拒絕
    
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    console.log(`[Spanish Dictionary] Text with ${words.length} words:`, words.slice(0, 3));
    
    if (words.length === 1) {
      // 單個單詞 - 最安全的情況
      const cleanWord = words[0].toLowerCase().replace(/[.,!?;:()""''¡¿]/g, '').trim();
      if (cleanWord.length > 3 && this.isComplexWord(cleanWord)) {
        console.log(`[Spanish Dictionary] Single complex word: "${cleanWord}"`);
        return {
          word: cleanWord,
          element: element,
          originalWord: words[0]
        };
      }
    } else if (words.length <= 3 && text.length <= 30) {
      // 更嚴格：短語最多30字符
      for (const word of words) {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:()""''¡¿]/g, '').trim();
        if (cleanWord.length > 3 && this.isComplexWord(cleanWord)) {
          console.log(`[Spanish Dictionary] Complex word in very short phrase: "${cleanWord}"`);
          return {
            word: cleanWord,
            element: element,
            originalWord: word
          };
        }
      }
    } else {
      // 任何超過3個詞或30字符的文本：直接拒絕，防止段落高亮
      console.log(`[Spanish Dictionary] Text too complex (${words.length} words, ${text.length} chars), REJECTING to prevent paragraph highlighting`);
      return null;
    }

    console.log(`[Spanish Dictionary] No suitable word found`);
    return null;
  }

  findWordInParagraph(event, element, text) {
    console.log(`[Spanish Dictionary] Analyzing paragraph: "${text.substring(0, 50)}..."`);
    
    // 簡化邏輯：分割文本為單詞並找到第一個符合條件的
    const words = text.split(/\s+/).filter(word => word.trim().length > 0);
    
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:()""''¡¿]/g, '').trim();
      
      if (cleanWord.length > 3 && this.isComplexWord(cleanWord)) {
        console.log(`[Spanish Dictionary] Found complex word in paragraph: "${cleanWord}"`);
        
        // 找到這個單詞在原文中的位置
        const wordStart = text.indexOf(word);
        const wordEnd = wordStart + word.length;
        
        return {
          word: cleanWord,
          element: element,
          originalElement: element,
          wordStart: wordStart,
          wordEnd: wordEnd,
          originalWord: word,
          isPartialHighlight: true
        };
      }
    }
    
    return null;
  }

  isComplexWord(word) {
    const cleanWord = word.toLowerCase().trim();
    
    // 基本長度檢查
    if (cleanWord.length < 4) {
      console.log(`[Spanish Dictionary] Word too short: "${cleanWord}"`);
      return false;
    }
    
    // 使用新的詳細驗證
    if (!this.isValidSpanishWord(cleanWord)) {
      console.log(`[Spanish Dictionary] Not a valid Spanish word: "${cleanWord}"`);
      return false;
    }
    
    // 基礎詞彙列表（簡化版）- A1-A2 常見詞彙
    const basicWords = new Set([
      'este', 'esta', 'esto', 'estos', 'estas',
      'para', 'desde', 'hasta', 'como', 'algo', 'nada', 'todo', 'todos', 'toda', 'todas',
      'pero', 'porque', 'también', 'ahora', 'aquí', 'donde', 'cuando', 'quien', 'quién',
      'casa', 'tiempo', 'vida', 'hombre', 'mujer', 'años', 'días', 'horas',
      'hacer', 'tener', 'estar', 'poder', 'decir', 'venir', 'saber', 'querer',
      'grande', 'pequeño', 'bueno', 'mejor', 'nuevo', 'viejo', 'mismo', 'otro'
    ]);
    
    if (basicWords.has(cleanWord)) {
      console.log(`[Spanish Dictionary] Basic word: "${cleanWord}"`);
      return false;
    }
    
    console.log(`[Spanish Dictionary] Complex word accepted: "${cleanWord}"`);
    return true;
  }

  highlightWordAtPosition(wordInfo) {
    console.log(`[Spanish Dictionary] Highlighting word: "${wordInfo.word}"`);
    
    if (!wordInfo) {
      console.log('[Spanish Dictionary] No wordInfo provided');
      return;
    }

    // 如果有精確的文本節點位置信息，使用文本節點高亮
    if (wordInfo.isPrecise && wordInfo.textNode && wordInfo.wordStart !== undefined && wordInfo.wordEnd !== undefined) {
      console.log('[Spanish Dictionary] Using precise text node highlighting');
      this.highlightTextRange(wordInfo.textNode, wordInfo.wordStart, wordInfo.wordEnd, wordInfo.word);
      return;
    }

    // 回退到元素級高亮，但要非常謹慎
    if (!wordInfo.element) {
      console.log('[Spanish Dictionary] No element to highlight');
      return;
    }

    const element = wordInfo.element;
    const text = element.textContent ? element.textContent.trim() : '';
    
    // 只對單詞或很短的片語進行元素級高亮
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    if (words.length > 2 || text.length > 25) {
      console.log(`[Spanish Dictionary] Element too complex for safe highlighting (${words.length} words, ${text.length} chars)`);
      return;
    }

    console.log(`[Spanish Dictionary] Element-level highlighting: "${text}"`);
    this.currentHighlightedElement = element;
    this.currentOriginalText = element.style.backgroundColor || '';
    element.style.backgroundColor = '#ffeb3b';
    element.style.transition = 'background-color 0.2s ease';
  }

  highlightTextRange(textNode, start, end, word) {
    try {
      const range = document.createRange();
      range.setStart(textNode, start);
      range.setEnd(textNode, end);
      
      // 創建高亮 span
      const highlightSpan = document.createElement('span');
      highlightSpan.style.backgroundColor = '#ffeb3b';
      highlightSpan.style.transition = 'background-color 0.2s ease';
      highlightSpan.className = 'spanish-dictionary-highlight';
      
      // 用高亮 span 包裹選中的文本
      range.surroundContents(highlightSpan);
      
      this.currentHighlightedElement = highlightSpan;
      this.currentOriginalElement = textNode.parentNode;
      this.currentOriginalText = null; // 標記這是一個新創建的元素
      
      console.log(`[Spanish Dictionary] Text range highlighted: "${word}" at ${start}-${end}`);
    } catch (error) {
      console.log('[Spanish Dictionary] Text range highlighting failed, using fallback:', error);
      // 如果文本範圍高亮失敗，回退到元素級
      const element = textNode.parentElement;
      if (element) {
        this.currentHighlightedElement = element;
        this.currentOriginalText = element.style.backgroundColor || '';
        element.style.backgroundColor = '#ffeb3b';
      }
    }
  }

  // REMOVED: createPartialHighlight function - was causing page layout breaks
  // All highlighting now uses safe element-level highlighting only

  removeHighlight() {
    console.log(`[Spanish Dictionary] Removing highlight`);
    
    if (this.currentHighlightedElement) {
      if (this.currentOriginalText === null) {
        // 這是一個我們創建的 span，需要移除它並恢復原始文本
        if (this.currentHighlightedElement.className === 'spanish-dictionary-highlight') {
          const parent = this.currentHighlightedElement.parentNode;
          const textContent = this.currentHighlightedElement.textContent;
          
          // 創建文本節點替換高亮 span
          const textNode = document.createTextNode(textContent);
          parent.replaceChild(textNode, this.currentHighlightedElement);
          
          // 合併相鄰的文本節點
          parent.normalize();
          console.log(`[Spanish Dictionary] Removed highlight span and restored text`);
        } else {
          // 清除樣式
          this.currentHighlightedElement.style.backgroundColor = '';
        }
      } else {
        // 恢復原始背景色
        this.currentHighlightedElement.style.backgroundColor = this.currentOriginalText;
        console.log(`[Spanish Dictionary] Restored original background`);
      }
    }
    
    // 清除所有引用
    this.currentHighlightedElement = null;
    this.currentWord = null;
    this.currentWordInfo = null;
    this.currentOriginalElement = null;
    this.currentOriginalText = null;
  }

  async showTooltip(word, event) {
    console.log(`[Spanish Dictionary NEW] Showing tooltip for: ${word}`);
    
    this.tooltip.querySelector('.word-title').textContent = word;
    this.tooltip.querySelector('.explanation').textContent = 'Cargando explicación...';
    
    this.cancelHideTooltip();
    this.tooltip.style.display = 'block';
    this.isTooltipVisible = true;
    this.positionTooltip(event);

    try {
      const explanation = await this.getExplanation(word);
      console.log(`[Spanish Dictionary NEW] Got explanation: ${explanation}`);
      
      if (this.isTooltipVisible && this.currentWord === word) {
        this.tooltip.querySelector('.explanation').textContent = explanation;
        
        const copyBtn = this.tooltip.querySelector('.copy-btn');
        copyBtn.onclick = () => this.copyToClipboard(word, explanation);
        
        this.positionTooltip(event);
      }
    } catch (error) {
      console.error('[Spanish Dictionary NEW] Error showing tooltip:', error);
      if (this.isTooltipVisible && this.currentWord === word) {
        this.tooltip.querySelector('.explanation').textContent = 'Error al cargar la explicación.';
      }
    }
  }

  async getExplanation(word) {
    console.log(`[Spanish Dictionary NEW] Getting explanation for: ${word}`);
    console.log(`[Spanish Dictionary NEW] API Key available: ${!!this.openaiApiKey}`);
    console.log(`[Spanish Dictionary NEW] Selected model: ${this.selectedModel}`);

    // 檢查緩存
    if (this.explanationCache.has(word)) {
      console.log(`[Spanish Dictionary NEW] Using cached explanation for: ${word}`);
      return this.explanationCache.get(word);
    }

    // 如果沒有 API Key
    if (!this.openaiApiKey) {
      const message = `Para obtener explicaciones automáticas de "${word}", configura tu OpenAI API Key en el popup de la extensión.`;
      console.log(`[Spanish Dictionary NEW] No API key, returning: ${message}`);
      return message;
    }

    // 檢查是否已經有進行中的請求
    if (this.pendingRequests.has(word)) {
      console.log(`[Spanish Dictionary NEW] Request already pending for: ${word}`);
      return this.pendingRequests.get(word);
    }

    // 創建 API 請求
    console.log(`[Spanish Dictionary NEW] Making API request for: ${word}`);
    const explanationPromise = this.fetchExplanationFromAPI(word);
    this.pendingRequests.set(word, explanationPromise);

    try {
      const explanation = await explanationPromise;
      this.explanationCache.set(word, explanation);
      this.pendingRequests.delete(word);
      console.log(`[Spanish Dictionary NEW] API response for ${word}: ${explanation}`);
      return explanation;
    } catch (error) {
      console.error(`[Spanish Dictionary NEW] API error for ${word}:`, error);
      this.pendingRequests.delete(word);
      return `Error al obtener explicación para "${word}". Verifica tu conexión y API Key.`;
    }
  }

  async fetchExplanationFromAPI(word) {
    const prompt = `Explica la palabra española "${word}" de forma muy simple para estudiantes de nivel A1-A2. 
    
    Reglas:
    - Usa solo palabras muy básicas y comunes
    - Máximo 15 palabras
    - No uses palabras complicadas
    - Si es un verbo conjugado, explica el significado básico
    - Responde solo con la explicación, sin comillas ni texto extra
    
    Ejemplo: "estudioso" → "Persona que le gusta estudiar mucho"`;

    console.log(`[Spanish Dictionary NEW] API request - Model: ${this.selectedModel}, Word: ${word}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.selectedModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Spanish Dictionary NEW] API error ${response.status}:`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Spanish Dictionary NEW] API response data:`, data);
    
    return data.choices[0]?.message?.content?.trim() || `Explicación no disponible para "${word}".`;
  }

  positionTooltip(event) {
    let x = event.clientX + 15;
    let y = event.clientY - 60;
    
    this.tooltip.style.left = x + 'px';
    this.tooltip.style.top = y + 'px';
    
    this.tooltip.offsetWidth;
    
    const rect = this.tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let adjustedX = x;
    let adjustedY = y;
    
    if (rect.right > windowWidth) {
      adjustedX = event.clientX - rect.width - 15;
      if (adjustedX < 0) {
        adjustedX = 10;
      }
    }
    
    if (rect.top < 0) {
      adjustedY = event.clientY + 25;
    } else if (rect.bottom > windowHeight) {
      adjustedY = windowHeight - rect.height - 10;
      if (adjustedY < 0) {
        adjustedY = 10;
      }
    }
    
    if (adjustedX !== x || adjustedY !== y) {
      this.tooltip.style.left = adjustedX + 'px';
      this.tooltip.style.top = adjustedY + 'px';
    }
  }

  hideTooltip() {
    this.tooltip.style.display = 'none';
    this.isTooltipVisible = false;
    this.cancelHideTooltip();
    this.removeHighlight(); // 隱藏 tooltip 時也移除高亮
  }

  scheduleHideTooltip() {
    this.hideTooltipTimer = setTimeout(() => {
      this.hideTooltip();
    }, 300);
  }

  cancelHideTooltip() {
    if (this.hideTooltipTimer) {
      clearTimeout(this.hideTooltipTimer);
      this.hideTooltipTimer = null;
    }
  }

  copyToClipboard(word, explanation) {
    const textToCopy = `${word}: ${explanation}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.showCopyFeedback();
      }).catch(err => {
        console.error('Copy failed:', err);
      });
    }
  }

  showCopyFeedback() {
    const copyBtn = this.tooltip.querySelector('.copy-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅';
    copyBtn.style.backgroundColor = '#4CAF50';
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.backgroundColor = '';
    }, 1000);
  }
}

// 清理任何現有實例
if (window.spanishDictionaryInstance) {
  console.log('[Spanish Dictionary NEW] Removing old instance');
  delete window.spanishDictionaryInstance;
}

// 防止重複初始化
if (!window.spanishDictionaryNewInstance) {
  console.log('[Spanish Dictionary NEW] Creating new instance');
  window.spanishDictionaryNewInstance = new SpanishDictionary();
  window.spanishDictionaryInstance = window.spanishDictionaryNewInstance; // 保持兼容性
  
  // 調試方法
  window.checkSpanishDictionary = () => {
    const instance = window.spanishDictionaryNewInstance;
    console.log('=== Spanish Dictionary NEW Status ===');
    console.log(`Instance ID: ${instance.instanceId}`);
    console.log(`Extension Enabled: ${instance.extensionEnabled}`);
    console.log(`API Key: ${!!instance.openaiApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`Model: ${instance.selectedModel}`);
    console.log(`Tooltip Visible: ${instance.isTooltipVisible}`);
    console.log(`Current Word: ${instance.currentWord}`);
    return instance;
  };
} else {
  console.log('[Spanish Dictionary NEW] Instance already exists, skipping initialization');
}