import * as THREE from 'three/webgpu'
import { Game } from '../../Game.js'
import { color, float, Fn, luminance, max, mix, positionGeometry, step, texture, uniform, uv, vec4 } from 'three/tsl'
import gsap from 'gsap'
import { clamp } from 'three/src/math/MathUtils.js'
import { Area } from './Area.js'

export class CareerArea extends Area
{
    constructor(references)
    {
        super(references)

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '💼 Career',
                expanded: false,
            })
        }

        this.setSounds()
        this.setLines()
        this.setYears()
        this.setAchievement()
    }

    setSounds()
    {
        this.sounds = {}
        this.sounds.stoneOut = this.game.audio.register({
            path: 'sounds/stoneSlides/stoneSlideOut.mp3',
            autoplay: false,
            loop: false,
            volume: 0.3,
            antiSpam: 0.1,
            positions: new THREE.Vector3(),
            distanceFade: 14,
            onPlay: (item, line) =>
            {
                item.positions[0].copy(line.origin)
                item.rate = 1.2 + line.index * 0.1
            }
        })
        this.sounds.stoneIn = this.game.audio.register({
            path: 'sounds/stoneSlides/stoneSlideIn.mp3',
            autoplay: false,
            loop: false,
            volume: 0.2,
            rate: 0.8,
            antiSpam: 0.1,
            positions: new THREE.Vector3(),
            distanceFade: 14,
            onPlay: (item, line) =>
            {
                item.positions[0].copy(line.origin)
                // item.rate = 0.9 + Math.random() * 0.2
            }
        })
    }

    setLines()
    {
        this.lines = {}
        this.lines.items = []
        this.lines.activeElevation = 2.5
        this.lines.padding = 0.25
        
        const lineGroups = this.references.items.get('line')

        const colors = {
            blue: uniform(color('#5390ff')),
            orange: uniform(color('#ff8039')),
            purple: uniform(color('#b65fff')),
            green: uniform(color('#a2ffab'))
        }

        for(const group of lineGroups)
        {
            const line = {}
            line.group = group
            line.size = parseFloat(line.group.userData.size)
            line.hasEnd = line.group.userData.hasEnd
            line.color = line.group.userData.color
            const labels = {
                careerHetic: '业务运营 / 数据运营',
                careerUzik: '媒介策略',
                careerImmersiveGarden: '课程交付',
                careerOnlineTeacher: '业务中心',
                careerFreelancer: '业务运营 / 数据运营',
                careerIRLTeacher: '课程交付'
            }
            line.texture = this.createCareerTexture(labels[line.group.userData.texture] || '业务中心', '2021.01 〜 2023.03')

            line.stone = line.group.children.find(child => child.name.startsWith('stone'))
            line.stone.position.y = 0
            
            line.origin = line.group.position.clone()
            
            line.isIn = false
            line.isUp = false
            line.elevationTarget = 0
            line.offsetTarget = 0
            line.labelReveal = uniform(0)

            {
                line.textMesh = line.stone.children.find(child => child.name.startsWith('careerText'))

                const material = new THREE.MeshLambertNodeMaterial({ transparent: true })
                
                const baseColor = colors[line.color]

                material.outputNode = Fn(() =>
                {
                    const baseUv = uv().toVar()

                    step(baseUv.x, line.labelReveal).lessThan(0.5).discard()

                    const textureColor = texture(line.texture, baseUv)

                    const alpha = step(0.1, max(textureColor.r, textureColor.g))

                    const emissiveColor = baseColor.div(luminance(baseColor)).mul(1.7)

                    const maskColor = color('#251f2b')
                    const finalColor = mix(maskColor, emissiveColor, textureColor.r)
                    
                    return vec4(finalColor, alpha)
                })()

                // Mesh
                line.textMesh.castShadow = false
                line.textMesh.receiveShadow = false
                line.textMesh.material = material
            }

            this.lines.items.push(line)
        }

        this.lines.items.sort((a, b) => b.origin.z - a.origin.z)

        let i = 0
        for(const line of this.lines.items)
        {
            line.index = i++
        }

        // Debug
        if(this.game.debug.active)
        {
            this.game.debug.addThreeColorBinding(this.debugPanel, colors.blue.value, 'blue')
            this.game.debug.addThreeColorBinding(this.debugPanel, colors.orange.value, 'orange')
            this.game.debug.addThreeColorBinding(this.debugPanel, colors.purple.value, 'purple')
            this.game.debug.addThreeColorBinding(this.debugPanel, colors.green.value, 'green')
        }
    }

    createCareerTexture(title, subtitle, board = false)
    {
        const canvas = document.createElement('canvas')
        canvas.width = 1536
        canvas.height = 512
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = board ? '#302438' : '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 94px "PingFang SC", "Microsoft YaHei", sans-serif'
        ctx.fillText(title, 768, 185, 1420)
        ctx.font = '64px "PingFang SC", "Microsoft YaHei", sans-serif'
        ctx.fillText(subtitle, 768, 338, 1420)
        const result = new THREE.CanvasTexture(canvas)
        return result
    }

    setYears()
    {
        this.year = {}
        this.year.group = this.references.items.get('year')[0]
        this.year.originZ = this.year.group.position.z
        this.year.size = 17
        this.year.offsetTarget = 0
        this.year.start = 2021
        this.year.current = 2021
        for(const child of this.year.group.children) child.visible = false
        // A fixed, upright roadside gateway rather than a sliding floor label.
        this.year.updateDigits = () => {}
    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'career')
        })
    }

    update()
    {
        // Lines
        for(const line of this.lines.items)
        {
            const delta = line.origin.z - this.game.player.position.z

            // Is in
            if(delta > - this.lines.padding && delta < line.size + this.lines.padding * 2)
            {
                if(!line.isIn)
                {
                    line.isIn = true
                    gsap.to(line.labelReveal, { value: 1, duration: 1, delay: 0.3, overwrite: true, ease: 'power2.inOut' })
                }
            }

            // Is out
            else
            {
                if(line.isIn)
                {
                    line.isIn = false
                    gsap.to(line.labelReveal, { value: 0, duration: 1, overwrite: true, ease: 'power2.inOut' })
                }
            }

            // Elevation
            if(line.isIn)
            {
                if(!line.isUp)
                {
                    line.isUp = true
                    this.sounds.stoneOut.play(line)
                }
            }
            else
            {
                if(delta > line.size)
                {
                    if(line.hasEnd)
                    {
                        if(line.isUp)
                        {
                            line.isUp = false
                            gsap.delayedCall(0.3, () =>
                            {
                                this.sounds.stoneIn.play(line)
                            })
                        }
                    }
                }
                else
                {
                    if(line.isUp)
                    {
                        line.isUp = false
                        gsap.delayedCall(0.3, () =>
                        {
                            this.sounds.stoneIn.play(line)
                        })
                    }
                }
            }

            line.elevationTarget = line.isUp ? this.lines.activeElevation : 0
            line.stone.position.y += (line.elevationTarget - line.stone.position.y) * this.game.ticker.deltaScaled * 3

            // Position
            if(line.isIn)
            {
                if(line.stone.position.y > 1)
                    line.offsetTarget = - clamp(delta, 0, line.size)
            }
            else
            {
                // End
                if(delta > line.size)
                    line.offsetTarget = - line.size
                // Start
                else
                    line.offsetTarget = 0
            }

            line.stone.position.z += (line.offsetTarget - line.stone.position.z) * this.game.ticker.deltaScaled * 10
        }

        // Year
        const delta = this.year.originZ - this.game.player.position.z

        if(delta > this.year.size)
            this.year.offsetTarget = this.year.size
        else if(delta < 0)
            this.year.offsetTarget = 0
        else
            this.year.offsetTarget = delta

        const finalPositionZ = this.year.originZ
        this.year.group.position.z += (finalPositionZ - this.year.group.position.z) * this.game.ticker.deltaScaled * 10

        const yearCurrent = this.year.start + Math.floor(this.year.offsetTarget)

        if(yearCurrent !== this.year.current)
        {
            this.year.current = yearCurrent
            this.year.updateDigits(this.year.current)
        }
    }
}