import * as CameraSystem from "../camera/cameraSystem.js";
import { clearScene } from "../utils/sceneUtils.js";
import { startPhase2 } from "../../phases/phase2_city/SelectionSystem.js";
import { AREAS, WORLD_SIZE } from "../../core/config.js";
import { startPhase3 } from "../../phases/phase3_clinic/clinicSystem.js";
import { startPhase4 } from "../../phases/phase4_driving_school1/drivingSchool1.js";
import { startPhase5 } from "../../phases/phase5_theoretical_test/theoreticalTest.js";
import { startPhase6 } from "../../phases/phase6_driving_school2/drivingSchool2.js";
import { startPhase7 } from "../../phases/phase7_practical_test/practicalTest.js";
import { startPhase8 } from "../../phases/phase8_final_scene/finalScene.js";
import { showWarning } from "../utils/showWarning.js";

/**
 * Define o limite de transição padrão (borda direita da casa).
 */
export function setupTransitions(scene) {
  return { sceneEndX: WORLD_SIZE * 0.95 };
}

/**
 * Atualiza transições entre áreas (somente quando permitido).
 * Livre de missão: a transição acontece do mesmo jeito.
 */
export function checkTransitions(scene) {
  const { player, transition, playerState } = scene;
  if (!player || !transition || !playerState) return;
  if (playerState.transitioning || playerState.transitionCooldown) return;

  // sair da casa pela direita → cidade
  if (
    playerState.currentArea === AREAS.home &&
    player.x >= transition.sceneEndX
  ) {
    if (playerState.docsMissionCompleted) {
      goToArea(scene, AREAS.city);
    } else {
      showWarning(scene, "o computador");
    }
  }
  if (
    playerState.currentArea === AREAS.city &&
    player.x >= transition.sceneEndX
  ) {
    if (playerState.phase2Completed) {
      goToArea(scene, AREAS.clinic);
    } else {
      showWarning(scene, "a autoescola");
    }
  }
  if (
    playerState.currentArea === AREAS.clinic &&
    player.x >= transition.sceneEndX
  ) {
    if (playerState.phase3Completed) {
      goToArea(scene, AREAS.drivingSchool1);
    } else {
      showWarning(scene, "a clínica");
    }
  }
  if (
    playerState.currentArea === AREAS.drivingSchool1 &&
    player.x >= transition.sceneEndX
  ) {
    if (playerState.phase4Completed) {
      goToArea(scene, AREAS.theoreticalTest);
    } else {
      showWarning(scene, "seu professor");
    }
  }
  if (
    playerState.currentArea === AREAS.theoreticalTest &&
    player.x >= transition.sceneEndX
  ) {
    if (playerState.phase5Completed) {
      goToArea(scene, AREAS.drivingSchool2);
    } else {
      showWarning(scene, "a funcionária do DETRAN");
    }
  }
  if (
    playerState.currentArea === AREAS.drivingSchool2 &&
    player.x >= transition.sceneEndX
  ) {
    if (playerState.phase6Completed) {
      goToArea(scene, AREAS.practicalTest);
    } else {
      showWarning(scene, "seu instrutor");
    }
  }
  if (
    playerState.currentArea === AREAS.practicalTest &&
    player.x >= transition.sceneEndX
  ) {
    if (playerState.phase7Completed) {
      goToArea(scene, AREAS.finalScene);
    } else {
      showWarning(scene, "seu instrutor");
    }
  }
}

/**
 * Transição genérica para qualquer área do jogo.
 * @param {Phaser.Scene} scene
 * @param {'home'|'city'} area
 * @param {object} options
 */
export async function goToArea(scene, area, options = {}) {
  const { delay = 0, preservePlayer = true } = options;
  const state = scene.playerState;

  if (state.transitioning || state.transitionCooldown) return;

  state.transitioning = true;
  state.canMove = false;

  // faz fade-out -> limpa -> carrega nova área -> fade-in
  CameraSystem.transition(scene, () => {
    clearScene(
      scene,
      preservePlayer
        ? [
            scene.player,
            scene.playerState,
            scene.ui?.inventory,
            scene.ui?.messageBox,
            scene.ui?.buttonsContainer,
          ]
        : []
    );

    // pequena pausa para garantir que o fade-out terminou
    scene.time.delayedCall(delay, () => {
      // === escolhe a nova área ===
      if (area === AREAS.home) {
        loadHome(scene);
      } else if (area === AREAS.city) {
        startPhase2(scene);
      } else if (area === AREAS.clinic) {
        startPhase3(scene);
      } else if (area === AREAS.drivingSchool1) {
        startPhase4(scene);
      } else if (area === AREAS.theoreticalTest) {
        startPhase5(scene);
      } else if (area === AREAS.drivingSchool2) {
        startPhase6(scene);
      } else if (area === AREAS.practicalTest) {
        startPhase7(scene);
      } else if (area === AREAS.finalScene) {
        startPhase8(scene);
      } else {
        console.warn(`Área desconhecida: ${area}`);
      }

      // === atualiza estado global ===
      state.currentArea = area;
      state.transitioning = false;
      state.transitionCooldown = true;
      state.canMove = true;

      // === cooldown pra evitar loop de entradas rápidas ===
      scene.time.delayedCall(1000, () => {
        state.transitionCooldown = false;
      });
    });
  });
}
