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

class Transactions:

    currency: float = 0.0
    add_items: list[str]
    rm_items: list[str]

    def __init__(self, **kwargs) -> None:
        self.add_items = []
        self.rm_items = []

class Player:

    nursery: list
    deployed_team: Team
    transactions: Transactions

    currency: float = 0
    inventory: list


    def __init__(self, **kwargs) -> None:
        self.nursery = []
        self.deployed_team = None
        self.transactions = Transactions()
        self.inventory = []


def handle_events(plyr, team: list[ABaseGato]):
    lines = []

    for gato in team:
        lines += gato.handle_events(plyr, CURRENCY_EMOJI)

    return "\\n".join(lines)

team = []
${definitions}
tm = Team(team)

for gato in tm.gatos:
    gato.deploy(tm.gatos)

TIME_STEP = 1
for _ in range(0, ${duration}, TIME_STEP):
    if all(gato._fainted for gato in tm.gatos):
        break

    for gato in tm.gatos:
        gato.simulate(tm.gatos, TIME_STEP)

events = handle_events(Player(), tm.gatos)

currency = 0
objects = []
for gato in tm.gatos:
    c, o = gato.claim()
    currency += c
    objects += o

if len(events) == 0:
    events = "*Nothing specific happened.*"
if len(objects) > 0:
    obj = "**" + '**, **'.join(set([f"{objects.count(o)}x {o}" for o in objects])) + "**"
else:
    obj = "*no objects*"

print(f"Expedition results:\\nYour gatos brought back **{int(currency)}** {CURRENCY_EMOJI} and {obj}.\\n\\nEvent log:\\n{events}")
`
}