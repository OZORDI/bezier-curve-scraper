// Function to search the entire page for Bezier curves
function findBezierCurves() {
  const results = {
    svgPaths: [],
    canvasElements: [],
    cssAnimations: [],
    cssTransitions: []
  };

  // 1. Search SVG path elements for bezier curves (C, c, S, s, Q, q, T, t commands)
  const svgPaths = document.querySelectorAll('path');
  svgPaths.forEach((path, index) => {
    const d = path.getAttribute('d');
    if (d) {
      // Check for cubic bezier (C, c, S, s) or quadratic bezier (Q, q, T, t)
      const bezierRegex = /[CcSsQqTt]\s*[\d\s,.-]+/g;
      const matches = d.match(bezierRegex);
      
      if (matches && matches.length > 0) {
        results.svgPaths.push({
          element: path,
          pathData: d,
          bezierCommands: matches,
          index: index
        });
      }
    }
  });

  // 2. Search canvas elements (can't directly detect bezier, but find canvas elements)
  const canvasElements = document.querySelectorAll('canvas');
  canvasElements.forEach((canvas, index) => {
    results.canvasElements.push({
      element: canvas,
      id: canvas.id || `canvas-${index}`,
      note: 'Canvas may contain bezier curves (bezierCurveTo, quadraticCurveTo)'
    });
  });

  // 3. Search CSS for cubic-bezier timing functions in animations
  const allElements = document.querySelectorAll('*');
  allElements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);
    
    // Check animation-timing-function
    const animationTiming = computedStyle.animationTimingFunction;
    if (animationTiming && animationTiming.includes('cubic-bezier')) {
      results.cssAnimations.push({
        element: element,
        timingFunction: animationTiming,
        animationName: computedStyle.animationName
      });
    }
    
    // Check transition-timing-function
    const transitionTiming = computedStyle.transitionTimingFunction;
    if (transitionTiming && transitionTiming.includes('cubic-bezier')) {
      results.cssTransitions.push({
        element: element,
        timingFunction: transitionTiming,
        transitionProperty: computedStyle.transitionProperty
      });
    }
  });

  // 4. Search stylesheets for cubic-bezier definitions
  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of rules) {
          if (rule.style) {
            const animTiming = rule.style.animationTimingFunction;
            const transTiming = rule.style.transitionTimingFunction;
            
            if (animTiming && animTiming.includes('cubic-bezier')) {
              console.log('Animation bezier in CSS:', rule.selectorText, animTiming);
            }
            if (transTiming && transTiming.includes('cubic-bezier')) {
              console.log('Transition bezier in CSS:', rule.selectorText, transTiming);
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets may throw errors
        console.warn('Could not access stylesheet:', e);
      }
    }
  } catch (e) {
    console.warn('Error accessing stylesheets:', e);
  }

  return results;
}

// Helper function to normalize bezier to cubic-bezier format
function normalizeBezier(bezierString) {
  // Extract all cubic-bezier values from CSS (handles multiple in one string)
  const cubicMatches = bezierString.matchAll(/cubic-bezier\(([\d.,\s]+)\)/g);
  const beziers = [];
  
  for (const match of cubicMatches) {
    const values = match[1].split(',').map(v => v.trim());
    beziers.push(`cubic-bezier(${values.join(', ')})`);
  }
  
  return beziers.length > 0 ? beziers : null;
}

// Helper function to extract unique bezier values and display them
function displayUniqueBeziers() {
  const results = findBezierCurves();
  const uniqueBeziers = new Set();
  
  // Extract unique CSS animation timing functions
  results.cssAnimations.forEach(item => {
    const normalized = normalizeBezier(item.timingFunction);
    if (normalized) normalized.forEach(b => uniqueBeziers.add(b));
  });
  
  // Extract unique CSS transition timing functions
  results.cssTransitions.forEach(item => {
    const normalized = normalizeBezier(item.timingFunction);
    if (normalized) normalized.forEach(b => uniqueBeziers.add(b));
  });
  
  // Search stylesheets for additional beziers
  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of rules) {
          if (rule.style) {
            const animTiming = rule.style.animationTimingFunction;
            const transTiming = rule.style.transitionTimingFunction;
            
            if (animTiming) {
              const normalized = normalizeBezier(animTiming);
              if (normalized) normalized.forEach(b => uniqueBeziers.add(b));
            }
            if (transTiming) {
              const normalized = normalizeBezier(transTiming);
              if (normalized) normalized.forEach(b => uniqueBeziers.add(b));
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets may throw errors
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Note about SVG and canvas (not in cubic-bezier format)
  const notes = [];
  if (results.svgPaths.length > 0) {
    notes.push(`Note: ${results.svgPaths.length} SVG path(s) with bezier curves (use different coordinate format)`);
  }
  if (results.canvasElements.length > 0) {
    notes.push(`Note: ${results.canvasElements.length} canvas element(s) found (may contain bezier curves)`);
  }
  
  // Display unique beziers
  console.log('🎨 Unique Bezier Curves Found:', uniqueBeziers.size);
  [...uniqueBeziers].forEach(bezier => console.log(bezier));
  
  if (notes.length > 0) {
    console.log('\n' + notes.join('\n'));
  }
  
  return [...uniqueBeziers];
}

// Run the search and display unique results
displayUniqueBeziers();
