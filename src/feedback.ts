import { ensureAnonymousUser, supabase } from './multiplayer/supabase'

export type FeedbackType = 'idea'|'problem'|'content'|'design'|'other'
export type FeedbackIssue = 'bug'|'confusing'|'slow'|'multiplayer'|'game_content'|'visual'|'accessibility'|'other'
export const FEEDBACK_TYPES: Array<{id:FeedbackType;label:string}> = [
  {id:'idea',label:'I have an idea'},{id:'problem',label:'Something went wrong'},{id:'content',label:'Game content'},{id:'design',label:'Design or usability'},{id:'other',label:'Something else'},
]
export const FEEDBACK_ISSUES: Array<{id:FeedbackIssue;label:string}> = [
  {id:'bug',label:'Something did not work'},
  {id:'confusing',label:'Something was confusing'},
  {id:'slow',label:'The page was slow'},
  {id:'multiplayer',label:'Multiplayer or room issue'},
  {id:'game_content',label:'Question or game content'},
  {id:'visual',label:'Layout or visual issue'},
  {id:'accessibility',label:'Accessibility issue'},
  {id:'other',label:'Something else'},
]

export async function submitFeedback(input:{type:FeedbackType;issues:FeedbackIssue[];gameId:string;rating:number|null;message:string;email:string;source:string;pagePath:string;playMode:string;website:string;screenshot:File|null}){
  const user=await ensureAnonymousUser()
  const width=window.innerWidth
  const deviceClass=width<600?'mobile':width<1024?'tablet':'desktop'
  const common={p_feedback_type:input.type,p_game_id:input.gameId||null,p_rating:input.rating,p_message:input.message,p_contact_email:input.email||null,p_source:input.source,p_page_path:input.pagePath,p_play_mode:input.playMode||null,p_device_class:deviceClass,p_website:input.website||null}
  let response=await supabase.rpc('decked_submit_feedback',{...common,p_issue_categories:input.issues})
  let supportsAttachments=true
  if(response.error?.code==='PGRST202'){
    response=await supabase.rpc('decked_submit_feedback',common)
    supportsAttachments=false
  }
  const {data,error}=response
  if(error)throw error
  const feedbackId=data as string
  let screenshotAttached=!input.screenshot
  if(input.screenshot&&supportsAttachments){
    const extension=input.screenshot.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg'
    const path=`${user.id}/${feedbackId}/${crypto.randomUUID()}.${extension}`
    const upload=await supabase.storage.from('feedback-screenshots').upload(path,input.screenshot,{contentType:input.screenshot.type,upsert:false})
    if(!upload.error){
      const attachment=await supabase.rpc('decked_attach_feedback_screenshot',{p_feedback_id:feedbackId,p_storage_path:path})
      screenshotAttached=!attachment.error
    }
  }
  return {feedbackId,screenshotAttached}
}
