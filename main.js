const PUBLIC_GATOS = ["NormalGato", "ExampleGato"];
let ALL_GATOS = PUBLIC_GATOS;
const CUSTOM_GATOS = [];

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key == "s") {
    e.preventDefault();
  }
});

async function writeToOutput(str){
  document.querySelector(".output").innerHTML += str + "\n";
}

function getClasses(code) {
  allClasses = new Set(PUBLIC_GATOS);
  CUSTOM_GATOS.length = 0;

  const re = /class\s+(\w+).*\(.*ABaseGato.*\).*:/g;
  i = 0;
  defaultGato = PUBLIC_GATOS[0];
  for (let match of code.matchAll(re)) {
    if (i == 0) {
      defaultGato = match[1];
    }
    allClasses.add(match[1]);
    CUSTOM_GATOS.push(match[1]);
    i += 1;
  }

  if (i == 0) {
    prompt("WARNING: No class extending ABaseGato found in your code! Please make sure you use the following syntax:", "class ExampleGato(ABaseGato):")
  }

  ALL_GATOS = [...allClasses];

  for (let i = 1; i <= 4; i++) {
    sel = document.querySelector(`#gato${i}class`);
    let v = sel.selectedIndex;
    sel.innerHTML = "";
    for (let c of ALL_GATOS) {
      opt = document.createElement("option");
      opt.innerText = c;
      opt.value = c;
      sel.appendChild(opt);
    }
    if (v == -1){
      if (i == 1) {
        sel.value = defaultGato;
      } else {
        sel.selectedIndex = 0;
      }
    } else {
      sel.selectedIndex = v;
    }
  }
}

function saveContent() {
  let code = window.editor.getValue();
  localStorage.setItem("code", code);
  getClasses(code);
}

function resetContent() {
  if (confirm("Are you sure you want to reset the Gato's code?")) {
    localStorage.removeItem("code");
    window.editor.setValue(EXAMPLE_GATO);
    getClasses(EXAMPLE_GATO);
  }
}

async function getGato(className) {
  await window.pyodide.runPythonAsync(`from pyodide.http import pyfetch
response = await pyfetch(f"https://raw.githubusercontent.com/Cyxo/mm-plugins/dev/gato/gatos/${className}.py")
if response.ok:
    with open("${className}.py", "wb") as f:
        f.write(await response.bytes())
        print("> Downloaded ${className}.py")
else:
    raise Exception()
`);
}

async function main(){
  window.pyodide = await loadPyodide();
  window.pyodide.setStdin({ error: true });
  window.pyodide.setStderr({batched: (str) => writeToOutput(str)});
  window.pyodide.setStdout({batched: (str) => writeToOutput(str)});
  await getGato("ABaseGato");
  writeToOutput("> Loaded!");
  document.querySelector("#launch").removeAttribute("disabled");
}

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs' }});
require(["vs/editor/editor.main"], () => {
  let code = localStorage.getItem("code");
  if (code == null) code = EXAMPLE_GATO;
  getClasses(code);

  window.editor = monaco.editor.create(document.querySelector(".editor"), {
    value: code,
    language: "python",
    theme: 'vs-dark',
    automaticLayout: true,
  });

  window.editor.getModel().onDidChangeContent((event) => {
    saveContent();
  });
});

async function prepareLaunch() {
  document.querySelector(".output").innerHTML = "> Preparing...\n";

  imports = new Set();
  definitions = [];
  team = new Set();

  for (let i = 1; i <= 4; i++) {
    sel = document.querySelector(`#gato${i}class`);
    inp = document.querySelector(`#gato${i}name`);

    imports.add(`from ${sel.value} import ${sel.value}`);
    team.add(sel.value);
    definitions.push(`gato${i} = ${sel.value}(name="${inp.value}")\nteam.append(gato${i})\ngato${i}.deploy()`);
  }

  const code = window.editor.getValue();
  for (gato of team) {
    if (CUSTOM_GATOS.includes(gato)) {
      pyodide.FS.writeFile(`${gato}.py`, code, { encoding: "utf8" });
      writeToOutput(`> Wrote ${gato}.py from code`)
    } else if (PUBLIC_GATOS.includes(gato)) {
      await getGato(gato);
    }
  }

  imports = [...imports].join("\n");
  definitions = definitions.join("\n");

  return [imports, definitions];
}

async function launch() {
  let [imports, definitions] = await prepareLaunch();

  const script = window.editor.getValue();
  let duration = document.querySelector("#duration").value;
  try {
    duration = parseInt(duration);
  } catch (e) {
    duration = 86400;
  }
  document.querySelector(".output").innerHTML += `> Simulating for ${duration} seconds...\n\n`;
  try {
    window.pyodide.runPython(`import random

from ABaseGato import ABaseGato
${imports}

CURRENCY_EMOJI = "🌸"

class Team:
    gatos: list[ABaseGato]

    def __init__(self, gatos: list[ABaseGato]):
        self.gatos = gatos

def handle_events(team: list[ABaseGato]):
    description = ""

    for gato in team:
        events_by_type = {}
        for event in gato._events:
            et = list(event.keys())[0]
            if et not in events_by_type:
                events_by_type[et] = []
            events_by_type[et].append(event[et])

        for et, value in events_by_type.items():
            description += f"- **{gato.name}** "

            args = {}
            if et == "bitten":
                args["amount"] = 0
                for _ in value:
                    rnd = random.randint(10, 50)
                    args["amount"] += rnd
                args["currency"] = CURRENCY_EMOJI
                args["count"] = len(value)

            description += gato.EVENT_DESCRIPTIONS[et].format(**args)
            description += "\\n"

    return description

team = []
${definitions}
tm = Team(team)

TIME_STEP = 1
currency = 0
objects = []
for _ in range(0, ${duration}, TIME_STEP):
    if all(gato._fainted for gato in tm.gatos):
        break

    for gato in tm.gatos:
        c, o = gato.simulate(tm.gatos, TIME_STEP)
        currency += c
        objects += o

events = handle_events(tm.gatos)
if len(events) == 0:
    events = "*Nothing specific happened.*"
if len(objects) > 0:
    obj = "**" + '**, **'.join(set([f"{objects.count(o)}x {o}" for o in objects])) + "**"
else:
    obj = "*no objects*"

print(f"Expedition results:\\nYour gatos brought back **{int(currency)}** {CURRENCY_EMOJI} and {obj}.\\n\\nEvent log:\\n{events}")
`);
  } catch (e) {
    writeToOutput(e);
  }
}

main();