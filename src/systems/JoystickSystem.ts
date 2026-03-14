// InputSystem replaces JoystickSystem — handles WASD + mouse input
export class InputSystem {
  scene: Phaser.Scene;
  keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    I: Phaser.Input.Keyboard.Key;
    P: Phaser.Input.Keyboard.Key;
    O: Phaser.Input.Keyboard.Key;
    H: Phaser.Input.Keyboard.Key;
    R: Phaser.Input.Keyboard.Key;
    ESC: Phaser.Input.Keyboard.Key;
  };
  direction = { x: 0, y: 0 };
  mouseWorldX = 0;
  mouseWorldY = 0;
  aimAngle = 0;
  leftClick = false;
  rightClick = false;
  leftDown = false;

  // Key-just-pressed flags (consumed after reading)
  private justI = false;
  private justP = false;
  private justO = false;
  private justH = false;
  private justR = false;
  private justESC = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    if (!scene.input.keyboard) return;

    this.keys = {
      W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      I: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      P: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      O: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
      H: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),
      R: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      ESC: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };

    // Mouse click events
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) this.leftClick = true;
      if (pointer.rightButtonDown()) this.rightClick = true;
    });
  }

  update(): void {
    // Movement direction
    this.direction.x = 0;
    this.direction.y = 0;
    if (this.keys) {
      if (this.keys.A.isDown) this.direction.x -= 1;
      if (this.keys.D.isDown) this.direction.x += 1;
      if (this.keys.W.isDown) this.direction.y -= 1;
      if (this.keys.S.isDown) this.direction.y += 1;
    }

    // Normalize diagonal
    if (this.direction.x !== 0 && this.direction.y !== 0) {
      const len = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
      this.direction.x /= len;
      this.direction.y /= len;
    }

    // Mouse position and aim
    const pointer = this.scene.input.activePointer;
    this.mouseWorldX = pointer.worldX;
    this.mouseWorldY = pointer.worldY;
    this.leftDown = pointer.leftButtonDown();

    // Just-pressed detection
    if (this.keys) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.I)) this.justI = true;
      if (Phaser.Input.Keyboard.JustDown(this.keys.P)) this.justP = true;
      if (Phaser.Input.Keyboard.JustDown(this.keys.O)) this.justO = true;
      if (Phaser.Input.Keyboard.JustDown(this.keys.H)) this.justH = true;
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.justR = true;
      if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.justESC = true;
    }
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
    const field = `just${key}` as keyof this;
    if (this[field]) {
      (this as any)[field] = false;
      return true;
    }
    return false;
  }

  get isMoving(): boolean {
    return this.direction.x !== 0 || this.direction.y !== 0;
  }

  destroy(): void {
    // Keys are cleaned up by scene
  }
}
