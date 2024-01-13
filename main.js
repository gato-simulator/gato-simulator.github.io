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

function resetContent(code) {
  if (confirm("This will reset the Gato's code. Are you sure you want to continue?")) {
    localStorage.setItem("code", code);
    window.editor.setValue(code);
    getClasses(code);
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

    imports.add(`import ${sel.value}\nimportlib.reload(${sel.value})\nfrom ${sel.value} import ${sel.value}`);
    team.add(sel.value);
    definitions.push(`gato${i} = ${sel.value}(name="${inp.value}")\nteam.append(gato${i})`);
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
    window.pyodide.runPython(SIMULATE(imports, definitions, duration));
  } catch (e) {
    writeToOutput(e);
  }
}

main();