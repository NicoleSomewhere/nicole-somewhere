import * as THREE from 'three'

// Fit the actual exhibit in portrait without the world-scale cinematic pullback.
export function fitExhibitCamera(objects, position, target, aspect, fov = 60)
{
    const points = []
    for(const object of objects)
    {
        if(!object) continue
        object.updateWorldMatrix(true, true)
        object.traverse(child =>
        {
            if(!child.geometry) return
            child.geometry.computeBoundingBox()
            const box = child.geometry.boundingBox
            if(!box || box.isEmpty()) return
            for(const x of [box.min.x, box.max.x])
                for(const y of [box.min.y, box.max.y])
                    for(const z of [box.min.z, box.max.z])
                        points.push(new THREE.Vector3(x, y, z).applyMatrix4(child.matrixWorld))
        })
    }
    if(!points.length) return null
    const center = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3())
    const back = position.clone().sub(target).normalize()
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), back).normalize()
    const up = new THREE.Vector3().crossVectors(back, right)
    const tanY = Math.tan(THREE.MathUtils.degToRad(fov / 2))
    const tanX = tanY * Math.max(aspect, 0.1)
    let distance = 0.1
    for(const point of points)
    {
        const delta = point.clone().sub(center)
        distance = Math.max(distance, delta.dot(back) + Math.max(
            Math.abs(delta.dot(right)) * 1.15 / tanX,
            Math.abs(delta.dot(up)) * 1.15 / tanY
        ))
    }
    return { position: center.clone().addScaledVector(back, distance), target: center, fov }
}
