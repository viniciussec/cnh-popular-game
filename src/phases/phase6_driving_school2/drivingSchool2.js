import * as CameraSystem from '../../engine/camera/cameraSystem.js';
import { AREAS, WORLD_SIZE } from '../../core/config.js';
import InteractiveObject from '../../engine/interaction/InteractiveObject.js';
import { DirectionArrow } from '../../engine/utils/directionArrow.js';
import { phase6Assets } from '../../assets/phase6_assets.js';
import { loadAssets } from '../../engine/utils/assetLoader.js';

export async function startPhase6(scene) {
  const { width, height } = scene.scale;

  await loadAssets(scene, phase6Assets);

  CameraSystem.initCamera(scene, scene.player, WORLD_SIZE, height);
  scene.physics.world.setBounds(0, 0, WORLD_SIZE, height);

  scene.physics.world.setBounds(0, 0, WORLD_SIZE, height);

  scene.add.image((width / 2), height / 2, "driving_2_bg")
    .setOrigin(0.33, 0.5)
    .setDepth(-2)
    .setScrollFactor(1)
    .setScale(0.48)

  scene.textures.get("driving_2_bg").setFilter(Phaser.Textures.FilterMode.LINEAR);
    
  const groundRect = scene.add.rectangle(WORLD_SIZE / 2, height - 30, WORLD_SIZE, 64, 0x444444);
  groundRect.setVisible(false);

  scene.physics.add.existing(groundRect, true);
  scene.physics.add.collider(scene.player, groundRect);
  scene.ground = { ground: groundRect };

  scene.directionArrow = new DirectionArrow(scene);

  // === PLAYER ===
  scene.player.setPosition(30, height - 305);
  scene.player.setVelocity(0);
  scene.playerState.canMove = true;
  scene.playerState.currentArea = AREAS.drivingSchool2;

  scene.playerState = {
    canMove: true,
    inDialog: false,
    currentArea: AREAS.drivingSchool2
  };

  scene.ui.showMessage('Fale com seu instrutor das aulas práticas logo mais a frente!');

  const isGirl = scene.playerState.character === "girl";
  const pronome = isGirl ? "candidata" : "candidato";
  const bemVindo = isGirl ? "Bem-vinda" : "Bem-vindo";

  function scheduleReminder() {
    if (!scene.playerState.phase6Completed) {
      scene.phase6ReminderTimer = scene.time.delayedCall(20000, () => {
        if (!scene.playerState.phase6Completed) {
          scene.ui.showMessage('Fale com seu instrutor das aulas práticas logo mais a frente!');
          scheduleReminder();
        }
      });
    }
  }

  scheduleReminder()

  const instructor = new InteractiveObject(scene, {
    key: 'instructor',
    x: width - 310,
    y: height - 175,
    texture: 'instructor_2',
    scale: 0.24,
    width: 150,
    height: 100,
    proximity: { x: 80, y: 120 }, 
    dialogs: [
      `Olá, ${pronome}! ${bemVindo} às aulas práticas.`,
      'Aqui você vai aprender a controlar o veículo na prática: embreagem, câmbio, setas e espelhos.',
      'São 20h/aula obrigatórias em situação de trânsito real.',
      'Você vai praticar: baliza, ladeiras, mudança de marcha e direção no trânsito.',
      'O instrutor estará ao seu lado para orientar e garantir sua segurança durante todo o processo.',
      'Lembre-se: sempre use cinto de segurança, ajuste os espelhos e verifique os pedais antes de iniciar.',
      'Boa sorte nos estudos!'
  ],
    onInteract: () => {
        if (!scene.playerState.phase6Completed) {
          scene.ui.showMessage(`Siga em frente para sua próxima missão.`);
          scene.playerState.phase6Completed = true;

          scene.directionArrow.scheduleReappear(5000, AREAS.drivingSchool2);

          if (scene.phase6ReminderTimer) {
            scene.phase6ReminderTimer.remove();
            scene.phase6ReminderTimer = null;
          }
        }
  },
    label: '',
    hintText: 'Pressione a tecla E para interagir',
    hintTexture: "button_action",
  });
    
  instructor.sprite.setDepth(-2);
}

export function updatePhase6(scene) {
  if (scene.playerState.currentArea !== AREAS.drivingSchool2) return;
}