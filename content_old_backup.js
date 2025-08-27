class SpanishDictionary {
  constructor() {
    this.instanceId = Math.random().toString(36).substr(2, 9); // 唯一識別碼
    this.tooltip = null;
    this.currentWord = null;
    this.isTooltipVisible = false;
    this.hideTooltipTimer = null;
    this.lastMouseMoveTime = 0;
    this.mouseMoveDelay = 100; // 限制mousemove频率
    this.currentHighlightedElement = null;
    this.currentWordInfo = null;
    this.openaiApiKey = null;
    this.selectedModel = 'gpt-4o-mini'; // 預設為最便宜的模型
    this.explanationCache = new Map(); // 緩存 API 回應
    this.pendingRequests = new Map(); // 避免重複請求
    this.extensionEnabled = true; // 擴充功能啟用狀態
    
    console.log(`[Spanish Dictionary] Instance ${this.instanceId} created`);
    
    this.daleBasicWords = new Set([
      // A1级别基础词汇示例
      'el', 'la', 'un', 'una', 'de', 'que', 'y', 'a', 'en', 'ser', 'estar', 'tener', 'hacer',
      'todo', 'le', 'su', 'por', 'pero', 'con', 'no', 'me', 'ya', 'se', 'lo', 'si', 'porque',
      'casa', 'día', 'tiempo', 'vida', 'hombre', 'mujer', 'año', 'mes', 'semana', 'hora',
      'minuto', 'segundo', 'agua', 'fuego', 'tierra', 'aire', 'sol', 'luna', 'cielo', 'mar',
      'comida', 'comer', 'beber', 'dormir', 'trabajar', 'estudiar', 'leer', 'escribir',
      'hablar', 'caminar', 'correr', 'grande', 'pequeño', 'bueno', 'malo', 'nuevo', 'viejo',
      'rojo', 'azul', 'verde', 'amarillo', 'blanco', 'negro', 'uno', 'dos', 'tres', 'cuatro',
      'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'cien', 'mil', 'aquí', 'allí',
      'ahora', 'después', 'antes', 'siempre', 'nunca', 'muy', 'poco', 'mucho', 'más', 'menos'
    ]);
    
    this.explanations = {
      // Acciones/Verbos comunes
      'medidas': 'Acciones o reglas para hacer algo.',
      'llevaron': 'Transportaron algo de un lugar a otro.',
      'superar': 'Ganar, pasar por encima de algo difícil.',
      'buscar': 'Mirar para encontrar algo.',
      'convierte': 'Cambia una cosa en otra cosa.',
      'convertir': 'Cambiar una cosa en otra cosa.',
      'desarrolla': 'Hace crecer algo, lo mejora.',
      'desarrollar': 'Hacer crecer algo, mejorarlo.',
      'produce': 'Hace, crea algo.',
      'producir': 'Hacer, crear algo.',
      'anuncia': 'Dice algo importante a muchas personas.',
      'anunciar': 'Decir algo importante a muchas personas.',
      'representa': 'Es el símbolo de algo, habla por otros.',
      'representar': 'Ser el símbolo de algo, hablar por otros.',
      'participa': 'Toma parte en algo.',
      'participar': 'Tomar parte en algo.',
      'considera': 'Piensa sobre algo.',
      'considerar': 'Pensar sobre algo.',
      'presenta': 'Muestra algo por primera vez.',
      'presentar': 'Mostrar algo por primera vez.',
      'confirma': 'Dice que algo es verdad.',
      'confirmar': 'Decir que algo es verdad.',
      'explica': 'Dice cómo o por qué pasa algo.',
      'explicar': 'Decir cómo o por qué pasa algo.',
      'decide': 'Escoge entre varias opciones.',
      'decidir': 'Escoger entre varias opciones.',
      'incluye': 'Pone algo dentro de un grupo.',
      'incluir': 'Poner algo dentro de un grupo.',
      'recibe': 'Toma algo que le dan.',
      'recibir': 'Tomar algo que le dan.',
      'mantiene': 'Guarda algo como está.',
      'mantener': 'Guardar algo como está.',
      
      // Sustantivos comunes
      'fuerza': 'Poder para hacer algo.',
      'gremio': 'Grupo de trabajadores del mismo tipo.',
      'vuelos': 'Viajes en avión.',
      'aerolíneas': 'Empresas que tienen aviones para viajar.',
      'cancelación': 'Cuando algo no va a pasar.',
      'sentimiento': 'Lo que sientes en tu corazón.',
      'diccionario': 'Libro con palabras y sus significados.',
      'palabra': 'Sonidos o letras que usamos para hablar.',
      'productora': 'Empresa que hace películas o programas.',
      'productor': 'Persona que hace películas o programas.',
      'trilogía': 'Tres libros o películas que van juntos.',
      'protagonista': 'El personaje más importante de una historia.',
      'actriz': 'Mujer que actúa en películas o teatro.',
      'actor': 'Hombre que actúa en películas o teatro.',
      'ranking': 'Lista que muestra el orden de importancia.',
      'honor': 'Respeto y admiración de otras personas.',
      'mundo': 'La Tierra, nuestro planeta.',
      'internacional': 'De muchos países diferentes.',
      'nacional': 'De un país específico.',
      'gobierno': 'Las personas que dirigen un país.',
      'presidente': 'La persona que dirige un país.',
      'empresa': 'Organización que vende productos o servicios.',
      'proyecto': 'Plan para hacer algo.',
      'resultado': 'Lo que pasa después de hacer algo.',
      'problema': 'Algo malo que necesita solución.',
      'solución': 'La respuesta a un problema.',
      'situación': 'Cómo están las cosas en un momento.',
      'información': 'Datos, cosas que sabes.',
      'desarrollo': 'Crecimiento, mejora de algo.',
      'experiencia': 'Cosas que has vivido o hecho.',
      'oportunidad': 'Momento bueno para hacer algo.',
      'actividad': 'Cosa que haces.',
      'comunidad': 'Grupo de personas que viven juntas.',
      'sociedad': 'Todas las personas de un lugar.',
      'educación': 'Aprender en la escuela.',
      'universidad': 'Escuela para adultos.',
      'estudiante': 'Persona que estudia.',
      'profesor': 'Persona que enseña.',
      'hospital': 'Lugar donde curan a los enfermos.',
      'doctor': 'Persona que cura enfermedades.',
      'medicina': 'Lo que tomas cuando estás enfermo.',
      'enfermedad': 'Cuando tu cuerpo no está bien.',
      'salud': 'Cuando tu cuerpo está bien.',
      'tecnología': 'Máquinas y computadoras modernas.',
      'internet': 'Red mundial de computadoras.',
      'teléfono': 'Aparato para hablar con personas lejanas.',
      'computadora': 'Máquina electrónica para trabajar.',
      'programa': 'Conjunto de instrucciones para computadora.',
      'sistema': 'Conjunto de partes que trabajan juntas.',
      
      // Adjetivos comunes
      'argentinas': 'De Argentina, el país.',
      'perspicaz': 'Una persona que entiende las cosas rápido y bien.',
      'meticuloso': 'Una persona que hace las cosas con mucho cuidado.',
      'resiliente': 'Una persona fuerte que no se rinde fácilmente.',
      'común': 'Normal, que pasa muchas veces.',
      'fuerte': 'Con mucha fuerza, no débil.',
      'difícil': 'No fácil, complicado.',
      'importante': 'Que tiene mucho valor.',
      'necesario': 'Que se necesita.',
      'posible': 'Que puede pasar.',
      'imposible': 'Que no puede pasar.',
      'diferente': 'No igual, distinto.',
      'similar': 'Parecido, casi igual.',
      'especial': 'No normal, único.',
      'general': 'Para todo, no específico.',
      'popular': 'Que le gusta a mucha gente.',
      'famoso': 'Que muchas personas conocen.',
      'público': 'Para todas las personas.',
      'privado': 'Solo para algunas personas.',
      'social': 'Relacionado con las personas.',
      'económico': 'Relacionado con el dinero.',
      'político': 'Relacionado con el gobierno.',
      'cultural': 'Relacionado con arte y tradiciones.',
      'natural': 'De la naturaleza.',
      'artificial': 'Hecho por personas.',
      'moderno': 'De ahora, actual.',
      'antiguo': 'De hace mucho tiempo.',
      'joven': 'De poca edad.',
      'adulto': 'De mucha edad.',
      'mayor': 'Más grande o más viejo.',
      'menor': 'Más pequeño o más joven.',
      'mejor': 'Más bueno.',
      'peor': 'Más malo.',
      
      // Adverbios comunes
      'fácilmente': 'De manera fácil, sin problemas.',
      'rápidamente': 'De manera rápida, con velocidad.',
      'lentamente': 'De manera lenta, sin prisa.',
      'claramente': 'De manera clara, fácil de entender.',
      'especialmente': 'De manera especial, sobre todo.',
      'generalmente': 'Casi siempre, normalmente.',
      'solamente': 'Solo, únicamente.',
      'realmente': 'De verdad, en realidad.',
      'principalmente': 'Sobre todo, más que nada.',
      'completamente': 'Todo, al 100%.',
      'totalmente': 'Todo, completamente.',
      'absolutamente': 'Completamente, sin duda.',
      
      // Emociones y sentimientos
      'nostalgia': 'Sentir tristeza por algo del pasado que extrañas.',
      'alegría': 'Sentirse muy feliz.',
      'tristeza': 'Sentirse muy triste.',
      'miedo': 'Sentir que algo malo puede pasar.',
      'preocupación': 'Pensar mucho en un problema.',
      'esperanza': 'Creer que algo bueno va a pasar.',
      'amor': 'Sentir mucho cariño por alguien.',
      'odio': 'Sentir mucha rabia contra alguien.',
      'sorpresa': 'Sentir algo inesperado.',
      'curiosidad': 'Querer saber más sobre algo.',
      
      // Verbos auxiliares y otros
      'significa': 'Quiere decir, es lo mismo que.',
      'rinde': 'Deja de intentar, se da por vencido.',
      'existe': 'Está en el mundo, es real.',
      'ocurre': 'Pasa, sucede.',
      'sucede': 'Pasa, ocurre.',
      'aparece': 'Se muestra, se ve.',
      'desaparece': 'Se va, no se ve más.',
      'continúa': 'Sigue haciendo lo mismo.',
      'termina': 'Se acaba, finaliza.',
      'comienza': 'Empieza, inicia.',
      'cambia': 'Se vuelve diferente.',
      'mejora': 'Se vuelve más bueno.',
      'empeora': 'Se vuelve más malo.',
      
      // Nombres propios comunes
      'ludmila': 'Es un nombre de persona.',
      'garcía': 'Es un apellido común.',
      'lawrence': 'Es un nombre de persona.',
      'esther': 'Es un nombre de persona.'
    };
    
    this.init();
  }

  async init() {
    this.createTooltip();
    this.attachEventListeners();
    await this.loadApiKey();
    this.setupMessageListener();
  }

  async loadApiKey() {
    try {
      const result = await chrome.storage.sync.get(['openaiApiKey', 'extensionEnabled', 'selectedModel']);
      this.openaiApiKey = result.openaiApiKey || null;
      this.selectedModel = result.selectedModel || 'gpt-4o-mini';
      this.extensionEnabled = result.extensionEnabled !== false; // 預設為開啟
      console.log(`[Spanish Dictionary ${this.instanceId}] Loaded settings - API Key: ${!!this.openaiApiKey}, Model: ${this.selectedModel}, Enabled: ${this.extensionEnabled}`);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'settingsUpdated') {
        this.openaiApiKey = message.apiKey;
        this.selectedModel = message.selectedModel;
        console.log(`Settings updated - API Key: ${!!this.openaiApiKey}, Model: ${this.selectedModel}`);
      } else if (message.action === 'extensionToggled') {
        this.extensionEnabled = message.enabled;
        console.log(`[Spanish Dictionary] Extension ${message.enabled ? 'enabled' : 'disabled'}`);
        
        // 如果禁用，隱藏所有現有的 tooltip 和高亮
        if (!message.enabled) {
          this.hideTooltip();
          this.removeHighlight();
          console.log(`[Spanish Dictionary] Extension disabled - hiding all UI`);
        } else {
          console.log(`[Spanish Dictionary] Extension enabled`);
        }
      }
    });
  }

  createTooltip() {
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
  }

  attachEventListeners() {
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('click', (e) => this.handleClick(e));
    document.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
    
    // 为tooltip添加事件监听
    this.tooltip.addEventListener('mouseenter', () => this.cancelHideTooltip());
    this.tooltip.addEventListener('mouseleave', () => this.scheduleHideTooltip());
  }

  handleMouseMove(event) {
    // 如果擴充功能被禁用，直接返回
    if (!this.extensionEnabled) {
      // 添加調試訊息（僅在第一次時）
      if (!this._loggedDisabled) {
        console.log(`[Spanish Dictionary] Mouse move blocked - extension disabled`);
        this._loggedDisabled = true;
      }
      return;
    }
    this._loggedDisabled = false;

    // 节流处理
    const now = Date.now();
    if (now - this.lastMouseMoveTime < this.mouseMoveDelay) {
      return;
    }
    this.lastMouseMoveTime = now;

    // 获取鼠标下的元素
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element) return;

    // 跳过tooltip元素
    if (element.closest('#spanish-tooltip')) return;

    // 尝试获取鼠标位置的精确单词
    const wordInfo = this.getWordAtMousePosition(event, element);
    
    if (wordInfo && this.isComplexWord(wordInfo.word)) {
      this.highlightWordAtPosition(wordInfo);
    } else {
      this.removeHighlight();
    }
  }

  handleClick(event) {
    // 如果擴充功能被禁用，直接返回
    if (!this.extensionEnabled) {
      console.log(`[Spanish Dictionary] Click blocked - extension disabled`);
      return;
    }

    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element) return;

    // 如果點擊的是tooltip，不處理
    if (element.closest('#spanish-tooltip')) return;

    // 使用新的精确单词定位方法
    const wordInfo = this.getWordAtMousePosition(event, element);
    if (wordInfo && this.isComplexWord(wordInfo.word)) {
      // 檢查是否點擊了同一個單詞
      if (this.isTooltipVisible && this.currentWord === wordInfo.word) {
        // 如果tooltip已經顯示且是同一個單詞，隱藏tooltip
        this.hideTooltip();
      } else {
        // 否則顯示tooltip
        this.showTooltip(wordInfo.word, event);
      }
    } else {
      // 如果點擊的不是複雜單詞，隱藏tooltip
      if (this.isTooltipVisible) {
        this.hideTooltip();
      }
    }
  }

  handleMouseLeave(event) {
    // 如果鼠标离开页面，移除高亮
    if (!event.relatedTarget) {
      this.removeHighlight();
    }
  }

  getElementText(element) {
    // 简单获取元素文本
    if (element.textContent && element.textContent.trim()) {
      return element.textContent.trim();
    }
    return null;
  }

  getWordAtMousePosition(event, element) {
    // 如果元素没有文本内容，返回null
    if (!element.textContent || !element.textContent.trim()) {
      return null;
    }

    // 创建临时的Range对象来测试鼠标位置
    const range = document.caretRangeFromPoint ? 
                  document.caretRangeFromPoint(event.clientX, event.clientY) :
                  document.caretPositionFromPoint ? 
                  this.createRangeFromCaretPosition(document.caretPositionFromPoint(event.clientX, event.clientY)) :
                  null;

    if (!range || !range.startContainer) {
      // 备用方法：简单地使用元素的文本内容
      const text = element.textContent.trim();
      const word = this.extractComplexWord(text);
      if (word) {
        return {
          word: word,
          element: element,
          startOffset: 0,
          endOffset: text.length
        };
      }
      return null;
    }

    // 获取当前位置的文本节点
    const textNode = range.startContainer;
    const offset = range.startOffset;

    if (textNode.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    const text = textNode.textContent;
    const wordBoundaries = this.findWordBoundariesAtOffset(text, offset);
    
    if (!wordBoundaries) {
      return null;
    }

    const word = text.substring(wordBoundaries.start, wordBoundaries.end);
    const cleanWord = word.toLowerCase().replace(/[.,!?;:()""'']/g, '').trim();

    if (cleanWord && cleanWord.length > 0) {
      return {
        word: cleanWord,
        element: element,
        textNode: textNode,
        startOffset: wordBoundaries.start,
        endOffset: wordBoundaries.end
      };
    }

    return null;
  }

  createRangeFromCaretPosition(caretPosition) {
    if (!caretPosition) return null;
    const range = document.createRange();
    range.setStart(caretPosition.offsetNode, caretPosition.offset);
    return range;
  }

  findWordBoundariesAtOffset(text, offset) {
    // 单词边界的正则表达式
    const wordRegex = /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]+/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      if (offset >= match.index && offset <= match.index + match[0].length) {
        return {
          start: match.index,
          end: match.index + match[0].length
        };
      }
    }
    
    return null;
  }

  extractComplexWord(text) {
    // 简单提取：如果文本本身就是一个词，直接返回
    const cleanText = text.toLowerCase().replace(/[.,!?;:()""'']/g, '').trim();
    
    // 检查是否是单个词汇
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    
    // 优先检查预设词汇
    for (const word of words) {
      if (this.explanations[word]) {
        return word;
      }
    }
    
    // 如果是单个词汇，直接返回
    if (words.length === 1) {
      return words[0];
    }
    
    // 如果是多个词，返回第一个非基础词汇
    for (const word of words) {
      if (word.length > 3 && !this.daleBasicWords.has(word)) {
        return word;
      }
    }
    
    return null;
  }

  isComplexWord(word) {
    const cleanWord = word.toLowerCase().trim();
    
    if (cleanWord.length <= 3) return false;
    if (this.daleBasicWords.has(cleanWord)) return false;
    
    // 首先检查是否有预设解释，如果有就认为是复杂词汇
    if (this.explanations[cleanWord]) return true;
    
    // 检查是否包含西班牙语字符
    const spanishPattern = /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/;
    if (!spanishPattern.test(cleanWord)) return false;
    
    return true;
  }

  highlightWordAtPosition(wordInfo) {
    // 如果已经高亮了同一个单词位置，不重复处理
    if (this.currentHighlightedElement && 
        this.currentWordInfo && 
        this.currentWordInfo.word === wordInfo.word &&
        this.currentWordInfo.textNode === wordInfo.textNode &&
        this.currentWordInfo.startOffset === wordInfo.startOffset) {
      return;
    }

    // 移除之前的高亮
    this.removeHighlight();

    if (wordInfo.textNode && wordInfo.startOffset !== undefined && wordInfo.endOffset !== undefined) {
      // 精确高亮单词
      try {
        const range = document.createRange();
        range.setStart(wordInfo.textNode, wordInfo.startOffset);
        range.setEnd(wordInfo.textNode, wordInfo.endOffset);
        
        // 创建高亮的span元素
        const highlightSpan = document.createElement('span');
        highlightSpan.style.backgroundColor = '#ffeb3b';
        highlightSpan.style.padding = '1px 2px';
        highlightSpan.style.borderRadius = '3px';
        highlightSpan.style.cursor = 'pointer';
        highlightSpan.style.transition = 'all 0.2s ease';
        highlightSpan.className = 'spanish-highlight';
        
        // 包装选中的文本
        try {
          range.surroundContents(highlightSpan);
          this.currentHighlightedElement = highlightSpan;
          this.currentWordInfo = wordInfo;
          this.currentWord = wordInfo.word;
        } catch (e) {
          // 如果无法包装，回退到元素级高亮
          this.highlightElementFallback(wordInfo.element, wordInfo.word);
        }
      } catch (e) {
        // 如果range操作失败，回退到元素级高亮
        this.highlightElementFallback(wordInfo.element, wordInfo.word);
      }
    } else {
      // 回退到元素级高亮
      this.highlightElementFallback(wordInfo.element, wordInfo.word);
    }
  }

  highlightElementFallback(element, word) {
    // 添加高亮样式到整个元素
    element.style.backgroundColor = '#ffeb3b';
    element.style.padding = '2px';
    element.style.borderRadius = '3px';
    element.style.cursor = 'pointer';
    element.style.transition = 'all 0.2s ease';

    this.currentHighlightedElement = element;
    this.currentWord = word;
    this.currentWordInfo = { word: word, element: element };
  }

  removeHighlight() {
    if (this.currentHighlightedElement) {
      const element = this.currentHighlightedElement;
      
      // 如果是我们创建的高亮span，移除它并恢复原始文本
      if (element.className === 'spanish-highlight') {
        const parent = element.parentNode;
        if (parent) {
          // 将高亮span的内容替换回原始位置
          const textContent = element.textContent;
          parent.replaceChild(document.createTextNode(textContent), element);
          
          // 合并相邻的文本节点
          parent.normalize();
        }
      } else {
        // 移除元素级高亮样式
        element.style.backgroundColor = '';
        element.style.padding = '';
        element.style.borderRadius = '';
        element.style.cursor = '';
        element.style.transition = '';
      }

      this.currentHighlightedElement = null;
      this.currentWord = null;
      this.currentWordInfo = null;
    }
  }

  async getExplanation(word) {
    // 優先檢查靜態詞典
    if (this.explanations[word]) {
      return this.explanations[word];
    }

    // 檢查緩存
    if (this.explanationCache.has(word)) {
      return this.explanationCache.get(word);
    }

    // 如果沒有 API Key，返回預設訊息
    if (!this.openaiApiKey) {
      return `Para obtener explicaciones automáticas de "${word}", configura tu OpenAI API Key en el popup de la extensión.`;
    }

    // 檢查是否已經有進行中的請求
    if (this.pendingRequests.has(word)) {
      return this.pendingRequests.get(word);
    }

    // 創建 API 請求
    const explanationPromise = this.fetchExplanationFromAPI(word);
    this.pendingRequests.set(word, explanationPromise);

    try {
      const explanation = await explanationPromise;
      this.explanationCache.set(word, explanation);
      this.pendingRequests.delete(word);
      return explanation;
    } catch (error) {
      console.error('Error getting explanation:', error);
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
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || `Explicación no disponible para "${word}".`;
  }

  async showTooltip(word, event) {
    console.log(`[Spanish Dictionary] Showing tooltip for: ${word}`);
    console.log(`[Spanish Dictionary] API Key available: ${!!this.openaiApiKey}`);
    
    // 先顯示 tooltip 與載入訊息
    this.tooltip.querySelector('.word-title').textContent = word;
    this.tooltip.querySelector('.explanation').textContent = 'Cargando explicación...';
    
    // 显示tooltip
    this.cancelHideTooltip();
    this.tooltip.style.display = 'block';
    this.isTooltipVisible = true;
    this.positionTooltip(event);

    try {
      // 獲取解釋（可能是異步的）
      const explanation = await this.getExplanation(word);
      console.log(`[Spanish Dictionary] Got explanation: ${explanation}`);
      
      // 更新內容（如果 tooltip 還在顯示且是同一個單詞）
      if (this.isTooltipVisible && this.currentWord === word) {
        this.tooltip.querySelector('.explanation').textContent = explanation;
        
        // 设置复制按钮
        const copyBtn = this.tooltip.querySelector('.copy-btn');
        copyBtn.onclick = () => this.copyToClipboard(word, explanation);
        
        // 重新定位（內容可能改變大小）
        this.positionTooltip(event);
      }
    } catch (error) {
      console.error('Error showing tooltip:', error);
      if (this.isTooltipVisible && this.currentWord === word) {
        this.tooltip.querySelector('.explanation').textContent = 'Error al cargar la explicación.';
      }
    }
  }

  hideTooltip() {
    this.tooltip.style.display = 'none';
    this.isTooltipVisible = false;
    this.cancelHideTooltip();
  }

  positionTooltip(event) {
    // 先設定初始位置（在鼠標右上方）
    let x = event.clientX + 15;
    let y = event.clientY - 60;
    
    // 設定初始位置
    this.tooltip.style.left = x + 'px';
    this.tooltip.style.top = y + 'px';
    
    // 強制瀏覽器重新計算佈局
    this.tooltip.offsetWidth;
    
    // 現在獲取實際尺寸進行邊界檢查
    const rect = this.tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let adjustedX = x;
    let adjustedY = y;
    
    // 水平邊界檢查
    if (rect.right > windowWidth) {
      adjustedX = event.clientX - rect.width - 15;
      if (adjustedX < 0) {
        adjustedX = 10;
      }
    }
    
    // 垂直邊界檢查
    if (rect.top < 0) {
      adjustedY = event.clientY + 25;
    } else if (rect.bottom > windowHeight) {
      adjustedY = windowHeight - rect.height - 10;
      if (adjustedY < 0) {
        adjustedY = 10;
      }
    }
    
    // 如果位置需要調整，重新設定
    if (adjustedX !== x || adjustedY !== y) {
      this.tooltip.style.left = adjustedX + 'px';
      this.tooltip.style.top = adjustedY + 'px';
    }
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
        this.fallbackCopyTextToClipboard(textToCopy);
      });
    } else {
      this.fallbackCopyTextToClipboard(textToCopy);
    }
  }

  fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCopyFeedback();
    } catch (err) {
      console.error('复制失败:', err);
    }
    
    document.body.removeChild(textArea);
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

// 防止重複初始化
if (!window.spanishDictionaryInstance) {
  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.spanishDictionaryInstance = new SpanishDictionary();
      
      // 添加全域調試方法
      window.checkSpanishDictionary = () => {
        const instance = window.spanishDictionaryInstance;
        console.log('=== Spanish Dictionary Status ===');
        console.log(`Instance ID: ${instance.instanceId}`);
        console.log(`Extension Enabled: ${instance.extensionEnabled}`);
        console.log(`API Key: ${!!instance.openaiApiKey}`);
        console.log(`Model: ${instance.selectedModel}`);
        console.log(`Tooltip Visible: ${instance.isTooltipVisible}`);
        console.log(`Current Word: ${instance.currentWord}`);
        return instance;
      };
    });
  } else {
    window.spanishDictionaryInstance = new SpanishDictionary();
    
    // 添加全域調試方法
    window.checkSpanishDictionary = () => {
      const instance = window.spanishDictionaryInstance;
      console.log('=== Spanish Dictionary Status ===');
      console.log(`Instance ID: ${instance.instanceId}`);
      console.log(`Extension Enabled: ${instance.extensionEnabled}`);
      console.log(`API Key: ${!!instance.openaiApiKey}`);
      console.log(`Model: ${instance.selectedModel}`);
      console.log(`Tooltip Visible: ${instance.isTooltipVisible}`);
      console.log(`Current Word: ${instance.currentWord}`);
      return instance;
    };
  }
} else {
  console.log('[Spanish Dictionary] Instance already exists, skipping initialization');
}