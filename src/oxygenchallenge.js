import './oxygenroom.css'
import { createAvatar } from './avatar.js'
import { initWaterRecycler } from './water-recycling.js'

// =====================================================
// PAGE HTML
// =====================================================

document.querySelector('#app').innerHTML = `
  <main class="air-screen">
    <section class="content">
      <div class="room-column">
      <header class="top-bar">
        <div class="header-left">
          <div class="room-name"><span class="blue-dot">●</span> Life Support (Air)</div>
        </div>

        <div class="header-right">
          <div class="air-status">
            <span class="oxygen-icon">O₂</span>
            <div class="air-info">
              <div class="air-label">
                <strong>Air</strong>
                <strong class="air-percentage">60%</strong>
              </div>
              <div class="air-track">
                <div class="air-fill"></div>
              </div>
            </div>
            <strong class="sol">Sol 3</strong>
          </div>

          <div class="status-chip"><span>★</span> Science 1/3</div>
          <div class="status-chip"><span>▣</span> Power cells 2</div>
        </div>
      </header>

        <div class="room">
          <div class="path horizontal"></div>
          <div class="path vertical"></div>
          <div class="path left-vertical"></div>
          <div class="path left-branch"></div>
          <div class="path right-vertical"></div>
          <div class="path right-branch"></div>

          <div class="station co2">
            <div class="station-title">CO₂ Intake</div>
            <div class="co2-machine">
              <div class="co2-slots"><i></i><i></i><i></i></div>
              <div class="co2-bottom"><span></span><span></span><span></span></div>
            </div>
          </div>

          <div class="station moxie">
            <div class="moxie-outline"></div>
            <div class="station-title">MOXIE (locked)</div>
            <div class="moxie-machine">
              <div class="moxie-top"></div>
              <div class="moxie-body">
                <div class="moxie-screen">MOXIE</div>
                <div class="moxie-yellow"></div>
                <div class="moxie-buttons"><i></i><i></i><i></i></div>
                <div class="moxie-side"></div>
              </div>
            </div>
            <div class="locked-label">🔒 Locked</div>
          </div>

          <div class="station tanks">
            <div class="station-title">Oxygen Tanks</div>
            <div class="tank-row">
              <div class="tank"><span></span><b>O₂</b></div>
              <div class="tank"><span></span><b>O₂</b></div>
              <div class="tank"><span></span><b>O₂</b></div>
            </div>
          </div>

          <div class="pipe pipe-left"></div>
          <div class="pipe pipe-right"></div>
          <div class="fact-label">Mars air ≈<br>95% CO₂.</div>
          <div class="moxie-note">MOXIE uses<br>electricity</div>

          <div class="power-station">
            <div class="battery">
              <div class="battery-cell"></div>
              <div class="battery-cell"></div>
              <div class="battery-cell"></div>
            </div>
            <div class="power-callout">1 Power Cell → +20% Air</div>
            <div class="station-label">
              <div class="station-footer">Power Cell Slot</div>
            </div>
          </div>

          <div class="science-station">
            <div class="science-card">
              <strong>MOXIE UNLOCK</strong>
              <div class="stars"><span class="earned">★</span></div>
            </div>
            <div class="station-label">
              <div class="station-footer">Science Link · 1 Star</div>
            </div>
            <small>Stars come from Science Lab</small>
          </div>

          <button class="exit-button">Exit to base</button>
        </div>
      </div>

      <aside class="instructions">
        <h2>Your Air Mission</h2>

        <h3 class="mission-phase">PHASE 1: UNLOCK MOXIE</h3>

        <div class="instruction">
          <span class="number">1</span>
          <div>
            <strong>Find the CO₂ machine</strong>
            <p>Walk to the CO₂ intake machine to start your mission.</p>
          </div>
        </div>

        <div class="instruction">
          <span class="number">2</span>
          <div>
            <strong>Make oxygen</strong>
            <p>Tap all 5 CO₂ molecules within 20 seconds.</p>
          </div>
        </div>

        <div class="instruction">
          <span class="number">3</span>
          <div>
            <strong>Pass the science quiz</strong>
            <p>Answer the question correctly to unlock MOXIE.</p>
          </div>
        </div>

        <div class="panel-divider"></div>

        <h3 class="mission-phase">PHASE 2: ACTIVATE MOXIE</h3>

        <div class="instruction">
          <span class="number">4</span>
          <div>
            <strong>Find MOXIE</strong>
            <p>Walk to the unlocked MOXIE machine.</p>
          </div>
        </div>

        <div class="instruction">
          <span class="number">5</span>
          <div>
            <strong>Power up MOXIE</strong>
            <p>Click Activate MOXIE. It uses 1 power cell to increase Air by 20%.</p>
          </div>
        </div>

        <div class="panel-divider"></div>

        <h3>YOUR GOAL</h3>
        <p class="loop-text">
          Activate MOXIE to spend 1 power cell and raise your Air level by 20%.
        </p>

        <div class="sol-action">
          <p id="sol-status">Complete one MOXIE run before ending this Sol.</p>
          <button class="end-sol-button" id="end-sol-button" disabled>End Sol</button>
        </div>
      </aside>
    </section>
  </main>
`
// =====================================================
// MISSION POPUP CSS
// =====================================================

const popupStyle = document.createElement('style')

popupStyle.textContent = `
  .mission-overlay {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 15px;
    background: rgba(23, 36, 61, 0.78);
  }

  .mission-card {
    width: min(420px, 95%);
    padding: 25px;
    background: #29283c;
    border: 3px solid #ffd83f;
    border-radius: 18px;
    color: white;
    text-align: center;
    box-shadow: 0 8px 25px #0007;
  }

  .mission-tag {
    display: inline-block;
    padding: 6px 12px;
    margin-bottom: 15px;
    background: #ffd83f;
    color: #29283c;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
  }

  .mission-card h2 {
    color: #ffd83f;
    font-size: 25px;
    margin-bottom: 12px;
  }

  .mission-card > p {
    font-size: 15px;
    line-height: 1.6;
    margin-bottom: 18px;
  }

  .mission-objective {
    padding: 14px;
    margin-bottom: 20px;
    background: #3b3a50;
    border-radius: 10px;
    text-align: left;
  }

  .mission-objective strong {
    color: #75d7c4;
    font-size: 15px;
  }

  .mission-objective p {
    font-size: 14px;
    line-height: 1.5;
    margin-top: 6px;
  }

  .mission-start,
  .mission-close {
    display: block;
    width: 100%;
    padding: 13px;
    margin-top: 10px;
    border: 0;
    border-radius: 9px;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
  }

  .mission-start {
    background: #ffd83f;
    color: #29283c;
  }

  .mission-start:hover {
    background: #ffe77a;
  }

  .mission-close {
    background: transparent;
    color: white;
  }

  .mission-close:hover {
    background: #414057;
  }

  /* Clear two-phase mission guide */
  .mission-phase {
    color: #75d7c4;
    font-size: 13px;
    letter-spacing: .4px;
    margin: 18px 0 12px;
  }

  /* Air increase feedback */
  .air-fill {
    transition: width 1s ease-in-out;
  }

  .air-fill.air-increase {
    animation: airGlow 1s ease-in-out;
  }

  @keyframes airGlow {
    0%, 100% {
      filter: brightness(1);
      box-shadow: none;
    }

    50% {
      filter: brightness(1.8);
      box-shadow: 0 0 15px #4dff9a;
    }
  }

  .air-gain-effect {
    position: absolute;
    z-index: 35;
    left: 50%;
    top: 15%;
    transform: translateX(-50%);
    color: #4dff9a;
    font-size: 20px;
    font-weight: bold;
    pointer-events: none;
    animation: floatAir 1.5s ease-out forwards;
  }

  @keyframes floatAir {
    from {
      opacity: 1;
      transform: translate(-50%, 0);
    }

    to {
      opacity: 0;
      transform: translate(-50%, -35px);
    }
  }
`

document.head.appendChild(popupStyle)

// =====================================================
// PLAYER AND GAME STATE
// =====================================================

function publishLifeResource(resource, value) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'mars-life:resource', resource, value }, location.origin)
  }
}

const room = document.querySelector('.room')
const player = createAvatar(room)
const water = initWaterRecycler(room, {          // Add Water Recycling to this same room
  onFull: () => publishLifeResource('water', 100),
  onClose: () => { dismissedStation = 'water'; currentNearbyStation = 'water' }   // don't reopen until you walk away
})
const waterStation = water.station

const co2Machine = room.querySelector('.co2-machine')
const moxieStation = room.querySelector('.moxie')
const exitDoor = room.querySelector('.exit-button')
const moxieLabel = moxieStation.querySelector('.locked-label')
const moxieTitle = moxieStation.querySelector('.station-title')

// Player position
let playerX = room.clientWidth / 2
let playerY = room.clientHeight * 0.85

const WALK_SPEED = 200
const paths = [...room.querySelectorAll('.path')]
let pathBounds = []
const keys = {}


// CO2 challenge state
let challengeOpen = false
let co2Collected = 0
let timeLeft = 20
let challengeTimer = null

// MOXIE state
let moxieUnlocked = false
let oxygenProduced = false
const sharedLifeSupport = window.parent !== window ? window.parent.MarsLifeSupport : undefined
let powerCells = 2
let airLevel = 60
window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'mars-life:sync') return
  airLevel = event.data.oxygen
  water.syncLevel(event.data.water)
  updateAirDisplay()
})
let currentSol = 3
let moxieActivatedThisSol = false
const AIR_DEMAND_PER_SOL = 10 // Simplified gameplay value, not a NASA measurement

// Popup state
let missionPopup = null
let dismissedStation = null
let currentNearbyStation = null

player.moveTo(playerX, playerY)

// =====================================================
// MACHINE POSITIONS AND DISTANCE CHECKS
// =====================================================

function getMachinePosition(machine) {
  const machineRect = machine.getBoundingClientRect()
  const roomRect = room.getBoundingClientRect()

  return {
    x: machineRect.left - roomRect.left + machineRect.width / 2,
    y: machineRect.top - roomRect.top + machineRect.height / 2
  }
}

function isNearCo2() {
  const target = getMachinePosition(co2Machine)

  return Math.hypot(
    playerX - target.x,
    playerY - target.y
  ) < 85
}

function isNearMoxie() {
  const walkway = room.querySelector('.path.horizontal')
  const stationX = moxieStation.offsetLeft + moxieStation.offsetWidth / 2
  const walkwayY = walkway.offsetTop + walkway.offsetHeight / 2
  return Math.abs(playerX - stationX) < 55
    && Math.abs(playerY - walkwayY) <= walkway.offsetHeight / 2
}

function isNearWater() {
  const target = getMachinePosition(waterStation)

  return Math.hypot(
    playerX - target.x,
    playerY - target.y
  ) < 85
}

function isNearExit() {
  const target = getMachinePosition(exitDoor)

  return Math.hypot(
    playerX - target.x,
    playerY - target.y
  ) < 65
}
// =====================================================
// MISSION POPUP FUNCTIONS
// =====================================================

function closeMissionPopup() {
  if (missionPopup) {
    missionPopup.remove()
    missionPopup = null
  }
}

function showMissionPopup(station) {
  closeMissionPopup()

  const popup = document.createElement('div')
  popup.className = 'mission-overlay'

  const isCo2 = station === 'co2'

  const title = isCo2
    ? 'Make Oxygen!'
    : (moxieUnlocked ? 'Activate MOXIE!' : 'MOXIE is Locked')

  const description = isCo2
    ? "Mars' atmosphere contains about 95% carbon dioxide (CO₂). Help your base produce oxygen!"
    : (moxieUnlocked
      ? 'MOXIE uses electricity to turn carbon dioxide into breathable oxygen.'
      : 'First, complete the CO₂ challenge and answer the science quiz to unlock MOXIE.')

  const objective = isCo2
    ? 'PHASE 1: Tap all 5 CO₂ molecules within 20 seconds, then answer the science quiz to unlock MOXIE.'
    : (moxieUnlocked
      ? `PHASE 2: Click Activate MOXIE. It will increase Air by up to 20%. ${sharedLifeSupport ? 'Cost: ' + sharedLifeSupport.moxieCost + ' Power.' : 'Cost: 1 power cell. You have ' + powerCells + ' cells.'}`
      : 'First complete the CO₂ challenge and science quiz. Then return here to activate MOXIE.')

  const buttonText = isCo2
    ? 'Start Mission'
    : (moxieUnlocked ? 'Activate MOXIE' : 'Got it!')

  popup.innerHTML = `
    <div class="mission-card">
      <span class="mission-tag">${isCo2 ? 'NEW MISSION' : 'LIFE SUPPORT'}</span>

      <h2>${title}</h2>

      <p>${description}</p>

      <div class="mission-objective">
        <strong>Your objective</strong>
        <p>${objective}</p>
      </div>

      <button class="mission-start">${buttonText}</button>
      <button class="mission-close">Not now</button>
    </div>
  `

  room.appendChild(popup)
  missionPopup = popup

  popup.querySelector('.mission-start').addEventListener('click', () => {
    closeMissionPopup()

    if (isCo2) {
      startCo2Challenge()
    } else if (moxieUnlocked) {
      activateMoxie()
    } else {
      dismissedStation = 'moxie'
    }
  })

  popup.querySelector('.mission-close').addEventListener('click', () => {
    dismissedStation = station
    closeMissionPopup()
  })
}

function showMessagePopup(title, message) {
  closeMissionPopup()

  const popup = document.createElement('div')
  popup.className = 'mission-overlay'

  popup.innerHTML = `
    <div class="mission-card">
      <span class="mission-tag">LIFE SUPPORT</span>
      <h2>${title}</h2>
      <p>${message}</p>
      <button class="mission-start">Continue</button>
    </div>
  `

  room.appendChild(popup)
  missionPopup = popup

  popup.querySelector('.mission-start').addEventListener('click', () => {
    closeMissionPopup()
  })
}

function showExitPopup() {
  closeMissionPopup()

  const popup = document.createElement('div')
  popup.className = 'mission-overlay'
  const completed = moxieActivatedThisSol && water.isFixed()
  popup.innerHTML = `
    <div class="mission-card">
      <span class="mission-tag">LIFE SUPPORT</span>
      <h2>${completed ? 'Mission complete!' : 'Return to Mars Base?'}</h2>
      <p>${completed ? 'You ran MOXIE and repaired the Water Recycler.' : 'You can come back to finish your work.'}</p>
      <button class="mission-start">Back to base map</button>
      <button class="mission-close">Stay here</button>
    </div>
  `

  room.appendChild(popup)
  missionPopup = popup

  function dismissExit() {
    closeMissionPopup()
    dismissedStation = 'exit'
    currentNearbyStation = 'exit'
  }

  popup.querySelector('.mission-start').addEventListener('click', () => {
    dismissExit()
    if (window.parent !== window) window.parent.postMessage({ type: 'mars-life:leave' }, location.origin)
  })
  popup.querySelector('.mission-close').addEventListener('click', dismissExit)
}

// =====================================================
// CO2 MINI-GAME
// =====================================================

function startCo2Challenge() {
  if (!isNearCo2() || challengeOpen) return

  challengeOpen = true
  co2Collected = 0
  timeLeft = 20

  // Stop avatar movement
  Object.keys(keys).forEach(key => {
    keys[key] = false
  })

  player.setWalking(false)

  showCo2Challenge()
}

function showCo2Challenge() {
  const overlay = document.createElement('div')
  overlay.className = 'co2-overlay'

  overlay.innerHTML = `
    <div class="co2-game-card">
      <h2>Tap the CO₂ molecules!</h2>

      <p>Split 5 molecules to make oxygen.</p>

      <div class="co2-game-status">
        <span id="co2-progress">0 / 5</span>
        <span id="co2-timer">20 seconds</span>
      </div>

      <div class="co2-game-area">
        ${Array.from({ length: 5 }, () => `
          <button
            class="co2-target"
            style="
              left: ${10 + Math.random() * 70}%;
              top: ${10 + Math.random() * 65}%;
            "
            aria-label="Tap CO₂ molecule"
          >
            CO₂
          </button>
        `).join('')}
      </div>

      <p class="co2-feedback">Tap all 5 molecules!</p>
    </div>
  `

  room.appendChild(overlay)

  const targets = overlay.querySelectorAll('.co2-target')
  const progress = overlay.querySelector('#co2-progress')
  const timer = overlay.querySelector('#co2-timer')

  // ===================================================
  // FINISH CHALLENGE
  // ===================================================

  function finishChallenge(success) {
    if (!challengeOpen) return

    clearInterval(challengeTimer)
    challengeTimer = null

    targets.forEach(target => {
      target.disabled = true
    })

    if (success) {
      const gameCard = overlay.querySelector('.co2-game-card')

      gameCard.innerHTML = `
        <h2>🌟 Did You Know?</h2>

        <p>
          Mars' atmosphere is about 95% carbon dioxide (CO₂)!
        </p>

        <p>
          MOXIE uses electricity to make oxygen from CO₂.
        </p>

        <div class="quiz-section">
          <p>What gas does MOXIE produce from CO₂?</p>

          <div class="quiz-options">
            <button class="quiz-option" data-answer="oxygen">
              Oxygen (O₂)
            </button>

            <button class="quiz-option" data-answer="water">
              Water (H₂O)
            </button>

            <button class="quiz-option" data-answer="nitrogen">
              Nitrogen (N₂)
            </button>
          </div>

          <p class="quiz-feedback">
            Choose your answer!
          </p>
        </div>
      `

      const quizOptions = gameCard.querySelectorAll('.quiz-option')
      const quizFeedback = gameCard.querySelector('.quiz-feedback')

      quizOptions.forEach(option => {
        option.addEventListener('click', () => {
          if (option.dataset.answer !== 'oxygen') {
            quizFeedback.textContent = 'Not quite! Try again!'
            return
          }

          quizFeedback.textContent =
            'Correct! MOXIE produces oxygen from CO₂ using electricity!'

          quizOptions.forEach(button => {
            button.disabled = true
          })

          const unlockButton = document.createElement('button')
          unlockButton.className = 'co2-close-button'
          unlockButton.textContent = 'Unlock MOXIE'

          quizFeedback.after(unlockButton)

          unlockButton.addEventListener('click', () => {
            oxygenProduced = true
            moxieUnlocked = true

            moxieLabel.textContent = '✓ Unlocked'
            moxieTitle.textContent = 'MOXIE (unlocked)'

            overlay.remove()
            challengeOpen = false

            dismissedStation = 'co2'
            currentNearbyStation = 'co2'

            updateInteractionPrompt()
          })
        })
      })

    } else {
      const feedback = overlay.querySelector('.co2-feedback')
      feedback.textContent = 'Time is up! Try again!'

      const retryButton = document.createElement('button')
      retryButton.className = 'co2-close-button'
      retryButton.textContent = 'Retry'

      feedback.after(retryButton)

      retryButton.addEventListener('click', () => {
        overlay.remove()
        challengeOpen = false
        startCo2Challenge()
      })
    }
  }

  // ===================================================
  // MOLECULE CLICK EVENTS
  // ===================================================

  targets.forEach(target => {
    target.addEventListener('click', () => {
      if (!challengeOpen || target.classList.contains('collected')) return

      target.classList.add('collected')
      target.disabled = true

      co2Collected++

      progress.textContent = `${co2Collected} / 5`

      if (co2Collected === 5) {
        finishChallenge(true)
      }
    })
  })

  // ===================================================
  // CHALLENGE TIMER
  // ===================================================

  challengeTimer = setInterval(() => {
    timeLeft--

    timer.textContent = `${timeLeft} seconds`

    if (timeLeft <= 0) {
      finishChallenge(false)
    }
  }, 1000)
}


// =====================================================
// AIR DISPLAY AND MOXIE ACTIVATION
// =====================================================

function updateAirDisplay() {
  document.querySelector('.air-fill').style.width = `${airLevel}%`

  document.querySelector('.air-percentage').textContent =
    `${airLevel}%`

  document.querySelectorAll('.status-chip')[1].innerHTML =
    `<span>▣</span> Power cells ${powerCells}`

  document.querySelector('.sol').textContent = `Sol ${currentSol}`

  const endSolButton = document.querySelector('#end-sol-button')
  const solStatus = document.querySelector('#sol-status')

  endSolButton.disabled = !moxieActivatedThisSol
  solStatus.textContent = moxieActivatedThisSol
    ? 'MOXIE run complete. You can now end this Sol.'
    : 'Complete one MOXIE run before ending this Sol.'
}

function activateMoxie() {
  if (!moxieUnlocked) {
    showMessagePopup(
      'MOXIE is locked',
      'Complete the CO₂ challenge and science quiz first.'
    )
    return
  }

  if (moxieActivatedThisSol) {
    showMessagePopup(
      'MOXIE already used!',
      'You have already completed your MOXIE run for this Sol. End the Sol to continue.'
    )
    return
  }

  if (!sharedLifeSupport && powerCells <= 0) {
    showMessagePopup(
      'Not enough power!',
      'You need at least one power cell to activate MOXIE.'
    )
    return
  }

  if (airLevel >= 100) {
    showMessagePopup(
      'Air supply is full!',
      'Your Air supply is already at 100%. Save your Power Cell for later.'
    )
    return
  }

  if (sharedLifeSupport) {
    const oxygen = sharedLifeSupport.runMoxie()
    if (oxygen === null) {
      showMessagePopup('Not enough power!', 'Check the battery in Command Center before running MOXIE.')
      return
    }
    airLevel = oxygen
  } else {
    powerCells--
    airLevel = Math.min(100, airLevel + 20)
  }
  moxieActivatedThisSol = true

  // Update Air bar and percentage
  updateAirDisplay()

  // Animate the Air bar
  const airFill = document.querySelector('.air-fill')

  airFill.classList.remove('air-increase')
  void airFill.offsetWidth
  airFill.classList.add('air-increase')

  // Show floating +20% message
  const airGain = document.createElement('div')
  airGain.className = 'air-gain-effect'
  airGain.textContent = '+20% AIR'

  room.appendChild(airGain)

  airGain.style.left = '50%'
  airGain.style.top = '15%'

  setTimeout(() => {
    airGain.remove()
  }, 1500)

  // Show success popup
  showMessagePopup(
    'Oxygen produced!',
    `Great job! MOXIE used ${sharedLifeSupport ? sharedLifeSupport.moxieCost + ' Power' : 'one power cell'}. Your Air level is now ${airLevel}%.`
  )
}

// =====================================================
// SOL PROGRESSION
// =====================================================

function endCurrentSol() {
  if (!moxieActivatedThisSol) {
    showMessagePopup(
      'Mission incomplete',
      'Complete one MOXIE run before ending this Sol.'
    )
    return
  }

  const airBeforeUsage = airLevel
  airLevel = Math.max(0, airLevel - AIR_DEMAND_PER_SOL)
  publishLifeResource('oxygen', airLevel)
  const airUsed = airBeforeUsage - airLevel
  const completedSol = currentSol

  currentSol++
  moxieActivatedThisSol = false
  updateAirDisplay()

  showMessagePopup(
    `Sol ${completedSol} Complete!`,
    `Daily report: Air before crew usage: ${airBeforeUsage}%. Air used: ${airUsed}%. Current Air: ${airLevel}%. Remaining Power Cells: ${powerCells}. You are now on Sol ${currentSol}.`
  )
}

document.querySelector('#end-sol-button').addEventListener('click', endCurrentSol)

// =====================================================
// AUTOMATIC POPUP WHEN PLAYER APPROACHES A MACHINE
// =====================================================

function updateInteractionPrompt() {
  if (challengeOpen) {
    closeMissionPopup()
    return
  }

  let nearbyStation = null

  if (isNearExit()) {
    nearbyStation = 'exit'
  } else if (isNearWater()) {
    nearbyStation = 'water'
  } else if (isNearCo2()) {
    nearbyStation = 'co2'
  } else if (isNearMoxie()) {
    nearbyStation = 'moxie'
  }

  // Player walks away from all stations
  if (!nearbyStation) {
    closeMissionPopup()
    dismissedStation = null
    currentNearbyStation = null
    return
  }

  // Player approaches a different station
  if (nearbyStation !== currentNearbyStation) {
    closeMissionPopup()
    dismissedStation = null
    currentNearbyStation = nearbyStation
  }

  // Do not reopen a dismissed popup
  if (dismissedStation === nearbyStation) {
    return
  }

  // Show the appropriate popup
  if (!missionPopup && !water.isOpen()) {
    if (nearbyStation === 'exit') {
      showExitPopup()
    } else if (nearbyStation === 'water') {
      Object.keys(keys).forEach(key => { keys[key] = false })
      player.setWalking(false)
      water.open()
    } else {
      showMissionPopup(nearbyStation)
    }
  }
}

// =====================================================
// PLAYER MOVEMENT
// =====================================================

function isOnPath(x, y) {
  return pathBounds.some(path => x >= path.left && x <= path.right && y >= path.top && y <= path.bottom)
}

function measurePaths() {
  pathBounds = paths.map(path => ({
    left: path.offsetLeft,
    right: path.offsetLeft + path.offsetWidth,
    top: path.offsetTop,
    bottom: path.offsetTop + path.offsetHeight
  }))
  if (!isOnPath(playerX, playerY)) {
    const entry = pathBounds[1]
    playerX = (entry.left + entry.right) / 2
    playerY = room.clientHeight * 0.85
    player.moveTo(playerX, playerY)
  }
}
measurePaths()
new ResizeObserver(measurePaths).observe(room)

const directions = {
  w: [0, -1], arrowup: [0, -1],
  s: [0, 1], arrowdown: [0, 1],
  a: [-1, 0], arrowleft: [-1, 0],
  d: [1, 0], arrowright: [1, 0]
}

window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase()
  if (!directions[key] || challengeOpen || missionPopup || water.isOpen()) return
  event.preventDefault()
  keys[key] = true
})
window.addEventListener('keyup', event => {
  keys[event.key.toLowerCase()] = false
})
window.addEventListener('blur', () => {
  for (const key of Object.keys(keys)) keys[key] = false
  player.setWalking(false)
})

let lastFrame = performance.now()
function walkFrame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.03)
  lastFrame = now
  requestAnimationFrame(walkFrame)
  if (challengeOpen || missionPopup || water.isOpen()) {
    player.setWalking(false)
    return
  }
  const dx = Number(!!(keys.d || keys.arrowright)) - Number(!!(keys.a || keys.arrowleft))
  const dy = Number(!!(keys.s || keys.arrowdown)) - Number(!!(keys.w || keys.arrowup))
  const distance = Math.hypot(dx, dy)
  if (!distance) {
    player.setWalking(false)
    return
  }
  const step = WALK_SPEED * dt / distance
  const oldX = playerX
  const oldY = playerY
  if (isOnPath(playerX + dx * step, playerY)) playerX += dx * step
  if (playerY + dy * step < room.clientHeight && isOnPath(playerX, playerY + dy * step)) playerY += dy * step
  const moved = playerX !== oldX || playerY !== oldY
  player.setWalking(moved)
  if (!moved) return
  player.faceToward(dx, dy)
  player.moveTo(playerX, playerY)
  updateInteractionPrompt()
}
requestAnimationFrame(walkFrame)

// Initial display and proximity check
updateAirDisplay()
updateInteractionPrompt()
