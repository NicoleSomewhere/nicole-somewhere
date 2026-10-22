import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { fitExhibitCamera } from '../sources/Game/utilities/exhibitFraming.js'

for(const aspect of [320/740, 390/844, 430/932, 768/1024])
    for(const yaw of [0, Math.PI/2, -Math.PI/3])
        test(`portrait board and controls fit: ${aspect}, yaw ${yaw}`, () =>
        {
            const group = new THREE.Group()
            group.position.set(67, 3, 28)
            group.rotation.y = yaw
            const board = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 0.2))
            group.add(board)
            const controls = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 0.2))
            controls.position.y = -3.5
            group.add(controls)
            group.updateMatrixWorld(true)
            const target = group.position.clone()
            const position = target.clone().add(new THREE.Vector3(0, 2, 10).applyAxisAngle(new THREE.Vector3(0,1,0), yaw))
            const fit = fitExhibitCamera([group], position, target, aspect)
            const camera = new THREE.PerspectiveCamera(fit.fov, aspect, 0.1, 200)
            camera.position.copy(fit.position)
            camera.lookAt(fit.target)
            camera.updateMatrixWorld(true)
            for(const mesh of [board, controls])
            {
                const vertices = mesh.geometry.attributes.position
                for(let i=0;i<vertices.count;i++)
                {
                    const p = new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrixWorld).project(camera)
                    assert.ok(Math.abs(p.x) < 0.9 && Math.abs(p.y) < 0.9)
                    assert.ok(p.z > -1 && p.z < 1)
                }
            }
            const oldDistance = position.distanceTo(target) + (16/9/aspect - 1)*10
            assert.ok(fit.position.distanceTo(fit.target) < oldDistance)
        })
test('missing geometry falls back to existing camera', () => {
    assert.equal(fitExhibitCamera([], new THREE.Vector3(0,0,10), new THREE.Vector3(), 0.5), null)
})
