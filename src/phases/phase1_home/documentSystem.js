/**
 * ======================================================
 *  FASE 1 — CASA DO PERSONAGEM (Coleta de Documentos)
 * ======================================================
 *
 * Objetivo:
 *   - O jogador deve encontrar RG e CPF escondidos.
 *   - Só aparecem após a missão iniciar.
 *   - Cada documento mostra uma explicação quando coletado.
 *   - Quando todos forem coletados → missão concluída.
 *
 * Dependências:
 *   - scene.playerState (com flags hasMission, collectedDocs, etc.)
 *   - scene.ui (com showMessage e addToInventory)
 *   - scene.ground.ground (para colisão)
 */

import { phase1Assets } from "../../assets/phase1_assets";
import { AREAS } from "../../core/config";
import { loadAssets } from "../../engine/utils/assetLoader";
import { DirectionArrow } from "../../engine/utils/directionArrow";

export function setupDocuments(scene) {
  if (scene.playerState.docsMissionCompleted) {
    return;
  }

  const group = scene.physics.add.group({ allowGravity: true });
  group.runChildUpdate = true;

  const documentsData = [
    {
      id: "Documento de Identidade",
      key: "doc_rg",
      x: 460,
      spawnY: 105,
      targetY: scene.scale.height - 235,
      desc: "Documento de identidade, necessário para se identificar.",
    },
    {
      id: "CPF",
      key: "doc_cpf",
      x: 990,
      spawnY: 140,
      targetY: scene.scale.height - 265,
      desc: "Cadastro de Pessoa Física, usado em cadastros e registros.",
    },
    {
      id: "Comprovante de Residência",
      key: "doc_comprovante",
      x: 200,
      spawnY: 80,
      targetY: scene.scale.height - 160,
      desc: "Comprovante de residência, usado para confirmar seu endereço.",
    },
  ];

  return {
    group,
    documentsData,
    spawned: false,
    completed: false,
  };
}

// ======================================================
// LOOP DE ATUALIZAÇÃO PRINCIPAL
// ======================================================

export async function updateDocuments(scene) {
  const { playerState, documents } = scene;
  
  await loadAssets(scene, phase1Assets);

  if (!documents || !documents.group) return;

  // missão ainda não começou → nada acontece
  if (!playerState.hasMission) return;

  // missão começou → spawna os documentos (uma única vez)
  if (!documents.spawned) {
    spawnDocuments(scene);
    documents.spawned = true;
  }

  // Congela os documentos quando atingem a posição Y desejada
  documents.group.getChildren().forEach((doc) => {
    if (doc.body && doc.active && doc.y >= doc.targetY) {
      doc.body.setVelocity(0, 0);
      doc.body.allowGravity = false;
      doc.body.moves = false;
      doc.y = doc.targetY;
    }
  });

  // monitora progresso
  checkMissionProgress(scene);
}

// ======================================================
// HELPERS — SPAWN / COLETA / PROGRESSO
// ======================================================

function spawnDocuments(scene) {
  if (scene.playerState.docsMissionCompleted) return;

  const { documentsData, group } = scene.documents;

  // cria sprite físico apenas quando a missão começa
  documentsData.forEach((data) => {
    // Spawna na posição alta (spawnY) para cair
    const doc = group.create(data.x, data.spawnY, data.key).setScale(0.08);
    doc.docId = data.id;
    doc.docDesc = data.desc;
    doc.targetY = data.targetY; // guarda a posição final desejada
  });

  // colisão com o chão
  scene.physics.add.collider(group, scene.ground.ground);

  // overlap com o jogador
  scene.physics.add.overlap(scene.player, group, (_, doc) => {
    collectDocument(scene, doc);
  });
}

function collectDocument(scene, doc) {
  const { playerState } = scene;
  if (!playerState.hasMission) return;
  if (playerState.collectedDocs.includes(doc.docId)) return; // já coletado

  // Remove completamente o documento do mundo
  safelyDestroyDoc(doc);

  // Registra coleta
  playerState.collectedDocs.push(doc.docId);

  // Feedback visual e inventário
  scene.ui.showMessage(`Você encontrou o ${doc.docId}!`);
  scene.ui.addToInventory(doc.texture.key);

  // Checa progresso
  checkMissionProgress(scene);
}

function checkMissionProgress(scene) {
  const { playerState, documents } = scene;
  const totalDocs = documents.documentsData.length;
  const collected = playerState.collectedDocs.length;

  // Já completou antes? Sai.
  if (documents.completed) return;

  // Completou agora?
  if (collected >= totalDocs) {
    documents.completed = true;
    playerState.docsMissionCompleted = true;
    playerState.hasMission = false;

    const pcObject = scene.interactiveObjects.find((o) => o.key === "pc");
    pcObject.dialogs = [
      "Etapa de coleta de documentos concluída! Agora, vamos em frente para a próxima missão!",
    ];

    scene.directionArrow = new DirectionArrow(scene);

    scene.directionArrow.scheduleReappear(5000, AREAS.home);

    scene.time.delayedCall(2000, () => {
      scene.ui.showMessage(
        "Etapa de coleta de documentos concluída! Agora, vamos em frente para a próxima missão!"
      );
    });
  }
}

// ======================================================
// FUNÇÃO AUXILIAR: destrói o documento com segurança
// ======================================================

function safelyDestroyDoc(doc) {
  if (!doc) return;
  if (doc.body) {
    doc.body.enable = false;
    doc.body.checkCollision.none = true;
  }
  doc.setVisible(false);
  doc.setActive(false);
  doc.destroy();
}
