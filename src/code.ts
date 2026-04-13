// src/code.ts
figma.showUI(__html__, { width: 400, height: 500, themeColors: true });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    const { data } = msg;

    try {
      // 1. ISOLATED DESKTOP PLACEMENT (V2.0 Anchor)
      const importContainer = figma.createFrame();
      importContainer.name = "🚀 Adisa Master Desktop View";
      importContainer.fills = [];
      importContainer.layoutMode = "VERTICAL";
      importContainer.layoutSizingHorizontal = "FIXED";
      importContainer.layoutSizingVertical = "HUG";
      importContainer.resize(1440, 100);
      
      const v = figma.viewport.bounds;
      importContainer.x = v.x + (v.width/2);
      importContainer.y = v.y + 100;

      // 2. RECURSIVE BUILD
      const node = await createNode(data);
      if (node) {
        if (data.width) {
             importContainer.resize(Math.max(1440, data.width), 100); // Expand if wider than 1440
        }
        importContainer.appendChild(node);
      }

      figma.currentPage.appendChild(importContainer);
      figma.viewport.scrollAndZoomIntoView([importContainer]);
      figma.notify("Master Import Complete! ✨💎 (v10 Vector & Layout)");
      figma.ui.postMessage({ type: 'success' });

    } catch (err: any) {
      console.error(err);
      figma.notify("Error: " + err.message, { error: true });
    }
  }
};

async function createNode(data: any): Promise<SceneNode | null> {
  let node: SceneNode | null = null;
  
  if (!data) return null;

  try {
    switch (data.type) {
      case 'FRAME':
        node = figma.createFrame();
        node.fills = []; // FIX: Immediately strip Figma's default white background!
        break;
      case 'SVG':
        try {
          node = figma.createNodeFromSvg(data.svg);
        } catch (e) {
          node = figma.createFrame(); // Fallback if vector parsing fails
        }
        break;
      case 'TEXT':
        node = figma.createText();
        await applyTextStyles(node as TextNode, data);
        break;
    }

    if (node) {
       await applyExpertStyles(node, data);
    }

    if (node && 'children' in node && data.children) {
      for (const childData of data.children) {
        const childNode = await createNode(childData);
        if (childNode) {
          (node as FrameNode).appendChild(childNode);
        }
      }
    }
  } catch (err) {
    console.warn("Skipped node:");
  }

  return node;
}

async function applyExpertStyles(node: any, data: any) {
  // Absolute vs Relative Targeting
  if (data.layoutPositioning === 'ABSOLUTE') {
    node.layoutPositioning = 'ABSOLUTE';
    if (data.x !== undefined) node.x = data.x;
    if (data.y !== undefined) node.y = data.y;
  }

  // Dimension & Sizing
  if (data.width && data.height) {
     try { node.resize(Math.max(0.01, data.width), Math.max(0.01, data.height)); } catch(e){}
  }

  // Min/Max Limits
  try {
    if (data.minWidth !== undefined) node.minWidth = data.minWidth;
    if (data.maxWidth !== undefined) node.maxWidth = data.maxWidth;
    if (data.minHeight !== undefined) node.minHeight = data.minHeight;
    if (data.maxHeight !== undefined) node.maxHeight = data.maxHeight;
  } catch (e) { /* Ignore limits on non-supportive objects like text */ }
  
  // Fills & Hex Data
  if (data.fills && data.fills.length > 0) {
    const processedFills = [];
    for (const fill of data.fills) {
      if (fill.type === 'IMAGE_BASE64' && fill.data) {
        const imageBytes = figma.base64Decode(fill.data);
        const image = figma.createImage(imageBytes);
        processedFills.push({ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' });
      } else {
        processedFills.push(fill);
      }
    }
    node.fills = processedFills;
  }

  // Strokes
  if (data.strokes && data.strokes.length > 0) {
     node.strokes = data.strokes;
     if (data.strokeWeight) node.strokeWeight = data.strokeWeight;
  }

  if (data.cornerRadius) node.cornerRadius = data.cornerRadius;
  if (data.opacity !== undefined) node.opacity = data.opacity;
  if (data.name) node.name = data.name;

  // AUTO LAYOUT API
  if (data.layoutMode && 'layoutMode' in node) {
    node.layoutMode = data.layoutMode;
    node.itemSpacing = data.itemSpacing || 0;
    node.paddingLeft = data.paddingLeft || 0;
    node.paddingRight = data.paddingRight || 0;
    node.paddingTop = data.paddingTop || 0;
    node.paddingBottom = data.paddingBottom || 0;

    node.primaryAxisAlignItems = data.primaryAxisAlignItems || 'MIN';
    node.counterAxisAlignItems = data.counterAxisAlignItems || 'MIN';

    try {
      if (data.layoutWrap) (node as any).layoutWrap = data.layoutWrap;
      if (data.layoutSizingHorizontal) node.layoutSizingHorizontal = data.layoutSizingHorizontal;
      if (data.layoutSizingVertical) node.layoutSizingVertical = data.layoutSizingVertical;
    } catch(e) {}
  }

}

async function applyTextStyles(node: TextNode, data: any) {
  const fontName = data.fontName || { family: "Inter", style: "Regular" };
  try {
    await figma.loadFontAsync(fontName);
    node.fontName = fontName;
  } catch (e) {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    node.fontName = { family: "Inter", style: "Regular" };
  }
  
  node.characters = data.characters || "";
  node.fontSize = data.fontSize || 16;
  if (data.textAlignHorizontal) node.textAlignHorizontal = data.textAlignHorizontal;
  if (data.letterSpacing) node.letterSpacing = data.letterSpacing;
  if (data.lineHeight) node.lineHeight = data.lineHeight;

  try {
     // CRITICAL: Forces Figma to wrap text downwards instead of shooting out of the box infinitely
     node.textAutoResize = 'HEIGHT';
  } catch(e) {}
}
