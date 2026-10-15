import StopwatchRegular from '@mingcute/react/core-regular/stopwatch'

export default function ThinkFastPromptCard({ prompt, compact = false }: { prompt: string; compact?: boolean }) {
  return (
    <article className={`think-fast-prompt-card${compact ? ' is-compact' : ''}`} aria-label={`Think Fast prompt: ${prompt}`}>
      <span className="think-fast-card-line line-one" aria-hidden="true" />
      <span className="think-fast-card-line line-two" aria-hidden="true" />
      <div className="think-fast-card-badge" aria-hidden="true"><StopwatchRegular size={compact ? 24 : 30} /></div>
      <div className="think-fast-card-panel">
        <span>THINK FAST</span>
        <p>{prompt}</p>
      </div>
      <b>DECKED</b>
      <style>{`
        .think-fast-prompt-card{position:relative;width:min(310px,72vw);aspect-ratio:4/5;box-sizing:border-box;padding:58px 20px 38px;border:2px solid rgba(255,245,220,.62);border-radius:25px;background:#ff8a1f;box-shadow:0 22px 62px rgba(0,0,0,.38),0 0 38px rgba(255,138,31,.14);overflow:hidden;isolation:isolate}
        .think-fast-prompt-card.is-compact{width:min(250px,62vw);padding:48px 16px 31px;border-radius:21px}
        .think-fast-card-line{position:absolute;z-index:-1;height:5px;border-radius:999px;background:#371407;opacity:.3;transform:rotate(-20deg)}
        .think-fast-card-line.line-one{top:31px;left:20px;width:58px}.think-fast-card-line.line-two{right:13px;bottom:43px;width:70px}
        .think-fast-card-badge{position:absolute;z-index:2;top:19px;left:50%;width:58px;height:58px;display:grid;place-items:center;transform:translateX(-50%);border:4px solid #ff8a1f;border-radius:50%;background:#371407;color:#fff5dc;box-shadow:0 5px 14px rgba(55,20,7,.3)}
        .is-compact .think-fast-card-badge{top:14px;width:48px;height:48px}
        .think-fast-card-panel{height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 21px;border-radius:17px;background:#fff5dc;color:#291006;box-shadow:inset 0 0 0 1px rgba(55,20,7,.1),0 9px 22px rgba(55,20,7,.15)}
        .think-fast-card-panel span{margin-bottom:17px;color:#e76513;font:12px 'Staatliches',sans-serif;letter-spacing:.18em}
        .think-fast-card-panel p{margin:0;font:400 clamp(25px,5vw,36px)/1.08 'Anton SC',sans-serif;text-align:center;text-transform:uppercase;text-wrap:balance}
        .is-compact .think-fast-card-panel{padding:23px 16px}.is-compact .think-fast-card-panel span{margin-bottom:12px;font-size:10px}.is-compact .think-fast-card-panel p{font-size:clamp(20px,4.5vw,29px)}
        .think-fast-prompt-card>b{position:absolute;bottom:14px;left:0;right:0;color:#fff5dc;font:800 9px 'Satoshi',sans-serif;letter-spacing:.42em;text-align:center}
        .is-compact>b{bottom:10px;font-size:7px}
        @media(max-width:520px){.think-fast-prompt-card{width:min(270px,74vw);padding:51px 17px 33px;border-radius:22px}.think-fast-card-badge{top:15px;width:51px;height:51px}.think-fast-card-panel{padding:23px 17px}.think-fast-card-panel p{font-size:clamp(25px,8vw,33px)}}
      `}</style>
    </article>
  )
}
