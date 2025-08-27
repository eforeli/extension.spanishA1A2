// Debug script to check extension status
// Run this in browser console on any webpage with the extension

console.log('=== SPANISH DICTIONARY EXTENSION DEBUG ===');

// Check if content script is loaded
if (window.spanishDictionaryNewInstance) {
    console.log('✅ Extension content script is loaded');
    const instance = window.spanishDictionaryNewInstance;
    
    console.log(`Instance ID: ${instance.instanceId}`);
    console.log(`Extension Enabled: ${instance.extensionEnabled}`);
    console.log(`API Key Set: ${!!instance.openaiApiKey ? 'YES' : 'NO'}`);
    console.log(`Selected Model: ${instance.selectedModel}`);
    console.log(`Current Word: ${instance.currentWord || 'None'}`);
    console.log(`Tooltip Visible: ${instance.isTooltipVisible}`);
    
    // Test API key if available
    if (instance.openaiApiKey) {
        console.log('🔑 API Key is available, testing...');
        instance.getExplanation('incomprensible').then(explanation => {
            console.log('✅ API Test Result:', explanation);
        }).catch(error => {
            console.log('❌ API Test Error:', error);
        });
    } else {
        console.log('⚠️  No API Key set. Go to extension popup to configure.');
    }
} else if (window.checkSpanishDictionary) {
    console.log('🔍 Found checkSpanishDictionary function');
    try {
        const result = window.checkSpanishDictionary();
        console.log('Extension status:', result);
    } catch (error) {
        console.log('Error checking extension:', error);
    }
} else {
    console.log('❌ Extension content script is NOT loaded');
    console.log('Solutions:');
    console.log('1. Reload the Chrome extension in chrome://extensions/');
    console.log('2. Refresh this webpage');
    console.log('3. Check if the extension is enabled');
}

// Check for conflicts
console.log('\n=== CHECKING FOR CONFLICTS ===');
if (window.spanishDictionaryInstance && window.spanishDictionaryNewInstance) {
    if (window.spanishDictionaryInstance !== window.spanishDictionaryNewInstance) {
        console.log('⚠️  Multiple extension instances detected!');
    }
}

// Test basic functionality
console.log('\n=== TESTING BASIC FUNCTIONALITY ===');
const testElement = document.createElement('span');
testElement.textContent = 'incomprensible';
testElement.style.display = 'inline';
document.body.appendChild(testElement);

setTimeout(() => {
    console.log('Test element added. Try hovering over it to test highlighting.');
    console.log('Element:', testElement);
}, 100);