const EMPTY_GATO = `from random import random

from ABaseGato import ABaseGato, require_alive

class EmptyGato(ABaseGato):
    """
        > Enter effect description here
        > Start each new line with a >
        > Replace Eidolon level with {eidolon}
    """


    def simulate(self, team: list["ABaseGato"], seconds: int = 1):
        # Call the parent function
        currency, objects = super().simulate(seconds)

        return currency, objects
`;