// assets/js/components/NoteModal.js

const NoteModal = {
    inject() {
        if (document.getElementById('globalNoteModal')) return;

        const modalHtml = `
        <div id="globalNoteModal" style="display:none;" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <div class="bg-[#0f0f14] w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl relative">
                <button onclick="window.closeGlobalModal()" class="absolute top-6 right-6 text-slate-500 hover:text-white">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
                <h2 class="text-2xl font-bold mb-6 text-white"><i class="fa-solid fa-expand text-scannerBlue mr-2"></i> Scan & Anchor</h2>
                <div class="space-y-4">
                    <input type="text" id="globalNoteTitle" placeholder="Title..." class="w-full px-4 py-3 rounded-xl bg-white/5 text-white outline-none focus:border-scannerBlue border border-transparent" />
                    <textarea id="globalNoteContent" rows="3" placeholder="Description..." class="w-full px-4 py-3 rounded-xl bg-white/5 text-white outline-none focus:border-scannerBlue border border-transparent resize-none"></textarea>
                    <button id="globalSaveNoteBtn" class="w-full py-4 bg-scannerBlue text-white font-bold rounded-xl active:scale-95 transition-transform">
                        Initialize Anchor
                    </button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        window.openAddNote = () => document.getElementById('globalNoteModal').style.display = 'flex';
        window.closeGlobalModal = () => document.getElementById('globalNoteModal').style.display = 'none';

        // Event Interceptor for saving
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#globalSaveNoteBtn');
            if (btn) {
                e.preventDefault(); e.stopPropagation();
                
                const title = document.getElementById("globalNoteTitle").value.trim();
                const content = document.getElementById("globalNoteContent").value.trim();
                const user = window.auth?.currentUser;

                if (!user || !title || !content) return alert("Fill details & login!");

                // Professional Logic: Check if in AR mode vs Dashboard mode
                if (typeof window.startPlacement === 'function') {
                    window.startPlacement({ uid: user.uid, title, content });
                    window.closeGlobalModal();
                    document.getElementById("globalNoteTitle").value = "";
                    document.getElementById("globalNoteContent").value = "";
                } else {
                    // Save to static dashboard if not in AR Camera
                    btn.innerText = "Processing...";
                    window.addDoc(window.collection(window.db, "notes"), {
                        uid: user.uid, title, content, timestamp: window.serverTimestamp(), x: 0, y: 1.6, z: -2
                    }).then(() => {
                        window.closeGlobalModal();
                        document.getElementById("globalNoteTitle").value = "";
                        document.getElementById("globalNoteContent").value = "";
                        btn.innerText = "Initialize Anchor";
                    });
                }
            }
        }, true);
    }
};

export default NoteModal;