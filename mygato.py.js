const EXAMPLE_GATO = `from random import random

from ABaseGato import ABaseGato, require_alive

class MyGato(ABaseGato):
    """
        > A gato with **10%** more base efficiency.
        > Gets a **+20%** (**+{eidolon} × 2%** from **E{eidolon}**) efficiency boost for 20 minutes every hour.
        > Has **1%** (**2%** at **E6**) chance to find a **Rare treasure** each minute.
    """

    base_efficiency: float = 1.1    # Override initial values for stats


    _buff_duration: int = 0         # Custom variables used for this gato
    _buff_cooldown: int = 0
    _has_buff: bool = False
    _find_object_cooldown: int = 0


    @require_alive
    def efficiency_buff(self, seconds):
        self._buff_duration -= seconds
        self._buff_cooldown -= seconds

        if self._buff_cooldown <= 0:
            self.efficiency_boost += 20/100 + (2/100 * self.eidolon)
            self._buff_duration += 20*60
            self._buff_cooldown += 60*60
            self._has_buff = True

        if self._buff_duration <= 0 and self._has_buff:
            self.efficiency_boost -= 20/100 + (2/100 * self.eidolon)
            self._has_buff = False


    def random_object(self, seconds):
        objects = super().random_object(seconds)

        self._find_object_cooldown -= seconds

        if self._find_object_cooldown <= 0:
            self._find_object_cooldown = 60

            chances = 0.01
            if self.eidolon == 6:
                chances = 0.02

            if random() < chances:
                objects.append("Rare treasure")

        return objects


    def simulate(self, team: list["ABaseGato"], seconds: int = 1):
        # We calculate its efficiency boost before its actions
        self.efficiency_buff(seconds)

        # Then call the parent simulation (VERY IMPORTANT)
        currency, objects = super().simulate(seconds)

        return currency, objects
`;