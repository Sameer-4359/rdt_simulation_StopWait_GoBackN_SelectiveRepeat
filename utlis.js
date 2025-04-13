function log(msg) {
    const logDiv = document.getElementById("log");
    const p = document.createElement("p");
    p.textContent = msg;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
  }
  
  function clearSimulationUI() {
    document.getElementById('log').innerHTML = '';
    document.getElementById('channel').innerHTML = '';
    document.getElementById('receiver').innerHTML = '';
  }

  function resetLog() {
    document.getElementById("log").innerHTML = "";
  }
  
  