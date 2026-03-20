export default function SiteLogo() {
  return (
    <div className="select-none" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* Stacked colored bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, justifyContent: 'center' }}>
        <span style={{ display: 'block', width: '32px', height: '6px', borderRadius: '2px', background: '#2554c2' }} />
        <span style={{ display: 'block', width: '25px', height: '6px', borderRadius: '2px', background: '#efd126' }} />
        <span style={{ display: 'block', width: '18px', height: '6px', borderRadius: '2px', background: '#23c15d' }} />
        <span style={{ display: 'block', width: '11px', height: '6px', borderRadius: '2px', background: '#da2828' }} />
      </div>

      {/* Text lockup */}
      <div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '22px', lineHeight: 1, letterSpacing: '1px' }}>
          <span style={{ color: '#E8E0FF' }}>BACK</span>
          <span style={{ color: '#E03030' }}>LOGGED</span>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: '#aaa', letterSpacing: '3px', marginTop: '6px', textTransform: 'uppercase' }}>
          Retro&nbsp;&nbsp;Game&nbsp;&nbsp;Vault
        </div>
      </div>
    </div>
  )
}
