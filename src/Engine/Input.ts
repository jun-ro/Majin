// InputService.ts
// A small Roblox-like input service for the browser, with multi-key shortcuts.

export enum InputType {
  Keyboard = "Keyboard",
  MouseButton = "MouseButton",
  MouseMovement = "MouseMovement",
  Touch = "Touch",
  Gamepad = "Gamepad",
  Focus = "Focus",
}

export enum InputState {
  Begin = "Begin",
  Change = "Change",
  End = "End",
}

export interface InputObject {
  type: InputType;
  state: InputState;
  keyCode?: string;
  mouseButton?: number;
  position?: { x: number; y: number };
  delta?: { x: number; y: number };
  timestamp: number;
}

export type InputCallback = (
  input: InputObject,
  gameProcessedEvent: boolean
) => void;

type InputEventName = "InputBegan" | "InputChanged" | "InputEnded";

export type ShortcutOptions = {
  /**
   * If false (default), shortcut won't trigger when typing in inputs/textarea/etc.
   */
  allowWhileTyping?: boolean;

  /**
   * If true, calls nativeEvent.preventDefault() when the shortcut fires (Begin).
   * Note: some browser-reserved shortcuts (like Ctrl+W) may still not be stoppable.
   */
  preventDefault?: boolean;

  /**
   * If true, calls nativeEvent.stopPropagation() when the shortcut fires (Begin).
   */
  stopPropagation?: boolean;

  /**
   * If true, calls the shortcut callback again with InputState.End when released.
   */
  fireOnEnd?: boolean;
};

type ShortcutBinding = {
  id: string; // normalized "arrowright+controlleft+keyw"
  keys: string[]; // normalized + sorted
  callback: InputCallback;
  options: Required<ShortcutOptions>;
};

export class InputService {
  private static instance: InputService;

  public InputBegan: InputCallback[] = [];
  public InputChanged: InputCallback[] = [];
  public InputEnded: InputCallback[] = [];

  private keysPressed = new Set<string>();
  private mouseButtonsPressed = new Set<number>();
  private lastMousePosition = { x: 0, y: 0 };
  private isListening = false;

  private shortcuts: ShortcutBinding[] = [];
  private activeShortcuts = new Set<string>();

  private readonly touchOptions = { passive: false } as const;

  private contextMenuHandler = (e: Event) => {
    e.preventDefault();
  };

  public static GetInstance(): InputService {
    if (!InputService.instance) {
      InputService.instance = new InputService();
    }
    return InputService.instance;
  }

  private constructor() {}

  public Start(): void {
    if (this.isListening) return;
    this.isListening = true;

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("mousemove", this.handleMouseMove);

    window.addEventListener(
      "touchstart",
      this.handleTouchStart,
      this.touchOptions
    );
    window.addEventListener(
      "touchmove",
      this.handleTouchMove,
      this.touchOptions
    );
    window.addEventListener(
      "touchend",
      this.handleTouchEnd,
      this.touchOptions
    );

    window.addEventListener("blur", this.handleBlur);
    window.addEventListener("focus", this.handleFocus);

    window.addEventListener("contextmenu", this.contextMenuHandler);
  }

  public Stop(): void {
    if (!this.isListening) return;
    this.isListening = false;

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);

    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("mousemove", this.handleMouseMove);

    window.removeEventListener(
      "touchstart",
      this.handleTouchStart,
      this.touchOptions
    );
    window.removeEventListener(
      "touchmove",
      this.handleTouchMove,
      this.touchOptions
    );
    window.removeEventListener(
      "touchend",
      this.handleTouchEnd,
      this.touchOptions
    );

    window.removeEventListener("blur", this.handleBlur);
    window.removeEventListener("focus", this.handleFocus);

    window.removeEventListener("contextmenu", this.contextMenuHandler);

    this.keysPressed.clear();
    this.mouseButtonsPressed.clear();
    this.activeShortcuts.clear();
  }

  public IsKeyPressed(keyCode: string): boolean {
    if (typeof keyCode !== "string" || keyCode.length === 0) return false;
    return this.keysPressed.has(keyCode.toLowerCase());
  }

  public IsMouseButtonPressed(button: number): boolean {
    return this.mouseButtonsPressed.has(button);
  }

  public GetMousePosition(): { x: number; y: number } {
    return { ...this.lastMousePosition };
  }

  public BindAction(eventName: InputEventName, callback: InputCallback): void {
    this[eventName].push(callback);
  }

  public UnbindAction(eventName: InputEventName, callback: InputCallback): void {
    const index = this[eventName].indexOf(callback);
    if (index > -1) this[eventName].splice(index, 1);
  }

  public BindShortcut(
    keys: string[],
    callback: InputCallback,
    options: ShortcutOptions = {}
  ): void {
    const normalizedKeys = this.normalizeShortcutKeys(keys);
    if (normalizedKeys.length === 0) return;

    const binding: ShortcutBinding = {
      id: normalizedKeys.join("+"),
      keys: normalizedKeys,
      callback,
      options: {
        allowWhileTyping: options.allowWhileTyping ?? false,
        preventDefault: options.preventDefault ?? false,
        stopPropagation: options.stopPropagation ?? false,
        fireOnEnd: options.fireOnEnd ?? false,
      },
    };

    this.shortcuts.push(binding);
  }

  public UnbindShortcut(keys: string[], callback?: InputCallback): void {
    const normalizedKeys = this.normalizeShortcutKeys(keys);
    if (normalizedKeys.length === 0) return;

    const id = normalizedKeys.join("+");

    this.shortcuts = this.shortcuts.filter((s) => {
      if (s.id !== id) return true;
      if (!callback) return false;
      return s.callback !== callback;
    });

    this.activeShortcuts.delete(id);
  }

  // -----------------------
  // Native event handlers
  // -----------------------

  private handleKeyDown = (e: KeyboardEvent) => {
    const code = this.getKeyboardCode(e);
    if (!code) return;

    const keyCode = code.toLowerCase();
    const wasAlreadyPressed = this.keysPressed.has(keyCode);

    this.keysPressed.add(keyCode);

    if (!wasAlreadyPressed) {
      const input: InputObject = {
        type: InputType.Keyboard,
        state: InputState.Begin,
        keyCode: code,
        timestamp: Date.now(),
      };
      this.fireEvent(this.InputBegan, input, e);
    }

    this.checkShortcutsStatus(e);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const code = this.getKeyboardCode(e);
    if (!code) return;

    const keyCode = code.toLowerCase();
    this.keysPressed.delete(keyCode);

    const input: InputObject = {
      type: InputType.Keyboard,
      state: InputState.End,
      keyCode: code,
      timestamp: Date.now(),
    };
    this.fireEvent(this.InputEnded, input, e);

    this.checkShortcutsStatus(e);
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.mouseButtonsPressed.add(e.button);

    const input: InputObject = {
      type: InputType.MouseButton,
      state: InputState.Begin,
      mouseButton: e.button,
      position: { x: e.clientX, y: e.clientY },
      timestamp: Date.now(),
    };

    this.fireEvent(this.InputBegan, input, e);
  };

  private handleMouseUp = (e: MouseEvent) => {
    this.mouseButtonsPressed.delete(e.button);

    const input: InputObject = {
      type: InputType.MouseButton,
      state: InputState.End,
      mouseButton: e.button,
      position: { x: e.clientX, y: e.clientY },
      timestamp: Date.now(),
    };

    this.fireEvent(this.InputEnded, input, e);
  };

  private handleMouseMove = (e: MouseEvent) => {
    const delta = {
      x: e.clientX - this.lastMousePosition.x,
      y: e.clientY - this.lastMousePosition.y,
    };

    this.lastMousePosition = { x: e.clientX, y: e.clientY };

    const input: InputObject = {
      type: InputType.MouseMovement,
      state: InputState.Change,
      position: { x: e.clientX, y: e.clientY },
      delta,
      timestamp: Date.now(),
    };

    this.fireEvent(this.InputChanged, input, e);
  };

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();

    for (const touch of Array.from(e.changedTouches)) {
      const input: InputObject = {
        type: InputType.Touch,
        state: InputState.Begin,
        position: { x: touch.clientX, y: touch.clientY },
        timestamp: Date.now(),
      };

      this.fireEvent(this.InputBegan, input, e);
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();

    for (const touch of Array.from(e.changedTouches)) {
      const input: InputObject = {
        type: InputType.Touch,
        state: InputState.Change,
        position: { x: touch.clientX, y: touch.clientY },
        timestamp: Date.now(),
      };

      this.fireEvent(this.InputChanged, input, e);
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();

    for (const touch of Array.from(e.changedTouches)) {
      const input: InputObject = {
        type: InputType.Touch,
        state: InputState.End,
        position: { x: touch.clientX, y: touch.clientY },
        timestamp: Date.now(),
      };

      this.fireEvent(this.InputEnded, input, e);
    }
  };

  private handleBlur = (e: FocusEvent) => {
    this.keysPressed.clear();
    this.mouseButtonsPressed.clear();
    this.activeShortcuts.clear();

    const input: InputObject = {
      type: InputType.Focus,
      state: InputState.End,
      timestamp: Date.now(),
    };

    this.fireEvent(this.InputEnded, input, e);
  };

  private handleFocus = (e: FocusEvent) => {
    const input: InputObject = {
      type: InputType.Focus,
      state: InputState.Begin,
      timestamp: Date.now(),
    };

    this.fireEvent(this.InputBegan, input, e);
  };

  // -----------------------
  // Internals
  // -----------------------

  private fireEvent(
    callbacks: InputCallback[],
    input: InputObject,
    nativeEvent: Event
  ): void {
    const gameProcessedEvent = this.isGameProcessedEvent(nativeEvent);

    for (const callback of callbacks) {
      try {
        callback(input, gameProcessedEvent);
      } catch (error) {
        console.error("Error in input callback:", error);
      }
    }
  }

  private isGameProcessedEvent(e: Event): boolean {
    const target = e.target as HTMLElement | null;
    if (!target) return false;

    const tagName = (target.tagName || "").toLowerCase();

    return (
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select" ||
      tagName === "button" ||
      target.isContentEditable
    );
  }

  private normalizeShortcutKeys(keys: string[]): string[] {
    if (!Array.isArray(keys)) return [];

    const normalized = keys
      .filter((k): k is string => typeof k === "string" && k.length > 0)
      .map((k) => k.toLowerCase())
      .sort();

    // Deduplicate (Ctrl+Ctrl+X -> Ctrl+X)
    return Array.from(new Set(normalized));
  }

  private checkShortcutsStatus(nativeEvent: KeyboardEvent): void {
    if (this.shortcuts.length === 0) return;

    const gameProcessedEvent = this.isGameProcessedEvent(nativeEvent);

    for (const shortcut of this.shortcuts) {
      if (gameProcessedEvent && !shortcut.options.allowWhileTyping) {
        continue;
      }

      const allPressed = shortcut.keys.every((k) => this.keysPressed.has(k));
      const isActive = this.activeShortcuts.has(shortcut.id);

      if (allPressed && !isActive) {
        this.activeShortcuts.add(shortcut.id);

        if (shortcut.options.preventDefault) nativeEvent.preventDefault();
        if (shortcut.options.stopPropagation) nativeEvent.stopPropagation();

        const input: InputObject = {
          type: InputType.Keyboard,
          state: InputState.Begin,
          keyCode: shortcut.id,
          timestamp: Date.now(),
        };

        try {
          shortcut.callback(input, gameProcessedEvent);
        } catch (error) {
          console.error("Error in shortcut callback:", error);
        }
      } else if (!allPressed && isActive) {
        this.activeShortcuts.delete(shortcut.id);

        if (shortcut.options.fireOnEnd) {
          const input: InputObject = {
            type: InputType.Keyboard,
            state: InputState.End,
            keyCode: shortcut.id,
            timestamp: Date.now(),
          };

          try {
            shortcut.callback(input, gameProcessedEvent);
          } catch (error) {
            console.error("Error in shortcut callback:", error);
          }
        }
      }
    }
  }

  private getKeyboardCode(e: KeyboardEvent): string | null {
    // Prefer .code because it matches your usage: "KeyW", "ArrowRight", etc.
    if (typeof e.code === "string" && e.code.length > 0) return e.code;

    // Fallbacks for odd environments:
    if (typeof e.key !== "string" || e.key.length === 0) return null;

    // Map common keys to something close to KeyboardEvent.code
    if (e.key.startsWith("Arrow")) return e.key; // ArrowRight, ArrowLeft, ...

    if (e.key.length === 1) {
      const ch = e.key;

      if (/^[a-z]$/i.test(ch)) return `Key${ch.toUpperCase()}`;
      if (/^[0-9]$/.test(ch)) return `Digit${ch}`;
    }

    // Last resort: return the key itself
    return e.key;
  }
}
