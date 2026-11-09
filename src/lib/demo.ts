import type { Idea, Plan } from '../types'
import { addDays, nowISOString } from './dates'

export function createDemoIdeas(today: string): Idea[] {
  const timestamp = nowISOString()
  const makeIdea = (
    id: string,
    title: string,
    note: string,
    dayOffset: number,
  ): Idea => ({
    id,
    title,
    note,
    date: addDays(today, dayOffset),
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  return [
    makeIdea(
      'demo-idea-seaside',
      '去海边跑一次长距离',
      '不设配速，跑到想停的地方。',
      -12,
    ),
    makeIdea(
      'demo-idea-lamp',
      '给房间换一盏暖一点的灯',
      '晚上写字的时候，光不要太白。',
      -30,
    ),
    makeIdea(
      'demo-idea-letter',
      '写一封不寄出的信',
      '有些话写下来，就不必送出去。',
      -3,
    ),
  ]
}

export function createDemoPlans(today: string): Plan[] {
  const timestamp = nowISOString()
  const makePlan = (
    id: string,
    title: string,
    startOffset: number,
    endOffset: number,
    note: string,
    subgoalTitles: string[],
    options?: {
      done?: boolean
      completedOffset?: number
      checkInEnabled?: boolean
      checkInOffsets?: number[]
    },
  ): Plan => {
    const startDate = addDays(today, startOffset)
    const endDate = addDays(today, endOffset)
    const checkInDates = options?.checkInEnabled
      ? [...new Set(
          (options.checkInOffsets ?? [])
            .map((offset) => addDays(today, offset))
            .filter((date) => date >= startDate && date <= endDate && date <= today),
        )].sort()
      : []
    return {
      id,
      title,
      startDate,
      endDate,
      status: options?.done ? 'done' : 'active',
      note,
      subgoals: subgoalTitles.map((subgoalTitle, index) => ({
        id: `${id}-subgoal-${index + 1}`,
        title: subgoalTitle,
        done: Boolean(options?.done),
        completedAt: options?.done
          ? addDays(today, options.completedOffset ?? 0)
          : null,
      })),
      checkInEnabled: Boolean(options?.checkInEnabled),
      checkInDates,
      parentId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt:
        options?.done && options.completedOffset !== undefined
          ? addDays(today, options.completedOffset)
          : null,
      archivedAt: null,
    }
  }

  return [
    makePlan(
      'demo-marathon',
      '完成一次半程马拉松',
      -200,
      520,
      '不追配速，先把训练变成生活的一部分。',
      ['累计跑完 100 公里', '完成一次 15 公里长距离', '赛前一周减量'],
    ),
    makePlan(
      'demo-reading',
      '建立稳定的阅读节奏',
      -100,
      430,
      '每周至少三个晚上，读二十页。',
      ['读完三本书', '写三页读书笔记'],
      { checkInEnabled: true, checkInOffsets: [-6, -5, -4, -3, -1] },
    ),
    makePlan(
      'demo-thesis',
      '写完毕业论文初稿',
      -45,
      70,
      '先完成，再完美。把参考文献和框架收口。',
      ['整理参考文献', '搭好章节框架', '交给导师看一遍'],
      { checkInEnabled: true, checkInOffsets: [-4, -3, -2, -1, 0] },
    ),
    makePlan(
      'demo-english',
      '英语口语能连续聊十分钟',
      -20,
      150,
      '每周两次对话练习，不追求像母语者。',
      ['完成 10 次对话练习', '录一段三分钟自述'],
    ),
    makePlan(
      'demo-proposal',
      '开题报告定稿',
      -3,
      10,
      '把研究问题压缩成一句话。',
      ['确定研究问题', '写出一页提纲'],
    ),
    makePlan(
      'demo-book',
      '读完《设计中的设计》',
      -12,
      4,
      '在扉页写一句最喜欢的话。',
      ['读完前两章', '写下三条笔记'],
    ),
    makePlan(
      'demo-closet',
      '整理秋冬衣橱',
      -20,
      -2,
      '留下真正会穿的。',
      ['全部取出分类', '捐出不再穿的'],
      { done: true, completedOffset: -3 },
    ),
  ]
}
