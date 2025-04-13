const GBN_WINDOW_SIZE = 4;
const GBN_MAX_PACKETS = 10;
const GBN_TIMEOUT_DURATION = 3000;

let gbnBase = 0;
let gbnNextSeq = 0;
let gbnPackets = [];
let gbnAcked = [];
let gbnTimeout = null;
let gbnSimulationRunning = false;
let gbnExpectedSeqNum = 0;

function startGBNSimulation() {
  resetLog();
  document.getElementById("channel").innerHTML = "";
  gbnBase = 0;
  gbnNextSeq = 0;
  gbnExpectedSeqNum = 0;
  gbnAcked = Array(GBN_MAX_PACKETS).fill(false);
  gbnSimulationRunning = true;

  log("🚀 Starting Go-Back-N Simulation...");

  gbnPackets = Array.from({ length: GBN_MAX_PACKETS }, (_, i) => i);
  gbnSendWindow();
}

function gbnSendWindow() {
  while (gbnNextSeq < gbnBase + GBN_WINDOW_SIZE && gbnNextSeq < GBN_MAX_PACKETS) {
    gbnSendPacket(gbnNextSeq);
    gbnNextSeq++;
  }

  startGBNTimeout();
}

function gbnSendPacket(seqNum) {
  const packet = document.createElement("div");
  packet.className = "packet";
  packet.textContent = seqNum;
  packet.style.left = "0%";
  packet.dataset.seq = seqNum;
  document.getElementById("channel").appendChild(packet);

  log(`Sender: Sending packet ${seqNum}`);

  let corruptionChance = Math.random();
  let isLost = corruptionChance < 0.05;
  let isCorrupted = corruptionChance >= 0.05 && corruptionChance < 0.1;

  let position = 0;
  const interval = setInterval(() => {
    if (!gbnSimulationRunning) return clearInterval(interval);

    position += 2;
    packet.style.left = position + "%";

    if (position >= 90) {
      clearInterval(interval);
      if (isLost) {
        log(`Channel: Packet ${seqNum} lost`);
        packet.remove();
        return;
      }

      if (isCorrupted) {
        log(`Receiver: Packet ${seqNum} corrupted, discarded`);
        packet.classList.add("corrupt-glitch");
        packet.remove();
        return;
      }

      gbnReceivePacket({ seqNum, corrupted: false });
      packet.remove();
    }
  }, 30);
}

function gbnReceivePacket(packet) {
  const seqNum = packet.seqNum;

  if (packet.corrupted) {
    log(`Receiver: Packet ${seqNum} corrupted, discarded`);
    return;
  }

  if (seqNum !== gbnExpectedSeqNum) {
    log(`Receiver: Packet ${seqNum} out of order, discarded`);
    return;
  }

  log(`Receiver: Received Packet ${seqNum}`);
  gbnExpectedSeqNum++;

  setTimeout(() => {
    sendGBNAck(seqNum);
  }, 500);
}

function sendGBNAck(seqNum) {
  const ack = document.createElement("div");
  ack.className = "ack";
  ack.textContent = `ACK ${seqNum}`;
  ack.style.left = "90%";
  document.getElementById("channel").appendChild(ack);

  let position = 90;
  const interval = setInterval(() => {
    if (!gbnSimulationRunning) return clearInterval(interval);

    position -= 2;
    ack.style.left = position + "%";

    if (position <= 0) {
      clearInterval(interval);
      ack.remove();

      log(`Sender: Received ACK ${seqNum}`);
      if (seqNum >= gbnBase) {
        for (let i = gbnBase; i <= seqNum; i++) {
          gbnAcked[i] = true;
        }
        gbnBase = seqNum + 1;

        if (gbnBase === gbnNextSeq) {
          clearTimeout(gbnTimeout);
        } else {
          startGBNTimeout();
        }

        if (gbnBase < GBN_MAX_PACKETS) {
          gbnSendWindow();
        } else if (gbnAcked.every(a => a)) {
          log("✅ All packets successfully transferred!");
          gbnSimulationRunning = false;
        }
      }
    }
  }, 30);
}

function startGBNTimeout() {
  clearTimeout(gbnTimeout);
  gbnTimeout = setTimeout(() => {
    if (!gbnSimulationRunning) return;
    log(`Timeout! Resending from packet ${gbnBase}`);
    gbnNextSeq = gbnBase;
    gbnSendWindow();
  }, GBN_TIMEOUT_DURATION);
}
