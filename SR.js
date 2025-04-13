const SR_WINDOW_SIZE = 4;
const SR_MAX_PACKETS = 10;
const SR_TIMEOUT_DURATION = 3000;

let srBase = 0;
let srNextSeq = 0;
let srPackets = [];
let srAcked = [];
let srTimers = [];
let srReceiverBuffer = {};
let srSimulationRunning = false;

function startSR() {
  resetLog();
  document.getElementById("channel").innerHTML = "";
  srBase = 0;
  srNextSeq = 0;
  srAcked = Array(SR_MAX_PACKETS).fill(false);
  srReceiverBuffer = {};
  srTimers = [];
  srSimulationRunning = true;

  log("🚀 Starting Selective Repeat Simulation...");
  srPackets = Array.from({ length: SR_MAX_PACKETS }, (_, i) => i);
  srSendWindow();
}

function srSendWindow() {
  while (srNextSeq < srBase + SR_WINDOW_SIZE && srNextSeq < SR_MAX_PACKETS) {
    srSendPacket(srNextSeq);
    srNextSeq++;
  }
}

function srSendPacket(seqNum) {
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

  startSRTimeout(seqNum);

  let position = 0;
  const interval = setInterval(() => {
    if (!srSimulationRunning) return clearInterval(interval);

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

      log(`Receiver: Received Packet ${seqNum}`);

      srReceiverBuffer[seqNum] = true;
      packet.remove();

      sendSRAck(seqNum);
      srDeliverPackets();
    }
  }, 30);
}

function sendSRAck(seqNum) {
  const ack = document.createElement("div");
  ack.className = "ack";
  ack.textContent = `ACK ${seqNum}`;
  ack.style.left = "90%";
  document.getElementById("channel").appendChild(ack);

  let position = 90;
  const interval = setInterval(() => {
    if (!srSimulationRunning) return clearInterval(interval);

    position -= 2;
    ack.style.left = position + "%";

    if (position <= 0) {
      clearInterval(interval);
      ack.remove();

      log(`Sender: Received ACK ${seqNum}`);
      srAcked[seqNum] = true;
      clearTimeout(srTimers[seqNum]);

      while (srAcked[srBase]) srBase++;

      if (srBase < SR_MAX_PACKETS) {
        srSendWindow();
      } else if (srAcked.every(a => a)) {
        log("✅ All packets successfully transferred!");
        srSimulationRunning = false;
      }
    }
  }, 30);
}

function srDeliverPackets() {
  for (let i = 0; i < SR_MAX_PACKETS; i++) {
    if (!srReceiverBuffer.hasOwnProperty(i)) break;
  }
}

function startSRTimeout(seqNum) {
  clearTimeout(srTimers[seqNum]);
  srTimers[seqNum] = setTimeout(() => {
    if (!srSimulationRunning || srAcked[seqNum]) return;
    log(`Timeout! Resending packet ${seqNum}`);
    srSendPacket(seqNum);
  }, SR_TIMEOUT_DURATION);
}
