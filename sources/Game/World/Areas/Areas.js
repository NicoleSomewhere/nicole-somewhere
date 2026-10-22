import * as THREE from 'three/webgpu'
import { Game } from '../../Game.js'
import { AltarArea } from './AltarArea.js'
import { CookieArea } from './CookieArea.js'
import { LandingArea } from './LandingArea.js'
import { ProjectsArea } from './ProjectsArea.js'
import { LabArea } from './LabArea.js'
import { CareerArea } from './CareerArea.js'
import { SocialArea } from './SocialArea.js'
import { ToiletArea } from './ToiletArea.js'
import { BowlingArea } from './BowlingArea.js'
import { CircuitArea } from './CircuitArea.js'
import { BehindTheSceneArea } from './BehindTheSceneArea.js'
import { AchievementsArea } from './AchievementsArea.js'
import { TimeMachineArea } from './TimeMachineArea.js'
import { EasterArea } from './EasterArea.js'

export class Areas
{
    constructor()
    {
        this.game = Game.getInstance()

        const list = [
            [ 'achievements', AchievementsArea ],
            [ 'altar', AltarArea ],
            [ 'behindTheScene', BehindTheSceneArea ],
            [ 'bowling', BowlingArea ],
            [ 'career', CareerArea ],
            [ 'circuit', CircuitArea ],
            [ 'cookie', CookieArea ],
            [ 'lab', LabArea ],
            [ 'landing', LandingArea ],
            [ 'projects', ProjectsArea ],
            [ 'social', SocialArea ],
            [ 'toilet', ToiletArea ],
            [ 'timeMachine', TimeMachineArea ],
        ]

        const model = [...this.game.resources.areasModel.scene.children]

        // Clone before Area constructors consume/reparent the source objects.
        // Keep the original cookie stand and place a second lab on its left.
        const labSource = model.find(child => child.name === 'lab')
        const cookieSource = model.find(child => child.name === 'cookie')
        let cookieLabModel = null
        if(labSource && cookieSource)
        {
            cookieLabModel = labSource.clone(true)
            cookieLabModel.name = 'cookieLab'
            cookieLabModel.position.copy(cookieSource.position)
            cookieLabModel.position.x -= 8
            cookieLabModel.position.z += 6
            cookieLabModel.traverse(child =>
            {
                if(child.isMesh)
                {
                    child.geometry = child.geometry.clone()
                    if(Array.isArray(child.material))
                        child.material = child.material.map(material => material.clone())
                    else
                        child.material = child.material.clone()
                }
            })
        }
        
        // Reuse the course exhibit at the former lakeside career sign.
        const careerSource = model.find(child => child.name === 'career')
        const careerYear = careerSource?.children.find(child => child.name.startsWith('refYear'))
        let careerLabModel = null
        if(cookieLabModel && careerYear)
        {
            careerLabModel = cookieLabModel.clone(true)
            careerLabModel.name = 'careerLab'
            careerLabModel.position.copy(careerSource.position)
            careerLabModel.position.x += careerYear.position.x - 2
            careerLabModel.position.z += careerYear.position.z - 4
            // The source board has a 40-degree yaw; add 50 degrees so its
            // horizontal edge runs along the career tracks' world-Z direction.
            const careerYaw = THREE.MathUtils.degToRad(50)
            const careerTurn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), careerYaw)
            careerLabModel.userData.exhibitYaw = careerYaw
            for(const child of careerLabModel.children)
            {
                child.position.applyQuaternion(careerTurn)
                child.quaternion.premultiply(careerTurn)
            }
            careerLabModel.traverse(child =>
            {
                if(child.isMesh)
                {
                    child.geometry = child.geometry.clone()
                    child.material = Array.isArray(child.material)
                        ? child.material.map(material => material.clone())
                        : child.material.clone()
                }
            })
        }

        const socialSource = model.find(child => child.name === 'social')
        const discord = socialSource?.children.find(child => child.name.startsWith('discord'))
        let socialLabModel = null
        if(cookieLabModel && discord)
        {
            socialLabModel = cookieLabModel.clone(true)
            socialLabModel.name = 'socialLab'
            socialLabModel.position.copy(socialSource.position)
            socialLabModel.position.x += discord.position.x + 3.5
            socialLabModel.position.z += discord.position.z + 8
            // Rotate the entire stand counter-clockwise toward the central statue.
            // Area consumes each direct child independently, so bake the yaw into them.
            const yaw = Math.PI / 2
            const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
            socialLabModel.userData.exhibitYaw = yaw
            for(const child of socialLabModel.children)
            {
                child.position.applyQuaternion(turn)
                child.quaternion.premultiply(turn)
            }
            socialLabModel.traverse(child =>
            {
                if(child.isMesh)
                {
                    child.geometry = child.geometry.clone()
                    child.material = Array.isArray(child.material)
                        ? child.material.map(material => material.clone())
                        : child.material.clone()
                }
            })
        }

        // A second complete project exhibit in the clearing behind the portal floor.
        const projectsSource = model.find(child => child.name === 'projects')
        const portalSource = model.find(child => child.name === 'behindTheScene')
        let portalProjectsModel = null
        if(projectsSource && portalSource)
        {
            portalProjectsModel = projectsSource.clone(true)
            portalProjectsModel.name = 'portalProjects'
            portalProjectsModel.position.copy(portalSource.position)
            // Pull the entire exhibit away from the rear tree canopy. Its camera,
            // labels, interaction point and colliders follow the same translation.
            portalProjectsModel.position.x -= 1
            portalProjectsModel.position.z -= 5
            portalProjectsModel.traverse(child =>
            {
                if(child.isMesh)
                {
                    child.geometry = child.geometry.clone()
                    child.material = Array.isArray(child.material)
                        ? child.material.map(material => material.clone())
                        : child.material.clone()
                }
            })
        }

        // Lakeside clearing beside fences at (72.4, -12.7) and (75.3, -11.6).
        // This is the land between the two ponds, not the altar's own origin.
        const altarSource = model.find(child => child.name === 'altar')
        let lakesideLabModel = null
        if(labSource && altarSource)
        {
            lakesideLabModel = labSource.clone(true)
            lakesideLabModel.name = 'lakesideLab'
            lakesideLabModel.position.set(
                69,
                labSource.position.y,
                -8.5
            )
            lakesideLabModel.traverse(child =>
            {
                if(child.isMesh)
                {
                    child.geometry = child.geometry.clone()
                    child.material = Array.isArray(child.material)
                        ? child.material.map(material => material.clone())
                        : child.material.clone()
                }
            })
        }

        // Second YamaSwap exhibit in the clearing left of the achievements fountain.
        let fountainLabModel = null
        if(lakesideLabModel)
        {
            fountainLabModel = lakesideLabModel.clone(true)
            fountainLabModel.name = 'fountainLab'
            // Move diagonally toward the foreground clearing, away from grass and trees.
            fountainLabModel.position.set(67.5, labSource.position.y, 28.5)
            // Tighten the foreground furniture toward the board, keeping the rug ashore.
            for(const child of fountainLabModel.children)
            {
                if(child.name.startsWith('mainTablePhysicalDynamic') || child.name.startsWith('sideTablePhysicalDynamic'))
                {
                    child.position.x -= 0.65
                    child.position.z -= 0.65
                }
                if(child.name.startsWith('refCarpet') || child.name.startsWith('refInteractivePoint'))
                {
                    child.position.x -= 1.2
                    child.position.z -= 1.2
                }
                if(child.name.startsWith('refCarpet'))
                    child.scale.multiplyScalar(0.85)
            }
            fountainLabModel.traverse(child =>
            {
                if(child.isMesh)
                {
                    child.geometry = child.geometry.clone()
                    child.material = Array.isArray(child.material)
                        ? child.material.map(material => material.clone())
                        : child.material.clone()
                }
            })
        }

        for(const child of model)
        {
            for(const [ name, AreaClass ] of list)
            {
                if(child.name.startsWith(name))
                    this[name] = new AreaClass(child)
            }
        }

        if(fountainLabModel)
            this.fountainLab = new LabArea(fountainLabModel)

        if(lakesideLabModel)
            this.lakesideLab = new LabArea(lakesideLabModel)

        if(portalProjectsModel)
            this.portalProjects = new ProjectsArea(portalProjectsModel)

        if(cookieLabModel)
            this.cookieLab = new LabArea(cookieLabModel)

        if(careerLabModel)
        {
            this.careerLab = new LabArea(careerLabModel)
            const arrival = this.game.respawns.getByName('career')
            const entrance = this.careerLab.references.items.get('interactivePoint')[0].position
            arrival.position.set(entrance.x + 4, 4, entrance.z + 4)
        }

        if(socialLabModel)
            this.socialLab = new LabArea(socialLabModel)

        // // Test how many areas are visible
        // this.game.ticker.events.on('tick', () =>
        // {
        //     let i = 0
        //     if(this.achievements.frustum.isIn)
        //         i++
        //     if(this.altar.frustum.isIn)
        //         i++
        //     if(this.behindTheScene.frustum.isIn)
        //         i++
        //     if(this.bowling.frustum.isIn)
        //         i++
        //     if(this.career.frustum.isIn)
        //         i++
        //     if(this.circuit.frustum.isIn)
        //         i++
        //     if(this.cookie.frustum.isIn)
        //         i++
        //     if(this.lab.frustum.isIn)
        //         i++
        //     if(this.landing.frustum.isIn)
        //         i++
        //     if(this.projects.frustum.isIn)
        //         i++
        //     if(this.social.frustum.isIn)
        //         i++
        //     if(this.toilet.frustum.isIn)
        //         i++

        //     console.log(i)
        // }, 6)
    }
}