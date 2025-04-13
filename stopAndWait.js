let currentPacket = 0;
let expectingAck = false;
let timeoutID = null;
let maxPackets = 10;
let transferredPackets = 0;
let simulationRunning = false;

// function log(msg) {
//   const logDiv = document.getElementById("log");
//   const p = document.createElement("p");
//   p.textContent = msg;
//   logDiv.appendChild(p);
//   logDiv.scrollTop = logDiv.scrollHeight;
// }

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

function sendPacket(seqNum, force = false) {
  if (!simulationRunning || (expectingAck && !force)) return;
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
      sendPacket(currentPacket, true);  // 🔥 Force resend
    }
  }, 5000); // Increased timeout duration
}


function startSimulation() {
  resetLog();
  const logDiv = document.getElementById("log");
  logDiv.innerHTML = "";
  currentPacket = 0;
  expectingAck = false;
  transferredPackets = 0;
  simulationRunning = true;
  log("📦 Starting RDT 3.0 Simulation...");
  sendPacket(currentPacket);
}

