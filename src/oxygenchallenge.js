import './oxygenroom.css'
import { createAvatar } from './avatar.js'
import { initWaterRecycler } from './water-recycling.js'
import { icon } from './icons.js'

// =====================================================
// PAGE HTML
// =====================================================

document.querySelector('#app').innerHTML = `
  <main class="air-screen">
    <section class="content">
      <div class="room-column">
        <header class="room-header">
          <div class="room-name"><span class="blue-dot"></span> Life Support</div>
          <div class="status-chip science-chip">${icon('star', '', { fill: true })} Science 1/3</div>
          <div class="status-chip power-chip">${icon('battery-full')} Power cells 2</div>
        </header>

        <div class="room">
          <!-- roads: the same as the base map (tan, brown dots, dashed white edges) -->
          <div class="path horizontal"></div>
          <div class="path branch up co2-branch"></div>
          <div class="path branch up moxie-branch"></div>
          <div class="path branch down water-branch"></div>
          <div class="path branch down power-branch"></div>

          <!-- pipes with arrows: CO2 Intake -> MOXIE -> oxygen tanks -->
          <svg class="room-art" viewBox="0 0 764 628" preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id="ls-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2B2A3A"/></marker></defs>
            <rect x="210" y="86" width="98" height="30" fill="#AEB7C9" stroke="#2B2A3A" stroke-width="4"/>
            <path class="pipe-flow" d="M222 101 h56" stroke="#2B2A3A" stroke-width="4" stroke-dasharray="10 8" marker-end="url(#ls-arrow)"/>
            <rect x="494" y="86" width="92" height="30" fill="#AEB7C9" stroke="#2B2A3A" stroke-width="4"/>
            <path class="pipe-flow" d="M506 101 h50" stroke="#2B2A3A" stroke-width="4" stroke-dasharray="10 8" marker-end="url(#ls-arrow)"/>
          </svg>

          <div class="station co2" data-tip="co2">
            <svg class="machine co2-machine" viewBox="0 0 170 110" aria-hidden="true">
              <rect x="2.5" y="2.5" width="165" height="105" rx="16" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="5"/>
              <path d="M24 28h122M24 46h122M24 64h122" stroke="#9AA0AD" stroke-width="5" stroke-linecap="round"/>
              <g fill="#E0605A" stroke="#2B2A3A" stroke-width="3"><circle cx="58" cy="88" r="8"/><circle cx="85" cy="88" r="8"/><circle cx="112" cy="88" r="8"/></g>
            </svg>
            <div class="station-title"><span class="number">1</span> CO₂ Intake</div>
            <div class="tip"><strong>CO₂ Intake</strong>Sucks in Mars air. Mars air is about 95% carbon dioxide (CO₂), the gas MOXIE needs.</div>
          </div>

          <div class="station moxie" data-tip="moxie">
            <svg class="machine moxie-machine" viewBox="0 0 190 168" aria-hidden="true">
              <rect x="34" y="2" width="90" height="18" rx="6" fill="#B8BFCB" stroke="#2B2A3A" stroke-width="4"/>
              <rect class="mx-body" x="2.5" y="16" width="185" height="149" rx="20" fill="#737D91" stroke="#2B2A3A" stroke-width="5"/>
              <rect x="20" y="34" width="108" height="64" rx="8" fill="#30384A" stroke="#2B2A3A" stroke-width="3"/>
              <text x="36" y="62" font-size="15" font-weight="900" fill="#EEF0F5" font-family="Nunito, sans-serif">MOXIE</text>
              <rect x="98" y="46" width="20" height="20" rx="3" fill="#FFD23F" stroke="#2B2A3A" stroke-width="2"/>
              <rect x="142" y="34" width="34" height="76" rx="10" fill="#9AA3B5" stroke="#2B2A3A" stroke-width="3"/>
              <g fill="#5B6577" stroke="#2B2A3A" stroke-width="3"><circle cx="36" cy="132" r="9"/><circle cx="62" cy="132" r="9"/><circle cx="88" cy="132" r="9"/></g>
              <g class="moxie-lock"><circle cx="164" cy="138" r="22" fill="#2B2A3A" stroke="#FFD23F" stroke-width="4"/><rect x="155" y="136" width="18" height="13" rx="3" fill="#FFD23F"/><path d="M158 136 v-5 a6 6 0 0 1 12 0 v5" fill="none" stroke="#FFD23F" stroke-width="3"/></g>
            </svg>
            <span class="locked-label"></span>
            <div class="station-title"><span class="number">2</span> MOXIE</div>
            <div class="tip"><strong>MOXIE</strong>A real NASA machine that flew to Mars on the Perseverance rover. It splits CO₂ to make oxygen, using electricity.</div>
          </div>

          <div class="station tanks" data-tip="tanks">
            <svg class="machine tank-row" viewBox="0 0 176 162" aria-hidden="true">
              <g fill="#2B2A3A"><rect x="16" y="0" width="20" height="12" rx="3"/><rect x="78" y="0" width="20" height="12" rx="3"/><rect x="140" y="0" width="20" height="12" rx="3"/></g>
              <g fill="#FFFFFF" stroke="#2B2A3A" stroke-width="5"><rect x="2.5" y="10" width="47" height="149" rx="23"/><rect x="64.5" y="10" width="47" height="149" rx="23"/><rect x="126.5" y="10" width="47" height="149" rx="23"/></g>
              <g class="o2-fill" fill="#3EC6F0"><rect x="8" y="40" width="36" height="112" rx="16"/><rect x="70" y="40" width="36" height="112" rx="16"/><rect x="132" y="40" width="36" height="112" rx="16"/></g>
              <g font-size="17" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="Nunito, sans-serif"><text x="26" y="118">O₂</text><text x="88" y="118">O₂</text><text x="150" y="118">O₂</text></g>
            </svg>
            <div class="station-title"><span class="number">3</span> Oxygen tanks</div>
            <div class="air-chip">Mars air ${icon('arrow-right', '', { stroke: 3 })} Oxygen</div>
            <div class="tip"><strong>Oxygen tanks</strong>Store the oxygen MOXIE makes, so the crew can breathe. They fill up when MOXIE runs.</div>
          </div>

          <div class="station power" data-tip="power">
            <svg class="machine power-cell" viewBox="0 0 124 88" aria-hidden="true">
              <rect x="40" y="2" width="44" height="14" rx="4" fill="#B8BFCB" stroke="#2B2A3A" stroke-width="3"/>
              <rect x="2.5" y="12" width="119" height="73" rx="12" fill="#F4F2EE" stroke="#2B2A3A" stroke-width="5"/>
              <g fill="#FFD23F" stroke="#2B2A3A" stroke-width="3"><rect x="18" y="26" width="24" height="46" rx="5"/><rect x="50" y="26" width="24" height="46" rx="5"/><rect x="82" y="26" width="24" height="46" rx="5"/></g>
            </svg>
            <div class="station-title">Power cell</div>
            <div class="tip"><strong>Power cell</strong>Spare power for the base. Machines like MOXIE need electricity to run.</div>
          </div>

          <!-- the door back to the base (the Life Support road leaves to the left) -->
          <button class="exit-button" aria-label="Exit to base"></button>
        </div>
      </div>

      <aside class="instructions">
        <h2>Tasks in this room</h2>
        <div class="instruction"><span class="number">1</span><div><strong>CO₂ Intake</strong>
          <p>Catch 5 CO₂ molecules and answer the quiz.</p></div></div>
        <div class="instruction"><span class="number">2</span><div><strong>MOXIE</strong>
          <p>Turns Mars air into oxygen. Uses power.</p></div></div>
        <div class="instruction"><span class="number">3</span><div><strong>Oxygen tanks</strong>
          <p>Store the crew's air.</p></div></div>
        <div class="instruction"><span class="number">4</span><div><strong>Water recycler</strong>
          <p>Fix it so it cleans water.</p></div></div>
        <div class="today-goal"><span class="goal-star">${icon('star', '', { fill: true })}</span><div><small>TODAY'S GOAL</small><strong id="goal-text">Unlock MOXIE</strong></div></div>
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

// Size everything like the Command Center: it fits a 1512 x 1032 design to the screen,
// so --s is the same scale here (the room sits in the same space next to the cards).
function setScale() {
  const s = Math.min(window.innerWidth / 1512, window.innerHeight / 1032)
  document.documentElement.style.setProperty('--s', s)
}
setScale()
window.addEventListener('resize', setScale)

const room = document.querySelector('.room')
const roomUnit = () => room.clientHeight / 628    // the room is drawn on a 764 x 628 plan (sized by its height)
const player = createAvatar(room)
const water = initWaterRecycler(room, {          // Add Water Recycling to this same room
  onFull: () => { publishLifeResource('water', 100); updateAirDisplay() },
  onClose: () => { dismissedStation = 'water'; currentNearbyStation = 'water' }   // don't reopen until you walk away
})
const waterStation = water.station
waterStation.insertAdjacentHTML('beforeend',
  '<div class="tip"><strong>Water recycler</strong>Cleans used water so the crew can drink it again. On the space station, about 98% of the water is recycled.</div>')

const co2Machine = room.querySelector('.co2-machine')
const moxieStation = room.querySelector('.moxie')
const exitDoor = room.querySelector('.exit-button')
const moxieLabel = moxieStation.querySelector('.locked-label')
const moxieTitle = moxieStation.querySelector('.station-title')

// Player position
let playerX = 100                        // just inside the door on the left wall (not so close that the exit pop-up opens)
let playerY = room.clientHeight * 0.55

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
let co2Caught = false        // the 5 CO2 molecules were caught (step 1 of unlocking MOXIE)
let moxieUnlocked = false
let oxygenProduced = false
const sharedLifeSupport = window.parent !== window ? window.parent.MarsLifeSupport : undefined
let powerCells = 2
let airLevel = 60
window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'mars-life:sync') return
  currentSol = event.data.sol
  scienceStars = event.data.scienceStars
  moxieActivatedThisSol = event.data.moxieRan
  airLevel = event.data.oxygen
  water.syncLevel(event.data.water)
  updateAirDisplay()
})
let currentSol = 3
let scienceStars = 0
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

// near = at the end of the short road that leads up (or down) to the machine
function isNearCo2() {
  const target = getMachinePosition(co2Machine)
  return Math.hypot(playerX - target.x, playerY - target.y) < 130 * roomUnit()
}

function isNearMoxie() {
  const target = getMachinePosition(moxieStation.querySelector('.moxie-machine'))
  return Math.hypot(playerX - target.x, playerY - target.y) < 140 * roomUnit()
}

function isNearWater() {
  const target = getMachinePosition(waterStation.querySelector('.ls-mini-rack') || waterStation)
  return Math.hypot(playerX - target.x, playerY - target.y) < 120 * roomUnit()
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

const MOXIE_ICON = (locked) => `<span class="pop-moxie${locked ? ' locked' : ''}"><i></i>${locked ? `<b>${icon('lock')}</b>` : ''}</span>`
const CO2_ICON = '<span class="pop-co2"><i></i><i></i><i></i></span>'

function showMissionPopup(station) {
  if (sharedLifeSupport && scienceStars < 1) {
    showMessagePopup('MOXIE needs one Science Star', 'Finish Rover Rescue in the Science Lab to unlock the oxygen challenge.')
    return
  }
  closeMissionPopup()

  const popup = document.createElement('div')
  popup.className = 'mission-overlay'
  const isCo2 = station === 'co2'
  const cost = sharedLifeSupport ? `${icon('zap', '', { fill: true })} −${sharedLifeSupport.moxieCost} power` : `${icon('battery-full')} −1 power cell`
  const ranToday = !isCo2 && moxieUnlocked && moxieActivatedThisSol

  let picture, title, body, main, later = true
  if (isCo2) {
    picture = CO2_ICON
    title = moxieUnlocked ? 'CO₂ Intake' : 'Catch the CO₂!'
    body = moxieUnlocked
      ? '<p class="pop-text">MOXIE is already unlocked. Go to MOXIE to make oxygen.</p>'
      : `<p class="pop-text">Mars air is about 95% carbon dioxide (CO₂). Catch 5 CO₂ molecules in 20 seconds, then answer one science question to unlock MOXIE.</p>`
    main = moxieUnlocked ? 'OK' : 'Start'
    later = !moxieUnlocked
  } else if (!moxieUnlocked) {
    picture = MOXIE_ICON(true)
    title = 'MOXIE is locked'
    body = `<p class="pop-text">MOXIE turns Mars air into oxygen. Unlock it first:</p>
      <div class="pop-steps">
        <div class="pop-step${co2Caught ? ' done' : ''}"><span class="pop-dot">${co2Caught ? icon('check', '', { stroke: 3.5 }) : ''}</span>Catch 5 CO₂ molecules at the CO₂ Intake</div>
        <div class="pop-step"><span class="pop-dot"></span>Answer the science quiz</div>
      </div>`
    main = 'Go to the CO₂ Intake'
  } else if (ranToday) {
    picture = MOXIE_ICON(false)
    title = 'MOXIE already ran today'
    body = '<p class="pop-text">The oxygen tanks are filling. MOXIE can run again tomorrow, after you sleep in the Command Center.</p>'
    main = 'OK'
    later = false
  } else {
    picture = MOXIE_ICON(false)
    title = 'Activate MOXIE'
    body = `<p class="pop-text">MOXIE uses electricity to turn carbon dioxide into oxygen for the crew.</p>
      <div class="pop-chips"><div class="pop-chip uses"><small>uses</small>${cost}</div><div class="pop-chip makes"><small>makes</small>+20 oxygen</div></div>`
    main = 'Activate MOXIE'
  }

  popup.innerHTML = `
    <div class="mission-card">
      <div class="pop-head">${picture}<h2>${title}</h2><button class="pop-x mission-close" aria-label="Close">${icon('x', '', { stroke: 3 })}</button></div>
      ${body}
      <button class="mission-start">${main}</button>
      ${later ? '<button class="mission-later mission-close">Not now</button>' : ''}
    </div>
  `

  room.appendChild(popup)
  missionPopup = popup

  popup.querySelector('.mission-start').addEventListener('click', () => {
    closeMissionPopup()
    if (isCo2 && !moxieUnlocked) startCo2Challenge()
    else if (!isCo2 && moxieUnlocked && !ranToday) activateMoxie()
    else dismissedStation = station
  })

  popup.querySelectorAll('.mission-close').forEach(button => button.addEventListener('click', () => {
    dismissedStation = station
    closeMissionPopup()
  }))
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

function walkOut() {
  Object.keys(keys).forEach(key => { keys[key] = false })
  player.setWalking(false)
  // next time you come in, you start just inside the door again
  playerX = 100
  const corridor = room.querySelector('.path.horizontal')
  playerY = corridor.offsetTop + corridor.offsetHeight / 2
  player.moveTo(playerX, playerY)
  player.faceToward(1, 0)
  if (window.parent !== window) window.parent.postMessage({ type: 'mars-life:leave' }, location.origin)
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
      co2Caught = true
      const gameCard = overlay.querySelector('.co2-game-card')

      gameCard.innerHTML = `
        <h2>${icon('lightbulb')} Did You Know?</h2>

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

            moxieLabel.textContent = ''
            moxieStation.classList.add('unlocked')
            updateAirDisplay()

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

// The left column of cards (outside this room) shows the sol, power and oxygen.
// Here we only update the oxygen tanks and "Today's goal".
function updateAirDisplay() {
  room.style.setProperty('--o2n', Math.max(0.05, Math.min(1, airLevel / 100)))   // tank fill (0 to 1)
  const goal = document.querySelector('#goal-text')
  if (goal) {
    goal.textContent = !moxieUnlocked ? 'Unlock MOXIE'
      : !moxieActivatedThisSol ? 'Run MOXIE'
      : !water.isFixed() ? 'Fix the water recycler'
      : 'All done here!'
  }
  moxieStation.classList.toggle('unlocked', moxieUnlocked)
  const cells = document.querySelector('.power-chip')
  if (cells) cells.innerHTML = `${icon('battery-full')} Power cells ${powerCells}`
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

  // the oxygen tanks glow as they fill
  const tankRow = room.querySelector('.tank-row')
  tankRow.classList.remove('air-increase')
  void tankRow.offsetWidth
  tankRow.classList.add('air-increase')

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

// (no End Sol button here: sleeping in the Command Center ends the sol)

// =====================================================
// AUTOMATIC POPUP WHEN PLAYER APPROACHES A MACHINE
// =====================================================

function updateInteractionPrompt() {
  if (challengeOpen) {
    closeMissionPopup()
    return
  }

  let nearbyStation = null

  // walking onto the door on the left wall: straight back out to the base map (no pop-up)
  if (isNearExit()) {
    walkOut()
    return
  }
  if (isNearWater()) {
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
    const entry = pathBounds[0]                // the corridor, next to the door
    playerX = entry.left + 100
    playerY = (entry.top + entry.bottom) / 2
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