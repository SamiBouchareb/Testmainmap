export function generateNodePosition(level: number, index: number, total: number) {
  // Core spacing configuration
  const BASE_RADIUS = 200;  // Base unit for radius calculations
  const SPACING_MULTIPLIER = 1.2; // Controls how quickly radius grows with levels
  
  // Calculate radius and spacing for each level
  const levelConfig = {
    0: { // Root node (center)
      radius: 0,
      yOffset: 0,
      spreadAngle: 2 * Math.PI,  // Full circle
      nodeSpacing: 0
    },
    1: { // Main topics (closest to center)
      radius: BASE_RADIUS,
      yOffset: 0,
      spreadAngle: 2 * Math.PI,  // Full circle
      nodeSpacing: 1.2  // More space between main topics
    },
    2: { // Subtopics
      radius: BASE_RADIUS * SPACING_MULTIPLIER * 1.4,
      yOffset: BASE_RADIUS * 0.4,
      spreadAngle: Math.PI / 2,  // 90 degrees
      nodeSpacing: 1.0
    },
    3: { // Points
      radius: BASE_RADIUS * SPACING_MULTIPLIER * 1.8,
      yOffset: BASE_RADIUS * 0.8,
      spreadAngle: Math.PI / 3,  // 60 degrees
      nodeSpacing: 0.8
    },
    4: { // Subpoints (furthest from center)
      radius: BASE_RADIUS * SPACING_MULTIPLIER * 2.2,
      yOffset: BASE_RADIUS * 1.2,
      spreadAngle: Math.PI / 4,  // 45 degrees
      nodeSpacing: 0.6
    }
  };

  const config = levelConfig[level as keyof typeof levelConfig] || levelConfig[4];
  
  // Root node is always at center
  if (level === 0) {
    return { x: 0, y: 0 };
  }
  
  // Calculate angle based on index and total nodes
  const angleStep = config.spreadAngle / Math.max(1, total - 1);
  const baseAngle = -config.spreadAngle / 2 + angleStep * index;
  
  // Add slight variations to prevent overlap
  const radiusVariation = Math.sin(index * 2.5) * (config.radius * 0.05);
  const angleVariation = Math.cos(index * 1.5) * 0.1;
  
  const finalRadius = config.radius + radiusVariation;
  const finalAngle = baseAngle + angleVariation;
  
  // Calculate base position
  const x = finalRadius * Math.cos(finalAngle);
  const y = finalRadius * Math.sin(finalAngle) + config.yOffset;
  
  return { x, y };
}
