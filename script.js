document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const grossIncomeInput = document.getElementById('gross-income');
    const prevYearInpsInput = document.getElementById('prev-year-inps');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsSection = document.getElementById('results-display');
    const reductionRadios = document.querySelectorAll('input[name="inps-reduction"]');
    const startupDetailsCheckbox = document.getElementById('startup-tax');
    const toggleAdvancedBtn = document.getElementById('toggle-advanced');
    const advancedPanel = document.getElementById('advanced-settings-panel');
    const coeffInput = document.getElementById('coeff-redditivita');

    // Outputs
    const netIncomeEl = document.getElementById('net-in-hand');
    const taxAmountEl = document.getElementById('tax-amount');
    const inpsAmountEl = document.getElementById('inps-amount');
    const taxableBaseEl = document.getElementById('taxable-base');
    const taxRateDisplay = document.getElementById('tax-rate-display');
    const inpsLabelDisplay = document.getElementById('inps-label-display');
    const savePercentageEl = document.getElementById('save-percentage');
    const saveAmountPer1000El = document.getElementById('save-amount-per-1000');

    // Constants (2025 Estimates/User Provided)
    // Ref: Updated user values
    // Full Fixed = 4528.00 (da commercialista: 566€/trimestre con riduzione 50% -> 2264/anno -> pieno 4528)
    // Minimale reddito 2025: 18.556

    const INPS_MINIMAL_INCOME = 18556;
    const INPS_FIXED_AMOUNT = 4528.00;
    const INPS_VARIABLE_RATE = 0.24;

    // UI Helpers
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
    };

    // Card Selection Logic
    reductionRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.radio-card').forEach(card => card.classList.remove('selected'));
            e.target.closest('.radio-card').classList.add('selected');
        });
    });

    // Toggle Advanced
    toggleAdvancedBtn.addEventListener('click', () => {
        advancedPanel.classList.toggle('hidden');
    });

    // Per-invoice set-aside: marginal cost of the invoice as the last one of the year,
    // i.e. total due at full revenue minus total due without it (handles the INPS minimum threshold).
    let invoiceCost = () => 0;
    const invoiceInput = document.getElementById('invoice-amount');
    const invoiceSaveEl = document.getElementById('invoice-save');
    const updateInvoice = () => {
        const v = parseFloat(invoiceInput.value);
        if (!(v > 0)) { invoiceSaveEl.innerHTML = ''; return; }
        const cost = invoiceCost(v);
        invoiceSaveEl.innerHTML = `Su ${formatCurrency(v)} metti da parte <strong>${formatCurrency(cost)}</strong> (${(cost / v * 100).toFixed(1).replace('.', ',')}%) e ti restano ${formatCurrency(v - cost)}`;
    };
    invoiceInput.addEventListener('input', updateInvoice);

    // Calculation Logic
    const calculate = () => {
        const grossIncome = parseFloat(grossIncomeInput.value);
        if (isNaN(grossIncome) || grossIncome < 0) {
            alert("Inserisci un fatturato valido.");
            return;
        }

        // 1. Determine Coefficient and Taxable Base
        const coeff = parseFloat(coeffInput.value) / 100; // Default 0.67
        const taxableBase = grossIncome * coeff;

        // 2. Determine INPS
        // Logic: Calculate Fixed and Variable separately to show breakdown
        let inpsFixedFull = INPS_FIXED_AMOUNT;
        let inpsVariableFull = 0;

        if (taxableBase > INPS_MINIMAL_INCOME) {
            const excess = taxableBase - INPS_MINIMAL_INCOME;
            inpsVariableFull = excess * INPS_VARIABLE_RATE;
        }

        // Apply Reduction
        const selectedReduction = document.querySelector('input[name="inps-reduction"]:checked').value;
        let reductionFactor = 1; // Full pay
        let reductionLabel = "Pieni";

        if (selectedReduction === "50") {
            reductionFactor = 0.50;
            reductionLabel = "-50%";
        } else if (selectedReduction === "35") {
            reductionFactor = 0.65; // Pay 65%
            reductionLabel = "-35%";
        }

        const inpsFixedDue = inpsFixedFull * reductionFactor;
        const inpsVariableDue = inpsVariableFull * reductionFactor;
        const inpsTotalDue = inpsFixedDue + inpsVariableDue;

        // 3. Determine Tax (Imposta Sostitutiva)
        // 3. Determine Tax (Imposta Sostitutiva)
        // Base for tax = Taxable Base - INPS Paid Previous Year (Deducible principle)
        // Note: In Forfettario, we deduct what was PAID in the year (cash principle), not what is DUE for the year.
        const prevYearInps = parseFloat(prevYearInpsInput.value) || 0;
        const taxBase = Math.max(0, taxableBase - prevYearInps);

        const isStartup = startupDetailsCheckbox.checked;
        const taxRate = isStartup ? 0.05 : 0.15;
        const taxDue = taxBase * taxRate;

        // 4. Net Income
        const netIncome = grossIncome - inpsTotalDue - taxDue;

        const monthsDivisor = parseInt(document.getElementById('months-select').value) || 12;
        const monthlyNet = netIncome / monthsDivisor;

        // 5. Update UI
        netIncomeEl.textContent = formatCurrency(netIncome);

        // Update Monthly Detail fully
        const monthlyDetailEl = document.getElementById('monthly-detail');
        if (monthlyDetailEl) {
            monthlyDetailEl.innerHTML = `Circa <strong>${formatCurrency(monthlyNet)}</strong> al mese (su ${monthsDivisor} mensilità)`;
        }

        taxAmountEl.innerHTML = `
            ${formatCurrency(taxDue)}
        `;
        taxRateDisplay.textContent = isStartup ? "5%" : "15%";

        // Comparison Note: If reduction is active, show what tax WOULD be with full deduction
        if (reductionFactor < 1) {
            const inpsTotalFull = inpsFixedFull + inpsVariableFull;
            const taxBaseFull = Math.max(0, taxableBase - inpsTotalFull);
            const taxDueFull = taxBaseFull * taxRate;

            // Only show if there is a meaningful difference (e.g. > 1 eur)
            if (Math.abs(taxDue - taxDueFull) > 1) {
                taxAmountEl.innerHTML += `
                    <small class="comparison-note">
                        vs ${formatCurrency(taxDueFull)} con deduzione piena
                    </small>
                 `;
            }
        }

        // Detailed INPS Display
        inpsAmountEl.innerHTML = `
            ${formatCurrency(inpsTotalDue)}
            <div class="inps-details">
                <small>Fissi: ${formatCurrency(inpsFixedDue)}</small>
                ${inpsVariableDue > 0 ? `<small>Eccedenza: ${formatCurrency(inpsVariableDue)}</small>` : ''}
            </div>
        `;
        inpsLabelDisplay.textContent = reductionLabel;

        // Taxable Base & Threshold Info
        const thresholdDiff = taxableBase - INPS_MINIMAL_INCOME;
        let thresholdMsg = `<small style="color: var(--text-muted); display: block; margin-top: 4px;">Entro il minimale (${formatCurrency(INPS_MINIMAL_INCOME)})</small>`;

        if (thresholdDiff > 0) {
            thresholdMsg = `<small style="color: var(--text-muted); display: block; margin-top: 4px;">Supera il minimale di ${formatCurrency(thresholdDiff)}</small>`;
        }

        let taxBaseMsg = '';
        if (prevYearInps > 0) {
            taxBaseMsg = `<small style="display: block; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">Imp. Netto Tasse: <strong>${formatCurrency(taxBase)}</strong> <br><span style="font-size: 0.85em; opacity: 0.7">(dedotti ${formatCurrency(prevYearInps)})</span></small>`;
        }

        taxableBaseEl.innerHTML = `
            ${formatCurrency(taxableBase)}
            ${thresholdMsg}
            ${taxBaseMsg}
        `;

        // --- NEW: Quota da accantonare ---
        const totalTaxes = inpsTotalDue + taxDue;
        const savePercentage = grossIncome > 0 ? (totalTaxes / grossIncome) * 100 : 0;
        const amountPer1000 = (savePercentage / 100) * 1000;

        // INPS fixed part is constant, so it cancels out in the difference
        const dueAt = (g) => {
            const base = g * coeff;
            const inps = Math.max(0, base - INPS_MINIMAL_INCOME) * INPS_VARIABLE_RATE * reductionFactor;
            return inps + Math.max(0, base - prevYearInps) * taxRate;
        };
        // Deadlines table, steady-state assumption (income similar to last year):
        // fixed INPS in 4 equal instalments; tax 50%/50% (June, Nov); INPS excess 60% June (saldo + 1st acconto), 40% Nov.
        // Checked vs INPS circ. 38/2025 and 14/2026 and Agenzia Entrate (forfettari: acconto in 2 equal instalments 30/06, 30/11).
        // Not confirmed on an official page: INPS excess acconti 40%+40% (+20% saldo); AdE single-payment threshold for small acconti.
        // shortcut: ignores weekend shifts, the 31/07 extension (+0.4%) and a different prior-year income; check with your accountant.
        const rows = [
            ['16 febbraio', 'INPS fissi (4ª rata)', inpsFixedDue / 4],
            ['16 maggio', 'INPS fissi (1ª rata)', inpsFixedDue / 4],
            ['30 giugno', 'Imposta sostitutiva (acconto)', taxDue * 0.5],
            ['30 giugno', 'INPS eccedenza (saldo + 1º acconto)', inpsVariableDue * 0.6],
            ['20 agosto', 'INPS fissi (2ª rata)', inpsFixedDue / 4],
            ['16 novembre', 'INPS fissi (3ª rata)', inpsFixedDue / 4],
            ['30 novembre', 'Imposta sostitutiva (2º acconto)', taxDue * 0.5],
            ['30 novembre', 'INPS eccedenza (2º acconto)', inpsVariableDue * 0.4],
        ].filter(r => r[2] > 0);
        document.getElementById('deadlines').innerHTML = `
            <h3>Scadenze e quanto tenere da parte</h3>
            <table>
                ${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${formatCurrency(r[2])}</td></tr>`).join('')}
                <tr class="total"><td colspan="2">Totale anno</td><td>${formatCurrency(inpsTotalDue + taxDue)}</td></tr>
            </table>
            <small>Stima a regime: presuppone redditi simili all'anno precedente. Le date delle rate fisse INPS cambiano ogni anno (es. 2026: 18 maggio, 20 agosto, 16 novembre, 16 febbraio 2027): verifica il calendario INPS dell'anno.</small>`;

        invoiceCost = (v) => dueAt(grossIncome) - dueAt(Math.max(0, grossIncome - v));
        updateInvoice();

        if (savePercentageEl && saveAmountPer1000El) {
            savePercentageEl.textContent = `${savePercentage.toFixed(1).replace('.', ',')}%`;
            saveAmountPer1000El.textContent = `Pari a ${formatCurrency(amountPer1000)} ogni 1.000€ incassati`;
        }

        // Show results
        resultsSection.classList.remove('hidden');

        // Scroll to results on mobile
        if (window.innerWidth < 600) {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    calculateBtn.addEventListener('click', calculate);

    // Allow Enter key
    grossIncomeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculate();
    });
    prevYearInpsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculate();
    });
});
