import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getLocalPhase, getLocalProgress, createLocalClock } from '../sources/Game/Cycles/localTime.js'
const at = (h,m=0,s=0) => new Date(2026,9,21,h,m,s)
test('local day and night boundaries',()=>{
    for(const [h,m,s,expected] of [[0,0,0,'night'],[5,59,59,'night'],[6,0,0,'day'],[12,0,0,'day'],[17,59,59,'day'],[18,0,0,'night'],[23,59,59,'night']]) assert.equal(getLocalPhase(at(h,m,s)),expected)
})
test('uses local timezone rather than UTC',()=>{
    const old=process.env.TZ
    try {
        const instant=new Date('2026-10-21T03:00:00Z')
        process.env.TZ='Asia/Shanghai'; assert.equal(getLocalPhase(instant),'day')
        process.env.TZ='America/Los_Angeles'; assert.equal(getLocalPhase(instant),'night')
    } finally { if(old===undefined)delete process.env.TZ; else process.env.TZ=old }
})
test('sunset transitions and background resume resynchronizes',()=>{
    let date=at(17,59,59),ms=0
    const clock=createLocalClock(()=>date,()=>ms)
    assert.equal(clock(),.05)
    date=at(18);clock();ms=5000;assert.ok(clock()>.05&&clock()<.45)
    ms=10000;assert.ok(Math.abs(clock()-.45)<1e-9)
    date=at(7);ms=90000;assert.equal(clock(),.05)
})
test('sunrise passes through original dawn palette and settles',()=>{
    let date=at(5,59),ms=0;const clock=createLocalClock(()=>date,()=>ms)
    assert.equal(clock(),.45);date=at(6);clock();ms=5000;assert.ok(clock()>.6)
    ms=10000;assert.ok(Math.abs(clock()-.05)<1e-9)
})
