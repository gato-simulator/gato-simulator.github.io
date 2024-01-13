function SIMULATE(imports, definitions, duration) {
    return `import importlib
import random

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
                    rnd = random.randint(2, 10)
                    args["amount"] += rnd
                args["currency"] = CURRENCY_EMOJI
                args["count"] = len(value)

            description += gato.EVENT_DESCRIPTIONS[et].format(**args)
            description += "\\n"

    return description

team = []
${definitions}
tm = Team(team)

for gato in tm.gatos:
    gato.deploy(tm.gatos)

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

for gato in tm.gatos:
    gato.claim()

if len(events) == 0:
    events = "*Nothing specific happened.*"
if len(objects) > 0:
    obj = "**" + '**, **'.join(set([f"{objects.count(o)}x {o}" for o in objects])) + "**"
else:
    obj = "*no objects*"

print(f"Expedition results:\\nYour gatos brought back **{int(currency)}** {CURRENCY_EMOJI} and {obj}.\\n\\nEvent log:\\n{events}")
`
}