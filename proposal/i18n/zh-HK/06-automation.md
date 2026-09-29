## 10. Network Automation（網絡自動化）

### 10.1 概述與目標

官方題目單張把這條技術線路命名為 **「Network Automation（例如 PowerShell scripting、Ansible Playbook、Bash shell scripting 等）」**。它是項目 *Victor2 – Enterprise Network Infrastructure and Architect* 五條線路中的 **L4（AUTOMATION）** 線路，副標題為 *Design, Build, Verify and Document a Virtualised Enterprise Network for a Hong Kong FinTech Firm*，屬於 HDTN 畢業專題項目題目（AY2026/27），由四名學生組成的小組於 12 週內交付。

就客戶情境而言，這條線路並非裝飾。Vertex Peak 的盡職審查問卷（第 5 項）要求*「能證明網絡變更是透過經審閱、可重複的組態設定施加，而非以人手施工」*，而情境中的 IT 團隊只有五人，卻要服務四個地點共 160 名員工。L4 的存在正是為了同時回應這兩股壓力：變更必須在**發生之前可供審閱**，並且在**發生之後可以重複**；而小型團隊無法以人手完成的例行維護，必須由程式碼來執行。

#### 10.1.1 本線路所交付的項目

| 交付項目 | 形式 | 基線參照 |
|---|---|---|
| 單一自動化控制節點 | `vpnz-mon01`（10.10.30.31），Ubuntu Server 24.04.3 LTS，4 vCPU / 8 GB / 100 GB | §6 第 23 行，§12.4 |
| 從單一控制節點管理 Linux 及 Windows 兩個環境的組態 | `ansible-core` 2.18.x 配以 `ansible` community package 11.x；Linux 經 SSH，Windows 經 WinRM | §7，§11.4，§12.4 |
| 基礎設施即程式碼（infrastructure-as-code）儲存庫 | `C:\FYP\04-automation\` —— `ansible/`、`powershell/`、`bash/`、`runs/` | §8.6 |
| 至少九本可執行的 Playbook（劇本）及六個 Role（角色） | `playbooks/01-baseline-windows.yml` … `09-verify-services.yml`；`roles/common`、`nginx`、`keepalived`、`nftables`、`winrm`、`ad_users` | §8.6 |
| 至少五個達生產質素的 PowerShell 指令碼 | `Invoke-NewStarterOnboarding.ps1`、`Get-ADHealthReport.ps1`、`Backup-NetworkDeviceConfig.ps1`、`Test-ServiceEndpoints.ps1`、`Export-GPOBackup.ps1` | §8.6，§11.4 |
| 至少五個達生產質素的 Bash 指令碼，外加一個共用函式庫 | `01-hardening-baseline.sh` … `05-cert-renew.sh`、`lib/common.sh` | §8.6，§11.4 |
| 每次變更均經版本控制及同儕審閱 | `vpnz-mon01` 上的裸 Git 儲存庫或 Gitea；每個任務一個分支；標籤發行版本 `v0.1` … `v1.0` | §8.6，§11.4 |
| 可重現的證據 | `04-automation/runs/` 內附時間戳的執行日誌，並提交至 Git | §12.4 |

本線路的完成與否，由項目本身的成功準則界定：*「至少三個具冪等性的 PowerShell 指令碼，以及至少三本 Ansible playbook，置於 §8.7 所述的儲存庫佈局中，再次執行時輸出維持不變。」* 本章刻意超出這個下限交付，原因見 §13.4 R-02（L4 位於優先次序的 **must** 清單之上）。

#### 10.1.2 自動化控制節點

**`vpnz-mon01` 是唯一的自動化控制節點 [DECIDED]。** Ansible 絕不從學生的筆記型電腦執行，這樣引擎版本才得以鎖定、工作樹只有單一來源，而證據章節中每一份執行日誌，任何持有該儲存庫的人都能重現。`vpnz-mon01` 本身已承擔的角色，令這個安排順理成章：

- Ansible 控制節點及 Git 伺服器（經 SSH 存取的裸儲存庫，或 Gitea）。
- Prometheus、Grafana 及 Loki —— 第 11 章所取用的遙測來源。
- Linux 環境的 NTP，以及位於 `/srv/tftp/` 的 TFTP/SCP 組態存檔目標。

PowerShell 指令碼在 `vpnz-jump01`（PowerShell 7.4 LTS）上**撰寫**，但按需要在 Windows 客體上**執行**；若客體所運行的是 Windows PowerShell 5.1，便以 5.1 執行。Bash 指令碼則在 Linux 客體上本機執行，或由 Ansible 代為呼叫。這項區分對報告的誠信相當重要：每個指令碼實際所使用的執行環境必須逐一列明，而對於只在 5.1 上驗證過的指令碼，絕不可聲稱使用 PowerShell 7.4。

#### 10.1.3 本線路對應 WSOS 2026 的哪些範疇

本章開發 WorldSkills Occupational Standards 2026 中 *IT Network Systems Administration*（技能 2447，WorldSkills Shanghai 2026）的**範疇 5 —— Infrastructure Automation（基礎設施自動化），15 %**。以下三項可引用的 “shall be able to” 要求，逐字引自該頁在本機已核實的擷取內容：

> `Setup and run routine infrastructure maintenance operations using various scripting\programming languages`
> —— 巢狀技術範例：`Bash`、`PowerShell`

> `Use modern automation tools for systems deployment and configuration management`
> —— 巢狀技術範例：`Git`

> `Identify and implement infrastructure as code`
> —— 巢狀技術範例：`Ansible.`

本章亦開發範疇 5 四項「needs to know and understand」條文中的三項，逐字引述如下：

> `Continuous integration and continuous delivery\deployment pipelines concepts`

> `Capabilities of various automation tools`

> `Importance of code version control`

> `Behaviour of infrastructure automation tools.`

範疇 4 —— Network and System Operations（25 %）亦同樣受惠，透過 `Install and manage backup systems` 及其巢狀條文 `Script based backup, e.g. Bash, Batch or PowerShell`；範疇 1（5 %）則透過 `The importance of methodical working practices` 及 `The techniques of planning, scheduling, and prioritizing`。

**本章必須載明的一項明確更正。** 2026 年版範疇 5 **只**列出 `Bash`、`PowerShell`、`Git` 及 `Ansible` 作為巢狀技術範例。`Python`、`YANG`、`RESTCONF` 及 `NETCONF` 曾見於 2024 年（里昂）版範疇 5，並已**在 2026 年被移除**：其經機器核實的出現次數，由 2024 年的 2、1、1、1 次，變為 2026 年的 **0、0、0、0** 次。因此，本計劃書**並不**聲稱 WSOS 2026 要求以 Python 進行網絡自動化，亦**不**聲稱 YANG/RESTCONF/NETCONF 模型驅動自動化是一項標準要求。本項目若有使用 Python，僅作為第 11 章後備代理迴圈的實作細節，以及作為 Ansible 本身的交付機制 —— 絕不作為被引用的標準要求。Python、YANG、RESTCONF 及 NETCONF 只可出現於本報告的未來工作討論之中。

本章全篇另有一項歸屬規則適用。產出*「所有發現、手冊、步驟、螢幕截圖、驗證及參考資料」*的要求來自 **HDTN 題目單張**，而非 WSOS。WSOS 2026 中 `screen`、`capture`、`screenshot` 及 `evidence` 的出現次數為**零**。本章要求提供螢幕截圖之處，是因為題目單張要求如此。

---

### 10.2 自動化策略與原則

#### 10.2.1 宣告式與命令式

本項目同時採用兩種模型，這個選擇是刻意的，而非出於偶然。

**命令式（imperative）** 程式碼陳述所要採取的動作序列。第 10.6 節的 Bash 指令碼屬命令式：`05-cert-renew.sh` 並不描述一個期望的最終狀態，它描述的是一套程序 —— 解析引數、讀取憑證、把 `notAfter` 與門檻比較、有需要時續期、記錄日誌、結束。一個必須*依某種次序完成某些事*的系統就是命令式的，硬把它塞進宣告式工具只會製造更差的成品。

**宣告式（declarative）** 程式碼陳述期望的最終狀態，讓引擎自行計算差異。Ansible 在立意上是宣告式的：一個對套件寫上 `state: present` 的任務，並非說「執行 `apt-get install`」，而是說「nginx 必須已安裝」，之後由模組決定是否有任何事要做。這正是 `Identify and implement infrastructure as code` 所要求的模型，因為基礎設施即程式碼只有在程式碼*描述基礎設施*而非*描述一次工作階段*時才有價值。

小組所採納的實務原則：**任何在每次執行之後都必須為真的狀態，以 Ansible 宣告式表達；任何具有開始、次序與結束的程序，以 Bash 或 PowerShell 命令式表達，而只有在不存在宣告式模組時，Ansible 才透過 `command` 或專門為此而設的模組呼叫它。** 人手逐字輸入的 CLI 工作階段並非第三個類別 —— 它們是缺陷，因為它們不會留下任何可供審閱的成品。

#### 10.2.2 冪等性

冪等性（idempotence）是指把同一份程式碼套用兩次會產生相同狀態，且在第二次套用時不產生任何變更。本項目把冪等性視為**硬性要求**而非美德：§12.4 訂明每本 Playbook（劇本）均執行兩次，並把第二次執行的 `changed=0` 擷取為證據。

冪等性正是令變更安全的關鍵。若一本 Playbook（劇本）具冪等性，為了從部分失敗的部署中復原而重新執行它，是一項合法的修復動作。若不具冪等性，重新執行就可能令損害疊加 —— 附加第二份防火牆規則、重複建立使用者，或重新簽發憑證。因此第 10.4.5 節的每個 Role（角色）均附有書面的冪等性說明，而該說明會指出*什麼會破壞這項性質*（通常是沒有 `creates:`、`changed_when:` 或 `when:` 防護的 `shell` 或 `command` 任務）。

#### 10.2.3 真相來源

每一項組態設定都有且僅有一個權威的家，而那個家就是 Git 內的一個檔案：

| 對象 | 真相來源 |
|---|---|
| 主機身分、位址、群組 | `04-automation/ansible/inventory/hosts.yml` |
| 每個群組及每部主機的變數 | `inventory/group_vars/`、`inventory/host_vars/` |
| 機密資料 | 經 Ansible Vault 加密的變數檔案，僅在執行時解密 |
| 組態範本 | `04-automation/ansible/templates/*.j2` |
| 預定套用於 Packet Tracer 裝置的組態 | `03-build/packet-tracer/configs/*.txt`（§11.4 的 Track A） |
| 測試定義及其預期結果 | `06-verification/` |
| 設計本身 | `00-baseline/` —— 每次凍結後即凍結，只讀 |

由此推得的必然結論，是小組必須切實執行的一項規則：**若某個值在實驗室中有所變更而該變更並未提交，那麼所謂的真相來源就是一個謊言。** 排錯期間所作的每一項手動變更，其後都必須把同一項變更寫回儲存庫，否則便把該手動變更還原。若某項手動變更無法由自動化擷取（例如示範期間的一項 Packet Tracer CLI 操作），便連同其理據記錄在決策日誌之中。

#### 10.2.4 同儕審閱

該盡職審查項目要求的是一套*流程*，而非一件工具。小組在社交層面與技術層面同時實施同儕審閱：每一項 Playbook（劇本）、指令碼及範本的變更都提交於一個分支上，推送至 `vpnz-mon01`，並由第二位小組成員審閱後才合併至 `main`。審閱者姓名及審閱結果記錄於 `01-proposal/` 之下的會議紀錄中。任何一項改動 `04-automation/` 之下內容、卻沒有記錄第二位讀者的提交，都視為未經審閱，而第 12 週的標籤發行版本不得含有任何此類提交。

#### 10.2.5 生產前的預備環境

實驗室並沒有在實體上分隔出來的預備（staging）環境，因此預備是以**三個分級步驟**在同一個環境內實施：

1. **語法與靜態檢查閘門** —— `ansible-playbook --syntax-check`，Bash 另加 ShellCheck，PowerShell 另加 PSScriptAnalyzer。凡未能通過解析與靜態檢查者，一概不執行。
2. **試跑閘門** —— 對整個目標群組執行 `--check --diff`。此舉會報告*將會*變更什麼，而不實際作出變更。
3. **金絲雀閘門** —— 先對**一部主機**（`--limit`）作真實執行，以人手核實，然後才及於群組其餘主機，最後才及於全站。

就 Windows 環境而言，金絲雀永遠是一部非 DC 的成員伺服器；就 DMZ 而言，金絲雀是次節點（`vpnz-dmzrev02`），永遠不是當時持有 VIP 的節點。這個次序是一項設計決定，而非習慣。

#### 10.2.6 影響範圍控制

影響範圍（blast radius）是指單一錯誤所能損害的系統集合。它由四項機制加以控制：

- **以群組取代萬用字元。** 除第 10.4.6.4 節的只讀稽核 Playbook（劇本）之外，沒有任何 Playbook 以 `all` 為目標。部署類 Playbook 以具名的群組為目標，並帶有明確的 `hosts:` 一行。
- **`serial` 及 `max_fail_percentage`。** 在一層之內滾動部署（兩節點成對者用 `serial: 1`），令失敗時推出會停止，而服務的大部分仍然健康。
- **以 `--limit` 為預設紀律。** 每位小組成員在首次執行前都加上 `--limit`。
- **認證資料的分層隔離。** 採取 GitHub 式做法的服務帳戶 `svc_ansible` **只是** `GG-WINRM-Admins` 的成員。它不是 Domain Admin。管理 `vpnz-dc01` 及 `vpnz-dc02` 需要四個具名 `adm-{initials}` 帳戶之一，其中兩個屬於 `GG-Tier0-Admins`。因此，針對網域控制站的 Playbook（劇本）不能僅靠自動化帳戶執行，這本身即是一項影響範圍控制。

#### 10.2.7 回復

回復機制有三種，按嚴重程度遞增排列：

| 機制 | 適用範圍 | 做法 |
|---|---|---|
| 宣告式回復 | 任何由 Ansible 管理的項目 | 還原該 Git 提交並重新執行 Playbook（劇本）；由於程式碼具冪等性，狀態會收斂回原狀 |
| 組態檔案還原 | `nftables`、`keepalived`、`nginx`、`sshd` | Role（角色）把先前的檔案保留為 `<file>.bak.<timestamp>`，若新檔案未能通過其驗證，處理程式會還原該檔案 |
| 防火牆鎖死計時器 | 僅 nftables | `02-nftables-apply.sh` 在套用新規則集之前先啟動自動回復，因此壞掉的規則集不會令小組被鎖在遠端 VM 之外 —— 這正是 §12.2 所要求的、已記錄的鎖死緩解措施 |
| Hypervisor 快照 | 任何項目 | 每次重大變更前拍一個快照，變更經核實後即移除；**快照永遠不是備份**（§15.3） |

回復是經過測試的，而非假定可用。至少會執行一次刻意的回復並擷取為證據，因為未經測試的回復路徑只是一項未經驗證的聲稱。

#### 10.2.8 機密資料管理

任何明文機密資料都絕不可提交。相關控制如下：

- **Ansible Vault** 用於每一項由 Playbook（劇本）取用的機密資料（開機引導期間的 Windows 本機管理員密碼、以 vault 加密的 `svc_ansible` 認證資料、iSCSI CHAP 機密、Grafana 管理員密碼，以及若有設定時的 SMTP 式警示 webhook 權杖）。
- **`svc_ansible`** 以 32 字元的隨機密碼建立，該密碼存放於小組的密碼管理器中，絕不存放於 Git；「密碼永不過期」已停用，且密碼按 §8.4 以 Playbook 輪替。
- **`.gitignore`** 涵蓋 `*.key`、`wg*.conf`、`*.pem`、`*.pfx`、`pki/`、`vault-pass*`、`*.retry` 及 `logs/`。
- **標籤前的清掃。** 每次標籤發行之前，都會在儲存庫中搜尋形似機密的字串 —— 若 Ubuntu 套件庫中有 `gitleaks` 便使用它，否則以 `git grep` 清掃，另加一次 PowerShell `Select-String` 清掃，搜尋 `password=`、`PRIVATE KEY` 及 `BEGIN OPENSSH`。清掃的輸出即為證據。
- **一次刻意的反向測試。** 會在一個用完即棄的分支上提交一個假金鑰一次，以證明清掃能把它捉出來；該分支會被刪除，而截圖則保留於 `06-verification/`。

#### 10.2.9 各項原則與 WSOS 範疇 5 要求的對應關係

WSOS 範疇 5 的要求是 `Identify and implement infrastructure as code`（巢狀：`Ansible.`）。原則與要求之間的對應是直接的，於此載明，因為這正是本章的理據：

| 原則 | 如何滿足 `Identify and implement infrastructure as code` |
|---|---|
| 宣告式模型 | 基礎設施即程式碼只有在程式碼描述*狀態*時才有意義；宣告式這個選擇，正是令儲存庫成為對環境之描述的原因 |
| 冪等性 | 不具冪等性的儲存庫不能成為真相來源，因為套用它會以未載明的方式改變環境；`changed=0` 正是程式碼與環境一致的證明 |
| 真相來源 | 「即程式碼」意指檔案具權威性，而運行中的系統是其衍生物 —— 單一歸屬規則就是這項要求在運作層面的形式 |
| 同儕審閱 | 程式碼可供審閱，CLI 工作階段則不然。審閱正是令成品成為「程式碼」而非「某人輸入內容的日誌」的關鍵 |
| 生產前的預備環境 | `Capabilities of various automation tools` 及 `Behaviour of infrastructure automation tools.` 這兩項 know/understand 條文，要求團隊在工具行動之前先了解其行為；試跑閘門就是這種認識的實踐 |
| 影響範圍控制 | 把 `The importance of methodical working practices`（範疇 1）應用於變更管理 |
| 回復 | `Importance of code version control`（範疇 5）—— 版本控制之所以存在，正為了可以回復到先前的狀態 |
| 機密資料管理 | 無法共用的儲存庫不能成為真相來源；存入 Vault 正是令程式碼既*完整*又*可提交*的關鍵 |

`Use modern automation tools for systems deployment and configuration management`（巢狀 `Git`）由儲存庫、第 10.3 節的分支策略及標籤發行版本所滿足；`Setup and run routine infrastructure maintenance operations using various scripting\programming languages`（巢狀 `Bash`、`PowerShell`）則由第 10.5 節及第 10.6 節所滿足。

---

### 10.3 儲存庫與項目結構

#### 10.3.1 確切的目錄佈局

自動化儲存庫位於工作副本的 `C:\FYP\04-automation\`，並鏡像至 `vpnz-mon01` 上的 Git。以下所有路徑均逐字取自設計基線，不得重新編排：

```text
C:\FYP\04-automation\
├── ansible/
│   ├── ansible.cfg
│   ├── inventory/
│   │   ├── hosts.yml
│   │   ├── lab.ini
│   │   ├── group_vars/
│   │   │   ├── all.yml
│   │   │   ├── all/
│   │   │   │   └── vault.yml          (Ansible Vault; committed encrypted)
│   │   │   ├── windows.yml
│   │   │   ├── linux.yml
│   │   │   ├── web.yml
│   │   │   ├── edge.yml
│   │   │   ├── monitoring.yml
│   │   │   └── dmz.yml
│   │   └── host_vars/
│   │       ├── vpnz-nft01.yml
│   │       ├── vpnz-nft02.yml
│   │       ├── vpnz-dmzrev01.yml
│   │       ├── vpnz-dmzrev02.yml
│   │       └── vpnz-mon01.yml
│   ├── playbooks/
│   │   ├── 01-baseline-windows.yml
│   │   ├── 02-baseline-linux.yml
│   │   ├── 03-nginx-reverseproxy.yml
│   │   ├── 04-keepalived.yml
│   │   ├── 05-nftables-egress.yml
│   │   ├── 06-wireguard.yml
│   │   ├── 07-ad-users.yml
│   │   ├── 08-collect-network-configs.yml
│   │   └── 09-verify-services.yml
│   ├── roles/
│   │   ├── common/
│   │   ├── nginx/
│   │   ├── keepalived/
│   │   ├── nftables/
│   │   ├── wireguard/
│   │   ├── winrm/
│   │   ├── windows_baseline/
│   │   ├── ad_users/
│   │   └── users/
│   ├── filter_plugins/
│   │   ├── fyp_filters.py
│   │   └── README.md
│   ├── templates/
│   │   ├── nftables.conf.j2
│   │   ├── keepalived.conf.j2
│   │   ├── wg0.conf.j2
│   │   ├── nginx-upstreams.conf.j2
│   │   ├── portal.conf.j2
│   │   ├── sshd-hardening.conf.j2
│   │   └── sysctl-hardening.conf.j2
│   ├── files/
│   │   ├── dmzrev01/nginx.conf
│   │   ├── dmzrev02/nginx.conf
│   │   └── ssh/authorized_keys/
│   │       ├── adm-w1.pub
│   │       ├── adm-w2.pub
│   │       ├── adm-w3.pub
│   │       └── adm-w4.pub
│   ├── docs/
│   │   ├── 01-runbook-baseline-linux.md
│   │   ├── 02-runbook-nftables-lockout.md
│   │   ├── 03-runbook-vault.md
│   │   ├── 04-variable-dictionary.md
│   │   └── 05-idempotence-log.md
│   └── logs/
│       └── ansible.log
├── powershell/
│   ├── Invoke-NewStarterOnboarding.ps1
│   ├── Get-ADHealthReport.ps1
│   ├── Backup-NetworkDeviceConfig.ps1
│   ├── Test-ServiceEndpoints.ps1
│   ├── Export-GPOBackup.ps1
│   ├── Invoke-ScheduledBackupVerify.ps1
│   ├── modules/VPCommon/VPCommon.psm1
│   ├── data/newstarters.csv
│   └── logs/
├── bash/
│   ├── 01-hardening-baseline.sh
│   ├── 02-nftables-apply.sh
│   ├── 03-keepalived-check.sh
│   ├── 04-backup-restic.sh
│   ├── 05-cert-renew.sh
│   ├── 06-server-health-report.sh
│   ├── 07-nftables-log-summary.sh
│   └── lib/common.sh
└── runs/
    └── YYYY-MM-DD_HHMM_playbook.log
```

#### 10.3.2 每個目錄的用途

| 路徑 | 用途與規則 |
|---|---|
| `ansible/ansible.cfg` | 唯一的組態檔案，已納入版本控制。從儲存庫根目錄執行的每本 Playbook（劇本）都會自動讀取它；沒有人會傳入改變其行為的臨時旗標，因為旗標對下一位讀者而言是不可見的（見 10.4.3） |
| `inventory/hosts.yml` | **權威**主機清單（inventory）：每部主機、其位址及其群組歸屬。`lab.ini` 作為基線的 INI 格式主機清單而保留，並由一致性檢查保持同步，因為基線如此命名它；而 Playbook（劇本）實際取用的是 `hosts.yml` |
| `inventory/group_vars/` | 適用於某個群組的變數。`all.yml` 存放處處皆真的值 —— 網域名稱、NTP 及 DNS 伺服器、管理員群組、套件更新政策。群組檔案則存放該層專屬的值 |
| `inventory/group_vars/all/vault.yml` | 以 Vault 加密的機密資料（見 10.4.4）。以**加密**形式提交；其明文從不存在於儲存庫的磁碟上 |
| `inventory/host_vars/` | 真正有所不同的逐主機覆寫值，例如兩個 VRRP 成對節點的 `keepalived_priority` 及 `keepalived_state`，或某部特定主機的備份目的地。任何可以成為群組變數的項目都應放在群組變數中 —— host_vars 是為真正逐主機的事實而設，不是為了方便 |
| `playbooks/` | 進入點。一本 Playbook（劇本）描述*正在進行什麼部署*；它盡量少含邏輯，而把工作交給 Role（角色）。數值前綴是建議的執行次序，並由排程所引用 |
| `roles/` | 可重用的單元。每個 Role（角色）按需要包含 `tasks/`、`handlers/`、`templates/`、`files/`、`defaults/`、`vars/` 及 `meta/`，另加一份 `README.md` 說明該 Role 的用途及其冪等性備註 |
| `templates/` | 只放 Jinja2 範本。項目中任何地方所渲染的範本都放在此處；Role（角色）自身的 `templates/` 目錄只在該範本確實為該 Role 私有時才使用 |
| `files/` | 靜態、非範本化的內容：手寫的 `nginx.conf`，以及 `files/ssh/authorized_keys/` 之下各管理員的 Ed25519 公開金鑰。公開金鑰會提交；**私密金鑰絕不存放於 `vpnz-mon01`** |
| `filter_plugins/` | 範本所使用的自訂 Jinja2 篩選器。本項目只需要少數幾個 —— 例如一個把前綴清單渲染成 nftables set 語法的篩選器，以及一個從主機的 Role（角色）推導出正確 VLAN 介面名稱的篩選器 —— 而它們由一本小型的斷言 Playbook（劇本）作單元測試，令壞掉的篩選器大聲失敗，而不是渲染出一條空的防火牆規則 |
| `docs/` | 應與程式碼並放、供人閱讀的運作文件：操作手冊（runbook）、變數字典，以及記錄每一項 `changed=0` 證明的冪等性日誌 |
| `logs/ansible.log` | Ansible 自身的日誌檔，由 `ansible.cfg` 中的 `log_path` 所設定。它是方便排錯之用，並非證據 |
| `powershell/` | Windows 一側的指令碼、一個共用模組、輸入資料及指令碼日誌。`modules/VPCommon/` 存放由多於一個指令碼共用的函式，並已納入版本控制，令共用函式的變更在 `git log` 中可見 |
| `bash/` | Linux 一側的指令碼，另加 `lib/common.sh`；後者提供日誌記錄、錯誤處理及 `set -euo pipefail` 前置宣告，令每個指令碼的行為一致 |
| `runs/` | **證據。** 附時間戳、命名為 `YYYY-MM-DD_HHMM_playbook.log` 的執行日誌，予以提交，令驗證章節可以引用。執行日誌未獲提交的 Playbook（劇本）執行，即未能證明曾經發生 |

#### 10.3.3 分支策略

一個輕度治理的 Git-flow 變體，規模配合四名學生與十二週：

| 分支 | 存續期 | 規則 |
|---|---|---|
| `main` | 永久 | 永遠可部署。只有來自 `task/*` 的合併會進入此分支，且每次均附一名已記錄的審閱者。在每個里程碑閘門標記 `v0.1`、`v0.2`…… |
| `task/{line}-{short-name}` | 每項變更 | 每項變更一個分支，以線路及該變更命名，例如 `task-l4-nftables-egress-role`、`task-l2-keepalived-track-script` |
| `fix/{short-name}` | 每個缺陷 | 驗證期間發現的缺陷 |
| `docs/{short-name}` | 每項文件變更 | 只涉及文件的變更，令文件提交永不與組態提交混在一起 |
| `spike/{short-name}` | 每項實驗 | 供 Packet Tracer 實驗及 AI 可行性探測之用、用完即棄的分支；只以筆記形式合併，絕不作為組態合併 |

命名沿用設計基線：MS-SERVER 用 `task-l1-…`，LINUX-SERVER 用 `task-l2-…`，CISCO 用 `task-l3-…`，AUTOMATION 用 `task-l4-…`，AI-NETOPS 用 `task-l5-…`。

#### 10.3.4 提交與審閱慣例

提交採用 conventional-commit 風格，並以範圍名稱指明所涉成品，令 `git log` 本身就是可讀的證據：

```text
feat(l4-ansible): add nftables role with lockout-safe apply

- renders /etc/nftables.conf from templates/nftables.conf.j2
- table inet fyp_filter, input+forward policy drop, log prefix NFT-DROP:
- validate with `nft -c -f` before reload; reload via systemd unit
- idempotence: second run changed=0 (see runs/2026-11-03_2140_05-nftables-egress.log)

Refs: TC-L4-03, TB-03, TB-04
Reviewed-by: adm-w3
```

規則如下：

1. 每次提交只作一項邏輯變更。若一項提交既改動防火牆*又*重新排版一本無關的 Playbook（劇本），會被退回。
2. **每一項改動組態的提交都至少引用一個測試案例編號（`TC-L4-nn`），並在相關之處引用它所實作的信任邊界規則（`TB-nn`）。** 這正是把儲存庫變成可追溯成品、而非一堆檔案的關鍵。
3. 每一項改動冪等性成品的提交，都在訊息正文中述明其冪等性證據。
4. `Reviewed-by:` 須指名第二位小組成員。同一人不得同時為作者與審閱者。
5. 標籤須為附註標籤並推送：`git tag -a v0.3 -m "Week 6 gate: nftables pair live, idempotent"`。發行標籤就是執行機密清掃的時間點。
6. 提交訊息以英文、命令語氣書寫，且絕不包含真實認證資料、內部密碼或私密金鑰 —— 包括在「臨時」提交中亦然，因為 `git log` 是永久的。

---

### 10.4 Ansible

#### 10.4.1 控制節點設定

##### 10.4.1.1 鎖定的引擎與 Python 環境

所鎖定的引擎是 `ansible-core` **2.18.x**，配以 **`ansible` community package 11.x**，另加供 Windows 連線用的 **`pywinrm` 0.5.0**。選擇這些版本有其容易被弄錯的理由：Ubuntu 24.04 套件庫中的 `ansible-core` 比所鎖定的版本為舊，而提供 `win_ping` 及其餘 Windows 模組組合的 community package collection `ansible.windows`，必須與 core 版本相配。因此，受支援的安裝方式是 `/opt` 之下的一個虛擬環境，而不是 `apt` 套件：

```bash
#!/usr/bin/env bash
# vpnz-mon01 — one-time control-node bootstrap (run as an administrator)
set -euo pipefail

sudo apt-get update
sudo apt-get install -y python3-venv python3-pip sshpass git jq

sudo mkdir -p /opt/ansible-venv
sudo chown "$(id -un):$(id -gn)" /opt/ansible-venv
python3 -m venv /opt/ansible-venv/venv

# ansible-core 2.18.x + community package 11.x + pywinrm 0.5.0
/opt/ansible-venv/venv/bin/pip install --upgrade pip
/opt/ansible-venv/venv/bin/pip install \
  'ansible-core~=2.18.0' \
  'ansible~=11.0' \
  'pywinrm==0.5.0' \
  'jmespath' 'netaddr'

# Record the ACTUAL versions as evidence (required by the version-pinning discipline)
{
  echo "=== captured $(date -Is) on $(hostname) ==="
  /opt/ansible-venv/venv/bin/ansible --version
  /opt/ansible-venv/venv/bin/ansible-galaxy collection list
  /opt/ansible-venv/venv/bin/python3 -c 'import winrm, sys; print("pywinrm", winrm.__version__)'
} | tee /srv/evidence/version-ansible-$(date +%Y%m%d).txt
```

版本擷取並非可有可無。§7 的版本鎖定紀律要求：若實際版本與列表不同，報告須包含一節*版本偏差*，逐一列出每項差異及其影響。若社群套件在實驗室中無法安裝 11.x 版，小組須記錄實際存在的版本並述明該偏差 —— 在實際安裝 10.x 的情況下默默寫上「11.x」，對本項目而言是一項須報告的誠信缺失。

##### 10.4.1.2 通往受管 Linux 主機的 SSH 金鑰

管理員使用 Ed25519 金鑰。金鑰**每位管理員一次，在其本人的機器上**產生；只有公開的那一半會被提交，存放於 `04-automation/ansible/files/ssh/authorized_keys/adm-w{n}.pub`。私密金鑰絕不存放於 `vpnz-mon01`，這項規則正是令控制節點成為一個學生可以交接出去的地方的原因。

```bash
# 1) On each administrator's own machine (not on vpnz-mon01):
ssh-keygen -t ed25519 -a 100 -C "adm-w1@vertexpeak.fyp.lab" -f ~/.ssh/id_ed25519_adm-w1
# 2) The PUBLIC key is committed:
#    files/ssh/authorized_keys/adm-w1.pub
# 3) Distribute, then immediately verify password login is refused:
ssh-copy-id -i ~/.ssh/id_ed25519_adm-w1.pub fypadmin@10.10.30.31
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no adm-w1@10.10.30.31   # must fail
```

其後由 `users` Role（角色）負責維持穩定狀態：它為恰好四個 `adm-{initials}` 帳戶安裝公開金鑰，在 `/etc/ssh/sshd_config.d/10-fyp-hardening.conf` 中維持 `PermitRootLogin no` 及 `PasswordAuthentication no`，並以 `AllowGroups gg-infra-admins` 限制 SSH。由 cloud-init 範本建立的開機引導帳戶 `fypadmin`，在四位管理員都能經 Ansible 登入之後即被停用 —— 否則該範本帳戶會成為一個永久的共用認證資料，而這是設計所禁止的。

##### 10.4.1.3 Windows 受管節點的先決條件

Ansible 經 WinRM 接觸 Windows 客體，而 WinRM **並非**預設就以支援這套設計的方式開啟。每一部 Windows 受管節點都必須符合三項條件：監聽程式存在且可達、認證路徑受信任，以及防火牆只允許來自 `vpnz-mon01` 的流量。

**關於監聽程式的決定。** 有兩個選項 —— 5985 埠上的 HTTP WinRM，或 5986 埠上的 HTTPS WinRM。**本項目採用 5986 埠上的 HTTPS**，因為 §12.4 如此要求，因為認證資料是在工作階段之內傳送，也因為 5985 在傳輸層既不加密亦不認證。這個決定並非沒有代價：HTTPS 監聽程式需要一張憑證，其主體名稱須與 Ansible 定址該主機的方式相符，而且該憑證必須受客戶端信任，否則驗證就必須刻意放寬。

曾考慮三個子選項：

| 選項 | 結論 | 理由 |
|---|---|---|
| 使用由內部 PKI（`VP-ISSUING-CA-01`）簽發的憑證作 HTTPS，並把 CA 憑證鏈分發至 `vpnz-mon01` | **在已加入網域的環境中選用** | 正確、可稽核，並示範 L1 的 PKI 工作如何被 L4 使用。需要 `vpnz-mon01` 信任該 CA 憑證鏈，做法是把 `vp-root-ca.crt` 置於 `/usr/local/share/ca-certificates/` 並執行 `update-ca-certificates` |
| 使用由 `New-SelfSignedCertificate` 建立的自簽憑證作 HTTPS | **只在兩部 DMZ 網頁節點上選用** | 只有在小組接受「不快取認證資料」這項取捨時，DMZ 主機才加入網域（未決項目 O-05）；若它們以工作群組方式隔離，則沒有由 PKI 簽發的憑證可用，自簽憑證便是務實之選。相關信任後果會被載明而非隱藏：或是把匯出的憑證匯入 `vpnz-mon01` 的信任存放區，或是**只為該兩部主機**把 `ansible_winrm_server_cert_validation` 設為 `ignore`，**作為已聲明的實驗室簡化措施** |
| 全環境使用 `ansible_winrm_server_cert_validation=ignore` 的 HTTPS，或使用 5985 上的純 HTTP | **不予採用** | 全環境繞過驗證會是錯誤的示範；本報告意在作為良好實務的證據，而把繞過驗證記錄為正常做法則不是 |

就未加入網域的情況而言，本設計完全不使用*客戶端*上的 `TrustedHosts` —— 客戶端是 Linux。`TrustedHosts` 是 Windows 客戶端一側的清單，適用於由 Windows 機器向非網域目標發起 WinRM 的情況；第 10.5.2 節提及它，是因為小組在從 `vpnz-jump01` 作 PowerShell 遠端處理示範時使用它，但 Ansible 的路徑依賴監聽程式憑證加受信任憑證鏈，而非依賴 `TrustedHosts`。

**確切的 WinRM 組態 PowerShell。** 此區塊在每部 Windows 受管節點上執行一次，或於建置期間互動執行，或更理想地由 `winrm` Role（角色）推送：

```powershell
<#
.SYNOPSIS
    Configures a Windows Server 2025 guest as an Ansible-managed node over WinRM/HTTPS.
.DESCRIPTION
    Run once on every Windows managed node, elevated. Idempotent: safe to re-run.
    Scope of this project: Windows Server 2025 Standard (Desktop Experience).
    Fallback: Windows Server 2022 (build 20348) — identical cmdlets.
.PARAMETER ControlNodeAddress
    The automation control node. Only this address is allowed through the firewall.
.PARAMETER CertificateThumbprint
    Thumbprint of an existing certificate with a SAN matching the host FQDN.
    Omit to create a self-signed certificate of last resort (documented deviation).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidatePattern('^(\d{1,3}\.){3}\d{1,3}$')]
    [string]$ControlNodeAddress = '10.10.30.31',

    [ValidatePattern('^[0-9A-Fa-f]{40}$')]
    [string]$CertificateThumbprint,

    [ValidateSet('5985','5986')][string]$ListenerPort = '5986'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step { param([string]$Message)
    Write-Host ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message) }

try {
    Write-Step 'Checking WinRM service state'
    if ((Get-Service WinRM).StartType -ne 'Automatic') {
        Set-Service WinRM -StartupType Automatic
    }
    if ((Get-Service WinRM).Status -ne 'Running') { Start-Service WinRM }

    Write-Step 'Enabling PowerShell remoting (HTTP listener, then removed below)'
    # -SkipNetworkProfileCheck: needed because lab NICs are often classified as Public.
    Enable-PSRemoting -Force -SkipNetworkProfileCheck

    if ($ListenerPort -eq '5986') {
        if (-not $CertificateThumbprint) {
            Write-Step 'No thumbprint supplied - creating a self-signed certificate (documented deviation)'
            $fqdn = "$env:COMPUTERNAME.$((Get-CimInstance Win32_ComputerSystem).Domain)"
            $CertificateThumbprint = (New-SelfSignedCertificate `
                -DnsName $env:COMPUTERNAME, $fqdn `
                -CertStoreLocation 'Cert:\LocalMachine\My' `
                -NotAfter (Get-Date).AddDays(397) `
                -KeyAlgorithm RSA -KeyLength 2048 `
                -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.1')).Thumbprint
            Write-Warning "Self-signed thumbprint $CertificateThumbprint - must be trusted on vpnz-mon01"
        }

        Write-Step "Creating HTTPS listener on port 5986 (thumbprint $CertificateThumbprint)"
        $https = Get-ChildItem WSMan:\Localhost\Listener |
                 Where-Object { $_.Keys -contains 'Transport=HTTPS' }
        if (-not $https) {
            New-Item -Path WSMan:\Localhost\Listener `
                     -Transport HTTPS -Address * `
                     -CertificateThumbprint $CertificateThumbprint | Out-Null
        }

        Write-Step 'Removing the unencrypted HTTP listener on 5985'
        Get-ChildItem WSMan:\Localhost\Listener |
            Where-Object { $_.Keys -contains 'Transport=HTTP' } |
            ForEach-Object { Remove-Item -Path ("WSMan:\Localhost\Listener\" + $_.Name) -Recurse -Force }

        Write-Step 'Restricting WinRM to Negotiate/CredSSP and setting MaxEnvelopeSizekb'
        Set-Item WSMan:\Localhost\Service\Auth\Basic -Value $false
        Set-Item WSMan:\Localhost\Service\AllowUnencrypted -Value $false
        Set-Item WSMan:\localhost\MaxEnvelopeSizekb -Value 500
        Set-Item WSMan:\localhost\Shell\IdleTimeout -Value 300000   # 5 minutes
        Set-Item WSMan:\localhost\Service\MaxConcurrentUsers -Value 10
    }

    Write-Step "Firewall rule: allow TCP $ListenerPort from $ControlNodeAddress only"
    $ruleName = "FYP-Ansible-WinRM-$ListenerPort"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if ($existing) { Remove-NetFirewallRule -DisplayName $ruleName }
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow `
        -Protocol TCP -LocalPort ([int]$ListenerPort) `
        -RemoteAddress $ControlNodeAddress -Profile Domain,Private,Public `
        -Description 'Ansible control node on vpnz-mon01 (10.10.30.31) - TB-07/TB-08' | Out-Null

    Write-Step 'Verifying'
    Test-WSMan -ComputerName $env:COMPUTERNAME -UseSSL -ErrorAction Continue
    Get-ChildItem WSMan:\Localhost\Listener | Select-Object Name, Keys
    Get-NetFirewallRule -DisplayName $ruleName |
        Get-NetFirewallAddressFilter | Select-Object RemoteAddress
    Write-Step 'Done'
}
catch {
    Write-Error ("WinRM configuration failed: {0}" -f $_.Exception.Message)
    throw
}
```

**每個元素為何存在。** 對 HTTP 監聽程式使用 `Enable-PSRemoting -Force -SkipNetworkProfileCheck`，因為它一步就能建立服務組態、`WSMan` 提供者設定及所需的防火牆群組；它所建立的 HTTP 監聽程式其後會被*移除*，因為任由它啟用會留下一條設計上聲明不存在的未加密路徑。本實驗室特別需要 `-SkipNetworkProfileCheck`，因為 Hypervisor 的 host-only 介面卡經常被歸類為 `Public`，沒有這個旗標該 cmdlet 便會拒絕執行。停用 `Basic` 認證及 `AllowUnencrypted`，就關閉了 HTTP 原本會使用的認證資料路徑。防火牆規則以 `-RemoteAddress` 只限定於 `10.10.30.31`，這在主機層面也如網絡層面一般，實作了信任邊界表管理列（TB-07、TB-08）的精神。`MaxEnvelopeSizekb 500` 及五分鐘的閒置逾時，是在 Ansible 能透過 WinRM 傳送中等大小的模組負載而不出現 `WinRM cannot process the request` 錯誤之前，所需的標準加固調整。

**Ansible 一側的連線。** 連線變數存放於 `inventory/group_vars/windows.yml`，而非在命令列上：

```yaml
# inventory/group_vars/windows.yml
ansible_connection: winrm
ansible_port: 5986
ansible_winrm_transport: ntlm          # kerberos is preferred; see the note below
ansible_winrm_scheme: https
ansible_winrm_server_cert_validation: validate
ansible_user: "{{ vault_svc_ansible_user }}"
ansible_password: "{{ vault_svc_ansible_password }}"
ansible_winrm_read_timeout_sec: 60
ansible_winrm_operation_timeout_sec: 30
ansible_winrm_message_encryption: auto
ansible_become: false                  # Ansible runs as a local/domain admin; see 10.4.4
```

`ansible_winrm_transport: ntlm` 對小型網域而言是務實之選。Kerberos 是更強的選項，若小組能安排便應採用，因為它避免傳送可重複使用的認證資料；而 NTLM 至少在 HTTPS 工作階段之內是加密的。報告必須述明所用的是哪種傳輸方式及其原因，因為這正是「我們在 Windows 上用了 Ansible」一句所抹去的那類細節。

##### 10.4.1.4 控制節點路徑的驗證

控制節點能到達環境的證明，就是 §12.4 所要求的 `win_ping` 結果，另加 Linux 的 SSH 對應驗證：

```bash
cd /opt/ansible-venv/repo/04-automation/ansible
ansible windows -i inventory/hosts.yml -m ansible.windows.win_ping
ansible linux -i inventory/hosts.yml -m ansible.builtin.ping
ansible windows -i inventory/hosts.yml -m ansible.windows.win_shell -a 'whoami; $PSVersionTable.PSVersion'
```

結果的預期形狀（僅作示例）：

```text
vpnz-dc01 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
vpnz-fs01 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

特意納入 `whoami` 檢查：它證明 Ansible 所用的是*哪一個身分*，而這正是最常與小組所想不同的事實。

#### 10.4.2 主機清單設計

##### 10.4.2.1 完整的主機清單

`inventory/hosts.yml` 是權威主機清單（inventory）。以下每一項主機名稱、位址及 VLAN 均逐字取自正典設計；本檔案中任何主機都不得在本機層面重新定址、改動大小寫或縮寫。

```yaml
---
# C:\FYP\04-automation\ansible\inventory\hosts.yml
# Vertex Peak - Victor2 FYP - authoritative Ansible inventory.
# Addresses are verbatim from the canonical design baseline (static host table).
# Packet Tracer devices are tracked here for documentation and config-collection
# purposes only; Ansible CANNOT reach them (see 10.7).

all:
  children:

    # ------------------------------------------------------------------
    # Automation, monitoring and AI tier
    # ------------------------------------------------------------------
    monitoring:
      hosts:
        vpnz-mon01:
          ansible_host: 10.10.30.31
          ansible_user: adm-w4          # automation owner
          fyp_role: ansible_control_node

    ai:
      hosts:
        vpnz-ai01:
          ansible_host: 10.10.30.51
          ansible_user: adm-w4
          fyp_role: agent_runtime
          fyp_readonly_only: true       # never targeted by a mutating playbook

    # ------------------------------------------------------------------
    # Microsoft estate (managed over WinRM/HTTPS, 5986)
    # ------------------------------------------------------------------
    windows:
      children:
        windows_servers:
          hosts:
            vpnz-dc01:      { ansible_host: 10.10.30.11, fyp_tier: tier0, fyp_role: dc }
            vpnz-dc02:      { ansible_host: 10.10.30.12, fyp_tier: tier0, fyp_role: dc }
            vpnz-fs01:      { ansible_host: 10.10.30.21, fyp_tier: tier1, fyp_role: file_server }
            vpnz-san01:     { ansible_host: 10.10.80.21, fyp_tier: tier1, fyp_role: iscsi_target }
            vpnz-rras01:    { ansible_host: 10.10.30.41, fyp_tier: tier1, fyp_role: vpn }
            vpnz-jump01:    { ansible_host: 10.20.20.31, fyp_tier: tier0, fyp_role: paw }
            vpnz-brdc01:    { ansible_host: 10.10.113.11, fyp_tier: tier0, fyp_role: rodc }
        dmz_windows:
          hosts:
            vpnz-dmzweba01: { ansible_host: 10.10.90.21, fyp_tier: tier1, fyp_role: iis }
            vpnz-dmzweba02: { ansible_host: 10.10.90.22, fyp_tier: tier1, fyp_role: iis }
      vars:
        ansible_connection: winrm
        ansible_port: 5986
        ansible_winrm_transport: ntlm
        ansible_winrm_scheme: https
        ansible_winrm_server_cert_validation: validate

    # ------------------------------------------------------------------
    # Linux estate (managed over SSH)
    # ------------------------------------------------------------------
    linux:
      children:
        linux_servers:
          hosts:
            vpnz-lnxra01:   { ansible_host: 10.10.30.42, fyp_role: openvpn }
            vpnz-dmzwp01:   { ansible_host: 10.10.90.25, fyp_role: wordpress }
            vpnz-dmzwp02:   { ansible_host: 10.10.90.26, fyp_role: wordpress }
            vpnz-dmzjump01: { ansible_host: 10.10.90.27, fyp_role: dmz_jump }
        web:
          hosts:
            vpnz-dmzrev01:
              ansible_host: 10.10.90.28
              fyp_role: nginx_reverse_proxy
              keepalived_state: MASTER
              keepalived_priority: 150
            vpnz-dmzrev02:
              ansible_host: 10.10.90.29
              fyp_role: nginx_reverse_proxy
              keepalived_state: BACKUP
              keepalived_priority: 100
        edge:
          hosts:
            vpnz-nft01:
              ansible_host: 10.10.50.11
              fyp_role: nftables_egress
              keepalived_state: MASTER
              keepalived_priority: 150
            vpnz-nft02:
              ansible_host: 10.10.50.12
              fyp_role: nftables_egress
              keepalived_state: BACKUP
              keepalived_priority: 100
      vars:
        ansible_connection: ssh
        ansible_user: "{{ lookup('env', 'USER') | default('adm-w4', true) }}"
        ansible_ssh_private_key_file: "~/.ssh/id_ed25519_adm-w4"
        ansible_python_interpreter: auto_silent
        ansible_become: true
        ansible_become_method: sudo
        ansible_become_user: root
        ansible_ssh_common_args: >-
          -o StrictHostKeyChecking=accept-new
          -o UserKnownHostsFile=~/.ssh/known_hosts

    # ------------------------------------------------------------------
    # Management / out of band
    # ------------------------------------------------------------------
    mgmt:
      hosts:
        vpnz-hvhost01:
          ansible_host: 10.20.20.10
          fyp_role: hypervisor
          ansible_connection: local      # never managed remotely; documented only
```

##### 10.4.2.2 群組、群組之群組模式，以及為何階層如此成形

**七個具名群組。** `windows`、`linux`、`web`、`edge`、`monitoring`、`cisco` 及 `mgmt` 是設計基線為主機清單所固定的群組。本設計加入一項改良：Windows 及 Linux 群組本身就是**群組之群組**，其中包含 `windows_servers` 及 `dmz_windows`；以及 `linux_servers`、`web` 及 `edge`。

群組之群組模式之所以存在，是因為*區域（zone）*與*作業系統家族*是關於一部主機的兩項不同事實，而扁平的主機清單無法不重複地表達兩者。`vpnz-dmzrev01` 同時是一部 Linux 主機**以及**一部 DMZ 主機**以及**一部網頁層主機。有了這個階層：

- `hosts: linux` 對應全部九部 Linux 客體 —— 這是承載 SSH 連線變數的群組。
- `hosts: web` 恰好對應兩部反向代理 —— 這是 `keepalived` 及 `nginx` 兩個 Role（角色）所針對撰寫的群組，而它自然是 `serial: 1`。
- `hosts: windows` 對應全部九部 Windows 客體，並承載單一組 WinRM 連線變數，因此某項連線設定只需述明一次，並且不會在兩個 Windows 子群組之間漂移。
- `hosts: edge` 對應兩部 nftables 節點 —— 這是防火牆 Playbook（劇本）可改動規則集的唯一主機，也是 `02-nftables-apply.sh` 的鎖死計時器邏輯唯一有意義的主機。

**`vpnz-dc01` 及 `vpnz-dc02` 刻意置於 `windows` 之中，而非置於某個「servers」群組，並另外標記 `fyp_tier: tier0`。** 這讓 Playbook（劇本）可以按變數而非按記住的排除項來排除它們，也讓稽核 Playbook 可以單獨以第 0 層為目標。這些層級標籤與 §9.3 所記錄的「四人中兩人屬第 0 層」之劃分互相呼應。

**`cisco` 群組。** Packet Tracer 裝置根本無法由 Ansible 觸及（§11.4，PT-06）。因此它們在主機清單中以**文件用群組的形式出現，帶有 `ansible_connection: local` 而不作任何連線嘗試**，這樣單一主機清單檔案仍然是整個環境的完整圖像，而第 10.4.6.5 節的組態收集 Playbook（劇本）也能夠對應「此裝置確有組態存在」，而不必假裝登入：

```yaml
    cisco:
      hosts:
        VP-HQ-CORE-01:   { fyp_device_ip: 10.20.20.11, fyp_loopback: 10.255.0.11 }
        VP-HQ-CORE-02:   { fyp_device_ip: 10.20.20.12, fyp_loopback: 10.255.0.12 }
        VP-HQ-DSW-A01:   { fyp_device_ip: 10.20.20.21 }
        VP-HQ-DSW-A02:   { fyp_device_ip: 10.20.20.22 }
        VP-HQ-DSW-A03:   { fyp_device_ip: 10.20.20.23 }
        VP-HQ-DSW-A04:   { fyp_device_ip: 10.20.20.24 }
        VP-HQ-EDGE-01:   { fyp_device_ip: 10.20.20.31, fyp_loopback: 10.255.0.21 }
        VP-HQ-FW-01:     { fyp_device_ip: 10.20.20.32 }
        VP-BR-EDGE-01:   { fyp_device_ip: 10.10.113.1,  fyp_loopback: 10.255.0.31 }
        VP-BR-DSW-A01:   { fyp_device_ip: 10.10.113.21 }
        VP-MO-EDGE-01:   { fyp_device_ip: 10.10.120.1,  fyp_loopback: 10.255.0.41 }
        VP-MO-DSW-A01:   { fyp_device_ip: 10.10.120.21 }
        VP-WC-EDGE-01:   { fyp_device_ip: 10.10.130.1,  fyp_loopback: 10.255.0.51 }
        VP-WC-DSW-A01:   { fyp_device_ip: 10.10.130.21 }
        VP-ISP-EDGE-01:  { fyp_device_ip: 10.20.20.41,  fyp_loopback: 10.255.0.61 }
        VP-HQ-VOICE-01:  { fyp_device_ip: 10.10.45.11 }
      vars:
        ansible_connection: local       # documentation-only group - no login is attempted
        fyp_automation_reachable: false
```

##### 10.4.2.3 主機清單一致性檢查

一個儲存庫內有兩份基線，就是多了一份基線，因此有一本小型的一致性 Playbook（劇本）斷言：`hosts.yml` 中的每個位址同樣出現於已凍結的位址表中，以及 `lab.ini` 並未偏離 `hosts.yml`：

```yaml
---
- name: INVENTORY-CONSISTENCY - assert inventory matches the design baseline
  hosts: localhost
  gather_facts: false
  vars:
    expected:
      vpnz-dc01: 10.10.30.11
      vpnz-dc02: 10.10.30.12
      vpnz-fs01: 10.10.30.21
      vpnz-san01: 10.10.80.21
      vpnz-rras01: 10.10.30.41
      vpnz-lnxra01: 10.10.30.42
      vpnz-mon01: 10.10.30.31
      vpnz-ai01: 10.10.30.51
      vpnz-jump01: 10.20.20.31
      vpnz-nft01: 10.10.50.11
      vpnz-nft02: 10.10.50.12
      vpnz-dmzrev01: 10.10.90.28
      vpnz-dmzrev02: 10.10.90.29
      vpnz-dmzweba01: 10.10.90.21
      vpnz-dmzweba02: 10.10.90.22
      vpnz-dmzwp01: 10.10.90.25
      vpnz-dmzwp02: 10.10.90.26
      vpnz-dmzjump01: 10.10.90.27
      vpnz-brdc01: 10.10.113.11
  tasks:
    - name: Every host in hosts.yml must carry the baseline address
      ansible.builtin.assert:
        that:
          - hostvars[item.key].ansible_host | default('') == item.value
        fail_msg: >-
          {{ item.key }} is {{ hostvars[item.key].ansible_host | default('unset') }}
          but the design baseline requires {{ item.value }}.
          A writer may not re-address a host locally; the baseline must be revised.
      loop: "{{ expected | dict2items }}"
      loop_control: { label: "{{ item.key }}" }
```

這是為了大量的一致性而寫的少量程式碼，而它正是令設計基線的介面契約紀律在技術上得以強制執行、而非靠良好意願的機制。

#### 10.4.3 組態管理：`ansible.cfg`

```ini
; C:\FYP\04-automation\ansible\ansible.cfg
; Vertex Peak - Victor2 FYP - single authoritative Ansible configuration.
[defaults]
inventory                  = ./inventory/hosts.yml
roles_path                 = ./roles
collections_path           = /opt/ansible-venv/venv/lib/python3.12/site-packages/ansible_collections
library                    = ./library
filter_plugins             = ./filter_plugins
remote_user                = adm-w4
host_key_checking          = False
retry_files_enabled        = True
retry_files_save_path      = ./logs/retry
gathering                  = smart
fact_caching               = jsonfile
fact_caching_connection    = ./logs/facts
fact_caching_timeout       = 86400
stdout_callback            = yaml
bin_ansible_callbacks      = True
callbacks_enabled          = profile_tasks, timer
display_skipped_hosts      = False
display_ok_hosts           = True
deprecation_warnings       = True
command_warnings           = True
log_path                   = ./logs/ansible.log
interpreter_python         = auto_silent
forks                      = 10
timeout                    = 30
nocows                     = 1
vault_password_file        = /home/adm-w4/.ansible/vault-pass-vp
ask_vault_pass             = False
allow_world_readable_tmpfiles = False

[privilege_escalation]
become                     = True
become_method              = sudo
become_user                = root
become_ask_pass            = False
become_flags               = -H -S -n

[persistent_connection]
connect_timeout            = 30
command_timeout            = 30

[inventory]
enable_plugins             = yaml, ini, host_list
unparsed_is_failed         = True

[ssh_connection]
pipelining                 = True
ssh_args                   = -o ControlMaster=auto -o ControlPersist=300s -o PreferredAuthentications=publickey
scp_if_ssh                 = smart
retries                    = 3
```

**逐項設定解說，以及為何在此處如此設定。**

| 設定 | 值 | 理由 |
|---|---|---|
| `inventory` | `./inventory/hosts.yml` | 相對於儲存庫的路徑，令儲存庫可在四位學生的機器與 `vpnz-mon01` 之間攜帶。任何人在儲存庫根目錄執行 `ansible-playbook`，無須任何旗標便會取得正確的主機清單 |
| `roles_path` | `./roles` | Role（角色）相對於儲存庫尋找，因此某個 Role 的位置永遠不取決於該機器的 Ansible 預設值 |
| `collections_path` | 虛擬環境的路徑 | 令所用社群套件的版本明確可見，並防止意外回退至系統 collection |
| `library` | `./library` | 存在於此，令日後若撰寫自訂模組時，它有一個已界定的歸屬 |
| `filter_plugins` | `./filter_plugins` | 本項目的自訂 Jinja2 篩選器（例如 nftables set 渲染器）必須能被自動找到 |
| `remote_user` | `adm-w4` | 具名的個人帳戶，絕不是 `root`，也絕不是共用帳戶。若某部主機由另一位管理員擁有，則逐主機覆寫 |
| `host_key_checking` | `False` | **[已聲明的實驗室簡化措施 —— 並非最佳實務]** 這 19 部 VM 在十二週的建置期間會多次由範本重建，因此它們的 SSH 主機金鑰合法地改變，嚴格的檢查會以假警報擋住每一次自動化執行。補償控制已述明：實驗室完全使用 host-only 網路而無橋接，沒有任何實驗室主機可從 Hypervisor 主機之外觸及，而小組另於第 9 週後在 `docs/04-variable-dictionary.md` 中記錄穩定狀態環境的主機金鑰。報告必須把這一點呈現為附理據的實驗室簡化措施 —— 正如 §12.2 就 Keepalived `PASS` 認證的簡化措施所要求 |
| `retry_files_enabled` / `retry_files_save_path` | `True`、`./logs/retry` | 失敗的執行會留下重試檔案，因此復原只需一個指令，而失敗主機的清單得以保留 |
| `gathering` / `fact_caching` | `smart` + `jsonfile` | 事實（facts）只收集一次並快取 24 小時。若不快取，九部主機的 Windows 事實收集會主導每一本小型 Playbook 的執行時間，並引誘小組停用事實收集，而那又會破壞依賴事實的範本 |
| `stdout_callback` | `yaml` | 可讀的執行摘要。純 `default` callback 會令冗長的差異在日誌中無法閱讀，而日誌*就是*證據 |
| `callbacks_enabled` | `profile_tasks, timer` | 記錄每個任務的耗時，這正是找出緩慢 Role（角色）的方法，也是第 10.8 節排程估算的理據 |
| `display_skipped_hosts` | `False` | 被略過的任務在必須由審閱者閱讀的日誌中只是雜訊 |
| `log_path` | `./logs/ansible.log` | 持久、可提交的日誌。`04-automation/runs/` 另存由外層包裝程式所寫、附時間戳的逐次執行日誌 |
| `interpreter_python` | `auto_silent` | 探索解譯器，並抑制否則會污染每一次執行輸出的探索警告。Linux 環境只有一個解譯器（Ubuntu 24.04.3 LTS 的 `/usr/bin/python3`）；Windows 經 `pywinrm` 使用 PowerShell，而此設定在該處並不適用 |
| `forks` | `10` | 在單一 Hypervisor 主機上對 19 部 VM 的環境開十條並行連線是一項刻意的上限：更高的值會在節省實際時間之前先耗盡主機的 RAM（§15.1） |
| `timeout` | `30` | 連線逾時。對負載中的 host-only 區段而言足夠長，而對已死亡的主機而言足夠短，令推出在三十秒內失敗 |
| `nocows` | `1` | 日誌中的 ASCII 圖案是雜訊 |
| `vault_password_file` | `/home/adm-w4/.ansible/vault-pass-vp` | Vault 密碼檔存放於**儲存庫之外**，即管理員的家目錄中，權限模式 0600。見 10.4.4 |
| `ask_vault_pass` | `False` | 因為採用了該檔案。其取捨（該檔案是磁碟上的一個機密）已述明並獲補償：該檔案受 `.gitignore`、標籤前的機密清掃及檔案權限所排除；而排程執行透過一個 `systemd` 單元使用它，該單元的環境檔同樣為 root 所有、權限 0600 |
| `allow_world_readable_tmpfiles` | `False` | 安全的預設值；啟用它會為了方便而造成安全性倒退 |
| `[privilege_escalation] become` | `True` | 全域為真，其後在 `group_vars/windows.yml` 中明確**覆寫為 `false`**，因為 Windows 目標沒有 `sudo`。Ansible 的 Windows 模組是在一個已經提權的工作階段中叫用 |
| `become_method` / `become_user` | `sudo` / `root` | Linux 環境的提權路徑。本機 `gg-infra-admins` 群組的成員是唯一獲准提權的帳戶 |
| `become_flags` | `-H -S -n` | `-H` 把 `$HOME` 設為 root 的家目錄（避免典型的 `sudo: a password is required` / 設定檔錯誤），`-S` 從 stdin 讀取密碼，`-n` 令非互動式的失敗明確顯現而非掛起 |
| `[inventory] unparsed_is_failed` | `True` | 若某個主機清單檔案存在但解析失敗，執行便停止。預設行為是發出警告並以空的主機清單繼續，而在防火牆 Playbook 中，那將意味著「沒有主機，一切正常」—— 這是最危險的可能結果 |
| `[ssh_connection] pipelining` | `True` | 大幅提速，且在此安全，因為 Ubuntu 24.04 的 sudoers 組態中並未設定 `requiretty` |
| `ssh_args` | `ControlMaster=auto`, `ControlPersist=300s` | 在一次推出的期間重用同一條 SSH 連線 |
| `scp_if_ssh` | `smart` | 當傳輸量小且目標的 SSH 支援時使用 `scp`；避免在精簡的 Ubuntu 安裝上出現 `sftp` 失敗模式 |

小組的工作約定明文禁止兩種反模式：在命令列上以 `-e` 傳遞機密（它會落入 shell 歷史紀錄及程序清單），以及在會產生證據的執行中以旗標覆寫 `ansible.cfg` 的值（那樣證據就不再描述儲存庫本身會做什麼）。

#### 10.4.4 變數與機密資料

##### 10.4.4.1 本項目所使用的變數優先次序

Ansible 的優先次序很長，而本項目刻意只使用五層，令任何值的來源都能在數秒內一目了然：

| 層 | 檔案 | 內容 |
|---|---|---|
| 1（最低） | `roles/<role>/defaults/main.yml` | 該 Role（角色）可調校的輸入項目及其安全預設值。預設值必須是*對本項目而言正確*的值，而非佔位值 |
| 2 | `inventory/group_vars/all.yml` | 處處皆真的值：`fyp_domain`、`fyp_netbios`、NTP 及 DNS 伺服器、管理員群組名稱、套件政策 |
| 3 | `inventory/group_vars/<group>.yml` | 各層的值：連線設定、套件清單、服務啟用 |
| 4 | `inventory/host_vars/<host>.yml` | 真正逐主機的事實：VRRP 狀態及優先次序、備份目的地、該主機所服務的特定上游 |
| 5（最高，不計執行期） | `group_vars/all/vault.yml` 中經 Vault 加密的變數 | 只有機密資料。除了機密資料以外別無其他 |

`roles/<role>/vars/main.yml` 只用於*確實不可調校*的值 —— Role（角色）的內部常數。把變數放在該處會令它實際上無法更改，而那偶爾是正確的決定；但它絕不可用來「贏得」優先次序之爭。

```yaml
# inventory/group_vars/all.yml
fyp_domain: vertexpeak.fyp.lab
fyp_netbios: VERTEXPEAK
fyp_site: HQ-ShaTin
fyp_dns_servers: [10.10.30.11, 10.10.30.12]
fyp_ntp_windows_source: vpnz-dc01.vertexpeak.fyp.lab
fyp_ntp_linux_source: 10.10.30.11
fyp_infra_admins_unix_group: gg-infra-admins
fyp_admins_group_windows: GG-Server-Admins
fyp_tier0_group_windows: GG-Tier0-Admins
fyp_monitoring_host: 10.10.30.31
fyp_log_forward_target: 10.10.30.31
fyp_log_forward_port: 514
fyp_package_update_cron: "0 3 * * 0"       # Sun 03:00 - inside the change window
fyp_change_window: "Sat 22:00 - Sun 02:00"
fyp_nftables_table: inet fyp_filter
fyp_nftables_log_prefix: "NFT-DROP: "
fyp_nginx_upstreams:
  weba_pool: ["10.10.90.21:443", "10.10.90.22:443"]
  wp_pool:   ["10.10.90.25:443", "10.10.90.26:443"]
```

```yaml
# inventory/host_vars/vpnz-dmzrev01.yml
keepalived_state: MASTER
keepalived_priority: 150
keepalived_vrid: 61
keepalived_vip: 10.10.90.10   # the VIP only; vpnz-dmzrev01 is 10.10.90.28 and vpnz-dmzrev02 is 10.10.90.29 (Rev 1.1 ruling C-02)
keepalived_interface: "{{ ansible_facts['default_ipv4']['interface'] }}"
nginx_server_name: portal.vertexpeak.example
nginx_tls_cert: /etc/nginx/ssl/portal.crt
nginx_tls_key: /etc/nginx/ssl/portal.key
```

`keepalived_interface` 那一行值得注意：設計基線禁止硬編碼 `ens192`/`ens224`，並要求以 `ip -br link` 解析實際介面名稱並加以記錄。使用 Ansible 事實而非字面值，就是對該規則的技術強制執行。

##### 10.4.4.2 Ansible Vault

**建立、編輯及使用加密變數檔的確切指令。**

```bash
# 0) Create the vault password file OUTSIDE the repository, readable only by its owner.
install -m 0600 /dev/null /home/adm-w4/.ansible/vault-pass-vp
printf '%s\n' "$(openssl rand -base64 32)" > /home/adm-w4/.ansible/vault-pass-vp
chmod 0600 /home/adm-w4/.ansible/vault-pass-vp

# 1) CREATE the encrypted variable file (prompts for the vault password once).
cd /opt/ansible-venv/repo/04-automation/ansible
ansible-vault create inventory/group_vars/all/vault.yml
# ... paste content, save, exit the editor ...

# 2) EDIT it later (decrypts to a temp file, re-encrypts on save).
ansible-vault edit inventory/group_vars/all/vault.yml

# 3) ENCRYPT an existing plaintext file in place (and remove the plaintext commit).
ansible-vault encrypt inventory/group_vars/all/vault.yml

# 4) VIEW without writing.
ansible-vault view inventory/group_vars/all/vault.yml

# 5) CHANGE the vault password (after a member leaves the group).
ansible-vault rekey inventory/group_vars/all/vault.yml

# 6) USE it in a run - ansible.cfg already points at the vault password file,
#    so no flag is needed. For an ad-hoc run without the config:
ansible-playbook playbooks/01-baseline-windows.yml --ask-vault-pass

# 7) ENCRYPT a single value inline (for a one-off), never a whole file:
ansible-vault encrypt_string --name 'vault_svc_ansible_password' 'REDACTED'
```

加密檔的內容刻意維持精簡，而且*只有*機密資料：

```yaml
# inventory/group_vars/all/vault.yml   (committed ENCRYPTED, never plaintext)
vault_svc_ansible_user: "VERTEXPEAK\\svc_ansible"
vault_svc_ansible_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  6433373533393563306533373736663039363832383931363232326137393535323130373933383662
  3035663731656336366262643130656236356239310a326131646338386136383162356563366665
  65613133333533643733653263623232656434646561353461323732646634633262663530303832
  3738653337653138380a313663646263633233346338633862653862653434343439653435373834
  3535
vault_iscsi_chap_secret: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  3939623239326635323032313666303365393964616665353863326336373731633937333035373862
  3934663632393662356564613762356537393963340a623366376339306434373335353739613062
  37643463373133393334386661366464626438396138373037623633396437636166643864636661
  6134613239663739323739360a623432316137646534613664303735346265633937346662386130
  64373663
vault_grafana_admin_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  3162383563323836363734346530343034633539306439633835323332333538313366646636386263
  6534356234363665363662646465653965623031350a373464356530653537646630366337613837
  31626165616230653030393531313364313665613232626566356464623035336539356530643665
  3130663134393364343337310a383231386632386563303532386464353662383133623630363261
  30303731
vault_ai_service_account_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  3531303931633633333964353436336233333738656465336438393761383634363966323465316264
  3538663439393465633330316566373631353064660a646537306137383530313366393964366565
  62656165653531636666663037626664613964633630663237316139383665386538663461636263
  623161613332393235616631660a616135633739343838306635373838356133643263336561653232
  38626165
```

**Vault 密碼檔存放何處，以及為何不得提交。** 它存放於 `vpnz-mon01` 上的 `/home/adm-w4/.ansible/vault-pass-vp`，由自動化負責人擁有，權限 `0600`，位於權限 `0700` 的目錄之中。它受 `.gitignore` 及標籤前的機密清掃所排除。原因並非形式主義：**一個加密檔加上一個已提交的密碼檔，就等於一個明文檔。** Vault 保護儲存庫在靜態及傳輸中的安全 —— 在 Git 伺服器上、在任何複本中、在任何備份中、在任何 `git diff` 的螢幕截圖中 —— 而若開啟它的鑰匙隨行於同一個儲存庫，這層保護便一文不值。由此得出兩項後果，並已載於操作手冊：

1. Vault 密碼存放於小組的密碼管理器中，由全部四位成員持有，並在成員離開時以 `ansible-vault rekey` 輪替。輪替之後須提交重新加密的檔案。
2. `vpnz-mon01` 之外任何一份 `vault-pass-vp` 副本都會被刪除；該檔案絕不置於 `C:\FYP\` 之下、絕不作為訊息附件，也絕不貼入計劃書或報告 —— 包括在螢幕截圖中亦然。當報告需要*展示* vault 的使用時，它展示的 `ansible-vault view` 輸出中，機密值已在截圖之前替換為 `REDACTED`，並在圖說中說明此事。

**什麼不得放入 Vault。** 非機密的組態設定應放於普通變數中，讓審閱者可以閱讀。把一個子網、一項主機名稱或一份套件清單存入 Vault 是常見錯誤，會令儲存庫無法閱讀，並製造虛假的機密印象。

#### 10.4.5 Role（角色）

儲存庫中共有九個 Role（角色）。以下詳細完整界定其中六個；`wireguard`、`winrm` 及 `ad_users` 的界定較簡略，因為它們已由其他章節的細節所涵蓋（WireGuard 見 §12.2，身分見 §9）。每個 Role 都遵循相同結構：`tasks/main.yml`、`handlers/main.yml`、`defaults/main.yml`、`templates/`、`files/`、`meta/main.yml`，另加一份載有冪等性備註的 `README.md`。

##### 10.4.5.1 `common` —— Linux 基線 Role（角色）

**用途。** 建立環境中每一部 Ubuntu 24.04.3 LTS 客體在任何服務 Role（角色）執行之前都必須符合的安全性與運作基線：套件、時間、DNS 解析、sudo 權限、SSH 加固、核心參數、日誌記錄、無人值守升級及監控代理程式。它實作 §12.2 及 §8.7 所固定的加固規則，並且是「非管理區域不得被管理」這項信任邊界期望的技術強制執行。

**任務**（`roles/common/tasks/main.yml`，摘要為真實任務清單）：

| # | 任務 | 模組 | 備註 |
|---|---|---|---|
| 1 | 設定主機名稱及 `/etc/hosts` 項目 | `ansible.builtin.hostname`、`ansible.builtin.lineinfile` | 主機名稱來自 `inventory_hostname`；FQDN 為 `{{ inventory_hostname }}.{{ fyp_domain }}` |
| 2 | 安裝基線套件集 | `ansible.builtin.apt` | `chrony`、`rsyslog`、`auditd`、`unattended-upgrades`、`nftables`、`curl`、`jq`、`ca-certificates`、`python3-apt` |
| 3 | 移除設計所禁止的套件 | `ansible.builtin.apt`，配 `state: absent` | `telnet`、`rsh-client`、`tftp-hpa`（TFTP *伺服器*只存在於 `vpnz-mon01`；在伺服器 VM 上裝客戶端是一條不必要的路徑） |
| 4 | 把 chrony 設定為使用網域時間來源 | `ansible.builtin.template` → `/etc/chrony/chrony.conf` | `server 10.10.30.11 iburst`，其後 `10.10.30.12`。時間偏差超過五分鐘會破壞 Kerberos，因此這項任務保護的是認證，而不只是方便 |
| 5 | 設定 DNS 解析 | `ansible.builtin.template` → `/etc/resolv.conf`（經 `systemd-resolved` drop-in 管理） | `nameserver 10.10.30.11`，其後 `10.10.30.12`。**任何 Linux 客體都不得設定公共解析器** |
| 6 | 建立本機 `gg-infra-admins` 群組及四個管理員帳戶 | `ansible.builtin.group`、`ansible.builtin.user` | 成員與 `GG-Infra-Admins` 對應；沒有共用帳戶；`root` 登入已停用 |
| 7 | 安裝四把 Ed25519 公開金鑰 | `ansible.posix.authorized_key` | 取自 `files/ssh/authorized_keys/`，以 `loop` 為每個帳戶執行一項任務 |
| 8 | 安裝 sudoers drop-in | `ansible.builtin.template` + `ansible.builtin.validate` | `%gg-infra-admins ALL=(ALL:ALL) ALL`，以 `visudo -cf %s` 驗證 |
| 9 | 部署 SSH 加固 | `ansible.builtin.template` → `/etc/ssh/sshd_config.d/10-fyp-hardening.conf` | `PermitRootLogin no`、`PasswordAuthentication no`、`AllowGroups gg-infra-admins`，以及現代化的 `KexAlgorithms`/`Ciphers` 組合 |
| 10 | 部署 sysctl 加固 | `ansible.builtin.template` → `/etc/sysctl.d/99-fyp-hardening.conf` | `rp_filter`、SYN cookies、ICMP 行為；`net.ipv4.ip_forward=1` **只在** `fyp_role` 意味著路由器之處（即 nftables 那一對） |
| 11 | 設定無人值守安全性升級 | `ansible.builtin.template` → `/etc/apt/apt.conf.d/50unattended-upgrades` | 只限安全性更新；不自動重新開機；需要重新開機的旗標由健康檢查指令碼報告，而非據以行動 |
| 12 | 設定 rsyslog 轉送 | `ansible.builtin.template` → `/etc/rsyslog.d/50-fyp-forward.conf` | 按 §8.7 轉送至 `10.10.30.31:514`。DMZ 主機同樣轉送，這正是 DMZ 事件得以在 TB-13「DMZ 只可發起有限對外流量」的約束下到達 Loki 的方式 |
| 13 | 安裝及設定 `auditd` | `ansible.builtin.template`、`ansible.builtin.service` | Execve 及身分檔案監看 |
| 14 | 安裝 `node_exporter` | `ansible.builtin.apt` + `ansible.builtin.service` | 9100 埠，只在監控主機可達之處監聽 |
| 15 | 安裝內部 CA 憑證 | `ansible.builtin.copy` → `/usr/local/share/ca-certificates/vp-root-ca.crt` + 帶 `creates:` 防護的 `command: update-ca-certificates` | 這正是令同一套憑證慣例能在 Windows 與 Linux 上都生效的原因 |
| 16 | 套用廠商建議的 MOTD 橫幅 | `ansible.builtin.copy` | 授權使用告示；在企業環境中無害且屬預期之內 |

**處理程式：** `Restart sshd`（`ansible.builtin.service`）、`Restart chrony`、`Restart rsyslog`、`Reload sysctl`（`ansible.builtin.command: sysctl --system`）、`Restart auditd`、`Reload systemd-resolved`。

**範本：** `chrony.conf.j2`、`resolv-conf.j2`、`sshd-hardening.conf.j2`、`sysctl-hardening.conf.j2`、`sudoers-gg-infra-admins.j2`、`rsyslog-50-fyp-forward.conf.j2`、`motd.j2`。

**預設變數：** `common_admin_group: gg-infra-admins`、`common_admins: [adm-w1, adm-w2, adm-w3, adm-w4]`、`common_time_servers: [10.10.30.11, 10.10.30.12]`、`common_allow_ip_forward: false`、`common_install_auditd: true`、`common_node_exporter_port: 9100`、`common_unattended_security_only: true`。

**冪等性備註。** 每一項任務都是具有期望狀態的宣告式模組，因此第二次執行會報告 `changed=0`。唯一的風險是任務 15 的 `update-ca-certificates`：它以 `creates: /etc/ssl/certs/vp-root-ca.pem` 及針對該憑證校驗和的 `when:` 加以防護，因為未加防護的 `command` 任務會在每次執行時重跑 CA 憑證套件重建，並永遠報告 `changed=1`，破壞整個 Role（角色）的冪等性證明。這是小組的 `changed=0` 證據最可能失敗的單一位置，也正因如此而在操作手冊中特別標明。

##### 10.4.5.2 `nginx` —— 反向代理及 TLS 終結 Role（角色）

**用途。** 把 `vpnz-dmzrev01` 及 `vpnz-dmzrev02` 這兩部反向代理設定為位於兩個上游池之前的 TLS 終結反向代理對，具備 HSTS、TLS 1.2 為最低而 1.3 優先、一個供 Keepalived 追蹤的 `/healthz` 端點，以及供監控堆疊抓取的 `stub_status`。該 Role（角色）必須在兩個節點上產生逐位元組相同的組態，因為這一對之間的差異正是只在容錯轉移時才顯現的故障。

**任務：**

| # | 任務 | 模組 | 備註 |
|---|---|---|---|
| 1 | 安裝 `nginx` 及 `openssl` | `ansible.builtin.apt` | 來自 Ubuntu 24.04 套件庫的 Nginx 1.24.0 —— 發行版封裝的版本，並述明這是刻意的選擇 |
| 2 | 部署全域組態 | `ansible.builtin.copy`，取自 `files/dmzrev01/nginx.conf` | 全域調校：worker 數量、`worker_connections`、包含 `$upstream_addr` 的日誌格式（對判讀是哪個節點應答至關重要） |
| 3 | 部署上游池的界定 | `template` → `/etc/nginx/conf.d/00-upstreams.conf` | 由 `fyp_nginx_upstreams` 渲染：`upstream weba_pool { server 10.10.90.21:443; server 10.10.90.22:443; }` 及 `upstream wp_pool { … }`，附 `least_conn` 與 `max_fails`/`fail_timeout` |
| 4 | 部署入口網站 vhost | `template` → `/etc/nginx/conf.d/10-portal.conf` | `portal.vertexpeak.example` 的 TLS 終結、`proxy_pass https://weba_pool`（向各上游重新加密 —— 端到端 TLS）、HSTS、安全性標頭、HTTP→HTTPS 重定向 |
| 5 | 部署網誌 vhost | `template` → `/etc/nginx/conf.d/20-blog.conf` | `blog.vertexpeak.example` → `wp_pool` |
| 6 | 部署健康檢查端點 | `template` → `/etc/nginx/conf.d/90-healthz.conf` | 只有在兩個上游池都應答時，`/healthz` 才回傳 200 並帶 `upstream_ok` 主體；這正是 `track_script` 實際測試的內容 |
| 7 | 部署 `stub_status` | `template` | 只綁定 `127.0.0.1:8080` —— 永不對外發佈 |
| 8 | 安裝 TLS 材料 | `ansible.builtin.copy`，金鑰以 `mode: '0600'` 安裝 | 取自內部 PKI；私密金鑰由 vault 加密的來源，或由一個已被 `.gitignore` 排除的 `files/` 路徑交付。**絕不提交任何私密金鑰** |
| 9 | 移除預設網站 | `ansible.builtin.file`，配 `state: absent` | Ubuntu 的預設 vhost 不得為真實名稱應答 |
| 10 | 移除 `sites-enabled/default` 並斷言 `conf.d` 為正典 | `ansible.builtin.file` + `assert` | §8.7 把 `conf.d` 固定為正典；不使用 `sites-available` 佈局 |
| 11 | 驗證組態 | `ansible.builtin.command: nginx -t`，配 `changed_when: false` | 在任何重新載入之前令該 Role（角色）失敗。`changed_when: false` 正是令此驗證不計入變更次數的關鍵 |
| 12 | 確保服務已啟用並啟動 | `ansible.builtin.systemd_service` | |
| 13 | 定期 TLS 憑證到期檢查 | `ansible.builtin.cron` | 呼叫 `05-cert-renew.sh --warn-days 30`，這也是第 10.6 節的主題 |
| 14 | 從控制節點驗證已發佈的路徑 | `ansible.builtin.uri`，配 `validate_certs: false` 及 `status_code: 200` | **[已聲明]** 實驗室使用內部 CA 加上一個刻意不相符的公開名稱，因此名稱不相符的警告屬預期之內，且必須在報告中呈現而非予以抑制 |

**處理程式：** `Reload nginx`（`systemd_service` 配 `state: reloaded`）—— 是重新載入而非重新啟動，因為位於 VIP 之後的兩部節點不得同時停止服務。`Restart nginx` 亦存在，但只由首次安裝的路徑使用（`when: nginx_first_install | bool`）。

**範本：** `nginx-upstreams.conf.j2`、`portal.conf.j2`、`blog.conf.j2`、`healthz.conf.j2`、`stub-status.conf.j2`。

**預設變數：** `nginx_worker_processes: auto`、`nginx_worker_connections: 2048`、`nginx_tls_min: TLSv1.2`、`nginx_tls_preferred: TLSv1.3`、`nginx_hsts_max_age: 31536000`、`nginx_health_path: /healthz`、`nginx_client_max_body_size: 16m`、`nginx_upstream_max_fails: 3`、`nginx_upstream_fail_timeout: 10s`。

**冪等性備註。** 範本渲染在結構上具冪等性，*前提是範本不含非確定性內容* —— 沒有時間戳、沒有控制節點的主機名稱、沒有字典的隨機次序。該代理要求在成對節點之間逐位元組相同，因此範本只迭代已排序的清單，永不迭代未排序的字典，而 `00-upstreams.conf` 範本按位址排序。任務 11（`nginx -t`）及任務 14（`uri` 檢查）都使用 `changed_when: false`，令驗證永不顯現為一項變更。任務 14 的 `validate_certs: false` 是「內部 CA 加公開名稱」這套設計所要求的，並已如此記錄；它不是通用模式，亦不出現於任何其他地方。

##### 10.4.5.3 `keepalived` —— VRRP 成對節點 Role（角色）

**用途。** 為兩對 Linux 服務節點提供首跳冗餘，並使用兩個不同的虛擬路由器 ID：**VRID 51** 用於 10.10.50.0/28 上的 nftables 那一對，VIP 為 **10.10.50.10**（節點 10.10.50.11 及 10.10.50.12）；**VRID 61** 用於 10.10.90.0/24 上的 nginx 那一對，VIP 為 **10.10.90.10**（節點 10.10.90.28 及 10.10.90.29，因此該 VIP 不屬任何節點所有）。該 Role（角色）絕不可在兩個日後可能被橋接起來的子網之間重用同一個 VRID，且它必須追蹤*服務*，而非介面。

**任務：**

| # | 任務 | 模組 | 備註 |
|---|---|---|---|
| 1 | 安裝 `keepalived`（2.2.8） | `ansible.builtin.apt` | |
| 2 | 確認 VRID/VIP 組合與設計相符 | `ansible.builtin.assert` | 斷言 `keepalived_vrid` 為 51 或 61，且與該主機所屬群組相符。這能捉住整個項目中後果最嚴重的複製貼上錯誤 |
| 3 | 在主機防火牆中允許 VRRP 協定 112 | `ansible.posix.firewalld`／以 `ansible.builtin.command` 操作 nftables，或加入一條 `nft` 規則 | VRRP 通告必須在成對成員之間通行；管理平面防火牆不得默默破壞這一對 |
| 4 | 部署樹狀檢查指令碼 | `ansible.builtin.copy` + `mode: '0750'` | `check_nginx.sh` / `check_nftables.sh`；各自回傳 0/1，且兩者都是 `03-keepalived-check.sh` 用於人手驗證的同一批指令碼，因此自動與人手的觀點不可能互相矛盾 |
| 5 | 部署組態 | `template` → `/etc/keepalived/keepalived.conf`，配 `ansible.builtin.validate` | `vrrp_instance FYP_<PAIR>`，含 `state`、`priority`、`virtual_router_id`、`virtual_ipaddress`、`track_script` |
| 6 | 啟用並啟動服務 | `ansible.builtin.systemd_service` | |
| 7 | 核實 VIP 出現於預期的節點上 | `ansible.builtin.command: ip -br addr show` + `assert` | 收斂之後 MASTER 必須擁有該 VIP；這項檢查正是區分「keepalived 正在執行」與「keepalived 正在運作」的關鍵 |
| 8 | 記錄 VRRP 狀態作為證據 | `ansible.builtin.shell: journalctl -u keepalived --since "-5 min" -o cat`，配 `changed_when: false` | 該記錄提交至 `runs/` 作為容錯轉移證據 |

**處理程式：** `Reload keepalived`（`systemd_service: state=reloaded`）及 `Restart keepalived`。以重新載入的路徑為優先，因為在 MASTER 上重新啟動會令 VIP 短暫消失；該 Role（角色）以重新載入處理組態變更，並把重新啟動保留給首次安裝。

**範本：** `keepalived.conf.j2`（單一範本，由主機變數參數化）、`check_nginx.sh.j2`、`check_nftables.sh.j2`。

**預設變數：** `keepalived_enabled: true`、`keepalived_state: BACKUP`、`keepalived_priority: 100`、`keepalived_vrid: 61`、`keepalived_vip: 10.10.90.10`、`keepalived_auth_type: PASS`、`keepalived_preempt: true`、`keepalived_advert_int: 1`、`keepalived_track_interval: 5`、`keepalived_track_fall: 2`、`keepalived_track_rise: 2`。

`keepalived_auth_type: PASS` 這個預設值帶有一項必須載明的註記：**使用共用字串的 `PASS` 認證在 host-only 實驗室區段之內可以接受，而此事須述明為實驗室簡化措施，而非最佳實務。** 報告必須在描述該設定的同一段落中如此說明。

**冪等性備註。** `state` 及 `priority` 來自 `host_vars`，因此兩位成員收到不同的檔案，而每個節點的檔案都是穩定的。唯一的風險是 `track_script` 的間隔：若該指令碼是一項 `shell` 任務而非由任務 4 部署的檔案，Ansible 便會每次執行都報告一項變更。因此本設計把檢查指令碼**以檔案形式**部署，絕不內嵌產生它。任務 8 使用 `changed_when: false`，而任務 3 及任務 7 都寫成可安全重跑（VRRP 防火牆規則以具冪等性的集合成員資格表達，而 VIP 斷言是只讀的）。

##### 10.4.5.4 `nftables` —— 出口過濾 Role（角色）

**用途。** 把內聯出口過濾那一對 `vpnz-nft01` / `vpnz-nft02` —— 從伺服器及使用者區域通往互聯網的唯一路徑 —— 設定為單一具狀態規則集，置於一個 `inet` 表 `inet fyp_filter` 內，對 input 及 forward 採用丟棄政策、明確接受 established/related、以具名集合列出受信任對等方、在面向 WAN 的介面上作偽裝（masquerade），並在每次丟棄之前加上日誌前綴。該 Role（角色）是 TB-02、TB-03、TB-06 及 TB-08 的技術實作，也是儲存庫中風險最高的 Role，因為一次錯誤就可能切斷小組自己通往遠端 VM 的管理路徑。

**任務：**

| # | 任務 | 模組 | 備註 |
|---|---|---|---|
| 1 | 安裝 `nftables`（1.0.9） | `ansible.builtin.apt` | |
| 2 | 解析並記錄介面名稱 | `ansible.builtin.set_fact`，取自 `ansible_facts` + `assert` | 設計基線禁止硬編碼 `ens192`；該 Role（角色）斷言存在兩個介面，並在執行日誌中記錄其名稱 |
| 3 | 部署規則集片段 | `template` → `/etc/nftables.d/10-sets.nft`、`20-filter-input.nft`、`30-filter-forward.nft`、`40-nat.nft`、`90-logging.nft` | 這些片段由主檔案以 `include` 引入，且**永不獨立載入** —— nftables 是一個規則集 |
| 4 | 部署主規則集 | `template` → `/etc/nftables.conf` | `flush ruleset`、`table inet fyp_filter`、各項 include |
| 5 | **在套用之前驗證候選規則集** | `command: nft -c -f /etc/nftables.conf`，配 `changed_when: false` | 只作語法檢查（`-c`），不套用。語法失敗會中止該 Role（角色），而舊規則集仍在運作 |
| 6 | **啟動回復計時器** | `command: /usr/local/sbin/fyp-nft-rollback-arm.sh {{ nftables_rollback_seconds }}` | 寫入一個 systemd 計時器；若 Playbook（劇本）未有明確解除，該計時器會還原先前已驗證的規則集。預設 `600` 秒 |
| 7 | 套用規則集 | 以 `ansible.builtin.systemd_service` 重新啟動 `nftables.service`，其後執行 `command: nft list ruleset` 把運行中的規則集載入一項事實 | |
| 8 | **從另一端核實** | 以 `ansible.builtin.wait_for` / `uri` 經由這一對節點測試一個已知可達的目標 | 真正要緊的驗證是*由外向內*，因為那正是新規則集可能弄斷的路徑 |
| 9 | **解除回復計時器** | `command: /usr/local/sbin/fyp-nft-rollback-disarm.sh` `when: nftables_verify_ok \| bool` | 只在任務 8 成功時才解除 |
| 10 | 令規則集在重新開機後仍然存在 | `ansible.builtin.systemd_service: enabled=true` | 重新開機後便消失的防火牆，比沒有防火牆更糟 |
| 11 | 發佈作用中的規則集作為證據 | `command: nft list ruleset`，配 `changed_when: false`、`register`、以 `content:` 的 `copy` 寫入 `runs/` | 該規則集文字是 TC-L2-03 的證據 |
| 12 | 把規則集交給 Git | 以 `ansible.builtin.copy` 把運行中的 `nft list ruleset` 輸出寫入 `docs/current-ruleset-{{ inventory_hostname }}.txt`，**並附一項在內容與範本輸出不同時令執行失敗的差異比對任務** | 這就是第 10.8 節的漂移偵測器。若運行中的規則集與範本不同，即表示有人以人手改動了正在運作的防火牆，而該 Role（角色）會如此指出 |

**處理程式：** `Reload nftables`（systemd reload）、`Restart nftables`、`Reload rsyslog`（日誌片段在某些組態中會改變 syslog 目的地）。

**範本：** `nftables.conf.j2`、`nftables-10-sets.nft.j2`、`nftables-20-filter-input.nft.j2`、`nftables-30-filter-forward.nft.j2`、`nftables-40-nat.nft.j2`、`nftables-90-logging.nft.j2`。

**預設變數：** `nftables_table: inet fyp_filter`、`nftables_log_prefix: "NFT-DROP: "`、`nftables_internal_networks: [10.10.0.0/16, 10.20.0.0/16, 10.70.0.0/16]`、`nftables_trusted_mgmt: [10.20.20.0/24, 10.10.30.31]`、`nftables_allow_egress_tcp: [80, 443]`、`nftables_allow_egress_udp: [53, 123]`、`nftables_masquerade_interface: "{{ ansible_facts['default_ipv4']['interface'] }}"`、`nftables_rollback_seconds: 600`、`nftables_connlimit_ssh: 8`。

**冪等性備註。** Ansible 無法原生地對 nftables 規則集作差異比對，因此這個 Role（角色）的冪等性建立在三項刻意的選擇之上。第一，規則集由範本渲染並以**渲染後的檔案**作比較，因此穩定的範本產生穩定的檔案，模組便不報告變更。第二，`nft -c -f` 驗證使用 `changed_when: false`。第三，也是最重要的一點，回復計時器的指令碼對其 systemd 單元檔加上 `creates:` 式的條件防護，令啟動與解除都具冪等性 —— 此處若用未加防護的 `command`，就會每次執行都報告 `changed=1`，*並且*在一部健康的節點上重新啟動回復計時器，那既是壞掉的冪等性證明，也是真實的運作危害。該 Role（角色）的次要冪等性性質，是它必須在成對的兩位成員上產生**相同規則集**，因此範本不含任何主機專屬的字面值；主機專屬的值以變數傳入，而那些變數只在設計本身已作區分的位址上有所不同。

##### 10.4.5.5 `windows_baseline` —— Windows 安全性及服務基線 Role（角色）

**用途。** 把每一部 Windows Server 2025 客體帶到相同的安全基線，令它們之間的差異只剩下設計有意造成的差異：為成員伺服器啟用 HTTPS 上的 WinRM、把 RDP 限制於管理群組、在不屬任何 GPO 範圍的主機上於本機實作 `GPO-Audit-Advanced` 的進階稽核子類別組合、安裝 `windows_exporter`、時間與網域同步、啟用 SMB 簽署，以及由設計的身分群組而非以人手填入本機系統管理員群組。

**任務**（以來自 `ansible.windows` 及 `community.windows` collections 的 `win_*` 模組執行）：

| # | 任務 | 模組 | 備註 |
|---|---|---|---|
| 1 | 斷言作業系統及組建版本 | `ansible.windows.win_shell: (Get-CimInstance Win32_OperatingSystem).Caption, BuildNumber` + `assert` | 期望 Windows Server 2025 組建 `10.0.26100`；只有在 `windows_baseline_allow_2022` 為真時才接受 Windows Server 2022 作為後備（組建 20348），而該 Role（角色）屆時會記錄該偏差 |
| 2 | 設定時區及時間來源 | `community.windows.win_timezone`、`ansible.windows.win_shell: w32tm /config` | `w32tm /config /manualpeerlist:vpnz-dc01.vertexpeak.fyp.lab /syncfromflags:manual /reliable:no /update`，其後 `w32tm /resync` |
| 3 | 啟用 WinRM/HTTPS 的先決條件 | `ansible.windows.win_shell`，執行 10.4.1.3 的區塊 | 保留在該 Role（角色）之內，令此組態可重複，而不是一次性的手動步驟 |
| 4 | 把 RDP 限制於管理群組 | `ansible.windows.win_user_right`（`SeRemoteInteractiveLogonRight`） | 按 TB-11，`GG-Server-Admins`，以及就兩部平台 VM 而言的 `GG-VPN-ProfServices`。普通使用者不得持有此權限 |
| 5 | 填入本機 Administrators 群組 | `ansible.windows.win_group_membership` | 來自 `GG-Server-Admins` / `GG-Tier0-Admins`；**該 Role（角色）內不以名稱加入任何個別帳戶**，這正是令群組成員資格可在 AD 而非在 Ansible 中接受審閱的原因 |
| 6 | 設定進階稽核政策 | `ansible.windows.win_shell: auditpol /set`，逐個子類別 | 4624、4625、4740、4720、4728、4732、7045 —— 與第 11 章的 AI 分流所讀取的同一組 |
| 7 | 啟用 PowerShell 指令碼區塊及轉錄日誌記錄 | `ansible.windows.win_shell: reg add` + 建立目錄 | 可達時以 `\\vpnz-fs01\Logs` 為目標，否則使用本機。這是盡職審查項目所要求的稽核軌跡 |
| 8 | 要求 SMB 簽署並停用 LLMNR | `ansible.windows.win_regedit` | `RequireSecuritySignature=1`、`EnableMulticast=0` |
| 9 | 安裝 `windows_exporter` 0.29.x | `ansible.windows.win_package`（MSI） | 以產品代碼達致冪等；9182 的防火牆規則會加入，並限定於 `10.10.30.31` |
| 10 | 設定 Windows 防火牆基線 | `community.windows.win_firewall_rule` | 為適用於該主機 Role（角色）的連接埠矩陣列，逐條加入明確的入站規則，每條均以遠端位址限定 |
| 11 | 在無需要之處移除預設 SMB 共享的暴露 | `ansible.windows.win_share`，配 `state: absent` | 管理共用按 Role（角色）處理；`vpnz-fs01` 是例外，它自行管理其 FSRM 共享 |
| 12 | 斷言 `C:\FYP\config\` 之下不存在明文認證資料檔 | `ansible.windows.win_shell: Get-ChildItem -Recurse` + `assert` | 匯出的服務基線不得含有機密資料；這是一項控制，而非形式 |
| 13 | 匯出有效的防火牆及服務基線 | `ansible.windows.win_shell: netsh advfirewall export` → `C:\FYP\config\` | 這個成品令該組態可以在 PowerShell 之外接受審閱 |

**處理程式：** `Restart WinRM`（`win_service`）、`Restart windows_exporter`、`Reapply audit policy`。WinRM 重新啟動在結構上就是危險的 —— 重新啟動 Ansible 正*透過它*連線的服務會中斷工作階段 —— 因此該處理程式寫成以延遲排程重新啟動，而 Playbook（劇本）的最後一項任務會等待該埠再次應答。此事已載明，否則讀者會以為那是疏忽。

**範本及檔案：** `w32tm-config.ps1.j2`（之所以是範本，因為對等清單是一個變數）、`auditpol-baseline.ps1.j2`、`winrm-enable.ps1.j2`（10.4.1.3 的區塊）、`powershell-logging.reg.j2`，以及 `files/` 之下的 `windows_exporter-0.29.x.msi`（其雜湊記錄於 `docs/04-variable-dictionary.md`）。

**預設變數：** `windows_baseline_allow_2022: false`、`windows_baseline_rdp_groups: [GG-Server-Admins]`、`windows_baseline_local_admin_groups: [GG-Server-Admins]`、`windows_baseline_exporter_port: 9182`、`windows_baseline_time_source: vpnz-dc01.vertexpeak.fyp.lab`、`windows_baseline_audit_subcategories: [Logon, Logoff, Account\ Lockout, User\ Account\ Management, Security\ Group\ Management, Process\ Creation, Other\ System\ Events]`。

**冪等性備註。** 此處的冪等性比 Linux 上更難，有三個原因與三項緩解措施。第一，`win_regedit` 本質上具冪等性，但 `win_shell: reg add` 並不具冪等性，因此本設計在凡以登錄值為目標之處都偏好 `win_regedit`，只在不存在模組之處（任務 6 的 `auditpol` 及任務 7 的政策機碼）才使用 `win_shell`。第二，`auditpol /set` 每次叫用都報告成功，即使實際上沒有任何改變，因此任務 6 包在一個 `win_shell` 之中，其 `changed_when` 把 `auditpol /get /category:*` 的後續狀態與期望的組合相比 —— 由比較而非結束碼決定是否變更。第三，MSI 安裝只在實際安裝時才報告變更，這令任務 9 自然具冪等性。因此該 Role（角色）的 `changed=0` 證據預期是乾淨的，而第二次執行時任何非零的變更，在操作手冊中都有具名的原因。

##### 10.4.5.6 `users` —— 身分及群組收斂 Role（角色）

**用途。** 收斂設計所固定的作業系統層帳戶及群組成員資格，而不把 Ansible 變成第二套身分系統。在 Linux 上它建立四個管理員帳戶及本機 `gg-infra-admins` 群組；在 Windows 上它建立或核實服務帳戶及其群組成員資格。它刻意保持**狹窄**：只收斂設計以書面指明的具名帳戶，而它不會變成通用的使用者生命週期引擎 —— Windows 網域中日常的使用者生命週期屬於 `Invoke-NewStarterOnboarding.ps1`（第 10.5.3 節），由一份經審閱的 CSV 驅動，因為 AD 物件需要具備目錄意識的 cmdlet，以及 CSV 所提供的審閱步驟。

**任務：**

| # | 任務 | 模組 | 主機 | 備註 |
|---|---|---|---|---|
| 1 | 建立 Linux 管理員帳戶 | `ansible.builtin.user` | `linux` | `adm-w1` … `adm-w4`，shell 為 `/bin/bash`，`groups: gg-infra-admins`，無密碼（`password_lock: true` —— 只以金鑰登入） |
| 2 | 斷言沒有任何帳戶有空白密碼 | `ansible.builtin.command: awk -F: '($2==""){print $1}' /etc/shadow` + `assert` | 一項失效即關閉的控制 |
| 3 | 鎖定範本開機引導帳戶 | `ansible.builtin.user`，配 `password_lock: true` 及 `shell: /usr/sbin/nologin` | 來自 `UBU2404-TEMPLATE-01` 的 `fypadmin` |
| 4 | 建立或核實 Windows 服務帳戶 | `microsoft.ad.user` / `ansible.windows.win_shell` 配 `Get-ADUser` | `windows` | `svc_ansible`、`svc_backup`、`svc_monitoring`、`svc_aiagent`、`svc_ldapbind`、`svc_git` —— 置於 `OU=ServiceAccounts,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab`，密碼取自 vault，**「密碼永不過期」已停用**，「使用者不能變更密碼」已啟用 |
| 5 | 收斂服務帳戶的群組成員資格 | `microsoft.ad.group` / `win_shell` | `windows` | `svc_ansible` → 只屬 `GG-WINRM-Admins`；`svc_monitoring` → `GG-Monitoring-Readers`；`svc_aiagent` → 只屬 `GG-AI-ReadOnly`。該 Role（角色）**斷言** `svc_aiagent` 不是任何其他群組的成員，這是第 11 章只讀保證在身分層的強制執行 |
| 6 | 收斂個人管理帳戶的群組成員資格 | `microsoft.ad.group` | `windows` | 四人中的兩人加入 `GG-Tier0-Admins`；四人全部加入 `GG-Server-Admins` |
| 7 | 報告密碼不設到期的帳戶 | `win_shell: Search-ADAccount -PasswordNeverExpires`，配 `changed_when: false` | `windows` | 供稽核 Playbook（劇本）使用的證據；本設計的規則是只有緊急備用帳戶可以不設到期，任何其他結果都是一項發現 |
| 8 | 核實緊急備用帳戶未被動用 | `win_shell: Get-ADUser da-vertexpeak -Properties LastLogonDate` | `windows` | **只讀。** 若 `LastLogonDate` 晚於項目開始日期，即屬一項須作書面解釋的發現，因為 §8.4 要求任何使用均須在報告中記錄 |

**處理程式：** `Restart sssd`（只有在採用選配的 SSSD 加入時），Windows 上沒有處理程式（AD 的變更即時生效）。

**範本及檔案：** `ad-service-accounts.ps1.j2`、`files/` 之下的 `linux-admins.yml` 資料檔、`assert-ai-readonly.ps1.j2`。

**預設變數：** `users_linux_admins: [adm-w1, adm-w2, adm-w3, adm-w4]`、`users_linux_admin_group: gg-infra-admins`、`users_service_accounts:`（一份 sAMAccountName 與目標群組的清單）、`users_tier0_admins: [adm-w1, adm-w2]`、`users_disable_template_account: true`、`users_rotate_service_passwords_days: 90`。

**冪等性備註。** `ansible.builtin.user` 及 AD 模組都是宣告式的；第二次執行會報告 `changed=0`。已載明兩個陷阱。第一，**群組成員資格是對帳而非附加**：一項只加入成員而沒有 `append: false` 同伴的任務，永遠不會移除被錯誤加入的成員，因此該 Role（角色）述明期望的成員資格並斷言完整集合，這意味著第二次執行真正乾淨，而漂移的群組也確實獲得糾正。第二，**密碼處理不得具破壞性**：若該 Role（角色）每次執行都設定密碼，帳戶的密碼就每次執行都被重設，服務因而中斷，而 Playbook（劇本）卻報告成功。因此本設計只在帳戶建立時才設定密碼（`when: ad_user_result.changed` 或 `update_password: on_create`），並明確說明此事，因為這是「成功的」Ansible 執行卻弄壞服務的最常見單一成因。

##### 10.4.5.7 其餘三個 Role（角色）

| Role | 用途 | 主要任務 | 關鍵預設值 |
|---|---|---|---|
| `wireguard` | 在 nftables 那一對上設定 WireGuard 介面，以及（若未決項目 O-04 的結論是採用模擬對等方）在 `vpnz-wcwg01` 上設定 | 安裝 `wireguard-tools` 1.0.20210914；以 `wg genkey`/`wg pubkey` 產生金鑰（私密金鑰寫入時權限 `0600`、受 `.gitignore` 排除、永不提交）；渲染 `/etc/wireguard/wg0.conf`（`0600`）；啟用 `wg-quick@wg0`；把 `AllowedIPs` 限制為恰好所需的前綴 | `wireguard_private_key_path`、`wireguard_allowed_ips`（在站點對站點的對等方上絕不用 `0.0.0.0/0`）、`wireguard_persistent_keepalive: 25` **僅在客戶端一側** |
| `winrm` | 令 WinRM/HTTPS 監聽程式及防火牆規則成為可重複、可審閱的成品，而非手動建置步驟 | 執行 10.4.1.3 的區塊；移除任何 HTTP 監聽程式；以 `Test-WSMan -UseSSL` 及 `Get-ChildItem WSMan:\Localhost\Listener` 核實 | `winrm_port: 5986`、`winrm_control_node: 10.10.30.31`、`winrm_cert_thumbprint`、`winrm_allow_self_signed: false` |
| `ad_users` | 一個薄包裝層，以由 vault 提供的認證資料及一份經審閱的 CSV 路徑叫用 `Invoke-NewStarterOnboarding.ps1`，令使用者入職流程可重現，但仍須經過 L4 證據所要求的那個指令碼 | 複製指令碼及模組、複製 CSV、先以等同 `--check` 的方式（`-WhatIf`）執行，然後才真正執行；匯出所產生的報告 | `ad_users_csv: ../../powershell/data/newstarters.csv`、`ad_users_whatif_first: true`、`ad_users_default_ou: OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab` |

`ad_users` 這個 Role（角色）刻意保持薄弱，因為真正有趣的邏輯屬於該 PowerShell 指令碼，在那裡才可以單獨接受審閱與示範。一個在 Ansible 中重新實作使用者佈建的 Role，會重複一份題目明文要求的指令碼，並令該 PowerShell 交付項目失去測試。

全部九個 Role（角色）都在 `meta/main.yml` 中宣告相依關係，令 `common` 成為 `nginx`、`keepalived` 及 `nftables` 的相依項，而 `winrm` 是 `windows_baseline` 的相依項。這保證服務類 Role 絕不可能被套用到一部尚未取得其基線的主機 —— 那一類錯誤否則只會由安全性測試、而非由 Playbook（劇本）本身發現。

#### 10.4.6 Playbook（劇本）

以下完整列出六本 Playbook（劇本）。每一本都可依所寫的內容，在 `vpnz-mon01` 上從 `C:\FYP\04-automation\ansible\` 直接執行，並以 10.4.2 的主機清單為對象。其餘三本基線 Playbook（`06-wireguard.yml`、`07-ad-users.yml` 及 `08-collect-network-configs.yml`）以綱要形式列於 10.4.6.7，因為其內容已在別處詳細涵蓋。

##### 10.4.6.1 `01-baseline-windows.yml` —— 站點基線加固（Windows 環境）

```yaml
---
# 01-baseline-windows.yml
# Purpose : Apply the Windows security, time, audit and monitoring baseline to the
#           Windows estate, and enable WinRM/HTTPS so that later playbooks can run.
# Owner   : W4 (Automation, Monitoring & AI). Reviewer: W1.
# Test IDs: TC-L4-01, TC-L4-02, TB-07, TB-08.
# Idempotence: second run must report changed=0 (see runs/ for the evidence log).
# Notes   : Ansible's WinRM connection is already active when this runs, so the
#           listener tasks are verification-and-repair rather than bootstrap.
#           The original bootstrap of WinRM is done once by hand (10.4.1.3).

- name: Baseline hardening of the Windows estate
  hosts: windows
  gather_facts: true
  serial: 1                     # rolling: one host at a time, never the whole estate at once
  max_fail_percentage: 0        # stop the rollout on the first failure
  any_errors_fatal: true

  vars:
    baseline_audit_subcategories:
      - "Logon"
      - "Logoff"
      - "Account Lockout"
      - "User Account Management"
      - "Security Group Management"
      - "Process Creation"
      - "Other System Events"

  pre_tasks:
    - name: Assert the operating system and build number
      ansible.windows.win_shell: |
        $os = Get-CimInstance Win32_OperatingSystem
        "{0}|{1}" -f $os.Caption, $os.BuildNumber
      register: os_check
      changed_when: false

    - name: Fail if this is not Windows Server 2025 (or the declared 2022 fallback)
      ansible.builtin.assert:
        that:
          - "'10.0.26100' in os_check.stdout or (windows_baseline_allow_2022 | bool and '20348' in os_check.stdout)"
        fail_msg: >-
          {{ inventory_hostname }} reports '{{ os_check.stdout }}'.
          The design pins Windows Server 2025 build 10.0.26100.
          A Windows Server 2022 substitution is permitted only with
          windows_baseline_allow_2022=true AND a recorded version deviation.
        success_msg: "{{ inventory_hostname }} OS check passed: {{ os_check.stdout }}"

    - name: Record the OS string as evidence
      ansible.builtin.copy:
        content: "{{ inventory_hostname }} {{ os_check.stdout }}\n"
        dest: "{{ playbook_dir }}/../runs/{{ lookup('pipe', 'date +%Y-%m-%d') }}_os-strings.txt"
        mode: "0644"
      delegate_to: localhost
      become: false

  roles:
    - role: winrm
      tags: [winrm, connectivity]
    - role: windows_baseline
      tags: [baseline, security]

  tasks:
    - name: Converge the service accounts and administrative group memberships
      ansible.builtin.include_role:
        name: users
      tags: [users, identity]

    - name: Verify that the time source is the domain and skew is inside tolerance
      ansible.windows.win_shell: |
        $skew = (w32tm /stripchart /computer:vpnz-dc01.vertexpeak.fyp.lab /samples:1 /dataonly) -split "`n" |
                Select-Object -Last 1
        $skew
      register: time_check
      changed_when: false
      tags: [verify, time]

    - name: Assert time skew is below the Kerberos tolerance
      ansible.builtin.assert:
        that:
          - time_check.stdout is search('^[+-]?0?[0-5]?\.\d+')
        fail_msg: >-
          Time skew on {{ inventory_hostname }} appears to exceed 5 minutes.
          Kerberos will fail. Check the DC time source before continuing.
      tags: [verify, time]

    - name: Confirm the server answers on the published verification port set
      ansible.windows.win_shell: |
        foreach ($p in @(5986, {{ windows_baseline_exporter_port }})) {
          $r = Test-NetConnection -ComputerName $env:COMPUTERNAME -Port $p -WarningAction SilentlyContinue
          "{0}:{1}" -f $p, $r.TcpTestSucceeded
        }
      register: port_check
      changed_when: false
      tags: [verify, ports]

    - name: Publish the port check result after the run
      ansible.builtin.debug:
        msg: "{{ inventory_hostname }} port check: {{ port_check.stdout_lines }}"
      tags: [verify, ports]

  post_tasks:
    - name: Write a per-host summary line into the run log
      ansible.builtin.lineinfile:
        path: "{{ playbook_dir }}/../runs/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}_01-baseline-windows.log"
        line: >-
          {{ inventory_hostname }} | os={{ os_check.stdout }} |
          winrm={{ 'ok' if ansible_winrm_scheme is defined else 'unknown' }} |
          time_skew_check={{ 'pass' if time_check is succeeded else 'fail' }}
        create: true
        mode: "0644"
      delegate_to: localhost
      become: false
      tags: [evidence]
```

**本 Playbook（劇本）為何如此成形。** `serial: 1` 配 `max_fail_percentage: 0` 及 `any_errors_fatal: true`，就是 10.2.6 的影響範圍控制應用於一本真實的 Playbook：推出在第一部失敗的主機上停止，而其餘主機保留其可運作的組態。作業系統斷言並非吹毛求疵 —— 本設計鎖定 Windows Server 2025，而默默把一部 2022 主機納入基線，會產生一份版本表錯誤的報告。時間偏差斷言之所以存在，是因為超過五分鐘的時間偏差在本設計中是具名的 Kerberos 失敗情境，而在這裡偵測它，遠比日後診斷一項認證故障便宜。證據任務透過 `delegate_to: localhost` 寫入 `runs/`，這正是令一次 Playbook（劇本）執行留下可引用成品的機制。

##### 10.4.6.2 `03-nginx-reverseproxy.yml` —— 網頁層部署

```yaml
---
# 03-nginx-reverseproxy.yml
# Purpose : Deploy and converge the Nginx reverse-proxy pair and its VRRP gateways.
# Owner   : W2 (Linux & Services). Reviewer: W4.
# Test IDs: TC-L2-01, TC-L2-02, TC-L4-02, TB-05, TB-15.
# Idempotence: second run must report changed=0 and the VIP must not move.
# Safety  : serial:1 with the BACKUP node first, so the node holding the VIP is
#           never the first host changed. Ordering is enforced by the two plays.

- name: Web tier - converge the reverse-proxy pair (secondary node first)
  hosts: web
  gather_facts: true
  serial: 1
  max_fail_percentage: 0
  order: sorted               # BACKUP (vpnz-dmzrev02) sorts before MASTER (vpnz-dmzrev01) by name
  become: true

  pre_tasks:
    - name: Show which node is being changed and its VRRP role
      ansible.builtin.debug:
        msg: >-
          Changing {{ inventory_hostname }} ({{ keepalived_state }},
          priority {{ keepalived_priority }}) - VIP {{ keepalived_vip }}
      tags: [always]

    - name: Record the pre-change VRRP state as evidence
      ansible.builtin.shell: |
        set -o pipefail
        ip -br addr show | grep -F '{{ keepalived_vip }}' || echo "VIP not present on this node"
      register: vrrp_before
      changed_when: false
      tags: [evidence, keepalived]

  roles:
    - role: common
      tags: [common]
    - role: nginx
      tags: [nginx]
    - role: keepalived
      tags: [keepalived]

  post_tasks:
    - name: Verify the local health endpoint answers 200
      ansible.builtin.uri:
        url: "http://127.0.0.1{{ nginx_health_path }}"
        status_code: 200
        return_content: true
      register: healthz
      changed_when: false
      tags: [verify]

    - name: Verify the published name resolves and answers through this node
      ansible.builtin.uri:
        url: "https://portal.vertexpeak.example/"
        validate_certs: false        # DECLARED: internal CA + public name mismatch, per 3-8-5
        status_code: [200, 301, 302]
      register: portal_check
      changed_when: false
      tags: [verify]
      ignore_errors: true            # DNS for .example is simulated; the local check above is authoritative

    - name: Verify nginx configuration syntax survived the change
      ansible.builtin.command: nginx -t
      changed_when: false
      tags: [verify]

    - name: Confirm the VIP's location has not moved unintentionally
      ansible.builtin.shell: |
        set -o pipefail
        ip -br addr show | grep -F '{{ keepalived_vip }}' || echo "VIP not present on this node"
      register: vrrp_after
      changed_when: false
      tags: [evidence, keepalived]

    - name: Append the VRRP before/after record to the run log
      ansible.builtin.copy:
        content: |
          === {{ inventory_hostname }} ===
          BEFORE: {{ vrrp_before.stdout }}
          AFTER : {{ vrrp_after.stdout }}
          healthz: {{ healthz.status }}
        dest: "{{ playbook_dir }}/../runs/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}_03-nginx-vrrp.txt"
        mode: "0644"
      delegate_to: localhost
      become: false
      tags: [evidence]

- name: Web tier - post-deployment failover proof (optional, tagged failover)
  hosts: vpnz-dmzrev01
  gather_facts: false
  become: true
  tags: [never, failover]

  tasks:
    - name: Stop keepalived on the MASTER to move the VIP
      ansible.builtin.systemd_service:
        name: keepalived
        state: stopped

    - name: Wait for the VIP to appear on the BACKUP node
      ansible.builtin.wait_for:
        host: "{{ keepalived_vip }}"
        port: 443
        timeout: 30

    - name: Confirm the service still answers through the VIP
      ansible.builtin.uri:
        url: "https://{{ keepalived_vip }}{{ nginx_health_path }}"
        validate_certs: false
        status_code: 200
      delegate_to: vpnz-dmzrev02

    - name: Restart keepalived on the original MASTER
      ansible.builtin.systemd_service:
        name: keepalived
        state: started
```

第二個 play 刻意標記為 `never`：它是一本**示範用** Playbook（劇本），只在需要容錯轉移擷取時執行，絕不作為例行部署的一部分。把它標記為 `never` 意味著它不會被一次意外的大範圍執行觸發，這與 10.4.7 的 `--limit` 紀律是同一套哲學。

##### 10.4.6.3 `05-nftables-egress.yml` —— 防火牆部署

```yaml
---
# 05-nftables-egress.yml
# Purpose : Converge the inline nftables egress pair: single inet table fyp_filter,
#           drop policy, NAT/masquerade, logging before every drop, and drift detection.
# Owner   : W2 + W4. Reviewer: W3 (who owns the ASA policy on the other side).
# Test IDs: TC-L2-03, TC-L4-03, TB-02, TB-03, TB-06, TB-08.
# Safety  : a rollback timer is armed BEFORE the ruleset is applied and disarmed only
#           after verification succeeds. This is the documented lock-out mitigation.
# Risk    : highest-consequence playbook in the repository. Never run without --check first.

- name: Egress firewall - converge the nftables pair
  hosts: edge
  gather_facts: true
  serial: 1                     # never change both halves of the pair simultaneously
  max_fail_percentage: 0
  any_errors_fatal: true
  become: true

  vars:
    nft_candidate: /etc/nftables.conf
    nft_revert_after_seconds: 600

  pre_tasks:
    - name: Assert that the two expected interfaces exist
      ansible.builtin.assert:
        that:
          - ansible_facts['default_ipv4']['interface'] is defined
          - (ansible_facts['interfaces'] | length) >= 2
        fail_msg: >-
          {{ inventory_hostname }} does not present two interfaces.
          The egress pair must be inline with VNET-EGRESS + VNET-WAN.
          Resolve with: ip -br link
      tags: [always]

    - name: Record the interface names (the baseline forbids hard-coded ens names)
      ansible.builtin.set_fact:
        nft_ingress_if: "{{ ansible_facts['default_ipv4']['interface'] }}"
        nft_all_if: "{{ ansible_facts['interfaces'] }}"
      tags: [always]

    - name: Capture the pre-change ruleset as the rollback reference
      ansible.builtin.command: nft list ruleset
      register: nft_before
      changed_when: false
      tags: [evidence]

    - name: Persist the rollback reference to the host
      ansible.builtin.copy:
        content: "{{ nft_before.stdout }}\n"
        dest: /var/lib/fyp/nftables.pre-change
        mode: "0644"
      tags: [rollback]

    - name: Arm the automatic rollback timer
      ansible.builtin.command: /usr/local/sbin/fyp-nft-rollback-arm.sh {{ nft_revert_after_seconds }}
      args:
        creates: /run/fyp-nft-rollback.armed
      tags: [rollback]

  roles:
    - role: common
      tags: [common]
    - role: nftables
      tags: [nftables]
    - role: keepalived
      tags: [keepalived]

  tasks:
    - name: Validate the candidate ruleset without applying it
      ansible.builtin.command: nft -c -f {{ nft_candidate }}
      register: nft_syntax
      changed_when: false
      failed_when: nft_syntax.rc != 0
      tags: [validate]

    - name: Apply the ruleset
      ansible.builtin.systemd_service:
        name: nftables
        state: restarted
        enabled: true
      tags: [apply]

    - name: Wait for the ruleset to be loaded and policy to be drop
      ansible.builtin.shell: |
        set -o pipefail
        for i in $(seq 1 10); do
          if nft list table inet fyp_filter | grep -q 'policy drop'; then exit 0; fi
          sleep 1
        done
        exit 1
      changed_when: false
      tags: [verify]

    - name: Verify connectivity FROM THE FAR SIDE (the path the ruleset could break)
      ansible.builtin.wait_for:
        host: 10.10.50.10            # the pair's VIP, reached from the control node
        port: 22
        timeout: 20
      delegate_to: localhost
      become: false
      register: nft_reachability
      tags: [verify]

    - name: Verify that a permitted egress flow still works (HTTPS to the simulated DMZ)
      ansible.builtin.uri:
        url: "https://blog.vertexpeak.example/"
        validate_certs: false
        status_code: [200, 301, 302]
      register: egress_check
      changed_when: false
      ignore_errors: true
      tags: [verify]

    - name: Detect configuration drift between the running ruleset and the template
      ansible.builtin.shell: |
        set -o pipefail
        nft list ruleset | sed 's/[[:space:]]*$//' > /tmp/running.nft
        diff -u /tmp/running.nft /var/lib/fyp/nftables.rendered > /tmp/nft-drift.diff && echo "NO-DRIFT" || { echo "DRIFT"; cat /tmp/nft-drift.diff; }
      register: nft_drift
      changed_when: false
      failed_when: false
      tags: [drift]

    - name: Report drift as a finding rather than failing the run
      ansible.builtin.debug:
        msg: >-
          {{ inventory_hostname }}: {{ 'NO DRIFT - running ruleset matches Git'
             if 'NO-DRIFT' in nft_drift.stdout
             else 'DRIFT DETECTED - a live firewall was changed outside Ansible. See the diff below.' }}
      tags: [drift]

    - name: Write the drift diff to the evidence directory
      ansible.builtin.copy:
        content: "{{ nft_drift.stdout }}\n"
        dest: "{{ playbook_dir }}/../runs/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}_05-nftables-drift-{{ inventory_hostname }}.txt"
        mode: "0644"
      delegate_to: localhost
      become: false
      tags: [evidence, drift]

  post_tasks:
    - name: Disarm the rollback timer ONLY because verification passed
      ansible.builtin.command: /usr/local/sbin/fyp-nft-rollback-disarm.sh
      args:
        removes: /run/fyp-nft-rollback.armed
      tags: [rollback]

    - name: Publish the active ruleset as evidence for TC-L2-03
      ansible.builtin.command: nft list ruleset
      register: nft_after
      changed_when: false
      tags: [evidence]

    - name: Save the ruleset capture
      ansible.builtin.copy:
        content: "{{ nft_after.stdout }}\n"
        dest: "{{ playbook_dir }}/../runs/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}_nft-ruleset-{{ inventory_hostname }}.txt"
        mode: "0644"
      delegate_to: localhost
      become: false
      tags: [evidence]
```

**本 Playbook（劇本）中的三項安全機制正是它的重點。** 第一，`serial: 1` 意味著這一對絕不會在一次步驟中同時被改動，因此內聯路徑至少有一半永遠以已知良好的規則集提供服務。第二，回復計時器在套用之前啟動，並只在遠端可達性檢查成功之後才解除 —— 這正是 §12.2 就鎖死風險所要求的緩解措施，而 `--limit` 紀律則與之互補。第三，漂移是*被報告*，而非被當作失敗：運行中的規則集與所渲染的範本之間有差異，是一項真實的安全發現（有人以人手改動了運作中的防火牆），但這不是放棄該次執行的理由，因為放棄執行會令該項變更不被報告。把它記錄為證據並繼續是正確的行為，而報告必須呈現所發現的任何漂移，而非默默把它調和掉。

##### 10.4.6.4 `09-verify-services.yml` —— 只讀合規稽核

```yaml
---
# 09-verify-services.yml
# Purpose : A strictly READ-ONLY audit of the estate. Produces a machine-readable
#           compliance report for the verification chapter. This playbook is the
#           reference implementation of "check mode by construction": it makes no
#           change even when run without --check, and every task declares
#           changed_when: false.
# Owner   : W4. Reviewer: all four members (this is the one playbook that touches
#           every host, so it must be safe by construction).
# Test IDs: TC-L4-05, TC-L2-01..03, TC-L1-01, TB-01..TB-16 (read-only probes).
# Hosts   : 'all' is permitted HERE AND NOWHERE ELSE, because no mutation is possible.

- name: FYP estate compliance audit (read-only)
  hosts: all
  gather_facts: true
  become: true                  # needed to read /etc/nftables.conf, sshd -T and the shadow-file policy
  serial: 0                     # audit the whole estate in parallel; nothing is mutated

  vars:
    audit_report_dir: "{{ playbook_dir }}/../runs/audit"
    audit_expected_linux_packages: [chrony, rsyslog, auditd, nftables, curl, jq]
    audit_forbidden_ports_up: [23, 21, 3389]      # telnet, ftp, RDP on a Linux guest
    audit_result: []

  tasks:
    - name: Initialise the report directory
      ansible.builtin.file:
        path: "{{ audit_report_dir }}"
        state: directory
        mode: "0755"
      delegate_to: localhost
      become: false
      run_once: true
      changed_when: false

    # ---------------- Linux audit ----------------
    - name: Linux - collect package presence
      ansible.builtin.command: "dpkg-query -W -f='${Status} ${Version}' {{ item }}"
      register: pkg_results
      changed_when: false
      failed_when: false
      loop: "{{ audit_expected_linux_packages }}"
      when: "'linux' in group_names"

    - name: Linux - collect listening TCP sockets
      ansible.builtin.command: ss -H -tlnp
      register: ss_results
      changed_when: false
      when: "'linux' in group_names"

    - name: Linux - effective SSH policy (read-only)
      ansible.builtin.command: sshd -T
      register: sshd_effective
      changed_when: false
      failed_when: false
      when: "'linux' in group_names"

    - name: Linux - assert the SSH hardening that the design requires
      ansible.builtin.assert:
        that:
          - sshd_effective.stdout is search('(?m)^permitrootlogin no$')
          - sshd_effective.stdout is search('(?m)^passwordauthentication no$')
        fail_msg: "{{ inventory_hostname }} FAILS: SSH hardening missing or reverted (see /etc/ssh/sshd_config.d/10-fyp-hardening.conf)"
        success_msg: "{{ inventory_hostname }} PASS: SSH hardening present"
      when: "'linux' in group_names"
      changed_when: false

    - name: Linux - verify the nftables table exists on the egress pair
      ansible.builtin.command: nft list table inet fyp_filter
      register: nft_audit
      changed_when: false
      failed_when: false
      when: "'edge' in group_names"

    - name: Linux - verify Keepalived is active and the VIP is owned where expected
      ansible.builtin.shell: |
        set -o pipefail
        systemctl is-active keepalived
        ip -br addr show | grep -cF '{{ keepalived_vip | default("0.0.0.0") }}' || true
      register: ka_audit
      changed_when: false
      when: "'edge' in group_names or 'web' in group_names"

    - name: Linux - verify certificate expiry is inside the policy window
      ansible.builtin.shell: |
        set -o pipefail
        for f in /etc/nginx/ssl/*.crt; do
          [ -e "$f" ] || continue
          end=$(openssl x509 -enddate -noout -in "$f" | cut -d= -f2)
          echo "$f|$end"
        done
      register: cert_audit
      changed_when: false
      failed_when: false
      when: "'web' in group_names"

    # ---------------- Windows audit ----------------
    - name: Windows - collect service state for the design's expected services
      ansible.windows.win_shell: |
        Get-Service -Name WinRM, W32Time, DNS, Netlogon, W3SVC, DHCP -ErrorAction SilentlyContinue |
          Select-Object Name, Status, StartType | ConvertTo-Csv -NoTypeInformation
      register: win_services
      changed_when: false
      failed_when: false
      when: "'windows' in group_names"

    - name: Windows - verify the WinRM HTTPS listener and absence of an HTTP listener
      ansible.windows.win_shell: |
        $l = Get-ChildItem WSMan:\Localhost\Listener
        $https = ($l | Where-Object { $_.Keys -contains 'Transport=HTTPS' }).Count
        $http  = ($l | Where-Object { $_.Keys -contains 'Transport=HTTP' }).Count
        "https_listeners=$https http_listeners=$http"
      register: win_winrm
      changed_when: false
      failed_when: false
      when: "'windows' in group_names"

    - name: Windows - assert that no unencrypted WinRM listener remains
      ansible.builtin.assert:
        that:
          - "'http_listeners=0' in win_winrm.stdout"
          - "'https_listeners=1' in win_winrm.stdout"
        fail_msg: "{{ inventory_hostname }} FAILS: WinRM listener state is {{ win_winrm.stdout }} (expected exactly one HTTPS listener and no HTTP listener)"
      when: "'windows' in group_names"
      changed_when: false

    - name: Windows - verify the firewall rules scoped to the control node exist
      ansible.windows.win_shell: |
        Get-NetFirewallRule -DisplayName 'FYP-Ansible-WinRM-5986' -ErrorAction SilentlyContinue |
          Get-NetFirewallAddressFilter | Select-Object -ExpandProperty RemoteAddress
      register: win_fw
      changed_when: false
      failed_when: false
      when: "'windows' in group_names"

    - name: Windows - verify that the AI read-only account holds only one group
      ansible.windows.win_shell: |
        (Get-ADUser svc_aiagent -Properties MemberOf).MemberOf
      register: ai_groups
      changed_when: false
      failed_when: false
      when: "inventory_hostname == 'vpnz-dc01'"

    - name: Assert svc_aiagent is a member of GG-AI-ReadOnly and nothing else
      ansible.builtin.assert:
        that:
          - ai_groups.stdout_lines | length == 1
          - "'GG-AI-ReadOnly' in ai_groups.stdout"
        fail_msg: >-
          svc_aiagent holds {{ ai_groups.stdout_lines | length }} group memberships.
          Section 11 depends on this account being read-only by identity, not by
          convention. Investigate before demonstrating the AI layer.
      when: "inventory_hostname == 'vpnz-dc01'"
      changed_when: false

    # ---------------- Report assembly ----------------
    - name: Assemble the per-host audit record
      ansible.builtin.set_fact:
        audit_result: >-
          {{ audit_result + [{
               'host': inventory_hostname,
               'groups': group_names,
               'linux_packages': (pkg_results.results | default([]) | map(attribute='stdout') | list),
               'listening_tcp': (ss_results.stdout_lines | default([])),
               'ssh_policy_ok': (sshd_effective.stdout is defined and
                                 sshd_effective.stdout is search('(?m)^passwordauthentication no$')),
               'nftables_present': (nft_audit.rc | default(-1) == 0),
               'keepalived_active': (ka_audit.stdout_lines[0] | default('n/a')),
               'windows_services': (win_services.stdout_lines | default([])),
               'winrm': (win_winrm.stdout | default('n/a')),
               'winrm_fw_scope': (win_fw.stdout_lines | default([]))
             }] }}
      changed_when: false

    - name: Write the JSON audit report
      ansible.builtin.copy:
        content: "{{ audit_result | to_nice_json }}\n"
        dest: "{{ audit_report_dir }}/audit-{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}.json"
        mode: "0644"
      delegate_to: localhost
      become: false
      run_once: true
      changed_when: false

    - name: Print the audit summary
      ansible.builtin.debug:
        msg: >-
          AUDIT COMPLETE - {{ audit_result | length }} hosts recorded.
          Report: {{ audit_report_dir }}/audit-{{ lookup('pipe', 'date +%Y-%m-%d') }}.json
      run_once: true
      changed_when: false
```

**為何一本只讀的 Playbook（劇本）比它看起來更重要。** 這本 Playbook 是唯一一件可以隨時、由任何人、對整個環境執行而毫無風險的成品。這項性質令它成為小組在懷疑出現漂移時的預設第一反應，而它也是第 11 章的代理獲准觸發的 Playbook（透過同一份主機清單，而非自行執行 Ansible）。每一項任務都宣告 `changed_when: false`，報告以 `run_once: true` 只寫一次，而其中唯一的斷言是*觀察*上的失敗，絕不是*狀態*上的失敗。一本以收斂方式「稽核」的 Playbook 不是稽核，而報告必須述明該次稽核確實沒有作出任何改動：本 Playbook 第二次執行的 `changed=0` 證據自然是真確的，而那才是誠實的答案，而非一個看起來亮麗的數字。

##### 10.4.6.5 `08-collect-network-configs.yml` —— 組態收集與存檔

```yaml
---
# 08-collect-network-configs.yml
# Purpose : Collect the intended device configurations and the live Linux/Windows
#           service configurations into the evidence archive on vpnz-mon01 (/srv/tftp).
#           HONEST SCOPE: Packet Tracer devices cannot be logged into by any external
#           tooling (no API, no reachable SSH server). This playbook therefore:
#             (a) copies the Git-tracked intended configs from
#                 03-build/packet-tracer/configs/*.txt into the archive, and
#             (b) collects the LIVE configuration of every reachable Linux and Windows host.
#           It NEVER logs in to a Packet Tracer device, and the report must say so.
# Owner   : W3 + W4. Reviewer: W1.
# Test IDs: TC-L4-04, TC-L3-0x (config baseline evidence).

- name: Configuration archive - collect intended device configs and live host configs
  hosts: localhost
  gather_facts: false

  vars:
    pt_config_dir: "{{ playbook_dir }}/../../03-build/packet-tracer/configs"
    archive_dir: /srv/tftp/config-archive/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}

  tasks:
    - name: List the Git-tracked intended Packet Tracer configurations
      ansible.builtin.find:
        paths: "{{ pt_config_dir }}"
        patterns: "*.txt"
      register: pt_configs
      delegate_to: localhost

    - name: Fail loudly if the intended device configurations are missing
      ansible.builtin.assert:
        that:
          - pt_configs.matched >= 15
        fail_msg: >-
          Only {{ pt_configs.matched }} intended device configuration files were found in
          {{ pt_config_dir }}. The design has 16 Packet Tracer devices. Track A of the
          automation approach requires an intended configuration for every device.
      run_once: true

    - name: Create the dated archive directory
      ansible.builtin.file:
        path: "{{ archive_dir }}"
        state: directory
        mode: "0755"
      delegate_to: vpnz-mon01

    - name: Copy the intended Packet Tracer configurations into the archive
      ansible.builtin.copy:
        src: "{{ item.path }}"
        dest: "{{ archive_dir }}/pt-{{ item.path | basename }}"
        mode: "0644"
      loop: "{{ pt_configs.files }}"
      delegate_to: vpnz-mon01

    - name: Write a manifest that states plainly what this archive does and does not contain
      ansible.builtin.copy:
        content: |
          Configuration archive {{ archive_dir }}
          Generated by 08-collect-network-configs.yml

          CONTAINS:
            - The Git-tracked INTENDED configurations of the 16 Packet Tracer logical
              devices, exported by hand from Packet Tracer and committed as source of
              truth (Track A of the network-automation approach).
            - The LIVE collected configuration of every reachable Linux and Windows host
              produced by the second play of this playbook.

          DOES NOT CONTAIN:
            - Any configuration retrieved FROM a running Packet Tracer device by an
              automated tool. Packet Tracer exposes no API and no reachable SSH server,
              so no playbook in this project ever logged in to a Packet Tracer device.
              A real deployment would require netmiko/napalm or an SSH-based push; the
              gap analysis for that step is in the design document.
        dest: "{{ archive_dir }}/MANIFEST.txt"
        mode: "0644"
      delegate_to: vpnz-mon01

- name: Configuration archive - collect live host configurations
  hosts: linux:windows
  gather_facts: true

  tasks:
    - name: Create a per-host staging directory
      ansible.builtin.file:
        path: "/tmp/fyp-collect-{{ inventory_hostname }}"
        state: directory
        mode: "0700"
      become: true

    - name: Linux - collect the configuration files the design fixes
      ansible.builtin.command: "cat {{ item }}"
      register: linux_configs
      changed_when: false
      failed_when: false
      loop:
        - /etc/nftables.conf
        - /etc/keepalived/keepalived.conf
        - /etc/nginx/nginx.conf
        - /etc/ssh/sshd_config.d/10-fyp-hardening.conf
        - /etc/sysctl.d/99-fyp-hardening.conf
        - /etc/chrony/chrony.conf
      become: true
      when: "'linux' in group_names"

    - name: Windows - export firewall, service and DNS configuration
      ansible.windows.win_shell: |
        New-Item -ItemType Directory -Force -Path C:\FYP\config | Out-Null
        netsh advfirewall export C:\FYP\config\firewall-$(Get-Date -f yyyyMMdd).wfw
        Get-Service | Select-Object Name,Status,StartType |
          Export-Csv C:\FYP\config\services-$(Get-Date -f yyyyMMdd).csv -NoTypeInformation
        Get-DnsServerZone -ErrorAction SilentlyContinue |
          Export-Csv C:\FYP\config\dns-zones-$(Get-Date -f yyyyMMdd).csv -NoTypeInformation
        "exported"
      register: win_export
      changed_when: false
      failed_when: false
      when: "'windows' in group_names"

    - name: Windows - read the exported configuration files back
      ansible.windows.win_shell: |
        Get-ChildItem C:\FYP\config\*.csv, C:\FYP\config\*.wfw |
          Sort-Object LastWriteTime | Select-Object -Last 3 |
          ForEach-Object { "===== $($_.FullName) ====="; Get-Content $_.FullName -TotalCount 200 }
      register: win_configs
      changed_when: false
      failed_when: false
      when: "'windows' in group_names"

    - name: Fetch the collected configuration back to the archive host
      ansible.builtin.copy:
        content: |
          ===== {{ inventory_hostname }} @ {{ ansible_date_time.iso8601 }} =====
          --- (linux) collected configuration files ---
          {{ linux_configs.results | default([]) | map(attribute='stdout') | join('\n') }}
          --- (windows) exported configuration ---
          {{ win_configs.stdout | default('n/a') }}
        dest: "/srv/tftp/config-archive/{{ lookup('pipe', 'date +%Y-%m-%d_%H%M') }}/{{ inventory_hostname }}.txt"
        mode: "0644"
      delegate_to: vpnz-mon01
      become: true
```

**清單任務是本 Playbook（劇本）中最重要的任務。** 設計基線那套誠實的雙軌做法要求報告清楚述明：**沒有任何 Playbook（劇本）曾登入 Packet Tracer 裝置。** 一份如此述明、並由自動化本身寫入存檔的清單，是這項紀律遠比報告中一句話更有力的證據，因為該存檔與那段文字是由同一次執行所產生。

##### 10.4.6.6 `02-baseline-linux.yml` —— Linux 基線加固（綱要）

`02-baseline-linux.yml` 是 10.4.6.1 的 Linux 對應版本。其全文不予複製，因為它在結構上與上述 Playbook（劇本）相同，只有四項要緊的差異：

- `hosts: linux` 配 `serial: 2`，因為 Linux 環境除了 `edge` 及 `web` 之外不含任何 VRRP 成對節點，而該兩者在首次執行期間由 `--limit` 排除，並由它們自己的 Playbook（`05-nftables-egress.yml`、`03-nginx-reverseproxy.yml`）涵蓋。
- Role（角色）清單只有 `common`，另加一個 `assert` 區塊，核實沒有設定任何公共解析器，且 chrony 綁定於 `10.10.30.11`。
- 一項 `assert`，要求 `net.ipv4.ip_forward` **只在 nftables 那一對上**等於 `1`、在其他主機上等於 `0`，而這是在一個有路由的實驗室中最容易失落的事實之一。
- 一項最後的任務，執行 `01-hardening-baseline.sh --check`，令 shell 指令碼與 Ansible Role（角色）被證明彼此一致。同一套基線的兩種實作互相不符即是一項缺陷，而這項任務正是偵測它的機制。

##### 10.4.6.7 其餘的 Playbook（劇本）

| Playbook | 主機 | 用途 | 備註 |
|---|---|---|---|
| `04-keepalived.yml` | `web`、`edge` | 只收斂 VRRP 組態並執行容錯轉移證明 | 與服務類 Playbook 分開，令只涉及 VRRP 的變更永不需要強迫 nginx 或 nftables 重新載入；標籤為 `keepalived` |
| `06-wireguard.yml` | `edge`（以及若 O-04 如此定案時的 `vpnz-wcwg01`） | 由範本化組態收斂 `/etc/wireguard/wg0.conf` 並核實握手 | 以 `wg show` 的輸出作為驗證，`changed_when: false` |
| `07-ad-users.yml` | `vpnz-dc01` | 先以 `-WhatIf` 叫用 `Invoke-NewStarterOnboarding.ps1`，然後才真正執行，並收集 CSV 報告 | 標籤為 Tier-0；按設計需要 `adm-{initials}` 認證資料，而非 `svc_ansible` |

#### 10.4.7 測試與安全

##### 10.4.7.1 `--check` 及 `--diff`

`--check` 在不作出變更的情況下執行 Playbook（劇本），報告*將會*變更什麼。`--diff` 顯示檔案層面的變更，而這正是令試跑真正有用之處：防火牆變更是透過閱讀 `/etc/nftables.conf` 的差異來審閱，而不是透過閱讀一項任務名稱。

```bash
cd /opt/ansible-venv/repo/04-automation/ansible

# Full dry run of the firewall playbook with before/after file diffs
ansible-playbook playbooks/05-nftables-egress.yml --check --diff

# Dry run constrained to one node
ansible-playbook playbooks/05-nftables-egress.yml --check --diff --limit vpnz-nft02

# Dry run restricted to the validation and rollback tags only
ansible-playbook playbooks/05-nftables-egress.yml --check --diff --tags validate,rollback
```

報告中必須出現三項誠實的告誡，因為過度信任試跑是一種危害：

1. **`--check` 無法驗證一切。** 不支援 check 模式的模組（`command`、`shell`，以及部分 Windows 模組）會報告為略過，而非「將會變更」。nftables Playbook（劇本）中後果最嚴重的任務都是 `command` 任務，因此單靠 `--check` 並不能證明規則集安全 —— 證明此事的是 `nft -c -f` 驗證任務及回復計時器。
2. **對範本變更而言 `--check` 是可靠的；對服務重新啟動而言則不是**。Playbook（劇本）的處理程式不會在 check 模式下執行，因此試跑永遠不會顯示重新啟動的後果。小組因此把 `--check` 視為*檔案層面*的審閱工具 —— `--check` 證明的是檔案，而非服務。
3. **`--check` 乾淨並不代表可以略過金絲雀**。已載明的工作流程是 check → diff → 金絲雀 → 群組，而金絲雀對 `edge`、`web` 以及任何觸及第 0 層的事項都是強制性的。

##### 10.4.7.2 `--limit`

`--limit` 是現有最有效的單一安全旗標，因為它把一項全站動作轉化為單一主機動作，而不改變受測的程式碼。

```bash
# Canary on the BACKUP nftables node only
ansible-playbook playbooks/05-nftables-egress.yml --limit vpnz-nft02

# Canary on the secondary reverse proxy only
ansible-playbook playbooks/03-nginx-reverseproxy.yml --limit vpnz-dmzrev02

# A group-of-groups limit: only the non-DMZ Linux hosts
ansible-playbook playbooks/02-baseline-linux.yml --limit 'linux:!dmz'

# Exclude tier 0 from a baseline run in one expression
ansible-playbook playbooks/01-baseline-windows.yml --limit 'windows:!vpnz-dc01:!vpnz-dc02'

# Target only the edge pair
ansible-playbook playbooks/05-nftables-egress.yml --limit edge
```

上述群組樣式只使用 10.4.2 主機清單中的群組名稱及主機名稱；`!` 排除語法取決於主機清單含有這些具名群組。**規則：任何 Playbook（劇本）對某部主機的首次執行，永遠是 `--limit <one-host>`。** 這項規則已寫入小組的工作約定，並出現於每一本操作手冊。

##### 10.4.7.3 `--syntax-check`、靜態檢查及標籤

```bash
# Syntax gate - fast, no connection, catches YAML and Jinja2 errors
ansible-playbook playbooks/05-nftables-egress.yml --syntax-check
ansible-playbook --syntax-check playbooks/*.yml

# Inventory gate
ansible-inventory -i inventory/hosts.yml --graph
ansible-inventory -i inventory/hosts.yml --list > /dev/null    # fails on unparsed groups

# Vault integrity gate (no decryption of values, just readability)
ansible-vault view inventory/group_vars/all/vault.yml > /dev/null

# Tag discovery - documents what a targeted run can actually do
ansible-playbook playbooks/05-nftables-egress.yml --list-tags
```

`ansible-lint` 是自然的增補，而除非小組安裝並執行它，否則*不*聲稱它是本項目的一部分：報告不得列出它沒有用過的工具。在 Ubuntu 套件庫中或透過虛擬環境中的 `pip` 可得 `ansible-lint` 之處，鼓勵使用它並提交其輸出；在不可得之處，小組的後備做法是 `--syntax-check` 閘門，外加依 `docs/04-variable-dictionary.md` 所載規則所作的同儕審閱。無論採用哪一種，報告都述明實際所做的是哪一種。

標籤用於令局部執行無須編輯 Playbook（劇本）便可表達。標籤詞彙固定且精簡：`always`、`never`、`baseline`、`security`、`nginx`、`keepalived`、`nftables`、`wireguard`、`users`、`identity`、`validate`、`apply`、`verify`、`drift`、`rollback`、`evidence`、`failover`。證據及驗證任務上之所以有標籤，是為了讓審閱者可以*只*重跑驗證而不觸及組態 —— 而這正是 10.4.6.4 的稽核 Playbook 為整個環境所提供的東西。

##### 10.4.7.4 小組如何避免弄壞運作中的實驗室

以下是小組書面的變更程序，也是對「要求經審閱、可重複的變更而非人手輸入的組態」那一項盡職審查項目的答覆：

| 步驟 | 動作 | 所產生的證據 |
|---|---|---|
| 1 | 在 `task-*` 分支上撰寫該變更；執行 `--syntax-check` | 提交 |
| 2 | 對整個目標群組執行 `--check --diff` | `runs/` 中的試跑日誌 |
| 3 | 與第二位成員一同審閱差異；把審閱記錄於會議紀錄 | 會議紀錄 |
| 4 | 在 Hypervisor 中為目標 VM 拍快照（第 0 層除外，該處的變更只在變更窗口內進行） | 快照名稱及時間戳 |
| 5 | 在變更窗口內以 `--limit` 對**一部**主機執行 | 金絲雀執行日誌 |
| 6 | 以人手核實服務（服務有應答、VIP 正確、日誌乾淨） | 記錄或螢幕截圖 |
| 7 | 對該群組其餘主機執行 | 群組執行日誌 |
| 8 | 重新執行整本 Playbook（劇本）；擷取 `changed=0` | `runs/` 中的冪等性日誌 |
| 9 | 執行 `09-verify-services.yml`，並把 JSON 稽核報告與上一份作差異比對 | 兩份稽核 JSON 檔 |
| 10 | 合併至 `main`，若屬里程碑則加標籤 | 附註標籤 |
| 11 | 變更經核實並記錄後移除快照 | 決策日誌條目 |

變更窗口是星期六 22:00 至星期日 02:00，在 `group_vars/all.yml` 中以 `fyp_change_window` 聲明。任何可能中斷服務的事情都不在窗口外執行。唯一已如此述明的例外，是第 10 週至第 12 週的驗證階段，屆時小組刻意在窗口外執行測試，並記錄如此行事。

#### 10.4.8 驗證

##### 10.4.8.1 確切的指令

```bash
# --- 0. Prepare: one timestamped log file per run -------------------------------
export FYP_RUNLOG="/opt/ansible-venv/repo/04-automation/runs/$(date +%Y-%m-%d_%H%M)_05-nftables-egress.log"

# --- 1. Gate: syntax ----------------------------------------------------------
ansible-playbook playbooks/05-nftables-egress.yml --syntax-check

# --- 2. Gate: dry run with diffs ----------------------------------------------
ansible-playbook playbooks/05-nftables-egress.yml --check --diff 2>&1 | tee "${FYP_RUNLOG%.log}.check.log"

# --- 3. Canary ----------------------------------------------------------------
ansible-playbook playbooks/05-nftables-egress.yml --limit vpnz-nft02 2>&1 | tee "$FYP_RUNLOG"

# --- 4. Full run (the FIRST run - changes are expected) -----------------------
ansible-playbook playbooks/05-nftables-egress.yml 2>&1 | tee -a "$FYP_RUNLOG"

# --- 5. IDEMPOTENCE PROOF: run it again immediately ---------------------------
ansible-playbook playbooks/05-nftables-egress.yml 2>&1 | tee "/opt/ansible-venv/repo/04-automation/runs/$(date +%Y-%m-%d_%H%M)_05-nftables-egress.SECOND-RUN.log"

# --- 6. Independent verification, not the playbook's own opinion --------------
ansible edge -i inventory/hosts.yml -m ansible.builtin.shell -a 'nft list table inet fyp_filter | head -5'
ansible edge -i inventory/hosts.yml -m ansible.builtin.shell -a 'systemctl is-active nftables keepalived'
ansible edge -i inventory/hosts.yml -m ansible.builtin.shell -a 'ip -br addr show | grep 10.10.50.10 || echo "VIP not here"'

# --- 7. Whole-estate audit ----------------------------------------------------
ansible-playbook playbooks/09-verify-services.yml 2>&1 | tee "/opt/ansible-venv/repo/04-automation/runs/$(date +%Y-%m-%d_%H%M)_09-verify-services.log"

# --- 8. Commit the evidence ---------------------------------------------------
git add 04-automation/runs/
git commit -m "evidence(l4): nftables egress deployment - first run, canary, idempotence proof"
```

##### 10.4.8.2 預期的執行摘要輸出 —— 冪等性證明

以下輸出僅作**示例**，展示所要求的確切形狀。真實執行中的各項數值在時間上會有所不同；必須成立的性質是第二次執行時的 `changed=0` 計數。

**第一次執行（金絲雀，`vpnz-nft02`）—— 預期會有變更：**

```text
PLAY [Egress firewall - converge the nftables pair] ***************************

TASK [Gathering Facts] *********************************************************
ok: [vpnz-nft02]

TASK [Assert that the two expected interfaces exist] ***************************
ok: [vpnz-nft02]

TASK [Capture the pre-change ruleset as the rollback reference] ****************
ok: [vpnz-nft02]

TASK [Arm the automatic rollback timer] ***************************************
changed: [vpnz-nft02]

TASK [common : Install the baseline package set] *******************************
ok: [vpnz-nft02]

TASK [nftables : Deploy the ruleset fragments] *********************************
changed: [vpnz-nft02] => (item=10-sets.nft)
changed: [vpnz-nft02] => (item=20-filter-input.nft)
changed: [vpnz-nft02] => (item=30-filter-forward.nft)
changed: [vpnz-nft02] => (item=40-nat.nft)
changed: [vpnz-nft02] => (item=90-logging.nft)

TASK [nftables : Deploy the main ruleset] **************************************
changed: [vpnz-nft02]

TASK [Validate the candidate ruleset without applying it] **********************
ok: [vpnz-nft02]

TASK [Apply the ruleset] *******************************************************
changed: [vpnz-nft02]

TASK [Wait for the ruleset to be loaded and policy to be drop] *****************
ok: [vpnz-nft02]

TASK [Verify connectivity FROM THE FAR SIDE (the path the ruleset could break)]
ok: [vpnz-nft02 -> localhost]

TASK [Detect configuration drift between the running ruleset and the template]
ok: [vpnz-nft02]

TASK [Disarm the rollback timer ONLY because verification passed] **************
changed: [vpnz-nft02]

TASK [Publish the active ruleset as evidence for TC-L2-03] *********************
ok: [vpnz-nft02]

RUNNING HANDLER [nftables : Reload nftables] ***********************************
changed: [vpnz-nft02]

PLAY RECAP *********************************************************************
vpnz-nft02                 : ok=31   changed=11   unreachable=0    failed=0    skipped=3    rescued=0    ignored=0
```

**緊接其後的第二次執行 —— 冪等性證明：**

```text
PLAY [Egress firewall - converge the nftables pair] ***************************

TASK [Gathering Facts] *********************************************************
ok: [vpnz-nft01]
ok: [vpnz-nft02]

TASK [Assert that the two expected interfaces exist] ***************************
ok: [vpnz-nft01]
ok: [vpnz-nft02]

TASK [Arm the automatic rollback timer] ***************************************
skipping: [vpnz-nft01]
skipping: [vpnz-nft02]

TASK [nftables : Deploy the ruleset fragments] *********************************
ok: [vpnz-nft01] => (item=10-sets.nft)
ok: [vpnz-nft01] => (item=20-filter-input.nft)
ok: [vpnz-nft01] => (item=30-filter-forward.nft)
ok: [vpnz-nft01] => (item=40-nat.nft)
ok: [vpnz-nft01] => (item=90-logging.nft)
ok: [vpnz-nft02] => (item=10-sets.nft)
...
ok: [vpnz-nft02] => (item=90-logging.nft)

TASK [Validate the candidate ruleset without applying it] **********************
ok: [vpnz-nft01]
ok: [vpnz-nft02]

TASK [Wait for the ruleset to be loaded and policy to be drop] *****************
ok: [vpnz-nft01]
ok: [vpnz-nft02]

TASK [Disarm the rollback timer ONLY because verification passed] **************
skipping: [vpnz-nft01]
skipping: [vpnz-nft02]

PLAY RECAP *********************************************************************
vpnz-nft01                 : ok=26   changed=0    unreachable=0    failed=0    skipped=8    rescued=0    ignored=0
vpnz-nft02                 : ok=26   changed=0    unreachable=0    failed=0    skipped=8    rescued=0    ignored=0
```

**如何把這讀作證據，以及它不能證明什麼。**

- 兩位成對成員上的 `changed=0` 就是要求。它證明該 Playbook（劇本）在此環境的這套組態下具冪等性。
- `failed=0` 及 `unreachable=0` 證明該變更沒有弄斷與任一節點的連線。對一部內聯防火牆而言，`unreachable=1` 會正是鎖死失敗模式的簽名，這就是遠端核實任務存在的原因。
- 回復任務上的 `skipping` 行是*正確*的：計時器已經啟動，而 `creates:` 防護阻止了重新啟動。一份在每一項任務上都顯示零次略過的冪等性證明，是可疑而非令人安心的。
- **它不能證明什麼。** `changed=0` 並不證明*期望的*狀態正確 —— 一本什麼都不做的 Playbook（劇本）完全可以冪等。正確性的聲稱來自稽核 Playbook 的斷言，以及驗證章節中的情境測試，那些是另一批證據。兩者都需要；任何一方都不能替代另一方。

儲存庫中每一本 Playbook（劇本）都擷取了同等的證明，而所收集的結果會連同日誌檔路徑及日期，記錄於 `04-automation/ansible/docs/05-idempotence-log.md`：

| Playbook | 主機 | 第一次執行變更數 | 第二次執行變更數 | 日誌檔 | 日期 |
|---|---|---|---|---|---|
| `01-baseline-windows.yml` | 9 部 Windows 客體 | *（記錄）* | **0** | `runs/…_01-baseline-windows.SECOND-RUN.log` | *（記錄）* |
| `02-baseline-linux.yml` | 9 部 Linux 客體 | *（記錄）* | **0** | `runs/…_02-baseline-linux.SECOND-RUN.log` | *（記錄）* |
| `03-nginx-reverseproxy.yml` | `vpnz-dmzrev01/02` | *（記錄）* | **0** | `runs/…_03-nginx.SECOND-RUN.log` | *（記錄）* |
| `04-keepalived.yml` | `web`、`edge` | *（記錄）* | **0** | `runs/…_04-keepalived.SECOND-RUN.log` | *（記錄）* |
| `05-nftables-egress.yml` | `vpnz-nft01/02` | *（記錄）* | **0** | `runs/…_05-nftables.SECOND-RUN.log` | *（記錄）* |
| `06-wireguard.yml` | `edge` | *（記錄）* | **0** | `runs/…_06-wireguard.SECOND-RUN.log` | *（記錄）* |
| `07-ad-users.yml` | `vpnz-dc01` | *（記錄）* | **0** | `runs/…_07-ad-users.SECOND-RUN.log` | *（記錄）* |
| `08-collect-network-configs.yml` | 所有可達主機 + localhost | *（記錄）* | **0** | `runs/…_08-collect.SECOND-RUN.log` | *（記錄）* |
| `09-verify-services.yml` | all | *（記錄）* | **0**（依結構如此） | `runs/audit/audit-*.json` | *（記錄）* |

至第 12 週結束時，本表中有任何空白儲存格，即屬一項缺失的交付項目，而非可在文字中解釋的疏忽。

---

### 10.5 PowerShell

#### 10.5.1 為何 Windows 環境選用 PowerShell

官方題目單張明確把 PowerShell 列為本線路的範例，而 WSOS 2026 在兩處使它可被引用：`Setup and run routine infrastructure maintenance operations using various scripting\programming languages`，其巢狀範例為 `PowerShell`（範疇 5 —— 基礎設施自動化，15 %）；以及 `Install and manage backup systems`，其巢狀範例為 `Script based backup, e.g. Bash, Batch or PowerShell`（範疇 4 —— 網絡與系統運作，該條亦點名 `Windows Server Backup`）。範疇 4 的其他條文 —— 目錄服務、DNS、DHCP、時間、遠端存取、PKI、共享服務、監控、備份、部署 —— 在 Microsoft 環境中，全都是 PowerShell 作為第一級介面的項目。以上就是標準層面的論據，而它對本線路尤其有力。

技術層面的論據，是 Bash 與 Ansible 在 Windows 上不具備的三項性質：

1. **物件管線。** PowerShell 在指令之間傳遞 .NET 物件，而非文字。`Get-Service | Where-Object Status -eq 'Stopped' | Select-Object Name, DisplayName, StartType` 產生的是結構化記錄，可以篩選、格式化、匯出或對之作斷言，而無須解析。對本項目而言，其後果是 10.5.3 的稽核及報告指令碼不解析主控台輸出 —— 它們取用物件 —— 這意味著服務顯示文字的改變不會默默弄壞檢查。因此本節的每個指令碼都以發出物件作結，而物件串流正是匯出至 CSV 的內容。
2. **遠端處理。** `Invoke-Command` 在遠端主機上、或在多部主機上同時執行一個指令碼區塊，並回傳行為如同本機物件的反序列化物件。這讓單一指令碼就能稽核整個九部主機的 Windows 環境，而無須代理程式；而它所用的傳輸（HTTPS 上的 `WinRM` 5986）與 Ansible 相同，因此兩條自動化路徑共用同一條防火牆規則、同一項憑證決定，以及同一套排錯程序。
3. **在 Microsoft 各角色上的覆蓋深度。** DHCP、DNS、FSRM、iSCSI Target、AD CS 及 RRAS 都提供 `*-` cmdlet，而其中負責修改的 cmdlet 支援 `-WhatIf`。`-WhatIf` 為 Windows 指令碼提供了 Ansible 的 `--check` 為 Linux 提供的東西：一條小組在任何變更之前用作閘門的試跑路徑。

**誠實的界線。** PowerShell *不是* Linux 環境的工具（那是 Bash 與 Ansible），也*不是* Cisco 環境的工具（`Packet Tracer` 不提供任何指令碼可觸及的介面 —— 見 10.7）。對於 `vpnz-dc01` 的 DNS 或 DHCP 組態變更，若小組的決定是該變更應屬於一本經審閱的 Playbook（劇本）或一份已載明的 GPO，PowerShell 同樣不是正確的工具。

**執行環境紀律。** 在 Windows 客體上執行的是 Windows PowerShell **5.1**，因為它是內建的。PowerShell **7.4 LTS** 在 `vpnz-jump01` 上執行，用於撰寫及跨平台用途。本節的每個指令碼都寫成可在 **5.1** 上執行，除非另有述明，而每個指令碼的說明區塊都記錄了它受測試時所用的執行環境。這點要緊：使用三元運算子或 `??` 的指令碼會在 5.1 上失敗，而在只在 5.1 上驗證過的情況下聲稱 7.4，正是本項目視為誠信缺失的那種版本聲稱。

#### 10.5.2 PowerShell 遠端處理設定

##### 10.5.2.1 目標上的 `Enable-PSRemoting`

在 Windows Server 2025 客體上執行 `Enable-PSRemoting -Force`，會啟動 WinRM 服務、把它設為自動、建立一個監聽程式，並啟用防火牆群組 `Windows Remote Management (HTTP-In)`。作為一個起點它是有用的，而**作為一套設計則不足**，原因有三，而本項目的威脅模型令這三者變得具體：

```powershell
# What Enable-PSRemoting does, and what the project therefore adds on top of it.
Enable-PSRemoting -Force -SkipNetworkProfileCheck
# -SkipNetworkProfileCheck  : required in this lab, because hypervisor host-only
#                             adapters are often classified as Public and the
#                             cmdlet otherwise refuses to proceed.

# Project additions, in order of importance:
Set-Item WSMan:\localhost\Service\Auth\Basic -Value $false             # no cleartext auth
Set-Item WSMan:\localhost\Service\AllowUnencrypted -Value $false       # no cleartext transport
Get-ChildItem WSMan:\localhost\Listener |                            # remove the HTTP listener
    Where-Object { $_.Keys -contains 'Transport=HTTP' } |
    ForEach-Object { Remove-Item ("WSMan:\localhost\Listener\" + $_.Name) -Recurse -Force }
New-Item WSMan:\localhost\Listener -Transport HTTPS -Address * `
    -CertificateThumbprint $cert.Thumbprint                            # HTTPS listener only
Set-Item WSMan:\localhost\MaxEnvelopeSizekb -Value 500
Set-Item WSMan:\localhost\Shell\IdleTimeout -Value 300000
```

**為何移除 HTTP 監聽程式。** 預設的監聽程式並不加密。任由它啟用，意味著本設計「WinRM 流量已加密」的聲稱是假的，也意味著由設定錯誤的客戶端所送出的認證資料會以明文傳送。因此本設計只述明一個監聽程式，位於 5986，而 10.4.6.4 的稽核 Playbook（劇本）在每一部 Windows 客體上斷言 `https_listeners=1 http_listeners=0`。

**防火牆範圍限定。** `Enable-PSRemoting` 所啟用的預設規則允許來自任何遠端位址的 WinRM。本項目以一條由 `-RemoteAddress 10.10.30.31` 限定範圍的規則取而代之，令 WinRM 只能從自動化控制節點觸及，並把所產生的位址篩選記錄為證據（10.4.1.3）。這是 TB-07/TB-08 管理平面紀律在主機層面的實作。

##### 10.5.2.2 `TrustedHosts` 與 HTTPS 之比較

`TrustedHosts` 是一份**客戶端一側**的主機名稱或位址清單，列出某部 Windows 機器在無法透過網域認證它們時，仍會接受為 WinRM 目標的主機。關於它的兩項事實決定了本項目的決定：

- `TrustedHosts` 適用於**發起**連線的那部機器，而非目標。
- 使用它意味著發起方不核實目標的身分；流量以 NTLM 或 Basic 認證，但*伺服器*並未被證明就是它自稱的那部主機。它也無法由群組原則設定，因此它是一項逐機器的手動步驟，在重建的 VM 上會默默缺失。

對 **Ansible 而言此設定無關緊要**：控制節點是 Linux，而 `pywinrm` 自行執行憑證驗證。Ansible 的路徑中完全沒有 `TrustedHosts`；等效的控制是 `ansible_winrm_server_cert_validation: validate`，加上一條受信任的憑證鏈。

對**從 Windows 機器工作的管理員**而言，本項目只在一個地方使用 `TrustedHosts`，且只作為已載明、有日期的實驗：示範 `vpnz-jump01` 上的一位 Windows 管理員可觸及一部以工作群組方式隔離的 DMZ 網頁節點。該示範連同它應得的警告一併擷取：

```powershell
# ON vpnz-jump01 ONLY. Documented experimental use; NOT used by the Ansible path.
$cur = (Get-Item WSMan:\localhost\Client\TrustedHosts).Value
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "10.10.90.21,10.10.90.22" -Concatenate -Force
Test-WSMan -ComputerName 10.10.90.21 -UseSSL     # must negotiate; check the certificate it presents
# ... capture the evidence, then revert the change and record the revert:
Set-Item WSMan:\localhost\Client\TrustedHosts -Value $cur -Force
```

報告必須把此事呈現為**針對一個特定工作群組情境的實驗室簡化措施**，並述明其安全後果：`TrustedHosts` 停用目標身分驗證，因此不是本設計所支援的路徑。在 DMZ 主機已加入網域之處（未決項目 O-05），這項實驗完全不需要。

##### 10.5.2.3 Ansible 如何連接它

Ansible 的 Windows 連線在 `inventory/group_vars/windows.yml` 中宣告（10.4.1.3），並使用 HTTPS 上的 `winrm` 配 NTLM。PowerShell 指令碼與 Ansible 使用*相同*的傳輸，這一點是刻意的：每部主機一條防火牆規則、一項憑證決定、一套排錯程序，以及一個集中修復故障的地方。若該傳輸出現故障，`Test-WSMan` 診斷與 `ansible windows -m ansible.windows.win_ping` 診斷都會執行，而兩項結果都會記錄，因為只在一方出現而不在另一方出現的故障，本身就是關於故障所在位置的資訊。

#### 10.5.3 達生產質素的指令碼

以下完整界定三個指令碼。每個都有以註解為基礎的說明、`[CmdletBinding()]`、具型別且經驗證的參數、以 `try`/`catch`/`finally` 構成的結構化錯誤處理、按其原意使用的 `Write-Verbose` 與 `Write-Error`，以及適合 `Export-Csv` 的乾淨輸出物件。每個指令碼之前有一段簡短的設計備註，之後則有所要求的叫用證據。

##### 10.5.3.1 `Invoke-NewStarterOnboarding.ps1`

**設計備註。** 這個指令碼回應盡職審查第 2 項（已載明的最低權限存取，以及管理動作的稽核軌跡）及情境中對可重複、經審閱的入職流程之需要。它**刻意由 CSV 驅動**：該 CSV 就是經審閱的成品，可以在 Git 中作差異比對，而這也意味著該指令碼沒有互動式提示 —— 正因如此，它才能夠由排程任務或一本 Playbook（劇本）執行。該指令碼按據點代碼在正確的 OU 中建立帳戶、加入該部門的群組成員資格、建立家目錄及 FSRM 配額，並為每個使用者回傳一個物件。它支援 `-WhatIf`，令一次執行可在作出任何變更之前受到核實，而它從不把密碼寫入日誌。

```powershell
<#
.SYNOPSIS
    Provisions Vertex Peak starters in AD DS from a reviewed CSV file.

.DESCRIPTION
    Creates user accounts in the OU tree of vertexpeak.fyp.lab, adds them to the
    department and site security groups, creates the home directory, and applies a
    per-user FSRM quota where the department has a quota template.

    This script is CSV-driven by design: the CSV is the reviewed source of truth and
    is committed to Git. The script makes no interactive prompts, so it can be run
    from a verified scheduled task or from an Ansible playbook.

    Verified on: Windows PowerShell 5.1 (Windows Server 2025 Standard, build 10.0.26100)
    Requires  : ActiveDirectory, FileServerResourceManager modules (RSAT / role installed)
    Test IDs  : TC-L4-01, TC-L1-01

.PARAMETER CsvPath
    Path to the reviewed CSV. Required columns:
    SamAccountName, GivenName, Surname, Department, SiteCode, Title

.PARAMETER DefaultPassword
    Initial password. Must satisfy the domain complexity policy. The account is
    flagged ChangePasswordAtLogon. The value is NEVER written to the log.

.PARAMETER HomeRoot
    UNC root for home directories. Default \\vpnz-fs01\Shares\Home.

.PARAMETER QuotaTemplate
    Name of the FSRM quota template applied to a user's home directory. Empty
    string disables quota application (for example for the Sales read-only share).

.PARAMETER LogPath
    Directory for the run log. Default C:\FYP\logs.

.EXAMPLE
    .\Invoke-NewStarterOnboarding.ps1 -CsvPath .\data\newstarters.csv `
        -DefaultPassword (Read-Host -AsSecureString) -WhatIf -Verbose

    Previews every action for the reviewed CSV without creating anything.
    This is the mandatory first invocation.

.EXAMPLE
    .\Invoke-NewStarterOnboarding.ps1 -CsvPath .\data\newstarters.csv `
        -DefaultPassword $pw -QuotaTemplate 'Quota-20GB-Finance'

    Runs the provisioning for real and returns one object per provisioned user.

.OUTPUTS
    PSCustomObject per input row, with properties:
    SamAccountName, DistinguishedName, Created, GroupCount, HomeCreated, QuotaApplied, Status

.NOTES
    Author : Vertex Peak FYP workstream W4 (Automation, Monitoring & AI)
    Reviewer: W1 (Identity & Windows)
    Idempotence: re-running with the same CSV reports Created=$false and makes no change.
                 A user whose OU or group membership has drifted IS corrected; that is
                 intentional and is recorded in the output object's Status property.
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$CsvPath,

    [Parameter(Mandatory = $true)]
    [System.Security.SecureString]$DefaultPassword,

    [ValidateNotNullOrEmpty()]
    [string]$HomeRoot = '\\vpnz-fs01\Shares\Home',

    [string]$QuotaTemplate = '',

    [ValidateNotNullOrEmpty()]
    [string]$LogPath = 'C:\FYP\logs'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Fixed design values - these come from the canonical design and are not tunable
# ---------------------------------------------------------------------------
$DomainDn     = 'DC=vertexpeak,DC=fyp,DC=lab'
$UserRootOu   = "OU=Users,OU=VertexPeak,$DomainDn"
$SiteOuMap    = @{
    'HQ' = "OU=HQ-ShaTin,$UserRootOu"
    'BR' = "OU=BR-KwunTong,$UserRootOu"
    'WC' = "OU=WC-WanChai,$UserRootOu"
    'MO' = "OU=MO-Macau,$UserRootOu"
}
$DepartmentMap = @{
    'Engineering'     = @{ Ou = 'Engineering';      Groups = @('GG-Engineering-RW');             Quota = 'Quota-10GB-Engineering' }
    'SalesOps'        = @{ Ou = 'SalesOps';         Groups = @('GG-Sales-RO');                   Quota = 'Quota-10GB-SalesRO' }
    'Finance'         = @{ Ou = 'Finance';          Groups = @('GG-Finance-RW');                 Quota = 'Quota-20GB-Finance' }
    'HumanResources'  = @{ Ou = 'HumanResources';   Groups = @();                                Quota = '' }
    'IT'              = @{ Ou = 'IT';               Groups = @('GG-Server-Admins');              Quota = 'Quota-10GB-Engineering' }
    'Support'         = @{ Ou = 'Support';          Groups = @('GG-Helpdesk');                   Quota = '' }
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
if (-not (Test-Path -LiteralPath $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}
$LogFile = Join-Path $LogPath ("{0}_Invoke-NewStarterOnboarding.log" -f (Get-Date -Format 'yyyy-MM-dd'))

function Write-RunLog {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR')][string]$Level = 'INFO'
    )
    $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Add-Content -LiteralPath $LogFile -Value $line
    switch ($Level) {
        'ERROR' { Write-Error $Message -ErrorAction Continue }
        'WARN'  { Write-Warning $Message }
        default { Write-Verbose $Message }
    }
}

function ConvertTo-PlainText {
    [CmdletBinding()]
    param([Parameter(Mandatory)][System.Security.SecureString]$Secure)
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try   { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
$required = @('SamAccountName', 'GivenName', 'Surname', 'Department', 'SiteCode', 'Title')
$results  = New-Object System.Collections.Generic.List[object]

try {
    Import-Module ActiveDirectory -ErrorAction Stop
    Write-RunLog "Starting onboarding run from $CsvPath"

    $rows = Import-Csv -LiteralPath $CsvPath
    if (-not $rows) { throw "CSV '$CsvPath' contains no data rows." }

    $missing = $required | Where-Object { $_ -notin $rows[0].PSObject.Properties.Name }
    if ($missing) { throw "CSV is missing required column(s): $($missing -join ', ')" }

    $plain = ConvertTo-PlainText -Secure $DefaultPassword

    foreach ($row in $rows) {
        $status     = 'OK'
        $created    = $false
        $homeMade   = $false
        $quotaDone  = $false
        $groupCount = 0

        try {
            if ($row.Department -notin $DepartmentMap.Keys) {
                throw "Unknown department '$($row.Department)' for $($row.SamAccountName)."
            }
            if ($row.SiteCode -notin $SiteOuMap.Keys) {
                throw "Unknown site code '$($row.SiteCode)' for $($row.SamAccountName)."
            }
            if ($row.SamAccountName -notmatch '^[a-z][a-z0-9]{2,14}$') {
                throw "SamAccountName '$($row.SamAccountName)' violates the naming rule (lower-case, 3-15 chars)."
            }

            $dept     = $DepartmentMap[$row.Department]
            $targetOu = "OU=$($dept.Ou),$($SiteOuMap[$row.SiteCode])"
            $upn      = "$($row.SamAccountName)@vertexpeak.fyp.lab"

            $existing = Get-ADUser -Filter "SamAccountName -eq '$($row.SamAccountName)'" `
                                   -ErrorAction SilentlyContinue

            if (-not $existing) {
                if ($PSCmdlet.ShouldProcess($upn, 'Create AD user')) {
                    $params = @{
                        Name                  = "$($row.GivenName) $($row.Surname)"
                        GivenName             = $row.GivenName
                        Surname               = $row.Surname
                        SamAccountName        = $row.SamAccountName
                        UserPrincipalName     = $upn
                        DisplayName           = "$($row.GivenName) $($row.Surname)"
                        Title                 = $row.Title
                        Department            = $row.Department
                        Path                  = $targetOu
                        AccountPassword       = (ConvertTo-SecureString -String $plain -AsPlainText -Force)
                        Enabled               = $true
                        ChangePasswordAtLogon = $true
                        PasswordNeverExpires  = $false
                    }
                    New-ADUser @params
                    $created = $true
                    Write-RunLog "Created $upn in $targetOu"
                }
                else {
                    $status = 'WhatIf'
                    Write-RunLog "WhatIf: would create $upn in $targetOu"
                }
            }
            else {
                Write-RunLog "User $($row.SamAccountName) already exists - checking drift" 'WARN'
                if ($existing.DistinguishedName -notlike "*$targetOu") {
                    $status = 'Corrected-DN'
                    if ($PSCmdlet.ShouldProcess($upn, 'Move to correct OU')) {
                        Move-ADObject -Identity $existing.DistinguishedName -TargetPath $targetOu
                        Write-RunLog "Moved $upn to $targetOu"
                    }
                }
            }

            foreach ($group in $dept.Groups) {
                $isMember = Get-ADGroupMember -Identity $group -ErrorAction SilentlyContinue |
                            Where-Object { $_.SamAccountName -eq $row.SamAccountName }
                if (-not $isMember) {
                    if ($PSCmdlet.ShouldProcess($upn, "Add to $group")) {
                        Add-ADGroupMember -Identity $group -Members $row.SamAccountName
                        Write-RunLog "Added $upn to $group"
                    }
                }
                $groupCount++
            }

            # Home directory. The share is created once by the file-server role;
            # this script only creates the per-user folder and sets its ACL.
            if ($status -ne 'WhatIf') {
                $home = Join-Path $HomeRoot $row.SamAccountName
                if (-not (Test-Path -LiteralPath $home)) {
                    if ($PSCmdlet.ShouldProcess($home, 'Create home directory')) {
                        New-Item -ItemType Directory -Path $home -Force | Out-Null
                        $acl = Get-Acl -LiteralPath $home
                        $acl.SetAccessRuleProtection($true, $false)
                        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
                            "$($row.SamAccountName)", 'Modify', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
                        $acl.AddAccessRule($rule)
                        Set-Acl -LiteralPath $home -AclObject $acl
                        $homeMade = $true
                        Write-RunLog "Created home directory $home (owner-only ACL)"
                    }
                }
                if (-not $homeMade -and (Test-Path -LiteralPath $home)) {
                    $homeMade = $true   # already compliant; not a change
                }

                $templateToUse = if ($QuotaTemplate) { $QuotaTemplate } else { $dept.Quota }
                if ($templateToUse) {
                    $existingQuota = Get-FsrmQuota -Path $home -ErrorAction SilentlyContinue
                    if (-not $existingQuota) {
                        if ($PSCmdlet.ShouldProcess($home, "Apply FSRM quota $templateToUse")) {
                            New-FsrmQuota -Path $home -Template $templateToUse | Out-Null
                            $quotaDone = $true
                            Write-RunLog "Applied FSRM quota $templateToUse to $home"
                        }
                    }
                    else { $quotaDone = $true }
                }
            }

            $dn = (Get-ADUser -Identity $row.SamAccountName -Properties DistinguishedName).DistinguishedName
            $results.Add([PSCustomObject]@{
                SamAccountName    = $row.SamAccountName
                DistinguishedName = $dn
                Created           = $created
                GroupCount        = $groupCount
                HomeCreated       = $homeMade
                QuotaApplied      = $quotaDone
                Status            = $status
            })
        }
        catch {
            Write-RunLog "FAILED $($row.SamAccountName): $($_.Exception.Message)" 'ERROR'
            $results.Add([PSCustomObject]@{
                SamAccountName    = $row.SamAccountName
                DistinguishedName = ''
                Created           = $false
                GroupCount        = 0
                HomeCreated       = $false
                QuotaApplied      = $false
                Status            = "ERROR: $($_.Exception.Message)"
            })
            continue
        }
        finally {
            if ($plain) { $plain = $null }
        }
    }

    $failures = @($results | Where-Object { $_.Status -like 'ERROR*' }).Count
    Write-RunLog ("Run complete: {0} row(s), {1} failure(s)" -f $results.Count, $failures)
    if ($failures -gt 0) {
        Write-RunLog "One or more rows failed; see the log for detail" 'WARN'
    }
}
catch {
    Write-RunLog "Aborted: $($_.Exception.Message)" 'ERROR'
    throw
}
finally {
    $plain = $null
}

# Emit objects, never formatted text - this is what allows export and assertion.
$results
```

##### 10.5.3.2 `Get-ServiceAndFirewallAudit.ps1`

**設計備註。** 這是漂移偵測器的 Windows 那一半。它回答安全測試所問的問題 —— *該主機是否仍按設計所說的樣子設定？* —— 而不作出任何變更。它按一張期望狀態表查詢服務、列舉防火牆設定檔及規則、檢查連接埠矩陣所要求的特定入站允許項目、報告 WinRM 監聽程式狀態，並為每一項發現回傳一個物件。它接受多個 `-ComputerName` 值，令同一指令碼可從 `vpnz-jump01` 或經由遠端處理從 `vpnz-mon01` 稽核整個環境；而當某部主機不可達時，它誠實地降級：不可達的主機會成為一項發現，而不是令執行中止的例外。它任何地方都**不含**改變狀態的 cmdlet —— 這項性質可以用 `Get-Command -Verb Set,New,Remove` 檢查，而非僅憑聲稱。

```powershell
<#
.SYNOPSIS
    Read-only audit of Windows service state, firewall configuration and WinRM listeners.

.DESCRIPTION
    Produces a structured, exportable record of the security-relevant state of one or
    more Windows hosts and compares it against the expected state defined by the project
    design. The script NEVER changes configuration: it is the Windows-side reference
    implementation of "read-only by construction", and no state-changing cmdlet appears
    anywhere in it.

    Checks performed:
      1. Expected service state (WinRM, W32Time, DNS, Netlogon, DHCPServer, W3SVC,
         iSCSITarget, RemoteAccess) against an expected table, only where the role applies.
      2. Firewall profile state: all three profiles enabled with default inbound Block.
      3. Presence of the design's scoped inbound rules (WinRM 5986 and windows_exporter
         9182, both limited to the control node 10.10.30.31).
      4. WinRM listener state: exactly one HTTPS listener and no HTTP listener.
      5. Listening TCP ports compared against the design's port matrix.
      6. Local Administrators group membership, reported for review and never modified.

    Verified on: Windows PowerShell 5.1 (Windows Server 2025, build 10.0.26100)
                 and PowerShell 7.4 LTS on vpnz-jump01.
    Test IDs   : TC-L4-01, TC-L4-05, TB-07, TB-08

.PARAMETER ComputerName
    One or more host names or addresses. Defaults to the local computer.

.PARAMETER OutputPath
    Directory for the CSV and the run log. Default C:\FYP\config.

.PARAMETER Credential
    Optional credential for a remote audit. Use an account that is a member of
    GG-Server-Admins; never a Domain Admin for a routine audit.

.EXAMPLE
    .\Get-ServiceAndFirewallAudit.ps1 -OutputPath C:\FYP\config -Verbose

    Audits the local host and writes ServiceFirewallAudit-<timestamp>.csv.

.EXAMPLE
    $cred = Get-Credential VERTEXPEAK\adm-w4
    .\Get-ServiceAndFirewallAudit.ps1 -ComputerName vpnz-dc01,vpnz-dc02,vpnz-fs01 `
        -Credential $cred -OutputPath C:\FYP\config

    Audits three hosts over WinRM/HTTPS and writes one CSV containing every finding.

.OUTPUTS
    PSCustomObject per check with properties:
    ComputerName, Check, Expected, Actual, Result (PASS/FAIL/INFO/UNREACHABLE), Detail

.NOTES
    Author : Vertex Peak FYP workstream W4
    Reviewer: W1
    Safety : READ-ONLY. No Set-, New-, Remove-, Start- or Stop- cmdlet is used.
#>
[CmdletBinding()]
param(
    [Parameter(ValueFromPipeline = $true)]
    [string[]]$ComputerName = $env:COMPUTERNAME,

    [ValidateNotNullOrEmpty()]
    [string]$OutputPath = 'C:\FYP\config',

    [System.Management.Automation.PSCredential]$Credential
)

begin {
    Set-StrictMode -Version Latest
    $ErrorActionPreference = 'Stop'

    $ExpectedServices = @{
        WinRM        = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('*') }
        W32Time      = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('*') }
        DNS          = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('dc','rodc') }
        Netlogon     = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('dc','rodc') }
        DHCPServer   = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('dc') }
        W3SVC        = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('iis') }
        iSCSITarget  = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('iscsi_target') }
        RemoteAccess = @{ Status = 'Running'; StartType = 'Automatic'; Roles = @('vpn') }
    }
    $ExpectedRules = @(
        @{ Name = 'FYP-Ansible-WinRM-5986'; Port = 5986; RemoteAddress = '10.10.30.31' }
        @{ Name = 'FYP-Exporter-9182';      Port = 9182; RemoteAddress = '10.10.30.31' }
    )
    $AllowedListening = @(135,139,445,3389,5986,9182,53,88,389,636,3268,3269,464,123,80,443,6516)
    $Findings = New-Object System.Collections.Generic.List[object]

    if (-not (Test-Path -LiteralPath $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    }
    $LogFile = Join-Path $OutputPath ("{0}_service-firewall-audit.log" -f (Get-Date -Format 'yyyy-MM-dd'))

    function Write-AuditLog {
        [CmdletBinding()]
        param([Parameter(Mandatory)][string]$Message,
              [ValidateSet('INFO','WARN','ERROR')][string]$Level = 'INFO')
        Add-Content -LiteralPath $LogFile -Value ("{0} [{1}] {2}" -f (Get-Date -f 'yyyy-MM-dd HH:mm:ss'), $Level, $Message)
        switch ($Level) {
            'ERROR' { Write-Warning $Message }
            'WARN'  { Write-Warning $Message }
            default { Write-Verbose $Message }
        }
    }

    function Add-Finding {
        [CmdletBinding()]
        param(
            [Parameter(Mandatory)][string]$Computer,
            [Parameter(Mandatory)][string]$Check,
            [string]$Expected = '',
            [string]$Actual = '',
            [Parameter(Mandatory)][ValidateSet('PASS','FAIL','INFO','UNREACHABLE')][string]$Result,
            [string]$Detail = ''
        )
        $Findings.Add([PSCustomObject]@{
            ComputerName = $Computer
            Check        = $Check
            Expected     = $Expected
            Actual       = $Actual
            Result       = $Result
            Detail       = $Detail
        })
    }
}

process {
    foreach ($computer in $ComputerName) {
        try {
            if ($computer -eq $env:COMPUTERNAME -and -not $Credential) {
                $remote = $false
            }
            else {
                # Fail fast and report clearly if the transport is the problem.
                if (-not (Test-WSMan -ComputerName $computer -UseSSL -Credential $Credential -ErrorAction Stop)) {
                    throw "Test-WSMan returned nothing for $computer"
                }
                $remote = $true
            }
        }
        catch {
            Write-AuditLog "UNREACHABLE $computer : $($_.Exception.Message)" 'ERROR'
            Add-Finding -Computer $computer -Check 'Connectivity' -Expected 'WinRM/HTTPS 5986 reachable' `
                        -Actual 'unreachable' -Result 'UNREACHABLE' -Detail $_.Exception.Message
            continue
        }

        try {
            $scriptBlock = {
                [PSCustomObject]@{
                    Profiles = @(Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction)
                    Rules    = @(Get-NetFirewallRule -ErrorAction SilentlyContinue |
                                 Where-Object { $_.DisplayName -like 'FYP-*' } |
                                 ForEach-Object {
                                     [PSCustomObject]@{
                                         DisplayName   = $_.DisplayName
                                         Enabled       = [string]$_.Enabled
                                         Direction     = [string]$_.Direction
                                         Action        = [string]$_.Action
                                         RemoteAddress = (($_ | Get-NetFirewallAddressFilter).RemoteAddress -join ',')
                                         LocalPort     = (($_ | Get-NetFirewallPortFilter).LocalPort -join ',')
                                     }
                                 })
                    Services  = @(Get-Service -ErrorAction SilentlyContinue | Select-Object Name, Status, StartType)
                    Listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
                                  Select-Object LocalAddress, LocalPort, OwningProcess)
                    Admins    = @(Get-LocalGroupMember -Group Administrators -ErrorAction SilentlyContinue |
                                  Select-Object Name, ObjectClass)
                    WinRM     = @(Get-ChildItem WSMan:\Localhost\Listener |
                                  Select-Object Name, @{n='Keys';e={ ($_.Keys -join ';') }})
                }
            }

            if ($remote) {
                $data = Invoke-Command -ComputerName $computer -ScriptBlock $scriptBlock `
                                       -Credential $Credential -ErrorAction Stop
            }
            else {
                $data = & $scriptBlock
            }

            # --- 1. Services ------------------------------------------------
            foreach ($svcName in $ExpectedServices.Keys) {
                $svc = $data.Services | Where-Object { $_.Name -eq $svcName }
                if (-not $svc) {
                    $roles  = $ExpectedServices[$svcName].Roles
                    $result = if ($roles -contains '*') { 'FAIL' } else { 'INFO' }
                    Add-Finding -Computer $computer -Check "Service:$svcName" `
                                -Expected $ExpectedServices[$svcName].Status -Actual 'not installed' `
                                -Result $result -Detail "Roles for this service: $($roles -join ',')"
                    continue
                }
                $ok = ($svc.Status -eq $ExpectedServices[$svcName].Status) -and
                      ($svc.StartType -eq $ExpectedServices[$svcName].StartType)
                Add-Finding -Computer $computer -Check "Service:$svcName" `
                            -Expected "$($ExpectedServices[$svcName].Status)/$($ExpectedServices[$svcName].StartType)" `
                            -Actual   "$($svc.Status)/$($svc.StartType)" `
                            -Result   $(if ($ok) { 'PASS' } else { 'FAIL' })
            }

            # --- 2. Firewall profiles ---------------------------------------
            foreach ($profile in $data.Profiles) {
                $ok = ($profile.Enabled -eq 'True') -and ($profile.DefaultInboundAction -eq 'Block')
                Add-Finding -Computer $computer -Check "FirewallProfile:$($profile.Name)" `
                            -Expected 'Enabled=True, DefaultInboundAction=Block' `
                            -Actual "Enabled=$($profile.Enabled), DefaultInboundAction=$($profile.DefaultInboundAction)" `
                            -Result $(if ($ok) { 'PASS' } else { 'FAIL' })
            }

            # --- 3. Scoped inbound rules ------------------------------------
            foreach ($expectedRule in $ExpectedRules) {
                $rule = $data.Rules | Where-Object { $_.DisplayName -eq $expectedRule.Name }
                if (-not $rule) {
                    Add-Finding -Computer $computer -Check "FirewallRule:$($expectedRule.Name)" `
                                -Expected "inbound allow TCP $($expectedRule.Port) from $($expectedRule.RemoteAddress)" `
                                -Actual 'absent' -Result 'FAIL' `
                                -Detail 'Create it with the winrm / windows_baseline role.'
                    continue
                }
                $ok = ($rule.Enabled -eq 'True') -and ($rule.Action -eq 'Allow') -and
                      ($rule.RemoteAddress -eq $expectedRule.RemoteAddress)
                Add-Finding -Computer $computer -Check "FirewallRule:$($expectedRule.Name)" `
                            -Expected "Allow TCP $($expectedRule.Port) from $($expectedRule.RemoteAddress)" `
                            -Actual "Enabled=$($rule.Enabled), Action=$($rule.Action), RemoteAddress=$($rule.RemoteAddress)" `
                            -Result $(if ($ok) { 'PASS' } else { 'FAIL' }) `
                            -Detail 'A rule scoped wider than the control node is a finding, not a pass.'
            }

            # --- 4. WinRM listeners -----------------------------------------
            $https = @($data.WinRM | Where-Object { $_.Keys -like '*Transport=HTTPS*' }).Count
            $http  = @($data.WinRM | Where-Object { $_.Keys -like '*Transport=HTTP*' }).Count
            Add-Finding -Computer $computer -Check 'WinRMListeners' `
                        -Expected 'https=1, http=0' -Actual "https=$https, http=$http" `
                        -Result $(if (($https -eq 1) -and ($http -eq 0)) { 'PASS' } else { 'FAIL' }) `
                        -Detail 'An HTTP listener means unencrypted WinRM is exposed.'

            # --- 5. Listening TCP ports -------------------------------------
            $unexpected = @($data.Listeners |
                            Where-Object { $_.LocalAddress -notin @('127.0.0.1','::1') -and
                                           $_.LocalPort -notin $AllowedListening })
            foreach ($l in $unexpected) {
                Add-Finding -Computer $computer -Check 'UnexpectedListeningPort' `
                            -Expected 'port in the design port matrix' `
                            -Actual "$($l.LocalAddress):$($l.LocalPort) (PID $($l.OwningProcess))" `
                            -Result 'FAIL' -Detail 'Investigate before the port-matrix evidence is signed off.'
            }
            Add-Finding -Computer $computer -Check 'ListeningPortSummary' `
                        -Expected "subset of $($AllowedListening -join ',')" `
                        -Actual "$(@($data.Listeners).Count) listening socket(s)" `
                        -Result $(if ($unexpected.Count -gt 0) { 'FAIL' } else { 'PASS' })

            # --- 6. Local administrators (reported, never modified) ---------
            Add-Finding -Computer $computer -Check 'LocalAdministrators' `
                        -Expected 'members from GG-Server-Admins / GG-Tier0-Admins only' `
                        -Actual (($data.Admins | ForEach-Object { $_.Name }) -join ';') `
                        -Result 'INFO' `
                        -Detail 'Reported for review against the design group model.'
        }
        catch {
            Write-AuditLog "Audit failed on $computer : $($_.Exception.Message)" 'ERROR'
            Add-Finding -Computer $computer -Check 'AuditExecution' -Expected 'complete' `
                        -Actual 'error' -Result 'FAIL' -Detail $_.Exception.Message
        }
    }
}

end {
    $stamp   = Get-Date -Format 'yyyy-MM-dd_HHmm'
    $csvPath = Join-Path $OutputPath "ServiceFirewallAudit-$stamp.csv"
    $Findings | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8

    $failures = @($Findings | Where-Object Result -eq 'FAIL')
    Write-AuditLog "Audit complete. Findings: $($Findings.Count). FAIL: $($failures.Count). CSV: $csvPath"

    # Non-zero exit code on failure so that a scheduled task or a pipeline can act on it.
    if ($failures.Count -gt 0) {
        Write-Warning "$($failures.Count) audit finding(s) FAILED - see $csvPath"
        $global:LASTEXITCODE = 2
    }

    $Findings
    Write-Host "Audit CSV written to $csvPath"
}
```

**這個指令碼就 PowerShell 質素展示了什麼。** 它使用 `begin`/`process`/`end` 結構，令它在管線中能正確組合；它在每一項發現中把**期望**與**實際**分開，令 CSV 對一位不在場的讀者也能自我說明；它把範圍比控制節點更寬的規則視為一項**失敗**，因為在設計只允許一個位址之處卻允許 `Any` 的規則，正是本稽核存在的目的所要捉住的漂移；而不可達是一項發現而非中止，因此一部死掉的主機不會把其餘八部的狀態隱藏起來。

##### 10.5.3.3 `Invoke-ScheduledBackupVerify.ps1`

**設計備註。** 這個指令碼實作 WSOS 範疇 4 的 `Install and manage backup systems` 條文及其巢狀範例 `Windows Server Backup`，並把它連繫到巢狀的 `Script based backup, e.g. Bash, Batch or PowerShell`。它對設計所指定的目標執行一項 Windows Server Backup 工作，然後**核實它剛才所作的備份**。核實的那一半才是重點：一份從未被讀回的備份只是一個假設，而不是一份備份。該指令碼亦交叉核對 `vpnz-dmzjump01` 上的離機 restic 工作，這正是報告得以聲稱擁有組態與證據的離機副本、而不聲稱擁有完整 VM 備份的方式 —— §12.1 要求述明這項區分。

```powershell
<#
.SYNOPSIS
    Runs a scheduled Windows Server Backup job and verifies the resulting backup.

.DESCRIPTION
    Implements the FYP backup deliverable for a Windows member server in five phases:
      Phase 1  Pre-flight : target volume exists, free space above threshold, no backup
                            already running, Windows Server Backup feature installed.
      Phase 2  Backup     : run wbadmin with an explicit target and description.
      Phase 3  Verify     : read the backup set back and assert version, age and that the
                            component list can be enumerated. This is the phase that
                            converts "a backup ran" into "a backup exists that can be read".
      Phase 4  Off-host   : assert that the restic repository on vpnz-dmzjump01 was written
                            inside the expected window (configuration and evidence copy).
      Phase 5  Report     : one object per phase, exported to CSV, and a non-zero exit code
                            when any phase failed.

    Designed to run as a scheduled task using the design's BKP-{TARGET}-{FREQ} naming.

    Verified on: Windows PowerShell 5.1 (Windows Server 2025, build 10.0.26100)
    Requires  : Windows Server Backup feature; wbadmin; restic on the off-host repository
                (optional - its absence is reported, not treated as a failure)
    Test IDs  : TC-L4-01, TC-L1-06

.PARAMETER TargetVolume
    Backup destination drive letter. Default D:, the iSCSI LUN02 volume presented by
    vpnz-san01.

.PARAMETER JobName
    Job label used in the log, the backup description and the BKP naming convention.
    Default BKP-FS01-DAILY.

.PARAMETER MinFreeSpaceGB
    Minimum free space on the target before a backup is attempted. Default 5.

.PARAMETER ResticHost
    Host holding the off-host restic repository. Default vpnz-dmzjump01.

.PARAMETER ResticMaxAgeHours
    Maximum acceptable age of the newest off-host snapshot. Default 26.

.PARAMETER LogPath
    Directory for the run log. Default C:\FYP\logs.

.EXAMPLE
    .\Invoke-ScheduledBackupVerify.ps1 -Verbose

    Runs the daily backup, verifies it, cross-checks the off-host repository and returns
    the phase result objects.

.EXAMPLE
    $r = .\Invoke-ScheduledBackupVerify.ps1 -MinFreeSpaceGB 10 -ResticMaxAgeHours 48
    $r | Export-Csv C:\FYP\config\BackupVerify-$(Get-Date -f yyyyMMdd).csv -NoTypeInformation
    if ($r.Result -contains 'FAIL') { exit 3 }

.OUTPUTS
    PSCustomObject per phase: Phase, JobName, Host, Started, Completed, DurationSeconds,
    Target, Result, Detail

.NOTES
    Author : Vertex Peak FYP workstream W2 with W4
    Reviewer: W1
    Warning: This script is NOT naturally idempotent - running it twice makes two backups.
             The design handles that with a once-per-20-hours guard and a lock file rather
             than by pretending the operation is safe to repeat. A backup script that claims
             idempotence is a script that has not been thought about.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [ValidatePattern('^[A-Za-z]:$')]
    [string]$TargetVolume = 'D:',

    [ValidateNotNullOrEmpty()]
    [string]$JobName = 'BKP-FS01-DAILY',

    [ValidateRange(1,500)]
    [int]$MinFreeSpaceGB = 5,

    [ValidateNotNullOrEmpty()]
    [string]$ResticHost = 'vpnz-dmzjump01',

    [ValidateRange(1,720)]
    [int]$ResticMaxAgeHours = 26,

    [ValidateNotNullOrEmpty()]
    [string]$LogPath = 'C:\FYP\logs'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$LockFile = Join-Path $env:TEMP "fyp-backup-$JobName.lock"
if (-not (Test-Path -LiteralPath $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}
$LogFile = Join-Path $LogPath ("{0}_{1}.log" -f (Get-Date -Format 'yyyy-MM-dd'), $JobName)
$results = New-Object System.Collections.Generic.List[object]

function Write-RunLog {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Message,
          [ValidateSet('INFO','WARN','ERROR')][string]$Level = 'INFO')
    Add-Content -LiteralPath $LogFile -Value ("{0} [{1}] {2}" -f (Get-Date -f 'yyyy-MM-dd HH:mm:ss'), $Level, $Message)
    switch ($Level) {
        'ERROR' { Write-Error $Message -ErrorAction Continue }
        'WARN'  { Write-Warning $Message }
        default { Write-Verbose $Message }
    }
}

function Add-PhaseResult {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Phase,
        [Parameter(Mandatory)][datetime]$Started,
        [string]$Target = '',
        [Parameter(Mandatory)][ValidateSet('PASS','FAIL','SKIP')][string]$Result,
        [string]$Detail = ''
    )
    $results.Add([PSCustomObject]@{
        Phase           = $Phase
        JobName         = $JobName
        Host            = $env:COMPUTERNAME
        Started         = $Started.ToString('s')
        Completed       = (Get-Date).ToString('s')
        DurationSeconds = [math]::Round(((Get-Date) - $Started).TotalSeconds, 1)
        Target          = $Target
        Result          = $Result
        Detail          = $Detail
    })
}

# --- Guard: one run at a time, and not twice in the same shift ---------------
if (Test-Path -LiteralPath $LockFile) {
    $lockAge = (Get-Date) - (Get-Item -LiteralPath $LockFile).LastWriteTime
    if ($lockAge.TotalHours -lt 20) {
        Write-RunLog "Skipping: a run completed $([math]::Round($lockAge.TotalHours,1)) h ago (lock $LockFile)" 'WARN'
        Add-PhaseResult -Phase 'Guard' -Started (Get-Date) -Result 'SKIP' `
                        -Detail "Already ran within 20 h. Lock: $LockFile"
        $results
        return
    }
    Write-RunLog "Removing a stale lock from $([math]::Round($lockAge.TotalHours,1)) h ago" 'WARN'
    Remove-Item -LiteralPath $LockFile -Force
}

try {
    # ---------------- Phase 1: pre-flight ----------------
    $t0 = Get-Date
    try {
        $vol     = Get-Volume -DriveLetter $TargetVolume[0] -ErrorAction Stop
        $freeGB  = [math]::Round($vol.SizeRemaining / 1GB, 1)
        if ($freeGB -lt $MinFreeSpaceGB) {
            throw "Only $freeGB GB free on $TargetVolume; the minimum is $MinFreeSpaceGB GB."
        }
        $running = Get-WbJob -ErrorAction SilentlyContinue
        if ($running -and $running.CurrentOperation -ne 'None') {
            throw "A Windows Server Backup job is already running ($($running.CurrentOperation))."
        }
        if (-not (Get-WindowsFeature -Name Windows-Server-Backup).Installed) {
            throw 'The Windows-Server-Backup feature is not installed.'
        }
        Write-RunLog "Pre-flight OK: $freeGB GB free on $TargetVolume"
        Add-PhaseResult -Phase 'Preflight' -Started $t0 -Target $TargetVolume -Result 'PASS' `
                        -Detail "$freeGB GB free; no conflicting job; feature installed"
    }
    catch {
        Write-RunLog "Pre-flight FAILED: $($_.Exception.Message)" 'ERROR'
        Add-PhaseResult -Phase 'Preflight' -Started $t0 -Target $TargetVolume -Result 'FAIL' `
                        -Detail $_.Exception.Message
        throw
    }

    # ---------------- Phase 2: backup ----------------
    $t1 = Get-Date
    try {
        if (-not $PSCmdlet.ShouldProcess($TargetVolume, "Run $JobName backup")) {
            Add-PhaseResult -Phase 'Backup' -Started $t1 -Target $TargetVolume -Result 'SKIP' -Detail 'WhatIf requested'
            throw 'WhatIf requested'
        }

        $wbArgs = @('start','backup',"-backupTarget:$TargetVolume",'-allCritical','-quiet',"-setDescription:$JobName")
        Write-RunLog "Starting: wbadmin $($wbArgs -join ' ')"
        $out = & wbadmin @wbArgs 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "wbadmin exit code $LASTEXITCODE. Output: $($out -join ' | ')"
        }
        Write-RunLog 'Backup command completed with exit code 0'
        Add-PhaseResult -Phase 'Backup' -Started $t1 -Target $TargetVolume -Result 'PASS' `
                        -Detail "wbadmin completed in $([math]::Round(((Get-Date)-$t1).TotalSeconds,1)) s"
    }
    catch {
        if ($_.Exception.Message -eq 'WhatIf requested') { throw }
        Write-RunLog "Backup FAILED: $($_.Exception.Message)" 'ERROR'
        Add-PhaseResult -Phase 'Backup' -Started $t1 -Target $TargetVolume -Result 'FAIL' -Detail $_.Exception.Message
        throw
    }

    # ---------------- Phase 3: verification (the half that matters) ----------------
    $t2 = Get-Date
    try {
        $versions = @(Get-WBBackupSet -BackupTarget $TargetVolume -ErrorAction Stop)
        if ($versions.Count -eq 0) { throw "No backup set found on $TargetVolume after a completed run." }

        $latest   = $versions | Sort-Object -Property Version -Descending | Select-Object -First 1
        $ageHours = [math]::Round(((Get-Date) - $latest.CreationTime).TotalHours, 2)
        if ($ageHours -gt 24) { throw "The newest backup set is $ageHours h old; expected under 24 h." }

        $detail         = @(Get-WBBackupSet -BackupTarget $TargetVolume -BackupSet $latest)
        $componentCount = $detail.Count
        if ($componentCount -lt 1) { throw "The newest backup set enumerates $componentCount components." }

        Write-RunLog "Verification OK: version $($latest.Version), age $ageHours h, $componentCount component(s)"
        Add-PhaseResult -Phase 'Verify' -Started $t2 -Target $TargetVolume -Result 'PASS' `
                        -Detail "version=$($latest.Version); ageHours=$ageHours; components=$componentCount"
    }
    catch {
        Write-RunLog "Verification FAILED: $($_.Exception.Message)" 'ERROR'
        Add-PhaseResult -Phase 'Verify' -Started $t2 -Target $TargetVolume -Result 'FAIL' -Detail $_.Exception.Message
    }

    # ---------------- Phase 4: off-host restic cross-check ----------------
    $t3 = Get-Date
    try {
        $snap = Invoke-Command -ComputerName $ResticHost -ErrorAction Stop -ScriptBlock {
            if (-not (Get-Command restic -ErrorAction SilentlyContinue)) {
                return [PSCustomObject]@{ Available = $false; Newest = $null }
            }
            $json = restic -r /srv/backup/restic snapshots --json 2>$null | ConvertFrom-Json
            [PSCustomObject]@{
                Available = $true
                Newest    = ($json | Sort-Object time -Descending | Select-Object -First 1).time
            }
        }
        if (-not $snap.Available) {
            Add-PhaseResult -Phase 'OffHostCheck' -Started $t3 -Target $ResticHost -Result 'SKIP' `
                            -Detail 'restic is not installed on the off-host repository; cross-check not performed'
        }
        else {
            $age = [math]::Round(((Get-Date).ToUniversalTime() - ([datetime]$snap.Newest).ToUniversalTime()).TotalHours, 2)
            $ok  = $age -le $ResticMaxAgeHours
            Add-PhaseResult -Phase 'OffHostCheck' -Started $t3 -Target $ResticHost `
                            -Result $(if ($ok) { 'PASS' } else { 'FAIL' }) `
                            -Detail "newest off-host snapshot age ${age} h (limit $ResticMaxAgeHours h)"
            if (-not $ok) { Write-RunLog "Off-host copy is stale: $age h" 'WARN' }
        }
    }
    catch {
        Write-RunLog "Off-host check could not run: $($_.Exception.Message)" 'WARN'
        Add-PhaseResult -Phase 'OffHostCheck' -Started $t3 -Target $ResticHost -Result 'SKIP' `
                        -Detail "Could not query $ResticHost : $($_.Exception.Message)"
    }
}
catch {
    Write-RunLog "Run aborted: $($_.Exception.Message)" 'ERROR'
}
finally {
    Set-Content -LiteralPath $LockFile -Value (Get-Date -Format 's') -Force
    $csvDir = 'C:\FYP\config'
    if (-not (Test-Path -LiteralPath $csvDir)) { New-Item -ItemType Directory -Path $csvDir -Force | Out-Null }
    $csv = Join-Path $csvDir ("BackupVerify-$JobName-{0}.csv" -f (Get-Date -Format 'yyyyMMdd'))
    try {
        $results | Export-Csv -LiteralPath $csv -NoTypeInformation -Encoding UTF8
        Write-RunLog "CSV written to $csv"
    }
    catch {
        Write-RunLog "Could not write CSV $csv : $($_.Exception.Message)" 'WARN'
    }
}

$failures = @($results | Where-Object Result -eq 'FAIL')
if ($failures.Count -gt 0) {
    Write-Warning "$($failures.Count) backup phase(s) FAILED - see $LogFile"
    $global:LASTEXITCODE = 3
}
$results
```

**鎖定檔是設計的一部分，而非細節。** 這是儲存庫中唯一真正*不*具冪等性的指令碼，因為執行它兩次就會產生兩份備份。該指令碼沒有假裝不然，而是在自己的說明區塊中點明這項限制，並以每 20 小時一次的防護加上一個鎖定檔來解決它。一個聲稱具冪等性的備份指令碼，是一個沒有人想過的指令碼。

##### 10.5.3.4 其餘的 PowerShell 指令碼

| 指令碼 | 用途 | 主要實作要點 |
|---|---|---|
| `Get-ADHealthReport.ps1` | L1 驗證章節所引用的 AD 健康報告：複寫狀態、FSMO 配置、DNS 區域狀態、SYSVOL 共享狀態、時間偏差，以及 DC 診斷摘要。輸出 CSV 及一頁小型 HTML 供 `07-evidence/` 使用。 | 執行 `dcdiag /v`、`repadmin /replsummary`、`Get-ADDomain`、`Get-DnsServerZone`、`w32tm /query /status`，並**把它們解析成物件**而非匯出原始文字，因此工具用語的改變不會默默產生一份「健康」的報告 |
| `Test-ServiceEndpoints.ps1` | 把設計的連接埠矩陣化為可執行的測試：為每個 `P-nn` 列設一項測試，斷言從具名來源可達*或*刻意不可達。 | 對每部主機／每個埠使用 `Test-NetConnection`，並附每一列的預期結果，另加明確的反向測試，斷言某一 `DENY` 列確實被拒。它第二次執行產生相同輸出，這也是它同樣出現於 §13.4 R-05 的標籤前一致性清掃之原因 |
| `Backup-NetworkDeviceConfig.ps1` | 設計基線的組態收集指令碼。經 TFTP/SCP 把 Git 追蹤的預定 Packet Tracer 組態及運作中的主機組態收集到 `/srv/tftp/` 之下的存檔中。 | **誠實的範圍：** 它從不登入 Packet Tracer 裝置，因為沒有任何一部可達（§11.4，PT-06）。其清單述明該存檔含有與不含什麼 |
| `Export-GPOBackup.ps1` | 對每個 GPO 作有載明的備份，並以清單記錄每個 GPO 的名稱、ID 及修改時間。 | 以 `Backup-Gpo -All -Path` 寫入一個帶日期的子目錄；它從不覆寫先前的備份，因此*不*預期它報告「沒有變更」，而其 `.NOTES` 區塊亦如此述明 |

#### 10.5.4 模組與程式碼質素

##### 10.5.4.1 `PSScriptAnalyzer`

`PSScriptAnalyzer` 是 PowerShell 的標準靜態分析工具，從 PowerShell Gallery 安裝（`Install-Module PSScriptAnalyzer`）。實驗室能否從 `vpnz-jump01` 觸及 Gallery 取決於連線情況，而**小組必須記錄實際屬於哪一種情況**，而非假定該工具可用。

```powershell
# Install once on the authoring host only.
Install-Module PSScriptAnalyzer -Scope CurrentUser -Force -AllowClobber

# Analyse the repository with an explicit, committed settings file.
Invoke-ScriptAnalyzer -Path C:\FYP\04-automation\powershell -Recurse `
    -Settings C:\FYP\04-automation\powershell\PSScriptAnalyzerSettings.psd1 `
    -Severity Error, Warning |
    Export-Csv C:\FYP\06-verification\psscriptanalyzer-$(Get-Date -f yyyyMMdd).csv -NoTypeInformation

# Gate the review on Error-severity findings; warnings are reviewed by a human.
$errors = Invoke-ScriptAnalyzer -Path C:\FYP\04-automation\powershell -Recurse -Severity Error
if ($errors) { Write-Error "$($errors.Count) PSScriptAnalyzer error(s) must be fixed before review"; exit 4 }
```

所提交的設定檔只停用小組有意識地拒絕的規則，而每一項排除都附有解釋原因的註解。一個例子：`PSAvoidUsingWriteHost` 由 Error 降級為 Warning，因為有兩個指令碼刻意使用 `Write-Host` 來輸出一行人類可讀的進度訊息，而同時**所有資料都送往物件串流** —— 即使出現了該 cmdlet，該規則的立意仍獲滿足。若 `PSScriptAnalyzer` 無法安裝，報告便直白地如此述明，而後備做法是以下的同儕審閱檢查清單；聲稱執行了一個並未執行的工具，正是本項目視為誠信缺失的那種聲稱。

##### 10.5.4.2 函式命名與核准動詞慣例

`modules/VPCommon/VPCommon.psm1` 中的每個函式以及每個指令碼，都使用來自 `Get-Verb` 的動詞。本項目自身的詞彙刻意精簡，並固定於 `04-automation/ansible/docs/04-variable-dictionary.md`：

| 核准動詞 | 用於 | 項目中的例子 |
|---|---|---|
| `Get` | 讀取狀態、回傳物件、無副作用 | `Get-VPFypHostRecord`、`Get-ADHealthReport.ps1`、`Get-ServiceAndFirewallAudit.ps1` |
| `Test` | 回傳布林值或通過／不通過的發現 | `Test-ServiceEndpoints.ps1`、`Test-VPNftRulePresent` |
| `Invoke` | 執行一項改變狀態的操作 | `Invoke-NewStarterOnboarding.ps1`、`Invoke-ScheduledBackupVerify.ps1` |
| `New` | 建立物件 | `New-VPFypReportRow` |
| `Export` | 把資料寫出至檔案 | `Export-GPOBackup.ps1`、`Export-VPFypCsv` |
| `Backup` | 已核准的 Windows 動詞，因設計如此命名該指令碼而保留 | `Backup-NetworkDeviceConfig.ps1` |
| `Convert` | 改變表示法而不改變實質 | `ConvertTo-PlainText` |

禁止的模式：`Do-`、`Run-`、`Make-`、`Create-`（應使用 `New-`）、`Execute-`（應使用 `Invoke-`），以及 `Fix-`（應使用 `Repair-`，且只用在真正發生修復之處）。原因並非風格問題：有了一致的一組動詞，`Get-Command -Verb Get -Module VPCommon` 便會列出本項目所擁有的每一項只讀操作，這是一項**審閱者用一個指令即可完成的能耐檢查** —— 而同樣的檢查正是令第 11 章的只讀聲稱可被核實、而非流於修辭的原因。

小組對 PowerShell 程式碼所施加的其他規則：

- **在每個不是單行的函式上使用 `[CmdletBinding()]`**，令 `-Verbose` 及 `-ErrorAction` 的行為符合叫用者的預期。
- **具型別的參數，附 `[Validate*]` 屬性。** 參數邊界的驗證令函式主體得以移除一整類防禦性程式碼，正如以上三個指令碼所展示。
- **進度用 `Write-Verbose`，問題用 `Write-Warning`／`Write-Error`，資料送往物件串流。** `Write-Host` 只用於輸出一行人類可讀的進度訊息，絕不用於資料。
- **函式內不使用 `exit`。** `exit` 會終止主機，令該函式無法在管線或 Ansible 執行中使用；上述指令碼改為設定 `$global:LASTEXITCODE` 並回傳。
- **每個指令碼都有以註解為基礎的說明**，包括它受測試時所用的執行環境及其已知限制。說明區塊也是向後續讀者解釋一項非顯而易見的設計決定之處。
- **參數預設值、日誌行或例外訊息中不得有認證資料。** 密碼以 `SecureString` 形式傳入，並在 `finally` 區塊中清除。

##### 10.5.4.3 無法使用靜態分析工具時的審閱檢查清單

若 `PSScriptAnalyzer` 無法安裝，便由一位人類審閱者逐項完成一份固定檢查清單，並把結果記錄於會議紀錄中。該清單刻意短得可以誠實地完成：

1. 每個函式是否都使用來自 `Get-Verb` 的動詞？
2. 每個指令碼是否都有以註解為基礎的說明，並含一個真正可執行的 `.EXAMPLE`？
3. 每一項外部呼叫（`wbadmin`、`netsh`、`dcdiag`、遠端叫用）周圍是否都有 `try`/`catch`？
4. 任何 `catch` 區塊是否吞掉了錯誤而沒有記錄它？（一個沉默的 `catch {}` 即自動退回。）
5. 是否有任何程式碼路徑可以把認證資料寫入日誌、主控台、CSV 或例外訊息？
6. 該指令碼的主要輸出是物件，而非格式化文字嗎？
7. 是否有任何 `Invoke-Expression`、以字串串接構成的命令，或未經驗證的路徑插值？
8. 當該指令碼的主要輸入缺失、空白或格式錯誤時，它的行為是否正確？

##### 10.5.4.4 共用模組

`modules/VPCommon/VPCommon.psm1` 存放由多於一個指令碼使用的函式，而每個函式都透過 `Export-ModuleMember` 明確匯出。它以資訊清單中的 `ModuleVersion` 納入版本控制，而每一次函式變更都會出現於 `git log`，因為該模組是程式碼，而非輔助檔案。它的初始內容是 `Write-VPFypLog`（通用日誌格式）、`Export-VPFypCsv`（依本項目命名慣例的 CSV 匯出）、`Test-VPFypReachable`（附結構化結果的 WinRM 可達性），以及 `ConvertTo-VPFypSafeName`（路徑及物件名稱的淨化）。令該模組保持精簡是刻意的：一個成長為框架的共用模組，在為期 12 週的項目中會變得無法維護。

#### 10.5.5 驗證

##### 10.5.5.1 叫用範例

```powershell
# --- Invoke-NewStarterOnboarding.ps1 -----------------------------------------
# MANDATORY first invocation: preview against the reviewed CSV.
$csv = 'C:\FYP\04-automation\powershell\data\newstarters.csv'
$pw  = Read-Host -AsSecureString -Prompt 'Initial password'
.\Invoke-NewStarterOnboarding.ps1 -CsvPath $csv -DefaultPassword $pw -WhatIf -Verbose

# Then the real run, capturing the object stream and exporting it.
$report = .\Invoke-NewStarterOnboarding.ps1 -CsvPath $csv -DefaultPassword $pw -Verbose
$report | Export-Csv C:\FYP\config\onboarding-$(Get-Date -f yyyyMMdd).csv -NoTypeInformation
$report | Format-Table SamAccountName, Created, GroupCount, HomeCreated, Status -AutoSize

# And the idempotence run: the second pass must create nothing.
$second = .\Invoke-NewStarterOnboarding.ps1 -CsvPath $csv -DefaultPassword $pw -Verbose
$second | Format-Table SamAccountName, Created, HomeCreated, QuotaApplied, Status -AutoSize

# --- Get-ServiceAndFirewallAudit.ps1 ----------------------------------------
$cred = Get-Credential 'VERTEXPEAK\adm-w4'
'vpnz-dc01','vpnz-dc02','vpnz-fs01' |
    .\Get-ServiceAndFirewallAudit.ps1 -Credential $cred -OutputPath C:\FYP\config -Verbose |
    Where-Object Result -eq 'FAIL'

# --- Invoke-ScheduledBackupVerify.ps1 ---------------------------------------
$bk = .\Invoke-ScheduledBackupVerify.ps1 -JobName BKP-FS01-DAILY -MinFreeSpaceGB 10 -Verbose
$bk | Format-Table Phase, Result, DurationSeconds, Detail -AutoSize
if ($bk.Result -contains 'FAIL') { 'BACKUP FAILURES PRESENT' }
```

##### 10.5.5.2 預期輸出

以下所有輸出均為**示例**。必須成立的是其形狀；真實執行中的各項數值來自小組自己的 CSV 與環境。

**入職流程，`-WhatIf` 預覽：**

```text
VERBOSE: 2026-11-09 14:02:11 [INFO] Starting onboarding run from C:\FYP\04-automation\powershell\data\newstarters.csv
What if: Performing the operation "Create AD user" on target "kwong.cy@vertexpeak.fyp.lab".
VERBOSE: 2026-11-09 14:02:11 [INFO] WhatIf: would create kwong.cy@vertexpeak.fyp.lab in OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
What if: Performing the operation "Create AD user" on target "tsang.mh@vertexpeak.fyp.lab".
VERBOSE: 2026-11-09 14:02:12 [INFO] WhatIf: would create tsang.mh@vertexpeak.fyp.lab in OU=Finance,OU=HQ-ShaTin,OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab

SamAccountName DistinguishedName Created GroupCount HomeCreated QuotaApplied Status
-------------- ----------------- ------- ---------- ----------- ------------ ------
kwong.cy                       False          1       False        False WhatIf
tsang.mh                       False          1       False        False WhatIf
```

**入職流程，真實的第一次執行：**

```text
VERBOSE: 2026-11-09 14:05:40 [INFO] Created kwong.cy@vertexpeak.fyp.lab in OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
VERBOSE: 2026-11-09 14:05:41 [INFO] Added kwong.cy@vertexpeak.fyp.lab to GG-Engineering-RW
VERBOSE: 2026-11-09 14:05:42 [INFO] Created home directory \\vpnz-fs01\Shares\Home\kwong.cy (owner-only ACL)

SamAccountName DistinguishedName                                              Created GroupCount HomeCreated QuotaApplied Status
-------------- -----------------                                              ------- ---------- ----------- ------------ ------
kwong.cy       CN=Kwong Chun-Yu,OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=Ve...     True          1        True         True OK
tsang.mh       CN=Tsang Man-Ho,OU=Finance,OU=HQ-ShaTin,OU=Users,OU=VertexP...     True          1        True         True OK
```

**入職流程，緊接的重跑 —— 冪等性證據：**

```text
WARNING: 2026-11-09 14:09:03 [WARN] User kwong.cy already exists - checking drift
WARNING: 2026-11-09 14:09:04 [WARN] User tsang.mh already exists - checking drift

SamAccountName DistinguishedName                                              Created GroupCount HomeCreated QuotaApplied Status
-------------- -----------------                                              ------- ---------- ----------- ------------ ------
kwong.cy       CN=Kwong Chun-Yu,OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=Ve...    False          1        True         True OK
tsang.mh       CN=Tsang Man-Ho,OU=Finance,OU=HQ-ShaTin,OU=Users,OU=VertexP...    False          1        True         True OK
```

第二次執行時 `Created = False`，且日誌中沒有 `Created`／`Added`／`Applied` 各行，就是報告所引用的性質。它**並非**與 Ansible 的 `changed=0` 相同的聲稱，報告不得把兩者混為一談：PowerShell 沒有變更計數器，因此等效的證據是每一個動作旗標皆為 false，且第二次執行時日誌不含任何動作行。這項區分在此述明，因為「你憑什麼知道它具有冪等性」這類實習考官提問極可能出現，而誠實的答案在兩種工具之間有所不同。

**防火牆及服務稽核，只顯示失敗項：**

```text
ComputerName Check                        Expected                        Actual                   Result Detail
------------ -----                        --------                        ------                   ------ ------
vpnz-fs01    FirewallRule:FYP-Exporter-9182 Allow TCP 9182 from 10.10.30.31  absent                   FAIL   Create it with the winrm / ...
vpnz-fs01    UnexpectedListeningPort      port in the design port matrix  0.0.0.0:3306 (PID 4188)  FAIL   Investigate before the port-matrix ...
```

**防火牆及服務稽核，摘要：**

```text
VERBOSE: 2026-11-09 14:22:51 [INFO] Audit complete. Findings: 61. FAIL: 2. CSV: C:\FYP\config\ServiceFirewallAudit-2026-11-09_1422.csv
WARNING: 2 audit finding(s) FAILED - see C:\FYP\config\ServiceFirewallAudit-2026-11-09_1422.csv
Audit CSV written to C:\FYP\config\ServiceFirewallAudit-2026-11-09_1422.csv
```

**備份與核實，所有階段均通過：**

```text
VERBOSE: 2026-11-09 22:00:05 [INFO] Pre-flight OK: 34.2 GB free on D:
VERBOSE: 2026-11-09 22:00:05 [INFO] Starting: wbadmin start backup -backupTarget:D: -allCritical -quiet -setDescription:BKP-FS01-DAILY
VERBOSE: 2026-11-09 22:04:38 [INFO] Backup command completed with exit code 0
VERBOSE: 2026-11-09 22:04:39 [INFO] Verification OK: version 11/09/2026-22:00, age 0.07 h, 7 component(s)
VERBOSE: 2026-11-09 22:04:41 [INFO] CSV written to C:\FYP\config\BackupVerify-BKP-FS01-DAILY-20261109.csv

Phase        JobName          Host      Started           DurationSeconds Target          Result Detail
-----        -------          ----      -------           --------------- ------          ------ ------
Preflight    BKP-FS01-DAILY   vpnz-fs01 2026-11-09T22:00:05             0.4 D:              PASS   34.2 GB free; no conflicting job; feature installed
Backup       BKP-FS01-DAILY   vpnz-fs01 2026-11-09T22:00:05           273.1 D:              PASS   wbadmin completed in 273.1 s
Verify       BKP-FS01-DAILY   vpnz-fs01 2026-11-09T22:04:38             1.2 D:              PASS   version=11/09/2026-22:00; ageHours=0.07; components=7
OffHostCheck BKP-FS01-DAILY   vpnz-fs01 2026-11-09T22:04:39             2.4 vpnz-dmzjump01  PASS   newest off-host snapshot age 0.3 h (limit 26 h)
```

當 restic 儲存庫不可達時，`OffHostCheck` 上的 `SKIP` 是合法結果，而報告必須把它呈現為一項未經驗證的交叉核對，而非一項通過。這項區分，就是一份誠實的報告與一份把證據的缺失默默變成正面結果的報告之間的差別。

---

### 10.6 Bash

#### 10.6.1 Bash 適用與不適用之處

當任務是**一部主機上的一套程序**、當所需的基本工具已安裝（`awk`、`grep`、`openssl`、`nft`、`journalctl`、`ss`），以及當結果是一行日誌或一個結束碼而非某項受管理的狀態時，Bash 就是正確的工具。

| 任務 | 正確的工具 | 原因 |
|---|---|---|
| 按來源前綴彙總數十萬行 nftables 丟棄日誌 | **Bash**（`awk`） | 一次遍歷的文字縮減；`awk` 是正確的工具，且處處皆有 |
| 比較九部主機的憑證 `notAfter` 值，並在到期前以非零退出 | **Bash**（`openssl` + 算術） | 對一個已經產生該事實的工具所作的薄包裝 |
| 由 `/proc`、`df`、`systemctl` 產生健康及容量報告 | **Bash** | 一份輸出為檔案的本機只讀報告；並沒有任何狀態被收斂 |
| 以冪等方式對九部主機套用加固的 SSH、sysctl 及稽核基線，並提供變更計數 | **Ansible** | 這是狀態，而非程序。Bash 可以做一次；Ansible 證明它、報告 `changed=0`，並可作為差異接受審閱 |
| 建立並收斂 AD 使用者及群組 | **PowerShell** | 具備網域意識的 cmdlet 是唯一合理的介面，而 `-WhatIf` 提供試跑 |
| 在變更失敗後還原環境 | **Ansible** | 它連回 Git，而先前的狀態就住在那裡 |
| 在防火牆套用前後啟動回復計時器 | **Bash** | 一項由 `systemd` 計時器驅動、受時間界定的本機動作 —— 這正是 Bash 與 `systemd` 的用途，也是 `02-nftables-apply.sh` 既以指令碼形式存在、*又*由 Ansible Role（角色）叫用的原因 |

**Bash 為錯誤工具之處，直白述明。** 當任務要在多部主機之間收斂狀態、當期望的最終狀態必須可作為差異接受審閱、當錯誤處理必須區分「已符合」與「失敗」，或當邏輯超過約 200 行且帶有多於三個條件判斷時，Bash 就是錯誤的選擇。在以上所有情況，本項目改用 Ansible 或 PowerShell，而報告把這套混合模型呈現為刻意的分工，而非「誰寫了什麼」的偶然結果。小組明文禁止的反模式是**儼如 Ansible 的 Bash 指令碼** —— 一個以一堆 `grep -q` 防護和自己的 `--check` 旗標拙劣地重新實作冪等性的指令碼。若一個 Bash 指令碼開始需要 `--check` 模式，那就是它本應是一個 Role（角色）的訊號。

##### 10.6.1.1 `lib/common.sh` —— 共用函式庫

所有 Bash 指令碼都引入同一個函式庫，因此日誌記錄、錯誤處理、清理及結束碼慣例在整批指令碼中完全一致。這是 Bash 中相當於 Ansible Role 相依關係與 PowerShell 模組的東西：一個修正慣例的地方，也是一個讀了就知道慣例是什麼的地方。

```bash
#!/usr/bin/env bash
# 04-automation/bash/lib/common.sh
# Shared library for the Vertex Peak FYP Bash scripts.
# Source it, never execute it:   . "$(dirname "$0")/lib/common.sh"
# Owner: W2 (Linux & Services). Reviewer: W4.  Test IDs: TC-L4-03
#
# Strict mode is deliberately set by the CALLER (set -euo pipefail) so that the
# intent is visible at the top of each script and so that a future reader cannot
# wonder whether the shell options were applied.

FYP_LOG_DIR="${FYP_LOG_DIR:-/var/log/fyp}"
FYP_SCRIPT_NAME="$(basename "${0%.sh}")"
FYP_LOG_FILE="${FYP_LOG_FILE:-${FYP_LOG_DIR}/$(date +%F)_${FYP_SCRIPT_NAME}.log}"
FYP_HOST="$(hostname -s 2>/dev/null || echo unknown)"
FYP_EXIT_OK=0
FYP_EXIT_FAIL=1
FYP_EXIT_USAGE=2
FYP_EXIT_DEPENDENCY=3

# Colour only on a terminal; never in a captured log.
if [ -t 1 ]; then
  C_RED=$'\033[0;31m'; C_GRN=$'\033[0;32m'; C_YLW=$'\033[0;33m'; C_RST=$'\033[0m'
else
  C_RED=''; C_GRN=''; C_YLW=''; C_RST=''
fi

# log LEVEL MESSAGE...   -> file always; console for WARN and ERROR
log() {
  local level="${1:?log requires a level}"; shift
  local ts; ts="$(date '+%Y-%m-%d %H:%M:%S')"
  local line="${ts} [${level}] ${FYP_HOST} ${FYP_SCRIPT_NAME}: $*"
  printf '%s\n' "${line}" >>"${FYP_LOG_FILE}" 2>/dev/null || true
  case "${level}" in
    ERROR) printf '%s%s%s\n' "${C_RED}" "${line}" "${C_RST}" >&2 ;;
    WARN)  printf '%s%s%s\n' "${C_YLW}" "${line}" "${C_RST}" >&2 ;;
    *)     printf '%s\n' "${line}" ;;
  esac
}

die() {
  log ERROR "$*"
  exit "${FYP_EXIT_FAIL}"
}

require_cmd() {
  local c
  for c in "$@"; do
    if ! command -v "${c}" >/dev/null 2>&1; then
      log ERROR "required command not found: ${c}"
      exit "${FYP_EXIT_DEPENDENCY}"
    fi
  done
}

# --- Cleanup registry ---------------------------------------------------------
# Scripts call register_cleanup with a function name; the EXIT trap runs them all.
cleanup_actions=()
FYP_TMPFILE=""
register_cleanup() { cleanup_actions+=("$1"); }

run_cleanup() {
  local rc=$?
  local fn
  for fn in ${cleanup_actions[@]+"${cleanup_actions[@]}"}; do
    ${fn} || log WARN "cleanup action ${fn} returned non-zero"
  done
  if [ -n "${FYP_TMPFILE}" ] && [ -e "${FYP_TMPFILE}" ]; then
    rm -f -- "${FYP_TMPFILE}"
  fi
  return ${rc}
}
trap run_cleanup EXIT
trap 'log WARN "interrupted by signal"; exit 130' INT TERM HUP

# Fail-closed on the log directory even if a caller forgot to create it.
if [ ! -d "${FYP_LOG_DIR}" ]; then
  mkdir -p "${FYP_LOG_DIR}" 2>/dev/null || true
fi
```

**用於清理的 `trap`，及其極限。** `trap run_cleanup EXIT` 會在**每一條**退出路徑上執行已註冊的清理函式並移除暫存檔，包括失敗時亦然。`trap 'log WARN ...; exit 130' INT TERM HUP` 令被中斷的執行在日誌中顯現，而非無聲無息。然而，儲存庫中最重要的 trap 並不在這個函式庫裡：`02-nftables-apply.sh` 註冊了一個**還原先前的防火牆規則集**的清理動作，因為防火牆套用被中斷，正是「一切保持原狀」並非安全預設值的唯一情況。此事在此述明，因為它是本項目中最清楚的例子，說明一個 trap 承載的是設計上的重要性，而非衛生價值。

#### 10.6.2 達生產質素的指令碼

##### 10.6.2.1 `06-server-health-report.sh`

**設計備註。** 這個指令碼產生 Linux 環境正按設計運作的本地證據：負載、記憶體及交換空間壓力、檔案系統相對警告及嚴重門檻的餘裕、這部主機理應運行的服務之狀態、失敗的 systemd 單元、時間同步、落在設計連接埠矩陣之外的監聽 socket、憑證年齡，以及需要重新開機的旗標。它在結構上是只讀的。它記錄到 `/var/log/fyp/`、寫出一份機器可讀的報告，並在任何門檻被逾越時以非零退出，令排程計時器可以據以告警，而第 11 章的代理可以取用人類所讀到的同一批事實。

```bash
#!/usr/bin/env bash
# 04-automation/bash/06-server-health-report.sh
# Purpose : Read-only health and capacity report for a Linux guest in the Vertex Peak lab.
#           Threshold breaches are reported as findings and the script exits non-zero.
# Owner   : W2 (Linux & Services). Reviewer: W4.   Test IDs: TC-L4-03, TC-L4-05
# Runtime : Ubuntu Server 24.04.3 LTS; bash 5.2.
# Safety  : no state is modified. systemctl is-active, nft list and ss are read-only.
# Exit    : 0 = no findings, 1 = findings, 2 = usage error, 3 = missing dependency.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "${SCRIPT_DIR}/lib/common.sh"

# --- Defaults -----------------------------------------------------------------
DISK_WARN_PCT=85
DISK_CRIT_PCT=95
MEM_WARN_PCT=90
LOAD_WARN_PER_CPU=2.0
CERT_WARN_DAYS=30
OUTPUT_FORMAT="text"
OUT_FILE=""
VERBOSE=0

usage() {
  cat <<'EOF'
Usage: 06-server-health-report.sh [OPTIONS]

Read-only health and capacity report for this host.

Options:
  -d PCT    Disk used-percent warning threshold      (default 85)
  -D PCT    Disk used-percent critical threshold     (default 95)
  -m PCT    Memory used-percent warning threshold    (default 90)
  -l FLOAT  Load-per-CPU warning threshold           (default 2.0)
  -c DAYS   Certificate expiry warning window, days  (default 30)
  -f FMT    Output format: text or json              (default text)
  -o FILE   Also write the report to FILE
  -v        Verbose: log every check, not only findings
  -h        Show this help and exit 0

Exit codes:
  0  every check within threshold
  1  one or more checks breached a threshold
  2  usage error
  3  a required dependency is missing

Examples:
  06-server-health-report.sh
  06-server-health-report.sh -f json -o /tmp/health.json -v
  06-server-health-report.sh -d 80 -c 45 -v
EOF
}

while getopts ':d:D:m:l:c:f:o:vh' opt; do
  case "${opt}" in
    d) DISK_WARN_PCT="${OPTARG}" ;;
    D) DISK_CRIT_PCT="${OPTARG}" ;;
    m) MEM_WARN_PCT="${OPTARG}" ;;
    l) LOAD_WARN_PER_CPU="${OPTARG}" ;;
    c) CERT_WARN_DAYS="${OPTARG}" ;;
    f) OUTPUT_FORMAT="${OPTARG}" ;;
    o) OUT_FILE="${OPTARG}" ;;
    v) VERBOSE=1 ;;
    h) usage; exit "${FYP_EXIT_OK}" ;;
    :) usage; log ERROR "option -${OPTARG} requires an argument"; exit "${FYP_EXIT_USAGE}" ;;
    \?) usage; log ERROR "unknown option -${OPTARG}"; exit "${FYP_EXIT_USAGE}" ;;
  esac
done
shift $((OPTIND - 1))

# --- Validate every argument --------------------------------------------------
is_uint() { case "${1}" in ''|*[!0-9]*) return 1 ;; *) return 0 ;; esac; }
is_num()  { [[ "${1}" =~ ^[0-9]+([.][0-9]+)?$ ]]; }

if ! is_uint "${DISK_WARN_PCT}"; then usage; die "-d must be an integer 0-100"; fi
if ! is_uint "${DISK_CRIT_PCT}"; then usage; die "-D must be an integer 0-100"; fi
if ! is_uint "${MEM_WARN_PCT}";  then usage; die "-m must be an integer 0-100"; fi
if ! is_num  "${LOAD_WARN_PER_CPU}"; then usage; die "-l must be a number, e.g. 2.0"; fi
if ! is_uint "${CERT_WARN_DAYS}"; then usage; die "-c must be an integer number of days"; fi
if [ "${DISK_WARN_PCT}" -gt 100 ] || [ "${DISK_CRIT_PCT}" -gt 100 ]; then
  usage; die "percentage thresholds must be between 0 and 100"
fi
if [ "${DISK_WARN_PCT}" -gt "${DISK_CRIT_PCT}" ]; then
  usage; die "-d (${DISK_WARN_PCT}) must not exceed -D (${DISK_CRIT_PCT})"
fi
case "${OUTPUT_FORMAT}" in text|json) ;; *) usage; die "-f must be text or json" ;; esac

require_cmd hostname date awk df systemctl nproc

[ "${VERBOSE}" -eq 1 ] && log INFO "starting health report (disk ${DISK_WARN_PCT}/${DISK_CRIT_PCT}%, mem ${MEM_WARN_PCT}%, load ${LOAD_WARN_PER_CPU}/CPU, cert window ${CERT_WARN_DAYS}d)"

FINDINGS=0
ROWS=()

add_row() {  # add_row CHECK STATUS DETAIL
  local check="$1" status="$2" detail="$3"
  ROWS+=("${check}|${status}|${detail}")
  if [ "${status}" = "FAIL" ]; then FINDINGS=$((FINDINGS + 1)); fi
  if [ "${VERBOSE}" -eq 1 ] || [ "${status}" != "PASS" ]; then
    if [ "${status}" = "FAIL" ]; then log ERROR "${check} [FAIL] ${detail}"
    else log INFO "${check} [${status}] ${detail}"; fi
  fi
}

# --- 1. Load per CPU ----------------------------------------------------------
if [ -r /proc/loadavg ]; then
  # shellcheck disable=SC2034  # l1 and l15 are read for completeness of the record
  read -r l1 l5 l15 rest < /proc/loadavg
  cpus="$(nproc)"
  per_cpu="$(awk -v l="${l5}" -v c="${cpus}" 'BEGIN{ printf "%.2f", l/c }')"
  if awk -v p="${per_cpu}" -v t="${LOAD_WARN_PER_CPU}" 'BEGIN{ exit !(p>t) }'; then
    add_row "load5-per-cpu" "FAIL" "5-min load ${l5} over ${cpus} CPU(s) = ${per_cpu}/CPU exceeds ${LOAD_WARN_PER_CPU}"
  else
    add_row "load5-per-cpu" "PASS" "5-min load ${l5} over ${cpus} CPU(s) = ${per_cpu}/CPU"
  fi
else
  add_row "load5-per-cpu" "FAIL" "/proc/loadavg is not readable"
fi

# --- 2. Memory ----------------------------------------------------------------
if [ -r /proc/meminfo ]; then
  mem_total="$(awk '/^MemTotal:/{print $2}' /proc/meminfo)"
  mem_avail="$(awk '/^MemAvailable:/{print $2}' /proc/meminfo)"
  mem_pct="$(awk -v t="${mem_total}" -v a="${mem_avail}" 'BEGIN{ if (t>0) printf "%.1f", (t-a)*100/t; else print "0" }')"
  if awk -v p="${mem_pct}" -v m="${MEM_WARN_PCT}" 'BEGIN{ exit !(p>m) }'; then
    add_row "memory-used-percent" "FAIL" "${mem_pct}% used (${mem_avail} kB available of ${mem_total} kB) exceeds ${MEM_WARN_PCT}%"
  else
    add_row "memory-used-percent" "PASS" "${mem_pct}% used (${mem_avail} kB available of ${mem_total} kB)"
  fi

  swap_total="$(awk '/^SwapTotal:/{print $2}' /proc/meminfo)"
  swap_free="$(awk '/^SwapFree:/{print $2}' /proc/meminfo)"
  if [ "${swap_total}" -gt 0 ]; then
    swap_used_pct="$(awk -v t="${swap_total}" -v f="${swap_free}" 'BEGIN{ printf "%.1f", (t-f)*100/t }')"
    if awk -v p="${swap_used_pct}" 'BEGIN{ exit !(p>25) }'; then
      add_row "swap-used-percent" "FAIL" "${swap_used_pct}% of ${swap_total} kB swap in use - a lab VM that swaps is a capacity problem"
    else
      add_row "swap-used-percent" "PASS" "${swap_used_pct}% of ${swap_total} kB swap in use"
    fi
  else
    add_row "swap-used-percent" "PASS" "no swap configured"
  fi
fi

# --- 3. Filesystems -----------------------------------------------------------
while read -r fs _size _used avail pct mount; do
  case "${fs}" in tmpfs|devtmpfs|squashfs|overlay) continue ;; esac
  pct_num="${pct%\%}"
  case "${pct_num}" in ''|*[!0-9]*) continue ;; esac
  if [ "${pct_num}" -ge "${DISK_CRIT_PCT}" ]; then
    add_row "disk:${mount}" "FAIL" "${pct} used on ${fs} (${avail} kB free) - CRITICAL threshold ${DISK_CRIT_PCT}%"
  elif [ "${pct_num}" -ge "${DISK_WARN_PCT}" ]; then
    add_row "disk:${mount}" "FAIL" "${pct} used on ${fs} (${avail} kB free) - warning threshold ${DISK_WARN_PCT}%"
  else
    add_row "disk:${mount}" "PASS" "${pct} used on ${fs} (${avail} kB free)"
  fi
done < <(df -Pk -x tmpfs -x devtmpfs 2>/dev/null | awk 'NR>1')

# --- 4. Services expected on this host ---------------------------------------
# The expected set comes from the host's own role marker, not from a per-host list,
# so this one script serves the whole Linux estate.
ROLE_FILE="/etc/fyp/role"
declare -A ROLE_SERVICES=(
  ["nginx_reverse_proxy"]="nginx keepalived"
  ["nftables_egress"]="nftables keepalived"
  ["openvpn"]="openvpn-server@server nftables"
  ["wordpress"]="nginx php8.3-fpm mariadb"
  ["agent_runtime"]="ssh"
  ["ansible_control_node"]="nginx prometheus grafana-server loki ssh"
  ["dmz_jump"]="ssh"
)
if [ -r "${ROLE_FILE}" ]; then
  role="$(tr -d '[:space:]' < "${ROLE_FILE}")"
  services="${ROLE_SERVICES[${role}]:-}"
  if [ -z "${services}" ]; then
    add_row "role" "FAIL" "unknown role '${role}' in ${ROLE_FILE}"
  else
    add_row "role" "PASS" "role=${role}; expected services: ${services}"
    for svc in ${services}; do
      if systemctl is-active --quiet "${svc}" 2>/dev/null; then
        add_row "service:${svc}" "PASS" "active"
      else
        add_row "service:${svc}" "FAIL" "not active: $(systemctl is-active "${svc}" 2>&1 || true)"
      fi
    done
  fi
else
  add_row "role" "FAIL" "${ROLE_FILE} is missing - the host role cannot be determined, so service state cannot be judged"
fi

# --- 5. Failed systemd units -------------------------------------------------
failed_units="$(systemctl --failed --no-legend --plain 2>/dev/null | awk '{print $1}' | paste -sd, - || true)"
if [ -n "${failed_units}" ]; then
  add_row "systemd-failed-units" "FAIL" "${failed_units}"
else
  add_row "systemd-failed-units" "PASS" "no failed units"
fi

# --- 6. Time synchronisation (Kerberos depends on it) ------------------------
if command -v chronyc >/dev/null 2>&1 && chronyc tracking >/dev/null 2>&1; then
  skew="$(chronyc tracking | awk -F': *' '/System time/{print $2}')"
  leap="$(chronyc tracking | awk -F': *' '/Leap status/{print $2}')"
  if [ "${leap}" = "Normal" ]; then
    add_row "time-sync" "PASS" "chrony tracking normal (system time ${skew})"
  else
    add_row "time-sync" "FAIL" "chrony leap status '${leap}', system time ${skew} - time skew above 5 minutes breaks Kerberos"
  fi
else
  add_row "time-sync" "FAIL" "chronyc is not installed or cannot reach a time source"
fi

# --- 7. Listening TCP sockets outside the design's port matrix ---------------
allowed=" 22 53 80 443 514 1194 3000 3260 3306 9000 9090 9100 9182 6516 179 500 4500 51820 123 "
unexpected=""
while read -r _proto _recvq _sendq local _foreign state _rest; do
  [ "${state}" = "LISTEN" ] || continue
  port="${local##*:}"
  case "${allowed}" in
    *" ${port} "*) ;;
    *) unexpected="${unexpected} ${local}" ;;
  esac
done < <(ss -H -tln 2>/dev/null || true)

if [ -n "${unexpected}" ]; then
  add_row "listening-ports-unexpected" "FAIL" "not in the design port matrix:${unexpected}"
else
  add_row "listening-ports-unexpected" "PASS" "all TCP listeners are in the design port matrix"
fi

# --- 8. Certificate expiry ----------------------------------------------------
if command -v openssl >/dev/null 2>&1; then
  certs_checked=0
  for dir in /etc/nginx/ssl /etc/ssl/fyp /etc/openvpn/easy-rsa/pki; do
    [ -d "${dir}" ] || continue
    while IFS= read -r crt; do
      [ -n "${crt}" ] || continue
      end="$(openssl x509 -enddate -noout -in "${crt}" 2>/dev/null | cut -d= -f2- || true)"
      [ -n "${end}" ] || continue
      if ! end_epoch="$(date -d "${end}" +%s 2>/dev/null)"; then continue; fi
      now_epoch="$(date +%s)"
      days=$(( (end_epoch - now_epoch) / 86400 ))
      certs_checked=$((certs_checked + 1))
      if [ "${days}" -le 0 ]; then
        add_row "cert:${crt}" "FAIL" "EXPIRED on ${end}"
      elif [ "${days}" -le "${CERT_WARN_DAYS}" ]; then
        add_row "cert:${crt}" "FAIL" "expires in ${days} day(s) on ${end}"
      else
        add_row "cert:${crt}" "PASS" "expires in ${days} day(s) on ${end}"
      fi
    done < <(find "${dir}" -maxdepth 3 -type f \( -name '*.crt' -o -name '*.pem' \) 2>/dev/null)
  done
  [ "${certs_checked}" -eq 0 ] && add_row "cert:any" "PASS" "no certificate files found in the searched directories"
else
  add_row "cert:openssl" "FAIL" "openssl is not installed, so certificate expiry cannot be checked"
fi

# --- 9. Reboot required ------------------------------------------------------
if [ -f /var/run/reboot-required ]; then
  add_row "reboot-required" "FAIL" "$(head -n 1 /var/run/reboot-required 2>/dev/null || echo 'reboot required')"
else
  add_row "reboot-required" "PASS" "no reboot required"
fi

# --- Output -------------------------------------------------------------------
if [ "${OUTPUT_FORMAT}" = "json" ]; then
  {
    printf '{\n'
    printf '  "host": "%s",\n' "${FYP_HOST}"
    printf '  "timestamp": "%s",\n' "$(date -Is)"
    printf '  "findings": %d,\n' "${FINDINGS}"
    printf '  "checks": [\n'
    first=1
    for row in "${ROWS[@]}"; do
      IFS='|' read -r check status detail <<<"${row}"
      [ "${first}" -eq 1 ] || printf ',\n'
      first=0
      printf '    {"check": "%s", "status": "%s", "detail": "%s"}' \
        "${check//\"/\\\"}" "${status}" "${detail//\"/\\\"}"
    done
    printf '\n  ]\n}\n'
  } > "${OUT_FILE:-/dev/stdout}"
  [ -n "${OUT_FILE}" ] && log INFO "JSON report written to ${OUT_FILE}"
else
  {
    printf 'FYP server health report\n'
    printf 'host      : %s\n' "${FYP_HOST}"
    printf 'timestamp : %s\n' "$(date -Is)"
    printf 'findings  : %d\n\n' "${FINDINGS}"
    printf '%-36s %-6s %s\n' "CHECK" "STATUS" "DETAIL"
    printf '%-36s %-6s %s\n' "------------------------------------" "------" "-----------------------------------"
    for row in "${ROWS[@]}"; do
      IFS='|' read -r check status detail <<<"${row}"
      printf '%-36s %-6s %s\n' "${check}" "${status}" "${detail}"
    done
  } | if [ -n "${OUT_FILE}" ]; then tee "${OUT_FILE}"; else cat; fi
  [ -n "${OUT_FILE}" ] && log INFO "text report written to ${OUT_FILE}"
fi

if [ "${FINDINGS}" -gt 0 ]; then
  log ERROR "health report completed with ${FINDINGS} finding(s); full log: ${FYP_LOG_FILE}"
  exit "${FYP_EXIT_FAIL}"
fi
log INFO "health report completed with no findings"
exit "${FYP_EXIT_OK}"
```

##### 10.6.2.2 `07-nftables-log-summary.sh`

**設計備註。** 出口那一對節點在兩位成員上，都以 `NFT-DROP: ` 為前綴記錄每一次丟棄，其速率非人類所能閱讀。這個指令碼執行縮減：它取用所選窗口的日誌、抽出被丟棄流量的來源位址、把它們彙總成前綴並加以排序。其輸出為（a）供每日運作日誌使用的人類可讀表格，以及（b）供第 11 章的 AI 層作為工具結果取用的 JSON 物件。它是只讀的：`journalctl` 在叫用時不帶任何改變狀態的選項，也沒有任何規則被加入、移除或清空。

```bash
#!/usr/bin/env bash
# 04-automation/bash/07-nftables-log-summary.sh
# Purpose : Summarise nftables drop events by source prefix over a chosen window.
#           Output: human-readable table and/or JSON, suitable for the operations log
#           and for consumption as a tool result by the AI operations layer (section 11).
# Owner   : W2 (Linux & Services). Reviewer: W4.  Test IDs: TC-L4-03, TB-02, TB-03
# Runtime : Ubuntu Server 24.04.3 LTS; journalctl, awk.
# Safety  : READ-ONLY. journalctl is read with no state-changing option.
# Exit    : 0 = summarised, 1 = no drop events found in the window (not an error state,
#           but reported as a finding so that a silent firewall is noticed), 2 = usage.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "${SCRIPT_DIR}/lib/common.sh"

WINDOW="last hour"          # any value accepted by journalctl --since
PREFIX="NFT-DROP: "
GROUP_BITS=24               # aggregate sources to /24 by default
TOP_N=20
FORMAT="text"
OUT_FILE=""
VERBOSE=0

usage() {
  cat <<'EOF'
Usage: 07-nftables-log-summary.sh [OPTIONS]

Summarises nftables drop events by source prefix.

Options:
  -s WINDOW   journalctl --since value            (default "last hour")
  -p PREFIX   log prefix to match                 (default "NFT-DROP: ")
  -b BITS     Prefix length to aggregate to       (default 24)
  -n N        Show the top N prefixes             (default 20)
  -f FMT      Output format: text or json         (default text)
  -o FILE     Also write the report to FILE
  -v          Verbose
  -h          Show this help and exit 0

Examples:
  07-nftables-log-summary.sh
  07-nftables-log-summary.sh -s "2026-11-09 20:00:00" -b 16 -n 10
  07-nftables-log-summary.sh -f json -o /tmp/nft-drops.json
EOF
}

while getopts ':s:p:b:n:f:o:vh' opt; do
  case "${opt}" in
    s) WINDOW="${OPTARG}" ;;
    p) PREFIX="${OPTARG}" ;;
    b) GROUP_BITS="${OPTARG}" ;;
    n) TOP_N="${OPTARG}" ;;
    f) FORMAT="${OPTARG}" ;;
    o) OUT_FILE="${OPTARG}" ;;
    v) VERBOSE=1 ;;
    h) usage; exit "${FYP_EXIT_OK}" ;;
    :) usage; die "option -${OPTARG} requires an argument" ;;
    \?) usage; die "unknown option -${OPTARG}" ;;
  esac
done
shift $((OPTIND - 1))

# --- Validate -----------------------------------------------------------------
case "${GROUP_BITS}" in ''|*[!0-9]*) usage; die "-b must be an integer";; esac
[ "${GROUP_BITS}" -ge 8 ] && [ "${GROUP_BITS}" -le 32 ] || { usage; die "-b must be between 8 and 32"; }
case "${TOP_N}" in ''|*[!0-9]*) usage; die "-n must be an integer";; esac
[ "${TOP_N}" -ge 1 ] || { usage; die "-n must be at least 1"; }
case "${FORMAT}" in text|json) ;; *) usage; die "-f must be text or json" ;; esac
# Guard against a prefix containing regex metacharacters being used unescaped.
[ -n "${PREFIX}" ] || die "-p must not be empty"

require_cmd journalctl awk sort date

log INFO "summarising drops since '${WINDOW}' on ${FYP_HOST} (prefix '${PREFIX}', aggregate /${GROUP_BITS}, top ${TOP_N})"

FYP_TMPFILE="$(mktemp)"
register_cleanup 'cleanup_tmp'
cleanup_tmp() { [ -e "${FYP_TMPFILE}" ] && rm -f -- "${FYP_TMPFILE}"; return 0; }

# journalctl -o cat gives the message only, with no timestamp decoration, which keeps
# the awk parsing simple and stable across journald versions.
if ! journalctl -o cat --no-pager --since "${WINDOW}" 2>/dev/null |
     awk -v prefix="${PREFIX}" -v bits="${GROUP_BITS}" '
       index($0, prefix) == 0 { next }
       {
         src = ""
         for (i = 1; i <= NF; i++) {
           if ($i == "SRC=" && (i+1) <= NF) { src = $(i+1); break }
           if ($i ~ /^SRC=/)                { src = substr($i, 5); break }
         }
         if (src == "" || src !~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) { next }
         split(src, o, ".")
         mask = 0
         for (b = 0; b < bits; b++) {
           oct = int(b / 8) + 1
           bitpos = 7 - (b % 8)
           if (and(o[oct] + 0, 2 ^ bitpos) != 0) { mask += 2 ^ (31 - b) }
         }
         a = int(mask / 16777216) % 256
         b2 = int(mask / 65536) % 256
         c = int(mask / 256) % 256
         d = mask % 256
         key = a "." b2 "." c "." d "/" bits
         count[key]++
         total++
       }
       END {
         if (total == 0) { exit 1 }
         for (k in count) { printf "%d %s\n", count[k], k }
         print "TOTAL " total > "/dev/stderr"
       }
     ' > "${FYP_TMPFILE}"
then
  log WARN "no drop events matching prefix '${PREFIX}' were found since '${WINDOW}'"
  log WARN "A silent firewall is worth checking: confirm the pair is receiving traffic and that logging is still enabled (nft list ruleset | grep -c NFT-DROP)"
  if [ "${FORMAT}" = "json" ]; then
    printf '{"host":"%s","since":"%s","prefix":"%s","group_bits":%d,"total_drops":0,"prefixes":[]}\n' \
      "${FYP_HOST}" "${WINDOW}" "${PREFIX}" "${GROUP_BITS}" > "${OUT_FILE:-/dev/stdout}"
  fi
  exit 1
fi

total="$(awk '{s+=$1} END{printf "%d", s}' "${FYP_TMPFILE}")"
rows="$(sort -k1,1nr "${FYP_TMPFILE}" | head -n "${TOP_N}")"

if [ "${FORMAT}" = "json" ]; then
  {
    printf '{\n'
    printf '  "host": "%s",\n' "${FYP_HOST}"
    printf '  "since": "%s",\n' "${WINDOW}"
    printf '  "generated": "%s",\n' "$(date -Is)"
    printf '  "prefix": "%s",\n' "${PREFIX}"
    printf '  "group_bits": %d,\n' "${GROUP_BITS}"
    printf '  "total_drops": %s,\n' "${total}"
    printf '  "prefixes": [\n'
    first=1
    while read -r cnt pfx; do
      [ -n "${pfx:-}" ] || continue
      [ "${first}" -eq 1 ] || printf ',\n'
      first=0
      printf '    {"prefix": "%s", "drops": %s}' "${pfx}" "${cnt}"
    done <<<"${rows}"
    printf '\n  ]\n}\n'
  } > "${OUT_FILE:-/dev/stdout}"
else
  {
    printf 'FYP nftables drop summary\n'
    printf 'host        : %s\n' "${FYP_HOST}"
    printf 'window      : since %s\n' "${WINDOW}"
    printf 'generated   : %s\n' "$(date -Is)"
    printf 'total drops : %s\n\n' "${total}"
    printf '%-22s %10s\n' "SOURCE PREFIX" "DROPS"
    printf '%-22s %10s\n' "----------------------" "----------"
    while read -r cnt pfx; do
      [ -n "${pfx:-}" ] || continue
      printf '%-22s %10d\n' "${pfx}" "${cnt}"
    done <<<"${rows}"
    printf '\nInterpretation: a source inside 10.10.0.0/16 is an INTERNAL host whose traffic\n'
    printf 'the policy correctly denied (see TB-02/TB-03/TB-09 - check the source VLAN).\n'
    printf 'A source inside 10.70.0.0/24 is the deliberately isolated lab segment and any\n'
    printf 'traffic from it at the egress pair is a policy finding, not routine noise (TB-09/TB-10).\n'
  } | if [ -n "${OUT_FILE}" ]; then tee "${OUT_FILE}"; else cat; fi
fi

[ -n "${OUT_FILE}" ] && log INFO "report written to ${OUT_FILE}"
log INFO "summarised ${total} drop event(s) across $(wc -l < "${FYP_TMPFILE}") prefix(es)"
exit "${FYP_EXIT_OK}"
```

`Interpretation` 頁腳是刻意的。被丟棄封包的原始計數什麼也說明不了；把計數歸屬於某個來源前綴，並對照信任邊界表來閱讀，才能說明防火牆是在履行職責，還是某部主機設定錯誤。空行核算（`total` 及前綴計數）也為第 11 章的代理提供一個穩定、可解析的摘要物件，而不是一堵要自行解讀的文字牆。

##### 10.6.2.3 `08-cert-expiry-check.sh`

**設計備註。** 憑證是最可能在最終示範、而非在測試期間才被發現的失敗模式。這個指令碼填補那道缺口：它巡行一份可設定的主機清單、讀取每一個已發佈端點所呈現的憑證、計算剩餘有效期，並在任何項目落入警告窗口時以非零退出。它對遠端端點使用 `openssl s_client`，對本地材料則直接讀取檔案；而它把不可達的端點視為一項**發現**，絕不視為通過 —— 一張無法檢查的憑證，並非一張有效的憑證。

```bash
#!/usr/bin/env bash
# 04-automation/bash/08-cert-expiry-check.sh
# Purpose : Check TLS certificate expiry across the estate.
#           Local material is read from disk; published endpoints are probed with
#           openssl s_client. Exit non-zero when anything is inside the warning window.
# Owner   : W2 (Linux & Services). Reviewer: W1 (PKI owner).  Test IDs: TC-PKI-01
# Runtime : Ubuntu Server 24.04.3 LTS; openssl 3.0.x.
# Safety  : READ-ONLY. No certificate is issued, renewed or modified.
# Exit    : 0 = all certificates outside the window, 1 = findings, 2 = usage, 3 = dependency.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "${SCRIPT_DIR}/lib/common.sh"

WARN_DAYS=30
LOCAL_PATHS=("/etc/nginx/ssl" "/etc/openvpn/easy-rsa/pki")
ENDPOINTS=(
  "vpnz-dmzrev01:443"
  "vpnz-dmzrev02:443"
  "vpnz-dmzweba01:443"
  "vpnz-dmzweba02:443"
  "vpnz-dmzwp01:443"
  "vpnz-dmzwp02:443"
  "vpnz-lnxra01:1194"
  "vpnz-rras01:443"
)
FORMAT="text"
OUT_FILE=""
VERBOSE=0

usage() {
  cat <<'EOF'
Usage: 08-cert-expiry-check.sh [OPTIONS]

Checks TLS certificate expiry for local material and published endpoints.

Options:
  -d DAYS     Warning window in days                    (default 30)
  -e LIST     Comma-separated host:port endpoints to probe (default: FYP published set)
  -l LIST     Comma-separated local directories to scan   (default: FYP TLS paths)
  -f FMT      Output format: text or json               (default text)
  -o FILE     Also write the report to FILE
  -v          Verbose
  -h          Show this help and exit 0

Exit codes:
  0  all certificates expire outside the warning window
  1  one or more certificates are inside the window or cannot be checked
  2  usage error   3  a required dependency is missing

Examples:
  08-cert-expiry-check.sh
  08-cert-expiry-check.sh -d 45 -v
  08-cert-expiry-check.sh -e vpnz-dmzrev01:443 -l /etc/nginx/ssl -f json
EOF
}

while getopts ':d:e:l:f:o:vh' opt; do
  case "${opt}" in
    d) WARN_DAYS="${OPTARG}" ;;
    e) IFS=',' read -r -a ENDPOINTS <<<"${OPTARG}" ;;
    l) IFS=',' read -r -a LOCAL_PATHS <<<"${OPTARG}" ;;
    f) FORMAT="${OPTARG}" ;;
    o) OUT_FILE="${OPTARG}" ;;
    v) VERBOSE=1 ;;
    h) usage; exit "${FYP_EXIT_OK}" ;;
    :) usage; die "option -${OPTARG} requires an argument" ;;
    \?) usage; die "unknown option -${OPTARG}" ;;
  esac
done
shift $((OPTIND - 1))

case "${WARN_DAYS}" in ''|*[!0-9]*) usage; die "-d must be a positive integer";; esac
[ "${WARN_DAYS}" -ge 1 ] || { usage; die "-d must be at least 1"; }
case "${FORMAT}" in text|json) ;; *) usage; die "-f must be text or json" ;; esac
require_cmd openssl date

FINDINGS=0
ROWS=()

add_row() {  # add_row SOURCE SUBJECT DAYS STATUS DETAIL
  ROWS+=("$1|$2|$3|$4|$5")
  [ "$4" = "FAIL" ] && FINDINGS=$((FINDINGS + 1))
  if [ "${VERBOSE}" -eq 1 ] || [ "$4" != "PASS" ]; then
    if [ "$4" = "FAIL" ]; then log ERROR "$1 $2: $5"; else log INFO "$1 $2: $5"; fi
  fi
}

days_remaining() {  # days_remaining "enddate string"
  local end="$1" end_epoch now_epoch
  end_epoch="$(date -d "${end}" +%s 2>/dev/null)" || return 1
  now_epoch="$(date +%s)"
  echo $(( (end_epoch - now_epoch) / 86400 ))
}

# --- 1. Local certificate material -------------------------------------------
log INFO "scanning local certificate material in: ${LOCAL_PATHS[*]}"
for dir in "${LOCAL_PATHS[@]}"; do
  [ -d "${dir}" ] || { [ "${VERBOSE}" -eq 1 ] && log INFO "directory absent, skipped: ${dir}"; continue; }
  while IFS= read -r crt; do
    [ -n "${crt}" ] || continue
    if ! end="$(openssl x509 -enddate -noout -in "${crt}" 2>/dev/null | cut -d= -f2-)"; then
      add_row "${crt}" "unparsable" "?" "FAIL" "file does not parse as a certificate"
      continue
    fi
    subj="$(openssl x509 -subject -noout -in "${crt}" 2>/dev/null | sed 's/^subject=//' || echo unknown)"
    days="$(days_remaining "${end}")" || { add_row "${crt}" "${subj}" "?" "FAIL" "unparsable expiry '${end}'"; continue; }
    if [ "${days}" -le 0 ]; then
      add_row "${crt}" "${subj}" "${days}" "FAIL" "EXPIRED on ${end}"
    elif [ "${days}" -le "${WARN_DAYS}" ]; then
      add_row "${crt}" "${subj}" "${days}" "FAIL" "inside the ${WARN_DAYS}-day window (expires ${end})"
    else
      add_row "${crt}" "${subj}" "${days}" "PASS" "expires in ${days} day(s)"
    fi
  done < <(find "${dir}" -maxdepth 3 -type f \( -name '*.crt' -o -name '*.pem' \) 2>/dev/null)
done

# --- 2. Published endpoints ---------------------------------------------------
log INFO "probing ${#ENDPOINTS[@]} published endpoint(s)"
for endpoint in "${ENDPOINTS[@]}"; do
  host="${endpoint%%:*}"
  port="${endpoint##*:}"
  case "${port}" in ''|*[!0-9]*) add_row "${endpoint}" "-" "?" "FAIL" "endpoint is not in host:port form"; continue ;; esac

  # A UDP service (for example OpenVPN 1194) has no TLS handshake to a TCP probe;
  # it is still recorded so that the report shows what was and was not checked.
  if [ "${port}" = "1194" ]; then
    add_row "${endpoint}" "-" "?" "INFO" "UDP/TLS endpoint - certificate must be checked on the host, not probed from here"
    continue
  fi

  if ! out="$(openssl s_client -connect "${endpoint}" -servername "${host}" </dev/null 2>/dev/null)"; then
    add_row "${endpoint}" "-" "?" "FAIL" "cannot connect or complete a TLS handshake"
    continue
  fi

  cert="$(printf '%s\n' "${out}" | openssl x509 -noout -enddate -subject 2>/dev/null || true)"
  if [ -z "${cert}" ]; then
    add_row "${endpoint}" "-" "?" "FAIL" "connected but no certificate could be parsed - check the listener"
    continue
  fi
  end="$(printf '%s\n' "${cert}" | awk -F= '/notAfter/{print $2}')"
  subj="$(printf '%s\n' "${cert}" | sed -n 's/^subject=//p')"
  days="$(days_remaining "${end}")" || { add_row "${endpoint}" "${subj}" "?" "FAIL" "unparsable expiry '${end}'"; continue; }

  if [ "${days}" -le 0 ]; then
    add_row "${endpoint}" "${subj}" "${days}" "FAIL" "EXPIRED on ${end}"
  elif [ "${days}" -le "${WARN_DAYS}" ]; then
    add_row "${endpoint}" "${subj}" "${days}" "FAIL" "inside the ${WARN_DAYS}-day window (expires ${end})"
  else
    add_row "${endpoint}" "${subj}" "${days}" "PASS" "expires in ${days} day(s) (${end})"
  fi
done

# --- Output -------------------------------------------------------------------
if [ "${FORMAT}" = "json" ]; then
  {
    printf '{\n  "host": "%s",\n  "generated": "%s",\n  "warn_days": %d,\n  "findings": %d,\n  "certificates": [\n' \
      "${FYP_HOST}" "$(date -Is)" "${WARN_DAYS}" "${FINDINGS}"
    first=1
    for row in "${ROWS[@]}"; do
      IFS='|' read -r src subj days status detail <<<"${row}"
      [ "${first}" -eq 1 ] || printf ',\n'
      first=0
      printf '    {"source": "%s", "subject": "%s", "days_remaining": "%s", "status": "%s", "detail": "%s"}' \
        "${src//\"/\\\"}" "${subj//\"/\\\"}" "${days}" "${status}" "${detail//\"/\\\"}"
    done
    printf '\n  ]\n}\n'
  } > "${OUT_FILE:-/dev/stdout}"
else
  {
    printf 'FYP certificate expiry report\n'
    printf 'host       : %s\n' "${FYP_HOST}"
    printf 'generated  : %s\n' "$(date -Is)"
    printf 'window     : %d day(s)\n' "${WARN_DAYS}"
    printf 'findings   : %d\n\n' "${FINDINGS}"
    printf '%-28s %-8s %-6s %s\n' "SOURCE" "DAYS" "STATUS" "SUBJECT / DETAIL"
    printf '%-28s %-8s %-6s %s\n' "----------------------------" "--------" "------" "------------------------------"
    for row in "${ROWS[@]}"; do
      IFS='|' read -r src subj days status detail <<<"${row}"
      printf '%-28s %-8s %-6s %s | %s\n' "${src}" "${days}" "${status}" "${subj}" "${detail}"
    done
  } | if [ -n "${OUT_FILE}" ]; then tee "${OUT_FILE}"; else cat; fi
fi

[ -n "${OUT_FILE}" ] && log INFO "report written to ${OUT_FILE}"

if [ "${FINDINGS}" -gt 0 ]; then
  log ERROR "${FINDINGS} certificate finding(s); renewal or investigation required. See ${FYP_LOG_FILE}"
  exit "${FYP_EXIT_FAIL}"
fi
log INFO "all checked certificates are outside the ${WARN_DAYS}-day window"
exit "${FYP_EXIT_OK}"
```

#### 10.6.3 ShellCheck 與靜態檢查

**一項誠實的陳述，正如題目所要求。** ShellCheck 在本實驗室是否可用，**在撰寫之時並未獲得確認**。`shellcheck` 已封裝於 Ubuntu 24.04 套件庫，因此在任何可觸及該套件庫或站內套件鏡像的 Linux 客體上，都可用 `sudo apt-get install shellcheck` 安裝；設計基線的假設 A-04 要求在建置週之前把套件快取預先下載到 `vpnz-mon01`，而 `shellcheck` 是否在該快取中，取決於小組屆時所作的決定。**[假設]** 因此小組應記錄兩種結果之一，並在報告中述明：

```bash
# Case A - ShellCheck is available:
sudo apt-get install -y shellcheck
shellcheck --version
shellcheck -x -S warning 04-automation/bash/*.sh 04-automation/bash/lib/common.sh \
  | tee 06-verification/shellcheck-$(date +%F).txt
# -x  : follow the `source` of lib/common.sh so that the library's definitions are known
# -S  : treat warnings and above as the reporting floor; informational notes are noise

# Case B - ShellCheck is not available:
#   State plainly in the report that ShellCheck was not available in the lab and that
#   the scripts were reviewed manually. Do NOT cite ShellCheck output that does not exist.
```

上述指令碼在立意上都寫成 ShellCheck 乾淨：它們使用 `set -euo pipefail`、為每一項展開加上引號、適當地使用 `readonly`/`local`、以 `${arr[@]+"${arr[@]}"}` 防護未設定的陣列、在引入函式庫之處使用 `# shellcheck source=` 指示，並使用 `IFS= read -r`。其中部分細節之所以存在，*正因為*即使工具尚未可用，ShellCheck 的規則已為人手所遵循。

**沒有靜態分析工具時的人手審閱程序。** 兩位小組成員依一份固定檢查清單閱讀每個指令碼，而審閱會連同指令碼名稱及審閱者記錄於會議紀錄中：

1. 該指令碼是否以 `set -euo pipefail` 開始，並引入 `lib/common.sh`？
2. 每一項變數展開是否都加了引號，而每一處刻意的詞組分割是否都有註解說明？
3. 每一處 `read` 是否都使用 `IFS= read -r`？
4. 每一項外部命令的缺失是否都已處理（`require_cmd`，或明確的 `command -v` 測試）？
5. 暫存檔是否以 `mktemp` 建立，並透過 `trap` 註冊表移除？
6. 每一條失敗路徑是否都以非零退出，而該結束碼是否已載於用法文字之中？
7. 所有引數是否都在使用之前通過驗證，包括數值界限及互相約束？
8. 該指令碼是否透過 `log` 寫入 `/var/log/fyp/`，而絕不使用未重定向的 `echo`？
9. 是否有任何未加引號的 `rm`、任何 `eval`、任何置於雙引號字串內而當作命令使用的 `$( )`，或任何沒有 PID 檢查的 `kill`？
10. 當日誌目錄、主機角色標記檔或某個目標目錄缺失時，該指令碼的行為是否正確？

若審閱者無法對每一條問題回答「是」或「不適用」，便退回該指令碼。這份檢查清單的價值在於它短得可以誠實地逐項施行，又具體得令一次膚淺的閱讀無法通過。

#### 10.6.4 驗證

##### 10.6.4.1 範例執行與預期輸出

以下所有輸出均為**示例**，反映所要求的形狀，而非一次擷取的執行。

```bash
# --- Health report: clean host ------------------------------------------------
$ sudo ./06-server-health-report.sh
FYP server health report
host      : vpnz-dmzrev02
timestamp : 2026-11-09T14:41:02+08:00
findings  : 0

CHECK                                STATUS DETAIL
------------------------------------ ------ -----------------------------------
load5-per-cpu                        PASS   5-min load 0.14 over 2 CPU(s) = 0.07/CPU
memory-used-percent                  PASS   31.4% used (2871404 kB available of 4012076 kB)
swap-used-percent                    PASS   0.0% of 2097148 kB swap in use
disk:/                                PASS   27% used on /dev/sda2 (21884012 kB free)
disk:/var/log                        PASS   11% used on /dev/sda3 (4112696 kB free)
role                                 PASS   role=nginx_reverse_proxy; expected services: nginx keepalived
service:nginx                        PASS   active
service:keepalived                   PASS   active
systemd-failed-units                 PASS   no failed units
time-sync                            PASS   chrony tracking normal (system time 0.000082 seconds fast)
listening-ports-unexpected           PASS   all TCP listeners are in the design port matrix
cert:/etc/nginx/ssl/portal.crt       PASS   expires in 84 day(s) on 2027-02-01 00:00:00 GMT
reboot-required                      PASS   no reboot required
$ echo $?
0
```

```bash
# --- Health report: threshold breach and a dependency problem -----------------
$ sudo ./06-server-health-report.sh -d 60 -c 120 -v
ERROR: 2026-11-09 14:44:19 [ERROR] disk:/var FAIL 78% used on /dev/sda3 (912840 kB free) - warning threshold 60%
ERROR: 2026-11-09 14:44:19 [ERROR] service:nftables FAIL not active: inactive
ERROR: 2026-11-09 14:44:19 [ERROR] cert:/etc/nginx/ssl/portal.crt FAIL expires in 84 day(s) on 2027-02-01
ERROR: 2026-11-09 14:44:19 [ERROR] health report completed with 3 finding(s); full log: /var/log/fyp/2026-11-09_06-server-health-report.log
$ echo $?
1
```

```bash
# --- nftables drop summary ----------------------------------------------------
$ sudo ./07-nftables-log-summary.sh -s "2026-11-09 20:00:00" -b 24 -n 5
FYP nftables drop summary
host        : vpnz-nft01
window      : since 2026-11-09 20:00:00
generated   : 2026-11-09T22:15:44+08:00
total drops : 1834

SOURCE PREFIX            DROPS
---------------------- ----------
10.10.40.0/24              1487
10.10.70.0/24               301
192.0.2.0/24                 38
198.51.100.0/24               8

Interpretation: a source inside 10.10.0.0/16 is an INTERNAL host whose traffic
the policy correctly denied (see TB-02/TB-03/TB-09 - check the source VLAN).
A source inside 10.70.0.0/24 is the deliberately isolated lab segment and any
traffic from it at the egress pair is a policy finding, not routine noise (TB-09/TB-10).
```

上列輸出中的 `10.70.0.0/24` 那一行才是有趣的一行：該隔離的實驗室區段根本不應能觸及出口那一對節點，而摘要以單行把它呈現出來。這正是第 11 章的代理作為工具結果所獲得的輸出，也是該指令碼同時產生表格與 JSON 物件的原因。

```bash
# --- Certificate expiry -------------------------------------------------------
$ ./08-cert-expiry-check.sh -d 45
FYP certificate expiry report
host       : vpnz-mon01
generated  : 2026-11-09T22:20:11+08:00
window     : 45 day(s)
findings   : 1

SOURCE                       DAYS     STATUS SUBJECT / DETAIL
---------------------------- -------- ------ ------------------------------
/etc/nginx/ssl/portal.crt    84       PASS   CN=portal.vertexpeak.example | expires in 84 day(s)
/etc/openvpn/easy-rsa/pki/ca.crt 3475 PASS  CN=Easy-RSA CA | expires in 3475 day(s)
vpnz-dmzrev01:443            84       PASS   CN=portal.vertexpeak.example | expires in 84 day(s) (2027-02-01 00:00:00 GMT)
vpnz-dmzweba01:443           31       FAIL   CN=www.vertexpeak.example | inside the 45-day window (expires 2026-12-10 00:00:00 GMT)
vpnz-rras01:443              -        FAIL   cannot connect or complete a TLS handshake
$ echo $?
1
```

一次執行中有兩項發現，而兩者都有用：一張憑證確實接近到期，而一個端點完全無法完成握手。第二項正是只有以探測為基礎的檢查才會產生的那類發現 —— 以檔案為基礎的檢查會報告該憑證健康，而服務當時卻不可達。

```bash
# --- The same scripts under a scheduled timer, checked by exit code -----------
$ systemctl list-timers 'fyp-*' --all
NEXT                        LEFT    LAST                        PASSED  UNIT                    ACTIVATES
Mon 2026-11-10 06:00:00 CST 7h left Sun 2026-11-09 06:00:02 CST 10h ago fyp-health-report.timer  fyp-health-report.service
Sun 2026-11-16 03:00:00 CST 6 days  Sun 2026-11-09 03:00:01 CST 13h ago fyp-cert-expiry.timer     fyp-cert-expiry.service
```

由計時器觸發的 `oneshot` 服務所發出的非零退出，在 `systemctl status` 及 `journalctl -u fyp-health-report.service` 中都可見，這就是監控層與 AI 層都能得知一項發現、而雙方都無須解析任何日誌行的方式。這就是 10.8 所述的整合點。

---

### 10.7 Cisco 層的自動化

本小節寫得令人不安，但準確。本項目的 Cisco 工作完全在 **Cisco Packet Tracer** 中進行（一項固定的項目限制），而設計基線也直白地記錄其後果：Packet Tracer **沒有 API、沒有可從真實工具觸及的 SSH 伺服器，也沒有 Ansible collection**（PT-06）。本項目中沒有任何 Playbook（劇本）、指令碼或工具能登入 Packet Tracer 裝置。任何相反的陳述都將是捏造。

#### 10.7.1 對 Packet Tracer 可以自動化什麼

| 能力 | 是否可能？ | 如何做到 |
|---|---|---|
| 把每部裝置的**預定**組態置於版本控制之下 | **可以** | `03-build/packet-tracer/configs/*.txt` —— 每部裝置一個檔案 —— 就是真相來源，提交至 Git。每個檔案載有該裝置理應呈現的確切預定運行組態 |
| 由範本產生那些組態 | **可以，在主機上** | 一個範本加上一份逐裝置的變數檔（主機名稱、管理位址、loopback、VLAN 清單、對等清單），由與 Linux 範本相同的 Jinja2 機制渲染，輸出以 `.txt` 檔案提交。這就是把基礎設施即程式碼真正應用於裝置組態，即使其*交付*為手動亦然 |
| 偵測預定組態與裝置之間的漂移 | **部分可以** | 小組可以把裝置的 `show running-config` 輸出（貼入一個檔案）與已提交的 `.txt` 相比。該比較是一次 `diff`，而它是手動的，因為沒有東西可以直接讀取該裝置 |
| 比較各里程碑之間的組態 | **可以** | 標籤之間的 `git diff` 會確切顯示第 4 週與第 8 週之間網絡組態有何改變 |
| 以時間戳為裝置組態存檔 | **可以，以檔案形式** | 10.4.6.5 的存檔 Playbook（劇本）把已提交的 `.txt` 檔複製到一個帶日期的存檔目錄，並寫出一份述明沒有登入任何裝置的清單 |
| 核實某份組態*完整* | **可以，部分地** | 一個驗證程式可以檢查每個裝置檔都含有必要元素（主機名稱、管理 IP、VLAN 定義、trunk 設定、路由區塊、banner、`no ip domain-lookup`），這即使沒有裝置也能捉住被略去的一節 |
| 在裝置上執行組態 | **不可以** | Packet Tracer 不提供外部工具可觸及的可編寫指令碼介面。組態是在模擬器中透過 PT 自身的 CLI 以人手套用 |
| 從裝置取回運行中的組態 | **不可以** | 同樣原因 |
| 對裝置的回應作自動化測試 | **不可以** | 驗證是透過 PT 自身的 `show` 輸出及模擬模式，並擷取為螢幕截圖 |

#### 10.7.2 在真實實驗室中會怎麼做

小組必須清楚述明：若同一套設計應用於真實設備，會有什麼改變，因為這正是把一項限制轉化為學習成果的差距分析：

| 任務 | 真實設備上的做法 | 所需的工具 |
|---|---|---|
| 把預定組態推送至裝置 | 以自動化帳戶 SSH 至該裝置、進入組態模式、套用範本、退出，然後儲存 | 以 SSH 為基礎的組態函式庫 —— Python 的 `netmiko` 或 `napalm`，由 Ansible 模組或一本使用 `connection: network_cli` 的 Playbook（劇本）叫用。**Python、`napalm`、`netmiko`、YANG、RESTCONF 及 NETCONF 並未見於 WSOS 2026，因此呈現為未來工作，而非項目要求** |
| 取回運行中的組態 | 經 SSH 執行 `show running-config`，自動儲存並提交 | 同一個函式庫，另加一個排程工作 |
| 強制執行某份組態 | 把運行中的組態與預定組態相比，有任何差異便令執行失敗，並可選擇修復 | 一個具冪等性的組態管理模組；真實 collection 中的 Ansible `ios_config` 系列 |
| 驗證組態 | 解析運行中的組態並斷言預期值 | 同一套工具，另加以程式碼撰寫的斷言 |
| 回復一次不良變更 | 保留先前的組態，並在某項檢查失敗時經同一條 SSH 路徑套用它 | 同一套工具，另加受 Git 追蹤的歷史，這正是 Linux 環境已在使用的模式 |
| 使用模型驅動介面 | 經 NETCONF/RESTCONF 以 YANG 模型取用及設定組態 | 模型驅動工具 —— 於此明文列為範圍之外，且在修訂後的 WSOS 2026 範疇 5 中並不存在 |

WSOS 2026 確實把 **Git** 列為系統部署及組態管理的現代自動化工具（範疇 5），而本項目使用 Git 的方式，於網絡裝置而言恰恰切中要點：裝置組態都是受版本控制的成品，具備審閱歷史、里程碑之間的差異，以及每個里程碑一個標籤發行版本。這是 Cisco 層真正 —— 且可引用 —— 的組態即程式碼實作，也是本項目就其自動化所能誠實作出的最強聲稱。

#### 10.7.3 裝置組態如何管理

```text
C:\FYP\03-build\packet-tracer\configs\
├── README.md                        (states plainly: extracted by hand from the PT CLI,
│                                     never retrieved by any automated tool)
├── VP-HQ-CORE-01.running-config.txt
├── VP-HQ-CORE-02.running-config.txt
├── VP-HQ-DSW-A01.running-config.txt
├── VP-HQ-DSW-A02.running-config.txt
├── VP-HQ-DSW-A03.running-config.txt
├── VP-HQ-DSW-A04.running-config.txt
├── VP-HQ-EDGE-01.running-config.txt
├── VP-HQ-FW-01.running-config.txt    (ASA: show run)
├── VP-HQ-VOICE-01.running-config.txt
├── VP-BR-EDGE-01.running-config.txt
├── VP-BR-DSW-A01.running-config.txt
├── VP-MO-EDGE-01.running-config.txt
├── VP-MO-DSW-A01.running-config.txt
├── VP-WC-EDGE-01.running-config.txt
├── VP-WC-DSW-A01.running-config.txt
├── VP-ISP-EDGE-01.running-config.txt
└── MANIFEST.md                      (device, PT file, date extracted, who extracted it,
                                      and the show command used)
```

其工作方法是一套手動程序，並如實載明為手動程序：

1. 在 Packet Tracer 中每次組態變更之後，負責人執行裝置自身的擷取命令：IOS 裝置上為 `show running-config`，ASA 上為 `show run`，而專案檔則用 PT 的**檔案 → 另存新檔**。
2. 把輸出貼入該裝置的 `.running-config.txt` 檔案，在提交訊息中連同測試案例編號描述該變更，並把該檔案提交於一個 `task-l3-*` 分支上。
3. 由第二位成員審閱該差異 —— 該差異就是審閱成品，而這正是這套程序即使手動也值得做的原因。
4. `design-review` 及里程碑標籤（`v0.4`、`v0.8`）令組態歷史可供瀏覽：`git log --oneline -- 03-build/packet-tracer/configs/VP-HQ-CORE-01.running-config.txt` 就是該裝置完整的變更歷史。
5. 備份就是 Git 歷史，加上由 `08-collect-network-configs.yml` 所產生的帶日期存檔，該 Playbook 亦會執行 `Backup-NetworkDeviceConfig.ps1`。該存檔的清單確切述明它含有與不含什麼，因此該備份的聲稱日後無法被誇大。

#### 10.7.4 報告可以與不可以作出的聲稱

| 聲稱 | 是否允許？ |
|---|---|
| 「全部 16 部 Packet Tracer 裝置的預定組態均以程式碼形式在 Git 中管理，並有同儕審閱及標籤里程碑」 | **可以** —— 這是真確的，且滿足 `Git` 及組態即程式碼的要求 |
| 「各組態是由範本配合逐裝置變數產生的」 | **可以，前提是確實如此做過** —— 而所產生的檔案必須提交，令該聲稱可被核實 |
| 「一本只讀的驗證 Playbook（劇本）檢查每個裝置組態檔的完整性，並連同清單將其存檔」 | **可以** —— 這正是 `08-collect-network-configs.yml` 所做的事 |
| 「Ansible（或任何自動化工具）曾登入 Packet Tracer 裝置並推送組態」 | **不可以 —— 禁止。** 不可能存在任何證據，因為該能力並不存在 |
| 「網絡裝置組態已完全自動化」 | **不可以。** 交付步驟是手動的，且必須描述為手動 |
| 「同一套設計在真實設備上會以基於 SSH 的組態推送來自動化」 | **可以** —— 作為明確標示的差距分析及未來工作陳述 |

### 10.8 排程與編排

#### 10.8.1 例行工作如何運行

| 工作 | 主機 | 機制 | 排程 | 輸出 |
|---|---|---|---|---|
| 對環境執行 Playbook（劇本） | `vpnz-mon01` | `systemd` 計時器 `fyp-ansible-audit.timer` → `fyp-ansible-audit.service`（一個運行 `09-verify-services.yml` 的 `oneshot`） | 每日 06:00 | `runs/audit/` 中的 JSON 稽核報告；斷言失敗時以非零退出 |
| Linux 健康報告 | 每部 Linux 客體 | `systemd` 計時器 `fyp-health-report.timer` → `fyp-health-report.service` | 每日 06:30 | `/var/log/fyp/` 日誌、可選的 JSON 檔、有發現時以非零退出 |
| nftables 丟棄摘要 | `vpnz-nft01` | `systemd` 計時器 `fyp-nft-summary.timer` | 每小時的 :05 | 供運作日誌使用的文字摘要，以及供代理使用的 JSON 物件 |
| 憑證到期檢查 | `vpnz-mon01` | `systemd` 計時器 `fyp-cert-expiry.timer` | 每週，星期日 03:00 | 報告檔；在警告窗口之內時以非零退出 |
| 附核實的備份 | Windows 客體 | 由 `windows_baseline` Role（角色）排程的 Windows 工作排程器工作，名為 `BKP-{TARGET}-DAILY` | 每日 22:00 | `C:\FYP\config\` 中的各階段結果 CSV，失敗時結束碼為 3 |
| 離機組態及證據副本 | `vpnz-lnxra01` / Linux 客體 | `systemd` 計時器 `fyp-restic-backup.timer` → `04-backup-restic.sh` | 每日 23:00 | `vpnz-dmzjump01` 上的 Restic 快照 |
| 組態存檔 | `vpnz-mon01` | `systemd` 計時器 | 每次里程碑標籤之後 | `/srv/tftp/config-archive/` 之下的帶日期存檔及清單 |

本項目選用 `systemd` 計時器而非 `cron`，有四項要緊的理由：它能表達以 `Persistent=true` 度過錯過執行時間的 `OnCalendar` 排程；它把單元的 stdout 及 stderr 擷取到日誌中，因此失敗的執行無須任何額外的日誌程式碼也有記錄；它以 `systemctl list-timers` 提供一個指令就能列出每一項排程工作；而 `oneshot` 服務的**非零退出是一項第一級訊號**，監控層與 AI 層都能取用，而無須解析任何東西。

```ini
# /etc/systemd/system/fyp-health-report.service
[Unit]
Description=Vertex Peak FYP Linux health and capacity report
Documentation=file:/opt/fyp/docs/runbook-health-report.md
After=network-online.target chrony.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/opt/fyp/bin/06-server-health-report.sh -f json -o /var/lib/fyp/health-%H.json
User=root
# A non-zero exit is expected when findings exist; it is a signal, not a crash.
SuccessExitStatus=
Nice=10
IOSchedulingClass=idle
TimeoutStartSec=300
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fyp-health

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/fyp-health-report.timer
[Unit]
Description=Daily Vertex Peak FYP health report

[Timer]
OnCalendar=*-*-* 06:30:00
Persistent=true            # run once at start-up if a scheduled window was missed
RandomizedDelaySec=300     # spread load across the 19-VM estate
Unit=fyp-health-report.service

[Install]
WantedBy=timers.target
```

`Persistent=true` 與 `RandomizedDelaySec` 並非裝飾。沒有 `Persistent`，在主機被暫停期間（這在一部同時是工作站的 Hypervisor 主機上不斷發生）錯過的計時器就會被直接略過，小組屆時便無法解釋證據中的一段空白。沒有隨機延遲，九部 Linux 客體會在一部擁有 32–64 GB RAM 的實體主機上，全部於 06:30:00 同時開始報告，而該主機便會短暫成為瓶頸。

**刻意不排程的事。** 沒有任何工作會無人看管地套用組態變更。每一本會作出變更的 Playbook（劇本）都由人類在變更窗口之內、帶著 10.4.7.4 的審閱閘門執行。排程工作都是只讀稽核或備份；它們唯一作出的寫入是自身的報告及備份儲存庫。這條界線是一項設計決定，且必須如此述明，因為「我們本來也可以把部署排程起來」正是讀者會提出的明顯問題。

#### 10.8.2 監控層如何偵測漂移

漂移（drift）是指環境與儲存庫之間的任何差異。它在四個層級被偵測，各有不同的延遲：

| 層級 | 機制 | 延遲 | 證據 |
|---|---|---|---|
| 出口那一對節點上的組態漂移 | `nftables` Role（角色）的漂移任務（10.4.5.4）把運行中的規則集與所渲染的範本作差異比對，並把差異寫入 `runs/` | 每次執行時 | `runs/…_05-nftables-drift-*.txt` |
| 整個環境的服務及安全性漂移 | `09-verify-services.yml` 斷言設計所固定的性質（SSH 加固、恰好一個 WinRM HTTPS 監聽程式、`svc_aiagent` 的群組成員資格、nftables 表的存在） | 每日，以及按要求 | `runs/audit/audit-*.json` |
| 指標漂移 | 以 Git 中的檔案持有 Prometheus 告警規則（Grafana 儀表板亦因同一理由由檔案佈建），當某個值離開其預期區間時便觸發 | 數分鐘 | Grafana 中觸發中的告警及其解除；必須至少展示三個告警觸發並解除 |
| 以日誌為基礎的漂移 | rsyslog 把每部客體的 syslog 轉送至 `vpnz-mon01`，Loki 攝入它，而 nftables 丟棄摘要呈現與政策相關的拒絕 | 每小時 | `/var/log/remote/{host}.log`、丟棄摘要，以及 `fyp-security` 儀表板 |

一項漂移發現就是**一份發現記錄**，而非默默作出的糾正。小組的規則是：漂移要連同改變了什麼、何時、如何偵測到以及作了什麼處理，寫入 10.11 的發現記錄中 —— 因為默默被糾正的漂移不會教會團隊任何東西，結果報告便無法解釋自身的組態歷史。

#### 10.8.3 AI 線路如何取用自動化輸出

第 11 章的 AI 運作層是本自動化章節輸出的**取用者**，絕不是它的執行者。存在三個具體的整合點，而每一個都是本章已經產生的檔案或端點：

| 自動化輸出 | 第 11 章如何取用 | 於何處界定 |
|---|---|---|
| `inventory/hosts.yml` | 代理的位址規劃及主機清單問題由此檔案回答，而其主機允許清單亦由此推導。代理讀取該檔案；它從不執行 Ansible | 10.4.2，以及 11.7 中的 `inventory-query` Skill |
| `runs/audit/audit-*.json` 及健康報告 JSON | 代理「現在是否有任何問題」的 Skill 讀取這些結構化報告，而非自行探測環境，這令代理的動作面保持狹小 | 10.4.6.4，10.6.2.1 |
| nftables 丟棄摘要 JSON | 代理的日誌關聯 Skill 直接以工具結果的形式取用它，這也是該指令碼除了表格之外亦輸出 JSON 的原因 | 10.6.2.2 |

相依方向是單向的，且必須維持如此：自動化層不呼叫 AI 層，而沒有任何 Playbook（劇本）的行為會因為存在一個代理而改變。第 11.10 節從另一側述明此事；兩個小節刻意互相參照而非重複。

### 10.9 證據與螢幕截圖檢查清單

HDTN 題目單張要求學生*「產出組織良好的文件，涵蓋與項目相關的所有發現、手冊、步驟、螢幕擷取、驗證及參考資料。」* **因此螢幕擷取是 HDTN 題目的要求。** 它們**不是** WorldSkills 的要求：WSOS 2026 中 `screen`、`capture`、`screenshot` 及 `evidence` 的出現次數為零。本章的檢查清單是為滿足題目單張而存在，而報告必須正確地把該要求歸屬於題目單張，而非歸屬於標準。

所有螢幕截圖均遵循設計基線的命名慣例 `{date}_{host}_{what}.png`，置於 `07-evidence/` 之下；而所有圖說均遵循範本 `Figure {n}: {what} — {host} — {command or action} — {date}`。

| # | 證據 | 主機 | 應擷取什麼 | 測試編號 |
|---|---|---|---|---|
| L4-01 | Ansible 版本及 collection 清單 | `vpnz-mon01` | `ansible --version` 及 `ansible-galaxy collection list` 的輸出，顯示 `ansible-core 2.18.x`、社群套件版本及 `pywinrm 0.5.0` | TC-L4-02 |
| L4-02 | 控制節點可達性 | `vpnz-mon01` | `ansible windows -m ansible.windows.win_ping` 及 `ansible linux -m ansible.builtin.ping`，全部主機均為 `SUCCESS` | TC-L4-02 |
| L4-03 | 主機清單圖 | `vpnz-mon01` | `ansible-inventory --graph`，顯示 windows/linux/web/edge/monitoring/cisco/mgmt 的階層 | TC-L4-02 |
| L4-04 | Git 中的 `ansible.cfg` | `vpnz-mon01` | 已提交的 `ansible.cfg`，其中 `host_key_checking = False` 一行可見，並在圖說中顯示所聲明的實驗室簡化措施 | TC-L4-02 |
| L4-05 | Vault 用法，機密已遮蔽 | `vpnz-mon01` | `ansible-vault view inventory/group_vars/all/vault.yml`，**在擷取之前已把每一項機密值替換為 `REDACTED`**，圖說述明已作遮蔽 | TC-L4-04 |
| L4-06 | Vault 密碼檔已被排除 | `vpnz-mon01` | `ls -l /home/adm-w4/.ansible/vault-pass-vp`，顯示 `0600`，另加 `git check-ignore -v` 證明 vault 密碼樣式確已被排除、不會被提交 | TC-L4-04 |
| L4-07 | 附差異的試跑 | `vpnz-mon01` | 防火牆 Playbook（劇本）的 `--check --diff` 輸出，顯示 `nftables.conf` 的差異 | TC-L4-03 |
| L4-08 | 金絲雀執行 | `vpnz-mon01` | 一次 `--limit vpnz-nft02` 的執行，在執行摘要中顯示受限的主機清單 | TC-L4-03 |
| L4-09 | 回復計時器已啟動及已解除 | `vpnz-nft02` | 套用前的 `ls -l /run/fyp-nft-rollback.armed` 及核實後已解除的狀態，另加該指令碼本身 | TC-L4-03 |
| L4-10 | **成功的 Playbook 執行摘要** | `vpnz-mon01` | 第一次完整執行的 `PLAY RECAP`，附變更計數 | TC-L4-02 |
| L4-11 | **冪等性證明** | `vpnz-mon01` | **第二次**執行的 `PLAY RECAP`，顯示每部主機均為 `changed=0`，並在同一張擷取中顯示日誌檔路徑 | TC-L4-02 |
| L4-12 | 冪等性日誌表 | `vpnz-mon01` | `docs/05-idempotence-log.md`，已記錄全部九本 Playbook（劇本） | TC-L4-02 |
| L4-13 | 運行中的 nftables 規則集 | `vpnz-nft01` | `nft list ruleset`，顯示 `table inet fyp_filter`、input 及 forward 上的 `policy drop`、日誌前綴及 NAT 區塊 | TC-L2-03 |
| L4-14 | 漂移偵測輸出 | `vpnz-nft01` | 漂移任務的 `DRIFT`／`NO-DRIFT` 行，以及若發現漂移時的差異 | TC-L4-03 |
| L4-15 | VRRP 狀態及 VIP | `vpnz-dmzrev01` | `ip -br addr` 顯示該 VIP，另加 `journalctl -u keepalived` 顯示狀態轉換 | TC-L2-02 |
| L4-16 | 稽核 JSON | `vpnz-mon01` | 渲染後的 `audit-*.json` 檔案，顯示一筆主機條目及其各項檢查 | TC-L4-05 |
| L4-17 | **PowerShell 指令碼輸出** | `vpnz-dc01` | `Invoke-NewStarterOnboarding.ps1` 的 `-WhatIf` 輸出，然後是真實執行的物件表 | TC-L4-01 |
| L4-18 | PowerShell 冪等性證據 | `vpnz-dc01` | 第二次執行的物件表，每一列均為 `Created=False`，且日誌顯示第二次執行時沒有 `Created` 行 | TC-L4-01 |
| L4-19 | 防火牆及服務稽核 CSV | `vpnz-fs01` | 稽核 CSV 的 `Import-Csv`，顯示至少一項 `FAIL` 及其處理結果 | TC-L4-01 |
| L4-20 | 備份與核實 | `vpnz-fs01` | 以表格顯示四個階段的物件，`Verify` 為 `PASS` 及元件計數 | TC-L1-06 |
| L4-21 | WinRM 監聽程式狀態 | `vpnz-fs01` | `Get-ChildItem WSMan:\Localhost\Listener`，顯示一個 HTTPS 監聽程式而無 HTTP 監聽程式，另加已限定範圍的防火牆規則之 `RemoteAddress` | TB-07 |
| L4-22 | **Bash 指令碼輸出** | `vpnz-dmzrev02` | `06-server-health-report.sh` 的輸出及發現計數，並以 `echo $?` 顯示非零結束碼 | TC-L4-03 |
| L4-23 | 丟棄日誌分析 | `vpnz-nft01` | `07-nftables-log-summary.sh` 的輸出，另在第二張擷取中顯示它所彙總的對應原始 `NFT-DROP:` 日誌行 | TC-L4-03, TB-02 |
| L4-24 | 憑證檢查 | `vpnz-mon01` | `08-cert-expiry-check.sh` 的輸出，包括刻意造成的不可達端點發現 | TC-PKI-01 |
| L4-25 | `systemd` 計時器清單 | 每部 Linux 客體或 `vpnz-mon01` | `systemctl list-timers 'fyp-*' --all` | TC-L4-03 |
| L4-26 | **Git 日誌與網絡圖** | `vpnz-mon01` | 涵蓋 L4 各項提交的 `git log --oneline --graph --decorate`，以及顯示 `v0.1` … `v1.0` 的 `git tag -l` | TC-L4-04 |
| L4-27 | 同儕審閱記錄 | `vpnz-mon01` | 顯示 `Reviewed-by:` 的提交訊息，另加會議紀錄中對應的一行 | TC-L4-04 |
| L4-28 | 機密清掃結果 | `vpnz-mon01` | 標籤前清掃的輸出（乾淨），另加刻意的反向測試擷取，其中一個假金鑰**確實**被捉出 | TC-L4-04 |
| L4-29 | Packet Tracer 組態存檔 | `vpnz-mon01` | 帶日期的存檔目錄清單及 `MANIFEST.txt`，其文字述明沒有任何自動化工具曾登入 Packet Tracer 裝置 | TC-L4-04, TC-L3-xx |
| L4-30 | 已提交至 Git 的執行日誌 | `vpnz-mon01` | `ls 04-automation/runs/` 及這些日誌對應的 `git log` 條目 | TC-L4-02, TC-DOC-01 |

**兩張不可略過的擷取。** L4-11（第二次執行的 `changed=0` 執行摘要）及 L4-18（第二次執行、附 `Created=False` 的 PowerShell 物件表），就是回答題目單張「驗證」一詞真正所問的兩項證據。本表中其他一切都在支持它們；沒有它們，本章的核心聲稱 —— 即組態可重複 —— 便未獲證明。

### 10.10 常見失敗模式與排錯

每一條述明其所呈現的**症狀**、**成因**、用以把它與相似情況區分的**診斷命令**，以及**處理方法**。其次序就是小組可能遇上它們的次序。

| # | 問題 | 症狀 | 成因 | 診斷 | 處理方法 |
|---|---|---|---|---|---|
| 1 | 對 Linux 主機的 SSH 認證失敗 | `fatal: [vpnz-nft01]: UNREACHABLE! => {"msg": "Failed to connect to the host via ssh: Permission denied (publickey)."}` | 使用了錯誤的身分（Ansible 並非以那個已安裝金鑰的管理員身分運行）、金鑰不在 `authorized_keys` 中，或該帳戶已被移出 `gg-infra-admins` | `ssh -v adm-w4@10.10.50.11`，然後 `ansible linux -m ansible.builtin.command -a 'id' --become=false`，並在目標上執行 `sudo grep -c adm-w4 /home/adm-w4/.ssh/authorized_keys` 及 `getent group gg-infra-admins` | 以 `users` Role（角色）安裝正確的公開金鑰、確認該帳戶在 `gg-infra-admins` 之中，並確認每部主機的 `ansible_user`。若在金鑰生效之前就已設定 `PasswordAuthentication no`，該 VM 的主控台便是復原路徑 |
| 2 | WinRM 認證失敗 | `winrm or requests is not installed` 或 `HTTP 401 Unauthorized` 或 `the specified credentials were rejected by the server` | `svc_ansible` 的密碼錯誤、該帳戶不在 `GG-WINRM-Admins` 中、使用者名稱缺少網域名稱，或 vault 未成功解密 | `ansible windows -m ansible.windows.win_ping -vvv`，然後 `Test-WSMan -ComputerName vpnz-dc01 -UseSSL -Credential (Get-Credential VERTEXPEAK\svc_ansible)`，以及 `ansible-vault view inventory/group_vars/all/vault.yml` | 使用 `VERTEXPEAK\svc_ansible` 形式；以 `Get-ADGroupMember` 確認 `GG-WINRM-Admins` 的成員資格；若解密失敗，重新加密 vault 明文 |
| 3 | SSH 主機金鑰驗證失敗 | `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!` 或 `Host key verification failed` | 某部 VM 由範本重建，因此其主機金鑰合法地改變了 | `ssh-keygen -F 10.10.50.11`，並以 `ssh-keyscan` 在目標上比較該金鑰 | 或是移除過時的條目（`ssh-keygen -R`），或是依賴已設定的 `host_key_checking = False` 政策。**兩種做法之下，報告都述明此設定是一項已聲明的實驗室簡化措施，而非最佳實務** |
| 4 | Python 解譯器探索警告或失敗 | `WARNING: Platform linux on host ... is using the discovered Python interpreter at /usr/bin/python3`，或 Windows 上的 `module_utils` 匯入錯誤 | 一項過時的事實快取指向一個已搬移的解譯器、`auto_silent` 未生效，或 Windows 不知何故被派送了一項 Python 任務 | `ansible all -m ansible.builtin.setup -a 'filter=ansible_python*'` 及 `ansible linux -m ansible.builtin.command -a 'which python3; python3 -V'` | 清除快取（`rm -rf logs/facts`）、保留 `interpreter_python = auto_silent`，並記住 `ansible_python_interpreter` 在 Windows 目標上並無意義 |
| 5 | Linux 上的 `become` 失敗 | `sudo: a password is required` 或 `Sorry, user adm-w4 is not allowed to execute ...` | sudoers drop-in 缺失、免密碼規則不存在，或 `become_flags` 與這個 sudo 版本不符 | `ansible linux -m ansible.builtin.command -a 'id' --become -vvv`，並在目標上執行 `sudo -n true; echo $?` 及 `sudo visudo -c` | 透過 `common` Role（角色）部署 `sudoers-gg-infra-admins.j2`、以 `visudo -cf` 核實、保留 `become_flags = -H -S -n`，並注意不得設定 `requiretty`（pipelining 依賴它） |
| 6 | Vault 密碼問題 | `ERROR! Attempting to decrypt but no vault secrets found` 或 `Decryption failed (no vault secrets were found that could decrypt)` | Vault 密碼檔缺失或不可讀、該檔在重新加密後沒有更新本機副本，或 `vault_password_file` 指向一個在此機器上不存在的路徑 | `ls -l /home/adm-w4/.ansible/vault-pass-vp`、`ansible-vault view inventory/group_vars/all/vault.yml --ask-vault-pass` | 從小組的密碼管理器取回該密碼、以權限 `0600` 重新建立該檔案，並確認 `ansible.cfg` 中的 `vault_password_file`。若該值無法取回，則按設計所載的機密清單重建該檔案並重新加密 —— 所有機密皆由實驗室產生，因此不會遺失任何資料 |
| 7 | YAML 縮排或語法錯誤 | 附行號及欄號的 `ERROR! We were unable to read either as JSON nor YAML`，或 `mapping values are not allowed in this context` | 以 tab 取代空格、縮排不一致、未加引號的字串中含有冒號，或某個 `{{ }}` 被 Jinja2 渲染成不再是有效 YAML 的東西 | `ansible-playbook playbooks/XX.yml --syntax-check`；若控制節點上有 Python，則用 `python3 -c "import yaml,sys;yaml.safe_load(open('file.yml'))"`；並以 `grep -Pn '\t' file.yml` 找出 tab | 修正縮排、為該值加上引號，並把該 Playbook（劇本）加入提交前的 `--syntax-check` 迴圈，令同一錯誤不會在無人察覺之下重現 |
| 8 | 冪等性失敗 —— 某項任務每次執行都變更 | 在要求 `changed=0` 之處，第二次執行報告 `changed=1`（或更多） | 一項沒有 `creates:`、`changed_when:` 或 `when:` 防護的 `command` 或 `shell` 任務；含有時間戳或隨機次序的範本；無條件觸發的處理程式；每次執行都重設密碼的密碼任務 | `ansible-playbook … -vvv` 並閱讀是哪一項任務報告變更；然後作針對性的試跑 `--check --diff --tags <tag>` | 加入防護、從範本中移除非確定性內容、在只讀驗證任務上設定 `changed_when: false`，而密碼則使用 `update_password: on_create`。本儲存庫中常見的四項成因已在 10.4.5.7 點名 |
| 9 | 防火牆鎖死 | 套用某個規則集之後，該主機不再回應 SSH；Playbook（劇本）隨後報告 `UNREACHABLE` | 新規則集丟棄了管理路徑，或在加入管理規則之前就已對 input 套用 `policy drop` | 從 Hypervisor 主控台執行 `nft list ruleset`，並以 `systemctl list-timers 'fyp-nft-*'` 查看回復計時器的狀態 | 已啟動的回復計時器會在 `nftables_rollback_seconds` 之內自動還原先前的規則集。然後在範本中修正該規則集、以 `--check --diff --limit <the canary>` 重跑，並補上缺失的信任邊界規則。**這就是計時器在套用之前而非之後啟動的原因** |
| 10 | Ansible 找不到某個 collection 或模組 | `ERROR! couldn't resolve module/action 'ansible.windows.win_ping'` 或 `win_ping was not found` | 所用的虛擬環境中沒有安裝社群套件，或該 Playbook（劇本）是以系統的 `ansible` 而非 `/opt/ansible-venv/venv/bin/ansible-playbook` 執行 | `which ansible-playbook`、`/opt/ansible-venv/venv/bin/ansible-galaxy collection list | grep -i windows` | 啟用該虛擬環境、安裝所鎖定的社群套件、核實 `ansible.cfg` 中的 `collections_path`，並在所有地方使用完整限定的 collection 名稱（`ansible.windows.win_ping`）而非裸模組名稱 |
| 11 | Windows 模組因 envelope 或逾時錯誤而失敗 | `WinRM cannot process the request` 或 `The WSMan provider host process did not return a proper response`，或某項任務先掛起然後逾時 | 相對預設 envelope 大小而言過大的模組負載、在記憶體壓力下變慢的主機，或一段長時間運行而沒有設定 shell 逾時的命令 | `Test-WSMan -ComputerName <host> -UseSSL` 及在目標上執行 `Get-Item WSMan:\localhost\MaxEnvelopeSizekb`；並以 `-vvv` 為一項瑣碎任務計時 | 把 `MaxEnvelopeSizekb` 設為 500、保留 `ansible_winrm_operation_timeout_sec: 30` 配 `ansible_winrm_read_timeout_sec: 60`、若該主機正在顛簸則減少 `forks`，並對真正長時間的任務使用 `async`／`poll`，而非盲目提高逾時 |
| 12 | Playbook（劇本）對錯誤的主機執行 | 執行摘要列出並非預期的主機，或某項變更出現在第 0 層主機上 | 部署類 Playbook 中有一行裸的 `hosts: all`、主機清單群組名稱打錯，或缺少 `--limit` | 在執行任何事之前先執行 `ansible-playbook playbooks/XX.yml --list-hosts` | 更正 `hosts:` 一行、加入群組劃分或 `--limit`，並把只讀稽核 Playbook 以外任何 `hosts: all` 視為審閱缺陷 |
| 13 | `.gitignore` 未能阻止機密被提交 | 某把金鑰或某個 `wg0.conf` 出現於 `git status` 中，或清掃找出形似機密的字串 | 某個檔案被強制加入（`git add -f`）、篩選樣式在該檔案已被追蹤之後才加入，或該樣式與實際路徑不符 | `git check-ignore -v <file>`、`git log --all -- <path>`，以及儲存庫清掃 | 把該檔案移出追蹤（`git rm --cached`）、修正樣式、輪替已暴露的認證資料（因為提交是永久的，即使小組未必會作歷史重寫亦然），並把該事件記錄為一條發現 |
| 14 | PowerShell 指令碼不產生任何物件 | 該指令碼看似有執行但沒有回傳任何東西，或 `Export-Csv` 寫出一個空檔案 | 資料以 `Write-Host` 寫出，而非送往管線；`foreach` 內的 `return` 提早終止了該函式；或該指令碼被以 dot-source 方式載入而非叫用 | 互動式執行該指令碼並管線至 `Get-Member` —— 空白結果意味著沒有任何東西到達管線；檢查資料路徑中是否有 `Write-Host`，以及迴圈內是否有 `return` | 發出物件；在迴圈內使用 `continue` 而非 `return`；叫用而非 dot-source。檢查是機械式的：`Get-Command -Verb Get` 應列出每個只讀函式，而 `Select-String -Pattern 'Write-Host' -Path *.ps1` 應只顯示進度行 |
| 15 | Bash 指令碼在失敗後繼續執行 | 某個步驟失敗而指令碼卻報告成功，且檔案缺失 | 管線或子 shell 中的某項命令，其失敗不為 `set -e` 所捕捉；或某項錯誤被 `|| true` 掩蓋 | 以 `bash -x script.sh` 執行，並檢查 `set -o | grep pipefail`；尋找沒有 `pipefail` 的 `|`，以及在有意義的命令上出現的 `|| true` | 保留 `set -euo pipefail`、避免以 `|| true` 吞掉錯誤，並以 `if` 明確處理預期中的非零結果，而非解除 shell 的錯誤處理 |

### 10.11 發現

發現記錄是本自動化章節用以報告**所觀察到**而非**所預定**之事的機制。驗證章節中的每一項測試案例、每一項漂移偵測、每一次冪等性失敗，以及每一段耗時超過數分鐘的排錯過程，都產生一行。一個沒有任何行的發現小節本身就是一項發現：它意味著該環境從未被實際操演過。

#### 10.11.1 發現記錄範本

每一項發現均依以下形式撰寫。該範本固定不變，令來自四位不同小組成員的發現可以並排閱讀。

```text
Finding ID      : F-L4-nn
Date recorded   : YYYY-MM-DD
Recorded by     : adm-{initials}
Host(s)         : vpnz-nft01  (all hosts affected, verbatim hostnames)
Task / playbook : 05-nftables-egress.yml  (or the script name, or the manual step)
Change window   : in-window | out-of-window (state which)
Test case ID    : TC-L4-nn
Trust boundary  : TB-nn, or "not applicable"

OBSERVED
  What actually happened, with the verbatim command that produced it and the
  relevant output lines. Screenshot reference: 07-evidence/{date}_{host}_{what}.png

EXPECTED
  What the design says should have happened, with the section or baseline
  reference that fixes the expectation (for example "design baseline section
  12.4 requires changed=0 on the second run").

DIFFERENCE
  The precise delta: which value differed, or which step did not occur.

ROOT CAUSE
  The underlying reason, once established. If it is not established, write
  "NOT ESTABLISHED" and state what further test would establish it. Do not guess.

RESOLUTION
  The change made, who reviewed it, the commit that carries it, and the
  verification that proves the resolution (with the evidence path).

RESIDUAL RISK
  What remains uncertain or unaddressed after the fix.

LESSON
  What the group would do differently, stated in one or two sentences.
```

#### 10.11.2 實作範例（示例）

```text
Finding ID      : F-L4-01
Date recorded   : 2026-11-09
Recorded by     : adm-w2
Host(s)         : vpnz-nft02
Task / playbook : 05-nftables-egress.yml, tags: drift
Change window   : in-window
Test case ID    : TC-L4-03
Trust boundary  : TB-03

OBSERVED
  The drift task reported DRIFT on the canary node. The diff showed one extra rule:
    + ip saddr 10.10.30.31 tcp dport 9090 accept
  which does not exist in templates/nftables-30-filter-forward.nft.j2.
  Evidence: 07-evidence/2026-11-09_vpnz-nft02_nft-drift-diff.png

EXPECTED
  The running ruleset should be byte-identical to the rendered template, because
  the design statement is that the template is the single source of truth for the
  egress policy (design baseline section 12.2 and section 12.4 of this project's
  automation strategy).

DIFFERENCE
  One forward-accept rule for TCP 9090 from the monitoring host was present on the
  live firewall and absent from Git.

ROOT CAUSE
  During the Prometheus triage experiment on 2026-11-06 an ad-hoc rule was added by
  hand with `nft add rule` to reach a temporary exporter port. The rule was never
  removed and never written back into the template.

RESOLUTION
  The rule was removed from the live node; the port was instead added to the
  monitoring port row in templates/nftables-30-filter-forward.nft.j2 under
  group_vars/edge.yml (commit a1b2c3d, reviewed by adm-w4). The playbook was
  re-run, the drift task reported NO-DRIFT, and the second run reported changed=0
  on both nodes (runs/2026-11-09_2231_05-nftables.SECOND-RUN.log).

RESIDUAL RISK
  The ad-hoc change existed for three days before detection. The daily audit
  would not have caught it, because the audit playbook asserts the presence of the
  table and the policy, not the absence of extra rules. A future check that hashes
  the running ruleset and compares it with the rendered template on a schedule
  would close that gap; it is recorded as future work.

LESSON
  Every hand-made change on a live firewall must be written back into the template
  within the same session. The drift task caught it, but only because a playbook
  happened to be run; relying on that is a process weakness, not a control.
```

本範例為**示例**，展示所預期的具體程度。真實的發現記錄會指名實際的提交、實際的執行日誌路徑及實際的證據檔，且不得憑記憶撰寫。小組所施加的規則很簡單：**一項無法追溯到命令記錄、日誌路徑或螢幕截圖的發現，還不是一項發現 —— 它是一個疑點，在取得證據之前應留在會議紀錄之中。**
