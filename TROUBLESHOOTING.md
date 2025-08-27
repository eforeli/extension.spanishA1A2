# 🔧 Spanish Dictionary Extension - Troubleshooting Guide

## Quick Fix Steps

### 1. ✅ URGENT: Extension was fixed!
- **FIXED**: Removed dangerous `createPartialHighlight` function that was breaking page layouts
- **FIXED**: Cleaned up old conflicting `content.js` file
- **FIXED**: Simplified highlighting to safe element-level only

### 2. 🔄 Reload Extension in Chrome
**IMPORTANT: You must reload the extension after the fix!**

1. Open Chrome and go to `chrome://extensions/`
2. Find "Diccionario Español Simplificado" 
3. Click the **🔄 reload** button
4. Refresh any open webpages where you want to use the extension

### 3. 🔑 Configure API Key
1. Click the extension icon in Chrome toolbar
2. Enter your OpenAI API Key (starts with `sk-`)
3. Click "Guardar" 
4. Click "Probar API Key" to verify it works
5. Make sure extension status shows "Activo" (Active)

### 4. 🧪 Test the Extension
1. Open `test_final.html` file
2. Or visit any Spanish website (like rtve.es)
3. Hover over complex words - they should highlight in yellow
4. Click on highlighted words - should show AI explanation (not generic dictionary message)

## Debug Commands

If still having issues, open browser console (`F12`) and run:

```javascript
// Check extension status
window.checkSpanishDictionary();

// Test API manually
window.spanishDictionaryNewInstance.getExplanation('incomprensible');
```

## What Was Fixed

✅ **Page Layout Breaking**: Removed dangerous innerHTML manipulation that was destroying website layouts
✅ **Multiple Instances**: Removed old content.js causing conflicts  
✅ **Communication Errors**: Fixed "Could not establish connection" errors with proper error handling
✅ **Safe Highlighting**: Only highlight complete elements, no partial text replacement
✅ **OpenAI Integration**: Proper API calls with GPT-4o Mini (cheapest model) as default

## Expected Behavior

- **Single words**: Highlight whole element containing the word
- **Short phrases**: Highlight if ≤3 words and ≤50 characters
- **Long paragraphs**: NO highlighting (prevents layout breaks)
- **Click tooltips**: Show OpenAI-generated explanations, not generic "busca en diccionario" messages
- **Toggle**: Extension can be turned on/off via popup

## Still Having Issues?

1. Make sure extension is reloaded in Chrome
2. Check API key is properly saved and tested
3. Try the debug script: copy content from `debug_extension.js` and paste in browser console
4. Verify no other Spanish dictionary extensions are conflicting