// Enums matching Roblox's InputType and InputState
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

// Interface for input data, similar to Roblox's InputObject
export interface InputObject {
  type: InputType;
  state: InputState;
  keyCode?: string;
  mouseButton?: number;
  position?: { x: number; y: number };
  delta?: { x: number; y: number };
  timestamp: number;
}

// Event callback type
export type InputCallback = (input: InputObject, gameProcessedEvent: boolean) => void;

// Main Input Service class
export class InputService {
  private static instance: InputService;
  
  // Events (similar to Roblox's events)
  public InputBegan: InputCallback[] = [];
  public InputChanged: InputCallback[] = [];
  public InputEnded: InputCallback[] = [];
  
  // State tracking
  private keysPressed = new Set<string>();
  private mouseButtonsPressed = new Set<number>();
  private lastMousePosition = { x: 0, y: 0 };
  private isListening = false;
  
  // Singleton pattern
  public static GetInstance(): InputService {
    if (!InputService.instance) {
      InputService.instance = new InputService();
    }
    return InputService.instance;
  }
  
  private constructor() {
    // Private constructor for singleton
  }
  
  // Start listening to input events
  public Start(): void {
    if (this.isListening) return;
    
    this.isListening = true;
    
    // Keyboard events
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    
    // Mouse events
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("mousemove", this.handleMouseMove);
    
    // Touch events
    window.addEventListener("touchstart", this.handleTouchStart);
    window.addEventListener("touchmove", this.handleTouchMove);
    window.addEventListener("touchend", this.handleTouchEnd);
    
    // Focus events
    window.addEventListener("blur", this.handleBlur);
    window.addEventListener("focus", this.handleFocus);
    
    // Prevent context menu on right click
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  
  // Stop listening to input events
  public Stop(): void {
    if (!this.isListening) return;
    
    this.isListening = false;
    
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("touchstart", this.handleTouchStart);
    window.removeEventListener("touchmove", this.handleTouchMove);
    window.removeEventListener("touchend", this.handleTouchEnd);
    window.removeEventListener("blur", this.handleBlur);
    window.removeEventListener("focus", this.handleFocus);
  }
  
  // Check if a key is pressed
  public IsKeyPressed(keyCode: string): boolean {
    return this.keysPressed.has(keyCode.toLowerCase());
  }
  
  // Check if a mouse button is pressed
  public IsMouseButtonPressed(button: number): boolean {
    return this.mouseButtonsPressed.has(button);
  }
  
  // Get current mouse position
  public GetMousePosition(): { x: number; y: number } {
    return { ...this.lastMousePosition };
  }
  
  // Bind a function to an event
  public BindAction(
    eventName: "InputBegan" | "InputChanged" | "InputEnded",
    callback: InputCallback
  ): void {
    this[eventName].push(callback);
  }
  
  // Unbind a function from an event
  public UnbindAction(
    eventName: "InputBegan" | "InputChanged" | "InputEnded",
    callback: InputCallback
  ): void {
    const index = this[eventName].indexOf(callback);
    if (index > -1) {
      this[eventName].splice(index, 1);
    }
  }
  
  // Private event handlers
  private handleKeyDown = (e: KeyboardEvent) => {
    const keyCode = e.code.toLowerCase();
    if (this.keysPressed.has(keyCode)) return;
    
    this.keysPressed.add(keyCode);
    const input: InputObject = {
      type: InputType.Keyboard,
      state: InputState.Begin,
      keyCode: e.code,
      timestamp: Date.now(),
    };
    
    this.fireEvent(this.InputBegan, input, e);
  };
  
  private handleKeyUp = (e: KeyboardEvent) => {
    const keyCode = e.code.toLowerCase();
    this.keysPressed.delete(keyCode);
    
    const input: InputObject = {
      type: InputType.Keyboard,
      state: InputState.End,
      keyCode: e.code,
      timestamp: Date.now(),
    };
    
    this.fireEvent(this.InputEnded, input, e);
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
    // Clear all input states when window loses focus
    this.keysPressed.clear();
    this.mouseButtonsPressed.clear();
    
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
  
  // Fire events to all registered callbacks
  private fireEvent(
    callbacks: InputCallback[],
    input: InputObject,
    nativeEvent: Event
  ): void {
    // Determine if event was "game processed" (e.g., targeted at UI)
    const gameProcessedEvent = this.isGameProcessedEvent(nativeEvent);
    
    for (const callback of callbacks) {
      try {
        callback(input, gameProcessedEvent);
      } catch (error) {
        console.error("Error in input callback:", error);
      }
    }
  }
  
  // Check if event should be considered "game processed"
  private isGameProcessedEvent(e: Event): boolean {
    const target = e.target as HTMLElement;
    if (!target) return false;
    
    // Consider it processed if it's an input, textarea, or contenteditable element
    const tagName = target.tagName.toLowerCase();
    return (
      tagName === "input" ||
      tagName === "textarea" ||
      target.isContentEditable ||
      tagName === "select" ||
      tagName === "button"
    );
  }
}
