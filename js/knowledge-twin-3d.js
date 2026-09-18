// 3D Knowledge Twin Logic

document.addEventListener('DOMContentLoaded', () => {
    if (typeof StateManager === 'undefined' || typeof THREE === 'undefined') return;
    
    // Slight delay to ensure state and DOM are ready
    setTimeout(() => {
        initApp();
    }, 100);
});

let scene, camera, renderer, controls;
let raycaster, mouse;
let nodes = []; // Keep track of all interactive meshes
let subjectNodes = [];
let conceptNodes = []; // specific concept node metadata
let currentMode = 'default'; // 'default', 'focus', 'decay'
let hoveredNode = null;
let selectedNode = null;

// UI Elements
const tooltip = document.getElementById('tooltip');
const detailPanel = document.getElementById('detail-panel');

const colors = {
    strong: 0x10B981,   // Green
    fading: 0xF59E0B,   // Amber
    fragile: 0xF97316,  // Orange
    critical: 0xEF4444, // Red
    subject: 0x3B82F6,  // Blue
    bg: 0x0A0A0B,
    edge: 0x333333,
    decayGhost: 0x4B5563 // Gray ghost
};

function initApp() {
    const state = StateManager.getState();
    if (!state.knowledgeTwin) return;
    const data = state.knowledgeTwin;

    // 1. Populate UI Stats
    document.getElementById('stats-total').textContent = `${data.concepts.length} Concepts Tracked`;
    document.getElementById('stats-mastery').textContent = `${data.overview.mastery}%`;
    
    let counts = { strong: 0, fading: 0, fragile: 0, critical: 0 };
    data.concepts.forEach(c => counts[c.state]++);
    
    document.getElementById('stats-strong').textContent = `${counts.strong} Strong`;
    document.getElementById('stats-fading').textContent = `${counts.fading} Fading`;
    document.getElementById('stats-fragile').textContent = `${counts.fragile} Fragile`;
    document.getElementById('stats-critical').textContent = `${counts.critical} Critical`;

    // 2. Setup Three.js
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.bg);
    scene.fog = new THREE.FogExp2(colors.bg, 0.015);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 60);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 150;
    controls.minDistance = 10;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 3. Build Graph
    buildGraph(data.concepts);

    // 4. Check for animations from Quiz
    checkForQuizAnimations();

    // 5. Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    // Touch support
    renderer.domElement.addEventListener('touchstart', onTouchStart, {passive: false});

    // Button Listeners
    document.getElementById('btn-reset-view').addEventListener('click', resetView);
    document.getElementById('btn-focus-weak').addEventListener('click', toggleFocusMode);
    document.getElementById('btn-show-decay').addEventListener('click', toggleDecayMode);
    document.getElementById('dp-close').addEventListener('click', closeDetailPanel);

    // Start Loop
    animate();
}

function buildGraph(concepts) {
    // Group by subject
    const subjectsMap = {};
    concepts.forEach(c => {
        if (!subjectsMap[c.subject]) subjectsMap[c.subject] = [];
        subjectsMap[c.subject].push(c);
    });

    const subjects = Object.keys(subjectsMap);
    const radius = 25; // cluster spread
    
    subjects.forEach((subj, i) => {
        // Place subject node in a circle around center
        const angle = (i / subjects.length) * Math.PI * 2;
        const sx = Math.cos(angle) * radius;
        const sz = Math.sin(angle) * radius;
        const sy = 0;
        const subjPos = new THREE.Vector3(sx, sy, sz);

        // Create Subject Node (subtle, large)
        const subjGeo = new THREE.SphereGeometry(3, 32, 32);
        const subjMat = new THREE.MeshStandardMaterial({
            color: colors.subject,
            transparent: true,
            opacity: 0.15,
            wireframe: true
        });
        const subjMesh = new THREE.Mesh(subjGeo, subjMat);
        subjMesh.position.copy(subjPos);
        subjMesh.userData = { type: 'subject', name: subj };
        scene.add(subjMesh);
        subjectNodes.push(subjMesh);

        // Add Concept Nodes around Subject
        const subjConcepts = subjectsMap[subj];
        subjConcepts.forEach((c, j) => {
            // Distribute locally around subject
            const cAngle = (j / subjConcepts.length) * Math.PI * 2;
            const cDist = 8 + (Math.random() * 4); // distance from subject
            const cHeight = (Math.random() - 0.5) * 10;
            
            const cx = sx + Math.cos(cAngle) * cDist;
            const cz = sz + Math.sin(cAngle) * cDist;
            const cy = sy + cHeight;
            const cPos = new THREE.Vector3(cx, cy, cz);

            // Node properties
            const nodeSize = 0.5 + (c.mastery / 100) * 1.5;
            const nodeColor = colors[c.state];
            
            const geo = new THREE.SphereGeometry(nodeSize, 32, 32);
            const mat = new THREE.MeshStandardMaterial({
                color: nodeColor,
                emissive: nodeColor,
                emissiveIntensity: (c.metrics.retention / 100) * 0.8,
                roughness: 0.4,
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(cPos);
            
            // Store data
            mesh.userData = {
                type: 'concept',
                id: c.id,
                data: c,
                baseOpacity: 1,
                baseColor: nodeColor,
                baseSize: nodeSize,
                decayMeshes: [] // for decay mode lines/ghosts
            };

            scene.add(mesh);
            nodes.push(mesh);
            conceptNodes.push(mesh);

            // Connect to Subject
            createLine(subjPos, cPos, colors.edge, 0.3);
        });
    });
}

function createLine(v1, v2, color, opacity) {
    const points = [v1, v2];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity
    });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    return line;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Ignore if clicking on UI
    if (event.target.closest('.ui-panel') || event.target.closest('.bottom-controls')) {
        hideTooltip();
        return;
    }
    
    handleRaycast(event.clientX, event.clientY);
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        
        if (event.target.closest('.ui-panel') || event.target.closest('.bottom-controls')) return;
        
        handleRaycast(event.touches[0].clientX, event.touches[0].clientY, true);
    }
}

function handleRaycast(clientX, clientY, isClick = false) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(conceptNodes);
    
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        const node = intersects[0].object;
        
        if (hoveredNode !== node) {
            hoveredNode = node;
            showTooltip(node, clientX, clientY);
        } else {
            // Update position
            tooltip.style.left = clientX + 'px';
            tooltip.style.top = clientY + 'px';
        }
        
        if (isClick) {
            openDetailPanel(node);
        }
    } else {
        document.body.style.cursor = 'default';
        if (hoveredNode) {
            hoveredNode = null;
            hideTooltip();
        }
    }
}

function onClick(event) {
    if (event.target.closest('.ui-panel') || event.target.closest('.bottom-controls') || event.target.closest('.back-btn')) {
        return; // Ignore UI clicks
    }
    
    if (hoveredNode) {
        openDetailPanel(hoveredNode);
    } else {
        closeDetailPanel();
    }
}

function showTooltip(node, x, y) {
    const c = node.userData.data;
    document.getElementById('tt-subject').textContent = c.subject;
    document.getElementById('tt-title').textContent = c.name;
    document.getElementById('tt-mastery').textContent = `${c.mastery}%`;
    document.getElementById('tt-retention').textContent = `${c.metrics.retention}%`;
    document.getElementById('tt-risk').textContent = `${c.metrics.risk}%`;
    
    const stateBadge = document.getElementById('tt-state');
    stateBadge.textContent = c.state.toUpperCase();
    stateBadge.className = `badge state-${c.state}`;
    
    tooltip.style.opacity = '1';
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function hideTooltip() {
    tooltip.style.opacity = '0';
}

function openDetailPanel(node) {
    selectedNode = node;
    const c = node.userData.data;
    
    document.getElementById('dp-subject').textContent = c.subject;
    document.getElementById('dp-title').textContent = c.name;
    
    const stateBadge = document.getElementById('dp-state-badge');
    stateBadge.textContent = c.state.toUpperCase();
    stateBadge.className = `badge state-${c.state}`;
    
    document.getElementById('dp-mastery').textContent = `${c.mastery}%`;
    document.getElementById('dp-risk').textContent = `${c.metrics.risk}%`;
    document.getElementById('dp-retention').textContent = `${c.metrics.retention}%`;
    document.getElementById('dp-confidence').textContent = `${c.metrics.confidence}%`;
    
    const reasonEl = document.getElementById('dp-reason');
    reasonEl.className = `dp-reason ${c.diagnostic.boxClass}`;
    const listEl = document.getElementById('dp-diagnostic-list');
    listEl.innerHTML = c.diagnostic.bullets.map(b => `<li>${b}</li>`).join('');
    
    const timelineEl = document.getElementById('dp-timeline');
    let timelineHTML = '';
    if (c.history && c.history.length > 0) {
        c.history.slice().reverse().forEach(h => {
            timelineHTML += `
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span class="text-muted" style="text-transform: uppercase;">${h.date}</span>
                    <span style="font-weight: 600;">${h.mastery}%</span>
                </div>
            `;
        });
    }
    timelineHTML += `
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 6px 0; color: var(--accent-blue);">
            <span style="font-weight: 600; text-transform: uppercase;">TODAY</span>
            <span style="font-weight: 700;">${c.mastery}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding-top: 4px; color: var(--text-muted); border-top: 1px dashed rgba(255,255,255,0.2);">
            <span style="text-transform: uppercase; display: flex; align-items: center; gap: 4px;"><i data-lucide="brain" style="width: 12px; height: 12px;"></i> +48 HOURS</span>
            <span><span style="font-weight: 600;">${c.decayPrediction.withoutRevision[1]}%</span> <span style="font-size: 0.75rem;">pred.</span></span>
        </div>
    `;
    timelineEl.innerHTML = timelineHTML;
    
    document.getElementById('dp-intervention-title').textContent = c.intervention.title;
    document.getElementById('dp-intervention-desc').textContent = c.intervention.description;
    document.getElementById('dp-quiz-link').href = `quiz.html?concept=${c.id}`;
    
    // If we are in decay mode, show prediction explicitly in panel
    if (currentMode === 'decay') {
        document.getElementById('dp-prediction-badge').style.display = 'inline-block';
        document.getElementById('dp-prediction-badge').textContent = `48h Prediction: ${c.decayPrediction.withoutRevision[1]}% Retention`;
    } else {
        document.getElementById('dp-prediction-badge').style.display = 'none';
    }

    detailPanel.classList.add('active');
    
    // Animate camera to node
    const targetPos = node.position.clone();
    
    // Offset camera slightly to left to accommodate right panel
    const offset = new THREE.Vector3(-10, 5, 20);
    targetPos.add(offset);
    
    new TWEEN.Tween(camera.position)
        .to(targetPos, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
        
    new TWEEN.Tween(controls.target)
        .to(node.position, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
}

function closeDetailPanel() {
    selectedNode = null;
    detailPanel.classList.remove('active');
}

function resetView() {
    closeDetailPanel();
    new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 30, z: 60 }, 1500)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
    new TWEEN.Tween(controls.target)
        .to({ x: 0, y: 0, z: 0 }, 1500)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
}

function toggleFocusMode(e) {
    const btn = e.currentTarget;
    if (currentMode === 'focus') {
        currentMode = 'default';
        btn.classList.remove('active');
        restoreDefaultView();
    } else {
        if (currentMode === 'decay') toggleDecayMode(document.getElementById('btn-show-decay')); // Turn off decay
        currentMode = 'focus';
        btn.classList.add('active');
        
        conceptNodes.forEach(mesh => {
            if (mesh.userData.data.state === 'strong') {
                new TWEEN.Tween(mesh.material)
                    .to({ opacity: 0.1, emissiveIntensity: 0 }, 500)
                    .start();
            } else if (mesh.userData.data.state === 'critical') {
                // Pulse critical nodes
                mesh.scale.set(mesh.userData.baseSize * 1.5, mesh.userData.baseSize * 1.5, mesh.userData.baseSize * 1.5);
                new TWEEN.Tween(mesh.scale)
                    .to({ x: mesh.userData.baseSize, y: mesh.userData.baseSize, z: mesh.userData.baseSize }, 800)
                    .easing(TWEEN.Easing.Elastic.Out)
                    .start();
            }
        });
    }
}

function toggleDecayMode(e) {
    // If passed the button element directly or event
    const btn = e.currentTarget || e;
    
    if (currentMode === 'decay') {
        currentMode = 'default';
        btn.classList.remove('active-decay');
        
        // Remove ghosts
        conceptNodes.forEach(mesh => {
            mesh.userData.decayMeshes.forEach(m => scene.remove(m));
            mesh.userData.decayMeshes = [];
        });
        
        restoreDefaultView();
    } else {
        if (currentMode === 'focus') toggleFocusMode(document.getElementById('btn-focus-weak')); // Turn off focus
        currentMode = 'decay';
        btn.classList.add('active-decay');
        
        conceptNodes.forEach(mesh => {
            const c = mesh.userData.data;
            const predRetention = c.decayPrediction.withoutRevision[1]; // 48h
            
            // Current node stays solid. 
            // Create a predicted ghost node slightly shifted down
            const ghostSize = 0.5 + (predRetention / 100) * 1.5;
            const ghostGeo = new THREE.SphereGeometry(ghostSize, 16, 16);
            const ghostMat = new THREE.MeshBasicMaterial({
                color: colors.decayGhost,
                wireframe: true,
                transparent: true,
                opacity: 0
            });
            const ghost = new THREE.Mesh(ghostGeo, ghostMat);
            
            // Position shifted down on Y axis
            const offset = new THREE.Vector3(0, -3, 0);
            ghost.position.copy(mesh.position).add(offset);
            
            scene.add(ghost);
            mesh.userData.decayMeshes.push(ghost);
            
            // Connect current to predicted
            const line = createLine(mesh.position, ghost.position, colors.decayGhost, 0);
            mesh.userData.decayMeshes.push(line);
            
            // Animate them in
            new TWEEN.Tween(ghostMat).to({ opacity: 0.5 }, 800).start();
            new TWEEN.Tween(line.material).to({ opacity: 0.5 }, 800).start();
        });
    }
}

function restoreDefaultView() {
    conceptNodes.forEach(mesh => {
        new TWEEN.Tween(mesh.material)
            .to({ 
                opacity: mesh.userData.baseOpacity,
                emissiveIntensity: (mesh.userData.data.metrics.retention / 100) * 0.8
            }, 500)
            .start();
    });
}

function checkForQuizAnimations() {
    const resultDataStr = sessionStorage.getItem('lastQuizResult');
    if (!resultDataStr) return;
    
    const { quiz, knowledgeUpdate } = JSON.parse(resultDataStr);
    
    if (quiz && knowledgeUpdate) {
        // Find the node
        const mesh = conceptNodes.find(m => m.userData.id === quiz.conceptId);
        if (mesh) {
            const oldSize = 0.5 + (knowledgeUpdate.before.mastery / 100) * 1.5;
            const newSize = mesh.userData.baseSize; // already built with 'after' state
            
            // Temporarily set to old size
            mesh.scale.set(oldSize/newSize, oldSize/newSize, oldSize/newSize);
            
            // Temporarily set to old color
            const oldColor = new THREE.Color(colors[knowledgeUpdate.before.state]);
            const newColor = new THREE.Color(colors[knowledgeUpdate.after.state]);
            mesh.material.color.copy(oldColor);
            mesh.material.emissive.copy(oldColor);
            
            // Wait a moment for scene to render, then animate
            setTimeout(() => {
                // Focus camera on it
                openDetailPanel(mesh);
                
                // Animate to new state
                new TWEEN.Tween(mesh.scale)
                    .to({ x: 1, y: 1, z: 1 }, 2000)
                    .easing(TWEEN.Easing.Elastic.Out)
                    .start();
                    
                new TWEEN.Tween(mesh.material.color)
                    .to(newColor, 1500)
                    .start();
                new TWEEN.Tween(mesh.material.emissive)
                    .to(newColor, 1500)
                    .start();
                
                // Clear session storage so it doesn't run again
                sessionStorage.removeItem('lastQuizResult');
            }, 500);
        }
    }
}

function animate(time) {
    requestAnimationFrame(animate);
    
    TWEEN.update(time);
    controls.update();

    // Subtle floating animation for nodes
    const timeFactor = time * 0.001;
    conceptNodes.forEach((mesh, index) => {
        if (mesh.userData.decayMeshes.length === 0) { // Don't float if connected to decay line
            mesh.position.y += Math.sin(timeFactor + index) * 0.005;
        }
    });

    renderer.render(scene, camera);
}
