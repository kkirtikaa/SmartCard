
const STEPS = ["Open", "Assigned", "Visit scheduled", "Resolved"];
const TECHNICIANS = ["Unassigned", "Ravi K.", "Meena S.", "Arjun P."];

const ISSUES = {
  conn: ["Connectivity problem", 199, 0],
  resp: ["Device not responding", 299, 450],
  dmg: ["Physical damage", 299, 900]
};

const BADGES = {
  online: ["ok", "Online"],
  offline: ["bad", "Offline"],
  degraded: ["warn", "Slow response"]
};

const state = {
  role: "c",
  tab: "devices",
  diagnostics: null,
  toast: "",
  form: {
    deviceId: "d1",
    type: "Not responding",
    description: ""
  },
  price: {
    issue: "resp",
    warranty: "no"
  },
  devices: [
    {
      id: "d1",
      name: "Living room switchboard",
      status: "online",
      signal: "−52 dBm",
      lastSeen: "just now"
    },
    {
      id: "d2",
      name: "Bedroom curtain motor",
      status: "offline",
      signal: "−78 dBm",
      lastSeen: "3 h ago"
    },
    {
      id: "d3",
      name: "Main door lock",
      status: "online",
      signal: "−60 dBm",
      lastSeen: "just now"
    },
    {
      id: "d4",
      name: "Geyser relay",
      status: "degraded",
      signal: "−65 dBm",
      lastSeen: "1 min ago"
    }
  ],
  tickets: [
    {
      id: "T-1001",
      deviceId: "d2",
      type: "Not responding",
      description: "Curtain stopped responding after a power cut.",
      status: 1,
      technician: 1,
      diagnosticsAttached: true,
      createdAt: "Today, 09:10"
    },
    {
      id: "T-1000",
      deviceId: "d4",
      type: "Slow commands",
      description: "Geyser switches on after a long delay.",
      status: 3,
      technician: 2,
      diagnosticsAttached: false,
      createdAt: "Yesterday"
    }
  ],
  nextTicketNumber: 1002
};

const app = document.querySelector("#app");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getDeviceName(deviceId) {
  return state.devices.find(device => device.id === deviceId)?.name ?? "Unknown device";
}

function formatMoney(amount) {
  return `₹${amount.toFixed(2)}`;
}

// Customer: diagnostics panel
function renderDiagnostics() {
  const diagnostics = state.diagnostics;

  if (!diagnostics) return "";

  const checks = diagnostics.checks.map(check => {
    const label = check.result === "ok"
      ? "Pass"
      : check.result === "warn" ? "Warning" : "Fail";

    return `
      <p>
        <b>${label}</b> · ${check.title}
        ${check.message ? ` – ${check.message}` : ""}
      </p>
    `;
  }).join("");

  return `
    <div class="card dg" role="status" aria-live="polite">
      <h3>Diagnostics: ${escapeHTML(getDeviceName(diagnostics.deviceId))}</h3>
      ${checks}
      ${diagnostics.done
        ? `<p><b>Result:</b> ${diagnostics.result}</p>`
        : `<p class="mut">Running checks…</p>`}
    </div>
  `;
}

// Customer: device cards
function renderDevices() {
  const cards = state.devices.map(device => {
    const badge = BADGES[device.status];

    return `
      <div class="card">
        <h3>${escapeHTML(device.name)}</h3>
        <span class="badge ${badge[0]}">${badge[1]}</span>
        <div class="mut">
          Signal ${device.signal} · Last seen ${device.lastSeen}
        </div>
        <div class="row">
          <button class="btn o" data-action="diagnostics" data-id="${device.id}">
            Run diagnostics
          </button>
          ${device.status !== "online" ? `
            <button class="btn" data-action="report-device" data-id="${device.id}">
              Report issue
            </button>
          ` : ""}
        </div>
      </div>
    `;
  }).join("");

  return `<div class="grid">${cards}</div>${renderDiagnostics()}`;
}

// Customer: issue reporting form
function renderReportForm() {
  const form = state.form;

  const deviceOptions = state.devices.map(device => `
    <option value="${device.id}" ${form.deviceId === device.id ? "selected" : ""}>
      ${escapeHTML(device.name)}
    </option>
  `).join("");

  const issueTypes = [
    "Not responding",
    "Slow commands",
    "Disconnects often",
    "Physical damage"
  ];

  const issueOptions = issueTypes.map(type => `
    <option ${form.type === type ? "selected" : ""}>${type}</option>
  `).join("");

  const diagnosticsReady =
    state.diagnostics &&
    state.diagnostics.deviceId === form.deviceId &&
    state.diagnostics.done;

  return `
    <div class="card" style="max-width:560px">
      <h3>Report an issue</h3>

      <label for="device-field">Device</label>
      <select id="device-field" data-form-field="deviceId">
        ${deviceOptions}
      </select>

      <label for="issue-field">What is happening?</label>
      <select id="issue-field" data-form-field="type">
        ${issueOptions}
      </select>

      <label for="description-field">Details</label>
      <textarea
        id="description-field"
        rows="4"
        data-form-field="description"
        placeholder="When did it start? Any power cut or router change?"
      >${escapeHTML(form.description)}</textarea>

      <div class="row">
        <button class="btn" data-action="submit-ticket">Submit request</button>
      </div>

      ${diagnosticsReady
        ? `<p class="mut">Your latest diagnostics for this device will be attached.</p>`
        : ""}
    </div>
  `;
}

// Customer: ticket tracking
function renderTickets() {
  if (!state.tickets.length) {
    return `<div class="card"><p>No service requests yet.</p></div>`;
  }

  return state.tickets.map(ticket => `
    <div class="card" style="margin-bottom:12px">
      <div class="row" style="justify-content:space-between;margin:0">
        <h3>${ticket.id} · ${escapeHTML(getDeviceName(ticket.deviceId))}</h3>
        <span class="badge ${ticket.status === 3 ? "ok" : "warn"}">
          ${STEPS[ticket.status]}
        </span>
      </div>

      <div class="mut">
        ${escapeHTML(ticket.type)} · ${ticket.createdAt}
        ${ticket.diagnosticsAttached ? " · diagnostics attached" : ""}
      </div>

      <p>${escapeHTML(ticket.description)}</p>

      <div class="steps">
        ${STEPS.map((step, index) => `
          <i class="${index <= ticket.status ? "d" : ""}"></i>
        `).join("")}
      </div>

      <div class="stl">
        ${STEPS.map(step => `<span>${step}</span>`).join("")}
      </div>

      <p class="mut">Technician: ${TECHNICIANS[ticket.technician]}</p>
    </div>
  `).join("");
}

// Customer: illustrative pricing
function renderPriceEstimate() {
  const price = state.price;
  const issue = ISSUES[price.issue];
  const underWarranty = price.warranty === "yes";

  const visitCharge = issue[1];
  const partsCharge = issue[2];
  const warrantyCover = underWarranty ? visitCharge + partsCharge : 0;
  const subtotal = visitCharge + partsCharge - warrantyCover;
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const issueOptions = Object.entries(ISSUES).map(([key, item]) => `
    <option value="${key}" ${price.issue === key ? "selected" : ""}>
      ${item[0]}
    </option>
  `).join("");

  return `
    <div class="card" style="max-width:560px">
      <h3>Service price estimate</h3>

      <label for="price-issue">Issue type</label>
      <select id="price-issue" data-price-field="issue">
        ${issueOptions}
      </select>

      <label for="warranty-field">Warranty</label>
      <select id="warranty-field" data-price-field="warranty">
        <option value="no" ${!underWarranty ? "selected" : ""}>Out of warranty</option>
        <option value="yes" ${underWarranty ? "selected" : ""}>Under warranty</option>
      </select>

      <div class="sc">
        <table class="pt" style="margin-top:12px">
          <tr><td>Technician visit</td><td>${formatMoney(visitCharge)}</td></tr>
          <tr><td>Parts</td><td>${formatMoney(partsCharge)}</td></tr>
          <tr><td>Warranty cover</td><td>−${formatMoney(warrantyCover)}</td></tr>
          <tr><td>GST 18%</td><td>${formatMoney(gst)}</td></tr>
          <tr class="tot"><td>Total</td><td>${formatMoney(total)}</td></tr>
        </table>
      </div>

      <p class="mut">
        Illustrative rates for this prototype, not any company’s actual prices.
      </p>
    </div>
  `;
}

// Admin: overview and ticket management
function renderAdmin() {
  const openRequests = state.tickets.filter(ticket => ticket.status < 3).length;
  const devicesNeedingAttention = state.devices.filter(
    device => device.status !== "online"
  ).length;
  const resolved = state.tickets.length - openRequests;

  const rows = state.tickets.map((ticket, index) => `
    <tr>
      <td>${ticket.id}</td>
      <td>${escapeHTML(getDeviceName(ticket.deviceId))}</td>
      <td>${escapeHTML(ticket.type)}</td>
      <td>
        <select aria-label="Status for ${ticket.id}" data-admin-field="status" data-index="${index}">
          ${STEPS.map((step, stepIndex) => `
            <option value="${stepIndex}" ${ticket.status === stepIndex ? "selected" : ""}>
              ${step}
            </option>
          `).join("")}
        </select>
      </td>
      <td>
        <select aria-label="Technician for ${ticket.id}" data-admin-field="technician" data-index="${index}">
          ${TECHNICIANS.map((technician, techIndex) => `
            <option value="${techIndex}" ${ticket.technician === techIndex ? "selected" : ""}>
              ${technician}
            </option>
          `).join("")}
        </select>
      </td>
    </tr>
  `).join("");

  return `
    <div class="grid">
      <div class="card">
        <div class="mut">Open requests</div>
        <div class="stat">${openRequests}</div>
      </div>
      <div class="card">
        <div class="mut">Devices needing attention</div>
        <div class="stat">${devicesNeedingAttention}</div>
      </div>
      <div class="card">
        <div class="mut">Resolved</div>
        <div class="stat">${resolved}</div>
      </div>
    </div>

    <div class="card sc" style="margin-top:12px">
      <h3>Complaints and resolutions</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Device</th>
            <th>Issue</th>
            <th>Status</th>
            <th>Technician</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// Main render function
function render() {
  const isCustomer = state.role === "c";

  const tabs = [
    ["devices", "Devices"],
    ["report", "Report issue"],
    ["tickets", "My tickets"],
    ["price", "Price estimate"]
  ];

  const tabButtons = tabs.map(([key, label]) => `
    <button
      data-action="change-tab"
      data-value="${key}"
      class="${state.tab === key ? "on" : ""}"
      aria-current="${state.tab === key ? "page" : "false"}"
    >
      ${label}
    </button>
  `).join("");

  let content;

  if (!isCustomer) {
    content = renderAdmin();
  } else {
    const views = {
      devices: renderDevices,
      report: renderReportForm,
      tickets: renderTickets,
      price: renderPriceEstimate
    };
    content = views[state.tab]();
  }

  app.innerHTML = `
    <header>
      <div class="brand">
        <b>SmartCare</b>
        <span>Independent prototype · mock data</span>
      </div>

      <div class="seg" role="group" aria-label="Choose view">
        <button
          data-action="change-role"
          data-value="c"
          aria-pressed="${isCustomer}"
          class="${isCustomer ? "on" : ""}"
        >Customer</button>
        <button
          data-action="change-role"
          data-value="a"
          aria-pressed="${!isCustomer}"
          class="${isCustomer ? "" : "on"}"
        >Admin</button>
      </div>
    </header>

    ${isCustomer
      ? `<nav class="tabs" aria-label="Sections">${tabButtons}</nav>`
      : `<div style="height:16px"></div>`}

    <main>${content}</main>

    <footer>
      SmartCare is an independent portfolio prototype built with mock data.
      It is not affiliated with any company.
    </footer>

    ${state.toast
      ? `<div class="toast" role="status">${escapeHTML(state.toast)}</div>`
      : ""}
  `;
}

// Simulated device diagnostics (no real hardware connection)
function runDiagnostics(deviceId) {
  const device = state.devices.find(item => item.id === deviceId);
  if (!device) return;

  const runId = Date.now() + Math.random();
  const isOffline = device.status === "offline";
  const isSlow = device.status === "degraded";

  const plannedChecks = [
    {
      title: "Checking Wi-Fi signal",
      result: isOffline ? "warn" : "ok",
      message: isOffline ? `weak signal (${device.signal})` : device.signal
    },
    {
      title: "Reaching the device",
      result: isOffline ? "bad" : "ok",
      message: isOffline ? "no reply" : "replied"
    },
    {
      title: "Checking cloud connection",
      result: isSlow ? "warn" : "ok",
      message: isSlow ? "commands take about 6 s" : "healthy"
    },
    {
      title: "Checking app and firmware version",
      result: "ok",
      message: "up to date"
    }
  ];

  const results = {
    online: "All checks passed. The device looks healthy.",
    offline: "The device is not reachable. Check its power and Wi-Fi, try the manual switch, then report an issue.",
    degraded: "The device responds, but slowly. Reporting an issue will attach these results."
  };

  state.diagnostics = {
    deviceId,
    runId,
    checks: [],
    done: false,
    result: results[device.status]
  };

  render();

  plannedChecks.forEach((check, index) => {
    setTimeout(() => {
      if (!state.diagnostics || state.diagnostics.runId !== runId) return;

      state.diagnostics.checks.push(check);

      if (index === plannedChecks.length - 1) {
        state.diagnostics.done = true;
      }

      render();
    }, 500 * (index + 1));
  });
}

// Small status message
function showToast(message) {
  state.toast = message;
  render();

  setTimeout(() => {
    state.toast = "";
    render();
  }, 2500);
}

// Create a new mock service ticket
function submitTicket() {
  const form = state.form;

  if (!form.description.trim()) {
    showToast("Add a few details so a technician can help.");
    return;
  }

  const diagnosticsAttached = Boolean(
    state.diagnostics &&
    state.diagnostics.deviceId === form.deviceId &&
    state.diagnostics.done
  );

  state.tickets.unshift({
    id: `T-${state.nextTicketNumber++}`,
    deviceId: form.deviceId,
    type: form.type,
    description: form.description.trim(),
    status: 0,
    technician: 0,
    diagnosticsAttached,
    createdAt: "Just now"
  });

  form.description = "";
  state.tab = "tickets";
  showToast("Request submitted. You can track it here.");
}

// Click actions
document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const value = button.dataset.value;
  const deviceId = button.dataset.id;

  if (action === "change-role") {
    state.role = value;
  } else if (action === "change-tab") {
    state.tab = value;
  } else if (action === "diagnostics") {
    runDiagnostics(deviceId);
    return;
  } else if (action === "report-device") {
    state.form.deviceId = deviceId;
    state.tab = "report";
  } else if (action === "submit-ticket") {
    submitTicket();
    return;
  }

  render();
});

// Select changes
document.addEventListener("change", event => {
  const element = event.target;

  if (element.dataset.formField) {
    state.form[element.dataset.formField] = element.value;
    return;
  }

  if (element.dataset.priceField) {
    state.price[element.dataset.priceField] = element.value;
    render();
    return;
  }

  if (element.dataset.adminField) {
    const ticket = state.tickets[Number(element.dataset.index)];
    if (!ticket) return;

    const value = Number(element.value);

    if (element.dataset.adminField === "status") {
      ticket.status = value;
    } else {
      ticket.technician = value;

      if (value !== 0 && ticket.status === 0) {
        ticket.status = 1;
      }
    }

    render();
  }
});

// Keep textarea state updated while typing
document.addEventListener("input", event => {
  if (event.target.dataset.formField === "description") {
    state.form.description = event.target.value;
  }
});

// Start the application
render();
