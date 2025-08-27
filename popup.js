document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyButton = document.getElementById('saveKey');
  const testKeyButton = document.getElementById('testKey');
  const apiStatus = document.getElementById('apiStatus');
  const toggleButton = document.getElementById('toggleButton');
  const extensionStatus = document.getElementById('extensionStatus');
  const modelSelect = document.getElementById('modelSelect');
  const modelInfo = document.getElementById('modelInfo');

  // 模型資訊 (2024年實際價格)
  const modelInfoText = {
    'gpt-4o-mini': 'GPT-4o Mini: $0.000150/1000 tokens - ✅ MÁS BARATO',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo: $0.001/1000 tokens - Rápido pero más caro',
    'gpt-4o': 'GPT-4o: $0.005/1000 tokens - Máxima calidad, caro',
    'gpt-4': 'GPT-4: $0.06/1000 tokens - Modelo clásico, muy caro'
  };

  // 載入已保存的設定
  loadSettings();

  saveKeyButton.addEventListener('click', saveApiKey);
  testKeyButton.addEventListener('click', testApiKey);
  toggleButton.addEventListener('click', toggleExtension);
  modelSelect.addEventListener('change', updateModelInfo);
  apiKeyInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveApiKey();
    }
  });

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['openaiApiKey', 'extensionEnabled', 'selectedModel']);
      
      // 載入 API Key
      if (result.openaiApiKey) {
        apiKeyInput.value = '••••••••••••••••••••••••••••••••••••••••••••••••••••';
        updateStatus('API Key ya configurada', 'success');
      }
      
      // 載入模型選擇 (預設為最便宜的 GPT-4o Mini)
      const selectedModel = result.selectedModel || 'gpt-4o-mini';
      modelSelect.value = selectedModel;
      updateModelInfo();
      
      // 載入擴充功能狀態
      const isEnabled = result.extensionEnabled !== false; // 預設為開啟
      updateExtensionStatus(isEnabled);
      
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••••••••••••••••••••••••') {
      updateStatus('Por favor ingresa una API Key válida', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      updateStatus('La API Key debe comenzar con "sk-"', 'error');
      return;
    }

    try {
      const selectedModel = modelSelect.value;
      await chrome.storage.sync.set({ 
        openaiApiKey: apiKey,
        selectedModel: selectedModel
      });
      apiKeyInput.value = '••••••••••••••••••••••••••••••••••••••••••••••••••••';
      updateStatus(`Configuración guardada (Modelo: ${selectedModel})`, 'success');
      
      // Notificar a los content scripts
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'settingsUpdated',
            apiKey: apiKey,
            selectedModel: selectedModel
          }).catch((error) => {
            console.log('Settings message send failed (this is normal if page has no content script):', error);
          });
        }
      });
      
    } catch (error) {
      console.error('Error saving API key:', error);
      updateStatus('Error al guardar la API Key', 'error');
    }
  }

  async function testApiKey() {
    const result = await chrome.storage.sync.get(['openaiApiKey', 'selectedModel']);
    const apiKey = result.openaiApiKey;
    const selectedModel = result.selectedModel || 'gpt-4o-mini';
    
    if (!apiKey) {
      updateStatus('Primero debes guardar una API Key', 'error');
      return;
    }

    updateStatus('Probando API Key...', '');
    testKeyButton.disabled = true;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{
            role: 'user',
            content: 'Responde solo con "OK" para probar la conexión.'
          }],
          max_tokens: 10,
          temperature: 0
        })
      });

      if (response.ok) {
        updateStatus(`✅ API Key funciona correctamente con ${selectedModel}`, 'success');
      } else {
        const errorData = await response.json();
        updateStatus(`❌ Error: ${errorData.error?.message || 'API Key inválida'}`, 'error');
      }
    } catch (error) {
      console.error('Error testing API:', error);
      updateStatus('❌ Error de conexión', 'error');
    } finally {
      testKeyButton.disabled = false;
    }
  }

  function updateStatus(message, type) {
    apiStatus.textContent = message;
    apiStatus.className = `api-status ${type}`;
  }

  async function toggleExtension() {
    try {
      const result = await chrome.storage.sync.get('extensionEnabled');
      const currentState = result.extensionEnabled !== false; // 預設為開啟
      const newState = !currentState;
      
      await chrome.storage.sync.set({ extensionEnabled: newState });
      updateExtensionStatus(newState);
      
      // 通知 content scripts
      chrome.tabs.query({}, function(tabs) {
        console.log(`Broadcasting toggle to ${tabs.length} tabs, new state: ${newState}`);
        tabs.forEach(tab => {
          // 過濾掉系統頁面，但包括所有網頁
          if (tab.url && 
              !tab.url.startsWith('chrome://') && 
              !tab.url.startsWith('chrome-extension://') && 
              !tab.url.startsWith('edge://') &&
              !tab.url.startsWith('about:')) {
            console.log(`Sending toggle message to tab: ${tab.url}`);
            chrome.tabs.sendMessage(tab.id, {
              action: 'extensionToggled',
              enabled: newState
            }).catch((error) => {
              // 靜默處理錯誤，避免 console 錯誤
            });
          }
        });
      });
      
    } catch (error) {
      console.error('Error toggling extension:', error);
    }
  }

  function updateExtensionStatus(isEnabled) {
    if (isEnabled) {
      extensionStatus.textContent = 'Activo';
      extensionStatus.className = 'status';
      extensionStatus.style.background = 'rgba(76, 175, 80, 0.8)';
      toggleButton.textContent = '⏸️';
      toggleButton.title = 'Desactivar extensión';
    } else {
      extensionStatus.textContent = 'Inactivo';
      extensionStatus.className = 'status';
      extensionStatus.style.background = 'rgba(244, 67, 54, 0.8)';
      toggleButton.textContent = '▶️';
      toggleButton.title = 'Activar extensión';
    }
  }

  function updateModelInfo() {
    const selectedModel = modelSelect.value;
    modelInfo.textContent = modelInfoText[selectedModel];
  }
});