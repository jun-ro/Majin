// Engine/index.ts - Full updated code with Engine passed to BOTH onSetup & onRender (flexible arity)
import { RendererClass } from "./Renderer.ts";
import { SceneClass } from "./Scene.ts";
import {
  InputService as InputServiceClass,
  InputState,
  InputType,
} from "./Input.ts";

export { InputState, InputType };
export type { InputObject, InputCallback, ShortcutOptions } from "./Input.ts";

export class Engine {
  private static canvasElement?: HTMLCanvasElement;

  public Renderer: RendererClass;
  public Scene: SceneClass;
  public InputService: InputServiceClass;
  private updateCallbacks: ((deltaTime: number) => void)[] = [];
  private _frameCompositeSet: boolean = false;

  private constructor(elementMount: HTMLCanvasElement) {
    const FIXED_WIDTH = 800;
    const FIXED_HEIGHT = 600;

    elementMount.width = FIXED_WIDTH;
    elementMount.height = FIXED_HEIGHT;

    this.Renderer = new RendererClass(elementMount);
    this.Scene = new SceneClass(this.Renderer);
    this.InputService = InputServiceClass.GetInstance();
  }

  public static mountApp(canvasElement: HTMLCanvasElement): typeof Engine {
    Engine.canvasElement = canvasElement;
    return Engine;
  }

  public static Create(): Engine {
    if (!Engine.canvasElement) {
      throw new Error(
        "Engine Error: Must call Engine.mountApp(canvasElement) before Engine.Create()"
      );
    }

    const engine = new Engine(Engine.canvasElement);

    engine.InputService.Start();
    engine.Scene.start();

    return engine;
  }

  /**
   * Add a per-frame update callback. Signature: `(deltaTime: number) => void`
   * First call sets the composite callback on Renderer; subsequent calls chain additional logic.
   * All callbacks run after render each frame.
   */
  public addFrameUpdate(callback: (deltaTime: number) => void): void {
    if (!this._frameCompositeSet) {
      // Set composite callback on Renderer (runs all updates after render)
      this.Renderer.setOnFrameRender((deltaTime: number) => {
        this.updateCallbacks.forEach((cb) => cb(deltaTime));
      });
      this._frameCompositeSet = true;
    }
    this.updateCallbacks.push(callback);
  }

  /**
   * Load modules from explicit paths or folder glob.
   * - If `paths` is string (e.g., "/modules/"): Auto-discovers all .js/.ts files recursively (Vite glob).
   * - If array (e.g., ["./mod1.js"]): Dynamic imports.
   * Each module exports `{ 
   *   onSetup?: (engine: Engine) => void | Promise<void>; 
   *   onRender?: ((deltaTime: number) => void) | ((engine: Engine, deltaTime: number) => void)
   * }` (default or top-level).
   * - `onSetup(engine)` called once after load.
   * - `onRender`: Auto-detects arity (1=deltaTime only; 2=engine+deltaTime), wrapped for `addFrameUpdate`.
   */
  public async setModules(paths: string | string[]): Promise<void> {
    const modulePaths = Array.isArray(paths) ? paths : [paths];

    if (typeof modulePaths[0] === 'string' && !Array.isArray(paths)) {
      // Single string: Treat as folder glob (Vite support)
      return this._loadFolderModules(modulePaths[0]);
    } else {
      // Array: Explicit paths
      return this._loadExplicitModules(modulePaths);
    }
  }

  // Internal: Load from folder glob (Vite)
  // Internal: Load from folder glob (Vite)
  private async _loadFolderModules(folderPath: string): Promise<void> {
    if (typeof import.meta === 'undefined' || !import.meta.glob) {
      console.warn(
        `import.meta.glob unavailable (not Vite?). ` +
        `Use explicit paths: Engine.setModules(['./modules/mod1.js', ...])`
      );
      return;
    }

    // 1. Vite REQUIREs a literal string here for static analysis.
    // Use a broad pattern that covers the root directory where your modules live.
    // Example: './**/*.{js,ts}' will look through your entire source.
    const allModules = import.meta.glob('./**/*.{js,ts}', {
      eager: false,
      import: 'default',
    });

    // 2. Normalize the user's folderPath to match Vite's key format (e.g., "./src/modules")
    let normalized = folderPath.replace(/\/+$/, ''); // Strip trailing slashes
    if (normalized.startsWith('/')) {
      normalized = '.' + normalized; // Ensure it starts with ./
    } else if (!normalized.startsWith('./')) {
      normalized = './' + normalized;
    }

    try {
      // 3. Filter the static glob results in memory using the runtime variable
      const filteredEntries = Object.entries(allModules).filter(([path]) =>
        path.startsWith(normalized)
      );

      if (filteredEntries.length === 0) {
        console.warn(`No modules found matching the path: "${normalized}"`);
        return;
      }

      const loadedModules: Array<{ path: string; exports: any }> = [];
      for (const [path, importFn] of filteredEntries) {
        const mod = await (importFn as () => Promise<any>)();
        loadedModules.push({ path, exports: mod });
      }

      await this._processModules(loadedModules);
      console.log(
        `Loaded ${loadedModules.length} modules from "${folderPath}"`,
        loadedModules.map((m) => m.path)
      );
    } catch (error) {
      console.error(`Failed to load folder "${folderPath}":`, error);
    }
  }

  // Internal: Load explicit paths
  private async _loadExplicitModules(modulePaths: string[]): Promise<void> {
    try {
      const modules = await Promise.all(
        modulePaths.map((path) => import(path))
      );
      const loadedModules = modules.map((mod, i) => ({
        path: modulePaths[i],
        exports: (mod as any).default || mod
      }));
      await this._processModules(loadedModules);
      console.log(`Loaded ${modules.length} explicit modules`);
    } catch (error) {
      console.error('Failed to load explicit modules:', error);
    }
  }

  // Internal: Process loaded modules (setup + register renders)
  private async _processModules(loadedModules: Array<{ path: string; exports: any }>): Promise<void> {
    for (const { path, exports: moduleExports } of loadedModules) {
      // Call onSetup once (async support, passes Engine as first arg)
      if (typeof moduleExports.onSetup === 'function') {
        try {
          await moduleExports.onSetup(this);
        } catch (error) {
          console.error(`Module "${path}" onSetup error:`, error);
        }
      }
      // Register onRender (auto-detect arity: 1=deltaTime; 2=engine+deltaTime)
      if (typeof moduleExports.onRender === 'function') {
        const onRenderFn = moduleExports.onRender;
        if (onRenderFn.length === 2) {
          // Expects (engine, deltaTime) → wrap for addFrameUpdate(deltaTime)
          this.addFrameUpdate((deltaTime: number) => onRenderFn(this, deltaTime));
        } else {
          // Expects (deltaTime) → direct
          this.addFrameUpdate(onRenderFn);
        }
      }
    }
  }

  // Legacy stub (warns to use setModules)
  public setFolders(folderPath: string): void {
    console.warn(
      `Engine.setFolders deprecated. Use Engine.setModules("${folderPath}") ` +
      `(auto-handles folders/arrays).`
    );
    void this.setModules(folderPath); // Auto-convert
  }
}
