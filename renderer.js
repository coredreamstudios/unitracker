const { ipcRenderer, contextBridge } = require('electron');

let currentWrestlers = [];
let editingId = null;

// Page navigation function
function showPage(pageName) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to clicked nav item
    const clickedItem = document.querySelector(`.nav-item[onclick="showPage('${pageName}')"]`);
    if (clickedItem) {
        clickedItem.classList.add('active');
    }

    // Load the page content
    const mainContent = document.getElementById('main-content');
    fetch(`./pages/${pageName}.html`)
        .then(response => response.text())
        .then(html => {
            mainContent.innerHTML = html;
            // After loading the page content, initialize any necessary event listeners
            initializePageFunctionality(pageName);
        })
        .catch(error => {
            console.error('Error loading page:', error);
            mainContent.innerHTML = '<p>Error loading page content.</p>';
        });
}

// Initialize page-specific functionality
function initializePageFunctionality(pageName) {
    switch(pageName) {
        case 'roster-management':
            loadWrestlers();
            loadWeightClasses();
            loadWrestlerTypes();
            loadFactions();
            loadBrands();
            loadAlignments();
            break;
        case 'show-management':
            loadShows();
            loadShowsDropdown();
            break;
        case 'data-management':
            loadWrestlerTypesTable();
            loadWeightClassesTable();
            break;
        case 'simulator':
            loadSinglesChampionships();
            loadTagChampionships();
            loadWrestlerSelects();
            break;
    }
}

document.getElementById('wrestlerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const wrestler = {
        name: document.getElementById('wrestlerName').value,
        brand: document.getElementById('brandSelect').value,
        isChampion: document.getElementById('championSelect').value === 'Yes',
        faction: document.getElementById('factionSelect').value,
        isInFaction: document.getElementById('inFactionSelect').value === 'Yes',
        weightClassId: parseInt(document.getElementById('weightClassSelect').value),
        wrestlerTypeId: parseInt(document.getElementById('wrestlerTypeSelect').value),
        alignment: document.getElementById('alignmentSelect').value
    };

    try {
        if (editingId) {
            wrestler.id = editingId;
            await window.api.updateWrestler(wrestler);
            editingId = null;
        } else {
            await window.api.addWrestler(wrestler);
        }
        document.getElementById('wrestlerForm').reset();
        loadWrestlers();
    } catch (error) {
        console.error('Error saving wrestler:', error);
        showModal('Error saving wrestler: ' + error.message);
    }
});

async function loadWrestlers() {
    try {
        console.log('Loading wrestlers...');
        const wrestlers = await window.api.getWrestlers();
        console.log('Received wrestlers:', wrestlers);
        currentWrestlers = wrestlers;
        populateWrestlerTable(wrestlers);
    } catch (error) {
        console.error('Error loading wrestlers:', error);
        showModal('Error loading wrestlers: ' + error.message);
    }
}

// Shows Management
document.getElementById('showForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const showName = document.getElementById('showName').value;
    
    await window.api.addShow({ show_name: showName });
    document.getElementById('showForm').reset();
    await loadShows();
    // Reload the brand dropdown in the wrestlers page
    await loadShowsDropdown();
});

async function loadShowsDropdown() {
    const shows = await window.api.getShows();
    const brandSelect = document.getElementById('brandSelect');
    brandSelect.innerHTML = '';
    
    shows.forEach(show => {
        const option = document.createElement('option');
        option.value = show.show_name;
        option.textContent = show.show_name;
        brandSelect.appendChild(option);
    });
}

async function loadShows() {
    const shows = await window.api.getShows();
    const tbody = document.querySelector('#showTable tbody');
    tbody.innerHTML = '';
    
    shows.forEach(show => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${show.show_name}</td>
            <td>
                <button onclick="deleteShow(${show.id})" style="background-color: #f44336;">Remove</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.deleteShow = async (id) => {
    if (confirm('Are you sure you want to remove this show?')) {
        await window.api.deleteShow(id);
        await loadShows();
        // Reload the brand dropdown in the wrestlers page
        await loadShowsDropdown();
    }
};

async function loadWeightClasses() {
    try {
        console.log('Loading weight classes...');
        const classes = await window.api.getWeightClasses();
        console.log('Received weight classes:', classes);

        const classSelect = document.getElementById('weightClassSelect');
        if (!classSelect) {
            console.error('Weight class select element not found!');
            return;
        }

        // Clear existing options
        classSelect.innerHTML = '<option value="">Select Weight Class</option>';
        
        // Add options from database
        if (Array.isArray(classes)) {
            classes.forEach(weightClass => {
                const option = document.createElement('option');
                option.value = weightClass.id;
                option.textContent = weightClass.class_name;
                classSelect.appendChild(option);
            });
        }
        
        console.log('Weight class select updated with options');
    } catch (error) {
        console.error('Error loading weight classes:', error);
        showModal('Error loading weight classes: ' + error.message);
    }
}

async function loadFactions() {
    try {
        const factions = await window.api.getFactions();
        console.log('Received factions:', factions);

        const factionSelect = document.getElementById('factionSelect');
        if (!factionSelect) {
            console.error('Faction select element not found!');
            return;
        }

        // Clear existing options
        factionSelect.innerHTML = '<option value="">Select Faction</option>';
        
        // Add options from database
        if (Array.isArray(factions)) {
            factions.forEach(faction => {
                const option = document.createElement('option');
                option.value = faction.id;
                option.textContent = faction.name;
                factionSelect.appendChild(option);
            });
        }
        
        console.log('Faction select updated with options');
    } catch (error) {
        console.error('Error loading factions:', error);
        showModal('Error loading factions: ' + error.message);
    }
}

async function loadWrestlerTypes() {
    try {
        console.log('Loading wrestler types...');
        const types = await window.api.getWrestlerTypes();
        console.log('Received wrestler types:', types);

        const typeSelect = document.getElementById('wrestlerTypeSelect');
        if (!typeSelect) {
            console.error('Wrestler type select element not found!');
            return;
        }

        // Clear existing options
        typeSelect.innerHTML = '<option value="">Select Type</option>';
        
        // Add options from database
        if (Array.isArray(types)) {
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.type_name;
                typeSelect.appendChild(option);
            });
        }
        
        console.log('Wrestler type select updated with options');
    } catch (error) {
        console.error('Error loading wrestler types:', error);
        showModal('Error loading wrestler types: ' + error.message);
    }
}

async function loadAlignments() {
    const alignments = await window.api.getAlignments();
    const alignmentSelect = document.getElementById('alignmentSelect');
    alignmentSelect.innerHTML = '';
    
    alignments.forEach(alignment => {
        const option = document.createElement('option');
        option.value = alignment.id;
        option.textContent = alignment.alignment_name;
        alignmentSelect.appendChild(option);
    });
}

async function loadBrands() {
    try {
        console.log('Loading brands...');
        const brands = await window.api.getBrands();
        console.log('Received brands:', brands);
        
        const brandSelect = document.getElementById('brandSelect');
        brandSelect.innerHTML = '<option value="">Select Brand</option>';
        
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.id;
            option.textContent = brand.name;
            brandSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading brands:', error);
        showModal('Error loading brands: ' + error.message);
    }
}

// Modal functions
function showModal(message) {
    const modal = document.getElementById('messageModal');
    const modalMessage = document.getElementById('modalMessage');
    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.style.display = 'block';
    } else {
        console.error('Modal elements not found');
    }
}

function closeModal() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('messageModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

async function addWrestler() {
    try {
        console.log('Add Wrestler button clicked');
        
        // Get form data
        const formData = {
            name: document.getElementById('wrestlerName').value.trim(),
            brand_id: parseInt(document.getElementById('brandSelect').value),
            type_id: parseInt(document.getElementById('wrestlerTypeSelect').value),
            weight_class_id: parseInt(document.getElementById('weightClassSelect').value),
            alignment: document.getElementById('alignmentSelect').value,
            is_champion: document.getElementById('championSelect').value === 'Yes' ? 1 : 0,
            faction_id: document.getElementById('factionSelect').value ? parseInt(document.getElementById('factionSelect').value) : null,
            is_in_faction: document.getElementById('inFactionSelect').value === 'Yes' ? 1 : 0
        };

        console.log('Form data:', formData);

        // Validate required fields
        if (!formData.name) {
            showModal('Please enter a wrestler name');
            return;
        }
        if (isNaN(formData.brand_id)) {
            showModal('Please select a brand');
            return;
        }
        if (isNaN(formData.type_id)) {
            showModal('Please select a wrestler type');
            return;
        }
        if (isNaN(formData.weight_class_id)) {
            showModal('Please select a weight class');
            return;
        }

        // Add wrestler to database
        const result = await window.api.addWrestler(formData);
        console.log('Add wrestler result:', result);
        
        // Clear form
        document.getElementById('wrestlerForm').reset();
        
        // Refresh wrestler list
        await loadWrestlers();
        
        showModal('Wrestler added successfully!');
    } catch (error) {
        console.error('Error adding wrestler:', error);
        showModal('Error adding wrestler: ' + error.message);
    }
}

window.populateWrestlerTable = (wrestlers) => {
    const tbody = document.querySelector('#wrestlerTable tbody');
    tbody.innerHTML = '';
    
    wrestlers.forEach(wrestler => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${wrestler.name}</td>
            <td>${wrestler.brand_name || wrestler.brand}</td>
            <td>${wrestler.faction_name || wrestler.faction || '-'}</td>
            <td>${wrestler.type}</td>
            <td>${wrestler.weight_class}</td>
            <td>${wrestler.alignment}</td>
            <td>
                <button onclick="editWrestler(${wrestler.id})">Edit</button>
                <button onclick="deleteWrestler(${wrestler.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
};

window.editWrestler = async (id) => {
    try {
        const wrestler = await window.api.getWrestler(id);
        console.log('Editing wrestler:', wrestler);
        
        // Populate edit form
        document.getElementById('editWrestlerId').value = wrestler.id;
        document.getElementById('editWrestlerName').value = wrestler.name;
        document.getElementById('editBrandSelect').value = wrestler.brand_id;
        document.getElementById('editFactionSelect').value = wrestler.faction_id || '';
        document.getElementById('editWrestlerTypeSelect').value = wrestler.type;
        document.getElementById('editWeightClassSelect').value = wrestler.weight_class;
        document.getElementById('editAlignmentSelect').value = wrestler.alignment;
        document.getElementById('editChampionSelect').value = wrestler.is_champion ? 'Yes' : 'No';
        document.getElementById('editInFactionSelect').value = wrestler.is_in_faction ? 'Yes' : 'No';
        
        // Show edit dialog
        document.getElementById('editWrestlerDialog').showModal();
    } catch (error) {
        console.error('Error loading wrestler for edit:', error);
        showModal('Error loading wrestler: ' + error.message);
    }
};

window.updateWrestler = async () => {
    const id = document.getElementById('editWrestlerId').value;
    const name = document.getElementById('editWrestlerName').value;
    const brand = document.getElementById('editBrandSelect').value;
    const type = document.getElementById('editWrestlerTypeSelect').value;
    const weightClass = document.getElementById('editWeightClassSelect').value;
    const alignment = document.getElementById('editAlignmentSelect').value;
    const isChampion = document.getElementById('editChampionSelect').value === 'Yes';
    const faction = document.getElementById('editFactionSelect').value;
    const isInFaction = document.getElementById('editInFactionSelect').value === 'Yes';
    
    console.log('Updating wrestler with data:', {
        id, name, brand, type, weightClass, alignment, isChampion, faction, isInFaction
    });
    
    if (!name || !brand || !type || !weightClass) {
        showModal('Please fill in all required fields');
        return;
    }
    
    try {
        await window.api.updateWrestler({
            id,
            name,
            brand_id: brand,
            faction_id: faction || null,
            type,
            weight_class: weightClass,
            alignment,
            is_champion: isChampion,
            is_in_faction: isInFaction
        });
        
        await loadWrestlers();
        document.getElementById('editWrestlerDialog').close();
    } catch (error) {
        console.error('Error updating wrestler:', error);
        showModal('Error updating wrestler: ' + error.message);
    }
};

window.deleteWrestler = async (id) => {
    if (confirm('Are you sure you want to remove this wrestler?')) {
        await window.api.deleteWrestler(id);
        loadWrestlers();
    }
};

// Championship Management
async function loadChampionshipsTable() {
    const championships = await window.api.getChampionships();
    const tbody = document.querySelector('#championshipsTable tbody');
    tbody.innerHTML = '';
    
    championships.forEach(championship => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${championship.title_name}</td>
            <td>${championship.show_name}</td>
            <td>${championship.is_tag_team ? 'Tag Team' : 'Singles'}</td>
            <td>
                <select onchange="updateChampionshipHolder(${championship.id}, this.value)">
                    <option value="">None</option>
                    ${window.wrestlerOptions}
                </select>
            </td>
            <td>
                <button onclick="deleteChampionship(${championship.id})" style="background-color: #f44336;">Remove</button>
            </td>
        `;
        
        // Set current holder in dropdown
        if (championship.current_holder_id) {
            const select = row.querySelector('select');
            select.value = championship.current_holder_id;
        }
        
        tbody.appendChild(row);
    });
}

async function loadChampionshipForm() {
    // Load shows for the dropdown
    const shows = await window.api.getShows();
    const showSelect = document.getElementById('titleShow');
    showSelect.innerHTML = shows.map(show => 
        `<option value="${show.id}">${show.show_name}</option>`
    ).join('');
    
    // Load wrestlers for the current holder dropdown
    const currentHolderSelect = document.getElementById('currentHolder');
    currentHolderSelect.innerHTML = '<option value="">None</option>' + window.wrestlerOptions;
}

document.getElementById('championshipForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const championship = {
        titleName: document.getElementById('titleName').value,
        showId: document.getElementById('titleShow').value,
        isTagTeam: document.getElementById('isTagTeam').value === '1',
        currentHolderId: document.getElementById('currentHolder').value || null
    };
    
    await window.api.addChampionship(championship);
    document.getElementById('titleName').value = '';
    document.getElementById('isTagTeam').value = '0';
    document.getElementById('currentHolder').value = '';
    await loadChampionshipsTable();
});

window.updateChampionshipHolder = async (championshipId, wrestlerId) => {
    await window.api.updateChampionshipHolder({
        championshipId,
        wrestlerId: wrestlerId || null
    });
    await loadChampionshipsTable();
};

window.deleteChampionship = async (id) => {
    // Create and show a custom confirmation dialog
    const confirmDialog = document.createElement('dialog');
    confirmDialog.innerHTML = `
        <div style="padding: 20px;">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to remove this championship?</p>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button onclick="this.closest('dialog').close('cancel')" style="background-color: #ccc;">Cancel</button>
                <button onclick="this.closest('dialog').close('confirm')" style="background-color: #f44336;">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmDialog);
    confirmDialog.showModal();

    // Handle the dialog result
    confirmDialog.addEventListener('close', async () => {
        if (confirmDialog.returnValue === 'confirm') {
            try {
                await window.api.deleteChampionship(id);
                await loadChampionshipsTable();
            } catch (err) {
                console.error('Error deleting championship:', err);
            }
        }
        // Clean up the dialog
        confirmDialog.remove();
        document.body.style.pointerEvents = 'auto';
    });
};

// Simulator Functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

window.updateSimulatorForm = async () => {
    const matchType = document.getElementById('matchType').value;
    let wrestlers = [];
    let championship = null;
    
    if (matchType === '1v1') {
        const wrestler1 = document.querySelector('#wrestler1 option:checked').text;
        const wrestler2 = document.querySelector('#wrestler2 option:checked').text;
        wrestlers = [wrestler1, wrestler2];
        
        const championshipSelect = document.getElementById('singles-championship');
        if (championshipSelect.value) {
            championship = {
                id: championshipSelect.value,
                title_name: championshipSelect.options[championshipSelect.selectedIndex].text
            };
        }
    } else {
        const team1Wrestler1 = document.querySelector('#team1-wrestler1 option:checked').text;
        const team1Wrestler2 = document.querySelector('#team1-wrestler2 option:checked').text;
        const team2Wrestler1 = document.querySelector('#team2-wrestler1 option:checked').text;
        const team2Wrestler2 = document.querySelector('#team2-wrestler2 option:checked').text;
        wrestlers = [team1Wrestler1, team1Wrestler2, team2Wrestler1, team2Wrestler2];
        
        const championshipSelect = document.getElementById('tag-championship');
        if (championshipSelect.value) {
            championship = {
                id: championshipSelect.value,
                title_name: championshipSelect.options[championshipSelect.selectedIndex].text
            };
        }
    }
    
    const story = generateMatchStory(wrestlers, matchType === '2v2', championship);
    
    // Show results in dialog
    const resultsDialog = document.getElementById('match-results');
    document.getElementById('match-story').innerHTML = story.replace(/\n/g, '<br>');
    resultsDialog.showModal();
    
    // If there was a championship change, reload the championships
    if (championship) {
        if (matchType === '1v1') {
            await loadSinglesChampionships();
        } else {
            await loadTagChampionships();
        }
    }
};

async function loadSinglesChampionships() {
    const championships = await window.api.getChampionships();
    const singlesChampionships = championships.filter(c => !c.is_tag_team);
    const select = document.getElementById('singles-championship');
    
    select.innerHTML = '<option value="">No Championship</option>' + 
        singlesChampionships.map(c => 
            `<option value="${c.id}" data-holder="${c.current_holder_id}">${c.title_name}</option>`
        ).join('');
}

async function loadTagChampionships() {
    const championships = await window.api.getChampionships();
    const tagChampionships = championships.filter(c => c.is_tag_team);
    const select = document.getElementById('tag-championship');
    
    select.innerHTML = '<option value="">No Championship</option>' + 
        tagChampionships.map(c => 
            `<option value="${c.id}" data-holder="${c.current_holder_id}">${c.title_name}</option>`
        ).join('');
}

async function loadWrestlerSelects() {
    const wrestlers = await window.api.getWrestlers();
    const options = wrestlers.map(w => 
        `<option value="${w.id}">${w.name}</option>`
    ).join('');
    
    document.querySelectorAll('.wrestler-select').forEach(select => {
        select.innerHTML = options;
    });
    
    // Load initial championships based on match type
    await updateSimulatorForm();
}

function generateMatchStory(wrestlers, isTagMatch = false, championship = null) {
    const moves = [
        "hits a devastating suplex",
        "connects with a powerful clothesline",
        "executes a perfect dropkick",
        "delivers a crushing bodyslam",
        "lands a high-flying elbow drop",
        "hits their signature move",
        "attempts their finisher",
        "reverses the momentum",
        "takes control of the match",
        "staggers their opponent"
    ];
    
    const endings = [
        "pins their opponent for the three count!",
        "forces a submission with a devastating hold!",
        "hits their finisher for the victory!",
        "rolls up their opponent for the surprise win!",
        "secures the victory after an intense battle!"
    ];
    
    let story = [];
    const rounds = getRandomInt(4, 8);
    
    // Add championship context if applicable
    if (championship) {
        story.push(`This match is for the ${championship.title_name}!`);
    }
    
    if (isTagMatch) {
        story.push(`The match begins with ${wrestlers[0]} and ${wrestlers[2]} in the ring.`);
        
        for (let i = 0; i < rounds; i++) {
            const team = i % 2 === 0 ? [wrestlers[0], wrestlers[1]] : [wrestlers[2], wrestlers[3]];
            
            if (getRandomInt(0, 1) === 1) {
                story.push(`${team[0]} ${moves[getRandomInt(0, moves.length - 1)]}.`);
                story.push(`${team[0]} tags in ${team[1]}.`);
            } else {
                story.push(`${team[0]} ${moves[getRandomInt(0, moves.length - 1)]}.`);
            }
        }
        
        // Determine winners
        const winningTeamIndex = getRandomInt(0, 1);
        const winningTeam = winningTeamIndex === 0 ? [wrestlers[0], wrestlers[1]] : [wrestlers[2], wrestlers[3]];
        const winningWrestler = winningTeam[getRandomInt(0, 1)];
        story.push(`${winningWrestler} ${endings[getRandomInt(0, endings.length - 1)]}`);
        story.push(`\nWinners: ${winningTeam[0]} and ${winningTeam[1]}!`);
        
        if (championship) {
            story.push(`\n${winningTeam[0]} and ${winningTeam[1]} are the new ${championship.title_name} holders!`);
            // Update championship holder in database
            window.api.updateChampionshipHolder({
                championshipId: championship.id,
                wrestlerId: document.querySelector(`#team${winningTeamIndex + 1}-wrestler1`).value
            });
        }
    } else {
        story.push(`The bell rings and ${wrestlers[0]} faces off against ${wrestlers[1]}.`);
        
        for (let i = 0; i < rounds; i++) {
            const wrestler = i % 2 === 0 ? wrestlers[0] : wrestlers[1];
            story.push(`${wrestler} ${moves[getRandomInt(0, moves.length - 1)]}.`);
        }
        
        const winnerIndex = getRandomInt(0, 1);
        const winner = wrestlers[winnerIndex];
        story.push(`${winner} ${endings[getRandomInt(0, endings.length - 1)]}`);
        story.push(`\nWinner: ${winner}!`);
        
        if (championship) {
            story.push(`\n${winner} is the new ${championship.title_name} holder!`);
            // Update championship holder in database
            window.api.updateChampionshipHolder({
                championshipId: championship.id,
                wrestlerId: document.querySelector(`#wrestler${winnerIndex + 1}`).value
            });
        }
    }
    
    return story.join('\n');
}

window.simulateMatch = async () => {
    const matchType = document.getElementById('matchType').value;
    let wrestlers = [];
    let championship = null;
    
    if (matchType === '1v1') {
        const wrestler1 = document.querySelector('#wrestler1 option:checked').text;
        const wrestler2 = document.querySelector('#wrestler2 option:checked').text;
        wrestlers = [wrestler1, wrestler2];
        
        const championshipSelect = document.getElementById('singles-championship');
        if (championshipSelect.value) {
            championship = {
                id: championshipSelect.value,
                title_name: championshipSelect.options[championshipSelect.selectedIndex].text
            };
        }
    } else {
        const team1Wrestler1 = document.querySelector('#team1-wrestler1 option:checked').text;
        const team1Wrestler2 = document.querySelector('#team1-wrestler2 option:checked').text;
        const team2Wrestler1 = document.querySelector('#team2-wrestler1 option:checked').text;
        const team2Wrestler2 = document.querySelector('#team2-wrestler2 option:checked').text;
        wrestlers = [team1Wrestler1, team1Wrestler2, team2Wrestler1, team2Wrestler2];
        
        const championshipSelect = document.getElementById('tag-championship');
        if (championshipSelect.value) {
            championship = {
                id: championshipSelect.value,
                title_name: championshipSelect.options[championshipSelect.selectedIndex].text
            };
        }
    }
    
    const story = generateMatchStory(wrestlers, matchType === '2v2', championship);
    
    // Show results in dialog
    const resultsDialog = document.getElementById('match-results');
    document.getElementById('match-story').innerHTML = story.replace(/\n/g, '<br>');
    resultsDialog.showModal();
    
    // If there was a championship change, reload the championships
    if (championship) {
        if (matchType === '1v1') {
            await loadSinglesChampionships();
        } else {
            await loadTagChampionships();
        }
    }
};

// Data Manager Functions
window.closeDataEditor = (dialogId) => {
    const dialog = document.getElementById(dialogId);
    if (!dialog) return;
    
    dialog.close();
    document.body.style.pointerEvents = 'auto';
    
    // Remove any lingering backdrops
    const backdrops = document.querySelectorAll('.backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Ensure all dialogs are properly closed
    const allDialogs = document.querySelectorAll('dialog');
    allDialogs.forEach(dialog => {
        if (dialog.open) {
            dialog.close();
        }
    });
};

window.showDataEditor = (type) => {
    // Reset any lingering effects
    document.body.style.pointerEvents = 'auto';
    
    // Clean up any existing dialogs and backdrops
    const existingBackdrops = document.querySelectorAll('.backdrop');
    existingBackdrops.forEach(backdrop => backdrop.remove());
    
    const existingDialogs = document.querySelectorAll('dialog');
    existingDialogs.forEach(dialog => {
        if (dialog.open) {
            dialog.close();
        }
    });

    const dialog = document.getElementById(`${type}-editor`);
    dialog.showModal();
    
    if (type === 'wrestler-types') {
        loadWrestlerTypesTable();
    } else if (type === 'weight-classes') {
        loadWeightClassesTable();
    } else if (type === 'championships') {
        loadChampionshipForm();
        loadChampionshipsTable();
    }
    
    // Handle dialog close
    dialog.addEventListener('close', () => {
        document.body.style.pointerEvents = 'auto';
        const backdrops = document.querySelectorAll('.backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
    }, { once: true }); // Use once: true to prevent multiple listeners
};

async function loadWrestlerTypesTable() {
    const types = await window.api.getWrestlerTypes();
    const tbody = document.querySelector('#wrestlerTypesTable tbody');
    tbody.innerHTML = '';
    
    types.forEach(type => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${type.type_name}</td>
            <td>
                <button onclick="deleteWrestlerType(${type.id})" style="background-color: #f44336;">Remove</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadWeightClassesTable() {
    const classes = await window.api.getWeightClasses();
    const tbody = document.querySelector('#weightClassesTable tbody');
    tbody.innerHTML = '';
    
    classes.forEach(cls => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cls.class_name}</td>
            <td>
                <button onclick="deleteWeightClass(${cls.id})" style="background-color: #f44336;">Remove</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('wrestlerTypeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const typeName = document.getElementById('typeName').value;
    await window.api.addWrestlerType({ type_name: typeName });
    document.getElementById('typeName').value = '';
    await loadWrestlerTypesTable();
    await loadWrestlerTypes(); // Reload dropdown in wrestlers page
});

document.getElementById('weightClassForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const className = document.getElementById('className').value;
    await window.api.addWeightClass({ class_name: className });
    document.getElementById('className').value = '';
    await loadWeightClassesTable();
    await loadWeightClasses(); // Reload dropdown in wrestlers page
});

window.deleteWrestlerType = async (id) => {
    if (confirm('Are you sure you want to remove this wrestler type?')) {
        try {
            await window.api.deleteWrestlerType(id);
            await loadWrestlerTypesTable();
            await loadWrestlerTypes(); // Reload dropdown in wrestlers page
        } catch (err) {
            showModal('Cannot delete this type while wrestlers are using it');
        }
    }
};

window.deleteWeightClass = async (id) => {
    if (confirm('Are you sure you want to remove this weight class?')) {
        try {
            await window.api.deleteWeightClass(id);
            await loadWeightClassesTable();
            await loadWeightClasses(); // Reload dropdown in wrestlers page
        } catch (err) {
            showModal('Cannot delete this class while wrestlers are using it');
        }
    }
};

// Load data when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Starting data load');
    
    // Prevent form from submitting traditionally
    const form = document.getElementById('wrestlerForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }
    
    try {
        await loadBrands();  // Load brands first
        await loadWeightClasses();
        await loadWrestlerTypes();
        await loadFactions();
        await loadWrestlers();
        console.log('All data loaded successfully');
        
        // Set up form submission handler
        const form = document.getElementById('wrestlerForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                addWrestler();
            });
        }
        
        // Set up modal close handlers
        const modal = document.getElementById('messageModal');
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        if (modal) {
            window.onclick = (event) => {
                if (event.target === modal) {
                    closeModal();
                }
            };
        }
    } catch (error) {
        console.error('Error during initial data load:', error);
        showModal('Error loading data: ' + error.message);
    }
});

async function loadChampionships() {
    try {
        console.log('Loading championships...');
        const championships = await window.api.getChampionships();
        console.log('Received championships:', championships);

        const championshipsList = document.getElementById('championshipsList');
        if (!championshipsList) {
            console.error('Championships list element not found!');
            return;
        }

        // Clear existing items
        championshipsList.innerHTML = '';
        
        // Add championships from database
        if (Array.isArray(championships)) {
            championships.forEach(championship => {
                const div = document.createElement('div');
                div.className = 'championship-item';
                div.innerHTML = `
                    <span class="title">${championship.title_name}</span>
                    <span class="brand">${championship.brand_name}</span>
                    <span class="type">${championship.is_tag_team ? 'Tag Team' : 'Singles'}</span>
                `;
                championshipsList.appendChild(div);
            });
        }
        
        console.log('Championships list updated');
    } catch (error) {
        console.error('Error loading championships:', error);
        showModal('Error loading championships: ' + error.message);
    }
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });

    // Show the requested page
    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = 'block';

        // Load data based on the page
        if (pageId === 'wrestlerPage') {
            loadWrestlers();
        } else if (pageId === 'championshipPage') {
            loadChampionships();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const addChampionshipBtn = document.getElementById('addChampionshipBtn');
    const championshipModal = document.getElementById('championshipModal');
    const closeChampionshipModal = document.getElementById('closeChampionshipModal');

    if (addChampionshipBtn && championshipModal) {
        addChampionshipBtn.addEventListener('click', () => {
            championshipModal.style.display = 'block';
            loadChampionships(); // Load championships when modal opens
        });
    }

    if (closeChampionshipModal) {
        closeChampionshipModal.addEventListener('click', () => {
            championshipModal.style.display = 'none';
        });
    }
});

// Load default page on startup
document.addEventListener('DOMContentLoaded', () => {
    showPage('roster-management');
});
