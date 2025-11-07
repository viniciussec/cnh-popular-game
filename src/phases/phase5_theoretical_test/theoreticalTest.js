import * as CameraSystem from '../../engine/camera/cameraSystem.js';
import { AREAS, WORLD_SIZE } from '../../core/config.js';
import InteractiveObject from '../../engine/interaction/InteractiveObject.js';
import { updateGenericInteractions } from '../../engine/interaction/interactionSystem.js';
import TrafficSignsGameScene from '../../core/TrafficSignsGameScene.js';
import { DirectionArrow } from '../../engine/utils/directionArrow.js';
import { loadAssets } from '../../engine/utils/assetLoader.js';
import { phase5Assets } from '../../assets/phase5_assets.js';

export async function startPhase5(scene) {
  const { width, height } = scene.scale;

  await loadAssets(scene, phase5Assets);

  CameraSystem.initCamera(scene, scene.player, WORLD_SIZE, height);
  scene.physics.world.setBounds(0, 0, WORLD_SIZE, height);

  scene.add.image((width / 2), height / 2, "detran_theoretical_bg")
    .setOrigin(0.33, 0.5)
    .setDepth(-2)
    .setScrollFactor(1)
    .setScale(0.48)

  scene.textures.get("detran_theoretical_bg").setFilter(Phaser.Textures.FilterMode.LINEAR);

  const groundRect = scene.add.rectangle(WORLD_SIZE / 2, height - 30, WORLD_SIZE, 64, 0x444444);
  groundRect.setVisible(false);

  scene.physics.add.existing(groundRect, true);
  scene.physics.add.collider(scene.player, groundRect);
  scene.ground = { ground: groundRect };

  // === PLAYER ===
  scene.player.setPosition(30, height - 305);
  scene.player.setVelocity(0);
  scene.playerState.canMove = true;
  scene.playerState.currentArea = AREAS.theoreticalTest;

  scene.playerState.canMove = true;
  scene.playerState.inDialog = false;
  scene.playerState.currentArea = AREAS.theoreticalTest;
  scene.playerState.miniGameActive = false;
  scene.playerState.phase5Completed = false;

  scene.miniGameKey = 'TrafficSignsGameScene';

  scene.ui.showMessage('Encontre o prédio do DETRAN logo mais a frente!');

  scene.directionArrow = new DirectionArrow(scene);

  function scheduleReminder() {
    if (!scene.playerState.phase5Completed) {
      scene.phase5ReminderTimer = scene.time.delayedCall(20000, () => {
        if (!scene.playerState.phase5Completed) {
          scene.ui.showMessage('Encontre o prédio do DETRAN logo mais a frente!');
          scheduleReminder();
        }
      });
    }
  }

  scheduleReminder();

  // === DETRAN ===
  const detran = new InteractiveObject(scene, {
    key: 'detran',
    x: width - 395,
    y: height - 205,
    texture: 'detran',
    scale: 0.27,
    width: 200,
    height: 100,
    proximity: { x: 200, y: 120 }, 
    dialogs: [
      'Olá! Você acaba de chegar na etapa de prova teórica do DETRAN.',
      'Vamos iniciar sua prova agora. Boa sorte!'
    ],
    onInteract: () => {
      if (scene.playerState.quizActive) return;
      if (!scene.playerState.phase5Completed) {
        startMiniGame(scene);
      }
    },
    label: '',
    hintText: 'Pressione a tecla E para interagir',
    hintTexture: "button_action",
  });

  detran.sprite.setDepth(-2);
}

export function updatePhase5(scene) {
  if (scene.playerState.currentArea !== AREAS.theoreticalTest) return;
  if (scene.playerState.minigameActive) return; 
  updateGenericInteractions(scene);
}

function startMiniGame(scene) {
  const { width, height } = scene.scale;

    scene.playerState.canMove = false;
    scene.playerState.inDialog = true;
    scene.playerState.miniGameActive = true;

  scene.overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
    .setScrollFactor(0)
    .setDepth(1000);

  scene.miniGameContainer = scene.add.container(width / 2, height / 2).setDepth(1001);

  if (!scene._theorreticalEndListenerSet) {
    scene._theorreticalEndListenerSet = true;
    scene.events.once('trafficsigns:end', (data) => {
      closeMiniGame(scene, scene.overlay, scene.miniGameContainer, scene.miniGameKey, data);
      scene._theorreticalEndListenerSet = false;
    });
  }

  if (!scene.scene.get(scene.miniGameKey)) {
    scene.scene.add(scene.miniGameKey, TrafficSignsGameScene, false);
  }

  scene.scene.launch(scene.miniGameKey);

  scene.time.delayedCall(100, () => {
    const miniGame = scene.scene.get(scene.miniGameKey);

    if (!miniGame || !miniGame.cameras?.main) return;
  });
}

function closeMiniGame(scene, overlay, miniGameContainer, miniGameKey, result) {
  if (overlay && overlay.destroy) overlay.destroy();
  if (miniGameContainer && miniGameContainer.destroy) miniGameContainer.destroy();


  const miniGame = scene.scene.get(miniGameKey);
  if (miniGame) {
    miniGame.scene.stop();
    scene.scene.remove(miniGameKey);
  }

  scene.playerState.miniGameActive = false;
  scene.playerState.canMove = true;
  scene.playerState.inDialog = false;
  scene.playerState.phase5Completed = true;

  const isGirl = scene.playerState.character === "girl";
  const pronome = isGirl ? "aprovada" : "aprovado";

  const theoreticalObject = scene.interactiveObjects.find(o => o.key === 'detran');
  const dialog = `Parabéns, você foi ${pronome}! Siga em frente para sua próxima missão.`;
  theoreticalObject.dialogs = [
    dialog
  ];

  scene.directionArrow.scheduleReappear(5000, AREAS.theoreticalTest);

  const msg = "Você completou o exame teórico! Siga em frente para sua próxima missão.";
  scene.ui.showMessage(msg);
  
  scene.events.removeListener('trafficsigns:end');

  if (scene.phase5ReminderTimer) {
    scene.phase5ReminderTimer.remove();
    scene.phase5ReminderTimer = null;
  }
}