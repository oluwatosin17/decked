import { useEffect, useRef, type FormEvent, type ReactNode } from 'react'

export function FilterBar({summary,count,onOpen,children}:{summary:string;count?:number;onOpen:()=>void;children?:ReactNode}){
  return <div className="cc-report-controls"><div className="cc-filter-summary"><span>Current view</span><strong>{summary}</strong></div><div className="cc-report-actions"><button className="cc-button cc-button-secondary cc-filter-trigger" type="button" onClick={onOpen}>Filters{count?<span aria-label={`${count} optional filters active`}>{count}</span>:null}</button>{children}</div></div>
}

export function FilterDrawer({open,title,description,onClose,onApply,onReset,children}:{open:boolean;title:string;description:string;onClose:()=>void;onApply:()=>void;onReset:()=>void;children:ReactNode}){
  const dialogRef=useRef<HTMLDialogElement>(null)
  useEffect(()=>{const dialog=dialogRef.current;if(!dialog)return;if(open&&!dialog.open)dialog.showModal();else if(!open&&dialog.open)dialog.close()},[open])
  const submit=(event:FormEvent)=>{event.preventDefault();onApply()}
  return <dialog ref={dialogRef} className="cc-filter-dialog" aria-labelledby="report-filter-title" onCancel={event=>{event.preventDefault();onClose()}} onClose={onClose}><form className="cc-filter-drawer" onSubmit={submit}><header><div><span>REPORT VIEW</span><h2 id="report-filter-title">{title}</h2><p>{description}</p></div><button type="button" className="cc-dialog-close" aria-label="Close filters" onClick={onClose}>×</button></header><div className="cc-drawer-fields">{children}</div><footer><button type="button" className="cc-text-button" onClick={onReset}>Reset</button><div><button type="button" className="cc-button cc-button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="cc-button">Apply filters</button></div></footer></form></dialog>
}
