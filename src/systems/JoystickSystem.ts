// InputSystem — handles WASD + mouse input using raw DOM events for reliability
export class InputSystem {
  scene: Phaser.Scene;

  direction = { x: 0, y: 0 };
  mouseWorldX = 0;
  mouseWorldY = 0;
  aimAngle = 0;
  leftClick = false;
  rightClick = false;
  leftDown = false;

  // Raw key state tracked via DOM events
  private keysDown = new Set<string>();
  private keysJustPressed = new Set<string>();

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.boundKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!this.keysDown.has(key)) {
        this.keysJustPressed.add(key);
      }
      this.keysDown.add(key);

      // Prevent default for game keys so browser doesn't scroll etc.
      if (['w', 'a', 's', 'd', 'i', 'p', 'o', 'h', 'r', 'escape'].includes(key)) {
        e.preventDefault();
      }
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      this.keysDown.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    // Mouse click events
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) this.leftClick = true;
      if (pointer.rightButtonDown()) this.rightClick = true;
    });
  }

  update(): void {
    // Movement direction from WASD
    this.direction.x = 0;
    this.direction.y = 0;

    if (this.keysDown.has('a')) this.direction.x -= 1;
    if (this.keysDown.has('d')) this.direction.x += 1;
    if (this.keysDown.has('w')) this.direction.y -= 1;
    if (this.keysDown.has('s')) this.direction.y += 1;

    // Normalize diagonal
    if (this.direction.x !== 0 && this.direction.y !== 0) {
      const len = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
      this.direction.x /= len;
      this.direction.y /= len;
    }

    // Mouse position
    const pointer = this.scene.input.activePointer;
    this.mouseWorldX = pointer.worldX;
    this.mouseWorldY = pointer.worldY;
    this.leftDown = pointer.leftButtonDown();
  }

  updateAimAngle(playerX: number, playerY: number): void {
    this.aimAngle = Math.atan2(
      this.mouseWorldY - playerY,
      this.mouseWorldX - playerX,
    );
  }

  consumeLeftClick(): boolean {
    if (this.leftClick) { this.leftClick = false; return true; }
    return false;
  }

  consumeRightClick(): boolean {
    if (this.rightClick) { this.rightClick = false; return true; }
    return false;
  }

  consumeKey(key: 'I' | 'P' | 'O' | 'H' | 'R' | 'ESC'): boolean {
    const lookup = key === 'ESC' ? 'escape' : key.toLowerCase();
    if (this.keysJustPressed.has(lookup)) {
      this.keysJustPressed.delete(lookup);
      return true;
    }
    return false;
  }

  get isMoving(): boolean {
    return this.direction.x !== 0 || this.direction.y !== 0;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }
}
