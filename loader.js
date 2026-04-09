document.addEventListener("DOMContentLoaded", () => {
  const taskInput = document.getElementById("taskInput");
  const runButton = document.getElementById("runButton");
  const agentsContainer = document.getElementById("agentsContainer");
  const pathsContainer = document.getElementById("pathsContainer");
  const graphNodes = document.getElementById("graphNodes");
  const exampleChips = document.querySelectorAll(".example-chip");

  let seed = null;

  fetch("seed.json")
    .then((res) => res.json())
    .then((data) => {
      seed = data;
      // Initial state: show all agents and a default path
      renderAgents(seed.agents);
      renderPaths(seed.paths);
      renderGraph(seed.paths[1]); // Scrape → Summarize → Notion as default
      if (taskInput) {
        taskInput.value = "Scrape a website and summarize it into Notion";
      }
    })
    .catch((err) => {
      console.error("Failed to load seed.json", err);
      if (agentsContainer) {
        agentsContainer.innerHTML =
          '<div style="font-size:11px;color:#fca5a5;">Error loading seed.json</div>';
      }
    });

  function renderAgents(agentList) {
    if (!agentsContainer) return;
    agentsContainer.innerHTML = "";
    if (!agentList || agentList.length === 0) {
      agentsContainer.innerHTML =
        '<div style="font-size:11px;color:#9ca3af;">No agents found for this task in the demo seed.</div>';
      return;
    }

    agentList.forEach((agent) => {
      const div = document.createElement("div");
      div.className = "agent-card";
      div.innerHTML = `
        <div class="agent-name-row">
          <div class="agent-name">${agent.name}</div>
          <div class="agent-vendor">${agent.vendor}</div>
        </div>
        <div class="agent-io">
          Inputs: ${agent.inputs.join(", ")} · Outputs: ${agent.outputs.join(", ")}
        </div>
        <div class="agent-tags">
          <div class="agent-tag">Cost: ${agent.cost}</div>
          <div class="agent-tag">ID: ${agent.id}</div>
        </div>
      `;
      agentsContainer.appendChild(div);
    });
  }

  function renderPaths(pathList) {
    if (!pathsContainer) return;
    pathsContainer.innerHTML = "";
    if (!pathList || pathList.length === 0) {
      pathsContainer.innerHTML =
        '<div style="font-size:11px;color:#9ca3af;">No paths found for this task in the demo seed.</div>';
      return;
    }

    pathList.forEach((path) => {
      const stepNames = path.steps
        .map((id) => {
          const agent = seed.agents.find((a) => a.id === id);
          return agent ? agent.name : id;
        })
        .join(" → ");

      const div = document.createElement("div");
      div.className = "path-card";
      div.innerHTML = `
        <div class="path-title-row">
          <div class="path-title">${path.label}</div>
          <div class="path-meta">Cost: ${path.cost}</div>
        </div>
        <div class="path-steps">${stepNames}</div>
        <div class="path-meta" style="margin-top:2px;">${path.notes}</div>
      `;
      pathsContainer.appendChild(div);
    });
  }

  function renderGraph(path) {
    if (!graphNodes || !path || !seed) return;
    graphNodes.innerHTML = "";
    const nodes = [];

    path.steps.forEach((id, index) => {
      const agent = seed.agents.find((a) => a.id === id);
      if (index > 0) {
        const arrow = document.createElement("div");
        arrow.className = "graph-arrow";
        arrow.textContent = "→";
        nodes.push(arrow);
      }
      const node = document.createElement("div");
      node.className = "graph-node";
      node.textContent = agent ? agent.name : id;
      nodes.push(node);
    });

    nodes.forEach((el) => graphNodes.appendChild(el));
  }

  function choosePathsForTask(task) {
    if (!seed) return { agents: seed ? seed.agents : [], paths: [] };
    const lower = task.toLowerCase();

    let matchKey = null;
    if (lower.includes("csv")) matchKey = "csv";
    else if (lower.includes("scrape") || lower.includes("website")) matchKey = "scrape";
    else if (lower.includes("pdf")) matchKey = "pdf";
    else if (lower.includes("image")) matchKey = "image";

    if (!matchKey) {
      return { agents: seed.agents, paths: seed.paths };
    }

    const paths = seed.paths.filter((p) => p.task_match === matchKey);
    const agentIds = new Set();
    paths.forEach((p) => p.steps.forEach((id) => agentIds.add(id)));
    const agents = seed.agents.filter((a) => agentIds.has(a.id));

    return { agents, paths };
  }

  function handleRun() {
    if (!seed) return;
    const task = (taskInput && taskInput.value.trim()) || "";
    const { agents, paths } = choosePathsForTask(task);
    renderAgents(agents);
    renderPaths(paths);
    renderGraph(paths[0] || null);
  }

  if (runButton) {
    runButton.addEventListener("click", handleRun);
  }

  if (exampleChips && exampleChips.length) {
    exampleChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const task = chip.getAttribute("data-task") || "";
        if (taskInput) taskInput.value = task;
        handleRun();
      });
    });
  }
});
