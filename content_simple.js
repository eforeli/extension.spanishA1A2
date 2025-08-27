// 极简版本 - 直接测试功能
(function() {
    'use strict';
    
    // 预设词汇
    const complexWords = {
        'medidas': 'Acciones o reglas para hacer algo.',
        'fuerza': 'Poder para hacer algo.',
        'gremio': 'Grupo de trabajadores del mismo tipo.',
        'aerolíneas': 'Empresas que tienen aviones para viajar.',
        'cancelación': 'Cuando algo no va a pasar.',
        'ludmila': 'Es un nombre de persona.'
    };
    
    let currentHighlight = null;
    
    // 检查文本中是否包含词汇的函数
    function findComplexWord(text) {
        if (!text) return null;
        const words = text.toLowerCase().split(/\s+/);
        for (const word of words) {
            const cleanWord = word.replace(/[^\w]/g, ''); // 移除标点符号
            if (complexWords[cleanWord]) {
                return cleanWord;
            }
        }
        return null;
    }
    
    // 添加鼠标监听
    document.addEventListener('mouseover', function(e) {
        const text = e.target.textContent;
        const foundWord = findComplexWord(text);
        
        if (foundWord) {
            // 移除之前的高亮
            if (currentHighlight) {
                currentHighlight.style.backgroundColor = '';
            }
            
            // 高亮当前元素
            e.target.style.backgroundColor = '#ffeb3b';
            e.target.style.cursor = 'pointer';
            currentHighlight = e.target;
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (currentHighlight === e.target) {
            e.target.style.backgroundColor = '';
            e.target.style.cursor = '';
            currentHighlight = null;
        }
    });
    
    document.addEventListener('click', function(e) {
        const text = e.target.textContent;
        const foundWord = findComplexWord(text);
        
        if (foundWord && complexWords[foundWord]) {
            // 创建简单的tooltip
            let tooltip = document.getElementById('simple-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'simple-tooltip';
                tooltip.style.cssText = `
                    position: absolute;
                    background: #333;
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    font-size: 14px;
                    z-index: 10000;
                    max-width: 300px;
                `;
                document.body.appendChild(tooltip);
            }
            
            tooltip.innerHTML = `
                <strong>${foundWord}</strong><br>
                ${complexWords[foundWord]}
                <br><button onclick="navigator.clipboard.writeText('${foundWord}: ${complexWords[foundWord]}')">📋 Copiar</button>
            `;
            
            tooltip.style.display = 'block';
            tooltip.style.left = (e.pageX + 10) + 'px';
            tooltip.style.top = (e.pageY - 60) + 'px';
            
            // 3秒后隐藏
            setTimeout(() => {
                tooltip.style.display = 'none';
            }, 3000);
        }
    });
    
    console.log('✅ Simple Spanish Dictionary loaded');
    
})();