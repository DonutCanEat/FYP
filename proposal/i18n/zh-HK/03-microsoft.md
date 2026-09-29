## 7. Microsoft 伺服器網絡與網絡服務

### 7.1 概覽與目標

#### 7.1.1 本技術路線所交付的內容

[FIGURE: 技術路線 L1 的方塊圖 —— 設計基準的九部 Windows Server 客體按功能群組編排（身分識別：`vpnz-dc01`/`vpnz-dc02`；資料：`vpnz-fs01`、`vpnz-san01`；存取：`vpnz-rras01`；管理：`vpnz-jump01`、`vpnz-brdc01`；DMZ 消費端：`vpnz-dmzweba01`/`vpnz-dmzweba02`），每部均標示其 IP 位址、VLAN 及本報告中負責建置該客體的章節]

主題表的路線 L1 措辭為 *"Microsoft Server Networking and Network Services (e.g., ADDS, FSRM, iSCSI, RRAS, IKEv2, etc.)"*。本節是 Vertex Peak 實驗室整個 Windows 半邊的建置手冊。其撰寫方式使從未接觸過此環境的讀者，能夠從一部全新安裝的 Windows Server 客體開始，最終得到可運作的身分識別服務、受管治的檔案服務、區塊儲存服務、路由式遠端存取服務，以及憑證式 VPN —— 每一項均附有指令記錄與螢幕擷取作為佐證。

本路線由九部 Windows Server 2025 Standard（Desktop Experience）客體加一部管理工作站交付，此配置已固定於標準裝置與 VM 清單中（設計基準 §6）：
| VM | 位址 | VLAN | 本節中的角色 |
|---|---|---|---|
| `vpnz-dc01` | 10.10.30.11 | 30 `SRV-HQ-1` | 第一部網域控制站；全部五個 FSMO 角色；AD 整合 DNS；主要 DHCP；樹系的權威 NTP 來源；AD CS 企業根 CA（在單層決策下為 `VP-ISSUING-CA-01`） |
| `vpnz-dc02` | 10.10.30.12 | 30 `SRV-HQ-1` | 第二部網域控制站；DNS 備援；DHCP 容錯移轉夥伴（80/20）；通用類別目錄 |
| `vpnz-fs01` | 10.10.30.21 | 30 `SRV-HQ-1` | 檔案伺服器；FSRM 配額、檔案遮蔽、分類、存放裝置報告；DFS-R；Windows Backup 目標 |
| `vpnz-san01` | 10.10.80.21 | 80 `STORAGE-HQ` | iSCSI Target Server；LUN01 20 GB、LUN02 40 GB、LUN03 60 GB 精簡 |
| `vpnz-rras01` | 10.10.30.41 | 30 `SRV-HQ-1` | RRAS IKEv2 遠端存取 VPN；NPS/RADIUS 授權與帳戶處理 |
| `vpnz-jump01` | 10.20.20.31 | 20 `MGMT-OOB` | 特權存取工作站；RDP/WinRM 管理進入點；PowerShell 7.4 LTS 撰寫主機；Windows Admin Center 閘道 |
| `vpnz-brdc01` | 10.10.113.11（主機 NIC）／10.10.113.12（管理） | 113 `BR-MGMT` | 觀塘唯讀網域控制站；分支 DNS；本機 DHCP 轉送 |
| `vpnz-dmzweba01` | 10.10.90.21 | 90 `DMZ-HQ` | IIS 應用層節點 1 —— 消費 §7.4 簽發的憑證及 §7.6 的區塊儲存（交叉參照本報告 §5） |
| `vpnz-dmzweba02` | 10.10.90.22 | 90 `DMZ-HQ` | IIS 應用層節點 2 —— 同上 |
| `vpnz-pki01` | 10.10.30.15 | 30 `SRV-HQ-1` | **[假設]** 兩層 PKI 的可選簽發 CA。除非小組採取兩層決策，否則不予分配（基準 §19 待辦事項 O-06） |

除兩部網域控制站外，每部客體均為已 sysprep 範本 `W2K25-TEMPLATE-01` 的完整複製，而兩部網域控制站則直接由安裝媒體建置，以確保不存在複製的 SID 或殘留的網域成員資格（基準 §6）。僅主機網絡按基準的 `VNET-*` 表編號；本節所有客體均位於 `VNET-SRV`（10.10.30.0/24 → 30 `SRV-HQ-1`），惟 `vpnz-san01`（`VNET-STOR`，10.10.80.0/24 → 80 `STORAGE-HQ`）、`vpnz-jump01`（`VNET-MGMT`，10.20.20.0/24 → 20 `MGMT-OOB`）及兩個 IIS 節點（`VNET-DMZ`，10.10.90.0/24 → 90 `DMZ-HQ`）除外。

#### 7.1.2 目標

1. 建立一個樹系、一個網域、一個樹狀結構 —— `vertexpeak.fyp.lab`（NetBIOS `VERTEXPEAK`）—— 在總部設兩部可寫網域控制站、在觀塘設一部唯讀網域控制站，樹系與網域功能等級為 Windows Server 2025。
2. 實作基準所固定的確切 OU 樹、群組集合與服務帳戶模型，並展示尊重兩層管理模型的委派。
3. 將 DNS 與時間提供為可靠的平台服務，因為其他每一條路線均依賴它們（基準 §3.6 服務相依鏈）。
4. 交付可運作的企業 PKI，使憑證式 IKEv2 VPN 驗證成為可能，且設計中任何地方均不使用預先共用金鑰。
5. 交付受管治的檔案服務，其中配額與檔案類型原則由作業系統強制執行，而非依賴慣例。
6. 交付平台層可確定性掛接、卸離及重新掛接的區塊儲存服務（iSCSI LUN）。
7. 交付路由式遠端存取及一個 IKEv2 遠端存取 VPN，具機器加使用者憑證驗證，並經由 NPS 對照 `GG-VPN-Users` 與 `GG-VPN-ProfServices` 進行授權。
8. 產出主題表所要求的指令與擷取佐證軌跡（"findings, manuals, steps, screen captures, verifications, and references"）。

#### 7.1.3 本路線培養哪些 WSOS 2026 領域

WorldSkills Occupational Standards 2026 就技能 2447 *IT Network Systems Administration*（WorldSkills Shanghai 2026 版）載有下列章節權重，逐字取自評核表：*Work organization and management* 5 %、*Communication and interpersonal Skills* 5 %、*Data Transfer Networks* 25 %、*Network and System Operations* 25 %、*Infrastructure Automation* 15 %、*Troubleshooting* 25 %（基準 §11.6；完整經驗證摘錄見 `proposal\research\wsos-2026-2447.md`）。
| WSOS 領域 | 權重 | 本節的貢獻 |
|---|---|---|
| 4 —— Network and System Operations | 25 % | 核心部分。領域 4 要求考生 `Install and manage enterprise directory services (ADDS, LDAP)`、`Install and manage domain name services (Windows DNS, BIND)`、`Install and manage dynamic host configuration services`、`Install and manage network time services`、`Install and manage remote network access services`、`Install and manage authentication, authorization and accounting services`、`Setup public key infrastructure services`（下含 `Active Directory Certificate Services`、`OpenSSL`）、`Install and manage sharing services`（下含 `SMB`、`DFS`、`NFS`、`FTP`）、`Install and manage backup systems`（下含 `Windows Server Backup`、`rsync`、`Script based backup…`）及 `Manage file systems`（下含 `Software RAID`、`mdadm`、`LVM/Dynamic disks`、`File systems such as NTFS, ReFS, EXT4 and NTFS.`） |
| 6 —— Troubleshooting | 25 % | 本節 §7.12 為一個十宗以上個案的失效模式登記冊，而 §7.3–§7.8 中每一建置步驟均以一條驗證指令作結，其輸出即為診斷產物。領域 6 亦載有下文 §7.1.4 所引述的文件編製義務。 |
| 3 —— Data Transfer Networks | 25 % | 與 Cisco 路線共用。本節透過憑證保護的 IKEv2 通道，貢獻 `Security protocols to secure local and wide area networks` 及通用 VPN 路線（`Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.`） |
| 1 —— Work organization and management | 5 % | 有條理的 runbook 紀律、`Undergo various certification requirements, such as: Cisco, Microsoft, and Linux`（Microsoft 半邊由本路線的深度所涵蓋），以及 §7.11 的佐證管理紀律 |
| 5 —— Infrastructure Automation | 15 % | 交叉參照而非重複：§7.3.1 及 §7.10 所建立的 WinRM 介面，即 Ansible 控制節點 `vpnz-mon01` 用以觸達每部 Windows 客體的傳輸途徑（報告 §10） |

#### 7.1.4 關於標準的誠實聲明（強制）

本路線五項技術中有四項**在 WSOS 2026 中並無任何地方提及**。字串 `FSRM`、`iSCSI`、`RRAS` 及 `IKEv2` 在 2026 標準文本中各出現 **0 次**，*且*在 2026 原始 HTML 中亦各出現 0 次；2024 版情況相同。因此它們是**依主題表自身措辭而證成的專案選擇**，而非標準要求。合法承載它們的通用條目為：

- FSRM → `Install and manage sharing services`（下含 `SMB`、`DFS`）及 `Manage file systems`（領域 4）。
- iSCSI → `Manage file systems`（下含 `LVM/Dynamic disks`、`NTFS`、`ReFS`）（領域 4）。
- RRAS → `Install and manage remote network access services`（下含 `SSH`、`Remote Desktop Services`）（領域 4）。
- IKEv2 → 領域 3 VPN 路線中的 `IPSec` 提及，以及領域 3 的 know/understand 條目 `Security protocols to secure local and wide area networks`。

只有 **AD DS** 被明確點名：`Install and manage enterprise directory services (ADDS, LDAP)`。`Active Directory Certificate Services` 與 `Group Policy` 亦被點名，因此 §7.4 與 §7.3.6 是本節中有直接標準依據的兩個部分。

擷取螢幕截圖的要求**並非** WorldSkills 的要求。字串 `screen`、`capture`、`screenshot` 及 `evidence` 在 WSOS 2026 中各出現 **0 次**。該項義務來自 HDTN 主題表，其要求學生*"produce well-organized documentation that includes all findings, manuals, steps, screen captures, verifications, and references related to the project."* 標準自身的文件編製義務則屬另一回事，此處引述它們，是因為它們證成了本節的形態：

> `Prepare a technical document reflecting the solution in detail for agreement and sign-off`（領域 6，*shall be able to*，第 7 行）

> `The purpose of documenting the completion of the installation or up-grade`（領域 6，*know and understand*，第 6 行）—— 依原文拼寫照錄

> In the skill competition the assessment of knowledge and understanding will take place through the assessment of performance.（WSOS 一般說明）

最後一行正是本節寫成可執行手冊而非設計論述的原因：評核載體是已展示的實務表現。

---

### 7.2 設計決策

以下每項決策均陳述其選擇、理由，以及被否決的方案。每項決策均可追溯至基準 §2.1 盡職審查清單中的某一編號項目（生產鏈隔離、已記錄的最小權限、憑證式遠端存取、已記錄的容錯移轉行為、經審閱的可重複變更），或追溯至任務書 §1.2。

#### 7.2.1 樹系與網域設計 —— 一個樹系、一個網域、一個樹狀結構

**決策。** 單一樹系包含單一網域 `vertexpeak.fyp.lab`，NetBIOS 名稱 `VERTEXPEAK`，功能等級 Windows Server 2025，單一 UPN 尾碼 `vertexpeak.fyp.lab`（預設值；不設額外尾碼），Kerberos 領域 `VERTEXPEAK.FYP.LAB`。

**理由。** Vertex Peak 有 160 名員工、分佈於四個地點，並無進行中的收購，亦無任何法規要求業務單位之間須有管理邊界。多網域模型會為此規模帶來複寫拓撲、跨網域群組轉譯及 Kerberos 轉介的複雜性而毫無得益，並會令兩層管理模型更難解釋而非更易。資源樹系、多樹狀結構及跨樹系信任因同一理由被明確否決：它們所解決的問題本情境並不存在。

**必須在報告中陳述的後果。** 單一網域意味著只有一個 `Domain Admins` 群組，這正是本專案區分*管理層級*（§7.2.6）而非*網域*的原因。分層是管理與群組原則的構造，並非目錄邊界，其限制必須在設計文件中誠實描述。

NetBIOS 名稱以 `-DomainNetbiosName VERTEXPEAK` 明確設定，而非接受自動推導值，因為自動推導值會靜默截斷至 15 個字元，而本專案的慣例（基準 §8.3）要求該確切字串。

#### 7.2.2 OU 結構

**決策。** 基準 §9.2 所固定的確切樹狀結構逐字實作於 `OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab` 之下。建置時不新增、不重新命名、不重新嵌套任何項目；若樹狀結構必須變更，則先修訂基準。

**理由。** 該樹狀結構按**頂層物件類型、其次站台、再其次功能**組織 —— 此形態使群組原則、委派與存取模型均能在可預期的層級上掛接：

- `OU=Users` → `OU=HQ-ShaTin` → 各部門 OU，為每個部門提供一個磁碟機對應的連結點，並為服務台密碼重設提供一個委派點。
- `OU=Computers` → `OU=Servers` → `OU=MemberServers` / `OU=Tier0-DomainControllers` / `OU=DMZ-Servers`，提供三套不同的安全性基準與三個不同的連結點，這正是令 DMZ 基準（§7.3.6，G-5）得以成立的原因。
- `OU=Admins` → `OU=Tier0` / `OU=Tier1` / `OU=BreakGlass` 將特權帳戶與其管理的對象分離，使單一可委派 OU（`OU=Users`）永不包含有能力修改自身權限的帳戶。
- `OU=Quarantine` → `OU=Disabled` / `OU=NewObjects` 為自動化層提供一個確定性的著陸區，以安置未通過驗證的帳戶，而非將其刪除並重新建立。

**由基準強制執行的規則。** 預設的 `CN=Users` 與 `CN=Computers` 容器僅供 RODC 使用，不作他用。本專案建立的每個使用者與電腦物件，在建置被視為完成之前，必須位於上述樹狀結構之內。此點以下列傳回空結果的檢查驗證：
```powershell
# Must return nothing: no user or computer objects outside OU=VertexPeak
Get-ADUser -Filter * -SearchBase "CN=Users,DC=vertexpeak,DC=fyp,DC=lab" |
    Where-Object { $_.DistinguishedName -notmatch 'OU=' } |
    Select-Object Name, DistinguishedName
```

#### 7.2.3 站台與子網路物件

**決策。** 四個 AD 站台 —— `HQ-ShaTin`、`BR-KwunTong`、`WC-WanChai`、`MO-Macau` —— 以及基準 §5.2 定址計劃中每個子網路對應一個子網路物件，每個均恰好對應至一個站台。不得有任何子網路未被對應。

**理由。** 站台正是令觀塘 RODC 在本機登入、而非為每個 Kerberos 要求跨越 WAN 回到總部的原因，也是令總部用戶端偏好 `vpnz-dc01`／`vpnz-dc02`、而非隨機選取網域控制站的原因。站台連結 `HQ-ShaTin` ↔ `BR-KwunTong` 配置為 **15 分鐘複寫間隔**（基準 §9.1），因為分支可容忍最多十五分鐘的身分識別延遲，以換取較少的 WAN 流量；分支 RODC 保有快取的身分識別副本，因此無論如何分支登入均能在總部 WAN 中斷時存續。

`WC-WanChai` 與 `MO-Macau` 在本基準中沒有本機網域控制站，因此將子網路物件對應至該等站台，可使 DC 定位器行為*具確定性且可觀察*（用戶端將解析至最近且設有 DC 的站台中的 DC，即 `HQ-ShaTin`），而非任其隨機。此確定性正是令 §7.13 的發現得以記錄的原因。

#### 7.2.4 DNS 設計
| 決策 | 值 | 理由 |
|---|---|---|
| 區域類型 | AD 整合，複寫至網域內所有 DNS 伺服器 | 區域資料隨 AD 複寫傳遞，因此沒有另需保護的區域傳送路徑，亦無須維護主要／次要之分 |
| 動態更新 | 僅安全 | 未經驗證的用戶端無法登錄記錄以覆寫伺服器的記錄。這是 DNS 設計中最重要的單一防偽造設定，也是基準連接埠矩陣中 `P-31` DNS AXFR 一列僅限兩部網域控制站的原因 |
| 正向區域 | `vertexpeak.fyp.lab` | 基準 §8.3 |
| 反向區域 | `30.10.10.in-addr.arpa`、`40.10.10.in-addr.arpa`、`90.10.10.in-addr.arpa`、`20.20.10.in-addr.arpa`，以 AD 整合並為每部靜態主機設 PTR 記錄 | 使 `nslookup`／`Resolve-DnsName` 診斷具雙向性，這在 §7.12 排解 VPN 位址池解析問題時至關重要 |
| 分支反向區域 | `113.10.10.in-addr.arpa` 委派給 RODC 並由總部轉送 | 分支擁有自己的反向查閱；總部仍可解析它們 |
| 清除 | 啟用，7 天，套用於兩個動態區域 | 防止來自 DHCP 位址池的過期工作站記錄累積 |
| 轉寄站 | `192.0.2.53`、`192.0.2.54`（模擬的供應商解析器） | 基準 §9.1。根提示予以保留，但在實驗室中必須永遠不可觸達，這本身即是一項已記錄的測試 |
| 條件式轉寄 | `vertexpeak.example` → `192.0.2.53` | 在實驗室內解析模擬的公開名稱 `portal.vertexpeak.example`、`www.vertexpeak.example`、`blog.vertexpeak.example`，無須真實的公開解析器 |
| 其他記錄 | `portal`、`www`、`blog` → `10.10.90.10`（nginx VIP，不屬於任何節點）；`vpn` 與 `wg` → `10.10.50.10`；`keepalived-hq` → 兩對 VRRP 成員（10.10.50.11/.12 及 10.10.90.28/.29） | 基準 §5.8，經 Rev 1.1 修訂 |
| 不予建立 | `_autodiscover._tcp` | 本專案不整合 Exchange 或 Microsoft 365；記錄為明確的範圍外項目，而非遺漏 |

**刻意的分割視域（split-horizon）。** 內部區域 `vertexpeak.fyp.lab` 與文件網域 `.example` 是兩個不同的命名空間。`portal.vertexpeak.fyp.lab` 在內部解析至反向代理 VIP，而 `portal.vertexpeak.example` 是已發佈的名稱，實驗室無法真正解析它，因為不存在公開 DNS。報告必須展示並解釋由內部 PKI 憑證（其 SAN 同時包含兩個名稱）所導致的名稱不符警告，而非加以掩藏（基準 §8.5）。

**每個用戶端取得 `10.10.30.11`，然後 `10.10.30.12`，順序如此，別無其他。** 任何客體（Windows 或 Linux）均不配置公開解析器。`vpnz-brdc01` 在分支 DHCP 選項清單中位列第三，且對任何用戶端而言，它絕不可成為唯一的解析器。

#### 7.2.5 服務帳戶模型

**決策。** 九個帳戶實作所有非人類驗證，完全按基準 §8.4 所固定。它們位於 `OU=ServiceAccounts,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab`，除表中另有註明者外，均**不**屬於任何特權群組，且**已停用「密碼永不過期」**（使輪換由自動化手冊強制執行，而非因疏忽而失效），並**已啟用「使用者不能變更密碼」**（使任何互動式登入均無法輪換該密碼）。密碼為 32 個字元的隨機內容，保存在小組的密碼管理員中，**絕不**提交至 Git。
| 帳戶 | 用途 | 成員資格 |
|---|---|---|
| `svc_ansible` | Ansible 經由 WinRM 連線至 Windows 客體 | 僅 `GG-WINRM-Admins` |
| `svc_backup` | 備份工作及備份共用存取 | `GG-Backup-Operators` |
| `svc_monitoring` | Prometheus／`windows_exporter` 讀取權；SNMPv3 使用者 | `GG-Monitoring-Readers` |
| `svc_aiagent` | AI 代理的唯讀憑證 | 僅 `GG-AI-ReadOnly` —— 絕不加入 `Domain Admins` |
| `svc_ldapbind` | 供 WordPress 驗證外掛使用的 LDAP 繫結 | `GG-DMZ-LDAP-Readers` |
| `svc_git` | 由 `vpnz-mon01` 存取 Git/Gitea | `GG-DevOps-Users` |
| `adm-{initials}` ×4 | 個人具名管理帳戶，每位學生一個 | `GG-Server-Admins`；四者中的**兩個**亦屬 `GG-Tier0-Admins`，且是唯一獲准接觸 `vpnz-dc01`／`vpnz-dc02` 的帳戶 |
| `da-vertexpeak` | 緊急破窗用 Domain Admin | `Domain Admins`；密碼密封於實體信封，由小組導師保管；正常運作期間不使用，任何使用均必須記錄於報告中 |
| `krbtgt` | Kerberos 服務帳戶 | 永不觸碰；其雙重重設僅屬已記錄的災難復原演練，且僅在導師批准下執行 |

**理由。** 具名的個人管理帳戶加上密封的破窗帳戶，是「共用 `Administrator`」問題的標準答案，且可直接追溯至盡職審查項目 2（已記錄的最小權限及管理動作的稽核軌跡）。由於每項管理動作均帶有個人姓名，安全性事件記錄便成為稽核軌跡，而非匿名特權的日誌。`svc_*` 帳戶*僅*獲得其功能所需的群組成員資格，這正是使 AI 代理的唯讀保證（§7.9）可被查核、而非僅止於聲稱的原因。

**「除註明者外不得具特權成員資格」規則的強制執行**是一項指令碼化檢查，而非承諾：
```powershell
# Fail the build if any svc_* account has ended up in a privileged group
$forbidden = 'Domain Admins','Enterprise Admins','Schema Admins','Administrators','Account Operators',
             'Backup Operators','Server Operators','Group Policy Creator Owners','Protected Users'
Get-ADUser -Filter 'sAMAccountName -like "svc_*"' -Properties MemberOf |
    ForEach-Object {
        $bad = $_.MemberOf | Where-Object { $n = ($_ -split ',')[0] -replace '^CN=',''; $forbidden -contains $n }
        if ($bad) { [pscustomobject]@{ Account = $_.sAMAccountName; ForbiddenGroup = ($bad -join ';') } }
    }
# Expected output: no rows
```

#### 7.2.6 群組策略

**決策。** 遵循經典的 AGDLP 形態，並有一項刻意的例外。

- **通用群組（Global groups）** 容納**使用者**帳戶：`GG-Server-Admins`、`GG-Tier0-Admins`、`GG-Workstation-Admins`、`GG-Helpdesk`、`GG-Finance-RW`、`GG-Finance-RO`、`GG-Engineering-RW`、`GG-Sales-RO`、`GG-VPN-Users`、`GG-VPN-ProfServices`、`GG-Infra-Admins`。
- **網域本機群組（Domain Local groups）** 容納**通用群組**，並由資源本身據以查核：`GG-DMZ-LDAP-Readers`、`GG-Monitoring-Readers`、`GG-AI-ReadOnly`，以及每個 FSRM 共用各一個 `DL-{Share}-{RW|RO}`。
- `OU=Groups/OU=RoleBased` 下的**角色型群組**表達職務功能，是管理員在為人員辦理入職時唯一需指派的群組。

**刻意的例外 —— `GG-DMZ-LDAP-Readers`、`GG-Monitoring-Readers` 及 `GG-AI-ReadOnly` 是直接容納服務帳戶的網域本機群組**，而非容納通用群組，因為它們各自恰好只有一個成員，且該成員是機器身分而非人員。插入一個只有一個成員的通用群組，只會增加一層毫無語意價值的結構。此偏離純粹 AGDLP 之處必須在設計文件中陳述，而非呈現為意外。

**為何使用者用通用、資源用網域本機。** 樹系只有一個網域，因此通用與萬用在今日並無功能差異；選擇通用，是因為它是複寫成本較低的物件，且未來若出現第二個網域（真正的收購，而非實驗室練習）仍可運作。資源存取使用網域本機，意味著*資源*擁有授權決策的最後一環，因此變更誰可讀取 Sales 共用只需在一處修改。

**`GG-VPN-ProfServices` 值得一註。** 它定義為 `GG-VPN-Users` *加上*對兩部平台 VM 的 RDP，這正是基準的信任邊界規則 TB-11。它刻意**不**是任何觸及 `Z-MGMT` 之群組的成員，因為 TB-12 規定 VPN 使用者絕非基礎架構的管理員。§7.8.2 的 VPN 授權原則只讀取此群組，不讀取其他任何項目。

#### 7.2.7 委派

**決策。** 委派在 OU 層級授予，採用最低權限集合，並授予執行該功能的群組。
| 受委派者 | 於 | 權限 | 理由 |
|---|---|---|---|
| `GG-Helpdesk` | 僅 `OU=Users` | *重設密碼*、*讀取及寫入 `userAccountControl`*（即解除鎖定）、*讀取所有使用者資訊* | 服務台可恢復存取，但不能建立、刪除、移動、重新授權或重新分組帳戶。寫入 `userAccountControl` 是允許解除帳戶鎖定的關鍵，而這是最常見的實際工單 |
| `GG-Server-Admins` | `OU=Computers/OU=Servers/OU=MemberServers` | 電腦物件的完全控制 | 管理成員伺服器環境而不觸及 Tier 0 |
| `GG-Tier0-Admins` | `OU=Computers/OU=Servers/OU=Tier0-DomainControllers`、`OU=Admins/OU=Tier0` | 完全控制 | 兩名 Tier-0 學生管理 DC 與 CA，且並無其他途徑可授予該權限 |
| `GG-Monitoring-Readers` | 網域根（等同 Performance Monitor Users） | *讀取*效能計數器、讀取事件記錄 | Prometheus 與 `windows_exporter` 需要讀取，而非寫入 |
| `svc_aiagent`（經由 `GG-AI-ReadOnly`） | 網域根 | 僅事件記錄讀取 | 該代理的憑證不獲授予其他任何權限，這正是使 §7.9 的唯讀主張可驗證的原因 |

**明確不做的事。** 除 `da-vertexpeak` 外，不將任何群組加入 `Domain Admins`。不向 `Authenticated Users`、`Everyone` 或 `Domain Users` 授予任何委派。成員伺服器上的本機系統管理員權限，是經由群組原則的受限群組與 LAPS（§7.3.6）交付，而非經由網域群組成員資格，因此成員伺服器遭入侵不會帶來網域範圍的管理權限。

**兩層管理模型**是報告必須連同其限制一併呈現的設計決策。四名學生中有兩名為 Tier 0，兩名為 Tier 1。Tier-0 憑證僅從 `vpnz-jump01`（10.20.20.31，`Z-MGMT`）使用，絕不從工作站使用。誠實的限制在於：以四名學生及一部 Hypervisor 主機而言，管理工作站實體隔離是一項*程序*而非一項*控制*：同一部 `vpnz-jump01` 可被四人觸達，而一名擁有 Hypervisor 主控台存取權的有決心 Tier-1 管理員，可不顧 AD 權限而觸達 Tier-0 VM。該限制應寫入報告，而非腳註。

#### 7.2.8 密碼與鎖定原則，以及細緻密碼原則

**基準網域原則**（設定於 Default Domain Policy，連結於網域根）：
| 設定 | 值 | 理由 |
|---|---|---|
| 密碼最短長度 | 14 個字元 | 長到足以令被竊 NT 雜湊的離線破解在本專案時程內不切實際，短到足以讓 160 名員工可用 |
| 密碼歷程記錄 | 記住 24 個密碼 | 防止「在兩個密碼之間輪換」的失效模式 |
| 密碼最長使用期限 | 60 天 | 在曝險窗口與服務台負載之間取得平衡；驅動自動化手冊為服務帳戶執行的輪換 |
| 密碼最短使用期限 | 1 天 | 防止使用者在一次工作階段內循環歷程記錄回到原密碼 |
| 複雜性 | 已啟用 | 封鎖簡易的字典類密碼 |
| 可還原的加密 | 已停用 | 儲存密碼的可還原形式嚴格而言更差，且本設計中並無任何需求 |
| 帳戶鎖定閾值 | 5 次無效登入 | 低到足以令暴力破解爆發在數分鐘內出現於 Security 4625/4740，高到足以容忍輸入失誤的使用者 |
| 帳戶鎖定持續時間 | 15 分鐘 | 無須致電服務台即可自動解除，同時仍施加每小時約 20 次嘗試的上限 |
| 在下列時間後重設帳戶鎖定計數器 | 15 分鐘 | 與持續時間同值，使計數器與鎖定一同清除，行為易於在疑難排解章節中說明 |
| 允許 Administrator 帳戶鎖定 | 已啟用 | 內建 `Administrator` 反正已停用，但此設定移除了一個眾所周知的暴力破解目標 |

**細緻密碼原則使用了一次，且有可辯護的理由。** 上述網域原則適用於人員。本設計中有兩類帳戶不得受 60 天到期所管轄，因為對一個沒有互動式擁有者的服務帳戶施加 60 天到期，只會產生唯一一種結果：有人把它設為永久密碼。基準 §8.4 要求每個 `svc_*` 帳戶的 `Password never expires` 須為**已停用**，因此滿足該要求的安全做法，是採用一個不設最長使用期限、且僅限於服務帳戶 OU 的細緻原則：
```powershell
New-ADFineGrainedPasswordPolicy -Name "FGPP-ServiceAccounts" `
    -Precedence 10 `
    -ComplexityEnabled $true `
    -ReversibleEncryptionEnabled $false `
    -MinPasswordLength 32 `
    -PasswordHistoryCount 12 `
    -MaxPasswordAge ([TimeSpan]::FromDays(365)) `
    -MinPasswordAge ([TimeSpan]::FromDays(1)) `
    -LockoutThreshold 5 `
    -LockoutDuration ([TimeSpan]::FromMinutes(15)) `
    -LockoutObservationWindow ([TimeSpan]::FromMinutes(15)) `
    -Description "FGPP for svc_* accounts. 32-char minimum, annual rotation by playbook."

Add-ADFineGrainedPasswordPolicySubject -Identity "FGPP-ServiceAccounts" `
    -Subjects (Get-ADUser -Filter 'sAMAccountName -like "svc_*"')
```

365 天的最長使用期限是一項刻意的折衷，報告必須如此呈現：它使「密碼永不過期」成為 false（滿足基準規則），同時承認真正的控制是手冊輪換，而非到期計時器。若小組偏好嚴格不設到期，正確做法是修訂基準 §8.4，而不是設定該旗標並任憑規則被靜默違反。

**Protected Users。** 四個 `adm-{initials}` 帳戶被加入內建的 `Protected Users` 群組，這會從那些工作階段中移除 NTLM、CredSSP 及非約束委派憑證。其後果 —— 這些帳戶無法對任何預期使用 NTLM 的對象進行驗證 —— 必須記錄為已知限制，因為 `GG-Workstation-Admins` 與舊式工具正是此後果造成影響之處。

**本機系統管理員密碼**由 Windows LAPS 經由 `GPO-WS-Windows-LAPS` 輪換，而非由我們任何指令碼執行（基準 §9.3）。這是對「在多個相同的本機管理員憑證之間傳遞雜湊（pass-the-hash）」的正確答案，否則在以單一範本建置的實驗室中，那是最可能的橫向移動路徑。

#### 7.2.9 介面別名、儲存庫路徑與命名

所有 Windows 客體均採用基準 §8.1 所固定的別名慣例：每部 `Z-SERVER` 客體上的單一 NIC 重新命名為 `SRV-VLAN30`，`vpnz-jump01` 的 NIC 為 `MGMT-VLAN20`，DMZ NIC 為 `DMZ-VLAN90`。此舉在預檢期間（§7.3.1）以 `Rename-NetAdapter` 設定，使本節、自動化路線或測試計劃中後續任何指令，均不會依賴 `"Ethernet 2"`。

建置產物寫入基準 §8.6 所固定的路徑：指令碼日誌寫入 `C:\FYP\logs\`，命名為 `YYYY-MM-DD_{script}.log`；擷取的配置基準寫入 `C:\FYP\config\`；螢幕擷取暫存寫入 `C:\FYP\evidence\`。FSRM 管理的共用位於 `D:\Shares\Finance`、`D:\Shares\Engineering`、`D:\Shares\SalesRO`、`D:\Shares\Public`，並在報告中以其在 `\\vpnz-fs01\Shares\` 下的 UNC 路徑引用。iSCSI 目標 VHD 位於 `D:\iSCSI\LUN01` … `LUN03`。這些值均不得在本機重新命名。

---

### 7.3 Active Directory 網域服務（AD DS，Active Directory Domain Services）

AD DS 是本路線中唯一獲 WSOS 2026 明確點名的技術 —— `Install and manage enterprise directory services (ADDS, LDAP)`（領域 4）—— 而它同時是 Windows 環境中其他一切的相依根源：DNS、DHCP、Kerberos、群組原則、AD CS、NPS 授權及 FSRM 共用 ACL 均透過它解析。

#### 7.3.1 先決條件與預檢檢查

##### VM 設定

兩部網域控制站均**由安裝媒體**建置，而非由 `W2K25-TEMPLATE-01` 建置，以確保不存在複製的 SID、過期的電腦帳戶及先前快取的網域憑證。Hypervisor 設定遵循基準 §6.1 所要求的通用形式（Hypervisor 專屬措辭屬於建置手冊中的各 Hypervisor 附錄）：
| 設定 | `vpnz-dc01` | `vpnz-dc02` | 備註 |
|---|---|---|---|
| 客體作業系統 | Windows Server 2025 Standard (Desktop Experience) | 同上 | 刻意選擇 Desktop Experience：小組需要圖形介面佐證以供報告之用。這是已陳明的取捨，而非疏漏 —— 較安全的 Server Core 選項因佐證理由而被否決 |
| 組建 | `10.0.26100.1742` **[假設：確切修補等級]** | 同上 | 基礎組建 `10.0.26100` 已驗證；修補尾碼必須在建置時以 `Get-ComputerInfo`／`systeminfo` 確認。若 Windows Server 2025 媒體不可得，則退回 Windows Server 2022（組建 20348），並在「版本偏差」小節記錄該偏差 |
| vCPU | 2 | 2 | 已分配，未飽和 |
| RAM | 4 GB | 4 GB | 依基準 §6 |
| 系統磁碟 | 60 GB，精簡佈建 | 60 GB | |
| NIC 數目 | 1 | 1 | |
| NIC 網絡 | 僅主機 10.10.30.0/24，Hypervisor DHCP **關閉** | 同上 | `VNET-SRV` |
| NIC 別名 | `SRV-VLAN30` | `SRV-VLAN30` | 以 `Rename-NetAdapter` 設定 |
| 與主機時間同步 | 升級前**已停用** | 升級前已停用 | 見下文 |
| 快照 | 於升級前立即建立 | 於升級前立即建立 | 命名為 `pre-promo-{date}` |

##### 為何必須關閉主機時間同步

`vpnz-dc01` 將成為樹系的權威時間來源，這要求它持有 PDC 模擬器角色，並向外與模擬的供應商（`192.0.2.53`）同步，而非與 Hypervisor 主機的時鐘同步。一部同時遵循主機時間整合的網域控制站，會產生 §7.12 所記錄的那一類間歇性 Kerberos 失效。因此，在安裝角色**之前**，兩部 DC 的 Hypervisor「與主機時間同步」選項均予以停用。這是學生 AD 建置中最常被略過的先決條件，也是它被列於首位的原因。

##### 預檢檢查指令碼

以下內容在一部全新安裝的客體上執行，於加入任何角色之前。它儲存為 `C:\FYP\logs\preflight-{hostname}.log`。
```powershell
# Requires -RunAsAdministrator
Start-Transcript -Path "C:\FYP\logs\$(Get-Date -Format 'yyyy-MM-dd')_preflight-$env:COMPUTERNAME.log"

# 1. Identity and build
Get-ComputerInfo | Select-Object CsName, WindowsProductName, WindowsVersion, OsBuildNumber, OsArchitecture
[System.Environment]::OSVersion.Version

# 2. Confirm the guest is NOT already domain-joined
(Get-CimInstance Win32_ComputerSystem).Domain, (Get-CimInstance Win32_ComputerSystem).PartOfDomain
# Expected:  "WORKGROUP"   and   False

# 3. Rename the adapter to the project convention BEFORE any static address is set
Rename-NetAdapter -Name (Get-NetAdapter | Where-Object Status -eq 'Up').Name -NewName 'SRV-VLAN30' -Confirm:$false

# 4. Static IP, mask, gateway, DNS (DC01 shown; DC02 uses .12)
New-NetIPAddress -InterfaceAlias 'SRV-VLAN30' -IPAddress 10.10.30.11 -PrefixLength 24 `
    -DefaultGateway 10.10.30.254
Set-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30' -ServerAddresses 127.0.0.1
Set-DnsClient -InterfaceAlias 'SRV-VLAN30' -ConnectionSpecificSuffix 'vertexpeak.fyp.lab'

# 5. Prove the addressing is actually applied (do not trust the Write-* cmdlet's silence)
Get-NetIPAddress -InterfaceAlias 'SRV-VLAN30' -AddressFamily IPv4 |
    Select-Object IPAddress, PrefixLength, InterfaceAlias
Get-NetRoute -InterfaceAlias 'SRV-VLAN30' -DestinationPrefix '0.0.0.0/0'

# 6. Hostname (≤15 characters per baseline §8.2)
Rename-Computer -NewName 'vpnz-dc01' -Restart:$false

# 7. Disable the hypervisor time-sync artefact and point w32time at the simulated provider
Set-Service -Name W32Time -StartupType Automatic
Start-Service W32Time
w32tm /config /manualpeerlist:"192.0.2.53,0x8 192.0.2.54,0x8" /syncfromflags:manual /reliable:yes /update

# 8. Confirm PowerShell runtime, because every script in this project must declare it
$PSVersionTable.PSVersion     # Expected: 5.1.x on a fresh guest
Stop-Transcript
```

**預期的預檢輸出（重要部分），已標記以供佐證檔案使用：**
```text
[PRE-FLIGHT vpnz-dc01]
CsName               : VPNZ-DC01
WindowsProductName   : Windows Server 2025 Standard
WindowsVersion       : 10.0.26100
OsBuildNumber        : 26100
OsArchitecture       : 64-bit
Domain               : WORKGROUP
PartOfDomain         : False
IPAddress            : 10.10.30.11
PrefixLength         : 24
InterfaceAlias       : SRV-VLAN30
DestinationPrefix    : 0.0.0.0/0
NextHop              : 10.10.30.254
PSVersion            : 5.1.26100.1742
[END PRE-FLIGHT]
```

重新命名後，客體會重新啟動。**重新啟動並非可選項，且是建置首次出錯之處**：`Rename-Computer` 直到重新開機才生效，而在重新開機前執行 AD 升級，會產生一部電腦帳戶名稱與主機名稱不符的網域控制站，之後必須手動修正。

##### 必須通過的升級前檢查
| 檢查 | 指令 | 預期 |
|---|---|---|
| 本機系統管理員權限 | `whoami /groups \| Select-String "S-1-5-32-544"` | `BUILTIN\Administrators` 存在，`Enabled group` |
| 對閘道的連線 | `Test-NetConnection 10.10.30.254 -InformationLevel Quiet` | `True` |
| DNS 用戶端指向自身 | `Get-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30'` | `127.0.0.1` |
| 無待處理的重新開機 | `Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending'` | `False` |
| 時間接近真實時間 | `w32tm /query /status` | 來源可觸達，偏移在數秒之內 |

#### 7.3.2 升級第一部網域控制站

`vpnz-dc01` 以新樹系根的身分升級。整個升級過程是一次 `Install-WindowsFeature` 呼叫，隨後是一次 `Install-ADDSForest` 呼叫。
```powershell
# ---- 7.3.2 STEP 1: install the roles on vpnz-dc01 ----
Install-WindowsFeature -Name AD-Domain-Services `
    -IncludeManagementTools `
    -IncludeAllSubFeature

# Confirm, do not assume
Get-WindowsFeature -Name AD-Domain-Services | Select-Object Name, InstallState
# Expected:  AD-Domain-Services   Installed
```

```powershell
# ---- 7.3.2 STEP 2: promote as the first DC of a new forest ----
$dsrmPwd = Read-Host -AsSecureString 'Directory Services Restore Mode password (seal in the group password manager)'

Install-ADDSForest `
    -DomainName 'vertexpeak.fyp.lab' `
    -DomainNetbiosName 'VERTEXPEAK' `
    -ForestMode 'Win2025' `
    -DomainMode 'Win2025' `
    -InstallDns $true `
    -CreateDnsDelegation $false `
    -DatabasePath 'C:\Windows\NTDS' `
    -LogPath 'C:\Windows\NTDS' `
    -SysvolPath 'C:\Windows\SYSVOL' `
    -SafeModeAdministratorPassword $dsrmPwd `
    -Force $true
```

**執行此區塊前的一項警告。** `-DomainNetbiosName` 值只輸入一次，之後若不重建樹系便無法復原。它必須是確切字串 `VERTEXPEAK`。按下 Enter 之前，請逐字元對照基準 §8.3 核讀該行：這是整個 Windows 建置中代價最高的錯字，因為該 NetBIOS 名稱嵌入了 §7.3.4、§7.5.2 中每一個 `VERTEXPEAK\` 群組引用，以及報告中每一次 `Set-Acl` 呼叫。

**逐參數的理由說明**（以下每一項均為設計決策，而非預設值）：
| 參數 | 值 | 理由 |
|---|---|---|
| `-DomainName` | `vertexpeak.fyp.lab` | 由基準 §8.3 固定。不是 `.local`，不是 `.lan`，不是真實註冊的網域，且明確不是 `example.com` |
| `-DomainNetbiosName` | `VERTEXPEAK` | 必須明確指定；自動推導會截斷至 15 個字元 |
| `-ForestMode` / `-DomainMode` | `Win2025` | Windows Server 2025 功能等級，依基準 §8.3。其不可逆之處在於等級可提升但永不降低，因此只設定正確一次 |
| `-InstallDns` | `$true` | 該 DC 同時是 DNS 伺服器；本設計中沒有獨立的 DNS 主機 |
| `-CreateDnsDelegation` | `$false` | 沒有可從中委派的父區域。若保留為 `$true`，會嘗試對不存在的父項進行委派，並產生一個看似失敗的警告 |
| `-DatabasePath`、`-LogPath`、`-SysvolPath` | `C:\Windows\NTDS`、`C:\Windows\SYSVOL` | 預設值，明確陳述以便佐證記錄載明資料實際所在。在真實建置中這些會是獨立磁碟區；在本實驗室中 60 GB 系統磁碟已足夠，而此選擇必須陳明為實驗室簡化 |
| `-SafeModeAdministratorPassword` | 提示輸入，絕不使用字面值 | DSRM 密碼。它是唯一能從備份還原 DC 的憑證，因此須在建立當下即存入小組的密碼管理員 —— 而非「稍後」 |
| `-Force` | `$true` | 抑制互動式確認，使升級可指令碼化且可重複 |

該呼叫會自動重新啟動客體。**重新開機是預期行為，並非錯誤。**

**[假設]** `Install-ADDSForest` 在 Windows Server 2025 上接受的 `-ForestMode`／`-DomainMode` 列舉值為 `Win2025`。若已安裝的組建拒絕該值，替代形式為 `Windows2025`（較舊語法）或數值 `-ForestMode 10`。請在已建置的客體上執行 `Get-Help Install-ADDSForest -Parameter ForestMode`，並記錄所鎖定版本實際接受哪一種形式。

##### 預期的升級輸出
```text
[PROMOTION vpnz-dc01 — Install-ADDSForest]
VERBOSE: Performing operation "Install AD DS Forest" on Target "VPNZ-DC01".
VERBOSE: The domain 'vertexpeak.fyp.lab' was created successfully.
VERBOSE: The DNS server was installed and the forward zone 'vertexpeak.fyp.lab' was created.
VERBOSE: The Active Directory Domain Services role was configured successfully on VPNZ-DC01.
VERBOSE: The computer will be restarted in 10 seconds...

Message                    Context                                RebootRequired
-------                    -------                                --------------
Operation completed        Target: VPNZ-DC01                      True

[POST-PROMOTION vpnz-dc01]
Domain                : vertexpeak.fyp.lab
DomainController      : VPNZ-DC01.vertexpeak.fyp.lab
Forest                : vertexpeak.fyp.lab
OperationMode         : Win2025Forest
ReplicationSiteName   : HQ-ShaTin
DatabasePath          : C:\Windows\NTDS
SysvolPath            : C:\Windows\SYSVOL
[END]
```

該輸出中有兩個細節容易誤讀。`OperationMode : Win2025Forest` 確認實際套用的功能等級 —— 若顯示 `Win2016Forest` 或類似值，表示 `-ForestMode` 值未被接受，必須由快照重新執行升級。`ReplicationSiteName : HQ-ShaTin` 是*預設*站台名稱，並確認下一個必要步驟：該站台必須重新命名為專案慣例名稱，此舉於 §7.3.5 執行。

##### 重新開機後立即執行
```powershell
# Rename the default site to the project convention (baseline §8.3)
Get-ADReplicationSite -Identity 'Default-First-Site-Name' |
    Set-ADReplicationSite -NewName 'HQ-ShaTin'

# Confirm FSMO placement: all five on vpnz-dc01 (baseline §12.1)
netdom query fsmo
Get-ADDomain | Select-Object PDCEmulator, RIDMaster, InfrastructureMaster
Get-ADForest | Select-Object SchemaMaster, DomainNamingMaster

# Confirm the forest-wide time configuration
w32tm /config /manualpeerlist:"192.0.2.53,0x8 192.0.2.54,0x8" /syncfromflags:manual /reliable:yes /update
Restart-Service W32Time
w32tm /query /status
w32tm /query /source
# Expected source: the configured peer list, NOT "Local CMOS Clock" and NOT the hypervisor
```

**一部回報 `Local CMOS Clock` 為其來源的網域控制站並非時間來源，必須在升級第二部 DC 之前修正** —— 第二部 DC 將繼承 PDC 模擬器當下的作為，包括其錯誤。

#### 7.3.3 加入第二部網域控制站與 DNS 備援

`vpnz-dc02`（10.10.30.12）由另一份媒體建置，以相同方式預檢（§7.3.1，使用 `-IPAddress 10.10.30.12` 及 `-NewName 'vpnz-dc02'`），然後以同一站台中額外網域控制站的身分加入既有網域。
```powershell
# ---- On vpnz-dc02: DNS must point at DC01 before the join, never at itself yet ----
Set-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30' -ServerAddresses 10.10.30.11
Resolve-DnsName vertexpeak.fyp.lab -Server 10.10.30.11
# Expected: SOA/NS records for vertexpeak.fyp.lab, plus an A record for vpnz-dc01

Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools -IncludeAllSubFeature

$dsrmPwd = Read-Host -AsSecureString 'DSRM password for vpnz-dc02'

Install-ADDSDomainController `
    -DomainName 'vertexpeak.fyp.lab' `
    -SiteName 'HQ-ShaTin' `
    -InstallDns $true `
    -Credential (Get-Credential 'VERTEXPEAK\adm-XX') `
    -DatabasePath 'C:\Windows\NTDS' `
    -LogPath 'C:\Windows\NTDS' `
    -SysvolPath 'C:\Windows\SYSVOL' `
    -SafeModeAdministratorPassword $dsrmPwd `
    -NoGlobalCatalog $false `
    -Force $true
```

| 參數 | 值 | 理由 |
|---|---|---|
| `-SiteName` | `HQ-ShaTin` | 明確將該 DC 置於正確站台。省略它會使伺服器落入 `Default-First-Site-Name` —— 而該站台在本設計中已不存在，因此省略會以錯誤形式浮現，而非靜默錯置 |
| `-InstallDns` | `$true` | DNS 備援正是第二部 DC 的意義所在：若 `vpnz-dc01` 離線，以 `10.10.30.12` 為第二解析器的用戶端仍可解析、仍可驗證 |
| `-NoGlobalCatalog` | `$false` | 兩部 DC 均為通用類別目錄，使 GC 查閱在單一網域樹系中永不依賴單一主機 |
| `-Credential` | 一個 Tier-0 帳戶 | 升級需要 Domain Admin 或同級權限；這是 `adm-{initials}` Tier-0 帳戶被合法使用的兩處之一 |

**在 `vpnz-dc02` 重新開機後，先將其自身的 DNS 指向自身，再指向其夥伴**，順序如此：
```powershell
Set-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30' -ServerAddresses 10.10.30.12, 10.10.30.11
Restart-Service DNS
Get-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30'
```

##### DNS 複寫驗證
```powershell
# Replication of the DNS application partitions, from either DC
repadmin /showrepl vpnz-dc01 vpnz-dc02
repadmin /replsummary
dcdiag /test:dns /dnsall /v
```

```text
[REPLICATION vpnz-dc01 — repadmin /replsummary]
Source DSA          largest delta    fails/total %%   error
VPNZ-DC01                  12m:04s    0 /   5    0
VPNZ-DC02                  11m:51s    0 /   5    0
Destination DSA     largest delta    fails/total %%   error
VPNZ-DC01                  11m:58s    0 /   5    0
VPNZ-DC02                  12m:01s    0 /   5    0
[END]
```

**解讀該輸出。** `fails/total` 必須為 `0 / n`，且無錯誤文字。若 `largest delta` 無界增長，即表示有複寫失敗，`repadmin /showrepl` 會將其歸因於特定命名內容與特定錯誤碼 —— 本實驗室中最常見的兩者為 8524（DNS 查閱失敗，即無法解析夥伴的記錄）及 1256（遠端系統無法使用，即 `P-07`／`P-31` RPC 與 DNS 路徑被防火牆封鎖）。兩者均為 §7.12 中的案例。

其他 DNS 備援檢查：
```powershell
# Both DCs must be registered as name servers for the zone
Get-DnsServerResourceRecord -ZoneName 'vertexpeak.fyp.lab' -RRType Ns | Select-Object HostName, RecordData
Resolve-DnsName vertexpeak.fyp.lab -Type SOA -Server 10.10.30.12
Resolve-DnsName _ldap._tcp.dc._msdcs.vertexpeak.fyp.lab -Type SRV -Server 10.10.30.12
# Expected: both DCs listed as SRV targets with priority 0, weight 100, port 389
dnscmd /zoneexport vertexpeak.fyp.lab C:\FYP\config\dc01_zone_vertexpeak.fyp.lab.txt
```

匯出的區域檔案會放入 `C:\FYP\config\`，然後放入 Git 儲存庫，因為在變更*之前*與*之後*各取一次區域匯出，是最廉價的佐證，證明某項 DNS 變更確實產生了預期效果 —— 且別無其他效果。

#### 7.3.4 OU、群組與服務帳戶建立

[FIGURE: Active Directory Users and Computers 的螢幕擷取，在單一擷取畫面中完整展開 §7.3.4 的整個 `OU=VertexPeak` 樹狀結構 —— 此為基準成功準則 3 及報告可追溯性矩陣的佐證]

##### OU 樹狀結構

該樹狀結構由單一圍籬指令碼建立，使其可重現且可進行差異比對。它儲存為 `C:\FYP\03-build\windows\New-VertexPeakOU.ps1`，其日誌即為佐證。
```powershell
# New-VertexPeakOU.ps1 — creates the exact OU tree of baseline §9.2
$root = 'DC=vertexpeak,DC=fyp,DC=lab'

$ous = @(
    'OU=VertexPeak'
    'OU=Users,OU=VertexPeak'
    'OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=SalesOps,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=Finance,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=HumanResources,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=IT,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=Support,OU=HQ-ShaTin,OU=Users,OU=VertexPeak'
    'OU=BR-KwunTong,OU=Users,OU=VertexPeak'
    'OU=WC-WanChai,OU=Users,OU=VertexPeak'
    'OU=MO-Macau,OU=Users,OU=VertexPeak'
    'OU=RemoteAndContractors,OU=Users,OU=VertexPeak'
    'OU=Computers,OU=VertexPeak'
    'OU=Servers,OU=Computers,OU=VertexPeak'
    'OU=MemberServers,OU=Servers,OU=Computers,OU=VertexPeak'
    'OU=Tier0-DomainControllers,OU=Servers,OU=Computers,OU=VertexPeak'
    'OU=DMZ-Servers,OU=Servers,OU=Computers,OU=VertexPeak'
    'OU=Workstations,OU=Computers,OU=VertexPeak'
    'OU=HQ,OU=Workstations,OU=Computers,OU=VertexPeak'
    'OU=Branches,OU=Workstations,OU=Computers,OU=VertexPeak'
    'OU=LinuxServers,OU=Computers,OU=VertexPeak'
    'OU=Groups,OU=VertexPeak'
    'OU=Global,OU=Groups,OU=VertexPeak'
    'OU=DomainLocal,OU=Groups,OU=VertexPeak'
    'OU=RoleBased,OU=Groups,OU=VertexPeak'
    'OU=ServiceAccounts,OU=VertexPeak'
    'OU=Admins,OU=VertexPeak'
    'OU=Tier0,OU=Admins,OU=VertexPeak'
    'OU=Tier1,OU=Admins,OU=VertexPeak'
    'OU=BreakGlass,OU=Admins,OU=VertexPeak'
    'OU=Network,OU=VertexPeak'
    'OU=PacketTracerDevices,OU=Network,OU=VertexPeak'
    'OU=PrinterAndVoIP,OU=Network,OU=VertexPeak'
    'OU=Quarantine,OU=VertexPeak'
    'OU=Disabled,OU=Quarantine,OU=VertexPeak'
    'OU=NewObjects,OU=Quarantine,OU=VertexPeak'
)

foreach ($ou in $ous) {
    $name = ($ou -split ',')[0] -replace '^OU=',''
    $path = if ($ou -match ',') { ($ou -split ',',2)[1] } else { $root }
    $full = "$ou,$root"
    if (-not (Get-ADOrganizationalUnit -LDAPFilter "(distinguishedName=$full)" -ErrorAction SilentlyContinue)) {
        New-ADOrganizationalUnit -Name $name -Path "$path,$root" -ProtectedFromAccidentalDeletion $true
        Write-Output "CREATED  $full"
    } else {
        Write-Output "EXISTS   $full"
    }
}
```

該指令碼有兩項紀律要點。第一，它**具冪等性**：建立前先檢查，因此第二次執行只會產生 `EXISTS` 行。基準 §1.4 要求本專案每個指令碼均須可重複執行且輸出保持不變，而第二次執行的記錄即為佐證。第二，每個 OU 均設定 `-ProtectedFromAccidentalDeletion $true`。就 §12.1 的災難復原演練而言，AD 資源回收筒在樹系層級啟用一次，使已刪除的 OU 可被還原：
```powershell
Enable-ADOptionalFeature -Identity 'Recycle Bin Feature' `
    -Scope ForestOrConfigurationSet -Target 'vertexpeak.fyp.lab'
```

```text
[OU BUILD — first run, excerpt]
CREATED  OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
CREATED  OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
CREATED  OU=HQ-ShaTin,OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
CREATED  OU=Engineering,OU=HQ-ShaTin,OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
...
CREATED  OU=NewObjects,OU=Quarantine,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab

[OU BUILD — second run]
EXISTS   OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
EXISTS   OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab
... (all 37 lines read EXISTS; zero CREATE lines)
```

##### 群組建立
```powershell
$G = 'OU=Global,OU=Groups,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'
$D = 'OU=DomainLocal,OU=Groups,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'

$globalGroups = @(
    'GG-Server-Admins','GG-Tier0-Admins','GG-Workstation-Admins','GG-Helpdesk',
    'GG-Finance-RW','GG-Finance-RO','GG-Engineering-RW','GG-Sales-RO',
    'GG-VPN-Users','GG-VPN-ProfServices','GG-Infra-Admins','GG-WINRM-Admins',
    'GG-Backup-Operators','GG-DevOps-Users'
)
$domainLocalGroups = @(
    'GG-DMZ-LDAP-Readers','GG-Monitoring-Readers','GG-AI-ReadOnly',
    'DL-Finance-RW','DL-Finance-RO','DL-Engineering-RW','DL-SalesRO-RO','DL-Public-RO'
)

foreach ($g in $globalGroups) {
    New-ADGroup -Name $g -SamAccountName $g -GroupCategory Security -GroupScope Global `
        -Path $G -Description "Vertex Peak L1 — global security group (baseline §8.4)"
}
foreach ($g in $domainLocalGroups) {
    New-ADGroup -Name $g -SamAccountName $g -GroupCategory Security -GroupScope DomainLocal `
        -Path $D -Description "Vertex Peak L1 — domain local resource group (baseline §8.4)"
}
```

此處出現兩項新增，是基準 §8.4 的敘述所隱含、但未列為獨立一列的內容：`GG-WINRM-Admins`、`GG-Backup-Operators` 及 `GG-DevOps-Users` 被指名為 `svc_ansible`、`svc_backup` 及 `svc_git` 的*成員資格*，因此它們必須以物件形式存在。將它們建立於 `OU=Global` 可保持 AGDLP 形態完整。此擴充必須在決策記錄中記為實作細節，而非呈現為基準的發明。

**命名慣例說明。** `GG-` 與 `DL-` 前綴並非裝飾：

- `GG-` 標示一個**通用的、面向人員的**群組。讀取群組名稱即可告知管理員，是否可安全地直接將使用者帳戶加入其中，而 `GG-` 群組是唯一應出現在使用者 `MemberOf` 中的群組類別。
- `DL-` 標示一個**網域本機、面向資源的**群組。`DL-{Share}-{RW|RO}` **與 FSRM 共用一一對應**，這正是共用名稱嵌入群組名稱的原因：`DL-Finance-RW` 就是*那個*授予 Finance 共用寫入權的群組，因此 ACL 稽核只需比對名稱，而非進行調查。
- 實際上為網域本機的四個 `GG-*` 群組（`GG-DMZ-LDAP-Readers`、`GG-Monitoring-Readers`、`GG-AI-ReadOnly`）保留 `GG-` 前綴，因為基準 §8.4 固定了該等確切名稱。這是命名慣例中已接受的不一致，報告必須承認此事，而非假裝該前綴是可靠的類型指標。**[假設]** 群組名稱以所載者為準；因此該前綴具提示性，而非權威性。

**成員資格指派**隨後依循 §7.2.6 的表，其中有一項成員資格刻意顯得彆扭：
```powershell
# Helpdesk: password reset and unlock only — no group write rights anywhere
Add-ADGroupMember -Identity 'GG-Helpdesk' -Members 'adm-01','adm-03'
# (replace with the real adm-{initials} account names of the two Tier-1 students)

# Tier 0: exactly two of the four named administrators
Add-ADGroupMember -Identity 'GG-Tier0-Admins' -Members 'adm-01','adm-02'
Add-ADGroupMember -Identity 'GG-Server-Admins' -Members 'adm-01','adm-02','adm-03','adm-04'

# VPN authorisation groups
Add-ADGroupMember -Identity 'GG-VPN-Users' -Members 'adm-03','adm-04'
Add-ADGroupMember -Identity 'GG-VPN-ProfServices' -Members 'adm-03'

# Service-account memberships (one hop, no nesting, per §7.2.5)
Add-ADGroupMember -Identity 'GG-WINRM-Admins'        -Members 'svc_ansible'
Add-ADGroupMember -Identity 'GG-Backup-Operators'    -Members 'svc_backup'
Add-ADGroupMember -Identity 'GG-Monitoring-Readers'  -Members 'svc_monitoring'
Add-ADGroupMember -Identity 'GG-AI-ReadOnly'         -Members 'svc_aiagent'
Add-ADGroupMember -Identity 'GG-DMZ-LDAP-Readers'    -Members 'svc_ldapbind'
Add-ADGroupMember -Identity 'GG-DevOps-Users'        -Members 'svc_git'
```

##### 服務帳戶建立
```powershell
$SVC = 'OU=ServiceAccounts,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'

# Generate a 32-character random secret per account; record in the password manager, never in Git
function New-SvcSecret {
    $chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_=+'
    -join (1..32 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
}

$svcAccounts = @(
    @{ Sam='svc_ansible';    Desc='Ansible → Windows over WinRM (5986)' }
    @{ Sam='svc_backup';     Desc='Backup jobs and backup share access' }
    @{ Sam='svc_monitoring'; Desc='Prometheus / windows_exporter read; SNMPv3 user' }
    @{ Sam='svc_aiagent';    Desc='AI agent read-only credential (GG-AI-ReadOnly)' }
    @{ Sam='svc_ldapbind';   Desc='LDAP bind for the WordPress auth plug-in' }
    @{ Sam='svc_git';        Desc='Git/Gitea SSH access from vpnz-mon01' }
)

foreach ($s in $svcAccounts) {
    $pw = ConvertTo-SecureString (New-SvcSecret) -AsPlainText -Force
    New-ADUser -Name $s.Sam -SamAccountName $s.Sam -UserPrincipalName "$($s.Sam)@vertexpeak.fyp.lab" `
        -Path $SVC -Description $s.Desc `
        -AccountPassword $pw `
        -Enabled $true `
        -PasswordNeverExpires $false `
        -CannotChangePassword $true `
        -ChangePasswordAtLogon $false `
        -SmartcardLogonRequired $true `
        -KerberosEncryptionType AES128,AES256
    Write-Output "CREATE $($s.Sam) — record the secret in the password manager NOW"
}
```

**該區塊中每一個屬性均是基準要求，而非偏好。** `-PasswordNeverExpires $false` 與 `-CannotChangePassword $true` 合起來精確實作基準 §8.4 的規則。`-SmartcardLogonRequired $true` 是使帳戶*對互動式登入不利*的廉價做法：一個沒有互動式登入權的服務帳戶無法用於坐在主控台前，這移除了學生實驗室中最常見的意外權限提升途徑。`-KerberosEncryptionType AES128,AES256` 從交涉中移除 RC4 與 DES，這很重要，因為 `svc_*` 帳戶持有 Kerberos 服務票證。作為額外控制，這些帳戶在 `GPO-SRV-Member-Server-Baseline` 中由「使用者權限指派」拒絕互動式及 RDP 登入權（§7.3.6，G-5）。

**服務帳戶模型的驗證：**
```powershell
Get-ADUser -Filter 'sAMAccountName -like "svc_*"' -SearchBase $SVC -Properties PasswordNeverExpires, CannotChangePassword, MemberOf |
    Select-Object SamAccountName, Enabled, PasswordNeverExpires, CannotChangePassword, @{n='Groups';e={($_.MemberOf -join ';')}} |
    Format-Table -AutoSize
```

```text
SamAccountName   Enabled PasswordNeverExpires CannotChangePassword Groups
--------------   ------- -------------------- -------------------- ------
svc_aiagent         True                False                 True CN=GG-AI-ReadOnly,OU=DomainLocal,...
svc_ansible         True                False                 True CN=GG-WINRM-Admins,OU=Global,...
svc_backup          True                False                 True CN=GG-Backup-Operators,OU=Global,...
svc_git             True                False                 True CN=GG-DevOps-Users,OU=Global,...
svc_ldapbind        True                False                 True CN=GG-DMZ-LDAP-Readers,OU=DomainLocal,...
svc_monitoring      True                False                 True CN=GG-Monitoring-Readers,OU=DomainLocal,...
```

每個帳戶**恰好有一個**群組成員資格，即為正確結果。擁有兩個或以上項目的帳戶是一項發現，必須在決策記錄中提出理由，或予以修正。

#### 7.3.5 站台、子網路與複寫
```powershell
# ---- Create the four sites (HQ-ShaTin already exists from the promotion; it was renamed in §7.3.2)
foreach ($site in 'BR-KwunTong','WC-WanChai','MO-Macau') {
    if (-not (Get-ADReplicationSite -Filter "Name -eq '$site'")) {
        New-ADReplicationSite -Name $site
    }
}

# ---- Site links: HQ <-> BR at 15 minutes (baseline §9.1)
New-ADReplicationSiteLink -Name 'LINK-HQ-BR' `
    -SitesIncluded 'HQ-ShaTin','BR-KwunTong' `
    -Cost 100 -ReplicationFrequencyInMinutes 15 -InterSiteTransportProtocol IP
New-ADReplicationSiteLink -Name 'LINK-HQ-WC' `
    -SitesIncluded 'HQ-ShaTin','WC-WanChai' `
    -Cost 100 -ReplicationFrequencyInMinutes 15 -InterSiteTransportProtocol IP
New-ADReplicationSiteLink -Name 'LINK-HQ-MO' `
    -SitesIncluded 'HQ-ShaTin','MO-Macau' `
    -Cost 100 -ReplicationFrequencyInMinutes 15 -InterSiteTransportProtocol IP
```

**為何使用明確的站台連結而非預設的 `DEFAULTIPSITELINK`。** 預設連結的複寫間隔是 AD 預設值 180 分鐘。在一個 RODC 的全部意義就是讓分支登入能在總部中斷時存續的實驗室中，三小時的身分識別延遲會使每一項分支測試都得不出結論。選擇 15 分鐘，是因為它短到足以在單一實務工作階段內觀察到，且因為基準如此固定。成本 100 是一個佔位值，在站台之間僅有一條路徑時並無效果；之所以明確設定，是為了讓未來新增第二條連結時有可比較的更低成本基準。
```powershell
# ---- Subnet objects: every subnet of baseline §5.2, each mapped to exactly one site
$subnetMap = @{
    'HQ-ShaTin'   = @('10.10.10.0/24','10.20.20.0/24','10.10.30.0/24','10.10.40.0/23','10.10.45.0/24',
                      '10.10.50.0/28','10.10.60.0/24','10.70.0.0/24','10.10.80.0/24','10.10.90.0/24',
                      '10.10.100.0/30','10.10.100.4/30','10.10.100.32/30','10.10.100.36/30','10.10.100.40/30',
                      '10.255.0.0/24','192.0.2.0/24','198.51.100.0/29','203.0.113.0/29',
                      '10.10.200.0/24','10.10.200.64/26','10.10.201.0/24','10.10.202.0/24')
    'BR-KwunTong' = @('10.10.110.0/24','10.10.111.0/24','10.10.112.0/24','10.10.113.0/24')
    'MO-Macau'    = @('10.10.120.0/24','10.10.121.0/24')
    'WC-WanChai'  = @('10.10.130.0/24','10.10.131.0/24')
}

foreach ($site in $subnetMap.Keys) {
    foreach ($cidr in $subnetMap[$site]) {
        $parts = $cidr -split '/'
        if (-not (Get-ADReplicationSubnet -Filter "Name -eq '$cidr'" -ErrorAction SilentlyContinue)) {
            New-ADReplicationSubnet -Name $cidr -Site $site
        } else {
            Set-ADReplicationSubnet -Identity $cidr -Site $site
        }
    }
}
```

**[假設] 與誠實的限制。** Windows PowerShell 中的 `New-ADReplicationSubnet` 使用 IP 與遮罩解析器驗證合併的 `address/prefix` 字串。WireGuard、OpenVPN 及 IKEv2 位址池範圍之所以列於上表，是因為它們描述那些用戶端將從何處出現，但 `10.10.200.0/24` 內的 `/26` 是比 `/24` *更明確*的相符，且 AD 站台解析遵循最長相符。若所鎖定的 `New-ADReplicationSubnet` 形式拒絕其中任何一項，替代做法是以 `ADSI Edit` 針對 `CN=Subnets,CN=Sites,CN=Configuration,...` 建立它們，或以 `ldifde` 建立，並在建置日誌中記錄實際使用何種方法。切勿靜默略過任何子網路：基準的規則是 §5.2 中不得有任何子網路未被對應。
```powershell
# ---- Verification: no unmapped subnets, and site-link interval as configured
Get-ADReplicationSubnet -Filter * -Properties Site |
    Select-Object Name, @{n='Site';e={$_.Site}} | Sort-Object Name | Format-Table -AutoSize

# Any subnet with a blank Site is a defect
Get-ADReplicationSubnet -Filter * | Where-Object { -not $_.Site } | Select-Object Name

Get-ADReplicationSiteLink -Filter * | Select-Object Name, ReplicationFrequencyInMinutes, Cost, SitesIncluded

# ---- Replication health
repadmin /showrepl
repadmin /replsummary
repadmin /bridgeheads /verbose
dcdiag /v
dcdiag /test:replications /test:advertising /test:fsmocheck /test:netlogons /test:services /test:sysvolcheck
```

```text
[repadmin /showrepl — vpnz-dc02, excerpt]
DC=vertexpeak,DC=fyp,DC=lab
Default-First-Site-Name\VPNZ-DC02
DSA Options: IS_GC
Site Options: (none)
DSA object GUID: 8f2c...
DSA invocationID: 41be...

==== INBOUND NEIGHBORS ====

DC=vertexpeak,DC=fyp,DC=lab
    HQ-ShaTin\VPNZ-DC01 via RPC
        DSA object GUID: 6a04...
        Last attempt @ 2026-10-06 14:22:11 was successful.
        2 consecutive failure(s).                  <-- must reach 0
        Last success @ 2026-10-06 14:22:11.

[dcdiag /v — vpnz-dc01, excerpt]
   Testing server: HQ-ShaTin\VPNZ-DC01
      Starting test: Advertising
         ......................... VPNZ-DC01 passed test Advertising
      Starting test: FrsEvent
         ......................... VPNZ-DC01 passed test FrsEvent
      Starting test: DFSREvent
         ......................... VPNZ-DC01 passed test DFSREvent
      Starting test: SysVolCheck
         ......................... VPNZ-DC01 passed test SysVolCheck
      Starting test: KccEvent
         ......................... VPNZ-DC01 passed test KccEvent
      Starting test: NetLogons
         ......................... VPNZ-DC01 passed test NetLogons
      Starting test: Services
         ......................... VPNZ-DC01 passed test Services
      Starting test: FSMOCheck
         ......................... VPNZ-DC01 passed test FSMOCheck
```

上文的 `2 consecutive failure(s)` 一行是刻意顯示的：一部全新的 DC 常會回報兩次失敗，來自 DNS 登錄與首次成功複寫之間的窗口。**非零的失敗次數是診斷提示，並不自動代表故障** —— 正確做法是記下時間戳、等待一個複寫間隔、再次執行 `repadmin /showrepl`，只有在那之後若次數仍持續才視為缺陷。§7.12 的疑難排解登記冊使用的正是這項區分。
```powershell
# Force an inbound replication of every partition on every DC, then re-check
repadmin /syncall /AdeP
# /A = all partitions, /d = distinguished-name style output, /e = enterprise (all DCs), /P = push
```

#### 7.3.6 群組原則（Group Policy）

基準固定了十一個 GPO 名稱。本小節實作其中六個具安全性權重者，加上 §7.4 所依賴的憑證散佈 GPO。每一項均陳述確切設定及理由。所有 GPO 均建立於 `CN=Policies,CN=System,DC=vertexpeak,DC=fyp,DC=lab`，並以 `Backup-Gpo` 備份至儲存庫，使*原則*本身 —— 而非僅其效果 —— 成為佐證。

每個 GPO 均從 `vpnz-jump01`（10.20.20.31）建立及連結，因為那是管理進入點，而每一項 GPO 變更均由自動化路線的 `Export-GPOBackup.ps1` 指令碼匯出為 XML。
| ID | GPO 名稱（基準） | 連結至 | 用途 |
|---|---|---|---|
| G-1 | `GPO-WS-Baseline-Security` | `OU=Computers/OU=Workstations` | 密碼／鎖定基準、螢幕鎖定逾時、關閉 LLMNR、SMB 簽署、USB 大量儲存裝置唯讀 |
| G-2 | `GPO-Audit-Advanced` | 網域根 | AI 分流及疑難排解章節所依賴的進階稽核子類別集合 |
| G-3 | `GPO-SRV-Tier0-Baseline` | `OU=Servers/OU=Tier0-DomainControllers` | DC 強化、互動式登入僅限 `GG-Tier0-Admins`、SYSVOL 稽核 |
| G-4 | `GPO-SRV-Member-Server-Baseline` | `OU=Servers/OU=MemberServers` | Windows 防火牆設定檔強化、受限群組、服務強化、WinRM、RDP 限制 |
| G-5 | `GPO-SRV-DMZ-Baseline` | `OU=Servers/OU=DMZ-Servers` | 禁止網域管理員登入、限制登入權、獨立本機帳戶 |
| G-6 | `GPO-WS-Windows-LAPS` | `OU=Computers` | 本機系統管理員密碼輪換 |
| G-0 | `GPO-WS-Deploy-CA-Root` | 網域根 | 散佈內部 CA 鏈（§7.4 及 §7.9 的 Linux 信任關係所需） |

全部均以同一個輔助函式建立：
```powershell
function New-VpGpo {
    param([string]$Name, [string]$Target, [string]$Comment)
    if (-not (Get-GPO -Name $Name -ErrorAction SilentlyContinue)) {
        New-GPO -Name $Name -Comment $Comment
    }
    New-GPLink -Name $Name -Target $Target -Enforced:$false
    Set-GPRegistryValue -Name $Name -Key 'HKLM\SOFTWARE\VertexPeak' -ValueName 'GpoId' -Type String -Value $Comment
}
```

##### G-1 `GPO-WS-Baseline-Security` —— 工作站與密碼基準
```powershell
$G = 'GPO-WS-Baseline-Security'

# --- Password and lockout policy (baseline §7.2.8) ---
Set-GPRegistryValue -Name $G -Key 'HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System' `
    -ValueName 'MaxDevicePasswordFailedAttempts' -Type DWord -Value 5      # lockout threshold
Set-GPRegistryValue -Name $G -Key 'HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System' `
    -ValueName 'InactivityTimeoutSecs' -Type DWord -Value 600              # screen lock 10 min

# Account policy values that live in the Security template, applied via secedit on the GPO
$inf = @'
[Unicode]
Unicode=yes
[System Access]
MinimumPasswordLength = 14
PasswordHistorySize = 24
MaximumPasswordAge = 60
MinimumPasswordAge = 1
PasswordComplexity = 1
ClearTextPassword = 0
LockoutBadCount = 5
ResetLockoutCount = 15
LockoutDuration = 15
AllowAdministratorLockout = 1
EnableAdminAccount = 0
'@
$inf | Out-File 'C:\FYP\config\GPO-WS-Baseline-Security.inf' -Encoding unicode
# Imported into the GPO's Security Settings via GPMC (Computer Configuration > Policies >
# Windows Settings > Security Settings > Account Policies), then exported for the repository.

# --- Screen lock: machine inactivity limit plus interactive logon banner ---
Set-GPRegistryValue -Name $G -Key 'HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' `
    -ValueName 'LegalNoticeCaption' -Type String -Value 'Vertex Peak — authorised use only'

# --- SMB hardening: signing required, SMBv1 removed from the client ---
Set-GPRegistryValue -Name $G -Key 'HKLM\SYSTEM\CurrentControlSet\Services\LanmanWorkstation\Parameters' `
    -ValueName 'RequireSecuritySignature' -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key 'HKLM\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters' `
    -ValueName 'RequireSecuritySignature' -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key 'HKLM\SYSTEM\CurrentControlSet\Services\LanmanWorkstation\Parameters' `
    -ValueName 'EnableSecuritySignature' -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key 'HKLM\SYSTEM\CurrentControlSet\Services\mrxsmb10' `
    -ValueName 'Start' -Type DWord -Value 4      # SMBv1 driver disabled

# --- LLMNR off (removes a well-known credential-relay vector) ---
Set-GPRegistryValue -Name $G -Key 'HKLM\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient' `
    -ValueName 'EnableMulticast' -Type DWord -Value 0

# --- USB mass storage read-only: deny write access, leave read in place for lab media ---
Set-GPRegistryValue -Name $G -Key 'HKLM\SYSTEM\CurrentControlSet\Policies' `
    -ValueName 'WriteProtect' -Type DWord -Value 1
```

| 設定 | 值 | 理由 |
|---|---|---|
| `MinimumPasswordLength` | 14 | 見 §7.2.8 |
| `LockoutBadCount` / `LockoutDuration` | 5 / 15 分鐘 | 使 §7.9 的暴力破解偵測及 AI 分流情境可被展示 |
| `AllowAdministratorLockout` | 1 | 移除最後一個無法鎖定的暴力破解目標 |
| `InactivityTimeoutSecs` | 600 | 共用辦公室中無人看管的工作站，是本情境中機率最高的資料曝險路徑。10 分鐘是基準所固定的值 |
| `RequireSecuritySignature`（雙向） | 1 | 阻止 `Z-USER` 工作站環境與 `vpnz-fs01` 之間的 SMB 轉送與竄改。這是信任 §7.5 中 FSRM 配額佐證的前提條件 |
| LLMNR `EnableMulticast` | 0 | LLMNR 是憑證轉送工具所使用的主要名稱解析路徑。關閉它毫無代價，因為本設計中 DNS 具權威性 |
| `WriteProtect` | 1 | USB 大量儲存裝置是金融科技辦公室資料外洩的途徑之一；唯讀仍允許小組使用實驗室媒體傳輸佐證 |

##### G-2 `GPO-Audit-Advanced` —— 疑難排解章節所依賴的稽核原則
```powershell
$G = 'GPO-Audit-Advanced'
# Configured through Computer Configuration > Windows Settings > Security Settings > Advanced Audit
# Policy Configuration > Audit Policies. The equivalent command-line check after application is:
auditpol /get /category:*
```

子類別集合，以及為何每一項事件均有其必要：
| 子類別 | 設定 | 產生的事件 | 本專案為何需要 |
|---|---|---|---|
| Logon/Logoff → Logon | 成功與失敗 | 4624、4625 | 4624／4625 是 AI 分流介面所讀取的七個事件 ID 中的兩個。4625 正是 AI 路線中暴力破解情境所消費的事件 |
| Logon/Logoff → Logoff | 成功 | 4634 | 與 4624 相互關聯以得出工作階段時長 |
| Account Management → User Account Management | 成功與失敗 | 4720、4722、4724、4725、4726、4738 | 4720（已建立）由 AI 分流讀取；整組為「已記錄的最小權限」提供稽核軌跡 |
| Account Management → Security Group Management | 成功與失敗 | 4728、4732、4756 | 4728／4732 由 AI 分流讀取。這是揭示未經授權權限提升的事件 |
| Account Management → Computer Account Management | 成功 | 4741、4742、4743 | 偵測主機被靜默加入網域 |
| Account Logon → Kerberos Authentication Service | 成功與失敗 | 4768、4771、4772 | 4771（預先驗證失敗）是 4625 在 Kerberos 側的對等事件，可捕捉從未到達登入事件的嘗試 |
| DS Access → Directory Service Changes | 成功 | 5136、5137、5139 | Tier-0 物件的物件修改歷程 |
| Detailed Tracking → Process Creation | 成功 | 4688 **並**啟用 *Include command line in process creation events* | 整組中最有用的疑難排解事件：它把「有東西執行了」變成「執行的正是這條指令」。啟用命令列擷取是刻意的取捨 —— 它可能記錄在命令列上傳遞的機密，該風險必須陳明 |
| Policy Change → Audit Policy Change | 成功 | 4719 | 偵測攻擊者（或學生）停用稽核 |
| System → Security System Extension | 成功 | 7045 | 服務安裝。7045 由 AI 分流讀取，是經典的持續性機制 |
| Object Access → File Share | 成功與失敗 | 5140、5145 | 證明哪個帳戶觸及 FSRM 共用上的哪個檔案 —— 即盡職審查清單所要求的「可稽核的檔案存取」 |
| Object Access → Removable Storage | 成功與失敗 | 4656、4663 | 與 G-1 的 USB 寫入保護設定配對：該設定阻止寫入，稽核則記錄嘗試 |
| Logon/Logoff → Account Lockout | 成功 | 4740 | 4740 由 AI 分流讀取，是鎖定原則正在生效的最清晰信號 |

稽核原則從一部網域控制站以 `auditpol /get /category:*` 驗證，並透過在工作站上觸發每一類別各一個事件，然後在事件檢視器中擷取。

##### G-3 `GPO-SRV-Tier0-Baseline` —— 網域控制站強化
```powershell
$G = 'GPO-SRV-Tier0-Baseline'
$T0 = 'OU=Servers,OU=Computers,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'
New-VpGpo -Name $G -Target 'OU=Tier0-DomainControllers,OU=Servers,OU=Computers,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab' -Comment 'Tier-0 DC baseline'

# Restricted groups: only GG-Tier0-Admins becomes a local Administrator on a DC
Set-GPRegistryValue -Name $G -Key 'HKLM\SOFTWARE\VertexPeak' -ValueName 'RestrictedGroups' -Type String `
    -Value 'Administrators = VERTEXPEAK\GG-Tier0-Admins; VERTEXPEAK\Domain Admins (da-vertexpeak only)'

# Interactive logon right restricted to the Tier-0 group
# (Computer Configuration > Windows Settings > Security Settings > Local Policies > User Rights Assignment)
#   Allow log on locally        : VERTEXPEAK\GG-Tier0-Admins
#   Allow log on through RDS    : VERTEXPEAK\GG-Tier0-Admins
#   Deny access to this computer from the network : VERTEXPEAK\GG-Helpdesk

# SYSVOL and NTDS directory auditing
auditpol /set /subcategory:"File System" /success:enable /failure:enable
```

| 設定 | 值 | 理由 |
|---|---|---|
| DC 上的互動式登入權 | 僅 `GG-Tier0-Admins` | 一部任何成員伺服器管理員均可互動式登入的網域控制站，距離完全失陷只差一次權限跳躍。這是 §7.2.7 兩層模型的具體體現 |
| DC 上的 RDP 登入權 | 僅 `GG-Tier0-Admins` | 理由相同，且符合 TB-07 將 RDP 限制於 `Z-MGMT` 的規定 |
| 拒絕 `GG-Helpdesk` 的網絡登入 | 已設定 | 服務台沒有理由對 DC 進行網絡驗證，而明確拒絕它，比日後證明其不存在更為廉價 |
| SYSVOL 上的目錄服務存取稽核 | 已啟用 | 基準 §9.3 要求 SYSVOL 稽核；它同時是 GPO 備份受保護的佐證 |
| LM 雜湊儲存 | 已停用 | 從根本上防止儲存較弱的雜湊；在 Windows Server 2025 上此為預設，但仍明確宣示，使佐證是一項檢查而非一項假設 |
| NTLM 稽核 | 已啟用（全部） | 產生足以證成日後移除 NTLM 的資料，並揭露實驗室中仍依賴它的任何項目 |

##### G-4 `GPO-SRV-Member-Server-Baseline` —— 防火牆與服務強化
```powershell
$G = 'GPO-SRV-Member-Server-Baseline'
New-VpGpo -Name $G -Target 'OU=MemberServers,OU=Servers,OU=Computers,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab' `
    -Comment 'Member server baseline: firewall, restricted groups, service hardening'

# --- Windows Firewall: all three profiles on, inbound default block, outbound default allow with logging
$fw = 'HKLM\SOFTWARE\Policies\Microsoft\WindowsFirewall'
Set-GPRegistryValue -Name $G -Key "$fw\DomainProfile" -ValueName 'EnableFirewall'    -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key "$fw\DomainProfile" -ValueName 'DefaultInboundAction'  -Type DWord -Value 1   # Block
Set-GPRegistryValue -Name $G -Key "$fw\DomainProfile" -ValueName 'DefaultOutboundAction' -Type DWord -Value 0   # Allow
Set-GPRegistryValue -Name $G -Key "$fw\DomainProfile" -ValueName 'LogFilePath'        -Type String -Value '%systemroot%\system32\LogFiles\Firewall\domainfw.log'
Set-GPRegistryValue -Name $G -Key "$fw\DomainProfile" -ValueName 'LogFileSize'        -Type DWord  -Value 32767
Set-GPRegistryValue -Name $G -Key "$fw\PrivateProfile" -ValueName 'EnableFirewall'    -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key "$fw\PublicProfile"  -ValueName 'EnableFirewall'    -Type DWord -Value 1
Set-GPRegistryValue -Name $G -Key "$fw\PublicProfile"  -ValueName 'DefaultInboundAction' -Type DWord -Value 1

# --- Restricted groups: local Administrators = GG-Server-Admins, nothing else
# (Computer Configuration > Policies > Windows Settings > Security Settings > Restricted Groups)
#   Administrators  -> VERTEXPEAK\GG-Server-Admins
#   Remote Desktop Users -> VERTEXPEAK\GG-Server-Admins

# --- Service hardening: disable what this estate does not need
$svc = 'HKLM\SYSTEM\CurrentControlSet\Services'
foreach ($pair in @(
    @{k="$svc\Spooler"; v='Start'; d=4},        # Print Spooler — classic lateral-movement abuse path
    @{k="$svc\RemoteRegistry"; v='Start'; d=4}, # remote registry — not used for management here
    @{k="$svc\WinRM"; v='Start'; d=2}           # WinRM — REQUIRED for Ansible; explicitly enabled
)) {
    Set-GPRegistryValue -Name $G -Key $pair.k -ValueName $pair.v -Type DWord -Value $pair.d
}

# --- WinRM service configuration for the automation line (report §10)
Set-GPRegistryValue -Name $G -Key 'HKLM\SOFTWARE\Policies\Microsoft\Windows\WinRM\Service' `
    -ValueName 'AllowBasic' -Type DWord -Value 0
Set-GPRegistryValue -Name $G -Key 'HKLM\SOFTWARE\Policies\Microsoft\Windows\WinRM\Client' `
    -ValueName 'AllowBasic' -Type DWord -Value 0
```

| 設定 | 值 | 理由 |
|---|---|---|
| 網域／私人／公開 `EnableFirewall` | 1 | 主機防火牆是獨立於 nftables 配對與 ASA 之外的第二層原則。縱深防禦意味著控制被重複，而非被集中 |
| `DefaultInboundAction` | Block | 基準連接埠矩陣（§10）的允許清單紀律，只有在預設為拒絕時才有意義。凡不在該矩陣中的項目，必須*在主機上*以及在邊界上均被捨棄 |
| `LogFileSize` / `LogFilePath` | 32767 KB，明確路徑 | 基準要求每個區域邊界各一張顯示被封鎖封包的螢幕擷取。在 Windows 主機上，該螢幕擷取就是防火牆日誌 |
| 受限的 `Administrators` | 僅 `GG-Server-Admins` | 本機系統管理員在任何 Windows 環境中都是最常被濫用的群組。在原則層級將其綁定至單一具名群組，意味著伺服器無法經由本機變更而被交出 |
| Spooler `Start = 4` | 已停用 | 列印多工緩衝處理器是反覆出現的遠端程式碼執行與權限提升途徑，而本設計中沒有任何項目需要列印 |
| RemoteRegistry `Start = 4` | 已停用 | 本專案中沒有任何管理作業使用它 |
| WinRM `Start = 2` | **已啟用** | 刻意與其他兩項*相反*。整個自動化路線依賴 WinRM（連接埠矩陣 `P-10`），因此在此明確啟用，並明確停用其 Basic 驗證傳輸，強制使用 HTTPS／`5986` 搭配由內部 CA 簽發的憑證 |

**RDP 限制**在同一 GPO 中透過使用者權限指派及防火牆規則集交付：RDP（`P-09`）僅允許從 `Z-MGMT`（10.20.20.0/24）至成員伺服器，符合 TB-07，且依 TB-01 對一般使用者予以拒絕。以管理子網路為範圍的主機防火牆規則，是該陳述的可強制執行形式：
```powershell
# Applied by GPO preference (Computer Configuration > Preferences > Control Panel Settings > Firewall)
# rather than by a one-off netsh call, so that it is policy and not local state.
New-NetFirewallRule -DisplayName 'VP-RDP-Management-Only' -Direction Inbound -Protocol TCP `
    -LocalPort 3389 -RemoteAddress 10.20.20.0/24 -Action Allow -Profile Domain
New-NetFirewallRule -DisplayName 'VP-RDP-Deny-All-Else' -Direction Inbound -Protocol TCP `
    -LocalPort 3389 -Action Block -Profile Domain
```

##### G-5 `GPO-SRV-DMZ-Baseline` —— DMZ 主機基準

DMZ 基準會抑制成員伺服器基準所繼承的權限，並予以取代。
| 設定 | 值 | 理由 |
|---|---|---|
| *Deny log on as a service*（拒絕作為服務登入） | `VERTEXPEAK\Domain Admins` | 一個能在 DMZ 主機上啟動服務的網域管理員憑證，最終必將在該處被竊取 |
| *Deny access to this computer from the network*（拒絕從網絡存取此電腦） | `VERTEXPEAK\GG-Server-Admins`、`VERTEXPEAK\GG-Tier0-Admins` | 這是「DMZ 主機僅從 `vpnz-dmzjump01`（10.10.90.27）管理」此規則的技術形式，依 TB-15 |
| *Deny log on locally*（拒絕本機登入） | `VERTEXPEAK\Domain Admins` | 防止在一部因 DMZ 失陷而暴露的主機上被竊取快取憑證 |
| 本機帳戶 | 獨立的非網域本機系統管理員帳戶，密碼納入 LAPS 範圍 | 使 DMZ 管理獨立於網域，這正是該區域的意義 |
| 迴路／繼承 | 此 OU 封鎖 `GPO-WS-PowerShell-Logging` 與 `GPO-WS-Drive-Maps` | DMZ 主機不得嘗試將磁碟機對應至 `Z-SERVER`；TB-04 在網絡層予以拒絕，而該 GPO 則消除此嘗試 |
| 防火牆 | 三個設定檔全開、輸入封鎖，**僅**允許來自反向代理（10.10.90.10/.11）的 80/443 輸入，以及來自 `Z-MGMT` 的 5986 | DMZ 主機的允許清單比成員伺服器的更為狹窄 |

**此 GPO 所依賴的未決決定。** 基準 §19 待辦事項 **O-05** 詢問 DMZ 主機應加入網域還是以工作群組隔離，需於第 7 週結束前結案。兩種答案均站得住腳，小組必須記錄所採取者：

- **加入網域**（上文所實作）：群組原則生效、LAPS 可用、憑證自動註冊，但一部持有快取網域憑證的失陷 DMZ 主機是真實風險。緩解措施：拒絕網域管理員登入、`Protected Users` 式限制，以及服務帳戶不使用快取憑證回退。
- **工作群組隔離**：完全沒有快取網域憑證，但此 GPO 中每一項設定屆時都必須由本機原則套用，並由 Ansible 以本機帳戶經由 WinRM 更新。憑證註冊則變為手動。

**本節的實作假設為加入網域**，因為它是唯一能讓 GPO 成為 DMZ 強化交付機制的變體，也因為 IIS 節點需要憑證以供 `www.vertexpeak.example` 使用。若小組選擇工作群組隔離，G-5 的強化內容不變，但其交付方式改為由自動化路線部署的 `secedit` 本機原則，且該替換必須記錄。

##### G-6 `GPO-WS-Windows-LAPS` —— 本機系統管理員密碼輪換
```powershell
$G = 'GPO-WS-Windows-LAPS'
New-VpGpo -Name $G -Target 'OU=Computers,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab' -Comment 'Windows LAPS'

# LAPS schema extension must be applied to the forest BEFORE the GPO has anything to write to
Update-LapsADSchema
# Then grant the management group the right to read the password attribute
Set-LapsADReadPasswordPermission -Identity 'OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab' `
    -AllowedPrincipals 'VERTEXPEAK\GG-Server-Admins','VERTEXPEAK\GG-Workstation-Admins'
Set-LapsADComputerSelfPermission -Identity 'OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'
```

| 設定 | 值 | 理由 |
|---|---|---|
| 密碼輪換 | 30 天，最少 20 個字元，複雜性開啟 | 長到不至於頻繁更換，短到令被竊取的密碼有封頂的壽命 |
| 備份至 AD | 已啟用 | 密碼儲存於目錄中，使復原不依賴單一工作站 |
| 驗證後動作 | 重設密碼 | 這是擊敗 pass-the-hash 的控制：已使用過一次的密碼不再有效 |
| 讀取權限 | `GG-Server-Admins`、`GG-Workstation-Admins` | 讀取 LAPS 密碼本身即是一項可稽核的特權動作 |

**為何 LAPS 在此比在一般建置中更為重要。** 除兩部 DC 外的每部 Windows 客體，都是 `W2K25-TEMPLATE-01` 的複製（基準 §6）。若無 LAPS，這些複製在建構上共用一個本機系統管理員密碼，而單一失陷的工作站便會暴露整個成員伺服器環境。LAPS 是針對範本複製策略此一特定產物的特定緩解措施，報告應直白說明此點。

##### G-0 `GPO-WS-Deploy-CA-Root` —— 憑證信任散佈
```powershell
$G = 'GPO-WS-Deploy-CA-Root'
New-VpGpo -Name $G -Target 'DC=vertexpeak,DC=fyp,DC=lab' -Comment 'Distribute VP-ROOT-CA / VP-ISSUING-CA-01'
# The CA certificate is placed in:
#   Computer Configuration > Policies > Windows Settings > Security Settings > Public Key Policies
#   > Trusted Root Certification Authorities  (and > Intermediate Certification Authorities for the issuing CA)
# Verified after gpupdate with:
Get-ChildItem Cert:\LocalMachine\Root | Where-Object Subject -like '*VP-*' | Select-Object Subject, Thumbprint, NotAfter
```

此 GPO 使 §7.4 的內部 PKI 無須手動安裝憑證即獲每部已加入網域的 Windows 主機信任，而它正是 §7.9 所述跨平台信任關係的 Windows 半邊。

##### 套用並證明群組原則
```powershell
# Force application on a target and capture the result set
gpupdate /force
gpresult /h C:\FYP\config\gpresult_$(hostname).html /f

# Prove which GPO won a specific setting (the "Resultant Set of Policy" view)
gpresult /scope:computer /v | Select-String -Pattern 'GPO-WS-Baseline-Security','GPO-SRV-Member-Server-Baseline'

# Export every GPO as evidence (also the automation-line script Export-GPOBackup.ps1)
$backup = "C:\FYP\config\gpo-backup-$(Get-Date -Format yyyy-MM-dd)"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Backup-Gpo -All -Path $backup -Comment "Weekly GPO backup $(Get-Date -Format yyyy-MM-dd)"
Get-ChildItem $backup | Measure-Object | Select-Object Count   # Expected: 11 GPOs
```

```text
[GPO APPLIED — gpresult /scope:computer /v, excerpt on vpnz-fs01]
  Applied Group Policy Objects
  -----------------------------
  GPO-SRV-Member-Server-Baseline
  GPO-Audit-Advanced
  GPO-WS-Deploy-CA-Root
  GPO-WS-Windows-LAPS
  Default Domain Policy

  The following GPOs were not applied because they were filtered out
  -------------------------------------------------------------------
  GPO-SRV-DMZ-Baseline
      Filtering:  Not Applied (Empty)
  GPO-WS-Drive-Maps
      Filtering:  Not Applied (User settings, no user logged on)
```

**負面**結果與正面結果同等重要：`GPO-SRV-DMZ-Baseline` 列為 *Not Applied (Empty)* 證明 DMZ 基準未觸及成員伺服器，而這正是 OU 分割存在的全部理由。一份顯示每個 GPO 在所有地方均套用的 `gpresult`，是 OU 結構未發揮作用的信號。

#### 7.3.7 驗證
| # | 檢查 | 確切指令 | 預期結果 |
|---|---|---|---|
| V-01 | 樹系與網域身分識別 | `Get-ADForest \| Select-Object Name, ForestMode, RootDomain` | `vertexpeak.fyp.lab`、`Win2025Forest`、`vertexpeak.fyp.lab` |
| V-02 | 網域功能等級與 NetBIOS | `Get-ADDomain \| Select-Object Name, NetBIOSName, DomainMode` | `vertexpeak.fyp.lab`、`VERTEXPEAK`、`Win2025Domain` |
| V-03 | FSMO 配置 | `netdom query fsmo` | 全部五個角色位於 `vpnz-dc01.vertexpeak.fyp.lab` |
| V-04 | 兩部 DC 均在運作 | `Get-ADDomainController -Filter * \| Select-Object Name, Site, IsGlobalCatalog, OperatingSystem` | `VPNZ-DC01` 與 `VPNZ-DC02`、站台 `HQ-ShaTin`、`IsGlobalCatalog True` |
| V-05 | 站台依慣例命名 | `Get-ADReplicationSite -Filter *` | `HQ-ShaTin`、`BR-KwunTong`、`WC-WanChai`、`MO-Macau` |
| V-06 | 每個子網路均已對應 | `Get-ADReplicationSubnet -Filter * \| Where-Object { -not $_.Site }` | 無輸出 |
| V-07 | 站台連結間隔 | `Get-ADReplicationSiteLink -Filter "Name -eq 'LINK-HQ-BR'" \| Select-Object ReplicationFrequencyInMinutes` | `15` |
| V-08 | 複寫狀態良好 | `repadmin /replsummary` | 每一列均為 `0 / n` 失敗，所有差值均在 15 分鐘間隔之內 |
| V-09 | DC 自我測試 | `dcdiag /v` | 每一項測試均 `passed`，包括 `Advertising`、`SysVolCheck`、`NetLogons`、`FSMOCheck`、`Services` |
| V-10 | DNS 服務測試 | `dcdiag /test:dns /dnsall /v` | `passed`；兩部 DC 均以 NS 記錄形式存在 |
| V-11 | AD 整合區域，僅安全更新 | `Get-DnsServerZone -Name vertexpeak.fyp.lab \| Select-Object ZoneType, DynamicUpdate, IsDsIntegrated` | `Primary`、`Secure`、`True` |
| V-12 | 兩部 DC 上均有 SRV 記錄 | `Resolve-DnsName _ldap._tcp.dc._msdcs.vertexpeak.fyp.lab -Type SRV -Server 10.10.30.12` | 兩個 SRV 回應，連接埠 389 |
| V-13 | OU 樹完整 | `Get-ADOrganizationalUnit -Filter * -SearchBase 'OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab' \| Measure-Object` | `Count : 37`（36 個子 OU 加上 `OU=VertexPeak` 本身） |
| V-14 | 預設容器中無雜項 | `Get-ADUser -Filter * -SearchBase 'CN=Users,DC=vertexpeak,DC=fyp,DC=lab'` | 僅內建帳戶，不含任何以 `OU=` 限定的專案物件 |
| V-15 | 群組存在且範圍／類別正確 | `Get-ADGroup -Filter 'Name -like "GG-*" -or Name -like "DL-*"' \| Select-Object Name, GroupScope, GroupCategory` | 14 個 Global、8 個 DomainLocal，全部為 Security |
| V-16 | 無服務帳戶權限過高 | §7.2.5 的指令碼 | 無資料列 |
| V-17 | 已套用細緻密碼原則 | `Get-ADFineGrainedPasswordPolicy -Filter * \| Select-Object Name, Precedence, MinPasswordLength, MaxPasswordAge` | `FGPP-ServiceAccounts`、優先順序 10、32、365 天 |
| V-18 | Protected Users 已填入 | `Get-ADGroupMember 'Protected Users' \| Select-Object SamAccountName` | 四個 `adm-{initials}` 帳戶 |
| V-19 | 鎖定機制有效 | 五次錯誤密碼，然後 `Get-ADUser adm-03 -Properties LockedOut \| Select-Object LockedOut` | `LockedOut : True` |
| V-20 | 已記錄鎖定事件 | `Get-WinEvent -FilterHashtable @{LogName='Security';Id=4740} -MaxEvents 1` | 一個事件，指名目標帳戶及來源工作站 |
| V-21 | 時間具權威性 | 在 `vpnz-dc01` 上執行 `w32tm /query /status`，在 `vpnz-fs01` 上執行 `w32tm /query /source` | DC01 的來源為所配置的同儕清單；`vpnz-fs01` 的來源為 `vertexpeak.fyp.lab`（即某部 DC，而非 `Local CMOS Clock`） |
| V-22 | 委派已最小化 | `dsacls 'OU=Users,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'` | `GG-Helpdesk` 僅以 `Reset Password` 及 `Change Password` 出現 —— 沒有 `Write Members`，沒有 `Create Child` |
| V-23 | GPO 數量與備份 | `Get-GPO -All \| Measure-Object`，然後 `Backup-Gpo -All -Path ...` | 11 個 GPO；備份目錄含 11 個 GUID 資料夾，每個均含 `bkupInfo.xml` |
| V-24 | DC 強化確實已套用 | 在兩部 DC 上執行 `reg query 'HKLM\SYSTEM\CurrentControlSet\Control\Lsa' /v LimitBlankPasswordUse` | `0x1` |
| V-25 | 成員伺服器上已套用防火牆原則 | `Get-NetFirewallProfile \| Select-Object Name, Enabled, DefaultInboundAction` | 三個設定檔均 `Enabled True`、`DefaultInboundAction Block` |
| V-26 | 防止流氓網域控制站 | `Get-ADDomain \| Select-Object AllowedDNSSuffixes`，加上 `ms-DS-MachineAccountQuota` 值 | 配額由預設 10 降至非管理員 0，使用戶端無法自行加入流氓 DC |

V-01 … V-26 的完整記錄放入 `06-verification/`，並採用基準形式的測試案例識別碼 `TC-L1-01`（AD DS），對應的螢幕擷取放入 `07-evidence/`，命名為 `{date}_{host}_{what}.png`。

---

### 7.4 公開金鑰基礎架構（ADCS）

#### 7.4.1 PKI 的用途

PKI 在本專案中的存在有一項不可妥協的理由，以及三項次要理由。

不可妥協的理由是盡職審查項目 3：*使用憑證式驗證的加密遠端存取（不使用共用密碼）*。§7.8 的 IKEv2 伺服器以機器或使用者憑證驗證*用戶端*，而*伺服器*向用戶端出示憑證；設計中任何地方均不允許預先共用金鑰（基準 §12.1）。因此憑證授權單位是 VPN 的硬性相依項目，而非可有可無的附加項。

次要理由為：為 IIS 節點（`vpnz-dmzweba01/02`）及反向代理重新加密所至的內部 DNS 名稱提供 TLS；WordPress LDAP 繫結所使用的 LDAPS 通道（`P-05`）；以及一個真正的跨平台信任錨，因為同一條 CA 鏈在 Linux 上透過 `/usr/local/share/ca-certificates/vp-root-ca.crt` 與 `update-ca-certificates` 獲得信任（基準 §9.4）。

**WSOS 定位。** `Setup public key infrastructure services` 是領域 4 的要求，而 `Active Directory Certificate Services` 是其兩個具名嵌套範例之一。與 §7.5–§7.8 不同，本小節有直接的標準依據，並應如此呈現。

#### 7.4.2 設計決策：單層或兩層

基準 §8.5 允許兩者，並誠實地指出四名學生與十二週是主導因素，同時固定命名：`VP-ROOT-CA`（離線根）簽發 `VP-ISSUING-CA-01`（線上）。若小組採用單層，`vpnz-dc01` *就是* `VP-ISSUING-CA-01`，不存在 `VP-ROOT-CA`，且**報告必須陳明所採用的模型**。
| 模型 | 優點 | 本專案中的代價 | 建議 |
|---|---|---|---|
| **單層** —— `vpnz-dc01` 即 `VP-ISSUING-CA-01`，無獨立根 | 一部 VM、無離線金鑰儀式、無需發佈根的 CRL，符合 12 週時程 | 簽發 CA 與網域控制站共用主機，因此 DC 失陷即 CA 失陷；每當 CA 運作時根金鑰即在線上 | **以此為基準情形。** 直白陳明該失陷風險，並註明此為實驗室簡化 |
| **兩層** —— `VP-ROOT-CA` 離線（位於可移除媒體或已關機的 VM）簽發在 `vpnz-dc01` 或 `vpnz-pki01`（10.10.30.15）上的 `VP-ISSUING-CA-01` | 根私密金鑰永不上線；符合真實企業實務；CRL／AIA 發佈設計變得有意義 | 需建置兩部主機、一份已記錄的離線儀式、根必須重新上線才能重新簽發簽發 CA，且此舉將與基準 §13.4 R-02 的 `must` 優先事項爭奪時間 | **僅在**單層建置於第 8 週結束前完成並驗證後才採用 |

**兩種情況下的後果。** `vpnz-pki01`（10.10.30.15）僅在兩層決策下才會部署。若採單層，該位址保持未分配，且此事實記錄於決策日誌中，因為否則定址計劃的讀者將合理地追問，為何保留了一個位址卻未使用。

以下建置是為**單層**情形所撰寫，兩層的差異記載於 §7.4.6。

#### 7.4.3 企業根 CA 安裝

該 CA 是**企業** CA，而非獨立 CA，因此可使用憑證範本、自動註冊可透過群組原則運作，且憑證可從憑證主控台要求，無須帶外核准流程。
```powershell
# ---- 7.4.3 STEP 1: install AD CS on vpnz-dc01 ----
Install-WindowsFeature -Name ADCS-Cert-Authority -IncludeManagementTools
Get-WindowsFeature ADCS-Cert-Authority | Select-Object Name, InstallState
# Expected:  ADCS-Cert-Authority   Installed
```

```powershell
# ---- 7.4.3 STEP 2: configure the CA ----
# CA common name is VP-ISSUING-CA-01 exactly (baseline §8.5 / §16 interface contract).
# Under the single-tier decision this host IS the issuing CA.
Install-AdcsCertificationAuthority `
    -CAType EnterpriseRootCa `
    -CryptoProviderName 'RSA#Microsoft Software Key Storage Provider' `
    -KeyLength 4096 `
    -HashAlgorithmName SHA256 `
    -CACommonName 'VP-ISSUING-CA-01' `
    -CADistinguishedNameSuffix 'DC=vertexpeak,DC=fyp,DC=lab' `
    -ValidityPeriod Years `
    -ValidityPeriodUnits 10 `
    -Force
```

| 參數 | 值 | 理由 |
|---|---|---|
| `-CAType` | `EnterpriseRootCa` | 企業整合：範本、自動註冊、以 LDAP 為基礎的發佈。在兩層下，離線根為 `StandaloneRootCa`，而本主機成為 `EnterpriseSubordinateCa` |
| `-CryptoProviderName` | `RSA#Microsoft Software Key Storage Provider` | 使用 KSP 而非舊式 CSP，使金鑰受現代提供者與 CNG 保護。**[假設]** 確切的提供者字串必須以 `certutil -csplist` 在已建置的主機上確認；替代形式為 `-CryptoProviderName "RSA#Microsoft Software Key Storage Provider"` 對比舊式的 `"Microsoft Strong Cryptographic Provider"`，若 KSP 字串被拒絕，則必須使用舊式形式並記錄該偏差 |
| `-KeyLength` | 4096 | 基準 §8.5 規則：簽發 CA 為 10 年。一把 2048 位元、壽命 10 年的授權單位金鑰，比本專案自身的 60 天密碼原則所證成的強度更弱。**[假設]** 對長期簽發 CA 而言 4096 屬合理之理由；替代值為 2048，仍屬可接受且產生速度更快 |
| `-HashAlgorithmName` | SHA256 | 任何新的授權單位均不得使用 SHA-1；此處明確宣示，使佐證顯示該值而非一個預設值 |
| `-CACommonName` | `VP-ISSUING-CA-01` | 介面契約中的確切字串。不是 `VertexPeak-CA`，不是 `VP-CA01` |
| `-CADistinguishedNameSuffix` | `DC=vertexpeak,DC=fyp,DC=lab` | 將 CA 物件正確置於目錄中 |
| `-ValidityPeriod` / `-ValidityPeriodUnits` | `Years` / `10` | 簽發 CA = 10 年。在兩層下，根為 20 年 |
| `-Force` | 存在 | 非互動式 |

```text
[ADCS — Install-AdcsCertificationAuthority, vpnz-dc01]
Message                              Status
-------                              ------
Active Directory Certificate Services Installed
Certification authority configuration Successful

[certutil -getreg CA\CommonName]
  CommonName REG_SZ = VP-ISSUING-CA-01
[certutil -cainfo]
  CA Name:            VP-ISSUING-CA-01
  CA Type:            Enterprise Root CA
  Hash Algorithm:     SHA256
  Key Length:         4096
  NotBefore:          2026-10-06 09:14:02
  NotAfter:           2036-10-06 09:23:41
  CRL Distribution Point(s):
    http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/VP-ISSUING-CA-01.crl
    file://\\vpnz-dc01\CertEnroll\VP-ISSUING-CA-01.crl
  Authority Information Access:
    http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/vpnz-dc01_VP-ISSUING-CA-01.crt
```

#### 7.4.4 CRL 與 AIA 發佈

企業 CA 預設會將其 CRL 與 AIA 發佈至本機路徑，以及一個以 CA 主機 FQDN 為基礎的 HTTP URL。在本實驗室中這可行，因為 `vpnz-dc01.vertexpeak.fyp.lab` 經由 AD 整合區域解析，而無需 IIS 的 `CertEnroll` 虛擬目錄由 CA 自身的 HTTP 端點提供服務。儘管如此，仍有兩項調整是必要的。

第一，CA 的 **CRL 重疊與發佈期間**必須設定妥當，使 CRL 在兩次發佈之間永不到期 —— 過期的 CRL 會使每一次憑證撤銷檢查失敗，其表現為看似隨機的 VPN 驗證失敗（見 §7.12）。
```powershell
certutil -setreg CA\CRLPeriodUnits 1
certutil -setreg CA\CRLPeriod "Weeks"
certutil -setreg CA\CRLDeltaPeriodUnits 1
certutil -setreg CA\CRLDeltaPeriod "Days"
certutil -setreg CA\CRLOverlapUnits 12
certutil -setreg CA\CRLOverlapPeriod "Hours"
certutil -setreg CA\ValidityPeriodUnits 10
Restart-Service CertSvc
```

第二，**CRL 發佈點與 AIA 擴充功能必須包含用戶端實際使用的 DNS 名稱**，而不只是簡短名稱。在基準中，VPN 的內部服務名稱為 `vpn.vertexpeak.fyp.lab`（解析至 nftables VIP 10.10.50.10），而 CA 位於 `vpnz-dc01`。網際網路上的用戶端無法以名稱觸達 `vpnz-dc01`，因此對 `vpnz-rras01` 出示之憑證的 CRL 檢查必須可被滿足。存在兩個誠實的選項，小組必須擇一：

- **選項 A（建議）。** 將預設的 CRL／AIA URL 保留在 `vpnz-dc01.vertexpeak.fyp.lab`，並誠實記錄該 CRL 檢查僅能在實驗室內部驗證，因為 `vpnz-dc01` 並無公開存在。加入差異 CRL 與差異發佈，並記錄真實部署將經由反向代理把 CRL 發佈至 `198.51.100.5`。
- **選項 B。** 新增第二個 CDP URL，指向 `vpnz-mon01` 或反向代理 VIP 上的內部網頁端點，可經由 TB-06 從 `Z-REMOTE` 觸達。此舉更為忠實，但依賴一項實驗室並未公開暴露的已發佈服務。
```powershell
# Inspect the current extensions, then add a controlled additional CDP if Option B is taken
certutil -getreg CA\CRLPublicationURLs
certutil -setreg CA\CRLPublicationURLs "65:%windir%\system32\CertSrv\CertEnroll\%%3%%8%%9.crl\n1:http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/%%3%%8%%9.crl"
certutil -setreg CA\CACertPublicationURLs "1:%windir%\system32\CertSrv\CertEnroll\%%1_%%3%%4.crt\n2:http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/%%1_%%3%%4.crt"
Restart-Service CertSvc

# Publish a fresh CRL and verify it is retrievable
certutil -CRL
certutil -URL "http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/VP-ISSUING-CA-01.crl"
```

#### 7.4.5 憑證範本與自動註冊

企業 CA 隨附一組範本，但只有明確**發佈**的範本才可被要求。本專案所需的範本由基準 §8.5 的憑證主體表所固定。
| 憑證用途 | 要發佈的範本（內建名稱） | 主體 | SAN | 註冊來源 |
|---|---|---|---|---|
| 網域控制站 | `Kerberos Authentication` 與 `Domain Controller` | `CN=vpnz-dc01.vertexpeak.fyp.lab` / `vpnz-dc02` | DNS `vpnz-dc01.vertexpeak.fyp.lab`、`vpnz-dc01`、`vertexpeak.fyp.lab`、DC IP | 兩部 DC |
| DC 上的 LDAPS | `Kerberos Authentication`（包含伺服器驗證 EKU） | 同網域控制站範本 | 同上 | 兩部 DC |
| **RAS／IKEv2 伺服器** | `RAS and IAS Server` | `CN=vpn.vertexpeak.fyp.lab` | DNS `vpn.vertexpeak.fyp.lab`、`vpnz-rras01.vertexpeak.fyp.lab` | `vpnz-rras01` |
| **電腦（IKEv2 用戶端）** | `Workstation Authentication`（已自訂：397 天有效期、自動註冊） | IKEv2 用戶端範本上的 `CN=vpn.vertexpeak.fyp.lab`，每部機器唯一 | 機器 FQDN | 已加入網域的用戶端 |
| **使用者（遠端存取）** | `User` | 每位使用者唯一 | 使用者 UPN、SMTP | VPN 群組中的網域使用者 |
| 網頁伺服器（IIS） | `Web Server` | `CN=www.vertexpeak.example` | DNS `www.vertexpeak.example`、`www.vertexpeak.fyp.lab` | `vpnz-dmzweba01/02` |
| 反向代理（公開） | `Web Server` | `CN=portal.vertexpeak.example` | DNS `portal.vertexpeak.example`、`portal.vertexpeak.fyp.lab` | nginx 配對（手動產生金鑰，見 §7.9） |
| WordPress（公開） | `Web Server` | `CN=blog.vertexpeak.example` | DNS `blog.vertexpeak.example` | WordPress 配對 |
| WireGuard mTLS／管理 | `Computer` | `CN=vpnz-nft01.vertexpeak.fyp.lab` | DNS `wg.vertexpeak.fyp.lab` | `vpnz-nft01` |
| ASA 身分識別憑證 | `Web Server` 或自訂 IPsec 範本 | `CN=VP-HQ-FW-01.vertexpeak.fyp.lab` | DNS `VP-HQ-FW-01.vertexpeak.fyp.lab` | 手動匯入 ASA |

```powershell
# ---- Publish templates on the CA ----
# Certificate Templates Console equivalents from an elevated prompt on vpnz-dc01:
$templates = 'Kerberos Authentication','Domain Controller','RAS and IAS Server',
             'Workstation Authentication','User','Web Server','Computer'
foreach ($t in $templates) {
    certutil -SetCATemplates +$t
}
certutil -CATemplates
```

```text
[certutil -CATemplates, excerpt]
Kerberos Authentication -- Auto-Enroll: Access is denied.
Domain Controller -- Auto-Enroll: Access is denied.
RAS and IAS Server -- Auto-Enroll: Access is denied.
Workstation Authentication -- Auto-Enroll: Access is denied.
User -- Auto-Enroll: Access is denied.
Web Server -- Auto-Enroll: Access is denied.
Computer -- Auto-Enroll: Access is denied.
```

**在預設企業 CA 上，該輸出是預期的健全狀態，而它是 AD CS 中最常被誤讀的輸出。** 此處的 *Auto-Enroll: Access is denied* 意思是「*尚未*透過範本 ACL 授予任何自動註冊權」—— 並非任何東西損壞。自動註冊在兩處授予：範本自身的安全性 ACL（誰可*註冊*、誰可*自動註冊*）以及群組原則的自動註冊設定。兩者均於下文設定。
```powershell
# ---- Grant enrol/autoenrol rights on the templates (Certificate Templates Console, or certutil ACLs) ----
# Template ACLs are stored in the Configuration partition under
#   CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,...
# The Windows UI path is: certtmpl.msc > right-click template > Properties > Security,
#   then set "Domain Computers" -> Read + Enroll + Autoenroll.
# Scripted equivalent for verification only (the grant itself is done in certtmpl.msc and captured):
certutil -v -template | Select-String -Pattern 'RAS and IAS Server|Workstation Authentication|Web Server|User'
```

```powershell
# ---- Configure autoenrolment by Group Policy on vpnz-jump01 ----
$G = 'GPO-WS-Cert-AutoEnrol'         # baseline §9.3 — must exist
New-VpGpo -Name $G -Target 'DC=vertexpeak,DC=fyp,DC=lab' -Comment 'Certificate autoenrolment'

# Computer Configuration > Policies > Windows Settings > Security Settings > Public Key Policies
#   > Certificate Services Client - Auto-Enrollment
#     Configuration Model        : Enabled
#     Renew expired certificates : Enabled
#     Update certificates that use certificate templates : Enabled
Set-GPRegistryValue -Name $G `
    -Key 'HKLM\SOFTWARE\Policies\Microsoft\Cryptography\AutoEnrollment' `
    -ValueName 'AEPolicy' -Type DWord -Value 7
# 7 = enroll + renew expired + update template. This one value is the whole autoenrolment switch.
```

```powershell
# ---- Trigger autoenrolment on a client and prove it worked ----
gpupdate /force
certutil -pulse
Get-ChildItem Cert:\LocalMachine\My |
    Where-Object { $_.Issuer -like '*VP-ISSUING-CA-01*' } |
    Select-Object Subject, Issuer, Thumbprint, NotBefore, NotAfter,
        @{n='EKU';e={($_.Extensions | Where-Object Oid -like '*2.5.29.37*').Format($false)}}
```

```text
[AUTOENROLMENT — vpnz-rras01, after certutil -pulse]
Certificate Request Processor: The operation completed successfully. 0x0 (WIN32: 0)

Subject      : CN=vpn.vertexpeak.fyp.lab
Issuer       : CN=VP-ISSUING-CA-01, DC=vertexpeak, DC=fyp, DC=lab
Thumbprint   : 9C41D2F7A8B33E6150C0E4A9D17E2B8F4A63D0C1
NotBefore    : 2026-10-06 10:02:17
NotAfter     : 2027-11-07 10:12:17       <-- 397 days per baseline §8.5
EKU          : Server Authentication (1.3.6.1.5.5.7.3.1), Client Authentication (1.3.6.1.5.5.7.3.2)
```

**397 天這個值必須設定於範本上，而非接受預設值。** 基準 §8.5 將內部 TLS 憑證有效期固定為上限 397 天，並以 90 天為佳。內建範本預設為一或兩年，因此需要每個範本各一份自訂複本：在 `certtmpl.msc` 中複製內建範本，將 *Validity period* 設為所需值，視情況將 *Request handling* 與 *Subject name* 索引標籤設為 *Supply in the request* 或 *Build from this Active Directory information*，然後發佈該複本。複本的命名慣例必須記錄 —— 報告應使用 `VP-CLIENT-IKEV2`、`VP-SERVER-RAS`、`VP-WEB-IIS` 及 `VP-USER-RA`，使讀者一眼即可分辨專案範本與 Microsoft 範本。

#### 7.4.6 兩層差異

若採取兩層決策，與上述不同之處為：

1. `VP-ROOT-CA` 建置於**獨立根 CA**，`StandaloneRootCa`，20 年有效期，金鑰長度 4096，並在簽發從屬 CA 後立即離線（VM 關機，或其磁碟卸離並存放）。
2. 根憑證與 CRL 發佈至一個從屬 CA 僅在儀式期間可讀取的位置，隨後根即關機。
3. `vpnz-dc01` 改以 `Install-AdcsCertificationAuthority -CAType EnterpriseSubordinateCa` 搭配一個要求檔；該要求由離線根簽署，產生的憑證以 `certutil -installcert` 安裝。
4. `VP-ROOT-CA` 必須由 `GPO-WS-Deploy-CA-Root` 散佈至每部主機，並同樣加入 Linux 信任存放區（基準 §9.4）。
5. 根的 CRL 必須長效並已發佈，因為在根離線期間無法重新產生它。若任其過期，鏈中每一張憑證的撤銷檢查都會失敗 —— 此失效模式在距建置很久之後才出現，若小組採取此路徑，值得在疑難排解登記冊中單列一行。

#### 7.4.7 驗證
| # | 檢查 | 確切指令 | 預期結果 |
|---|---|---|---|
| PKI-01 | CA 已安裝並啟動 | `Get-Service CertSvc \| Select-Object Status, Name` | `Running`、`CertSvc` |
| PKI-02 | CA 身分識別與類型 | `certutil -cainfo` | `VP-ISSUING-CA-01`、`Enterprise Root CA` |
| PKI-03 | 已發佈的範本 | `certutil -CATemplates` | 列出七個範本 |
| PKI-04 | 每項所需用途各簽發一張憑證 | `certutil -view -restrict "Disposition=20" -out "RequestID,CommonName,NotAfter,Template" csv` | 包含 `vpn.vertexpeak.fyp.lab`（RAS）、`www.vertexpeak.example`（Web），以及至少一張機器與一張使用者憑證 |
| PKI-05 | 自動註冊已到達用戶端 | `certutil -pulse`，然後 `Get-ChildItem Cert:\LocalMachine\My` | 一張由 `VP-ISSUING-CA-01` 簽發的憑證，`NotAfter` 約為 397 天後 |
| PKI-06 | CA 鏈在成員上受信任 | `certutil -verify -urlfetch <thumbprint-of-issued-cert>` | `Certificate is valid`，所有 URL 均已擷取，CRL 已檢查 |
| PKI-07 | CRL 可擷取 | `certutil -URL "http://vpnz-dc01.vertexpeak.fyp.lab/CertEnroll/VP-ISSUING-CA-01.crl"` | `Verify complete`、`CRL is current` |
| PKI-08 | 撤銷確實生效 | `certutil -revoke <serial> 1`，然後在用戶端上執行 `certutil -verify <cert>` | 對已撤銷的憑證，驗證以 `CERT_E_REVOKED` 失敗；`certutil -CRL` 重新發佈 |
| PKI-09 | LDAPS 可用（連接埠矩陣 `P-05`） | `ldp.exe` 連線至 `vpnz-dc01` 的 `636`，或 `Test-NetConnection vpnz-dc01 -Port 636` | `TcpTestSucceeded : True`；LDP 顯示一個經 SSL 繫結的工作階段 |
| PKI-10 | 根／中繼憑證由 GPO 散佈 | `Get-ChildItem Cert:\LocalMachine\Root, Cert:\LocalMachine\CA \| Where-Object Subject -like '*VP-*'` | `VP-ISSUING-CA-01`（兩層下另有 `VP-ROOT-CA`）存在於成員伺服器的正確存放區中 |
| PKI-11 | 無自簽憑證仍在使用 | `Get-ChildItem Cert:\LocalMachine\My \| Where-Object { $_.Issuer -eq $_.Subject }` | 無輸出，或僅有一張已記錄、已被取代的建置階段自簽憑證，且其替代品已記錄 |

PKI-11 是基準要求而非錦上添花：基準 §8.5 規定，在交付的設計中，任何服務均不得使用自簽憑證，唯一例外是已記錄的建置步驟期間使用、且日後被取代者。該檢查即是取代確已發生的佐證。

---

### 7.5 檔案伺服器資源管理員（FSRM）

#### 7.5.1 為何採用 FSRM，以及它在 NTFS 權限之外增添了什麼

**先作誠實說明。** `FSRM` 在 WSOS 2026 文本中出現 **0 次**，在其原始 HTML 中出現 0 次，在 2024 版中亦出現 0 次。FSRM 是一項**依主題表自身措辭而證成的專案選擇**（主題表明確點名它），加上兩項通用領域 4 條目：`Install and manage sharing services`（下含 `SMB`、`DFS`）及 `Manage file systems`（下含 `NTFS`、`ReFS`）。它不得被呈現為標準要求。

**NTFS 權限能做與不能做的事。** NTFS 存取控制項目恰好回答一個問題：*此主體是否可對此物件執行此操作*。它是一項授權控制，且擅長於此。它做不到的事包括以下各項，而每一項在 Vertex Peak 情境中都是真實需求：
| 需求 | 僅 NTFS | FSRM |
|---|---|---|
| 「任何單一部門均不得耗用超過其議定份額的檔案伺服器容量」 | 完全無法表達*大小*規則 | **配額**：硬性或軟性限制，按資料夾或按磁碟區，含閾值與通知 |
| 「可執行檔與媒體檔案不得存放於公司檔案伺服器上」 | 無法表達*檔案類型*規則 | **檔案遮蔽**：主動封鎖（拒絕寫入）或被動遮蔽（僅稽核），按檔案群組，含例外 |
| 「將資料分類，讓我們知道自己在保護什麼」 | 無 | **分類**：附加於檔案／資料夾的屬性，可選配自動分類規則與檔案管理作業 |
| 「告訴我儲存空間實際去了哪裡」 | 無 | **存放裝置報告**：重複檔案、大型檔案、按擁有者的檔案、按類型的檔案、最近最少存取 —— 可隨需或按排程產生 |
| 「定義一次檔案類型，然後在三處重複使用」 | 無 | **檔案群組**：一組具名模式（`Blocked-Audio-Video`、`Blocked-Executables`），由遮蔽、含例外的遮蔽及報告重複使用 |

**情境契合度。** 盡職審查項目 2 要求已記錄的最小權限，以及對客戶資料存取的稽核軌跡。Vertex Peak 是一家接近受 SFC 監管的軟體供應商，其財務部持有合約與薪資資料，而其工程部確實需要搬移大型建置產物。FSRM 正是把「我們告訴過大家不要把音樂收藏放到檔案伺服器上」轉變為作業系統強制執行並記錄的原則。

**必須陳明的一項誠實限制。** FSRM 檔案遮蔽是一項**副檔名與模式**控制，而非內容檢查控制。`Blocked-Executables` 阻止寫入 `payload.exe`；若 `payload.txt.exe` 的模式不在該群組中，它便無法阻止；而它當然也偵測不出允許的 `.zip` 內的惡意承載。遮蔽是一項降低攻擊面與儲存成本的衛生控制；它不是惡意程式控制，且絕不可如此描述。它在本專案中的真正價值在於它*可被展示*：被封鎖的寫入會產生一個具體、可擷取的錯誤。

#### 7.5.2 安裝與初始配置
```powershell
# ---- On vpnz-fs01 (10.10.30.21) ----
Install-WindowsFeature -Name FS-FileServer, FS-Resource-Manager -IncludeManagementTools

Get-WindowsFeature FS-FileServer, FS-Resource-Manager |
    Select-Object Name, DisplayName, InstallState
```

```text
Name                 DisplayName                                        InstallState
----                 -----------                                        ------------
FS-FileServer        File Server                                        Installed
FS-Resource-Manager  File Server Resource Manager                       Installed
```

資料磁碟區，依基準 §8.7：`vpnz-fs01` 有一個 80 GB 系統磁碟區，以及一個以第二顆磁碟形式掛接的 **20 GB 資料 VHDX**。共用即位於該第二顆磁碟上，使配額與遮蔽原則套用於一個用途純粹是檔案資料的磁碟區 —— 也因此，§7.6 中 iSCSI 的儲存成本論證有了明顯的類比對象。
```powershell
# ---- Prepare the data volume ----
Get-Disk | Select-Object Number, FriendlyName, @{n='SizeGB';e={[math]::Round($_.Size/1GB,1)}}, PartitionStyle, OperationalStatus
# Identify the 20 GB data disk (the second disk), then:
$dataDisk = Get-Disk | Where-Object { $_.Size -lt 30GB -and $_.Number -ne 0 }
Initialize-Disk -Number $dataDisk.Number -PartitionStyle GPT
New-Partition -DiskNumber $dataDisk.Number -UseMaximumSize -DriveLetter D |
    Format-Volume -FileSystem NTFS -NewFileSystemLabel 'VP-DATA' -AllocationUnitSize 65536 -Confirm:$false

# ---- Create the four shares exactly as baseline §8.7 fixes them ----
$shares = @(
    @{ Path='D:\Shares\Finance';     Name='Finance';     QuotaGB=20; Screen='exec' }
    @{ Path='D:\Shares\Engineering'; Name='Engineering'; QuotaGB=10; Screen='exec' }
    @{ Path='D:\Shares\SalesRO';     Name='SalesRO';     QuotaGB=10; Screen='exec' }
    @{ Path='D:\Shares\Public';      Name='Public';      QuotaGB=5;  Screen='exec' }
)
foreach ($s in $shares) {
    New-Item -ItemType Directory -Path $s.Path -Force | Out-Null
    if (-not (Get-SmbShare -Name $s.Name -ErrorAction SilentlyContinue)) {
        New-SmbShare -Name $s.Name -Path $s.Path -FullAccess 'VERTEXPEAK\GG-Server-Admins' -ChangeAccess 'Authenticated Users'
    }
}
Get-SmbShare | Where-Object Name -in 'Finance','Engineering','SalesRO','Public' |
    Select-Object Name, Path, ShareState
```

**共用層級與 NTFS 層級權限 —— 真正重要的紀律。** Windows 套用共用與 NTFS 權限的*最嚴格組合*。因此本專案在共用層級套用寬鬆權限，在 NTFS 層級套用精確權限，這是標準做法，也是唯一能讓 ACL 稽核保持可行的安排：

- **共用權限**授予 `Authenticated Users` `Change`，授予 `VERTEXPEAK\GG-Server-Admins` `Full`。此舉刻意寬鬆，因為共用權限無法乾淨地表達群組層級的細緻度，而一項錯誤的共用權限在每一份 ACL 報告中都看不見。
- **NTFS 權限**才是授權真正所在之處，並使用 §7.2.6 的網域本機群組，每個共用各一，一一對應：
```powershell
$acl = @(
    @{ Path='D:\Shares\Finance';     RW='VERTEXPEAK\DL-Finance-RW';     RO='VERTEXPEAK\DL-Finance-RO' }
    @{ Path='D:\Shares\Engineering'; RW='VERTEXPEAK\DL-Engineering-RW'; RO=$null }
    @{ Path='D:\Shares\SalesRO';     RW=$null;                          RO='VERTEXPEAK\DL-SalesRO-RO' }
    @{ Path='D:\Shares\Public';      RW='VERTEXPEAK\DL-Public-RO';      RO=$null }
)
foreach ($a in $acl) {
    $ac = Get-Acl $a.Path
    $ac.SetAccessRuleProtection($true, $false)   # stop inheriting from D:\Shares
    $ac.Access | ForEach-Object { [void]$ac.RemoveAccessRule($_) }
    $ac.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule(
        'VERTEXPEAK\GG-Server-Admins','FullControl','ContainerInherit,ObjectInherit','None','Allow')))
    if ($a.RW) { $ac.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule(
        $a.RW,'Modify','ContainerInherit,ObjectInherit','None','Allow'))) }
    if ($a.RO) { $ac.AddAccessRule((New-Object System.Security.AccessControl.FileSystemAccessRule(
        $a.RO,'ReadAndExecute','ContainerInherit,ObjectInherit','None','Allow'))) }
    Set-Acl -Path $a.Path -AclObject $ac
    Get-Acl $a.Path | Select-Object -ExpandProperty Access |
        Select-Object IdentityReference, FileSystemRights, AccessControlType
}
```

部門共用透過 `GPO-WS-Drive-Maps` 以項目層級目標對應至 `F:`（Finance，`GG-Finance-RW`）、`G:`（Engineering，`GG-Engineering-RW`）及唯讀的 `H:`（Sales），依基準 §12.1。

#### 7.5.3 配額範本與自動配額原則

設計：**每個共用大小各一個配額範本**，並在每個共用資料夾上設**自動配額**，使使用者建立的每個子資料夾自動繼承配額，而無須為每個資料夾新增物件。
```powershell
# ---- 7.5.3 STEP 1: quota templates ----
New-FsrmQuotaTemplate -Name 'TMPL-Quota-Finance-20GB' `
    -Description 'Vertex Peak Finance share: 20 GB hard quota (baseline §8.7)' `
    -Size 20GB `
    -SoftLimit:$false `
    -Threshold (New-FsrmQuotaThreshold -Percentage 85 -Action (
        New-FsrmAction -Type Event -EventType Warning -Body 'Vertex Peak: Finance share at 85% of quota.' -Kilobytes 0))

New-FsrmQuotaTemplate -Name 'TMPL-Quota-Engineering-10GB' `
    -Description 'Vertex Peak Engineering share: 10 GB hard quota' `
    -Size 10GB -SoftLimit:$false

New-FsrmQuotaTemplate -Name 'TMPL-Quota-SalesRO-10GB' `
    -Description 'Vertex Peak Sales (read-only) share: 10 GB hard quota' `
    -Size 10GB -SoftLimit:$false

New-FsrmQuotaTemplate -Name 'TMPL-Quota-Public-5GB' `
    -Description 'Vertex Peak Public share: 5 GB hard quota' `
    -Size 5GB -SoftLimit:$false
```

**為何使用硬性配額而非軟性。** 軟性配額記錄一個事件並放行寫入；硬性配額則予以拒絕。就本專案的佐證要求而言，硬性配額是唯一會產生*可擷取錯誤訊息*的版本 —— 而基準 §1.4 的成功準則正是「Quota exceeded capture」。軟性配額只會產生一筆事件記錄項目，佐證力較弱，對讀者也較不具說服力。此取捨是真實的：硬性配額意味著一名合法使用者觸及 100 % 時會在工作進行中被封鎖，這正是下列閾值存在的原因。
```powershell
# ---- 7.5.3 STEP 2: thresholds at 85%, 95% and 100% (measured against the quota size) ----
foreach ($t in @(
    @{ Name='TMPL-Quota-Finance-20GB';     SizeGB=20 },
    @{ Name='TMPL-Quota-Engineering-10GB'; SizeGB=10 },
    @{ Name='TMPL-Quota-SalesRO-10GB';     SizeGB=10 },
    @{ Name='TMPL-Quota-Public-5GB';       SizeGB=5  }
)) {
    $tmpl = Get-FsrmQuotaTemplate -Name $t.Name
    $tmpl.Threshold = @(
        (New-FsrmQuotaThreshold -Percentage 85  -Action (New-FsrmAction -Type Event -EventType Warning `
            -Body "$($t.Name): 85% of quota reached." -Kilobytes 0))
        (New-FsrmQuotaThreshold -Percentage 95  -Action (New-FsrmAction -Type Event -EventType Warning `
            -Body "$($t.Name): 95% of quota reached — action required." -Kilobytes 0))
        (New-FsrmQuotaThreshold -Percentage 100 -Action (New-FsrmAction -Type Event -EventType Error `
            -Body "$($t.Name): quota exhausted; writes will be denied." -Kilobytes 0))
    )
    Set-FsrmQuotaTemplate -Name $t.Name -Threshold $tmpl.Threshold
}
```

| 閾值 | 百分比 | 理由 |
|---|---|---|
| 早期警告 | 85 % | 在 20 GB 的 Finance 共用上留下 3 GB 可用空間 —— 足以應付正常一週工作 —— 使該警告可付諸行動，而非事後檢討 |
| 需要採取行動 | 95 % | 升級點。在硬性配額上，這是使用者被封鎖之前人員會看到的最後一則通知 |
| 已拒絕 | 100 % | 與 §7.5.6 中使用者可見錯誤配對的事件。將其記錄為 *Error* 事件類型而非警告，意味著它會在事件檢視器及日誌轉送器中格外顯眼 |

**關於 Cmdlet 介面的[假設]。** `New-FsrmQuotaTemplate` 接受 `-Threshold`，而閾值以 `New-FsrmQuotaThreshold -Percentage`（或 `-Size`）建立。這是 Windows Server 2012 R2 至 2025 上的 FSRM PowerShell 模組介面，預期在所鎖定的組建上不變，但在本撰寫環境中**尚未**對 Windows Server 2025 組建 `10.0.26100.1742` 實際執行過。若所鎖定版本不接受 `-Threshold`，替代形式是先建立不含閾值的範本，然後：
```powershell
# Alternative form: set thresholds through the property object
$tmpl = Get-FsrmQuotaTemplate -Name 'TMPL-Quota-Finance-20GB'
$tmpl.Threshold = @( (New-FsrmQuotaThreshold -Percentage 85) )
Set-FsrmQuotaTemplate -Name 'TMPL-Quota-Finance-20GB' -Threshold $tmpl.Threshold
```

在已建置的主機上執行 `Get-Help New-FsrmQuotaTemplate -Full` 及 `Get-Help New-FsrmQuotaThreshold -Full`，將輸出擷取為佐證，若參數有所不同，即在建置手冊中修正本小節。
```powershell
# ---- 7.5.3 STEP 3: auto-quota policies, one per share ----
New-FsrmAutoQuota -Path 'D:\Shares\Finance' `
    -Template 'TMPL-Quota-Finance-20GB' `
    -Disabled:$false

New-FsrmAutoQuota -Path 'D:\Shares\Engineering' `
    -Template 'TMPL-Quota-Engineering-10GB' -Disabled:$false

New-FsrmAutoQuota -Path 'D:\Shares\SalesRO' `
    -Template 'TMPL-Quota-SalesRO-10GB' -Disabled:$false

New-FsrmAutoQuota -Path 'D:\Shares\Public' `
    -Template 'TMPL-Quota-Public-5GB' -Disabled:$false
```

**為何採用自動配額而非每個資料夾一個硬性配額。** `New-FsrmQuota` 在一條路徑上固定一個大小。自動配額則將一個*範本*套用於一條路徑**及其下建立的每一個資料夾**，因此在 `D:\Shares\Engineering\` 下新增的專案資料夾一經建立即受管治，無須任何管理動作。在一個 IT 團隊只有五人的組織中，「原則自動套用」與「原則在有人記得時才套用」之間的差別，就是原則與建議之間的差別。當範本自身路徑已有配額時，自動配額不會對該路徑套用配額，這正是自動配額物件建立在共用根目錄上的原因。

**關於確切語意的[假設]：** FSRM 自動配額會將其範本套用於在自動配額定義*之後*建立的子資料夾；既有的子資料夾通常也會被納入，但此行為必須在已建置的主機上以實證確認 —— 在定義前建立一個資料夾、定義後再建立一個，並觀察 `Get-FsrmAutoQuota` 與 `Get-FsrmQuota`。

配額物件的驗證：
```powershell
Get-FsrmQuotaTemplate | Select-Object Name, Size, SoftLimit, @{n='Thresholds';e={$_.Threshold.Count}}
Get-FsrmAutoQuota    | Select-Object Path, Template, Disabled, @{n='UsageGB';e={[math]::Round($_.Usage/1GB,2)}}
Get-FsrmQuota -Path 'D:\Shares\Finance'
```

```text
[FSRM QUOTAS — vpnz-fs01]
Name                        Size        SoftLimit Thresholds
----                        ----        --------- ----------
TMPL-Quota-Finance-20GB     21474836480     False          3
TMPL-Quota-Engineering-10GB 10737418240     False          3
TMPL-Quota-SalesRO-10GB     10737418240     False          3
TMPL-Quota-Public-5GB        5368709120     False          3

Path                    Template                     Disabled UsageGB
----                    --------                     -------- -------
D:\Shares\Finance       TMPL-Quota-Finance-20GB         False    0.00
D:\Shares\Engineering   TMPL-Quota-Engineering-10GB     False    0.00
D:\Shares\SalesRO       TMPL-Quota-SalesRO-10GB         False    0.00
D:\Shares\Public        TMPL-Quota-Public-5GB           False    0.00
```

#### 7.5.4 檔案遮蔽範本與檔案群組

設計：**兩個封鎖用檔案群組**預設套用於全部四個共用，加上**一個被動（僅稽核）遮蔽**，使小組能展示封鎖與偵測之間的差異，再加上一個**例外群組**，使設計展示合法的業務需求如何被容納，而非僅被拒絕。
```powershell
# ---- 7.5.4 STEP 1: file groups ----
New-FsrmFileGroup -Name 'Blocked-Audio-Video' `
    -Description 'High-risk / high-cost media formats prohibited on corporate shares' `
    -IncludePattern @('*.mp3','*.wma','*.wav','*.aac','*.flac','*.ogg','*.m4a',
                      '*.mp4','*.avi','*.mkv','*.mov','*.wmv','*.flv','*.m4v','*.mpg','*.mpeg')

New-FsrmFileGroup -Name 'Blocked-Executables' `
    -Description 'Executable and script content prohibited on corporate shares' `
    -IncludePattern @('*.exe','*.msi','*.msp','*.bat','*.cmd','*.com','*.scr','*.pif',
                      '*.vbs','*.vbe','*.js','*.jse','*.wsf','*.wsh','*.ps1','*.psm1',
                      '*.jar','*.hta','*.cpl','*.dll','*.sys')

New-FsrmFileGroup -Name 'Allowed-Engineering-Build' `
    -Description 'Engineering exception: signed installer and script artefacts for the build pipeline' `
    -IncludePattern @('*.msi','*.exe','*.ps1','*.dll','*.jar')
```

基準 §8.7 要求部門共用上設有遮蔽字串 `*.exe;*.vbs;*.mp3`。上述兩個群組是該要求的超集，而報告必須明確如此陳明，而非把一份較短清單呈現得像是基準所載者。
```powershell
# ---- 7.5.4 STEP 2: file screen templates ----
New-FsrmFileScreenTemplate -Name 'TMPL-Screen-Default-Block' `
    -Description 'Active screening: block executables and media on all corporate shares' `
    -IncludeGroup @('Blocked-Executables','Blocked-Audio-Video') `
    -Active:$true

New-FsrmFileScreenTemplate -Name 'TMPL-Screen-Passive-Audit' `
    -Description 'Passive screening: report only, no blocking. Used to measure the real occurrence rate.' `
    -IncludeGroup @('Blocked-Executables','Blocked-Audio-Video') `
    -Active:$false
```

| 選擇 | 值 | 理由 |
|---|---|---|
| 預設範本上的 `-Active:$true` | 封鎖 | 要求是原則被*強制執行*。主動遮蔽會產生 §7.5.6 所需的可擷取錯誤 |
| 稽核範本上的 `-Active:$false` | 僅報告 | 一個真正有用的設計步驟：在 `Public` 共用上執行被動遮蔽一週，以衡量原本會被封鎖的項目，並記錄數量。這把一項原則決策變成一個附有數字的發現，而這正是「findings」要求所尋求的內容類型 |
| 使用 `-IncludeGroup` 而非 `-IncludePattern` | 檔案群組 | 模式集合只定義一次，並由遮蔽、遮蔽例外及報告重複使用。如此一來，對 `Blocked-Executables` 的變更便會傳播，而不必在五處分別修改 |

```powershell
# ---- 7.5.4 STEP 3: apply screens ----
New-FsrmFileScreen -Path 'D:\Shares\Finance'     -Template 'TMPL-Screen-Default-Block'
New-FsrmFileScreen -Path 'D:\Shares\Engineering' -Template 'TMPL-Screen-Default-Block'
New-FsrmFileScreen -Path 'D:\Shares\SalesRO'     -Template 'TMPL-Screen-Default-Block'
New-FsrmFileScreen -Path 'D:\Shares\Public'      -Template 'TMPL-Screen-Passive-Audit'
```

```powershell
# ---- 7.5.4 STEP 4: the exception mechanism ----
# Engineering legitimately produces .msi and .ps1 artefacts. Rather than weakening the
# share-wide screen, a file screen EXCEPTION narrows the block to one subfolder.
New-Item -ItemType Directory -Path 'D:\Shares\Engineering\_build-artefacts' -Force | Out-Null
New-FsrmFileScreenException -Path 'D:\Shares\Engineering\_build-artefacts' `
    -IncludeGroup @('Allowed-Engineering-Build') `
    -Description 'Exception: signed build artefacts only. Justified in the decision log; reviewed weekly.'
```

**例外機制如何被設計為安全。** FSRM 檔案遮蔽例外並不*授予*任何東西；它只是把具名模式從該路徑的遮蔽中*移除*。因此刻意套用三項保障：

1. 例外路徑是一個**單一、命名清楚**的子資料夾（`_build-artefacts`），而非整個 Engineering 共用。
2. 例外**狹窄** —— 它只解除 `Allowed-Engineering-Build` 中的模式，因此 `.mp3` 與 `.mp4` 在所有地方（包括例外資料夾內部）仍被封鎖。
3. 例外**已記錄並經審閱**：決策日誌的一則記錄載明由誰提出、原因為何，以及該例外將於何時檢討。未經檢討的例外會變成永久例外，控制就是這樣悄然死亡的。

遮蔽與例外以下列方式驗證：
```powershell
Get-FsrmFileScreenTemplate | Select-Object Name, Active, @{n='Groups';e={$_.IncludeGroup -join ';'}}
Get-FsrmFileScreen         | Select-Object Path, Template, Active
Get-FsrmFileScreenException -Path 'D:\Shares\Engineering\_build-artefacts' |
    Select-Object Path, IncludeGroup
```

```text
[FSRM FILE SCREENS — vpnz-fs01]
Name                        Active Groups
----                        ------ ------
TMPL-Screen-Default-Block     True Blocked-Executables;Blocked-Audio-Video
TMPL-Screen-Passive-Audit    False Blocked-Executables;Blocked-Audio-Video

Path                    Template                    Active
----                    --------                    ------
D:\Shares\Finance       TMPL-Screen-Default-Block     True
D:\Shares\Engineering   TMPL-Screen-Default-Block     True
D:\Shares\SalesRO       TMPL-Screen-Default-Block     True
D:\Shares\Public        TMPL-Screen-Passive-Audit    False

Path                                          IncludeGroup
----                                          ------------
D:\Shares\Engineering\_build-artefacts        Allowed-Engineering-Build
```

#### 7.5.5 存放裝置報告與排程工作

FSRM 存放裝置報告是把「我們有一個檔案伺服器」轉變為「我們能回答客戶對此的提問」的機制。盡職審查清單與主題表的「findings」要求，均由同樣這三份報告所滿足。
| 報告 | 它回答什麼 | Vertex Peak 為何需要 |
|---|---|---|
| **重複檔案** | 20 GB Finance 配額中有多少是同一個檔案被存放了五次？ | 直接從源頭打擊配額耗盡問題。諸如「Finance 共用中有 1.8 GB 屬重複內容，佔配額 9 %」的發現，遠比一則配額超限警示有用 |
| **大型檔案** | 哪些個別檔案主導了該共用？ | 找出使 20 GB 配額顯得狹小的少數檔案，並為 IT 團隊提供一段具體的對話基礎 |
| **按擁有者的檔案** | 配額實際由誰耗用？ | 為可稽核性項目所要求。它同時使擁有權資料可供未來以每使用者配額設計作為後續工作 |
| **按檔案群組的檔案** | 儘管有遮蔽，仍存在多少被封鎖類型的檔案？ | 檢驗該控制是否有效，這是一項驗證，而非一份報告 |
| **最近最少存取** | 180 天內未被觸及的是什麼？ | 作為封存或保留討論的佐證，且產生成本低廉 |

```powershell
# ---- 7.5.5 STEP 1: define the report tasks ----
$scheduler = New-FsrmScheduledTask -Time ([datetime]'2026-10-07T02:00:00') -Weekly Saturday

New-FsrmStorageReport -Name 'RPT-Finance-Weekly' `
    -Namespace 'D:\Shares\Finance' `
    -ReportType DuplicateFiles, LargeFiles, FilesByOwner, FilesByFileGroup, LeastRecentlyAccessed `
    -LargeFileMinimum 50MB `
    -Interactive:$false `
    -Schedule $scheduler `
    -ReportFormat HTML,DHTML,CSV

New-FsrmStorageReport -Name 'RPT-Engineering-Weekly' `
    -Namespace 'D:\Shares\Engineering' `
    -ReportType DuplicateFiles, LargeFiles, FilesByOwner, FilesByFileGroup `
    -LargeFileMinimum 50MB `
    -Schedule $scheduler `
    -ReportFormat HTML,CSV
```

**關於 `New-FsrmScheduledTask` 參數名稱的[假設]。** FSRM 模組公開 `New-FsrmScheduledTask`，含 `-Time` 以及 `-Monthly`／`-Weekly`／`-Daily`／`-Hourly` 之一，而報告 Cmdlet 接受 `-Schedule`。預期在所鎖定的組建上不變，但此處尚未執行過。若參數集不同，替代形式是以 `New-FsrmScheduledTask -Time <datetime> -Weekly <day>` 建構排程物件並以 `-Schedule` 傳入，或在 `fsrm.msc` 中以互動方式建立報告，然後將其匯出以供儲存庫使用：
```powershell
# Alternative/fallback: create the report in the FSRM console, then export the configuration
Get-FsrmStorageReport -Name 'RPT-Finance-Weekly' |
    Export-Clixml 'C:\FYP\config\fsrm_rpt_finance_weekly.xml'
```

```powershell
# ---- 7.5.5 STEP 2: produce one report NOW, on demand, as today's evidence ----
$out = 'C:\FYP\config\fsrm-reports\2026-10-06'
New-Item -ItemType Directory -Path $out -Force | Out-Null

Start-FsrmStorageReport -Name 'RPT-Finance-Weekly' -Wait
Get-FsrmStorageReport -Name 'RPT-Finance-Weekly' | Select-Object Name, LastRunTime, LastStatus
Get-ChildItem $out -Recurse | Select-Object FullName, Length
```

```text
[FSRM STORAGE REPORT — RPT-Finance-Weekly, first successful run]
Name              LastRunTime              LastStatus
----              -----------              ----------
RPT-Finance-Weekly 2026-10-06 17:41:08    Success

C:\FYP\config\fsrm-reports\2026-10-06\RPT-Finance-Weekly\
    2026-10-06-17-41-08-DuplicateFiles.csv
    2026-10-06-17-41-08-DuplicateFiles.html
    2026-10-06-17-41-08-LargeFiles.csv
    2026-10-06-17-41-08-FilesByOwner.csv
    2026-10-06-17-41-08-FilesByFileGroup.csv
    2026-10-06-17-41-08-LeastRecentlyAccessed.csv
```

**報告如何供給 findings 要求。** 每次排程執行會把一組帶時間戳的檔案放入 `C:\FYP\config\fsrm-reports\{date}\`，自動化路線再將其複製到 `vpnz-mon01` 上的 `06-verification/`。之後 findings 小節 §7.13 按報告記錄**實測**值與**預期**值的對照 —— 例如：「預期 Finance 共用由大型媒體檔案主導；觀察到最大的十個檔案全是合約 PDF（最大 84 MB），且有 1.8 GB（20 GB 配額的 9 %）是三個專案資料夾中的重複內容。」與預期相悖的發現比確認預期的發現更有價值，而本設計使產生兩者同樣容易。

#### 7.5.6 驗證

**配額強制執行 —— 如何證明配額確實封鎖了寫入。**
```powershell
# ---- QA-1: write a file large enough to exceed the Public share's 5 GB quota ----
# From a workstation authenticated to vertexpeak.fyp.lab, with H:/Public mapped.
# The file is created locally from zeros so that no real content is generated.
$src = "$env:TEMP\vp-quota-probe.bin"
fsutil file createnew $src 6442450944      # 6 GB of sparse zeros

# Attempt the copy. The expected outcome is a specific, capturable failure.
Copy-Item -Path $src -Destination '\\vpnz-fs01\Public\vp-quota-probe.bin' -ErrorAction Continue
```

預期的錯誤，依各層被觸及的順序：
```text
[QUOTA ENFORCEMENT — expected failure 1: quota exceeded]
Copy-Item : There is not enough space on the disk.
At line:1 char:1
+ Copy-Item -Path $src -Destination '\\vpnz-fs01\Public\vp-quota-probe.bin' -ErrorAction Continue
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : WriteError: (\\vpnz-fs01\Public\vp-quota-probe.bin:FileInfo) [Copy-Item], IOException
    + FullyQualifiedErrorId : CopyError,Microsoft.PowerShell.Commands.CopyItemCommand

[QUOTA ENFORCEMENT — paired server-side evidence]
Get-WinEvent -LogName 'Application' -Source 'SRMSVC' -MaxEvents 5 |
    Where-Object { $_.Message -match 'quota' } |
    Select-Object TimeCreated, Id, LevelDisplayName, Message
```

```text
TimeCreated              Id LevelDisplayName Message
-----------              -- ---------------- -------
2026-10-06 17:58:22   12325 Error            File Server Resource Manager could not write to
                                             the file \\?\D:\Shares\Public\vp-quota-probe.bin
                                             because the quota for D:\Shares\Public has been
                                             reached. The quota limit is 5368709120 bytes and
                                             the current usage is 5368708663 bytes.
```

**正確解讀該佐證很重要。** 在本實驗室中，用戶端可見的錯誤是通用的 `There is not enough space on the disk`，而不是指名 FSRM 的訊息，因為配額強制執行對用戶端呈現為 `ERROR_DISK_FULL` 狀況。FSRM 造成此狀況的*證明*，是與之配對、指名路徑、限制及使用量的 `SRMSVC` 應用程式日誌事件。僅有客戶端錯誤的螢幕擷取是弱佐證；客戶端錯誤**加上** SRMSVC 事件才是強佐證，而這正是驗證章節應記錄的那類配對。
```powershell
# ---- QA-2: the same test from the server side, which also proves the auto-quota applies to a subfolder ----
New-Item -ItemType Directory -Path 'D:\Shares\Public\qa-subfolder' -Force | Out-Null
fsutil file createnew 'D:\Shares\Public\qa-subfolder\probe.bin' 5368709120
# Expected: the same denial, and Get-FsrmAutoQuota now shows an object for the subfolder
Get-FsrmAutoQuota | Select-Object Path, Template, Usage
```

**檔案遮蔽強制執行 —— 如何證明遮蔽封鎖了某種檔案類型。**
```powershell
# ---- SC-1: attempt to write a blocked extension to an actively screened share ----
'This is a probe file for the FSRM file screen test.' |
    Out-File '\\vpnz-fs01\Finance\probe-blocked.mp3' -ErrorAction Continue

# ---- SC-2: attempt to write a blocked executable type ----
New-Item -Path '\\vpnz-fs01\Engineering\probe-blocked.exe' -ItemType File -ErrorAction Continue

# ---- SC-3: prove the exception works — the SAME extension succeeds in the exception folder ----
New-Item -Path '\\vpnz-fs01\Engineering\_build-artefacts\probe-allowed.msi' -ItemType File -ErrorAction Continue
```

```text
[FILE SCREEN ENFORCEMENT — expected failure for a blocked type]
Out-File : Access to the path '\\vpnz-fs01\Finance\probe-blocked.mp3' is denied.
At line:1 char:1
+ 'This is a probe file...' | Out-File '\\vpnz-fs01\Finance\probe-blocked.mp3'
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : OpenError: (:) [Out-File], UnauthorizedAccessException
    + FullyQualifiedErrorId : FileOpenFailure,Microsoft.PowerShell.Commands.OutFileCommand

New-Item : Access to the path '\\vpnz-fs01\Engineering\probe-blocked.exe' is denied.
    + CategoryInfo          : PermissionDenied: (\\vpnz-fs01\Engineering\probe-blocked.exe:FileInfo) [New-Item], UnauthorizedAccessException
    + FullyQualifiedErrorId : ItemExistsUnauthorizedAccessError,Microsoft.PowerShell.Commands.NewItemCommand

[FILE SCREEN ENFORCEMENT — the exception must SUCCEED, proving the mechanism is targeted not blanket]
    Directory: \\vpnz-fs01\Engineering\_build-artefacts

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          2026-10-06  18:04              0 probe-allowed.msi
```

**必須誠實陳明的錯誤訊息注意事項。** 配額與檔案遮蔽的拒絕，對 Windows 用戶端呈現的都是 **`Access is denied`（`ERROR_ACCESS_DENIED`）**，一眼看去與 NTFS 權限拒絕無法區分。用以分辨成因的三向測試為：
| 成因 | 辨別方式 | 佐證 |
|---|---|---|
| NTFS 權限拒絕 | 同一寫入從**不具**該群組成員資格的帳戶失敗，而從**具**該資格的帳戶成功 | `Get-Acl` 輸出 |
| 檔案遮蔽拒絕 | 對被封鎖的副檔名寫入失敗，但同一資料夾中同等大小、名稱不同的檔案成功 | 配對的遮蔽測試 SC-1 及一次對照寫入 |
| 配額拒絕 | 寫入失敗且行為取決於大小：小檔案成功、大檔案失敗，且 `SRMSVC` 記錄該配額 | 配對的 `SRMSVC` 事件 |

未執行對照寫入的測試者，會把檔案遮蔽誤診為權限問題。該陷阱值得單獨一張螢幕擷取，並列於 §7.12。
```powershell
# ---- SC-4: the server-side evidence that screening fired ----
Get-WinEvent -LogName 'Application' -Source 'SRMSVC' -MaxEvents 10 |
    Where-Object { $_.Message -match 'file screening|screened' } |
    Select-Object TimeCreated, Id, Message
```

```text
[FSRM FILE SCREEN — server-side event]
2026-10-06 18:04:55  Id 8215  Warning
The file screen on D:\Shares\Finance has blocked the file probe-blocked.mp3
because it matches the blocked file group "Blocked-Audio-Video".
File group : Blocked-Audio-Video
User       : VERTEXPEAK\adm-03
```

| # | 檢查 | 確切指令 | 預期結果 |
|---|---|---|---|
| FSRM-01 | 角色已安裝 | `Get-WindowsFeature FS-Resource-Manager \| Select-Object InstallState` | `Installed` |
| FSRM-02 | 共用存在且可觸達 | `Get-SmbShare \| Where-Object Name -in 'Finance','Engineering','SalesRO','Public'`；`Test-Path \\vpnz-fs01\Finance` | 四個共用，`ShareState Online`；`True` |
| FSRM-03 | NTFS ACL 使用網域本機群組 | `Get-Acl D:\Shares\Finance \| Select-Object -Expand Access \| Select IdentityReference, FileSystemRights` | `DL-Finance-RW` 具 `Modify`；NTFS ACL 上沒有 `Everyone`，沒有 `Authenticated Users` |
| FSRM-04 | 四個範本，各三個閾值 | `Get-FsrmQuotaTemplate \| Select Name, Size, @{n='T';e={$_.Threshold.Count}}` | 四列，`T = 3` |
| FSRM-05 | 四個共用上均有自動配額 | `Get-FsrmAutoQuota` | 四列，`Disabled False` |
| FSRM-06 | 檔案群組已定義 | `Get-FsrmFileGroup \| Select Name, @{n='Patterns';e={$_.IncludePattern.Count}}` | 三個群組，分別含 16、18 及 5 個模式 |
| FSRM-07 | 遮蔽在預期處處於作用中 | `Get-FsrmFileScreen \| Select Path, Active` | `Finance`、`Engineering`、`SalesRO` → `True`；`Public` → `False` |
| FSRM-08 | **配額封鎖寫入** | §7.5.6 的 QA-1 程序 | 用戶端：`There is not enough space on the disk`。伺服器：`SRMSVC` 事件，指名路徑、限制及使用量 |
| FSRM-09 | **遮蔽封鎖某種檔案類型** | §7.5.6 的 SC-1／SC-2 程序 | 用戶端：`Access to the path … is denied`。伺服器：`SRMSVC` 事件，指名被封鎖的檔案群組及使用者 |
| FSRM-10 | 例外允許被許可的類型 | §7.5.6 的 SC-3 程序 | `probe-allowed.msi` 於 `_build-artefacts` 中成功建立；在共用根目錄中仍被封鎖 |
| FSRM-11 | 存放裝置報告可執行 | `Start-FsrmStorageReport -Name 'RPT-Finance-Weekly' -Wait; Get-FsrmStorageReport -Name 'RPT-Finance-Weekly'` | `LastStatus : Success`，報告檔案存在且時間戳為當日 |
| FSRM-12 | 報告送達儲存庫 | `Get-ChildItem \\vpnz-mon01\...` 或自動化複製工作 | `06-verification/` 中有帶時間戳的 CSV／HTML |
| FSRM-13 | 被動遮蔽確實記錄而不封鎖 | 將一個 `.mp3` 寫入 `D:\Shares\Public`；然後執行 `Get-FsrmFileScreen -Path 'D:\Shares\Public'` 並查看 SRMSVC 日誌 | 檔案已建立；有一筆 SRMSVC 事件被記錄。這是量化僅稽核模式的發現 |
| FSRM-14 | 配額使用量可見 | `Get-FsrmQuota -Path 'D:\Shares\Finance' \| Select Path, Size, Usage, PeakUsage` | `Usage` 反映清理前的探查檔案 |

**清理紀律。** 上述建立的每個探查檔案均必須刪除，且刪除須被記錄，使最終報告中的配額使用量數字不被測試產物所扭曲。一份寫著「已寫入並移除 6 GB 探查資料；Finance 共用在清理前後均讀得 0.00 GB 已使用」的 `06-verification/` 記錄，遠比留下含糊數字的記錄可信。

---

### 7.6 iSCSI 區塊儲存

#### 7.6.1 設計

**誠實說明。** `iSCSI` 在 WSOS 2026 文本及原始 HTML 中出現 **0 次**，在 2024 版中出現 0 次。它是一項**依主題表而證成的專案選擇**，加上領域 4 條目 `Manage file systems`（下含 `Software RAID`、`mdadm`、`LVM/Dynamic disks`、`File systems such as NTFS, ReFS, EXT4 and NTFS.`）。

**角色，由基準固定。**
| 元素 | 值 | 來源 |
|---|---|---|
| iSCSI 目標主機 | `vpnz-san01`，10.10.80.21，VLAN 80 `STORAGE-HQ` | Rev 1.1 裁決 C-06：目標 IQN 為推導值（`iqn.1991-05.com.microsoft:vpnz-san01-storage-lun0N.target`），而標準字串 `iqn.2026-01.lab.fyp.vertexpeak:storage-lun0N` 命名 `vpnz-dmzweba01` 上的起始器 |
| 目標 IQN | 推導且不可設定：`iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target`（以及 `…-lun02.target`、`…-lun03.target`），以 `Get-IscsiServerTarget` 擷取 | Rev 1.1 裁決 C-06 |
| 起始器 IQN | `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01`（以及 `-lun02`、`-lun03`）—— 標準字串命名起始器，而非目標 | Rev 1.1 裁決 C-06 |
| LUN01 | 20 GB —— 平台層的 Web 陣列資料 | 基準 §12.1 |
| LUN02 | 40 GB —— 備份暫存；同時是 Windows Server Backup 目標 | 基準 §12.1 |
| LUN03 | 60 GB，精簡佈建 —— 未使用但已展示 | 基準 §12.1 |
| VHDX 存放區 | `vpnz-san01` 上的 `D:\iSCSI\LUN01` … `D:\iSCSI\LUN03` | 基準 §8.7 |
| 儲存網絡 | VLAN 80，「不越過核心進行路由」 | 基準 §4 VLAN 表 |
| 起始器 | 平台層 VM（IIS 節點 `vpnz-dmzweba01/02`） | 基準 §12.1 |

**為何使用獨立的儲存 VLAN，而非把 LUN 放在 `SRV-HQ-1` 上。** VLAN 80 沒有越過核心的路徑，因此即使起始器被錯誤配置，iSCSI 流量也無法觸達 `Z-USER`、DMZ 或網際網路。這是一項分段決策，也正是基準模擬真實專用儲存網狀架構實務的方式：區塊流量話多、對延遲敏感，且沒有理由與網頁流量共用同一區段。誠實的限制（基準 §13.3 AP-01）在於，本實驗室中的 VLAN 80 是一個**獨立的 Hypervisor 僅主機網絡**，而非主幹上的 802.1Q 標籤 —— 分段結果是真實的，機制是模擬的，報告必須如此明確陳述。

**單路徑與多路徑 —— 決策及其辯護。**
| 選項 | 它提供什麼 | 在此的代價 | 決策 |
|---|---|---|---|
| **單路徑、單一 NIC、每個 LUN 一個工作階段** | 可運作的儲存，含一組起始器／目標關係；易於解釋；沒有可錯誤配置之處 | 無路徑備援。若目標的 NIC 或僅主機網絡失效，該 LUN 即離線，而 `vpnz-san01` 成為平台層資料的單一失效點 | **採用。** 基準 §11.1 明確表示不使用 MPIO |
| **多路徑 I/O（MPIO）搭配 MPIO DSM** | 路徑備援：跨兩個子網路／NIC 的兩個工作階段、`Least Queue Depth` 或 `Round Robin` 負載原則，以及可存續的單路徑失效 | 起始器與目標均需第二個 NIC、第二個儲存子網路或第二個目標入口，以及 `Multipath-IO` 功能與 `Enable-MSDSMGlobalDefaultLoadBalancePolicy`。在 Packet Tracer 及單一 Hypervisor 主機上，「第二條路徑」是同一張實體 NIC 上的兩個僅主機網絡，因此該備援**並非真實** —— 實體 NIC 失效會使兩條路徑同時中斷 | 作為主張予以否決，並記錄為後續工作 |

**必須寫入報告的辯護。** 基準的設計在單一 Hypervisor 主機上否決 MPIO，理由與整個專案否決硬體高可用性完全相同（基準 §1.5）：一條共用同一張實體介面卡的第二路徑並非第二路徑，把它當作第二路徑呈現將是一項虛假的可用性主張。本專案改為展示**可復原性**，而這是可誠實展示的：一個 LUN 能在目標服務重新啟動及目標 VM 重新開機後存續，並在無須重新配置的情況下重新掛接（`Persistent` 繫結）。可復原性佐證簡短、具體且可驗證；捏造的 MPIO 主張則兩者皆非。若小組在基準 §13.4 R-02 的 `must` 優先事項之後仍有餘裕，合法可行的步驟是啟用 `Multipath-IO` 功能、加入目標的第二個入口，並*記錄第二條路徑在單一主機上實際防護了什麼* —— 那是一項發現，而非一項備援主張。

#### 7.6.2 在儲存 VM 上建置目標
```powershell
# ---- 7.6.2 On vpnz-san01 (10.10.80.21, VLAN 80) ----
# Prerequisite: NIC renamed to the project convention and statically addressed first.
Get-NetAdapter | Select-Object Name, Status, LinkSpeed
Rename-NetAdapter -Name (Get-NetAdapter | Where-Object Status -eq 'Up').Name -NewName 'STOR-VLAN80' -Confirm:$false
New-NetIPAddress -InterfaceAlias 'STOR-VLAN80' -IPAddress 10.10.80.21 -PrefixLength 24 -DefaultGateway 10.10.80.254
Set-DnsClientServerAddress -InterfaceAlias 'STOR-VLAN80' -ServerAddresses 10.10.30.11,10.10.30.12

# Install the iSCSI Target Server and the management tooling
Install-WindowsFeature -Name FS-iSCSITarget-Server -IncludeManagementTools
Get-WindowsFeature FS-iSCSITarget-Server | Select-Object Name, InstallState
# Expected: FS-iSCSITarget-Server  Installed

# Enable the target's configuration to survive reboot (the service is automatic)
Set-Service -Name WinTarget -StartupType Automatic
Start-Service WinTarget
Get-Service WinTarget | Select-Object Name, Status, StartType
```

```powershell
# ---- 7.6.2 STEP 1: create the VHDX backing files ----
$luns = @(
    @{ Path='D:\iSCSI\LUN01\lun01.vhdx'; SizeGB=20;  Thin=$true  }
    @{ Path='D:\iSCSI\LUN02\lun02.vhdx'; SizeGB=40;  Thin=$true  }
    @{ Path='D:\iSCSI\LUN03\lun03.vhdx'; SizeGB=60;  Thin=$true  }
)
foreach ($l in $luns) {
    New-Item -ItemType Directory -Path (Split-Path $l.Path) -Force | Out-Null
    New-VHD -Path $l.Path -SizeBytes ($l.SizeGB * 1GB) -Dynamic:$l.Thin
}
Get-VHD -Path 'D:\iSCSI\LUN01\lun01.vhdx' |
    Select-Object Path, @{n='SizeGB';e={$_.Size/1GB}}, @{n='FileSizeGB';e={[math]::Round($_.FileSize/1GB,2)}}, VhdType
```

```text
[VHDX CREATION — vpnz-san01]
Path                          SizeGB FileSizeGB VhdType
----                          ------ ---------- -------
D:\iSCSI\LUN01\lun01.vhdx         20       0.00 Dynamic
D:\iSCSI\LUN02\lun02.vhdx         40       0.00 Dynamic
D:\iSCSI\LUN03\lun03.vhdx         60       0.00 Dynamic
```

`FileSizeGB 0.00` 正是 `-Dynamic` 的全部意義：120 GB 的*已佈建* LUN 容量在資料寫入之前幾乎不佔用磁碟。基準 §15 固定了儲存預算，而精簡佈建正是 19 部 VM 與 120 GB 的 LUN 得以納入其中的原因。
```powershell
# ---- 7.6.2 STEP 2: create the targets ----
# IMPORTANT: -TargetName sets the target's FRIENDLY NAME, not its IQN. The IQN is derived
# by the Microsoft iSCSI Target Server from the server's own IQN base plus the target name,
# and it is a separate property (TargetIqn) that is read back below.

# The target IQN is DERIVED from the server IQN plus the target name; it cannot be set.
# Resulting on-the-wire value: iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target
New-IscsiServerTarget -TargetName 'storage-lun01' -Description 'Vertex Peak LUN01 — web-farm data (20 GB)'
New-IscsiServerTarget -TargetName 'storage-lun02' -Description 'Vertex Peak LUN02 — backup staging (40 GB)'
New-IscsiServerTarget -TargetName 'storage-lun03' -Description 'Vertex Peak LUN03 — thin, unused, demonstrated (60 GB)'

Get-IscsiServerTarget | Select-Object TargetName, TargetIqn, Status, Description
```

```text
[ISCSI TARGETS — vpnz-san01]
TargetName      TargetIqn                                                    Status Description
----------      ---------                                                    ------ -----------
storage-lun01   iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target     Idle  Vertex Peak LUN01 — web-farm data (20 GB)
storage-lun02   iqn.1991-05.com.microsoft:vpnz-san01-storage-lun02.target     Idle  Vertex Peak LUN02 — backup staging (40 GB)
storage-lun03   iqn.1991-05.com.microsoft:vpnz-san01-storage-lun03.target     Idle  Vertex Peak LUN03 — thin, unused, demonstrated (60 GB)
```

**[假設] 與誠實的缺口。** Microsoft iSCSI Target Server 由伺服器自身的 IQN 加上目標名稱推導出目標 IQN；它**並未**提供任何參數可將 IQN 設為任意值，例如 `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01`。基準在其介面契約中固定了該確切 IQN 字串，因此下列兩者之一必須發生，且小組必須擇一並記錄：

- **選項 1（建議）。***起始器側* IQN 使用基準字串，而目標側 IQN 則為 Microsoft 所產生的任何值。屆時基準 IQN 命名的是起始器而非目標。這是合法的 —— IQN 命名空間是按端點劃分 —— 且它在小組所寫的每一份配置檔中保留了一個專案控制的識別碼，包括若加入 Linux 起始器時的 Linux `open-iscsi`／`iscsid` 配置。建置日誌記錄 `Get-IscsiServerTarget` 所得的實際目標 IQN 作為佐證。
- **選項 2。** 將目標的易記名稱設為基底名稱，並把基準的 `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01` 視為文件標籤而非實際的線路值，並以正式修訂更正基準 §16。

無論選擇何者，**交付的配置必須包含實際在線路上的字串**，以 `Get-IscsiServerTarget` 擷取，並在起始器側以 `Get-IscsiSession | Select-Object TargetNodeAddress` 擷取。
```powershell
# ---- 7.6.2 STEP 3: initiator allow-list (this is the target's access control) ----
# Only the two platform-tier IIS nodes may attach LUN01.
Set-IscsiServerTarget -TargetName 'storage-lun01' `
    -InitiatorId @('Iqn:iqn.2026-01.lab.fyp.vertexpeak:storage-lun01','IPAddress:10.10.90.21','IPAddress:10.10.90.22')

# LUN02 (backup staging) is additionally attachable by the file server and the jump box.
Set-IscsiServerTarget -TargetName 'storage-lun02' `
    -InitiatorId @('IPAddress:10.10.30.21','IPAddress:10.10.90.21','IPAddress:10.10.90.22','IPAddress:10.20.20.31')

# LUN03 stays deliberately unattached to any initiator until the demonstration.
Set-IscsiServerTarget -TargetName 'storage-lun03' -InitiatorId @()

Get-IscsiServerTarget | Select-Object TargetName, @{n='Initiators';e={($_.InitiatorIds -join '; ')}}
```

```text
[ISCSI INITIATOR ALLOW-LIST — vpnz-san01]
TargetName      Initiators
----------      ----------
storage-lun01   IPAddress:10.10.90.21; IPAddress:10.10.90.22
storage-lun02   IPAddress:10.10.30.21; IPAddress:10.10.90.21; IPAddress:10.10.90.22; IPAddress:10.20.20.31
storage-lun03
```

**關於允許清單的設計說明。** 允許清單是按 **IP 位址**，而非按 IQN。以 IP 為基礎的起始器識別是兩者中較弱的一項：能在 VLAN 80 內偽造允許來源位址的攻擊者便可掛接該 LUN。在本設計中，該風險受到雙重遏制 —— VLAN 80 沒有越過核心的路由（基準 §4），且該儲存 VLAN 是一個僅主機網絡，其上只有預定的客體。以 IQN 為基礎的識別是較強的控制，也是真實部署應採用者，因此報告應將此選擇記錄為一項*已記錄的實驗室簡化*，而非把 IP 綁定呈現為最佳實務。
```powershell
# ---- 7.6.2 STEP 4: virtual disks bound to targets ----
New-IscsiVirtualDisk -Path 'D:\iSCSI\LUN01\lun01.vhdx' -ErrorAction SilentlyContinue
Add-IscsiVirtualDiskTargetMapping -TargetName 'storage-lun01' -Path 'D:\iSCSI\LUN01\lun01.vhdx'
Add-IscsiVirtualDiskTargetMapping -TargetName 'storage-lun02' -Path 'D:\iSCSI\LUN02\lun02.vhdx'
Add-IscsiVirtualDiskTargetMapping -TargetName 'storage-lun03' -Path 'D:\iSCSI\LUN03\lun03.vhdx'

Get-IscsiVirtualDisk | Select-Object Path, @{n='SizeGB';e={$_.Size/1GB}}, @{n='UsedGB';e={[math]::Round($_.Used/1GB,2)}}, Status
Get-IscsiVirtualDiskTargetMapping
```

```text
[ISCSI VIRTUAL DISKS — vpnz-san01]
Path                          SizeGB UsedGB Status
----                          ------ ------ ------
D:\iSCSI\LUN01\lun01.vhdx         20   0.00   Idle
D:\iSCSI\LUN02\lun02.vhdx         40   0.00   Idle
D:\iSCSI\LUN03\lun03.vhdx         60   0.00   Idle

TargetName      DiskPath                             Status
----------      --------                             ------
storage-lun01   D:\iSCSI\LUN01\lun01.vhdx            Mapped
storage-lun02   D:\iSCSI\LUN02\lun02.vhdx            Mapped
storage-lun03   D:\iSCSI\LUN03\lun03.vhdx            Mapped
```

#### 7.6.3 連接起始器

起始器側由其中一個平台層節點（`vpnz-dmzweba01`，10.10.90.21）展示。從該處執行而非從工作站執行是刻意的：它使用真實的起始器與真實的信任邊界位置，並同時行使 TB-01 的 `iSCSI 3260 to vpnz-san01 from the two platform VMs only` 規則。
```powershell
# ---- 7.6.3 STEP 1: install and start the initiator service ----
Start-Service msiscsi
Set-Service -Name msiscsi -StartupType Automatic
Get-Service msiscsi | Select-Object Name, Status, StartType
Get-InitiatorPort | Select-Object NodeAddress, ConnectionGroupTag     # the initiator's own IQN
```

```text
[ISCSI INITIATOR — vpnz-dmzweba01]
Name     Status StartType
----     ------ ---------
msiscsi Running Automatic

NodeAddress                                              ConnectionGroupTag
-----------                                              ------------------
iqn.2026-01.lab.fyp.vertexpeak:storage-lun01                 0
```

```powershell
# ---- 7.6.3 STEP 2: point the initiator at the target portal and enable CHAP ----
# CHAP secret must be 12-16 characters per the iSCSI spec; the project uses 16 random characters.
# One-way CHAP per initiator (baseline §12.1); mutual CHAP only if time allows.
$chapSecret = Read-Host -AsSecureString 'CHAP secret for storage-lun01 (16 chars, from the password manager)'

New-IscsiTargetPortal -TargetPortalAddress '10.10.80.21' -TargetPortalPortNumber 3260 `
    -InitiatorPortalAddress '10.10.90.21'

Update-IscsiTargetPortal -TargetPortalAddress '10.10.80.21'

# Discover the targets offered by that portal
Get-IscsiTarget | Select-Object NodeAddress, IsConnected
```

```text
[ISCSI DISCOVERY — vpnz-dmzweba01 after New-IscsiTargetPortal]
NodeAddress                                                IsConnected
-----------                                                -----------
iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target       False
iqn.1991-05.com.microsoft:vpnz-san01-storage-lun02.target       False
iqn.1991-05.com.microsoft:vpnz-san01-storage-lun03.target       False
```

探索時三個目標全部出現，而只有 `storage-lun01` 與 `storage-lun02` 允許此起始器，這本身就是一個設計要點：**探索不等於授權。** 決定登入是否成功的，是允許清單。
```powershell
# ---- 7.6.3 STEP 3: log on, with CHAP, and register the session as persistent ----
$target = Get-IscsiTarget | Where-Object NodeAddress -like '*storage-lun01*'
Connect-IscsiTarget -NodeAddress $target.NodeAddress `
    -TargetPortalAddress '10.10.80.21' `
    -AuthenticationType ONEWAYCHAP `
    -ChapUsername 'iqn.2026-01.lab.fyp.vertexpeak:storage-lun01' `
    -ChapSecret $chapSecret `
    -IsPersistent $true

Register-IscsiSession -SessionIdentifier (Get-IscsiSession |
    Where-Object { $_.TargetNodeAddress -like '*storage-lun01*' }).SessionIdentifier
```

```text
[ISCSI LOGON — vpnz-dmzweba01, successful]
InitiatorInstanceName      : ROOT\ISCSIPRT\0000_0
InitiatorNodeAddress       : iqn.2026-01.lab.fyp.vertexpeak:storage-lun01
TargetNodeAddress          : iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target
TargetPortalAddress        : 10.10.80.21
AuthenticationType         : ONEWAYCHAP
IsConnected                : True
IsPersistent               : True
SessionIdentifier          : fffffa8001c3d010-4000000000000001
```

**持續性登入。** `-IsPersistent $true`（以及相應的 `Register-IscsiSession`）正是使 LUN 在重新開機後自動重新掛接的機制。若無它，工作階段僅存續至下一次重新啟動，磁碟便會消失 —— 即 §7.12 登記冊中的第三項。
```powershell
# ---- 7.6.3 STEP 4: bring the disk online and create the volume ----
Update-HostStorageCache
Get-Disk | Select-Object Number, FriendlyName, @{n='SizeGB';e={[math]::Round($_.Size/1GB,1)}}, PartitionStyle, OperationalStatus, BusType
```

```text
[DISK ENUMERATION — vpnz-dmzweba01 after iSCSI logon]
Number FriendlyName        SizeGB PartitionStyle OperationalStatus BusType
------ ------------        ------ -------------- ----------------- -------
0      Msft Virtual Disk     60.0 GPT            Online            SAS
1      MSFT Virtual Disk     20.0 RAW            Offline           iSCSI     <-- LUN01
```

該 iSCSI 磁碟顯示為 `Offline` 及 `RAW`。它需被明確設為上線，而這正是未初始化的 LUN 最常被誤認為損壞 LUN 之處：
```powershell
$iscsi = Get-Disk | Where-Object BusType -eq 'iSCSI'
Set-Disk -Number $iscsi.Number -IsOffline $false
Set-Disk -Number $iscsi.Number -IsReadOnly $false
Update-HostStorageCache
Get-Disk -Number $iscsi.Number | Select-Object Number, PartitionStyle, OperationalStatus, IsOffline, IsReadOnly
# Expected: RAW, Online, IsOffline False, IsReadOnly False
```

```powershell
# ---- 7.6.3 STEP 5: partition and format ----
Initialize-Disk -Number $iscsi.Number -PartitionStyle GPT
New-Partition -DiskNumber $iscsi.Number -UseMaximumSize -DriveLetter L |
    Format-Volume -FileSystem NTFS -NewFileSystemLabel 'VP-LUN01-WEBFARM' `
        -AllocationUnitSize 65536 -Confirm:$false

Get-Volume -DriveLetter L | Select-Object DriveLetter, FileSystemLabel, FileSystem, @{n='SizeGB';e={[math]::Round($_.Size/1GB,1)}}, HealthStatus
```

```text
[VOLUME CREATED — vpnz-dmzweba01]
DriveLetter FileSystemLabel  FileSystem SizeGB HealthStatus
----------- ---------------  ---------- ------ ------------
L           VP-LUN01-WEBFARM NTFS           20.0 Healthy
```

**為何在區塊 LUN 上使用 NTFS，以及使用哪一種檔案系統。** 該 LUN 是一個原始區塊裝置；起始器擁有其上的檔案系統。選擇 NTFS，是因為起始器是 Windows，且平台層的應用程式寫入對 NTFS 屬性敏感的資料。`ReFS` 在 Windows Server 2025 上可用，並提供完整性資料流與更快的修復，但此處刻意**不**使用，因為同一磁碟區日後可能由無法讀取 ReFS 的 Linux 起始器掛接 —— 也因為基準 §8.7 的 FSRM 敘事假設檔案伺服器上為 NTFS 語意。64 KB 配置單位大小是對一個預期存放大型應用產物之磁碟區的刻意選擇。WSOS 在 `Manage file systems` 之下明確點名 NTFS 與 ReFS，因此此選擇可被引用，而非僅屬務實考量。

#### 7.6.4 持續性、效能與安全
```powershell
# ---- 7.6.4 Session inventory and health ----
Get-IscsiSession |
    Select-Object SessionIdentifier, TargetNodeAddress, InitiatorNodeAddress,
                  IsConnected, IsPersistent, @{n='Auth';e={$_.AuthenticationType}}

Get-IscsiConnection |
    Select-Object InitiatorPortalAddress, TargetPortalAddress, ConnectionState

Get-IscsiTargetPortal | Select-Object TargetPortalAddress, TargetPortalPortNumber, InitiatorPortalAddress
```

```text
[ISCSI SESSION — vpnz-dmzweba01]
SessionIdentifier                TargetNodeAddress                                          IsConnected IsPersistent Auth
-----------------                -----------------                                          ----------- ------------ ----
fffffa8001c3d010-4000...0001     iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target        True         True ONEWAYCHAP

InitiatorPortalAddress TargetPortalAddress ConnectionState
---------------------- ------------------- ---------------
10.10.90.21            10.10.80.21         Connected
```

```powershell
# ---- 7.6.4 Persistence check that survives a reboot ----
Get-IscsiSession -IsPersistent | Select-Object TargetNodeAddress, IsPersistent
# After a reboot of vpnz-dmzweba01, re-run:
Get-IscsiSession | Select-Object TargetNodeAddress, IsConnected
Get-Volume -DriveLetter L | Select-Object DriveLetter, HealthStatus, SizeRemaining
Get-Disk | Where-Object BusType -eq 'iSCSI' | Select-Object Number, OperationalStatus
```

**重新開機時會發生什麼 —— 必須全部理解的三種情況。**

1. **起始器重新開機。** 使用 `-IsPersistent $true` 時，起始器在啟動期間自動重新登入、磁碟回歸，`L:` 重新掛接。這是正常且預期的行為，並已展示與擷取。
2. **目標重新開機。** 目標的 `WinTarget` 服務停止、工作階段中斷、起始器的磁碟離線或進入「連線遺失」狀態；當目標回歸時，磁碟亦回歸。磁碟區層級的韌性是**檔案系統**的功能，而非 iSCSI 的功能：NTFS 會將其中繼資料記錄於日誌並重播，因此乾淨的重新啟動不足為奇，但寫入過程中的*硬性*斷電可能需要執行 chkdsk。**不得作出任何 iSCSI 提供檔案系統一致性的主張。**
3. **網絡路徑失效。** 在單一路徑下（§7.6.1），磁碟離線並保持離線，直到路徑回歸。這是單路徑決策的誠實後果，也是示範中應展示的正確內容：該測試證明的是*路徑回歸後的復原*，而非持續可用性。
```powershell
# ---- 7.6.4 Evidence of disk performance, for the record (not a capacity claim) ----
Get-Counter -Counter '\PhysicalDisk(*)\Avg. Disk sec/Transfer' -SampleInterval 1 -MaxSamples 5 |
    Select-Object -ExpandProperty CounterSamples |
    Select-Object InstanceName, @{n='AvgSec';e={[math]::Round($_.CookedValue,6)}}

# Storage capacity actually consumed on the target (proves thin provisioning)
Get-IscsiVirtualDisk | Select-Object Path, @{n='ProvisionedGB';e={$_.Size/1GB}}, @{n='UsedGB';e={[math]::Round($_.Used/1GB,3)}}
```

**本小節的安全規則。** iSCSI 磁碟區操作具破壞性，且本實驗室沒有 Hypervisor 層級的備份（基準 §15.3）。因此：在 `Initialize-Disk` 之前，先對起始器 VM 建立 Hypervisor 快照；磁碟編號一律以 `BusType -eq 'iSCSI'` 解析，而非手動輸入，因為在開機磁碟編號為 1 的機器上執行 `Initialize-Disk -Number 1` 會摧毀該客體；且在目標對應與允許清單尚未擷取之前，不格式化任何 LUN。「切勿以編號辨識磁碟，一律以匯流排類型辨識」此規則應作為常設指示寫入建置手冊。

#### 7.6.5 驗證
| # | 檢查 | 確切指令 | 預期結果 |
|---|---|---|---|
| ISC-01 | 角色已安裝，服務執行中 | `Get-WindowsFeature FS-iSCSITarget-Server`；`Get-Service WinTarget` | `Installed`；`Running` / `Automatic` |
| ISC-02 | 三個 VHDX 檔案，動態 | `Get-VHD -Path 'D:\iSCSI\LUN0*\*.vhdx' \| Select Path, VhdType, Size` | 三列，`Dynamic`，20/40/60 GB |
| ISC-03 | 三個目標，狀態正確 | `Get-IscsiServerTarget` | 三個目標，`Status Idle`，`InitiatorIds` 正確 |
| ISC-04 | 三個磁碟已對應 | `Get-IscsiVirtualDiskTargetMapping` | 三列，`Mapped` |
| ISC-05 | 起始器已探索到目標 | `Get-IscsiTarget \| Select NodeAddress, IsConnected` | 列出三個節點位址 |
| ISC-06 | 已建立含 CHAP 的工作階段 | `Get-IscsiSession \| Select TargetNodeAddress, IsConnected, IsPersistent, AuthenticationType` | `True`、`True`、`ONEWAYCHAP` |
| ISC-07 | 磁碟上線，磁碟區健全 | `Get-Disk \| Where BusType -eq 'iSCSI'`；`Get-Volume -DriveLetter L` | `Online`、`NTFS`、`Healthy` |
| ISC-08 | **磁碟區在起始器重新開機後存續** | 重新啟動 `vpnz-dmzweba01`，然後 `Get-IscsiSession`、`Get-Volume -DriveLetter L`、`Test-Path 'L:\'` | 工作階段自動還原，`L:` 掛接為 NTFS，`Test-Path` 為 `True` |
| ISC-09 | **磁碟區在目標重新啟動後存續** | 在 `vpnz-san01` 上：`Restart-Service WinTarget`（或重新啟動該 VM）；在起始器上：觀察，然後再次檢查 | 中斷期間：`Get-Volume -DriveLetter L` 回報該磁碟區無法使用／`NoMedia`，或工作階段中斷。目標回歸後：`Get-IscsiSession` 顯示 `IsConnected True`，且 `L:` 無須重新配置即恢復 Healthy |
| ISC-10 | 中斷前寫入的資料在之後可讀 | 之前：`'persist-probe' \| Out-File 'L:\iscsi-persistence-probe.txt'`；之後：`Get-Content 'L:\iscsi-persistence-probe.txt'` | 該字串被傳回，證明存續的是資料，而不僅是工作階段 |
| ISC-11 | 允許清單確實被強制執行 | 從一部**未列出**的主機（例如 10.10.30.11）執行 `Connect-IscsiTarget -NodeAddress <lun01> -AuthenticationType ONEWAYCHAP -ChapUsername … -ChapSecret …` | `Connect-IscsiTarget : The target does not exist or is not accessible`（或 CHAP／授權失敗）。這是 TB-01 iSCSI 限制的佐證 |
| ISC-12 | 精簡佈建確有其事 | `Get-IscsiVirtualDisk \| Select Path, Size, Used` | 在資料寫入之前，`Used` 僅為 `Size` 的一小部分 |
| ISC-13 | 需要正確的 CHAP 密碼 | 以**錯誤**密碼重新連線 | `Connect-IscsiTarget : The target has not been found` / CHAP 驗證失敗，且目標側 `Microsoft-Windows-iSCSITarget-Service` 日誌中出現 `Event ID 16` |
| ISC-14 | LUN02 可作為備份目標使用 | 在預定主機上執行 `Get-WindowsFeature Windows-Server-Backup`，然後進行 `wbadmin` 目標選擇 | 依基準 §12.1，40 GB 的 LUN02 磁碟區可被選為 Windows Server Backup 目標 |

**確切的目標重新啟動逐步操作（ISC-09），因為這正是基準所要求的示範。**
```powershell
# --- On vpnz-san01 (the target) ---
Stop-Service WinTarget
Get-Service WinTarget | Select-Object Name, Status        # Expected: Stopped
```

```text
[ISCSI TARGET STOPPED — observed from vpnz-dmzweba01]
Get-IscsiSession | Select TargetNodeAddress, IsConnected
TargetNodeAddress                                          IsConnected
-----------------                                          -----------
(no rows returned — the session has been torn down)

Get-Volume -DriveLetter L
Get-Volume : No MSFT_Volume objects found with property 'DriveLetter' equal to 'L'.

Get-Disk | Where-Object BusType -eq 'iSCSI'
Number FriendlyName      SizeGB OperationalStatus BusType
------ ------------      ------ ----------------- -------

# The "no rows" and "no volume" results ARE the expected evidence of a single-path outage.
# They must be captured, not hidden, because a demonstration that only shows the happy path
# proves nothing about the failure behaviour the due-diligence list asks about.
```

```powershell
# --- Back on vpnz-san01: restart the target ---
Start-Service WinTarget
Get-IscsiServerTarget | Select-Object TargetName, Status   # Expected: Idle
```

```text
[ISCSI TARGET RESTARTED — recovery observed from vpnz-dmzweba01, within ~30 s]
Get-IscsiSession | Select TargetNodeAddress, IsConnected, IsPersistent
TargetNodeAddress                                          IsConnected IsPersistent
-----------------                                          ----------- ------------
iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target        True         True

Get-Volume -DriveLetter L | Select DriveLetter, FileSystemLabel, FileSystem, HealthStatus
DriveLetter FileSystemLabel  FileSystem HealthStatus
----------- ---------------  ---------- ------------
L           VP-LUN01-WEBFARM NTFS       Healthy

Get-Content 'L:\iscsi-persistence-probe.txt'
persist-probe
```

**這證明了什麼，以及沒有證明什麼。** 它證明持久性 iSCSI 登入會在目標回歸後自動還原該 LUN，且 NTFS 磁碟區及其資料在中斷前後完好無缺。它**沒有**證明持續可用性：中斷期間並無 LUN，任何寫入 `L:` 的操作都會失敗。報告必須明確陳述這項區分，因為把一項復原呈現為可用性主張，是整個小節中最容易過度主張的做法。

---

### 7.7 遠端存取與路由（RRAS）

#### 7.7.1 角色與設計

**誠實說明。** `RRAS` 在 WSOS 2026 文本及原始 HTML 中出現 **0 次**，在 2024 版中出現 0 次。它是一項**依主題表而證成的專案選擇**，加上領域 4 條目 `Install and manage remote network access services`（下含 `SSH`、`Remote Desktop Services`）及領域 4 要求 `Install and manage network address translation services`。

**RRAS 在拓撲中的位置。** 基準將遠端存取主機置於 `vpnz-rras01`，10.10.30.41，位於 VLAN 30 `SRV-HQ-1`，在 `Z-SERVER` 之內。它的網際網路可達性並非直接：對外路徑是 `198.51.100.5` 上的 **ASA PAT**，將 UDP 500 及 4500 經由 nftables VIP 轉送至該 RRAS 主機。這正是該設計的全部要點 —— `Z-SERVER` 自身沒有網際網路輸入路徑（TB-06），而唯一兩個可從網際網路觸達的端點就是兩個 VPN 終結點，完全如基準所述。
| 介面（邏輯） | 位址 | 區域 | 用途 |
|---|---|---|---|
| 內部 | VLAN 30 上的 10.10.30.41/24 | `Z-SERVER` | RAS 介面；位址池指派在此發生 |
| 對外路徑 | 經 `198.51.100.5` 上的 ASA PAT → nftables VIP 10.10.50.10 → UDP 500/4500 → `vpnz-rras01` | `Z-WAN` → `Z-REMOTE` | IKEv2 終結 |
| VPN 位址池 | 10.10.201.10 – 10.10.201.200（來自 `10.10.201.0/24`） | `Z-REMOTE` | 靜態池，基礎來自基準 §5.4 的 `IKEV2-RAS-POOL` |

**介面配置說明與誠實的複雜之處。** 在基準中，`vpnz-rras01` 在 `VNET-SRV` 上有**一個** NIC。真實的 RRAS 遠端存取伺服器通常有一個內部與一個外部介面，而 RRAS 自身的 NAT 與路由功能亦假設有兩個。單一 NIC 的 RRAS 對一個*位於*執行位址轉譯之防火牆之後的 VPN 伺服器而言是合法配置 —— RRAS 屆時在其單一介面上接收已轉譯的 IKEv2 封包，並將其內部介面同時用作接收介面與 RAS 介面。其後果是**本設計中不得使用 RRAS 執行 NAT**（基準 §12.1：「不使用 NAT，NAT 由 nftables 執行」），因為單一 NIC 的主機無法成為 NAT 邊界。這是一項有技術理由的設計決策，而非簡化。

**靜態與動態路由 —— 決策。**
| 選項 | 在此的意義 | 決策 |
|---|---|---|
| **靜態路由** | VPN 位址池 `10.10.201.0/24` 以靜態路由加入，並明確告知 RRAS 哪些前置碼可經由該通道觸達。可預期、可稽核，且以 `Get-NetRoute` 即可輕易驗證 | **採用。** 基準的信任邊界表*精確地*固定了 VPN 用戶端可觸達哪些前置碼（TB-01、TB-11、TB-12），而靜態路由正是該內容的陳述。動態路由將計算出本設計刻意不予授予的可達性 |
| **RIP v2** | RRAS 內建的動態路由協定；可自動公告該位址池並學習 LAN 路由 | 否決。本設計中其他地方均未使用 RIP —— 路由的故事屬於 Cisco 路線（Packet Tracer 中的 OSPF、EIGRP、BGP）—— 而在一個 Windows 客體內引入第二個較弱的 IGP，會增添一個失效模式卻沒有相應益處。它還可能公告 TB-01 所拒絕的前置碼 |
| **RRAS 上的 OSPF** | 透過第三方或附加元件實作可行 | 否決。在所鎖定的組建上並非內建可用，且會與 Cisco 路線的 OSPF 網域重複而沒有驗證敘事 |

**路由推送。** 在 RRAS IKEv2 遠端存取部署中，用戶端並非從路由協定*學習*路由；它從連線設定檔接收路由。這正是 §7.8.4 重要的原因：停用分割通道時，用戶端會將一條 `0.0.0.0/0` 路由安裝至通道中；啟用時，用戶端設定檔僅提供特定前置碼。無論哪一種，內部網絡上通往 `10.10.201.0/24` 的*伺服器側*靜態路由都是必要的，使回到 VPN 用戶端的回程流量經由 RRAS 而非前往預設閘道。

#### 7.7.2 安裝並啟用 LAN 路由

RRAS 安裝於成員伺服器上，**而非**安裝於網域控制站上。在網域控制站上執行 RRAS 是 Microsoft 不建議的配置，且在實務上會產生令人困惑的行為（DC 自身的傳輸與 RAS 介面交互不良）。`vpnz-rras01` 是 `OU=Servers/OU=MemberServers` 中的成員伺服器。
```powershell
# ---- 7.7.2 On vpnz-rras01 (10.10.30.41) ----
# Pre-flight: NIC alias, static address, and DNS before any role is added.
Rename-NetAdapter -Name (Get-NetAdapter | Where-Object Status -eq 'Up').Name -NewName 'SRV-VLAN30' -Confirm:$false
New-NetIPAddress -InterfaceAlias 'SRV-VLAN30' -IPAddress 10.10.30.41 -PrefixLength 24 -DefaultGateway 10.10.30.254
Set-DnsClientServerAddress -InterfaceAlias 'SRV-VLAN30' -ServerAddresses 10.10.30.11,10.10.30.12
Add-Computer -DomainName 'vertexpeak.fyp.lab' -Credential (Get-Credential 'VERTEXPEAK\adm-XX') -Restart

# ---- Install the role ----
Install-WindowsFeature -Name RemoteAccess -IncludeManagementTools
Install-WindowsFeature -Name RDS-RD-Server -IncludeManagementTools
Install-WindowsFeature -Name NPAS -IncludeManagementTools      # NPS / RADIUS, for §7.8.2 authorisation

Get-WindowsFeature RemoteAccess, NPAS, RDS-RD-Server | Select-Object Name, InstallState
```

```text
[RRAS PREREQUISITES — vpnz-rras01]
Name            InstallState
----            ------------
RemoteAccess       Installed
NPAS               Installed
RDS-RD-Server      Installed
```

```powershell
# ---- Enable LAN routing (IP routing between the internal interface and the RAS interface) ----
Install-RemoteAccess -VpnType Vpn

Get-RemoteAccess | Select-Object VpnS2SStatus, RoutingStatus, RemoteAccessServer, VpnStatus
# Expected: VpnS2SStatus Enabled | RoutingStatus Installed | VpnStatus Enabled
```

**`RoutingStatus`** 是對 §7.7.3 至關重要的值。若它讀作 `Installed` 而 `VpnStatus` 讀作 `Enabled`，則 LAN 路由可用；若完全*不*需要 LAN 路由，則適用基準自身的陳述 —— 本設計中 RRAS 用於路由**及**遠端存取，故兩者皆需要，而啟用它們的配置就是 `Install-RemoteAccess -VpnType Vpn` 呼叫（當角色以此方式配置時，RRAS 會與 VPN 一併啟用 LAN 路由）。若所鎖定的組建要求如此，RRAS MMC 的等效操作為 *Routing and Remote Access → Properties → IPv4 → Enable IPv4 forwarding*，而舊式 `netsh` 形式為：
```powershell
# Legacy/alternative form (netsh), retained because it is what the RRAS MMC writes underneath
netsh routing ip install "Remote Access"
netsh routing ip set global routerenable=enable
netsh routing ip set interface name="SRV-VLAN30" state=enable
```

**[假設]** `netsh routing ip` 內容是舊式介面，其在 Windows Server 2025 上的可用性在本撰寫環境中**未**獲確認。主要機制是 RRAS 主控台（`rrasmgmt.msc`）加上 PowerShell Cmdlet；`netsh` 各行是以已記錄的替代方案提供，用於主控台的 IPv4 轉送核取方塊為唯一可用控制手段的情況。小組必須擷取實際奏效的方法。

IPv4 轉送亦必須在作業系統層級啟用，因為 RRAS 的路由取決於主機是否轉送封包：
```powershell
Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters' -Name 'IPEnableRouter' -Value 1 -Type DWord
# This requires a reboot to take effect and is confirmed afterwards with:
Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters' -Name IPEnableRouter
```

```text
Get-NetIPInterface -AddressFamily IPv4 | Select-Object ifIndex, InterfaceAlias, Forwarding, ConnectionState
ifIndex InterfaceAlias Forwarding ConnectionState
------- -------------- ---------- ---------------
     12 SRV-VLAN30         Enabled      Connected
      1 Loopback Pseudo…  Disabled      Connected
```

**`SRV-VLAN30` 上的 `Forwarding : Enabled` 是 §7.7 中最重要的一行。** 沒有它，RRAS 會接受 VPN 連線且通道會建立，但 VPN 位址池的封包永遠到達不了 `10.10.30.0/24` —— 而其徵狀是一個「連上了，然後什麼都不通」的 VPN，即 §7.12 中的第一項。
```powershell
# ---- Static route so that return traffic to the VPN pool comes back through RRAS ----
New-NetRoute -DestinationPrefix '10.10.201.0/24' -InterfaceAlias 'SRV-VLAN30' `
    -NextHop 10.10.30.254 -RouteMetric 1 -PolicyStore PersistentStore

Get-NetRoute -AddressFamily IPv4 | Where-Object DestinationPrefix -like '10.10.201*' |
    Select-Object DestinationPrefix, NextHop, RouteMetric, PolicyStore, InterfaceAlias
```

```text
DestinationPrefix NextHop      RouteMetric PolicyStore     InterfaceAlias
----------------- -------      ----------- -----------     --------------
10.10.201.0/24    10.10.30.254           1 PersistentStore SRV-VLAN30
```

**關於下一躍點的[假設]。** 由於 RRAS 本身擁有該位址池，某些部署中更精確的配置是使用下一躍點為迴路／RAS 介面而非上游閘道的路由，因為 RRAS 已知該位址池對其自身而言是本地的。兩種形式在實務中均有出現。此處選擇上述形式（下一躍點 = VLAN 30 閘道 10.10.30.254，即 HSRP VIP），因為它使該路由*在核心的路由表中可見*，而這是一項有用的佐證，也因為路徑上缺少一條路由比主機上的特例更容易診斷。小組必須兩種都測試，並記錄哪一種產生了可用的回程流量。

#### 7.7.3 NAT 設計及其與 Linux nftables 邊緣的交互

這一小節必須精確說明本設計的雙防火牆安排，因為這是讀者最可能弄錯的地方。

**誰做什麼 —— 規範性陳述。**

[FIGURE: 遠端工作者的封包路徑圖 —— 筆記型電腦在外，ASA `VP-HQ-FW-01` 對外介面 198.51.100.1，UDP 500/4500 靜態 PAT 至 nftables VIP 10.10.50.10，nftables 配對，`VP-HQ-CORE-01/02`，以及 `vpnz-rras01` 終結 IKEv2 並從 10.10.201.10 – 10.10.201.200 指派位址。為每一躍標註執行該動作的裝置，並清楚標明 NAT（masquerade）僅在 nftables 配對上發生，絕不在 RRAS 上發生]
| 功能 | 裝置 | 佐證 |
|---|---|---|
| 對所有 `Z-SERVER` 及 `Z-USER` 至網際網路的流量進行具狀態輸出篩選、記錄及 **NAT（masquerade）** | **`vpnz-nft01`/`vpnz-nft02`**，表 `inet fyp_filter`，VIP 10.10.50.10 | `nft list ruleset`；面向 WAN 介面上的 `masquerade` 規則；`nft monitor` 及 `log prefix "NFT-DROP: "` 各行 |
| DMZ 邊界：ACL、已發佈服務的靜態 NAT、`inspect` 原則、syslog | **`VP-HQ-FW-01`**（ASA 5506-X，ASA 9.16(4)，於 Packet Tracer 中） | `show run`、`show nat`、`show logging` |
| **VPN 連接埠的 PAT**：UDP 500/4500 及 UDP 443（WireGuard）與 UDP 1194（OpenVPN），由 `198.51.100.5` 至 nftables VIP `10.10.50.10` | **ASA `VP-HQ-FW-01`** | 基準 §5.6 公開位址表 |
| **Windows 側 NAT** | **無。本設計中 RRAS 不執行 NAT** | 基準 §12.1 明確如此陳述 |

**為何 RRAS 不執行 NAT。** 三項理由，每一項都是設計立場而非偏好：

1. **第二個 NAT 邊界會破壞稽核軌跡。** 盡職審查清單要求一條可稽核的路徑。若 RRAS 亦執行轉譯，VPN 用戶端的來源位址將被改寫兩次，而要將一筆日誌記錄歸因於某位使用者，就必須在兩個不同平台上關聯兩份轉譯表。單一轉譯點（nftables）意味著只需讀取一份表。
2. **單一 NIC 的 RRAS 主機無法成為轉譯邊界。** 該主機在 `VNET-SRV` 上只有一個介面；沒有可供轉譯的對外介面。RRAS NAT 需要彼此不同的內部與外部介面。
3. **TB-06 已使 RRAS 無法直接從網際網路觸達。** 流量僅經由 ASA PAT 到達它。在 PAT 之後再加上 NAT，將是轉譯之後再轉譯，而這是 IPsec NAT-T 失效的經典成因 —— §7.12 中已記錄的失效模式。

**遠端工作者的端到端封包路徑，一次且精確地陳述：**
```text
[REMOTE WORKER → INTERNAL RESOURCE — the full path]
1.  Laptop (public address, e.g. 203.0.113.x) → IKEv2 to 198.51.100.5:UDP500, NAT-T 4500
2.  ISP / simulated Internet                        (Packet Tracer)
3.  VP-HQ-EDGE-01 eBGP AS 65001 to the provider     (Packet Tracer)
4.  VP-HQ-FW-01 (ASA) outside interface 198.51.100.1
        → static PAT: UDP 500/4500 → 10.10.50.10 (nftables VIP)
5.  vpnz-nft01/02 (keepalived VIP 10.10.50.10)
        → forward policy: UDP 500/4500 to 10.10.30.41 permitted
        → NAT happens HERE for outbound traffic; inbound VPN packets are DNAT'd, not masqueraded
6.  VP-HQ-CORE-01/02 (VLAN 50 → VLAN 30 routing, HSRP)
7.  vpnz-rras01 (10.10.30.41)
        → IKEv2 terminates, certificate authentication, NPS authorisation
        → client receives an address from 10.10.201.10 – 10.10.201.200
8.  Client traffic for 10.10.30.0/24, 10.10.90.0/24 etc. enters the internal network
        → the source address is now 10.10.201.x, and the static route sends the return path
          back to vpnz-rras01
9.  Return traffic: resource → vpnz-rras01 → encrypted → back down the same path
```

**兩項不得混淆的 NAT 陳述。** 在 nftables 配對上，`masquerade` 套用於*離開*朝 WAN 方向的流量；進入通道的 VPN 用戶端流量不被該配對執行 masquerade，因為它是被*遞送給*該配對的內部側。而在 ASA 上，UDP 500/4500 的 PAT 是四個連接埠對一個內部主機的**靜態**對應，這與用於由內向外流量的動態 PAT 不同。一份把「NAT」描述為單一事物的報告會弄錯此點；報告必須按裝置指名機制（Linux 上的 `masquerade`、ASA 上的 `static PAT`）。

**與分割通道的交互。** 由於設計上**停用**分割通道（基準 §12.1），VPN 用戶端會將*所有*流量經由通道送出，包括其網際網路流量。該流量隨後經 `vpnz-nft01/02` 輸出、在該處被 masquerade 並被記錄 —— 這正是客戶所要求的可稽核路徑。誠實陳明的副作用：nftables 配對成為頻寬瓶頸及遠端工作者的單一輸出點，而分割通道部署會更快。這是一項刻意的重安全於效能之選擇，並應如此寫入報告。

#### 7.7.4 遠端存取配置與憑證連結

RRAS 遠端存取配置於 `§7.8`，因為在本設計中唯一的遠端存取 VPN 是使用憑證驗證的 IKEv2。屬於此處的是*授權*那一半，由 NPS 交付（`vpnz-rras01` 同時是 RADIUS／NPS 伺服器 —— 連接埠矩陣 `P-18`），以及憑證連結。
```powershell
# ---- NPS client: RRAS is a RADIUS client of its own NPS instance ----
New-NpsRadiusClient -Name 'vpnz-rras01' -Address '10.10.30.41' `
    -SharedSecret (Read-Host -AsSecureString 'RADIUS shared secret (32 chars)') `
    -AuthAttributeRequired:$false

# ---- The two connection request policies that matter ----
# Policy 1: IKEv2 machine + user certificate, membership of GG-VPN-Users required.
# Policy 2: GG-VPN-ProfServices adds RDP to the platform tier (TB-11) and nothing else.

New-NpsConnectionRequestPolicy -Name 'CRP-IKEV2-Cert-Only' `
    -ProcessingOrder 1 `
    -AuthenticationProvider 'Windows' `
    -Condition (New-NpsCondition -Type 'NAS-Port-Type' -Value 'Virtual (VPN)') `
    -Condition (New-NpsCondition -Type 'Windows-Group' -Value 'VERTEXPEAK\GG-VPN-Users') `
    -AuthMethod 'EAP'
```

**關於 NPS Cmdlet 介面的[假設]。** `New-NpsConnectionRequestPolicy` 與 `New-NpsCondition` 的確切參數名稱，在本撰寫環境中對 Windows Server 2025 **未**獲確認。可靠且可移植的機制為下列之一：

- `netsh nps add crp name="CRP-IKEV2-Cert-Only" processingorder=1` 加上 `netsh nps add condition ...` 及 `netsh nps add authmethod ...`，以及
- `Import-NpsConfiguration -Path 'C:\FYP\config\nps-ikev2.xml'`，其中 `nps-ikev2.xml` 是以 `Export-NpsConfiguration` 從一個可運作的 NPS 主控台匯出。

本專案強烈偏好第二種，因為匯出的 XML 是**可提交至 Git 的產物**：它使 NPS 原則可審閱、可進行差異比對且可重現，而這正是盡職審查項目 5 所要求的。小組必須在 NPS 主控台（`nps.msc`）中配置該原則一次、將其匯出，並提交該匯出檔。

原則內容，不論交付機制為何：
| 元素 | 值 | 理由 |
|---|---|---|
| NAS-Port-Type 條件 | `Virtual (VPN)` | 將該原則限制於 VPN 連線，使其永不可能授權無線或有線要求 |
| Windows-Group 條件 | `VERTEXPEAK\GG-VPN-Users` | 唯一的授權來源。把某人加入 VPN 是一項群組變更，而非原則變更 |
| 驗證方法 | `EAP`（僅此） | 不用 MS-CHAPv2，不用 PAP。這使「僅憑證式」成為事實而非願景 |
| EAP 類型 | `Microsoft: Smart Card or other certificate`（EAP-TLS 式憑證 EAP） | 設計上禁止預先共用金鑰（基準 §12.1），且不得出現於任何原則中 |
| 閒置逾時 | 30 分鐘 | 可稽核的工作階段衛生 |
| 工作階段逾時 | 8 小時 | 將被竊用戶端憑證的壽命限制在一個工作日之內 |
| 加密 | 可用的最強者：AES-256 / SHA-256 及以上；**不得**使用 DES、3DES 或 SHA-1 | 基準強化要求 |
| 帳戶處理 | RADIUS 帳戶處理至 NPS 本機日誌（`P-18`，1813/udp） | 提供盡職審查清單所要求的連線稽核軌跡 |

**憑證連結，直白陳述。** 有三張憑證參與一個 IKEv2 連線，而它們每一項要求都來自 §7.4：

1. **伺服器憑證**位於 `vpnz-rras01`：主體 `CN=vpn.vertexpeak.fyp.lab`，SAN `vpn.vertexpeak.fyp.lab` 及 `vpnz-rras01.vertexpeak.fyp.lab`，來自 `RAS and IAS Server` 範本。用戶端會以所撥號的位址驗證*伺服器*的名稱，因此伺服器憑證必須包含用戶端使用的名稱 —— 即解析至 VIP 10.10.50.10 的 `vpn.vertexpeak.fyp.lab`，而非該主機自身的名稱。
2. **機器憑證**位於用戶端，來自具 `Client Authentication` EKU 的 `Workstation Authentication` 範本，由 `GPO-WS-Cert-AutoEnrol` 自動註冊（§7.4.5）。
3. **使用者憑證**位於用戶端，來自 `User` 範本，同樣自動註冊，用於 EAP 驗證中的使用者那一半。

同時要求機器與使用者憑證，是本設計對盡職審查項目 3 的回答。單獨一台被竊的筆記型電腦無法連線（沒有使用者憑證）；單獨一張被竊的使用者憑證也無法連線（沒有機器憑證）。其代價是誠實的且必須陳明：憑證註冊成為一項佈建相依性，而自動註冊失敗的用戶端完全無法連線 —— 這正是 §7.12 將自動註冊失敗列為五大疑難排解案例之一的原因。

#### 7.7.5 驗證
| # | 檢查 | 確切指令 | 預期結果 |
|---|---|---|---|
| RRAS-01 | 角色已安裝並配置 | `Get-RemoteAccess \| Select RemoteAccessServer, VpnStatus, VpnS2SStatus, RoutingStatus` | `VpnStatus Enabled`、`RoutingStatus Installed` |
| RRAS-02 | 內部介面上已啟用轉送 | `Get-NetIPInterface -AddressFamily IPv4 \| Select InterfaceAlias, Forwarding` | `SRV-VLAN30` → `Enabled` |
| RRAS-03 | 靜態位址池路由存在且具持續性 | `Get-NetRoute -DestinationPrefix '10.10.201.0/24'` | 一條路由，`PolicyStore PersistentStore` |
| RRAS-04 | 整份 IP 路由表已擷取為佐證 | `Get-NetRoute -AddressFamily IPv4 \| Sort-Object DestinationPrefix \| Format-Table -AutoSize` | 包含直接連接的 `10.10.30.0/24`、經 10.10.30.254 的預設路由，以及 `10.10.201.0/24` 位址池路由 |
| RRAS-05 | 介面狀態與計量 | `Get-NetIPInterface -AddressFamily IPv4 \| Select ifIndex, InterfaceAlias, NlMtu, InterfaceMetric, ConnectionState` | `SRV-VLAN30` 為 `Connected`，計量與 VLAN 30 的優先順序一致 |
| RRAS-06 | **流量確實被路由** | 從 VPN 用戶端執行 `tracert 10.10.30.11 -h 5`；從 `vpnz-rras01` 執行 `Test-NetConnection 10.10.30.11 -TraceRoute` | 路徑追蹤經過 `vpnz-rras01`（10.10.30.41）然後到達該 DC；並未直接經由預設閘道 |
| RRAS-07 | 路由在另一方向亦有效 | 在 `vpnz-dc01` 上：`tracert 10.10.201.10 -h 5` | 第一躍 10.10.30.254（HSRP VIP），然後 10.10.30.41，然後該用戶端 |
| RRAS-08 | NPS 見到該 RRAS 用戶端 | `Get-NpsRadiusClient`；NPS 日誌位於 `C:\Windows\System32\LogFiles\IN*.log` | 列出 `vpnz-rras01`；連線後存在帳戶處理記錄 |
| RRAS-09 | 未授權使用者被拒絕 | 從 `GG-VPN-Users` 移除一個測試帳戶，嘗試連線 | IKEv2 建立，然後 RAS 授權失敗；NPS 事件 6273 附原因碼；`RasClient` 事件 20227 |
| RRAS-10 | 不可能使用預先共用金鑰的 IKEv2 | `Get-VpnAuthProtocol`；嘗試以 PSK 連線 | `UserAuthProtocol : EAPHOST`；PSK 嘗試依原則失敗。這是「不使用共用密碼」要求已達成之佐證 |
| RRAS-11 | 連線期間可見 RAS 介面 | `Get-NetIPInterface \| Where-Object InterfaceAlias -like '*RAS*'`；`Get-NetIPAddress -AddressFamily IPv4 \| Where-Object IPAddress -like '10.10.201.*'` | 存在一個持有位址池位址的 RAS 介面 |
| RRAS-12 | RRAS 不執行 NAT | `Get-NetNat` | 不存在任何 NAT 物件。這是 §7.7.3 中「NAT 屬於 nftables 配對」陳述的佐證 |

**「流量已被路由」的示範，以真正能說服讀者的形式。**

Ping 證明可達性。證明*路由*的是路徑可見，且移除該路由會使其中斷。因此佐證集為三份擷取：

1. 來自 VPN 用戶端的 `tracert` 顯示路徑中有 `vpnz-rras01`。
2. `vpnz-rras01` 上的 `Get-NetIPInterface` 顯示 `SRV-VLAN30` 為 `Forwarding Enabled`。
3. **負向對照**：停用轉送（`Set-NetIPInterface -InterfaceAlias 'SRV-VLAN30' -Forwarding Disabled`），嘗試相同的 ping，擷取該失敗，然後重新啟用並擷取復原。
```text
[ROUTING NEGATIVE CONTROL — evidence set]
# 1. Baseline: reachability works
PS C:\> Test-NetConnection 10.10.30.11 -InformationLevel Quiet
True

# 2. Disable forwarding on vpnz-rras01
PS C:\> Set-NetIPInterface -InterfaceAlias 'SRV-VLAN30' -Forwarding Disabled
PS C:\> Get-NetIPInterface -InterfaceAlias 'SRV-VLAN30' | Select InterfaceAlias, Forwarding
InterfaceAlias Forwarding
-------------- ----------
SRV-VLAN30       Disabled

# 3. The same ping now fails from the VPN client
PS C:\> ping 10.10.30.11
Request timed out.
Request timed out.
Request timed out.

# 4. Re-enable and prove recovery
PS C:\> Set-NetIPInterface -InterfaceAlias 'SRV-VLAN30' -Forwarding Enabled
PS C:\> ping 10.10.30.11
Reply from 10.10.30.11: bytes=32 time=3ms TTL=127
```

負向對照是多數學生報告所省略的部分，而它正是把「它能運作」轉化為「我理解它*為何*能運作」的部分。它應以測試案例 ID 置於 `06-verification/`。

---

### 7.8 使用憑證驗證的 IKEv2 VPN

#### 7.8.1 為何選擇 IKEv2，及其與替代方案的比較

**誠實說明。** `IKEv2` 在 WSOS 2026 文本及原始 HTML 中出現 **0 次**，在 2024 版中出現 0 次。最接近且可引用的條目，是領域 3 要求 `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.` —— 其中點名了 **IPSec** —— 以及領域 3 的 know/understand 條目 `Security protocols to secure local and wide area networks`。IKEv2 是一項依主題表而證成的專案選擇，經由 IPSec 與標準搭起橋樑，且必須呈現為一座橋樑，而非一則引文。

**比較，僅限於本專案實際建置的內容。**
| 屬性 | **RRAS IKEv2（本設計）** | SSTP（同一角色，未建置） | L2TP/IPsec（同一角色，未建置） | OpenVPN（`vpnz-lnxra01`） | WireGuard（`vpnz-nft01/02`） |
|---|---|---|---|---|---|
| 執行位置 | `vpnz-rras01`，Windows Server 2025 | 同一角色，Windows | 同一角色，Windows | Ubuntu 24.04.3，OpenVPN 2.6.x | Ubuntu 24.04.3，`wireguard-tools` 1.0.20210914 |
| 傳輸 | UDP 500/4500（NAT-T） | TCP 443（SSTP over TLS） | UDP 500/4500 | UDP 1194 | UDP 443 |
| 驗證 | **憑證式 EAP，機器 + 使用者憑證** | 使用者名稱／密碼或憑證 | **預先共用金鑰或憑證** —— PSK 是常見預設，且為本設計所禁止 | 來自 Easy-RSA 的 X.509 用戶端憑證 | 公開金鑰同儕 |
| NAT 穿透 | 原生 NAT-T | 輕易（TCP 443） | 原生 NAT-T | 良好 | 以 UDP 為基礎；運作良好 |
| 與非 Windows 用戶端的互通性 | 差；原生 Windows／Apple 才是實務上的用戶端 | 差 | 尚可 | 優異（Linux、macOS、iOS、Android） | 在 Linux 上優異，其他地方持續改善 |
| 平台整合 | 內建於 Windows；由 GPO 推送為連線設定檔；顯示於 `Get-VpnConnection` | 相同 | 相同 | 需要第三方用戶端（或 `openvpn3`） | 需要第三方用戶端 |
| 可稽核性 | NPS 日誌 + `RasClient` 事件日誌 + `Get-VpnConnection` | 相同 | 相同 | OpenVPN 狀態日誌 | 預設無帳戶處理 |
| 為何選擇／不選 | **採用**：它是唯一同時提供僅憑證式驗證*及*深度 Windows 平台整合的選項，而這正是盡職審查項目所要求的 | 否決：TLS-over-443 對防火牆穿透有吸引力，但本設計已有兩條以 TLS 為基礎的遠端存取路徑（OpenVPN 與反向代理），SSTP 不會增添新能力，只會多出第三個需保護的 TLS 端點 | **使用 PSK 者**直接否決：共用機密正是客戶所禁止的。使用憑證驗證的 L2TP/IPsec 雖可行但未建置，因此必須列為未建置，而非暗示已建 | Linux 側獨立的第二套實作。交叉參照報告 §8，**此處不重複** | Linux 邊緣上的站對站及遠端工作者通道。交叉參照報告 §8，**此處不重複** |

**為何單一設計中存在多於一種遠端存取技術 —— 以及為何那不算重複。** 基準刻意為三種不同理由實作三種遠端存取機制：Windows 上的 IKEv2，用於 Wintel 整合、僅憑證的員工 VPN；Linux 上的 OpenVPN，作為獨立實作的參考，使兩者可被誠實比較；WireGuard，作為輕量站對站通道。報告的比較章節（Linux 見報告 §8，此處見 §7.8.1）利用此共存，提出單一技術專案無法提出的論證。此舉所產生的*風險* —— 三個端點、三套憑證存放區、三組需防護的連接埠 —— 是真實的，並由 TB-06 緩解：該規則將可從網際網路觸達的 VPN 連接埠限制為單一公開位址上恰好 UDP 443、UDP 500/4500 及 UDP 1194。

#### 7.8.2 伺服器側配置
```powershell
# ---- 7.8.2 On vpnz-rras01, after §7.7 ----
# 1. Install and configure the remote-access role as a VPN server
Install-RemoteAccess -VpnType Vpn

# 2. Create the static IPv4 address pool from the baseline (10.10.201.0/24,
#    pool 10.10.201.10 - 10.10.201.200, per IKEV2-RAS-POOL in baseline §5.4)
Set-VpnServerIPAddressRange -StartIPAddress '10.10.201.10' -EndIPAddress '10.10.201.200'
Get-VpnServerIPAddressRange
```

```text
[VPN ADDRESS POOL — vpnz-rras01]
PoolName         : VpnPool
StartIPAddress   : 10.10.201.10
EndIPAddress     : 10.10.201.200
PoolType         : Static
```

該位址池是**靜態的，而非以 DHCP 為基礎**，其理由是設計立場而非便利：靜態位址池意味著每個 VPN 用戶端位址均為預先已知，因此引用 `10.10.201.14` 的防火牆規則、ACL 項目或稽核日誌行，無須查閱租用資料庫即可解讀。它同時移除一項相依性：若 DHCP 不可用，由 DHCP 指派的 VPN 位址池將無法分配，而通道會在無位址的情況下建立。基準 §5.4 將該範圍固定為 `10.10.201.0/24`（靜態，`10.10.201.10 – 10.10.201.200`），即本設計中唯一的 IKEv2 位址池，且沒有為它設 DHCP 範圍（Rev 1.1 裁決 C-21）；它刻意不與 `10.10.0.0/16`、`10.20.20.0/16` 或 `10.70.0.0/16` 重疊，亦不使用未分配的 `172.16.0.0/16` 餘裕空間。
```powershell
# 3. Set the authentication protocol: EAP only. No MS-CHAPv2, no PSK.
Set-VpnAuthProtocol -UserAuthProtocol EAP `
    -TunnelAuthProtocols EAP `
    -RootCertificateNameToAccept 'CN=VP-ISSUING-CA-01, DC=vertexpeak, DC=fyp, DC=lab' `
    -PassThru

Get-VpnAuthProtocol | Format-List
```

```text
[VPN AUTH PROTOCOL — vpnz-rras01]
UserAuthProtocol                  : EAPHOST
TunnelAuthProtocols               : EAP
RootCertificateNameToAccept       : CN=VP-ISSUING-CA-01, DC=vertexpeak, DC=fyp, DC=lab
CertificateADAuthEnabled          : False
MachineCertificateEKUFilter       : 1.3.6.1.5.5.7.3.2
UserCertificateEKUFilter          : 1.3.6.1.5.5.7.3.2
```

兩個 EKU 篩選條件都是 `1.3.6.1.5.5.7.3.2`（**Client Authentication**）。正是這個值阻止一張有效但用途錯誤的憑證 —— 例如同一部機器上的網頁伺服器憑證 —— 被接受用於 VPN 驗證。這是整個設計中較為默默重要的設定之一。
```powershell
# 4. IPsec parameters: strong crypto, no weak fallbacks
Set-VpnServerIPsecConfiguration -EncryptionType MaximumEncryption `
    -SADataSizeForRenegotiationKilobytes 102400 `
    -SALifeTimeSeconds 28800 `
    -PassThru

Get-VpnServerIPsecConfiguration | Format-List
```

```text
[VPN IPSEC CONFIGURATION — vpnz-rras01]
EncryptionType                        : MaximumEncryption
SADataSizeForRenegotiationKilobytes   : 102400
SALifeTimeSeconds                     : 28800
```

**解讀 `MaximumEncryption`。** 在 RRAS 中，此值會選取可用的最強 IKEv2／IPsec 提案集（AES-256、SHA-256/384、DH 群組 14 或以上），並從所提供的清單中移除 DES、3DES、SHA-1 及 DH 群組 1/2。替代值為 `RequireEncryption` 與 `OptionalEncryption`；`OptionalEncryption` 會允許明文回退，在本設計中絕不可使用。**[假設]** 在所鎖定的組建上該列舉字串為 `MaximumEncryption`。若 `Set-VpnServerIPsecConfiguration` 拒絕它，可見的替代值為 `RequireEncryption` 與 `OptionalEncryption`；**僅**在已記錄的回退情況下接受 `RequireEncryption` 並記錄該偏差，因為它可能允許比設計所意圖更弱的提案。
```powershell
# 5. Certificate binding: RRAS must be told which certificate to present.
#    Confirmed by inspection after the §7.4 autoenrolment has delivered it.
Get-ChildItem Cert:\LocalMachine\My |
    Where-Object { $_.Subject -eq 'CN=vpn.vertexpeak.fyp.lab' } |
    Select-Object Subject, Thumbprint, NotAfter, HasPrivateKey
```

```text
Subject                     Thumbprint                               NotAfter             HasPrivateKey
-------                     ----------                               --------             -------------
CN=vpn.vertexpeak.fyp.lab   9C41D2F7A8B33E6150C0E4A9D17E2B8F4A63D0C1 2027-11-07 10:12:17           True
```

`HasPrivateKey : True` 是必須的。一張在沒有私密金鑰的情況下匯入的憑證會出現在存放區中、看似有效，並會靜默地使 IKEv2 伺服器驗證失敗 —— 即 §7.12 中的第五項。
```powershell
# Bind the certificate to the RAS SSTP/IKEv2 listener and record the binding
netsh http show sslcert                       # for SSTP (not used, shown for completeness)
# For IKEv2 the certificate selection is performed by RRAS from the machine store, filtered by EKU.
# Force a refresh of the RRAS certificate selection:
Restart-Service RemoteAccess
Get-RemoteAccess | Select-Object RemoteAccessServer, VpnStatus, VpnS2SStatus
```

**[假設]** Windows Server 上的 RRAS 是透過將 SAN／EKU 與用戶端所撥號的位址比對，從機器存放區選取其 IKEv2 伺服器憑證，而非透過明確的繫結 Cmdlet。SSTP 憑證繫結有已記錄的 `netsh` 介面，但在本撰寫環境的知識中，IKEv2 並無對等者。對小組的實際後果：若用戶端回報錯誤 **13801 / 13806**（「伺服器上的憑證未正確配置」／「無法驗證伺服器的憑證」），修正方向是憑證問題 —— 最常見為缺少 SAN 項目或缺少私密金鑰 —— 而非 RRAS 配置問題，且診斷應從 `certutil -verify` 及 SAN 清單開始，而非從 RRAS 開始。
```powershell
# ---- Firewall rules required on vpnz-rras01 ----
# Inbound IKEv2 / IPsec NAT-T
New-NetFirewallRule -DisplayName 'VP-IKEv2-UDP500' -Direction Inbound -Protocol UDP `
    -LocalPort 500 -Action Allow -Profile Domain
New-NetFirewallRule -DisplayName 'VP-IKEv2-NAT-T-UDP4500' -Direction Inbound -Protocol UDP `
    -LocalPort 4500 -Action Allow -Profile Domain
New-NetFirewallRule -DisplayName 'VP-ESP' -Direction Inbound -Protocol 50 `
    -Action Allow -Profile Domain
# RADIUS (NPS accounting, P-18)
New-NetFirewallRule -DisplayName 'VP-NPS-RADIUS-Auth' -Direction Inbound -Protocol UDP `
    -LocalPort 1812 -Action Allow -Profile Domain
New-NetFirewallRule -DisplayName 'VP-NPS-RADIUS-Acct' -Direction Inbound -Protocol UDP `
    -LocalPort 1813 -Action Allow -Profile Domain
# Management
New-NetFirewallRule -DisplayName 'VP-WinRM-HTTPS' -Direction Inbound -Protocol TCP `
    -LocalPort 5986 -RemoteAddress 10.10.30.31,10.20.20.0/24 -Action Allow -Profile Domain
New-NetFirewallRule -DisplayName 'VP-RDP-Mgmt' -Direction Inbound -Protocol TCP `
    -LocalPort 3389 -RemoteAddress 10.20.20.0/24 -Action Allow -Profile Domain

Get-NetFirewallRule -DisplayName 'VP-*' | Select-Object DisplayName, Enabled, Direction, Action
```

**其他位置** *必須存在的防火牆規則 —— 容易遺忘的部分。*
| 規則 | 裝置 | 確切形式 | 理由 |
|---|---|---|---|
| UDP 500/4500 靜態 PAT 至 10.10.50.10 | ASA `VP-HQ-FW-01` | `object network OBJ-VPN-RRAS` / `nat (inside,outside) static interface service udp 500 500`（以及 4500） | 沒有它，IKEv2 封包永遠離不開 ASA |
| UDP 500/4500 轉送允許至 10.10.30.41 | nftables `vpnz-nft01/02`，表 `inet fyp_filter` | 在 forward 鏈中、drop 之前：`udp dport { 500, 4500 } ip daddr 10.10.30.41 accept` | nftables 配對內聯位於 ASA 與核心之間，因此一個被 ASA 允許的封包仍可能被 Linux 配對丟棄。**這是本設計中正確建置的 VPN 最常見的失效原因** |
| 若存在 ESP 則需存取清單 | ASA | `access-list ACL-VPN-IN extended permit udp any host 198.51.100.5 eq 500` | Packet-Tracer 的 ASA 行為必須被擷取，而非假設 |
| 位址池的輸出允許 | nftables 配對 | 在 NAT 與 forward 鏈中允許以 `ip saddr 10.10.201.0/24` 為來源群組 | 由於分割通道已關閉，遠端工作者的網際網路流量由此輸出，必須依 §7.7.3 執行 masquerade |

```powershell
# Verify each of the three layers independently before blaming the VPN
Test-NetConnection 10.10.30.41 -Port 500 -InformationLevel Detailed   # UDP is not tested by Test-NetConnection; use the tests below
Get-NetFirewallRule -DisplayName 'VP-IKEv2-*' | Select DisplayName, Enabled, Action
# On the nftables pair:
ssh root@10.10.50.11 'nft list chain inet fyp_filter forward | grep -E "500|4500"'
# On the ASA (Packet Tracer CLI):
#   show nat
#   show access-list | include 500
#   show crypto ikev2 sa
```

#### 7.8.3 用戶端側配置

##### 產生用戶端連線套件

存在兩種機制，而本專案以第二種為主，因為它可指令碼化、因而可審閱。

**選項 A —— RRAS 主控台精靈（僅供示範）。** `rrasmgmt.msc` → *Remote Access* → *Create Connection Package* 會產生一個 `.exe` 或一組配置檔，在用戶端上安裝一個 VPN 連線。它快速，且產生一個可供螢幕擷取的具體產物，但所產生的套件是二進位內容，無法在 Git 中審閱，變更時也無法進行差異比對。它在示範中使用一次，並記錄為並非交付機制。

**選項 B —— GPO 加上 `Add-VpnConnection`（實際機制）。** 連線設定檔以兩種方式交付，且兩者均被擷取：

- **手動／指令碼化**，用於示範及未加入網域的用戶端，使用 `Add-VpnConnection` 並陳明每個參數。
- **由群組原則**，透過連結至 `OU=Users/OU=RemoteAndContractors` 的 `GPO-WS-IKEv2-VPN-Profile`（基準 §9.3），這是可擴展至 40 名出差員工而無須逐台筆記型電腦操作的機制。
```powershell
# ---- 7.8.3 Manual client provisioning (run on the client as an administrator) ----
$vpnName = 'VP-IKEv2-Cert'
$server  = 'vpn.vertexpeak.fyp.lab'

# Precondition: the machine and user certificates already exist from autoenrolment
Get-ChildItem Cert:\LocalMachine\My, Cert:\CurrentUser\My |
    Where-Object { $_.Issuer -like '*VP-ISSUING-CA-01*' } |
    Select-Object Subject, Thumbprint, NotAfter
# Expected: one machine certificate (LocalMachine) and one user certificate (CurrentUser).

Add-VpnConnection `
    -Name $vpnName `
    -ServerAddress $server `
    -TunnelType Ikev2 `
    -AuthenticationMethod Eap `
    -EncryptionLevel Maximum `
    -SplitTunneling:$false `
    -RememberCredential:$false `
    -Force

# Attach the certificate-based EAP configuration (this is the part most examples omit)
Add-VpnConnectionTriggerDnsConfiguration -DnsSuffix 'vertexpeak.fyp.lab' `
    -DnsServers 10.10.30.11,10.10.30.12 -PassThru -ConnectionName $vpnName

# Enable certificate EAP explicitly and require the client certificate
Set-VpnConnection -Name $vpnName -AuthenticationMethod Eap -EncryptionLevel Maximum
Set-VpnConnectionIPsecConfiguration -ConnectionName $vpnName `
    -AuthenticationTransformConstants SHA256128 `
    -CipherTransformConstants AES256 `
    -EncryptionMethod AES256 `
    -IntegrityCheckMethod SHA256 `
    -DHGroup Group14 `
    -PfsGroup PFS2048 `
    -Force
```

**關於 `Set-VpnConnectionIPsecConfiguration` 參數值的[假設]。** 這些參數*名稱*（`-AuthenticationTransformConstants`、`-CipherTransformConstants`、`-EncryptionMethod`、`-IntegrityCheckMethod`、`-DHGroup`、`-PfsGroup`）是 Windows 10/11 上 IKEv2 自訂 IPsec 設定的介面，預期在所鎖定的用戶端作業系統上存在。上述*值*是為配合伺服器的 `MaximumEncryption` 設定檔而選擇；若用戶端拒絕某個值，正確程序是在可運作的用戶端上執行 `Get-VpnConnectionIPsecConfiguration`，讀取它實際接受了什麼，並記錄下來。用戶端與伺服器 IPsec 提案之間的不符，是「通道完成交涉後隨即中斷」的經典成因之一，且已列於 §7.12 登記冊中。
```powershell
# ---- 7.8.3 Delivery by Group Policy (the scalable mechanism) ----
# GPO-WS-IKEv2-VPN-Profile, linked to OU=Users/OU=RemoteAndContractors
#   Computer Configuration > Preferences > Windows Settings > ... OR
#   User Configuration > Preferences > Control Panel Settings > ... is NOT the right vehicle for VPN.
# The practical GPO-compatible vehicles are:
#   (a) a CMakeProfile/PowerShell startup script distributed by GPO which runs the Add-VpnConnection
#       block above, and
#   (b) CMAK-generated profile files deployed by GPO preference.
# Vehicle (a) is chosen here because the script is reviewable, diffable and testable.

# The script is committed as 04-automation/powershell/New-VpnClientProfile.ps1 and its run log
# is the evidence that it executed on each client.
```

**誠實的限制。** `Add-VpnConnection` 是每位使用者（或使用 `-AllUserConnection` 時每部機器）。以群組原則部署 VPN 設定檔，並沒有像某些其他設定那樣乾淨的內建「這是 VPN 設定檔」喜好設定，因此本專案使用指令碼化部署。報告必須將其描述為*經由 GPO 的指令碼化部署*，而非*原生 GPO VPN 設定檔交付*，因為該區分是可查核的，弄錯將屬過度主張。
```powershell
# ---- Connect and inspect, on the client ----
Get-VpnConnection -Name 'VP-IKEv2-Cert' |
    Select-Object Name, ServerAddress, TunnelType, AuthenticationMethod, EncryptionLevel,
                  SplitTunneling, RememberCredential, ConnectionStatus, DnsSuffix
```

```text
[VPN CLIENT PROFILE — Windows 11 client]
Name                 : VP-IKEv2-Cert
ServerAddress        : vpn.vertexpeak.fyp.lab
TunnelType           : Ikev2
AuthenticationMethod : {Eap}
EncryptionLevel      : Maximum
SplitTunneling       : False
RememberCredential   : False
ConnectionStatus     : Disconnected
DnsSuffix            : vertexpeak.fyp.lab
```

#### 7.8.4 分割通道與完整通道

**決策，由基準固定：** 分割通道**已停用**。所有用戶端流量均經由通道傳送（基準 §12.1）。
| 面向 | 完整通道（採用） | 分割通道（否決） |
|---|---|---|
| 用戶端路由表 | 一條以 VPN 介面為下一躍點的 `0.0.0.0/0` 路由，加上本機子網路路由 | 只有特定的公司前置碼經由通道；預設路由留在本機介面卡上 |
| 安全 | 遠端工作者送出的每個封包均在 `vpnz-nft01/02` 被篩選、NAT 及記錄。一部失陷的筆記型電腦在連線期間無法經由其自身的家用網際網路連線外洩資料 | 公司流量受保護；其他一切完全繞過公司控制。一部失陷的筆記型電腦有一條直接、未經記錄的網際網路路徑 |
| 可稽核性 | 一個輸出點、一份日誌、一份來源 NAT 表。這是對盡職審查項目 2 的直接回答 | 兩個輸出點，且對非公司那一個毫無可見性 |
| 效能 | 所有流量，包括串流與大型下載，均穿越實驗室。在單一 Hypervisor 主機上這明顯較慢 | 網際網路流量使用本機路徑，較快 |
| 失效行為 | 若通道中斷，使用者失去所有連線 —— 包括網際網路存取。這是響亮且明顯的 | 若通道中斷，使用者在觸及公司資源之前不會察覺任何事。這是安靜的，且是真實的安全問題：它為「強制入口網站（captive portal）」式的憑證擷取攻擊創造條件 |
| 設計契合度 | 符合 `GG-VPN-ProfServices` 對平台層受控存取的需求，並符合客戶的「可稽核路徑」要求 | 只有在效能代價不可接受時才站得住腳，而在實驗室中並非如此 |

**路由在機制上如何被推送。** 使用 `-SplitTunneling:$false` 時，Windows 用戶端在連線時將一條預設路由安裝至通道中，並從生效路由表移除本機預設路由。這正是*伺服器側*也必須正確的原因：用戶端的網際網路流量到達 `vpnz-rras01`、被轉送至內部預設閘道、穿越 nftables 配對、在該處被 masquerade，然後經 ASA 離開。上述每一躍都必須允許 `10.10.201.0/24`，若其中任一躍不允許，徵狀便是「VPN 連上了、內部網站可用但其他都不通」—— 這與「VPN 連上了但什麼都不通」是不同的失效，§7.12 基於該理由將兩者分開。

路由表的佐證是必須的，因為它是該設計選擇確實被實作的證明：
```powershell
# While connected:
Get-VpnConnection -Name 'VP-IKEv2-Cert' | Select-Object SplitTunneling, ConnectionStatus

# Prove that the VPN default route exists and took priority
Get-NetRoute -AddressFamily IPv4 | Where-Object { $_.DestinationPrefix -eq '0.0.0.0/0' } |
    Sort-Object RouteMetric | Select-Object DestinationPrefix, NextHop, RouteMetric, InterfaceAlias, InterfaceMetric

# Prove the effective route table the TCP/IP stack is actually using
Find-NetRoute -RemoteIPAddress 10.10.30.11 | Select-Object IPAddress, InterfaceAlias, NextHop
Find-NetRoute -RemoteIPAddress 8.8.8.8      | Select-Object IPAddress, InterfaceAlias, NextHop
# Both must resolve via the VPN interface, not the physical adapter. The second one is the
# evidence that full tunnelling (not split tunnelling) is actually in force.
```

**[假設]** 使用 `8.8.8.8` 作為探查目的地，在精神上違反了文件用途範圍。本實驗室沒有真實的網際網路，因此此測試的正確探查目標，是設計中已有的 RFC 5737 範圍模擬公開位址 —— 例如模擬供應商解析器 `192.0.2.53`。報告在擷取的記錄中必須使用 `192.0.2.53`，而非真實的公開位址。

#### 7.8.5 驗證
| # | 檢查 | 確切指令（除另行註明外均在用戶端上） | 預期結果 |
|---|---|---|---|
| VPN-01 | 設定檔存在且參數正確 | `Get-VpnConnection -Name 'VP-IKEv2-Cert'` | `TunnelType Ikev2`、`AuthenticationMethod {Eap}`、`EncryptionLevel Maximum`、`SplitTunneling False` |
| VPN-02 | 雙方均有憑證 | 用戶端：`Get-ChildItem Cert:\LocalMachine\My, Cert:\CurrentUser\My`；伺服器：`Get-ChildItem Cert:\LocalMachine\My` | 用戶端有機器 + 使用者憑證，`vpnz-rras01` 上有 RAS 伺服器憑證，全部由 `VP-ISSUING-CA-01` 簽發 |
| VPN-03 | 連線成功 | `rasdial 'VP-IKEv2-Cert'`，然後 `Get-VpnConnection -Name 'VP-IKEv2-Cert' \| Select ConnectionStatus` | `Connected` |
| VPN-04 | 用戶端已取得位址池位址 | `Get-NetIPAddress -AddressFamily IPv4 \| Where-Object InterfaceAlias -like '*VPN*'` | 一個位於 `10.10.201.10 – 10.10.201.200` 之內的位址 |
| VPN-05 | 通道承載流量至預定子網路 | `ping 10.10.30.11`、`Test-NetConnection 10.10.30.21 -Port 445`、`Test-NetConnection 10.10.90.21 -Port 443` | 全部成功；注意若嚴格解讀 TB-11，DMZ 測試預期**僅**對 `GG-VPN-ProfServices` 成功，否則以 TB-01 為準，結果必須記錄為一項發現 |
| VPN-06 | **通道僅承載流量至預定子網路** | 對一位屬於 `GG-VPN-Users` 但不屬 `GG-VPN-ProfServices` 的使用者執行 `Test-NetConnection 10.10.30.11 -Port 3389`；對任何 VPN 使用者執行 `Test-NetConnection 10.20.20.31 -Port 3389` | 兩者均失敗。前者為 TB-01（`RDP is not permitted for ordinary users`），後者為 TB-12（`VPN users are never administrators of infrastructure`） |
| VPN-07 | 完整通道正在生效 | `Find-NetRoute -RemoteIPAddress 192.0.2.53 \| Select IPAddress, InterfaceAlias, NextHop` | 經由 VPN 介面解析，而非實體介面卡 |
| VPN-08 | 伺服器側工作階段可見 | 在 `vpnz-rras01` 上：`Get-NetIPInterface \| Where InterfaceAlias -like '*RAS*'`；NPS 帳戶處理日誌 | 存在一個 RAS 介面；有一筆該使用者的帳戶處理記錄，含開始時間與 NAS 位址 |
| VPN-09 | 伺服器側 IPsec 狀態 | 在 `vpnz-rras01` 上：`Get-NetIPsecMainModeSA`、`Get-NetIPsecQuickModeSA` | 至少一個主模式及一個快速模式 SA，且同儕位址符合預期 |
| VPN-10 | **事件日誌佐證，成功路徑** | 用戶端：`Get-WinEvent -LogName 'Microsoft-Windows-RasClient/Operational' -MaxEvents 20`；伺服器：`Get-WinEvent -LogName 'Microsoft-Windows-RemoteAccess/Operational' -MaxEvents 20` | 用戶端：事件 **20221**（連線已建立）及視情況的 **20222**／**20227**。伺服器：IKEv2 SA 已建立、使用者已授權 |
| VPN-11 | **事件日誌佐證，失敗路徑** | 以刻意錯誤的配置：`Get-WinEvent -LogName 'Microsoft-Windows-RasClient/Operational'` | 事件 **20227** 附明確原因字串（例如 *The remote connection was not made because the attempted VPN tunnels failed*），加上 IKEv2 失敗的事件 **20223**／**20226**。這是整個 VPN 建置中最有用的單一診斷產物 |
| VPN-12 | 錯誤憑證情況被拒絕 | 從測試用戶端移除使用者憑證，重新連線 | 連線以憑證／EAP 錯誤失敗；伺服器側 NPS 事件 6273 附原因碼。證明憑證驗證確實被強制執行 |
| VPN-13 | 不接受預先共用金鑰 | 嘗試以 PSK 配置的連線 | 失敗。證明「不使用共用密碼」要求已達成，而非僅止於文件記載 |
| VPN-14 | 中斷連線乾淨 | `rasdial 'VP-IKEv2-Cert' /disconnect`；然後 `Get-VpnConnection -Name 'VP-IKEv2-Cert' \| Select ConnectionStatus`；NPS 帳戶處理停止記錄 | `Disconnected`；一筆含工作階段時長的停止記錄 |
| VPN-15 | 位址池位址會被釋放並重複使用 | 依序連接兩個用戶端；在各自上執行 `Get-NetIPAddress` | 各自取得位址池中不同的位址；第一個用戶端的位址可供重複使用 |

**應檢查的事件 ID 及其各自含義。** 這些是測試者在建置 VPN 時應在第二個視窗中保持開啟的 ID，因為它們把含糊的「連不上」轉化為具體成因：
| 日誌 | 事件 ID | 含義 | 首要動作 |
|---|---|---|---|
| `Microsoft-Windows-RasClient/Operational` | **20221** | 連線成功建立 | 無 —— 這是成功標記 |
| `Microsoft-Windows-RasClient/Operational` | **20227** | 連線失敗；附原因文字 | 先讀取原因字串；它會指名失敗的階段 |
| `Microsoft-Windows-RasClient/Operational` | **20223**、**20226** | IKEv2 交涉／驗證階段失敗 | 檢查伺服器憑證 SAN 及 CRL 可達性 |
| `Microsoft-Windows-RasClient/Operational` | **20224** | 用戶端上與憑證相關的失敗 | 確認用戶端憑證的 `HasPrivateKey` 及 EKU |
| `Microsoft-Windows-RemoteAccess/Operational` | SA 已建立事件 | 伺服器已接受主模式／快速模式 SA | 若不存在，失敗發生在授權之前 —— 檢查 nftables forward 鏈 |
| `Security` | **6272 / 6273**（NPS） | 已授予存取／已拒絕存取並附原因碼 | 附原因 *"The user is not a member of the required group"* 的 6273 是 `GG-VPN-Users` 成員資格問題，而非 VPN 問題 |
| `Security` | **4625** | 登入失敗 | 區分憑證問題與通道問題 |
| `Security` | **4624** | 登入成功，類型 3 或類型 8（NetworkCleartext） | 確認該使用者在通道建立後已到達 LAN |
| `Microsoft-Windows-RemoteAccess/Operational` | RAS 錯誤 **812**（於 RAS 日誌中） | *The connection was prevented because of a policy configured on your RAS/VPN server* | NPS 連線要求原則正在拒絕該要求；檢查原則條件，而非 VPN |

**成功連線的逐步記錄，其應寫入 `06-verification/` 的形式：**
```text
[VPN END-TO-END WALKTHROUGH — 2026-10-08, client WIN11-CLIENT-01]
1. Precondition check
   PS> Get-ChildItem Cert:\LocalMachine\My, Cert:\CurrentUser\My |
       Where-Object Issuer -like '*VP-ISSUING-CA-01*' | Select Subject
   CN=vpn.vertexpeak.fyp.lab        (machine, LocalMachine)
   CN=adm-03                        (user, CurrentUser)

2. Connect
   PS> rasdial 'VP-IKEv2-Cert'
   Connecting to VP-IKEv2-Cert...
   Verifying user name and password...
   Registering your computer on the network...
   Successfully connected to VP-IKEv2-Cert.

3. Confirm the profile state
   PS> Get-VpnConnection -Name 'VP-IKEv2-Cert' | Select ConnectionStatus, SplitTunneling
   ConnectionStatus SplitTunneling
   ---------------- --------------
   Connected                False

4. Confirm the address came from the pool
   PS> Get-NetIPAddress -AddressFamily IPv4 | Where-Object InterfaceAlias -like '*VPN*'
   InterfaceAlias  : VP-IKEv2-Cert
   IPAddress       : 10.10.201.10
   PrefixLength    : 24

5. Confirm full tunnelling
   PS> Find-NetRoute -RemoteIPAddress 192.0.2.53 | Select InterfaceAlias, NextHop
   InterfaceAlias  : VP-IKEv2-Cert          <-- NOT the physical adapter
   NextHop         : 10.10.201.1

6. Confirm intended reachability
   PS> Test-NetConnection 10.10.30.11 -Port 389  -> TcpTestSucceeded : True
   PS> Test-NetConnection 10.10.30.21 -Port 445  -> TcpTestSucceeded : True

7. Confirm the NOT-intended paths are denied (the important half)
   PS> Test-NetConnection 10.20.20.31 -Port 3389 -> TcpTestSucceeded : False      (TB-12)
   PS> Test-NetConnection 10.10.30.21 -Port 3389 -> TcpTestSucceeded : False      (TB-01, ordinary user)

8. Confirm the event trail
   PS> Get-WinEvent -LogName 'Microsoft-Windows-RasClient/Operational' -MaxEvents 5 |
       Select TimeCreated, Id, LevelDisplayName
   2026-10-08 11:14:52   20221   Information      <-- connection established
   Server side: NPS Security 6272 recorded for VERTEXPEAK\adm-03
```

步驟 7 正是證明該通道尊重信任邊界表、而非僅僅可用的那一步。一個僅以「我可以 ping 到 DC」為驗證的 VPN，只展示了可達性，別無其他。

---

### 7.9 與環境其餘部分的互通性

本小節陳述本專案 Windows 半邊與其他路線之間的介面。它刻意**交叉參照而非重複**：Linux 建置細節屬於報告 §8，自動化細節屬於報告 §10，Cisco 細節屬於報告 §9，AI 細節屬於報告 §11。

#### 7.9.1 與 Linux 環境的 DNS 及時間一致性
| 方向 | 機制 | 佐證 |
|---|---|---|
| Linux → AD DNS | 每部 Linux 客體**僅**經由 `10.10.30.11` 然後 `10.10.30.12` 解析。任何 Linux 客體均不配置公開解析器（基準 §9.4） | 在 `vpnz-mon01` 及 `vpnz-lnxra01` 上執行 `resolvectl status` / `cat /etc/resolv.conf` |
| Windows → Linux 名稱 | 需要可解析的 Linux 客體，以靜態 A 記錄登錄於 AD 整合區域中，並使用基準 §8.2 的主機名稱慣例（≤15 個字元、小寫、不含底線） | 從 Windows 客體執行 `Resolve-DnsName vpnz-mon01.vertexpeak.fyp.lab`；匯出的區域檔案 |
| 時間，Windows 側 | `vpnz-dc01` 是樹系的權威 NTP 來源，並向外與模擬供應商 `192.0.2.53` 同步。其他每部 Windows 機器均與 `vertexpeak.fyp.lab` 同步 | 每部主機上的 `w32tm /query /status` 及 `w32tm /query /source` |
| 時間，Linux 側 | 每部 Linux 機器均與 `10.10.30.11` 同步，並以 `10.10.30.12` 為第二來源，**而非**與公開位址池同步 | 在 `vpnz-mon01`、`vpnz-nft01`、`vpnz-lnxra01` 上執行 `chronyc sources -v` |
| Kerberos 後果 | 時間偏移必須**低於 5 分鐘**，否則 Kerberos 驗證失敗。經由 `realmd`／`sssd` 加入的 Linux 主機，以及任何時間漂移的 Windows 主機，均將無法對 AD 進行驗證 | `w32tm /stripchart /computer:10.10.30.11 /samples:3 /dataonly` 顯示數毫秒的偏移 |
| DHCP | DHCP 由 `vpnz-dc01`（作用中）與 `vpnz-dc02`（待命）以 80/20 分割及 500 ms 容錯移轉延遲權威地提供。任何 Linux 主機及任何 Hypervisor 均不得在任何實驗室網絡上提供 DHCP —— 每個 `VNET-*` 網絡上的 Hypervisor 內建 DHCP 均已停用 | `Get-DhcpServerv4Scope`、`Get-DhcpServerv4Failover`，以及擷取一次的 Hypervisor 虛擬網絡設定 |
| 條件式轉寄 | `.example` 文件命名空間由條件式轉寄至 `192.0.2.53` 解析。實驗室中沒有任何項目解析真實公開名稱，且任何地方均未配置真實的公開解析器 | `Get-DnsServerForwarder`、`Get-DnsServerConditionalForwarderZone` |

**關於 DHCP `MaxClientLeadTime` 的一點說明，因為它是一個已記錄的跨平台陷阱。** 基準將 DHCP 容錯移轉夥伴關係的 `MaxClientLeadTime` 固定為 1 小時，並警告觀塘延遲不得超過 500 ms，否則分支會誤發容錯移轉。因此，一項為分支路徑增添延遲的 Linux 側路由變更 —— 例如把轉送改為排隊的 nftables 規則 —— 可能導致看似 DHCP 失效、實則成因在路由的狀況。此事屬於互通性小節，以便疑難排解章節能指向它。

#### 7.9.2 憑證信任關係
| 元素 | Windows 側 | Linux 側 | 介面 |
|---|---|---|---|
| 根／簽發 CA 信任 | `GPO-WS-Deploy-CA-Root` 將 `VP-ISSUING-CA-01`（兩層下另有 `VP-ROOT-CA`）置於每部主機的受信任根／中繼存放區 | `/usr/local/share/ca-certificates/vp-root-ca.crt` 加上 `update-ca-certificates`（基準 §9.4） | 同一條 CA 鏈、相同的主體名稱、相同的慣例 |
| 命名 | 憑證帶有基準 §8.5 的 FQDN 慣例 | 完全相同的慣例 | 為 `vpnz-lnxra01.vertexpeak.fyp.lab` 簽發的憑證獲 Windows 信任；為 `vpn.vertexpeak.fyp.lab` 簽發者獲雙方信任 |
| 刻意採用兩個獨立 CA | `vpnz-dc01` 上的 AD CS（`VP-ISSUING-CA-01`） | `vpnz-lnxra01` 上供 OpenVPN PKI 使用的 Easy-RSA 3.1.x | 兩個 CA **並非**交互簽署。這是一項設計決策：它使 OpenVPN PKI 保持獨立，而這正是 OpenVPN 與 IKEv2 的比較得以有意義的原因，並使任一 CA 都不會成為絕對的信任相依 |
| 由反向代理發起的 TLS | IIS 節點持有供 `www.vertexpeak.example` 使用的 `Web Server` 範本憑證 | nginx 配對持有 `portal.vertexpeak.example` 的素材，並對上游重新加密 | 端到端的完整 TLS，且上游憑證均對照內部鏈驗證 |
| CRL 可達性 | 內部 CRL 發佈於 `vpnz-dc01`，可從實驗室內部觸達 | Linux 主機在其執行驗證的範圍內對照同一 CRL 驗證 | §7.4.4 的誠實限制適用：從實驗室外部，該 CRL URL 並非公開可觸達 |

#### 7.9.3 Linux 監控堆疊如何觀察 Windows 主機

監控堆疊的建置屬於報告 §8；本小節固定的是 **Windows 側介面**及連接埠，其來自基準連接埠矩陣。
| 需求 | Windows 側配置 | 連接埠 | 佐證 |
|---|---|---|---|
| 主機計量 | 每部 Windows 客體以服務形式安裝 `windows_exporter` 0.29.x，於 9182 監聽 | `P-23` 9182/tcp | `Get-Service windows_exporter`；Prometheus 目標為 `UP`；`Invoke-WebRequest http://10.10.30.11:9182/metrics` 傳回取樣 |
| 抓取權限 | `svc_monitoring`，`GG-Monitoring-Readers`（網域本機）成員，持有效能計數器讀取權 | — | `Get-ADGroupMember 'GG-Monitoring-Readers'`；在該匯出器主機上的群組檢查 |
| 遠端管理計量 | 5986 上的 WinRM HTTPS，允許來自 `vpnz-mon01`（10.10.30.31） | `P-10` 5986/tcp | `Test-WSMan -ComputerName vpnz-fs01 -UseSSL`；範圍限於 10.10.30.31 的防火牆規則 `VP-WinRM-HTTPS` |
| 事件日誌收集 | `vpnz-mon01` 上的 Windows 事件收集器訂閱（`wecutil`），以 Windows 主機為來源起始訂閱者，轉送 Security 與 System 通道 | 經由 WinRM 5986 | 收集器上執行 `wecutil cs <subscription>.xml`；來源上執行 `wecutil gs`；轉送的事件可在收集器的 `ForwardedEvents` 日誌中看到 |
| AI 路線關注的事件 ID | 4624、4625、4740、4720、4728、4732、7045 —— 正是 `GPO-Audit-Advanced` 所保證的集合 | — | 一項刻意的介面：§7.3.6 G-2 的稽核原則部分存在目的，就是供給報告 §11 的 AI 分流工具 |
| 集中式 syslog | Windows 原生不支援 syslog。誠實的設計：Windows 事件經由 WinRM（上文）到達收集器，而 **syslog（`P-24`）僅承載 Linux 與 Cisco 來源** | `P-24` 514/udp | Loki 接收 syslog；`ForwardedEvents` 路徑承載 Windows |
| 警示介面 | 必須展示三個警示觸發並解除（基準 §12.2），且其中至少一個應源自 Windows：`vpnz-fs01` 的磁碟可用空間、`windows_exporter` 目標失效，以及 4625 爆發 | — | Grafana 警示螢幕擷取；Git 中的警示規則檔 |

**必須陳明的誠實要點。** 基準的 `P-24` 一列將 syslog 傳送者描述為「所有 Linux 客體與所有 Cisco 裝置」。Windows 客體並非 syslog 傳送者。一份在以 syslog 為基礎的拓撲圖中顯示 Windows 主機、卻未說明 WEC／WinRM 路徑的報告，將是對設計的失實呈現。正確的框架是：**Windows 事件經由 WinRM 5986 上的原生 Windows 事件轉送機制到達監控堆疊，這是一條與 Linux／Cisco syslog 路徑不同的路徑，而兩者均饋入同一個 Grafana／Loki 檢視。**

**監控的信任邊界遵循。** Windows 事件收集器訂閱是一項**由 `vpnz-mon01` 發起的 WinRM 拉取**，並以防火牆規則限定於 10.10.30.31。因此它滿足 TB-08（`every zone → Z-MGMT`：僅限來自具名裝置的具名管理協定）及 TB-16（AI 代理的唯讀介面：`WinRM 5986` 唯讀）。沒有任何 Windows 主機向 `Z-MGMT` 發起連線，也不需要如此。`vpnz-mon01` 是唯一獲准開啟 5986 的來源，而該限制是在主機防火牆規則中執行，而非僅見於文件。

#### 7.9.4 自動化層如何觸達 Windows 主機
| 元素 | 值 | 來源 |
|---|---|---|
| 控制節點 | `vpnz-mon01`（10.10.30.31）—— 僅此。Ansible 永不從學生的筆記型電腦執行 | 基準 §12.4 |
| 傳輸 | **5986** 上的 WinRM over HTTPS，使用由內部 CA 簽發的憑證 | 連接埠矩陣 `P-10`；基準 §12.4 |
| 驗證帳戶 | `svc_ansible`，僅為 `GG-WINRM-Admins` 成員 | 基準 §8.4 |
| 用戶端程式庫 | 控制節點上的 `pywinrm` 0.5.0 | 基準 §7 |
| 清查群組 | `inventory/lab.ini` 中的 `windows_servers` | 基準 §8.6 |
| 群組變數 | `group_vars/windows_servers.yml`，載有 `ansible_connection: winrm`、`ansible_winrm_transport: certificate` 或 `ntlm`、`ansible_port: 5986`，以及 `ansible_winrm_server_cert_validation: validate` | 基準 §8.6 |
| 佐證 | `win_ping` 輸出；`04-automation/runs/` 中的執行日誌；第二次執行 `changed=0` | 基準 §1.4 及 §12.4 |
| 憑證保護 | WinRM 的**憑證**驗證路徑優先於 NTLM，因為以憑證為基礎的傳輸不會向控制節點暴露可重複使用的密碼。若憑證傳輸無法奏效，回退方案是 WinRM over HTTPS 搭配 NTLM，並將 `svc_ansible` 密碼存放於 Ansible Vault —— 且該偏差必須記錄 | — |

**自動化路線所依賴、因此由本節負責的 Windows 側啟用項目：**
```powershell
# WinRM HTTPS listener with an internal-CA certificate (delivered by §7.4 autoenrolment)
$cert = Get-ChildItem Cert:\LocalMachine\My |
    Where-Object { $_.Subject -eq "CN=$env:COMPUTERNAME.vertexpeak.fyp.lab" -and $_.HasPrivateKey } |
    Select-Object -First 1

winrm create winrm/config/Listener?Address=*+Transport=HTTPS "@{Hostname=`"$env:COMPUTERNAME.vertexpeak.fyp.lab`"; CertificateThumbprint=`"$($cert.Thumbprint)`"}"

# Verify the listener and the service
winrm enumerate winrm/config/Listener
Test-WSMan -ComputerName $env:COMPUTERNAME -UseSSL
# Expected: a valid WSMan response with ProductVersion listing the OS build
```

```text
[WINRM HTTPS LISTENER — vpnz-fs01]
Listener
    Address = *
    Transport = HTTPS
    Port = 5986
    Hostname = vpnz-fs01.vertexpeak.fyp.lab
    Enabled = true
    CertificateThumbprint = 4B7A1E9C2D5503F8A16C0E4B7D93F2A8C516E0B4

[Test-WSMan -UseSSL]
wsmid           : http://schemas.dmtf.org/wbem/wsman/identity/1/wsmanidentity.xsd
ProtocolVersion : http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd
ProductVendor   : Microsoft Corporation
ProductVersion  : OS: 10.0.26100.1742
```

`Test-WSMan -UseSSL` **在沒有** `-SkipCACheck` 或 `-SkipCNCheck` 的情況下成功，是 WinRM 接聽程式的憑證確實透過內部 CA 獲得控制節點信任的證明，而這又證明 §7.4 的 PKI 在整個環境中確實在做實際工作，而非僅為 VPN 服務。

---

### 7.10 強化與安全性基準

下表是本節中套用於 Windows 主機的整合強化基準。每一列陳述設定、套用位置及理由。由 §7.3.6 的 GPO 交付的設定均標示其 GPO ID，使讀者能將任何單一控制追溯至其來源。
| # | 強化設定 | 套用位置 | 理由 |
|---|---|---|---|
| H-01 | 網域／私人／公開防火牆已啟用；輸入預設**封鎖**，並記錄 | G-4 `GPO-SRV-Member-Server-Baseline`（工作站經由 G-1 於網域根） | 主機防火牆是第二層的原則，獨立於 nftables 配對與 ASA。縱深防禦意味著控制被重複，而非被集中 |
| H-02 | 加入網域需要管理員：`ms-DS-MachineAccountQuota` 降至 0 | 網域根 | 防止攻擊者（或學生）加入流氓機器，且在歷史上防止經由機器帳戶濫用路徑通向 DC。預設值 10 是最常被留開的單一 AD 預設值 |
| H-03 | 本機 `Administrators` 限於 `GG-Server-Admins`（伺服器）／`GG-Workstation-Admins`（工作站）；其他地方無本機系統管理員 | G-4、G-1（受限群組） | 伺服器不得因本機變更而被交出，且環境不得累積無名的本機系統管理員 |
| H-04 | Windows LAPS：30 天輪換、最少 20 個字元、驗證後重設、備份至 AD | G-6 `GPO-WS-Windows-LAPS` | 直接對抗在範本複製環境中的 pass-the-hash。若無 LAPS，每部成員 VM 在建構上共用一個本機系統管理員密碼 |
| H-05 | 網域控制站上的互動式與 RDP 登入限於 `GG-Tier0-Admins` | G-3 `GPO-SRV-Tier0-Baseline` | 強制執行兩層模型。能互動式登入 DC 的成員伺服器管理員距離完全失陷只差一躍 |
| H-06 | DMZ 主機上對 `Domain Admins` 設 `Deny log on as a service`／`Deny log on locally`／`Deny access to this computer from the network` | G-5 `GPO-SRV-DMZ-Baseline` | 防止 Tier-0 憑證在最不受信任的區域中被使用或快取 |
| H-07 | 要求 SMB 簽署（用戶端與伺服器）；停用 SMBv1 驅動程式 | G-1 | 阻止 SMB 轉送與竄改。它同時是信任 FSRM 配額及遮蔽佐證的前提條件，因為那些佐證經由 SMB 3.1.1 傳輸 |
| H-08 | 停用 LLMNR（`EnableMulticast = 0`） | G-1 | LLMNR 是憑證轉送工具所使用的主要名稱解析路徑，而本設計中 DNS 具權威性，因此毫無損失 |
| H-09 | 啟用 NTLM 稽核；對四個 `adm-{initials}` 帳戶以 `Protected Users` 成員資格限制 NTLM | G-3 加上直接的群組成員資格 | 從管理工作階段中移除 NTLM、CredSSP 及非約束委派憑證。其限制（這些帳戶無法對任何預期 NTLM 的對象驗證）必須陳明 |
| H-10 | 進階稽核原則：登入、帳戶管理、群組管理、Kerberos、DS 變更、處理程序建立**含命令行**、原則變更、服務安裝、檔案共用、可移除儲存裝置、帳戶鎖定 | G-2 `GPO-Audit-Advanced` | 盡職審查清單所要求的稽核軌跡，以及報告 §11 的 AI 分流工具之資料來源。啟用命令行擷取是刻意且須記錄的取捨 |
| H-11 | PowerShell 指令碼區塊記錄及轉譯至 `\\vpnz-fs01\Logs` | `GPO-WS-PowerShell-Logging` | 即使命令行被混淆，亦使管理動作可被歸因，這正是處理程序建立記錄留下的具體缺口 |
| H-12 | 停用 Spooler 與 RemoteRegistry 服務 | G-4 | 兩者都是有充分記錄的遠端攻擊面，且本設計均不使用 |
| H-13 | 啟用 WinRM 並**停用** Basic 驗證，HTTPS/5986 搭配內部 CA 憑證，僅允許來自 `vpnz-mon01` 與 `Z-MGMT` | G-4 加上主機防火牆規則 | 自動化路線需要 WinRM；強化要求是它必須為已驗證且加密的形式，且其可達性須受範圍限制 |
| H-14 | RDP 僅允許從 `Z-MGMT`（10.20.20.0/24）至成員伺服器，且對一般使用者拒絕 | G-4 加上主機防火牆規則；TB-01、TB-07 | RDP 是 Windows 環境中價值最高的橫向移動協定。將其限制於一個來源子網路，是可用成本換取的最大風險降低 |
| H-15 | 停用 LM 雜湊儲存；服務帳戶的 Kerberos 加密類型限於 AES128/AES256 | G-3；服務帳戶建立 | 從交涉中完全移除較弱的雜湊與較弱的 Kerberos 加密類型 |
| H-16 | 服務帳戶：`PasswordNeverExpires` false、`CannotChangePassword` true、`SmartcardLogonRequired` true、32 字元機密、一個群組成員資格、細緻密碼原則 | §7.2.5、§7.2.8 | 精確實作基準 §8.4，並使服務憑證的互動式使用成為不可能，而非僅是不被鼓勵 |
| H-17 | 破窗 `da-vertexpeak` 帳戶離線密封；`krbtgt` 不觸碰；DSRM 密碼密封 | 作業面 | 這兩個帳戶的失陷或誤用會使其他所有控制失效。兩者均必須以程序控制，且任何使用均記錄於報告中 |
| H-18 | DMZ 主機：禁止網域管理員登入、限制登入權、不對 `Z-SERVER` 進行磁碟機對應、較窄的輸入允許清單（來自反向代理的 80/443、來自 `Z-MGMT` 的 5986） | G-5 | 在主機上實作 TB-04、TB-15 及基準的 DMZ 隔艙化，使代理的錯誤配置不是 DMZ 與內部網絡之間唯一的屏障 |
| H-19 | iSCSI：每個起始器單向 CHAP 搭配 16 字元機密；起始器允許清單；儲存 VLAN 不越過核心路由 | §7.6.2、§7.6.3 | 在 iSCSI 中，區塊儲存依設計未經驗證且未加密；CHAP 與網絡隔離是提高未授權掛接成本的兩項控制 |
| H-20 | VPN：僅 EAP 憑證驗證、無預先共用金鑰、`MaximumEncryption`、完整通道、依群組的 NPS 授權、工作階段／閒置逾時 | §7.8 | 盡職審查項目 3 的直接技術表述。完整通道正是使遠端路徑可稽核的原因 |
| H-21 | 防止流氓 DHCP：Packet Tracer 存取交換器上的 DHCP 窺探，信任連接埠限於核心上行鏈路；實驗室中任何其他地方均無 DHCP 伺服器 | Cisco 路線（報告 §9），相依性於此陳明 | 流氓 DHCP 伺服器會把用戶端重新導向至攻擊者控制的閘道。該測試是一次刻意的流氓 DHCP 嘗試，必須被展示為已封鎖 |
| H-22 | 憑證衛生：內部 TLS 最長有效期 397 天、簽發 CA 10 年、交付的服務集中無自簽憑證、CRL 已發佈且為最新 | §7.4 | 長效憑證在實務上無法撤銷；過期的 CRL 使每一次撤銷檢查都變成失敗 |
| H-23 | 參數化憑證處理：任何指令碼中均無明文機密，為 `*.pfx`、`*.key`、`pki/` 設 `.gitignore`；標籤前機密掃描 | 自動化路線（報告 §10），相依性於此陳明 | 基準 §13.4 R-07。本節的 Windows 側指令碼遵循同一規則，且其日誌不得包含機密 |

**本專案絕不可作出的一項強化主張。** 本設計是*與*若干選定控制*對齊*。它未經任何框架認證、未經滲透測試，且沒有任何合規聲明（基準 §1.5）。上述若干控制的實作強度，在兩個學期的實驗室中站得住腳，在生產環境中則會被加強 —— iSCSI 允許清單按 IP 而非按 IQN、keepalived VRRP 在僅主機區段上使用 `PASS` 驗證，以及客體上缺少 BitLocker 式的靜態加密，是三個誠實的例子。報告必須將它們列為已聲明的限制，而非讓讀者以為已達企業級覆蓋。

---

### 7.11 佐證與螢幕擷取檢查清單

HDTN 主題表要求學生*"produce well-organized documentation that includes all findings, manuals, steps, screen captures, verifications, and references related to the project."***此螢幕擷取要求來自主題表，而非來自 WorldSkills Occupational Standards** —— WSOS 2026 中 `screen`、`capture`、`screenshot` 及 `evidence` 各出現 0 次（研究資料包 §4.3）。因此下列檢查清單是一項任務書要求，且在任何轉錄之處均應如此標示。

命名慣例，由基準 §8.6 固定：`{date}_{host}_{what}.png`，例如 `2026-10-06_vpnz-dc01_dcdiag.png`，存放於 `07-evidence/` 之下。圖說使用基準的範本 `Figure {n}: {what} — {host} — {command or action} — {date}`。

[FIGURE: 路線 L1 已擷取佐證的索引表 —— `07-evidence/` 中 AD DS、PKI、FSRM、iSCSI、RRAS 及 IKEv2 螢幕擷取的縮圖拼版，並標示其圖號，使讀者一眼即可看出本檢查清單中尚有多少擷取項目未完成]

#### 7.11.1 AD DS

- [ ] `vpnz-dc01` 與 `vpnz-dc02` 的 `Get-ComputerInfo` 輸出，顯示 Windows Server 2025 組建 `10.0.26100.1742`（或已記錄的偏差）
- [ ] `vpnz-dc01` 上的 `Get-NetIPConfiguration`，顯示 10.10.30.11/24、別名 `SRV-VLAN30`、DNS 127.0.0.1
- [ ] `vpnz-dc02` 上的 `Get-NetIPConfiguration`，顯示 10.10.30.12/24、DNS 先 10.10.30.12 後 10.10.30.11
- [ ] 完整的 `Install-ADDSForest` 記錄，包括 `OperationMode : Win2025Forest` 一行
- [ ] `Get-ADForest` 與 `Get-ADDomain` 輸出，顯示 `vertexpeak.fyp.lab`、`VERTEXPEAK`、`Win2025Forest`
- [ ] `netdom query fsmo` 顯示全部五個角色位於 `vpnz-dc01`
- [ ] `Get-ADDomainController -Filter *` 顯示兩部 DC 均在站台 `HQ-ShaTin` 並為通用類別目錄
- [ ] `vpnz-dc02` 上完整的 `Install-ADDSDomainController` 記錄
- [ ] Active Directory Users and Computers 在單一擷取中展開顯示完整的 `OU=VertexPeak` 樹狀結構
- [ ] `New-VertexPeakOU.ps1` 的**第一次**執行日誌（顯示 `CREATED` 的行）及其**第二次**執行日誌（全部顯示 `EXISTS`）—— 冪等性配對
- [ ] Active Directory Users and Computers 顯示 `OU=Groups/OU=Global` 及全部十四個通用群組
- [ ] Active Directory Users and Computers 顯示 `OU=Groups/OU=DomainLocal` 及全部八個網域本機群組
- [ ] `Get-ADUser -Filter 'sAMAccountName -like "svc_*"' -Properties PasswordNeverExpires, CannotChangePassword, MemberOf` 顯示每個帳戶恰好一個成員資格
- [ ] 服務帳戶權限過高的檢查傳回**無資料列**
- [ ] `Get-ADFineGrainedPasswordPolicy` 顯示 `FGPP-ServiceAccounts`，優先順序 10、最少 32 個字元
- [ ] `Get-ADGroupMember 'Protected Users'` 顯示四個 `adm-{initials}` 帳戶
- [ ] Default Domain Policy 的密碼與鎖定設定，就 `GPO-WS-Baseline-Security` 從群組原則管理編輯器以設定報告（`GPO report → HTML`）擷取
- [ ] 一次進行中的鎖定：五次失敗登入，隨後是 `Get-ADUser … -Properties LockedOut` 的結果
- [ ] 在事件檢視器中擷取的事件 4740，顯示被鎖定的帳戶及來源工作站
- [ ] `Get-ADReplicationSite -Filter *` 顯示全部四個站台
- [ ] `Get-ADReplicationSubnet -Filter *` 顯示每個子網路均已對應，且*無未對應子網路*檢查未傳回任何內容
- [ ] `Get-ADReplicationSiteLink` 顯示 `ReplicationFrequencyInMinutes 15`
- [ ] `repadmin /replsummary` 顯示每一列均為 `0 / n` 失敗
- [ ] 兩個方向的 `repadmin /showrepl`
- [ ] `dcdiag /v` 完整，每一項測試顯示 `passed`
- [ ] `dcdiag /test:dns /dnsall /v` 完整
- [ ] `Get-DnsServerZone` 顯示正向區域為 `Primary`、AD 整合、`Secure` 更新
- [ ] DNS Manager 顯示該區域及其 SRV 記錄，以及額外的 A 記錄（`portal`、`www`、`blog`、`vpn`、`wg`）
- [ ] `vpnz-dc01` 上的 `w32tm /query /status` 及 `vpnz-fs01` 上的 `w32tm /query /source`
- [ ] `OU=Users` 上的 `dsacls`，顯示 `GG-Helpdesk` 僅有 Reset Password / Change Password
- [ ] 一部成員伺服器及一部工作站的 `gpresult /h` HTML 輸出
- [ ] GPO 備份目錄清單，顯示十一個 GUID 資料夾
- [ ] 兩部 DC 的 `preflight-{hostname}.log`

#### 7.11.2 PKI（ADCS）

- [ ] 完整的 `Install-AdcsCertificationAuthority` 記錄
- [ ] `certutil -cainfo` 顯示 `VP-ISSUING-CA-01`、`Enterprise Root CA`、SHA256、4096 位元、NotAfter 為 10 年後
- [ ] `certutil -CATemplates` 列出全部七個已發佈的範本
- [ ] [憑證授權單位] 主控台顯示 *Issued Certificates*，每項所需用途至少一張憑證
- [ ] 用戶端上的 `certutil -pulse` 及所產生的 `Cert:\LocalMachine\My` 憑證，其 `NotAfter` 約為 397 天後
- [ ] 憑證的 [Details] 索引標籤顯示 Subject 及包含簡短名稱與 FQDN 兩者的 SAN 擴充功能
- [ ] 對一張已簽發憑證執行 `certutil -verify -urlfetch`，顯示 `Certificate is valid` 且所有 URL 均已擷取
- [ ] 對 CRL 執行 `certutil -URL`，顯示該 CRL 為最新
- [ ] 撤銷測試：`certutil -revoke`、`certutil -CRL`，以及用戶端側的 `CERT_E_REVOKED` 失敗
- [ ] 成員伺服器上的受信任根存放區顯示 `VP-ISSUING-CA-01`
- [ ] `vpnz-rras01` 上主體為 `CN=vpn.vertexpeak.fyp.lab`、`HasPrivateKey : True` 的憑證
- [ ] `GPO-WS-Cert-AutoEnrol` 設定顯示 `AEPolicy` = 7

#### 7.11.3 FSRM

- [ ] `Get-WindowsFeature FS-FileServer, FS-Resource-Manager` 顯示兩者均已安裝
- [ ] `Get-Disk` 與 `Get-Volume` 顯示 20 GB 資料磁碟區為 `D:`，標籤 `VP-DATA`，NTFS
- [ ] `Get-SmbShare` 顯示全部四個共用為 `Online` 且路徑正確
- [ ] `Get-Acl D:\Shares\Finance` 顯示 `DL-Finance-RW`（Modify）且無 `Everyone` / `Authenticated Users`
- [ ] File Server Resource Manager 主控台 → *Quota Management → Quota Templates* 顯示全部四個範本、各三個閾值
- [ ] File Server Resource Manager 主控台 → *Quota Management → Quotas* 顯示全部四個自動配額及其使用量
- [ ] File Server Resource Manager 主控台 → *File Screening Management → File Groups* 顯示全部三個群組及其模式清單
- [ ] File Server Resource Manager 主控台 → *File Screening Management → File Screens* 顯示三個 `Active` 及一個非作用中（`Public`）
- [ ] **配額超限擷取**：用戶端側的 `There is not enough space on the disk` 錯誤
- [ ] **配對的配額佐證**：`SRMSVC` 應用程式日誌事件，指名路徑、5368709120 位元組限制及實際使用量
- [ ] **被封鎖檔案擷取**：`Access to the path '\\vpnz-fs01\Finance\probe-blocked.mp3' is denied`
- [ ] **配對的遮蔽佐證**：`SRMSVC` 事件，指名被封鎖的檔案群組及使用者
- [ ] **例外擷取**：`probe-allowed.msi` 成功寫入 `D:\Shares\Engineering\_build-artefacts`，而同一副檔名在共用根目錄中仍被封鎖
- [ ] 檔案遮蔽例外內容對話方塊顯示 `Allowed-Engineering-Build`
- [ ] `Get-FsrmStorageReport` 顯示 `LastStatus Success`
- [ ] 產生的 *Duplicate files* 及 *Files by owner* 存放裝置報告 HTML，於瀏覽器中開啟
- [ ] *Storage Reports Management* 下的排程工作清單，顯示每週報告工作
- [ ] 工作站上已對應的磁碟機 `F:`、`G:` 及 `H:`，在檔案總管中擷取並可見 UNC 路徑

#### 7.11.4 iSCSI

- [ ] `Get-WindowsFeature FS-iSCSITarget-Server` 顯示 `Installed`
- [ ] `Get-VHD` 顯示三個 VHDX 檔案為 `Dynamic`，大小 20/40/60 GB
- [ ] `Get-IscsiServerTarget` 顯示全部三個目標及其 IQN 與起始器允許清單
- [ ] `Get-IscsiVirtualDiskTargetMapping` 顯示全部三個對應
- [ ] iSCSI Target 管理主控台顯示目標、虛擬磁碟及起始器清單
- [ ] 起始器上的 `Get-InitiatorPort` 顯示起始器 IQN
- [ ] 探索後的 `Get-IscsiTarget`，顯示三個已探索的目標
- [ ] 完整的 `Connect-IscsiTarget` 記錄，包括 `AuthenticationType ONEWAYCHAP`、`IsConnected True`、`IsPersistent True`
- [ ] `Get-IscsiSession` 顯示工作階段、CHAP 驗證類型及持續性旗標
- [ ] `Get-Disk` 顯示初始化前的 iSCSI 磁碟（`RAW`、`Offline`、匯流排 `iSCSI`）
- [ ] `Initialize-Disk` 與 `Format-Volume` 記錄
- [ ] `Get-Volume -DriveLetter L` 顯示 `VP-LUN01-WEBFARM`、NTFS、20 GB、`Healthy`
- [ ] 檔案總管或 `dir L:\` 顯示一個已寫入的檔案
- [ ] **目標重新啟動逐步操作**：目標的 `Stop-Service WinTarget`、起始器的工作階段遺失佐證（無資料列、`No MSFT_Volume objects`）、目標的 `Start-Service WinTarget`，以及起始器已復原的工作階段、健全的磁碟區及可讀的資料
- [ ] **允許清單拒絕**：從未列出主機連線嘗試失敗，附確切錯誤
- [ ] 目標側事件日誌中一次 CHAP 驗證失敗的項目
- [ ] `Get-IscsiVirtualDisk` 顯示 `Used` 遠低於 `Size`，證明精簡佈建
- [ ] Hypervisor 的資料存放區檢視顯示 `vpnz-san01` 磁碟成長（儲存層的精簡佈建佐證）

#### 7.11.5 RRAS 與路由

- [ ] `Get-WindowsFeature RemoteAccess, NPAS` 顯示兩者均已安裝
- [ ] `Get-RemoteAccess` 顯示 `VpnStatus Enabled` 及 `RoutingStatus Installed`
- [ ] `Get-NetIPInterface -AddressFamily IPv4` 顯示 `SRV-VLAN30` 上的 `Forwarding Enabled`
- [ ] 讀回的 `IPEnableRouter` 登錄值為 1
- [ ] `Get-NetRoute` 顯示 `10.10.201.0/24` 路由且 `PolicyStore PersistentStore`
- [ ] `vpnz-rras01` 完整的 IPv4 路由表作為佐證
- [ ] **已路由流量的路徑追蹤**，來自 VPN 用戶端並顯示路徑中有 `vpnz-rras01`
- [ ] **路由負向對照**：停用轉送 → 相同 ping 失敗 → 重新啟用轉送 → 相同 ping 成功，作為三張連續擷取
- [ ] `Get-NetNat` 未傳回任何 NAT 物件，作為本設計中 RRAS 不執行 NAT 的佐證
- [ ] nftables forward 鏈顯示對 10.10.30.41 的 UDP 500/4500 允許，於 `vpnz-nft01` 上擷取
- [ ] ASA 的 `show nat` 及 `show access-list | include 500` 輸出（Packet Tracer）
- [ ] NPS 主控台顯示該 RRAS 用戶端及連線要求原則

#### 7.11.6 IKEv2 VPN

- [ ] `Set-VpnServerIPAddressRange` 記錄及 `Get-VpnServerIPAddressRange` 顯示 10.10.201.10 – 10.10.201.200
- [ ] `Get-VpnAuthProtocol` 顯示 `EAPHOST`、EKU 篩選條件及可接受的根 CA
- [ ] `Get-VpnServerIPsecConfiguration` 顯示 `MaximumEncryption`
- [ ] 由 `Get-NetFirewallRule` 取得 `vpnz-rras01` 上五條 `VP-*` 主機防火牆規則
- [ ] `Get-VpnConnection -Name 'VP-IKEv2-Cert'` 顯示連線前的設定檔參數
- [ ] 用戶端上的憑證存放區顯示機器憑證（LocalMachine）與使用者憑證（CurrentUser），均由 `VP-ISSUING-CA-01` 簽發
- [ ] 連線期間用戶端作業系統的憑證選取對話方塊，顯示正在被選用的憑證（這是憑證式 EAP 的可見證明）
- [ ] 成功的 `rasdial` 輸出及 `ConnectionStatus : Connected`
- [ ] `Get-NetIPAddress` 顯示用戶端持有 `10.10.201.0/24` 中的位址
- [ ] 用戶端路由表顯示經由 VPN 介面的 `0.0.0.0/0` 路由（完整通道佐證）
- [ ] `Find-NetRoute -RemoteIPAddress 192.0.2.53` 顯示 VPN 介面，而非實體介面卡
- [ ] `Test-NetConnection` 對 10.10.30.11:389 及 10.10.30.21:445 成功
- [ ] **`Test-NetConnection` 對 10.20.20.31:3389 失敗**（TB-12），以及對一般使用者而言對 10.10.30.21:3389 失敗（TB-01）
- [ ] `vpnz-rras01` 上的 `Get-NetIPsecMainModeSA` 及 `Get-NetIPsecQuickModeSA`
- [ ] `vpnz-rras01` 上的 `Get-NetIPInterface` 在有用戶端連線時顯示該 RAS 介面
- [ ] 用戶端日誌：`Microsoft-Windows-RasClient/Operational` 事件 **20221**（`Information`）
- [ ] 用戶端日誌：來自一次刻意失敗嘗試的事件 **20227** 及其原因字串
- [ ] 伺服器日誌：`Microsoft-Windows-RemoteAccess/Operational` 顯示 SA 已建立且使用者已授權
- [ ] NPS 帳戶處理日誌中一次工作階段開始與一次工作階段停止的項目，含時長
- [ ] 一次成功授權的 NPS Security 事件 **6272**，以及一次拒絕附原因碼的 **6273**
- [ ] 從 `GG-VPN-Users` 移除測試帳戶後被拒絕的連線
- [ ] 移除用戶端憑證後被拒絕的連線，證明憑證驗證確實被強制執行
- [ ] 用戶端憑證套件精靈輸出（選項 A），為完整性而列，標示為示範產物而非交付機制

#### 7.11.7 跨領域與互通性

- [ ] `Test-WSMan -UseSSL` 在 Windows 客體上成功且**未**使用 `-SkipCACheck` / `-SkipCNCheck`
- [ ] `winrm enumerate winrm/config/Listener` 顯示 5986 上的 HTTPS 接聽程式及憑證指紋
- [ ] `vpnz-mon01` 上的 Windows 事件收集器訂閱，以及收集器 `ForwardedEvents` 日誌中一筆可見的轉送事件
- [ ] Grafana 的 `fyp-overview` 儀表板顯示由 `windows_exporter` 填入的 Windows 主機 CPU、記憶體及磁碟面板
- [ ] Prometheus `/targets` 顯示 Windows `windows_exporter` 目標為 `UP`
- [ ] `GG-Monitoring-Readers` 群組成員資格顯示 `svc_monitoring` 為其唯一成員
- [ ] Linux 客體上的 `chronyc sources -v` 顯示 `10.10.30.11` 為同步來源，並列 Windows 客體上的 `w32tm /query /source` 顯示同一部 DC —— 跨平台時間一致性配對
- [ ] 相關的 `nft list ruleset` 摘錄，以及拒絕 VPN 位址池來源觸達被拒目的地的 `NFT-DROP: ` 日誌行，作為基準 §10「每個區域邊界一張顯示被封鎖封包的螢幕擷取」的要求
- [ ] ASA 的 `show logging` 摘錄，顯示邊界上相應的拒絕

---

### 7.12 常見失效模式與疑難排解

領域 6 *Troubleshooting* 佔 WSOS 2026 評核的 **25 %** —— 與 Data Transfer Networks 及 Network and System Operations 並列最大權重。下列登記冊正是為直接服務該領域而撰寫：每一項陳明徵狀、可能成因，以及一個以驗證指令作結的解決方案。在螢幕擷取或記錄為自然佐證之處，均予以陳明。

#### T-01 VPN 可連線，但內部網絡上任何東西都無法觸達

**徵狀。** `rasdial` 回報成功，`Get-VpnConnection` 顯示 `Connected`，用戶端持有 `10.10.201.x` 位址，但 `ping 10.10.30.11` 逾時，且無法觸達任何內部資源。用戶端自身的 VPN 介面計數器顯示已傳送封包，而接收數為零。

**可能成因。** RRAS 主機的內部介面上未啟用 IP 轉送。通道已建立；封包到達 `vpnz-rras01` 並被丟棄，因為該主機不是路由器。

**解決方案。**
```powershell
Get-NetIPInterface -AddressFamily IPv4 | Select-Object InterfaceAlias, Forwarding
# If SRV-VLAN30 shows Disabled:
Set-NetIPInterface -InterfaceAlias 'SRV-VLAN30' -Forwarding Enabled
# Also confirm IPEnableRouter = 1 and, if it was changed, reboot.
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters' -Name IPEnableRouter
# Negative control for the evidence file: disable, observe the failure, re-enable, observe recovery
```
若轉送已為 `Enabled`，第二個可能成因是：內部網絡上沒有針對 `10.10.201.0/24` 的回程路由，因此回覆被送往預設閘道而遺失。在 `vpnz-rras01` 上及核心上（Packet Tracer `show ip route 10.10.201.0`）以 `Get-NetRoute -DestinationPrefix '10.10.201.0/24'` 確認。

#### T-02 VPN 無法連線，用戶端回報「the remote connection was not made」

**徵狀。** `rasdial` 在數秒內失敗。事件 `Microsoft-Windows-RasClient/Operational` **20227** 被寫入並附原因字串。

**可能成因（三分法）。**
1. *建立通道失敗* —— UDP 500/4500 正被丟棄。在本設計中，該封包必須在**三**處獲得允許：ASA PAT、nftables forward 鏈，以及 `vpnz-rras01` 上的主機防火牆。最常被遺漏的是 nftables 配對。
2. *憑證被拒絕* —— 事件 **20223**／**20224** 指名憑證問題。檢查伺服器憑證的 SAN 是否包含 `vpn.vertexpeak.fyp.lab`，以及 `HasPrivateKey` 是否為 `True`。
3. *授權被拒絕* —— 通道建立後隨即中斷；NPS 記錄 **6273** 並附原因碼。

**解決方案。**
```powershell
# 1. Which layer? Check each independently.
Get-NetFirewallRule -DisplayName 'VP-IKEv2-*' | Select-Object DisplayName, Enabled, Action
ssh root@10.10.50.11 'nft list chain inet fyp_filter forward | grep -E "500|4500"'
# On the ASA: show nat | include 500 ; show crypto ikev2 sa
# 2. Certificate:
certutil -verify -urlfetch <thumbprint>            # on vpnz-rras01
Get-ChildItem Cert:\LocalMachine\My | Select Subject, SAN, HasPrivateKey
# 3. Authorisation:
Get-ADGroupMember 'GG-VPN-Users' | Select SamAccountName
Get-WinEvent -LogName Security -FilterXPath "*[System[EventID=6273]]" -MaxEvents 3
```

#### T-03 VPN 可連線且內部網站可用，但用戶端沒有網際網路存取

**徵狀。** 內部可達性完美；`Test-NetConnection 192.0.2.53`（或任何外部探查）失敗。這是與 T-01 *不同*的故障，不得混為一談。

**可能成因。** 完整通道正在生效（正確地），因此用戶端的網際網路流量到達 `vpnz-rras01`、被轉送至核心，然後必須由 **nftables 配對執行 masquerade**。nftables 的 forward／nat 鏈允許 `10.10.10.0/16`、`10.20.20.0/16` 及 DMZ，但不允許 VPN 位址池 `10.10.200.0/24`、`10.10.200.64/26`、`10.10.201.0/24` 或 `10.10.202.0/24`。

**解決方案。** 將 VPN 位址池前置碼加入 forward 與 nat 鏈所使用的 nftables 來源集合，然後驗證：
```bash
ssh root@10.10.50.11 'nft list set inet fyp_filter <set-name>'
ssh root@10.10.50.11 'nft monitor'      # then generate traffic from the client and watch
```
確認故障確在預期位置：擷取 `nft monitor` 輸出，顯示 `10.10.201.x` 來源在變更*之前*被丟棄，而在其後被轉送。這同時滿足基準「每個區域邊界一張顯示被封鎖封包的螢幕擷取」的要求。

#### T-04 Kerberos 驗證在整個環境中間歇性失敗

**徵狀。** 使用者間歇性無法登入；`klist` 回報無票證；DC 上出現事件 4771 或 4625 而無明顯的憑證成因；失敗在時間上成簇出現。

**可能成因。** 時間偏移超出 Kerberos 容差（基準固定為「少於 5 分鐘，否則 Kerberos 失敗」）。本實驗室中三個常見來源為：Hypervisor 的與主機時間同步在 `vpnz-dc01` 上仍保持啟用；一部由快照恢復且時鐘過期的 VM；以及一部被配置為觸達其無法路由到的公開 NTP 位址池、因而任其時鐘自由運行的客體。

**解決方案。**
```powershell
# Compare each host's clock against the forest source
w32tm /stripchart /computer:10.10.30.11 /samples:5 /dataonly
# On the PDC emulator, confirm it is not following the hypervisor
w32tm /query /status ; w32tm /query /source
# If it reads "Local CMOS Clock" or the hypervisor, re-assert the manual peer list:
w32tm /config /manualpeerlist:"192.0.2.53,0x8 192.0.2.54,0x8" /syncfromflags:manual /reliable:yes /update
Restart-Service W32Time ; w32tm /resync /rediscover
# Resynchronise the client, then re-test ticket acquisition
w32tm /resync ; klist purge ; klist
```
同時檢查每部 DC 上時間同步服務的 `Get-VMIntegrationService`（或 Hypervisor 的等效項）並予以停用。

#### T-05 IIS 節點與 RRAS 伺服器憑證驗證失敗

**徵狀。** 存放區中存在一張憑證且看似有效，但服務拒絕使用它；用戶端收到指名伺服器憑證的錯誤（*"the certificate on the server is not configured correctly"*，或用戶端側 IKEv2 錯誤 13801/13806）；或自動註冊靜默失敗。

**可能成因，依出現頻率排序。**
1. **沒有私密金鑰。** 該憑證在匯入或要求時未附私密金鑰。`HasPrivateKey` 為 `False`。該憑證出現在每個使用者介面清單中，卻無法使用。
2. **缺少 SAN。** 該憑證有正確的 `CN`，但主體別名中沒有 `dNSName`。現代用戶端驗證 SAN，且在 SAN 存在時完全忽略 CN。
3. **EKU 錯誤。** 僅有 `Server Authentication` 的憑證不能用於用戶端驗證，而僅有 `Client Authentication` 的 VPN 用戶端憑證不能充當伺服器憑證。
4. **範本錯誤／無自動註冊權。** 範本的 ACL 從未授予 `Domain Computers` *Read + Enroll + Autoenroll*，因此 `certutil -pulse` 完成而未產生任何要求。
5. **憑證尚未獲同儕信任**，因為 `GPO-WS-Deploy-CA-Root` 尚未在該主機上套用。

**解決方案。**
```powershell
# Inspect the certificate properly, not just its Subject
$c = Get-ChildItem Cert:\LocalMachine\My | Where-Object Subject -eq 'CN=vpn.vertexpeak.fyp.lab'
$c.HasPrivateKey
$c.Extensions | Where-Object Oid -like '*2.5.29.17*' | ForEach-Object { $_.Format($false) }  # SAN
$c.EnhancedKeyUsageList
certutil -verify -urlfetch $c.Thumbprint
# Force re-request if the certificate is wrong
certutil -pulse
Get-WinEvent -LogName 'Microsoft-Windows-CertificateServicesClient-Lifecycle-System/Operational' -MaxEvents 10
```
這些案例中對報告最具啟發性的是 #2：一張能對 `vpnz-rras01.vertexpeak.fyp.lab` 驗證、但無法對 `vpn.vertexpeak.fyp.lab` 驗證的憑證，在用戶端撥號主機名稱時產生*可運作*的連線，而在撥號服務名稱時產生*失敗*的連線；這看似間歇性故障，但實則不然。

#### T-06 被封鎖的檔案作業無法與權限失敗區分

**徵狀。** 使用者回報寫入某共用時 *"Access is denied"*。測試者的第一反應是 NTFS 或共用權限有誤，花一小時檢查 ACL，卻發現毫無問題。

**可能成因。** `ERROR_ACCESS_DENIED` 是 FSRM 檔案遮蔽傳回給用戶端的內容，且與 NTFS 拒絕所產生的錯誤完全相同。FSRM 配額又不同（`ERROR_DISK_FULL`）。

**解決方案 —— 三向辨別法。**
```powershell
# Step 1: is it a screen? Try a DIFFERENT extension, same size, same folder, same user.
'x' * 1024 | Out-File '\\vpnz-fs01\Finance\control-write.txt'     # succeeds?
'x' * 1024 | Out-File '\\vpnz-fs01\Finance\control-write.mp3'     # fails?
# A screen denies the second and permits the first, independent of size.
# Step 2: is it a quota? Try a SMALL file, then a LARGE file, same extension.
fsutil file createnew "$env:TEMP\small.bin" 1048576                # 1 MB
Copy-Item "$env:TEMP\small.bin" '\\vpnz-fs01\Public\small.bin'     # succeeds if space remains
fsutil file createnew "$env:TEMP\large.bin" 6442450944             # 6 GB
Copy-Item "$env:TEMP\large.bin" '\\vpnz-fs01\Public\large.bin'     # fails if the quota is the cause
# Step 3: confirm on the server
Get-WinEvent -LogName Application -Source SRMSVC -MaxEvents 10 |
    Select-Object TimeCreated, Id, Message
Get-FsrmFileScreen -Path 'D:\Shares\Finance' | Select-Object Path, Active, IncludeGroup
Get-FsrmQuota      -Path 'D:\Shares\Finance' | Select-Object Path, Size, Usage
```
把*對照寫入*納入標準診斷程序，正是本項目的全部教訓。

#### T-07 起始器重新開機後 iSCSI 磁碟消失

**徵狀。** `L:` 在重新開機前存在，之後不存在。`Get-Disk` 顯示沒有 iSCSI 磁碟。

**可能成因。** 該 iSCSI 工作階段在建立時未設持續性，因此僅存續於該次開機。這是學生建置中最常見的單一 iSCSI 錯誤，因為一次全新的登入看起來運作得完美無缺。

**解決方案。**
```powershell
# Diagnose
Get-IscsiSession | Select-Object TargetNodeAddress, IsConnected, IsPersistent
Get-Service msiscsi | Select-Object Status, StartType
# Fix: register the logon as persistent
Register-IscsiSession -SessionIdentifier (Get-IscsiSession |
    Where-Object { $_.TargetNodeAddress -like '*storage-lun01*' }).SessionIdentifier
# Or re-establish with persistence
Connect-IscsiTarget -NodeAddress <target-iqn> -TargetPortalAddress 10.10.80.21 `
    -AuthenticationType ONEWAYCHAP -ChapUsername <initiator-iqn> -ChapSecret $sec -IsPersistent $true
# Verify with a full reboot, which is the only honest test
Restart-Computer -Confirm:$false
```
若持續性已設定，相關成因是：`msiscsi` 服務被留在 `Manual` 啟動，因此在開機時啟動得不夠早。將其設為 `Automatic`。

#### T-08 iSCSI 磁碟存在但離線或無法讀取

**徵狀。** `Get-Disk` 顯示該 iSCSI 磁碟，但 `OperationalStatus Offline` 且 `PartitionStyle RAW`，或顯示為 `NoMedia`。`New-Partition` 以 *"The disk is offline"* 或 *"The disk is read-only"* 失敗。

**可能成因。** 三種可能，依序為。
1. Windows 將該新的 iSCSI 磁碟以**唯讀**或**離線**狀態設為上線（對看似快照的磁碟而言，這是刻意的行為）。
2. 該磁碟確實是一顆**新的、未初始化**的磁碟，而測試者試圖把它當作已有資料存在般掛接。
3. 該磁碟*曾經*含有資料，而重複的磁碟簽章或過期的 SAN 原則使 Windows 將其隱藏。

**解決方案。**
```powershell
$d = Get-Disk | Where-Object BusType -eq 'iSCSI'
$d | Select-Object Number, PartitionStyle, OperationalStatus, IsOffline, IsReadOnly
Set-Disk -Number $d.Number -IsOffline $false
Set-Disk -Number $d.Number -IsReadOnly $false
Update-HostStorageCache
# For a genuinely new LUN:
Initialize-Disk -Number $d.Number -PartitionStyle GPT
# Then check the SAN policy, which controls whether new disks are brought online automatically:
san -get  ;  # "OfflineShared" vs "OnlineAll"
```
**陷阱：切勿執行 `Initialize-Disk -Number 1`。** 一律先以 `BusType -eq 'iSCSI'` 解析磁碟。在開機磁碟為磁碟 1 的客體上，帶編號的形式會摧毀作業系統，而這是本節中唯一具有不可復原後果的錯誤。

#### T-09 兩部網域控制站之間的複寫失敗

**徵狀。** `repadmin /replsummary` 顯示 `largest delta` 不斷增長且 `fails/total` 非零；`dcdiag /test:replications` 失敗。在一部 DC 上建立的使用者在另一部上不可見；在一部 DC 上變更的密碼在該 DC 上有效、在另一部上失敗。

**可能成因及指名該成因的錯誤碼。**
- **錯誤 8524** —— *The DSA operation is unable to proceed because of a DNS lookup failure.* 夥伴的 SRV 或主機記錄缺失或有誤。幾乎總是由手動刪除的 DNS 記錄，或由清除功能移除了不應移除的記錄所造成。
- **錯誤 1256** —— *The remote system is not available.* RPC 或 DNS 連線被封鎖。檢查連接埠矩陣中的 `P-07`（RPC 135 及動態範圍 49152–65535）與 `P-31`（DNS 區域傳送），以及主機防火牆。
- **錯誤 8614** —— *The replication operation encountered a database error.* 通常是不潔還原後留下的殘留物件；需要 `repadmin /removelingeringobjects`。
- **錯誤 1864 / 2089** —— *Replication has been stalled longer than the tombstone lifetime.* 真正嚴重的情況，需要權威還原或重建 DC。

**解決方案。**
```powershell
repadmin /showrepl * /csv > C:\FYP\config\repl-failures.csv
repadmin /replsummary
# DNS-side checks first, because 8524 is the most common cause
Resolve-DnsName -Name _ldap._tcp.dc._msdcs.vertexpeak.fyp.lab -Type SRV
Resolve-DnsName vpnz-dc02.vertexpeak.fyp.lab
nltest /dsgetdc:vertexpeak.fyp.lab /force
# Connectivity
Test-NetConnection vpnz-dc02 -Port 135
dcdiag /test:replications /v ; dcdiag /test:advertising /v
# Force the retry
repadmin /kcc ; repadmin /syncall /AdeP
```
注意 §7.3.5 的誠實解讀規則：一部全新的 DC 常會回報一或兩次連續失敗，來自 DNS 登錄與首次成功複寫之間的窗口。在把非零次數視為缺陷之前，先等待一個 15 分鐘的站台連結間隔並重新檢查。

#### T-10 自動註冊完成但未簽發任何憑證

**徵狀。** `certutil -pulse` 傳回成功 `0x0`，然而 `Get-ChildItem Cert:\LocalMachine\My` 顯示沒有任何來自 `VP-ISSUING-CA-01` 的憑證。沒有任何明顯的失敗。

**可能成因。**
1. **範本 ACL 從未被授予** *Read + Enroll + Autoenroll*。這是最常見的成因，且正好產生這種靜默結果。
2. **範本未在 CA 上發佈**（`certutil -CATemplates` 未列出它）。
3. 自動註冊**未由原則在正確範圍啟用** —— `AEPolicy` 值存在，但連結至目標不在其中的 OU，或目標的群組原則尚未重新整理。
4. 目標沒有**讀取 CA 憑證與 CRL 的權限**，因此要求無法完成鏈結。

**解決方案。**
```powershell
certutil -CATemplates                      # is the template published?
certutil -template <TemplateName>          # inspect the template and its ACL
certutil -pulse -v                         # verbose: shows what was requested and what happened
Get-WinEvent -LogName 'Microsoft-Windows-CertificateServicesClient-Lifecycle-System/Operational' -MaxEvents 20
gpresult /scope:computer /v | Select-String -Pattern 'GPO-WS-Cert-AutoEnrol'
reg query 'HKLM\SOFTWARE\Policies\Microsoft\Cryptography\AutoEnrollment' /v AEPolicy
# On the CA, is the request even arriving?
certutil -view -restrict "Disposition=9" -out "RequestID,CommonName,DispositionMessage" csv   # pending
certutil -view -restrict "Disposition=30" -out "RequestID,CommonName,DispositionMessage" csv  # failed
```
`certutil -pulse -v` 是決定性的工具：它回報用戶端認為自己無事可做的原因，從而區分「沒有範本適用於我」與「要求被拒絕」。

#### T-11 LUN 可從錯誤的主機觸達 —— 允許清單似乎無效

**徵狀。** 一個非預期的起始器可以看見並掛接本設計僅打算供平台層使用的 LUN。

**可能成因。** 允許清單是按 **IP 位址**，而非按 IQN（§7.6.2）。一個位址落在許可集合內的起始器 —— 例如一部不小心被指派了 `Z-DMZ` 位址的第二部客體 —— 會被視為已授權的起始器。另有一個更單純的成因：實驗期間建立的目標被留下了寬鬆或空的 `InitiatorIds` 清單，而某些配置會從寬解讀。

**解決方案。**
```powershell
Get-IscsiServerTarget | Select-Object TargetName, @{n='Initiators';e={$_.InitiatorIds -join '; '}}
Get-IscsiSession -TargetName <target>       # who is actually connected, from the target's view?
Get-IscsiConnection | Select-Object InitiatorPortalAddress, TargetPortalAddress
# Tighten: bind by IQN rather than by IP where the cmdlet surface allows it
Set-IscsiServerTarget -TargetName 'storage-lun01' -InitiatorId @('Iqn:iqn.2026-01.lab.fyp.vertexpeak:storage-lun01','IPAddress:10.10.90.21','IPAddress:10.10.90.22')
```
與信任邊界表交叉核對：TB-01 允許至 `vpnz-san01` 的 iSCSI 3260 **僅來自兩部平台 VM**。該集合之外的主機觸達該 LUN 是一項 TB-01 違反，必須連同拓撲的更正記錄為一項發現，而非僅在目標上打補丁。

#### T-12 FSRM 配額範本已套用，但自動配額未管治新的子資料夾

**徵狀。** `Get-FsrmAutoQuota` 如預期顯示共用根目錄上的自動配額，但新建立的子資料夾沒有配額，或其配額使用量被回報為免費／無限制。

**可能成因。**
1. 自動配額是在該子資料夾**之後**建立，而既有的子資料夾未被納入。FSRM 自動配額對既有子資料夾的行為，正是 §7.5.3 中標為 `[ASSUMPTION]` 的具體項目，且必須以實證方式確立。
2. 該子資料夾是由一個繞過該共用的處理程序建立（例如從伺服器自身的主控台），而自動配額的繼承是在共用層級作業上評估的。
3. 該子資料夾上存在一個特定的 `New-FsrmQuota` 物件並覆寫了自動配額，這是正確行為，但看起來像失敗。

**解決方案。**
```powershell
Get-FsrmAutoQuota | Select-Object Path, Template, Disabled, Usage
Get-FsrmQuota -Path 'D:\Shares\Finance\<subfolder>'
# Empirical test — this IS the finding for the report:
#   (a) create a subfolder BEFORE defining the auto-quota, then check for a quota on it
#   (b) create a subfolder AFTER defining the auto-quota, then check for a quota on it
#   (c) record the difference, or the absence of a difference, as an experiment result
New-FsrmQuota -Path 'D:\Shares\Finance\<existing-subfolder>' -Template 'TMPL-Quota-Finance-20GB'
```
一項結果與設計假設相悖的實驗是正當的學術內容，而基準明確如此表示（風險 R-03）：記錄該差異並繼續前進。

#### T-13 GPO 未套用於它所連結的主機

**徵狀。** 目標主機上缺少某項強化設定。`gpresult` 顯示該 GPO 為 *Not Applied*，或顯示已套用但該設定毫無效果。

**可能成因。** 五個標準成因，依出現頻率排序。
1. **OU 錯誤。** 該電腦物件位於 `CN=Computers` 而非預定的 OU，因此沒有任何連結至 `OU=VertexPeak` 之下 OU 的 GPO 能觸及它。這正是基準 §9.2 禁止使用預設容器的具體原因。
2. **安全性篩選**排除了該目標（目標不在 ACL 中，或處於拒絕狀態）。
3. **WMI 篩選**未能相符。
4. 中間 OU 上**繼承被封鎖**，或某個連結已停用。
5. **設定衝突** —— 較晚套用的 GPO 勝出，而被測設定來自落敗者。在本設計中，經典案例是 DMZ 基準在一部曾在 OU 之間被移動的主機上被成員伺服器基準覆寫。

**解決方案。**
```powershell
gpresult /scope:computer /v /h C:\FYP\config\gpresult-$(hostname).html
Get-ADComputer <name> -Properties DistinguishedName | Select-Object DistinguishedName, MemberOf
Get-GPInheritance -Target 'OU=MemberServers,OU=Servers,OU=Computers,OU=VertexPeak,DC=vertexpeak,DC=fyp,DC=lab'
Get-GPOReport -Name 'GPO-SRV-Member-Server-Baseline' -ReportType Html -Path C:\FYP\config\gpo-report.html
# Force and re-check, noting the exact time so the log correlates
gpupdate /force /boot /logoff
```
報告的敘事應包含一個真正被錯誤連結的 GPO 及其診斷，因為領域 6 獎勵已展示的疑難排解，而非「一切首次即成功」的主張。

#### T-14 配額正被繞過 —— 使用者可寫入超出限制

**徵狀。** FSRM 主控台回報某共用已達其配額的 130 %，然而寫入仍持續成功。

**可能成因。**
1. 該路徑上的配額物件是**軟性**配額（`-SoftLimit:$true`），它記錄一個事件並允許寫入。使用該 Cmdlet 時極易不小心如此建立。
2. 寫入發生在**不同的路徑** —— 最常見是有人在伺服器上直接寫入 `D:\Shares\...`，此舉繞過 SMB 共用但仍應觸及配額；或寫入一個完全不處於受配額管治路徑之下的資料夾。
3. **硬連結或疏鬆檔案**行為使回報的使用量膨脹而未消耗實際空間，使該百分比具誤導性。
4. 配額套用於共用根目錄，但使用者寫入一個解析至別處的**接合點或掛接點**。

**解決方案。**
```powershell
Get-FsrmQuota -Path 'D:\Shares\Finance' | Select-Object Path, Size, SoftLimit, Usage, PeakUsage
Get-FsrmAutoQuota | Select-Object Path, Template, Usage
Get-FsrmQuotaTemplate -Name 'TMPL-Quota-Finance-20GB' | Select-Object Name, Size, SoftLimit
# Prove the hard limit actually denies a write with the QA-1 procedure of §7.5.6
```
值得記錄的教訓：一個只回報百分比卻不拒絕寫入的配額不是控制，而區分兩者的測試是寫入測試，而非主控台檢視。

#### T-15 VPN 用戶端未從位址池取得位址，或與另一用戶端取得相同位址

**徵狀。** 通道建立，但用戶端沒有 `10.10.201.x` 位址（或得到 APIPA 的 `169.254.x.x`），或兩個用戶端回報相同的位址池位址。

**可能成因。**
1. 位址池範圍從未設定，或被設為一個與 LAN 空間重疊的範圍。`Get-VpnServerIPAddressRange` 會顯示它。
2. 位址池已耗盡：191 個位址（`10.10.201.10`–`10.10.201.200`）對本實驗室而言充裕，但一個開啟大量工作階段的實驗性指令碼可以耗盡它，且由於用戶端在沒有乾淨停止記錄的情況下中斷，位址可能不會即時被回收。
3. 用戶端有一個**配置了靜態 IP 位址的過期連線設定檔**，覆寫了位址池。
4. 先前工作階段執行的 `rasdial` 留下了仍被繫結的介面卡；第二次連線重用了該過期介面卡的位址。

**解決方案。**
```powershell
Get-VpnServerIPAddressRange
Get-RemoteAccessConnectionStatistics | Select-Object UserName, ClientIPAddress, Duration, TotalBytesIn
# Look for pool exhaustion
(Get-RemoteAccessConnectionStatistics).Count
# Client side: remove any static address from the profile and reconnect
Get-VpnConnection -Name 'VP-IKEv2-Cert' | Select-Object -ExpandProperty Routes
rasdial 'VP-IKEv2-Cert' /disconnect
Restart-Service RasMan -Force
```
將該位址池對照基準的排除規則交叉核對：**任何 VPN 位址池均不得與 `10.10.0.0/16`、`10.20.20.0/16` 或 `10.70.0.0/16` 重疊，且不得使用 `172.16.0.0/16`。** 重疊的位址池會產生看似路由故障、實則不然的路由徵狀。

---

### 7.13 發現

本小節是記錄**實際觀察到的內容** —— 有別於所設計的內容 —— 的範本。主題表要求「findings」；WSOS 領域 6 要求 `The purpose of documenting the completion of the installation or up-grade` 及 `Prepare a technical document reflecting the solution in detail for agreement and sign-off`。一項與設計相悖的觀察比一項確認設計的觀察更有價值，而兩者均必須以相同格式記錄。

#### 7.13.1 如何記錄一項發現

每項發現均使用相同的六個欄位，使讀者能在整份報告中比較各項發現：
| 欄位 | 內容 |
|---|---|
| **F-ID** | `F-L1-{nn}` —— 路線 L1，依序編號 |
| **發現點** | 作出該觀察的小節、測試案例 ID（`TC-L1-{nn}`）及日期 |
| **預期** | 設計所預測者，陳述為一項可量度的主張 |
| **觀察到** | 實際發生者，陳述為一項量測值或確切錯誤，並附產生它的指令 |
| **解讀** | 差異為何存在，或誠實陳明成因尚未確定 |
| **行動** | 已於建置中更正／記錄為限制／延後為後續工作／升級為基準修訂 |

#### 7.13.2 發現登記冊（於建置期間完成）
| F-ID | 發現點 | 預期 | 觀察到 | 解讀 | 行動 |
|---|---|---|---|---|---|
| F-L1-01 | §7.5.6、`TC-L1-02` | 配額超限的寫入失敗時附帶指名 FSRM 的錯誤訊息 | 用戶端錯誤為通用的 `There is not enough space on the disk`；FSRM 的歸因僅存在於伺服器側的 `SRMSVC` 事件中 | 配額強制執行對 SMB 用戶端呈現為 `ERROR_DISK_FULL`；用戶端無法得知成因 | 將配對佐證程序（§7.5.6）記錄為規定的測試方法 |
| F-L1-02 | §7.5.6、`TC-L1-02` | 遭遮蔽的檔案類型產生一個不同且可辨識的錯誤 | 檔案遮蔽拒絕傳回 `Access is denied`，在用戶端與 NTFS 拒絕無法區分 | 兩種狀況均對應 `ERROR_ACCESS_DENIED` | 將三向辨別法（T-06）記錄於建置手冊，作為標準診斷 |
| F-L1-03 | §7.5.3、`TC-L1-02` | 自動配額範本管治在該共用下建立的每個子資料夾 | *（待量測 —— 見 T-12）* | *（待以實證確定）* | 記錄所鎖定 FSRM 版本上實測到的行為，若有所不同則更正 §7.5.3 |
| F-L1-04 | §7.6.5、`TC-L1-03` | LUN 在目標重新啟動期間消失，並於之後自動重新掛接 | *（待量測）* | *（待確定）* | 記錄確切的復原時間，以及 `L:` 是否在無須介入的情況下重新掛接 |
| F-L1-05 | §7.6.2、`TC-L1-03` | 目標 IQN 與基準字串 `iqn.2026-01.lab.fyp.vertexpeak:storage-lun01` 相符 | Microsoft 的 iSCSI Target Server 推導其自身的目標 IQN；該專案字串用於起始器 | IQN 命名空間是按端點劃分，因此兩者均為合法 | 記錄哪個端點承載基準字串、擷取 `Get-IscsiServerTarget`，並在小組採取選項 2 時更正基準 §16 |
| F-L1-06 | §7.4.5、`TC-PKI-01` | 已發佈的憑證範本無須手動變更權限即可自動註冊 | `certutil -CATemplates` 對每個範本均回報 `Auto-Enroll: Access is denied.` | 這是 CA 的預設狀態而非錯誤：自動註冊權存在於範本 ACL 及原則中 | 記錄此輸出的正確解讀（§7.4.5）以防止誤診 |
| F-L1-07 | §7.8.5、`TC-L1-05` | IKEv2 通道將遠端使用者精確限制於 TB-01 與 TB-11 所允許的子網路 | *（待量測，包括負向測試）* | *（待確定）* | 記錄每個獲允許及每個被拒絕的目的地及其 TB 列號 |
| F-L1-08 | §7.7.3、`TC-L1-04` | RRAS 在設計中任何地方均不執行 NAT | *（待以 `Get-NetNat` 確認）* | *（待確認）* | 若 `vpnz-rras01` 上存在任何 NAT 物件，必須移除並記錄該發現，因為兩個轉譯點會破壞稽核軌跡 |
| F-L1-09 | §7.3.5、`TC-L1-01` | 一部剛升級的 DC 首次嘗試即乾淨複寫 | `repadmin /showrepl` 在升級後立即顯示少數幾次連續失敗 | 屬 DNS 登錄與首次複寫週期之間的預期過渡狀態 | 記錄首次乾淨複寫的時間戳，並將所經時間記錄為建置規劃數據 |
| F-L1-10 | §7.3.3、`TC-L1-01` | 基準固定 15 分鐘的站台連結間隔 | *（待確認，並附該間隔下觀察到的複寫延遲）* | *（待確定）* | 若觀察到的分支複寫延遲對 RODC 測試而言不可接受，則提出基準修訂，而非靜默變更該值 |
| F-L1-11 | §7.7.2、`TC-L1-04` | `netsh routing ip` 介面在所鎖定的組建上可用 | *（待確定）* | *（待確定）* | 記錄實際使用了哪一種機制，並從建置手冊中移除另一種，或清楚標示其不可用 |
| F-L1-12 | §7.5.4、`TC-L1-02` | 封鎖高風險副檔名可量度地減少其在共用上的存在 | 在 `D:\Shares\Public` 上執行被動遮蔽一週，並計數原本*會*被封鎖的項目 | *（待由該計數確定）* | 記錄該數字。一項實測的出現率把一項原則決策轉化為有佐證的發現 |
| F-L1-13 | §7.5.5、`TC-L1-02` | 重複檔案報告找出值得回收的浪費 | *（待量測）* | *（待確定）* | 若重複內容佔配額的比例可觀，則提出重複資料刪除或按專案重新設計資料夾作為後續工作 |
| F-L1-14 | §7.3.6、`TC-L1-01` | 每項強化設定均套用於預定的 OU 而不及其他 | *（待以逐 OU 的 `gpresult` 確認，包括負向案例）* | *（待確定）* | 除正向結果外，亦記錄負向結果（一個正確地**未**套用的 GPO） |
| F-L1-15 | §7.9.3 | Windows 事件資料到達監控堆疊 | *（待經由 WEC 訂閱及收集器的 `ForwardedEvents` 日誌確認）* | Windows 並非 syslog 傳送者；該路徑為 WinRM 5986 | 明確記錄兩條不同的攝入路徑，使任何拓撲圖均不會暗示其他情况 |

#### 7.13.3 明確要求記錄的發現，無論其是否光彩

基準自身的紀律（`13.4` R-06 及 `19` 規則 3）要求下列事項若發生即必須以發現形式出現，而它們列於此處，是為了避免在進度壓力下被悄然省略：

- **任何與基準 §7 不同的版本。** `Get-ComputerInfo`、`$PSVersionTable`、`certutil -cainfo`、`Get-VpnAuthProtocol` 及每個其他列印版本的指令其實際輸出均必須擷取，且與所鎖定值的每一項差異均須列於「版本偏差」小節並附其影響。記錄一個與執行中系統不符的版本，是一項可報告的誠信失效。
- **本節中任何經證明為錯誤的 `[ASSUMPTION]`。** 最可能失效的具體項目為：`-ForestMode 'Win2025'` 值、`New-FsrmQuotaTemplate -Threshold` 參數形式、`New-FsrmScheduledTask` 參數名稱、`Set-VpnServerIPsecConfiguration -EncryptionType MaximumEncryption` 值，以及 NPS Cmdlet 介面。每一項均必須標示為已更正，並將更正後的形式以修訂方式記錄於基準中。
- **任何完全無法執行的測試**，並附原因。「因 Hypervisor 無法觸達 VLAN 113（`RODC` 第二張 NIC）而無法測試」是一項可接受且有用的發現；靜默缺失的測試則不是。
- **任何對基準的刻意偏離**，並附授權該偏離的決策日誌記錄，以及該偏離觸及基準 §16 之處的導師知悉情況。
- **DMZ 加入網域的決定（基準待辦事項 O-05）**及其安全後果，不論決定為何，因為 §7.3.6 G-5 完全依賴它。
- **單層與兩層 PKI 的決定（基準待辦事項 O-06）**，於本節敘事中明確陳明，並描述該取捨而非僅列出。
