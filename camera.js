// assets/js/camera.js

let isPlacementMode = false;
let tempNoteData = null;
let isDeleteMode = false;
let isEditMode = false;

async function loadARNotes() {
    const notesGroup = document.getElementById('notesGroup');
    if (!notesGroup || !window.auth?.currentUser) return;

    try {
        const q = window.query(window.collection(window.db, "notes"), window.where("uid", "==", window.auth.currentUser.uid));
        const querySnapshot = await window.getDocs(q);
        notesGroup.innerHTML = ''; 

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const el = document.createElement('a-entity');
            el.setAttribute('position', `${data.x} ${data.y} ${data.z}`);
            el.setAttribute('look-at', '#arCamera');
            el.classList.add('raycastable-note');
            
            let html = `
                <a-plane color="#000" width="1.6" height="0.9" opacity="0.8"></a-plane>
                <a-text value="${data.title}" align="center" position="0 0.2 0.01" color="#22d3ee"></a-text>
                <a-text value="${data.content}" align="center" position="0 -0.1 0.01" color="#fff" width="1.8"></a-text>
            `;
            if (isDeleteMode) html += `<a-circle color="#ef4444" radius="0.15" position="0.7 0.4 0.02"><a-text value="X" align="center"></a-text></a-circle>`;
            else if (isEditMode) html += `<a-circle color="#a855f7" radius="0.15" position="0.7 0.4 0.02"><a-text value="E" align="center"></a-text></a-circle>`;

            el.innerHTML = html;
            el.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (isDeleteMode && confirm("Delete?")) {
                    const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                    await deleteDoc(doc(window.db, "notes", docSnap.id));
                    loadARNotes();
                }
            });
            notesGroup.appendChild(el);
        });
    } catch (err) { console.error(err); }
}

// Activated by NoteModal.js
window.startPlacement = (data) => {
    isPlacementMode = true; tempNoteData = data;
    isDeleteMode = false; isEditMode = false;
    const stat = document.getElementById('statusText');
    if(stat) stat.innerText = "TAP SCREEN TO ANCHOR";
    loadARNotes();
};

const handleSpatialTap = async (e) => {
    if (!isPlacementMode || !tempNoteData || e.target.closest('button') || e.target.closest('#globalNoteModal')) return;
    const cam = document.querySelector('#arCamera');
    if (!cam) return;

    if (window.navigator.vibrate) window.navigator.vibrate(50);
    
    // Math to place object 2.5m in front of camera
    const worldPos = new THREE.Vector3(); cam.object3D.getWorldPosition(worldPos);
    const dir = new THREE.Vector3(0, 0, -1); dir.applyQuaternion(cam.object3D.quaternion);
    
    try {
        await window.addDoc(window.collection(window.db, "notes"), {
            ...tempNoteData,
            x: worldPos.x + dir.x * 2.5, y: worldPos.y + dir.y * 2.5, z: worldPos.z + dir.z * 2.5,
            timestamp: window.serverTimestamp()
        });
        isPlacementMode = false; tempNoteData = null;
        document.getElementById('statusText').innerText = "Spatial Tracking Active";
        loadARNotes(); 
    } catch (err) {}
};

document.addEventListener('touchend', handleSpatialTap);
document.addEventListener('click', (e) => { if (e.detail > 0) handleSpatialTap(e); });

window.deleteMode = () => { isDeleteMode = !isDeleteMode; isEditMode = false; isPlacementMode = false; loadARNotes(); };
window.editMode = () => { isEditMode = !isEditMode; isDeleteMode = false; isPlacementMode = false; loadARNotes(); };

window.addEventListener('load', () => setTimeout(loadARNotes, 2000));