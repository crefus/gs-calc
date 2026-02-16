export const encodePartyState = (party) => {
    // Minimize: [ {u:1, e:[101,0,0], c:201, a:'arts', ee:[1,1,1] }, ... ]
    const minimal = party.map(slot => ({
        u: slot.unit ? slot.unit.id : 0,
        e: slot.equips.map(eq => eq ? eq.id : 0),
        cs: slot.crests ? slot.crests.map(c => c ? c.id : 0) : [0, 0, 0],
        a: slot.selectedAction || 'trueArts',
        ee: slot.equipEnabled ? slot.equipEnabled.map(b => b ? 1 : 0) : [1, 1, 1],
        th: slot.tasHP || 0,
        ta: slot.tasAtk || 0,
        td: slot.tasDef || 0,
        hr: slot.hpRate !== undefined ? slot.hpRate : 1.0,
        eti: slot.equipTargetIndices || [0, 0, 0]
    }));
    return btoa(unescape(encodeURIComponent(JSON.stringify(minimal))));
};

export const decodePartyState = (encoded, unitsData, equipData, crestData) => {
    try {
        const minimal = JSON.parse(decodeURIComponent(escape(atob(encoded))));
        return minimal.map(m => {
            let crests = [null, null, null];
            if (m.cs && Array.isArray(m.cs)) {
                crests = m.cs.map(cid => crestData.find(c => c.id === cid) || null);
            } else if (m.c) {
                // Backward compatibility
                crests[0] = crestData.find(c => c.id === m.c) || null;
            }
            return {
                unit: unitsData.find(u => u.id === m.u) || null,
                equips: m.e.map(eid => equipData.find(eq => eq.id === eid) || null),
                crests,
                selectedAction: m.a || 'trueArts',
                equipEnabled: m.ee ? m.ee.map(v => v === 1) : [true, true, true],
                tasHP: m.th || 0,
                tasAtk: m.ta || 0,
                tasDef: m.td || 0,
                hpRate: m.hr !== undefined ? m.hr : 1.0,
                equipTargetIndices: m.eti || [0, 0, 0]
            };
        });
    } catch (e) {
        console.error("Failed to decode party", e);
        return null;
    }
};
