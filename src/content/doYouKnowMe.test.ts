import { describe, expect, it } from 'vitest'
import { KNOW_ME_CATEGORIES, KNOW_ME_PROMPTS, promptsFor } from './doYouKnowMe'
import { EDITORIAL_PERSONALITY_PROMPTS } from './doYouKnowMeEditorial'
import { EDITORIAL_EVERYDAY_PROMPTS } from './doYouKnowMeEverydayEditorial'
import { EDITORIAL_FOOD_PROMPTS } from './doYouKnowMeFoodEditorial'
import { EDITORIAL_OPINIONS_PROMPTS } from './doYouKnowMeOpinionsEditorial'
import { EDITORIAL_ENTERTAINMENT_PROMPTS } from './doYouKnowMeEntertainmentEditorial'
import { EDITORIAL_FUTURE_PROMPTS } from './doYouKnowMeFutureEditorial'
import { EDITORIAL_NIGERIAN_PROMPTS } from './doYouKnowMeNigerianEditorial'
import { EDITORIAL_WILD_CARD_PROMPTS } from './doYouKnowMeWildCardsEditorial'

const editorialPrompts=[...EDITORIAL_PERSONALITY_PROMPTS,...EDITORIAL_EVERYDAY_PROMPTS,...EDITORIAL_FOOD_PROMPTS,...EDITORIAL_OPINIONS_PROMPTS,...EDITORIAL_ENTERTAINMENT_PROMPTS,...EDITORIAL_FUTURE_PROMPTS,...EDITORIAL_NIGERIAN_PROMPTS,...EDITORIAL_WILD_CARD_PROMPTS]
const semanticStopWords=new Set('a an and are as at be been being but by can could did do does for from had has have how i if in into is it its me might my of on one or should so than that the their them they this to was what when where which who why will with would'.split(' '))
const semanticTokens=(text:string)=>new Set(text.toLocaleLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(word=>word.length>2&&!semanticStopWords.has(word)))
const semanticOverlap=(left:Set<string>,right:Set<string>)=>{
  let intersection=0
  for(const word of left)if(right.has(word))intersection+=1
  return intersection/(left.size+right.size-intersection||1)
}

describe('Do You Know Me content library', () => {
  it('contains exactly 300 prompts in every category', () => {
    for (const category of KNOW_ME_CATEGORIES) {
      expect(KNOW_ME_PROMPTS.filter(prompt => prompt.category === category.id), category.label).toHaveLength(300)
    }
    expect(KNOW_ME_PROMPTS).toHaveLength(2400)
    expect(editorialPrompts).toHaveLength(2400)
    expect(KNOW_ME_PROMPTS.every(prompt=>prompt.id.includes('-editorial-'))).toBe(true)
  })

  it('has unique ids, unique question wording, and four distinct answers', () => {
    expect(new Set(KNOW_ME_PROMPTS.map(prompt => prompt.id)).size).toBe(KNOW_ME_PROMPTS.length)
    for (const category of KNOW_ME_CATEGORIES) {
      const questions = KNOW_ME_PROMPTS.filter(prompt => prompt.category === category.id).map(prompt => prompt.question.toLocaleLowerCase())
      expect(new Set(questions).size, category.label).toBe(questions.length)
    }
    for (const prompt of KNOW_ME_PROMPTS) {
      expect(prompt.question.length).toBeGreaterThan(20)
      expect(prompt.options).toHaveLength(4)
      expect(new Set(prompt.options.map(option => option.toLocaleLowerCase())).size, prompt.id).toBe(4)
      expect(prompt.options.every(option => option.trim().length > 1), prompt.id).toBe(true)
    }
  })

  it('keeps player-facing questions and answers concise and free of mechanical context suffixes', () => {
    for (const prompt of KNOW_ME_PROMPTS) {
      expect(prompt.question.length, prompt.id).toBeLessThanOrEqual(120)
      expect(prompt.options.every(option => option.length <= 55), prompt.id).toBe(true)
      expect(prompt.options.every(option => !option.includes(' — for ')), prompt.id).toBe(true)
      expect(prompt.question, prompt.id).not.toMatch(/^(Picture|Drop me into|Here is the scene|Suppose I am facing|Think of me handling|Now imagine|My situation is|Set the scene|On a day involving|With .* unfolding|Imagine this happening|Put me through|Make it|For a moment, consider|The moment involves)/)
    }
  })

  it('keeps a deep playable library available to every group type', () => {
    const categoryIds = KNOW_ME_CATEGORIES.map(category => category.id)
    for (const relationship of ['couple','friends','family','new-connections','mixed-group'] as const) {
      const available=promptsFor(relationship, categoryIds)
      expect(available.length, relationship).toBeGreaterThanOrEqual(2300)
      for(const category of categoryIds)expect(available.filter(prompt=>prompt.category===category).length,`${relationship}/${category}`).toBeGreaterThanOrEqual(250)
    }
  })

  it('keeps independently edited prompts free of repeated questions and answer sets', () => {
    const questions=editorialPrompts.map(prompt=>prompt.question.toLocaleLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim())
    const answerSets=editorialPrompts.map(prompt=>prompt.options.map(option=>option.toLocaleLowerCase().trim()).sort().join('|'))
    expect(new Set(questions).size).toBe(questions.length)
    expect(new Set(answerSets).size).toBe(answerSets.length)
  })

  it('rejects conceptual near-duplicates across questions and complete answer sets',()=>{
    const questionTokens=editorialPrompts.map(prompt=>semanticTokens(prompt.question))
    const optionTokens=editorialPrompts.map(prompt=>semanticTokens(prompt.options.join(' ')))
    const questionConflicts:string[]=[]
    const optionConflicts:string[]=[]
    for(let left=0;left<editorialPrompts.length;left+=1){
      for(let right=left+1;right<editorialPrompts.length;right+=1){
        if(semanticOverlap(questionTokens[left],questionTokens[right])>=0.72)questionConflicts.push(`${editorialPrompts[left].id}/${editorialPrompts[right].id}`)
        if(semanticOverlap(optionTokens[left],optionTokens[right])>=0.78)optionConflicts.push(`${editorialPrompts[left].id}/${editorialPrompts[right].id}`)
      }
    }
    expect(questionConflicts).toEqual([])
    expect(optionConflicts).toEqual([])
  })
})
