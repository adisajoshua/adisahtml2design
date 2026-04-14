/**
 * ADISA "ABSOLUTE TRUTH" (V9.0)
 * Deterministic pixel-perfect rendering with Aggressive Wrapper Pruning.
 * No Auto-Layout.
 */

(async () => {
    try {
        console.log("🚀 Adisa v9.0: ABSOLUTE TRUTH BOOTING...");

        const oldStatus = document.getElementById('adisa-status');
        if (oldStatus) oldStatus.remove();

        const style = document.createElement('style');
        style.type = 'text/css'; style.innerHTML = `
            .adisa-highlight { outline: 3px solid #ff0088 !important; outline-offset: -3px !important; z-index: 9999999; cursor: crosshair; }
            #adisa-status { position: fixed; top: 15px; left: 50%; transform: translateX(-50%); background: #000; color: #ff0088; padding: 12px 24px; border-radius: 4px; font-weight: bold; z-index: 9999999; box-shadow: 0 10px 40px rgba(0,0,0,0.8); pointer-events: none; font-family: sans-serif; border-bottom: 3px solid #ff0088; text-transform: uppercase; }
        `;
        document.head.appendChild(style);

        const status = document.createElement('div');
        status.id = 'adisa-status';
        status.innerText = '🎯 V9.0 (ABSOLUTE PRUNER) READY: CLICK TO CAPTURE';
        document.body.appendChild(status);

        function rgbToFigma(rgbString) {
            if (!rgbString || rgbString === 'transparent' || rgbString.includes('rgba(0, 0, 0, 0)') || rgbString === 'none') return null;
            const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (!match) return null;
            return { type: 'SOLID', color: { r: match[1]/255, g: match[2]/255, b: match[3]/255 }, opacity: match[4] !== undefined ? parseFloat(match[4]) : 1 };
        }

        function hasVisualData(style, tagName) {
            if (['SVG', 'IMG', 'PICTURE', 'CANVAS', 'VIDEO'].includes(tagName)) return true;
            
            const bg = rgbToFigma(style.backgroundColor);
            if (bg && bg.opacity > 0) return true;
            
            const borderW = parseFloat(style.borderWidth) || parseFloat(style.borderTopWidth);
            const borderC = rgbToFigma(style.borderColor);
            if (borderW > 0 && borderC && borderC.opacity > 0) return true;

            if (style.boxShadow && style.boxShadow !== 'none') return true;
            if (style.overflow === 'hidden' || style.overflow === 'scroll') return true; // Keep clipping boundaries

            return false;
        }

        async function processNode(el, referenceRect) {
            if (el.nodeType === 3) {
                const text = el.textContent.trim();
                if (!text) return [];
                
                const range = document.createRange();
                range.selectNodeContents(el);
                const rect = range.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return [];

                const style = window.getComputedStyle(el.parentElement);
                let fw = parseInt(style.fontWeight) || 400;
                const fill = rgbToFigma(style.color) || { type: 'SOLID', color: {r:0,g:0,b:0} };

                let lh = parseFloat(style.lineHeight);
                if (isNaN(lh)) lh = (parseFloat(style.fontSize) || 16) * 1.2;

                return [{
                    type: 'TEXT',
                    characters: el.textContent.replace(/\s+/g, ' '),
                    x: rect.left - referenceRect.left,
                    y: rect.top - referenceRect.top,
                    width: rect.width,
                    height: rect.height,
                    fontSize: parseFloat(style.fontSize) || 16,
                    lineHeight: { value: lh, unit: 'PIXELS' },
                    fontFamily: style.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
                    fontStyle: fw >= 700 ? 'Bold' : (fw >= 500 ? 'Medium' : 'Regular'),
                    fills: [fill],
                    textAlignHorizontal: (style.textAlign || 'left').toUpperCase().replace('START','LEFT').replace('END','RIGHT'),
                    layoutPositioning: 'ABSOLUTE',
                    layoutMode: 'NONE' // Enforce absolute freedom
                }];
            }

            if (el.nodeType !== 1) return [];
            
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return [];
            
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return [];

            const tagName = el.tagName.toUpperCase();

            // Handle pure Vector SVGs
            if (tagName === 'SVG') {
                return [{
                    type: 'SVG',
                    svg: el.outerHTML,
                    x: rect.left - referenceRect.left,
                    y: rect.top - referenceRect.top,
                    width: rect.width,
                    height: rect.height,
                    layoutPositioning: 'ABSOLUTE'
                }];
            }
            
            // Core Logic: Is it Visual or a Phantom Wrapper?
            const isVisual = hasVisualData(style, tagName);
            let createdFrames = [];

            if (isVisual || el.id === 'root' || tagName === 'BODY') {
                // IT HAS VISUALS: CREATE A FIGMA BOX
                const fills = [];
                const bg = rgbToFigma(style.backgroundColor);
                if (bg) fills.push(bg);

                const strokes = [];
                const borderW = parseFloat(style.borderWidth) || parseFloat(style.borderTopWidth);
                const borderC = rgbToFigma(style.borderColor);
                if (borderW > 0 && borderC) strokes.push(borderC);

                const node = {
                    type: 'FRAME',
                    name: tagName + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''),
                    x: rect.left - referenceRect.left,
                    y: rect.top - referenceRect.top,
                    width: rect.width,
                    height: rect.height,
                    fills: fills,
                    strokes: strokes,
                    strokeWeight: borderW || 0,
                    cornerRadius: parseFloat(style.borderRadius) || 0,
                    layoutMode: 'NONE', // V9.0: Kill all Auto Layout
                    layoutPositioning: 'ABSOLUTE',
                    clipsContent: style.overflow === 'hidden' || style.overflow === 'scroll',
                    children: [] 
                };

                // The new reference rect for children is THIS node's rect.
                for (const child of el.childNodes) {
                    const mappedChildren = await processNode(child, rect);
                    node.children.push(...mappedChildren);
                }

                createdFrames.push(node);
            } else {
                // PHANTOM WRAPPER: DO NOT create a frame! 
                // Pass the CURRENT referenceRect down to children.
                for (const child of el.childNodes) {
                    const mappedChildren = await processNode(child, referenceRect);
                    createdFrames.push(...mappedChildren);
                }
            }

            return createdFrames;
        }

        // Restore Highlighting
        document.addEventListener('mouseover', (e) => { if (e.target.classList) e.target.classList.add('adisa-highlight'); });
        document.addEventListener('mouseout', (e) => { if (e.target.classList) e.target.classList.remove('adisa-highlight'); });

        document.addEventListener('click', async (e) => {
            e.preventDefault(); e.stopPropagation();
            status.innerText = '⚡ PRUNING & MAPPING DOM...';
            
            // Capture root element
            const rootRect = e.target.getBoundingClientRect();
            const payload = await processNode(e.target, { left: 0, top: 0, width: 0, height: 0 }); // Global absolute wrapper
            
            // Wrapping everything into one master frame
            const masterNode = {
                type: 'FRAME',
                name: 'AppRoot',
                width: rootRect.width,
                height: rootRect.height,
                x: 0, y: 0,
                fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
                layoutMode: 'NONE',
                children: payload
            };

            const txt = document.createElement('textarea');
            txt.value = JSON.stringify(masterNode); document.body.appendChild(txt);
            txt.select(); document.execCommand('copy'); document.body.removeChild(txt);
            status.innerText = '✅ V9.0 ABSOLUTE DATA COPIED!';
        }, { once: true });

    } catch(err) { console.error(err); }
})();
