import * as CameraSystem from "../../engine/camera/cameraSystem.js";
import { AREAS, CONFIG_EFFECT, WORLD_SIZE } from "../../core/config.js";
import InteractiveObject from "../../engine/interaction/InteractiveObject.js";
import { DirectionArrow } from "../../engine/utils/directionArrow.js";
import { phase8Assets } from "../../assets/phase8_assets.js";
import { loadAssets } from "../../engine/utils/assetLoader.js";

function createCarCutscene(scene) {
  const carRef = scene.interactiveObjects.find(
    (obj) => obj.key === "car_final"
  );
  if (!carRef?.object) {
    console.error("[FinalScene] Carro final não encontrado!");
    return;
  }

  const car = carRef.object;
  const { player, sound, cameras, ui } = scene;

  player.setVisible(false);
  scene.playerState.inDialog = true;
  scene.playerState.canMove = false;
  player.setPosition(car.x, car.y);
  scene.input.keyboard.enabled = false;

  sound.stopAll();
  const drivingSound = sound.add("driving_car", {
    volume: 0.03,
  });

  drivingSound.play();

  cameras.main.startFollow(car);

  scene.tweens.add({
    targets: car,
    x: car.x + 100,
    duration: 1000,
    ease: "Power1",
    onUpdate: () => player.setPosition(car.x, car.y),
    onComplete: () => {
      ui?.showMessage("Vamos nessa!");

      scene.tweens.add({
        targets: car,
        x: scene.scale.width + 500,
        duration: 3000,
        ease: "Linear",
        onUpdate: () => player.setPosition(car.x, car.y),
        onComplete: () => {
          drivingSound.stop();
          drivingSound.destroy();
          sound.play("success", { volume: 0.1 });

          cameras.main.stopFollow();
          ui?.hideMessage?.();

          if (scene.input?.keyboard) scene.input.keyboard.enabled = true;
          showEndGameModal(scene);
        },
      });
    },
  });
}

function showEndGameModal(scene) {
  const { width, height } = scene.scale;
  const modalDepth = 1000;

  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    .setScrollFactor(0)
    .setDepth(modalDepth);

  const title = scene.add
    .text(width / 2, height / 2 - 50, "PARABÉNS!", {
      fontSize: "48px",
      color: "#ffffff",
      fontFamily: '"Silkscreen", "Courier New", monospace',
      fontWeight: "bold",
    })
    .setOrigin(0.5)
    .setDepth(modalDepth + 2)
    .setScrollFactor(0)
    .setAlpha(0);

  const message = scene.add
    .text(width / 2, height / 2 + 30, "Você concluiu sua jornada rumo à CNH!", {
      fontSize: "24px",
      color: "#ffffff",
      fontFamily: '"Silkscreen", "Courier New", monospace',
      fontWeight: "bold",
      align: "center",
      lineSpacing: 10,
    })
    .setOrigin(0.5)
    .setDepth(modalDepth + 2)
    .setScrollFactor(0)
    .setAlpha(0);

  scene.tweens.add({
    targets: [title, message],
    alpha: 1,
    duration: 1000,
    ease: "Power2",
  });

  scene.tweens.add({
    targets: title,
    scale: { from: 0.5, to: 1 },
    duration: 800,
    ease: "Back.easeOut",
  });

  scene.time.delayedCall(3000, () => {
    overlay.destroy();
    title.destroy();
    message.destroy();
    scene.scene.start("CreditsScene");
  });
}

export async function startPhase8(scene) {
  const { width, height } = scene.scale;

  await loadAssets(scene, phase8Assets);

  Object.assign(scene.playerState, {
    canMove: true,
    inDialog: false,
    currentArea: AREAS.finalScene,
    hasLicense: false,
  });

  CameraSystem.initCamera(scene, scene.player, WORLD_SIZE, height);
  scene.physics.world.setBounds(0, 0, WORLD_SIZE, height);

  const groundRect = scene.add.rectangle(
    WORLD_SIZE / 2,
    height - 30,
    WORLD_SIZE,
    64,
    0x444444
  );
  scene.physics.add.existing(groundRect, true);
  scene.physics.add.collider(scene.player, groundRect);
  scene.ground = { ground: groundRect };
  groundRect.setVisible(false);

  scene.add.image(width / 2, height / 2, "final_bg")
    .setOrigin(0.33, 0.5)
    .setDepth(-2)
    .setScrollFactor(1)
    .setScale(0.46)

  scene.textures.get("final_bg").setFilter(Phaser.Textures.FilterMode.LINEAR);

  scene.addLicenseToInventory = () => {
    if (scene.playerState.hasLicense) return;
    scene.playerState.hasLicense = true;
    scene.ui?.addToInventory?.("habilitacao");
    scene.ui?.showMessage("Carteira de habilitação adicionada ao inventário!");

    const mailObj = scene.interactiveObjects.find((o) => o.key === "mail");
    if (mailObj)
      mailObj.dialogs = ["Você já pegou sua carteira de habilitação!"];

    scene.directionArrow.scheduleReappear(5000, AREAS.finalScene);

    if (scene.phase8ReminderTimer) {
      scene.phase8ReminderTimer.remove();
      scene.phase8ReminderTimer = null;
    }
  };

  const isGirl = scene.playerState.character === "girl";
  const pronome = isGirl ? "a" : "o";
  const meu_minha = isGirl ? "inha" : "eu";

  scene.directionArrow = new DirectionArrow(scene);

  const characters = [
    {
      key: "mother",
      x: width - 350,
      y: height - 150,
      scale: 0.17,
      texture: "mother",
      dialogs: [
        `Estou orgulhosa de você, filh${pronome}!`,
        "Parabéns por ter concluído todas as suas missões com sucesso!",
      ],
    },
    {
      key: "brother",
      x: width - 270, y: height - 136, scale: 0.17,
      texture: "brother",
      dialogs: [
        `Finalmente m${meu_minha} irm${
          isGirl ? "ã" : "ão"
        } vai poder me levar até meu restaurante preferido, que tem a comida muito boa!`,
      ],
    },
    {
      key: "grandpa",
      x: width - 130,
      y: height - 154,
      scale: 0.172,
      texture: "grandpa",
      dialogs: [
        `M${meu_minha} querid${pronome}, vou te falar uma coisa...`,
        "Eu já vendi muito mel durante a minha vida...",
        "Mas nenhum mel tem a doçura de te ver conquistando sua habilitação.",
        "Parabéns por sua conquista!",
      ],
    },
    {
      key: "mail",
      x: width - 530,
      y: height - 150,
      scale: 0.17,
      texture: "mail",
      dialogs: ["Opa! Sua carteira de motorista acaba de chegar!"],
      onInteract: () => scene.addLicenseToInventory(),
    },
    {
      key: "car_final",
      x: width + 200,
      y: height - 155,
      scale: 0.48,
      texture: "car_final",
      dialogs: [
        `Que vitória, hein, amig${pronome}?`,
        "Lembra das três marchas da vida? Respeito, família e controle?",
        `A quarta marcha, nós dois construiremos juntos, conduto${
          isGirl ? "ra" : "r"
        }!`,
      ],
      onInteract: () => {
        if (scene.playerState.hasLicense) createCarCutscene(scene);
        else
          scene.ui?.showMessage(
            "Espere! Pegue sua habilitação com o carteiro antes de dirigir!"
          );
      },
    },
  ];

  characters.forEach((cfg) => {
    const npc = new InteractiveObject(scene, {
      ...cfg,
      label: "",
      hintText: "Pressione a tecla E para interagir",
      hintTexture: "button_action",
    });
    npc.sprite?.setDepth(-2);
  });

  scene.time.delayedCall(800, () => {
    scene.ui?.showMessage(
      "Sua carteira de habilitação chegou! Fale com o carteiro para pegá-la."
    );
  });

  scene.player.setPosition(30, height - 305);
  scene.player.setVelocity(0);

  function scheduleReminder() {
    if (!scene.playerState.phase8Completed) {
      scene.phase8ReminderTimer = scene.time.delayedCall(20000, () => {
        if (!scene.playerState.phase8Completed) {
          scene.ui.showMessage(
            "Sua carteira de habilitação acaba de chegar! Interaja com o carteiro para pegá-la."
          );
          scheduleReminder();
        }
      });
    }
  }

  scheduleReminder();
}

export function updatePhase8(scene) {
  if (scene.directionArrow) {
    scene.directionArrow.update();
  }

  if (scene.playerState.currentArea !== AREAS.finalScene) return;
}
