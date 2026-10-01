import json
import re
import os

def generate_staff():
    # 1. Read ledger equipment
    with open('data/equipment_store.json', 'r', encoding='utf-8') as f:
        eq_list = json.load(f)

    ledger_depts = set()
    for eq in eq_list:
        d = eq.get('department')
        if d: ledger_depts.add(d.strip())
        od = eq.get('ownerDepartment')
        if od: ledger_depts.add(od.strip())

    print(f"Total ledger departments: {len(ledger_depts)}")

    # 2. Read masterData.ts departments
    with open('src/utils/masterData.ts', 'r', encoding='utf-8') as f:
        master_code = f.read()

    dept_start = master_code.find('export const DEFAULT_DEPARTMENTS: DepartmentMaster[] = [')
    dept_end = master_code.find('export const DEFAULT_STAFF: StaffPersonMaster[] = [')
    dept_code = master_code[dept_start:dept_end]

    dept_pattern = re.compile(
        r'\{\s*id:\s*[\'\"](?P<id>\w+)[\'\"].*?'
        r'name:\s*[\'\"](?P<name>[^\'\"]+)[\'\"].*?'
        r'disciplineCategory:\s*[\'\"](?P<discipline>[^\'\"]+)[\'\"].*?'
        r'buildingName:\s*[\'\"](?P<building>[^\'\"]+)[\'\"].*?'
        r'defaultFloor:\s*[\'\"](?P<floor>[^\'\"]+)[\'\"].*?'
        r'nursePhone:\s*[\'\"](?P<nursePhone>[^\'\"]+)[\'\"].*?'
        r'\}',
        re.DOTALL
    )

    depts_list = [m.groupdict() for m in dept_pattern.finditer(dept_code)]
    dept_map = {d['name']: d for d in depts_list}

    # High-quality Chinese family names and given names pool
    surnames = ["张", "王", "李", "赵", "陈", "刘", "杨", "黄", "孙", "周", "吴", "徐", "朱", "林", "何", "郭", "马", "高", "罗", "郑", "梁", "谢", "宋", "唐", "许", "韩", "冯", "邓", "曹", "彭", "曾", "肖", "田", "董", "潘", "袁", "蔡", "蒋", "余", "于", "杜", "叶", "程", "苏", "魏", "吕", "丁", "任", "沈", "姚", "卢", "姜", "崔", "钟", "谭", "陆", "汪", "范", "金", "石", "廖", "贾", "夏", "韦", "傅", "方", "白", "邹", "孟", "熊", "秦", "邱", "江", "尹", "薛", "闫", "段", "雷", "侯", "龙", "史", "陶", "黎", "贺", "顾", "毛", "郝", "龚", "邵", "万", "钱", "严", "覃", "武", "戴", "莫", "孔", "向", "汤"]
    
    doctor_names = ["海涛", "建国", "志勇", "文强", "卫国", "俊峰", "培军", "明亮", "晓东", "立新", "德华", "振华", "宏伟", "继光", "绍民", "祥云", "广宇", "敬修", "长林", "志坚", "茂盛", "成勋", "宗海", "廷芳", "良友", "树人", "子昂", "世杰", "怀安", "益民", "伯骞", "润之", "定邦", "家骥", "鼎铭", "崇德", "鸿儒", "善武", "天成", "博达", "朝晖", "浩然", "景胜", "冠华", "正业", "承泽", "永昌", "同济", "自强", "修明"]
    
    nurse_names = ["秀兰", "敏敏", "海燕", "春梅", "丽华", "秀梅", "文华", "雪梅", "亚平", "玉兰", "桂琴", "小玲", "彩霞", "美琴", "冬梅", "红艳", "淑清", "巧云", "燕华", "素珍", "慧敏", "碧霞", "佩玲", "雅琴", "秋菊", "月华", "春芳", "瑞芳", "金玲", "若兰", "清芬", "思涵", "静雯", "婉婷", "语嫣", "心怡", "欣妍", "芷晴", "梦洁", "雅婷", "韵茹", "诗漫", "琳达", "曼柔", "晓微", "怡萱", "佳琪", "晓彤", "佩瑜", "思颖"]

    # Discipline specific specialties
    specialty_map = {
        '重症医学科': ["有创/无创呼吸机", "除颤监护仪", "CRRT连续血液净化系统", "微量注射泵/输液泵", "体外膜肺氧合(ECMO)"],
        '麻醉手术科': ["全能麻醉工作站", "4K超高清腹腔镜", "超声高频外科手术系统", "高频电刀", "自体血回收机", "加温毯"],
        '急诊科': ["心肺复苏机", "除颤监护仪", "转运呼吸机", "床旁急诊超声", "心电图机", "洗胃机"],
        '急救站': ["车载急救转运呼吸机", "除颤监护仪", "便携式心电监护", "铲式担架", "车载吸引器"],
        '心血管内一科': ["多导心电图机", "心电遥测监护系统", "动态心电记录仪(Holter)", "临时心脏起搏器", "主动脉内球囊反搏(IABP)"],
        '心血管内二科': ["心电遥测监护系统", "动态血压监测仪", "多参数心电监护仪", "除颤仪", "微量推注泵"],
        '呼吸与危重症医学科': ["无创双水平呼吸机", "电子支气管镜", "肺功能仪", "高流量湿化氧疗仪", "多导睡眠呼吸监测仪"],
        '神经内一科': ["经颅多普勒超声(TCD)", "视频脑电图仪", "床旁脑功能监护仪", "吞咽神经肌肉电刺激仪", "肢体气压治疗仪"],
        '神经内二科': ["脑电地形图仪", "经颅磁刺激仪", "多参数监护仪", "防褥疮充气床垫", "气压排微循环泵"],
        '神经外科': ["手术显微镜", "开颅动力系统", "脑电/肌电术中监测仪", "超声骨刀", "颅内压监测仪"],
        '骨一科': ["移动式C形臂X射线机", "骨科牵引床", "关节CPM被动训练器", "骨动力钻锯系统", "脉冲冲洗器"],
        '骨二科': ["关节镜手术系统", "超声骨动力系统", "术中神经电生理监护", "多功能牵引床", "冷热敷脉动治疗仪"],
        '普外一科': ["4K超高清腹腔镜系统", "超声刀主机及手柄", "高频电外科手术系统", "微波消融仪", "乳腺微创旋切系统"],
        '普外二科': ["高清腹腔镜手术系统", "电子胆道镜", "双极电凝止血系统", "术中荧光导航仪", "微量注射泵"],
        '泌尿胸普外科': ["输尿管硬镜/软镜", "钬激光碎石系统", "胸腔镜系统", "前列腺等离子电切镜", "体外冲击波碎石机"],
        '创伤外科': ["骨折复位固定牵引装置", "多参数急救监护仪", "骨科动力系统", "外固定架器械包", "创面负压引流装置(VSD)"],
        '妇科': ["高清宫腔镜系统", "电子阴道镜", "Leep刀高频电波发生器", "盆底肌生物反馈治疗仪", "妇科微波治疗仪"],
        '产科': ["胎儿/母体多参数监护仪", "超声多普勒胎心仪", "分娩镇痛仪", "产后康复综合治疗仪", "新生儿复苏台"],
        '产科门诊': ["超声多普勒胎心音仪", "胎儿电子监护网络工作站", "微量血糖分析仪", "孕妇营养分析系统"],
        '产房': ["多功能电动产床", "母胎监护仪", "新生儿复苏辐射保暖台", "医用吸引器", "分娩镇痛导乐仪"],
        '产房手术室': ["剖宫产手术床", "婴儿辐射保暖台", "麻醉机", "双极高频电刀", "新生儿负压吸引器"],
        '小儿科': ["儿童专用微量推注泵", "经皮黄疸测定仪", "小儿超声雾化器", "儿童心电监护仪", "排痰机"],
        '新生儿科': ["新生儿婴儿培养箱", "新生儿高频/常频呼吸机", "远红外辐射抢救台", "新生儿蓝光治疗仪", "经皮氧分压监测仪"],
        '血液透析室': ["血液透析机", "血液透析滤过机(HDF)", "反渗二级水处理系统", "自动透析内瘘穿刺巡检仪", "除颤监护仪"],
        '消化保健科': ["电子胃肠镜主机", "高频电外科止血仪", "内镜清洗消毒工作站", "碳13/碳14呼气试验测试仪", "胶囊内镜系统"],
        '内镜室': ["电子胃镜/肠镜/十二指肠镜", "内镜自动洗消机", "高频电切发生器", "二氧化碳送气装置", "内镜储存柜"],
        '内分泌风湿肾病科': ["动态血糖监测系统(CGMS)", "胰岛素泵", "糖尿病足神经传导筛查仪", "多普勒血管血流分析仪", "骨密度骨龄测量仪"],
        '五官科': ["耳鼻喉综合诊疗台", "鼻内窥镜显微摄像系统", "听力计/声阻抗仪", "裂隙灯显微镜", "眼科超声乳化仪"],
        '耳鼻喉科': ["耳鼻喉综合治疗台", "纤维喉镜系统", "纯音测听仪", "耳声发射仪(OAE)", "眩晕诊疗系统"],
        '口腔科': ["口腔综合治疗台", "口腔锥形束CT(CBCT)", "根管显微镜", "超声洁牙机", "光固化机", "口腔全景X射线机"],
        '眼科': ["眼科超声乳化仪", "全自动眼底照相机", "角膜地形图仪", "非接触式眼压计", "光学相干断层扫描仪(OCT)"],
        '影像科': ["64排128层螺旋CT", "1.5T/3.0T超导磁共振(MRI)", "数字双板DR系统", "乳腺数字化钼靶X射线机", "PACS影像工作站"],
        '介入放射科': ["大型血管造影机(DSA)", "高压注射器", "术中生命体征监护系统", "介入手术床", "铅防护屏与辐射巡检仪"],
        '放疗科': ["医用直线加速器", "大孔径CT模拟定位机", "放射治疗计划系统(TPS)", "三维水箱剂量质控仪", "碳纤维定位固定架"],
        '超声科': ["高档彩色多普勒超声诊断仪", "心脏实时三维彩超", "经阴道彩超探头", "肌骨高频超声探头", "床旁移动式彩超"],
        '功能检查科': ["十二导联同步心电工作站", "动态心电/动态血压分析系统", "经颅多普勒血流分析仪", "骨密度测量仪", "肺功能测定仪"],
        '检验科': ["全自动生化分析流水线", "五分类全自动血细胞分析仪", "全自动化学发光免疫分析仪", "全自动血凝分析仪", "全自动尿液流水线"],
        '输血科': ["全自动血型分析仪", "储血专用冷藏箱", "血小板恒温震荡保存箱", "血浆解冻仪", "血液专用低温保存箱"],
        '康复医学科': ["等速肌力测试与训练系统", "减重步行训练系统", "下肢康复机器人", "冲击波疼痛治疗仪", "经颅磁刺激仪"],
        '理疗科': ["超短波电疗机", "中频干扰电治疗仪", "极超短波治疗仪", "低周波治疗机", "红外偏振光治疗仪"],
        '老年康复科': ["智能四肢联动康复训练器", "平衡功能评估训练系统", "多关节主被动康复机", "言语吞咽治疗仪", "电动起立床"],
        '中医科': ["中医经络检测仪", "全自动中药熏蒸舱", "多功能艾灸仪", "微电脑针灸治疗仪", "中药煎药包装一体机"],
        '疼痛门诊': ["医用臭氧治疗仪", "射频温控热凝仪", "冲击波疼痛治疗系统", "超声引导神经阻滞仪", "超激光疼痛治疗仪"],
        '皮肤科': ["点阵激光治疗仪", "308准分子光治疗仪", "窄谱中波UVB光疗仪", "皮肤镜影像分析系统", "调Q激光仪"],
        '母婴保健科': ["产后盆底康复治疗系统", "乳腺红外检查仪", "母乳成分分析仪", "新生儿抚触水疗机", "骨盆修复仪"],
        '消毒供应室': ["全自动脉动真空压力蒸汽灭菌器", "过氧化氢低温等离子灭菌器", "多舱全自动清洗消毒机", "医用纯水处理系统", "医用热封机"],
        '健康服务科': ["动脉硬化检测仪", "人体成分分析仪", "免散瞳眼底照相机", "超声骨密度仪", "健康一体机"],
        '综合保健科': ["多参数心电监护仪", "便携式彩超仪", "红外热成像检查仪", "无创动脉硬化测定仪", "动态心电监护仪"],
        '门诊手术室': ["多功能门诊手术床", "无影手术灯", "高频电刀", "门诊麻醉机", "电动吸引器"],
        '门诊输液室': ["智能输液监护系统", "输液泵", "微量推注泵", "心电监护仪", "便携式吸痰器"],
        '门诊部': ["一站式自助挂号缴费机", "排队叫号分诊系统", "门诊便民轮椅转运系统", "公共自动体外除颤器(AED)"],
        '医疗设备应急库': ["应急周转呼吸机", "急救除颤监护仪", "便携式心电监护仪", "注射泵/输液泵调配机组", "床旁急救彩超"],
        '医疗设备科': ["全院医疗设备预防性维护(PM)与校准", "电气安全分析仪", "呼吸机质控仪", "除颤仪能量分析仪", "高频电刀分析仪", "输液泵分析仪"]
    }

    # Generate staff per department
    all_staff = []
    
    # Track used IDs and empNos
    used_ids = set()
    used_emp = set()
    name_counter = 0

    # Retain the primary hospital engineering leaders first
    engineering_pioneers = [
        {
            "id": "STAFF-01",
            "employeeNo": "EMP-8001",
            "name": "崔伟",
            "gender": "男",
            "stakeholderCategory": "hospital_engineering",
            "organization": "五莲县人民医院",
            "departmentId": "303",
            "departmentName": "医疗设备科",
            "role": "维修工程师",
            "roles": ["维修工程师", "科室责任人", "质控主管", "特种设备安全员"],
            "phone": "13863373257",
            "shortPhone": "63257",
            "workplace": "1号楼 综合楼 4F 医疗设备科工程技术室",
            "isEquipmentAdmin": True,
            "isAdverseEventAdmin": True,
            "isRadiationWorker": True,
            "title": "医疗设备科科长 / 主管工程师",
            "isPrimaryContact": True,
            "specialties": ["急救生命支持 (呼吸机/除颤仪/麻醉机)", "放射影像 (CT/DR/DSA)", "电气安全与预防性维护(PM)", "计量强检申报"],
            "serviceScope": "全院高风险急救生命支持设备质控巡检与急修",
            "emergencyTier": "L1",
            "status": "active",
            "notes": "全院设备主数据与调配总负责人"
        },
        {
            "id": "STAFF-02",
            "employeeNo": "EMP-8002",
            "name": "孙志强",
            "gender": "男",
            "stakeholderCategory": "hospital_engineering",
            "organization": "五莲县人民医院",
            "departmentId": "303",
            "departmentName": "医疗设备科",
            "role": "维修工程师",
            "roles": ["维修工程师", "计量工程师", "放射防护专员"],
            "phone": "13963381120",
            "shortPhone": "61120",
            "workplace": "1号楼 综合楼 4F 医疗设备科技术组",
            "isEquipmentAdmin": True,
            "isAdverseEventAdmin": False,
            "isRadiationWorker": True,
            "title": "副主任工程师 / 放射与计量主管",
            "isPrimaryContact": True,
            "specialties": ["大型放射影像 (CT/MRI/DSA)", "压力容器/特种设备", "医用计量校准"],
            "serviceScope": "放射科与手术室大型设备保障",
            "emergencyTier": "L1",
            "status": "active"
        },
        {
            "id": "STAFF-03",
            "employeeNo": "EMP-8003",
            "name": "赵敏",
            "gender": "女",
            "stakeholderCategory": "hospital_engineering",
            "organization": "五莲县人民医院",
            "departmentId": "364",
            "departmentName": "医疗设备应急库",
            "role": "科室设备管理员",
            "roles": ["科室设备管理员", "库管员"],
            "phone": "15963390015",
            "shortPhone": "60015",
            "workplace": "1号楼 综合楼 4F 医疗设备应急调配库",
            "isEquipmentAdmin": True,
            "isAdverseEventAdmin": True,
            "isRadiationWorker": False,
            "title": "主管技师 / 应急库库管专员",
            "isPrimaryContact": True,
            "specialties": ["急救生命支持设备周转调配", "备用呼吸机/除颤仪/注射泵管理"],
            "serviceScope": "全院突发公共卫生事件与跨科室应急设备借用调配",
            "emergencyTier": "L1",
            "status": "active"
        }
    ]

    for p in engineering_pioneers:
        all_staff.append(p)
        used_ids.add(p['id'])
        used_emp.add(p['employeeNo'])

    # Determine unique list of all departments (combining masterData and ledger)
    all_depts_dict = {}
    for d in depts_list:
        all_depts_dict[d['name']] = d

    # Add ledger departments if any missing from depts_list
    for ld in sorted(list(ledger_depts)):
        if ld not in all_depts_dict:
            all_depts_dict[ld] = {
                'id': f"DEP-{len(all_depts_dict)+100}",
                'name': ld,
                'discipline': '临床医技科',
                'building': '1号楼 综合楼',
                'floor': '1F',
                'nursePhone': '7991100'
            }

    print(f"Total merged departments to populate: {len(all_depts_dict)}")

    # Populate 5 staff members for every department
    for dname, dinfo in all_depts_dict.items():
        did = dinfo['id']
        bld = dinfo.get('building', '1号楼 综合楼')
        flr = dinfo.get('floor', '1F')
        nphone = dinfo.get('nursePhone', '7991100')
        disc = dinfo.get('discipline', '临床科')

        is_eng = dname in ['医疗设备科', '医疗设备应急库']
        is_admin = dname in [
            '院办公室', '院长办公室', '财务科', '人事科', '宣教科', '科教科',
            '后勤保障部', '医务科', '护理部', '感染管理科', '绩效考核科', '医保科',
            '医疗安全办公室', '医疗安全科', '审计科', '收费结算科', '作风办公室', '扶贫办', '信息科'
        ]

        stakeholder_cat = "hospital_engineering" if is_eng else ("hospital_administration" if is_admin else "hospital_clinical")
        is_rad_dept = dname in ['影像科', '介入放射科', '放疗科', '口腔科', '骨一科', '骨二科', '创伤外科']

        # Determine specs
        specs = specialty_map.get(dname, [f"{dname}常规诊疗设备", "多参数监护仪", "心电图机", "微量注射泵"])

        # Create 5-6 member profiles
        # Role 1: Director
        # Role 2: Head Nurse / Deputy Director
        # Role 3: Equipment Admin
        # Role 4: Senior Attending Physician / Clinician
        # Role 5: Primary Charge Nurse / Technician

        # Check existing staff for this dept
        existing_in_dept = [s for s in all_staff if s['departmentName'] == dname]
        needed = max(0, 5 - len(existing_in_dept))

        for idx in range(1, needed + 1):
            pos_index = len(existing_in_dept) + idx
            
            # Generate unique name
            sur = surnames[(name_counter * 7 + idx * 3) % len(surnames)]
            if pos_index in [1, 4]:
                given = doctor_names[(name_counter * 5 + idx * 7) % len(doctor_names)]
                gender = "男" if idx % 2 == 1 else "女"
            elif pos_index in [2, 5]:
                given = nurse_names[(name_counter * 5 + idx * 11) % len(nurse_names)]
                gender = "女"
            else:
                given = doctor_names[(name_counter * 3 + idx * 13) % len(doctor_names)] if idx % 2 == 0 else nurse_names[(name_counter * 3 + idx * 13) % len(nurse_names)]
                gender = "男" if idx % 2 == 0 else "女"

            name = f"{sur}{given}"
            name_counter += 1

            person_id = f"STAFF-{did}-{pos_index:02d}"
            emp_no = f"EMP-{int(did):03d}{pos_index}" if did.isdigit() else f"EMP-{pos_index:04d}"

            # Ensure unique
            while person_id in used_ids:
                person_id = f"STAFF-{did}-{pos_index:02d}-{name_counter}"
            while emp_no in used_emp:
                emp_no = f"EMP-{9000 + name_counter}"
            
            used_ids.add(person_id)
            used_emp.add(emp_no)

            # Mobile and short phone
            phone_suffix = f"{name_counter % 9000 + 1000:04d}"
            mobile = f"1386337{phone_suffix}"
            short_p = f"6{name_counter % 9000 + 1000:04d}"

            if pos_index == 1:
                role = "科室主任"
                title = f"{'主任医师' if not is_admin else '科长/主任'} / 科室主任"
                is_primary = True
                is_eq_adm = False
                is_adv_adm = False
                workplace = f"{bld} {flr} {dname}主任办公室"
            elif pos_index == 2:
                role = "科室护士长" if not is_admin else "副主任"
                title = f"{'副主任护师' if not is_admin else '副科长'} / 护士长"
                is_primary = True
                is_eq_adm = False
                is_adv_adm = False
                workplace = f"{bld} {flr} {dname}护士站"
            elif pos_index == 3:
                role = "科室设备管理员"
                title = f"主管护师 / 设备管理员" if not is_admin else f"业务骨干 / 设备管理员"
                is_primary = True
                is_eq_adm = True
                is_adv_adm = True
                workplace = f"{bld} {flr} {dname}设备质控管理岗"
            elif pos_index == 4:
                role = "临床医生" if not is_admin else "职能干事"
                title = f"主治医师 / 临床经手人" if not is_admin else "业务主管"
                is_primary = False
                is_eq_adm = False
                is_adv_adm = False
                workplace = f"{bld} {flr} {dname}临床诊室"
            else:
                role = "责任护士" if not is_admin else "科室办事员"
                title = f"主管护师 / 责任经办人" if not is_admin else "主管助理"
                is_primary = False
                is_eq_adm = False
                is_adv_adm = False
                workplace = f"{bld} {flr} {dname}工作区"

            member = {
                "id": person_id,
                "employeeNo": emp_no,
                "name": name,
                "gender": gender,
                "stakeholderCategory": stakeholder_cat,
                "organization": "五莲县人民医院",
                "departmentId": str(did),
                "departmentName": dname,
                "role": role,
                "roles": [role],
                "phone": mobile,
                "shortPhone": short_p,
                "workplace": workplace,
                "isEquipmentAdmin": is_eq_adm,
                "isAdverseEventAdmin": is_adv_adm,
                "isRadiationWorker": is_rad_dept,
                "title": title,
                "isPrimaryContact": is_primary,
                "specialties": specs,
                "emergencyTier": "L1",
                "status": "active"
            }
            all_staff.append(member)

    # 4. Add External Vendor and Third-Party Specialists
    external_specialists = [
        {
            "id": "STAFF-EXT-01",
            "employeeNo": "OEM-GE-01",
            "name": "陈经理",
            "gender": "男",
            "stakeholderCategory": "oem_vendor",
            "organization": "通用电气医疗系统 (GE Healthcare)",
            "departmentId": "288",
            "departmentName": "影像科",
            "role": "驻场原厂工程师",
            "phone": "13800108888",
            "title": "GE放射影像高级现场服务专家(FSE)",
            "isPrimaryContact": True,
            "specialties": ["GE Optima 64排CT", "GE SIGNA 1.5T磁共振", "GE Innova DSA"],
            "serviceScope": "GE大型放射影像原厂全保响应与球管探测器校准",
            "emergencyTier": "L3",
            "status": "active"
        },
        {
            "id": "STAFF-EXT-02",
            "employeeNo": "OEM-MR-01",
            "name": "周敏",
            "gender": "女",
            "stakeholderCategory": "oem_vendor",
            "organization": "深圳迈瑞生物医疗 (Mindray)",
            "departmentId": "269",
            "departmentName": "重症医学科",
            "role": "驻场原厂工程师",
            "phone": "13911223344",
            "title": "迈瑞生命信息与支持高级支持专家",
            "isPrimaryContact": True,
            "specialties": ["迈瑞SV300/SV800呼吸机", "迈瑞BeneView监护", "迈瑞BeneHeart除颤仪"],
            "serviceScope": "急救生命支持全院巡检与软件升级",
            "emergencyTier": "L3",
            "status": "active"
        },
        {
            "id": "STAFF-EXT-03",
            "employeeNo": "MET-SD-01",
            "name": "钱督导",
            "gender": "男",
            "stakeholderCategory": "metrology_regulatory",
            "organization": "日照市计量测试所 / 山东省计量院",
            "departmentId": "303",
            "departmentName": "医疗设备科",
            "role": "计量工程师",
            "phone": "13306338899",
            "title": "国家注册一级计量师 / 强检检定员",
            "isPrimaryContact": True,
            "specialties": ["医用强检心电图机", "除颤仪", "压力表/减压器", "多参数监护仪检定"],
            "serviceScope": "医院法制计量强制检定与年检证书出具",
            "emergencyTier": "none",
            "status": "active"
        }
    ]

    for ext in external_specialists:
        all_staff.append(ext)

    print(f"Total staff members generated: {len(all_staff)}")

    # 5. Write to data/staff_store.json
    os.makedirs('data', exist_ok=True)
    with open('data/staff_store.json', 'w', encoding='utf-8') as f:
        json.dump(all_staff, f, ensure_ascii=False, indent=2)
    print("Successfully wrote data/staff_store.json")

    # 6. Verify each ledger dept has at least 5 staff
    staff_count_by_dept = {}
    for s in all_staff:
        dept = s.get('departmentName', '')
        staff_count_by_dept[dept] = staff_count_by_dept.get(dept, 0) + 1

    all_passed = True
    for ld in sorted(list(ledger_depts)):
        cnt = staff_count_by_dept.get(ld, 0)
        if cnt < 5:
            print(f"FAILED: Ledger dept '{ld}' only has {cnt} staff!")
            all_passed = False

    if all_passed:
        print("ALL 49 LEDGER DEPARTMENTS HAVE >= 5 STAFF MEMBERS!")

if __name__ == '__main__':
    generate_staff()
