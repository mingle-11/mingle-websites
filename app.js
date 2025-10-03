// Koffman Investment Limited - Construction Management System
// SPA with hash routing and localStorage persistence

(function () {
  'use strict';

  // -------------------- Utilities & Storage --------------------
  const STORAGE_KEYS = {
    clients: 'koffman.clients',
    projects: 'koffman.projects',
    settings: 'koffman.settings',
    ui: 'koffman.ui',
  };

  function safeJsonParse(text, fallback) {
    try { return JSON.parse(text); } catch { return fallback; }
  }

  const Storage = {
    read(key, fallback) {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return safeJsonParse(raw, fallback);
    },
    write(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    seedIfEmpty() {
      const clients = this.read(STORAGE_KEYS.clients, null);
      const projects = this.read(STORAGE_KEYS.projects, null);
      const settings = this.read(STORAGE_KEYS.settings, null);
      if (settings == null) {
        this.write(STORAGE_KEYS.settings, {
          companyName: 'Koffman Investment Limited',
          compactMode: false,
          accent: '#e10600',
        });
      }
      if (clients == null && projects == null) {
        const now = new Date().toISOString();
        const clientA = {
          id: generateId('cli'),
          name: 'Alpha Estates',
          contactPerson: 'Samuel Kofi',
          email: 'contact@alphaestates.com',
          phone: '+233 20 123 4567',
          address: '12 Ridge Road, Accra',
          notes: 'Premium residential client',
          createdAt: now,
          updatedAt: now,
        };
        const clientB = {
          id: generateId('cli'),
          name: 'Bright Future Schools',
          contactPerson: 'Ama Serwaa',
          email: 'admin@brightfuture.edu.gh',
          phone: '+233 24 765 4321',
          address: 'Kumasi - Santasi',
          notes: 'School campus expansion',
          createdAt: now,
          updatedAt: now,
        };
        const projA = {
          id: generateId('prj'),
          name: 'Alpha Heights Apartments',
          clientId: clientA.id,
          location: 'Airport Residential Area, Accra',
          startDate: '2025-10-01',
          endDate: '2026-06-30',
          status: 'In Progress',
          budget: 4500000,
          description: '12-storey luxury apartments with underground parking.',
          createdAt: now,
          updatedAt: now,
        };
        const projB = {
          id: generateId('prj'),
          name: 'Bright Future Laboratory Block',
          clientId: clientB.id,
          location: 'Kumasi, Santasi',
          startDate: '2025-11-15',
          endDate: '2026-03-30',
          status: 'Planned',
          budget: 850000,
          description: 'Science laboratory block and 6 classrooms.',
          createdAt: now,
          updatedAt: now,
        };
        this.write(STORAGE_KEYS.clients, [clientA, clientB]);
        this.write(STORAGE_KEYS.projects, [projA, projB]);
      }
      const ui = this.read(STORAGE_KEYS.ui, null);
      if (ui == null) {
        this.write(STORAGE_KEYS.ui, { sidebarCollapsed: false });
      }
    },
  };

  function generateId(prefix) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  }

  function daysBetween(startIso, endIso) {
    if (!startIso || !endIso) return '';
    const s = new Date(startIso);
    const e = new Date(endIso);
    if (isNaN(s) || isNaN(e)) return '';
    const ms = Math.abs(e - s);
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  function currency(value) {
    if (value == null || value === '') return '';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value); }
    catch { return `${value}`; }
  }

  function showToast(message, color) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.color = color || 'var(--success)';
    setTimeout(() => { toast.textContent = ''; }, 2400);
  }

  // -------------------- Routing --------------------
  const appRootId = 'app-root';

  function currentHash() {
    return location.hash || '#dashboard';
  }

  function navigate(hash) {
    if (location.hash === hash) {
      render();
    } else {
      location.hash = hash;
    }
  }

  function matchRoute(hash) {
    const raw = hash.replace(/^#/, '');
    const parts = raw.split('/').filter(Boolean); // ["clients", ":id", "edit"]

    if (parts.length === 0 || parts[0] === 'dashboard') return { name: 'dashboard' };

    if (parts[0] === 'clients') {
      if (parts.length === 1) return { name: 'clients:list' };
      if (parts[1] === 'new') return { name: 'clients:new' };
      if (parts.length === 2) return { name: 'clients:view', params: { id: parts[1] } };
      if (parts.length === 3 && parts[2] === 'edit') return { name: 'clients:edit', params: { id: parts[1] } };
    }

    if (parts[0] === 'projects') {
      if (parts.length === 1) return { name: 'projects:list' };
      if (parts[1] === 'new') return { name: 'projects:new' };
      if (parts.length === 2) return { name: 'projects:view', params: { id: parts[1] } };
      if (parts.length === 3 && parts[2] === 'edit') return { name: 'projects:edit', params: { id: parts[1] } };
    }

    if (parts[0] === 'settings') return { name: 'settings' };

    return { name: 'notfound' };
  }

  function setActiveNav(hash) {
    const links = document.querySelectorAll('.nav__link');
    links.forEach(a => {
      const href = a.getAttribute('href');
      const isActive = hash.startsWith(href);
      a.classList.toggle('active', isActive);
    });
  }

  // -------------------- Renderers --------------------
  function render() {
    const hash = currentHash();
    const route = matchRoute(hash);
    setActiveNav(hash);

    const root = document.getElementById(appRootId);
    if (!root) return;

    switch (route.name) {
      case 'dashboard':
        return renderDashboard(root);
      case 'clients:list':
        return renderClientsList(root);
      case 'clients:new':
        return renderClientForm(root);
      case 'clients:view':
        return renderClientProfile(root, route.params.id);
      case 'clients:edit':
        return renderClientForm(root, route.params.id);
      case 'projects:list':
        return renderProjectsList(root);
      case 'projects:new':
        return renderProjectForm(root);
      case 'projects:view':
        return renderProjectView(root, route.params.id);
      case 'projects:edit':
        return renderProjectForm(root, route.params.id);
      case 'settings':
        return renderSettings(root);
      default:
        root.innerHTML = `<div class="content"><h2>Not Found</h2></div>`;
    }
  }

  // -------------------- Pages --------------------
  function renderDashboard(root) {
    const clients = Storage.read(STORAGE_KEYS.clients, []);
    const projects = Storage.read(STORAGE_KEYS.projects, []);

    root.innerHTML = `
      <div class="page-header">
        <h2>Dashboard</h2>
        <div>
          <a class="btn" href="#clients/new">Add Client</a>
          <a class="btn primary" href="#projects/new">New Project</a>
        </div>
      </div>

      <div class="kpi">
        <div class="card">
          <div>
            <div class="badge">Clients</div>
            <div class="value">${clients.length}</div>
          </div>
          <a class="btn" href="#clients">View</a>
        </div>
        <div class="card">
          <div>
            <div class="badge">Projects</div>
            <div class="value">${projects.length}</div>
          </div>
          <a class="btn" href="#projects">View</a>
        </div>
        <div class="card">
          <div>
            <div class="badge">Active</div>
            <div class="value">${projects.filter(p => p.status === 'In Progress').length}</div>
          </div>
          <a class="btn" href="#projects">Details</a>
        </div>
      </div>

      <div class="grid two" style="margin-top:16px;">
        <div class="card">
          <h3 style="margin-top:0;">Recent Projects</h3>
          ${projects.length === 0 ? `<div class="empty-state">No projects yet.</div>` : `
            <table class="table">
              <thead><tr><th>Name</th><th>Client</th><th>Status</th><th>Timeline</th><th></th></tr></thead>
              <tbody>
                ${projects.slice(0, 5).map(p => {
                  const client = clients.find(c => c.id === p.clientId);
                  const d = daysBetween(p.startDate, p.endDate);
                  const statusClass = statusToClass(p.status);
                  return `
                    <tr>
                      <td>${escapeHtml(p.name)}</td>
                      <td>${client ? escapeHtml(client.name) : '-'}</td>
                      <td><span class="badge status ${statusClass}">${escapeHtml(p.status)}</span></td>
                      <td>${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}${d ? ` (${d} days)` : ''}</td>
                      <td><a class="btn" href="#projects/${p.id}">Open</a></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
        </div>
        <div class="card">
          <h3 style="margin-top:0;">Quick Actions</h3>
          <div class="grid two">
            <a class="btn" href="#clients/new">Create Client</a>
            <a class="btn" href="#projects/new">Create Project</a>
            <a class="btn" href="#clients">View Clients</a>
            <a class="btn" href="#settings">Settings</a>
          </div>
          <hr class="sep"/>
          <p class="text-muted">Manage clients, track project locations and durations, and keep your company profile up to date. All data is stored locally in your browser.</p>
        </div>
      </div>
    `;
  }

  function renderClientsList(root) {
    const clients = Storage.read(STORAGE_KEYS.clients, []);
    root.innerHTML = `
      <div class="page-header">
        <h2>Clients</h2>
        <a class="btn primary" href="#clients/new">Add Client</a>
      </div>
      ${clients.length === 0 ? `<div class="card empty-state">No clients yet. Click "Add Client" to begin.</div>` : `
        <div class="card">
          <table class="table">
            <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th></th></tr></thead>
            <tbody>
              ${clients.map(c => `
                <tr>
                  <td>${escapeHtml(c.name)}</td>
                  <td>${escapeHtml(c.contactPerson || '')}</td>
                  <td>${escapeHtml(c.phone || '')}</td>
                  <td>${escapeHtml(c.email || '')}</td>
                  <td>
                    <a class="btn" href="#clients/${c.id}">Profile</a>
                    <a class="btn" href="#clients/${c.id}/edit">Edit</a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  }

  function renderClientForm(root, id) {
    const isEdit = Boolean(id);
    const clients = Storage.read(STORAGE_KEYS.clients, []);
    const data = isEdit ? clients.find(c => c.id === id) : {};

    if (isEdit && !data) {
      root.innerHTML = `<div class="card">Client not found.</div>`;
      return;
    }

    root.innerHTML = `
      <div class="page-header">
        <h2>${isEdit ? 'Edit Client' : 'New Client'}</h2>
        <div>
          <a class="btn" href="#clients">Back to list</a>
        </div>
      </div>
      <form id="client-form" class="card">
        <div class="grid two">
          <div class="form-row">
            <label for="c_name">Client Name</label>
            <input id="c_name" class="input" name="name" required value="${escapeAttr(data?.name || '')}"/>
          </div>
          <div class="form-row">
            <label for="c_contact">Contact Person</label>
            <input id="c_contact" class="input" name="contactPerson" value="${escapeAttr(data?.contactPerson || '')}"/>
          </div>
          <div class="form-row">
            <label for="c_email">Email</label>
            <input id="c_email" type="email" class="input" name="email" value="${escapeAttr(data?.email || '')}"/>
          </div>
          <div class="form-row">
            <label for="c_phone">Phone</label>
            <input id="c_phone" class="input" name="phone" value="${escapeAttr(data?.phone || '')}"/>
          </div>
        </div>
        <div class="form-row">
          <label for="c_address">Address</label>
          <input id="c_address" class="input" name="address" value="${escapeAttr(data?.address || '')}"/>
        </div>
        <div class="form-row">
          <label for="c_notes">Notes</label>
          <textarea id="c_notes" class="input" name="notes" rows="3">${escapeHtml(data?.notes || '')}</textarea>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button type="submit" class="btn primary">${isEdit ? 'Save Changes' : 'Create Client'}</button>
          <a class="btn" href="#clients">Cancel</a>
        </div>
        ${isEdit ? `<input type="hidden" name="id" value="${escapeAttr(id)}"/>` : ''}
      </form>
    `;

    const form = document.getElementById('client-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      const now = new Date().toISOString();

      const all = Storage.read(STORAGE_KEYS.clients, []);
      if (isEdit) {
        const idx = all.findIndex(c => c.id === id);
        if (idx >= 0) {
          all[idx] = { ...all[idx], ...payload, updatedAt: now };
        }
        Storage.write(STORAGE_KEYS.clients, all);
        showToast('Client updated');
        navigate(`#clients/${id}`);
      } else {
        const newClient = {
          id: generateId('cli'),
          name: payload.name,
          contactPerson: payload.contactPerson || '',
          email: payload.email || '',
          phone: payload.phone || '',
          address: payload.address || '',
          notes: payload.notes || '',
          createdAt: now,
          updatedAt: now,
        };
        all.push(newClient);
        Storage.write(STORAGE_KEYS.clients, all);
        showToast('Client created');
        navigate(`#clients/${newClient.id}`);
      }
    });
  }

  function renderClientProfile(root, id) {
    const clients = Storage.read(STORAGE_KEYS.clients, []);
    const projects = Storage.read(STORAGE_KEYS.projects, []);
    const client = clients.find(c => c.id === id);
    if (!client) {
      root.innerHTML = `<div class="card">Client not found.</div>`;
      return;
    }
    const clientProjects = projects.filter(p => p.clientId === id);

    root.innerHTML = `
      <div class="page-header">
        <h2>${escapeHtml(client.name)}</h2>
        <div>
          <a class="btn" href="#clients">Back</a>
          <a class="btn primary" href="#clients/${client.id}/edit">Edit</a>
        </div>
      </div>
      <div class="grid two">
        <div class="card">
          <div class="grid two">
            <div>
              <div class="badge">Contact Person</div>
              <div>${escapeHtml(client.contactPerson || '-')}</div>
            </div>
            <div>
              <div class="badge">Phone</div>
              <div>${escapeHtml(client.phone || '-')}</div>
            </div>
            <div>
              <div class="badge">Email</div>
              <div>${escapeHtml(client.email || '-')}</div>
            </div>
            <div>
              <div class="badge">Address</div>
              <div>${escapeHtml(client.address || '-')}</div>
            </div>
          </div>
          <hr class="sep"/>
          <div>
            <div class="badge">Notes</div>
            <div>${client.notes ? escapeHtml(client.notes) : '<span class="text-muted">None</span>'}</div>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-top:0;">Projects (${clientProjects.length})</h3>
          ${clientProjects.length === 0 ? `<div class="empty-state">No projects for this client yet.</div>` : `
            <table class="table">
              <thead><tr><th>Name</th><th>Status</th><th>Timeline</th><th></th></tr></thead>
              <tbody>
                ${clientProjects.map(p => {
                  const d = daysBetween(p.startDate, p.endDate);
                  const statusClass = statusToClass(p.status);
                  return `
                    <tr>
                      <td>${escapeHtml(p.name)}</td>
                      <td><span class="badge status ${statusClass}">${escapeHtml(p.status)}</span></td>
                      <td>${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}${d ? ` (${d} days)` : ''}</td>
                      <td><a class="btn" href="#projects/${p.id}">Open</a></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
          <div style="margin-top:12px;">
            <a class="btn" href="#projects/new?clientId=${encodeURIComponent(client.id)}">New Project for ${escapeAttr(client.name)}</a>
          </div>
        </div>
      </div>
    `;
  }

  function renderProjectsList(root) {
    const clients = Storage.read(STORAGE_KEYS.clients, []);
    const projects = Storage.read(STORAGE_KEYS.projects, []);

    root.innerHTML = `
      <div class="page-header">
        <h2>Projects</h2>
        <a class="btn primary" href="#projects/new">New Project</a>
      </div>
      ${projects.length === 0 ? `<div class="card empty-state">No projects yet. Click "New Project" to begin.</div>` : `
        <div class="card">
          <table class="table">
            <thead><tr><th>Name</th><th>Client</th><th>Location</th><th>Status</th><th>Timeline</th><th></th></tr></thead>
            <tbody>
              ${projects.map(p => {
                const c = clients.find(x => x.id === p.clientId);
                const d = daysBetween(p.startDate, p.endDate);
                const statusClass = statusToClass(p.status);
                return `
                  <tr>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${c ? escapeHtml(c.name) : '-'}</td>
                    <td>${escapeHtml(p.location || '')}</td>
                    <td><span class="badge status ${statusClass}">${escapeHtml(p.status)}</span></td>
                    <td>${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}${d ? ` (${d} days)` : ''}</td>
                    <td>
                      <a class="btn" href="#projects/${p.id}">View</a>
                      <a class="btn" href="#projects/${p.id}/edit">Edit</a>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  }

  function renderProjectForm(root, id) {
    const isEdit = Boolean(id);
    const clients = Storage.read(STORAGE_KEYS.clients, []);
    const projects = Storage.read(STORAGE_KEYS.projects, []);
    const existing = isEdit ? projects.find(p => p.id === id) : null;

    if (isEdit && !existing) {
      root.innerHTML = `<div class="card">Project not found.</div>`;
      return;
    }

    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const preselectedClientId = !isEdit ? params.get('clientId') : existing?.clientId;

    root.innerHTML = `
      <div class="page-header">
        <h2>${isEdit ? 'Edit Project' : 'New Project'}</h2>
        <div>
          <a class="btn" href="#projects">Back to list</a>
        </div>
      </div>
      <form id="project-form" class="card">
        <div class="grid two">
          <div class="form-row">
            <label for="p_name">Project Name</label>
            <input id="p_name" class="input" name="name" required value="${escapeAttr(existing?.name || '')}"/>
          </div>
          <div class="form-row">
            <label for="p_client">Client</label>
            <select id="p_client" name="clientId" required>
              <option value="" ${!preselectedClientId ? 'selected' : ''} disabled>Select client</option>
              ${clients.map(c => `<option value="${escapeAttr(c.id)}" ${preselectedClientId===c.id?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label for="p_location">Location</label>
            <input id="p_location" class="input" name="location" value="${escapeAttr(existing?.location || '')}" placeholder="e.g., East Legon, Accra"/>
          </div>
          <div class="form-row">
            <label for="p_status">Status</label>
            <select id="p_status" name="status">
              ${['Planned','In Progress','Completed'].map(s => `<option ${existing?.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label for="p_start">Start Date</label>
            <input id="p_start" type="date" class="input" name="startDate" value="${escapeAttr(existing?.startDate || '')}"/>
          </div>
          <div class="form-row">
            <label for="p_end">End Date</label>
            <input id="p_end" type="date" class="input" name="endDate" value="${escapeAttr(existing?.endDate || '')}"/>
          </div>
          <div class="form-row">
            <label for="p_budget">Contract Value (Budget)</label>
            <input id="p_budget" type="number" class="input" name="budget" value="${existing?.budget ?? ''}" placeholder="e.g., 500000"/>
          </div>
          <div class="form-row">
            <label>Duration</label>
            <input id="p_duration" class="input" disabled value="${existing?.startDate && existing?.endDate ? daysBetween(existing.startDate, existing.endDate) + ' days' : ''}"/>
          </div>
        </div>
        <div class="form-row">
          <label for="p_desc">Description / Contract Details</label>
          <textarea id="p_desc" class="input" name="description" rows="4">${escapeHtml(existing?.description || '')}</textarea>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button type="submit" class="btn primary">${isEdit ? 'Save Changes' : 'Create Project'}</button>
          <a class="btn" href="#projects">Cancel</a>
        </div>
        ${isEdit ? `<input type="hidden" name="id" value="${escapeAttr(id)}"/>` : ''}
      </form>
    `;

    const form = document.getElementById('project-form');

    const updateDuration = () => {
      const start = form.querySelector('#p_start').value;
      const end = form.querySelector('#p_end').value;
      const target = form.querySelector('#p_duration');
      const d = daysBetween(start, end);
      target.value = d ? `${d} days` : '';
    };

    form.addEventListener('input', (e) => {
      if (e.target && (e.target.id === 'p_start' || e.target.id === 'p_end')) updateDuration();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      const now = new Date().toISOString();

      const all = Storage.read(STORAGE_KEYS.projects, []);
      if (isEdit) {
        const idx = all.findIndex(p => p.id === id);
        if (idx >= 0) {
          const updated = {
            ...all[idx],
            ...payload,
            budget: payload.budget !== '' ? Number(payload.budget) : null,
            updatedAt: now,
          };
          all[idx] = updated;
        }
        Storage.write(STORAGE_KEYS.projects, all);
        showToast('Project updated');
        navigate(`#projects/${id}`);
      } else {
        const newProject = {
          id: generateId('prj'),
          name: payload.name,
          clientId: payload.clientId,
          location: payload.location || '',
          startDate: payload.startDate || '',
          endDate: payload.endDate || '',
          status: payload.status || 'Planned',
          budget: payload.budget !== '' ? Number(payload.budget) : null,
          description: payload.description || '',
          createdAt: now,
          updatedAt: now,
        };
        all.push(newProject);
        Storage.write(STORAGE_KEYS.projects, all);
        showToast('Project created');
        navigate(`#projects/${newProject.id}`);
      }
    });
  }

  function renderProjectView(root, id) {
    const clients = Storage.read(STORAGE_KEYS.clients, []);
    const projects = Storage.read(STORAGE_KEYS.projects, []);
    const project = projects.find(p => p.id === id);
    if (!project) { root.innerHTML = `<div class="card">Project not found.</div>`; return; }
    const client = clients.find(c => c.id === project.clientId);
    const d = daysBetween(project.startDate, project.endDate);

    root.innerHTML = `
      <div class="page-header">
        <h2>${escapeHtml(project.name)}</h2>
        <div>
          <a class="btn" href="#projects">Back</a>
          <a class="btn primary" href="#projects/${project.id}/edit">Edit</a>
        </div>
      </div>
      <div class="grid two">
        <div class="card">
          <div class="grid two">
            <div>
              <div class="badge">Client</div>
              <div>${client ? `<a href="#clients/${client.id}">${escapeHtml(client.name)}</a>` : '-'}</div>
            </div>
            <div>
              <div class="badge">Status</div>
              <div><span class="badge status ${statusToClass(project.status)}">${escapeHtml(project.status)}</span></div>
            </div>
            <div>
              <div class="badge">Timeline</div>
              <div>${fmtDate(project.startDate)} → ${fmtDate(project.endDate)}${d ? ` (${d} days)` : ''}</div>
            </div>
            <div>
              <div class="badge">Contract Value</div>
              <div>${currency(project.budget)}</div>
            </div>
            <div>
              <div class="badge">Location</div>
              <div>${escapeHtml(project.location || '-')} ${project.location ? ` • <a target="_blank" href="https://www.google.com/maps?q=${encodeURIComponent(project.location)}">Open in Maps</a>` : ''}</div>
            </div>
          </div>
          <hr class="sep"/>
          <div>
            <div class="badge">Contract Details</div>
            <div>${project.description ? escapeHtml(project.description) : '<span class="text-muted">No details</span>'}</div>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-top:0;">Actions</h3>
          <div class="grid two">
            <a class="btn" href="#projects/${project.id}/edit">Edit Project</a>
            ${client ? `<a class="btn" href="#clients/${client.id}">View Client</a>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function renderSettings(root) {
    const settings = Storage.read(STORAGE_KEYS.settings, { companyName: 'Koffman Investment Limited', compactMode: false, accent: '#e10600' });

    root.innerHTML = `
      <div class="page-header">
        <h2>Settings</h2>
        <span class="badge">Local only</span>
      </div>
      <div class="grid two">
        <form id="settings-form" class="card">
          <h3 style="margin-top:0;">Company Profile</h3>
          <div class="form-row">
            <label for="s_company">Company Name</label>
            <input id="s_company" class="input" name="companyName" value="${escapeAttr(settings.companyName || '')}"/>
          </div>
          <div class="form-row">
            <label for="s_accent">Accent Color</label>
            <input id="s_accent" type="color" name="accent" value="${escapeAttr(settings.accent || '#e10600')}"/>
          </div>
          <div class="form-row" style="display:flex; align-items:center; gap:8px;">
            <input id="s_compact" type="checkbox" name="compactMode" ${settings.compactMode ? 'checked' : ''}/>
            <label for="s_compact">Compact mode</label>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn primary" type="submit">Save Settings</button>
          </div>
        </form>

        <div class="card">
          <h3 style="margin-top:0;">Data Management</h3>
          <div style="display:flex; gap:8px; flex-wrap: wrap;">
            <button id="btn-export" class="btn">Export Data</button>
            <label class="btn" for="import-file" style="cursor:pointer;">Import Data</label>
            <input id="import-file" type="file" accept="application/json" style="display:none;"/>
            <button id="btn-reset" class="btn" style="color:var(--brand-red-700); border-color: var(--brand-red-700);">Reset to Sample</button>
            <button id="btn-clear" class="btn" style="color:var(--brand-red-700); border-color: var(--brand-red-700);">Clear All</button>
          </div>
          <p class="text-muted">Export creates a JSON backup of clients, projects, and settings.</p>
        </div>
      </div>
    `;

    const form = document.getElementById('settings-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      const compact = document.getElementById('s_compact').checked;
      const newSettings = { ...settings, ...payload, compactMode: compact };
      Storage.write(STORAGE_KEYS.settings, newSettings);
      document.documentElement.style.setProperty('--brand-red-600', newSettings.accent || '#e10600');
      showToast('Settings saved');
    });

    document.getElementById('btn-export').addEventListener('click', () => {
      const bundle = {
        clients: Storage.read(STORAGE_KEYS.clients, []),
        projects: Storage.read(STORAGE_KEYS.projects, []),
        settings: Storage.read(STORAGE_KEYS.settings, {}),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'koffman-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (data.clients && data.projects && data.settings) {
            Storage.write(STORAGE_KEYS.clients, data.clients);
            Storage.write(STORAGE_KEYS.projects, data.projects);
            Storage.write(STORAGE_KEYS.settings, data.settings);
            showToast('Import complete');
            navigate('#dashboard');
          } else {
            alert('Invalid backup file.');
          }
        } catch (err) {
          alert('Import failed.');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      if (!confirm('Reset data to sample? This will overwrite current data.')) return;
      localStorage.removeItem(STORAGE_KEYS.clients);
      localStorage.removeItem(STORAGE_KEYS.projects);
      Storage.seedIfEmpty();
      showToast('Sample data loaded');
      navigate('#dashboard');
    });

    document.getElementById('btn-clear').addEventListener('click', () => {
      if (!confirm('Clear all data? This cannot be undone.')) return;
      localStorage.removeItem(STORAGE_KEYS.clients);
      localStorage.removeItem(STORAGE_KEYS.projects);
      localStorage.removeItem(STORAGE_KEYS.settings);
      showToast('All data cleared');
      navigate('#dashboard');
    });
  }

  // -------------------- Helpers --------------------
  function statusToClass(status) {
    switch (status) {
      case 'Planned': return 'planned';
      case 'In Progress': return 'progress';
      case 'Completed': return 'completed';
      default: return '';
    }
  }

  function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
  function escapeAttr(text) { return escapeHtml(text); }

  function applyUiState() {
    const ui = Storage.read(STORAGE_KEYS.ui, { sidebarCollapsed: false });
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed', Boolean(ui.sidebarCollapsed));
  }

  function initShell() {
    const toggle = document.getElementById('menuToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const ui = Storage.read(STORAGE_KEYS.ui, { sidebarCollapsed: false });
        ui.sidebarCollapsed = !ui.sidebarCollapsed;
        Storage.write(STORAGE_KEYS.ui, ui);
        applyUiState();
      });
    }
  }

  // -------------------- Init --------------------
  function bootstrap() {
    Storage.seedIfEmpty();
    applyUiState();
    initShell();
    window.addEventListener('hashchange', render);
    if (!location.hash) {
      navigate('#dashboard');
    } else {
      render();
    }
    // Apply accent color from settings
    const s = Storage.read(STORAGE_KEYS.settings, {});
    if (s.accent) document.documentElement.style.setProperty('--brand-red-600', s.accent);
  }

  // Start app
  document.addEventListener('DOMContentLoaded', bootstrap);
})();
