import { clamp } from 'three/src/math/MathUtils.js'
import { Game } from './Game.js'

export class Map
{
    constructor()
    {
        this.game = Game.getInstance()

        this.initiated = false
        this.modal = this.game.modals.items.get('map')
        this.element = this.modal.element.querySelector('.js-map-container')

        this.setTrigger()
        this.setInputs()

        this.modal.events.on('open', () =>
        {
            if(!this.initiated)
                this.init()

            this.texture.update()
            requestAnimationFrame(() => this.layoutJourneyLabels())
            setTimeout(() => { if(this.modal.isOpen) this.layoutJourneyLabels() }, 450)
        })
    }

    init()
    {
        this.initiated = true
        
        this.setLocations()
        this.setJourneyMarkers()
        this.setJourneyRoute()
        this.journeyResizeObserver = new ResizeObserver(() => this.layoutJourneyLabels())
        this.journeyResizeObserver.observe(this.element)
        this.setPlayer()
        this.setTexture()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 14)
    }

    setJourneyRoute()
    {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('viewBox', '0 0 100 100')
        svg.setAttribute('preserveAspectRatio', 'none')
        svg.setAttribute('aria-hidden', 'true')
        svg.classList.add('journey-route')
        const point = (name) => {
            const item = this.locations.items.find(item => item.respawnName === name)
            const p = this.worldToMap(this.game.respawns.getByName(name).position)
            return [(p.x + item.offset.x) * 100, (p.y + item.offset.y) * 100]
        }
        const landing = point('landing'), cookie = point('cookie'), lab = point('lab')
        const projects = point('projects'), career = point('career'), social = point('social')
        const behind = point('behindTheScene'), altar = point('altar'), achievements = point('achievements')
        const xy = p => p.join(' ')
        // Follow Nicole's annotated route, using the live pin anchors at each stop.
        const route = `M ${xy(landing)} C ${landing[0]-5} ${landing[1]+5}, ${cookie[0]+4} ${cookie[1]+4}, ${xy(cookie)}
            C ${cookie[0]-9} ${cookie[1]-1}, ${lab[0]-8} ${lab[1]+3}, ${xy(lab)}
            C ${lab[0]+5} ${lab[1]-2}, ${projects[0]-4} ${projects[1]+3}, ${xy(projects)}
            C ${projects[0]-6} ${projects[1]-2}, ${career[0]+3} ${career[1]+3}, ${xy(career)}
            L ${xy(social)}
            C ${social[0]-4} ${social[1]-12}, ${behind[0]} ${social[1]-11}, ${behind[0]} ${social[1]-4}
            L ${xy(behind)}
            C ${behind[0]+7} ${behind[1]+3}, ${altar[0]-1} ${altar[1]+8}, ${xy(altar)}
            C ${altar[0]+8} ${altar[1]+6}, ${achievements[0]-6} ${achievements[1]-12}, ${xy(achievements)}`
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', route)
        svg.append(path)
        this.element.prepend(svg)
    }

    setJourneyMarkers()
    {
        const region = document.createElement('div')
        region.className = 'journey-region'
        region.innerHTML = '<span class="journey-region-label"><span class="journey-brand"><span class="journey-brand-logo"><img src="ui/fengbian-logo.svg" alt="风变科技" /></span><span class="journey-brand-heading">01 · FIRST CHAPTER<small>2021.01 〜 至今</small></span></span><small class="journey-brand-company">风变科技（深圳）有限科技公司</small></span>'
        this.element.append(region)

        const zones = [
            { name: '交付中心', date: '2025.08 〜 至今', labelX: 0.02, labelY: 0.50, fixedLabel: true, x: 55, y: 35, w: 20, h: 20, color: '#a7e7ec' },
            { name: '兼职中心', date: '2026.08 〜 2026.12', x: 75, y: 35, w: 22, h: 27, color: '#dbb6f4' },
            { name: '产研中心', date: '2023.04 〜 2025.07', labelX: 0.4091, labelY: 0.04, fixedLabel: true, x: 47, y: 55, w: 22, h: 19, color: '#bfe3a4' },
            { name: '业务中心', date: '2021.01 〜 2023.03', labelX: 0.62, labelY: -0.32, x: 47, y: 77, w: 16, h: 15, color: '#ffe1a9' },
        ]
        for(const zone of zones) {
            const area = document.createElement('div')
            area.className = 'journey-zone'
            area.dataset.fixedLabel = zone.fixedLabel ? 'true' : 'false'
            area.dataset.labelX = zone.labelX ?? 0.5
            area.dataset.labelY = zone.labelY ?? 0.48
            area.style.cssText = `left:${zone.x}%;top:${zone.y}%;width:${zone.w}%;height:${zone.h}%;--zone-color:${zone.color}`
            area.innerHTML = `<div class="journey-zone-caption"><strong>${zone.name}</strong><small>${zone.date}</small></div>`
            this.element.append(area)
        }

        const markers = [


        ]
        for(const item of markers)
        {
            const button = document.createElement('button')
            button.className = `journey-marker ${item.className}`
            button.style.left = `${item.x}%`
            button.style.top = `${item.y}%`
            button.innerHTML = `${item.label}${item.date ? `<small>${item.date}</small>` : ''}<small>${item.detail}</small>`
            button.setAttribute('aria-label', `${item.detail}，点击前往`)
            button.addEventListener('click', () => {
                this.game.player.respawn(item.destination, () => {
                    this.game.view.focusPoint.isTracking = true
                })
                this.game.modals.close()
            })
            this.element.append(button)
        }
    }

    layoutJourneyLabels()
    {
        const bounds = this.element.getBoundingClientRect()
        if(!bounds.width || !bounds.height) return
        const obstacle = (rect, padding = 10) => ({
            left: rect.left - padding, right: rect.right + padding,
            top: rect.top - padding, bottom: rect.bottom + padding
        })
        const obstacles = [...this.element.querySelectorAll('.location .pin, .journey-marker, .journey-region-label')]
            .map(element => obstacle(element.getBoundingClientRect()))
        const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
        for(const label of this.element.querySelectorAll('.journey-zone-caption'))
        {
            const zone = label.parentElement.getBoundingClientRect()
            const size = label.getBoundingClientRect()
            const preferredX = Number(label.parentElement.dataset.labelX)
            const preferredY = Number(label.parentElement.dataset.labelY)
            if(label.parentElement.dataset.fixedLabel === 'true') {
                label.style.left = `${preferredX * 100}%`
                label.style.top = `${preferredY * 100}%`
                obstacles.push(obstacle(label.getBoundingClientRect(), 5))
                continue
            }
            const candidates = []
            for(let y = -0.5; y <= 1.51; y += 0.1)
                for(let x = -0.5; x <= 1.51; x += 0.1)
                    candidates.push({ x, y, distance: (x - preferredX) ** 2 + (y - preferredY) ** 2 })
            candidates.sort((a, b) => a.distance - b.distance)
            for(const candidate of candidates)
            {
                const cx = zone.left + zone.width * candidate.x
                const cy = zone.top + zone.height * candidate.y
                const rect = { left: cx - size.width / 2, right: cx + size.width / 2, top: cy - size.height / 2, bottom: cy + size.height / 2 }
                if(rect.left < bounds.left + 5 || rect.right > bounds.right - 5 || rect.top < bounds.top + 5 || rect.bottom > bounds.bottom - 5) continue
                if(obstacles.some(item => overlaps(rect, item))) continue
                label.style.left = `${candidate.x * 100}%`
                label.style.top = `${candidate.y * 100}%`
                obstacles.push(obstacle(rect, 5))
                break
            }
        }
    }

    setLocations()
    {
        this.locations = {}
        this.locations.items = [
            { name: 'Blue X｜用户运营<span style="display:block;font-size:0.8em">2026.10–2026.12</span>', respawnName: 'achievements', offset: { x: 0, y: -0.01 } },
            { name: 'YamaSwap｜内容运营<span style="display:block;font-size:0.8em">2026.08–2026.09</span>', respawnName: 'altar', offset: { x: 0, y: -0.05 } },
            { name: 'Bitverse｜KOL运营<span style="display:block;font-size:0.8em">2026.05–2026.08</span>', respawnName: 'behindTheScene', offset: { x: 0.01, y: 0 } },
            { name: 'Unwind after work', respawnName: 'bowling', offset: { x: -0.08, y: 0.03 } },
            { name: '内容营销<span style="display:block;font-size:0.8em">2025.08—2025.12</span>', respawnName: 'career', offset: { x: 0, y: -0.06 } },
            { name: 'JOURNEY START', respawnName: 'circuit', offset: { x: -0.08, y: -0.05 } },
            { name: 'AI课程交付<span style="display:block;font-size:0.8em">2022.11–2023.03</span>', respawnName: 'cookie', offset: { x: -0.02, y: -0.01 } },
            { name: '产品运营<span style="display:block;font-size:0.8em">（AI课程配套工具）</span><span style="display:block;font-size:0.8em">2023.04–2023.11</span>', respawnName: 'lab', offset: { x: -0.03, y: 0 } },
            { name: 'LANDING（初始区域）', respawnName: 'landing', offset: { x: 0.02, y: 0 } },
            { name: 'AI产品运营<span style="display:block;font-size:0.8em">（独立站和app运营）</span><span style="display:block;font-size:0.8em">2023.12–2025.07</span>', respawnName: 'projects', offset: { x: 0, y: -0.02 } },
            { name: 'AI内容营销<span style="display:block;font-size:0.8em">2026.01—2026.03</span>', respawnName: 'social', offset: { x: -0.01, y: -0.04 } },
            { name: 'TIME MACHINE（时光机）', respawnName: 'timeMachine', offset: { x: 0, y: 0 } },
        ]

        for(const item of this.locations.items)
        {
            const respawn = this.game.respawns.getByName(item.respawnName)
            const mapPosition = this.worldToMap(respawn.position)

            // HTML
            const html = /* html */`
                <div class="pin"></div>
                <div class="name-container">
                    <div class="name">${item.name}</div>
                </div>
            `

            const element = document.createElement('div')
            element.classList.add('location')
            element.innerHTML = html
            element.style.left = `${(mapPosition.x + item.offset.x)* 100}%`
            element.style.top = `${(mapPosition.y + item.offset.y)* 100}%`
            element.style.zIndex = Math.round(mapPosition.y * 1000)
            
            this.element.append(element)

            element.addEventListener('click', () =>
            {
                this.game.player.respawn(item.respawnName, () =>
                {
                    this.game.view.focusPoint.isTracking = true
                })
                this.game.modals.close()
            })
        }
    }
    
    setPlayer()
    {
        this.player = {}
        this.player.element = this.element.querySelector('.js-player')
        this.player.roundedPosition = { x: 0, y: 0 }
    }
    
    setTexture()
    {
        this.texture = {}
        this.texture.element = this.element.querySelector('.js-texture')
        this.texture.previousUrl = null

        this.texture.element.addEventListener('load', () =>
        {
            this.texture.element.classList.add('is-visible')
        })
        
        this.texture.update = () =>
        {
            const url = this.game.dayCycles.intervalEvents.get('night').inInterval ? 'ui/map/map-night.webp' : 'ui/map/map-day.webp'

            if(url !== this.texture.previousUrl)
            {
                this.texture.element.classList.remove('is-visible')
                this.texture.previousUrl = url
                this.texture.element.src = url
            }
        }
    }

    setTrigger()
    {
        const element = this.game.domElement.querySelector('.js-map-trigger')
        
        element.addEventListener('click', (event) =>
        {
            this.game.modals.open('map')
        })
        element.addEventListener('keydown', (event) =>
        {
            event.preventDefault()
        })
    }

    setInputs()
    {
        // Inputs keyboard
        this.game.inputs.addActions([
            { name: 'map', categories: [ 'modal', 'menu', 'wandering' ], keys: [ 'Keyboard.m', 'Keyboard.KeyM' ] },
        ])
        this.game.inputs.events.on('map', (action) =>
        {
            if(action.active)
            {
                if(!this.modal.isOpen)
                    this.game.modals.open('map')
                else
                    this.game.modals.close()
            }
        })
    }

    worldToMap(coordinates)
    {
        let x = coordinates.x
        let y = typeof coordinates.z !== 'undefined' ? coordinates.z : coordinates.y

        x /= this.game.terrain.size
        y /= this.game.terrain.size

        x += 0.5
        y += 0.5

        x = clamp(x, 0, 1)
        y = clamp(y, 0, 1)

        return { x, y }
    }

    update()
    {
        if(!this.modal.isOpen)
            return

        const playerRoundedX = Math.round(this.game.player.position.x)
        const playerRoundedY = Math.round(this.game.player.position.z)

        if(playerRoundedX !== this.player.roundedPosition.x || playerRoundedY !== this.player.roundedPosition.y)
        {
            this.player.roundedPosition.x = playerRoundedX
            this.player.roundedPosition.y = playerRoundedY

            const playerCoordinates = this.worldToMap(this.player.roundedPosition)
            const x = Math.round(playerCoordinates.x * 1000) / 10
            const y = Math.round(playerCoordinates.y * 1000) / 10

            this.player.element.style.left = `${x}%`
            this.player.element.style.top = `${y}%`
            this.player.element.style.transform = `rotate(${-this.game.physicalVehicle.yRotation}rad)`
        }
    }
}