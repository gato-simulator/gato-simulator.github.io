const EXAMPLE_GATO = `from random import random

from ABaseGato import ABaseGato, require_alive

class MyGato(ABaseGato):
    """
        > Skill descriptions. UPDATE IT!!
        > 
        > A gato with **10%** more base efficiency.
        > Gets a **+20%** (**+{eidolon} × 2%** from **E{eidolon}**) efficiency boost for 20 minutes every hour.
        > Has **1%** (**2%** at **E6**) chance to find a **Rare treasure** each minute.
    """

    # Override constants
    IMAGE = "https://media.discordapp.net/attachments/435078369852260353/1192961669467488307/cyx_gato.png"
    ANIMATIONS = "mooncake"
    DISPLAY_NAME = "My Gato"
    RARITY = 4
    VALUES_TO_SAVE = ABaseGato.VALUES_TO_SAVE + [
        "buff_duration",
        "buff_cooldown",
        "has_buff",
        "find_object_cooldown"
    ]

    # Override superclass values for stats
    base_efficiency: float = 1.1

    # Custom variables used for this gato
    buff_duration: int = 0              # Remaining duration for its buff
    buff_cooldown: int = 0              # Remaining cooldown until its buff can be triggered again
    BUFF_KEY: str = "EG_eff_buff"       # dict key to keep track of this gato's buffs
    find_object_cooldown: int = 0       # Remaining cooldown until it can find a rare object again


    @require_alive
    def efficiency_buff(self, seconds):
        # Update buff duration and cooldown
        self.buff_duration -= seconds
        self.buff_cooldown -= seconds

        # Apply buff if cooldown is over
        if self.buff_cooldown <= 0 or (self.buff_duration > 0 and self.BUFF_KEY not in self.efficiency_boosts):
            # Increase efficiency boost
            self.efficiency_boosts[self.BUFF_KEY] = 20/100 + (2/100 * self.eidolon)

            # Set base cooldown and duration
            self.buff_duration += 20*60
            self.buff_cooldown += 60*60
            self.has_buff = True

        # Remove buff if duration is over
        if self.buff_duration <= 0 and self.has_buff:
            self.efficiency_boosts.pop(self.BUFF_KEY)
            self.has_buff = False


    def random_object(self, seconds):
        # Call superclass method to find base objects
        objects = super().random_object(seconds)

        # Update object finding cooldown
        self.find_object_cooldown -= seconds

        # If the cooldown is over, try to find an object
        if self.find_object_cooldown <= 0:
            # Set base cooldown
            self.find_object_cooldown = 60

            # Calculate chances to find a Rare treasure (see skill description at the top of the class)
            chances = 0.01
            if self.eidolon == 6:
                chances = 0.02

            # Randomly find an Rare treasure
            if random() < self.luck*chances:
                # If we found one, add it to the objects found by the superclass method
                objects.append("Rare treasure")

        # Return found objects
        return objects


    def simulate(self, team: list["ABaseGato"], seconds: int = 1):
        # We calculate its efficiency boost before its actions
        self.efficiency_buff(seconds)

        # Then call the parent simulation (VERY IMPORTANT)
        super().simulate(seconds)
`;