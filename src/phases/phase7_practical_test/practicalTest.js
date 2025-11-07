import * as CameraSystem from '../../engine/camera/cameraSystem.js';
import { AREAS, WORLD_SIZE } from '../../core/config.js';
import InteractiveObject from '../../engine/interaction/InteractiveObject.js';
import StartCarGameScene from '../../engine/ui/StartCarGameScene.js';
import { DirectionArrow } from '../../engine/utils/directionArrow.js';
import { loadAssets } from '../../engine/utils/assetLoader.js';
import { phase7Assets } from '../../assets/phase7_assets.js';

export async function startPhase7(scene) {
  const { width, height } = scene.scale;
  
  await loadAssets(scene, phase7Assets);

  CameraSystem.initCamera(scene, scene.player, WORLD_SIZE, height);
  scene.physics.world.setBounds(0, 0, WORLD_SIZE, height);

  scene.add.image((width / 2), height / 2 - 20, "detran_practical_bg")
    .setOrigin(0.33, 0.5)
    .setDepth(-2)
    .setScrollFactor(1)
    .setScale(0.48)

  scene.textures.get("detran_practical_bg").setFilter(Phaser.Textures.FilterMode.LINEAR);

  const groundRect = scene.add.rectangle(WORLD_SIZE / 2, height - 30, WORLD_SIZE, 64, 0x444444);
  scene.physics.add.existing(groundRect, true);
  scene.physics.add.collider(scene.player, groundRect);

  groundRect.setVisible(false);

  scene.physics.add.existing(groundRect, true);
  scene.physics.add.collider(scene.player, groundRect);
  scene.ground = { ground: groundRect };

  scene.directionArrow = new DirectionArrow(scene);

  // === PLAYER ===
  scene.player.setPosition(30, height - 305);
  scene.player.setVelocity(0);
  scene.playerState.canMove = true;
  scene.playerState.currentArea = AREAS.practicalTest;

  scene.playerState = {
    canMove: true,
    inDialog: false,
    currentArea: AREAS.practicalTest
  };

  scene.miniGameKey = 'StartCarGameScene';

  scene.ui.showMessage('Fale com seu instrutor do exame prático logo mais a frente!');

  function scheduleReminder() {
    if (!scene.playerState.phase7Completed) {
      scene.phase7ReminderTimer = scene.time.delayedCall(20000, () => {
        if (!scene.playerState.phase7Completed) {
          scene.ui.showMessage('Fale com seu instrutor do exame prático logo mais a frente!');
          scheduleReminder();
        }
      });
    }
  }

  scheduleReminder()

  // === INSTRUTOR ===
  const isGirl = scene.playerState.character === "girl";
  const instrutor_exame_pratico = new InteractiveObject(scene, {
    key: 'instrutor_exame_pratico',
    x: width - 150,
    y: height - 190,
    texture: 'instrutor_exame_pratico',
    scale: 0.20,
    width: 200,
    height: 100,
    proximity: { x: 80, y: 120 }, 
    dialogs: [
      'Olá, sou o instrutor responsável por seu exame prático de direção.',
      'Aqui, não é só sobre dirigir... é sobre respeito, controle e família.',
      'Você tem que aprender a sentir o carro, não só a pilotar.',
      'Respira fundo... acelera com calma... sente o motor.',
      `Aqui não é filme, ${isGirl ? "garota" : "garoto"}. Cada manobra conta.`,
      'Agora liga o motor. Vamos ver se você tem o que precisa pra passar.'
    ],
    onInteract: () => {
      if (scene.playerState.miniGameActive) return;
      if (!scene.playerState.phase7Completed) {
        startMiniGame(scene);
      }
    },
    label: '',
    hintText: 'Pressione a tecla E para interagir',
    hintTexture: "button_action",
  });
  
  instrutor_exame_pratico.sprite.setAlpha(0);
  instrutor_exame_pratico.sprite.setDepth(-2);
}

export function updatePhase7(scene) {
  if (scene.playerState.currentArea !== AREAS.practicalTest) return;
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

  if (!scene._carEndListenerSet) {
    scene._carEndListenerSet = true;
    scene.game.events.once('car:minigame:end', (data) => {
      closeMiniGame(scene, scene.overlay, scene.miniGameContainer, scene.miniGameKey, data);
      scene._carEndListenerSet = false;
    });
  }

  if (!scene.scene.get(scene.miniGameKey)) {
    scene.scene.add(scene.miniGameKey, StartCarGameScene, false);
  }

  // inicia o minigame
  scene.scene.launch(scene.miniGameKey);
  scene.scene.bringToTop(scene.miniGameKey);

  scene.time.delayedCall(100, () => {
    const miniGame = scene.scene.get(scene.miniGameKey);

    if (!miniGame || !miniGame.cameras?.main) return;
  });
}

function closeMiniGame(scene, overlay, miniGameContainer, miniGameKey, result) {
  if (overlay?.destroy) overlay.destroy();
  if (miniGameContainer?.destroy) miniGameContainer.destroy();

  // encerra o minigame
  const miniGame = scene.scene.get(miniGameKey);
  if (miniGame) {
    miniGame.scene.stop();
    scene.scene.remove(miniGameKey);
  }

  // restaura controle do jogador
  scene.playerState.miniGameActive = false;
  scene.playerState.canMove = true;
  scene.playerState.inDialog = false;
  scene.playerState.phase7Completed = true;

  const practicalObject = scene.interactiveObjects.find(o => o.key === 'instrutor_exame_pratico');
  const dialog = [
    "Parabéns! Você concluiu essa etapa com sucesso.",
    "Mas a estrada de verdade começa agora.",
    "Na rua, ninguém te dá segunda chance. É você, o carro e suas escolhas.",
    "Família, respeito e controle... essas são as três marchas que nunca podem falhar.",
    "Bem-vindo à família, piloto!"
  ]
  practicalObject.dialogs = dialog;

  // mensagem final
  const msg = "Excelente! Você completou o exame!";

  scene.directionArrow.scheduleReappear(5000, AREAS.practicalTest);

  if (scene.phase7ReminderTimer) {
    scene.phase7ReminderTimer.remove();
    scene.phase7ReminderTimer = null;
  }

  scene.ui.showMessage(msg);
  
  scene.events.removeListener('car:minigame:end');
}