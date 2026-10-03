type MatureContentGateProps = {
  gameName: string
  onBack: () => void
  onConfirm: () => void
}

export default function MatureContentGate({ gameName, onBack, onConfirm }: MatureContentGateProps) {
  return (
    <div className="mature-gate-screen screen-enter">
      <section className="mature-gate-card card-float-up" aria-labelledby="mature-content-title">
        <div className="mature-gate-panel">
          <div className="mature-gate-content">
            <div className="mature-gate-badge" aria-hidden="true">18+</div>

            <div className="mature-gate-copy">
              <h1 id="mature-content-title">MATURE CONTENT</h1>
              <p>{gameName} includes<br />mature content for ages 18+</p>
              <p>Continue?</p>
            </div>

            <div className="mature-gate-actions">
              <button type="button" className="mature-gate-back" onClick={onBack}>NO, GO BACK</button>
              <button type="button" className="mature-gate-confirm" onClick={onConfirm}>YES, I'M 18+</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
