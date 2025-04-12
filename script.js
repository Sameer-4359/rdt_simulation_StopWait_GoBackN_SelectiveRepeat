let currentPacket = 0;
let expectingAck = false;
let timeoutID = null;
let maxPackets = 10;
let transferredPackets = 0;
let simulationRunning = false;

function log(msg) {
  const logDiv = document.getElementById("log");
  const p = document.createElement("p");
  p.textContent = msg;
  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

function createPacket(seqNum) {
  const packet = document.createElement("div");
  packet.className = "packet";
  packet.textContent = seqNum;
  return packet;
}

function createAck(seqNum) {
  const ack = document.createElement("div");
  ack.className = "ack";
  ack.textContent = "ACK " + seqNum;
  return ack;
}

function simulatePacketTransmission(packet, seqNum) {
  const channel = document.getElementById("channel");
  packet.style.left = "0%";
  channel.appendChild(packet);

  let corruptionChance = Math.random();
  let isCorrupted = corruptionChance < 0.03; // 3% corruption
  let isLost = corruptionChance < 0.01;      // 1% loss

  let position = 0;
  const interval = setInterval(() => {
    if (!simulationRunning) return clearInterval(interval);
    position += 2;
    packet.style.left = position + "%";
    if (position >= 90) {
      clearInterval(interval);
      if (isLost) {
        log("Channel: Packet lost!");
        startTimeout();
        channel.removeChild(packet);
        return;
      }
      if (isCorrupted) {
        log("Channel: Packet corrupted");
        log("Receiver: Ignored corrupted packet");
        startTimeout();
        channel.removeChild(packet);
        return;
      }

      log("Receiver: Received Packet " + seqNum);
      setTimeout(() => {
        sendAck(seqNum);
        channel.removeChild(packet);
      }, 500);
    }
  }, 30);
}

function sendAck(seqNum) {
  const channel = document.getElementById("channel");
  const ack = createAck(seqNum);
  ack.style.left = "90%";
  channel.appendChild(ack);

  let ackCorruption = Math.random();
  let isCorrupted = ackCorruption < 0.03;
  let isLost = ackCorruption < 0.01;

  let position = 90;
  const interval = setInterval(() => {
    if (!simulationRunning) return clearInterval(interval);
    position -= 2;
    ack.style.left = position + "%";
    if (position <= 0) {
      clearInterval(interval);
      channel.removeChild(ack);
      if (isLost) {
        log("ACK lost!");
        startTimeout();
        return;
      }
      if (isCorrupted) {
        log("ACK corrupted!");
        log("Sender: Incorrect ACK, will resend after timeout.");
        startTimeout();
        return;
      }

      log("ACK " + seqNum + " received by sender");
      clearTimeout(timeoutID);
      expectingAck = false;
      currentPacket = 1 - currentPacket;
      transferredPackets++;
      if (transferredPackets >= maxPackets) {
        log("✅ All packets successfully transferred!");
        simulationRunning = false;
        return;
      }
      sendPacket(currentPacket);
    }
  }, 30);
}

function sendPacket(seqNum) {
  if (!simulationRunning || expectingAck) return;
  log("Sender: Sending packet " + seqNum);
  const packet = createPacket(seqNum);
  simulatePacketTransmission(packet, seqNum);
  expectingAck = true;
  startTimeout();
}

function startTimeout() {
  clearTimeout(timeoutID);
  timeoutID = setTimeout(() => {
    if (expectingAck) {
      log("Timeout! Resending packet " + currentPacket);
      sendPacket(currentPacket);
    }
  }, 5000); // Increased timeout duration
}

function startSimulation() {
  const logDiv = document.getElementById("log");
  logDiv.innerHTML = "";
  currentPacket = 0;
  expectingAck = false;
  transferredPackets = 0;
  simulationRunning = true;
  log("📦 Starting RDT 3.0 Simulation...");
  sendPacket(currentPacket);
}

function startGBN() {
  alert("Go-Back-N simulation not implemented yet.");
}

function startSR() {
  alert("Selective Repeat simulation not implemented yet.");
}


// GBN config
const windowSize = 4;
let gbnBase = 0;
let gbnNextSeq = 0;
let gbnTimeout = null;
let gbnPackets = [];
let gbnMaxPackets = 10;
let gbnACKed = new Set();

function startGBN() {
    resetLog();
    gbnBase = 0;
    gbnNextSeq = 0;
    gbnACKed = new Set();
    gbnPackets = Array.from({ length: gbnMaxPackets }, (_, i) => ({
      seqNum: i,
      data: `Msg ${i}`,
    }));
  
    log(`[GBN] Starting Go-Back-N Simulation`);
    sendWindow();
  }

  function sendWindow() {
    while (gbnNextSeq < gbnBase + windowSize && gbnNextSeq < gbnPackets.length) {
      sendGBNPacket(gbnPackets[gbnNextSeq]);
      gbnNextSeq++;
    }
  
    startGBNTimeout();
  }

  function sendGBNPacket(packet) {
    const channel = document.getElementById('channel');
    const packetDiv = document.createElement('div');
    packetDiv.className = 'packet';
    packetDiv.innerText = `Pkt ${packet.seqNum}`;
    channel.appendChild(packetDiv);
  
    log(`[GBN] Sending packet ${packet.seqNum}`);
  
    const lossChance = 0.1;
    const corruptChance = 0.2;
  
    setTimeout(() => {
      if (Math.random() < lossChance) {
        log(`[Network] Packet ${packet.seqNum} lost`);
        packetDiv.style.backgroundColor = 'gray';
        return;
      }
  
      if (Math.random() < corruptChance) {
        log(`[Network] Packet ${packet.seqNum} corrupted`);
        packetDiv.style.backgroundColor = 'red';
        packetDiv.classList.add('corrupt-glitch'); // new animation
        receiveGBNPacket({ ...packet, corrupted: true });
      } else {
        packetDiv.style.backgroundColor = '#4caf50';
        receiveGBNPacket({ ...packet, corrupted: false });
      }
      
    }, TIMEOUT);
  }

  let gbnExpected = 0;

  function receiveGBNPacket(packet) {
    const receiver = document.getElementById('receiver');
    const packetDiv = document.createElement('div');
    packetDiv.className = 'packet';
    packetDiv.innerText = `Pkt ${packet.seqNum}`;
    receiver.appendChild(packetDiv);
  
    if (packet.corrupted) {
      log(`[Receiver] Packet ${packet.seqNum} corrupted, discarding.`);
      packetDiv.style.backgroundColor = 'red';
      packetDiv.classList.add('corrupt-glitch');
      return;
    }
  
    if (packet.seqNum === gbnExpected) {
      log(`[Receiver] Received packet ${packet.seqNum}, sending ACK.`);
      packetDiv.style.backgroundColor = '#4caf50';
      sendGBNAck(packet.seqNum);
      gbnExpected++;
    } else {
      log(`[Receiver] Out-of-order packet ${packet.seqNum}, discarding.`);
      packetDiv.style.backgroundColor = 'orange';
      sendGBNAck(gbnExpected - 1); // Send last correct ACK
    }
  }
  
function sendGBNAck(seqNum) {
  log(`[Receiver → Sender] ACK ${seqNum}`);
  createAck(seqNum); // New visual ack
  setTimeout(() => {
    receiveGBNAck(seqNum);
  }, TIMEOUT);
}

  
  function receiveGBNAck(ackNum) {
    if (ackNum >= gbnBase) {
      log(`[Sender] Received ACK ${ackNum}`);
      gbnACKed.add(ackNum);
      gbnBase = ackNum + 1;
  
      if (gbnBase === gbnNextSeq) {
        clearTimeout(gbnTimeout); // All ACKed
      } else {
        startGBNTimeout(); // Reset timer
      }
  
      // Continue sending new packets if any
      sendWindow();
    }
  }
  function startGBNTimeout() {
    clearTimeout(gbnTimeout);
    gbnTimeout = setTimeout(() => {
      log(`[Sender] Timeout! Resending from packet ${gbnBase}`);
  
      // Add shake to existing packets
      const packetEls = document.querySelectorAll('.packet');
      packetEls.forEach(p => {
        const num = parseInt(p.innerText.replace('Pkt ', ''));
        if (num >= gbnBase && num < gbnNextSeq) {
          p.style.animation = 'shake 0.5s';
        }
      });
  
      gbnNextSeq = gbnBase;
      sendWindow();
    }, TIMEOUT);
  }
  
  
  function resetLog() {
    document.getElementById('log').innerHTML = '';
    document.getElementById('channel').innerHTML = '';
  }
      

  // SR Config
const srWindowSize = 4;
let srBase = 0;
let srNextSeq = 0;
let srMaxPackets = 10;
let srPackets = [];
let srTimers = {};
let srACKed = {};
let srReceiverBuffer = {};
let srExpected = 0;

function startSR() {
  resetLog();
  srBase = 0;
  srNextSeq = 0;
  srTimers = {};
  srACKed = {};
  srReceiverBuffer = {};
  srExpected = 0;

  srPackets = Array.from({ length: srMaxPackets }, (_, i) => ({
    seqNum: i,
    data: `Msg ${i}`,
  }));

  log(`[SR] Starting Selective Repeat Simulation`);
  srSendWindow();
}

function srSendWindow() {
  for (let i = srBase; i < srBase + srWindowSize && i < srMaxPackets; i++) {
    if (!srACKed[i]) {
      srSendPacket(srPackets[i]);
    }
  }
}

function srSendPacket(packet) {
  // Don't send if already ACKed
  if (srACKed[packet.seqNum]) return;

  const channel = document.getElementById('channel');
  const packetDiv = document.createElement('div');
  packetDiv.className = 'packet';
  packetDiv.innerText = `Pkt ${packet.seqNum}`;
  channel.appendChild(packetDiv);

  log(`[SR] Sending packet ${packet.seqNum}`);

  // Start per-packet timeout
  if (srTimers[packet.seqNum]) clearTimeout(srTimers[packet.seqNum]);
  srTimers[packet.seqNum] = setTimeout(() => {
    // Check again here in case ACK arrived just before timeout
    if (!srACKed[packet.seqNum]) {
      log(`[Sender] Timeout for packet ${packet.seqNum}, retransmitting.`);
      srSendPacket(packet); // Retransmit only if not ACKed
    }
  }, TIMEOUT);

  const lossChance = 0.1;
  const corruptChance = 0.1;

  setTimeout(() => {
    if (Math.random() < lossChance) {
      log(`[Network] Packet ${packet.seqNum} lost`);
      packetDiv.style.backgroundColor = 'gray';
      return;
    }

    if (Math.random() < corruptChance) {
      log(`[Network] Packet ${packet.seqNum} corrupted`);
      packetDiv.style.backgroundColor = 'red';
      packetDiv.classList.add('corrupt-glitch');
      srReceivePacket({ ...packet, corrupted: true });
    } else {
      packetDiv.style.backgroundColor = '#4caf50';
      srReceivePacket({ ...packet, corrupted: false });
    }
  }, TIMEOUT);
}



function srReceivePacket(packet) {
  if (packet.corrupted) {
    log(`[Receiver] Packet ${packet.seqNum} corrupted. Discarding.`);

    // Show corrupted packet on receiver side
    const receiver = document.getElementById('receiver');
    const packetDiv = document.createElement('div');
    packetDiv.className = 'packet corrupt-glitch';
    packetDiv.innerText = `Pkt ${packet.seqNum}`;
    packetDiv.style.backgroundColor = 'red';
    receiver.appendChild(packetDiv);

    return;
  }

  if (srReceiverBuffer[packet.seqNum]) {
    log(`[Receiver] Packet ${packet.seqNum} already buffered. Ignoring.`);
    sendSRAck(packet.seqNum);
    return;
  }

  log(`[Receiver] Received packet ${packet.seqNum}, buffering.`);
  srReceiverBuffer[packet.seqNum] = packet;

  // Create visual packet on receiver side
  const receiver = document.getElementById('receiver');
  const packetDiv = document.createElement('div');
  packetDiv.className = 'packet buffered';
  packetDiv.innerText = `Pkt ${packet.seqNum}`;
  receiver.appendChild(packetDiv);

  sendSRAck(packet.seqNum);

  // Deliver in-order buffered packets
  while (srReceiverBuffer[srExpected]) {
    log(`[Receiver] Delivered buffered packet ${srExpected}`);
    delete srReceiverBuffer[srExpected];
    srExpected++;
  }
}



function sendSRAck(seqNum) {
  log(`[Receiver → Sender] ACK ${seqNum}`);
  createAck(seqNum); // New visual ack
  setTimeout(() => {
    receiveSRAck(seqNum);
  }, TIMEOUT);
}


function receiveSRAck(ackNum) {
  if (srACKed[ackNum]) return; // already processed
  log(`[Sender] Received ACK ${ackNum}`);
  srACKed[ackNum] = true;

  clearTimeout(srTimers[ackNum]);

  // Slide window base forward
  while (srACKed[srBase]) {
    srBase++;
  }

  srSendWindow(); // Send more if window allows
}

