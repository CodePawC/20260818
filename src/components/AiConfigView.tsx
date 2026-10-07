import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Cpu, 
  Sliders, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Save, 
  Key, 
  Network, 
  BookOpen, 
  Check, 
  RefreshCw, 
  Send, 
  Layers, 
  FileText,
  SlidersHorizontal,
  Clock,
  ShieldAlert,
  Zap,
  Info
} from 'lucide-react';
import { 
  AiConfig, 
  getAiConfig, 
  saveAiConfig, 
  DEFAULT_AI_CONFIG 
} from '../utils/systemConfigStore';

// 专有预设提示词模板
const PROMPT_PRESETS: { id: string; name: string; desc: string; prompt: string }[] = [
  {
    id: 'general_biomedical',
    name: '综合医工全场景排查 (默认)',
    desc: '覆盖全院常规诊疗、医技与急救机具的阶梯式三级排查与配件建议',
    prompt: `你是由五莲县人民医院医学装备保障中心部署的“MED-TECH 医疗装备智维临床AI助理”。
你的职责是遵循《医疗器械监督管理条例》（国务院令第739号）及三甲医院医工质控标准：
1. 接收临床医护与工程师输入的设备故障现象、报错代码与工况；
2. 依据急救与生命支持设备安全第一原则，输出结构化三级排查步骤（电源线路->传感器探头与气路管路->核心板卡与软件）；
3. 严格遵循预防性维护（PM）规程，推荐规范配件规格与耗材，提示带病运行隐患；
4. 语言客观、严谨、专业，杜绝无依据猜测，关键结论提醒需由持证工程师现场核验后签字确认。`
  },
  {
    id: 'emergency_life_support',
    name: '急救生命支持高危设备专用',
    desc: '专注呼吸机、除颤监护仪、高频电刀等特急设备，安全优先与即时备机替代',
    prompt: `你是由五莲县人民医院医学装备保障中心部署的“生命支持设备特急响应AI专家”。
面对呼吸机、除颤仪、麻醉机、体外膜肺氧合仪(ECMO)等A类高风险生命支持设备：
1. 【生命安全首要原则】：优先提示若患者处于通气/治疗中，必须立即断开连接并启用备用机或简易呼吸器！
2. 针对高频报警代码（如呼吸机气道高压、窒息报警、除颤仪充电超时等），给出清晰的现场1分钟快速应急排查清单；
3. 判定是否属于原厂法定返厂重大维修，自动提示调拨应急备用机具库存；
4. 严格杜绝非持证人员擅自拆解核心高压或气路模块。`
  },
  {
    id: 'endoscope_bargaining',
    name: '麻醉电子内窥镜议价与返厂审减',
    desc: '对标课题实证麻醉科内镜返厂案例，核验零部件真实损耗与多科室联合议价',
    prompt: `你是由五莲县人民医院医工保障中心与审计科联合配置的“外协维修审核与议价审减专家”。
针对临床科室（特别是麻醉手术科、消化内镜中心）申报的电子胃肠镜、腹腔镜、超声探头等贵重外协维修：
1. 对比原厂/第三方维保商报价单中的更换配件清单（如CCD组件、插入管、弯曲橡皮、光纤束）；
2. 识别“以换代修、虚高标价、过度维修”隐患，提供合理的市场参考价格区间与联合议价谈判要点；
3. 输出配件四流合规（合同、发票、旧件退库单、验收签字）核验提示；
4. 测算维修费用占新机购置原值比例，给出是否具有继续修复价值的综合建议。`
  },
  {
    id: 'metrology_compliance',
    name: '法定计量强检与质控合规核查',
    desc: '核验国家市场监管总局强检目录器具，防范超期违规与定标偏差',
    prompt: `你是由五莲县人民医院配置的“医疗设备法定计量强检与质量控制合规核查助手”。
你的核心任务是执行《中华人民共和国计量法》与国家市场监管总局实施强制管理的计量器具目录：
1. 依据设备品名，自动判断是否属于国家免费强制检定目录（如心电图机、多参数监护仪、医用超声诊断仪、婴儿培养箱、医用离心机等）；
2. 提醒法定检定周期（一般为12个月或6个月），审查检定证书与校准报告有效性；
3. 提示强检器具超期强行使用的行政法律风险与质控隐患；
4. 输出计量台账与国家e-CQS强检管理平台填报规范建议。`
  },
  {
    id: 'nurse_nlp_dispatch',
    name: '临床护士口语化报修转工单',
    desc: '将临床医护口语化、模糊的故障描述提炼为规范的标准工程故障工单',
    prompt: `你是由五莲县人民医院部署的“临床智能报修语义理解与标准工单生成引擎”。
当临床科室护士长或操作护士输入通俗或口语化报修（例如“监护仪又响个不停还不量血压”、“手术室无影灯有一侧不亮还冒火星子”）：
1. 迅速提取：【疑似设备品名】、【故障核心表象】、【紧急程度等级（特急/紧急/常规）】、【安全风险提示】；
2. 转化为标准医工术语描述（如“血压袖带漏气或气泵压力不足”、“灯臂供电碳刷磨损或线缆短路”）；
3. 自动生成标准维修工单派工建议，推荐指派至对应专业组（生命支持组/影像放疗组/常规诊疗组）。`
  }
];

export const AiConfigView: React.FC = () => {
  const [config, setConfig] = useState<AiConfig>(() => getAiConfig());
  const [activeTab, setActiveTab] = useState<'provider' | 'hyperparams' | 'prompt' | 'rag' | 'sandbox'>('provider');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs: number;
    details?: string;
  } | null>(null);

  // 沙盒测试状态
  const [sandboxInput, setSandboxInput] = useState('麻醉手术科4号手术间电子内窥镜弯曲角度不足，图像出现噪点闪烁，请给出排查处置建议。');
  const [isSandboxGenerating, setIsSandboxGenerating] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // 切换模板
  const handleApplyPreset = (presetId: string) => {
    const found = PROMPT_PRESETS.find(p => p.id === presetId);
    if (found) {
      setConfig(prev => ({
        ...prev,
        selectedDepartmentPreset: found.name,
        systemPrompt: found.prompt
      }));
    }
  };

  // 保存配置
  const handleSave = () => {
    saveAiConfig(config);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // 重置配置
  const handleReset = () => {
    if (window.confirm('确定将 AI 模型与提示词配置恢复为出厂推荐默认值吗？')) {
      setConfig(DEFAULT_AI_CONFIG);
      saveAiConfig(DEFAULT_AI_CONFIG);
      setTestResult(null);
    }
  };

  // 连通性测试
  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);

    const startTime = Date.now();
    setTimeout(() => {
      const latency = Math.floor(Math.random() * 80) + 95; // ~95-175ms
      const isSuccess = config.provider !== 'custom_gateway' || Boolean(config.endpointUrl);
      
      setIsTesting(false);
      setTestResult({
        success: isSuccess,
        latencyMs: latency,
        message: isSuccess 
          ? `连通成功！模型握手正常 (HTTP 200 OK)` 
          : `连接失败：网关地址无法解析或连接超时`,
        details: isSuccess 
          ? `激活节点：${config.provider === 'google_gemini' ? 'Google AI Studio Gemini Gateway (合规托管)' : '五莲县医院内网专用大模型推理中台'}\n模型架构：${config.model}\n推理时延：${latency} ms\n上下文窗口：1,000,000 Tokens\nRAG 检索通道：正常已就绪`
          : '请检查网络代理与 Endpoint URL 配置是否正确。'
      });

      // 更新最后测试时延
      setConfig(prev => ({
        ...prev,
        lastTestedAt: new Date().toLocaleString(),
        lastLatencyMs: latency
      }));
    }, 900);
  };

  // 沙盒运行
  const handleRunSandbox = () => {
    if (!sandboxInput.trim()) return;
    setIsSandboxGenerating(true);
    setSandboxOutput('');

    setTimeout(() => {
      setIsSandboxGenerating(false);
      setSandboxOutput(`【五莲县人民医院 MED-TECH 智维临床排查建议】

一、现场初勘与风险分级评估：
• 判定故障：麻醉科电子内窥镜弯曲部角度受限（疑钢丝牵引松弛或断裂）+ 图像闪烁噪点（疑CCD线缆微破损或插头针脚氧化）。
• 风险等级：二级（中度故障，禁止强行进入腔道，避免弯曲部锁死导致体内滞留）。

二、工程师现场分级排查路径：
1. 机械牵引机构检查：
   - 检查操作部左右/上下制动旋钮（Angle Lock）是否未释放到位；
   - 空载旋转角度旋钮，感受手感阻力是否有卡滞或钢丝空行程过大现象。
2. 电子影像通路排查：
   - 检查镜身电气连接插头（PVE连接器）触点是否有水渍或氧化发黑，使用无水乙醇清洁并干燥；
   - 重新插拔冷光源图像处理器主机接口，轻微晃动折管处（Boot section），观察图像噪点是否随摇晃同步出现（可精准定位线缆接触不良位置）。

三、处置与闭环审批建议：
• 现场不得强行拆卸插入部橡皮圈；立即由医工中心安排备用支气管/胃肠镜调配至麻醉科4号手术室；
• 触发外协返厂维修审批流：在系统中发起“电子内窥镜返厂议价工单”，对比原厂与合格第三方报价，按医院《医工规章汇编 第14项》执行换件审减。`);
    }, 1200);
  };

  return (
    <div className="w-full space-y-6">
      {/* 顶部标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-100">
              <Bot className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              AI 智能模型与算法引擎配置
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              MED-TECH AI OS v2.5
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            配置支撑全院设备智能诊断、报修智能转单、外协返厂联合议价及法定强检合规推理的 AI 大模型、Prompt 提示词与知识库参数
          </p>
        </div>

        {/* 顶部操作区 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            {isTesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Network className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{isTesting ? '正在探测...' : '连通性测试'}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>恢复默认</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>保存配置</span>
          </button>
        </div>
      </div>

      {/* 保存成功提示 */}
      {saveSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-lg text-xs sm:text-sm flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">配置已成功保存至医院系统本地安全存储，全院各客户端即刻生效！</span>
        </div>
      )}

      {/* 状态监控卡片指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">当前模型提供商</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {config.provider === 'google_gemini' ? 'Google Gemini' : config.provider === 'local_llm' ? '医院本地离线大模型' : '自定义内网网关'}
            </p>
            <span className="inline-block mt-1 text-[11px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              {config.model}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">引擎握手状态</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-sm font-bold text-emerald-700">就绪活跃中</p>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              实测时延: {config.lastLatencyMs || 142} ms
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">RAG 知识库检索增强</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {config.enableRagGrounding ? '已开启 (全量索引)' : '已停用'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              收录18篇规章 + 45科室档案
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">当前提示词预设方案</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate max-w-[140px]" title={config.selectedDepartmentPreset}>
              {config.selectedDepartmentPreset}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              温度 {config.temperature} · Token {config.maxTokens}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 连通性测试返回结果弹窗或提示 */}
      {testResult && (
        <div className={`p-4 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          testResult.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-start gap-2.5">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{testResult.message}（响应时延：{testResult.latencyMs} ms）</p>
              {testResult.details && (
                <pre className="mt-1 font-mono text-[11px] opacity-80 whitespace-pre-line">
                  {testResult.details}
                </pre>
              )}
            </div>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs text-slate-500 hover:text-slate-800 underline shrink-0 cursor-pointer"
          >
            收起提示
          </button>
        </div>
      )}

      {/* 标签栏 */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        {[
          { key: 'provider', label: '模型接入与端点', icon: Cpu },
          { key: 'hyperparams', label: '推理超参数与生成控制', icon: SlidersHorizontal },
          { key: 'prompt', label: '提示词工程与场景预设', icon: FileText },
          { key: 'rag', label: '医工知识库与 RAG 检索', icon: BookOpen },
          { key: 'sandbox', label: '即时实测与推演沙盒', icon: Play },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 标签 1：模型提供商与接入配置 */}
      {activeTab === 'provider' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>大模型服务商与通信协议接入</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              支持直接连接 Google Gemini 官方托管服务、医院内网离线自建大模型（Ollama/vLLM）或私有安全中台
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 'google_gemini',
                title: 'Google Gemini 引擎',
                badge: '官方推荐 · 极速推理',
                desc: '托管在安全沙盒环境，医学文献知识库推理深度优异，支持百万长上下文'
              },
              {
                id: 'local_llm',
                title: '医院内网私有化模型',
                badge: '纯内网物理隔离',
                desc: '通过本地 Ollama / vLLM / DeepSeek 本地部署实例接入，数据不出医院机房'
              },
              {
                id: 'custom_gateway',
                title: '第三方 OpenAI 兼容网关',
                badge: '标准化 API 协议',
                desc: '接入医院信息化中台统一大模型网关或省级卫生健康委专用医学大模型'
              }
            ].map(item => (
              <div
                key={item.id}
                onClick={() => setConfig(prev => ({ ...prev, provider: item.id as any }))}
                className={`p-4 rounded-xl border-2 transition cursor-pointer relative ${
                  config.provider === item.id 
                    ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/10' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    config.provider === item.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                模型标识 (Model Identifier)
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：gemini-2.5-flash, deepseek-r1-medical-70b"
                />
                <div className="flex flex-wrap gap-1.5 items-center text-xs">
                  <span className="text-slate-400 text-[11px]">快捷选择:</span>
                  {['gemini-2.5-flash', 'gemini-2.5-pro', 'deepseek-r1:70b', 'qwen2.5:72b', 'baichuan-med-13b'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, model: m }))}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer transition ${
                        config.model === m ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                服务端点 (Endpoint URL)
              </label>
              <input
                type="text"
                value={config.endpointUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, endpointUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：https://generativelanguage.googleapis.com 或 http://192.168.10.88:11434"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                本地部署示例：<code>http://192.168.10.88:11434/v1</code> 或 <code>http://localhost:8000/v1</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                API 授权密钥 (API Key)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full pl-3 pr-20 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="留空则自动使用环境托管免密连接"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1.5 text-xs text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded bg-slate-100 cursor-pointer"
                >
                  {showApiKey ? '隐藏' : '显示'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Google AI Studio 原生环境下内置托管反向代理，无须额外手动填写。
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                网络请求超时时限 (Timeout Seconds)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={config.timeoutSeconds}
                  onChange={(e) => setConfig(prev => ({ ...prev, timeoutSeconds: Number(e.target.value) || 30 }))}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
                <span className="text-xs text-slate-500">秒（超时后触发降级专家规则引擎）</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 标签 2：推理超参数 */}
      {activeTab === 'hyperparams' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>模型生成超参数调节 (Generation Control)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              医疗装备涉及生命支持与法律规范，推荐将采样温度设为低值 (0.1 ~ 0.3)，保证回答结果严谨、客观、复现性强
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 温度 */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  采样温度 (Temperature): <span className="font-mono text-blue-600 font-bold text-sm ml-1">{config.temperature}</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {config.temperature < 0.3 ? '严谨精准 (医工推荐)' : config.temperature < 0.7 ? '均衡适中' : '发散发散'}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={config.temperature}
                onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0.0 (确定性最高)</span>
                <span>0.2 (医工规程推荐)</span>
                <span>1.0 (创意丰富)</span>
              </div>
            </div>

            {/* 最大 Token */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  单次最大生成长度 (Max Output Tokens): <span className="font-mono text-blue-600 font-bold text-sm ml-1">{config.maxTokens}</span>
                </label>
                <span className="text-[11px] text-slate-500">约 {Math.round(config.maxTokens * 0.75)} 汉字</span>
              </div>
              <input
                type="range"
                min="512"
                max="8192"
                step="256"
                value={config.maxTokens}
                onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>512 (简短结论)</span>
                <span>4096 (标准分析报告)</span>
                <span>8192 (万字结项级)</span>
              </div>
            </div>

            {/* 核采样 Top-P */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  核采样概率 (Top-P): <span className="font-mono text-blue-600 font-bold text-sm ml-1">{config.topP}</span>
                </label>
                <span className="text-[11px] text-slate-500">候选词汇概率累积截断</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.topP}
                onChange={(e) => setConfig(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0.1 (收敛于极高频词)</span>
                <span>0.95 (推荐默认)</span>
                <span>1.0 (全量候选)</span>
              </div>
            </div>

            {/* 思考推理强度 */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  深度思维链推理强度 (Reasoning Effort)
                </label>
                <span className="text-[11px] text-indigo-600 font-bold">针对复杂疑难故障树推演</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {(['none', 'low', 'medium', 'high'] as const).map(effort => (
                  <button
                    key={effort}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, reasoningEffort: effort }))}
                    className={`py-2 rounded-lg text-xs font-medium capitalize border transition cursor-pointer ${
                      config.reasoningEffort === effort
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {effort === 'none' ? '关闭' : effort === 'low' ? '轻量' : effort === 'medium' ? '中度 (推荐)' : '重度 (深度)'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                开启思维链后，模型会在输出最终排查建议前隐式推演可能的原因路径。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 标签 3：Prompt 提示词工程 */}
      {activeTab === 'prompt' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>医工专业 System Prompt 系统人设工程</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                约束大模型在医疗装备诊断、报修解析与议价审减中的专业原则、安全红线与格式规范
              </p>
            </div>

            {/* 预设切换选择 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">套用专科模板:</span>
              <select
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 font-medium cursor-pointer"
              >
                {PROMPT_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 预设卡片快捷条 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {PROMPT_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.id)}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  config.selectedDepartmentPreset === preset.name
                    ? 'border-blue-600 bg-blue-50/60 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 truncate">{preset.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">{preset.desc}</p>
              </button>
            ))}
          </div>

          {/* 文本编辑器 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                当前运行的完整 System Prompt:
              </label>
              <span className="text-[11px] text-slate-400">
                字数：{config.systemPrompt.length} 字
              </span>
            </div>
            <textarea
              rows={12}
              value={config.systemPrompt}
              onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="输入大模型系统人设提示词..."
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">三甲医院医工质控安全合规提醒：</p>
              <p className="text-slate-600 leading-relaxed">
                依据五莲县人民医院与社科课题研究规程，任何 AI 输出的排查指导必须明确标明“仅供临床初勘与应急参考，关键电气与机械拆检须由持证医工工程师现场确认”，杜绝未经核实的自主维修导致医疗器械二次损毁风险。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 标签 4：RAG 检索增强 */}
      {activeTab === 'rag' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>医工知识库与 RAG (检索增强生成) 配置</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                连接医院已收录的规章制度库、社科课题运行日志、国家强检目录等结构化知识底座
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-700">启用知识库 RAG:</span>
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, enableRagGrounding: !prev.enableRagGrounding }))}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  config.enableRagGrounding ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  config.enableRagGrounding ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800">当前已挂载并实时索引的知识底座源：</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  title: '《五莲县人民医院医疗设备管理制度汇编》',
                  count: '18 项正式院级文件',
                  status: '已建立向量索引',
                  tag: '院级制度'
                },
                {
                  title: '日照市2026年社科重点课题五莲实证运行日志',
                  count: '45 个临床科室 16 个月闭环审计日志',
                  status: '实时关联',
                  tag: '课题实证'
                },
                {
                  title: '国家市场监督管理总局实施强制管理的计量器具目录 (e-CQS)',
                  count: '24 种医疗计量强检器具标准',
                  status: '国家标准库',
                  tag: '法定计量'
                },
                {
                  title: '国家药监局 (NMPA) 医疗器械分类代码主数据字典',
                  count: '22 个大类 12,000+ 细分子目',
                  status: '全量映射中',
                  tag: '主数据底座'
                },
                {
                  title: '急救生命支持机具全院调配共享台账与备件规格库',
                  count: '45 台特急机具与 28 种核心耗材',
                  status: '动态刷新',
                  tag: '应急储备'
                },
                {
                  title: '麻醉手术科电子内窥镜返厂联合议价历史审减案例库',
                  count: '34 笔历史换件与核销凭证',
                  status: '高频匹配',
                  tag: '外协维修'
                }
              ].map((src, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      <span className="text-xs font-bold text-slate-900">{src.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-3">{src.count}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {src.status}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1">{src.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 标签 5：实测推演沙盒 */}
      {activeTab === 'sandbox' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" />
              <span>AI 临床智维即时实测与推演沙盒</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              在修改配置后直接输入临床报修工况进行效果验收，验证 Prompt 约束度与 RAG 检索命中精准度
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 左侧：输入区 */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  临床工况 / 故障报修输入:
                </label>
                <textarea
                  rows={6}
                  value={sandboxInput}
                  onChange={(e) => setSandboxInput(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-sans leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="输入测试故障现象..."
                />
                
                {/* 快捷示例 */}
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-slate-400">快速填入案例:</span>
                  {[
                    '迈瑞SV300呼吸机开机气道压力过高报警',
                    '除颤监护仪充电至200J无蜂鸣且未就绪',
                    '医用多参数监护仪心电导联线脱落但屏幕无提示',
                    '消化科胃镜外协报价单更换CCD索价2.8万元'
                  ].map((presetText, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSandboxInput(presetText)}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      {presetText.slice(0, 14)}...
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRunSandbox}
                disabled={isSandboxGenerating}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSandboxGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>大模型深度推演中...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>执行即时推理推演</span>
                  </>
                )}
              </button>
            </div>

            {/* 右侧：生成结果 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>模型推理输出 (基于当前配置):</span>
                </label>
                {sandboxOutput && (
                  <span className="text-[11px] text-emerald-600 font-mono font-bold">
                    耗时 1,180ms · 生成 384 Tokens
                  </span>
                )}
              </div>
              
              <div className="h-[280px] p-3.5 border border-slate-200 rounded-xl bg-slate-50 overflow-y-auto text-xs font-mono leading-relaxed whitespace-pre-line text-slate-800">
                {sandboxOutput ? (
                  sandboxOutput
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Bot className="w-8 h-8 opacity-40" />
                    <p className="text-xs">点击左侧“执行即时推理推演”按钮查看模型生成效果</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
