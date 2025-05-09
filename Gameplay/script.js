// ============================================
// Global Variable Declarations & Setup
// ============================================
window.onload = function() {
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) {
        console.error("Game canvas not found! Check your HTML.");
        return;
    }
    const ctx = canvas.getContext("2d");
};

// Define safe zone and chat elements.
const safeZone = { x: 0, y: 0, width: 800, height: 600 };
const chatInput = document.getElementById("chatInput");
const chatbox = document.getElementById("chatbox");
const chatlog = document.getElementById("chatlog");

const npcDialogue = {
  pillager: {
    taunts: [
      "Pathetic",
      "Come 'ere",
      "If you want a fight, come and get it",
      "If you want some, I'll give it yer",
      "Right, I'm taking your weapon",
      "I'm wounded!",
      "Try that again!",
      "Pay your toll",
      "Come on then",
      "AHHHHHHH",
      "Stop right there",
      "Give me your belongings!",
      "You shouldn't be here",
      "You'll die for this",
      "Oi, fight me",
      "My arm!",
      "Die!",
      "You ain't from here!",
      "ARGRRRRRRRRR"
    ]
  }
  // Additional NPC types can be added here
};

function getRandomTaunt(npcType) {
  const taunts = npcDialogue[npcType]?.taunts || npcDialogue.pillager.taunts;
  return taunts[Math.floor(Math.random() * taunts.length)];
}

// ------ Valor Rank System ------
let valor = 0;
const ranks = [
  { name: "Peasant",  valor: 0 },
  { name: "Villein",  valor: 60 },
  { name: "Cotter",   valor: 130 },
  { name: "Guard",    valor: 300 },
  { name: "Militia",  valor: 720 },
  { name: "Herald",   valor: 1400 },
  { name: "Marshall", valor: 2500 },
  { name: "Warden",   valor: 4500 },
  { name: "Sentinel", valor: 6800 },
  { name: "Banneret", valor: 10000 },
  { name: "Overseer", valor: 15000 },
  { name: "Knight",   valor: 21500 },
  { name: "Jarl",     valor: 32000 },
  { name: "Theyn",    valor: 44500 },
  { name: "Baron",    valor: 56500 },
  { name: "Lord",     valor: 73000 },
  { name: "King",     valor: 93500 }
];
let currentRank = ranks[0];
function updateRank() {
  // Loop from highest to lowest so that the highest qualifying rank is assigned.
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (valor >= ranks[i].valor) {
      currentRank = ranks[i];
      break;
    }
  }
}
function increaseValor(amount) {
  valor += amount;
  updateRank();
}

// ------------------------------------
// Chat and Misc. globals
let chatOpen = false;
let messageHistory = []; // Stores up to 20 messages
let floatingMessages = [];

// Player, NPC, bullet and movement properties.
let circle = { x: canvas.width / 2, y: canvas.height / 2, radius: 15, speed: 5, alive: true };
let npcs = []; // Start empty; NPCs will spawn naturally.
let bullets = [];
let lastDirection = { x: 0, y: -1 };
let keysPressed = {};
let woodCount = 0;
let gold = 10000;
let playerMaxHealth = 80;
let playerHealth = 80;

// ------------------------------------
// Mouse tracking
let mouseScreenX = canvas.width / 2;
let mouseScreenY = canvas.height / 2;
canvas.addEventListener("mousemove", (event) => {
  let rect = canvas.getBoundingClientRect();
  mouseScreenX = event.clientX - rect.left;
  mouseScreenY = event.clientY - rect.top;
});

// ============================================
// World Objects: Trees and Wood Blocks
// ============================================
const trees = [
  { x: 200, y: 200, width: 40, height: 40 },
  { x: 500, y: 350, width: 50, height: 50 },
  { x: 600, y: 150, width: 40, height: 40 }
];

let wood = [
  { x: 300, y: 250, width: 40, height: 40, hp: 50 },
  { x: 550, y: 400, width: 50, height: 50, hp: 50 }
];

// ============================================
// Helper Functions
// ============================================
function isColliding(x, y, radius, objects) {
  return objects.some(obj =>
    x + radius > obj.x &&
    x - radius < obj.x + obj.width &&
    y + radius > obj.y &&
    y - radius < obj.y + obj.height
  );
}

// ============================================
// Key Event Listeners (Global)
// ============================================
document.addEventListener("keydown", function (event) {
  // Toggle chat on Enter if not typing.
  if (event.key === "Enter" && event.target !== chatInput) {
    event.preventDefault();
    chatOpen = !chatOpen;
    chatbox.style.display = chatOpen ? "block" : "none";
    if (chatOpen) {
      chatInput.focus();
    } else {
      chatInput.blur();
    }
    return;
  }
  if (!chatOpen) {
    keysPressed[event.key.toLowerCase()] = true;
    if (event.key.toLowerCase() === "q") {
      bullets.push({
        x: circle.x,
        y: circle.y,
        speed: 8,
        direction: { ...lastDirection },
        damage: 10
      });
    }
  }
});
document.addEventListener("keyup", function (event) {
  if (!chatOpen) {
    keysPressed[event.key.toLowerCase()] = false;
  }
});
chatInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    if (chatInput.value.trim() === "") {
      chatbox.style.display = "none";
      chatOpen = false;
      chatInput.blur();
    } else {
      sendMessage();
    }
  }
});

// ============================================
// Movement & Update Functions
// ============================================
function movePlayer() {
  if (!circle.alive) return;
  let moveX = 0, moveY = 0;
  if (keysPressed["w"] || keysPressed["arrowup"]) moveY -= 1;
  if (keysPressed["s"] || keysPressed["arrowdown"]) moveY += 1;
  if (keysPressed["a"] || keysPressed["arrowleft"]) moveX -= 1;
  if (keysPressed["d"] || keysPressed["arrowright"]) moveX += 1;
  if (moveX !== 0 || moveY !== 0) {
    let length = Math.sqrt(moveX ** 2 + moveY ** 2);
    moveX = (moveX / length) * circle.speed;
    moveY = (moveY / length) * circle.speed;
    let newX = circle.x + moveX;
    let newY = circle.y + moveY;
    let xBlocked = isColliding(newX, circle.y, circle.radius, trees);
    let yBlocked = isColliding(circle.x, newY, circle.radius, trees);
    if (!xBlocked && newX - circle.radius >= 0 && newX + circle.radius <= canvas.width) {
      circle.x = newX;
    }
    if (!yBlocked && newY - circle.radius >= 0 && newY + circle.radius <= canvas.height) {
      circle.y = newY;
    }
  }
  // Update facing direction based on mouse position.
  let targetWorldX = mouseScreenX + circle.x - canvas.width / 2;
  let targetWorldY = mouseScreenY + circle.y - canvas.height / 2;
  let dx = targetWorldX - circle.x;
  let dy = targetWorldY - circle.y;
  let distance = Math.sqrt(dx * dx + dy * dy);
  if (distance !== 0) {
    lastDirection.x = dx / distance;
    lastDirection.y = dy / distance;
  }
}

// Common NPC movement behavior for all NPC types
function moveNPCs() {
  npcs.forEach(npc => {
    // Common behavior for all NPCs
    const npcSightRange = 320;
    let dx = circle.x - npc.x;
    let dy = circle.y - npc.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    // Type-specific behavior handling
    switch(npc.type) {
      case 'pillager':
        // Pillager-specific movement
        if (distance <= npcSightRange) {
          // Move toward player
          let targetDistance = circle.radius;
          if (distance > targetDistance) {
            let intendedDx = (dx / distance) * npc.speed;
            let intendedDy = (dy / distance) * npc.speed;
            let newX = npc.x + intendedDx;
            let newY = npc.y + intendedDy;
            let xBlocked = isColliding(newX, npc.y, npc.radius, trees);
            let yBlocked = isColliding(npc.x, newY, npc.radius, trees);
            if (newX - npc.radius < safeZone.x || newX + npc.radius > safeZone.x + safeZone.width) {
              xBlocked = true;
            }
            if (newY - npc.radius < safeZone.y || newY + npc.radius > safeZone.y + safeZone.height) {
              yBlocked = true;
            }
            if (!xBlocked) npc.x = newX;
            if (!yBlocked) npc.y = newY;
          }
          
          // Handle taunting behavior for pillagers
          if (!npc.taunting) {
            npc.taunting = true;
            npc.tauntInterval = setInterval(() => {
              let tauntText = getRandomTaunt(npc.type);
              let npcFloatingMsg = {
                text: tauntText,
                x: npc.x,
                y: npc.y - 30,
                opacity: 1,
                isNPC: true,
                fading: false
              };
              floatingMessages.push(npcFloatingMsg);
              setTimeout(() => {
                npcFloatingMsg.fading = true;
              }, 3000);
              let chatText = `<span style="color:gray;">NPC (${npc.typeName}): ${tauntText}</span>`;
              messageHistory.push(chatText);
              if (messageHistory.length > 20) {
                messageHistory.shift();
              }
              renderChatLog();
            }, 4000);
          }
        } else {
          // Out of range - clear taunting
          if (npc.taunting) {
            clearInterval(npc.tauntInterval);
            npc.taunting = false;
          }
        }
        break;
        
      // Add more NPC types here with their specific behaviors
      default:
        // Default behavior for unknown NPC types
        console.warn("Unknown NPC type:", npc.type);
    }
  });
}

// ============================================
// NPC Spawning Functions
// ============================================
// NPC factory function to create different types of NPCs
function createNPC(type, x, y) {
  // Base NPC properties all types share
  const baseNPC = {
    x: x,
    y: y,
    radius: 15,
    hp: 80,
    maxHp: 80,
    type: type,
    typeName: type.charAt(0).toUpperCase() + type.slice(1) // Capitalized type name
  };
  
  // Add type-specific properties
  switch(type) {
    case 'pillager':
      return {
        ...baseNPC,
        speed: 2,
        taunting: false
      };
    // Add more NPC types here with their specific properties
    default:
      console.warn("Unknown NPC type:", type);
      return baseNPC;
  }
}

// Spawn a single NPC randomly within the top 400 x 300 pixel area.
function spawnNPC() {
  const spawnX = Math.random() * 400;
  const spawnY = Math.random() * 300;
  
  // Currently only spawning pillagers, but can easily add more types
  const npc = createNPC('pillager', spawnX, spawnY);
  npcs.push(npc);
  console.log(`New ${npc.typeName} spawned at ${spawnX}, ${spawnY}`);
}

// Recursively schedule a spawn at a random interval between 9 and 11 seconds.
function scheduleNPCSpawn() {
  let randomDelay = (9 + Math.random() * 2) * 1000; // delay between 9000 and 11000 ms.
  setTimeout(() => {
    if (npcs.length < 10) {
      spawnNPC();
    }
    scheduleNPCSpawn();
  }, randomDelay);
}
scheduleNPCSpawn();

// ============================================
// Bullet Update Function
// ============================================
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.x += bullet.direction.x * bullet.speed;
    bullet.y += bullet.direction.y * bullet.speed;
    // Remove bullet if off-canvas.
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }
    let bulletRemoved = false;
    // Check collision with all NPCs.
    for (let k = npcs.length - 1; k >= 0; k--) {
      let npc = npcs[k];
      let dx = bullet.x - npc.x;
      let dy = bullet.y - npc.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (!isNaN(npc.hp) && distance < npc.radius) {
        npc.hp -= bullet.damage;
        bullets.splice(i, 1);
        bulletRemoved = true;
        npc.hp = Math.max(npc.hp, 0);
        if (npc.hp === 0) {
          increaseValor(10); // Award 10 valor points when an NPC is killed.
          npcs.splice(k, 1);
        }
        break;
      }
    }
    if (bulletRemoved) continue;
    // Check collision with wood blocks.
    for (let j = wood.length - 1; j >= 0; j--) {
      let block = wood[j];
      if (
        bullet.x > block.x &&
        bullet.x < block.x + block.width &&
        bullet.y > block.y &&
        bullet.y < block.y + block.height
      ) {
        block.hp -= bullet.damage;
        bullets.splice(i, 1);
        if (block.hp <= 0) {
          wood.splice(j, 1);
          woodCount += Math.floor(Math.random() * 3) + 3;
          increaseValor(5); // Award 5 valor points for destroying a wood block.
        }
        break;
      }
    }
  }
}

// ============================================
// Valor Functions
// ============================================
function checkDestroyedEntities() {
  // Get current rank index
  let rankIndex = ranks.indexOf(currentRank);

  // Define valor ranges for each rank
  const valorRanges = [
    [6, 9],    // Peasant
    [10, 20],  // Villein
    [20, 40],  // Cotter
    [40, 75],  // Guard
    [75, 100], // Militia
    [100, 125],// Herald
    [125, 150],// Marshall
    [150, 175],// Warden
    [175, 200],// Sentinel
    [200, 250],// Banneret
    [300, 350],// Overseer
    [250, 300],// Knight
    [350, 450],// Jarl
    [450, 550],// Theyn
    [550, 650],// Baron
    [650, 900],// Lord
    [900, 1000]// King
  ];

  // Get the valor range for the player's rank
  let [minValor, maxValor] = valorRanges[rankIndex];

  // Generate a random valor amount within the range
  let valorGain = Math.floor(Math.random() * (maxValor - minValor + 1)) + minValor;

  // Award valor when NPCs or wood are destroyed
  for (let i = npcs.length - 1; i >= 0; i--) {
    if (npcs[i].hp <= 0) {
      increaseValor(valorGain);
      npcs.splice(i, 1);
    }
  }

  for (let i = wood.length - 1; i >= 0; i--) {
    if (wood[i].hp <= 0) {
      increaseValor(valorGain);
      wood.splice(i, 1);
      woodCount += Math.floor(Math.random() * 3) + 3; // Optional: Increase wood count.
    }
  }
}

// ============================================
// HUD Helper Functions
// ============================================
function drawHealthBar() {
  const barCount = 8;
  const barWidth = 40;
  const barHeight = 13;
  const spacing = 1;
  const totalWidth = barCount * (barWidth + spacing) - spacing;
  const startX = (canvas.width - totalWidth) / 2;
  const startY = 50;
  let healthRemaining = playerHealth;
  for (let i = 0; i < barCount; i++) {
    ctx.fillStyle = healthRemaining >= 10 ? "green" : "red";
    ctx.fillRect(startX + i * (barWidth + spacing), startY, barWidth, barHeight);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(startX + i * (barWidth + spacing), startY, barWidth, barHeight);
    healthRemaining -= 10;
    if (healthRemaining < 0) healthRemaining = 0;
  }
}

function drawPlayerMiniHealthBar() {
  if (playerHealth > 0) {
    const barWidth = 40;
    const segmentWidth = barWidth / 8;
    const barHeight = 5;
    const barX = canvas.width / 2 - barWidth / 2;
    const barY = canvas.height / 2 + circle.radius + 10;
    ctx.fillStyle = "black";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    for (let i = 0; i < 8; i++) {
      if (i < Math.ceil((playerHealth / playerMaxHealth) * 8)) {
        ctx.fillStyle = "green";
      } else {
        ctx.fillStyle = "red";
      }
      ctx.fillRect(barX + i * segmentWidth, barY, segmentWidth - 2, barHeight);
    }
  }
}

function drawNPCHealthBars(npc) {
  if (npc.hp > 0) {
    const barWidth = 40;
    const segmentWidth = barWidth / 8;
    const barHeight = 5;
    const barX = npc.x - barWidth / 2;
    const barY = npc.y + npc.radius + 5;
    ctx.fillStyle = "black";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    for (let i = 0; i < 8; i++) {
      if (i < Math.ceil((npc.hp / npc.maxHp) * 8)) {
        ctx.fillStyle = "green";
      } else {
        ctx.fillStyle = "red";
      }
      ctx.fillRect(barX + i * segmentWidth, barY, segmentWidth - 2, barHeight);
    }
  }
}

// ============================================
// Main Draw Loop (Game Loop)
// ============================================
function draw() {
  // Update game state.
  movePlayer();
  moveNPCs();
  updateBullets();
  
  // This check will catch any NPC or wood that has been destroyed
  // but not yet processed for valor awarding.
  checkDestroyedEntities();
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Camera: center on the player.
  ctx.save();
  const offsetX = canvas.width / 2 - circle.x;
  const offsetY = canvas.height / 2 - circle.y;
  ctx.translate(offsetX, offsetY);
  
  // Draw safe zone.
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.strokeRect(safeZone.x, safeZone.y, safeZone.width, safeZone.height);
  
  // Draw trees.
  trees.forEach(tree => {
    ctx.fillStyle = "green";
    ctx.fillRect(tree.x, tree.y, tree.width, tree.height);
  });
  
  // Draw wood blocks.
  wood.forEach(block => {
    ctx.fillStyle = "saddlebrown";
    ctx.fillRect(block.x, block.y, block.width, block.height);
  });
  
  // Draw bullets.
  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
  });
  
  // Draw the player.
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
  ctx.fillStyle = circle.alive ? "blue" : "gray";
  ctx.fill();
  ctx.closePath();
  
  // Draw facing direction.
  ctx.beginPath();
  ctx.moveTo(circle.x, circle.y);
  ctx.lineTo(circle.x + lastDirection.x * 30, circle.y + lastDirection.y * 30);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
  
  // Draw all NPCs.
  npcs.forEach(npc => {
    if (npc.hp > 0) {
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.radius, 0, Math.PI * 2);
      
      // Different colors based on NPC type
      switch(npc.type) {
        case 'pillager':
          ctx.fillStyle = "orange";
          break;
        default:
          ctx.fillStyle = "purple"; // Default color for unknown types
      }
      
      ctx.fill();
      ctx.closePath();
      drawNPCHealthBars(npc);
    }
  });
  ctx.restore();
  
  // Draw floating messages.
  let screenX = canvas.width / 2;
  let screenY = canvas.height / 2 - circle.radius - 20;
  floatingMessages.forEach((msg, index) => {
    if (msg.fading) {
      msg.opacity -= 0.01;
    }
    ctx.globalAlpha = Math.max(0, msg.opacity);
    ctx.fillStyle = msg.isNPC ? "rgb(211, 211, 211)" : "white";
    ctx.font = "16px Arial";
    let textX, textY;
    if (msg.isNPC) {
      let npc = npcs.find(n => Math.abs(n.x - msg.x) < 50 && Math.abs(n.y - msg.y) < 50);
      if (npc) {
        textX = npc.x + (canvas.width / 2 - circle.x);
        textY = npc.y - 30 + (canvas.height / 2 - circle.y);
      }
    } else {
      textX = canvas.width / 2;
      textY = canvas.height / 2 - circle.radius - 20;
    }
    const textWidth = ctx.measureText(msg.text).width;
    ctx.fillText(msg.text, textX - textWidth / 2, textY);
    if (msg.opacity < 0.05) {
      floatingMessages.splice(index, 1);
    }
  });
  ctx.globalAlpha = 1;
  
  // HUD: Draw fixed UI elements.
  ctx.fillStyle = "maroon";
  ctx.fillRect(0, 0, canvas.width, 45);
  ctx.font = "28px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(`Valor: ${valor}`, 10, 80);
  ctx.font = "14px Arial";
  ctx.fillText(`🪵 ${woodCount}`, 10, 100);
  ctx.fillText(`🪙 ${gold}`, 10, 120);
  drawHealthBar();
  drawPlayerMiniHealthBar(); // Draw player's mini HP bar.
  
  if (!circle.alive) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("You have been mortally wounded!", canvas.width / 2 - 100, canvas.height / 2);
  }
  
  // Determine the rank index from the ranks array.
  let rankIndex = ranks.indexOf(currentRank);
  // Calculate font size: starting at 14px + one pixel per index.
  let fontSize = 14 + rankIndex;
  let rankText = `${currentRank.name}`;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = "white";
  let rankTextWidth = ctx.measureText(rankText).width;
  let rankTextX = canvas.width / 2 - rankTextWidth / 2;
  let rankTextY = canvas.height / 2 - circle.radius - 30;
  ctx.fillText(rankText, rankTextX, rankTextY);
  
  requestAnimationFrame(draw);
}

// ============================================
// Chat Functions
// ============================================
function sendMessage() {
  const message = chatInput.value.trim();
  if (message === "") return;
  let isNPC = false; // Assume player message.
  let floatingMsg = {
    text: message,
    x: circle.x,
    y: circle.y - 30,
    opacity: 1,
    isNPC: isNPC,
    fading: false
  };
  floatingMessages.push(floatingMsg);
  setTimeout(() => {
    floatingMsg.fading = true;
  }, 3000);
  let chatText = isNPC 
    ? `<span style="color:gray;">NPC: ${message}</span>` 
    : `Player: ${message}`;
  messageHistory.push(chatText);
  if (messageHistory.length > 20) {
    messageHistory.shift();
  }
  renderChatLog();
  chatInput.value = "";
  chatlog.scrollTop = chatlog.scrollHeight;
  chatbox.style.display = "none";
  chatOpen = false;
  chatInput.blur();
}
chatInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    if (chatInput.value.trim() !== "") {
      sendMessage();
    }
    chatbox.style.display = "none";
    chatOpen = false;
    chatInput.blur();
  }
});
function renderChatLog() {
  chatlog.innerHTML = "";
  let visibleMessages = messageHistory.slice(-5).reverse();
  visibleMessages.forEach(msg => {
    const newMessage = document.createElement("div");
    newMessage.innerHTML = msg;
    chatlog.appendChild(newMessage);
  });
}

// ============================================
// Start the Game
// ============================================
draw();
