import * as CameraSystem from '../../engine/camera/cameraSystem.js';
import { AREAS, WORLD_SIZE } from '../../core/config.js';
import InteractiveObject from '../../engine/interaction/InteractiveObject.js';
import { DirectionArrow } from '../../engine/utils/directionArrow.js';
import { phase4Assets } from '../../assets/phase4_assets.js';
import { loadAssets } from '../../engine/utils/assetLoader.js';

export async function startPhase4(scene) {
  const { width, height } = scene.scale;

  await loadAssets(scene, phase4Assets);

  CameraSystem.initCamera(scene, scene.player, WORLD_SIZE, height);
  scene.physics.world.setBounds(0, 0, WORLD_SIZE, height);

  scene.add.image((width / 2), height / 2, "driving_bg")
    .setOrigin(0.33, 0.5)
    .setDepth(-2)
    .setScrollFactor(1)
    .setScale(0.48)

  scene.textures.get("driving_bg").setFilter(Phaser.Textures.FilterMode.LINEAR);

  const groundRect = scene.add.rectangle(WORLD_SIZE / 2, height - 30, WORLD_SIZE, 64, 0x444444);
  groundRect.setVisible(false);

  scene.physics.add.existing(groundRect, true);
  scene.physics.add.collider(scene.player, groundRect);
  scene.ground = { ground: groundRect };

  // === PLAYER ===
  scene.player.setPosition(30, height - 300);
  scene.player.setVelocity(0);
  scene.playerState.canMove = true;
  scene.playerState.currentArea = AREAS.drivingSchool1;

  scene.playerState = {
    canMove: true,
    inDialog: false,
    currentArea: AREAS.drivingSchool1
  };

  scene.ui.showMessage('Fale com seu professor das aulas teóricas logo mais a frente!');

  function scheduleReminder() {
    if (!scene.playerState.phase4Completed) {
      scene.phase4ReminderTimer = scene.time.delayedCall(20000, () => {
        if (!scene.playerState.phase4Completed) {
          scene.ui.showMessage('Fale com seu professor das aulas teóricas logo mais a frente!');
          scheduleReminder();
        }
      });
    }
  }

  scheduleReminder();

  scene.directionArrow = new DirectionArrow(scene);

  const isGirl = scene.playerState.character === "girl";
  const pronome = isGirl ? "futura motorista" : "futuro motorista";
  const bemVindo = isGirl ? "Bem-vinda" : "Bem-vindo";
  const aprovado = isGirl ? "aprovada" : "aprovado";

  const dialogs = [
    `Olá, ${pronome}! ${bemVindo} às aulas teóricas.`,
    "Aqui você vai aprender as regras de trânsito, sinalização, direção defensiva e primeiros socorros.",
    "São 45 horas/aula obrigatórias, divididas em conteúdo legislativo e prático.",
    `Após as aulas, você fará uma prova teórica no DETRAN. Você precisa acertar pelo menos 70% para ser ${aprovado}.`,
    "Preste atenção nas aulas e faça os simulados. Isso vai te ajudar muito!",
    "Boa sorte nos estudos!"
  ];

  const instructor = new InteractiveObject(scene, {
    key: 'instructor',
    x: width - 310,
    y: height - 135,
    texture: 'instructor',
    scale: 0.25,
    width: 100,
    height: 100,
    proximity: { x: 80, y: 120 }, 
    dialogs: dialogs,
    onInteract: () => {
        if (!scene.playerState.phase4Completed) {
          scene.ui.showMessage(`Siga em frente para sua próxima missão!`);
          scene.playerState.phase4Completed = true;

          scene.directionArrow.scheduleReappear(5000, AREAS.drivingSchool1);

          if (scene.phase4ReminderTimer) {
            scene.phase4ReminderTimer.remove();
            scene.phase4ReminderTimer = null;
          }
        }
    },
    label: '',
    hintText: 'Pressione a tecla E para interagir',
    hintTexture: "button_action",
  });
    
  instructor.sprite.setDepth(-2);
}

export function updatePhase4(scene) {
  if (scene.playerState.currentArea !== AREAS.drivingSchool1) return;
}