(function () {
  'use strict';

  // --- State ---
  let currentStep = 1;
  const totalSteps = 6;
  const state = {
    propertyType: null,
    scopeOfWorks: [],
    designStyles: [],
    floorPlan: null,
    name: '',
    email: '',
    whatsapp: ''
  };

  // --- Property type cost multipliers ---
  const propertyMultipliers = {
    'BTO/SBF': 1.0,
    '>20 years old Resale HDB': 1.25,
    'MOP Resale HDB': 1.1,
    'Condominium': 1.35,
    'Landed': 1.6,
    'Commercial': 1.5
  };

  // --- Scope item labels ---
  const scopeLabels = {
    hack_whole_house: 'Hack whole house flooring & wall tiles',
    hack_kitchen_bath: 'Hack kitchen & bathrooms only',
    dismantle_1_3_cabinets: 'Dismantle 1-3 sets of cabinets',
    dismantle_4_8_cabinets: 'Dismantle 4-8 sets of cabinets',
    demolish_1_5ft_wall: 'Demolish 1FT-5FT of wall',
    demolish_6_10ft_wall: 'Demolish 6FT-10FT of wall',
    demolish_11_15ft_wall: 'Demolish 11FT-15FT of wall',
    kitchen_20_30ft: '20FT-30FT kitchen cabinet',
    kitchen_31_40ft: '31FT-40FT kitchen cabinet',
    wardrobe_1_2: '1-2 sets full-height wardrobe',
    wardrobe_3_4: '3-4 sets full-height wardrobe',
    other_cabinet_1_2: '1-2 sets other cabinetry',
    other_cabinet_3_4: '3-4 sets other cabinetry',
    minor_electrical: 'Minor electrical works',
    rewiring: 'Rewiring needed',
    minor_plumbing: 'Minor plumbing works',
    relay_pipes: 'Re-lay whole house water pipes',
    relocate_discharge: 'Relocate discharge pipes',
    painting: 'Painting',
    haulage: 'Haulage & disposal of debris',
    cleaning: 'General cleaning'
  };

  // --- Scope categories for results ---
  const scopeCategories = {
    'Hacking & Dismantling': ['hack_whole_house', 'hack_kitchen_bath', 'dismantle_1_3_cabinets', 'dismantle_4_8_cabinets', 'demolish_1_5ft_wall', 'demolish_6_10ft_wall', 'demolish_11_15ft_wall'],
    'Carpentry': ['kitchen_20_30ft', 'kitchen_31_40ft', 'wardrobe_1_2', 'wardrobe_3_4', 'other_cabinet_1_2', 'other_cabinet_3_4'],
    'Electrical': ['minor_electrical', 'rewiring'],
    'Plumbing': ['minor_plumbing', 'relay_pipes', 'relocate_discharge'],
    'Other Works': ['painting', 'haulage', 'cleaning']
  };

  // --- DOM elements ---
  const steps = document.querySelectorAll('.step');
  const stepDots = document.querySelectorAll('.step-dot');
  const btnNext = document.getElementById('btnNext');
  const btnBack = document.getElementById('btnBack');
  const progressFill = document.getElementById('progressFill');

  // --- Navigation ---
  function goToStep(step) {
    steps.forEach(function (s) { s.classList.remove('active'); });
    document.getElementById('step' + step).classList.add('active');

    stepDots.forEach(function (dot, i) {
      dot.classList.remove('active', 'completed');
      if (i + 1 < step) dot.classList.add('completed');
      if (i + 1 === step) dot.classList.add('active');
    });

    var progress = ((step - 1) / (totalSteps - 1)) * 100;
    progressFill.style.setProperty('--progress', progress + '%');

    btnBack.style.display = step === 1 ? 'none' : 'flex';

    if (step === totalSteps) {
      btnNext.style.display = 'none';
      generateResults();
    } else if (step === 5) {
      btnNext.textContent = 'Get My Estimate';
      btnNext.style.display = 'flex';
      // Remove the SVG that was previously appended
      var svg = btnNext.querySelector('svg');
      if (svg) svg.remove();
    } else {
      btnNext.innerHTML = 'Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
      btnNext.style.display = 'flex';
    }

    currentStep = step;
    updateNextButton();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateNextButton() {
    var disabled = false;
    if (currentStep === 1 && !state.propertyType) disabled = true;
    if (currentStep === 2 && state.scopeOfWorks.length === 0) disabled = true;
    if (currentStep === 3 && state.designStyles.length === 0) disabled = true;
    if (currentStep === 5) {
      var name = document.getElementById('userName').value.trim();
      var email = document.getElementById('userEmail').value.trim();
      var whatsapp = document.getElementById('userWhatsapp').value.trim();
      if (!name || !email || !whatsapp) disabled = true;
    }
    btnNext.disabled = disabled;
  }

  btnNext.addEventListener('click', function () {
    if (btnNext.disabled) return;
    if (currentStep === 5) {
      state.name = document.getElementById('userName').value.trim();
      state.email = document.getElementById('userEmail').value.trim();
      state.whatsapp = document.getElementById('userWhatsapp').value.trim();

      // Basic validation
      if (!state.name || !state.email || !state.whatsapp) return;
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(state.email)) {
        document.getElementById('userEmail').classList.add('error');
        return;
      }
      if (!/^[0-9]{8}$/.test(state.whatsapp)) {
        document.getElementById('userWhatsapp').classList.add('error');
        return;
      }
    }
    if (currentStep < totalSteps) {
      goToStep(currentStep + 1);
    }
  });

  btnBack.addEventListener('click', function () {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  // --- Step 1: Property Type ---
  document.querySelectorAll('.property-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.property-btn').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      state.propertyType = btn.getAttribute('data-value');
      updateNextButton();
    });
  });

  // --- Step 2: Scope of Works ---
  document.querySelectorAll('input[name="scope"]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      state.scopeOfWorks = [];
      document.querySelectorAll('input[name="scope"]:checked').forEach(function (checked) {
        state.scopeOfWorks.push({
          value: checked.value,
          cost: parseInt(checked.getAttribute('data-cost'), 10)
        });
      });
      updateNextButton();
    });
  });

  // --- Step 3: Design Styles ---
  var maxStyles = 3;
  document.querySelectorAll('.style-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var val = btn.getAttribute('data-value');
      var idx = state.designStyles.indexOf(val);

      if (idx > -1) {
        state.designStyles.splice(idx, 1);
        btn.classList.remove('selected');
      } else if (state.designStyles.length < maxStyles) {
        state.designStyles.push(val);
        btn.classList.add('selected');
      }

      // Update counter
      document.getElementById('styleCount').textContent = state.designStyles.length;

      // Disable unselected if max reached
      document.querySelectorAll('.style-btn').forEach(function (b) {
        if (state.designStyles.length >= maxStyles && !b.classList.contains('selected')) {
          b.classList.add('disabled');
        } else {
          b.classList.remove('disabled');
        }
      });

      updateNextButton();
    });
  });

  // --- Step 4: Floor Plan Upload ---
  var uploadArea = document.getElementById('uploadArea');
  var fileInput = document.getElementById('floorPlanInput');
  var uploadPreview = document.getElementById('uploadPreview');
  var fileNameEl = document.getElementById('fileName');
  var removeFileBtn = document.getElementById('removeFile');

  uploadArea.addEventListener('click', function () {
    fileInput.click();
  });

  uploadArea.addEventListener('dragover', function (e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', function () {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', function (e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  function handleFile(file) {
    var maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 10MB. Please choose a smaller file.');
      return;
    }
    state.floorPlan = file;
    fileNameEl.textContent = file.name;
    uploadArea.style.display = 'none';
    uploadPreview.style.display = 'block';
  }

  removeFileBtn.addEventListener('click', function () {
    state.floorPlan = null;
    fileInput.value = '';
    uploadArea.style.display = 'flex';
    uploadPreview.style.display = 'none';
  });

  // --- Step 5: Contact form live validation ---
  ['userName', 'userEmail', 'userWhatsapp'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      this.classList.remove('error');
      updateNextButton();
    });
  });

  // --- Step 6: Generate Results ---
  function generateResults() {
    document.getElementById('resultProperty').textContent = state.propertyType || '-';
    document.getElementById('resultStyles').textContent = state.designStyles.join(', ') || '-';

    var breakdown = document.getElementById('costBreakdown');
    breakdown.innerHTML = '';
    var total = 0;
    var multiplier = propertyMultipliers[state.propertyType] || 1;

    var selectedValues = {};
    state.scopeOfWorks.forEach(function (item) {
      selectedValues[item.value] = item.cost;
    });

    Object.keys(scopeCategories).forEach(function (category) {
      var items = scopeCategories[category];
      var categoryItems = [];

      items.forEach(function (itemKey) {
        if (selectedValues[itemKey] !== undefined) {
          var adjustedCost = Math.round(selectedValues[itemKey] * multiplier);
          // Add slight randomization for realism (+/- 10%)
          var variance = 0.9 + Math.random() * 0.2;
          adjustedCost = Math.round(adjustedCost * variance / 50) * 50;
          categoryItems.push({
            name: scopeLabels[itemKey],
            cost: adjustedCost
          });
          total += adjustedCost;
        }
      });

      if (categoryItems.length > 0) {
        var headerDiv = document.createElement('div');
        headerDiv.className = 'cost-category-header';
        headerDiv.textContent = category;
        breakdown.appendChild(headerDiv);

        categoryItems.forEach(function (item) {
          var itemDiv = document.createElement('div');
          itemDiv.className = 'cost-item';
          itemDiv.innerHTML = '<span class="cost-item-name">' + escapeHtml(item.name) + '</span>' +
            '<span class="cost-item-price">$' + item.cost.toLocaleString() + '</span>';
          breakdown.appendChild(itemDiv);
        });
      }
    });

    // Design consultation fee
    if (state.designStyles.length > 0) {
      var designFee = 1500 * state.designStyles.length;
      total += designFee;

      var headerDiv = document.createElement('div');
      headerDiv.className = 'cost-category-header';
      headerDiv.textContent = 'Design & Consultation';
      breakdown.appendChild(headerDiv);

      var itemDiv = document.createElement('div');
      itemDiv.className = 'cost-item';
      itemDiv.innerHTML = '<span class="cost-item-name">Design consultation (' + state.designStyles.length + ' style' + (state.designStyles.length > 1 ? 's' : '') + ')</span>' +
        '<span class="cost-item-price">$' + designFee.toLocaleString() + '</span>';
      breakdown.appendChild(itemDiv);
    }

    document.getElementById('totalCost').textContent = '$' + total.toLocaleString();
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // --- Appointment Modal ---
  var modal = document.getElementById('appointmentModal');
  var appointmentDate = document.getElementById('appointmentDate');

  document.getElementById('bookAppointment').addEventListener('click', function () {
    // Set min date to today
    var today = new Date().toISOString().split('T')[0];
    appointmentDate.setAttribute('min', today);
    appointmentDate.value = today;
    modal.style.display = 'flex';
  });

  document.getElementById('modalClose').addEventListener('click', function () {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  document.getElementById('confirmAppointment').addEventListener('click', function () {
    var date = appointmentDate.value;
    var time = document.getElementById('appointmentTime').value;
    if (!date || !time) {
      alert('Please select both a date and time.');
      return;
    }
    // Hide form, show success
    this.style.display = 'none';
    document.querySelector('.modal-content > p').style.display = 'none';
    document.querySelectorAll('.modal-content .form-group').forEach(function (fg) {
      fg.style.display = 'none';
    });
    document.getElementById('appointmentSuccess').style.display = 'block';
  });

  // --- Initial state ---
  updateNextButton();
})();
