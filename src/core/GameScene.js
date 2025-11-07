import Ground from "../engine/physics/Ground.js";
import * as CameraSystem from "../engine/camera/cameraSystem.js";
import {
  createPlayerState,
  getPlayerStateInstance,
} from "../engine/player/playerState.js";
import {
  setupPlayer,
  updatePlayerMovement,
} from "../engine/player/playerController.js";
import { setupUI, updateUI } from "../engine/ui/uiSystem.js";
import {
  setupTransitions,
  checkTransitions,
} from "../engine/transition/transitionSystem.js";
import {
  setupDocuments,
  updateDocuments,
} from "../phases/phase1_home/documentSystem.js";
import { updatePhase2 } from "../phases/phase2_city/SelectionSystem.js";
import InteractiveObject from "../engine/interaction/InteractiveObject.js";
import { updateGenericInteractions } from "../engine/interaction/interactionSystem.js";
import { AREAS, CONFIG_SONG, PHYSICS_DEBUG, WORLD_SIZE } from "./config.js";

import {
  setupCharacterSelection,
  startGameWithCharacter,
} from "../engine/player/playerSelectionSystem.js";
import { updatePhase3 } from "../phases/phase3_clinic/clinicSystem.js";
import { updatePhase4 } from "../phases/phase4_driving_school1/drivingSchool1.js";
import { updatePhase5 } from "../phases/phase5_theoretical_test/theoreticalTest.js";
import { updatePhase6 } from "../phases/phase6_driving_school2/drivingSchool2.js";
import { updatePhase7 } from "../phases/phase7_practical_test/practicalTest.js";
import { updatePhase8 } from "../phases/phase8_final_scene/finalScene.js";
import { enableDebug, setupDebugToggle } from "../engine/utils/enableDebug.js";
import { IntroSystem } from "../engine/intro/introSystem.js"; // NOVO IMPORT
import { DirectionArrow } from "../engine/utils/directionArrow.js";
import { loadAssets } from "../engine/utils/assetLoader.js";
import { coreAssets } from "../assets/core_assets.js";
import { phase1Assets } from "../assets/phase1_assets.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.intro = new IntroSystem(this);

    this.arrow = null;
    this.arrowTimer = null;
    this.arrowTween = null;
    this.shouldShowArrow = false;
    this.arrowCooldown = false;
    this.reminderTimer = null;
  }

  init(data) {
    if (data?.restart) {
      this.selectedCharacter = null;
      this.playerTexture = null;
      this.intro = new IntroSystem(this);
      this.intro.showingCover = true;
      this.intro.showingInstructions = false;

      return;
    }

    this.selectedCharacter = data?.selectedCharacter;
    this.playerTexture = data?.playerTexture;

    if (this.selectedCharacter) {
      this.intro.showingCover = false;
      this.intro.showingInstructions = false;
    } else {
      this.intro.init(data);
    }
  }

  preload() {
    return loadAssets(this, coreAssets).then(() => {
      this._makeRectTexture("background", 1600, 450, 0x1f2630);
    });
  }

  create() {
    this.keys = this.input.keyboard.addKeys({
      E: Phaser.Input.Keyboard.KeyCodes.E,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      UP: Phaser.Input.Keyboard.KeyCodes.UP,
      LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
      RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
    });

    this.input.keyboard.enabled = true;
    this.input.keyboard.manager.enabled = true;

    this.input.keyboard.target = this.game.canvas;
    this.game.canvas.setAttribute("tabindex", "0");
    this.game.canvas.focus();

    if (this.intro.shouldShowIntro()) {
      if (this.intro.showingCover) {
        this.intro.showCoverScreen();
      } else if (this.intro.showingInstructions) {
        this.intro.showInstructionsScreen();
      }
      return;
    }

    if (!this.selectedCharacter) {
      this.setupCharacterSelection((character) => {
        this.startGameWithCharacter(character);
      });
      return;
    }

    this.directionArrow = new DirectionArrow(this);

    this.startMainGame();
  }

  onDocumentsCollected() {
    this.time.delayedCall(1000, () => {
      this.directionArrow.scheduleReappear(10000, AREAS.home);
    });
  }

  setupCharacterSelection(callback) {
    setupCharacterSelection(this, callback);
  }

  startGameWithCharacter(character) {
    startGameWithCharacter(this, character);
  }

  update() {
    if (this.intro.update()) {
      return;
    }

    if (!this.selectedCharacter) return;

    if (this.playerState && this.playerState.transitioning) return;

    if (
      this.player &&
      this.player.body &&
      this.player.body.touching.down &&
      this.player.body.velocity.y === 0
    ) {
      this.bedBounceStrength = 380;
    }

    try {
      if (this.player) {
        updatePlayerMovement(this);
      }

      if (this.playerState?.currentArea === AREAS.home && this.documents) {
        updateDocuments(this);
      } else if (this.playerState?.currentArea === AREAS.city) {
        this.player.body.setSize(120, 270);
        updatePhase2(this);
      } else if (this.playerState?.currentArea === AREAS.clinic) {
        updatePhase3(this);
      } else if (this.playerState?.currentArea === AREAS.drivingSchool1) {
        updatePhase4(this);
      } else if (this.playerState?.currentArea === AREAS.theoreticalTest) {
        updatePhase5(this);
      } else if (this.playerState?.currentArea === AREAS.drivingSchool2) {
        updatePhase6(this);
      } else if (this.playerState?.currentArea === AREAS.practicalTest) {
        updatePhase7(this);
      } else if (this.playerState?.currentArea === AREAS.finalScene) {
        updatePhase8(this);
      }

      if (this.player) {
        updateGenericInteractions(this);
      }
      checkTransitions(this);
      updateUI(this);
    } catch (err) {
      console.error("Erro no ciclo de update:", err);
    }
  }

  async startMainGame() {
    await loadAssets(this, phase1Assets);
    this.music = this.sound.play("main_theme", CONFIG_SONG);

    const { width, height } = this.scale;

    this.add
      .image(WORLD_SIZE / 2, height / 2, "background")
      .setDisplaySize(WORLD_SIZE, height)
      .setDepth(-3);

    this.ground = new Ground(this);

    this.homeBg1 = this.add
      .image(width / 2, height / 2, "home_bg")
      .setOrigin(0.33, 0.5)
      .setDepth(-2)
      .setScrollFactor(1)
      .setScale(0.48);

    const pc = new InteractiveObject(this, {
      key: "pc",
      x: width - 227,
      y: height - 160,
      texture: "pc",
      label: "",
      dialogs: [
        "CNH Popular Ceará - Inscrições Abertas!",
        "O programa oferece a 1ª via da Carteira Nacional de Habilitação de forma gratuita para pessoas de baixa renda.",
        "Também serão disponibilizadas vagas do programa para estudantes de graduação e ensino técnico",
        "Para se inscrever, você precisa ter entre 18 e 65 anos e morar no estado do Ceará há pelo menos 2 anos.",
        "O processo tem as etapas de coleta de documentos, inscrição, exame médico, aulas teóricas e práticas e avaliações.",
        "Primeiro, vamos verificar se você tem todos os documentos necessários: RG, CPF e comprovante de residência.",
        "Encontre seus documentos para começar o processo!",
      ],
      onInteract: () => {
        if (!this.playerState.docsMissionCompleted) {
          this.playerState.hasMission = true;
          this.ui.showMessage(
            "Encontre RG, CPF e comprovante de residência na sua casa!"
          );

          if (this.reminderTimer) {
            this.reminderTimer.remove();
            this.reminderTimer = null;
          }
        }
      },
      hintText: "Pressione a tecla E para interagir",
      hintTexture: "button_action",
      scale: 0.35,
    });

    this.physics.add.collider(pc, this.ground.ground);

    this.player = setupPlayer(this, 60, height - 275, this.playerTexture);

    this.physics.add.collider(this.player, this.ground.ground);

    const _stateRef = createPlayerState();

    // Define a propriedade apenas se ainda não existir
    if (!Object.getOwnPropertyDescriptor(this, "playerState")) {
      Object.defineProperty(this, "playerState", {
        configurable: false,
        enumerable: true,
        get() {
          return _stateRef;
        },
        set(newVal) {
          if (newVal && typeof newVal === "object") {
            Object.assign(_stateRef, newVal);
          }
        },
      });
    }
    const bedY = this.scale.height - 130;
    this.bed = this.add
      .rectangle(152, bedY, 180, 10, 0x9966ff)
      .setOrigin(0.5, 1)
      .setAlpha(0);

    this.physics.add.existing(this.bed, true);
    this.bed.body.setSize(160, 8);
    this.bed.body.updateFromGameObject();

    this.bed.setDepth(-1);

    this.bedBounceStrength = 380;
    this.bedDamping = 0.75;
    this.minBounce = 120;
    this.lastBounceTime = 0;

    this.physics.add.overlap(
      this.player,
      this.bed,
      this.handleBedBounce,
      undefined,
      this
    );

    this.playerState.currentArea = AREAS.home;
    this.playerState.character = this.selectedCharacter;
    this.playerState.playerTexture = this.playerTexture;

    CameraSystem.initCamera(this, this.player, WORLD_SIZE, height);

    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,

      UP: Phaser.Input.Keyboard.KeyCodes.UP,
      LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
      RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,

      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      E: Phaser.Input.Keyboard.KeyCodes.E,
    });

    this.input.keyboard.target = this.game.canvas;
    this.game.canvas.setAttribute("tabindex", "0");
    this.game.canvas.focus();

    this.ui = setupUI(this);
    this.transition = setupTransitions(this);
    this.documents = setupDocuments(this);

    this.time.delayedCall(1000, () => {
      this.ui.showMessage(
        "Interaja com o computador para começar sua jornada!"
      );
    });

    if (PHYSICS_DEBUG) {
      enableDebug(this, { initialOn: true });
      setupDebugToggle(this, "P");
    }

    const scheduleReminder = () => {
      if (
        !this.playerState.docsMissionCompleted &&
        !this.playerState.hasMission
      ) {
        this.reminderTimer = this.time.delayedCall(20000, () => {
          if (
            !this.playerState.docsMissionCompleted &&
            !this.playerState.hasMission
          ) {
            this.ui.showMessage(
              "Interaja com o computador para começar sua jornada!"
            );
            scheduleReminder();
          }
        });
      }
    };

    scheduleReminder();
  }

  handleBedBounce() {
    const player = this.player;
    const bed = this.bed;
    const now = this.time.now;

    if (!player.body || !bed.body) return;

    const playerFalling = player.body.velocity.y > 100;
    const touchingTop = player.body.bottom <= bed.body.top + 10;

    if (playerFalling && touchingTop) {
      if (now - this.lastBounceTime < 200) return;
      this.lastBounceTime = now;

      player.setVelocityY(-this.bedBounceStrength);

      this.bedBounceStrength *= this.bedDamping;
      if (this.bedBounceStrength < this.minBounce) {
        this.bedBounceStrength = 0;
      }

      this.sound.play("boing");
    }
  }

  _makeRectTexture(key, w, h, color) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, w, h, 6);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
