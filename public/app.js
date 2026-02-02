// State
let services = [];
let categories = [];
let editingServiceId = null;

// DOM Elements
const modal = document.getElementById('modal');
const addServiceBtn = document.getElementById('addServiceBtn');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const serviceForm = document.getElementById('serviceForm');
const servicesContainer = document.getElementById('servicesContainer');
const searchInput = document.getElementById('searchInput');
const modalTitle = document.getElementById('modalTitle');
const iconPicker = document.getElementById('iconPicker');

let collapsedCategories = JSON.parse(localStorage.getItem('collapsedCategories')) || [];

const iconSet = [
    { label: 'pfSense', icon: 'https://cdn.simpleicons.org/pfsense' },
    { label: 'Pi-hole', icon: 'https://cdn.simpleicons.org/pihole' },
    { label: 'Nextcloud', icon: 'https://cdn.simpleicons.org/nextcloud' },
    { label: 'Uptime Kuma', icon: 'https://cdn.simpleicons.org/uptimekuma' },
    { label: 'Jellyfin', icon: 'https://cdn.simpleicons.org/jellyfin' },
    { label: 'Plex', icon: '🎞️' },
    { label: 'Grafana', icon: '📊' },
    { label: 'Prometheus', icon: '📡' },
    { label: 'Pi-hole', icon: '🛡️' },
    { label: 'Router', icon: '🌐' },
    { label: 'Switch', icon: '🔀' },
    { label: 'NAS', icon: '💾' },
    { label: 'Storage', icon: '🗄️' },
    { label: 'Docker', icon: '🐳' },
    { label: 'Kubernetes', icon: '☸️' },
    { label: 'Git', icon: '🧰' },
    { label: 'Home Assistant', icon: '🏠' },
    { label: 'Immich', icon: '🖼️' },
    { label: 'Paperless', icon: '📄' },
    { label: 'Syncthing', icon: '🔄' },
    { label: 'Vaultwarden', icon: '🔐' },
    { label: 'Nginx Proxy', icon: '🧭' },
    { label: 'Portainer', icon: '⚓' },
    { label: 'Proxmox', icon: '🧱' },
    { label: 'TrueNAS', icon: '🧊' },
    { label: 'Unifi', icon: '📶' },
    { label: 'Wi‑Fi', icon: '📡' },
    { label: 'Backup', icon: '🧷' },
    { label: 'Camera', icon: '📷' },
    { label: 'Security', icon: '🚨' },
    { label: 'Downloads', icon: '⬇️' }
];

// Initialize
async function init() {
    await loadServices();
    renderIconPicker();
    renderServices();
    setupEventListeners();
}

// Load services from backend
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        const data = await response.json();
        services = data.services || [];
        categories = data.categories || [];
        updateCategoriesDatalist();
    } catch (error) {
        console.error('Failed to load services:', error);
        showEmptyState();
    }
}

// Save services to backend
async function saveServices() {
    try {
        await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ services, categories })
        });
    } catch (error) {
        console.error('Failed to save services:', error);
        alert('Failed to save services');
    }
}

// Update categories datalist
function updateCategoriesDatalist() {
    const datalist = document.getElementById('categories');
    datalist.innerHTML = categories.map(cat => `<option value="${cat}">`).join('');
}

function renderIconPicker(selectedIcon = '') {
    if (!iconPicker) return;
    iconPicker.innerHTML = '';

    iconSet.forEach(({ label, icon }) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'icon-item' + (selectedIcon === icon ? ' selected' : '');
        button.dataset.icon = icon;
        button.title = label;
        if (icon.startsWith('http') || icon.startsWith('/')) {
            const img = document.createElement('img');
            img.src = icon;
            img.alt = label;
            button.appendChild(img);
        } else {
            button.textContent = icon;
        }
        button.addEventListener('click', () => {
            document.getElementById('serviceIcon').value = icon;
            setSelectedIcon(icon);
        });
        iconPicker.appendChild(button);
    });
}

function setSelectedIcon(icon) {
    const items = iconPicker.querySelectorAll('.icon-item');
    items.forEach(item => {
        item.classList.toggle('selected', item.dataset.icon === icon);
    });
}

// Render services
function renderServices(filter = '') {
    servicesContainer.innerHTML = '';
    
    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(filter.toLowerCase()) ||
        service.category.toLowerCase().includes(filter.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(filter.toLowerCase()))
    );

    if (filteredServices.length === 0) {
        showEmptyState(filter);
        return;
    }

    // Group by category
    const grouped = filteredServices.reduce((acc, service) => {
        if (!acc[service.category]) {
            acc[service.category] = [];
        }
        acc[service.category].push(service);
        return acc;
    }, {});

    // Render each category (respect stored order)
    const groupedCategories = Object.keys(grouped);
    const orderedCategories = [
        ...categories.filter(cat => groupedCategories.includes(cat)),
        ...groupedCategories.filter(cat => !categories.includes(cat)).sort()
    ];

    orderedCategories.forEach(category => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.dataset.category = category;
        section.setAttribute('draggable', 'true');
        
        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = category;
        title.style.cursor = 'pointer';
        title.title = 'Click to collapse/expand';
        
        const grid = document.createElement('div');
        grid.className = 'services-grid';
        grid.dataset.category = category;

        grouped[category].forEach(service => {
            const card = createServiceCard(service);
            grid.appendChild(card);
        });

        // Restore collapsed state
        if (collapsedCategories.includes(category)) {
            grid.classList.add('collapsed');
            title.classList.add('collapsed');
        }

        // Add collapse toggle (prevent drag on title click)
        title.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCategoryCollapse(category, grid, title);
        });

        section.appendChild(title);
        section.appendChild(grid);
        servicesContainer.appendChild(section);

        attachCategoryDragHandlers(section);
    });
}

// Toggle category collapse and persist state
function toggleCategoryCollapse(category, gridElement, titleElement) {
    const isCollapsed = gridElement.classList.toggle('collapsed');
    titleElement.classList.toggle('collapsed', isCollapsed);
    
    if (isCollapsed) {
        if (!collapsedCategories.includes(category)) {
            collapsedCategories.push(category);
        }
    } else {
        collapsedCategories = collapsedCategories.filter(c => c !== category);
    }
    
    localStorage.setItem('collapsedCategories', JSON.stringify(collapsedCategories));
}

// Drag and drop for category panels
function attachCategoryDragHandlers(section) {
    section.addEventListener('dragstart', (e) => {
        section.classList.add('dragging');
        e.dataTransfer.setData('text/plain', section.dataset.category || '');
        e.dataTransfer.effectAllowed = 'move';
    });

    section.addEventListener('dragend', () => {
        section.classList.remove('dragging');
    });

    section.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const dragging = document.querySelector('.category-section.dragging');
        if (!dragging || dragging === section) return;

        const container = servicesContainer;
        const children = Array.from(container.querySelectorAll('.category-section'));
        const draggingIndex = children.indexOf(dragging);
        const targetIndex = children.indexOf(section);

        if (draggingIndex < targetIndex) {
            container.insertBefore(dragging, section.nextSibling);
        } else {
            container.insertBefore(dragging, section);
        }
    });

    section.addEventListener('drop', async (e) => {
        e.preventDefault();
        updateCategoryOrderFromDOM();
        await saveServices();
    });
}

function updateCategoryOrderFromDOM() {
    const ordered = Array.from(servicesContainer.querySelectorAll('.category-section'))
        .map(el => el.dataset.category)
        .filter(Boolean);
    categories = ordered;
    updateCategoriesDatalist();
}

// Create service card
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    
    const isImageIcon = service.icon && (service.icon.startsWith('http') || service.icon.startsWith('/'));
    const iconHtml = isImageIcon 
        ? `<img src="${service.icon}" alt="${service.name}">`
        : service.icon || '📦';

    card.innerHTML = `
        <div class="service-header">
            <div class="service-icon">${iconHtml}</div>
            <div class="service-actions">
                <button class="btn-icon edit" data-id="${service.id}" title="Edit">✏️</button>
                <button class="btn-icon delete" data-id="${service.id}" title="Delete">🗑️</button>
            </div>
        </div>
        <div class="service-name">${service.name}</div>
        ${service.description ? `<div class="service-description">${service.description}</div>` : ''}
        <a href="${service.url}" target="_blank" rel="noopener noreferrer" class="service-url" onclick="event.stopPropagation()">
            ${new URL(service.url).hostname}
        </a>
    `;

    // Click card to open URL
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-icon')) {
            window.open(service.url, '_blank');
        }
    });

    // Edit button
    card.querySelector('.edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(service);
    });

    // Delete button
    card.querySelector('.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteService(service.id);
    });

    return card;
}

// Show empty state
function showEmptyState(filter = '') {
    const message = filter 
        ? `<h3>No services found</h3><p>Try a different search term</p>`
        : `<h3>No services yet</h3><p>Click "Add Service" to get started</p>`;
    
    servicesContainer.innerHTML = `<div class="empty-state">${message}</div>`;
}

// Open modal for new service
function openAddModal() {
    editingServiceId = null;
    modalTitle.textContent = 'Add Service';
    serviceForm.reset();
    modal.classList.add('show');
    renderIconPicker('');
    document.getElementById('serviceName').focus();
}

// Open modal for editing
function openEditModal(service) {
    editingServiceId = service.id;
    modalTitle.textContent = 'Edit Service';
    document.getElementById('serviceName').value = service.name;
    document.getElementById('serviceUrl').value = service.url;
    document.getElementById('serviceCategory').value = service.category;
    document.getElementById('serviceIcon').value = service.icon || '';
    document.getElementById('serviceDescription').value = service.description || '';
    renderIconPicker(service.icon || '');
    modal.classList.add('show');
    document.getElementById('serviceName').focus();
}

// Close modal
function closeModal() {
    modal.classList.remove('show');
    serviceForm.reset();
    editingServiceId = null;
}

// Handle form submit
async function handleSubmit(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('serviceName').value,
        url: document.getElementById('serviceUrl').value,
        category: document.getElementById('serviceCategory').value,
        icon: document.getElementById('serviceIcon').value,
        description: document.getElementById('serviceDescription').value
    };

    if (editingServiceId) {
        // Update existing service
        const index = services.findIndex(s => s.id === editingServiceId);
        services[index] = { ...services[index], ...formData };
    } else {
        // Add new service
        const newService = {
            id: Date.now().toString(),
            ...formData
        };
        services.push(newService);
    }

    // Update categories
    if (!categories.includes(formData.category)) {
        categories.push(formData.category);
        updateCategoriesDatalist();
    }

    await saveServices();
    renderServices(searchInput.value);
    closeModal();
}

// Delete service
async function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service?')) {
        return;
    }

    services = services.filter(s => s.id !== id);
    await saveServices();
    renderServices(searchInput.value);
}

// Setup event listeners
function setupEventListeners() {
    addServiceBtn.addEventListener('click', openAddModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    serviceForm.addEventListener('submit', handleSubmit);
    searchInput.addEventListener('input', (e) => renderServices(e.target.value));

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
}

// Start the app
init();
