/**
 * ADISA EXPERT ENGINE (V2.1 - The Veteran Builder Core)
 * A deterministic physics engine for bridging DOM logic to Figma AutoLayout.
 * With absolute Sandbox & SVG Resilience.
 */

(async () => {
    try {
        console.log("🚀 Adisa v2.1: Master Architectural Core Booting...");

        const oldStatus = document.getElementById('adisa-status');
        if (oldStatus) oldStatus.remove();

        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            .adisa-highlight { outline: 3px solid #00ff88 !important; outline-offset: -3px !important; cursor: crosshair !important; transition: outline 0.05s ease; }
            #adisa-status { position: fixed; top: 15px; left: 50%; transform: translateX(-50%); background: #000; color: #00ff88; padding: 12px 24px; border-radius: 4px; font-weight: bold; z-index: 9999999; box-shadow: 0 10px 40px rgba(0,0,0,0.8); pointer-events: none; font-family: 'Inter', sans-serif; border-bottom: 3px solid #00ff88; text-transform: uppercase; letter-spacing: 1px; }
        `;
        
        // Resilience against isolated iframes (like about:srcdoc) which might not have a document.head
        const targetHead = document.head || document.documentElement || document.body;
        targetHead.appendChild(style);

        const status = document.createElement('div');
        status.id = 'adisa-status';
        status.innerText = '🎯 V2.1 ENGINE READY: CLICK TO CAPTURE TARGET';
        document.body.appendChild(status);

        function rgbToFigma(rgbString) {
            if (!rgbString || rgbString === 'transparent' || rgbString === 'rgba(0, 0, 0, 0)') return null;
            if (rgbString.includes('rgba') && rgbString.split(',').length === 4) {
                const alpha = parseFloat(rgbString.split(',')[3]);
                if (alpha === 0) return null;
            }
            const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (!match) return null;
            return [{ type: 'SOLID', color: { r: match[1]/255, g: match[2]/255, b: match[3]/255 }, opacity: match[4] !== undefined ? parseFloat(match[4]) : 1 }];
        }

        async function encodeImageElement(el) {
            return new Promise((resolve) => {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = el.naturalWidth || el.width || 100;
                    canvas.height = el.naturalHeight || el.height || 100;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(el, 0, 0);
                    resolve(canvas.toDataURL("image/png"));
                } catch (e) { resolve(null); }
            });
        }

        async function encodeImageUrl(url) {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width; canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => resolve(null);
                img.src = url;
            });
        }

        function parseTypography(el, style) {
            let ls = 0;
            if (style.letterSpacing && style.letterSpacing !== 'normal') {
                ls = parseFloat(style.letterSpacing);
                if (style.letterSpacing.includes('em')) ls = ls * (parseFloat(style.fontSize) || 16);
            }

            let lh = parseFloat(style.lineHeight);
            if (isNaN(lh)) lh = (parseFloat(style.fontSize) || 16) * 1.25;

            let fw = parseInt(style.fontWeight) || 400;
            if (style.fontWeight === 'bold') fw = 700;

            let fontStyle = 'Regular';
            if (fw >= 700) fontStyle = 'Bold';
            else if (fw >= 600) fontStyle = 'SemiBold';
            else if (fw >= 500) fontStyle = 'Medium';
            else if (fw <= 300) fontStyle = 'Light';

            return {
                fontSize: parseFloat(style.fontSize) || 16,
                fontFamily: (style.fontFamily || 'Inter').split(',')[0].replace(/['"]/g, ''),
                fontStyle: fontStyle,
                letterSpacing: ls,
                lineHeight: lh,
                color: rgbToFigma(style.color) || [],
                align: (style.textAlign || 'left').toUpperCase().replace('START', 'LEFT').replace('END', 'RIGHT')
            };
        }

        async function elementToFigma(el, isRoot = false) {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            
            if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || style.opacity === '0') return null;

            // FIX: Robust className extraction (Resilient to SVGs and MathML)
            const cls = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal ? el.className.baseVal : '');
            const friendlyName = (el.tagName || 'div').toLowerCase() + (cls ? '.' + cls.split(' ')[0] : (el.id ? '#' + el.id : ''));
            
            const node = {
                id: friendlyName,
                name: isRoot ? '🚀 Adisa V2 Master Container' : friendlyName,
                width: rect.width,
                height: rect.height,
                opacity: parseFloat(style.opacity) || 1,
                cornerRadius: parseFloat(style.borderRadius) || 0,
                fills: [],
                strokes: []
            };

            if (el.tagName && el.tagName.toUpperCase() === 'SVG') {
                node.type = 'SVG'; node.svg = el.outerHTML; return node;
            }

            if (style.position === 'absolute' || style.position === 'fixed') {
                node.layoutPositioning = 'ABSOLUTE';
            }

            // Apply Design Variables
            const bgFill = rgbToFigma(style.backgroundColor);
            if (bgFill) node.fills.push(...bgFill);

            if (style.borderWidth !== '0px' && style.borderStyle !== 'none') {
                const strokeColor = rgbToFigma(style.borderColor);
                if (strokeColor) { node.strokes.push(...strokeColor); node.strokeWeight = parseFloat(style.borderTopWidth) || 1; }
            }

            // Asset Pipeline 
            if (el.tagName === 'IMG' && el.src) {
                const base64 = await encodeImageElement(el);
                if (base64) node.fills.push({ type: 'IMAGE_BASE64', data: base64.split(',')[1] });
            } else if (style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage.includes('url')) {
                const urlMatch = style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
                if (urlMatch && urlMatch[1]) {
                    const base64 = await encodeImageUrl(urlMatch[1]);
                    if (base64) node.fills.push({ type: 'IMAGE_BASE64', data: base64.split(',')[1] });
                }
            }

            const isPureTextNode = Array.from(el.childNodes).length > 0 && Array.from(el.childNodes).every(n => n.nodeType === 3 || (n.nodeType === 1 && ['BR', 'STRONG', 'B', 'EM', 'I', 'SPAN'].includes(n.tagName)));
            const textContent = el.innerText || el.textContent || '';
            const trimmedText = textContent.trim();

            // Safe Text Flattening
            if (isPureTextNode && trimmedText.length > 0) {
                const typo = parseTypography(el, style);
                node.type = 'TEXT';
                node.characters = trimmedText;
                node.fontSize = typo.fontSize;
                node.fontName = { family: typo.fontFamily, style: typo.fontStyle };
                node.fills = typo.color;
                node.textAlignHorizontal = typo.align;
                node.letterSpacing = { value: typo.letterSpacing, unit: 'PIXELS' };
                node.lineHeight = { value: typo.lineHeight, unit: 'PIXELS' };
                node.layoutSizingHorizontal = 'FILL';
                return node;
            } else {
                // Container Layout Mathematics
                node.type = 'FRAME';
                node.layoutSizingHorizontal = 'FIXED';
                node.layoutSizingVertical = 'FIXED';
                
                node.paddingLeft = parseFloat(style.paddingLeft) || 0; node.paddingRight = parseFloat(style.paddingRight) || 0;
                node.paddingTop = parseFloat(style.paddingTop) || 0; node.paddingBottom = parseFloat(style.paddingBottom) || 0;

                const isFlex = style.display === 'flex';
                const isGrid = style.display === 'grid';
                const alignMap = { 'flex-start': 'MIN', 'center': 'CENTER', 'flex-end': 'MAX', 'space-between': 'SPACE_BETWEEN' };

                let inferredGap = parseFloat(style.gap) || 0;
                if (!isFlex && !isGrid && el.children.length > 1) {
                    const childMargins = Array.from(el.children).map(c => parseFloat(window.getComputedStyle(c).marginBottom) || 0);
                    inferredGap = Math.max(...childMargins, 0);
                }
                node.itemSpacing = inferredGap;

                if (isFlex) {
                    node.layoutMode = style.flexDirection.includes('row') ? 'HORIZONTAL' : 'VERTICAL';
                    if (style.flexWrap === 'wrap') node.layoutWrap = 'WRAP';
                    node.primaryAxisAlignItems = alignMap[style.justifyContent] || 'MIN';
                    node.counterAxisAlignItems = alignMap[style.alignItems] || 'MIN';
                } else if (isGrid) {
                    node.layoutMode = 'HORIZONTAL'; 
                    node.layoutWrap = 'WRAP';
                    node.primaryAxisAlignItems = alignMap[style.justifyContent] || 'MIN';
                } else {
                    node.layoutMode = 'VERTICAL'; 
                    node.primaryAxisAlignItems = 'MIN';
                    node.counterAxisAlignItems = 'MIN';
                }

                const parentStyle = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
                // Grids enforce FILL so that wrap children map out efficiently
                if (parentStyle && parentStyle.display === 'grid') {
                    node.layoutSizingHorizontal = 'FIXED';
                } else if (style.flexGrow && parseFloat(style.flexGrow) > 0) {
                    node.layoutSizingHorizontal = 'FILL';
                } else if (style.width === '100%' || style.display === 'block' || isGrid) {
                    node.layoutSizingHorizontal = 'FILL';
                }
                
                if (style.height === 'auto') node.layoutSizingVertical = 'HUG';

                node.children = [];

                ['::before', '::after'].forEach(pseudo => {
                    const ps = window.getComputedStyle(el, pseudo);
                    if (ps.content && ps.content !== 'none' && ps.content !== 'normal') {
                        const c = ps.content.replace(/^["']|["']$/g, '');
                        if (c) {
                            const t = parseTypography(el, ps);
                            node.children.push({
                                type: 'TEXT', characters: c, fontSize: t.fontSize, fontName: { family: t.fontFamily, style: t.fontStyle }, fills: t.color, layoutSizingHorizontal: 'HUG'
                            });
                        }
                    }
                });

                for (const child of el.children) {
                    const childNode = await elementToFigma(child);
                    if (childNode) node.children.push(childNode);
                }
            }

            return node;
        }

        let lastEl = null;
        const overHandler = (e) => { 
            if (lastEl) lastEl.classList.remove('adisa-highlight'); 
            if (e.target && e.target.classList) {
                 e.target.classList.add('adisa-highlight'); 
                 lastEl = e.target; 
            }
        };
        const outHandler = (e) => { 
            if (e.target && e.target.classList) e.target.classList.remove('adisa-highlight'); 
        };

        const clickHandler = async (e) => {
            e.preventDefault(); e.stopPropagation();
            status.innerText = '⚡ V2.2 CAPTURING DOM PHYSICS ⚡';
            
            const target = e.target; 
            if (target && target.classList) target.classList.remove('adisa-highlight');

            try {
                const figmaData = await elementToFigma(target, true);
                const jsonStr = JSON.stringify(figmaData);
                
                // GUARANTEED SANDBOX EXTRACTION: Print directly to console
                console.log('%c🚀 ADISA CAPTURE DATA BELOW 🚀', 'color: #00ff88; font-weight: bold; font-size: 14px;');
                console.log(jsonStr);

                // Attempt clipboard copy
                try {
                    const txt = document.createElement('textarea');
                    txt.value = jsonStr; document.body.appendChild(txt);
                    txt.select(); document.execCommand('copy'); document.body.removeChild(txt);
                } catch(e) {}
                
                status.innerText = '✅ COPIED! (Also printed in Console)';
                status.style.background = '#00ff88';
                status.style.color = '#000';
                
                setTimeout(() => { if (status.parentNode) status.parentNode.removeChild(status); }, 4000);
            } catch (err) {
                console.error(err); status.innerText = '❌ ERROR: CHECK CONSOLE';
            }

            document.removeEventListener('mouseover', overHandler);
            document.removeEventListener('mouseout', outHandler);
            document.removeEventListener('click', clickHandler, true);
            if (lastEl && lastEl.classList) lastEl.classList.remove('adisa-highlight');
        };

        document.addEventListener('mouseover', overHandler);
        document.addEventListener('mouseout', outHandler);
        document.addEventListener('click', clickHandler, true);

    } catch(err) {
        console.error("Adisa Engine failed to start:", err);
        alert("Adisa Boot Error: " + err.message);
    }
})();
