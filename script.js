
const form = document.getElementById("settings");



const settings_str = localStorage.getItem("settings");
if (settings_str){
  const settings = JSON.parse(settings_str);
  for (const [name, value] of Object.entries(settings)) {

    form.elements[name].value = value; // не вижу elements.оно точно есть в рантайме?
  }

}

form.addEventListener('submit', (e) => { e.preventDefault();
  const form_data = new FormData(form);
  console.log(form_data)
  const data_parsed = Object.fromEntries(form_data);
  localStorage.setItem('settings',JSON.stringify(data_parsed)) })


const PHASES = ['inhale', 'inhale_hold', 'exhale', 'exhale_hold'];

function startBreathingCycle() {
  // Получи значения из формы или defaults
  const durations = {
    inhale: parseFloat(form.elements.inhale_sec.value),
    exhale: parseFloat(form.elements.exhale_sec.value),
    inhale_hold: parseFloat(form.elements.inhale_hold_sec.value),
      exhale_hold: parseFloat(form.elements.exhale_hold_sec.value)

  };

  let currentPhaseIndex = 0;
  let cycleCount = 0;

  function nextPhase() {

    let phaseName = PHASES[currentPhaseIndex];
    document.body.dataset.phase = phaseName;
    setTimeout(() => { currentPhaseIndex = (currentPhaseIndex + 1) % 4; nextPhase() }, durations[phaseName]*1000);
    if (currentPhaseIndex==0){
      cycleCount++;
          document.getElementById('counter').textContent = cycleCount;
    }
  }

  nextPhase();  // Запуск
}

startBreathingCycle()
