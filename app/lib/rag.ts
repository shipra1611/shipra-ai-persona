import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

export function loadResumeContext(): string {
  try {
    return fs.readFileSync(path.join(DATA_DIR, 'resume.md'), 'utf-8')
  } catch {
    return ''
  }
}

export function loadGitHubContext(): string {
  try {
    return fs.readFileSync(path.join(DATA_DIR, 'github_repos.md'), 'utf-8')
  } catch {
    return ''
  }
}

export function loadSystemPrompt(): string {
  try {
    return fs.readFileSync(path.join(DATA_DIR, 'system_prompt.md'), 'utf-8')
  } catch {
    return 'You are Shipra\'s AI representative.'
  }
}

export function buildRAGContext(query: string): string {
  const resume = loadResumeContext()
  const github = loadGitHubContext()

  // Simple keyword-based relevance boost
  const queryLower = query.toLowerCase()
  const isGitHubQuery = ['github', 'repo', 'code', 'project', 'xai', 'brain age', 'haa', 'ccps', 
    'densenet', 'gradcam', 'shap', 'stress test', 'mri', 'chest', 'stack', 'tradeoff'].some(k => queryLower.includes(k))
  const isResumeQuery = ['education', 'background', 'experience', 'skill', 'bits', 'iit', 
    'internship', 'brainsight', 'degree', 'why', 'fit', 'hire'].some(k => queryLower.includes(k))

  // Always include both but order by relevance
  if (isGitHubQuery) {
    return `## GITHUB REPOSITORIES\n${github}\n\n## RESUME\n${resume}`
  }
  return `## RESUME\n${resume}\n\n## GITHUB REPOSITORIES\n${github}`
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}
