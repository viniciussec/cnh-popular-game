import * as CameraSystem from '../../engine/camera/cameraSystem.js';
import { AREAS, WORLD_SIZE } from '../../core/config.js';
import InteractiveObject from '../../engine/interaction/InteractiveObject.js';
import MemoryGameScene from '../../core/MemoryGameScene.js';
import { DirectionArrow } from '../../engine/utils/directionArrow.js';
import { loadAssets } from '../../engine/utils/assetLoader.js';
import { phase3Assets } from '../../assets/phase3_assets.js';

export async function startPhase3(scene) {
  const { width, height } = scene.scale;
  await loadAssets(scene, phase3Assets);

  CameraSystem.initCamera(scene, scene.player, WORLD_SIZE, height);
  scene.physics.world.setBounds(0, 0, WORLD_SIZE, height);

  scene.add.image((width / 2), height / 2, "clinic_bg")
    .setOrigin(0.33, 0.5)
    .setDepth(-2)
    .setScrollFactor(1)
    .setScale(0.48)

  scene.textures.get("clinic_bg").setFilter(Phaser.Textures.FilterMode.LINEAR);

  const groundRect = scene.add.rectangle(WORLD_SIZE / 2, height - 30, WORLD_SIZE, 64, 0x444444);
  groundRect.setVisible(false);

  scene.physics.add.existing(groundRect, true);
  scene.physics.add.collider(scene.player, groundRect);
  scene.ground = { ground: groundRect };

  scene.directionArrow = new DirectionArrow(scene);

  // === CLÍNICA ===
  const isGirl = scene.playerState.character === "girl";
  const bemVindo = isGirl ? "bem-vinda" : "bem-vindo";
  const clinic = new InteractiveObject(scene, {
    key: "clinic",
    x: width + 157,
    y: height - 228,
    texture: 'clinic',
    scale: 0.8,
    width: 200,
    height: 100,
    proximity: { x: 80, y: 120 }, 
    dialogs: [
        `Olá, seja ${bemVindo}!`,
        'Vamos agora dar início ao exame psicotécnico.',
        'É um teste rápido que verifica atenção, memória e habilidades necessárias para conduzir um veículo.',
        'Vamos dar início ao exame agora.'
    ],
    onInteract: () => {
        if (scene.playerState.quizActive) return;
        if (!scene.playerState.phase3Completed) {
          startMiniGame(scene);
        }
    },
    label: '',
    hintText: 'Pressione a tecla E para interagir',
    hintTexture: "button_action",
  });

  clinic.sprite.setDepth(-2);

  scene.miniGameKey = "MemoryGameScene";

  // === PLAYER ===
  scene.player.setPosition(30, height - 305);
  scene.player.setVelocity(0);
  scene.playerState.canMove = true;
  scene.playerState.currentArea = AREAS.clinic;

  scene.playerState = {
    canMove: true,
    inDialog: false,
    currentArea: AREAS.clinic
  };

  scene.ui.showMessage('Encontre a clínica logo mais a frente!');

  scene.directionArrow.showRight();

  function scheduleReminder() {
    if (!scene.playerState.phase3Completed) {
      scene.phase3ReminderTimer = scene.time.delayedCall(20000, () => {
        if (!scene.playerState.phase3Completed) {
          scene.ui.showMessage('Encontre a clínica logo mais a frente!');
          scene.directionArrow.showRight();
          scheduleReminder();
        }
      });
    }
  }

  scheduleReminder()
}

export function updatePhase3(scene) {
  if (scene.playerState.currentArea !== AREAS.clinic) return;
}


function startMiniGame(scene) {
  const { width, height } = scene.scale;

  // impede movimento do jogador
  scene.playerState.canMove = false;
  scene.playerState.inDialog = true;
  scene.playerState.miniGameActive = true;

  scene.overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
    .setScrollFactor(0)
    .setDepth(1000);

  const miniGame = scene.scene.get(scene.miniGameKey);

  if (!scene._memoryEndListenerSet) {
    scene._memoryEndListenerSet = true;
    scene.events.once('memorygame:end', (data) => {
      closeMiniGame(scene, scene.overlay, scene.miniGameContainer, scene.miniGameKey, data);
      scene._memoryEndListenerSet = false;
    });
  }

  if (!miniGame) {
    scene.scene.add(scene.miniGameKey, MemoryGameScene, false);
  }

  // inicia o minigame
  scene.scene.launch(scene.miniGameKey);
  scene.scene.bringToTop(scene.miniGameKey);

  scene.time.delayedCall(100, () => {
    if (!miniGame || !miniGame.cameras?.main) return;
  });
}

function closeMiniGame(scene, overlay, miniGameContainer, miniGameKey, result) {
  if (overlay?.destroy) overlay.destroy();
  if (miniGameContainer?.destroy) miniGameContainer.destroy();

  const miniGame = scene.scene.get(miniGameKey);
  if (miniGame) {
    miniGame.scene.stop();
    scene.scene.remove(miniGameKey);
  }

  scene.playerState.miniGameActive = false;
  scene.playerState.canMove = true;
  scene.playerState.inDialog = false;
  scene.playerState.phase3Completed = true;

  const clinic = scene.interactiveObjects.find(o => o.key === 'clinic');

  if (clinic) {
    clinic.dialogs = [
      "Parabéns! Você passou no exame psicoténico com louvor!",
      "Agora, siga em frente para sua próxima missão!"
    ];
  }

  scene.directionArrow.scheduleReappear(5000, AREAS.clinic);

  if (scene.phase3ReminderTimer) {
    scene.phase3ReminderTimer.remove();
    scene.phase3ReminderTimer = null;
  }

  scene.ui.showMessage("Você concluiu o exame com sucesso! Siga em frente para sua próxima missão.");

  scene.events.removeListener('memorygame:end');
}
