## 5. 文獻與技術綜述

本章回顧官方題目表為 *Victor2 – Enterprise Network Infrastructure and Architect* 所列出的五條技術路線。就每一條路線，本章確立當前技術水準、識別候選技術、說明為何選用所指名的技術、記錄曾考慮但被否決的替代方案、審視其安全與營運後果，並將該選擇對應到 WorldSkills Occupational Standards（WSOS）2026《IT Network Systems Administration》（Skill 2447，WorldSkills Shanghai 2026）的評核範疇。關於該標準的每一項陳述，均取自本儲存庫內所保存、經核實的擷取文件（`proposal\research\wsos-2026-2447.md`）；該文件本身的普查（第 3.7 節）與稽核列（附錄 A）記錄了自官方網頁機器擷取的 131 條要求條文，並已逐字重新核實，0 項不符。該資料包亦載有更正章節（第 7 節，項目 C1–C6），其效力取代其所檢視的較早評述——尤其是 C1：2026 年版的範疇 5 已刪去 Python、YANG、RESTCONF 與 NETCONF。

有兩項初步的誠實聲明是必要的。第一，該標準並非技術清單。它由六個加權部分組成——工作組織與管理（5 %）、溝通與人際技巧（5 %）、資料傳輸網路（25 %）、網路與系統營運（25 %）、基礎架構自動化（15 %）以及疑難排解（25 %）——因此 75 % 的評核權重落在三個各佔 25 % 的技術範疇之中。題目表所指名的若干技術在該標準中根本不存在：`FSRM`、`iSCSI`、`RRAS`、`IKEv2`、`Keepalived`、`nftables`、`WireGuard`、`RSTP`、`ASA`、`Agentic`、`OpenClaw`、`MCP`、`artificial intelligence` 與 `machine learning`，在 2026 年的文本中各自出現零次，*而*在該網頁的原始 HTML 中亦各出現零次。本章凡說某項技術「被指名」，即表示該字串確實存在，且引用了逐字的要求條文；凡不存在者，本章會明言，並依題目表或某條通用要求條文來論證該選擇，同時將此推論標示為**橋接**（bridge）。第二，WSOS 2026 並無任何關於螢幕截圖的要求：`screen`、`capture`、`screenshot` 與 `evidence` 各出現零次。產出發現、手冊、步驟、螢幕截圖、驗證與參考資料的義務，屬於電訊及網路高級文憑（HDTN）題目表的要求。該標準確實三次要求文件化，而其中一條條文——`Prepare a technical document reflecting the solution in detail for agreement and sign-off`（範疇 6，25 %）——是該標準中對本專案文件份量最有力的單一論據。

### 5.1 Microsoft Server 網路與網路服務

#### 5.1.1 技術現況

企業目錄服務已收斂為兩種持久模式：一是緊密整合、多主機複寫的目錄，附帶與身分識別相鄰的服務及內建原則引擎；二是在 Linux 上由營運者自行組裝的一組可組合、單一用途的常駐程式。另有兩股趨勢主導局面。遠端存取已由預共用金鑰轉向憑證驗證的 IKEv2 及以 TLS 為基礎的通道；區塊儲存已由直接附加磁碟轉向網路附加區塊裝置，使機器的儲存可較其主機活得更久；而檔案服務則取得了原則層——配額、檔案篩選、分類——因為單憑共用權限無法強制執行容量或內容原則。

#### 5.1.2 候選技術

| 所需能力 | 曾考慮的候選技術 | 題目表所指名者 |
|---|---|---|
| 目錄與驗證 | Active Directory Domain Services（AD DS）；Samba AD DC；搭配 Kerberos 的 OpenLDAP | AD DS |
| 憑證授權單位 | Active Directory Certificate Services（AD CS）；直接驅動 OpenSSL；Easy-RSA | AD CS |
| 具原則的檔案服務 | 搭配 File Server Resource Manager（FSRM）的 Windows 檔案伺服器；純 NTFS 權限；搭配 Linux 配額的 Samba 或 NFSv4 | FSRM |
| 區塊儲存 | Microsoft iSCSI Target Server；Linux LIO/targetcli；NFS 匯出；SMB 3 共用 | iSCSI |
| 遠端存取 | 搭配 IKEv2 的 Routing and Remote Access Service（RRAS）；OpenVPN；WireGuard；以預共用金鑰運作的 IPsec 上的 L2TP | RRAS、IKEv2 |

#### 5.1.3 為何選用所指名的 Microsoft 技術

**以 AD DS 作為單一目錄。** 該標準直接指名此技術：`Install and manage enterprise directory services (ADDS, LDAP)`（範疇 4，25 %），而另一條條文 `Select the roles and/or features of the operating/server system e.g. Active Directory Domain Services (role) and Window Server Back-up (feature)`（範疇 6）則使角色／功能的選擇本身即成為受評核的能力。本設計採用一個樹系、一個網域與一個樹狀結構 `vertexpeak.fyp.lab`，功能層級為 Windows Server 2025，在總部設兩部可寫入的網域控制站（`vpnz-dc01`、`vpnz-dc02`），並在觀塘設一部唯讀網域控制站（`vpnz-brdc01`）。該 RODC 並非裝飾，而是承重的：它是分支機構驗證得以在廣域鏈路失效時存續的機制，並迫使小組明確思考哪些認證資料會複寫到防護較弱的地點。

**以 AD CS 提供內部 PKI。** 該標準在 `Setup public key infrastructure services`（範疇 4）之下同時指名 `Active Directory Certificate Services` 與 `OpenSSL`。選用 AD CS，是因為它是唯一能透過群組原則物件（GPO）向已加入網域的主機自動註冊機器憑證的候選方案，而這正是客戶盡職審查要求「以憑證進行加密遠端存取、不使用共用密碼」所必需的。憑證鏈為 `VP-ROOT-CA`（離線根）簽發 `VP-ISSUING-CA-01`（線上）。若小組在第 7 週斷定兩層式 PKI 無法在時程內運作，文件所載的備用方案為單層式、由 `vpnz-dc01` 直接簽發，而報告必須說明實際採用的是哪一種模式。

**在 NTFS 之上疊加 FSRM。** 該標準不含 `FSRM` 字串；其論據來自題目表，加上 `Install and manage sharing services`（下含 `SMB`、`DFS`、`NFS`、`FTP`）以及 `Manage file systems`（範疇 4）。FSRM 是疊加在 NTFS 權限之上，而非取而代之，而這個區別正是重點：NTFS 與共用權限是**存取控制**機制，而 FSRM 是**原則與計量**機制。FSRM 增加了四項 NTFS 無法表達的能力。*配額*對每個資料夾設定容量上限與警告門檻，而 NTFS 只能以「磁碟區滿載時拒絕寫入」來勉強近似。*檔案篩選*主動拒絕指名的檔案群組——基線會套用 `*.exe;*.vbs;*.mp3`——這是內容類型控制，而非身分識別控制。*儲存報告*產出重複檔案、大型檔案、最近最少存取及配額使用情況等證據，是本設計中唯一能顯示某個共用實際上如何被使用的機制。*分類與檔案管理工作*容許原則跟隨內容而非路徑。在營運上，FSRM 回答了客戶盡職審查清單所暗示卻未明問的問題：不是「誰可以開啟這個檔案」，而是「這個部門的資料可以增長到多大、可以包含什麼，以及我們能否證明原則已被執行？」基線實作了 `D:\Shares\Finance`（20 GB）、`Engineering`（10 GB）、`SalesRO`（10 GB）與 `Public`（5 GB），並使用檔案群組 `Blocked-Executables`。

**以 iSCSI 服務平台層。** `iSCSI` 不見於該標準；其橋接為 `Manage file systems`（下含 `LVM/Dynamic disks`、`Software RAID`）加上題目表的明確指名的技術。功能性理由在於，iSCSI 呈現的是*區塊裝置*——發起端透過 TCP 3260 看到一顆原始磁碟，並可在其上放置任何磁碟區配置——而 SMB 與 NFS 呈現的是*檔案系統介面*，其中磁碟區結構與中介資料語意由伺服器擁有。

| 屬性 | iSCSI（以 TCP 3260 傳送區塊） | SMB 3 / NFS（以 TCP 445 / 2049 傳送檔案） |
|---|---|---|
| 向用戶端暴露的單位 | 一個原始 LUN；由用戶端選擇 NTFS、ReFS 或 EXT4 | 伺服器所擁有磁碟區上的檔案與目錄 |
| 用戶端檔案系統控制權 | 完整——發起端可格式化、掛載並管理該磁碟區 | 無——配置由伺服器指定 |
| 裝置層多重路徑／容錯移轉 | 有，透過 MPIO 或 Linux multipath；LUN 可重新呈現給另一部主機 | 僅工作階段層容錯移轉 |
| 存取控制 | 目標端：發起端 IQN 允許清單、CHAP 密鑰，加上 TCP 3260 上的網路 ACL | 對 Kerberos 或 LDAP 身分識別套用的共用與檔案權限 |
| 目標失效時的故障模式 | 區塊裝置消失，客體檔案系統變為無回應；持續寫入可能使其損毀 | 掛載點變為過期；在應用層通常較為乾淨 |
| 在本設計中的適用性 | 必須能在主機之間移動的平台層磁碟區；`vpnz-san01` 上的 20/40/60 GB 精簡 LUN | 不用於平台層；SMB 服務一般使用者共用 |

選用區塊語意，是因為本專案必須展示一條獨立於客體自身檔案服務堆疊的儲存路徑，也因為經 CHAP 驗證的發起端與目標關係是一項具體的最小權限控制，且無直接對應的 SMB 機制。本設計刻意不使用 MPIO、不將 LUN 繞送出 VLAN 80 之外，亦不宣稱具備 Windows 容錯移轉叢集或 Storage Spaces Direct。

**以搭配 IKEv2 的 RRAS 提供遠端存取。** `RRAS` 與 `IKEv2` 均不見於該標準。有兩條橋接條文可支持此項工作：範疇 4 的 `Install and manage remote network access services`（下含 `SSH`、`Remote Desktop Services`），以及範疇 3 的 `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.`，後者直接指名的技術是 IPsec。RRAS 在 `vpnz-rras01` 上以 IKEv2 遠端存取伺服器的形式運作，並以 Network Policy Server（NPS）作為 RADIUS 授權權威。IKEv2 透過在 UDP 4500 中封裝 IPsec ESP 以及原生 UDP 500 來支援 NAT 穿越，而其重新產生金鑰與存活偵測模型，正是它能在漫遊筆記型電腦所經歷的網路變化中存續的原因；此協定家族載於 RFC 7296《Internet Key Exchange Protocol Version 2 (IKEv2)》。有兩項非預設選擇屬於決策而非預設值。驗證方式**僅限憑證式**——機器憑證加上使用者帳戶——而預共用金鑰的 IKEv2 在設計上被禁止，因為預共用金鑰就是共用密碼，而客戶的要求排除了共用密碼。此外，**分割通道（split tunnelling）已停用**，因此所有用戶端流量都經過通道，存在單一可稽核的路徑，其路由表可擷取為證據。NPS 同時要求有效的機器憑證與 `GG-VPN-Users` 的成員資格，這使授權成為一項可測試的群組成員資格事實——只要移除某位使用者並重新連線即可驗證。

#### 5.1.4 曾考慮並否決的替代方案

| 替代方案 | 否決理由 |
|---|---|
| **Samba AD DC** | Samba 能勝任真正的 AD 相容網域控制站角色，是最強的開放源碼候選方案。它被否決，是因為本專案必須展示群組原則、AD 整合式 DNS、AD CS 自動註冊、FSRM 與 RRAS IKEv2——這些 Windows 原生角色／功能組合的 GPO、憑證範本與 NPS 行為，只有在 Windows Server 上才能完整驗證。若具約束力的限制是授權成本而非能力，Samba 仍是正確答案，而報告必須如此說明，而不是暗示 Samba 較遜。 |
| **搭配獨立 Kerberos 領域的 OpenLDAP** | 因整合風險而否決。OpenLDAP 是通用目錄，且在該標準的同一條條文中與 AD DS 並列指名的技術，但它不是網域控制站：沒有同等成熟的複寫機制、沒有群組原則派送、沒有整合式 DNS、沒有原生的 Windows 服務驗證。重建這些服務將耗盡時程，卻不會增加受評核的能力。 |
| **為整個 PKI 直接驅動 OpenSSL** | 該標準在 AD CS 之外亦指名的技術為 `OpenSSL`，而本設計在 Linux 一側透過 Easy-RSA 間接使用 OpenSSL 基本元件。在 Windows 一側否決直接使用 OpenSSL，是因為它不提供註冊或續期自動化、沒有範本模型，也沒有信任錨的群組原則派送；以人手管理十餘張主機憑證，其可稽核性將低於它所取代的自動化。 |
| **以 Samba 或 NFS 搭配 Linux 配額取代 FSRM** | 反對此作為主要機制：Linux 配額工具沒有依檔案群組篩選的對等能力、沒有儲存報告產生器，也沒有通往盡職審查敘述所需的客戶端報告的路徑。Linux 資產仍依 `Manage file systems` 使用 `mdadm`、LVM 與 EXT4，因此此替代方案並非未被體現——它只是不是檔案原則問題的答案。 |
| **以預共用金鑰的 L2TP/IPsec 取代搭配憑證的 IKEv2** | 直接否決：預共用金鑰是靜態共用密碼，會分發給每一位用戶端。 |
| **以 NFS 或 SMB 取代 iSCSI** | 就平台層而言，如前所述予以否決：檔案層通訊協定無法提供用戶端可控的區塊語意或基於發起端身分識別的存取控制。 |
| **Windows 容錯移轉叢集、Storage Spaces Direct、Scale-Out File Server** | 否決並標示為**未涵蓋**。單一 Hypervisor 主機無法提供真正獨立的共用儲存路徑，而嵌套虛擬化的叢集將產生無法誠實地呈現為可用性工程的結果。已記錄為未來工作。 |

#### 5.1.5 安全與營運考量

最小權限以群組而非個別帳戶來編碼：`GG-Server-Admins`、`GG-Tier0-Admins`、`GG-Helpdesk`（僅對 `OU=Users` 具委派重設權限），以及對應到 FSRM 共用的 `GG-Finance-RW`／`GG-Finance-RO`。四名學生中有兩人持有 `GG-Tier0-Admins`，且是唯一獲准接觸 `vpnz-dc01`、`vpnz-dc02` 或憑證授權單位的帳戶；其餘人員負責管理成員伺服器、網路裝置與 DMZ。此分層是由群組成員資格與登入權限原則所強制執行的社會性及帳戶層級控制，並非由硬體強制執行的特權存取工作站邊界，報告不得將其呈現為超出此範圍者。

在營運上，有四項事務居於主導地位。時間居首：Kerberos 能容忍的時鐘偏移不足五分鐘，因此 `vpnz-dc01` 是權威時間來源，而刻意製造的時間偏移故障是一項已記錄的疑難排解情境。DNS 居次：每個用戶端都依序設定 `10.10.30.11`、`10.10.30.12`，而分支的唯讀控制站絕不會是任何用戶端唯一的解析器，因為一個 DNS 無法觸達的網域在功能上已經失效。容量居第三：FSRM 配額可能悄悄地把應用程式故障轉化為磁碟空間不足的錯誤，因此配額門檻必須透過監控堆疊發出告警，而不是由使用者發現。備份居第四，且最容易被過度宣稱：本設計涵蓋將 Windows Server Backup 寫入一個 iSCSI LUN，加上已記錄的異機設定與證據副本，並且明確不宣稱具備 Hypervisor 層或全系統備份，因為此處並不存在該等授權。

#### 5.1.6 對應至 WSOS 範疇

| 設計元素 | 所服務的 WSOS 範疇 | 依據 |
|---|---|---|
| AD DS 樹系、OU 樹、站台、群組、服務帳戶 | 4 網路與系統營運（25 %） | **指名的技術**：`Install and manage enterprise directory services (ADDS, LDAP)` |
| AD 整合式 DNS、轉寄站、反向區域、分支次要解析器 | 4（25 %） | **指名的技術**：`Install and manage domain name services (Windows DNS, BIND)` |
| 具容錯移轉與轉送的 DHCP | 4（25 %） | **指名的技術**：`Install and manage dynamic host configuration services` |
| NTP 階層與時間偏移測試 | 4（25 %）；6 疑難排解（25 %） | **指名的技術**：`Install and manage network time services` |
| AD CS 兩層式 PKI 與自動註冊 | 4（25 %） | **指名的技術**：`Setup public key infrastructure services` → `Active Directory Certificate Services`、`OpenSSL` |
| SMB 共用與 DFS；FSRM 配額與篩選 | 4（25 %） | `Install and manage sharing services` + `Manage file systems`；FSRM 本身**未被指名的技術** |
| iSCSI 目標與發起端 | 4（25 %） | `Manage file systems` / `LVM/Dynamic disks`；iSCSI **未被指名的技術** |
| 搭配 NPS 的 RRAS IKEv2 遠端存取 | 4（25 %）；3 資料傳輸網路（25 %） | `Install and manage remote network access services`；`...VPN technologies such as IPSec, SSL VPN, ...`；RRAS 與 IKEv2 **未被指名的技術** |
| 備份至 iSCSI LUN 及異機證據副本 | 4（25 %） | **指名的技術**：`Install and manage backup systems` → `Windows Server Backup`、`rsync`、`Script based backup, e.g. Bash, Batch or PowerShell` |

**選擇理由。** 選用 Windows Server，是因為題目表指名的技術包含六項 Windows 專屬能力——AD DS、AD CS、FSRM、iSCSI、RRAS 與 IKEv2——也因為 AD DS 是整個專案中少數獲 WSOS 2026 在要求條文內逐字指名的技術之一，使這項選擇能同時從兩個方向取得論據。FSRM 是疊加在 NTFS 權限之上而非取代之，因為存取控制與容量或內容原則是不同的問題，而只有 FSRM 能為本專案提供一個可引述的強制執行事件，即以拒絕寫入的形式呈現。就平台層而言，iSCSI 優於 SMB 或 NFS，因為區塊 LUN 將磁碟區控制權暴露給用戶端，並支援以發起端身分識別為基礎的存取模型，而這正是該層必須展示的特定最小權限行為。選用搭配 IKEv2 與僅憑證驗證的 RRAS，是為了滿足客戶對共用密碼的禁止，並使授權成為一項可透過移除與重新測試來舉證的群組成員資格事實。本路線中凡該標準未指名者，均呈現為由題目表與一條通用要求條文所論證的決策，而絕不呈現為 WSOS 的要求。

### 5.2 Linux 伺服器管理

#### 5.2.1 技術現況

Linux 伺服器管理已朝向以宣告方式描述的資產發展：一個最小化且可重現的基礎映像；以原子式規則集而非命令序列表達的防火牆；以浮動虛擬位址加上服務感知健康檢查來表達的可用性；以及每一個設定檔都由版本控制擁有。另有兩項轉變清晰可見。反向代理已成為 Web 服務的標準發佈點，因此原始伺服器不再暴露，而 TLS 則在代理處終止並重新加密。VPN 工程則已一分為二：成熟的 TLS 型通道服務於需互通、原則繁重的部署，而最小化的核心整合式通道則在任何吞吐量與設定簡潔性佔優之處取代了它們。

#### 5.2.2 候選技術

| 所需能力 | 曾考慮的候選技術 | 題目表所指名者 |
|---|---|---|
| Web 服務與反向代理 | Nginx；Apache HTTP Server；Microsoft IIS；作為純代理的 HAProxy | Nginx |
| 虛擬位址容錯移轉 | Keepalived（VRRP）；DNS 輪詢或多筆 A 記錄；商用應用交付控制器；雲端負載平衡器 | Keepalived |
| 封包過濾與 NAT | nftables；iptables/ip6tables；ufw；firewalld | nftables |
| 遠端存取 VPN | OpenVPN；WireGuard；strongSwan IPsec；SoftEther | OpenVPN、WireGuard |
| Linux 端 PKI | Easy-RSA；直接使用 OpenSSL；step-ca | （未被指名的技術；為支援上述項目而選用） |

#### 5.2.3 為何選用所指名的 Linux 技術

**以 Nginx 作為反向代理與 Web 層。** Nginx 獲逐字指名：`Install and manage web hosting services using modern web servers e.g. Apache, Nginx and IIS.`（範疇 4）——此條文指名的技術涵蓋本專案三部 Web 伺服器中的全部三部，因此下文的比較可直接受評。選用 Nginx 作為 DMZ 前門，是因為其事件驅動架構能以適度的記憶體處理大量並行、多數閒置的連線，而這正是 TLS 終止代理的負載特徵；因為一個 `upstream` 區塊只需數行即可表達一個伺服器池；也因為搭配重新加密上游的 `proxy_pass` 能提供真正的端對端 TLS，而非 DMZ 內部的明文跳點。有兩組各自獨立的配對在浮動位址之後運作：`vpnz-dmzrev01`／`vpnz-dmzrev02` 位於 VIP 10.10.90.10 之後，擁有伺服器池 `weba_pool`（10.10.90.21:443、10.10.90.22:443）與 `wp_pool`（10.10.90.25:443、10.10.90.26:443），而 Nginx 亦服務內容節點 `vpnz-dmzwp01`／`vpnz-dmzwp02`。

| 準則 | Nginx | Apache HTTP Server | Microsoft IIS |
|---|---|---|---|
| 程序／執行緒模型 | 事件驅動、非同步；每個核心一個工作程序 | 混合多程序／多執行緒；傳統模型中每個連線一個程序或執行緒 | 核心模式 HTTP.sys 驅動程式搭配工作程序 |
| 大量閒置連線下的記憶體 | 低且大致持平 | 較高；需要調校 | 低，但與 Windows 工作程序模型緊密綁定 |
| 設定慣例 | 具繼承關係的宣告式 `server`／`location` 區塊 | 逐目錄的 `.htaccess` 與模組指令 | GUI 加上 `applicationHost.config` 與 `web.config` |
| 反向代理與 TLS 終止 | 一級支援，透過 `proxy_pass` 與 `upstream` 伺服器池 | 透過 `mod_proxy` 表現良好 | 透過 ARR 表現良好，但並非預設的部署慣例 |
| 該標準的處理方式 | 在**同一條**要求條文中**被指名的技術** | 在**同一條**要求條文中**被指名的技術** | 在**同一條**要求條文中**被指名的技術** |
| 在本設計中的角色 | **前門**：TLS 終止、重新加密、HTTP 轉 HTTPS 重新導向、內容代管 | 未部署 | **已部署**於 DMZ 應用層（`vpnz-dmzweba01/02`） |

本設計刻意使用該標準所指名的三部伺服器中的兩部——Linux 上的 Nginx 與 DMZ 中 Windows 上的 IIS——使報告得以依據真實設定而非抽象概念來比較兩者。

**以 Keepalived 實現虛擬位址容錯移轉。** `Keepalived` 不見於該標準，但它所實作的協定則不然：`Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.`（範疇 3）指名的技術是 **VRRP**。此橋接強而有力，且必須呈現為橋接：該標準指名的技術是 VRRP，而 Keepalived 是 VRRP 的一種實作。此處存在兩個各自獨立的實例——nftables 配對上的 VRID 51（VIP 10.10.50.10 位於 10.10.50.0/28，節點為 10.10.50.11 與 10.10.50.12），以及 Nginx 配對上的 VRID 61（VIP 10.10.90.10 位於 10.10.90.0/24，節點為 10.10.90.28 與 10.10.90.29，因此該 VIP 不屬於任何節點）——而這些識別碼刻意不同，因為在同一組可能被橋接的兩個網段上重複使用同一個識別碼，會產生兩個 master 與位址重複的故障。兩組配對都在單一廣播網域內移動，因此沒有 VRRP-over-tunnel 的注意事項適用。

| 機制 | 容錯移轉如何被觸發 | 優點 | 對本設計而言的弱點 |
|---|---|---|---|
| **Keepalived/VRRP（已選用）** | Master 以固定間隔發出通告；錯過通告的 Backup 會自我提升。`track_script` 亦可在服務檢查失敗時將 master 降級 | 廠商中立；適用於任何 IP 服務；轉換時間為次秒至數秒；健康檢查可以是服務感知而不僅是鏈路感知；單一工具服務兩種不同服務 | 需要共用的第 2 層網段；VRRP 驗證機制薄弱，必須被描述為實驗室簡化；優先順序設定錯誤可能產生雙 master |
| DNS 輪詢或多筆 A 記錄 | 無——DNS 回傳數個位址，並依賴用戶端嘗試另一個 | 極其簡單；無額外元件；可跨網段與站台運作 | 沒有健康狀態感知，因此失效的伺服器仍持續收到連線；用戶端重試行為不一致且無法明確指定；TTL 快取延遲了撤除；不產生任何可舉證的容錯移轉事件 |
| 商用應用交付控制器 | 專有健康監控加上設備容錯移轉 | 豐富的第 7 層健康監控、連線排空與大規模 TLS 卸載 | 成本與授權與「不使用商用授權」的限制衝突；增加了小組無法完整記錄的黑盒；並非工作說明書所需 |
| 雲端負載平衡器 | 供應商對受管理端點的健康檢查 | 具彈性，且無需自行維運基礎架構 | 本設計是自成一體的實驗室，沒有雲端帳戶也沒有真實的公眾位址；此依賴會破壞可重現性 |

**以 nftables 進行過濾與 NAT。** `nftables` 不見於該標準；其橋接為 `Apply basic security configuration for control and data plane`（範疇 3），加上範疇 3 的知／懂條文 `Security protocols to secure local and wide area networks` 與 `Common types of attacks on network protocols and mitigation methods`。此配對以*直列*（inline）方式位於總部核心與 ASA 之間，因此所有從 `Z-SERVER` 與 `Z-USER` 朝網際網路方向去的流量，都會經過一個同時執行 NAT 的具狀態、具記錄功能的過濾器。單一規則集為 `/etc/nftables.conf` 中的 `table inet fyp_filter`，並在 `/etc/nftables.d/` 之下包含片段（`10-sets.nft`、`20-filter-input.nft`、`30-filter-forward.nft`、`40-nat.nft`、`90-logging.nft`），這些片段是以 `include` 納入而非獨立載入，因為 nftables 是一套原子式規則集，而分別載入片段會產生沒有原則可言的過渡狀態。

| 防火牆工具 | 底層機制 | 設定模型 | 判定 |
|---|---|---|---|
| **nftables（已選用）** | 單一核心規則集，具具名表格、鏈、集合、映射與判定 | 一個原子式檔案，可以交易方式載入；原生集合使對等群組比對更有效率；具逐規則記錄前綴 | 已選用：原子式套用、用於信任區對等群組的集合、每條丟棄規則上的 `log prefix "NFT-DROP: "`，以及已記錄的回滾計時器 |
| iptables/ip6tables | 舊式核心介面中各表格獨立的鏈 | 冗長的命令式指令序列；規則以有序清單存在，除非使用 `iptables-save`，否則沒有原子式的真實來源 | 否決作為主要方案：沒有單一宣告式產物可納入版本控制，且 IPv4/IPv6 的處理重複 |
| ufw | 舊式 netfilter 介面上的簡化前端 | 極短、帶既定主張的指令 | 否決用於路由器式的直列配對：此抽象層無法表達所需的轉送、NAT 與集合比對原則，且它使規則集脫離稽核軌跡 |
| firewalld | netfilter 後端之上的區域與服務 | 宣告式區域模型，具執行期與永久設定的區分 | 否決：區域抽象頗具吸引力，但原則已以明確的區域物件與 `ACL-{ZONE}-{DIR}-{NN}` 命名表達，而第二套平行的區域詞彙將招致不一致 |

此選擇伴隨三項營運控制。規則集由 `02-nftables-apply.sh` 套用，該腳本啟動一個回滾計時器，使不良的規則集無法把管理員鎖在遠端管理的虛擬機器之外——鎖定風險已記錄，而緩解措施亦已展示，因為該故障模式是遠端防火牆工作的典型後果。此配對的設定會被收集、納入版本控制並進行差異比對，使體制外變更變得可見。而 `vpnz-nft01` 與 `vpnz-mon01` 之間 UDP 51820 上的管理通道，則被記錄為體制外的逃生出口，其不存在必須在安全測試期間被舉證，因此該逃生出口不會變成未記錄的後門。

**同時使用 OpenVPN 與 WireGuard。** 該標準逐字指名的技術為 `OpenVPN`：`Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.`（範疇 3）。`WireGuard` 未被指名的技術；該標準所給的唯一許可，就是該條文末的 `etc.`，這使它成為**本專案中最弱的橋接**，而報告必須如此措辭說明。

| 準則 | OpenVPN 2.6.x | WireGuard（`wireguard-tools` 1.0.20210914） |
|---|---|---|
| 密碼學設計 | 以 TLS 為基礎；協商加密套件；典型為以私有 CA 與撤銷清單進行的 X.509 憑證驗證 | 固定的一組現代基本元件——金鑰協商用 Curve25519、驗證加密用 ChaCha20-Poly1305、雜湊用 BLAKE2s——不做協商，因此沒有降級攻擊面 |
| 攻擊面與程式碼規模 | 大型程式碼庫，含眾多選項與外掛機制；使用者空間 | 刻意精簡、與核心整合的程式碼庫，設定面極窄 |
| 效能 | 吞吐量較低、每封包成本較高，源自使用者空間複製與 TLS 記錄處理 | 在相同 CPU 成本下吞吐量顯著更高、延遲更低，因為採核心資料路徑與更簡單的協定 |
| 傳輸與穿越 | UDP 或 TCP，包括 TCP 443，在 UDP 被封鎖或限速之處極具價值 | 僅限 UDP；丟棄 UDP 的網路會使其完全失效 |
| 漫遊與 NAT | 重連邏輯與 `float` 行為可處理位址變更 | 漫遊是本質性的——對等端被觀測到的來源位址會更新工作階段而無需重新協商，這也是 `PersistentKeepalive` 僅需在用戶端側使用的原因 |
| 身分識別與撤銷 | X.509 身分識別搭配憑證撤銷清單；逐用戶端設定目錄可實現逐使用者原則 | 每個對等端一把原始公開金鑰；撤銷意味著移除該對等端項目，沒有對等的撤銷清單，也沒有逐使用者身分識別，除非由其他機制提供 |
| 營運成熟度 | 部署歷史極長、文件豐富、互通性廣泛 | 較新、較小、採用迅速；歷史上曾被標示為實驗性實作；在企業原則功能上仍較弱 |
| 在本設計中的角色 | 在 `vpnz-lnxra01` 上以 Easy-RSA PKI 實作的第二套獨立遠端存取方案，逐用戶端 `ccd`、偏好使用 `tls-crypt` 而非 `tls-auth`、停用 `duplicate-cn`，並具已記錄的撤銷測試 | 主要的小型辦公室通道（`WG-HQ-WC`）以及 nftables VIP 上的遠端工作者池；金鑰以 `wg genkey` 產生且從不提交；`AllowedIPs` 限制於確切所需的網路前綴，在站對站對等端上絕不使用 `0.0.0.0/0` |

兩者都被刻意使用，理由有三。第一是可辯護性：同時運行兩種通道，把比較性的陳述轉化為實測證據——握手擷取、吞吐量比較與 CPU 成本比較，皆在小組自有硬體上取得。第二是周邊的密碼學多樣性，使某一協定家族的缺陷不致於使遠端存取全面失效。第三是功能契合：WireGuard 的核心路徑與漫遊適合站對站及常時連線的情境，而 OpenVPN 的 PKI、逐用戶端原則、撤銷與 TCP 傳輸，則適合身處封鎖 UDP 網路之後的員工，或需要憑證層級撤銷語意的組織。有一項妥協必須說明：WireGuard 置於 **UDP 443**，這是通常獲准對外開放的連接埠，此為務實的可達性選擇而非安全控制；而 WireGuard 位於 UDP 443、IKEv2 位於 UDP 500/4500、OpenVPN 位於 UDP 1194，三者共存於同一個已發佈位址之後，意味著此配對上的解多工規則本身即屬與安全相關、需要審查的設定。

在 `vpnz-lnxra01` 上選用 Easy-RSA 3.1.x 作為 Linux 端的授權單位，是因為該標準在 `Setup public key infrastructure services` 之下指名的技術為 `OpenSSL`，而 Easy-RSA 是一套架構在 OpenSSL 基本元件之上的結構化工作流程，而非另一套密碼學堆疊；報告必須說明本專案使用的是 Easy-RSA 而非直接驅動 OpenSSL，因為那正是該標準所指名的技術與本專案實際操作之間的實質差異。

#### 5.2.4 安全與營運考量

Linux 資產依單一基線（`01-hardening-baseline.sh`）進行強化。禁止 root 登入；Linux 對 Linux 的存取停用密碼驗證，改採 Ed25519 金鑰；而授權僅限於群組 `gg-infra-admins`，其成員與四位具名管理員一致，使兩個平台共用完全相同的管理身分識別。位址家族原則在直列配對上雙向皆為預設拒絕，並在每次丟棄之前具明確的 `ct state established,related accept` 與記錄前綴。AppArmor 維持於發行版預設值，報告必須如此說明，而不得暗示曾撰寫自訂的強制存取控制原則。此路線有兩項固有營運風險並載於風險登錄冊：遠端防火牆變更可能移除管理存取，以回滾計時器腳本緩解；以及提交至版本控制的 VPN 金鑰即為永久性洩露，以 `.gitignore` 中的 `*.key`、`wg*.conf`、`*.pem`、`*.pfx` 與 `pki/` 項目、`/etc/wireguard/wg0.conf` 的 0600 權限模式、Ansible Vault，以及發佈前的憑證掃描（其輸出留存為證據）來緩解。此配對的 VRRP `auth_type PASS` 是在僅主機網段上的實驗室簡化做法，必須如此描述，而不得描述為最佳實務。

#### 5.2.5 對應至 WSOS 範疇

| 設計元素 | 所服務的 WSOS 範疇 | 依據 |
|---|---|---|
| Nginx 反向代理、TLS 終止、上游伺服器池、內容節點 | 4 網路與系統營運（25 %） | **指名的技術**：`Install and manage web hosting services using modern web servers e.g. Apache, Nginx and IIS.` |
| 具服務健康檢查的 Keepalived VRID 51 與 VRID 61 | 3 資料傳輸網路（25 %） | **橋接**：`...by using GLBP, HSRP, VRRP, LACP, PAgP, etc.` —— VRRP 被指名的技術，Keepalived 則否 |
| nftables 直列配對：具狀態過濾、NAT、集合、記錄、回滾 | 3（25 %） | **橋接**：`Apply basic security configuration for control and data plane`；nftables 未被指名的技術 |
| Easy-RSA PKI、撤銷、撤銷清單測試 | 4（25 %） | `Setup public key infrastructure services` → `OpenSSL`；Easy-RSA 是一套 OpenSSL 工作流程 |
| 具逐用戶端原則與撤銷的 OpenVPN | 3（25 %） | **指名的技術**：範疇 3 的 VPN 技術條文 |
| WireGuard 站對站與遠端工作者通道 | 3（25 %） | **最弱的橋接**：僅該條文末的 `etc.` |
| 強化、`sysctl`、SSH 原則、日誌轉送 | 3（25 %）；6 疑難排解（25 %） | `Apply basic security configuration for control and data plane`；`Use system logs to find and identify issues` |

**選擇理由。** 選用 Nginx，是因為該標準在與其替代方案相同的要求條文中指名的技術是它，因此比較可直接受評，也因為事件驅動代理是持有大量閒置連線之 TLS 終止前門的正確選擇。選用 Keepalived，是因為它實作了該標準所指名的技術 VRRP，使此路線中這一元件的標準連結是具名協定而非推論，也因為由健康檢查驅動的虛擬位址會產生 DNS 輪詢所無法產生的可觀測容錯移轉。nftables 優於 iptables、ufw 與 firewalld，是因為其原子式單一規則集模型為本專案提供了一份可納入版本控制、可審查、可回滾的宣告式產物，而這正是客戶所要求的可稽核變更實際上所需的性質。OpenVPN 與 WireGuard 兩者都部署，是因為彼此補足對方的弱點——僅限 UDP 與僅金鑰，相對於原則豐富與成熟——也因為同時營運兩者能把比較轉化為實測證據而非斷言。凡該標準未提及之處，每項選擇都呈現為橋接，並引用該推論所依據的要求條文。

### 5.3 Cisco 網路技術

#### 5.3.1 技術現況

企業路由與交換立基於少數穩定的概念。在自治系統內部，鏈路狀態式的內部閘道協定幾乎無處不用，因為拓撲圖能帶來快速且無迴圈的收斂與可預測的成本度量；在存在舊式 Cisco 資產之處，專有的內部協定往往仍舊留存，因為遷移的成本高於其收益。在邊界上，外部閘道協定承載的是原則而非拓撲。在存取層，生成樹家族仍是迴圈預防的正式機制，而較舊的演算法幾乎已被其快速後繼者全面取代。在周邊，無狀態存取控制清單已被具狀態、區域感知的設備所取代。

#### 5.3.2 為何選用所指名的 Cisco 技術

這是五條路線中涵蓋最完整的一條。該標準以一句話指名全部三種路由協定，這是本專案所能取得最有力的單一引用：

> `Provide enterprise-wide connectivity using internal and external gateway routing protocols such as OSPF, BGP and EIGRP`（範疇 3，資料傳輸網路，25 %）

**以 OSPF 作為內部閘道協定。** Open Shortest Path First 是一種鏈路狀態協定：每部路由器洪泛鏈路狀態通告，每部路由器為其區域建立相同的拓撲資料庫，並各自以 Dijkstra 演算法計算最短路徑。本設計在總部與觀塘之間運行**單一區域 0**，核心鏈路上啟用驗證，凡不可能合法形成鄰接關係之處皆設為被動介面，並在總部邊緣使用 `default-information originate`，使內部路由器收到一筆預設路由而非完整的外部路由表。刻意選擇單一區域而非多區域設計：多區域調校——區域範圍、stub 與 not-so-stubby 區域、虛擬鏈路——會帶來真實的複雜度與真實的故障模式，而受評核的價值在於建立、破壞並修復一個可運作的網域，而非在於一份 12 週時程無法驗證的階層理論。單一區域以外的 OSPF 進階功能、OSPFv3 與 MPLS 均未涵蓋。

**在情境足以支持之處使用 EIGRP。** Enhanced Interior Gateway Routing Protocol 是 Cisco 專有的進階距離向量協定，結合鄰居關係模型與擴散計算以保證無迴圈路徑，並承載由頻寬與延遲組成的複合度量，同時以可靠傳輸遞送自身的更新。它的優點與其鎖定效應是同一件事實：在單一廠商網域內既有效率又快，但限制了廠商選擇。在此，EIGRP 依情境本身的條件取得正當性。敘述中包含一項舊式併購——澳門代表辦事處與一段隨併購的專業服務業務一併繼承的過境網段——已經以自治系統 100 運行 EIGRP。取代它將意味著在整合進行期間，為一個可運作的網段重新編址與重新設計，卻得不到功能上的增益；正確的工程答案是：在該網域邊界運行 EIGRP、做一次重新分配，並將遷移規劃為未來工作。有兩項誠實限制適用：EIGRP 僅以**傳統模式**展示，且其存在不得被呈現為建議新網路應採用專有協定。

**在邊緣使用 BGP。** 內部閘道協定與外部閘道協定之間的區別，是本節的核心。IGP 回答的是*我的網路內部，目的地在哪裡*：它散佈內部拓撲，對原則、擁有權或信任沒有概念。EGP 回答的是*我應該觸達哪些外部網路、經由哪個鄰居、依什麼條件*：它在不共享行政控制的自治系統之間散佈可達性，並承載營運者用以表達偏好、過濾與流量工程的屬性。兩者並不競爭。Vertex Peak 是自治系統 65001，與主要供應商（65000）建立對等關係，並以次要工作階段與替代供應商（65002）對等；灣仔則被建模為小型自治系統 65021。所設計的示範包括：以前綴清單進行的入向前綴過濾、以 route-map 進行的出向路徑附加、以 local preference 偏好主要路徑、`maximum-prefix` 保護，以及在主要工作階段被關閉時擷取的容錯移轉。所宣告的上限必須說明：Packet Tracer 的 BGP 支援屬於基本層級，路由反射器、confederation、`add-path`、RPKI 與 BGPsec 驗證均超出此模擬器能忠實建模的範圍，因此不予宣稱。

**以 RSTP 取代 STP。** `RSTP` 這個確切字串並未出現於該標準；合法的掛鉤為 `Configure access, aggregation and core level switching`（範疇 3）。應以標題引用的參考標準為 **IEEE 802.1w《Rapid Reconfiguration of Spanning Tree》**，其後併入 IEEE 802.1D-2004 修訂版，因此必須記錄實際查閱的版本，而不得憑空編造條款編號。本設計的拓撲——兩部核心交換器以幹道相連，並掛接四部雙歸屬存取交換器——正是需要迴圈預防且受益於快速收斂的安排。

| 屬性 | STP（IEEE 802.1D，原始版） | RSTP（IEEE 802.1w） |
|---|---|---|
| 收斂機制 | 計時器：阻斷中的埠必須先逾時老化才能轉送，因此收斂受計時器限制 | 在點對點鏈路上進行明確的 **proposal/agreement** 握手；邊緣埠立即轉送；新的根埠可不必等待計時器逾時即轉送 |
| 埠角色 | 根、指定、阻斷 | 根、指定、**替代（alternate）**與**備份（backup）**，因此已知的替代路徑可立即可用而無需重新計算 |
| 拓撲變更傳播 | 通知先洪泛到根，再向外傳播，速度緩慢 | 變更由偵測到的橋接器立即傳播至所有其他橋接器，且過期項目清除範圍是局部化的而非全域的 |
| 根埠失效時的行為 | 該埠經過 listening 與 learning 並伴隨計時器延遲 | 在常見情況下，替代根埠立即被提升而無延遲 |
| 此處的後果 | 拔除一條鏈路可使流量中斷數十秒，足以中斷 DHCP、Kerberos 或管理連線 | 中斷大幅減少，這很重要，因為管理與身分識別流量穿越同一存取層 |
| 保護功能 | 以下皆無 | Root guard、BPDU guard、loop guard 與邊緣埠設定能圍堵故障模式，而不僅是事後復原 |

RSTP 在此的優勢不僅是速度：埠角色使拓撲可被稽核，因為報告能具名根橋接器、次要根以及每個埠的角色與狀態，然後示範拔除一條鏈路會產生預期的角色變更。因此根選擇是明確指定的而非選舉產生——`VP-HQ-CORE-01` 為承載流量之 VLAN 的主要根，`VP-HQ-CORE-02` 為次要根，存取埠上啟用 `portfast` 搭配 `bpduguard`，預期的根埠上啟用 root guard。收斂示範使用 Packet Tracer 的模擬模式與 `show spanning-tree detail` 的時間戳，而**凡在 Packet Tracer 中量測到的任何時間，都是模擬產物，必須如此標示**，絕不得呈現為真實世界的收斂數字。

**以 ASA 作為有別於路由器 ACL 的獨立防火牆層。** `ASA` 這個字串並未出現於該標準；其橋接為 `Apply basic security configuration for control and data plane` 與範疇 3 的 VPN 條文。本設計在 DMZ 與邊緣部署一部 ASA 5506-X 裝置（`VP-HQ-FW-01`，Packet Tracer 中的 ASA 9.16(4) 映像），安全層級為 outside 0、dmz 50、inside 100。架構上的重點在於，ASA 不是速度更快的路由器 ACL，而兩者屬於不同的位置。

| 屬性 | 路由器 ACL | 防火牆設備（ASA） |
|---|---|---|
| 狀態 | 無狀態：每個封包各自依有序清單獨立比對 | 具狀態：連線表追蹤已建立的流量，因此回程流量依狀態獲准，而非依鏡像規則 |
| 比對精細度 | 來源、目的、協定與埠，搭配萬用字元遮罩 | 相同項目再加上物件群組、安全層級、應用程式檢查引擎與由區域衍生的隱含規則 |
| 在拓撲中的位置 | 在路由路徑上依介面套用的最佳化與圍堵工具 | 信任邊界：一部專責裝置，其目的在於分隔區域並持有檢查與記錄原則 |
| 位址轉譯 | 非其角色 | NAT 與 PAT 是一級功能，且設定位置緊鄰原則而非他處 |
| 承載內容感知 | 無法修改承載內容或內嵌位址 | 檢查功能可為在承載內容中攜帶位址的協定（例如 FTP 或 SIP）開啟針孔 |
| 在本設計中的用途 | 管理平面限制、防偽造，以及對隔離實驗室網段的圍堵 | DMZ 邊界、inside 對 outside 原則、NAT，以及通往灣仔的站對站 IPsec 通道 |

路由器 ACL 依然存在——它們是管理平面受保護的方式，也是學生網段被圍堵的方式——但它們位於*圍堵*層，而 ASA 位於*信任邊界*層。所宣告的限制必須出現在報告中：Packet Tracer 的 ASA 是精簡化的舊式 ASA 模型，FirePOWER/SFR、叢集、具狀態複寫的主動／待命容錯移轉、`shun` 以及許多低階丟棄量測機制均付之闕如或不完整，因此**不得宣稱任何 ASA 高可用性、叢集或次世代防火牆能力。**

#### 5.3.3 曾考慮並否決的替代方案

| 替代方案 | 否決理由 |
|---|---|
| 全程使用單一 IGP，例如處處使用 OSPF | 否決：這會刪除題目表所指名的技術中的 EIGRP 情境，並削弱本專案中引用最有力的路線——該路線在同一條要求中同時指名的技術為 OSPF、BGP 與 EIGRP。 |
| 以 IS-IS 取代 OSPF | 技術上值得尊重，但題目表與該標準均未指名的技術，且它會移除一條可直接逐字引用的要求條文，卻不增加受評核的能力。 |
| 以靜態路由取代任何動態協定 | 否決：靜態路由無法在鏈路失效後收斂，無法表達範疇 3 所需的容錯移轉行為（`Provide network load balancing & fault tolerance at routing and switching levels`），並將使範疇 6 的疑難排解無真實問題可診斷。 |
| 以 MSTP 或 PVST+ 調校取代 RSTP | PVST+ 實際上就是本設計逐 VLAN 運行的模式（`spanning-tree mode rapid-pvst`），因此比較的對象是*演算法*而非映射方式。否決純 802.1D，因為其受計時器限制的收斂是自我造成的可用性上限；MSTP 以區域為基礎的映射在此規模下增加複雜度卻無效益。 |
| 以 Linux 防火牆設備取代 ASA 作為 DMZ 周邊 | 就此層而言否決。Linux 過濾已用於出口位置，而範疇 3 的控制與資料平面條文加上情境的廠商中立論據，兩者都傾向於展示第二個、設備等級的強制執行點，並具其自身的原則語言與記錄。刻意設置兩層強制執行，且實作互異。 |
| Cisco 次世代防火牆、SD-WAN、ACI 或 DNA Center | 排除。該標準確實提及 `Controller-based and software-defined network management approaches` 作為知／懂條文，但 SDN 是姊妹題目 Victor3，且這些技術均無法在 Packet Tracer 中忠實建模。兩項事實必須一併陳述。 |
| 真實 Cisco 硬體 | 因專案「不使用實體網路硬體」的限制而排除。此處的每一部 Cisco 路由器、交換器、防火牆與 WAN 鏈路都是 Packet Tracer 的模擬物件，報告必須把 Packet Tracer 呈現為一個能建模協定邏輯與 CLI 語法、但**不**建模真實硬體轉送、時序或規模的模擬器。 |

#### 5.3.4 安全與營運考量

生成樹是一種沒有原生驗證的控制平面協定，注入較佳 BPDU 的攻擊者可成為根並使流量被黑洞化；其緩解措施為在預期的根埠上啟用 root guard、在存取埠上啟用 BPDU guard，以及一個除自身子網路與單一主控台路徑外一律拒絕的隔離 `Z-STUDENT` 網段。DHCP 同樣對信任敏感：已啟用 snooping，且信任埠僅限於核心上行鏈路，而一項惡意 DHCP 測試已被擷取並顯示為遭到封鎖。在路由方面，OSPF 驗證保護鄰接關係，`maximum-prefix` 限制了行為異常的對等端所能造成的損害，而入向前綴過濾則防止供應商注入一筆預設路由或一組非預期的前綴。此路線中最危險的營運事實是：**OSPF 與 EIGRP 之間雙向、未加標籤的重新分配，可能產生一種在設定中不可見、只在轉送表中可見的路由迴圈**，因此本專案刻意將此錯誤設定一次、擷取該迴圈，然後修復它。

第二項考量是模擬器的誠實界線。由於 Packet Tracer 沒有可從外部工具觸達的 SSH 伺服器，也沒有 API，因此任何自動化軟體都不曾登入 Packet Tracer 裝置。網路裝置自動化因此以已記錄的雙軌方式交付：預定的裝置設定以文字檔形式存於版本控制中，而收集機制則針對 Linux 與 Windows 資產進行測試。報告必須明確說明：**沒有任何 playbook 曾經登入 Packet Tracer 裝置**；聲稱相反之事即屬捏造。

#### 5.3.5 對應至 WSOS 範疇

| 設計元素 | 所服務的 WSOS 範疇 | 依據 |
|---|---|---|
| 總部與觀塘的 OSPF 區域 0、驗證、`default-information originate` | 3 資料傳輸網路（25 %） | **指名的技術**：`...internal and external gateway routing protocols such as OSPF, BGP and EIGRP` |
| 澳門的 EIGRP AS 100，於單一節點做單向重新分配 | 3（25 %） | **指名的技術**：同一條條文 |
| 與 AS 65000 及 AS 65002 的 eBGP，使用前綴清單、route-map 與 local preference | 3（25 %） | **指名的技術**：同一條條文 |
| RSTP 根選擇、邊緣埠、root guard、收斂擷取 | 3（25 %） | **橋接**：`Configure access, aggregation and core level switching`；RSTP 未被指名的技術 |
| ASA 安全層級、物件群組、NAT、ACL、檢查、syslog | 3（25 %）；6 疑難排解（25 %） | **橋接**：`Apply basic security configuration for control and data plane`；ASA 未被指名的技術 |
| 通往灣仔的 ASA 站對站 IPsec IKEv2 通道 | 3（25 %） | **指名的技術**：`...VPN technologies such as IPSec, SSL VPN, ...` |
| 交換器虛擬介面上的 HSRP | 3（25 %） | **指名的技術**：`...using GLBP, HSRP, VRRP, LACP, PAgP, etc.` |
| VLAN 規劃、幹道、原生 VLAN 紀律、埠安全 | 3（25 %） | **指名的技術**：`Network segmentation with VLAN`；`Configure access, aggregation and core level switching` |
| 探索與流量分析：探索協定、SNMPv3、syslog、封包擷取 | 3（25 %） | **指名的技術**：`Use network discovery and traffic analysis tools such as CDP, NetFlow, Syslog, SNMP and tcpdump.` |
| 刻意錯誤設定、迴圈擷取與修復 | 6 疑難排解（25 %） | `Troubleshoot computer systems using the appropriate tools and techniques`；`Use system logs to find and identify issues` |

**選擇理由。** 此路線是五條中最強的一條，因為該標準在同一條要求條文中同時指名的技術為 OSPF、BGP 與 EIGRP，因此三者都能逐字取得論據而非依賴推論，而本設計也實作了全部三者而非擇一。OSPF 被置於主要的內部網域，因為它是開放、多廠商的鏈路狀態協定，其拓撲資料庫可在疑難排解期間檢視；而 EIGRP 則被限定於一個已經運行它的繼承網段，使該專有協定是由遷移經濟學取得正當性，而非因偏好而被採用。BGP 之所以存在，是因為內部協定無法對企業並未控制的供應商表達原則，而本設計的對等關係使該區別具體化。RSTP 與 ASA 倚賴的是橋接陳述而非指名的技術要求，因此報告逐一說明每項橋接、引用其倚賴的條文，並宣告模擬器的限制，而不將任一方呈現為標準要求。

### 5.4 網路自動化

#### 5.4.1 技術現況

基礎架構營運已從由人手執行的運行手冊，轉向由工具執行的儲存庫。主流模型是*基礎架構即程式碼*：預定狀態以受版本控制的產物宣告，工具使實際系統向其收斂，而兩者之間的差異成為可審查的變更單位。圍繞此模型有三項配套實務——具同儕審查的版本控制、與設定分離的機密管理，以及每一次執行的日誌。此轉變關乎可稽核性而非速度：以人手輸入的變更不留可供審查的產物，而宣告式變更則留下差異、審查者姓名與執行日誌。

#### 5.4.2 命令式腳本與宣告式設定管理的比較

此路線所指名的技術分別位於命令式／宣告式分界的兩側，而本設計刻意兩者並用。

| 面向 | 命令式腳本（PowerShell、Bash） | 宣告式設定管理（Ansible） |
|---|---|---|
| 產物所表達的內容 | 一連串步驟與判斷：「檢查這個，然後設定那個，再重新啟動」 | 一個期望的最終狀態：「這個套件已安裝、這個檔案的內容是這樣、這個服務正在運行」 |
| 由誰決定要變更什麼 | 撰寫者，於撰寫時決定；邏輯內嵌於控制流程中 | 工具，於執行時透過比較觀測狀態與宣告狀態決定 |
| 重複執行行為 | 取決於撰寫者：若無防護條件，腳本會再次套用其效果 | 對選用得當的模組而言，依設計具冪等性：第二次執行回報無變更 |
| 失敗與部分套用 | 腳本中途失敗會留下任意的中間狀態，除非撰寫者處理 | 任務在已知點失敗；已收斂的任務維持收斂，因此重複執行是續行而非重做 |
| 可審查性 | 一份程式碼差異，其*效果*須由審查者推斷 | 一份意圖差異，對審查者大致可讀 |
| 適用性 | 臨時查詢、報告、一次性修復、收集——任何確實屬程序性或條件性的事務 | 基線設定、服務部署、跨多部主機的重複狀態 |
| 產生的證據 | 撰寫者所記錄的任何內容 | 每部主機、每個任務的 `ok`／`changed`／`failed` 記錄，可直接引述為證據 |

冪等性正是使宣告式工具可稽核的原因，而其在此的重要性十分具體。客戶的盡職審查項目是*「有證據顯示網路變更是透過經審查、可重複的設定而非以人手套用。」*一次收斂的第二次執行——即某次 playbook 執行回報零個已變更任務——是最乾淨的證明，證明設定處於所宣告的狀態，且再次執行不會擾動一個正在運作的系統。這也是為何冪等性是一項硬性驗收準則：每個 playbook 都執行兩次，並擷取第二次執行的 `changed=0` 結果。命令式腳本則以相同標準要求：每個腳本都必須可重複執行且輸出維持不變。

#### 5.4.3 為何選用所指名的技術

**以 Ansible 進行設定管理。** 該標準使這成為範疇 5 中最不含糊的要求：`Identify and implement infrastructure as code`，其嵌套示例為 `Ansible.`——這是*應能*（shall be able to）的要求，而非知／懂的要求。題目表說的是「Ansible Playbook」；該標準只說 `Ansible`，而報告應明確指出此區別，然後說明 playbook 是其實作形式。

| 準則 | Ansible（已選用） | Puppet | Chef | Salt |
|---|---|---|---|---|
| 執行模型 | 無代理、推送式：透過 SSH（Linux）或 WinRM（Windows）連線、複製模組、執行、然後移除 | 代理拉取式：每個節點運行一個代理，依排程向 master 取得目錄 | 代理拉取式，由中央伺服器持有 cookbook | 兼具配備 master 的代理模式與無代理的 `salt-ssh` |
| 撰寫語言 | YAML 任務清單加上 Jinja2 範本——不需學習新的通用語言 | Puppet 自有的宣告式 DSL | Ruby，內嵌於 recipe 中 | YAML 搭配 Jinja2，與 Ansible 相當 |
| 執行順序 | 有序的任務執行搭配 handler，適合「設定、驗證、然後重新啟動」 | 依相依圖排序；順序是衍生的而非撰寫的 | recipe 與資源順序搭配明確通知 | 有序的 state 檔 |
| 額外基礎架構 | **無**——沒有代理、沒有代理憑證、沒有必須維持可用性的 master | 一個 master 加上代理憑證 | 一個 Chef Infra Server 加上代理金鑰 | 一個 master 加上金鑰 |
| 對此資產的契合度 | 從 `vpnz-mon01` **同時**透過 SSH 管理 Linux 資產與透過 WinRM 管理 Windows 資產 | 在 Linux 上表現強勁；對這種 Windows 角色／功能模型較不慣用 | 表現強勁，但 Ruby cookbook 開發在 12 週內是不成比例的能力成本 | 相當，但 Windows 專屬模組較少 |
| 對該標準的契合度 | 在一條*應能*要求中**獲逐字指名** | 未被指名的技術 | 未被指名的技術 | 未被指名的技術 |

因此，Ansible 是在四項匯聚的理由上被選用：該標準以要求的形式指名的技術是它；它是無代理的，因而移除了單主機實驗室原本必須自行建置與辯護的一整類基礎架構（代理、代理憑證、master 的可用性）；其 YAML 任務模型學習速度足以在時程內產生實質進度；而且它能自單一控制節點管理異質的 Windows 與 Linux 資產。控制節點是 `vpnz-mon01`，別無其他——**任何 playbook 都不曾從學生的筆記型電腦執行**，因此版本保持釘定、證據可重現。

**以 PowerShell 處理 Windows 與 Active Directory 一側。** PowerShell 獲逐字指名兩次：一為 `Setup and run routine infrastructure maintenance operations using various scripting\programming languages`（範疇 5）之下嵌套的腳本語言，一為 `Script based backup, e.g. Bash, Batch or PowerShell`（範疇 4）之中。它所帶來的不僅是一種腳本語言，而是對作業系統自身管理介面的結構化、物件導向存取。此處使用的每一項角色與功能都暴露一個模組，其動詞形式的 cmdlet 回傳物件而非格式化文字：`Get-ADUser`、`Get-ADReplicationFailure`、`Get-DhcpServerv4Scope`、`Get-FsrmQuota`、`Get-IscsiSession`、`Get-VpnConnection`、`Get-Gpo`、`Get-WinEvent`。由此產生三項後果。結果可在無需解析的情況下被過濾、比較與匯出，因此一份健康報告就是一條物件管線，可輸出 CSV、HTML 或測試斷言。PowerShell 是 AD DS、AD CS、DHCP、DNS、FSRM、iSCSI 與群組原則的*原生*介面，因此不需要任何包裝層。而同一執行環境可透過 WinRM 取得，那正是 Ansible 用來觸達 Windows 的傳輸方式，因此手動與自動化路徑使用相同的語言與模組。這五個腳本涵蓋新進人員入職、AD 健康報告、網路裝置設定備份、服務端點測試（把連接埠矩陣化為可執行測試）以及群組原則備份。本資產在執行腳本的客體上使用內建的 **Windows PowerShell 5.1**，而在 `vpnz-jump01` 上使用 **PowerShell 7.4 LTS** 進行撰寫；報告必須說明每個腳本實際受測於哪個執行環境，且不得在僅使用 5.1 之處宣稱 7.4。

**以 Bash 處理 Linux 一側。** Bash 被指名於同一嵌套位置。它所帶來的是與 PowerShell 結構化豐富性相反的東西：它是 Linux 資產的*組合*語言，其中文字串流與退出碼是 `systemctl`、`nft`、`ip`、`journalctl`、`openssl`、`rsync` 與 `curl` 的原生介面，而 `set -euo pipefail` 以單行提供快速失敗語意。這五個腳本——強化基線、附回滾計時器的原子式 nftables 套用、Keepalived 狀態驗證與容錯移轉測試、restic 備份，以及憑證到期與續期——都屬於正確做法是一段簡短程序性序列搭配小型決策樹的情況。因此分工是明確的：**Bash 與 PowerShell 處理程序性、條件性、一次性與報告類工作；Ansible 處理反覆套用、跨多主機、宣告式的基線。**凡腳本必須重複執行者，皆撰寫為冪等；凡腳本會變更服務者，皆使用受 Ansible 控制的範本化設定，而非就地編輯檔案。

**以 Git 作為基底。** Git 在 `Use modern automation tools for systems deployment and configuration management` 之下獲逐字指名，而 `Importance of code version control` 是範疇 5 的知／懂條文。該標準亦包含 `Continuous integration and continuous delivery\deployment pipelines concepts` 作為知／懂條文，而在此誠實的提案必須謹慎：本專案運行 Git 的審查與標籤工作流程並記錄該概念，但**並不**建置管線，報告必須正是如此說明，而不得把 CI/CD 列為已交付。同樣地，Python、YANG、RESTCONF 與 NETCONF **已於 2026 年版從範疇 5 中移除**——它們曾存在於 2024 年版——因此不得作為標準要求引用；它們僅可作為未來工作出現。

#### 5.4.4 曾考慮並否決的替代方案

| 替代方案 | 否決理由 |
|---|---|
| 以 Puppet、Chef 或 Salt 取代 Ansible | 三者皆有實力，但均未在該標準中被指名的技術，且三者都增加一個伺服器與一個代理（或一個金鑰分發問題），而這些本身必須在單主機實驗室內建置、加固與記錄；Chef 另需撰寫 Ruby cookbook。Salt 的無代理模式縮小了差距但未消除差距，且 Salt 的 Windows 模組較不成熟。 |
| Terraform 或雲端基礎架構即程式碼工具 | 否決：未在該標準中被指名的技術、專案中不存在雲端帳戶，且該資產的實際資源沒有宣告式供應者。 |
| 以 PowerShell Desired State Configuration 取代 Ansible | 刻意排除並須明確說明而非暗示：兩套相互競爭的設定模型會使證據碎裂，而 DSC 的 pull-server 模式會增加基礎架構卻無受評核的效益。 |
| Ansible Tower / Ansible Automation Platform / AWX | 否決：未在該標準中被指名的技術、不必要的授權或營運開銷，且 Web 控制平面會為管理區增加新的攻擊面。單純的 `ansible-core` 搭配 Git 儲存庫能以更簡單的方式滿足該要求。 |
| 僅以人手運行 CLI 並只附文件 | 否決，因為它直接不符客戶的盡職審查要求：以人手輸入的變更不留可供審查的產物，而範疇 5 的重點正是該變更*本身即為*產物。 |
| 以 Ansible 驅動 Packet Tracer 裝置 | 不可能，而非僅遭否決：該模擬器不暴露可觸達的 SSH 伺服器，也沒有 API。§5.3.4 的雙軌方式取代了它，且不得作出任何裝置自動化的宣稱。 |

#### 5.4.5 安全與營運考量

憑證處理是主要風險。Ansible 對 Windows 使用連接埠 5986 上以 HTTPS 傳送的 WinRM，搭配由內部 CA 簽發的憑證，並以 `svc_ansible` 進行驗證；該帳戶是 `GG-WINRM-Admins` 的成員，且不屬於任何其他群組。Ansible 對 Linux 使用 Ed25519 金鑰，其公鑰部分存於儲存庫，私鑰部分則從不提交。任何儲存的機密都存於 Ansible Vault，其單一 vault 密碼由小組持有，而全儲存庫的憑證掃描會在每次標籤發佈前執行，並保留其輸出。刻意測試「提交至儲存庫的假金鑰會被掃描攔截」本身即是一個測試案例，因為一項從未被證明會觸發的控制，並不算是已驗證的控制。

另有三項紀律要緊。*執行日誌*是證據產物：每個腳本與 playbook 都會將附時間戳的日誌寫入儲存庫、提交它，而驗證章節以檔名引用這些日誌。*審查*控制既屬技術性也屬社會性：每一項變更都由第二位成員審查，且審查記錄於會議紀錄中，因為客戶所要求的是*流程*，而不只是工具。而*邊界*必須說明：自動化控制節點本身即是高價值目標，因為攻陷它即可取得整個資產的憑證。`vpnz-mon01` 持有 vault、控制節點、Git 伺服器與監控堆疊，依設計集中了風險；其補償控制為：置於 `Z-SERVER`、管理存取限制於 `Z-MGMT`，以及在風險登錄冊中明確承認：此單一主機遭攻陷將是本環境中最具破壞性的單一故障。

#### 5.4.6 對應至 WSOS 範疇

| 設計元素 | 所服務的 WSOS 範疇 | 依據 |
|---|---|---|
| 五個 PowerShell 腳本加上一個共用模組 | 5 基礎架構自動化（15 %） | **指名的技術**：`Setup and run routine infrastructure maintenance operations ...` → `PowerShell`；亦為 `Script based backup, e.g. Bash, Batch or PowerShell`（範疇 4） |
| 九個 Ansible playbook、七個角色、含六個群組的 inventory | 5（15 %） | **以要求形式指名的技術**：`Identify and implement infrastructure as code` → `Ansible.` |
| 五個 Bash 腳本加上一個共用函式庫 | 5（15 %） | **指名的技術**：同一條腳本條文 → `Bash` |
| Git 儲存庫、每任務一分支、同儕審查、標籤發佈 | 5（15 %） | **指名的技術**：`Use modern automation tools ...` → `Git`；`Importance of code version control` |
| 具 `changed=0` 的冪等第二次執行 | 5（15 %）；6 疑難排解（25 %） | `Behaviour of infrastructure automation tools` |
| Ansible Vault、憑證掃描、最小權限服務帳戶 | 5（15 %）；4（25 %） | `Importance of code version control`；`Install and manage authentication, authorization and accounting services` |
| 執行日誌與變更記錄敘述 | 1 工作組織與管理（5 %）；6（25 %） | `The importance of methodical working practices`；`Prepare a technical document reflecting the solution in detail for agreement and sign-off` |

**選擇理由。** 選用 Ansible，是因為該標準不僅允許它，而是要求它——`Identify and implement infrastructure as code` 之下嵌套 `Ansible.` 是一條*應能*條文——也因為其無代理模型移除了替代方案原本會加諸單主機實驗室的最大一塊支援基礎架構。PowerShell 與 Bash 與其並存而非被其取代，因為該標準三者皆指名的技術，也因為大量實際工作確實是程序性的：收集證據、測試端點、報告健康狀態，以及套用附回滾計時器的防火牆規則集，都不是宣告式問題。Git 被採用作為三者共同的基底，因為版本控制正是把變更轉化為可審查產物的機制，而那正是客戶盡職審查問題所要求的特定性質。冪等性從優良實務被提升為硬性驗收準則，因為第二次執行回報零變更是現有最乾淨的證明，證明該資產處於其宣告狀態。

### 5.5 AI 網路管理

#### 5.5.1 技術現況

網路營運工具已經歷三個世代。第一代是*收集*：由協定與代理向中央伺服器回報計數器、門檻與 trap。第二代是*關聯與視覺化*：當某項度量跨越靜態門檻時即發出告警的儀表板與規則式告警。第三代、亦即當前的前沿是*代理性*（agency）：系統被賦予一組界定的工具，這些工具暴露相同的底層資料，並被要求自行蒐集脈絡、跨來源關聯訊號，並附上證據產出結論。第二代與第三代之間的差別不在資料，而在於由誰執行多步驟調查：門檻告警把一個情境壓縮成一個數字並丟失脈絡，人類隨後必須開啟數個主控台將脈絡重新展開；而代理則一次完成該展開，並回傳一份觀察結果仍附於其上的敘述。凡門檻告警表現強勁之處，例如資源上限，應予保留；而當某項故障的單一徵狀出現在三個系統中時，代理則具有真正的優勢。

#### 5.5.2 代理加上「Skill」外掛模型意味著什麼

在此意義下，一個*代理性*系統具備四項有別於聊天機器人的特性。它是**使用工具的**：其能力是具型別參數與結果的離散可呼叫函式，而非自由對話。它是**迭代的**：它能觀察結果、判定其不足，並在預算內呼叫另一個工具。它是**目標導向的**：它被賦予一個目標，例如「分診此告警」，而非一個問題。而它是**由建構方式所約束的**：它可呼叫的工具集合是有限、可列舉且事先宣告的，這正是使其行為可稽核、其影響範圍可界定的原因。所謂「Skill」即是此類能力的封裝：一份宣告該工具名稱、用途、參數結構與實作程式碼路徑的清單。在本設計中，此介面刻意極小——`vpnz-ai01` 上的四個唯讀工具。

| Skill 清單 | 所讀取的內容 | 來源 |
|---|---|---|
| `alert-triage`（`get_active_alerts`） | 當前告警集合及其中介資料 | 透過 HTTPS 的 Alertmanager API |
| `interface-health`（`get_interface_stats`） | 介面計數器與錯誤率 | 對 Packet Tracer 裝置資產的 SNMPv3 輪詢；Linux 上的 `ip -s link` |
| `auth-failure-report`（`get_auth_failures`） | 登入失敗事件 | Windows 安全性事件 4625；透過 SSH 對 `sshd` 執行 `journalctl` |
| `doc-draft`（`draft_change_proposal`） | 無外部來源——僅寫入文字，寫入 `/opt/openclaw/proposals/`，從不寫入裝置 | 本機檔案系統 |

架構上的重要意義在於此介面是封閉的：**沒有第五個工具**，且 `vpnz-ai01` 上沒有可藉以觸達裝置的 shell，除非沿著這四條唯讀程式碼路徑。`/opt/openclaw/skills/` 下的清單、允許清單、提示集與範例輸出，全都是應予保留的證據。由於 Skill 模型是*外掛*模型，需要被治理的是其擴充流程：新增第五個工具是一項設計變更，必須經審查、記錄於決策日誌並重新驗證。這些工具定義的表述方式使其得以表達為 Model Context Protocol（MCP）工具定義，以保持此介面可跨執行環境移植——這是一項設計選擇，而非已驗證的實作，因為報告必須引用小組實際閱讀的規格，而 `MCP` 在 WSOS 2026 中出現零次。

#### 5.5.3 受約束的工具呼叫代理與通用 LLM 助理的比較

| 面向 | 通用 LLM 助理 | 受約束的工具呼叫代理（本設計） |
|---|---|---|
| 輸入 | 任意提示，包括貼上的設定與日誌 | 固定觸發（Alertmanager webhook 或排程）加上已宣告的工具結構 |
| 能力 | 產出文字；任何動作由人手抄錄 | 執行一組界定的操作並讀取其結果 |
| 對環境的影響 | 無直接影響，但未經核實的建議可能未經審查即被抄錄為變更 | 僅限已宣告工具所允許的影響；四個唯讀工具意味著不存在寫入路徑 |
| 發生何事之證據 | 一段對話，可能未被保留或無法歸因 | 每次呼叫一筆 JSON-lines 稽核記錄，含提示雜湊與所呼叫的工具 |
| 風險特徵 | 集中於人類對聽似合理之建議的抄錄，而此過程無法稽核 | 集中於工具的介面，而該介面可列舉且可審查 |
| 對營運的適用性 | 作為已在調查之人的互動輔助有其用處 | 適合具明確成功準則、界定清晰且重複性的分診任務 |

本設計把受約束的代理立場作為一項架構承諾，因為**工具介面就是安全邊界，而可列舉的邊界即可審查。**一個唯一輸出是散文的助理無法被測試，因為沒有可供對照測試的規格。而一個能力為四個已宣告唯讀函式的代理，則可如本處其他一切事物般受測：呼叫每個工具、確認取得預期資料、確認沒有其他呼叫成功，並確認不可能寫入。

#### 5.5.4 風險：謹慎的處理

代理性營運所帶來的風險，在性質上有別於一般工具，因為其故障模式是一個聽似合理、流暢卻錯誤的答案，以與正確答案相同的自信被交付。有五項風險居於主導地位，每項都有具體的緩解措施，而非泛泛的安慰。

**幻覺與虛構。** 語言模型可能產出其閱讀過的資料所不支持的流暢陳述，包括虛構的介面名稱、計數與因果主張。緩解措施：每一項輸出都必須引用其所依據的工具結果；代理必須說明其無法判定的事項；工具回傳可供審查者在數秒內複查的原始結構化資料；而驗收準則**要求**：若發生幻覺或偽陽性，必須誠實記錄，並附上導致該結果的提示。記錄失敗比隱藏失敗是更強的學術成果，而這也是唯一能刻畫一個無法從基本原理推論其行為之工具的方式。

**影響範圍（blast radius）。** 一個能行動的代理，能以機器速度和規模錯誤地行動。其緩解是架構性的而非程序性的：**該代理完全沒有寫入路徑。**它無法修改裝置、服務、規則或目錄物件，因為沒有任何工具暴露此類操作，且它所持有的憑證無一允許。其服務帳戶 `svc_aiagent` 僅是 `GG-AI-ReadOnly` 的成員，而該群組僅被授予事件日誌讀取權，別無其他。其唯一的輸出副作用是以文字寫出一份*建議的*差異。排除自主修復是一項具特定理由的刻意設計決策：未受監督的修復將使本專案自身的驗證結果不可重現，因為受測狀態會在測試之下改變。

**權限與憑證範圍。** 唯讀憑證仍是憑證，而一個監控帳戶的彙總讀取面是敏感的。該代理僅持有一個帳戶，該帳戶僅屬於一個群組，而該群組的授權已記錄在案；除該帳戶外，不得在 `vpnz-ai01` 上儲存任何裝置憑證；而該主機的網段位置將其限制於連接埠矩陣中的管理與監控埠，因此遭攻陷的代理無法成為通用的內部立足點。

**可稽核性。** 無法重建其動作的工具，在受監管的環境中不可使用，而本處情境正是如此。每次呼叫都記錄到 `/opt/openclaw/logs/agent.jsonl`，附提示雜湊與所進行的呼叫，而工具呼叫的硬性速率限制界定了成本，並防止失控迴圈成為對監控 API 的阻斷服務攻擊。日誌格式為機器可讀，因此稽核軌跡本身可被查詢。

**人類在迴圈中。** 每一項輸出都標示 **「建議——需經人類核准」**，而工作流程終止於人。其目標明確是*縮短分診時間*，而非自主：所改善的度量是一個人理解正在發生何事所需的時間，而代理的貢獻是在人抵達之前已蒐集並關聯了證據。由此另有兩項護欄。偽陽性容忍度是不對稱的——漏報比誤報更糟——因此代理可以提出比人類會發起的更多調查，但它絕不得抑制告警。而驗收準則要求一份書面評估，說明**代理在何處有幫助、在何處浪費時間、以及在何處人類是不可或缺的**，因為一份只回報其成功的概念驗證，並未刻畫該工具。

**涵蓋範圍的誠實陳述。** WSOS 2026 的 AI 內容為**零**。`Agentic`、`OpenClaw`、`MCP`、`artificial intelligence` 與 `machine learning` 等字串在 2026 年文本中各出現零次，在原始 HTML 中亦各出現零次。對 `AI` 的樸素搜尋會回傳四筆命中，全都是子字串偽陽性——`ShanghAI`、`dAIly`、`mAIntain`、`domAIn`——絕不得呈現為涵蓋範圍的證據。因此此路線是**超出該標準的創新**，僅錨定於它確實滿足的一般專業屬性：`The speed of IT systems change and the need to maintain currency`、`Use thorough and efficient research methods to support knowledge growth` 與 `Be enthusiastic to try new methods, systems, and embrace change`（皆屬範疇 1，5 %）。那些是一般屬性，不是 AI 涵蓋範圍，而報告必須依此順序說明。

**不確定性的誠實陳述。** OpenClaw 是本專案中最難以核實的元件：其安裝方式、Skill 檔案格式、預設連接埠、授權與穩定版本在設計時皆無法確認。由此產生三項後果。報告中不得出現任何版本、URL、授權或能力宣稱，除非附上本實驗室中運行實例的螢幕截圖，並引用實際使用的文件。AI 章節必須以陳述該不確定性及所採備用方案作為開頭。而在第 5–6 週進行的限時可行性探測——最多三個工作日——必須產出一項*決定*：採用 OpenClaw、採用小組自有的通用代理迴圈，或降級為確定性的關聯引擎。備用方案的階梯是事先設計而非臨時拼湊：若 OpenClaw 無法安裝，則以一個小型通用代理迴圈驅動完全相同的四工具介面，而該章節即成為以 OpenClaw Skills 模型作為設計參照的代理性工具評鑑；若完全無法取得模型存取權，則展示確定性的那一半——四個收集器、關聯規則與報告產生器——以腳本化原則取代模型，並記錄此替代。任一結果都能產生可辯護的成果；任一結果都不容許未經展示的宣稱。

#### 5.5.5 對應至 WSOS 範疇

| 設計元素 | WSOS 範疇 | 依據 |
|---|---|---|
| 代理執行環境、四個 Skill、唯讀工具介面、稽核日誌 | **無** | **無 WSOS 涵蓋範圍。** `Agentic`、`OpenClaw`、`MCP`、`artificial intelligence` 與 `machine learning` 皆出現 0 次。呈現為超出該標準的創新。 |
| 對新技術的研究、評鑑與誠實的失敗報告 | 1 工作組織與管理（5 %） | **被指名的技術，但僅作為一般屬性**：`The speed of IT systems change and the need to maintain currency.`；`Use thorough and efficient research methods to support knowledge growth`；`Be enthusiastic to try new methods, systems, and embrace change` |
| 收集器、關聯規則與報告產生 | 4 網路與系統營運（25 %）；6 疑難排解（25 %） | *底層*工作已受涵蓋——`Install and manage IT infrastructure resources monitoring systems`（其嵌套示例為 `Icinga2`、`Nagios`、`Cacti`、`Windows Resource Monitor`，而本專案使用不同的堆疊，必須說明此事）與 `Use system logs to find and identify issues` |
| 以 MCP 相容簽章表達的工具定義 | **無** | 無 WSOS 涵蓋範圍；`MCP` 出現 0 次 |

**選擇理由。** AI 路線被界定為嚴格唯讀的諮詢型概念驗證，因為那是唯一能在不使驗證失效的前提下，把代理性工具加入已驗證環境的表述方式，也因為如此一來工具介面便成為可審查的安全邊界，而非無界的能力。選擇代理而非通用助理，是因為受評核的工作是分診——跨來源蒐集並關聯證據——而這需要迭代的工具呼叫，不僅是散文。每一項護欄都源自一項具名風險，而非泛泛的謹慎：為影響範圍而無寫入路徑、為權限而單一最小權限帳戶、為可稽核性而 JSON-lines 稽核記錄，以及因為所改善的度量是人類分診時間而非自主，所以強制設置人類核准步驟。該章節必須明確說明 WSOS 2026 完全不含 AI 內容，且此路線是超出該標準的創新，僅由範疇 1 的一般專業屬性取得正當性。

### 5.6 綜合

下表重述五條路線、所選用的技術、每項選擇的主要理由，以及各自承擔的主要風險。此表應與 §6.15 併讀，後者將相同元素向前對應至設計。

| 路線 | 所選用的技術 | 選擇的主要理由 | 主要風險 |
|---|---|---|---|
| **L1 MS-SERVER** | AD DS（`vertexpeak.fyp.lab`；`vpnz-dc01`、`vpnz-dc02`、`vpnz-brdc01`）；AD CS 兩層式 PKI（`VP-ROOT-CA` → `VP-ISSUING-CA-01`）；`vpnz-fs01` 上的 FSRM 配額與檔案篩選；`vpnz-san01` 上搭配 CHAP 的 iSCSI 目標；`vpnz-rras01` 上搭配 NPS 的 RRAS IKEv2 | 題目表指名的技術涵蓋全部六項能力，而 AD DS 在 WSOS 的一條要求條文中獲逐字指名；AD CS 自動註冊是唯一能在規模上滿足「禁止共用密碼」的機制 | Windows 資產是最大的一塊建置工作（19 部虛擬機器中的 9 部），且對版本最敏感；FSRM、iSCSI、RRAS 與 IKEv2 **沒有** WSOS 涵蓋範圍，因此薄弱的實作無法以引用取得辯護 |
| **L2 LINUX-SERVER** | Nginx 1.24.0 反向代理，於 `vpnz-dmzrev01/02` 及內容節點 `vpnz-dmzwp01/02` 上終止 TLS；Keepalived 2.2.8（VRID 51 與 VRID 61）；nftables 1.0.9 直列配對（`table inet fyp_filter`）；OpenVPN 2.6.x 搭配 Easy-RSA 3.1.x；nftables VIP 上的 WireGuard | Nginx 與 OpenVPN 獲逐字指名，而 Keepalived 實作了該標準所指名技術的 VRRP；同時運行兩套 VPN 堆疊可把比較轉化為實測證據 | Keepalived、nftables 與 WireGuard **沒有** WSOS 涵蓋範圍，且倚賴強度不一的橋接——WireGuard 的橋接僅是 VPN 條文末的 `etc.`，必須宣告為本專案中最弱者；一次不良的遠端防火牆變更即為自我造成的鎖定風險 |
| **L3 CISCO** | OSPF 區域 0（總部 ↔ 觀塘）；EIGRP AS 100（澳門與舊式網段），於單一節點做單向重新分配；eBGP AS 65001 對 AS 65000 與 AS 65002；RSTP（IEEE 802.1w）；ASA 5506-X 作為 DMZ 與邊緣防火牆，具 IPsec IKEv2 站對站通道 | 該標準在同一條要求條文中同時指名的技術為 OSPF、BGP 與 EIGRP，而繼承的 EIGRP 網域使該專有協定成為遷移決策而非偏好 | 一切皆在 Packet Tracer 中模擬：沒有真實硬體行為、沒有真實收斂時序，且**沒有可觸達的管理介面**，因此裝置自動化是一項雙軌宣稱；RSTP 與 ASA 沒有 WSOS 涵蓋範圍，且每一項未建模的能力都必須被否認 |
| **L4 AUTOMATION** | Ansible（`ansible-core` 2.18.x 搭配 community 套件 11.x 與 `pywinrm` 0.5.0）位於單一控制節點 `vpnz-mon01`，透過 SSH 管理 Linux、透過 WinRM 管理 Windows；PowerShell（`Invoke-NewStarterOnboarding.ps1`、`Get-ADHealthReport.ps1`、`Backup-NetworkDeviceConfig.ps1`、`Test-ServiceEndpoints.ps1`、`Export-GPOBackup.ps1`）；Bash 強化與營運腳本；具同儕審查與標籤發佈的 Git | `Identify and implement infrastructure as code` 之下嵌套 `Ansible.` 是一條*應能*要求，而 PowerShell、Bash 與 Git 皆被指名，且無代理模型不增加新基礎架構 | 控制節點集中了 vault、Git 伺服器、自動化憑證與監控堆疊，因此此單一主機遭攻陷是現有最具破壞性的單一故障；憑證或金鑰洩漏至版本控制即為永久性 |
| **L5 AI-NETOPS** | OpenClaw 代理執行環境，於 `vpnz-ai01` 上具 MCP 相容、嚴格唯讀的四 Skill 介面（`alert-triage`、`interface-health`、`auth-failure-report`、`doc-draft`），產出一份分診札記以及供人類核准的*建議*差異 | 題目表明確指名的技術為 Agentic AI 與 OpenClaw Skills，而此工作展示了營運實務的當前前沿，同時縮短平均分診時間 | **零 WSOS 涵蓋範圍**，因此此路線是超出該標準的創新，無法以引用取得辯護；OpenClaw 是本專案中不確定性最高的元件，因此必須進行限時可行性探測並預先設計備用階梯，而幻覺必須以已記錄的證據而非斷言來處理 |

## 6. 系統架構設計

### 6.1 設計原則

有八項原則支配本架構。它們被最先陳述，因為本章之後的每一項決策都是其中一項或多項原則的結果，也因為無法追溯至任何原則的決策需要重新檢視。

**縱深防禦。** 沒有任何單一控制被信任為足夠。流量離開內部網路時，先經過一對具狀態的 nftables 過濾器，*然後*再經過具狀態的 ASA，因此一個原則層失效並不會移除邊界，而以一種語言犯下的規則錯誤也不太可能在另一種語言中犯下完全相同的錯誤。這也是此配對以直列方式位於總部核心與 ASA 之間而非位於其旁的原因：雙防火牆設計是在第二層刻意第二次套用原則，而非意外重複。同一原則亦適用於主機層（每部 Linux 客體都帶有自己的防火牆）與身分識別層（Tier-0 與 Tier-1 管理權限相互分離）。

**最小權限。** 每一個身分僅持有其職能所需的最低權限，而權限授予群組而非帳戶。`svc_ansible` 是 `GG-WINRM-Admins` 的成員，別無其他；`svc_aiagent` 是 `GG-AI-ReadOnly` 的成員，且從不屬於 Domain Admins；`svc_monitoring` 僅持有效能計數器讀取權；`svc_ldapbind` 的存在純粹是為了讓 DMZ 內容層能執行 LDAP 繫結。人類管理員擁有具名的個人帳戶（`adm-{initials}`），從不使用共用帳戶；四人中僅兩人屬於 `GG-Tier0-Admins`，且僅該兩人可向網域控制站或憑證授權單位進行驗證。緊急存取帳戶 `da-vertexpeak` 存在、已封存，且任何使用都必須記錄於報告中。

**網段隔離。** 信任以不同第 3 層網段上的區域來表達，而非以單一扁平網路搭配主機防火牆。僅總部就有核心過境 VLAN、管理 VLAN、兩個伺服器 VLAN、一個使用者 VLAN、一個語音 VLAN、一個出口過境 VLAN、一個隔離實驗室 VLAN、一個儲存 VLAN 與一個 DMZ VLAN；每個分支都有其自有的使用者、語音與管理網段。在邊界最要緊之處，該網段亦在 Hypervisor 層被分隔：管理位於 `10.20.0.0/16`，刻意置於 `10.10.0.0/16` 之外，因此路由錯誤無法暴露管理平面。誠實的限制已記錄在案：對真實虛擬機器而言，一個「VLAN」是一個獨立的僅主機虛擬網路，因此*網段隔離的結果*是真實的，而*802.1Q 機制*是模擬的。

**管理平面的防禦。** 管理平面是任何基礎架構中價值最高的目標，也是最難承受其喪失的部分，因為持有它的攻擊者可以撤銷其他每一項控制。因此它被視為最受限的區域，而非最方便的區域。網路裝置在 VLAN 20 中的專用位址上受管理，在觀塘則為 VLAN 113；管理存取僅允許來自 `Z-MGMT`，且僅限具名的管理協定；每個區域僅可向管理平面發送 syslog 與 SNMPv3；而驗證薄弱的受管理方式被完全禁止，這也是 SNMPv2c 與 community string 在本設計中完全不出現的原因。遠端存取使用者絕不擔任基礎架構的管理員。

**標準化與冪等性。** 除網域控制站外，每一部 Windows 客體都是 `W2K25-TEMPLATE-01` 的完整複製，每一部 Ubuntu 客體都是 `UBU2404-TEMPLATE-01` 的完整複製，因此兩部主機之間的差異是決策而非意外。在基礎映像之上，設定由必須具冪等性的 playbook 與腳本套用：重複執行不得改變已收斂的系統，而第二次執行的零變更結果會被擷取為證據。標準化亦適用於名稱，而命名方案是架構的一部分而非表面工夫，因為在兩位撰寫者的文件中彼此不同的名稱，是任何測試都無法發現的缺陷。

**文件優先。** 設計在被建置之前先被撰寫，而建置期間產生的產物是*證據*而非文件。此順序很重要，因為事後撰寫的文件描述的是已建成的樣子，包括其中的意外；而事先撰寫的文件則使每一項意外以偏差的形式顯現。文件在此並非周邊事務：該標準要求它——`Prepare a technical document reflecting the solution in detail for agreement and sign-off` 與 `The purpose of documenting the completion of the installation or up-grade`（兩者皆屬範疇 6）——而擷取發現、手冊、步驟、螢幕截圖、驗證與參考資料的特定義務，則是 HDTN 題目表的要求。兩者必須分別歸屬，絕不可混為一談。

**可測試性。** 一項無法測試的宣稱不是設計元素。連接埠矩陣中的每一項服務都可由具名命令觸達；每一列信任邊界都可以一條獲准的流量與一條被拒的流量加以驗證；每一項備援機制都可以藉由終止作用中的元件並觀察轉換來驗證；而每個 playbook 都可以第二次執行來驗證。`Test-ServiceEndpoints.ps1` 的存在，是為了讓連接埠矩陣可執行而不僅是列表；而可追溯性矩陣則把工作說明書中的每一項技術對應到一個測試案例識別碼。

**可逆性。** 任何變更若無已述的復原路徑，即不得為不可逆，因為環境是遠端的，管理員無法實際觸達被鎖定的防火牆。防火牆規則集由一個會啟動回滾計時器的腳本套用；每次重大變更前都建立快照，並在驗證後刪除；用以示範迴圈預防的刻意路由錯誤設定會被擷取然後還原；而災難復原演練被界定為可逆操作——奪取或轉移 Flexible Single Master Operations 角色、從 Active Directory Recycle Bin 還原已刪除的組織單位、從備份儲存庫還原檔案，以及對代理虛擬位址執行容錯移轉。唯一被刻意排除於例行實務之外的操作是 `krbtgt` 重設，它被記錄為程序，且僅在主管核准下執行。

### 6.2 方案概覽

本設計為一間 160 人的香港金融科技公司交付虛擬化企業網路，涵蓋一個總部、一個分支辦公室、兩個小型辦公室以及一支遠端工作團隊，全部建構於單一 Hypervisor 主機上的僅主機虛擬網路，加上一套模擬的 Cisco 拓撲。完全沒有任何形式的實體網路硬體。

位於沙田的總部是正式資料中心，容納所有核心服務。身分識別由一個 Active Directory 樹系與網域 `vertexpeak.fyp.lab` 提供，VLAN 30 上有兩部可寫入的網域控制站（`vpnz-dc01` 位於 10.10.30.11，`vpnz-dc02` 位於 10.10.30.12），觀塘則有一部唯讀網域控制站（`vpnz-brdc01`），在廣域鏈路失效時維持分支驗證運作。這些控制站同時是該樹系的權威 DNS 伺服器與權威時間來源，而同一樹系亦代管企業憑證授權單位，因此每一張憑證——供網域控制站、反向代理、IIS 層、IKEv2 伺服器、WireGuard 端點與 ASA 身分識別使用——都透過單一信任鏈被簽發、散佈與撤銷。具配額與篩選原則的檔案服務（`vpnz-fs01`）、區塊儲存（`vpnz-san01`）、遠端存取 VPN（`vpnz-rras01`）以及 Linux 端的遠端存取伺服器（`vpnz-lnxra01`）與它們並列於同一伺服器網段。

面向客戶的 SaaS 平台由非軍事區（DMZ）發佈，且從不直接由內部網路發佈。浮動虛擬位址之後的一對 Nginx 終止 TLS 並重新加密至原始層；Windows 應用層（`vpnz-dmzweba01/02` 上的 IIS）與內容層（`vpnz-dmzwp01/02` 上的 WordPress）位於該代理之後，且沒有來自網際網路的入向路徑。DMZ 是一個隔艙而非走廊：它不得對內部網路發起任何協定的任何連線、其主機僅可透過專用的 DMZ 跳板主機受管理，且它僅可對外觸達網際網路，且僅限於名稱解析與套件取得。

離開內部網路的一切都經過單一咽喉點：一對運行具狀態 nftables 過濾與 NAT 的 Ubuntu 主機，共用一個浮動虛擬位址，並以直列方式位於總部核心與 ASA 之間。此處即逐區域出口原則被強制執行之處、對外流量被歸屬於來源位址並記錄之處，以及原則變更的失敗被回滾計時器圍堵之處。在其之外，ASA 掌管邊緣：DMZ 邊界、已發佈服務的位址轉譯，以及通往灣仔的站對站 IPsec 通道。

路由是動態的，且依網域而非依偏好分隔。總部與觀塘在其廣域鏈路上運行單一 OSPF 區域 0，因此鏈路失效會造成可觀察且可記錄的真實重新收斂事件。澳門與一段繼承的過境網段仍以自治系統 100 運行 EIGRP，而其路由僅在單一路由器上、透過一個明確編號、加標籤、單向的重新分配點進入 OSPF。在邊界上，總部邊緣路由器是自治系統 65001，與模擬的主要供應商及一個次要對等端建立對等關係，而灣仔則被建模為其自有的小型自治系統。存取層是核心、聚合與存取的三層設計，兩部核心交換器組成備援配對並運行 RSTP，且明確設定根橋接器；而伺服器、使用者與儲存網段的閘道備援則由交換器虛擬介面上的 HSRP 提供。

分支連線刻意採異質設計，因為單一機制無法誠實地服務四個站點。觀塘經由一條路由鏈路觸達總部，並運行相同的 OSPF 程序。灣仔有兩條獨立路徑——ASA 上的 IPsec 站對站通道與 nftables 配對上的 WireGuard 通道——而其整合網段是公司中權限最低的網段，不持有任何生產憑證。澳門是 EIGRP 的分支端點。遠端員工透過兩套獨立機制連線，即經由 RRAS 與 OpenVPN 的憑證驗證 IKEv2，並以 WireGuard 遠端工作者池作為第三個選項。遠端使用者可觸達其角色所需的服務，並被斷然禁止觸達管理平面。

營運由單一控制節點（`vpnz-mon01`）自動化，該節點同時是 Git 伺服器、監控堆疊與設定保存庫。Ansible 透過 SSH 管理 Linux 資產、透過 WinRM 管理 Windows 資產；由於 Cisco 資產是模擬的且不暴露可觸達的管理介面，裝置設定以文字形式存於版本控制中，並附一份已記錄的落差分析，說明真實裝置將需要什麼。PowerShell 執行 Windows 與目錄工作，Bash 執行程序性的 Linux 工作，而每一次執行都寫入一份已提交的日誌。在自動化層之上是一個嚴格唯讀的代理層（`vpnz-ai01`），具四個已宣告的工具，把告警分診為有證據支持的敘述與供人類核准的*建議*變更，且依建構方式不存在寫入路徑。

因此，本環境最好以三個平面來理解。**資料平面**依區域矩陣承載使用者、伺服器與分支流量。**管理平面**位於其自有的位址空間，且僅可從 `Z-MGMT` 觸達。**自動化與可觀測性平面**——控制節點、Git、監控、代理——讀取並設定其他兩個平面，這正是它既是最值得營運、也是最值得攻陷的元件的原因。

`[FIGURE: 6.1 — 方案概覽]` 一張單頁方塊圖，由左至右繪製。最左側是一個標示為 `Z-REMOTE` 的圓角方塊，內含兩個筆記型電腦圖示，分別標示為「員工筆記型電腦——IKEv2 用戶端」與「員工筆記型電腦——OpenVPN 用戶端」，並有三支向右離開該方塊的箭頭，標註為 `UDP 500/4500 IKEv2`、`UDP 1194 OpenVPN`、`UDP 443 WireGuard`。中左側是一個標示為 `Z-WAN` 的大型雲朵輪廓，內含文字 `198.51.100.0/24 simulated Internet (RFC 5737)` 與兩個路由器圖示，分別標示為 `VP-ISP-EDGE-01 (AS 65000)` 與 `secondary provider (AS 65002)`。自雲朵進入的箭頭由上而下為：`VP-HQ-EDGE-01 (AS 65001)`；一個標示為 `VP-HQ-FW-01 ASA 5506-X outside 198.51.100.1` 的盾牌圖示；以及一組標示為 `vpnz-nft01 / vpnz-nft02 — nftables inline pair — VIP 10.10.50.10` 的雙主機配對。中央是一疊三個巢狀方塊，由外向內分別標示為 `Z-CORE 10.10.10.0/24`、`Z-SERVER 10.10.30.0/24` 與 `Z-STORAGE 10.10.80.0/24`，各含伺服器圖示並附確切主機名稱 `vpnz-dc01`、`vpnz-dc02`、`vpnz-fs01`、`vpnz-san01`、`vpnz-rras01`、`vpnz-lnxra01`、`vpnz-mon01`、`vpnz-ai01`、`vpnz-jump01` 與 `vpnz-hvhost01`。中央下方是一個標示為 `Z-DMZ 10.10.90.0/24` 的方塊，內含 `vpnz-dmzrev01/02 (VIP 10.10.90.10)`、`vpnz-dmzweba01/02`、`vpnz-dmzwp01/02` 與 `vpnz-dmzjump01`，並有虛線連往一個標示為 `Z-USER 10.10.40.0/23` 的方塊，內含工作站與電話圖示；最右側另有一個獨立方塊標示為 `Z-STUDENT 10.70.0.0/24 — isolated, no egress`。以線條粗細區分兩條獲准的入向流量（網際網路 → 443 上的 DMZ、網際網路 → 四個 UDP 埠上的 VPN 端點）與一條被禁止的流量（DMZ → 內部，繪為打叉）。

*圖說：圖 6.1——端對端方案概覽，顯示五個主要信任區、兩個強制執行層、三個遠端存取進入點，以及出口配對上的單一咽喉點。*

### 6.3 實體與虛擬基礎架構

#### 6.3.1 Hypervisor 主機

整個虛擬資產運行於一部學生自有的實體機器 `vpnz-hvhost01`，其管理位址為管理 VLAN 中的 10.20.20.10。沒有實驗室叢集、沒有共用儲存設備，也沒有第二部主機；這是本專案最大的單一可用性限制，並如此記錄而非粉飾：**Hypervisor 主機是全部十九部虛擬機器的單一故障點。**

#### 6.3.2 Hypervisor 建議與替代方案

建議的預設為 Windows 11 Pro 主機（24H2 或 25H2，組建 26100.x）上的 **VMware Workstation Pro 17.6.2**。該組建的版本說明頁面留存於參考資料夾中，作為該版本存在的證據——VMware Workstation 17.6.2 Pro release notes，`https://techdocs.broadcom.com/us/en/vmware-cis/desktop-hypervisors/workstation-pro/17-0/release-notes/vmware-workstation-1762-pro-release-notes.html`。免費個人使用授權在實際建置時是否仍適用於此確切組建，是一項必須重新查核的假設；若已改變，小組將更換 Hypervisor 而非付費。此建議立基於三項性質，依重要性排序。

第一，Virtual Network Editor 可建立任意數量的僅主機虛擬網路，並可選擇子網路，*且*可在每一個網路上關閉內建 DHCP 服務。這是在替代方案上最難滿足的要求，而在本處則是硬性要求：本設計需要九個隔離網路，且每一個都關閉 Hypervisor 的 DHCP，因為 Active Directory 的 DHCP 服務必須是實驗室中唯一的 DHCP 權威，也因為僅主機網路是代替 VLAN 隔離的機制。第二，快照與複製工作流程使十九部機器的建置能在四位學生、四部不同筆記型電腦之間可重現，並讓證據能被重新產生而不僅是被保留。第三，它擁有最廣泛的文件與教學資源，這很重要，因為小組四位成員中有三位將是首次使用它。

| 替代方案 | 能否滿足本設計？ | 條件，以及本基線所記錄的注意事項 |
|---|---|---|
| **Oracle VirtualBox 7.1.x** | 可以，但有一項注意事項 | 每個僅主機網路都必須以人手建立，並逐網路關閉內建 DHCP，而約八個僅主機網路的預設上限恰好位於本設計所需（九個）的邊緣。已記錄的變通做法是把 `VNET-STOR` 與 `VNET-LAB` 改置於內部網路，並記錄該變更；橋接模式必須保持停用。 |
| **Microsoft Hyper-V（Windows 11 Pro 內含）** | 可以，但有兩項注意事項 | Hyper-V 掌控主機網路堆疊，因此無法與 VMware 或 VirtualBox 共存於同一主機。預設與 NAT 交換器硬接至主機，因此必須以腳本建立自訂的純內部虛擬交換器，而每位客體的隔離效果取決於交換器設計。客體的 DHCP 與路由互動正確，但主機絕不得運行 DHCP 伺服器。 |
| **Proxmox VE 8.x** | 作為工作站 Hypervisor **不可行** | 它是需要專用機器的裸機 type-1 Hypervisor，與單一學生自有的 Hypervisor 主機相衝突。僅為記錄其被否決的原因而列出。 |
| **在虛擬機器內嵌套運行 Packet Tracer** | 不建議 | Packet Tracer 安裝於主機而非客體內。在客體內運行它會浪費資產所需的 RAM，並使螢幕擷取複雜化。 |

一項可攜性規則源於 Hypervisor 直到第 2 週結束前都不最終確定：**本章設計中的每一項規格都以通用方式表達**為 vCPU、RAM、磁碟、網路介面，以及「子網路為 X 且 DHCP 關閉的僅主機網路」。Hypervisor 專屬的措辭僅屬於建置手冊的逐 Hypervisor 附錄，因此本章內容不依賴任何特定 Hypervisor 的命名方式。

#### 6.3.3 資源預算

清單包含 36 列：16 部 Packet Tracer 邏輯裝置、19 部虛擬機器與 1 部 Hypervisor 主機。Packet Tracer 裝置是模擬物件，不消耗主機資源，因此下表僅列出虛擬機器與主機。

| 類別 | 數量 | vCPU | RAM（GB） | 已配置磁碟（GB） |
|---|---|---|---|---|
| Windows Server 客體（`vpnz-dc01`、`vpnz-dc02`、`vpnz-fs01`、`vpnz-san01`、`vpnz-rras01`、`vpnz-dmzweba01`、`vpnz-dmzweba02`、`vpnz-jump01`、`vpnz-brdc01`） | 9 | 18 | 36 | 540 |
| Ubuntu 客體 `vpnz-mon01`（Ansible 控制節點、Git、監控） | 1 | 4 | 8 | 100 |
| Ubuntu 客體 `vpnz-ai01`（代理執行環境） | 1 | 4 | 8 | 60 |
| 其他 Ubuntu 客體（`vpnz-lnxra01`、`vpnz-nft01`、`vpnz-nft02`、`vpnz-dmzrev01`、`vpnz-dmzrev02`、`vpnz-dmzwp01`、`vpnz-dmzwp02`、`vpnz-dmzjump01`） | 8 | 16 | 26 | 300 |
| **合計，19 部虛擬機器運行中** | **19** | **42** | **78** | **1 000** |
| 範本（已關機，不計入執行期數字） | 2 | — | — | 130 |
| 快照容許量 | — | — | — | +250 |
| **主機儲存需求** | | | | **≈ 1 400 GB 已配置；建議 2 TB** |

關於此表有兩項事實必須仔細閱讀。42 vCPU 這個數字是*已配置*的 vCPU，而非同時負載：此處沒有任何機器處於 CPU 飽和，除了在套件安裝或自動化執行期間短暫如此，這也是 8 核心機器可行的原因，而 12–16 核心則較為從容。相較之下，在工作站 Hypervisor 上 RAM 無法有效地超額配置，因此**78 GB 的配置量才是具約束力的限制**，而非 CPU。

| 元件 | 最低（可行） | 建議 | 備註 |
|---|---|---|---|
| CPU | 8 實體核心／16 執行緒，且 AMD-V 或 Intel VT-x **已在韌體中啟用** | 12–16 核心／24–32 執行緒 | 在 8 核心上配置 42 vCPU 屬嚴重超額訂閱，之所以尚可承受，僅因該資產從不滿載。必須啟用虛擬化延伸功能，否則一切無法運行。 |
| RAM | 32 GB | **64 GB** | 硬性限制。32 GB 迫使改採兩班制建置，讓 `Z-SERVER` 與 `Z-DMZ` 資產分開運行而非同時運行，而該縮減必須記錄。 |
| 磁碟 | 1 TB 可用 | **2 TB NVMe 可用** | 已包含精簡配置加上 250 GB 快照容許量。若可避免，VM 儲存區不應與主機自身的分頁檔共用同一實體磁碟。 |
| 網路 | 一個具網際網路存取權的介面以供修補；**不得橋接至校園或家中 LAN** | 兩個介面 | 所有實驗室流量皆為僅主機。橋接模式被禁止，而 `VMnet0` 刻意不使用。 |
| 作業系統 | Windows 11 Pro（24H2 或更新）以供 VMware 或 Hyper-V；若選擇 VirtualBox 則 Linux 亦可接受 | Windows 11 Pro 64 位元 | 一部具 16 個邏輯處理器與大量可用磁碟的機器，在 CPU 與磁碟上均超出最低要求，僅受 RAM 限制。 |
| GPU | 不需要 | 不需要 | 不計劃在本機進行模型推論；若嘗試，則為附有已記錄主機變更的備用方案。 |

儲存紀律源自同一組數字。所有客體磁碟皆為精簡配置，並在第 6 週與第 10 週檢視預算。每次重大變更前建立快照，並在變更經驗證與記錄後移除，且**快照絕不用作備份**。異機副本是為*證據*——螢幕截圖、設定、playbook 日誌——而製作，存放於 DMZ 跳板主機的備份儲存庫與小組的 Git 儲存庫；虛擬機器本身的異機副本並未嘗試，且明確不屬本設計範圍。

`[FIGURE: 6.2 — 主機資源配置與虛擬網路圖]` 一張雙面板圖。左面板是堆疊長條圖，以主機的 64 GB RAM 為縱軸，19 部客體各繪為一個比例方塊並標示其確切主機名稱：九個 4 GB 的 Windows 方塊（36 GB）、兩個分別供 `vpnz-mon01` 與 `vpnz-ai01` 使用的 8 GB 方塊、八個合計 26 GB 的較小 Ubuntu 方塊，再加上一個斜線標示的「主機作業系統」方塊與一個斜線標示的「餘裕」方塊，使讀者能看見該資產如何填滿主機。右面板是輪輻圖，中央圓角方塊標示為 `vpnz-hvhost01 — VMware Workstation Pro 17.6.2 — Windows 11 Pro`，由此輻射出九條線至九個隔離矩形，各標示其子網路與用途：`VNET-MGMT 10.20.20.0/24`、`VNET-CORE 10.10.10.0/24`、`VNET-SRV 10.10.30.0/24`、`VNET-EGRESS 10.10.50.0/28`、`VNET-DMZ 10.10.90.0/24`、`VNET-LAB 10.70.0.0/24`、`VNET-USER 10.10.40.0/23`、`VNET-STOR 10.10.80.0/24` 與 `VNET-WAN 10.10.200.0/24`，每一項都註明「僅主機、Hypervisor DHCP 關閉」。應自輪轂垂下一條被截斷的虛線，標示「橋接模式——禁止」。

*圖說：圖 6.2——主機資源配置，以及代替 VLAN 隔離的九個僅主機虛擬網路。*

### 6.4 邏輯拓撲

#### 6.4.1 站點

| 站點代碼 | 站點 | 角色 | 網段 |
|---|---|---|---|
| `HQ` | 沙田，香港科學園 | 總部與正式資料中心；所有核心服務 | VLAN 10、20、30、40、45、50、60、70、80、90 |
| `BR` | 觀塘 | 分支辦公室，28 名員工，設有一部唯讀網域控制站 | VLAN 110、111、112、113 |
| `WC` | 灣仔 | 小型交付辦公室，12 名員工，IPsec 與 WireGuard 對等端 | VLAN 130、131 |
| `MO` | 澳門 | 代表辦事處，4 名員工，EIGRP 分支端點 | VLAN 120、121 |
| `ISP` | 模擬的上游過境供應商 | 僅 Packet Tracer | VLAN 100 |
| `CLOUD` | 模擬的外部 SaaS 與遠端工作者網際網路 | 僅 Packet Tracer | — |

#### 6.4.2 信任區

| 區域 | 信任等級 | 所含內容 | 強制執行層 |
|---|---|---|---|
| `Z-CORE` | 最受信任的網路區域，但仍非安全邊界 | 總部核心路由器、核心交換器、OSPF 骨幹 | 路由器與交換器 ACL；管理平面限制 |
| `Z-MGMT` | 限制最高的區域 | Hypervisor 主機管理、頻外交換器管理、管理跳板主機 | 核心及每部受管理裝置上的 ACL；不允許任何使用者流量 |
| `Z-SERVER` | 受信任的伺服器區域 | 身分識別、檔案、儲存、DNS、監控、遠端存取與 AI 虛擬機器 | nftables 輸入原則、主機防火牆、針對離開站點之流量使用 ASA |
| `Z-USER` | 非受信任至受信任的邊界 | 員工工作站與 VoIP 端點 | 閘道 ACL；出口使用 nftables 配對 |
| `Z-STUDENT` | 完全不受信任 | 隔離實驗室與訪客網段，刻意分隔 | 全拒，僅一項例外 |
| `Z-EGRESS` | 咽喉點 | nftables 高可用性配對；自 `Z-SERVER` 或 `Z-USER` 通往網際網路的唯一路徑 | 它本身——原則即存在於此 |
| `Z-DMZ` | 可自外部觸達，內部不受信任 | 反向代理、Windows 應用層、內容層、DMZ 跳板主機 | ASA DMZ 介面加上主機防火牆 |
| `Z-WAN` | 供應商控制 | 過境鏈路與模擬的供應商網路 | ASA outside 介面；nftables WAN 側介面 |
| `Z-REMOTE` | 可自外部觸達，僅經驗證 | VPN 位址池與站對站通道對等端 | 通道端點原則，然後是應用層授權 |

#### 6.4.3 信任邊界原則

以下矩陣具規範性。`PERMIT` 表示允許並記錄；`DENY` 表示丟棄，且在裝置支援時予以記錄；`REVIEW` 表示僅允許具名協定、僅至具名目的地，且僅在支持該項的審查案例仍開放期間。橫向讀取為來源區域，縱向讀取為目的區域。

| 從 ↓ / 至 → | `Z-MGMT` | `Z-SERVER` | `Z-CORE` | `Z-EGRESS` | `Z-DMZ` | `Z-USER` | `Z-STUDENT` | `Z-WAN` / Internet |
|---|---|---|---|---|---|---|---|---|
| **`Z-MGMT`** | PERMIT | PERMIT（僅管理協定） | PERMIT | PERMIT（僅管理） | REVIEW（僅經由 DMZ 跳板主機） | PERMIT（僅管理） | PERMIT（僅實驗室主控台） | DENY |
| **`Z-SERVER`** | REVIEW（syslog 514/udp、SNMPv3 161/udp、traps 162/udp） | PERMIT | PERMIT | PERMIT（過境） | DENY | REVIEW（DHCP 與 DNS 回應） | DENY | REVIEW（443/tcp、NTP、經轉寄站的 DNS、ICMP） |
| **`Z-CORE`** | PERMIT（管理） | PERMIT（路由） | PERMIT | PERMIT（路由） | PERMIT（路由至 ASA） | PERMIT（路由） | DENY | PERMIT（路由至邊緣） |
| **`Z-EGRESS`** | REVIEW（syslog、SNMPv3） | PERMIT（過境、具狀態回程） | PERMIT（路由） | PERMIT | DENY | PERMIT（過境、具狀態回程） | DENY | **REVIEW——唯一的出口路徑**（HTTP 80、HTTPS 443 及獲准的流量） |
| **`Z-DMZ`** | DENY | **DENY** | DENY | DENY | PERMIT | **DENY** | DENY | REVIEW（僅經 443/tcp 的 DNS 與套件取得，僅出向，且僅來自 `vpnz-dmzrev01` 與 `vpnz-dmzweba01/02`） |
| **`Z-USER`** | DENY | REVIEW（至網域控制站的 DNS 53、Kerberos 88、LDAP 389 與 SMB 445；至檔案伺服器的 SMB 445；至監控的 HTTPS 443；iSCSI 3260 僅來自平台層；**RDP 被拒**） | PERMIT（預設閘道） | PERMIT（過境） | DENY | PERMIT | DENY | REVIEW（僅經 `Z-EGRESS`：HTTP、HTTPS、至內部解析器的 DNS、NTP、ICMP echo） |
| **`Z-STUDENT`** | DENY | DENY | DENY | DENY | DENY | DENY | PERMIT（僅網段內） | **DENY——依設計完全無出口** |
| **`Z-WAN` / Internet** | DENY | **DENY** | DENY | REVIEW（僅四個 VPN 埠） | REVIEW（僅至已發佈代理位址的 HTTPS 443 與 HTTP 80；ICMP echo） | DENY | DENY | PERMIT |
| **`Z-REMOTE`（VPN 位址池）** | **DENY** | REVIEW（同 `Z-USER`，另加至兩部平台虛擬機器的 RDP 3389，且僅限專業服務組） | DENY | DENY | DENY | DENY | DENY | REVIEW（經由通道） |
| **AI 代理（`vpnz-ai01`）** | DENY | REVIEW（唯讀輪詢：ICMP、SNMPv3 161/udp、WinRM 5986、SSH 22 唯讀命令、HTTPS 443 唯讀 API） | REVIEW（唯讀輪詢） | DENY | DENY | DENY | DENY | DENY |

有五列承載了架構論證，應予特別指出。`Z-DMZ` → 內部是**所有協定一律拒絕**，這正是使 DMZ 成為隔艙而非集結區的原因。網際網路 → `Z-SERVER` 與網際網路 → `Z-USER` 是**完全拒絕**，因此唯一可由網際網路觸達的元素是已發佈的代理位址與四個通道埠。`Z-REMOTE` → `Z-MGMT` 是**完全拒絕**，因此一部持有有效憑證與有效認證資料的員工筆記型電腦仍無法觸達管理平面。`Z-STUDENT` 完全沒有出口，而刻意誤用測試正是以此為來源，以便「拒絕」是被證明的而非被斷言的。而 AI 代理本身即是一個來源區域，具唯讀允許清單，且沒有任何一處目的地接受來自它的寫入。

每一條獲准的流量都會被記錄，而本設計要求每個區域邊界至少擷取一次拒絕，使*拒絕*路徑與允許路徑一樣獲得具體舉證。任何後續撰寫者若記錄一項實測，都必須引用其所驗證的信任邊界規則識別碼。

`[FIGURE: 6.3 — 信任區與信任邊界原則圖]` 一張矩形區域圖，`Z-WAN` 位於頂部作為雲朵，`Z-REMOTE` 位於其旁作為虛線藥丸形，內部區域則排列於下方一列。將獲准的流量繪為附埠標註的實線箭頭，被禁止的流量繪為以短垂直線劃掉的虛線箭頭。必要箭頭，由上而下：`Z-WAN → Z-DMZ` 實線，標註 `TCP 443, 80 → 198.51.100.2`；`Z-WAN → Z-EGRESS` 實線，標註 `UDP 443 / 500+4500 / 1194`；`Z-DMZ → internal` 虛線並劃掉，標註 `DENY all (TB-04)`；`Z-WAN → Z-SERVER and Z-USER` 虛線並劃掉，標註 `DENY all (TB-06)`；`Z-EGRESS → Z-WAN` 實線，標註 `NAT + stateful filter, logged`；`Z-MGMT → every zone` 實線，標註 `SSH, RDP, WinRM 5985/5986, Windows Admin Center 6516, SNMPv3, syslog`；`every zone → Z-MGMT` 細實線，標註 `syslog 514/udp and SNMPv3 161/udp only`；`Z-REMOTE → Z-MGMT` 虛線並劃掉，標註 `DENY (TB-12)`；`Z-STUDENT → anything off-segment` 虛線並劃掉，標註 `DENY (TB-09, TB-10)`。把 `vpnz-ai01` 置於一個小型內嵌方塊中，以點線唯讀箭頭連往一個裝置圖示，各標註 `read-only`，並繪一支大型打叉箭頭標註 `no write path`。

*圖說：圖 6.3——以圖示呈現的信任區矩陣，獲准流量附埠標註，被禁止流量繪為劃掉。*

### 6.5 廣域與分支連線

#### 6.5.1 WAN 鏈路

| 鏈路 | 本端介面與位址 | 對等端 | 用途 |
|---|---|---|---|
| 總部邊緣 → 主要供應商 | `VP-HQ-EDGE-01` gi0/0 = 10.10.100.1/30 | `VP-ISP-EDGE-01` 10.10.100.2/30 | 主要 eBGP 工作階段（AS 65001 ↔ AS 65000） |
| 總部邊緣 → 備援供應商邊緣 | 10.10.100.5/30 | 10.10.100.6/30 | 第二供應商路徑 |
| 總部邊緣 → 替代供應商對等端 | 10.10.100.41/30 | 10.10.100.42/30 | 第二個 eBGP 工作階段，連接 AS 65002 |
| 總部邊緣 → 觀塘 | gi0/2 = 10.10.100.33/30 | `VP-BR-EDGE-01` gi0/1 = 10.10.100.34/30 | 通往分支的 OSPF 區域 0 鏈路 |
| 總部邊緣 → 澳門 | gi0/3 = 10.10.100.37/30 | `VP-MO-EDGE-01` gi0/1 = 10.10.100.38/30 | 網域邊界：總部一側為 OSPF，澳門一側為 EIGRP AS 100 |
| 總部 ASA outside | 198.51.100.1/29 | 供應商雲 | 已發佈服務與通往灣仔的 IPsec 通道 |
| 總部邊緣公眾呈現 | 192.0.2.2/30 | 供應商雲 192.0.2.1 | 模擬的網際網路核心 |
| 灣仔 outside | 203.0.113.5/29 | ASA 與 WireGuard 對等端 | 通道終端；刻意使用第二個文件範圍，使通道對等位址一眼即可與已發佈服務範圍區別 |

公眾位址呈現刻意分散於三個文件區塊，使位址的角色可從位址本身辨讀：`198.51.100.0/24` 是已發佈的 DMZ 範圍，`203.0.113.0/24` 是通道與 WAN 對等範圍，而 `192.0.2.0/24` 是模擬的網際網路核心。本設計中任何地方都不會出現這些範圍與私人區塊以外的位址。

#### 6.5.2 總部對分支的路由設計

刻意設定三種分支模式，因為單一模式無法展示工作說明書所要求的連線範圍。

**觀塘——經路由，同一路由網域。** `VP-BR-EDGE-01` 跨 `/30` 鏈路與總部邊緣路由器形成 OSPF 鄰接關係，而分支的四個網段被通告進入區域 0。流量經路由，絕不橋接：**總部與任何分支之間不延伸任何 VLAN**，這移除了一類故障，即單一廣播網域的問題跨越廣域鏈路而被共享。該分支保留一部 RODC，以便在鏈路失效時 Kerberos 驗證與本機 DNS 得以繼續；這是一項刻意的可用性決策，並帶有報告必須說明的安全成本——位於防護較弱站點的唯讀控制站持有憑證，因此其密碼複寫原則已記錄並受限，而非維持於預設值。分支 DHCP 由總部跨鏈路以本機轉送服務提供；該 RODC 是 DHCP 轉送器與第三部 DNS 伺服器，且**絕不**是任何用戶端唯一的解析器，因為一個唯一解析器無法觸達的分支，就是一個無法登入的分支。

**灣仔——經通道，兩條獨立路徑。** 灣仔刻意擁有備援且異質的連線，因為它同時代管公司中權限最低的網段。ASA 提供 IKEv2 站對站 IPsec 通道，而 nftables 配對提供 WireGuard 通道，兩者在協定、實作與密碼學設計上皆相互獨立。由哪一條承載生產流量是一項未定決策：WireGuard 站對站對等端可由一部模擬分支加密閘道的專用 Ubuntu 客體代表，或者 WireGuard 角色可縮減為服務遠端工作者，由 ASA 承載站對站通道。無論如何，**本設計不得宣稱在 Cisco 裝置上運行 WireGuard**，因為 Cisco 路由器無法終止 WireGuard，而報告必須記錄所採取的決定。灣仔整合網段（VLAN 131，10.10.131.0/24）不持有任何生產憑證，而該站點的 `/24` 網段經由通道通告回總部。

**澳門——網域邊界。** 澳門運行 EIGRP AS 100，並經由一條 `/30` 鏈路觸達總部，該鏈路即是兩個路由網域之間的邊界。其路由僅在單一路由器 `VP-HQ-EDGE-01` 上、透過單向加標籤重新分配進入 OSPF。澳門沒有本機伺服器、沒有本機網域控制站，也沒有本機 DNS，對於一個四人的辦事處而言，這是誠實且刻意的限制：其可用性完全取決於該鏈路，而報告必須如此說明，而不得暗示存在實際上並不存在的站點韌性。

#### 6.5.3 站點之間的流量如何受控

有兩項機制共同運作。第一是路由原則：自一個網域進入另一個網域的出口受到過濾，且僅有重新分配點可在網域之間轉譯路由，因此一個前綴的來源永遠可被判定。第二是 §6.4.3 的信任邊界矩陣，獨立於路由之外強制執行：對某個目的地*可路由*與*獲准*觸達它是不同的事，而本設計要求兩者兼具。站間流量與站內流量受同一矩陣管轄——一部分支工作站觸達總部伺服器，無論路徑為何都是 `Z-USER` → `Z-SERVER` 流量——唯一額外之處在於分支路由器管理位址僅可從 `Z-MGMT` 觸達。因此，一條廣域鏈路改變的是流量的*路徑*，而絕不是它的*判定*。

`[FIGURE: 6.4 — 廣域拓撲與站間原則]` 一張由左至右的拓撲圖，總部位於中央作為一個大型圓角矩形，標示為「HQ Sha Tin — data centre of record」，內含小型標示圖示：`VP-HQ-EDGE-01`、`VP-HQ-FW-01`、nftables 配對、核心交換器與伺服器堆疊。左側是一個標示為 `Z-WAN — simulated transit (RFC 5737 ranges)` 的雲朵，內含 `VP-ISP-EDGE-01`，以一條實線連接總部並標註 `gi0/0 10.10.100.1/30 ↔ 10.10.100.2/30 — eBGP AS 65001 ↔ 65000`，另有一條較細的線標註 `10.10.100.41/30 — second session to AS 65002`。上方是一個虛線藥丸形，標示為 `Z-REMOTE — 10.10.201.0/24 IKEv2, 10.10.202.0/24 OpenVPN, 10.10.200.64/26 WireGuard`，並有三支點線箭頭進入總部周邊，各標示其 UDP 埠。右側是三個垂直堆疊的站點方塊：`BR Kwun Tong` 以實線連接總部，標註 `10.10.100.32/30 — OSPF area 0 — RODC vpnz-brdc01`；`MO Macau` 以實線連接，標註 `10.10.100.36/30 — EIGRP AS 100 — redistribution only at VP-HQ-EDGE-01, tags 100/200`；以及 `WC Wan Chai` 以**兩條**不同虛線樣式的平行線連接總部，一條標註 `IPsec IKEv2 via ASA, UDP 500/4500`，一條標註 `WireGuard via the nftables VIP, UDP 443`，並附註說明 Cisco 路由器無法終止 WireGuard。為每個分支方塊標註其 VLAN 清單與位址。

*圖說：圖 6.4——廣域拓撲，顯示三種刻意的分支連線模式，以及通往灣仔的兩條獨立通道。*

### 6.6 IP 位址與 VLAN 設計

所有位址皆來自 RFC 1918 私人範圍或 RFC 5737 文件範圍；其他一律不用。適用的參考資料，以標題與編號引用，為 **RFC 1918《Address Allocation for Private Internets》** 與 **RFC 5737《IPv4 Address Blocks Reserved for Documentation》**。已發佈的服務名稱以 `.example` 結尾，依 **RFC 2606《Reserved Top Level DNS Names》**。本專案**僅支援 IPv4**；IPv6 不在範圍內，而 **RFC 4193《Unique Local IPv6 Unicast Addresses》** 僅為記錄此事實而引用。

#### 6.6.1 私人位址空間的配置

| 區塊 | 指派對象 | 備註 |
|---|---|---|
| `10.10.0.0/16` | 所有總部 LAN、所有分支與小型辦公室 LAN、WAN 鏈路、供應商過境鏈路、loopback | 邏輯總部空間 10.10.0.0/17；分支與小型辦公室空間位於 10.10.110.0/17 一側 |
| `10.20.0.0/16` | 管理網路 | 刻意置於 `10.10.0.0/16` 之外，使路由錯誤無法暴露管理平面 |
| `10.70.0.0/16` | 隔離的學生與實驗室網路 | 刻意置於上述兩者之外 |
| `10.255.0.0/24` | 路由器 loopback | 每部路由裝置一個 |
| `192.0.2.0/24` | 模擬的公眾網際網路核心 | RFC 5737 TEST-NET-1 |
| `198.51.100.0/24` | 模擬的公眾發佈範圍 | RFC 5737 TEST-NET-2 |
| `203.0.113.0/24` | 模擬的公眾 WAN 對等範圍，供通道使用 | RFC 5737 TEST-NET-3 |
| `172.16.0.0/16` | **未配置** | 保留作為未來分支增長的餘裕。它不得出現於任何設定中，也不得用於 VPN 位址池。 |

#### 6.6.2 VLAN 規劃

`VID` 為固定值。閘道是用戶端的預設閘道，凡存在備援之處即為虛擬位址，絕非實體介面位址。凡閘道欄顯示裸介面位址者，該閘道*即為*該路由器或交換器介面。

| VID | 名稱（確切字串） | 站點 | 用途 | 閘道（VIP） | 其上主要主機或裝置 |
|---|---|---|---|---|---|
| 10 | `LAN-HQ-CORE` | HQ | 核心、邊緣路由器、ASA inside 介面、nftables 配對與總部使用者閘道介面之間的第 3 層過境 | 10.10.10.1（`VP-HQ-CORE-01`） | 總部核心交換器、邊緣路由器子介面、nftables 配對、ASA inside 介面、Nginx 配對（雙歸屬） |
| 20 | `MGMT-OOB` | HQ | Hypervisor 主機管理、交換器管理、跳板主機。無使用者流量 | 10.20.20.1（`VP-HQ-CORE-01` gi0/1.20） | `vpnz-hvhost01` 10.20.20.10、`vpnz-jump01` 10.20.20.31、`VP-HQ-CORE-01`/`02` 10.20.20.11/12、`VP-HQ-DSW-A01..A04` 10.20.20.21–24、`VP-HQ-EDGE-01` 10.20.20.31、`VP-HQ-FW-01` 管理 10.20.20.32 |
| 30 | `SRV-HQ-1` | HQ | 主要 Windows 伺服器 VLAN：身分識別、檔案、儲存、監控、遠端存取、Linux 服務與 AI | 10.10.30.254（HSRP VIP；實體介面為 `VP-HQ-CORE-01` gi0/1.30 上的 10.10.30.1，HSRP `.254`/`.253`） | `vpnz-dc01` 10.10.30.11、`vpnz-dc02` 10.10.30.12、`vpnz-fs01` 10.10.30.21、`vpnz-mon01` 10.10.30.31、`vpnz-rras01` 10.10.30.41、`vpnz-lnxra01` 10.10.30.42、`vpnz-ai01` 10.10.30.51 |
| 40 | `USER-HQ-STF` | HQ | 總部員工工作站，6 樓至 11 樓 | 10.10.40.254（HSRP VIP） | 總部工作站；Packet Tracer 邏輯端點與 `VNET-USER` 僅主機網路 |
| 45 | `VOICE-HQ` | HQ | 專用語音 VLAN 上的 VoIP 端點，通話處理位於核心 | 10.10.45.1（`VP-HQ-CORE-01` gi0/1.45） | `VP-HQ-VOICE-01`（CUCM Express，於 Packet Tracer 中模擬）位於 10.10.45.11 |
| 50 | `TRANSIT-EGRESS` | HQ | 自內部網路通往周邊的唯一路徑：核心 ↔ nftables 配對 ↔ ASA inside | 10.10.50.1（`VP-HQ-CORE-01` gi0/1.50）；nftables VIP 10.10.50.10 | `vpnz-nft01` 10.10.50.11、`vpnz-nft02` 10.10.50.12、ASA inside 10.10.50.2、總部核心子介面 |
| 60 | `SRV-HQ-2` | HQ | 為增長與平台層第二階段保留的次要伺服器 VLAN | 10.10.60.1 | **保留。本設計中未在其內部部署任何內容。** |
| 70 | `STUDENT-LAB` | HQ | 完全隔離的訓練與實驗室網段 | 10.70.0.254（HSRP VIP） | 隔離實驗室端點；`VNET-LAB` |
| 80 | `STORAGE-HQ` | HQ | iSCSI 區塊儲存網路；不路由至核心以外 | 10.10.80.254（HSRP VIP） | `vpnz-san01` 10.10.80.21（iSCSI 目標）；平台層發起端 |
| 90 | `DMZ-HQ` | HQ | 對外發佈的服務，嚴格隔艙 | 10.10.90.1（ASA DMZ 介面即 DMZ 閘道） | `vpnz-dmzrev01`/`02`（VIP 10.10.90.10）、`vpnz-dmzweba01` 10.10.90.21、`vpnz-dmzweba02` 10.10.90.22、`vpnz-dmzwp01` 10.10.90.25、`vpnz-dmzwp02` 10.10.90.26、`vpnz-dmzjump01` 10.10.90.27 |
| 100 | `LAN-ISP` | ISP | 模擬的上游供應商 LAN；僅 Packet Tracer | 10.10.100.1 | 模擬供應商路由器、`VP-HQ-EDGE-01` outside 介面、供應商 DNS |
| 110 | `BR-SALES` | BR | 觀塘業務與客戶入職樓層 | 10.10.110.1 | 分支工作站 |
| 111 | `BR-STAFF` | BR | 觀塘後勤員工 | 10.10.111.1 | 分支工作站 |
| 112 | `BR-VOICE` | BR | 觀塘 VoIP | 10.10.112.1 | 分支電話 |
| 113 | `BR-MGMT` | BR | 觀塘交換器、路由器與伺服器管理 | 10.10.113.1 | `VP-BR-EDGE-01` 10.10.113.1、`VP-BR-DSW-A01` 10.10.113.21、`vpnz-brdc01` 10.10.113.11 |
| 120 | `MO-LAN` | MO | 澳門辦事處 LAN | 10.10.120.1 | 澳門工作站；`VP-MO-DSW-A01` 10.10.120.21 |
| 121 | `MO-VOICE` | MO | 澳門 VoIP | 10.10.121.1 | 澳門電話 |
| 130 | `WC-LAN` | WC | 灣仔辦事處 LAN | 10.10.130.1 | 灣仔工作站；`VP-WC-DSW-A01` 10.10.130.21 |
| 131 | `WC-DEV` | WC | 灣仔整合與開發網段；最小權限，無生產憑證 | 10.10.131.1 | 整合測試端點 |
| 999 | `UNUSED-BLACKHOLE` | all | 每部交換器上皆存在的一個已關閉 VLAN，用以吸納未指派的埠 | — | 無主機。指派至此的埠皆為行政關閉。 |

VLAN 紀律規則是設計，而非內務。每條幹道上的原生 VLAN 是 **999**，絕不是 VLAN 1；VLAN 1 存在但不承載任何流量。每個未使用的存取埠都指派至 VLAN 999 並關閉，因此未接線的埠不會成為未被察覺的進入點。`switchport nonegotiate` 與搭配 `bpduguard enable` 的 `spanning-tree portfast` 套用於終端使用者存取埠。幹道僅存在於兩部核心交換器之間、核心與存取交換器之間、核心與邊緣路由器之間、核心與 ASA 之間，以及核心與分支邊緣路由器之間。而**總部與任何分支之間不延伸任何 VLAN**：站間流量一律經路由。

#### 6.6.3 完整子網路表

| 子網路（CIDR） | VLAN | 閘道 | 可用範圍 | DHCP？ | 用途 |
|---|---|---|---|---|---|
| 10.10.10.0/24 | 10 | 10.10.10.1 | .1 – .254 | 否 | 總部第 3 層過境與使用者預設閘道 |
| 10.20.20.0/24 | 20 | 10.20.20.1 | .1 – .254 | 否 | 管理與頻外 |
| 10.10.30.0/24 | 30 | 10.10.30.254（VIP） | .1 – .253 | 否 | 總部伺服器子網路 1 |
| 10.10.40.0/23 | 40 | 10.10.40.254（VIP） | .1 – 10.10.41.254 | 是 | 總部員工工作站（508 個可用） |
| 10.10.45.0/24 | 45 | 10.10.45.1 | .1 – .254 | 是 | 總部 VoIP |
| 10.10.50.0/28 | 50 | 10.10.50.1 | .1 – .14 | 否 | 出口過境：核心 ↔ nftables ↔ ASA |
| 10.10.60.0/24 | 60 | 10.10.60.1 | .1 – .254 | 否 | 保留的總部伺服器子網路 2——未部署 |
| 10.70.0.0/24 | 70 | 10.70.0.254（VIP） | .1 – .253 | 是 | 隔離實驗室 |
| 10.10.80.0/24 | 80 | 10.10.80.254（VIP） | .1 – .253 | 否 | iSCSI 儲存 |
| 10.10.90.0/24 | 90 | 10.10.90.1（ASA inside） | .1 – .254 | 否 | DMZ |
| 10.10.100.0/30 | 100 | — | .1 / .2 | 否 | 總部邊緣 ↔ 供應商邊緣 |
| 10.10.100.4/30 | 100 | — | .5 / .6 | 否 | 總部邊緣 ↔ 備援供應商邊緣 |
| 10.10.100.32/30 | 100 | — | .33 / .34 | 否 | 總部邊緣 ↔ 觀塘（OSPF） |
| 10.10.100.36/30 | 100 | — | .37 / .38 | 否 | 總部邊緣 ↔ 澳門（EIGRP 網域邊界） |
| 10.10.100.40/30 | 100 | — | .41 / .42 | 否 | 總部邊緣 ↔ 替代供應商對等端 |
| 10.10.110.0/24 | 110 | 10.10.110.1 | .1 – .254 | 是 | 觀塘業務 |
| 10.10.111.0/24 | 111 | 10.10.111.1 | .1 – .254 | 是 | 觀塘員工 |
| 10.10.112.0/24 | 112 | 10.10.112.1 | .1 – .254 | 是 | 觀塘 VoIP |
| 10.10.113.0/24 | 113 | 10.10.113.1 | .1 – .254 | 否 | 觀塘管理 |
| 10.10.120.0/24 | 120 | 10.10.120.1 | .1 – .254 | 是 | 澳門 LAN |
| 10.10.121.0/24 | 121 | 10.10.121.1 | .1 – .254 | 是 | 澳門 VoIP |
| 10.10.130.0/24 | 130 | 10.10.130.1 | .1 – .254 | 是 | 灣仔 LAN |
| 10.10.131.0/24 | 131 | 10.10.131.1 | .1 – .254 | 是 | 灣仔整合網段 |
| 10.255.0.0/24 | — | — | 僅 loopback | 否 | 路由器 loopback，`.11`–`.61` |
| 192.0.2.0/24 | — | 192.0.2.1 | — | 模擬 | 模擬的網際網路核心 |
| 198.51.100.0/29 | — | 198.51.100.1（ASA outside） | .1 – .6 | 否 | 公眾 DMZ 位址池 |
| 203.0.113.0/29 | — | 203.0.113.1（供應商） | .1 – .6 | 否 | 公眾通道與 WAN 對等位址池 |

VLAN 40 之所以是 `/23`，是因為 110 名總部員工加上增長，無法在 `/24` 中乾淨地完成定址，同時又保留一個整齊的 DHCP 排除範圍；VLAN 45、70、80、90 與分支語音網段則刻意保持精簡。基線的 `LAN-ISP` 摘要印出 `10.10.100.0/29`；上方的規範性表格則給出實際配置的各個 `/30` 鏈路配置。該 `/29` 並非使用中的子網路：它是容納五條鏈路中恰好前兩條（`10.10.100.0/30` 與 `10.10.100.4/30`）的一個容器名稱。其餘三條鏈路（`.32/30`、`.36/30`、`.40/30`）位於其外。此事現由 Rev 1.1 裁決 C-03 定案，而非記錄為未決差異。

#### 6.6.4 Loopback 配置

| 裝置 | Loopback | WAN 或鏈路介面與位址 | 對等端 |
|---|---|---|---|
| `VP-HQ-CORE-01` | 10.255.0.11/32 | — | — |
| `VP-HQ-CORE-02` | 10.255.0.12/32 | — | — |
| `VP-HQ-EDGE-01` | 10.255.0.21/32 | gi0/0 = 10.10.100.1/30；gi0/1 = 192.0.2.2/30；gi0/2 = 10.10.100.33/30；gi0/3 = 10.10.100.37/30 | 供應商邊緣；觀塘；澳門 |
| `VP-HQ-FW-01`（ASA） | 不適用——ASA 沒有 loopback | outside = 198.51.100.1/29；inside = 10.10.50.2/28；dmz = 10.10.90.1/24 | 邊緣路由器；DMZ 網段 |
| `VP-BR-EDGE-01` | 10.255.0.31/32 | gi0/1 = 10.10.100.34/30 | `VP-HQ-EDGE-01` |
| `VP-MO-EDGE-01` | 10.255.0.41/32 | gi0/1 = 10.10.100.38/30 | `VP-HQ-EDGE-01` |
| `VP-WC-EDGE-01` | 10.255.0.51/32 | outside = 203.0.113.5/29 | ASA 與 WireGuard 對等端 |
| `VP-ISP-EDGE-01` | 10.255.0.61/32 | 192.0.2.1/30；10.10.100.6/30；10.10.100.42/30 | `VP-HQ-EDGE-01` 及替代端 |

Loopback 在此重要，有兩項理由必須解釋而非假定。它們為每部路由裝置提供穩定的路由器識別碼，以及供管理與協定工作階段使用的穩定來源位址，因此當實體鏈路擺動時，鄰接關係或 syslog 訊息不會改變身分。它們也為內部提供一組前綴，其路由行為可診斷失效的鏈路，因為一個 loopback 只能經由唯一一條路徑觸達，因此該路徑一失效，它就會從表中消失。

#### 6.6.5 VPN 與通道定址

| 通道 | 類型 | 端點 A | 端點 B | 內部定址 |
|---|---|---|---|---|
| `WG-HQ-WC` | WireGuard，UDP 443 | `vpnz-nft01`/`vpnz-nft02`（VIP 10.10.50.10），經 ASA PAT 至 203.0.113.2:443 | 灣仔 outside 203.0.113.5 | A = 10.10.200.1/24（隨 VIP 浮動），B = 10.10.200.5/24 |
| `WG-REMOTE-POOL` | WireGuard，UDP 443 | 同一 VIP | 員工筆記型電腦 | 10.10.200.64/26（可用 10.10.200.65–126） |
| `IPSEC-HQ-WC` | IKEv2 站對站，UDP 500/4500 | ASA `VP-HQ-FW-01` outside 198.51.100.1 | 灣仔 outside 203.0.113.5 | 選擇性傳輸，僅供 VLAN 131 |
| `IKEV2-RAS-POOL` | RRAS IKEv2 遠端存取 | `vpnz-rras01` 經 ASA PAT，UDP 500/4500 | 員工筆記型電腦 | 10.10.201.0/24，靜態位址池 10.10.201.10 – 10.10.201.200 |
| `OPENVPN-POOL` | OpenVPN TLS，UDP 1194 | `vpnz-lnxra01` 經 ASA PAT | 員工筆記型電腦 | 10.10.202.0/24，位址池 10.10.202.10 – 10.10.202.120 |
| `MGMT-TUNNEL` | WireGuard，UDP 51820 | `vpnz-nft01` | `vpnz-mon01`，僅備援路徑 | 10.10.200.200/32 與 10.10.200.201/32 |

遠端 WireGuard 位址池（`10.10.200.64/26`）刻意在同一 `/24` 內與站對站位址池分離，使原則規則僅憑前綴即可區分「一個分支閘道」與「一名在家員工」，這消除了一整類模糊不清的 ACL。位址池排除規則同樣是刻意的：**任何 VPN 位址池皆不得與 LAN 空間（`10.10.0.0/16`）、管理空間（`10.20.0.0/16`）或實驗室空間（`10.70.0.0/16`）重疊**，而 `172.16.0.0/16` 則維持為未配置的餘裕，不得用於位址池。WireGuard 對等端在設定檔中靜態定址，而非由 DHCP 提供，因為通道對等端的身分是它的金鑰，而其位址應是設定的屬性而非租約。出口配對的兩張實體 `VNET-WAN` 網卡亦在此同一 `/24` 中取得位址，且它們刻意*不是*通道位址：`vpnz-nft01` 上的 `10.10.200.2/24` 與 `vpnz-nft02` 上的 `10.10.200.3/24` 是節點自身的傳輸位址，而 `10.10.200.1/24` 則維持為隨 VIP 浮動、不屬於任何節點的 `wg0` 通道位址（Rev 1.1 裁決 C-07）。實體位址與通道位址是不同的物件，因此前綴共用而角色不共用。

`[FIGURE: 6.5 — 定址與 VLAN 規劃]` 一張階梯圖。繪一條垂直主幹標示為 `10.10.0.0/16 — HQ logical space`，並依 VLAN 遞增順序為每個總部子網路繪出水平橫桿（10；20 因來自 `10.20.0.0/16` 而偏移繪出；30；40 因是 `/23` 而繪為雙倍高度的橫桿；45；50 因是 `/28` 而繪為短橫桿；60 加斜線並標示「保留、未部署」；70 偏移至 `10.70.0.0/16`；80；90）。接續繪第二條主幹供分支區塊（110、111、112、113、120、121、130、131）使用，並繪第三條短主幹供過境區塊 `10.10.100.0/24`，將五條 `/30` 鏈路繪為小方塊。在每個橫桿旁印出子網路、VLAN 識別碼與確切名稱，以及閘道，並註明該閘道是 HSRP 虛擬位址、Keepalived VRRP 虛擬位址，還是實體介面位址——以三種不同線條樣式區分該三種情況，並附圖例。下方繪出獨立位址池，標示為 `10.10.200.0/24 WireGuard (site .1 and .5; remote .64/26)`、`10.10.201.0/24 IKEv2` 與 `10.10.202.0/24 OpenVPN`，各清楚標明位於 LAN 空間之外；另繪一個加斜線打叉的區塊標示 `172.16.0.0/16 — unallocated head-room, never used`。

*圖說：圖 6.5——完整定址規劃，以線條樣式區分虛擬位址閘道，並標明絕不得出現於設定中的未配置餘裕。*

### 6.7 路由架構

#### 6.7.1 OSPF 網域

OSPF 以單一區域 0 運行於總部與觀塘分支之間，兩者由 10.10.100.32/30 鏈路連接。採用單一區域，是因為多區域階層會增加 12 週時程無法誠實驗證的故障模式，而受評核的價值在於一個可運作、可破壞的網域，而非階層理論。核心鏈路上已啟用驗證，因此裝置若無共用密鑰即無法加入該網域。無法合法形成鄰接關係的介面——存取埠、儲存網段、隔離實驗室——皆設為被動，這抑制了無意義的 hello 流量並移除了注入面。預設路由由 `VP-HQ-EDGE-01` 上的 `default-information originate` 在邊緣產生，因此內部路由器持有的是預設路由而非供應商的表格，使內部拓撲保持精簡，並使外部不穩定性的傳播受到圍堵。Loopback 被通告，使每部路由器都有一個穩定、單一路徑的前綴。

#### 6.7.2 EIGRP 網域

EIGRP 自治系統 100 服務澳門辦事處與一段繼承的過境網段，以傳統模式運行於預設行政距離 90。報告必須說明該數值並為其提出理由，因為本設計把預設行政距離作為迴圈預防論證的一部分，而讀者若不知道這些數值就無法評估該論證。EIGRP 的常規路由偏好、由頻寬與延遲組成的複合度量及其專有範圍，是小組必須能解釋的性質；其受限的範圍是一項遷移決策，而非建議。

#### 6.7.3 eBGP 對等

Vertex Peak 是自治系統 65001。`VP-HQ-EDGE-01` 經 10.10.100.0/30 與模擬的主要供應商（AS 65000）對等，經 10.10.100.40/30 與替代供應商（AS 65002）對等，而灣仔則被建模為一個小型自治系統 65021。此工作階段刻意保持簡單，因為 Packet Tracer 的 BGP 支援僅屬基本：鄰居建立、明確的 `network` 陳述、入向前綴清單、可進行路徑附加的出向 route-map、作為安全閥的 `maximum-prefix`，以及用以選擇主要路徑的 local preference。容錯移轉藉由關閉主要工作階段並擷取路由表變化來示範。路由反射器、confederation、`add-path`、RPKI 與 BGPsec 驗證均超出該模擬器建模的範圍，一律不予宣稱。

#### 6.7.4 重新分配點與迴圈預防

**本設計中恰好有一個重新分配點，它即是 `VP-HQ-EDGE-01`。**凡在 OSPF 網域與 EIGRP 網域之間往返的一切，都僅在該處往返，別無他處。凡基線自身的敘述亦記錄 `VP-HQ-CORE-01` 上有重新分配活動之處，本章設計將 `VP-HQ-EDGE-01` 視為唯一的規範性重新分配點，並明確指出該不一致，而非默默沿用，因為在相同兩個網域之間設有兩個重新分配點的設計，正是會產生迴圈的設計。

迴圈預防立基於四項措施，每一項針對重新分配產生迴圈的特定機制。

**路由標籤。** 自 EIGRP 重新分配至 OSPF 的路由加上標籤 100，自 OSPF 重新分配至 EIGRP 的路由加上標籤 200，而每一條重新分配陳述都拒絕帶有其所進入之網域的標籤之路由。這是主要防禦：一條曾跨越邊界一次的路由無法再跨回，因為該標籤隨之行進，而接收網域拒絕再次通告它。

**前綴清單。** 明確的前綴清單列舉每個方向可被重新分配的前綴。標籤防止往返；前綴清單則在一開始就防止非預期的通告，並防止聚合路由或過境鏈路滲入另一個網域。這些清單保持狹窄——分支自身的網段、總部伺服器與使用者網段、loopback——其餘皆由清單末端的隱含拒絕所拒，而此事必須說明而非假定。

**單向、逐前綴集重新分配。** 重新分配依方向各設定一次，且每個方向使用不同的前綴集。沒有任何陳述重新分配全部內容，也沒有任何陳述在兩個方向使用相同過濾器，因為那正是路由可能以其離開路徑不同的路徑返回的地方。

**行政距離。** 本設計倚賴預設行政距離——EIGRP 內部為 90，OSPF 為 110——作為一項有意識、已述明的選擇。其後果是：當同一前綴自兩個網域學習到時，對源自 EIGRP 的前綴而言，由 EIGRP 學習到的路由勝出。維持預設值而非調整它們的理由是可稽核性：讀者可依已公佈的預設值驗證本設計，而調整過的距離則是專案特定的事實，在設定中不可見，且在故障時看似合理。

本設計亦實際演練該故障：刻意配置一次雙向、未加標籤的重新分配，在轉送表與 traceroute 中擷取所產生的迴圈，然後修復設定。一個被產生、被觀察並被修復的迴圈，比斷言標籤能防止迴圈是更強的證據，而此演練同時也是一個範疇 6 的疑難排解案例。

`[FIGURE: 6.6 — 路由網域、重新分配與迴圈預防]` 三個大型網底領域。左側是一個標示為 `OSPF area 0 — AS 65001` 的領域，內含總部核心配對與觀塘分支，以實線跨越 10.10.100.32/30 鏈路相連。右側是一個較小的領域，標示為 `EIGRP AS 100 — inherited domain`，內含澳門，以一條跨越 10.10.100.36/30 的線連接總部。在其上方是一個雲朵，標示為 `eBGP: AS 65000 (primary)` 與 `AS 65002 (alternate)`，有兩條線進入一個標示為 `VP-HQ-EDGE-01` 的單一路由器圖示，第三條線則通往一個標示為 `VP-WC-EDGE-01 AS 65021` 的小方塊。以粗線外框標示 `VP-HQ-EDGE-01` 並註明「唯一的重新分配點」。穿過該路由器繪兩支跨越邊界的粗箭頭：一支標示 `EIGRP → OSPF, tag 100, prefix-list OSPF-IN`，另一支標示 `OSPF → EIGRP, tag 200, prefix-list EIGRP-IN`；在邊界其餘各處繪一個大型圓圈加斜線，註明「不允許其他重新分配」。在角落內嵌一張小表，列出路由標籤 100 與 200 以及行政距離 90 與 110。

*圖說：圖 6.6——兩個內部路由網域、單一加標籤的重新分配點，以及四項迴圈預防措施。*

### 6.8 高可用性設計

高可用性運作於三個層級，而將它們區分開來至關重要，因為其強項各不相同。*閘道*備援使子網路在某一部第 3 層裝置失效時仍可觸達；*服務*備援使應用程式在某一部伺服器失效時仍能回應；*路徑*備援使流量在鏈路失效時仍能流通。只有前兩者作為服務被示範：路徑備援存在於模擬拓撲中，但真正的實體路徑備援不可能存在於單一 Hypervisor 主機上，而該限制已被說明而非暗示。

#### 6.8.1 交換器虛擬介面上的 HSRP

Hot Standby Router Protocol 在總部存取層提供閘道備援，該處的閘道是交換器虛擬介面。在此層使用它而非 VRRP，有一項具體且誠實的理由：**HSRP 是模擬器能可靠實作的機制**，而一項指定工具無法建模之功能的設計，會產生無法驗證的宣稱。共有四個群組運行，每個交換器虛擬介面一個——群組 1 在 VLAN 30、群組 2 在 VLAN 40、群組 3 在 VLAN 70、群組 4 在 VLAN 80——`VP-HQ-CORE-01` 以優先順序 150 並啟用搶占而處於 active，`VP-HQ-CORE-02` 以優先順序 100 處於 standby。單一群組無法服務四個 SVI，因為一個虛擬 MAC 無法代表四個子網路應答。虛擬 MAC 位址為 `0000.0c07.ac01`、`0000.0c07.ac02`、`0000.0c07.ac03` 與 `0000.0c07.ac04`，來自 HSRPv1 公式 `0000.0c07.acXX`，其中 XX 為十六進位的群組編號。

| 網段 | 子網路 | 虛擬閘道（HSRP） | Active / standby |
|---|---|---|---|
| VLAN 30 `SRV-HQ-1` | 10.10.30.0/24 | 10.10.30.254 | `VP-HQ-CORE-01` / `VP-HQ-CORE-02` |
| VLAN 40 `USER-HQ-STF` | 10.10.40.0/23 | 10.10.40.254 | `VP-HQ-CORE-01` / `VP-HQ-CORE-02` |
| VLAN 70 `STUDENT-LAB` | 10.70.0.0/24 | 10.70.0.254 | `VP-HQ-CORE-01` / `VP-HQ-CORE-02` |
| VLAN 80 `STORAGE-HQ` | 10.10.80.0/24 | 10.10.80.254 | `VP-HQ-CORE-01` / `VP-HQ-CORE-02` |

實體介面位址（10.10.30.1、10.10.40.1 等）存在於交換器虛擬介面上，且*不是*用戶端閘道。這是一條設計規則而非偏好：若用戶端被設定了實體介面位址而非虛擬位址，閘道備援會默默地毫無作用，而該故障在 active 交換器失去之前都保持不可見。容錯移轉是基於優先順序的選舉搭配搶占——active 路由器以固定 hello 間隔發出通告，standby 在 hold time 逾時而未收到 hello 後自我提升，而搶占確保預定的主要端取回 active 角色，而非讓拓撲停留在故障後的隨機狀態。因此偵測是基於計時器的，hello 間隔為數秒量級，hold time 約為其三倍；實際配置的數值必須自運行中的裝置擷取，而非憑記憶引用，而容錯移轉的舉證方式為：在介面關閉前後執行 `show standby brief`，加上一段連續 ping 顯示除轉換期間外無封包遺失。

#### 6.8.2 Keepalived VRRP 實例

凡閘道是 Linux 虛擬機器而非交換器之處，Keepalived 以不同的協定實作提供相同功能，而本設計包含**兩組**此類配對。每一組皆由 `/etc/keepalived/keepalived.conf` 中的一個 `vrrp_instance` 區塊定義，載有 `state`、`priority`、`virtual_router_id`、`virtual_ipaddress`、`preempt` 與一個 `track_script`。

| 實例 | 主機 | 子網路 | `virtual_router_id` | 虛擬位址 | 優先順序 |
|---|---|---|---|---|---|
| nftables 出口配對 | `vpnz-nft01` / `vpnz-nft02` | 10.10.50.0/28 | **51** | 10.10.50.10 | 150 master / 100 backup |
| Nginx 代理配對 | `vpnz-dmzrev01` / `vpnz-dmzrev02` | 10.10.90.0/24 | **61** | 10.10.90.10 | 150 master / 100 backup |

有三項細節承載架構論證。第一，**兩個虛擬路由器識別碼不同**（51 與 61），因為在兩個可能曾被連接的網段上重複使用同一識別碼，會產生兩個 master 與位址重複的狀況——一種易於意外造成而難以診斷的故障。第二，兩個實例皆啟用搶占，使預定的主要端永遠取回該角色。第三，也最重要的是，`track_script` 健康檢查測試的是*服務*而非介面：Nginx 配對會 curl 一個本機健康端點，而 nftables 配對則驗證規則集非空。一個只追蹤自身網路介面的 VRRP 實例，會在背後的服務已死時仍愉快地保留虛擬位址，這使一項備援機制變成停機放大器。Nginx 實例亦透過 `/etc/nginx/ssl/` 擁有已發佈的 TLS 材料，而由於虛擬位址隨該實例移動，憑證必須對虛擬*名稱*有效而非對任一主機名稱有效——這也是內部 PKI 簽發一張涵蓋服務名稱與兩位成員之憑證的原因。

容錯移轉即是 VRRP 機制：master 以固定間隔發出通告；漏收通告超過 master-down 間隔的 backup 會自我提升並不請自來地宣告該虛擬位址；無償 ARP 更新鄰居映射，使流量在一個廣播網域內跟隨該位址。因此偵測是二維的——通告逾時*或* track script 失敗皆可觸發轉換——這正是由健康檢查驅動的機制相對於任何基於路由或 DNS 之方案所具的優勢。每組配對所需的證據是一次被擷取的轉換：停止 master、觀察到虛擬位址移轉、觀察到服務持續應答，並保留 `keepalived` 日誌。兩組配對都在單一廣播網域內移動，因此沒有 VRRP-over-tunnel 的注意事項適用。有一項簡化必須明確說明：這些實例使用 `auth_type PASS`，這在僅主機實驗室網段內可接受，且**必須被描述為實驗室簡化，而非最佳實務**。

#### 6.8.3 未予宣稱之事項

有三項宣稱刻意保留。**沒有** ASA 容錯移轉配對，因為 Packet Tracer 不建模設備之間的狀態複寫，因此周邊是單一邏輯裝置，而那是本設計的一項可用性限制。**沒有**硬體層級的高可用性——沒有跨實體機箱的鏈路聚合、沒有雙電源供應、沒有雙站點儲存複寫——因為不存在任何實體硬體。而 Hypervisor 主機本身是萬物的單一故障點，這是本環境最大的可用性暴露，應歸於風險章節，而非腳註。

`[FIGURE: 6.7 — 備援與容錯移轉機制]` 三個水平帶狀區域。在上帶，繪兩個交換器圖示標示為 `VP-HQ-CORE-01 (active, priority 150)` 與 `VP-HQ-CORE-02 (standby, priority 100)`，以一條幹道相連，各自向下連接至四個虛擬閘道形狀，標示為 `HSRP group 1 — 0000.0c07.ac01 — VIP 10.10.30.254 (VLAN 30)`、`HSRP group 2 — 0000.0c07.ac02 — VIP 10.10.40.254 (VLAN 40)`、`HSRP group 3 — 0000.0c07.ac03 — VIP 10.70.0.254 (VLAN 70)` 與 `HSRP group 4 — 0000.0c07.ac04 — VIP 10.10.80.254 (VLAN 80)`，下方列出四個 VLAN，並以小型工作站圖示觸達虛擬閘道。在中帶，繪兩組伺服器圖示——`vpnz-nft01`/`vpnz-nft02` 搭配一個共用的菱形標示 `VRRP VRID 51 — 10.10.50.10`，以及 `vpnz-dmzrev01`/`vpnz-dmzrev02` 搭配一個共用的菱形標示 `VRRP VRID 61 — 10.10.90.10`——為每個菱形註明 `track_script: service health`，並自每組配對繪一支箭頭至一個小型時鐘，註明 `advert interval / master-down interval`。在下帶，繪一個單一圖示標示為 `vpnz-hvhost01`，具粗重警告外框並註明「單一故障點——本設計中無硬體或 Hypervisor 備援」，另繪一個打叉圖示標示為 `ASA failover pair — not modelled in Packet Tracer`。

*圖說：圖 6.7——三個備援層級：交換器虛擬介面上的 HSRP、兩個各自獨立的 Keepalived VRRP 實例，以及對何者不具備備援的誠實陳述。*

### 6.9 安全架構

#### 6.9.1 防火牆層

在自內部網路通往網際網路的路徑上，有兩個串聯的強制執行層，且它們刻意採用不同的實作。

**第一層**是位於 VLAN 50 上、以直列方式置於總部核心與 ASA inside 介面之間的 nftables 配對（`vpnz-nft01`、`vpnz-nft02`）。它是出口咽喉點：具預設丟棄原則的具狀態轉送、面向廣域介面上的 NAT（masquerade）、為信任區對等群組而設的具名集合（使原則以群組而非冗長位址清單表達）、連線限制，以及每條丟棄規則上的記錄前綴（使一次拒絕即產生一件產物）。其規則集是單一原子式產物——`/etc/nftables.conf` 中的 `table inet fyp_filter` 加上納入的片段——這正是使變更可審查且可逆的原因；透過一個會啟動回滾計時器的腳本來套用它，則防止了典型的遠端防火牆鎖定。

**第二層**是 ASA（`VP-HQ-FW-01`），它掌管該配對並不掌管的那道信任邊界：DMZ。它套用 outside 0、dmz 50 與 inside 100 的安全層級；為伺服器、DMZ、管理、使用者、遠端存取與實驗室網路設定物件群組；為 inside 對 outside 流量使用動態 PAT，為已發佈的 DMZ 服務使用靜態 NAT；對在承載內容中攜帶位址的協定進行應用程式檢查；以及向監控主機發送資訊層級的 syslog。它亦終止通往灣仔的站對站 IPsec 通道。已宣告的限制：Packet Tracer 的 ASA 是精簡化的舊式 ASA 模型，因此 FirePOWER/SFR、叢集、容錯移轉配對、`shun` 以及許多低階丟棄量測機制均付之闕如，且**絕不得宣稱**。

分工是刻意的。該配對看見*離開企業的一切*，是逐區域出口原則、歸屬與記錄所在之處；ASA 看見*跨越 DMZ 與網際網路邊緣的一切*，是發佈、轉譯與站對站通道所在之處。一個自工作站送往 Web 伺服器的封包會經過兩者，而以一種語言犯下的規則錯誤不太可能在另一種語言中被複製。這個雙層位置是縱深防禦原則的具體實作，也是該配對被繪為直列而非位於 ASA 之旁的原因。

#### 6.9.2 DMZ 設計

DMZ 的定義性規則是：它不得對內部網路發起任何協定的任何動作。其餘每一項決策都由此而來。

入向方面，僅已發佈的位址可被觸達，且每個位址各對應恰好一項服務：代理位址對應 Nginx 虛擬位址、應用程式位址對應 Windows 層、內容位址對應 WordPress 節點，而通道位址則保留給遠端存取埠。沒有任何 DMZ 主機可自網際網路以任何其他埠直接觸達，而 DMZ 中除了在已發佈路徑上之外，任何事物都完全無法被觸達。代理終止 TLS 並向其上游客戶重新加密，因此即使 DMZ 不受信任，DMZ 內部的流量仍是加密的；HSTS 已啟用；最低協定版本為 TLS 1.2，並優先使用 1.3；而加密套件協商以 `openssl s_client` 擷取作為證據，而非僅以斷言提出。

出向方面，僅代理與 Windows 應用節點可觸達網際網路，且僅限埠 443、僅限由內部發起，且僅限於名稱解析與套件取得；內容層未被授予此權限。此不對稱值得說明：來自遭攻陷 Web 主機的出向路徑是標準的資料外洩路線，而將其限制為兩部具名主機與一個獲准埠，是一項可透過自不應擁有該權限的主機嘗試相同連線來測試的控制。

DMZ 的管理僅可經由 `vpnz-dmzjump01`（10.10.90.27），而該主機本身僅可自管理區觸達。沒有任何自工作站通往 DMZ 主機的直接管理路徑，也沒有任何 DMZ 主機接受來自其他任何位置的管理登入，這使跳板主機成為刻意的瓶頸，其日誌顯示在 DMZ 內所採取的每一項管理動作。

有一項未定決策被記錄而非假定：DMZ 主機是加入網域，或隔離於工作群組中。加入網域可簡化管理與憑證散佈，但意味著遭攻陷的 DMZ 主機會快取網域憑證；將其隔離則以第二組帳戶與憑證管理路徑為代價，移除該暴露。無論採何決定，其決定與理由都必須記錄，且無論如何都存在一個供 DMZ 伺服器使用的專用群組原則物件，因此最低基線——不允許網域管理員登入、限制登入權限、分離的本機帳戶——在兩種情況下皆適用。

#### 6.9.3 憑證式驗證與內部 PKI

單一憑證鏈服務整個環境，而這正是重點：簽發給 Linux 主機的憑證在 Windows 上受信任，反之亦然，因此沒有任何元件必須信任該鏈以外所簽發之物。`VP-ROOT-CA` 是離線根，而 `VP-ISSUING-CA-01` 是線上簽發授權單位。

| 憑證 | 主體一般名稱 | 用途 |
|---|---|---|
| 簽發 CA | `CN=VP-ISSUING-CA-01, DC=vertexpeak, DC=fyp, DC=lab` | 簽發本設計中的所有其他憑證 |
| 網域控制站 | `CN=vpnz-dc01.vertexpeak.fyp.lab` | LDAPS 與網域控制站身分識別，並具供主機名稱、短名稱與網域名稱使用的 DNS SAN |
| RRAS IKEv2 伺服器 | `CN=vpn.vertexpeak.fyp.lab` | VPN 前門，使用戶端驗證的是服務名稱而非主機 |
| IIS Web 層 | `CN=www.vertexpeak.example` | 已發佈的應用層，並具公眾與內部名稱作為 SAN |
| 反向代理（公眾） | `CN=portal.vertexpeak.example` | 已發佈的入口網站，對公眾與內部名稱有效 |
| WordPress（公眾） | `CN=blog.vertexpeak.example` | 已發佈的內容前端 |
| WireGuard 管理 | `CN=vpnz-nft01.vertexpeak.fyp.lab` | 管理通道身分識別，並以 `wg.vertexpeak.fyp.lab` 作為 SAN |
| ASA 身分識別 | `CN=VP-HQ-FW-01.vertexpeak.fyp.lab` | 防火牆自身的 IPsec 通道身分識別 |
| OpenVPN 伺服器與用戶端 | `CN=server-vpnz-lnxra01`、`CN=client-{staffid}` | 由 Linux 端的 Easy-RSA 簽發；OpenVPN 以一般名稱為其身分識別 |

若小組在建置期間斷定兩層式 PKI 的營運量超出四人在十二週內所能負擔，文件所載的備用方案是單層式、由 `vpnz-dc01` 直接簽發，而報告必須說明實際使用哪一種模式，而非描述預定的那一種。有效期限是設計參數而非預設值：根授權單位為二十年、簽發授權單位為十年，而任何內部 TLS 憑證最長 397 天、以九十天為偏好，並透過已記錄的演練進行續期。在交付的設計中不出現任何自簽憑證，除了在已記錄的建置步驟期間，且該憑證後來會被取代。公眾名稱的憑證來自內部 PKI，因此實驗室必須展示並解釋名稱不符的警告；該警告在此是預期行為且必須如此呈現，因為**並未使用任何真實的公眾憑證授權單位，也未宣稱使用任何一個**。

有兩項性質應以安全性質而非設定的身分陳述。撤銷已實際演練：本設計會重新產生憑證撤銷清單，並展示遭撤銷的 OpenVPN 用戶端無法連線，因為一項從未被演練的撤銷機制不算是一項控制。而 Linux 端的私鑰處理是明確的：Easy-RSA PKI 目錄的權限模式為 0700、持有私鑰，並列於絕不可提交至版本控制的路徑清單之上。

#### 6.9.4 管理平面保護

管理平面是限制最高的區域，並由四項各自獨立的措施保護。它以**獨立位址定址**，位於 `10.20.0.0/16` 與 VLAN 20，因此要暴露它需要一次刻意的路由動作而非意外。它**僅可自其自身觸達**：管理協定——SSH、RDP、WinRM、Windows Admin Center 閘道、SNMPv3 與 syslog——獲准自 `Z-MGMT` 通往每個區域，而自每個區域回到 `Z-MGMT` 則僅限 syslog 與 SNMPv3。它**對遠端使用者關閉**：`Z-REMOTE` 對 `Z-MGMT` 一律拒絕，因此一部員工筆記型電腦上有效的憑證與認證資料仍不賦予任何管理觸達權。而它**不信任帶內便利**：工作階段使用 SSH 與 RDP 搭配具名的個人帳戶，Linux 上設定 `PermitRootLogin no` 並停用密碼驗證，而 SNMPv2c 與 community string 在所有地方皆被禁止，改用處於驗證與特權模式的 SNMPv3。

另有兩項控制封閉了最常見的管理平面失效。隔離實驗室網段完全無法觸達管理平面，分支基礎架構亦然——`Z-WAN` 對 `Z-MGMT` 一律拒絕，因此分支路由器無法被用作進入總部管理的跳板。而自動化管理路徑受憑證範圍限制：代理的唯讀帳戶與自動化服務帳戶僅持有其職能所需的最低授權，因此自動化路徑遭攻陷不會取得 Domain Admin。

#### 6.9.5 記錄與監控管線

每一層都產生日誌，而每一份日誌都有其目的地。Linux 主機透過專用的 `rsyslog` 設定以 UDP 514 轉送至監控主機；ASA 以資訊層級向同一主機發送 syslog；Cisco 裝置在模擬拓撲內亦如此；而 Windows 主機在本機保留事件日誌以供代理唯讀取用，並透過專用原則物件啟用進階稽核子類別——登入、登入失敗、帳戶鎖定、帳戶建立、群組成員資格變更、服務安裝。nftables 配對以一個前綴記錄每一次拒絕，這把信任邊界矩陣從一份文件轉化為一串事件。此管線終止於 `vpnz-mon01` 上的監控堆疊，日誌在此被儲存、索引並可供搜尋，而供給分診工作流程的告警規則也在此以受版本控制的檔案形式存在，而非儀表板設定。

日誌儲存是設計考量而非副產品。監控主機保留日誌與度量於一段有界期間，而該界線已被說明：此保留期足以供專案驗證與示範之用，且**並非**合規等級的封存，因為本設計僅與選定控制對齊，並未通過任何框架的認證。

`[FIGURE: 6.8 — 安全架構與記錄管線]` 兩個在中央相接的面板。左面板是兩個防火牆層的垂直堆疊：頂部是一個盾牌標示為 `VP-HQ-FW-01 — ASA 5506-X, ASA 9.16(4) — security levels outside 0 / dmz 50 / inside 100`，並註明 `object groups OBJ-NET-SRV | OBJ-NET-DMZ | OBJ-NET-MGMT | OBJ-NET-USER | OBJ-NET-VPN | OBJ-NET-LAB`、`static NAT for published services`、`dynamic PAT for inside-out`、`inspection`、`syslog → vpnz-mon01`；其下是一組雙主機配對標示為 `vpnz-nft01 / vpnz-nft02 — table inet fyp_filter — forward policy drop — masquerade — log prefix "NFT-DROP: "`，並註明 `VRID 51 VIP 10.10.50.10`、`the only egress path`、`atomic apply with rollback timer`。將封包繪為小型箭頭，自配對底部進入並自 ASA 頂部離開，註明「每個封包都經過兩層」。右面板是 PKI 與身分識別鏈：`VP-ROOT-CA (offline)` → `VP-ISSUING-CA-01 (online, vpnz-dc01)` → 一扇葉憑證，標示上表的一般名稱；另有一條平行分支標示為 `Easy-RSA on vpnz-lnxra01 (OpenSSL primitives)`，簽發 `server-vpnz-lnxra01` 與 `client-{staffid}`，並以一條虛線連接兩條分支，註明「同一信任錨以群組原則部署至 Windows，並以 update-ca-certificates 部署至 Linux」。橫貫底部是一條水平管線：`all Linux guests + Cisco devices + ASA → rsyslog / syslog 514/udp → vpnz-mon01 (Loki, Prometheus) → Grafana dashboards fyp-overview, fyp-security, fyp-availability → Alertmanager → vpnz-ai01 (read-only triage) → human approval`，並在最後一支箭頭上繪一個小掛鎖，標示「僅建議——無寫入路徑」。

*圖說：圖 6.8——兩個防火牆層、單一憑證鏈，以及終止於唯讀代理分診步驟的記錄管線。*

### 6.10 儲存架構

#### 6.10.1 iSCSI 目標與發起端設計

儲存層展示了獨立於任何單一主機本機磁碟的區塊儲存，以及最小權限的儲存存取模型。目標是儲存網段上的 `vpnz-san01`——VLAN 80、`STORAGE-HQ` 10.10.80.0/24 中的 10.10.80.21——運行 Windows Server iSCSI Target Server 角色。共發佈三個目標，分別為 20 GB、40 GB 與 60 GB。其目標 IQN 是**由 Microsoft 的 iSCSI Target Server 自伺服器自身的 IQN 加上目標名稱衍生而來，且無法設定**，因此它們讀作 `iqn.1991-05.com.microsoft:vpnz-san01-storage-lun01.target`、`…-lun02.target` 與 `…-lun03.target`，並以 `Get-IscsiServerTarget` 擷取。因此本專案的標準字串 `iqn.2026-01.lab.fyp.vertexpeak:storage-lun0N` 命名的是**發起端**端點——即 `vpnz-dmzweba01` 上的發起端——而非目標（Rev 1.1 裁決 C-06）。第一個承載 Web 層資料，第二個是 Windows Server Backup 寫入的備份暫存磁碟區，第三個為精簡配置並刻意保持未使用，因此本設計展示了建立 LUN 而未假裝它已在生產中使用。

有三項性質比 LUN 大小更重要。**網路隔離**：儲存網段不路由至核心以外，因此 iSCSI 工作階段不可能自工作站、分支或 DMZ 發起——儲存流量不僅被過濾，而是自任何不應使用它的位置皆不可路由。**發起端身分識別**：存取控制在目標端由合格名稱的發起端允許清單與每個發起端一組 CHAP 密鑰強制執行，並在時間允許時加入雙向 CHAP；這把存取綁定於一項*主機身分宣告*而非使用者帳戶，因此僅竊取使用者的認證資料並不能轉移它。以及**誠實的界線**：單一路徑、無 MPIO，且不宣稱 Windows 容錯移轉叢集、Scale-Out File Server 或 Storage Spaces Direct，因為單一 Hypervisor 主機無法提供真正獨立的第二條儲存路徑，而任何叢集化宣稱都將無法驗證。

#### 6.10.2 檔案服務設計

檔案服務由 VLAN 30 上 10.10.30.21 的 `vpnz-fs01` 提供，在 `D:\Shares\` 之下服務四個受管理的共用——`Finance`（配額 20 GB）、`Engineering`（10 GB）、`SalesRO`（10 GB）與 `Public`（5 GB）——並套用檔案畫面 `*.exe;*.vbs;*.mp3` 及產生使用證據的儲存報告排程。存取經由 SMB 3.1.1，而權限模型如同各處一樣為兩層：共用權限與 NTFS 權限設定存取邊界，而一對一映射至各共用的網域本機群組（`DL-{Share}-{RW|RO}`，成員取自 `GG-Finance-RW`、`GG-Finance-RO`、`GG-Engineering-RW` 與 `GG-Sales-RO`）承載授權。磁碟機代號以原則搭配項目層級目標設定來交付，因此財務使用者看到 `F:`，工程使用者看到 `G:`，而該映射是群組成員資格的屬性而非手動步驟。

營運限制被記錄為設計事實而非遺漏。已為分支設定所需材料的本機快取副本，但這是**設定與證據**的安排，而非站點層級資料複寫的示範。備份路徑是將 Windows Server Backup 寫入第二個 LUN，加上透過 Linux 端備份工作對設定與證據進行已記錄的異機副本；本設計明確聲明這不是完整的虛擬機器或 Hypervisor 層級備份，因為此處不存在該等授權，而宣稱其一即為關於能力的虛假宣稱。快照在變更期間使用，絕不用作備份。而檔案層不儲存任何真實客戶資料：情境中的 260 名經紀客戶與 14,000 個終端使用者席位屬於敘述背景，而本專案的非目標直接禁止真實客戶資料。

`[FIGURE: 6.9 — 儲存與檔案服務架構]` 一張由左至右的圖。左側是一個方塊標示為 `Z-SERVER — VLAN 30 10.10.30.0/24`，內含 `vpnz-dmzweba01` 與 `vpnz-dmzweba02` 的圖示，標示為「平台層發起端」，以及 `vpnz-fs01`，標示為「檔案伺服器、FSRM」。中央是一道粗雙線外框標示儲存邊界，註明 `VLAN 80 STORAGE-HQ 10.10.80.0/24 — no routing beyond the core — gateway 10.10.80.254 (HSRP VIP)`，內含一個大型目標圖示標示為 `vpnz-san01 10.10.80.21 — iSCSI Target Server`，其中有三個磁碟形狀標示為 `LUN01 20 GB — web-tier data`、`LUN02 40 GB — backup staging` 與 `LUN03 60 GB thin — created, unused`。自發起端方塊穿過邊界繪一支實線箭頭至目標，註明 `TCP 3260 — CHAP one-way — initiator IQN allow-list`；並自邊界外的一個工作站圖示繪第二支虛線劃掉的箭頭，註明「DENY——儲存網段無法自 Z-USER 路由」。右側是檔案服務的子面板：`vpnz-fs01` 搭配四個共用方塊 `\\vpnz-fs01\Shares\Finance`（20 GB 配額）、`\Engineering`（10 GB）、`\SalesRO`（10 GB）與 `\Public`（5 GB），各註明檔案畫面 `*.exe;*.vbs;*.mp3` 與持有授權的群組，另加一個小型圖示標示為 `DL-{Share}-{RW|RO}`。

*圖說：圖 6.9——位於隔離、不可路由網段上、具發起端身分識別存取控制的區塊儲存，並列兩層式 SMB 與 FSRM 檔案服務模型。*

### 6.11 身分識別與存取架構

身分識別設計是一個樹系、一個網域與一個樹狀結構——`vertexpeak.fyp.lab`，NetBIOS `VERTEXPEAK`，Kerberos 領域 `VERTEXPEAK.FYP.LAB`，功能層級 Windows Server 2025，單一使用者主體名稱後綴。兩部可寫入的網域控制站服務總部，一部唯讀網域控制站服務觀塘。全部五個 Flexible Single Master Operations 角色最初皆由 `vpnz-dc01` 持有，而將 PDC 模擬器角色轉移至 `vpnz-dc02` 是一項已記錄的災難復原演練，而非例行工作。

組織結構是單一 `OU=VertexPeak` 樹，依職能與站點分隔：使用者在 `OU=Users` 之下，然後依站點與部門；電腦在 `OU=Computers` 之下分入 `OU=MemberServers`、`OU=Tier0-DomainControllers`、`OU=DMZ-Servers`、`OU=Workstations` 與 `OU=LinuxServers`；群組在 `OU=Groups` 之下；服務帳戶在 `OU=ServiceAccounts` 之下；管理員在 `OU=Admins` 之下，並分為 `OU=Tier0`、`OU=Tier1` 與 `OU=BreakGlass`；文件物件在 `OU=Network` 之下；以及 `OU=Quarantine` 搭配 `OU=Disabled` 與 `OU=NewObjects`，供等待處置的物件使用。預設的 `CN=Users` 與 `CN=Computers` 容器由唯讀控制站使用，且不供其他任何事物使用；而在建置被視為完成之前，每一個使用者與電腦物件都必須位於該樹中——這本身即是一個可測試的條件。

權限是委派而非整批授予。服務台群組僅在 `OU=Users` 上獲得密碼重設與帳戶控制寫入權限。伺服器管理員透過群組原則的限制群組或受管理本機管理員密碼解決方案，取得成員伺服器上的本機管理權，**而非**透過 Domain Admins。僅兩位 Tier-0 管理員可向網域控制站或憑證授權單位進行驗證。而站台感知已設定，使定址規劃中的每個子網路恰好映射至一個 Active Directory 站台（`HQ-ShaTin`、`BR-KunTong`、`WC-WanChai`、`MO-Macau`），且沒有子網路未映射，因為一個未映射的子網路意味著用戶端向一個它不該選擇的控制站進行驗證。

**Linux 資產如何取用身分識別。** 本設計要求相同的四位具名管理員在兩個平台上皆能驗證，且無論 Linux 主機是否加入網域，結果完全相同，並接受兩種實作。在本機模型中，`gg-infra-admins` 是一個本機群組，其成員與 `GG-Infra-Admins` 一致，四個個人帳戶以相同名稱在本機建立。在加入網域的模型中，`realmd` 與 `sssd` 將主機加入 `vertexpeak.fyp.lab`，而該本機群組成為解析至相同成員的映射群組。兩種情況下，管理員都以個人帳戶名稱登入，絕不以 `root` 登入；SSH 金鑰為 Ed25519、每位管理員一把，公鑰存於 Ansible 儲存庫，而私鑰從不儲存於控制節點上；且 `PermitRootLogin no` 在所有地方皆為強制。在 Windows 一側，相同管理員擁有網域帳戶，而個人帳戶與服務帳戶保持分離；服務帳戶僅為自動化而存在，且除了其職能所需的單一群組外，不屬於任何特權群組。

恰好有一條身分識別路徑跨越進入 DMZ，且刻意狹窄。內容層以 `svc_ldapbind` 繫結至目錄，該帳戶是 `GG-DMZ-LDAP-Readers` 的成員且別無其他，並使用埠 636 上的 LDAPS。目錄僅可自 DMZ 以 LDAP 與 LDAPS 觸達，且僅限該帳戶。這是本設計中最敏感的跨邊界相依，因為它是不受信任區域讀取受信任區域的唯一之處，因此它被限制於單一帳戶、單一協定對與單一讀取操作。

有一項身分識別風險是固有的，並被陳述而非以緩解措施化解：總部的網域控制站與憑證授權單位是 Tier-0 資產，而該授權單位是根本性的，因為攻陷簽發授權單位可讓攻擊者鑄造每一個元件都會信任的憑證。這也是根授權單位離線，以及 Tier-0 權限僅限於兩位具名人員的原因。

`[FIGURE: 6.10 — 身分識別與存取架構]` 一張分層圖。頂部是一個圓角方塊標示為 `vertexpeak.fyp.lab — NetBIOS VERTEXPEAK — single forest, single domain, functional level Windows Server 2025`，其下有三個圖示：`vpnz-dc01 10.10.30.11 (FSMO: Schema, Domain Naming, RID, PDC, Infrastructure; DNS; AD CS; NTP source)`、`vpnz-dc02 10.10.30.12 (DNS; DHCP 80/20 partner; Global Catalog)` 與 `vpnz-brdc01 10.10.113.11 (RODC; DNS; DHCP relay)`，以一支雙向箭頭相連並標註 `replication — site link HQ-ShaTin ↔ BR-KwunTong, 15-minute interval`。向下將組織單位樹繪為縮排的區塊圖，與實際結構相符（`OU=Users` 含站點與部門子項；`OU=Computers` 含 `MemberServers`、`Tier0-DomainControllers`、`DMZ-Servers`、`Workstations` 與 `LinuxServers`；`OU=Groups`；`OU=ServiceAccounts`；`OU=Admins` 含 `Tier0`、`Tier1` 與 `BreakGlass`；`OU=Network`；`OU=Quarantine`）。左側是一列取用端方塊，其箭頭以協定與埠註明：`Windows guests → Kerberos 88, LDAP 389, LDAPS 636, SMB 445, DNS 53`；`Linux guests → DNS 53 to 10.10.30.11 then 10.10.30.12 only; SSSD/realmd if joined, local group gg-infra-admins otherwise`；`vpnz-rras01/NPS → RADIUS 1812/1813 to authorise GG-VPN-Users`；`DMZ content tier → LDAPS 636 as svc_ldapbind only`（將此箭頭繪為細虛線，以標示其為唯一的跨邊界身分識別路徑）；以及 `vpnz-mon01 → WinRM 5986 as svc_ansible`。橫貫底部是一張小表，列出服務帳戶及各自所屬的單一群組。

*圖說：圖 6.10——一個樹系、一個網域與組織單位結構，並附各取用端解析身分識別所用的協定與埠。*

### 6.12 自動化架構

#### 6.12.1 控制節點

恰好有一個自動化控制節點：VLAN 30 上 10.10.30.31 的 `vpnz-mon01`，運行 Ubuntu Server 24.04.3 LTS。它運行 Ansible 控制節點、Git 伺服器、監控與記錄堆疊、網路裝置設定保存庫，以及 Linux 端時間來源。任何 playbook 都不曾自學生的筆記型電腦執行，理由在於證據而非風格：自一部未釘定版本的筆記型電腦執行所產生日誌無法重現，而本專案的核心自動化宣稱正是可重現性。

| 元件 | 版本 | 角色 |
|---|---|---|
| `ansible-core` | 2.18.x 搭配 community 套件 11.x | 供 Linux 與 Windows 目標使用的設定管理 |
| `pywinrm` | 0.5.0 | 供 Windows 目標使用的 WinRM 傳輸 |
| PowerShell（在 Windows 目標上） | 內建 Windows PowerShell 5.1；`vpnz-jump01` 上使用 PowerShell 7.4 LTS 進行撰寫 | playbook 與腳本所驅動的原生 Windows 管理介面 |
| Git | 2.43 或更新 | 版本控制，搭配裸儲存庫或經由 SSH 的精簡 Web 前端 |
| Prometheus、Grafana、Loki | 2.5x、11.x、3.x | 度量、儀表板與日誌聚合 |
| `node_exporter`、`windows_exporter` | 1.8.x、0.29.x | 自 Linux 與 Windows 目標取得主機度量 |

#### 6.12.2 Inventory 模型

Inventory 是單一檔案 `inventory/lab.ini`，具六個群組——`linux_servers`、`windows_servers`、`dmz`、`network_devices`、`ai`、`mgmt`——而群組變數位於 `group_vars/`：`all.yml` 供所有事物共用的值（網域名稱、時間伺服器、解析器、管理群組），以及 `windows_servers.yml`、`linux_servers.yml` 與 `dmz.yml`。此群組結構既是組織模型也是安全模型，因為 `dmz` 之所以是獨立群組，正是為了使任何 playbook 都無法意外地把伺服器基線套用至 DMZ 主機，而必須僅在 DMZ 中運行的任務則必須明確指名該群組。

此模型有三項性質要緊。值只宣告一次：網域名稱、解析器對與時間來源出現於 `all.yml` 而別無他處，因此更換解析器是一行變更，並具可審查的差異。主機依*角色*而非依名稱分組，因此新增第二部代理是編輯 inventory 而非編輯 playbook。而 `network_devices` 群組即使無法觸達仍被宣告，因為宣告它使該落差在設定中可見而非隱藏於文字敘述中：該群組存在、其成員已記錄，而原本會設定它們的 playbook 已撰寫並針對設定檔而非針對裝置受測。

#### 6.12.3 Playbook 結構

九個 playbook、七個角色與一組 Jinja2 範本構成 `C:\FYP\04-automation\ansible\` 之下的自動化介面。

| Playbook | 用途 | 目標 |
|---|---|---|
| `01-baseline-windows.yml` | Windows 客體的基礎設定：名稱、定址、使用內部 CA 憑證的 WinRM、時間、稽核原則 | `windows_servers` |
| `02-baseline-linux.yml` | Linux 客體的基礎設定：定址、時間、強化、`rsyslog` 轉送、exporter | `linux_servers` |
| `03-nginx-reverseproxy.yml` | Nginx 設定、上游伺服器池、TLS 材料放置、虛擬主機 | `dmz` |
| `04-keepalived.yml` | VRRP 實例、優先順序、虛擬位址與健康檢查腳本 | `dmz`，以及出口配對 |
| `05-nftables-egress.yml` | 原子式規則集、集合、NAT、連線限制與記錄，搭配回滾防護套用 | 出口配對 |
| `06-wireguard.yml` | 介面設定、對等端定址與允許的前綴 | 出口配對，以及分支對等端 |
| `07-ad-users.yml` | 目錄中的使用者、群組與組織單位佈建 | 網域控制站，經由 Tier-1 範圍的路徑 |
| `08-collect-network-configs.yml` | 將設定與證據收集至保存庫 | Linux 與 Windows 資產，模擬裝置設定則視為受版本控制的檔案 |
| `09-verify-services.yml` | 服務矩陣的驗證：把連接埠矩陣化為可執行檢查 | 所有群組 |

角色為 `common`、`nginx`、`keepalived`、`nftables`、`wireguard`、`winrm` 與 `ad_users`。範本為 Jinja2——`nftables.conf.j2`、`keepalived.conf.j2`、`wg0.conf.j2`——因此兩部主機之間的設定差異以變數表達，而非以分歧的檔案表達。每個 playbook 都支援檢查模式，而本設計要求在套用前先執行一次檢查模式，套用後再實際執行第二次，並將第二次執行的零變更結果擷取為冪等性的證據。

**落差分析**被寫入設計之中，而非留給讀者推斷。Ansible 無法觸達 Packet Tracer 裝置，因為該模擬器不暴露可觸達的 SSH 伺服器，也沒有 API。因此網路裝置自動化以雙軌運行。軌道 A 把 `03-build/packet-tracer/configs/*.txt`——確切的預定裝置設定——視為真實來源，透過模擬器自身的介面套用它們，並記錄真實裝置將需要的自動化步驟。軌道 B 針對 Linux 與 Windows 資產、並針對作為受版本控制檔案的裝置設定，撰寫並測試收集與備份機制。報告必須明確說明：**沒有任何 playbook 曾經登入 Packet Tracer 裝置**，並且必須指名真實設備的替代方案——例如以 SSH 為基礎的網路自動化函式庫 Netmiko 或 NAPALM——作為在實體硬體上封閉此落差所需的步驟。

#### 6.12.4 憑證處理

憑證從不出現於 playbook、變數檔或日誌中。Windows 自動化以 `svc_ansible` 進行驗證，該帳戶是 `GG-WINRM-Admins` 的成員且別無其他，經由連接埠 5986 上使用 HTTPS 的 WinRM，並使用由內部授權單位簽發的憑證，其密碼由自動化輪替而非豁免到期。Linux 自動化以 Ed25519 金鑰驗證，其公鑰部分存於儲存庫的 `files/ssh/authorized_keys/` 之下，私鑰部分則從不儲存於控制節點上。任何儲存的機密都存於 Ansible Vault，其單一 vault 密碼由小組持有且不提交。WireGuard 私鑰依對等端產生、從不提交，而其設定檔既為權限模式 0600，也列於 `.gitignore` 之中，與 `*.key`、`*.pem`、`*.pfx` 及 Easy-RSA 的 `pki/` 目錄並列。

這些控制經過驗證而非假定。全儲存庫的憑證掃描在每次標籤發佈前執行並保留其輸出，其中包含一項刻意測試：提交一把假金鑰，且要求掃描必須攔截它，因為一個從未響過的警報不是可用的警報。服務帳戶都有文件記錄，其輪替的隨機密碼存於小組的密碼管理器，已啟用密碼到期且停用自助變更，並在報告中以名稱與群組成員資格列出，使最小權限的宣稱可被稽核而非僅被相信。

#### 6.12.5 Git 工作流程

所有自動化、設定範本、裝置設定文字與驗證記錄都存於控制節點上的 Git 儲存庫，並鏡像至第二個媒介，使任何單一成員都不是任何產物的唯一持有者。工作流程為每任務一分支：變更在分支上進行、由第二位成員審查、合併，並以標籤發佈（`v0.1` 至 `v1.0`）。審查既記錄於會議紀錄，也記錄於提交歷史，因為客戶的盡職審查項目所要求的是經審查之變更的*流程*，而不只是能支持該流程的工具。每一次執行都將附時間戳的日誌寫入 `04-automation/runs/`，而這些日誌會被提交，使驗證章節能以檔名引用它們。

有一條界線必須說明，因為該標準提及此概念，而很容易過度宣稱。`Continuous integration and continuous delivery\deployment pipelines concepts` 是範疇 5 的**知／懂**條文。本專案記錄此概念並運行 Git 的審查與標籤工作流程，但**不建置任何管線**——沒有建置伺服器、沒有自動化測試閘門、也沒有產物晉升——而報告必須正是如此說明，而不得把 CI/CD 列於已交付功能之中。

`[FIGURE: 6.11 — 自動化架構與 Git 工作流程]` 一張具三個水平帶狀區域的圖。頂帶是控制平面：一個單一圓角方塊標示為 `vpnz-mon01 10.10.30.31 — Ubuntu Server 24.04.3 LTS — the only control node`，內含標示的子方塊：`ansible-core 2.18.x + community 11.x`、`pywinrm 0.5.0`、`Ansible Vault`、`Git 2.43+ (bare repositories)`、`Prometheus / Grafana / Loki` 與 `TFTP/SCP configuration archive`。自此方塊向下繪兩支標註的箭頭：一支通往一組 Linux 伺服器圖示，註明 `SSH 22, Ed25519 keys, group gg-infra-admins`；一支通往一組 Windows 伺服器圖示，註明 `WinRM 5986, HTTPS, svc_ansible → GG-WINRM-Admins`；第三支虛線箭頭通往一個 Packet Tracer 裝置圖示，被劃掉並註明「無可觸達的管理介面——設定以檔案形式存於 Git；真實裝置將需要在 SSH 上使用 Netmiko/NAPALM（雙軌方式；沒有任何 playbook 曾登入）」。中帶是儲存庫：一個資料夾樹標示為 `C:\FYP\04-automation\`，內含 `ansible/`（其中含 `inventory/lab.ini`、`group_vars/`、`playbooks/01..09`、`roles/`、`templates/`）、`powershell/`（五個具名腳本與 `modules/VPCommon/`）、`bash/`（`01-hardening-baseline.sh` 至 `05-cert-renew.sh`，加上 `lib/common.sh`）與 `runs/`（附時間戳的日誌）。底帶是工作流程：一條水平車道，階段為 `author on a branch → peer review (recorded in the meeting minutes) → merge → run playbook in check mode → apply → run again and capture changed=0 → pre-release credential sweep → tag vX.Y → run log committed`，末端是一個小型日誌檔圖示標示為「evidence」。

*圖說：圖 6.11——單一控制節點、儲存庫佈局、通往資產的兩種傳輸，以及產出變更證據的審查與標籤工作流程。*

### 6.13 AI 營運架構

代理層置於單一主機 `vpnz-ai01`，位於受信任伺服器區中 VLAN 30 的 10.10.30.51；其架構主要由它*不*被允許做的事來定義。

**它被允許讀取什麼。** 四個工具，沒有第五個。`get_active_alerts` 透過 HTTPS 自 Alertmanager API 讀取當前告警集合。`get_interface_stats` 藉由以 SNMPv3 輪詢 Packet Tracer 裝置資產，以及在 Linux 主機上讀取介面統計，取得介面計數器與錯誤率。`get_auth_failures` 讀取登入失敗事件——Windows 安全性事件 4625，以及經由 SSH 自日誌取得的 `sshd` 失敗。`draft_change_proposal` 不讀取任何外部來源；它撰寫文字並將其寫入本機的提案目錄。這些工具定義以清單形式宣告於代理執行環境的 skills 目錄之下，其撰寫形式將可表達為 Model Context Protocol 工具定義，使此介面不依賴特定執行環境。

**它被允許變更什麼。****什麼都不能。**沒有寫入路徑。該代理無法修改裝置、服務、規則、憑證或目錄物件，因為沒有任何工具暴露此類操作，且它持有的單一憑證不允許。它在環境中唯一的副作用，是在自身主機的提案目錄下建立一個文字檔。排除自主修復是一項刻意且已述明的設計決策，具特定理由：未受監督的變更將使本專案自身的驗證結果不可重現，因為受測狀態會在測試與重測之間改變，並且會使一個未經核實的語言模型成為安全邊界的一環。

**護欄。** 共七項，每一項皆可追溯至一項具名風險。

| 護欄 | 實作 | 所處理的風險 |
|---|---|---|
| 唯讀憑證 | `svc_aiagent`，僅為 `GG-AI-ReadOnly` 的成員；絕不成為 Domain Admins 的成員 | 影響範圍與權限提升 |
| 除該帳戶外不儲存任何裝置憑證 | 於 `vpnz-ai01` 上強制執行；除該單一帳戶外，主機上不存在任何裝置的憑證檔 | 憑證竊取與橫向移動 |
| 封閉的工具介面 | 四個已宣告的工具；新增第五個是經審查、記錄於決策日誌的設計變更 | 無界的能力增長 |
| 完整呼叫稽核 | 每次呼叫皆附加至 `/opt/openclaw/logs/agent.jsonl`，含提示雜湊與所進行的工具呼叫 | 可稽核性與事後重建 |
| 工具呼叫速率限制 | 每次呼叫與每小時的硬性上限 | 成本，以及失控迴圈成為對監控 API 的阻斷服務攻擊 |
| 網路位置限制於管理與監控埠 | 獲准的目的地僅為唯讀輪詢埠，且無通往使用者、DMZ 或實驗室區域的路徑 | 橫向移動 |
| 強制人類核准 | 每項輸出皆標示「建議——需經人類核准」，而工作流程終止於人 | 未經審查的行動與幻覺流入生產 |

**工作流程。** 來自監控堆疊的告警以 webhook 抵達，或由排程觸發。代理在其預算內最多呼叫四個已宣告的工具，並產出兩件產物：一份分診札記，引用每一項主張背後的工具結果並說明其無法判定的事項；以及一份以文字差異形式呈現的建議變更。人類閱讀兩者、作出決定，然後執行或捨棄。沒有該決定，不會發生任何進一步的事。

**附加於此層的誠實義務。** 有四項必須在章節中說明並反映於證據之中。第一是涵蓋範圍：WSOS 2026 完全不含 AI 內容，因此此層是超出該標準的創新，無法以引用取得正當性。第二是關於執行環境本身的不確定性：其版本、安裝方式、skill 格式與預設埠在設計時皆無法確認，這也是為何限時可行性探測必須在第 6 週前產出明確決定，以及為何在未附上運行實例的螢幕截圖並引用實際使用的文件之前，不得發佈任何版本、授權或能力宣稱。第三是失敗：幻覺與偽陽性必須誠實記錄，並附上產生它們的提示，因為一份被記錄的失敗比一份被隱藏的失敗是更強的學術成果。第四是評鑑：該章節必須說明代理在何處有幫助、在何處浪費時間，以及在何處人類是不可或缺的。

`[FIGURE: 6.12 — AI 營運架構與護欄]` 一條末端有硬性停止的管線。由左至右：`Prometheus / Alertmanager on vpnz-mon01` → 標註 `webhook` 的實線箭頭 → 一個大方塊標示為 `vpnz-ai01 10.10.30.51 — OpenClaw agent runtime`，內含一支小型迴圈箭頭標示「迭代工具呼叫，受預算限制」與四個 skill 的清單。自該大方塊散出四支點線箭頭，每支確切標示：`get_active_alerts → Alertmanager API (HTTPS)`；`get_interface_stats → SNMPv3 161/udp (Packet Tracer device estate) and ip -s link (Linux)`；`get_auth_failures → Windows Security 4625 and journald sshd (SSH 22)`；`draft_change_proposal → /opt/openclaw/proposals/ (text only)`。為每支箭頭繪一個小掛鎖與「read-only」字樣。自該方塊，一支單一輸出箭頭通往一個文件圖示標示為「triage note + proposed diff」，再通往一個人形圖示標示為「human review — approve, modify or discard」，並自該人繪一支箭頭至一個裝置圖示標示為「manual execution」。另外，自代理方塊直接繪一支大型打叉箭頭至該裝置圖示，註明「**依建構方式無寫入路徑**」，並在角落內嵌處以小表列出護欄：唯讀服務帳戶 `svc_aiagent` / `GG-AI-ReadOnly`；四個工具，沒有第五個；含提示雜湊的完整 JSON-lines 稽核日誌；速率限制；受區域限制的目的地；輸出永遠標示「建議——需經人類核准」。

*圖說：圖 6.12——唯讀代理層：四個已宣告的工具、無寫入路徑，以及介於建議與任何變更之間的強制人類決定。*

### 6.14 監控架構

#### 6.14.1 堆疊

監控運行於同一控制節點 `vpnz-mon01`，由四個職責各異的元件組成。**Prometheus** 自 exporter 抓取度量並將其儲存為時間序列。**Grafana** 從存於 Git 的檔案呈現已佈建的儀表板——`fyp-overview`、`fyp-security` 與 `fyp-availability`——因此儀表板是可審查的產物，而非某人點選而成的設定集合。**Loki** 接收並索引 `rsyslog` 所轉送的日誌。**Alertmanager** 評估同樣以受版本控制檔案形式保存的告警規則，並且是觸發代理分診工作流程的 webhook 來源。

#### 6.14.2 度量、Exporter 與收集

| 目標類別 | 機制 | 埠 | 所收集的內容 |
|---|---|---|---|
| Linux 客體（全部 10 部） | `node_exporter` 1.8.x | 9100/tcp | CPU、記憶體、磁碟、檔案系統、網路介面計數器與錯誤 |
| Windows 客體（全部 9 部） | `windows_exporter` 0.29.x | 9182/tcp | CPU、記憶體、磁碟區、服務狀態、網路計數器 |
| Nginx（代理配對與內容節點） | 讀取 `stub_status` 的本機狀態 exporter | 9113/tcp（基線值，由 Rev 1.1 裁決 C-08 確認） | 連線、請求、上游健康狀態 |
| Cisco 裝置資產（Packet Tracer） | 處於驗證與特權模式的 SNMPv3 輪詢 | 161/udp、traps 162/udp | 介面狀態、計數器、錯誤率、裝置可用性 |
| ASA `VP-HQ-FW-01` | SNMPv3 加上資訊層級的 syslog | 161/udp、514/udp | 介面與工作階段狀態；原則拒絕 |
| 所有 Linux 客體與所有 Cisco 裝置 | `rsyslog` 轉送至監控主機 | 514/udp | 系統、驗證、防火牆與服務日誌 |
| nftables 配對 | 每條丟棄規則上的原生 `log prefix "NFT-DROP: "`，由 `rsyslog` 轉送 | 514/udp | 每一筆被拒絕的流量及其來源、目的與埠 |
| Windows 客體 | 本機事件日誌，透過最小權限帳戶以唯讀方式暴露給代理 | — | 供分診工作流程使用的安全性事件 |

SNMPv2c 與 community string 在本設計中所有地方皆被禁止，這也是為何監控帳戶是具名、隸屬群組的帳戶，而非共用字串。探索與流量分析使用工作說明書與該標準都指向的工具：以 Cisco 探索協定取得鄰居拓撲、以 syslog 取得事件、以 SNMP 取得計數器，以及在 Linux 上以封包擷取處理任何計數器都無法回答的人工檢視案例。

#### 6.14.3 告警

告警規則以檔案宣告，且至少有三項告警必須被示範*觸發*並且*解除*，因為一項僅在觸發狀態被看見的告警，並未顯示它會解除。告警集合刻意保持精簡，且每條規則對應一項本專案實際能注入的故障：一個停止可觸達的 exporter 目標、一次虛擬位址容錯移轉及其相關轉換、一項跨越門檻的介面錯誤率、一項逼近的檔案系統或配額門檻，以及一波驗證失敗。每項告警都帶有足以付諸行動的標籤，以及足以分診的脈絡，因為一則只說「出了問題」的通知，正是代理層存在所要糾正的故障模式。

#### 6.14.4 「健康」是什麼樣子

健康的定義是架構的一部分，因為沒有它，環境只能被描述而無法被驗證。

| 領域 | 健康條件 |
|---|---|
| 度量收集 | 每個 Prometheus 目標皆回報 up；沒有任何 exporter 的缺席時間超過一個抓取間隔 |
| 身分識別 | 兩部可寫入網域控制站皆在站台連結間隔內完成複寫且無未決失敗；SYSVOL 與共用狀態一致；每部主機的時間偏移低於 Kerberos 容忍值 |
| 名稱解析 | 每個用戶端皆能解析網域、網域控制站與已發佈的名稱；沒有任何用戶端僅設定一個解析器 |
| 閘道備援 | 每個備援網段上各有一部 HSRP active 路由器與一部 standby；每個 Keepalived 配對中各有一個 VRRP master 與一個 backup，且由預定的主機持有 master 角色 |
| 服務可用性 | 連接埠矩陣中的每項服務皆自其預期來源區域、在其預期埠上應答；每個虛擬位址在其擁有者各自停止時仍能應答 |
| 檔案與儲存 | 每個受管理共用皆已掛載，且可由其獲授權群組觸達而不為其他群組所觸達；沒有任何配額高於其警告門檻；iSCSI 工作階段已建立且磁碟區為線上 |
| 路由 | 內部網域中每個預期的鄰接關係皆為 up；邊緣存在一筆預設路由；外部對等工作階段已建立，且已接受的前綴數在設定的最大值之內 |
| 安全 | nftables 規則集與 Git 中的版本相符且無未經授權的變更未決；每個區域邊界皆已產生其預期的拒絕事件；儲存庫中不存在任何憑證或金鑰；憑證自動註冊與續期回報成功，且沒有憑證處於其續期視窗內 |
| 自動化 | 每個 playbook 最近一次執行皆以零失敗完成，且第二次執行零變更；未決失敗總數為零 |
| 代理層 | 執行環境可觸達且工具介面有回應；每次呼叫皆存在於稽核日誌中；沒有任何建議變更處於未核准且未被閱讀的狀態 |

`[FIGURE: 6.13 — 監控、遙測與告警架構]` 一張輪輻圖，`vpnz-mon01` 位於中央。在其周圍將 exporter 繪為輪輻並標示其埠：`node_exporter 9100/tcp ×10`；`windows_exporter 9182/tcp ×9`；`Nginx status exporter`（將埠標註為 `[假設]`，因為尚未對照已安裝的套件確認）；`SNMPv3 161/udp + traps 162/udp`，並附上一組 Cisco 交換器與路由器圖示；以及 `rsyslog 514/udp`，並附一扇發送者標示為「所有 Linux 客體、所有 Cisco 裝置、ASA `VP-HQ-FW-01`、nftables 配對」。在中央方塊內將四個元件繪為一條鏈：`Prometheus (scrape) → Loki (logs) → Alertmanager (rules from Git) → Grafana (provisioned dashboards fyp-overview, fyp-security, fyp-availability)`。自 Alertmanager 有一支單一箭頭向右離開，標註 `webhook`，進入一個小方塊 `vpnz-ai01 (read-only triage)`，再自該處通往一個人形圖示。左側附上一個垂直標註面板，標題為「健康是什麼樣子」，以上表的條件群組作為核取方塊列出。

*圖說：圖 6.13——收集、儲存、告警與視覺化，並附上作為可勾選面板的健康環境定義。*

### 6.15 設計可追溯性

本章中每一項架構元素都服務於一條技術路線，且在存在時服務於一個 WSOS 範疇。凡該標準未指名該技術之處，所登錄的依據即為 §5 中引用的橋接條文，且該項目被標示為橋接而非涵蓋範圍。

| 設計元素 | 章節 | 路線 | 所服務的 WSOS 範疇 | 依據 |
|---|---|---|---|---|
| AD DS 樹系 `vertexpeak.fyp.lab`、OU 樹、站台、服務帳戶、委派群組 | 6.11 | L1 | 4 網路與系統營運（25 %） | **指名的技術**：`Install and manage enterprise directory services (ADDS, LDAP)` |
| 觀塘的唯讀網域控制站與站台連結 | 6.11 | L1 | 4（25 %） | 如上被指名的技術；可用性工程是本設計自身的決策 |
| AD 整合式 DNS，具轉寄站、反向區域與分域解析名稱 | 6.6、6.11 | L1 | 4（25 %） | **指名的技術**：`Install and manage domain name services (Windows DNS, BIND)` |
| 具 80/20 容錯移轉、分支轉送與 snooping 的 DHCP | 6.5、6.11 | L1 | 4（25 %） | **指名的技術**：`Install and manage dynamic host configuration services` |
| 自 `vpnz-dc01` 起的 NTP 階層與時間偏移測試 | 6.11 | L1 | 4（25 %）；6 疑難排解（25 %） | **指名的技術**：`Install and manage network time services` |
| 兩層式內部 PKI、自動註冊、憑證主體與撤銷 | 6.9.3 | L1，橫貫各線 | 4（25 %） | **指名的技術**：`Setup public key infrastructure services` → `Active Directory Certificate Services`、`OpenSSL` |
| 四個受管理共用上的 FSRM 配額、檔案畫面與儲存報告 | 6.10.2 | L1 | 4（25 %） | `Install and manage sharing services`；FSRM 本身**未被指名的技術** |
| 位於不可路由網段上、具發起端允許清單與 CHAP 的 iSCSI 目標 | 6.10.1 | L1 | 4（25 %） | `Manage file systems` / `LVM/Dynamic disks`；iSCSI **未被指名的技術** |
| 具 NPS 授權且無分割通道的 RRAS IKEv2 遠端存取 | 6.5、6.9 | L1 | 4（25 %）；3 資料傳輸網路（25 %） | `Install and manage remote network access services`；`...VPN technologies such as IPSec, ...`；RRAS 與 IKEv2 **未被指名的技術** |
| Nginx 反向代理、TLS 終止、重新加密與上游伺服器池 | 6.2、6.9.2 | L2 | 4（25 %） | **指名的技術**：`Install and manage web hosting services using modern web servers e.g. Apache, Nginx and IIS.` |
| 代理配對上的 Keepalived VRRP VRID 61 與出口配對上的 VRID 51 | 6.8.2 | L2 | 3（25 %） | **橋接**：`...by using GLBP, HSRP, VRRP, LACP, PAgP, etc.`——VRRP 被指名的技術 |
| nftables 直列配對：預設丟棄轉送原則、集合、NAT、記錄、回滾計時器 | 6.9.1 | L2 | 3（25 %） | **橋接**：`Apply basic security configuration for control and data plane` |
| 具 Easy-RSA PKI、逐用戶端原則與撤銷測試的 OpenVPN 伺服器 | 6.5、6.9.3 | L2 | 3（25 %） | **指名的技術**：範疇 3 的 VPN 技術條文 |
| WireGuard 站對站與遠端工作者通道 | 6.5、6.6.5 | L2 | 3（25 %） | **最弱的橋接**：僅 VPN 條文末的 `etc.` |
| Linux 強化、SSH 原則、`sysctl` 基線與日誌轉送 | 6.9.4、6.14 | L2、L4 | 3（25 %） | `Apply basic security configuration for control and data plane` |
| 跨總部與觀塘、具驗證與被動介面的 OSPF 區域 0 | 6.7.1 | L3 | 3（25 %） | **指名的技術**：`...such as OSPF, BGP and EIGRP` |
| 以預設行政距離運行於繼承網域的 EIGRP AS 100 | 6.7.2 | L3 | 3（25 %） | **指名的技術**：同一條條文 |
| 具前綴清單與刻意迴圈測試的單一加標籤重新分配點 | 6.7.4 | L3 | 3（25 %）；6（25 %） | 就協定而言為**指名的技術**；迴圈預防設計是本專案自身的 |
| 與 AS 65000 及 AS 65002 的 eBGP，使用前綴清單、route-map 與 `maximum-prefix` | 6.7.3 | L3 | 3（25 %） | **指名的技術**：協定條文 |
| 具明確根、邊緣埠、root guard 與收斂擷取的 RSTP | 6.4、6.8 | L3 | 3（25 %） | **橋接**：`Configure access, aggregation and core level switching`；以標題引用 **IEEE 802.1w《Rapid Reconfiguration of Spanning Tree》** |
| ASA DMZ 與邊緣防火牆：安全層級、物件群組、NAT、檢查、syslog | 6.9.1、6.9.2 | L3 | 3（25 %） | **橋接**：`Apply basic security configuration for control and data plane`；ASA **未被指名的技術** |
| 通往灣仔的 ASA IKEv2 站對站 IPsec 通道 | 6.5.2 | L3 | 3（25 %） | **指名的技術**：`...VPN technologies such as IPSec, ...` |
| 交換器虛擬介面上的 HSRP 群組 1 | 6.8.1 | L3 | 3（25 %） | **指名的技術**：`...using GLBP, HSRP, VRRP, ...` |
| VLAN 規劃、幹道、原生 VLAN 999、未使用埠紀律與埠安全 | 6.6.2 | L3 | 3（25 %） | **指名的技術**：`Network segmentation with VLAN`；`Configure access, aggregation and core level switching` |
| 信任邊界矩陣與每個邊界一次被擷取的拒絕 | 6.4.3 | L3、L2 | 3（25 %）；6（25 %） | `Apply basic security configuration for control and data plane`；`Common types of attacks on network protocols and mitigation methods` |
| Ansible 控制節點、inventory 模型、playbook、角色與範本 | 6.12.1–6.12.3 | L4 | 5 基礎架構自動化（15 %） | **以要求形式指名的技術**：`Identify and implement infrastructure as code` → `Ansible.` |
| 供入職、健康、設定備份、端點測試與 GPO 備份使用的 PowerShell 腳本 | 6.12.3 | L4 | 5（15 %） | **指名的技術**：`Setup and run routine infrastructure maintenance operations ...` → `PowerShell` |
| 供強化、原子式規則集套用、VRRP 驗證、備份與續期使用的 Bash 腳本 | 6.12.3 | L4 | 5（15 %） | **指名的技術**：同一條條文 → `Bash` |
| Git 儲存庫、每任務一分支審查、標籤與已提交的執行日誌 | 6.12.5 | L4 | 5（15 %） | **指名的技術**：`...modern automation tools ...` → `Git`；`Importance of code version control` |
| 零變更並擷取為證據的冪等第二次執行 | 6.12.3 | L4 | 5（15 %） | `Behaviour of infrastructure automation tools` |
| Ansible Vault、憑證掃描與最小權限服務帳戶 | 6.12.4 | L4 | 5（15 %）；4（25 %） | `Importance of code version control`；`Install and manage authentication, authorization and accounting services` |
| `vpnz-ai01` 上的代理執行環境，具四個唯讀 skill 與一份稽核日誌 | 6.13 | L5 | **無** | **無 WSOS 涵蓋範圍。**超出該標準的創新，僅錨定於範疇 1 的一般專業屬性 |
| 由 Alertmanager 供給並終止於人類核准的代理分診 | 6.13、6.14.3 | L5 | **無** | 同上；其底層監控工作由 `Install and manage IT infrastructure resources monitoring systems`（範疇 4）與 `Use system logs to find and identify issues`（範疇 6）涵蓋 |
| Prometheus、Grafana、Loki、exporter、SNMPv3 與 syslog | 6.14 | 橫貫各線，L2/L4 | 4（25 %）；3（25 %） | `Install and manage IT infrastructure resources monitoring systems`——本專案使用的堆疊不同於嵌套示例 `Icinga2`、`Nagios`、`Cacti`、`Windows Resource Monitor`，且**必須說明此事**；`Use network discovery and traffic analysis tools such as CDP, NetFlow, Syslog, SNMP and tcpdump.` |
| `10.20.0.0/16` 中的管理平面、跳板主機、僅用 SNMPv3、無遠端使用者存取 | 6.4.3、6.9.4 | 橫貫各線，L1/L2/L3 | 3（25 %）；4（25 %） | `Apply basic security configuration for control and data plane`；`Select the roles and/or features of the operating/server system` |
| Hypervisor 主機、僅主機網路、範本與資源預算 | 6.3 | 全部 | 1 工作組織與管理（5 %） | `The techniques of planning, scheduling, and prioritizing`；單主機限制是專案限制，**並非**標準要求 |
| 以 Packet Tracer 作為整條 Cisco 路線的模擬環境 | 6.2、全章 | L3 | **無** | 使用模擬器是專案限制，並非 WSOS 要求。Packet Tracer 建模協定邏輯與 CLI 語法，而非真實硬體、時序或規模 |

**如何閱讀此表。** 可見五種模式，而每一種都有其後果。第一，支援最強的元素是內部與外部路由協定、目錄、Web 伺服器與自動化工具，這些都是該標準逐字指名的技術。第二，有一大群元素——FSRM、iSCSI、RRAS、IKEv2、Keepalived、nftables、WireGuard、RSTP 與 ASA——倚賴題目表自身的措辭或通往某條通用要求條文的橋接，而報告中這些項目每一項都必須帶有「橋接」或「未被指名的技術」字樣，而不得呈現為涵蓋範圍。第三，工作說明書中有一條路線，即 AI 網路管理，完全沒有 WSOS 範疇，因此僅能追溯至本專案自身的目標；這是關於該標準的陳述，而非本設計的弱點，但必須公開說明。第四，有若干元素服務於該標準的組織與專業範疇而非其技術範疇：資源預算、擁有權模型與文件紀律都是範疇 1 的能力，而文件交付物本身則由範疇 6 所要求。第五，且對本專案的優先順序具決定性的是，三個各佔 25 % 的範疇佔了評核權重的四分之三，而該表顯示本架構大量服務於它們：範疇 3 之下為路由、網段隔離與備援；範疇 4 之下為目錄、名稱解析、檔案、儲存、PKI、監控與自動化服務；範疇 6 之下為刻意的故障注入、被拒流量擷取、容錯移轉轉換與路由迴圈演練。
