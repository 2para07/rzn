// ========================================
// GLOBAL STATE
// ========================================
let currentUser = null;
let authToken = null;
let allMembers = [];
let allLeaders = [];

// ========================================
// API FUNCTIONS
// ========================================

async function apiCall(endpoint, data = {}, method = 'POST') {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const options = {
        method: method,
        headers: headers
    };
    
    if (method === 'POST' && Object.keys(data).length > 0) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`/api/${endpoint}`, options);

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('rzn_auth_token');
        localStorage.removeItem('rzn_user');
        authToken = null;
        currentUser = null;
        updateAuthUI();
        navigateTo('login');
        return { success: false, message: 'Session expired. Please log in again.' };
    }

    const body = await response.json();
    return body;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    return { success: false, message: 'Server connection failed. Make sure the server is running.' };
  }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        checkStoredToken();
        await loadLeaders();
        await loadMembers();
    } catch (error) {
        console.error('Error loading initial data:', error);
    } finally {
        setupEventListeners();
    }
});

// ========================================
// AUTH FUNCTIONS
// ========================================

function checkStoredToken() {
    const stored = localStorage.getItem('rzn_auth_token');
    const storedUser = localStorage.getItem('rzn_user');
    
    if (stored && storedUser) {
        authToken = stored;
        currentUser = JSON.parse(storedUser);
        updateAuthUI();
    }
}

function updateAuthUI() {
    const loginNavBtn    = document.getElementById('loginNavBtn');
    const registerNavBtn = document.getElementById('registerNavBtn');
    const profileNavBtn  = document.getElementById('profileNavBtn');
    const adminNavBtn    = document.getElementById('adminNavBtn');
    const logoutBtn      = document.getElementById('logoutBtn');

    if (currentUser) {
        loginNavBtn.style.display    = 'none';
        registerNavBtn.style.display = 'none';
        profileNavBtn.style.display  = 'block';
        logoutBtn.style.display      = 'block';
        
        if (currentUser.role === 'admin' || currentUser.role === 'leader') {
            adminNavBtn.style.display = 'block';
        }
    } else {
        loginNavBtn.style.display    = 'block';
        registerNavBtn.style.display = 'block';
        profileNavBtn.style.display  = 'none';
        adminNavBtn.style.display    = 'none';
        logoutBtn.style.display      = 'none';
    }
}

async function handleRegister() {
    const username  = document.getElementById('regUsername').value.trim();
    const email     = document.getElementById('regEmail').value.trim();
    const password  = document.getElementById('regPassword').value;
    const errorEl   = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');
    
    errorEl.style.display   = 'none';
    successEl.style.display = 'none';
    
    if (!username || !email || !password) {
        errorEl.textContent    = 'All fields are required';
        errorEl.style.display  = 'block';
        return;
    }
    
    const result = await apiCall('register', { username, email, password });
    
    if (result.success) {
        successEl.textContent  = result.message;
        successEl.style.display = 'block';
        
        document.getElementById('regUsername').value = '';
        document.getElementById('regEmail').value    = '';
        document.getElementById('regPassword').value = '';
        
        setTimeout(() => navigateTo('login'), 2000);
    } else {
        errorEl.textContent   = result.message;
        errorEl.style.display = 'block';
    }
}

async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl  = document.getElementById('loginError');
    
    errorEl.style.display = 'none';
    
    if (!username || !password) {
        errorEl.textContent   = 'Username and password are required';
        errorEl.style.display = 'block';
        return;
    }
    
    const result = await apiCall('login', { username, password });
    
    if (result.success) {
        authToken   = result.token;
        currentUser = result.user;
        
        localStorage.setItem('rzn_auth_token', authToken);
        localStorage.setItem('rzn_user', JSON.stringify(currentUser));
        
        updateAuthUI();
        navigateTo('profile');
        loadProfileData();
    } else {
        errorEl.textContent   = result.message;
        errorEl.style.display = 'block';
    }
}

function handleLogout() {
    authToken   = null;
    currentUser = null;
    localStorage.removeItem('rzn_auth_token');
    localStorage.removeItem('rzn_user');
    updateAuthUI();
    navigateTo('home');
}

// ========================================
// DATA LOADING
// ========================================

async function loadLeaders() {
    try {
        const result = await apiCall('getLeaders', {}, 'GET');
        if (result.success) {
            allLeaders = result.leaders;
            renderLeaders();
        }
    } catch (error) {
        console.error('Error loading leaders:', error);
    }
}

async function loadMembers() {
    try {
        const result = await apiCall('getMembers', {}, 'GET');
        if (result.success) {
            allMembers = result.members;
            renderMembers();
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

function loadProfileData() {
    if (!currentUser) return;
    
    const DEFAULT_AVATAR = 'https://scontent.fmnl17-2.fna.fbcdn.net/v/t1.15752-9/614028794_814902111608713_6082913412308559520_n.png?_nc_cat=107&ccb=1-7&_nc_sid=9f807c&_nc_ohc=IhuL5cPSz_IQ7kNvwGNekyk&_nc_oc=AdmcTimEiyq7WGiYHgQ2XQ7dL4meLx7Y-GNrLY_qTSNuZxnmHULv_mrm1GfSBzYv2n4&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&oh=03_Q7cD4QHwL_9xMqnBXvOjKjJ42VhsBH4jmJcQy4oIS1xBeypYsw&oe=69988514';

    document.getElementById('profileName').textContent = currentUser.username;
    
    const roleField = document.getElementById('profileRoleField');
    const roleEl    = document.getElementById('profileRole');

    if (currentUser.role === 'leader') {
        roleEl.textContent    = '👑 LEADER';
        roleEl.style.color    = '#ffd700';
        roleField.style.display = 'flex';
    } else if (currentUser.role === 'admin') {
        roleEl.textContent    = '⚔️ CO-FOUNDER';
        roleEl.style.color    = '#c0c0c0';
        roleField.style.display = 'flex';
    } else {
        roleField.style.display = 'none';
    }
    
    const DEFAULT_COVER = 'https://images.unsplash.com/photo-1511755239777-2e6f12f6b3e5?auto=format&fit=crop&w=1400&q=80';

    document.getElementById('profileCoverPreview').src = currentUser.cover_url || DEFAULT_COVER;
    document.getElementById('profileAvatarPreview').src = currentUser.avatar || DEFAULT_AVATAR;
    document.getElementById('profileLikes').textContent = formatHeartText(currentUser.likes || 0);

    const fbLink = document.getElementById('profileFacebookLink');
    const ytLink = document.getElementById('profileYoutubeLink');
    const ttLink = document.getElementById('profileTiktokLink');

    if (currentUser.facebook_url) {
        fbLink.style.display = 'inline-block';
        fbLink.href = currentUser.facebook_url;
    } else {
        fbLink.style.display = 'none';
    }
    if (currentUser.youtube_url) {
        ytLink.style.display = 'inline-block';
        ytLink.href = currentUser.youtube_url;
    } else {
        ytLink.style.display = 'none';
    }
    if (currentUser.tiktok_url) {
        ttLink.style.display = 'inline-block';
        ttLink.href = currentUser.tiktok_url;
    } else {
        ttLink.style.display = 'none';
    }
}

// ========================================
// ADMIN PANEL - PENDING MEMBERS
// ========================================

function getInitial(name) {
    return (name || '?').charAt(0).toUpperCase();
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function loadPendingMembers() {
    const result    = await apiCall('getPending', {}, 'GET');
    const container = document.getElementById('pendingContainer');
    const noPending = document.getElementById('noPending');
    
    if (!result.success) {
        alert(result.message || 'Unable to load pending members.');
        return;
    }

    if (result.pending.length > 0) {
        noPending.style.display = 'none';
        container.innerHTML = result.pending.map(member => `
            <div class="pending-card">
                <div class="pending-card-header">
                    <div class="pending-avatar">
                        ${member.avatar
                            ? `<img src="${member.avatar}" alt="${member.username}">`
                            : getInitial(member.username)
                        }
                    </div>
                    <div class="pending-meta">
                        <div class="pending-name">${member.username} <span class="role-badge role-pending">⏳ Pending</span></div>
                        <div class="pending-email">📧 ${member.email}</div>
                        <div class="pending-date">🗓 Applied ${formatDate(member.created_at)}</div>
                    </div>
                </div>
                <div class="pending-divider"></div>
                <div class="pending-actions">
                    <button class="approve-btn" data-member-id="${member.id}" data-action="approve">✓ Approve</button>
                    <button class="decline-btn" data-member-id="${member.id}" data-action="decline">✗ Decline</button>
                </div>
            </div>
        `).join('');
        attachPendingButtonListeners();
    } else {
        noPending.style.display = 'block';
        container.innerHTML     = '';
    }
}

// ========================================
// ADMIN PANEL - ALL MEMBERS (Leader only)
// ========================================

async function loadAllMembers() {
    const result    = await apiCall('getAllMembers', {}, 'GET');
    const container = document.getElementById('allMembersContainer');
    const section   = document.getElementById('allMembersSection');
    const subtitle  = document.getElementById('adminSubtitle');
    
    if (!result.success) {
        alert(result.message || 'Unable to load members.');
        return;
    }

    const isLeader = result.currentRole === 'leader';
    
    if (isLeader) {
        section.style.display = 'block';
        subtitle.textContent  = '👑 Leader Panel — Full Control';
        
        container.innerHTML = result.members.map(member => {
            let roleLabel = '👤 Member';
            let roleClass = 'role-member';
            
            if (member.role === 'leader')  { roleLabel = '👑 Leader';     roleClass = 'role-leader';  }
            if (member.role === 'admin')   { roleLabel = '⚔️ Co-Founder'; roleClass = 'role-admin';   }
            if (member.role === 'pending') { roleLabel = '⏳ Pending';    roleClass = 'role-pending'; }
            
            const canDelete = member.id != currentUser.id && member.role !== 'pending';
            
            return `
                <div class="pending-card">
                    <div class="pending-card-header">
                        <div class="pending-avatar">
                            ${member.avatar
                                ? `<img src="${member.avatar}" alt="${member.username}">`
                                : getInitial(member.username)
                            }
                        </div>
                        <div class="pending-meta">
                            <div class="pending-name">${member.username} <span class="role-badge ${roleClass}">${roleLabel}</span></div>
                            <div class="pending-email">📧 ${member.email}</div>
                            <div class="pending-date">🗓 Joined ${formatDate(member.created_at)}</div>
                        </div>
                    </div>
                    ${canDelete ? `
                        <div class="pending-divider"></div>
                        <div class="pending-actions">
                            <button class="decline-btn delete-member-btn" data-member-id="${member.id}" data-username="${member.username}">🗑️ Delete Member</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        attachMembersButtonListeners();
    } else {
        section.style.display = 'none';
        subtitle.textContent  = '⚔️ Co-Founder Panel';
    }
}

// ========================================
// ADMIN ACTIONS
// ========================================

async function approveMember(memberId) {
    if (!confirm('Approve this member?')) return;
    
    const result = await apiCall('approve', { member_id: memberId });
    if (result.success) {
        alert(result.message);
        loadPendingMembers();
        loadMembers();
        loadAllMembers();
    } else {
        alert('Error: ' + result.message);
    }
}

async function declineMember(memberId) {
    if (!confirm('Decline this member? This will delete their account.')) return;
    
    const result = await apiCall('decline', { member_id: memberId });
    if (result.success) {
        alert(result.message);
        loadPendingMembers();
    } else {
        alert('Error: ' + result.message);
    }
}

async function deleteMemberById(memberId, username) {
    if (!confirm(`Are you sure you want to DELETE ${username}? This action cannot be undone!`)) return;
    
    const result = await apiCall('deleteMember', { member_id: memberId });
    if (result.success) {
        alert(result.message);
        loadAllMembers();
        loadMembers();
    } else {
        alert('Error: ' + result.message);
    }
}

// ========================================
// RENDER FUNCTIONS
// ========================================

function renderLeaders() {
    const container = document.getElementById('leadersContainer');
    if (allLeaders.length === 0) return;
    
    const order = allLeaders.length >= 3 ? [1, 0, 2] : [0];
    
    container.innerHTML = order.map(i => {
        const leader = allLeaders[i];
        const role   = leader.role === 'leader' ? 'Founder' : 'Co-Founder';
        
        return `
            <div class="leader-card">
                <div class="leader-card-content">
                    <img src="${leader.avatar}" alt="${leader.username}" class="leader-image">
                    <h2 class="leader-name">${leader.username}</h2>
                    <p class="leader-role">${role}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderMembers() {
    const container   = document.getElementById('membersContainer');
    const memberCount = document.getElementById('memberCount');
    const DEFAULT_AVATAR = 'https://scontent.fmnl17-2.fna.fbcdn.net/v/t1.15752-9/614028794_814902111608713_6082913412308559520_n.png?_nc_cat=107&ccb=1-7&_nc_sid=9f807c&_nc_ohc=IhuL5cPSz_IQ7kNvwGNekyk&_nc_oc=AdmcTimEiyq7WGiYHgQ2XQ7dL4meLx7Y-GNrLY_qTSNuZxnmHULv_mrm1GfSBzYv2n4&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&oh=03_Q7cD4QHwL_9xMqnBXvOjKjJ42VhsBH4jmJcQy4oIS1xBeypYsw&oe=69988514';

    memberCount.textContent = allMembers.length;
    
    container.innerHTML = allMembers.map(member => `
        <div class="member-card">
            <div class="member-card-content">
                <div class="member-avatar">
                    <div class="member-avatar-img">
                        <img src="${member.avatar || DEFAULT_AVATAR}" alt="${member.username}">
                    </div>
                </div>
                <h3 class="member-name">${member.username}</h3>
                <div class="member-interaction">
                    <span class="member-likes">${formatHeartText(member.likes || 0)}</span>
                    <button class="like-btn" data-member-id="${member.id}">Like</button>
                </div>
                <button class="view-profile-btn" data-member-id="${member.id}">View Profile</button>
            </div>
        </div>
    `).join('');

    attachMemberCardListeners();
}

function attachMemberCardListeners() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async (event) => {
            const memberId = event.currentTarget.dataset.memberId;
            await likeMember(memberId);
        });
    });

    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            const memberId = event.currentTarget.dataset.memberId;
            showMemberProfile(memberId);
        });
    });
}

async function likeMember(memberId) {
    if (!currentUser || !authToken) {
        alert('You need to be logged in to like members.');
        return;
    }

    const result = await apiCall('likeMember', { member_id: memberId });
    if (result.success) {
        const updated = allMembers.map(m => {
            if (String(m.id) === String(memberId)) {
                return { ...m, likes: result.likes };
            }
            return m;
        });

        allMembers = updated;
        renderMembers();

        if (currentUser.id === Number(memberId)) {
            currentUser.likes = result.likes;
            document.getElementById('profileLikes').textContent = currentUser.likes;
        }
    } else {
        alert(result.message || 'Unable to like member');
    }
}

function formatHeartText(count) {
    const label = count === 1 ? 'heart' : 'hearts';
    return `❤️ ${count} ${label}`;
}

function showMemberProfile(memberId) {
    const member = allMembers.find(m => String(m.id) === String(memberId));
    if (!member) return;

    const DEFAULT_COVER = 'https://images.unsplash.com/photo-1511755239777-2e6f12f6b3e5?auto=format&fit=crop&w=1400&q=80';

    document.getElementById('detailName').textContent = member.username;
    document.getElementById('detailRole').textContent = member.role ? `Role: ${member.role}` : '';
    document.getElementById('detailCover').src = member.cover_url || DEFAULT_COVER;
    document.getElementById('detailLikes').textContent = formatHeartText(member.likes || 0);
    document.getElementById('detailAvatar').src = member.avatar || 'https://scontent.fmnl17-2.fna.fbcdn.net/v/t1.15752-9/614028794_814902111608713_6082913412308559520_n.png?_nc_cat=107&ccb=1-7&_nc_sid=9f807c&_nc_ohc=IhuL5cPSz_IQ7kNvwGNekyk&_nc_oc=AdmcTimEiyq7WGiYHgQ2XQ7dL4meLx7Y-GNrLY_qTSNuZxnmHULv_mrm1GfSBzYv2n4&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&oh=03_Q7cD4QHwL_9xMqnBXvOjKjJ42VhsBH4jmJcQy4oIS1xBeypYsw&oe=69988514';

    document.getElementById('detailLikes').textContent = formatHeartText(member.likes || 0);

    const linksContainer = document.getElementById('detailSocialLinks');
    linksContainer.innerHTML = '';

    if (member.facebook_url) {
        linksContainer.insertAdjacentHTML('beforeend', `<a href="${member.facebook_url}" target="_blank" class="social-link">Facebook</a>`);
    }
    if (member.youtube_url) {
        linksContainer.insertAdjacentHTML('beforeend', `<a href="${member.youtube_url}" target="_blank" class="social-link">YouTube</a>`);
    }
    if (member.tiktok_url) {
        linksContainer.insertAdjacentHTML('beforeend', `<a href="${member.tiktok_url}" target="_blank" class="social-link">TikTok</a>`);
    }

    navigateTo('memberDetail');
}

function showAddLinkModal() {
    const modal = document.getElementById('linkModal');
    const inputSection = document.getElementById('dialogInputSection');
    inputSection.style.display = 'none';
    document.getElementById('platformLinkInput').value = '';
    modal.style.display = 'flex';
}

function closeAddLinkModal() {
    document.getElementById('linkModal').style.display = 'none';
}

function pickPlatformAndEdit(platform) {
    const inputSection = document.getElementById('dialogInputSection');
    const input = document.getElementById('platformLinkInput');
    input.value = currentUser && currentUser[`${platform}_url`] ? currentUser[`${platform}_url`] : '';
    input.dataset.platform = platform;
    inputSection.style.display = 'flex';
    input.focus();
}

async function savePlatformLink() {
    const input = document.getElementById('platformLinkInput');
    const platform = input.dataset.platform;
    const url = input.value.trim();

    if (!platform || !url) {
        alert('Please choose a platform and enter a valid URL.');
        return;
    }

    const body = {
        avatar: document.getElementById('profileAvatarPreview').src,
        cover_url: document.getElementById('profileCoverPreview').src,
        facebook_url: currentUser?.facebook_url || '',
        youtube_url: currentUser?.youtube_url  || '',
        tiktok_url: currentUser?.tiktok_url   || ''
    };

    body[`${platform}_url`] = url;

    if (currentUser) {
        currentUser.facebook_url = body.facebook_url;
        currentUser.youtube_url = body.youtube_url;
        currentUser.tiktok_url = body.tiktok_url;
    }

    const result = await apiCall('updateProfile', body);
    if (result.success) {
        if (currentUser) {
            currentUser[`${platform}_url`] = url;
            currentUser.cover_url = document.getElementById('profileCoverPreview').src;
        }

        loadProfileData();
        closeAddLinkModal();
        document.getElementById('profileMessage').textContent = '✅ Link updated successfully';
        document.getElementById('profileMessage').style.color = '#4ade80';
        document.getElementById('profileMessage').style.display = 'block';
        setTimeout(() => { document.getElementById('profileMessage').style.display = 'none'; }, 3000);
    } else {
        alert(result.message || 'Failed to save link');
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    document.getElementById('mobileMenuBtn')?.addEventListener('click', toggleMobileMenu);
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.page;
            if (page) navigateTo(page);
        });
    });
    
    document.querySelector('.view-members-btn')?.addEventListener('click', (e) => {
        navigateTo(e.currentTarget.dataset.page);
    });
    
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        searchMembers(e.target.value);
    });
    
    document.getElementById('registerBtn')?.addEventListener('click', handleRegister);
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    document.getElementById('profileNavBtn')?.addEventListener('click', () => {
        navigateTo('profile');
        loadProfileData();
    });
    
    document.getElementById('adminNavBtn')?.addEventListener('click', () => {
        navigateTo('admin');
        loadPendingMembers();
        loadAllMembers();
    });
    
    document.getElementById('coverUpload')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('profileCoverPreview').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('avatarUpload')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('profileAvatarPreview').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Please login first.');
            return;
        }

        const avatar = document.getElementById('profileAvatarPreview').src;
        const cover_url = document.getElementById('profileCoverPreview').src;
        currentUser.avatar = avatar;
        currentUser.cover_url = cover_url;

        const result = await apiCall('updateProfile', {
            avatar,
            cover_url,
            facebook_url: currentUser.facebook_url || '',
            youtube_url:  currentUser.youtube_url || '',
            tiktok_url:   currentUser.tiktok_url || ''
        });
        
        const messageEl = document.getElementById('profileMessage');
        if (result.success) {
            messageEl.textContent    = '✅ ' + result.message;
            messageEl.style.color   = '#4ade80';
            messageEl.style.display = 'block';
            await loadMembers();
            setTimeout(() => { messageEl.style.display = 'none'; }, 3000);
        } else {
            messageEl.textContent    = '❌ ' + result.message;
            messageEl.style.color   = '#ff6b6b';
            messageEl.style.display = 'block';
        }
    });

    document.getElementById('addLinkBtn')?.addEventListener('click', () => showAddLinkModal());
    document.getElementById('dialogCloseBtn')?.addEventListener('click', closeAddLinkModal);
    document.getElementById('dialogSaveLinkBtn')?.addEventListener('click', savePlatformLink);
    document.querySelectorAll('.dialog-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            pickPlatformAndEdit(e.currentTarget.dataset.platform);
        });
    });
    
    document.querySelectorAll('.link-text').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(e.target.dataset.page);
        });
    });

    document.getElementById('memberDetailBackBtn')?.addEventListener('click', () => {
        navigateTo('members');
    });
}


// ========================================
// DYNAMIC BUTTON LISTENERS
// ========================================

function attachPendingButtonListeners() {
    document.querySelectorAll('.pending-actions .approve-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await approveMember(e.target.dataset.memberId);
        });
    });
    
    document.querySelectorAll('.pending-actions .decline-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await declineMember(e.target.dataset.memberId);
        });
    });
}

function attachMembersButtonListeners() {
    document.querySelectorAll('.delete-member-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await deleteMemberById(e.target.dataset.memberId, e.target.dataset.username);
        });
    });
}

// ========================================
// NAVIGATION
// ========================================

function toggleMobileMenu() {
    const navLinks  = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    navLinks.classList.toggle('active');
    hamburger.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
}

function navigateTo(page) {
    ['homePage','membersPage','registerPage','loginPage','profilePage','adminPage','memberDetailPage']
        .forEach(id => document.getElementById(id).style.display = 'none');
    
    const pageMap = {
        home: 'homePage', members: 'membersPage', register: 'registerPage',
        login: 'loginPage', profile: 'profilePage', admin: 'adminPage', memberDetail: 'memberDetailPage'
    };
    
    const pageId = pageMap[page];
    if (pageId) document.getElementById(pageId).style.display = 'flex';
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    
    document.getElementById('navLinks').classList.remove('active');
    document.getElementById('hamburger').textContent = '☰';
    
    window.scrollTo(0, 0);
}

function searchMembers(query) {
    const cards       = document.querySelectorAll('.member-card');
    const noResults   = document.getElementById('noResults');
    let   visibleCount = 0;
    
    cards.forEach(card => {
        const name = card.querySelector('.member-name').textContent.toLowerCase();
        const show = name.includes(query.toLowerCase());
        card.style.display = show ? 'block' : 'none';
        if (show) visibleCount++;
    });
    
    noResults.style.display = (visibleCount === 0 && query !== '') ? 'block' : 'none';
}
