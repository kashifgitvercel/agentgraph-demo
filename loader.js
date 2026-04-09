let seed = null;
let editingPathIndex = null;
let localPaths = [];
let upvotes = {};

document.addEventListener("DOMContentLoaded", () => {
  const taskInput = document.getElementById("taskInput");
  const runButton = document.getElementById("runButton");
  const agentsContainer = document.getElementById("agentsContainer");
  const pathsContainer = document.getElementById("pathsContainer");
  const examples = document.querySelectorAll(".example");

  const editorPanel = document.getElementById("editorPanel");
  const editorName = document.getElementById("editorName");
  const editorSteps = document.getElementById("editorSteps");
  const editorAddStep = document.getElementById("editorAddStep");
  const addStepBtn = document.getElementById("addStepBtn");
  const saveWorkflow = document.getElementById("saveWorkflow");
  const cancelWorkflow = document.getElementById("cancelWorkflow");

  fetch("seed.json")
    .then(res => res.json())
    .then(data => {
      seed = data;
      // clone paths so we can edit locally
      localPaths = JSON.parse(JSON.stringify(seed.paths));
      renderAgents(seed.agents);
      renderPaths(localPaths);
      populateAddStepDropdown();
    });

  function populateAddStepDropdown() {
    editorAddStep.innerHTML = "";
    seed.agents.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = a.name;
      editorAddStep.appendChild(opt);
    });
  }

  function renderAgents(list) {
    agentsContainer.innerHTML = "";
    list.forEach(agent => {
      const div = document.createElement("div");
      div.className = "agent-card";
      div.innerHTML = `
        <div style="font-weight:500;">${agent.name}</div>
        <div style="color:#94a3b8;font-size:10px;">Inputs: ${agent.inputs.join(", ")} · Outputs: ${agent.outputs.join(", ")}</div>
        <div style="margin-top:4px;font-size:10px;color:#94a3b8;">Vendor: ${agent.vendor} · Cost: ${agent.cost}</div>
      `;
      agentsContainer.appendChild(div);
    });
  }

  function renderPaths(list) {
    pathsContainer.innerHTML = "";
    list.forEach((path, index) => {
      const stepNames = path.steps
        .map(id => seed.agents.find(a => a.id === id)?.name || id)
        .join(" → ");

      const div = document.createElement("div");
      div.className = "path-card";
      div.innerHTML = `
        <div style="font-weight:500;">${path.label}</div>
        <div style="color:#94a3b8;font-size:10px;margin-top:2px;">${stepNames}</div>
        <div class="path-actions">
          <button class="path-btn" data-index="${index}" data-action="edit">Edit</button>
          <button class="path-btn" data-index="${index}" data-action="json">Copy JSON</button>
          <button class="path-btn" data-index="${index}" data-action="upvote">👍 ${upvotes[index] || 0}</button>
        </div>
      `;
      pathsContainer.appendChild(div);
    });
  }

  function openEditor(index) {
    editingPathIndex = index;
    const path = localPaths[index];

    editorName.value = path.label;
    editorSteps.innerHTML = "";

    path.steps.forEach((stepId, i) => {
      const agent = seed.agents.find(a => a.id === stepId);
      const row = document.createElement("div");
      row.className = "step-row";
      row.innerHTML = `
        <div>${agent?.name || stepId}</div>
        <div class="step-actions">
          <button data-i="${i}" data-move="up">↑</button>
          <button data-i="${i}" data-move="down">↓</button>
          <button data-i="${i}" data-move="remove">✕</button>
        </div>
      `;
      editorSteps.appendChild(row);
    });

    editorPanel.classList.add("open");
  }

  function closeEditor() {
    editorPanel.classList.remove("open");
    editingPathIndex = null;
  }

  pathsContainer.addEventListener("click", e => {
    const btn = e.target;
    if (!btn.dataset.action) return;

    const index = parseInt(btn.dataset.index, 10);
    const action = btn.dataset.action;

    if (action === "edit") {
      openEditor(index);
    }

    if (action === "json") {
      const json = JSON.stringify(localPaths[index], null, 2);
      navigator.clipboard.writeText(json).catch(() => {});
      alert("Workflow JSON copied.");
    }

    if (action === "upvote") {
      upvotes[index] = (upvotes[index] || 0) + 1;
      renderPaths(localPaths);
    }
  });

  addStepBtn.addEventListener("click", () => {
    if (editingPathIndex === null) return;
    const id = editorAddStep.value;
    localPaths[editingPathIndex].steps.push(id);
    openEditor(editingPathIndex); // re-render
  });

  editorSteps.addEventListener("click", e => {
    const btn = e.target;
    if (!btn.dataset.i || editingPathIndex === null) return;

    const i = parseInt(btn.dataset.i, 10);
    const move = btn.dataset.move;
    const steps = localPaths[editingPathIndex].steps;

    if (move === "up" && i > 0) {
      [steps[i - 1], steps[i]] = [steps[i], steps[i - 1]];
    }
    if (move === "down" && i < steps.length - 1) {
      [steps[i + 1], steps[i]] = [steps[i], steps[i + 1]];
    }
    if (move === "remove") {
      steps.splice(i, 1);
    }

    openEditor(editingPathIndex); // re-render
  });

  saveWorkflow.addEventListener("click", () => {
    if (editingPathIndex === null) return;
    localPaths[editingPathIndex].label = editorName.value || localPaths[editingPathIndex].label;
    closeEditor();
    renderPaths(localPaths);
  });

  cancelWorkflow.addEventListener("click", closeEditor);

  examples.forEach(btn => {
    btn.addEventListener("click", () => {
      taskInput.value = btn.dataset.task;
      runButton.click();
    });
  });

  runButton.addEventListener("click", () => {
    if (!seed) return;
    const task = (taskInput.value || "").toLowerCase();
    let match = null;

    if (task.includes("csv")) match = "csv";
    else if (task.includes("scrape") || task.includes("website")) match = "scrape";
    else if (task.includes("pdf")) match = "pdf";
    else if (task.includes("image")) match = "image";

    if (!match) {
      // no match → show all
      renderAgents(seed.agents);
      renderPaths(localPaths);
      return;
    }

    const filtered = localPaths.filter(p => p.task_match === match);
    const agentIds = new Set(filtered.flatMap(p => p.steps));
    const agents = seed.agents.filter(a => agentIds.has(a.id));

    renderAgents(agents);
    renderPaths(filtered.length ? filtered : localPaths);
  });
});
