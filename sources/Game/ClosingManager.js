import { Game } from './Game.js'
import { Inputs } from './Inputs/Inputs.js'
import { Menu } from './Menu.js'
import { Modals } from './Modals.js'
import { CircuitArea } from './World/Areas/CircuitArea.js'
import { LabArea } from './World/Areas/LabArea.js'
import { ProjectsArea } from './World/Areas/ProjectsArea.js'

export class ClosingManager
{
    constructor()
    {
        this.game = Game.getInstance()

        this.game.inputs.addActions([
            { name: 'close', categories: [ 'modal', 'menu', 'racing', 'cinematic', 'wandering' ], keys: [ 'Keyboard.Escape', 'Gamepad.cross' ] },
            { name: 'pause', categories: [ 'modal', 'menu', 'racing', 'cinematic', 'wandering' ], keys: [ 'Gamepad.start' ] }
        ])
        
        // Close input => Go through everything that can be closed
        this.game.inputs.events.on('close', (action) =>
        {
            if(action.active)
            {
                // Whispers flag select => Close
                if(this.game.world.whispers?.menu.inputFlag.isOpen)
                    this.game.world.whispers.menu.inputFlag.close()

                // Circuit flag select => Close
                else if(this.game.world.areas?.circuit?.menu.inputFlag.isOpen)
                    this.game.world.areas.circuit.menu.inputFlag.close()
                
                // Modal open => Close
                else if(this.game.modals.state === Modals.OPEN)
                    this.game.modals.close()
                
                // Menu open => Close
                else if(this.game.menu.state === Menu.OPEN || (this.game.inputs.mode !== Inputs.MODE_GAMEPAD && this.game.menu.state === Menu.OPENING))
                    this.game.menu.close()

                // Circuit running
                else if(this.game.world.areas?.circuit?.state === CircuitArea.STATE_RUNNING || this.game.world.areas?.circuit?.state === CircuitArea.STATE_STARTING)
                    this.game.menu.open('circuit')

                // Projects => Close
                else if(this.game.world.areas?.portalProjects && (this.game.world.areas.portalProjects.state === ProjectsArea.STATE_OPEN || this.game.world.areas.portalProjects.state === ProjectsArea.STATE_OPENING))
                    this.game.world.areas.portalProjects.close()
                else if(this.game.world.areas?.projects && (this.game.world.areas?.projects.state === ProjectsArea.STATE_OPEN || this.game.world.areas?.projects.state === ProjectsArea.STATE_OPENING))
                    this.game.world.areas.projects.close()

                // Social-area exhibit => Close.
                else if(this.game.world.areas?.socialLab && (this.game.world.areas.socialLab.state === LabArea.STATE_OPEN || this.game.world.areas.socialLab.state === LabArea.STATE_OPENING))
                    this.game.world.areas.socialLab.close()

                // Lakeside course exhibit => Close.
                else if(this.game.world.areas?.careerLab && (this.game.world.areas.careerLab.state === LabArea.STATE_OPEN || this.game.world.areas.careerLab.state === LabArea.STATE_OPENING))
                    this.game.world.areas.careerLab.close()

                // Copied course exhibit => Return to its scene and restore interaction.
                else if(this.game.world.areas?.cookieLab && (this.game.world.areas.cookieLab.state === LabArea.STATE_OPEN || this.game.world.areas.cookieLab.state === LabArea.STATE_OPENING))
                    this.game.world.areas.cookieLab.close()

                // Lab => Close
                else if(this.game.world.areas?.fountainLab && (this.game.world.areas.fountainLab.state === LabArea.STATE_OPEN || this.game.world.areas.fountainLab.state === LabArea.STATE_OPENING))
                    this.game.world.areas.fountainLab.close()
                else if(this.game.world.areas?.lakesideLab && (this.game.world.areas.lakesideLab.state === LabArea.STATE_OPEN || this.game.world.areas.lakesideLab.state === LabArea.STATE_OPENING))
                    this.game.world.areas.lakesideLab.close()
                else if(this.game.world.areas?.lab && (this.game.world.areas?.lab.state === LabArea.STATE_OPEN || this.game.world.areas?.lab.state === LabArea.STATE_OPENING))
                    this.game.world.areas.lab.close()

                // Nothing opened and used the keyboard Escape key => Open default modal
                else if(action.activeKeys.has('Keyboard.Escape'))
                    this.game.menu.open()
            }
        })

        // Pause input => Close menu or open menu  intro
        this.game.inputs.events.on('pause', (action) =>
        {
            if(action.active)
            {
                if(this.game.menu.state === Menu.OPEN || this.game.menu.state === Menu.OPENING)
                {
                    this.game.menu.close()
                }
                else
                {
                    this.game.menu.open('home')
                }
            }
        })

        // On modal open => Close menu
        this.game.modals.events.on('open', () =>
        {
            if(this.game.menu.state === Menu.OPEN || this.game.menu.state === Menu.OPENING)
                this.game.menu.close()
        })

        // On menu open => Close modal
        this.game.menu.events.on('open', () =>
        {
            if(this.game.modals.state === Modals.OPEN || this.game.modals.state === Modals.OPENING)
                this.game.modals.close()
        })

        // On modal close => Go to wandering or racing
        const modalMenuCloseCallback = () =>
        {
            this.game.inputs.filters.clear()

            if(
                this.game.world.areas?.circuit?.state === CircuitArea.STATE_RUNNING ||
                this.game.world.areas?.circuit?.state === CircuitArea.STATE_STARTING ||
                this.game.world.areas?.circuit?.state === CircuitArea.STATE_ENDING
            )
            {
                this.game.inputs.filters.add('racing')
            }
            else
            {
                this.game.inputs.filters.add('wandering')
            }
        }
        this.game.modals.events.on('close', modalMenuCloseCallback)
        this.game.menu.events.on('close', modalMenuCloseCallback)
    }
}