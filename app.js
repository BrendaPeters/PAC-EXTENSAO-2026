'use strict';

document.documentElement.classList.remove('no-js');

document.querySelectorAll('[data-open-lesson]').forEach(link => {
  link.addEventListener('click', event => {
    const dialog = document.getElementById(link.dataset.openLesson);
    if (!dialog) return;
    event.preventDefault();
    dialog.showModal();
  });
});

document.querySelectorAll('.lesson-dialog').forEach(dialog => {
  dialog.querySelector('[data-close-lesson]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) dialog.close();
  });
});

// Laboratório: alternar folhas sem apagar as atividades
const labTabs = [...document.querySelectorAll('.lab-tabs [role="tab"]')];

function selectLab(tab) {
  labTabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}

labTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectLab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % labTabs.length;
    if (event.key === 'ArrowLeft') next = (index + labTabs.length - 1) % labTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = labTabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectLab(labTabs[next]);
    labTabs[next].focus();
  });
});

document.querySelectorAll('[data-go-lab]').forEach(button => {
  button.addEventListener('click', () => {
    const tab = document.getElementById(`lab-tab-${button.dataset.goLab}`);
    button.closest('dialog').close();
    selectLab(tab);
    document.getElementById('laboratorio').scrollIntoView({ behavior: 'instant', block: 'start' });
    tab.focus({ preventScroll: true });
  });
});

// Hardware: mostrar a explicação correspondente ao componente
const componentButtons = document.querySelectorAll('[data-component]');
componentButtons.forEach(button => {
  button.addEventListener('click', () => {
    componentButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelectorAll('[data-component-description]').forEach(description => {
      description.hidden = description.id !== button.dataset.component;
    });
  });
});

// Perguntas: revelar o comentário escrito ao lado das opções
function showFeedback(container, correct) {
  container.querySelector('[data-feedback="correct"]').hidden = !correct;
  container.querySelector('[data-feedback="incorrect"]').hidden = correct;
}

document.querySelectorAll('[data-quiz]').forEach(question => {
  question.addEventListener('change', event => {
    if (event.target.matches('input[type="radio"]')) {
      showFeedback(question, event.target.dataset.correct === 'true');
    }
  });
});

// Validação da atividade: comparar os números digitados com os valores do HTML
document.querySelectorAll('[data-budget-check]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const incorrectCells = [];
    form.querySelectorAll('[data-expected]').forEach(input => {
      const text = input.value.trim().replace(/^R\$\s*/i, '').replace(',', '.');
      const value = Number(text);
      const correct = text !== '' && Number.isFinite(value)
        && Math.abs(value - Number(input.dataset.expected)) < 0.005;
      input.setAttribute('aria-invalid', String(!correct));
      if (!correct) incorrectCells.push(input.dataset.cell);
    });
    form.querySelector('[data-incorrect-cells]').textContent = incorrectCells.join(', ');
    showFeedback(form, incorrectCells.length === 0);
  });
});

// Orçamento do laboratório: recalcular as linhas e mostra o total
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
document.querySelectorAll('[data-live-budget]').forEach(budget => {
  const rows = [...budget.querySelectorAll('[data-budget-row]')];

  function updateBudget() {
    let sum = 0;
    let invalid = false;
    rows.forEach(row => {
      const input = row.querySelector('input');
      const value = input.valueAsNumber;
      const valid = Number.isInteger(value) && value >= Number(input.min) && value <= Number(input.max);
      const output = row.querySelector('[data-row-total]');
      input.setAttribute('aria-invalid', String(!valid));
      output.hidden = !valid;
      row.querySelector('[data-row-error]').hidden = valid;
      if (valid) {
        const total = value * Number(row.dataset.price);
        output.textContent = currency.format(total);
        sum += total;
      } else {
        invalid = true;
      }
    });
    budget.querySelector('[data-budget-total-label]').hidden = invalid;
    budget.querySelector('[data-budget-error]').hidden = !invalid;
    if (!invalid) budget.querySelector('[data-budget-total]').textContent = currency.format(sum);
  }

  rows.forEach(row => row.querySelector('input').addEventListener('input', updateBudget));
  budget.querySelector('[data-reset-budget]').addEventListener('click', () => {
    rows.forEach(row => {
      const input = row.querySelector('input');
      input.value = input.defaultValue;
    });
    updateBudget();
  });
});

// Cartaz: acompanha os itens marcados
document.querySelectorAll('[data-checklist]').forEach(checklist => {
  checklist.addEventListener('change', () => {
    const inputs = [...checklist.querySelectorAll('input[type="checkbox"]')];
    const count = inputs.filter(input => input.checked).length;
    const complete = count === inputs.length;
    checklist.querySelector('[data-check-count]').textContent = String(count);
    checklist.querySelector('[data-check-progress]').hidden = complete;
    checklist.querySelector('[data-check-complete]').hidden = !complete;
  });
});

// IA: trocar apenas as escolhas variáveis dentro do exemplo (adaptar isso)
const prompt = document.getElementById('prompt-result');
const copySuccess = document.querySelector('[data-copy-success]');
const copyFallback = document.querySelector('[data-copy-fallback]');

function updatePrompt() {
  prompt.querySelector('[data-prompt-goal]').textContent = document.getElementById('goal').value;
  prompt.querySelector('[data-prompt-format]').textContent = document.getElementById('format').value;
  copySuccess.hidden = true;
  copyFallback.hidden = true;
}

document.getElementById('goal').addEventListener('change', updatePrompt);
document.getElementById('format').addEventListener('change', updatePrompt);
document.getElementById('copy-prompt').addEventListener('click', async () => {
  const text = prompt.textContent.replace(/\s+/g, ' ').replace(/\s+([.,;!?])/g, '$1').trim();
  try {
    await navigator.clipboard.writeText(text);
    copySuccess.hidden = false;
    copyFallback.hidden = true;
  } catch {
    copySuccess.hidden = true;
    copyFallback.hidden = false;
    const range = document.createRange();
    range.selectNodeContents(prompt);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
});

// Impressão: expandir os detalhes da aula
let printDetails = [];
document.querySelectorAll('[data-print-lesson]').forEach(button => {
  button.addEventListener('click', () => {
    const dialog = button.closest('dialog');
    dialog.classList.add('is-printing');
    printDetails = [...dialog.querySelectorAll('details')].map(node => [node, node.open]);
    printDetails.forEach(([node]) => { node.open = true; });
    document.body.classList.add('print-lesson');
    window.print();
  });
});

window.addEventListener('afterprint', () => {
  document.body.classList.remove('print-lesson');
  document.querySelectorAll('.is-printing').forEach(dialog => dialog.classList.remove('is-printing'));
  printDetails.forEach(([node, open]) => { node.open = open; });
  printDetails = [];
});

document.getElementById('print').addEventListener('click', () => window.print());
