import { Engine } from "../Engine/index.ts";

export default {
  async onSetup(engine: Engine) {
    const halfWidth = 400;  // 800 / 2
    const halfHeight = 300; // 600 / 2
    const gridSize = 10;
    const gridColor = "#ddd";

    // Create horizontal lines
    // We go from the top (-300) to the bottom (300)
    for (let y = -halfHeight; y <= halfHeight; y += gridSize) {
      engine.Scene.createLine(-halfWidth, y, halfWidth, y, gridColor);
    }

    // Create vertical lines
    // We go from the left (-400) to the right (400)
    for (let x = -halfWidth; x <= halfWidth; x += gridSize) {
      engine.Scene.createLine(x, -halfHeight, x, halfHeight, gridColor);
    }


  },

  onRender(engine: Engine, deltaTime: number) {
    // Render logic
  }
}