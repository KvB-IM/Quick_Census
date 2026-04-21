import * as XLSX from 'xlsx';

        // --- DATA ---
        let zipLookup = new Map();
        
        const csvHeader = `"All Fields  Mandatory",First,Last,DoB,Gender,Relation,Zip,County,"State\n(Auto Fill)","FIPS\n(Auto Fill)",Phone,Email,"Household\n Income",ICHRA Class,COBRA,Retiree,"Waive\nCoverage",Smoker,"Last Tobacco\nUse Date",Current Premium,"Employer Current\nMonthly Contribution","Employee Current\nMonthly Contribution","Manual Premium",Family ID`;
        const AUTOSAVE_KEY = 'rapidEntryData';
        const API_KEY_LS_KEY = 'geminiApiKey';
        
        const APP_FIELDS = {
            familyId: { label: 'Family ID', guess: ['family id', 'group id', 'id', 'family'] },
            relation: { label: 'Relation', guess: ['relation', 'relationship', 'role', 'type'] },
            first: { label: 'First Name', guess: ['first', 'fname', 'first name'] },
            last: { label: 'Last Name', guess: ['last', 'lname', 'last name', 'surname'] },
            dob: { label: 'DoB', guess: ['dob', 'date of birth', 'birthday'] },
            gender: { label: 'Gender', guess: ['gender', 'sex'] },
            zip: { label: 'Zip', guess: ['zip', 'zipcode', 'postal code'] },
            county: { label: 'County', guess: ['county', 'parish'] },
            phone: { label: 'Phone', guess: ['phone', 'phone number', 'mobile'] },
            email: { label: 'Email', guess: ['email', 'email address'] },
            income: { label: 'Income', guess: ['income', 'household income', 'salary'] },
            ichra: { label: 'ICHRA Class', guess: ['ichra', 'ichra class', 'class'] },
            cobra: { label: 'Cobra', guess: ['cobra'] },
            retiree: { label: 'Retiree', guess: ['retiree'] },
            waive: { label: 'Waive Coverage', guess: ['waive', 'waive coverage'] },
            smoker: { label: 'Smoker', guess: ['smoker', 'tobacco'] },
            tobaccoDate: { label: 'Last Tobacco Use Date', guess: ['tobacco date', 'last use'] },
            premiumTotal: { label: 'Manual Total Premium', guess: ['premium', 'total premium'] },
            premiumEmployer: { label: 'Manual Employer Share', guess: ['emp share', 'employer share'] },
            premiumEmployee: { label: 'Manual Employee Share', guess: ['ee share', 'employee share'] }
        };
        
        let parsedImportData = [];
        let parsedImportSample = [];
        let currentImportHeaders = []; 
        let currentTransformationPlan = null;

        // --- GLOBAL STATE & REFS ---
        let familyCounter = 0;
        let isDirty = false;
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        let confirmResolve = null;

        // Element Refs
        let employeeTableBody, noFamiliesMessage, addEmployeeBtn, toggleAllBtn, saveCsvBtn, unifiedFileInput, adultPremiumInput, childPremiumInput, employerContributionInput, restoreBar, restoreBtn, dismissRestoreBtn, alertModal, alertMessage, alertOkBtn, confirmModal, confirmMessage, confirmOkBtn, confirmCancelBtn, zipLoadingStatus, shortcutsModal, shortcutsBtn, shortcutsCloseBtn, shortcutsOkBtn;
        
        let mapperModal, mapperGrid, mapperCancelBtn, mapperImportBtn;
        let geminiApiKeyInput, autoMapBtn, autoMapStatus;
        let clearDataBtn, downloadTemplateBtn;
        
        // START: Added form modal refs
        let familyFormModal, familyFormModalFamilyId, familyFormModalContent, familyFormModalSave, familyFormModalCancel, familyFormModalClose, familyFormModalAddDep;
        // END: Added form modal refs

        let makeDependentModal, makeDependentSourceFamilyId, makeDependentSelect, makeDependentCancelBtn, makeDependentOkBtn;
        let welcomeModal, helpBtn, closeWelcomeBtn, dontShowWelcomeCheck;


        /**
         * Assigns all global element references.
         */
        function assignElementRefs() {
            employeeTableBody = document.getElementById('employeeTableBody');
            noFamiliesMessage = document.getElementById('noFamiliesMessage');
            addEmployeeBtn = document.getElementById('addEmployeeBtn');
            toggleAllBtn = document.getElementById('toggleAllBtn');
            saveCsvBtn = document.getElementById('saveCsvBtn');
            unifiedFileInput = document.getElementById('unifiedFile');
            adultPremiumInput = document.getElementById('adultPremium');
            childPremiumInput = document.getElementById('childPremium');
            employerContributionInput = document.getElementById('employerContribution');
            restoreBar = document.getElementById('restoreBar');
            restoreBtn = document.getElementById('restoreBtn');
            dismissRestoreBtn = document.getElementById('dismissRestoreBtn');
            alertModal = document.getElementById('alertModal');
            alertMessage = document.getElementById('alertMessage');
            alertOkBtn = document.getElementById('alertOkBtn');
            confirmModal = document.getElementById('confirmModal');
            confirmMessage = document.getElementById('confirmMessage');
            confirmOkBtn = document.getElementById('confirmOkBtn');
            confirmCancelBtn = document.getElementById('confirmCancelBtn');
            zipLoadingStatus = document.getElementById('zip-loading-status');
            
            mapperModal = document.getElementById('mapperModal');
            mapperGrid = document.getElementById('mapperGrid');
            mapperCancelBtn = document.getElementById('mapperCancelBtn');
            mapperImportBtn = document.getElementById('mapperImportBtn');
            geminiApiKeyInput = document.getElementById('geminiApiKey');
            autoMapBtn = document.getElementById('autoMapBtn');
            autoMapStatus = document.getElementById('autoMapStatus');
            
            shortcutsModal = document.getElementById('shortcutsModal');
            shortcutsBtn = document.getElementById('shortcutsBtn');
            shortcutsCloseBtn = document.getElementById('shortcutsCloseBtn');
            shortcutsOkBtn = document.getElementById('shortcutsOkBtn');
            
            clearDataBtn = document.getElementById('clearDataBtn');
            downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
            
            // START: Added form modal refs
            familyFormModal = document.getElementById('familyFormModal');
            familyFormModalFamilyId = document.getElementById('familyFormModalFamilyId');
            familyFormModalContent = document.getElementById('familyFormModalContent');
            familyFormModalSave = document.getElementById('familyFormModalSave');
            familyFormModalCancel = document.getElementById('familyFormModalCancel');
            familyFormModalClose = document.getElementById('familyFormModalClose');
            familyFormModalAddDep = document.getElementById('familyFormModalAddDep');
            // END: Added form modal refs

            makeDependentModal = document.getElementById('makeDependentModal');
            makeDependentSourceFamilyId = document.getElementById('makeDependentSourceFamilyId');
            makeDependentSelect = document.getElementById('makeDependentSelect');
            makeDependentCancelBtn = document.getElementById('makeDependentCancelBtn');
            makeDependentOkBtn = document.getElementById('makeDependentOkBtn');
            
            welcomeModal = document.getElementById('welcomeModal');
            helpBtn = document.getElementById('helpBtn');
            closeWelcomeBtn = document.getElementById('closeWelcomeBtn');
            dontShowWelcomeCheck = document.getElementById('dontShowWelcomeCheck');
        }
        
        // --- TOAST NOTIFICATION ---
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            
            let bgClass = 'bg-slate-800';
            if (type === 'success') bgClass = 'bg-emerald-600';
            if (type === 'error') bgClass = 'bg-rose-600';
            
            toast.className = `${bgClass} text-white text-sm px-4 py-3 rounded-lg shadow-xl toast-slide-in flex items-center gap-2`;
            
            let icon = '';
            if (type === 'success') icon = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
            if (type === 'error') icon = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
            
            toast.innerHTML = `${icon}<span>${message}</span>`;
            
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
        
        // --- NEW FEATURES ---
        
        function clearAllData() {
            showConfirm("Are you sure you want to clear all data? This cannot be undone.").then(confirmed => {
                if (confirmed) {
                    employeeTableBody.innerHTML = '';
                    familyCounter = 0;
                    isDirty = false;
                    localStorage.removeItem(AUTOSAVE_KEY);
                    updateNoFamiliesMessage();
                    updateKPIs();
                    addFamilyBlock(null, [], false); // Add one empty row back
                    showToast("All data cleared.", "success");
                }
            });
        }
        
        function downloadTemplate() {
            // Simple template with just headers
            const blob = new Blob([csvHeader], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'census_template.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        function calculateAge(dobString) {
            if (!dobString) return '';
            const dob = new Date(dobString);
            const diff_ms = Date.now() - dob.getTime();
            const age_dt = new Date(diff_ms); 
            return Math.abs(age_dt.getUTCFullYear() - 1970);
        }
        
        function updateRowAge(row) {
            const dobInput = row.querySelector('.row-dob');
            const badge = row.querySelector('.age-badge');
            if (dobInput && badge) {
                const age = calculateAge(dobInput.value);
                badge.textContent = age ? `${age}y` : '';
            }
        }
        
        function checkDuplicates() {
            const rows = document.querySelectorAll('.family-row');
            const signatures = new Map();
            
            rows.forEach(row => {
                row.classList.remove('duplicate-row');
                const first = row.querySelector('.row-first').value.trim().toLowerCase();
                const last = row.querySelector('.row-last').value.trim().toLowerCase();
                const dob = row.querySelector('.row-dob').value;
                
                if (first && last && dob) {
                    const signature = `${first}|${last}|${dob}`;
                    if (signatures.has(signature)) {
                        // Mark both as duplicates
                        signatures.get(signature).classList.add('duplicate-row');
                        row.classList.add('duplicate-row');
                    } else {
                        signatures.set(signature, row);
                    }
                }
            });
        }
        
        function scrollToFirstError() {
            const firstError = document.querySelector('.border-red-500');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            } else {
                showToast("No errors found!", "success");
            }
        }
        
        function fillDownColumn(className) {
            const rows = document.querySelectorAll('.employee-row-start');
            if (rows.length < 2) return;
            
            const firstVal = rows[0].querySelector(`.${className}`).value;
            
            showConfirm(`Copy "${firstVal}" to all ${rows.length - 1} other employees?`).then(confirmed => {
                if(confirmed) {
                    rows.forEach((row, index) => {
                        if (index > 0) { // Skip first row
                             const input = row.querySelector(`.${className}`);
                             if(input) {
                                 input.value = firstVal;
                                 // Trigger events for validation/logic
                                 if (className === 'row-zip') validateZip(row);
                             }
                        }
                    });
                    showToast("Values copied down.", "success");
                    isDirty = true;
                    saveToLocalStorage();
                }
            });
        }

        // --- FORM MODAL FUNCTIONS ---

        function createDependentFormBlock(depRow) {
            const index = depRow.dataset.depIndex;
            const first = depRow.querySelector('.row-first').value;
            const last = depRow.querySelector('.row-last').value;
            const relation = depRow.querySelector('.row-relation').value;
            const dob = depRow.querySelector('.row-dob').value;
            const gender = depRow.querySelector('.row-gender').value;
            
            const isReadOnly = (relation === '');

            return `
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group" data-dep-index="${index}">
                    <button type="button" class="absolute top-3 right-3 text-slate-400 hover:text-rose-600 text-xs font-medium p-1 rounded-full hover:bg-rose-50 transition-colors" onclick="removeDependentFromForm('${index}')" title="Remove Dependent">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <h4 class="text-sm font-bold text-slate-800 mb-3">Dependent ${index}</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Relation</label>
                            <select id="form-dep-${index}-relation" class="w-full rounded-lg border-slate-200 bg-white shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="" ${relation === '' ? 'selected' : ''}>(No Relation)</option>
                                <option value="Spouse" ${relation === 'Spouse' ? 'selected' : ''}>Spouse</option>
                                <option value="Child" ${relation === 'Child' ? 'selected' : ''}>Child</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Gender</label>
                            <select id="form-dep-${index}-gender" class="w-full rounded-lg border-slate-200 bg-white shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" ${isReadOnly ? 'disabled' : ''}>
                                <option value="M" ${gender === 'M' ? 'selected' : ''}>Male</option>
                                <option value="F" ${gender === 'F' ? 'selected' : ''}>Female</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">First Name</label>
                            <input type="text" id="form-dep-${index}-first" class="w-full rounded-lg border-slate-200 bg-white shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${first}" ${isReadOnly ? 'readonly' : ''}>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Last Name</label>
                            <input type="text" id="form-dep-${index}-last" class="w-full rounded-lg border-slate-200 bg-white shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${last}" ${isReadOnly ? 'readonly' : ''}>
                        </div>
                    </div>
                     <div>
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Date of Birth</label>
                        <input type="date" id="form-dep-${index}-dob" class="w-full rounded-lg border-slate-200 bg-white shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${dob}" ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>
            `;
        }

        // Helper to remove dependent from form AND table (needs to be global or attached)
        window.removeDependentFromForm = function(index) {
            const familyId = document.getElementById('familyFormModalFamilyId').value;
            const depRow = document.querySelector(`[data-family-id="${familyId}"][data-dep-index="${index}"]`);
            if (depRow) {
                // Use the existing click handler on the clear button to handle logic
                depRow.querySelector('.clear-dep-btn').click(); 
            }
        };

        function openFamilyForm(familyId) {
            const empRow = document.querySelector(`.employee-row-start[data-family-id="${familyId}"]`);
            if (!empRow) return;

            document.getElementById('familyFormModalFamilyId').value = familyId;
            const content = document.getElementById('familyFormModalContent');
            content.innerHTML = '';

            // --- Build Employee Section ---
            const getVal = (sel) => empRow.querySelector(sel).value;
            const getChk = (sel) => empRow.querySelector(sel).checked;

            const empHtml = `
                <div class="space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">First Name</label>
                            <input type="text" id="form-emp-first" class="w-full rounded-lg border-slate-200 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${getVal('.row-first')}">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Last Name</label>
                            <input type="text" id="form-emp-last" class="w-full rounded-lg border-slate-200 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${getVal('.row-last')}">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Date of Birth</label>
                            <input type="date" id="form-emp-dob" class="w-full rounded-lg border-slate-200 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${getVal('.row-dob')}">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Gender</label>
                            <select id="form-emp-gender" class="w-full rounded-lg border-slate-200 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="M" ${getVal('.row-gender') === 'M' ? 'selected' : ''}>Male</option>
                                <option value="F" ${getVal('.row-gender') === 'F' ? 'selected' : ''}>Female</option>
                            </select>
                        </div>
                    </div>
                     <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Zip Code</label>
                            <input type="text" id="form-emp-zip" class="w-full rounded-lg border-slate-200 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${getVal('.row-zip')}">
                        </div>
                         <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone</label>
                            <input type="tel" id="form-emp-phone" class="w-full rounded-lg border-slate-200 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${getVal('.row-phone')}">
                        </div>
                    </div>
                    <div>
                         <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                         <input type="email" id="form-emp-email" class="w-full rounded-lg border-slate-200 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${getVal('.row-email')}">
                    </div>
                     <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Income</label>
                            <input type="number" id="form-emp-income" class="w-full rounded-lg border-slate-200 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${getVal('.row-income')}">
                        </div>
                        <div>
                             <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">ICHRA Class</label>
                             <select id="form-emp-ichra" class="w-full rounded-lg border-slate-200 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                <option ${getVal('.row-ichra') === 'Full Time' ? 'selected' : ''}>Full Time</option>
                                <option ${getVal('.row-ichra') === 'Part Time' ? 'selected' : ''}>Part Time</option>
                                <option ${getVal('.row-ichra') === 'Salary' ? 'selected' : ''}>Salary</option>
                                <option ${getVal('.row-ichra') === 'Hourly' ? 'selected' : ''}>Hourly</option>
                            </select>
                        </div>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" id="form-emp-cobra" class="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" ${getChk('.row-cobra') ? 'checked' : ''}>
                            <span class="text-sm text-slate-700">COBRA</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" id="form-emp-retiree" class="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" ${getChk('.row-retiree') ? 'checked' : ''}>
                            <span class="text-sm text-slate-700">Retiree</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" id="form-emp-waive" class="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" ${getChk('.row-waive') ? 'checked' : ''}>
                            <span class="text-sm text-slate-700">Waive</span>
                        </label>
                         <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" id="form-emp-smoker" class="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" ${getChk('.row-smoker') ? 'checked' : ''}>
                            <span class="text-sm text-slate-700">Smoker</span>
                        </label>
                    </div>
                     <div class="${getChk('.row-smoker') ? '' : 'hidden'}" id="form-emp-tobacco-container">
                        <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Last Tobacco Use Date</label>
                        <input type="date" id="form-emp-tobaccoDate" class="w-full rounded-lg border-slate-200 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" value="${getVal('.row-tobaccoDate')}">
                    </div>
                </div>
                <div class="space-y-4 mt-6 pt-6 border-t border-slate-100">
                    <h4 class="text-lg font-bold text-slate-900">Dependents</h4>
                    <div id="form-dependents-container" class="space-y-3"></div>
                </div>
            `;
            content.innerHTML = empHtml;
            
            // Wire up form-specific smoker toggle
            document.getElementById('form-emp-smoker').addEventListener('change', (e) => {
                document.getElementById('form-emp-tobacco-container').classList.toggle('hidden', !e.target.checked);
            });

            // --- Build Dependents Section ---
            const depContainer = document.getElementById('form-dependents-container');
            const depRows = document.querySelectorAll(`[data-family-id="${familyId}"].dependent-row`);
            depRows.forEach(depRow => {
                depContainer.insertAdjacentHTML('beforeend', createDependentFormBlock(depRow));
            });
            
            // Add listeners to form-dependents (like relation change)
            depContainer.addEventListener('change', (e) => {
                 if (e.target.id.includes('-relation')) {
                     const index = e.target.id.split('-')[2];
                     const isEnabled = e.target.value !== '';
                     document.getElementById(`form-dep-${index}-first`).readOnly = !isEnabled;
                     document.getElementById(`form-dep-${index}-last`).readOnly = !isEnabled;
                     document.getElementById(`form-dep-${index}-dob`).readOnly = !isEnabled;
                     document.getElementById(`form-dep-${index}-gender`).disabled = !isEnabled;
                 }
            });

            familyFormModal.style.display = 'flex';
        }

        function saveFamilyForm() {
            const familyId = document.getElementById('familyFormModalFamilyId').value;
            const empRow = document.querySelector(`.employee-row-start[data-family-id="${familyId}"]`);
            if (!empRow) return;

            // Sync Employee
            empRow.querySelector('.row-first').value = document.getElementById('form-emp-first').value;
            empRow.querySelector('.row-last').value = document.getElementById('form-emp-last').value;
            empRow.querySelector('.row-dob').value = document.getElementById('form-emp-dob').value;
            empRow.querySelector('.row-gender').value = document.getElementById('form-emp-gender').value;
            empRow.querySelector('.row-zip').value = document.getElementById('form-emp-zip').value;
            empRow.querySelector('.row-phone').value = document.getElementById('form-emp-phone').value;
            empRow.querySelector('.row-email').value = document.getElementById('form-emp-email').value;
            empRow.querySelector('.row-income').value = document.getElementById('form-emp-income').value;
            empRow.querySelector('.row-ichra').value = document.getElementById('form-emp-ichra').value;
            empRow.querySelector('.row-cobra').checked = document.getElementById('form-emp-cobra').checked;
            empRow.querySelector('.row-retiree').checked = document.getElementById('form-emp-retiree').checked;
            empRow.querySelector('.row-waive').checked = document.getElementById('form-emp-waive').checked;
            empRow.querySelector('.row-smoker').checked = document.getElementById('form-emp-smoker').checked;
            empRow.querySelector('.row-tobaccoDate').value = document.getElementById('form-emp-tobaccoDate').value;
            
            // Trigger change events for side effects (like tobacco toggle or zip validation)
            toggleTobaccoDate(empRow);
            validateZip(empRow); // Re-validate zip to update county/state if changed
            updateRowAge(empRow); // Calc age for main form

            // Sync Dependents
            const depRows = document.querySelectorAll(`[data-family-id="${familyId}"].dependent-row`);
            depRows.forEach(depRow => {
                const index = depRow.dataset.depIndex;
                const relationInput = document.getElementById(`form-dep-${index}-relation`);
                if (relationInput) {
                    depRow.querySelector('.row-relation').value = relationInput.value;
                    depRow.querySelector('.row-first').value = document.getElementById(`form-dep-${index}-first`).value;
                    depRow.querySelector('.row-last').value = document.getElementById(`form-dep-${index}-last`).value;
                    depRow.querySelector('.row-dob').value = document.getElementById(`form-dep-${index}-dob`).value;
                    depRow.querySelector('.row-gender').value = document.getElementById(`form-dep-${index}-gender`).value;
                    
                    // Trigger toggle logic
                    toggleDependentRow(depRow, relationInput.value, false);
                    updateRowAge(depRow); // Calc age for deps
                }
            });

            calculateFamilyPremium(familyId);
            isDirty = true;
            saveToLocalStorage();
            familyFormModal.style.display = 'none';
        }

        // --- CORE UI & DOM FUNCTIONS ---

        /**
         * Main controller for adding a new family block to the UI.
         * @param {object} empData - Data to populate the employee row (if loading).
         * @param {array} depDataList - Array of data for dependent rows (if loading).
         * @param {boolean} append - If true, appends to the end (for loading). If false, prepends to the top.
         */
        function addFamilyBlock(empData = null, depDataList = [], append = false) {
            // Collapse other families if we are adding a new, blank one
            if (!append && !empData) {
                collapseAllFamilies();
            }

            familyCounter++;
            const familyId = `fam-${familyCounter}`;

            // 1. Create the DOM fragment with data populated
            const fragment = createFamilyFragment(familyId, empData);
            
            // 2. Get all rows from the fragment (must do this *after* creating it)
            const rows = Array.from(fragment.querySelectorAll('.family-row'));
            const empRow = rows[0]; // First row is always employee

            // 3. Add all event listeners
            addListenersToFamily(empRow, familyId);

            // 4. Add to the page
            if (append) {
                employeeTableBody.appendChild(fragment);
            } else {
                employeeTableBody.prepend(fragment);
            }
            
            // 5. Post-append actions
            calculateFamilyPremium(familyId);
            isDirty = true;
            updateNoFamiliesMessage();
            
            // 6. Handle dependent loading
            if (empData && depDataList && depDataList.length > 0) {
                depDataList.forEach(depData => {
                    if (depData.relation) {
                        addDependentRow(empRow, familyId, depData, true); // true = isLoading
                    }
                });
            }

            // 7. Auto-expand and focus a new, blank row
            if (!append && !empData) {
                const toggleBtn = rows[0].querySelector('.toggle-family-btn');
                // Don't auto-expand new row
                // toggleFamily(familyId, toggleBtn);
                setTimeout(() => {
                    rows[0].querySelector('.row-first').focus();
                }, 0);
            }
            
            if (empData && (empData.manualPremium || empData.premiumTotal || empData.premiumEmployer || empData.premiumEmployee)) {
                empRow.querySelector('.row-manual-premium').checked = true;
                toggleManualPremium(empRow, true);
                empRow.querySelector('.row-premium-total-manual').value = empData.premiumTotal || '';
                empRow.querySelector('.row-premium-employer-manual').value = empData.premiumEmployer || '';
                const total = parseFloat(empData.premiumTotal) || 0;
                const employer = parseFloat(empData.premiumEmployer) || 0;
                empRow.querySelector('.row-premium-employee-manual').value = (total - employer).toFixed(2);
            }
        }
        
        /**
         * Creates the DocumentFragment for a family block and populates it with data.
         * @param {string} familyId - The unique ID for this family (e.g., "fam-1").
         * @param {object} empData - Employee data.
         * @returns {DocumentFragment} The populated DOM fragment.
         */
        function createFamilyFragment(familyId, empData = null) {
            const template = document.getElementById('familyBlockTemplate');
            const clone = template.content.cloneNode(true);
            const empRow = clone.querySelector('.family-row');
            empRow.dataset.familyId = familyId;

            if (empData) {
                // Populate employee row from data
                empRow.querySelector('.row-first').value = empData.first || '';
                empRow.querySelector('.row-last').value = empData.last || '';
                empRow.querySelector('.row-dob').value = empData.dob || '';
                empRow.querySelector('.row-gender').value = empData.gender || ''; // Default to empty
                empRow.querySelector('.row-zip').value = empData.zip || '';
                empRow.querySelector('.row-income').value = empData.income || '';
                empRow.querySelector('.row-ichra').value = empData.ichra || ''; // Default to empty
                empRow.querySelector('.row-phone').value = empData.phone || '';
                empRow.querySelector('.row-email').value = empData.email || '';
                // Handle booleans from mapper (could be string "true", "T", "1", "yes" etc)
                const isTrue = (val) => /^(true|t|1|yes|y)$/i.test(String(val));
                empRow.querySelector('.row-cobra').checked = isTrue(empData.cobra);
                empRow.querySelector('.row-retiree').checked = isTrue(empData.retiree);
                empRow.querySelector('.row-waive').checked = isTrue(empData.waive);
                empRow.querySelector('.row-smoker').checked = isTrue(empData.smoker);
                empRow.querySelector('.row-tobaccoDate').value = empData.tobaccoDate || '';
                empRow.querySelector('.row-fips').value = empData.fips || '';

                // Run initial validation on loaded data
                validateRequired(empRow.querySelector('.row-first'));
                validateRequired(empRow.querySelector('.row-last'));
                validateRequired(empRow.querySelector('.row-dob'));
                validateRequired(empRow.querySelector('.row-gender')); // New Validation
                validateRequired(empRow.querySelector('.row-ichra'));  // New Validation
                validateZip(empRow, empData.county); // Pass county for multi-county select
                validatePhone(empRow.querySelector('.row-phone'));
                validateEmail(empRow.querySelector('.row-email'));
                validateRequired(empRow.querySelector('.row-income'));
                toggleTobaccoDate(empRow);
                updateRowAge(empRow); // Calc age on load
            } else {
                // Run validateZip even on a new row to set up the blank county input
                validateZip(empRow, null);
                // Validate dropdowns immediately for new rows to show errors if user navigates away
                // validateRequired(empRow.querySelector('.row-gender')); 
                // validateRequired(empRow.querySelector('.row-ichra'));
            }
            
            return clone;
        }

        /**
         * Adds all necessary event listeners to a new employee row.
         * @param {HTMLElement} empRow - The employee's <tr> element.
         * @param {string} familyId - The unique ID for this family.
         */
        function addListenersToFamily(empRow, familyId) {
            // Employee row listeners
            empRow.querySelector('.row-first').addEventListener('input', (e) => validateRequired(e.currentTarget));
            empRow.querySelector('.row-last').addEventListener('input', (e) => validateRequired(e.currentTarget));
            empRow.querySelector('.row-dob').addEventListener('input', (e) => {
                validateRequired(e.currentTarget);
                updateRowAge(empRow);
            });
            
            // New Listeners for Dropdowns
            empRow.querySelector('.row-gender').addEventListener('change', (e) => {
                validateRequired(e.currentTarget);
                updateKPIs();
            });
            empRow.querySelector('.row-ichra').addEventListener('change', (e) => {
                validateRequired(e.currentTarget);
                updateKPIs();
            });

            empRow.querySelector('.row-zip').addEventListener('input', () => validateZip(empRow));
            empRow.querySelector('.row-phone').addEventListener('input', (e) => validatePhone(e.currentTarget));
            empRow.querySelector('.row-phone').addEventListener('blur', (e) => validatePhone(e.currentTarget, true)); // Auto-format on blur
            empRow.querySelector('.row-email').addEventListener('input', (e) => validateEmail(e.currentTarget));
            empRow.querySelector('.row-income').addEventListener('input', (e) => validateRequired(e.currentTarget));
            empRow.querySelector('.row-smoker').addEventListener('change', () => toggleTobaccoDate(empRow));

            empRow.querySelector('.make-dependent-btn').addEventListener('click', () => {
                const currentFamilyId = empRow.dataset.familyId;
                const allEmployees = document.querySelectorAll('.employee-row-start');
                
                if (allEmployees.length <= 1) {
                    showAlert('No other employees to attach this dependent to.');
                    return;
                }
                
                // Populate select
                makeDependentSelect.innerHTML = '<option value="">-- Select Employee --</option>';
                allEmployees.forEach(row => {
                    const famId = row.dataset.familyId;
                    if (famId !== currentFamilyId) {
                        const first = row.querySelector('.row-first').value || 'Unknown';
                        const last = row.querySelector('.row-last').value || '';
                        
                        const option = document.createElement('option');
                        option.value = famId;
                        option.textContent = `${first} ${last} (ID: ${famId})`;
                        makeDependentSelect.appendChild(option);
                    }
                });
                
                let prevRow = empRow.previousElementSibling;
                while (prevRow && !prevRow.classList.contains('employee-row-start')) {
                    prevRow = prevRow.previousElementSibling;
                }
                if (prevRow) {
                    makeDependentSelect.value = prevRow.dataset.familyId;
                } else {
                    makeDependentSelect.value = '';
                }
                
                makeDependentSourceFamilyId.value = currentFamilyId;
                makeDependentModal.style.display = 'flex';
            });
            empRow.querySelector('.remove-family-btn').addEventListener('click', async () => {
                const confirmed = await showConfirm('Are you sure you want to remove this employee and all their dependents?');
                if (confirmed) {
                    document.querySelectorAll(`[data-family-id="${familyId}"]`).forEach(row => row.remove());
                    isDirty = true;
                    updateNoFamiliesMessage();
                    updateKPIs();
                    saveToLocalStorage();
                }
            });
            
            empRow.querySelector('.toggle-family-btn').addEventListener('click', (e) => {
                toggleFamily(familyId, e.currentTarget);
            });
            
            empRow.querySelector('.add-dependent-btn').addEventListener('click', (e) => {
                addDependentRow(empRow, familyId, null, false);
            });
            
            empRow.querySelector('.open-form-btn').addEventListener('click', (e) => {
                openFamilyForm(familyId);
            });
            
            empRow.querySelector('.row-manual-premium').addEventListener('change', (e) => {
                toggleManualPremium(empRow, e.target.checked);
            });
            
            empRow.querySelector('.row-premium-total-manual').addEventListener('input', () => calculateManualEeShare(empRow));
            empRow.querySelector('.row-premium-employer-manual').addEventListener('input', () => calculateManualEeShare(empRow));
        }
        
        /**
         * Adds a single dependent row after the employee or last dependent.
         * @param {HTMLElement} empRow - The employee's <tr> element.
         * @param {string} familyId - The family ID.
         * @param {object} depData - Data to populate the row (if loading).
         * @param {boolean} isLoading - True if loading from a file.
         */
        function addDependentRow(empRow, familyId, depData = null, isLoading = false) {
            const dependentRows = document.querySelectorAll(`[data-family-id="${familyId}"].dependent-row`);
            const depCount = dependentRows.length;
            
            if (depCount >= 6) {
                if (!isLoading) { // Only show alert on manual add
                    showAlert('A maximum of 6 dependents is allowed.');
                }
                return null; // Return null to signify failure
            }
            
            if (depCount === 5) {
                empRow.querySelector('.add-dependent-btn').disabled = true;
                if (familyFormModalFamilyId.value === familyId) {
                    familyFormModalAddDep.disabled = true;
                }
            }

            const template = document.getElementById('dependentRowTemplate');
            const clone = template.content.cloneNode(true);
            const newDepRow = clone.querySelector('.family-row');
            newDepRow.dataset.familyId = familyId;
            newDepRow.dataset.depIndex = depCount + 1;
            
            // Add listeners to the new dependent row
            newDepRow.querySelector('.row-relation').addEventListener('change', async (e) => {
                const newRelation = e.target.value;
                if (newRelation === 'Spouse') {
                    const otherSpouse = document.querySelector(`[data-family-id="${familyId}"] select.row-relation[value="Spouse"]`);
                    if (otherSpouse && otherSpouse !== e.target) {
                        showAlert('Only one spouse is allowed per family.');
                        e.target.value = '';
                        toggleDependentRow(newDepRow, '', false);
                        return;
                    }
                }
                toggleDependentRow(newDepRow, newRelation, false);
                calculateFamilyPremium(familyId);

                if (newRelation === 'Spouse' || newRelation === 'Child') {
                    setTimeout(() => {
                        newDepRow.querySelector('.row-first').focus();
                    }, 0); 
                }
            });
            
            newDepRow.querySelector('.make-employee-btn').addEventListener('click', async () => {
                const confirmed = await showConfirm('Extract this dependent into a standalone Employee row?');
                if (!confirmed) return;
                
                const first = newDepRow.querySelector('.row-first').value;
                const last = newDepRow.querySelector('.row-last').value;
                const dob = newDepRow.querySelector('.row-dob').value;
                const gender = newDepRow.querySelector('.row-gender').value;
                
                // Get parent employee household data
                const zip = empRow.querySelector('.row-zip').value;
                const county = empRow.querySelector('.row-county').value;
                const state = empRow.querySelector('.row-state').value;
                const fips = empRow.querySelector('.row-fips').value;
                const phone = empRow.querySelector('.row-phone').value;
                const email = empRow.querySelector('.row-email').value;
                const income = empRow.querySelector('.row-income').value;
                
                const empData = {
                    first, last, dob, gender,
                    zip, county, state, fips, phone, email, income
                };
                
                // Remove dependent row
                const depIndex = newDepRow.dataset.depIndex;
                newDepRow.remove();
                if (familyFormModal.style.display === 'flex' && familyFormModalFamilyId.value === familyId) {
                    const formDep = familyFormModalContent.querySelector(`[data-dep-index="${depIndex}"]`);
                    if (formDep) formDep.remove();
                }
                
                calculateFamilyPremium(familyId);
                empRow.querySelector('.add-dependent-btn').disabled = false;
                if (familyFormModalFamilyId.value === familyId) familyFormModalAddDep.disabled = false;
                
                // Create new family block
                addFamilyBlock(empData, [], false);
                
                isDirty = true;
                saveToLocalStorage();
            });
            
            newDepRow.querySelector('.clear-dep-btn').addEventListener('click', () => {
                const depIndex = newDepRow.dataset.depIndex;
                newDepRow.remove();
                
                if (familyFormModal.style.display === 'flex' && familyFormModalFamilyId.value === familyId) {
                    const formDep = familyFormModalContent.querySelector(`[data-dep-index="${depIndex}"]`);
                    if (formDep) {
                        formDep.remove();
                    }
                }
                
                calculateFamilyPremium(familyId);
                empRow.querySelector('.add-dependent-btn').disabled = false;
                if (familyFormModalFamilyId.value === familyId) {
                    familyFormModalAddDep.disabled = false;
                }
                isDirty = true;
                saveToLocalStorage();
            });
            
            newDepRow.querySelector('.row-first').addEventListener('input', (e) => validateRequired(e.currentTarget));
            newDepRow.querySelector('.row-last').addEventListener('input', (e) => validateRequired(e.currentTarget));
            newDepRow.querySelector('.row-dob').addEventListener('input', (e) => {
                validateRequired(e.currentTarget);
                updateRowAge(newDepRow);
            });
            
            // New Listener for Dependent Gender
            newDepRow.querySelector('.row-gender').addEventListener('change', (e) => {
                 validateRequired(e.currentTarget);
                 updateKPIs();
            });

            // Populate data if provided
            if (depData) {
                newDepRow.querySelector('.row-relation').value = depData.relation;
                toggleDependentRow(newDepRow, depData.relation, true); // true = isLoading
                newDepRow.querySelector('.row-first').value = depData.first || '';
                newDepRow.querySelector('.row-last').value = depData.last || '';
                newDepRow.querySelector('.row-dob').value = depData.dob || '';
                newDepRow.querySelector('.row-gender').value = depData.gender || ''; // Default empty
                
                validateRequired(newDepRow.querySelector('.row-first'));
                validateRequired(newDepRow.querySelector('.row-last'));
                validateRequired(newDepRow.querySelector('.row-dob'));
                validateRequired(newDepRow.querySelector('.row-gender')); // Validate gender
                updateRowAge(newDepRow); // Calc age on load
            }
            
            // Insert the new row in the correct place
            const lastDepRow = dependentRows[depCount - 1];
            if (lastDepRow) {
                lastDepRow.after(newDepRow);
            } else {
                empRow.after(newDepRow);
            }
            
            // Auto-focus the new row's relation field if adding manually
            if (!isLoading) {
                newDepRow.querySelector('.row-relation').focus();
            }
            
            return newDepRow; // Return the new row
        }


        /**
         * Toggles a dependent row's fields between enabled and disabled.
         * @param {HTMLElement} row - The <tr> element of the dependent.
         * @param {string} relation - The new relation ("Spouse", "Child", or "").
         * @param {boolean} isLoading - True if populating from a file (suppresses auto-fill).
         */
        function toggleDependentRow(row, relation, isLoading) {
            const isEnabled = (relation === 'Spouse' || relation === 'Child');
            
            const firstName = row.querySelector('.row-first');
            const lastName = row.querySelector('.row-last');
            const dob = row.querySelector('.row-dob');
            const gender = row.querySelector('.row-gender');
            // const clearBtn = row.querySelector('.clear-dep-btn'); // No longer needed here

            firstName.readOnly = !isEnabled;
            lastName.readOnly = !isEnabled;
            dob.readOnly = !isEnabled;
            gender.disabled = !isEnabled;
            
            // FIX: Removed logic that disabled/hid the clear button. 
            // It is now always enabled and controlled by CSS hover.

            if (!isEnabled) {
                firstName.value = '';
                lastName.value = '';
                dob.value = '';
                gender.value = ''; // Reset to empty
                validateRequired(firstName);
                validateRequired(lastName);
                validateRequired(dob);
                // We don't need to validate gender if it's disabled, validateRequired handles readOnly/disabled logic
                validateRequired(gender);
                
                row.querySelector('.age-badge').textContent = ''; // Clear age
            } else {
                if (!isLoading) {
                    const familyId = row.dataset.familyId;
                    const empRow = document.querySelector(`[data-family-id="${familyId}"][data-relation="Employee"]`);
                    lastName.value = empRow.querySelector('.row-last').value;
                    // Ensure validation runs on enable
                    validateRequired(firstName);
                    validateRequired(dob);
                    validateRequired(gender);
                }
            }
        }
        
        /**
         * Toggles the visibility of a family's dependent rows.
         * @param {string} familyId - The family ID to toggle.
         * @param {HTMLElement} btn - The toggle button that was clicked.
         */
        function toggleFamily(familyId, btn) {
            const state = btn.dataset.state;
            const depRows = document.querySelectorAll(`[data-family-id="${familyId}"].dependent-row`);
            
            if (state === 'collapsed') {
                depRows.forEach(row => row.classList.remove('hidden'));
                btn.dataset.state = 'expanded';
                btn.style.transform = 'rotate(180deg)';
            } else {
                depRows.forEach(row => row.classList.add('hidden'));
                btn.dataset.state = 'collapsed';
                btn.style.transform = 'rotate(0deg)';
            }
        }

        /**
         * Collapses all expanded family blocks.
         */
        function collapseAllFamilies() {
            const allToggleButtons = document.querySelectorAll('.toggle-family-btn[data-state="expanded"]');
            allToggleButtons.forEach(btn => {
                toggleFamily(btn.closest('tr').dataset.familyId, btn);
            });
            
            if (toggleAllBtn.dataset.state === 'expanded') {
                toggleAllBtn.textContent = 'Expand All';
                toggleAllBtn.dataset.state = 'collapsed';
            }
        }
        
        /**
         * Expands all collapsed family blocks.
         */
        function expandAllFamilies() {
            const allToggleButtons = document.querySelectorAll('.toggle-family-btn[data-state="collapsed"]');
            allToggleButtons.forEach(btn => {
                toggleFamily(btn.closest('tr').dataset.familyId, btn);
            });
            
            if (toggleAllBtn.dataset.state === 'collapsed') {
                toggleAllBtn.textContent = 'Collapse All';
                toggleAllBtn.dataset.state = 'expanded';
            }
        }
        
        /**
         * Controls the "Expand All / Collapse All" button.
         */
        function toggleAllFamiliesBtn() {
            const state = toggleAllBtn.dataset.state;
            if (state === 'collapsed') {
                expandAllFamilies();
            } else {
                collapseAllFamilies();
            }
        }
        
        /**
         * Shows or hides the "No families" message.
         */
        function updateNoFamiliesMessage() {
            if (employeeTableBody.children.length === 0) {
                noFamiliesMessage.classList.remove('hidden');
            } else {
                noFamiliesMessage.classList.add('hidden');
            }
        }

        // --- ZIP/COUNTY LOGIC ---

        /**
         * Replaces the county text input with a new element (input or select).
         * @param {HTMLElement} row - The <tr> element.
         * @param {HTMLElement} newElement - The new element to insert.
         */
        function replaceCountyField(row, newElement) {
            const container = row.querySelector('.county-cell-container');
            container.innerHTML = ''; // Clear old field
            container.appendChild(newElement);
        }

        /**
         * Creates a standardized text input for the county field.
         * @param {string} value - The value for the input.
         * @param {boolean} isReadonly - Whether the input should be readonly.
         * @returns {HTMLInputElement}
         */
        function createCountyInput(value, isReadonly) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'row-county table-input';
            input.value = value || '';
            input.placeholder = 'County';
            input.readOnly = isReadonly;
            return input;
        }

        /**
         * Creates a dropdown (select) for a multi-county zip.
         * @param {array} locs - The list of location objects for this zip.
         * @param {HTMLElement} row - The <tr> element.
         * @returns {HTMLSelectElement}
         */
        function createCountyDropdown(locs, row) {
            const select = document.createElement('select');
            select.className = 'row-county table-select';
            
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = '-- Select County --';
            select.appendChild(defaultOpt);

            locs.forEach(loc => {
                const option = document.createElement('option');
                option.value = loc.county;
                option.textContent = loc.county;
                option.dataset.fips = loc.fips;
                option.dataset.state = loc.state;
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const fipsInput = row.closest('.family-row').querySelector('.row-fips');
                const stateInput = row.closest('.family-row').querySelector('.row-state');
                
                if (selectedOption.value) {
                    fipsInput.value = selectedOption.dataset.fips;
                    stateInput.value = selectedOption.dataset.state;
                    select.style.borderColor = '';
                    select.style.setProperty('--tw-ring-color', '');
                    select.classList.remove('border-red-500');
                } else {
                    fipsInput.value = '';
                    stateInput.value = locs[0].state;
                }
                isDirty = true;
                saveToLocalStorage();
            });
            return select;
        }
        
        // --- VALIDATION FUNCTIONS ---
        
        /**
         * Validates all required fields before saving.
         * @returns {boolean} True if all fields are valid.
         */
        function validateAllFields() {
            let allValid = true;

            document.querySelectorAll('.employee-row-start').forEach(empRow => {
                const familyId = empRow.dataset.familyId;
                
                const fieldsToValidate = [
                    validateRequired(empRow.querySelector('.row-first')),
                    validateRequired(empRow.querySelector('.row-last')),
                    validateRequired(empRow.querySelector('.row-dob')),
                    validateRequired(empRow.querySelector('.row-gender')), // Added
                    validateRequired(empRow.querySelector('.row-ichra')),  // Added
                    validateZip(empRow, empRow.querySelector('.row-county').value),
                    validatePhone(empRow.querySelector('.row-phone')),
                    validateEmail(empRow.querySelector('.row-email')),
                    validateRequired(empRow.querySelector('.row-income'))
                ];
                
                document.querySelectorAll(`[data-family-id="${familyId}"].dependent-row`).forEach(depRow => {
                    const relation = depRow.querySelector('.row-relation').value;
                    if (relation === 'Spouse' || relation === 'Child') {
                        fieldsToValidate.push(validateRequired(depRow.querySelector('.row-first')));
                        fieldsToValidate.push(validateRequired(depRow.querySelector('.row-last')));
                        fieldsToValidate.push(validateRequired(depRow.querySelector('.row-dob')));
                        fieldsToValidate.push(validateRequired(depRow.querySelector('.row-gender'))); // Added
                    }
                });
                
                const countyField = empRow.querySelector('.row-county');
                if (countyField.tagName === 'SELECT' && countyField.value === '') {
                    fieldsToValidate.push(false);
                    countyField.style.borderColor = '#ef4444';
                    countyField.style.setProperty('--tw-ring-color', '#ef4444');
                    countyField.classList.add('border-red-500');
                }

                if (fieldsToValidate.some(isValid => !isValid)) {
                    allValid = false;
                }
            });
            
            return allValid;
        }

        /**
         * Validates a single required field (e.g., first name, last name, DOB).
         * @param {HTMLInputElement} inputEl - The input element to check.
         * @returns {boolean} True if valid.
         */
        function validateRequired(inputEl) {
            if (inputEl.readOnly || inputEl.disabled) {
                inputEl.style.borderColor = ''; 
                inputEl.style.setProperty('--tw-ring-color', ''); 
                inputEl.classList.remove('border-red-500');
                return true;
            }
            
            if (inputEl.value.trim() !== '') {
                inputEl.style.borderColor = '';
                inputEl.style.setProperty('--tw-ring-color', '');
                inputEl.classList.remove('border-red-500');
                return true;
            } else {
                inputEl.style.borderColor = '#ef4444';
                inputEl.style.setProperty('--tw-ring-color', '#ef4444');
                inputEl.classList.add('border-red-500');
                return false;
            }
        }
        
        /**
         * Validates and auto-formats a phone number field.
         * @param {HTMLInputElement} inputEl - The phone input.
         * @param {boolean} formatOnBlur - Flag to reformat the number.
         * @returns {boolean} True if valid.
         */
        function validatePhone(inputEl, formatOnBlur = false) {
            let digits = (inputEl.value || '').replace(/\D/g, '');
            
            if (digits.length === 11 && digits.startsWith('1')) {
                digits = digits.substring(1);
            }

            if (digits.length === 10) {
                if (formatOnBlur) {
                    const formatted = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
                    inputEl.value = formatted;
                }
                inputEl.style.borderColor = '';
                inputEl.style.setProperty('--tw-ring-color', '');
                inputEl.classList.remove('border-red-500');
                return true;
            } else if (digits.length === 0 && !inputEl.readOnly) {
                inputEl.style.borderColor = '#ef4444'; 
                inputEl.style.setProperty('--tw-ring-color', '#ef4444');
                inputEl.classList.add('border-red-500');
                return false;
            } else if (digits.length > 0 && digits.length !== 10) {
                inputEl.style.borderColor = '#ef4444';
                inputEl.style.setProperty('--tw-ring-color', '#ef4444');
                inputEl.classList.add('border-red-500');
                return false;
            } else {
                inputEl.style.borderColor = '';
                inputEl.style.setProperty('--tw-ring-color', '');
                inputEl.classList.remove('border-red-500');
                return true;
            }
        }
        
        /**
         * Validates an email field.
         * @param {HTMLInputElement} inputEl - The email input.
         * @returns {boolean} True if valid.
         */
        function validateEmail(inputEl) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(inputEl.value)) {
                inputEl.style.borderColor = '';
                inputEl.style.setProperty('--tw-ring-color', '');
                inputEl.classList.remove('border-red-500');
                return true;
            } else {
                inputEl.style.borderColor = '#ef4444';
                inputEl.style.setProperty('--tw-ring-color', '#ef4444');
                inputEl.classList.add('border-red-500');
                return false;
            }
        }

        /**
         * Validates a ZIP code, auto-filling county/state and handling multi-county zips.
         * @param {HTMLElement} row - The <tr> element.
         * @param {string} selectedCounty - The pre-selected county (if loading).
         * @returns {boolean} True if the ZIP is valid.
         */
        function validateZip(row, selectedCounty = null) {
            const zipInput = row.querySelector('.row-zip');
            const stateInput = row.querySelector('.row-state');
            const fipsInput = row.querySelector('.row-fips');
            const zip = zipInput.value;

            if (zipLookup.has(zip)) {
                const locs = zipLookup.get(zip);

                if (locs.length === 1) {
                    const loc = locs[0];
                    replaceCountyField(row, createCountyInput(loc.county, true));
                    stateInput.value = loc.state;
                    fipsInput.value = loc.fips;
                    zipInput.style.borderColor = '';
                    zipInput.style.setProperty('--tw-ring-color', '');
                    zipInput.classList.remove('border-red-500');
                    return true;
                } else {
                    const dropdown = createCountyDropdown(locs, row);
                    if (selectedCounty && locs.some(loc => loc.county === selectedCounty)) {
                        dropdown.value = selectedCounty;
                        const selectedOption = dropdown.options[dropdown.selectedIndex];
                        fipsInput.value = selectedOption.dataset.fips;
                        stateInput.value = selectedOption.dataset.state;
                    } else {
                        fipsInput.value = '';
                        stateInput.value = locs[0].state;
                    }
                    replaceCountyField(row, dropdown);
                    zipInput.style.borderColor = '';
                    zipInput.style.setProperty('--tw-ring-color', '');
                    zipInput.classList.remove('border-red-500');
                    return true;
                }
            } else {
                replaceCountyField(row, createCountyInput('', true));
                stateInput.value = '';
                fipsInput.value = '';
                if(zip.length > 0) {
                    zipInput.style.borderColor = '#ef4444';
                    zipInput.style.setProperty('--tw-ring-color', '#ef4444');
                    zipInput.classList.add('border-red-500');
                } else { 
                    zipInput.style.borderColor = '#ef4444';
                    zipInput.style.setProperty('--tw-ring-color', '#ef4444');
                    zipInput.classList.add('border-red-500');
                }
                return false;
            }
        }
        
        /**
         * Toggles the "Tobacco Date" field based on the "Smoker" checkbox.
         * @param {HTMLElement} row - The <tr> element.
         */
        function toggleTobaccoDate(row) {
            const smokerCheck = row.querySelector('.row-smoker');
            const tobaccoDateInput = row.querySelector('.row-tobaccoDate');
            
            if (smokerCheck.checked) {
                tobaccoDateInput.readOnly = false;
                tobaccoDateInput.classList.remove('table-input:read-only');
            } else {
                tobaccoDateInput.readOnly = true;
                tobaccoDateInput.value = '';
                tobaccoDateInput.classList.add('table-input:read-only');
            }
        }
        
        /**
         * Toggles the premium fields between calculated text and manual input.
         * @param {HTMLElement} empRow - The employee's <tr> element.
         * @param {boolean} isManual - Whether to enable manual mode.
         */
        function toggleManualPremium(empRow, isManual) {
            const totalSpan = empRow.querySelector('.row-premium-total');
            const employerSpan = empRow.querySelector('.row-premium-employer');
            const employeeSpan = empRow.querySelector('.row-premium-employee');
            
            const totalInput = empRow.querySelector('.row-premium-total-manual');
            const employerInput = empRow.querySelector('.row-premium-employer-manual');
            const employeeInput = empRow.querySelector('.row-premium-employee-manual');

            totalSpan.classList.toggle('hidden', isManual);
            employerSpan.classList.toggle('hidden', isManual);
            employeeSpan.classList.toggle('hidden', isManual);
            
            totalInput.classList.toggle('hidden', !isManual);
            employerInput.classList.toggle('hidden', !isManual);
            employeeInput.classList.toggle('hidden', !isManual);

            if (isManual) {
                calculateManualEeShare(empRow);
            } else {
                totalInput.value = '';
                employerInput.value = '';
                employeeInput.value = '';
                calculateFamilyPremium(empRow.dataset.familyId);
            }
        }
        
        /**
         * Calculates the Employee Share for manual premium entry.
         * @param {HTMLElement} empRow - The employee's <tr> element.
         */
        function calculateManualEeShare(empRow) {
            const total = parseFloat(empRow.querySelector('.row-premium-total-manual').value) || 0;
            const employer = parseFloat(empRow.querySelector('.row-premium-employer-manual').value) || 0;
            const employeeInput = empRow.querySelector('.row-premium-employee-manual');
            employeeInput.value = (total - employer).toFixed(2);
        }
        

        // --- DATA & LOGIC FUNCTIONS ---
        
        /**
         * Updates the KPI dashboard in the toolbar.
         */
        function updateKPIs() {
            // Only count visible rows (respects search filter)
            // Actually, KPIs usually reflect the Total dataset, not just the filtered view.
            // Let's keep KPIs counting TOTAL rows, but search just hides them visually.
            // If you want filtered KPIs, we would use check visibility.
            
            const empCount = document.querySelectorAll('.employee-row-start').length;
            const depCount = document.querySelectorAll('.dependent-row').length;
            const errorCount = document.querySelectorAll('.table-input.border-red-500, .table-select.border-red-500').length;
            
            document.getElementById('kpi-employees').textContent = empCount;
            document.getElementById('kpi-dependents').textContent = depCount;
            
            const errorContainer = document.getElementById('kpi-errors-container');
            const errorValue = document.getElementById('kpi-errors');
            
            if (errorCount > 0) {
                errorContainer.classList.remove('hidden');
                errorContainer.classList.add('flex');
                errorValue.textContent = errorCount;
            } else {
                errorContainer.classList.add('hidden');
                errorContainer.classList.remove('flex');
            }
        }
        
        /**
         * Filter table based on search input
         */
        function filterTable() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const families = document.querySelectorAll('.employee-row-start');
            let visibleCount = 0;

            families.forEach(empRow => {
                const familyId = empRow.dataset.familyId;
                const depRows = document.querySelectorAll(`[data-family-id="${familyId}"].dependent-row`);
                
                // Gather searchable text from Employee
                const empText = [
                    empRow.querySelector('.row-first').value,
                    empRow.querySelector('.row-last').value,
                    empRow.querySelector('.row-email').value,
                    empRow.querySelector('.row-phone').value,
                    empRow.querySelector('.row-zip').value
                ].join(' ').toLowerCase();
                
                // Gather searchable text from Dependents
                let depText = '';
                depRows.forEach(dep => {
                    depText += ' ' + dep.querySelector('.row-first').value;
                    depText += ' ' + dep.querySelector('.row-last').value;
                });
                
                const fullText = empText + ' ' + depText;
                
                // Show/Hide
                if (fullText.includes(query)) {
                    empRow.classList.remove('hidden');
                    // Maintain expansion state or keep closed? Let's respect current toggle state of dependents
                    // But ensure dependents are hidden if parent matches but toggle is collapsed
                    // Actually, display:none on parent hides everything usually, but dependents are separate TRs.
                    // We need to hide dependents if employee is hidden.
                    const toggleState = empRow.querySelector('.toggle-family-btn').dataset.state;
                    
                    if (toggleState === 'expanded') {
                        depRows.forEach(d => d.classList.remove('hidden'));
                    } else {
                         depRows.forEach(d => d.classList.add('hidden'));
                    }
                    visibleCount++;
                } else {
                    empRow.classList.add('hidden');
                    depRows.forEach(d => d.classList.add('hidden'));
                }
            });
            
            // Handle "No Results" state visually
            if (visibleCount === 0 && families.length > 0) {
                // Optional: Show a "No search results" message?
                // For now, just letting the table be empty is standard behavior
            }
        }

        /**
         * Recalculates premiums for all families on the page.
         */
        function recalculateAllPremiums() {
            document.querySelectorAll('.employee-row-start').forEach(empRow => {
                if (!empRow.querySelector('.row-manual-premium').checked) {
                    calculateFamilyPremium(empRow.dataset.familyId);
                }
            });
        }

        /**
         * Calculates and updates the premium display for a single family.
         * @param {string} familyId - The family ID.
         */
        function calculateFamilyPremium(familyId) {
            const empRow = document.querySelector(`[data-family-id="${familyId}"][data-relation="Employee"]`);
            if (!empRow || empRow.querySelector('.row-manual-premium').checked) {
                return;
            }

            let numAdults = 1;
            let numChildren = 0;
            
            document.querySelectorAll(`[data-family-id="${familyId}"] .row-relation`).forEach(select => {
                if (select.value === 'Spouse') numAdults++;
                if (select.value === 'Child') numChildren++;
            });

            const adultPremium = parseFloat(adultPremiumInput.value) || 850;
            const childPremium = parseFloat(childPremiumInput.value) || 450;
            const employerContributionPercent = (parseFloat(employerContributionInput.value) / 100) || 0.5;

            const totalPremium = (numAdults * adultPremium) + (numChildren * childPremium);
            const employerShare = totalPremium * employerContributionPercent;
            const employeeShare = totalPremium - employerShare;
            
            empRow.querySelector('.row-premium-total').textContent = formatter.format(totalPremium);
            empRow.querySelector('.row-premium-employer').textContent = formatter.format(employerShare);
            empRow.querySelector('.row-premium-employee').textContent = formatter.format(employeeShare);
        }

        // --- HELPER FUNCTIONS FOR DATA CLEANING ---

        function normalizeDate(dateStr) {
            if (!dateStr) return '';
            const str = String(dateStr).trim();
            
            // Already in correct format?
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
            
            const d = new Date(str);
            if (isNaN(d.getTime())) return str; // Return original if we can't parse it
            
            // Use local time components to avoid timezone shifting bugs
            // (e.g. "1/1/1990" becoming "12/31/1989" due to UTC conversion)
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        }

        function normalizePhone(phoneStr) {
            if (!phoneStr) return '';
            const str = String(phoneStr);
            const digits = str.replace(/\D/g, ''); // Strip all non-digits
            
            // Standard 10 digit US number
            if (digits.length === 10) {
                return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
            }
            // 11 digit with leading 1
            if (digits.length === 11 && digits.startsWith('1')) {
                return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
            }
            
            return str; // Return original if it doesn't match standard lengths
        }

        function normalizeGender(genderStr) {
            if (!genderStr) return '';
            const g = String(genderStr).trim().toUpperCase();
            if (g === 'MALE' || g === 'M') return 'M';
            if (g === 'FEMALE' || g === 'F') return 'F';
            return '';
        }

        // --- CSV LOAD/SAVE FUNCTIONS ---

        // START: UNIFIED IMPORT LOGIC

        /**
         * Handles the file selection for the Unified Import button.
         * Auto-detects whether to use standard load or mapper.
         * @param {Event} e - The file input change event.
         */
        async function handleUnifiedFileSelect(e) {
            if (isDirty) {
                const confirmed = await showConfirm('Loading a new file will replace your current unsaved work. Are you sure?');
                if (!confirmed) {
                    unifiedFileInput.value = '';
                    return;
                }
            }

            const file = e.target.files[0];
            if (!file) return;

            const processData = (dataToParse) => {
                Papa.parse(dataToParse, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (header) => header.trim(),
                    preview: 20, // Read first 20 lines to sniff format
                    complete: (previewResults) => {
                        if (!previewResults.data || previewResults.data.length === 0) {
                            showToast('File appears empty or unreadable.', 'error');
                            return;
                        }

                        const headers = previewResults.meta.fields;
                        
                        // Format Detection Logic
                        const requiredStandardColumns = ['Family ID', 'ICHRA Class', 'Relation'];
                        const isStandardFormat = requiredStandardColumns.every(col => headers.includes(col));

                        if (isStandardFormat) {
                            // Path A: Standard Load - Parse FULL file now
                            showToast('Standard Census Pro format detected. Loading...', 'success');
                            
                            Papa.parse(dataToParse, {
                                header: true,
                                skipEmptyLines: true,
                                transformHeader: (header) => header.trim(),
                                complete: (fullResults) => {
                                    try {
                                        processStandardImport(fullResults.data);
                                        unifiedFileInput.value = '';
                                        isDirty = false;
                                        localStorage.removeItem(AUTOSAVE_KEY);
                                    } catch (err) {
                                        console.error(err);
                                        showToast('Error processing data: ' + err.message, 'error');
                                    }
                                },
                                error: (err) => {
                                    console.error('Papaparse error:', err);
                                    showToast(`Error reading file: ${err.message}`, 'error');
                                }
                            });
                        } else {
                            // Path B: Open Mapper
                            showToast('Unknown format detected. Opening Mapper...', 'info');
                            
                            Papa.parse(dataToParse, {
                                header: true,
                                skipEmptyLines: true,
                                transformHeader: (header) => header.trim(),
                                complete: (fullResults) => {
                                    parsedImportData = fullResults.data;
                                    parsedImportSample = fullResults.data.slice(0, 5);
                                    currentImportHeaders = fullResults.meta.fields;
                                    openMapperModal(currentImportHeaders);
                                },
                                error: (err) => {
                                    console.error('Papaparse error:', err);
                                    showToast(`Error reading file for mapping: ${err.message}`, 'error');
                                }
                            });
                        }
                    },
                    error: (err) => {
                        console.error('Papaparse preview error:', err);
                        showToast(`Error reading file preview: ${err.message}`, 'error');
                    }
                });
            };

            const isExcel = file.name.match(/\.(xlsx|xls)$/i);
            if (isExcel) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, {type: 'array'});
                        const firstSheetName = workbook.SheetNames[0];
                        const csvStr = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
                        processData(csvStr);
                    } catch (err) {
                        console.error(err);
                        showToast('Error parsing Excel file.', 'error');
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                processData(file);
            }
            
            unifiedFileInput.value = '';
        }
        
        // END: UNIFIED IMPORT LOGIC

        /**
         * Processes standard format data (array of objects) and populates table.
         * Robust against missing empty rows or different sorting.
         * @param {Array} data - Array of row objects from PapaParse
         */
        function processStandardImport(data) {
            employeeTableBody.innerHTML = '';
            familyCounter = 0;
            collapseAllFamilies();

            // 1. Group rows by Family ID
            const families = {};
            
            data.forEach(row => {
                let fid = row['Family ID'];
                let rel = row['Relation'];
                
                // Robustness: Trim whitespace and normalize case
                if (rel) {
                    rel = rel.trim();
                    // Capitalize first letter for consistency with app values ('Spouse', 'Child', 'Employee')
                    if (rel.toLowerCase() === 'employee') rel = 'Employee';
                    else if (rel.toLowerCase() === 'spouse') rel = 'Spouse';
                    else if (rel.toLowerCase() === 'child') rel = 'Child';
                }
                
                // Update the row object so downstream logic gets the clean value
                row['Relation'] = rel;

                // Robustness: Handle Family ID grouping
                if (fid) {
                    fid = fid.trim();
                    // The tool exports IDs like E00001E, E00001S, E00001C1. 
                    // We must strip the suffix (E/S/C#) to group them by the base ID (E00001).
                    const generatedIdPattern = /^E\d{5}[ESC]\d*$/;
                    if (generatedIdPattern.test(fid)) {
                         fid = fid.replace(/[ESC]\d*$/, '');
                    }
                }

                if (!fid && !rel) return; // Skip empty garbage rows
                
                const safeFid = fid || `UNKNOWN_${Math.random().toString(36).substr(2, 9)}`;
                
                if (!families[safeFid]) {
                    families[safeFid] = { emp: null, deps: [] };
                }
                
                if (rel === 'Employee') {
                    families[safeFid].emp = row;
                } else if (rel === 'Spouse' || rel === 'Child') {
                    families[safeFid].deps.push(row);
                }
            });
            
            // 2. Helper to handle messy headers (newlines/spaces)
            const findVal = (row, keyStart) => {
                const key = Object.keys(row).find(k => k.startsWith(keyStart));
                return key ? row[key] : '';
            };
            const isTrue = (val) => /^(true|t|1|yes|y)$/i.test(String(val || ''));

            // 3. Process groups into UI
            let importedCount = 0;
            Object.values(families).forEach(fam => {
                // Must have an employee record to create a family block
                if (!fam.emp) return;
                
                const row = fam.emp;
                
                const empData = {
                    first: row['First'], 
                    last: row['Last'], 
                    dob: normalizeDate(row['DoB']), // Fix: Normalize Date
                    gender: normalizeGender(row['Gender']),
                    zip: row['Zip'], 
                    county: row['County'], 
                    state: findVal(row, 'State'), 
                    fips: findVal(row, 'FIPS'),
                    phone: normalizePhone(row['Phone']), // Fix: Normalize Phone
                    email: row['Email'], 
                    income: findVal(row, 'Household'), 
                    ichra: row['ICHRA Class'],
                    cobra: isTrue(row['COBRA']), 
                    retiree: isTrue(row['Retiree']), 
                    waive: isTrue(findVal(row, 'Waive')),
                    smoker: isTrue(row['Smoker']), 
                    tobaccoDate: normalizeDate(findVal(row, 'Last Tobacco')), // Fix: Normalize Date
                    premiumTotal: row['Current Premium'],
                    premiumEmployer: findVal(row, 'Employer Current'),
                    premiumEmployee: findVal(row, 'Employee Current'),
                    manualPremium: isTrue(row['Manual Premium'])
                };

                const depDataList = fam.deps.map(dep => ({
                    relation: dep['Relation'],
                    first: dep['First'], 
                    last: dep['Last'], 
                    dob: normalizeDate(dep['DoB']), // Fix: Normalize Date
                    gender: normalizeGender(dep['Gender'])
                }));

                addFamilyBlock(empData, depDataList, true);
                importedCount++;
            });
            
            updateNoFamiliesMessage();
            updateKPIs();
            checkDuplicates();
            showToast(`Successfully imported ${importedCount} families.`, 'success');
        }

        /**
         * Validates all fields and triggers a CSV download.
         */
        async function saveMasterCSV() {
            expandAllFamilies();
            
            if (!validateAllFields()) {
                // Ensure visual updates for errors before checking
                updateKPIs();
                
                const firstErrorField = document.querySelector('.table-input.border-red-500, .table-select.border-red-500');
                
                const confirmed = await showConfirm('You have invalid (red) fields in your data. Are you sure you want to download the file anyway?');
                
                if (!confirmed) {
                    if (firstErrorField) {
                        firstErrorField.focus();
                        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }
            }
            
            const masterCsvRows = [csvHeader];
            let familyNum = 0;

            const allFamilyRows = Array.from(document.querySelectorAll('.employee-row-start'));
            allFamilyRows.reverse().forEach(empRow => {
                familyNum++;
                const familyId = `E${String(familyNum).padStart(5, '0')}`;
                const familyIdBase = empRow.dataset.familyId;
                
                const csvSafe = (val) => `"${(val || '').replace(/"/g, '""')}"`;

                const emp = {
                    first: empRow.querySelector('.row-first').value,
                    last: empRow.querySelector('.row-last').value,
                    dob: empRow.querySelector('.row-dob').value,
                    gender: empRow.querySelector('.row-gender').value,
                    zip: empRow.querySelector('.row-zip').value,
                    county: empRow.querySelector('.row-county').value,
                    state: empRow.querySelector('.row-state').value,
                    fips: empRow.querySelector('.row-fips').value,
                    phone: empRow.querySelector('.row-phone').value,
                    email: empRow.querySelector('.row-email').value,
                    income: empRow.querySelector('.row-income').value,
                    ichra: empRow.querySelector('.row-ichra').value,
                    cobra: empRow.querySelector('.row-cobra').checked ? 'True' : 'False',
                    retiree: empRow.querySelector('.row-retiree').checked ? 'True' : 'False',
                    waive: empRow.querySelector('.row-waive').checked ? 'True' : 'False',
                    smoker: empRow.querySelector('.row-smoker').checked ? 'True' : 'False',
                    tobaccoDate: empRow.querySelector('.row-tobaccoDate').value,
                };
                
                let totalPremium, employerShare, employeeShare, isManual;
                const manualCheckbox = empRow.querySelector('.row-manual-premium');
                
                if (manualCheckbox.checked) {
                    totalPremium = empRow.querySelector('.row-premium-total-manual').value || 0;
                    employerShare = empRow.querySelector('.row-premium-employer-manual').value || 0;
                    employeeShare = empRow.querySelector('.row-premium-employee-manual').value || 0;
                    isManual = 'True';
                } else {
                    const adultPremium = parseFloat(adultPremiumInput.value) || 850;
                    const childPremium = parseFloat(childPremiumInput.value) || 450;
                    const employerContributionPercent = (parseFloat(employerContributionInput.value) / 100) || 0.5;

                    let numAdults = 1;
                    let numChildren = 0;
                    document.querySelectorAll(`[data-family-id="${familyIdBase}"] .row-relation`).forEach(select => {
                        if (select.value === 'Spouse') numAdults++;
                        if (select.value === 'Child') numChildren++;
                    });
                    totalPremium = (numAdults * adultPremium) + (numChildren * childPremium);
                    employerShare = totalPremium * employerContributionPercent;
                    employeeShare = totalPremium - employerShare;
                    isManual = 'False';
                    
                    totalPremium = totalPremium.toFixed(2);
                    employerShare = employerShare.toFixed(2);
                    employeeShare = employeeShare.toFixed(2);
                }


                const employeeRow = [
                    csvSafe(`Employee ${familyNum}`), csvSafe(emp.first), csvSafe(emp.last), csvSafe(emp.dob), csvSafe(emp.gender), csvSafe('Employee'),
                    csvSafe(emp.zip), csvSafe(emp.county), csvSafe(emp.state), csvSafe(emp.fips), csvSafe(emp.phone), csvSafe(emp.email),
                    csvSafe(emp.income), csvSafe(emp.ichra), csvSafe(emp.cobra), csvSafe(emp.retiree), csvSafe(emp.waive),
                    csvSafe(emp.smoker), csvSafe(emp.tobaccoDate),
                    totalPremium, employerShare, employeeShare, csvSafe(isManual), csvSafe(`${familyId}E`)
                ].join(',');
                masterCsvRows.push(employeeRow);

                let childCount = 0;
                const emptyRow = ",,,,,,,,,,,,,,,,,,,,,,,";
                
                const actualDepRows = Array.from(document.querySelectorAll(`[data-family-id="${familyIdBase}"].dependent-row`));
                
                for (let i = 0; i < 6; i++) {
                    const depRow = actualDepRows[i];
                    let outputRow = csvSafe(`Dependent ${i + 1}`) + emptyRow;
                    let familyIdSuffix = '';

                    if (depRow) {
                        const relation = depRow.querySelector('.row-relation').value;
                        
                        if (relation === 'Spouse') {
                            familyIdSuffix = 'S';
                            outputRow = [
                                csvSafe(`Dependent ${i + 1}`), csvSafe(depRow.querySelector('.row-first').value), csvSafe(depRow.querySelector('.row-last').value), 
                                csvSafe(depRow.querySelector('.row-dob').value), csvSafe(depRow.querySelector('.row-gender').value), csvSafe('Spouse'),
                                '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', csvSafe(`${familyId}${familyIdSuffix}`)
                            ].join(',');
                        } else if (relation === 'Child') {
                            childCount++;
                            familyIdSuffix = `C${childCount}`;
                            outputRow = [
                                csvSafe(`Dependent ${i + 1}`), csvSafe(depRow.querySelector('.row-first').value), csvSafe(depRow.querySelector('.row-last').value),
                                csvSafe(depRow.querySelector('.row-dob').value), csvSafe(depRow.querySelector('.row-gender').value), csvSafe('Child'),
                                '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', csvSafe(`${familyId}${familyIdSuffix}`)
                            ].join(',');
                        }
                    }
                    masterCsvRows.push(outputRow);
                }
                // --- END MODIFIED: Save Logic ---
            });
            
            const csvContent = masterCsvRows.join('\n');
            if (masterCsvRows.length <= 1) {
                showAlert('No data to save. Please add at least one employee.');
                return;
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', 'rapid_entry_census.csv');
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            isDirty = false;
            localStorage.removeItem(AUTOSAVE_KEY);
        }

        // --- AUTOSAVE FUNCTIONS ---
        
        /**
         * Checks if LocalStorage is actually writable in the current environment.
         */
        function checkStorageAvailability() {
            try {
                const test = '__storage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        }

        /**
         * Saves the current table state to local storage.
         */
        function saveToLocalStorage() {
            try {
                const globals = {
                    adultPremium: adultPremiumInput.value,
                    childPremium: childPremiumInput.value,
                    employerContribution: employerContributionInput.value
                };
                
                const families = [];
                document.querySelectorAll('.employee-row-start').forEach(empRow => {
                    const familyData = {
                        emp: {
                            first: empRow.querySelector('.row-first').value,
                            last: empRow.querySelector('.row-last').value,
                            dob: empRow.querySelector('.row-dob').value,
                            gender: empRow.querySelector('.row-gender').value,
                            zip: empRow.querySelector('.row-zip').value,
                            county: empRow.querySelector('.row-county').value,
                            state: empRow.querySelector('.row-state').value,
                            fips: empRow.querySelector('.row-fips').value,
                            phone: empRow.querySelector('.row-phone').value,
                            email: empRow.querySelector('.row-email').value,
                            income: empRow.querySelector('.row-income').value,
                            ichra: empRow.querySelector('.row-ichra').value,
                            cobra: empRow.querySelector('.row-cobra').checked,
                            retiree: empRow.querySelector('.row-retiree').checked,
                            waive: empRow.querySelector('.row-waive').checked,
                            smoker: empRow.querySelector('.row-smoker').checked,
                            tobaccoDate: empRow.querySelector('.row-tobaccoDate').value
                        },
                        deps: []
                    };
                    
                    const familyId = empRow.dataset.familyId;
                    document.querySelectorAll(`[data-family-id="${familyId}"].dependent-row`).forEach(depRow => {
                        familyData.deps.push({
                            first: depRow.querySelector('.row-first').value,
                            last: depRow.querySelector('.row-last').value,
                            relation: depRow.querySelector('.row-relation').value,
                            dob: depRow.querySelector('.row-dob').value,
                            gender: depRow.querySelector('.row-gender').value
                        });
                    });
                    families.push(familyData);
                });
                
                families.reverse(); 

                const dataToSave = { globals, families };
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave));
            } catch (e) {
                console.warn('Autosave failed.', e);
                // Only annoy the user with a toast if it's a genuine error, not just full storage
                if (e.name === 'SecurityError' || e.name === 'QuotaExceededError') {
                     showToast('Autosave failed: Storage is blocked or full.', 'error');
                }
            }
        }

        /**
         * Loads and populates the table from local storage.
         */
        function loadFromLocalStorage() {
            try {
                const savedData = localStorage.getItem(AUTOSAVE_KEY);
                if (!savedData) return;
                
                const data = JSON.parse(savedData);
                
                if (data.globals) {
                    adultPremiumInput.value = data.globals.adultPremium || '850';
                    childPremiumInput.value = data.globals.childPremium || '450';
                    employerContributionInput.value = data.globals.employerContribution || '50';
                }
                
                employeeTableBody.innerHTML = '';
                familyCounter = 0;
                if (data.families && data.families.length > 0) {
                    // MODIFIED: Pass depDataList to addFamilyBlock
                    data.families.forEach(family => {
                        addFamilyBlock(family.emp, family.deps, true);
                    });
                } else {
                    addFamilyBlock(null, [], false);
                }
                
                isDirty = false;
                restoreBar.classList.add('hidden');
                recalculateAllPremiums();
                updateKPIs(); 
                checkDuplicates(); // FIX: Check duplicates immediately after restore
            } catch (e) {
                console.error('Failed to load from local storage.', e);
                showAlert('Failed to restore data. The saved data might be corrupted.');
            }
        }

        // --- START: MODIFIED IMPORTER FUNCTIONS (NOW WITH AI) ---

        // NOTE: handleUnifiedFileSelect replaced handleMapperFileSelect, but logic reused for mapper

        /**
         * Tries to find a matching header from the user's file.
         * @param {string} appFieldKey - The internal key (e.g., "first").
         * @param {array} fileHeaders - The list of headers from the user's file.
         * @returns {string|null} The matching header or null.
         */
        function guessMapping(appFieldKey, fileHeaders) {
            const appField = APP_FIELDS[appFieldKey];
            if (!appField) return null;
            
            const lowerFileHeaders = fileHeaders.map(h => String(h).toLowerCase());
            
            for (const guess of appField.guess) {
                const foundIndex = lowerFileHeaders.indexOf(guess);
                if (foundIndex > -1) {
                    return fileHeaders[foundIndex];
                }
            }
            return null;
        }

        /**
         * Builds and displays the field mapper modal.
         * @param {array} fileHeaders - The list of headers from the user's file.
         */
        function openMapperModal(fileHeaders) {
            mapperGrid.innerHTML = '';
            autoMapStatus.textContent = '';
            currentTransformationPlan = null;
            
            const optionsHtml = [`<option value="">-- Don't Import --</option>`];
            fileHeaders.forEach(header => {
                const safeHeader = header.replace(/"/g, '&quot;');
                optionsHtml.push(`<option value="${safeHeader}">${header}</option>`);
            });
            const allOptions = optionsHtml.join('');

            for (const [key, field] of Object.entries(APP_FIELDS)) {
                const guessedHeader = guessMapping(key, fileHeaders);
                
                const labelHtml = `<div class="md:col-span-1 flex items-center"><label class="block text-sm font-medium text-gray-700">${field.label}</label></div>`;
                const selectHtml = `<div class="md:col-span-1">
                    <select data-app-field="${key}" class="table-select mapper-select">
                        ${allOptions}
                    </select>
                </div>`;
                
                mapperGrid.insertAdjacentHTML('beforeend', labelHtml + selectHtml);
                
                if (guessedHeader) {
                    mapperGrid.querySelector(`select[data-app-field="${key}"]`).value = guessedHeader;
                }
            }
            
            mapperGrid.querySelectorAll('.mapper-select').forEach(select => {
                select.addEventListener('change', () => {
                    if (currentTransformationPlan) {
                        autoMapStatus.textContent = 'Mappings manually changed. AI transformations disabled.';
                        autoMapStatus.classList.add('text-red-500');
                    }
                    currentTransformationPlan = null;
                });
            });
            
            mapperModal.style.display = 'flex';
        }

        /**
         * Reads the mapping from the modal and imports the data.
         */
        async function handleMapperImport() {
            // Note: Dirty check is handled by the unified file input handler already.

            const mappingPlan = {};
            
            if (currentTransformationPlan) {
                for (const [appField, plan] of Object.entries(currentTransformationPlan)) {
                    const select = mapperGrid.querySelector(`select[data-app-field="${appField}"]`);
                    if (!select) continue;
                    
                    const selectedHeader = select.value;
                    
                    if (selectedHeader === plan.sourceHeader) {
                        mappingPlan[appField] = plan;
                    } else if (selectedHeader) {
                        mappingPlan[appField] = {
                            sourceHeader: selectedHeader,
                            transformFunction: null 
                        };
                    }
                }
            } else {
                mapperGrid.querySelectorAll('select').forEach(select => {
                    if (select.value) {
                        const appField = select.dataset.appField;
                        mappingPlan[appField] = {
                            sourceHeader: select.value,
                            transformFunction: null
                        };
                    }
                });
            }

            if (Object.keys(mappingPlan).length === 0) {
                showAlert('No fields were mapped. Please map at least one field to import.');
                return;
            }

            employeeTableBody.innerHTML = '';
            familyCounter = 0;
            let importCount = 0;

            const families = {};
            let mappedCount = 0;
            let currentFid = `UNKNOWN_${Math.random().toString(36).substr(2, 9)}`; // Initialize a starting sequential ID

            parsedImportData.forEach((row, rowIndex) => {
                const rowData = {};
                try {
                    for (const [appField, plan] of Object.entries(mappingPlan)) {
                        const rawValue = row[plan.sourceHeader];
                        
                        if (plan.transformFunction) {
                            const transformFn = new Function('val', `try { return (${plan.transformFunction})(val); } catch (e) { console.warn('Transform error:', e.message); return val; }`);
                            rowData[appField] = transformFn(rawValue);
                        } else {
                            rowData[appField] = rawValue;
                        }
                    }
                    
                    // Apply Normalizers
                    if (rowData.dob) rowData.dob = normalizeDate(rowData.dob);
                    if (rowData.tobaccoDate) rowData.tobaccoDate = normalizeDate(rowData.tobaccoDate);
                    if (rowData.phone) rowData.phone = normalizePhone(rowData.phone);
                    if (rowData.gender) rowData.gender = normalizeGender(rowData.gender);
                    
                    // Normalize Relation
                    let rel = rowData.relation ? String(rowData.relation).trim() : '';
                    if (rel.toLowerCase() === 'employee') rel = 'Employee';
                    else if (rel.toLowerCase() === 'spouse') rel = 'Spouse';
                    else if (rel.toLowerCase() === 'child') rel = 'Child';
                    rowData.relation = rel;

                    // Normalize Family ID
                    let fid = rowData.familyId ? String(rowData.familyId).trim() : '';
                    if (fid) {
                        const generatedIdPattern = /^E\d{5}[ESC]\d*$/;
                        if (generatedIdPattern.test(fid)) {
                             fid = fid.replace(/[ESC]\d*$/, '');
                        }
                        currentFid = fid; // Update the sequential tracker
                    } else if (rel === 'Employee' || !rel) {
                        // If it's a new employee without an ID, generate a new sequential ID
                        currentFid = `UNKNOWN_${Math.random().toString(36).substr(2, 9)}`;
                        rowData.relation = 'Employee';
                    }
                    
                    const safeFid = currentFid;
                    
                    if (!families[safeFid]) {
                        families[safeFid] = { emp: null, deps: [] };
                    }
                    
                    if (rowData.relation === 'Employee') {
                        if (!families[safeFid].emp) {
                            families[safeFid].emp = rowData;
                        } else {
                            // Already have an employee for this ID, treat as dependent
                            families[safeFid].deps.push(rowData);
                        }
                    } else {
                        families[safeFid].deps.push(rowData);
                    }
                    
                    mappedCount++;
                } catch (e) {
                    console.error(`Skipping row ${rowIndex + 1} due to transformation error:`, e.message, "Row:", row);
                }
            });

            // Process groups into UI
            Object.values(families).forEach(fam => {
                if (!fam.emp) return; // Must have an employee record
                addFamilyBlock(fam.emp, fam.deps, true);
                importCount++;
            });
            
            isDirty = true;
            saveToLocalStorage();
            updateNoFamiliesMessage();
            updateKPIs(); 
            checkDuplicates(); // FIX: Check duplicates immediately after mapped import
            mapperModal.style.display = 'none';
            parsedImportData = [];
            parsedImportSample = [];
            currentImportHeaders = [];
            currentTransformationPlan = null;
            
            if (importCount < parsedImportData.length) {
                 showAlert(`Successfully imported ${importCount} rows. ${parsedImportData.length - importCount} rows were skipped due to data transformation errors (see console).`);
            } else {
                 showAlert(`Successfully imported ${importCount} employee rows.`);
            }
        }
        
        /**
         * Handles the "Auto-map with AI" button click.
         */
        async function handleAutoMap() {
            const apiKey = geminiApiKeyInput.value;
            if (!apiKey) {
                showAlert('Please enter your Gemini API key to use this feature.');
                return;
            }
            
            if (currentImportHeaders.length === 0) {
                showAlert('No file headers to map. Please select a file first.');
                return;
            }

            autoMapBtn.disabled = true;
            autoMapBtn.textContent = 'Analyzing...';
            autoMapStatus.textContent = 'Contacting Gemini API...';
            autoMapStatus.classList.remove('text-red-500');

            const appSchemaDescription = `
                {
                  "first": "First Name (string)",
                  "last": "Last Name (string)",
                  "dob": "Date of Birth (must be YYYY-MM-DD format)",
                  "gender": "Gender (must be 'M' or 'F')",
                  "zip": "Zip Code (string, 5 digits)",
                  "phone": "Phone Number (string, will be formatted to (XXX) XXX-XXXX)",
                  "email": "Email Address (string, must be valid email)",
                  "income": "Household Income (number)",
                  "ichra": "ICHRA Class (string, e.g., 'Full Time', 'Part Time')",
                  "cobra": "Boolean for COBRA (true/false, yes/no)",
                  "retiree": "Boolean for Retiree (true/false, yes/no)",
                  "waive": "Boolean for Waive Coverage (true/false, yes/no)",
                  "smoker": "Boolean for Smoker (true/false, yes/no)",
                  "tobaccoDate": "Date of last tobacco use (must be YYYY-MM-DD format)"
                }
            `;
            
            // --- START: MODIFIED SYSTEM PROMPT (Phone fix) ---
            const systemPrompt = `You are an expert data mapping and transformation API. Your task is to map a user's CSV headers to our application's schema AND provide JavaScript functions to transform their data into our required format.

Our application schema (what we need):
${appSchemaDescription}

You MUST return a JSON object. The keys of this object MUST be our schema keys (e.g., "first", "dob").
The value for each key MUST be an object with two properties:
1.  "sourceHeader": (string) The matching header from the user's file. If no match, this MUST be null.
2.  "transformFunction": (string or null) A *single-line* JavaScript arrow function (e.g., "val => val.toUpperCase()") to transform the user's data into our required format. If no transformation is needed, this MUST be null.

Analyze the user's data sample to create the transformation functions.
- For dates, convert to "YYYY-MM-DD". Example: "05/15/1982" becomes "1982-05-15".
- For gender, convert to "M" or "F". Example: "Male" becomes "M", "female" becomes "F".
- For booleans, convert to true/false. Example: "Yes" becomes true, "No" becomes false.
- For phone, do NOT transform it. Return null for the transformFunction. Our system will handle phone normalization automatically.
- If a value is already in the correct format, "transformFunction" should be null.
- Handle potential errors gracefully (e.g., return null or original value if transform fails).`;
            // --- END: MODIFIED SYSTEM PROMPT ---

            const userQuery = `Here are the user's CSV headers:
${JSON.stringify(currentImportHeaders)}

Here is a 5-row data sample from their file (as an array of objects):
${JSON.stringify(parsedImportSample)}

Please provide the JSON transformation plan.`;

            const responseSchema = {
                type: "OBJECT",
                properties: {},
                propertyOrdering: Object.keys(APP_FIELDS)
            };
            
            for (const key of Object.keys(APP_FIELDS)) {
                responseSchema.properties[key] = {
                    type: "OBJECT",
                    properties: {
                        "sourceHeader": { type: "STRING", nullable: true },
                        "transformFunction": { type: "STRING", nullable: true }
                    }
                };
            }

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema
                }
            };

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorBody = await response.json();
                    throw new Error(`API Error: ${errorBody.error?.message || response.statusText}`);
                }

                const result = await response.json();
                
                if (!result.candidates || !result.candidates[0].content || !result.candidates[0].content.parts[0].text) {
                    throw new Error('Invalid response structure from API.');
                }
                
                const jsonText = result.candidates[0].content.parts[0].text;
                const transformationPlan = JSON.parse(jsonText);
                
                currentTransformationPlan = transformationPlan;

                for (const [appField, plan] of Object.entries(transformationPlan)) {
                    if (plan.sourceHeader) {
                        const select = mapperGrid.querySelector(`select[data-app-field="${appField}"]`);
                        if (select) {
                            if (Array.from(select.options).some(opt => opt.value === plan.sourceHeader)) {
                                select.value = plan.sourceHeader;
                            } else {
                                console.warn(`AI mapped to a header ("${plan.sourceHeader}") that doesn't exist for "${appField}".`);
                            }
                        }
                    }
                }
                
                autoMapStatus.textContent = 'AI mapping and transformations complete! Please review.';
                autoMapStatus.classList.remove('text-red-500');

            } catch (e) {
                console.error('AI mapping failed:', e);
                autoMapStatus.textContent = `Error: ${e.message}`;
                autoMapStatus.classList.add('text-red-500');
                showAlert(`AI mapping failed: ${e.message}. Please check your API key and network connection.`);
                currentTransformationPlan = null;
            } finally {
                autoMapBtn.disabled = false;
                autoMapBtn.textContent = 'Auto-map with AI';
            }
        }
        
        // --- UX & MODALS ---
        
        /**
         * Displays a custom alert modal.
         * @param {string} message - The message to display.
         */
        function showAlert(message) {
            alertMessage.textContent = message;
            alertModal.style.display = 'flex';
            alertOkBtn.onclick = () => {
                alertModal.style.display = 'none';
            };
        }
        
        /**
         * Displays a custom confirmation modal.
         * @param {string} message - The confirmation question.
         * @returns {Promise<boolean>} True if "OK" was clicked, false otherwise.
         */
        function showConfirm(message) {
            return new Promise((resolve) => {
                confirmResolve = resolve;
                confirmMessage.textContent = message;
                confirmModal.style.display = 'flex';
                
                confirmOkBtn.onclick = () => {
                    confirmModal.style.display = 'none';
                    if (confirmResolve) confirmResolve(true);
                };
                
                confirmCancelBtn.onclick = () => {
                    confirmModal.style.display = 'none';
                    if (confirmResolve) confirmResolve(false);
                };
            });
        }
        
        /**
         * Handles the "Add Family" keyboard shortcut (Ctrl+Shift+A).
         * @param {KeyboardEvent} e - The keydown event.
         */
        function handleAddFamilyShortcut(e) {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
                e.preventDefault();
                addEmployeeBtn.click();
            }
        }
        
        /**
         * Handles the "Add Dependent" keyboard shortcut (Ctrl+Shift+D).
         * @param {KeyboardEvent} e - The keydown event.
         */
        function handleAddDependentShortcut(e) {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
                e.preventDefault();
                const focusedElement = document.activeElement;
                if (!focusedElement) return;

                // Find the family row the user is currently focused in
                const focusedRow = focusedElement.closest('.family-row');
                if (!focusedRow) return;
                
                const familyId = focusedRow.dataset.familyId;
                if (!familyId) return;

                // Find the *employee* row for that family
                const empRow = document.querySelector(`.employee-row-start[data-family-id="${familyId}"]`);
                if (empRow) {
                    const addDepBtn = empRow.querySelector('.add-dependent-btn');
                    if (addDepBtn && !addDepBtn.disabled) {
                        addDepBtn.click();
                    }
                }
            }
        }
        
        /**
         * Handles "Enter" key navigation through the table.
         * @param {KeyboardEvent} e - The keydown event.
         */
        function handleKeyboardNav(e) {
            if (e.key !== 'Enter' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            
            const currentInput = e.target;
            
            // Handle Arrow Key Nav
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const currentRow = currentInput.closest('tr');
                const currentCell = currentInput.closest('td');
                if (!currentRow || !currentCell) return;

                const cellIndex = currentCell.cellIndex;
                const targetRow = e.key === 'ArrowUp' 
                    ? currentRow.previousElementSibling 
                    : currentRow.nextElementSibling;

                if (targetRow && targetRow.cells[cellIndex]) {
                    const targetInput = targetRow.cells[cellIndex].querySelector('input, select');
                    if (targetInput) {
                        e.preventDefault();
                        targetInput.focus();
                    }
                }
                return;
            }

            // Handle Enter Key Nav
            if (e.key === 'Enter') {
                if (currentInput.classList.contains('row-relation')) {
                    e.preventDefault();
                    return;
                }
                
                e.preventDefault();
                const currentRow = currentInput.closest('tr');
                const allInputsInRow = Array.from(currentRow.querySelectorAll(
                    '.table-input:not([readonly]), .table-select:not([disabled]), input[type="checkbox"]'
                ));
                const currentIndex = allInputsInRow.indexOf(currentInput);
                
                if (currentIndex < allInputsInRow.length - 1) {
                    allInputsInRow[currentIndex + 1].focus();
                } else {
                    // Logic to find next row...
                    let nextRow = currentRow.nextElementSibling;
                    while(nextRow && (nextRow.classList.contains('hidden') || !nextRow.classList.contains('family-row'))) {
                        nextRow = nextRow.nextElementSibling;
                    }

                    if (currentRow.classList.contains('employee-row-start')) {
                        const firstDep = document.querySelector(`[data-family-id="${currentRow.dataset.familyId}"].dependent-row`);
                        if (firstDep) {
                            firstDep.querySelector('.row-relation').focus();
                            return;
                        }
                    }

                    if (nextRow) {
                        if (nextRow.classList.contains('dependent-row')) {
                            const relationSelect = nextRow.querySelector('.row-relation');
                            if (relationSelect) {
                                relationSelect.focus();
                                return;
                            }
                        } else if (nextRow.classList.contains('employee-row-start')) {
                            const nextInput = nextRow.querySelector('.row-first');
                            if (nextInput) {
                                nextInput.focus();
                            }
                        }
                    } else {
                        addEmployeeBtn.click();
                    }
                }
            }
        }
        
        // --- GLOBAL PASTE HANDLER ---
        document.addEventListener('paste', (e) => {
            // Ignore if user is pasting into an input field (text editing)
            // UNLESS the paste data contains newlines (multi-row paste)
            const pasteData = (e.clipboardData || window.clipboardData).getData('text');
            const isMultiRow = pasteData.includes('\n');
            
            // If focus is on an input and paste is single line, let default happen
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !isMultiRow) {
                return;
            }

            // Try to detect tabular data (tab separated or comma separated)
            if (isMultiRow && (pasteData.includes('\t') || pasteData.includes(','))) {
                e.preventDefault();
                showConfirm("Detected tabular data in clipboard. Do you want to import this as census data?").then(confirmed => {
                    if(confirmed) {
                        // Parse it using existing logic
                        Papa.parse(pasteData, {
                            header: true,
                            skipEmptyLines: true,
                            transformHeader: (header) => header.trim(),
                            complete: (results) => {
                                // Check format like before
                                const headers = results.meta.fields || [];
                                const requiredStandardColumns = ['Family ID', 'ICHRA Class', 'Relation'];
                                const isStandardFormat = requiredStandardColumns.every(col => headers.includes(col));
                                
                                if(isStandardFormat) {
                                     processStandardImport(results.data); // Fix: Use new object processor
                                     showToast("Data pasted and loaded.", "success");
                                } else {
                                    // Send to mapper
                                    parsedImportData = results.data;
                                    parsedImportSample = results.data.slice(0, 5);
                                    currentImportHeaders = results.meta.fields;
                                    openMapperModal(currentImportHeaders);
                                    showToast("Opening mapper for pasted data...", "info");
                                }
                            }
                        });
                    }
                });
            }
        });

        
        // --- START: MODIFIED INITIALIZATION ---
        
        /**
         * Fetches the zip code JSON, builds the lookup map, and enables the UI.
         */
        async function loadZipData() {
            zipLoadingStatus.classList.remove('hidden');
            const zipUrl = '/FIPS_COUNTY_ZIP.json';

            try {
                const response = await fetch(zipUrl);
                if (!response.ok) {
                    throw new Error(`Failed to load zip data: ${response.statusText}`);
                }
                const zipData = await response.json();

                // Process the fetched data into our Map
                zipData.forEach(loc => {
                    if (loc.ZIP) { // Only add entries that have a zip
                        const zip = loc.ZIP;
                        // Normalize the data to match our app's expected format
                        const locationObject = {
                            zip: zip,
                            county: loc.COUNTY,
                            state: loc.STATE,
                            fips: loc.FIPS
                        };
                        
                        if (!zipLookup.has(zip)) {
                            zipLookup.set(zip, []);
                        }
                        zipLookup.get(zip).push(locationObject);
                    }
                });

                // Success! Enable the UI.
                zipLoadingStatus.textContent = 'Data Ready';
                zipLoadingStatus.classList.remove('text-amber-700', 'bg-amber-100');
                zipLoadingStatus.classList.add('text-teal-700', 'bg-teal-100');
                addEmployeeBtn.disabled = false;
                
                setTimeout(() => {
                    zipLoadingStatus.classList.add('hidden');
                }, 2000);

            } catch (e) {
                console.error(e);
                zipLoadingStatus.textContent = 'Offline Mode';
                zipLoadingStatus.classList.remove('text-amber-700', 'bg-amber-100');
                zipLoadingStatus.classList.add('text-rose-700', 'bg-rose-100');
                // We can still enable the app, zip validation will just fail
                addEmployeeBtn.disabled = false;
                showAlert('Could not load zip code database. County/State/FIPS auto-fill will be disabled for this session.');
            }
        }
        
        /**
         * Main function to run on page load.
         */
        async function main() {
            assignElementRefs();
            
            // --- DIAGNOSTICS ---
            if (!checkStorageAvailability()) {
                showToast("Warning: Browser storage is blocked. Autosave will not work.", "error");
                // Optional: Visually disable the restore bar since it can't work
                restoreBar.classList.add('hidden');
            }
            
            // --- Global Event Listeners ---
            addEmployeeBtn.addEventListener('click', () => {
                // Clear search when adding new so user sees it
                document.getElementById('searchInput').value = '';
                filterTable();
                addFamilyBlock(null, [], false);
                updateKPIs();
            });
            
            // Search Listener
            document.getElementById('searchInput').addEventListener('input', filterTable);
            
            saveCsvBtn.addEventListener('click', () => {
                validateAllFields(); // Ensure errors are visually marked
                updateKPIs();       // Update count based on validation
                saveMasterCSV();
            });
            
            clearDataBtn.addEventListener('click', clearAllData);
            downloadTemplateBtn.addEventListener('click', downloadTemplate);
            
            // Wire up click-to-fix
            document.getElementById('kpi-errors-container').addEventListener('click', scrollToFirstError);
            
            // UNIFIED HANDLER
            unifiedFileInput.addEventListener('change', handleUnifiedFileSelect);

            toggleAllBtn.addEventListener('click', toggleAllFamiliesBtn);
            document.addEventListener('keydown', handleAddFamilyShortcut);
            document.addEventListener('keydown', handleAddDependentShortcut);
            
            // Listen for validation changes globally to update Error KPI
            employeeTableBody.addEventListener('input', (e) => {
                // Debounce slightly to avoid thrashing on every keystroke
                setTimeout(() => {
                    updateKPIs();
                    checkDuplicates(); // Check duplicates on input
                }, 100);
            });
            
            // Also update on change (selects, checkboxes)
            employeeTableBody.addEventListener('change', (e) => {
                setTimeout(updateKPIs, 100);
            });

            shortcutsBtn.addEventListener('click', () => {
                shortcutsModal.style.display = 'flex';
            });
            shortcutsCloseBtn.addEventListener('click', () => {
                shortcutsModal.style.display = 'none';
            });
            shortcutsOkBtn.addEventListener('click', () => {
                shortcutsModal.style.display = 'none';
            });
            
            // START: Added form modal listeners
            familyFormModalSave.addEventListener('click', saveFamilyForm);
            familyFormModalCancel.addEventListener('click', () => familyFormModal.style.display = 'none');
            familyFormModalClose.addEventListener('click', () => familyFormModal.style.display = 'none');

            // Make Dependent Modal Listeners
            makeDependentCancelBtn.addEventListener('click', () => makeDependentModal.style.display = 'none');
            makeDependentOkBtn.addEventListener('click', () => {
                const targetFamilyId = makeDependentSelect.value;
                const sourceFamilyId = makeDependentSourceFamilyId.value;

                if (!targetFamilyId) {
                    showAlert('Please select an employee.');
                    return;
                }

                const sourceRow = document.querySelector(`.employee-row-start[data-family-id="${sourceFamilyId}"]`);
                const targetRow = document.querySelector(`.employee-row-start[data-family-id="${targetFamilyId}"]`);

                if (!sourceRow || !targetRow) {
                    showAlert('Error finding rows.');
                    makeDependentModal.style.display = 'none';
                    return;
                }

                const depData = {
                    relation: 'Spouse', 
                    first: sourceRow.querySelector('.row-first').value,
                    last: sourceRow.querySelector('.row-last').value,
                    dob: sourceRow.querySelector('.row-dob').value,
                    gender: sourceRow.querySelector('.row-gender').value
                };

                // Remove source family entirely
                document.querySelectorAll(`[data-family-id="${sourceFamilyId}"]`).forEach(row => row.remove());

                // Add dependent to target family
                const newDepRow = addDependentRow(targetRow, targetFamilyId, depData, false);
                if (newDepRow) {
                    newDepRow.querySelector('.row-relation').focus();
                }

                isDirty = true;
                updateNoFamiliesMessage();
                updateKPIs();
                saveToLocalStorage();
                makeDependentModal.style.display = 'none';
            });
            
            // START: ADDED: Listener for adding dependent from modal
            familyFormModalAddDep.addEventListener('click', () => {
                const familyId = familyFormModalFamilyId.value;
                const empRow = document.querySelector(`.employee-row-start[data-family-id="${familyId}"]`);
                if (empRow) {
                    // 1. Add row to the main table
                    const newDepRow = addDependentRow(empRow, familyId, null, false);
                    
                    if (newDepRow) {
                        updateKPIs(); // Update KPIs when adding from modal
                        
                        // 2. If successful, add form block to modal
                        const newDepFormHtml = createDependentFormBlock(newDepRow);
                        familyFormModalContent.insertAdjacentHTML('beforeend', newDepFormHtml);
                        
                        // 3. Add listeners to the new form block
                        const newDepBlock = familyFormModalContent.querySelector(`[data-dep-index="${newDepRow.dataset.depIndex}"]`);
                        const relationSelect = newDepBlock.querySelector('select');
                        relationSelect.addEventListener('change', () => {
                            const isEnabled = relationSelect.value === 'Spouse' || relationSelect.value === 'Child';
                            newDepBlock.querySelector(`[id$="-first"]`).readOnly = !isEnabled;
                            newDepBlock.querySelector(`[id$="-last"]`).readOnly = !isEnabled;
                            newDepBlock.querySelector(`[id$="-dob"]`).readOnly = !isEnabled;
                            newDepBlock.querySelector(`[id$="-gender"]`).disabled = !isEnabled;
                        });
                        
                        // 4. Focus the new relation select in the modal
                        relationSelect.focus();
                    }
                }
            });
            // END: ADDED
            // END: Added form modal listeners

            // Mapper specific listeners (triggered by unified flow)
            mapperCancelBtn.addEventListener('click', () => {
                mapperModal.style.display = 'none';
                parsedImportData = [];
                parsedImportSample = [];
                currentImportHeaders = [];
                currentTransformationPlan = null;
            });
            mapperImportBtn.addEventListener('click', handleMapperImport);
            
            autoMapBtn.addEventListener('click', handleAutoMap);
            geminiApiKeyInput.addEventListener('input', () => {
                localStorage.setItem(API_KEY_LS_KEY, geminiApiKeyInput.value);
            });

            // --- Autosave and Dirty Flag Listeners ---
            const allGlobalInputs = [adultPremiumInput, childPremiumInput, employerContributionInput];
            allGlobalInputs.forEach(input => {
                input.addEventListener('input', () => {
                    isDirty = true;
                    recalculateAllPremiums();
                    saveToLocalStorage();
                });
            });
            
            employeeTableBody.addEventListener('input', (event) => {
                isDirty = true;
                if (event.target.classList.contains('manual-premium-input')) {
                    const empRow = event.target.closest('.employee-row-start');
                    if(empRow) {
                        calculateManualEeShare(empRow);
                    }
                }
                saveToLocalStorage();
            });
            employeeTableBody.addEventListener('change', (event) => {
                isDirty = true;
                const target = event.target;
                if (target.classList.contains('row-relation') || target.classList.contains('row-manual-premium')) {
                    const familyId = target.closest('.family-row').dataset.familyId;
                    if(familyId) {
                        calculateFamilyPremium(familyId);
                    }
                }
                saveToLocalStorage();
            });
            
            employeeTableBody.addEventListener('keydown', handleKeyboardNav);

            // --- Initial Load Logic ---
            geminiApiKeyInput.value = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem(API_KEY_LS_KEY) || '';
            
            // Start the zip data download
            await loadZipData();
            
            // Now that zips are loaded (or failed), load the user's data
            if (localStorage.getItem(AUTOSAVE_KEY)) {
                restoreBar.classList.remove('hidden');
                restoreBtn.addEventListener('click', loadFromLocalStorage);
                dismissRestoreBtn.addEventListener('click', () => {
                    localStorage.removeItem(AUTOSAVE_KEY);
                    restoreBar.classList.add('hidden');
                });
                updateNoFamiliesMessage();
                // MODIFIED: Need to load data *after* zips are ready
                // but we also need to show the restore bar.
                // Let's not auto-load, just show the bar.
            } else {
                addFamilyBlock(null, [], false);
                isDirty = false;
            }

            // --- Welcome Modal Logic ---
            if (localStorage.getItem('hideWelcomeModal') !== 'true') {
                welcomeModal.style.display = 'flex';
            }

            helpBtn.addEventListener('click', () => {
                welcomeModal.style.display = 'flex';
            });

            closeWelcomeBtn.addEventListener('click', () => {
                welcomeModal.style.display = 'none';
                if (dontShowWelcomeCheck.checked) {
                    localStorage.setItem('hideWelcomeModal', 'true');
                } else {
                    localStorage.removeItem('hideWelcomeModal');
                }
            });

            // --- Unload Warning ---
            window.addEventListener('beforeunload', (e) => {
                if (isDirty) {
                    const message = 'You have unsaved changes. Are you sure you want to leave?';
                    e.preventDefault();
                    e.returnValue = message;
                    return message;
                }
            });
        }
        
        // --- Start the app ---
        document.addEventListener('DOMContentLoaded', main);
