export class JoystickSystem {
  scene: Phaser.Scene;
  base: Phaser.GameObjects.Image;
  thumb: Phaser.GameObjects.Image;
  isActive = false;
  direction = { x: 0, y: 0 };
  private pointerId: number | null = null;
  private baseX: number;
  private baseY: number;
  private maxRadius = 50;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Position joystick in bottom-left area
    this.baseX = 100;
    this.baseY = scene.scale.height - 150;

    this.base = scene.add.image(this.baseX, this.baseY, 'joystick_base')
      .setDepth(50)
      .setAlpha(0);

    this.thumb = scene.add.image(this.baseX, this.baseY, 'joystick_thumb')
      .setDepth(51)
      .setAlpha(0);

    // Touch/mouse input
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only use left half of screen for joystick
      if (pointer.x < scene.scale.width * 0.6 && this.pointerId === null) {
        this.pointerId = pointer.id;
        this.isActive = true;
        this.baseX = pointer.x;
        this.baseY = pointer.y;
        this.base.setPosition(this.baseX, this.baseY).setAlpha(1);
        this.thumb.setPosition(this.baseX, this.baseY).setAlpha(1);
      }
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.pointerId || !this.isActive) return;

      const dx = pointer.x - this.baseX;
      const dy = pointer.y - this.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        const clampedDist = Math.min(dist, this.maxRadius);
        const nx = dx / dist;
        const ny = dy / dist;

        this.thumb.setPosition(
          this.baseX + nx * clampedDist,
          this.baseY + ny * clampedDist,
        );

        this.direction.x = nx;
        this.direction.y = ny;
      }
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.pointerId) {
        this.release();
      }
    });
  }

  private release(): void {
    this.isActive = false;
    this.pointerId = null;
    this.direction.x = 0;
    this.direction.y = 0;
    this.base.setAlpha(0);
    this.thumb.setAlpha(0);
    this.thumb.setPosition(this.baseX, this.baseY);
  }

  destroy(): void {
    this.base.destroy();
    this.thumb.destroy();
  }
}
