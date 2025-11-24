// js/state.js

/**
 * Central state management for Gesturoids.
 * All game constants, entities, and global flags reside here.
 */

// --- 1. CONSTANTS ---
export const CONSTANTS = {
  MAX_SPEED: 7,
  ROTATION_SPEED: 0.08,
  FRICTION: 0.97,
  MISSILE_COOLDOWN: 3000,
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
  
  // Retro Camera Settings
  CRUNCH_WIDTH: 80,
  CRUNCH_HEIGHT: 60,

  // Input Smoothing Frame Count (Required consecutive frames for a gesture to register)
  SMOOTHING_FRAMES: 5, 
};

// --- 2. GAME STATE ---
export const state = {
  mode: "LOADING", // LOADING, MENU, CALIBRATING, HOLDING, PLAYING, PAUSED, GAMEOVER
  score: 0,
  highScore: parseInt(localStorage.getItem("gesturoids_highscore")) || 0,
  shields: 3,
  lastTime: 0,
  missileReadyTime: 0,
  
  // Hand Inputs (Smoothed values)
  inputLeft: "None",
  inputRight: "None",
  
  // Raw Input Buffers for smoothing logic
  rawLeftBuffer: [],
  rawRightBuffer: [],
  
  // Calibration/AI settings
  calibScore: 0,
  debugCam: true, // Show the PIP by default for debugging
  confidenceThreshold: 0.85, // Default AI confidence threshold
  
  // Flags
  gameStarted: false,
  hasLeft: false,
  hasRight: false,
};

// --- 3. ENTITIES (Initialized to empty arrays/null) ---
export let player = null;
export let bullets = [];
export let missiles = [];
export let asteroids = [];
export let particles = [];

// Functions for managing entities (will be defined in game.js, but referenced here)
export function resetEntities() {
  player = null;
  bullets = [];
  missiles = [];
  asteroids = [];
  particles = [];
}
