// 簡化版本測試開關邏輯
class TestSpanishDictionary {
  constructor() {
    this.extensionEnabled = true;
    this.setupEventListeners();
    console.log('TestSpanishDictionary initialized, enabled:', this.extensionEnabled);
  }

  setupEventListeners() {
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('click', (e) => this.handleClick(e));
  }

  handleMouseMove(event) {
    if (!this.extensionEnabled) {
      console.log('Mouse move BLOCKED - extension disabled');
      return;
    }
    
    // 簡單的測試邏輯
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (element && element.tagName === 'SPAN') {
      element.style.backgroundColor = 'yellow';
      console.log('Highlighting element:', element.textContent);
    }
  }

  handleClick(event) {
    if (!this.extensionEnabled) {
      console.log('Click BLOCKED - extension disabled');
      return;
    }
    
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (element && element.tagName === 'SPAN') {
      alert(`Clicked: ${element.textContent}`);
    }
  }

  toggle() {
    this.extensionEnabled = !this.extensionEnabled;
    console.log('Toggle called, new state:', this.extensionEnabled);
    
    if (!this.extensionEnabled) {
      // 移除所有黃色背景
      document.querySelectorAll('span').forEach(span => {
        span.style.backgroundColor = '';
      });
      console.log('Removed all highlights');
    }
  }
}

// 創建測試實例
window.testInstance = new TestSpanishDictionary();

// 測試函數
window.testToggle = () => {
  window.testInstance.toggle();
};

window.testStatus = () => {
  console.log('Extension enabled:', window.testInstance.extensionEnabled);
  return window.testInstance.extensionEnabled;
};

console.log('Test script loaded. Use testToggle() to toggle, testStatus() to check status.');