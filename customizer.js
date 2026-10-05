import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

// Resolve static model assets through Vite's URL handling so
// loading works consistently in both dev and production builds.
const TSHIRT_MODEL_URL = new URL('./plain_dark_blue_t-shirt.glb', import.meta.url).href;
const CAP_MODEL_URL = new URL('./baseball_cap.glb', import.meta.url).href;
const PRESET_LOGO_MAP = {
    'logo.png': new URL('./logo.png', import.meta.url).href,
    'eg.jpg': new URL('./eg.jpg', import.meta.url).href
};
const ALLOWED_UPLOAD_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

let scene, camera, renderer, controls;
let tShirtMesh = null;
let capMesh = null;
let tShirtGroup = null;
let capGroup = null;
let activeMesh = null;
let customImageTexture = null;
const container = document.getElementById('canvas-container');

// Performance: visibility & render-on-demand
let isVisible = false;
let needsRender = true;
let animFrameId = null;

// Decal State
let decalMaterial = null;
let placedDecals = [];
let draggingDecal = null;
let isVariantMode = false;
let selectedVariantIndex = -1;
let selectedVariantColor = null;
let interactionEnabled = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const textureLoader = new THREE.TextureLoader();

// Intersection tracking
let intersection = {
    intersects: false,
    point: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    mesh: null
};

const decalScale = new THREE.Vector3(0.2, 0.2, 0.2);
const decalRotation = new THREE.Euler();
const decalOrientation = new THREE.Euler();
const position = new THREE.Vector3();

// Only initialize when the 3D customizer section is present on the page
if (!container) {
    console.warn("3D Customizer: #canvas-container not found, skipping initialization.");
} else {
    console.log("3D Customizer Initialized");
    init();
    animate();
}

function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 3.2); // Zoomed out further to decrease model size

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true } );
    renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) );
    renderer.setSize( container.clientWidth, container.clientHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 4. Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 5;
    controls.addEventListener('change', () => { needsRender = true; });
    controls.target.set(0, -0.3, 0); // Center slightly lower

    // 5. Lighting (Realistic)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(3, 5, 2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xd1e9ff, 1.0);
    dirLight2.position.set(-3, 2, -1);
    scene.add(dirLight2);

    // Helper to get active color
    const getActiveFabricColor = () => {
        return '#1e3a8a'; // Default Navy
    };

    // 6. Load Models
    const loader = new GLTFLoader();

    // Load T-Shirt
    loader.load(
        TSHIRT_MODEL_URL,
        function (gltf) {
            const model = gltf.scene;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.roughness = 0.8;
                        child.material.metalness = 0.1;
                        child.material.color.set(getActiveFabricColor());
                        child.material.needsUpdate = true;
                        if (!tShirtMesh || child.geometry.attributes.position.count > tShirtMesh.geometry.attributes.position.count) {
                            tShirtMesh = child;
                        }
                    }
                }
            });

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.x += (model.position.x - center.x);
            model.position.y += (model.position.y - center.y);
            model.position.z += (model.position.z - center.z);
            model.position.y -= 0.1;

            tShirtGroup = model;
            scene.add(tShirtGroup);
            activeMesh = tShirtMesh;

            // Hide loader
            document.getElementById('loader').classList.remove('active');
            // Setup initial Decal Helper Material
            createDecalMaterial('EzVrnts', '#ffffff');

            needsRender = true;
        },
        undefined,
        function (error) { console.error('Error loading T-Shirt', error); }
    );

    // Load Cap
    loader.load(
        CAP_MODEL_URL,
        function (gltf) {
            const model = gltf.scene;

            // First, find the bounding box of the unscaled original model
            let box = new THREE.Box3().setFromObject(model);
            let size = box.getSize(new THREE.Vector3());

            // Calculate scale required just once
            const maxDim = Math.max(size.x, size.y, size.z);
            let scaleFactor = 1.0;
            if (maxDim > 10) {
                scaleFactor = 1.0 / maxDim;
            }

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Bake the scale into the geometry to fix DecalGeometry local-space distortion mapping
                    if (scaleFactor !== 1.0) {
                        child.geometry.scale(scaleFactor, scaleFactor, scaleFactor);
                    }

                    if (child.material) {
                        child.material.roughness = 0.8;
                        child.material.metalness = 0.1;
                        child.material.color.set(getActiveFabricColor());
                        child.material.needsUpdate = true;

                        // Set the active cap mesh to the one with the most vertices
                        if (!capMesh || child.geometry.attributes.position.count > capMesh.geometry.attributes.position.count) {
                            capMesh = child;
                        }
                    }
                }
            });

            // Re-calculate box and center after baking geometry scale
            box.setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());

            model.position.x -= center.x;
            model.position.y -= center.y;
            model.position.z -= center.z;

            capGroup = model;
            capGroup.visible = false;
            scene.add(capGroup);

            needsRender = true;
        },
        undefined,
        function (error) { console.error('Error loading Cap', error); }
    );

    // 7. Event Listeners
    window.addEventListener('resize', onWindowResize);
    setupUI();

    // Decal placement constraints and listeners
    renderer.domElement.addEventListener('pointerdown', (e) => { onPointerDown(e); needsRender = true; });
    renderer.domElement.addEventListener('pointermove', (e) => { onPointerMove(e); needsRender = true; });
    renderer.domElement.addEventListener('pointerup', (e) => { onPointerUp(e); needsRender = true; });
    renderer.domElement.addEventListener('dblclick', onDoubleClick);
}

// UI State Management & Controls
function setupUI() {
    // Model Switcher
    const btnShirt = document.getElementById('btn-shirt');
    const btnCap = document.getElementById('btn-cap');
    const btnClear = document.getElementById('btn-clear-decals');
    const imageInput = document.getElementById('decal-image');
    const sizeInput = document.getElementById('decal-size');
    const btnGenerate = document.getElementById('btn-generate-variants');
    const btnConfirm = document.getElementById('btn-confirm-selection');
    const btnBack = document.getElementById('btn-back-editor');
    const btnEnableInteraction = document.getElementById('btn-enable-interaction');
    const demoFirstPanel = document.getElementById('demo-first-panel');
    const interactionHelper = document.getElementById('interaction-helper');
    const uploadValidationMsg = document.getElementById('upload-validation-msg');
    const presetLogoButtons = document.querySelectorAll('.preset-logo-btn');
    const quickColorSwatches = document.querySelectorAll('#demo-color-swatches .ez3d-swatch');

    const setInteractionState = (enabled) => {
        interactionEnabled = enabled;
        const lockMessage = 'Watch demo first, then tap "Try Interactive Mode".';
        if (btnShirt) btnShirt.disabled = !enabled;
        if (btnCap) btnCap.disabled = !enabled;
        if (btnClear) btnClear.disabled = !enabled;
        if (imageInput) imageInput.disabled = !enabled;
        if (sizeInput) sizeInput.disabled = !enabled;
        if (btnGenerate) btnGenerate.disabled = !enabled;
        presetLogoButtons.forEach((btn) => { btn.disabled = !enabled; });
        quickColorSwatches.forEach((swatch) => { swatch.disabled = !enabled; });
        renderer.domElement.style.cursor = enabled ? 'crosshair' : 'default';
        if (interactionHelper) {
            interactionHelper.textContent = enabled
                ? 'Interactive mode enabled. Click the product to place your design.'
                : lockMessage;
        }
    };

    const setValidationMessage = (message, isError = false) => {
        if (!uploadValidationMsg) return;
        uploadValidationMsg.textContent = message;
        uploadValidationMsg.style.color = isError ? '#dc2626' : '#6b7280';
    };

    btnClear.addEventListener('click', () => {
        placedDecals.forEach(d => {
            scene.remove(d.mesh);
            d.mesh.geometry.dispose();
        });
        placedDecals = [];
        needsRender = true;
    });

    btnShirt.addEventListener('click', () => {
        if (!tShirtGroup) return;
        btnShirt.classList.replace('ez3d-btn-secondary', 'ez3d-btn-primary');
        btnCap.classList.replace('ez3d-btn-primary', 'ez3d-btn-secondary');
        tShirtGroup.visible = true;
        if (capGroup) capGroup.visible = false;
        activeMesh = tShirtMesh;

        // Hide decals placed on other models
        placedDecals.forEach(d => {
            if (d.parentMesh !== tShirtMesh) d.mesh.visible = false;
            else d.mesh.visible = true;
        });
        needsRender = true;
    });

    btnCap.addEventListener('click', () => {
        if (!capGroup) return;
        btnCap.classList.replace('ez3d-btn-secondary', 'ez3d-btn-primary');
        btnShirt.classList.replace('ez3d-btn-primary', 'ez3d-btn-secondary');
        capGroup.visible = true;
        if (tShirtGroup) tShirtGroup.visible = false;
        activeMesh = capMesh;

        // Hide decals placed on other models
        placedDecals.forEach(d => {
            if (d.parentMesh !== capMesh) d.mesh.visible = false;
            else d.mesh.visible = true;
        });
        needsRender = true;
    });

    if (btnEnableInteraction) {
        btnEnableInteraction.addEventListener('click', () => {
            setInteractionState(true);
            if (demoFirstPanel) demoFirstPanel.style.display = 'none';
            setValidationMessage('Interactive mode is active. Upload or choose a preset logo.');
            needsRender = true;
        });
    }

    if (btnGenerate) {
        btnGenerate.addEventListener('click', generateVariants);
    }
    if (btnConfirm) {
        btnConfirm.addEventListener('click', confirmSelection);
    }
    if (btnBack) {
        btnBack.addEventListener('click', backToEditor);
    }

    quickColorSwatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            quickColorSwatches.forEach(s => s.classList.remove('active'));
            e.target.classList.add('active');

            const colorHex = e.target.getAttribute('data-color');
            const activeGroup = (activeMesh === capMesh) ? capGroup : tShirtGroup;

            if (activeGroup) {
                activeGroup.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.color.set(colorHex);
                        child.material.needsUpdate = true;
                    }
                });
                animateQuickPreview(activeGroup);
                needsRender = true;
            }
        });
    });

    presetLogoButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const logoKey = button.getAttribute('data-logo');
            const logoUrl = PRESET_LOGO_MAP[logoKey];
            if (!logoUrl) return;
            textureLoader.load(logoUrl, (texture) => {
                customImageTexture = texture;
                updateDecalPreview();
                setValidationMessage(`Preset logo selected: ${logoKey}`);
                needsRender = true;
            }, undefined, () => {
                setValidationMessage('Unable to load preset logo.', true);
            });
        });
    });

    if (sizeInput) {
        sizeInput.addEventListener('input', () => {
            // Handled directly during placement
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const validation = await validateUploadFile(file);
            if (!validation.ok) {
                imageInput.value = '';
                setValidationMessage(validation.message, true);
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                textureLoader.load(event.target.result, function (texture) {
                    customImageTexture = texture;
                    updateDecalPreview();
                    setValidationMessage('Design uploaded successfully.');
                    needsRender = true;
                }, undefined, () => {
                    setValidationMessage('Uploaded image could not be processed.', true);
                });
            };
            reader.readAsDataURL(file);
        });
    }

    setInteractionState(false);
}

async function validateUploadFile(file) {
    if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
        return { ok: false, message: 'Invalid file type. Use PNG, JPG, or WEBP only.' };
    }

    if (file.size > MAX_UPLOAD_BYTES) {
        return { ok: false, message: 'File too large. Maximum allowed size is 5MB.' };
    }

    try {
        const dimensions = await getImageDimensions(file);
        if (dimensions.width < 64 || dimensions.height < 64) {
            return { ok: false, message: 'Image is too small. Minimum size is 64x64.' };
        }
        if (dimensions.width > 4096 || dimensions.height > 4096) {
            return { ok: false, message: 'Image is too large in dimensions. Max is 4096x4096.' };
        }
    } catch (error) {
        return { ok: false, message: 'Unable to validate image file. Please choose another file.' };
    }

    return { ok: true };
}

function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const blobUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(blobUrl);
        };
        img.onerror = () => {
            reject(new Error('invalid image'));
            URL.revokeObjectURL(blobUrl);
        };
        img.src = blobUrl;
    });
}

function animateQuickPreview(group) {
    if (!group) return;
    const baseScale = group.scale.clone();
    group.scale.multiplyScalar(1.04);
    needsRender = true;
    setTimeout(() => {
        group.scale.copy(baseScale);
        needsRender = true;
    }, 180);
}

const variantColors = ['#1e3a8a', '#ef4444', '#22c55e', '#111827', '#f3f4f6']; // Navy, Red, Green, Black, White
const variantNames = ['Navy', 'Red', 'Green', 'Black', 'White'];
let variantContainer = null;

function generateVariants() {
    console.log("Generating 2D gallery variants...");
    if (!activeMesh || placedDecals.length === 0) {
        alert("Please upload and place a design first!");
        return;
    }

    const thumbnails = [];
    const sourceGroup = (activeMesh === tShirtMesh) ? tShirtGroup : capGroup;
    const originalColor = new THREE.Color();
    
    // Store original color
    sourceGroup.traverse(child => {
        if (child.isMesh && child.material) {
            originalColor.copy(child.material.color);
        }
    });

    // Capture Thumbnails
    variantColors.forEach((colorHex, index) => {
        // Apply color
        sourceGroup.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.color.set(colorHex);
            }
        });
        
        // Render current state
        renderer.render(scene, camera);
        
        // Save as image
        thumbnails.push({
            img: renderer.domElement.toDataURL('image/png'),
            color: colorHex,
            name: variantNames[index]
        });
    });

    // Reset original color
    sourceGroup.traverse(child => {
        if (child.isMesh && child.material) {
            child.material.color.copy(originalColor);
        }
    });

    // Build Gallery
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';
    
    thumbnails.forEach((thumb, index) => {
        const item = document.createElement('div');
        item.className = 'ez3d-gallery-item';
        item.innerHTML = `
            <img src="${thumb.img}" alt="${thumb.name}">
            <span>${thumb.name}</span>
        `;
        item.onclick = () => selectGalleryVariant(thumb.color);
        galleryGrid.appendChild(item);
    });

    // Toggle View
    document.getElementById('ez3d-gallery').style.display = 'flex';
    document.getElementById('canvas-container').style.visibility = 'hidden';
    
    document.getElementById('btn-generate-variants').style.display = 'none';
    document.getElementById('btn-back-editor').style.display = 'block';
}

function selectGalleryVariant(colorHex) {
    const sourceGroup = (activeMesh === tShirtMesh) ? tShirtGroup : capGroup;
    sourceGroup.traverse(child => {
        if (child.isMesh && child.material) {
            child.material.color.set(colorHex);
        }
    });
    backToEditor();
}

function backToEditor() {
    console.log("Returning to editor...");
    document.getElementById('ez3d-gallery').style.display = 'none';
    document.getElementById('canvas-container').style.visibility = 'visible';

    document.getElementById('btn-generate-variants').style.display = 'block';
    document.getElementById('btn-back-editor').style.display = 'none';
    needsRender = true;
}

function confirmSelection() {
    // Keep current color/material state and return to the editor view.
    // This exists because the Confirm button is wired in setupUI.
    backToEditor();
}

function selectVariant(index) {
}

function updateDecalPreview() {
    const textEl = document.getElementById('decal-text');
    const text = textEl ? textEl.value || 'Text' : 'Text';
    const activeSwatch = document.querySelector('#text-colors .ez3d-swatch.active');
    const color = activeSwatch ? activeSwatch.getAttribute('data-color') : '#ffffff';

    if (customImageTexture) {
        createImageDecalMaterial(customImageTexture);
    }
}

function createImageDecalMaterial(texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    decalMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: 0.9,
        metalness: 0.0
    });

    // Set scale proportional to image aspect ratio
    const aspect = texture.image ? (texture.image.height / texture.image.width) : 1;
    decalScale.set(0.3, 0.3 * aspect, 0.3);
}

// Generate Texture from Canvas for Text
function createDecalMaterial(text, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background (transparent)
    ctx.clearRect(0, 0, 1024, 256);

    // Text drawing
    ctx.fillStyle = colorHex;
    ctx.font = 'bold 140px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;

    decalMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: 0.9, // Matte paint feel
        metalness: 0.0
    });

    // Set scale based roughly on aspect ratio
    decalScale.set(0.3, 0.3 * (256 / 1024), 0.3);
}

function checkIntersection(x, y) {
    if (!scene) return;

    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    mouse.y = - ((y - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(scene, true);

    intersection.intersects = false;

    // Find the first valid mesh (ignoring placed decal meshes)
    for (let i = 0; i < intersects.length; i++) {
        const hit = intersects[i];
        const isDecal = placedDecals.some(d => d.mesh === hit.object);

        if (hit.object.isMesh && hit.object !== scene && !isDecal) {
            intersection.point.copy(hit.point);

            // Extract and transform normal to world space
            const n = hit.face.normal.clone();
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
            n.applyMatrix3(normalMatrix).normalize();

            intersection.normal.copy(n);
            intersection.mesh = hit.object;
            intersection.intersects = true;
            break;
        }
    }
}

function checkDecalIntersection(x, y) {
    if (placedDecals.length === 0) return null;

    // Calculate mouse position
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    mouse.y = - ((y - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const decalMeshes = placedDecals.filter(d => d.mesh.visible).map(d => d.mesh);
    const intersects = raycaster.intersectObjects(decalMeshes, false);

    if (intersects.length > 0) {
        return placedDecals.find(d => d.mesh === intersects[0].object);
    }
    return null;
}

function onPointerDown(event) {
    if (!interactionEnabled) return;

    // Check if we are clicking an existing decal to drag
    const hitDecal = checkDecalIntersection(event.clientX, event.clientY);
    if (hitDecal) {
        draggingDecal = hitDecal;
        controls.enabled = false; // Disable orbit controls while dragging
        renderer.domElement.style.cursor = 'grabbing';
        return;
    }

    if (!decalMaterial) return;

    // Otherwise, place a new one!
    checkIntersection(event.clientX, event.clientY);
    if (intersection.intersects && intersection.mesh) {
        placeDecal();
    }
}

function onPointerMove(event) {
    if (!interactionEnabled) {
        renderer.domElement.style.cursor = 'default';
        return;
    }

    if (draggingDecal) {
        // Dragging a decal around the surface
        checkIntersection(event.clientX, event.clientY);

        if (intersection.intersects && intersection.mesh === draggingDecal.parentMesh) {
            updateDecalGeometry(draggingDecal, intersection.point, intersection.normal);
        }
    } else {
        // Hover effect for decals
        const hitDecal = checkDecalIntersection(event.clientX, event.clientY);
        if (hitDecal) {
            renderer.domElement.style.cursor = 'grab';
        } else {
            renderer.domElement.style.cursor = 'crosshair'; // Indicate placement is ready
        }
    }
}

function onPointerUp(event) {
    if (!interactionEnabled) return;

    if (draggingDecal) {
        draggingDecal = null;
        controls.enabled = true; // Re-enable orbit controls
        renderer.domElement.style.cursor = 'grab';
    }
}

function onDoubleClick(event) {
    if (!interactionEnabled) return;

    const hitDecal = checkDecalIntersection(event.clientX, event.clientY);
    if (hitDecal) {
        scene.remove(hitDecal.mesh);
        hitDecal.mesh.geometry.dispose();
        placedDecals = placedDecals.filter(d => d !== hitDecal);
        renderer.domElement.style.cursor = 'default';
    }
}

function updateDecalGeometry(decalObj, pos, norm) {
    // Orient decal to match surface normal using a robust dummy object
    const dummy = new THREE.Object3D();
    dummy.position.copy(pos);

    // Calculate world normal
    const normal = norm.clone();
    normal.multiplyScalar(10);
    normal.add(pos);

    dummy.lookAt(normal);

    // Sometimes default lookAt causes text to twist wildly on curved surfaces. 
    // We intentionally force the dummy's 'up' vector to align with the camera to keep text mostly horizontal to exactly how the user views it.
    dummy.up.copy(camera.up);

    const orientation = dummy.rotation;

    // Normalizing geometry means we can use a uniform, reasonable zScale for both models now!
    const zScale = (decalObj.parentMesh === capMesh) ? 0.1 : 0.5;
    const sizeMultiplier = decalObj.sizeMultiplier || 1.0;
    const size = new THREE.Vector3(decalScale.x * 2.5 * sizeMultiplier, decalScale.y * 2.5 * sizeMultiplier, zScale);

    const newGeometry = new DecalGeometry(decalObj.parentMesh, pos, orientation, size);

    // Dispose old geometry and apply new geometry
    decalObj.mesh.geometry.dispose();
    decalObj.mesh.geometry = newGeometry;
}

function placeDecal() {
    position.copy(intersection.point);

    // Orient decal to match surface normal using a robust dummy object
    const dummy = new THREE.Object3D();
    dummy.position.copy(position);

    // Calculate world normal
    const normal = intersection.normal.clone();
    normal.multiplyScalar(10);
    normal.add(position);

    dummy.lookAt(normal);
    dummy.up.copy(camera.up);

    const orientation = dummy.rotation;

    // Use scale multiplier from slider
    const sizeMultiplier = parseFloat(document.getElementById('decal-size').value) || 1.0;

    // Uniform reasonable zScale
    const zScale = (intersection.mesh === capMesh) ? 0.1 : 0.5;

    // Scale up the decal significantly in case the model is very large internally
    const size = new THREE.Vector3(decalScale.x * 2.5 * sizeMultiplier, decalScale.y * 2.5 * sizeMultiplier, zScale);

    // Use the specific mesh that was intersected
    const geometry = new DecalGeometry(intersection.mesh, position, orientation, size);

    console.log("Decal placed at", position, "with size", size, "Verts:", geometry.attributes.position ? geometry.attributes.position.count : 0);

    const mesh = new THREE.Mesh(geometry, decalMaterial.clone()); // clone mat so they can be different
    scene.add(mesh);

    // Store in placedDecals array for dragging
    placedDecals.push({
        mesh: mesh,
        material: mesh.material,
        sizeMultiplier: sizeMultiplier,
        parentMesh: intersection.mesh
    });

    // Optional: Auto-disable placement mode after one placement
    // document.getElementById('btn-place-text').click(); 
}

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    needsRender = true;
}

function animate() {
    animFrameId = requestAnimationFrame(animate);

    // Skip GPU work when section is scrolled out of view
    if (!isVisible) return;

    controls.update();

    // Only render when something changed (orbit, interaction, model load)
    if (needsRender) {
        renderer.render(scene, camera);
        needsRender = false;
    }
}

// Smart visibility: default to TRUE so first render always works
isVisible = true;

const customizerSection = document.getElementById('customizer');
if (customizerSection) {
    const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible) needsRender = true;
        });
    }, { rootMargin: '300px 0px' });
    visibilityObserver.observe(customizerSection);
}
