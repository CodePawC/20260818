import { ResearchTeamMember, RESEARCH_TEAM } from '../data/projectConcludingData';

const CURRENT_STORAGE_KEY = 'concluding_research_team_exact_v5';

// 检查人员名单是否为官方真实附件名单（严格包含崔伟及8名成员，一个字不差）
function isValidAuthenticTeam(team: any): team is ResearchTeamMember[] {
  if (!Array.isArray(team) || team.length < 9) return false;
  const names = team.map(m => m?.name);
  const requiredNames = ['崔伟', '吴耀宝', '严金光', '王治权', '王方鑫', '葛晓燕', '王增祝', '杨志峰', '胡云飞'];
  return requiredNames.every(name => names.includes(name));
}

export function getStoredResearchTeam(): ResearchTeamMember[] {
  try {
    // 强制清理历史脏缓存
    const legacyKeys = [
      'concluding_research_team_custom_v1',
      'concluding_research_team_v2',
      'concluding_research_team_v3',
      'concluding_research_team_authentic_v4'
    ];
    legacyKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });

    const raw = localStorage.getItem(CURRENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidAuthenticTeam(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load stored research team', e);
  }
  // 默认且必须为官方申报附件真实课题组（含负责人共9人）
  return RESEARCH_TEAM;
}

export function saveStoredResearchTeam(team: ResearchTeamMember[]): void {
  try {
    localStorage.setItem(CURRENT_STORAGE_KEY, JSON.stringify(team));
  } catch (e) {
    console.error('Failed to save research team', e);
  }
}

export function resetToOfficialResearchTeam(): ResearchTeamMember[] {
  try {
    localStorage.removeItem(CURRENT_STORAGE_KEY);
  } catch {}
  return RESEARCH_TEAM;
}

export function parsePastedTeamText(text: string): ResearchTeamMember[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const result: ResearchTeamMember[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/[\t,，\s]+/).filter(Boolean);
    if (parts.length === 0) continue;

    const name = parts[0] || `成员${i + 1}`;
    const gender = parts.find(p => p === '男' || p === '女') || (i === 0 ? '男' : '男');
    const agePart = parts.find(p => /^\d{2}$/.test(p));
    const age = agePart ? parseInt(agePart, 10) : 40;
    
    const workplace = parts.find(p => p.includes('院') || p.includes('科') || p.includes('医')) || '五莲县人民医院';
    const position = parts.find(p => p.includes('师') || p.includes('长') || p.includes('员') || p.includes('任')) || (i === 0 ? '工程师' : '主管人员');
    const expertise = parts.length > 4 ? parts.slice(3, 5).join('、') : (i === 0 ? '医学装备管理' : '临床与装备管理');
    const roleInProject = i === 0 ? '课题组负责人，负责研究总体方案设计、技术架构设计、系统功能研制及报告统稿' : `课题组成员，负责相关业务协同与系统实证`;

    result.push({
      name,
      gender,
      age,
      workplace,
      position,
      expertise,
      roleInProject
    });
  }

  // Ensure first person is leader Cui Wei if present
  if (result.length > 0 && result[0].name === '崔伟') {
    result[0] = { ...RESEARCH_TEAM[0], ...result[0] };
  } else if (result.length === 0) {
    return RESEARCH_TEAM;
  }

  return result;
}

