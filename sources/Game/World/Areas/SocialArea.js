import * as THREE from 'three/webgpu'
import { Game } from '../../Game.js'
import { InteractivePoints } from '../../InteractivePoints.js'
import socialData from '../../../data/social.js'
import { InstancedGroup } from '../../InstancedGroup.js'
import { Area } from './Area.js'
import { View } from '../../View.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export class SocialArea extends Area
{
    constructor(model)
    {
        // Replace the logo before Area builds its visuals and physics.
        model.traverse(child =>
        {
            if(child.isMesh && child.name === 'twitchPhysicalDynamic')
                child.geometry = createInstagramGeometry()
        })
        addFacebookStand(model)
        super(model)

        this.center = this.references.items.get('center')[0].position

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '👨‍🦲 Social',
                expanded: false,
            })
        }

        this.setLinks()
        this.setFans()
        this.setOnlyFans()
        this.setStatue()
        // this.setFWA()
        this.setAchievement()
    }

    setLinks()
    {
        const radius = 6
        let i = 0

        for(const link of socialData)
        {
            const angle = link.name === 'FACEBOOK' ? -Math.PI / 7 : i * Math.PI / 7
            const position = this.center.clone()
            position.x += Math.cos(angle) * radius
            position.y = 1
            position.z -= Math.sin(angle) * radius

            this.interactivePoint = this.game.interactivePoints.create(
                position,
                link.name,
                link.align === 'left' ? InteractivePoints.ALIGN_LEFT : InteractivePoints.ALIGN_RIGHT,
                InteractivePoints.STATE_CONCEALED,
                () =>
                {
                    if(link.url)
                        window.open(link.url, '_blank')
                    else if(link.modal)
                        this.game.modals.open(link.modal)
                },
                () =>
                {
                    this.game.inputs.interactiveButtons.addItems(['interact'])
                },
                () =>
                {
                    this.game.inputs.interactiveButtons.removeItems(['interact'])
                },
                () =>
                {
                    this.game.inputs.interactiveButtons.removeItems(['interact'])
                }
            )
            
            i++
        }
    }

    setFans()
    {
        const baseFan = this.references.items.get('fan')[0]
        baseFan.castShadow = true
        baseFan.receiveShadow = true

        baseFan.position.set(0, 0, 0)

        // Update materials 
        this.game.materials.updateObject(baseFan)

        baseFan.removeFromParent()
        
        this.fans = {}
        this.fans.spawnerPosition = this.references.items.get('onlyFans')[0].position
        this.fans.count = 30
        this.fans.visibleCount = 0
        this.fans.currentIndex = 0
        this.fans.mass = 0.02
        this.fans.objects = []

        const references = []

        for(let i = 0; i < this.fans.count; i++)
        {
            // Reference
            const reference = new THREE.Object3D()

            reference.position.copy(this.fans.spawnerPosition)
            reference.position.y += 99
            reference.needsUpdate = true
            references.push(reference)
            
            // Object
            const object = this.game.objects.add(
                {
                    model: reference,
                    updateMaterials: false,
                    castShadow: false,
                    receiveShadow: false,
                    parent: null,
                },
                {
                    type: 'dynamic',
                    position: reference.position,
                    rotation: reference.quaternion,
                    friction: 0.7,
                    mass: this.fans.mass,
                    sleeping: true,
                    enabled: false,
                    colliders: [ { shape: 'cuboid', parameters: [ 0.45, 0.65, 0.45 ], category: 'object' } ],
                    waterGravityMultiplier: - 1
                },
            )

            this.fans.objects.push(object)
        }

        this.fans.instancedGroup = new InstancedGroup(references, baseFan)

        this.fans.pop = () =>
        {
            const object = this.fans.objects[this.fans.currentIndex]

            const spawnPosition = this.fans.spawnerPosition.clone()
            spawnPosition.x += (Math.random() - 0.5) * 4
            spawnPosition.y += 4 * Math.random()
            spawnPosition.z += (Math.random() - 0.5) * 4
            object.physical.body.setTranslation(spawnPosition)
            object.physical.body.setEnabled(true)
            object.physical.body.setLinvel({ x: 0, y: 0, z: 0 })
            object.physical.body.setAngvel({ x: 0, y: 0, z: 0 })
            object.physical.body.wakeUp()
            // this.game.ticker.wait(1, () =>
            // {
            //     object.physical.body.applyImpulse({
            //         x: (Math.random() - 0.5) * this.fans.mass * 2,
            //         y: Math.random() * this.fans.mass * 3,
            //         z: this.fans.mass * 7
            //     }, true)
            //     object.physical.body.applyTorqueImpulse({ x: 0, y: 0, z: 0 }, true)
            // })

            this.fans.currentIndex = (this.fans.currentIndex + 1) % this.fans.count

            this.fans.visibleCount = Math.min(this.fans.visibleCount + 1, this.fans.count)

            // Sound
            this.game.audio.groups.get('click').play(true)

            // Achievement
            this.game.achievements.setProgress('fan', 1)
        }
    }

    setOnlyFans()
    {
        const interactiveArea = this.game.interactivePoints.create(
            this.references.items.get('onlyFans')[0].position,
            'OnlyFans',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.fans.pop()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )
    }

    setStatue()
    {
        this.statue = {}
        this.statue.body = this.references.items.get('statue')[0].userData.object.physical.body
        this.statue.down = false
    }

    setFWA()
    {
        this.fwa = {}

        // Confetti
        let i = 0
        this.fwa.positions = [
            new THREE.Vector3(23.5, 0, -18.5),
            new THREE.Vector3(27, 0, -19.5),
        ]
        const pop = () =>
        {
            i++
            const position = this.fwa.positions[i % this.fwa.positions.length]
            this.game.world.confetti.pop(position)
            
            setTimeout(pop, 500 + Math.random() * 1500)
        }
        setTimeout(pop, 2000)
        
        // Interactive points
        game.interactivePoints.temporaryHide()

        // Input => start
        this.game.inputs.addActions([
            { name: 'startFWA', categories: [ 'intro', 'modal', 'menu', 'racing', 'cinematic', 'wandering' ], keys: [ 'Keyboard.k' ] },
            { name: 'winFWA', categories: [ 'intro', 'modal', 'menu', 'racing', 'cinematic', 'wandering' ], keys: [ 'Keyboard.j' ] },
        ])
        this.game.inputs.events.on('startFWA', (action) =>
        {
            if(action.active)
            {
                // View
                game.view.zoom.baseRatio = 0.55
                game.view.zoom.ratio = 0.55
                game.view.zoom.smoothedRatio = 0.55
                game.view.focusPoint.position.set(25, 0, -19.2)
                game.view.focusPoint.isTracking = false
                window.setTimeout(() =>
                {
                    this.game.view.setMode(View.MODE_FREE)
                }, 1000)

                // Weather
                this.game.weather.override.start(
                    {
                        humidity: 0,
                        electricField: 0,
                        clouds: 0,
                        wind: 0
                    },
                    0
                )
        
                // Day cycles
                this.game.dayCycles.override.start(
                    {
                        progress: 0.87
                    },
                    0
                )
                
                // Buttons
                document.querySelector('.js-menu-trigger').style.display = 'none'
                document.querySelector('.js-map-trigger').style.display = 'none'
            }
        })
        this.game.inputs.events.on('winFWA', (action) =>
        {
            if(action.active)
            {
                this.game.achievements.setProgress('foty', 1)
            }
        })
    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'social')
        })
    }

    update()
    {
        if(this.fans.visibleCount)
        {
            let allFansSleeping = true
            for(const fan of this.fans.objects)
                allFansSleeping = allFansSleeping && fan.physical.body.isSleeping()

            if(!allFansSleeping)
                this.fans.instancedGroup.updateBoundings()
        }
    
        if(this.statue && !this.statue.down && !this.statue.body.isSleeping())
        {
            const statueUp = new THREE.Vector3(0, 1, 0)
            statueUp.applyQuaternion(this.statue.body.rotation())
            if(statueUp.y < 0.25)
            {
                this.statue.down = true
                this.game.achievements.setProgress('statueDown', 1)
            }
        }

        for(const object of this.fans.objects)
        {
            if(!object.physical.body.isSleeping() && object.physical.body.isEnabled())
                object.visual.object3D.needsUpdate = true
        }
    }
}
// A solid, bevelled camera outline using the original logo's palette swatch.
// Keep its size, origin and depth so the existing plinth and collider still fit.
function createInstagramGeometry()
{
    const roundedSquare = (size, radius, PathType) =>
    {
        const path = new PathType()
        const h = size / 2
        path.moveTo(-h + radius, -h)
        path.lineTo(h - radius, -h)
        path.quadraticCurveTo(h, -h, h, -h + radius)
        path.lineTo(h, h - radius)
        path.quadraticCurveTo(h, h, h - radius, h)
        path.lineTo(-h + radius, h)
        path.quadraticCurveTo(-h, h, -h, h - radius)
        path.lineTo(-h, -h + radius)
        path.quadraticCurveTo(-h, -h, -h + radius, -h)
        return path
    }
    const frame = roundedSquare(1.48, 0.35, THREE.Shape)
    frame.holes.push(roundedSquare(1.12, 0.22, THREE.Path))
    const lens = new THREE.Shape()
    lens.absarc(0, 0, 0.36, 0, Math.PI * 2, false)
    const aperture = new THREE.Path()
    aperture.absarc(0, 0, 0.21, 0, Math.PI * 2, true)
    lens.holes.push(aperture)
    const flash = new THREE.Shape()
    flash.absarc(0.39, 0.39, 0.085, 0, Math.PI * 2, false)
    const pieces = [frame, lens, flash].map(shape => new THREE.ExtrudeGeometry(shape, {
        depth: 0.15, steps: 1, curveSegments: 8,
        bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1,
    }))
    const geometry = mergeGeometries(pieces)
    pieces.forEach(piece => piece.dispose())
    geometry.translate(0, -0.1, -0.04)
    const uv = geometry.getAttribute('uv')
    for(let i = 0; i < uv.count; i++)
        uv.setXY(i, 0.42096996307373047, 0.5)
    return geometry
}

function addFacebookStand(model)
{
    const source = model.children.find(child => child.name === THREE.PropertyBinding.sanitizeNodeName('Cube.133'))
    const originalLogo = model.children.find(child => child.name === 'xPhysicalDynamic')
    const center = model.children.find(child => child.name === 'refCenter')
    if(!source || !originalLogo || !center) return
    const angle = Math.PI / 7
    const location = new THREE.Vector3(
        center.position.x + Math.cos(angle) * 7.85,
        source.position.y,
        center.position.z + Math.sin(angle) * 7.85
    )
    // Copy the existing X plinth's triangles from the combined platform mesh.
    const original = source.geometry.index ? source.geometry.toNonIndexed() : source.geometry.clone()
    const positions = original.getAttribute('position')
    const selected = []
    for(let i = 0; i < positions.count; i += 3)
    {
        if([i, i + 1, i + 2].every(j => positions.getX(j) > 6 && Math.abs(positions.getZ(j)) < 2))
            selected.push(i, i + 1, i + 2)
    }
    const platformGeometry = new THREE.BufferGeometry()
    for(const [name, attribute] of Object.entries(original.attributes))
    {
        const values = []
        for(const index of selected)
            for(let component = 0; component < attribute.itemSize; component++)
                values.push(attribute.array[index * attribute.itemSize + component])
        platformGeometry.setAttribute(name, new THREE.Float32BufferAttribute(values, attribute.itemSize))
    }
    original.dispose()
    platformGeometry.translate(-7.8485, 0, 0)
    const platform = new THREE.Mesh(platformGeometry, source.material)
    platform.name = 'facebookPlatformPhysicalFixed'
    platform.position.copy(location)
    platform.rotation.y = -angle
    const platformCollider = new THREE.Object3D()
    platformCollider.name = 'cuboid'
    platformCollider.position.y = 0.2
    platformCollider.scale.set(1.65, 0.4, 2.8)
    platform.add(platformCollider)
    model.add(platform)

    const shape = new THREE.Shape()
    shape.moveTo(-0.17, -0.86)
    shape.lineTo(0.17, -0.86)
    shape.lineTo(0.17, -0.05)
    shape.lineTo(0.46, -0.05)
    shape.lineTo(0.51, 0.28)
    shape.lineTo(0.17, 0.28)
    shape.lineTo(0.17, 0.51)
    shape.quadraticCurveTo(0.17, 0.64, 0.32, 0.64)
    shape.lineTo(0.52, 0.64)
    shape.lineTo(0.52, 0.94)
    shape.lineTo(0.25, 0.94)
    shape.quadraticCurveTo(-0.17, 0.94, -0.17, 0.54)
    shape.lineTo(-0.17, 0.28)
    shape.lineTo(-0.43, 0.28)
    shape.lineTo(-0.43, -0.05)
    shape.lineTo(-0.17, -0.05)
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.18, steps: 1, curveSegments: 6,
        bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 1,
    })
    const uv = geometry.getAttribute('uv')
    for(let i = 0; i < uv.count; i++) uv.setXY(i, 0.42096996307373047, 0.5)
    const logo = originalLogo.clone(true)
    logo.name = 'facebookPhysicalDynamic'
    logo.geometry = geometry
    logo.position.copy(location)
    logo.position.y += 1.45
    logo.rotation.set(0, -angle, 0)
    model.add(logo)
}
