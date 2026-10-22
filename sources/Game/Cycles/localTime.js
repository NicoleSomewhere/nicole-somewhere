/** Use the visitor's device timezone, never UTC or a server timezone. */
export function getLocalPhase(date = new Date())
{
    const hour = date.getHours()
    return hour >= 6 && hour < 18 ? 'day' : 'night'
}

export function getLocalProgress(date = new Date())
{
    return getLocalPhase(date) === 'day' ? 0.05 : 0.45
}

/** Keep upstream dawn/dusk palettes during a short, smooth real-time transition. */
export function createLocalClock(readDate = () => new Date(), readTime = () => performance.now())
{
    let target = getLocalProgress(readDate())
    let current = target
    let from = target
    let to = target
    let started = readTime()
    let previous = started
    return () =>
    {
        const now = readTime()
        const next = getLocalProgress(readDate())
        // Resume immediately after sleep or a background-tab pause.
        if(now - previous > 30000)
        {
            current = from = to = target = next
            started = now
        }
        else if(next !== target)
        {
            target = next
            from = current
            to = next < current ? next + 1 : next
            started = now
        }
        const t = Math.min(1, Math.max(0, (now - started) / 10000))
        current = (from + (to - from) * (t * t * (3 - 2 * t))) % 1
        previous = now
        return current
    }
}
