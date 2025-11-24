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
  MISSILE_COOLDOWN: 180, // Changed from 3000ms to 180 frames (3 seconds) for frame-based logic
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
  
  // New Game Logic Constants
  ACCELERATION: 0.3, // Player acceleration factor
  GUN_COOLDOWN: 10,  // Frames between laser shots
  MAX_SHIELDS: 3,    // Initial player shields
  
  // Retro Camera Settings
  CRUNCH_WIDTH: 80,
  CRUNCH_HEIGHT: 60,

  // Calibration Settings 
  CALIB_THRESHOLD: 80, 
  SMOOTHING_FRAMES: 5, 
};



export const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4], // Thumb
  [0,5],[5,6],[6,7],[7,8], // Index
  [9,10],[10,11],[11,12], // Middle
  [13,14],[14,15],[15,16], // Ring
  [17,18],[18,19],[19,20], // Pinky
  [5,9],[9,13],[13,17], // Palm base
  [0,17] // Wrist to Pinky base
];

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
