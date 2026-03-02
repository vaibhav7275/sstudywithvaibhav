const STORAGE_KEY = "swv-simple-data-v1";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        folders: [
          {
            id: "all",
            name: "All documents",
            description: "Everything in one place.",
            isSystem: true,
          },
          {
            id: "physics",
            name: "Physics",
            description: "Formulas, notes, and question banks.",
            isSystem: false,
          },
          {
            id: "maths",
            name: "Mathematics",
            description: "Important questions and tricks.",
            isSystem: false,
          },
        ],
        documents: [],
        activeFolderId: "all",
      };
    }
    const parsed = JSON.parse(raw);
    parsed.activeFolderId = parsed.activeFolderId || "all";
    return parsed;
  } catch {
    return {
      folders: [
        {
          id: "all",
          name: "All documents",
          description: "Everything in one place.",
          isSystem: true,
        },
      ],
      documents: [],
      activeFolderId: "all",
    };
  }
}

function saveData(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      folders: state.folders,
      documents: state.documents,
      activeFolderId: state.activeFolderId,
    })
  );
}

const state = loadData();

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderFolders() {
  const list = document.getElementById("folder-list");
  list.innerHTML = "";

  state.folders.forEach((folder) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "folder-item";
    item.dataset.id = folder.id;
    if (folder.id === state.activeFolderId) item.classList.add("active");

    const main = document.createElement("div");
    main.className = "folder-item-main";

    const badge = document.createElement("div");
    badge.className = "folder-badge";
    badge.textContent = folder.name.charAt(0).toUpperCase();

    const labels = document.createElement("div");
    labels.className = "folder-labels";

    const nameEl = document.createElement("div");
    nameEl.className = "folder-name";
    nameEl.textContent = folder.name;
    labels.appendChild(nameEl);

    if (folder.description && folder.id !== "all") {
      const descEl = document.createElement("div");
      descEl.className = "folder-desc";
      descEl.textContent = folder.description;
      labels.appendChild(descEl);
    }

    main.appendChild(badge);
    main.appendChild(labels);

    const countEl = document.createElement("div");
    countEl.className = "folder-count";
    const count =
      folder.id === "all"
        ? state.documents.length
        : state.documents.filter((d) => d.folderId === folder.id).length;
    countEl.textContent = count;

    item.appendChild(main);
    item.appendChild(countEl);

    item.addEventListener("click", () => {
      state.activeFolderId = folder.id;
      updateFolderHeader();
      renderFolders();
      renderDocuments();
      saveData(state);
    });

    list.appendChild(item);
  });
}

function updateFolderHeader() {
  const headerName = document.getElementById("current-folder-name");
  const headerDesc = document.getElementById("current-folder-desc");
  const activeFolder =
    state.folders.find((f) => f.id === state.activeFolderId) ||
    state.folders[0];

  headerName.textContent = activeFolder.name;
  if (activeFolder.id === "all") {
    headerDesc.textContent =
      "Everything you save will appear here. Filter by folder on the left.";
  } else {
    headerDesc.textContent =
      activeFolder.description || "Documents in this folder are shown below.";
  }
}

function renderDocuments() {
  const grid = document.getElementById("doc-grid");
  grid.innerHTML = "";

  const search = document
    .getElementById("search-input")
    .value.trim()
    .toLowerCase();

  let docs = state.documents.slice();
  if (state.activeFolderId !== "all") {
    docs = docs.filter((d) => d.folderId === state.activeFolderId);
  }

  if (search) {
    docs = docs.filter((d) => {
      const haystack = (
        (d.title || "") +
        " " +
        (d.notes || "") +
        " " +
        (d.tag || "")
      ).toLowerCase();
      return haystack.includes(search);
    });
  }

  if (!docs.length) {
    const empty = document.createElement("div");
    empty.className = "doc-empty";
    empty.textContent =
      "No documents yet. Use “Add document” to save your first PDF or link.";
    grid.appendChild(empty);
    return;
  }

  docs.forEach((doc) => {
    const card = document.createElement("article");
    card.className = "doc-card";

    const titleRow = document.createElement("div");
    titleRow.className = "doc-title-row";

    const titleEl = document.createElement("h3");
    titleEl.className = "doc-title";
    titleEl.textContent = doc.title;

    const folderChip = document.createElement("div");
    folderChip.className = "doc-folder-chip";
    const folder =
      state.folders.find((f) => f.id === doc.folderId) || state.folders[0];
    folderChip.textContent = folder ? folder.name : "Unknown";

    titleRow.appendChild(titleEl);
    titleRow.appendChild(folderChip);
    card.appendChild(titleRow);

    if (doc.pdfName) {
      const pdfEl = document.createElement("div");
      pdfEl.className = "doc-notes";
      pdfEl.textContent = `PDF: ${doc.pdfName}`;
      card.appendChild(pdfEl);
    }

    if (doc.notes) {
      const notesEl = document.createElement("div");
      notesEl.className = "doc-notes";
      notesEl.textContent = doc.notes;
      card.appendChild(notesEl);
    }

    const meta = document.createElement("div");
    meta.className = "doc-meta";

    if (doc.tag) {
      const tagEl = document.createElement("span");
      tagEl.className = "doc-tag";
      tagEl.textContent = doc.tag;
      meta.appendChild(tagEl);
    }

    const dateText = formatDate(doc.createdAt);
    if (dateText) {
      const dateEl = document.createElement("span");
      dateEl.textContent = `Saved · ${dateText}`;
      meta.appendChild(dateEl);
    }

    if (meta.childNodes.length) {
      card.appendChild(meta);
    }

    const actions = document.createElement("div");
    actions.className = "doc-actions";

    const leftActions = document.createElement("div");

    if (doc.pdfData || doc.link) {
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "open-link-btn";
      openBtn.textContent = "Open";
      openBtn.addEventListener("click", () => {
        if (doc.pdfData) {
          window.open(doc.pdfData, "_blank", "noopener");
        } else if (doc.link) {
          window.open(doc.link, "_blank", "noopener");
        }
      });
      leftActions.appendChild(openBtn);
    }

    actions.appendChild(leftActions);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "doc-delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.title = "Delete document";
    deleteBtn.addEventListener("click", () => {
      state.documents = state.documents.filter((d) => d.id !== doc.id);
      saveData(state);
      renderFolders();
      renderDocuments();
    });

    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    grid.appendChild(card);
  });
}

function setupFolderDialog() {
  const dialog = document.getElementById("folder-dialog");
  const form = document.getElementById("folder-form");
  const nameInput = document.getElementById("folder-name-input");
  const descInput = document.getElementById("folder-desc-input");
  const triggerBtn = document.getElementById("add-folder-btn");

  triggerBtn.addEventListener("click", () => {
    nameInput.value = "";
    descInput.value = "";
    dialog.showModal();
    nameInput.focus();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const desc = descInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }

    const id =
      name.toLowerCase().replace(/\s+/g, "-").slice(0, 20) +
      "-" +
      Math.random().toString(36).slice(2, 6);

    state.folders.push({
      id,
      name,
      description: desc || "",
      isSystem: false,
    });
    saveData(state);
    renderFolders();
    dialog.close();
  });

  form.addEventListener("reset", () => {
    dialog.close();
  });
}

function populateFolderSelect() {
  const select = document.getElementById("doc-folder-select");
  select.innerHTML = "";

  state.folders
    .filter((f) => f.id !== "all")
    .forEach((folder) => {
      const opt = document.createElement("option");
      opt.value = folder.id;
      opt.textContent = folder.name;
      select.appendChild(opt);
    });
}

function setupDocDialog() {
  const dialog = document.getElementById("doc-dialog");
  const form = document.getElementById("doc-form");
  const titleInput = document.getElementById("doc-title-input");
  const folderSelect = document.getElementById("doc-folder-select");
  const pdfInput = document.getElementById("doc-pdf-input");
  const linkInput = document.getElementById("doc-link-input");
  const notesInput = document.getElementById("doc-notes-input");
  const tagInput = document.getElementById("doc-tag-input");
  const triggerBtn = document.getElementById("add-doc-btn");

  triggerBtn.addEventListener("click", () => {
    populateFolderSelect();
    const activeNonAll = state.activeFolderId !== "all";
    if (
      activeNonAll &&
      Array.from(folderSelect.options).some(
        (opt) => opt.value === state.activeFolderId
      )
    ) {
      folderSelect.value = state.activeFolderId;
    } else if (folderSelect.options.length) {
      folderSelect.value = folderSelect.options[0].value;
    }

    titleInput.value = "";
    pdfInput.value = "";
    linkInput.value = "";
    notesInput.value = "";
    tagInput.value = "";

    dialog.showModal();
    titleInput.focus();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const folderId = folderSelect.value;
    const link = linkInput.value.trim();
    const notes = notesInput.value.trim();
    const tag = tagInput.value.trim();
    const file = pdfInput.files && pdfInput.files[0];

    if (!title || !folderId) return;

    const createAndSave = (pdfName = "", pdfData = "") => {
      const doc = {
        id:
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).slice(2, 6),
        title,
        folderId,
        link: link || "",
        pdfName,
        pdfData,
        notes: notes || "",
        tag: tag || "",
        createdAt: new Date().toISOString(),
      };
      state.documents.unshift(doc);
      saveData(state);
      renderFolders();
      renderDocuments();
      dialog.close();
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          createAndSave(file.name, result);
        } else {
          createAndSave(file.name, "");
        }
      };
      reader.readAsDataURL(file);
    } else {
      createAndSave();
    }
  });

  form.addEventListener("reset", () => {
    dialog.close();
  });
}

function setupSearch() {
  const input = document.getElementById("search-input");
  input.addEventListener("input", () => {
    renderDocuments();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateFolderHeader();
  renderFolders();
  renderDocuments();
  setupFolderDialog();
  setupDocDialog();
  setupSearch();
});

