// 简化版测试代码
class SpanishDictionaryTest {
  constructor() {
    console.log('🚀 Spanish Dictionary Test Starting...');
    
    this.testWords = ['medidas', 'fuerza', 'gremio', 'aerolíneas', 'cancelación'];
    this.basicWords = ['el', 'la', 'un', 'una', 'de', 'que', 'y', 'es', 'en'];
    
    this.explanations = {
      'medidas': 'Acciones o reglas para hacer algo.',
      'fuerza': 'Poder para hacer algo.',
      'gremio': 'Grupo de trabajadores del mismo tipo.',
      'aerolíneas': 'Empresas que tienen aviones para viajar.',
      'cancelación': 'Cuando algo no va a pasar.'
    };
    
    this.runTests();
  }
  
  runTests() {
    console.log('📋 Running unit tests...');
    
    // Test 1: Word detection
    console.log('Test 1: Word detection');
    this.testWords.forEach(word => {
      const isComplex = this.isComplexWord(word);
      console.log(`  ${word}: ${isComplex ? '✅ Complex' : '❌ Not complex'}`);
    });
    
    // Test 2: Basic words should not be complex
    console.log('Test 2: Basic words');
    this.basicWords.forEach(word => {
      const isComplex = this.isComplexWord(word);
      console.log(`  ${word}: ${isComplex ? '❌ Should not be complex' : '✅ Correctly basic'}`);
    });
    
    // Test 3: DOM interaction
    this.setupDOMTest();
  }
  
  isComplexWord(word) {
    const cleanWord = word.toLowerCase().trim();
    if (cleanWord.length <= 3) return false;
    if (this.basicWords.includes(cleanWord)) return false;
    return this.explanations[cleanWord] !== undefined;
  }
  
  setupDOMTest() {
    console.log('📋 Setting up DOM test...');
    
    // Create test tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'spanish-tooltip-test';
    tooltip.style.cssText = `
      position: absolute;
      background: #333;
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10000;
      display: none;
    `;
    document.body.appendChild(tooltip);
    
    // Add mouseover test
    document.addEventListener('mouseover', (e) => {
      const element = e.target;
      const text = element.textContent ? element.textContent.trim() : '';
      
      if (text && this.isComplexWord(text)) {
        console.log(`🎯 Found complex word: "${text}"`);
        
        // Highlight element
        element.style.backgroundColor = '#ffeb3b';
        element.style.cursor = 'pointer';
        
        // Show test tooltip
        tooltip.textContent = `${text}: ${this.explanations[text.toLowerCase()] || 'No explanation'}`;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.pageX + 10) + 'px';
        tooltip.style.top = (e.pageY - 30) + 'px';
      }
    });
    
    document.addEventListener('mouseout', (e) => {
      const element = e.target;
      element.style.backgroundColor = '';
      element.style.cursor = '';
      tooltip.style.display = 'none';
    });
    
    console.log('✅ DOM test setup complete');
    console.log('💡 Try hovering over Spanish words on the page!');
  }
}

// 启动测试
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SpanishDictionaryTest();
  });
} else {
  new SpanishDictionaryTest();
}