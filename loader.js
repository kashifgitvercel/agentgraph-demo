async function loadSeed() {
  try {
    const res = await fetch("seed.json");
    const data = await res.json();

    window.seedAgents = data.agents;
    window.seedPaths = data.paths;

    renderSeedAgents();
    renderSeedPaths();
  } catch (e) {
    console.error("Seed load failed", e);
  }
}

function renderSeedAgents() {
  const container = document.getElementById("seed-agents");
  if (!container) return;

  container.innerHTML = window.seedAgents
    .map(a => `
      <div class="agent-card">
        <h3>${a.name}</h3>
        <p>${a.description}</p>
        <p><strong>Inputs:</strong> ${a.inputs.join(", ")}</p>
        <p><strong>Outputs:</strong> ${a.outputs.join(", ")}</p>
        <p><strong>Cost:</strong> ${a.cost}</p>
      </div>
    `)
    .join("");
}

function renderSeedPaths() {
  const container = document.getElementById("seed-paths");
  if (!container) return;

  container.innerHTML = window.seedPaths
    .map(p => `
      <div class="path-card">
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <p><strong>Steps:</strong> ${p.steps.join(" → ")}</p>
      </div>
    `)
    .join("");
}

window.addEventListener("DOMContentLoaded", loadSeed);
