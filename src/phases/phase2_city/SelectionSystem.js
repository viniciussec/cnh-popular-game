import { setupObstacles } from "../../engine/physics/obstacleSystem.js";
import * as CameraSystem from "../../engine/camera/cameraSystem.js";
import { updateGenericInteractions } from "../../engine/interaction/interactionSystem.js";
import InteractiveObject from "../../engine/interaction/InteractiveObject.js";
import { AREAS, WORLD_SIZE } from "../../core/config.js";
import { DirectionArrow } from "../../engine/utils/directionArrow.js";
import { loadAssets } from "../../engine/utils/assetLoader.js";
import { phase2Assets } from "../../assets/phase2_assets.js";

/**
 * FASE 2 — Corrida até o DETRAN + Interação com NPC
 */
export async function startPhase2(scene) {
  const { width, height } = scene.scale;

  await loadAssets(scene, phase2Assets);

  if (scene.interactiveObjects) {
    scene.interactiveObjects = scene.interactiveObjects.filter(
      (obj) => obj.key !== "pc"
    );

    if (scene.pc) {
      scene.pc.destroy();
      scene.pc = null;
    }
  }

  // === MUNDO VISUAL ===
  CameraSystem.initCamera(scene, scene.player, WORLD_SIZE, height);
  scene.physics.world.setBounds(0, 0, WORLD_SIZE, height);

  scene.add
    .image(width / 2, height / 2, "city_bg")
    .setOrigin(0.33, 0.5)
    .setDepth(-2)
    .setScrollFactor(1)
    .setScale(0.48);

  scene.textures.get("city_bg").setFilter(Phaser.Textures.FilterMode.LINEAR);

  const groundRect = scene.add.rectangle(
    WORLD_SIZE / 2,
    height - 30,
    WORLD_SIZE,
    64,
    0x444444
  );
  groundRect.setVisible(false);

  scene.physics.add.existing(groundRect, true);
  scene.physics.add.collider(scene.player, groundRect);
  scene.ground = { ground: groundRect };

  // === PLAYER ===
  scene.player.setPosition(30, height - 305);
  scene.player.setVelocity(0);
  scene.playerState.canMove = true;
  scene.playerState.currentArea = AREAS.city;

  // === INTERFACE ===
  scene.ui.showMessage("Encontre a autoescola logo mais a frente!");

  // === OBSTÁCULOS ===
  scene.obstacles = setupObstacles(scene);

  let collisionDebugged = false;

  scene.physics.add.collider(scene.player, scene.obstacles, () => {
    if (!collisionDebugged) {
      collisionDebugged = true;
    }
  });

  scene.directionArrow = new DirectionArrow(scene);

  scene.directionArrow.showRight();

  function scheduleReminder() {
    if (!scene.playerState.phase2Completed) {
      scene.phase2ReminderTimer = scene.time.delayedCall(20000, () => {
        if (!scene.playerState.phase2Completed) {
          scene.ui.showMessage("Encontre a autoescola logo mais a frente!");
          scene.directionArrow.showRight();
          scheduleReminder();
        }
      });
    }
  }

  scheduleReminder();

  // === AUTOESCOLA ===
  const autoescola = new InteractiveObject(scene, {
    key: "autoescola",
    x: width + 160,
    y: height - 190,
    texture: "autoescola",
    scale: 0.6,
    width: 200,
    height: 100,
    proximity: { x: 80, y: 120 },
    dialogs: [
      "Olá! Parabéns por chegar até aqui.",
      "Antes de confirmar sua inscrição, preciso fazer algumas perguntas sobre o programa CNH Popular.",
    ],
    onInteract: () => {
      if (scene.playerState.quizActive) return;
      if (!scene.playerState.phase2Completed && !scene.playerState.hasMission) {
        startQuiz(scene);
      }
    },
    label: "",
    hintText: "Pressione a tecla E para interagir",
    hintTexture: "button_action",
  });

  autoescola.sprite.setDepth(-2);
}

/**
 * Atualização da fase 2 — chamada no GameScene.update()
 */
export function updatePhase2(scene) {
  if (scene.playerState.currentArea !== AREAS.city) return;

  updateGenericInteractions(scene);
}

function startQuiz(scene) {
  const { width, height } = scene.scale;

  scene.playerState.quizActive = true;
  scene.playerState.hasMission = true;

  scene.playerState.canMove = false;
  scene.playerState.inDialog = true;

  const quiz = [
    {
      text: "Qual é o principal objetivo do programa CNH Popular?",
      options: [
        "A) Oferecer carteira de motorista gratuita para toda a população",
        "B) Facilitar o acesso à CNH para pessoas de baixa renda",
        "C) Substituir todas as autoescolas particulares",
        "D) Aumentar a arrecadação do governo",
      ],
      correct: 1,
      explanation:
        "A CNH Popular tem como objetivo principal facilitar o acesso à Carteira Nacional de Habilitação para pessoas de baixa renda, reduzindo os custos do processo.",
    },
    {
      text: "Quem é o público-alvo do programa CNH Popular?",
      options: [
        "A) Pessoas com ensino superior completo",
        "B) Desempregados há mais de 6 meses",
        "C) Pessoas inscritas no CadÚnico",
        "D) Proprietários de veículos",
      ],
      correct: 2,
      explanation:
        "Pessoas inscritas no CadÚnico têm prioridade, pois o programa é voltado para pessoas em situação de vulnerabilidade social.",
    },
    {
      text: "Quais documentos são necessários para a inscrição no programa?",
      options: [
        "A) RG, CPF e comprovante de residência",
        "B) Passaporte e carteira de trabalho",
        "C) Certidão de casamento e título de eleitor",
        "D) Carteira de identidade profissional e CNH anterior",
      ],
      correct: 0,
      explanation:
        "Os documentos básicos são: RG, CPF e comprovante de residência para comprovar elegibilidade.",
    },
    {
      text: "Quais custos são cobertos pela CNH Popular?",
      options: [
        "A) Apenas as taxas do DETRAN",
        "B) Somente as aulas teóricas",
        "C) Taxas, exames e curso teórico-prático",
        "D) Apenas a emissão da carteira",
      ],
      correct: 2,
      explanation:
        "O programa geralmente cobre as taxas do DETRAN, exames médicos e psicológicos, e o curso teórico-prático nas autoescolas credenciadas.",
    },
    {
      text: "Como são divulgados os resultados da seleção?",
      options: [
        "A) Apenas por telefone",
        "B) No site oficial do DETRAN-CE",
        "C) Nas redes sociais do prefeito",
        "D) Nas autoescolas participantes",
      ],
      correct: 1,
      explanation:
        "Os resultados são divulgados oficialmente site oficial do DETRAN-CE, garantindo transparência.",
    },
  ];

  let current = 0;
  let correctCount = 0;
  let canAdvance = false;
  let advanceHint = null;
  let advanceKey = null;
  let clickZone = null;
  let optionKeys = null;
  let autoAdvanceTimer = null;
  let countdownText = null;

  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    .setScrollFactor(0)
    .setDepth(100);

  const panel = scene.add
    .rectangle(width / 2, height / 2, width - 100, height - 100, 0x000000)
    .setStrokeStyle(2, 0xffffff)
    .setScrollFactor(0)
    .setDepth(101);

  const progress = scene.add
    .text(width / 2, height / 2 - 200, "", {
      fontSize: "14px",
      color: "#bdc3c7",
      fontFamily: '"Silkscreen", monospace',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(102);

  const question = scene.add
    .text(width / 2, height / 2 - 140, "", {
      fontSize: "16px",
      color: "#ecf0f1",
      align: "center",
      fontStyle: "bold",
      fontFamily: '"Silkscreen", monospace',
      wordWrap: { width: width - 150 },
      lineSpacing: 8,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(102);

  const buttons = [];
  const feedback = scene.add
    .text(width / 2, height / 2 + 130, "", {
      fontSize: "12px",
      color: "#f39c12",
      align: "center",
      fontFamily: '"Silkscreen", monospace',
      wordWrap: { width: width - 120 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(102);

  function createAdvanceHint() {
    if (advanceHint) {
      advanceHint.destroy();
    }

    advanceHint = scene.add
      .text(
        width / 2,
        height - 30,
        "Clique na tela ou pressione ESPAÇO para avançar",
        {
          fontSize: "14px",
          color: "#ffffff",
          fontFamily: '"Silkscreen", monospace',
          align: "center",
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102)
      .setAlpha(0);

    scene.tweens.add({
      targets: advanceHint,
      alpha: 0.8,
      duration: 1000,
      ease: "Power2",
      yoyo: true,
      repeat: -1,
    });

    return advanceHint;
  }

  function startAutoAdvanceTimer(duration = 4000) {
    if (autoAdvanceTimer) {
      autoAdvanceTimer.remove();
    }

    autoAdvanceTimer = scene.time.delayedCall(duration, () => {
      if (canAdvance) {
        advanceToNextQuestion();
      }
    });
  }

  function setupAdvanceControls() {
    if (advanceKey) {
      advanceKey.destroy();
    }

    advanceKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    advanceKey.on("down", () => {
      if (autoAdvanceTimer) {
        autoAdvanceTimer.remove();
      }
      if (countdownText) {
        countdownText.destroy();
        countdownText = null;
      }
      advanceToNextQuestion();
    });

    if (clickZone) {
      clickZone.destroy();
    }

    clickZone = scene.add
      .zone(width / 2, height / 2, width, height)
      .setScrollFactor(0)
      .setDepth(103)
      .setInteractive();

    clickZone.on("pointerdown", () => {
      if (autoAdvanceTimer) {
        autoAdvanceTimer.remove();
      }
      if (countdownText) {
        countdownText.destroy();
        countdownText = null;
      }
      advanceToNextQuestion();
    });

    startAutoAdvanceTimer();
  }

  function setupOptionKeys() {
    if (optionKeys) {
      optionKeys.A.off("down");
      optionKeys.B.off("down");
      optionKeys.C.off("down");
      optionKeys.D.off("down");
    }

    optionKeys = {
      A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      B: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
      C: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    optionKeys.A.on("down", () => selectOption(0));
    optionKeys.B.on("down", () => selectOption(1));
    optionKeys.C.on("down", () => selectOption(2));
    optionKeys.D.on("down", () => selectOption(3));
  }

  function selectOption(optionIndex) {
    if (canAdvance) return;

    const q = quiz[current];

    const btnIndex = optionIndex * 2;

    if (buttons[btnIndex] && buttons[btnIndex].active) {
      buttons.forEach((b, index) => {
        if (index % 2 === 0) {
          b.removeAllListeners();
          b.disableInteractive();
        }
      });

      if (optionIndex === q.correct) {
        scene.sound.play("goal_complete");

        buttons[btnIndex].setFillStyle(0x27ae60);
        buttons[btnIndex].setStrokeStyle(2, 0x2ecc71);
        if (buttons[btnIndex + 1]) {
          buttons[btnIndex + 1].setColor("#ffffff");
        }
        feedback.setText("✓ Correto! " + q.explanation);
        feedback.setColor("#2ecc71");
        correctCount++;
      } else {
        scene.sound.play("fail");

        buttons[btnIndex].setFillStyle(0xe74c3c);
        buttons[btnIndex].setStrokeStyle(2, 0xc0392b);
        if (buttons[btnIndex + 1]) {
          buttons[btnIndex + 1].setColor("#ffffff");
        }
        feedback.setText("✗ Incorreto. " + q.explanation);
        feedback.setColor("#e74c3c");

        const correctBtnIndex = q.correct * 2;
        if (buttons[correctBtnIndex]) {
          buttons[correctBtnIndex].setFillStyle(0x27ae60);
          buttons[correctBtnIndex].setStrokeStyle(2, 0x2ecc71);
          if (buttons[correctBtnIndex + 1]) {
            buttons[correctBtnIndex + 1].setColor("#ffffff");
          }
        }
      }

      canAdvance = true;

      if (autoAdvanceTimer) {
        autoAdvanceTimer.remove();
      }
      if (countdownText) {
        countdownText.destroy();
        countdownText = null;
      }

      createAdvanceHint();
      setupAdvanceControls();
    }
  }

  function advanceToNextQuestion() {
    if (!canAdvance) return;

    canAdvance = false;
    current++;

    if (autoAdvanceTimer) {
      autoAdvanceTimer.remove();
      autoAdvanceTimer = null;
    }
    if (countdownText) {
      countdownText.destroy();
      countdownText = null;
    }

    if (current < quiz.length) {
      showQuestion();
    } else {
      finishQuiz();
    }
  }

  function showQuestion() {
    const q = quiz[current];

    progress.setText(
      `Clique no item ou pressione a letra correspondente para responder`
    );

    question.setText(q.text);
    feedback.setText("");
    canAdvance = false;

    if (advanceHint) {
      advanceHint.destroy();
      advanceHint = null;
    }
    if (clickZone) {
      clickZone.destroy();
      clickZone = null;
    }
    if (countdownText) {
      countdownText.destroy();
      countdownText = null;
    }

    buttons.forEach((b) => {
      if (b.destroy) b.destroy();
    });
    buttons.length = 0;

    q.options.forEach((opt, i) => {
      const yPos = height / 2 - 80 + i * 55;

      const btnBg = scene.add
        .rectangle(width / 2, yPos, width - 150, 40, 0x000000)
        .setStrokeStyle(1, 0xffffff)
        .setScrollFactor(0)
        .setDepth(101)
        .setInteractive();

      const btnText = scene.add
        .text(width / 2, yPos, opt, {
          fontSize: "13px",
          fontFamily: '"Silkscreen", monospace',
          color: "#ecf0f1",
          align: "start",
          wordWrap: { width: width - 200 },
          lineSpacing: 4,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(102);

      let isHovering = false;

      btnBg.on("pointerover", () => {
        if (isHovering) return;
        isHovering = true;
        btnBg.setFillStyle(0xffffff);
        btnText.setColor("#000000");
      });

      btnBg.on("pointerout", () => {
        if (!isHovering) return;
        isHovering = false;
        btnBg.setFillStyle(0x000000);
        btnText.setColor("#ffffff");
      });

      btnBg.on("pointerdown", () => {
        selectOption(i);
      });

      buttons.push(btnBg, btnText);
    });

    setupOptionKeys();
  }

  function finishQuiz() {
    scene.directionArrow.scheduleReappear(5000, AREAS.city);

    if (scene.phase2ReminderTimer) {
      scene.phase2ReminderTimer.remove();
      scene.phase2ReminderTimer = null;
    }

    if (autoAdvanceTimer) {
      autoAdvanceTimer.remove();
    }
    if (advanceKey) {
      advanceKey.destroy();
    }
    if (optionKeys) {
      optionKeys.A.off("down");
      optionKeys.B.off("down");
      optionKeys.C.off("down");
      optionKeys.D.off("down");
    }

    [
      overlay,
      panel,
      progress,
      question,
      feedback,
      advanceHint,
      clickZone,
      countdownText,
    ].forEach((el) => {
      if (el && el.destroy) el.destroy();
    });

    buttons.forEach((b) => {
      if (b && b.destroy) b.destroy();
    });

    scene.playerState.phase2Completed = true;
    scene.playerState.hasMission = false;

    const npcObject = scene.interactiveObjects.find(
      (o) => o.key === "autoescola"
    );
    const dialog =
      "Parabéns! Sua inscrição foi confirmada. Siga em frente para sua próxima missão.";
    npcObject.dialogs = [dialog];

    scene.time.delayedCall(1000, () => {
      scene.ui.showMessage(dialog);
      scene.playerState.canMove = true;
      scene.playerState.inDialog = false;
      scene.playerState.quizActive = false;
    });
  }

  showQuestion();
}
