// Engine/index.ts
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
}
