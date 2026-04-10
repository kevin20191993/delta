(function () {
  var QUOTATIONS = [];
  var USERS = [];
  var mutationQueued = false;
  var lastUsersFormKey = '';

  function isUsersPage() {
    return window.location.pathname.indexOf('/cotizador/users') !== -1;
  }

  function isQuotationsIndexPage() {
    return window.location.pathname === '/cotizador/' || window.location.pathname === '/cotizador';
  }

  function getSessionUser() {
    var token = localStorage.getItem('kp-cotizador-token');
    if (!token) return null;
    try {
      var payload = JSON.parse(atob(token.split('.')[1] || ''));
      return {
        username: String(payload.username || ''),
        fullName: payload.fullName ? String(payload.fullName) : '',
        jobTitle: payload.jobTitle ? String(payload.jobTitle) : '',
        role: String(payload.role || ''),
        canEditAllQuotations: Boolean(payload.canEditAllQuotations)
      };
    } catch {
      return null;
    }
  }

  function ensureSessionBadge() {
    var sessionUser = getSessionUser();
    if (!sessionUser) return;

    var headerActions = Array.from(document.querySelectorAll('header > div, header div')).find(function (node) {
      return node.querySelector && node.querySelector('button') && /Cotizaciones|Usuarios|Nueva cotización/.test(node.textContent || '');
    });

    if (!headerActions || headerActions.querySelector('[data-hotfix-session-badge]')) return;

    var buttonRow = Array.from(headerActions.children).find(function (child) {
      return child.querySelector && child.querySelector('button');
    });

    if (!buttonRow) return;

    var badge = document.createElement('div');
    badge.dataset.hotfixSessionBadge = '1';
    badge.className = 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-right';
    badge.innerHTML =
      '<p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Sesión activa</p>' +
      '<p class="text-sm font-bold text-ink">' + (sessionUser.fullName || 'Nombre no configurado') + '</p>' +
      '<p class="text-xs text-slate">' + (sessionUser.jobTitle || 'Puesto no configurado') + '</p>';

    if (buttonRow.classList && !buttonRow.classList.contains('justify-end')) {
      buttonRow.classList.add('justify-end');
    }
    if (buttonRow.classList && !buttonRow.classList.contains('flex-wrap')) {
      buttonRow.classList.add('flex-wrap');
    }

    buttonRow.insertBefore(badge, buttonRow.firstChild);
  }

  function formatShortDate(value) {
    if (!value) return '-';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(value) {
    if (!value) return '-';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function normalizeQuotations(data) {
    var list = Array.isArray(data) ? data : data && Array.isArray(data.quotations) ? data.quotations : [];
    return list.map(function (entry) {
      var quotation = entry.quotation || entry;
      return {
        id: quotation.id || entry.id,
        folio: quotation.folio || entry.folio,
        createdBy: quotation.createdBy || entry.createdBy || entry.created_by || '',
        salespersonFullName: quotation.salespersonFullName || quotation.salesperson_full_name || entry.salespersonFullName || entry.salesperson_full_name || '',
        responsibleSignatureName: quotation.responsibleSignatureName || quotation.responsible_signature_name || entry.responsibleSignatureName || entry.responsible_signature_name || '',
        quotationDate: quotation.quotationDate || quotation.quotation_date || entry.quotationDate || entry.quotation_date || '',
        createdAt: quotation.createdAt || quotation.created_at || entry.createdAt || entry.created_at || ''
      };
    });
  }

  function normalizeUsers(data) {
    var list = data && Array.isArray(data.users) ? data.users : [];
    return list.map(function (user) {
      return {
        username: user.username,
        canEditAllQuotations: Boolean(user.canEditAllQuotations)
      };
    });
  }

  function canEditQuotation(quotation) {
    var sessionUser = getSessionUser();
    if (!sessionUser) return false;
    var username = (sessionUser.username || '').toLowerCase();
    var fullName = (sessionUser.fullName || '').toLowerCase();
    var createdBy = (quotation.createdBy || '').toLowerCase();
    var salesperson = (quotation.salespersonFullName || '').toLowerCase();
    var signature = (quotation.responsibleSignatureName || '').toLowerCase();

    return Boolean(
      sessionUser.canEditAllQuotations ||
      (createdBy && createdBy === username) ||
      (salesperson && (salesperson === fullName || salesperson === username)) ||
      (signature && (signature === fullName || signature === username))
    );
  }

  function scheduleEnhance() {
    if (mutationQueued) return;
    mutationQueued = true;
    requestAnimationFrame(function () {
      mutationQueued = false;
      ensureSessionBadge();
      enhanceQuotationList();
      enhanceUsersPage();
    });
  }

  function enhanceQuotationList() {
    if (!isQuotationsIndexPage()) return;

    var table = document.querySelector('table');
    if (!table || !QUOTATIONS.length) return;

    var headerRows = table.querySelectorAll('thead tr');
    if (headerRows[0]) {
      var dateHeader = headerRows[0].children[3];
      if (dateHeader) {
        dateHeader.textContent = 'Fechas';
      }
    }
    if (headerRows[1]) {
      var filterInput = headerRows[1].children[3] && headerRows[1].children[3].querySelector('input');
      if (filterInput) {
        filterInput.placeholder = 'Filtrar fechas';
      }
    }

    table.querySelectorAll('tbody tr').forEach(function (row) {
      var folioCell = row.children[0];
      if (!folioCell) return;
      var folio = (folioCell.textContent || '').trim();
      var quotation = QUOTATIONS.find(function (item) { return item.folio === folio; });
      if (!quotation) return;

      var dateCell = row.children[3];
      if (dateCell && !dateCell.dataset.hotfixDates) {
        dateCell.dataset.hotfixDates = '1';
        dateCell.innerHTML =
          '<div style="display:flex;flex-direction:column;gap:2px">' +
          '<span><strong>Captura:</strong> ' + formatShortDate(quotation.quotationDate) + '</span>' +
          '<span><strong>Creación:</strong> ' + formatDateTime(quotation.createdAt) + '</span>' +
          '</div>';
      }

      if (!canEditQuotation(quotation)) {
        var editButton = row.querySelector('button[title="Abrir en editor"]');
        if (editButton && !row.querySelector('[data-hotfix-readonly]')) {
          var readonlyTag = document.createElement('span');
          readonlyTag.dataset.hotfixReadonly = '1';
          readonlyTag.className = 'rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-400';
          readonlyTag.textContent = 'Solo lectura';
          editButton.replaceWith(readonlyTag);
        }
        var statusSelect = row.querySelector('select');
        if (statusSelect) {
          statusSelect.disabled = true;
          statusSelect.title = 'Solo el creador o un usuario con permiso global puede editar';
        }
      }
    });
  }

  function ensurePermissionCheckbox() {
    if (!isUsersPage()) return null;

    var roleSelect = Array.from(document.querySelectorAll('select')).find(function (select) {
      return Array.from(select.options).some(function (option) { return option.value === 'viewer'; });
    });
    if (!roleSelect) return null;

    var existing = document.getElementById('hotfix-can-edit-all');
    if (existing) return existing;

    var wrapper = document.createElement('label');
    wrapper.className = 'flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink';
    wrapper.innerHTML = '<input id="hotfix-can-edit-all" type="checkbox" checked><span>Puede editar todas las cotizaciones</span>';

    var roleLabel = roleSelect.closest('label');
    if (roleLabel && roleLabel.parentElement) {
      roleLabel.parentElement.insertBefore(wrapper, roleLabel.nextSibling);
    }

    var checkbox = document.getElementById('hotfix-can-edit-all');
    if (checkbox) {
      checkbox.addEventListener('change', function () {
        checkbox.dataset.userTouched = '1';
      });
    }

    return checkbox;
  }

  function enhanceUsersPage() {
    if (!isUsersPage()) return;

    var checkbox = ensurePermissionCheckbox();
    if (!checkbox) return;

    var heading = Array.from(document.querySelectorAll('h2')).find(function (node) {
      return /Editar usuario|Crear usuario/.test(node.textContent || '');
    });
    var usernameInput = Array.from(document.querySelectorAll('input')).find(function (input) {
      return input.closest('label') && /Usuario/.test(input.closest('label').textContent || '');
    });

    if (heading && usernameInput) {
      var formKey = (/Crear usuario/.test(heading.textContent || '') ? 'create' : 'edit') + ':' + usernameInput.value;
      if (formKey !== lastUsersFormKey) {
        lastUsersFormKey = formKey;
        delete checkbox.dataset.userTouched;

        if (/Crear usuario/.test(heading.textContent || '')) {
          checkbox.checked = true;
        } else {
          var matched = USERS.find(function (user) { return user.username === usernameInput.value; });
          if (matched) {
            checkbox.checked = matched.canEditAllQuotations;
          }
        }
      }
    }

    var table = document.querySelector('table');
    if (!table || !USERS.length) return;

    var headRow = table.querySelector('thead tr');
    if (headRow && !headRow.querySelector('[data-hotfix-permission-header]')) {
      var header = document.createElement('th');
      header.dataset.hotfixPermissionHeader = '1';
      header.className = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
      header.textContent = 'Permiso cotizaciones';
      var statusHeader = Array.from(headRow.children).find(function (cell) { return /Estado/.test(cell.textContent || ''); });
      if (statusHeader) {
        headRow.insertBefore(header, statusHeader);
      }
    }

    table.querySelectorAll('tbody tr').forEach(function (row) {
      var usernameCell = row.children[0];
      if (!usernameCell || row.querySelector('[data-hotfix-permission-cell]')) return;
      var username = (usernameCell.textContent || '').trim();
      var user = USERS.find(function (entry) { return entry.username === username; });
      if (!user) return;

      var cell = document.createElement('td');
      cell.dataset.hotfixPermissionCell = '1';
      cell.className = 'px-4 py-3 text-slate-500';
      cell.textContent = user.canEditAllQuotations ? 'Puede editar todas' : 'Solo propias';
      var statusCell = row.children[row.children.length - 2];
      if (statusCell) {
        row.insertBefore(cell, statusCell);
      }
    });
  }

  var originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input && input.url ? input.url : '';
    var method = String((init && init.method) || 'GET').toUpperCase();

    if (/\/api\/users(?:\/\d+)?$/.test(url) && (method === 'POST' || method === 'PUT') && init && typeof init.body === 'string') {
      try {
        var payload = JSON.parse(init.body);
        var permissionCheckbox = document.getElementById('hotfix-can-edit-all');
        if (permissionCheckbox) {
          payload.canEditAllQuotations = Boolean(permissionCheckbox.checked);
          init = Object.assign({}, init, { body: JSON.stringify(payload) });
        }
      } catch {
        // ignore malformed payloads
      }
    }

    return originalFetch(input, init).then(function (response) {
      if (/\/api\/quotations(?:\?|$)/.test(url) && method === 'GET') {
        response.clone().json().then(function (data) {
          QUOTATIONS = normalizeQuotations(data);
          scheduleEnhance();
        }).catch(function () {});
      }

      if (/\/api\/users(?:\?|$)/.test(url) && method === 'GET') {
        response.clone().json().then(function (data) {
          USERS = normalizeUsers(data);
          scheduleEnhance();
        }).catch(function () {});
      }

      if (/\/api\/quotations\/[^/]+$/.test(url) && method === 'GET' && window.location.pathname.indexOf('/cotizador/editor') !== -1) {
        response.clone().json().then(function (data) {
          var quotation = data && data.quotation;
          if (!quotation) return;
          if (!canEditQuotation({
            createdBy: quotation.createdBy || quotation.created_by || '',
            salespersonFullName: quotation.salespersonFullName || quotation.salesperson_full_name || '',
            responsibleSignatureName: quotation.responsibleSignatureName || quotation.responsible_signature_name || ''
          })) {
            localStorage.removeItem('kp-cotizador-id-v1');
            alert('No tienes permiso para editar esta cotización.');
            window.location.href = '/cotizador/';
          }
        }).catch(function () {});
      }

      return response;
    });
  };

  var observer = new MutationObserver(scheduleEnhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scheduleEnhance();
})();
