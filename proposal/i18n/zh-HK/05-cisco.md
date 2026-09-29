## 9. Cisco Networking

### 9.1 概述與目標

課題說明表將此線稱為 *「Cisco Networking（例如 BGP、OSPF、EIGRP、RSTP、ASA 等）」*。它是五條簡介線中覆蓋最完善的一條：WorldSkills Occupational Standards 2026（WSOS）在其中一條要求中列出 **OSPF、BGP 與 EIGRP**，在第二條列出 **GLBP、HSRP、VRRP、LACP 與 PAgP**，在第三條列出 **VPN 系列**，並在第四條列出**探索與流量分析工具**（`CDP, NetFlow, Syslog, SNMP and tcpdump`）。簡介提及而標準**並未**包含的兩項技術 —— **RSTP** 與 **ASA** —— 已明確橋接至標準本身的用語，且從不呈現為 WSOS 要求。

本小節在 Cisco Packet Tracer 之內交付：校園 VLAN、802.1Q 幹道與 RSTP；配備 HSRP（熱備援路由器協定）的 VLAN 間路由；總部與觀塘之間的單區域 OSPF；為澳門而設、內含單一再分佈點並附標籤的 EIGRP AS 100；連接兩個模擬供應商的多重歸屬 eBGP（外部邊界閘道協定）；配備信任矩陣、三種 NAT 形式及一條 IPsec 站點對站點隧道的 ASA 5506-X 周邊；以及管理、監控、流量分析與韌性檢測的配套。

#### 9.1.1 裝置清單與角色

Packet Tracer 環境恰好為**十六台邏輯裝置**。§9.4 給出型號、版本、介面與佈線。

| # | 裝置 | 型號 | 角色 |
|---|---|---|---|
| 1 | `VP-HQ-CORE-01` | Cisco 多層交換器 | 總部核心 L3，OSPF area 0（單一區域，無 ABR），於群組 1-4 中為 HSRP 作用中（優先值 150），HQ VLAN 的 RSTP 根橋，CUCM Express 主機 |
| 2 | `VP-HQ-CORE-02` | Cisco 多層交換器 | 總部核心 L3，HSRP 待命（100），RSTP 次級根橋 |
| 3 | `VP-HQ-DSW-A01` | 24 埠接取交換器 | 6–8 樓，VLAN 40 `USER-HQ-STF`，RSTP 葉節點，連接埠安全（port security），DHCP 窺探（snooping） |
| 4 | `VP-HQ-DSW-A02` | 24 埠接取交換器 | 9–11 樓，VLAN 40，相同的防護措施 |
| 5 | `VP-HQ-DSW-A03` | 24 埠接取交換器 | 僅 VLAN 20 `MGMT-OOB` 與 VLAN 70 `STUDENT-LAB`；不與任何使用者接取交換器建立幹道 |
| 6 | `VP-HQ-DSW-A04` | 24 埠接取交換器 | VLAN 30 `SRV-HQ-1`、45 `VOICE-HQ`、50 `TRANSIT-EGRESS`、60 `SRV-HQ-2`、80 `STORAGE-HQ`、90 `DMZ-HQ` |
| 7 | `VP-HQ-EDGE-01` | Cisco ISR 級路由器 | 總部廣域網路邊緣；eBGP AS 65001；OSPF/EIGRP 邊界；**唯一的再分佈點**；NAT 邊界 |
| 8 | `VP-HQ-FW-01` | **Cisco ASA 5506-X**，ASA 9.16(4) | 周邊／DMZ 防火牆：安全等級 outside 0 / dmz 50 / inside 100，物件群組（object groups），ACL（存取控制清單），NAT/PAT，靜態 NAT，檢查（inspection），至 `VP-WC-EDGE-01` 的 IPsec IKEv2，至 `vpnz-mon01` 的 syslog |
| 9 | `VP-BR-EDGE-01` | Cisco ISR 級路由器 | 觀塘：經 WAN1 的 OSPF area 0 支線（spoke），VLAN 110–113 的 VLAN 間路由，DHCP 中繼（relay） |
| 10 | `VP-BR-DSW-A01` | 24 埠接取交換器 | 觀塘接取；RSTP 葉節點 |
| 11 | `VP-MO-EDGE-01` | Cisco ISR 級路由器 | 澳門路由器；**EIGRP AS 100**；總部端的 EIGRP/OSPF 網域邊界 |
| 12 | `VP-MO-DSW-A01` | 24 埠接取交換器 | 澳門接取；RSTP 葉節點 |
| 13 | `VP-WC-EDGE-01` | Cisco ISR 級路由器 | 灣仔：至 `VP-HQ-FW-01` 的 IPsec 對等端，小型 BGP AS 65021 |
| 14 | `VP-WC-DSW-A01` | 24 埠接取交換器 | 灣仔接取；RSTP 葉節點 |
| 15 | `VP-ISP-EDGE-01` | Cisco ISR 級路由器 | 模擬的轉送供應商邊緣，**AS 65000**；亦為第二個 eBGP 連線提供替代供應商位址 |
| 16 | `VP-HQ-VOICE-01` | Cisco ISR 級路由器 | VLAN 45 中的 CUCM Express —— 僅屬輔助，並非簡介所聲稱的項目 |

#### 9.1.2 所發展的 WSOS 2026 能力領域

所有引文均逐字取自 `research\wsos-2026-2447.md`。

| WSOS 2026 領域（權重） | 逐字要求條文 | 實作位置 |
|---|---|---|
| 3 資料傳輸網路（25 %） | `Provide enterprise-wide connectivity using internal and external gateway routing protocols such as OSPF, BGP and EIGRP` | §9.8、§9.9、§9.10 |
| 3 資料傳輸網路（25 %） | `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.` | §9.7（HSRP）；§9.6.4（LACP/PAgP 已聲明之省略） |
| 3 資料傳輸網路（25 %） | `Configure access, aggregation and core level switching` | §9.6 —— 用於**RSTP** 的橋接依據 |
| 3 資料傳輸網路（25 %） | `Apply basic security configuration for control and data plane` | §9.12（ASA 策略）；§9.5（強化設定） |
| 3 資料傳輸網路（25 %） | `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.` | §9.12.4 |
| 3 資料傳輸網路（25 %） | `Use network discovery and traffic analysis tools such as CDP, NetFlow, Syslog, SNMP and tcpdump.` | §9.13 |
| 3 D3 知悉／理解 | `Network segmentation with VLAN`；`Routing and switching concepts`；`Load balancing principles` | §9.6、§9.7、§9.8 |
| 3 D3 知悉／理解 | `concepts and principles for network function virtualization` | §9.13 —— 此處所有 Cisco 行為均為模擬，並與真正虛擬化的伺服器環境作對照 |
| 3 D3 知悉／理解 | `Controller-based and software-defined network management approaches.` | 已確認並**排除** —— SDN 屬姊妹課題（Victor3） |
| 1 工作組織與管理（5 %） | `Perform basic initialization of active network equipment` | §9.5 |
| 6 疑難排解（25 %） | `Use network package inspection, connectivity checking tools etc to troubleshoot and identity problems in a network.` `[sic]` | §9.16 |
| 6 疑難排解（25 %） | `Prepare a technical document reflecting the solution in detail for agreement and sign-off` | 本小節、§9.15、§9.17 |

**誠實聲明。** WSOS 2026 既不含 `RSTP` 亦不含 `ASA`（於文字及原始 HTML 中均為 0 次出現）；RSTP 是經 `Configure access, aggregation and core level switching` 橋接，而 ASA 則經 `Apply basic security configuration for control and data plane` 及 VPN 條文橋接。該標準**完全沒有**提及 Packet Tracer、GNS3 或 EVE-NG，亦**沒有**任何螢幕截圖要求 —— §9.15 的截圖源自 HDTN 課題說明表。12 週的時程屬學生層面的限制，絕不可引述為標準的要求。

---

### 9.2 Packet Tracer 平台：能力與誠實的限制

#### 9.2.1 平台，以及雙軌做法

Cisco 線建構於 `vpnz-hvhost01` 上的 **Cisco Packet Tracer 8.2.2（64 位元 Windows）**。基準文件將該指定版本記錄為 **[UNCERTAIN]** —— 須於建置時對照 Cisco Networking Academy 下載頁面確認 —— 並附帶後備方案：團隊使用其帳戶所提供的任何現行 NetAcad 支援版本，絕不使用第三方或鏡像安裝程式，並在版本偏差小節中記錄確切的建置版本。

**Packet Tracer 是模擬器，不是仿真器。** 它為命令語法與協定邏輯建立模型；它不為 ASIC、線速轉送、真實硬體、真實振盪器驅動的計時器或真實收斂時間建立模型。任何取自 Packet Tracer 的行為數據都是**模擬產物**；不得有任何一項呈現為真實世界的效能數據。因此本計劃採用兩條軌道，而讀者必須始終能分辨某一區塊屬於哪一條軌道。

- **軌道 A —— 模擬並已執行。** §9.5–§9.14 的每一項設定皆鍵入 Packet Tracer，儲存為 `01-l2l3-core.pkt`、`02-wan-routing.pkt`、`03-asa-perimeter.pkt`、`04-voice.pkt` 及 `05-full.pkt`（交付用的拓撲），並連同其 `show` 輸出擷取留存。
- **軌道 B —— 已記錄的等效設定。** 若某項功能無法忠實執行，則會說明該限制，在附錄式小節中給出等效的真實設備設定（§9.6.4 LACP/PAgP；§9.12.6 EtherType ACL；§9.13.3 NetFlow），並在報告中記錄該設定已撰寫但**未在模擬器中執行**。凡屬軌道 B 的區塊，其引言句均會明確說明。

#### 9.2.2 關於模擬命令的強制警告

> 本報告 §9 所示的所有命令均輸入網絡模擬器，而非實體或虛擬化的 Cisco 硬體。Packet Tracer 解譯命令列介面並為協定狀態機建立模型；它不轉送真實的訊框或封包，不執行真實的 Cisco IOS 或 ASA 軟體，亦不呈現真實硬體的時序。因此本節的任何命令均不可接受為「相應設定已在生產設備上驗證」的證據。此處引述的每一項收斂、故障切換與復原數據皆為模擬器結果，並已如此標示。此為已記錄的專案限制，並在專案「不得使用任何實體網絡硬體」的限定條件下明知而接受。

#### 9.2.3 真實實驗室的替代方案及其為何不在範圍內

在學術上更為有力的替代方案是**在 hypervisor 上執行真實或虛擬化的 Cisco 映像** —— 實體設備，或作為客體並配以僅主機網路（host-only networks）的 Cisco 虛擬路由器與虛擬防火牆平台 —— 這可在真實協定堆疊之間提供真正的 802.1Q 標籤、真正的轉送與真正的封包擷取。此方案因四項已記錄的理由而不在範圍內：(1) 客戶的限制是絕對的（不得使用實體硬體；僅可使用 Packet Tracer），而更改該限制屬於基準修訂，並非撰寫者的選擇；(2) 授權 —— 虛擬 IOS-XE 需要團隊並不持有的授權權利，且本專案不購買任何商業授權；(3) 主機資源 —— `vpnz-hvhost01` 已承載一套 19 部 VM、規模為 42 vCPU 與 78 GB RAM 的環境；(4) 可重現性 —— 四位學生都必須從乾淨的主機以完全相同方式重建拓撲，而 `.pkt` 檔案可容許如此，硬體則不然。此選擇的一項實際好處已記錄在案：`.pkt` 檔案會被提交至 Git，並可由任何成員或評審重新開啟，這比未經記錄的硬體測試台更能滿足 WSOS 的 `agreement and sign-off` 義務。

#### 9.2.4 支援程度表

| 技術 | 支援程度 | 本專案的做法 | 殘餘限制 |
|---|---|---|---|
| IOS 路由器與多層交換器（CLI、介面、靜態路由） | **完全** | 原生配置；已擷取 `show version`、`show ip interface brief`、`show run` | 無真實轉送或線速數據 |
| VLAN、接取埠、802.1Q 幹道、原生 VLAN、允許清單 | **完全** | 原生配置；已擷取 `show vlan brief`、`show interfaces trunk` | 無法與真實主機建立幹道，故 VM 的 VLAN 配置改以 hypervisor 僅主機網路實現 |
| VLAN 999 原生 VLAN、關閉黑洞埠 | **完全** | 完全按基準文件所述實作 | 無 |
| RSTP / rapid-PVST、根優先值、PortFast、BPDU Guard、Root Guard | **部分** —— 角色與狀態已建模，時序則否 | 已示範根橋與角色行為；收斂數據標示為模擬產物 | 無法提供可信的毫秒級收斂量測 |
| 連接埠安全（port security）、DHCP snooping、Dynamic ARP Inspection | **部分** —— 前兩者可用，DAI 不忠實 | 已配置並測試連接埠安全與 DHCP snooping；DAI 若獲接受則僅作已記錄的外推 | DAI 可能無法執行；必須加以標示 |
| HSRP（群組、優先值、preempt、追蹤） | 就 HSRPv1 語義而言為**完全** | 已實作四個群組；已示範故障切換 | 未演練 HSRPv2 語義 |
| Cisco 裝置上的 GLBP / VRRP | **不支援／部分** | 未使用 GLBP；VRRP 改由 Linux 上的 Keepalived 交付 | GLBP 是 WSOS 點名的技術，而本專案無法示範。已聲明的缺口 |
| EtherChannel —— PAgP / LACP / 靜態 | 所用型號**不支援** | 已省略；真實設備設定見 §9.6.4 | LACP 與 PAgP 是 WSOS 點名的技術，無法提出證據。已聲明的缺口 |
| OSPFv2 單一區域 —— 介面設定、認證、被動介面、計時器、DR/BDR | 就單一區域用途而言為**完全** | 已在兩台核心、總部邊緣及 `VP-BR-EDGE-01` 上實作 | 多區域、NSSA/stub 調校、OSPFv3、MPLS 均按設計排除 |
| OSPF SHA-256 認證 | **部分** —— MD5 可靠，SHA 取決於映像 | 可用的設定為 MD5 金鑰鏈；SHA-256 已嘗試並標示為 **[ASSUMPTION]** | 若 SHA 失敗，報告將記錄 MD5 為已實作，而 SHA 列為未來工作 |
| EIGRP 經典模式 AS 100（計時器、被動介面、MD5、頻寬／延遲） | 就經典模式而言為**完全** | 已在 `VP-MO-EDGE-01` 與 `VP-HQ-EDGE-01` 上實作 | 不聲稱具名模式與寬度量度 |
| eBGP 對等連線、前綴清單、路由對映（route maps）、local preference、MED、AS-path prepend、`maximum-prefix` | **部分** —— 所列要點可用 | 具備完整前綴控制的雙供應商情境 | 無 route reflector、confederation、`add-path`、BGPsec、RPKI |
| VRF、VRF-lite、路由洩漏（route leaking）、Policy-Based Routing | **不忠實支援** | **未使用。** 隔離是透過實體介面、VLAN、ACL 與 ASA 安全等級達成；流量導引使用靜態路由、BGP 屬性與 ASA 策略 | 本設計無法聲稱路由表層級的隔離或 PBR，僅能聲稱介面層級與防火牆層級的隔離 |
| NAT：靜態、動態、PAT/overload、連接埠轉送 | 在 IOS 及所用的 ASA 形式上為**完全** | `VP-HQ-EDGE-01` 上為 IOS NAT/PAT；`VP-HQ-FW-01` 上為 ASA 靜態 NAT、動態 PAT 與豁免（exemption） | NAT64/NAT66 與 CGNAT 不在範圍內（本專案僅用 IPv4） |
| ASA 安全等級、ACL、物件群組、檢查、靜態路由 | 就經典功能集而言為**完全** | 已為 TB-04、TB-05、TB-06、TB-13、TB-15 實作 | 沒有 FirePOWER/SFR、叢集、故障切換對 —— 不予聲稱 |
| IPsec 用的 ASA NAT 豁免 | **部分** —— 取決於是否支援條件式的 `no-proxy-arp route-lookup` 形式 | 按 §9.12.3 所述配置；若被拒絕，則改用較簡單的豁免形式並記錄該替換 | 語法可能與真實的 9.16(4) 設備不同 |
| IPsec 站點對站點、IKEv1/IKEv2、PSK 與憑證認證 | **部分** —— IKEv1/PSK 可靠，搭配憑證的 IKEv2 則不可靠 | 隧道已建立並已取得證據；若搭配憑證的 IKEv2 無法完成，則改用 IKEv1/PSK 形式、說明該替換，並將真實設備的 IKEv2 設定作為軌道 B 給出 | 除非有擷取證據證明，本專案**不得**聲稱已建立以憑證為基礎的 IKEv2 隧道 |
| 進階 QoS（policy map、shaping、policing、MQC） | 不忠實**支援** | **未嘗試。** 語音品質僅依賴 VLAN 隔離、DHCP 選項 066 與 CUCM Express 註冊 | 無法聲稱語音 QoS。已聲明的缺口 |
| CDP / LLDP 探索 | CDP 為**完全**；LLDP 為**部分** | 已啟用 CDP；LLDP 若獲接受即配置並擷取，否則記錄為真實硬體上的追加項目 | ASA 上的 LLDP-MED 與 LLDP 可能不可用 |
| SNMP | **部分** —— SNMPv2c 可用，SNMPv3 authPriv 不可靠 | 設計立場為 SNMPv3 `authPriv`（禁止使用 community string）；若被拒絕，則記錄該限制，並改以 Linux 環境為 SNMPv3 取得證據，而非退回使用 community string | 裝置的 SNMPv3 可能僅能在伺服器環境上取得證據 |
| Syslog | **完全** —— 至 UDP 514 的 `logging host` 可用 | 已實作至 `vpnz-mon01`（10.10.30.31），並附毫秒級時戳 | UDP 514 未經認證 —— 此為已記錄的實驗室簡化 |
| NetFlow / Flexible NetFlow / IPFIX | **不支援** | 已記錄的限制；真實設備設定作為軌道 B 見 §9.13.3；其角色由 SNMP 計數器、Syslog 與 `tcpdump` 填補 | 任何模擬裝置均無流量遙測。已聲明的缺口 |
| NTP 用戶端與認證 | **部分** —— 用戶端設定獲接受，模擬伺服器可能不提供時間 | 每台裝置均配置 `ntp server 10.10.30.11` 及認證；權威時間來源為 `vpnz-dc01` | 不保證 Packet Tracer 的時戳反映真實系統時間 |
| TFTP 設定備份 | **部分** —— 檔案傳輸模擬僅屬表面 | 設定以文字檔匯出並提交至 Git 的 `03-build/packet-tracer/configs/` 之下；至 `vpnz-mon01:/srv/tftp/` 的 TFTP 已對真實環境示範 | 任何自動化備份均無法登入模擬裝置 |
| Stacking、vPC、MPLS、VXLAN、SDN 控制器、SD-WAN、ACI | **不支援** | **未使用，亦不予聲稱。** SDN 明確屬姊妹課題（Victor3）；WSOS 的 SDN 條文被確認為本專案不實作的知悉／理解項目 | 已聲明的缺口，並引述標準條文，使該排除事項清晰可見 |

---

### 9.3 實體與邏輯拓撲

[FIGURE: `05-full.pkt` 的 Packet Tracer 實體檢視截圖，按站點顯示全部十六台邏輯裝置 —— 中央為總部園區，上方為模擬互聯網／ISP 雲，右方為觀塘與澳門廣域網路支線，左方為灣仔 IPsec 對等端，並可見裝置型號與介面標籤。圖說：「圖 9.1：完整 Packet Tracer 拓撲，`05-full.pkt` —— 16 台邏輯裝置 —— 擷取自 Packet Tracer 的 Physical 工作區，顯示裝置型號 —— {date}」。]

邏輯拓撲為兩層園區架構（核心與接取），配以 collapsed-core 邊緣及防火牆單臂（firewall-on-a-stick）DMZ。

```text
                        [ Simulated Internet / CLOUD ]  192.0.2.0/24  203.0.113.0/29
                                       |
             eBGP AS 65000  (10.10.100.0/30, 10.10.100.4/30, 10.10.100.40/30)
                                       |
                              VP-ISP-EDGE-01 (AS 65000)  gi0/0 .2 | gi0/1 .6 | gi0/2 .42
                                       |
  gi0/0 10.10.100.1/30
  VP-HQ-EDGE-01 (AS 65001)  lo0 10.255.0.21/32
    gi0/1 192.0.2.2/30 <-- outside --> VP-HQ-FW-01 (ASA 5506-X): outside 198.51.100.1
    gi0/2 10.10.100.33/30 --> VP-BR-EDGE-01 10.10.100.34/30   (OSPF area 0)
    gi0/3 10.10.100.37/30 --> VP-MO-EDGE-01 10.10.100.38/30   (EIGRP AS 100)
    gi1/0..gi1/3 --> VLAN 10 (10.10.10.1), VLAN 20 (10.20.20.1),
                     VLAN 30 (10.10.30.253), VLAN 40 (10.10.40.253)

  ================ VLAN 10 LAN-HQ-CORE 10.10.10.0/24 (L2 transit) ================
   VP-HQ-CORE-01  lo0 10.255.0.11  mgmt 10.20.20.11 <== core trunk ==>
   HSRP active (150) / RSTP root primary (802.1Q, native 999)   VP-HQ-CORE-02  lo0 10.255.0.12
   gi1/0/2 --> VP-HQ-EDGE-01                                    mgmt 10.20.20.12
   gi1/0/4 --> VP-HQ-FW-01 inside 10.10.50.2/28                 HSRP standby (100) / RSTP secondary
   gi1/0/3..6 --> VP-HQ-DSW-A01 (VLAN40) | A02 (VLAN40) | A03 (VLANs 20,70) | A04 (VLANs 30,45,50,60,80,90)

   VP-HQ-FW-01: outside 198.51.100.1/29 | dmz 10.10.90.1/24 | mgmt 10.20.20.32
   VP-HQ-VOICE-01 10.10.45.11/24 --> VP-HQ-DSW-A04 access port (VLAN 45)

  Kwun Tong                     Macau                          Wan Chai
   VP-BR-EDGE-01 AS 65001 spoke   VP-MO-EDGE-01 EIGRP 100        VP-WC-EDGE-01 AS 65021
     lo0 10.255.0.31                lo0 10.255.0.41                lo0 10.255.0.51
     gi0/0.110-113 10.10.110-113.1  gi0/0.120/.121 10.10.120.1/121.1  outside 203.0.113.5/29
     trunk --> VP-BR-DSW-A01        trunk --> VP-MO-DSW-A01        gi0/0.130/.131 10.10.130.1/131.1
                                                                     trunk --> VP-WC-DSW-A01
                                    IPsec IKEv2 <=== ASA 198.51.100.1 (VLAN 131 only)
```

#### 9.3.1 拓撲與信任區域的對應

| 信任區域 | 在此終結該區域的裝置 | 邊界執行 | TB 行 |
|---|---|---|---|
| `Z-CORE` | `VP-HQ-CORE-01/02`，VLAN 10 `LAN-HQ-CORE` | SVI 介面 ACL；核心內部沒有防火牆 —— 核心是受信任的，並非安全邊界（此列明為假設） | — |
| `Z-MGMT` | `VP-HQ-DSW-A03` 上的 VLAN 20；全部十六台裝置的管理位址；ASA 管理介面 | 每台裝置上的 VTY ACL（`ACL-MGMT-IN-10`）；沒有任何使用者 VLAN 幹道連接至 `VP-HQ-DSW-A03` | TB-07、TB-08 |
| `Z-SERVER` | `VP-HQ-DSW-A04` 上的 VLAN 30 與 VLAN 80 | HSRP 群組 1（VLAN 30，`0000.0c07.ac01`）與群組 4（VLAN 80，`0000.0c07.ac04`）閘道；nftables 對組過濾伺服器對外流量 | TB-01、TB-03 |
| `Z-USER` | `VP-HQ-DSW-A01/A02` 上的 VLAN 40；分支 VLAN 110/111 | HSRP 群組 2 閘道；連接埠安全與 DHCP snooping | TB-01、TB-02 |
| `Z-STUDENT` | 僅 `VP-HQ-DSW-A03` 上的 VLAN 70 | HSRP 群組 3 閘道，除獲准的跳板主機路徑外，無任何離開該網段的路由 | TB-09、TB-10 |
| `Z-EGRESS` | 兩台核心之間的 VLAN 50、nftables 對組與 ASA inside | nftables 高可用對組（`vpnz-nft01/02`，VIP 10.10.50.10）—— 真正已配置的 Linux | TB-02、TB-03 |
| `Z-DMZ` | `VP-HQ-FW-01` 後方的 VLAN 90 | **ASA 是 DMZ 預設閘道**（10.10.90.1），執行 TB-04、TB-05、TB-13、TB-15 | TB-04、TB-05、TB-13、TB-15 |
| `Z-WAN` | `VP-ISP-EDGE-01`；VLAN 100 上的 `/30` 連線 | `VP-HQ-EDGE-01` 上的 eBGP 前綴控制；ASA outside ACL | TB-06、TB-14 |
| `Z-REMOTE` | IPsec 對等端 `VP-WC-EDGE-01` outside 203.0.113.5 | ASA crypto map 與已修補的 IKEv2 標頭 | TB-11、TB-12 |

此表附帶兩項聲明：**ASA 是 DMZ 閘道，且不得為其他任何裝置**（兩台多層交換器上均無 VLAN 90 的 SVI，且 VLAN 90 未以幹道連接至任何面向使用者的交換器）；以及 **`Z-STUDENT` 的隔離並非由防火牆執行** —— 它依賴路由的缺失加上一項明確的拒絕，這比內聯防火牆為弱，並已如此記錄在案。

---

### 9.4 裝置清單與佈線

#### 9.4.1 裝置、型號與軟體清單

確切的 IOS/ASA 映像字串在擬案階段尚未知悉。基準文件將其記錄為 **[UNCERTAIN]**，並施加一項建置日行動：於首個建置日在每台裝置上擷取 `show version`，並在版本偏差小節中記錄實際字串。

| 裝置 | 基準型號預期 | 預期軟體字串 | 使用的介面 | 角色 |
|---|---|---|---|---|
| `VP-HQ-CORE-01`、`VP-HQ-CORE-02` | Cisco 多層（L3）交換器 | 隨 Packet Tracer 版本綑綁的 Cisco IOS 15.2 系列映像 | 8 / 6 | 總部核心，OSPF，HSRP 作用中／待命，RSTP 根橋／次級根橋 |
| `VP-HQ-DSW-A01`–`A04`（四台獨立裝置） | Cisco 24 埠接取交換器 | 同上 | 1 上行 + 12 / 12 / 6 / 12 接取 | 總部接取層，見 §9.4.2 |
| `VP-HQ-EDGE-01` | Cisco ISR 級路由器 | Cisco IOS 15.2（PT 綑綁） | 4 LAN + 4 WAN | 總部廣域網路邊緣，eBGP，再分佈，NAT |
| `VP-HQ-FW-01` | **Cisco ASA 5506-X** | **ASA 9.16(4)** | 3 + 管理 | DMZ 與周邊防火牆 |
| `VP-BR-EDGE-01` | Cisco ISR 級路由器 | Cisco IOS 15.2（PT 綑綁） | 1 WAN + 4 子介面 | 觀塘路由器，OSPF 支線 |
| `VP-BR-DSW-A01` | Cisco 24 埠接取交換器 | 同上 | 1 上行 + 8 接取 | 觀塘接取 |
| `VP-MO-EDGE-01` | Cisco ISR 級路由器 | Cisco IOS 15.2（PT 綑綁） | 1 WAN + 2 子介面 | 澳門路由器，EIGRP 100 |
| `VP-MO-DSW-A01` | Cisco 24 埠接取交換器 | 同上 | 1 上行 + 4 接取 | 澳門接取 |
| `VP-WC-EDGE-01` | Cisco ISR 級路由器 | Cisco IOS 15.2（PT 綑綁） | 1 outside + 2 子介面 | 灣仔路由器，IPsec 對等端，AS 65021 |
| `VP-WC-DSW-A01` | Cisco 24 埠接取交換器 | 同上 | 1 上行 + 4 接取 | 灣仔接取 |
| `VP-ISP-EDGE-01` | Cisco ISR 級路由器 | Cisco IOS 15.2（PT 綑綁） | 3 | 模擬的供應商邊緣，AS 65000 |
| `VP-HQ-VOICE-01` | Cisco ISR 級路由器 | Cisco IOS 15.2（PT 綑綁） | 1 | VLAN 45 中的 CUCM Express |

於建置日從每台裝置讀取的 `show version` 字串均逐字記錄；報告必須陳述實際的建置版本，而非上述預期。

#### 9.4.2 介面層級連線表

位址逐字取自權威基準文件。廣域網路子網 `10.10.100.4/30`（總部邊緣 ↔ 後備供應商邊緣）**已**配置位址：`VP-HQ-EDGE-01` 取用 10.10.100.5，`VP-ISP-EDGE-01 gi0/1` 取用 10.10.100.6，此依基準文件 §5.2 之列及 Rev 1.1 裁決 C-03。先前關於未配置位址的說明現已撤回。

| 裝置 | 介面 | 位址 | 連接至 | 備註 |
|---|---|---|---|---|
| `VP-HQ-EDGE-01` | `Loopback0` | 10.255.0.21/32 | — | OSPF 與 BGP 路由器 ID 來源 |
| | `gi0/0` | 10.10.100.1/30 | `VP-ISP-EDGE-01 gi0/0` 10.10.100.2/30 | 主要供應商；eBGP AS 65000 |
| | `gi0/1` | 192.0.2.2/30 | 模擬 ISP / outside 網段 | 第二個 eBGP 連線及 ASA outside 交接 |
| | `gi0/2` | 10.10.100.33/30 | `VP-BR-EDGE-01 gi0/1` 10.10.100.34/30 | 經 WAN1 的 OSPF area 0 |
| | `gi0/3` | 10.10.100.37/30 | `VP-MO-EDGE-01 gi0/1` 10.10.100.38/30 | EIGRP AS 100 網域邊界 |
| | `gi1/0` / `gi1/1` | 10.10.10.1/24 / 10.20.20.1/24 | `VP-HQ-CORE-01` 幹道（VLAN 10 / VLAN 20） | `LAN-HQ-CORE` / `MGMT-OOB` |
| | `gi1/2` / `gi1/3` | 10.10.30.253/24 / 10.10.40.253/23 | `VP-HQ-CORE-01` 幹道（VLAN 30 / VLAN 40） | HSRP 群組 1 / 群組 2 待命端位址 |
| `VP-HQ-CORE-01` | `Loopback0` | 10.255.0.11/32 | — | OSPF 路由器 ID；`ip ospf priority 200` |
| | `Vlan10` / `Vlan20` | 10.10.10.2/24 / 10.20.20.11/24 | 總部邊緣與核心轉送 | 轉送 SVI / 管理 SVI 與裝置位址 |
| | `Vlan30` / `Vlan40` / `Vlan70` / `Vlan80` | 10.10.30.1/24 / 10.10.40.1/23 / 10.70.0.1/24 / 10.10.80.1/24 | — | HSRP 群組 1–4 作用中（150） |
| | `Vlan45` / `Vlan50` / `Vlan60` | 10.10.45.1/24 / 10.10.50.1/28 / 10.10.60.1/24 | — | 語音（option 066 = 10.10.45.11）／對外（下一跳 nftables VIP 10.10.50.10）／保留 |
| | `gi1/0/1` | 幹道，原生 999 | `VP-HQ-CORE-02 gi1/0/1` | 核心幹道；允許 10,20,30,40,45,50,60,70,80,90,999 |
| | `gi1/0/2` | 幹道，原生 999 | `VP-HQ-EDGE-01` | 核心至邊緣的 VLAN 10 幹道 |
| | `gi1/0/3`–`gi1/0/6` | 幹道，原生 999 | `VP-HQ-DSW-A01`–`A04` 上行 | 允許 10,40,999 / 10,40,999 / 10,20,70,999 / 10,30,45,50,60,80,90,999 |
| `VP-HQ-CORE-02` | `Loopback0` | 10.255.0.12/32 | — | OSPF 路由器 ID；`ip ospf priority 100` |
| | `Vlan10` / `Vlan20` | 10.10.10.3/24 / 10.20.20.12/24 | — | 轉送與管理 SVI |
| | `Vlan30` / `Vlan40` / `Vlan70` / `Vlan80` | 10.10.30.2/24 / 10.10.40.2/23 / 10.70.0.2/24 / 10.10.80.2/24 | — | 群組 1–4 的 HSRP 待命（100） |
| | `gi1/0/1`、`gi1/0/3`–`gi1/0/6` | 幹道，原生 999 | 核心幹道；至 `DSW-A01`–`A04` 的第二條上行 | 提供 RSTP 必須在某一方向封鎖的替代路徑 |
| `VP-HQ-DSW-A01`、`A02` | `gi0/1` / `gi0/2` | 幹道，原生 999 | `CORE-01` / `CORE-02` 上行 | `gi0/1` 成本 4 優先值 64；`gi0/2` 成本 19 優先值 128 |
| | `gi0/3`–`gi0/14` | 接取 VLAN 40 | 總部工作站 | PortFast、BPDU Guard、連接埠安全 |
| `VP-HQ-DSW-A03` | `gi0/1` / `gi0/2` | 幹道，原生 999 | `CORE-01` / `CORE-02` 上行 | 僅允許 10,20,70,999 |
| | `gi0/3`–`gi0/5` | 接取 VLAN 20 | ASA 管理 10.20.20.32、跳板主機 | 管理 |
| | `gi0/6`–`gi0/8` | 接取 VLAN 70 | 隔離的實驗室端點 | 無離開該網段的路由 |
| `VP-HQ-DSW-A04` | `gi0/1` / `gi0/2` | 幹道，原生 999 | `CORE-01` / `CORE-02` 上行 | 允許 10,30,45,50,60,80,90,999 |
| | `gi0/3`–`gi0/6` | 接取 VLAN 30 | 伺服器環境 | — |
| | `gi0/7` | 接取 VLAN 45 | `VP-HQ-VOICE-01` 10.10.45.11 | 語音 |
| | `gi0/8`–`gi0/9` | 接取 VLAN 50 | nftables 對組、ASA inside | `Z-EGRESS` |
| | `gi0/10`–`gi0/11` | 接取 VLAN 80 | 儲存 | — |
| | `gi0/12`–`gi0/14` | 接取 VLAN 90 | DMZ 主機、ASA dmz 側 | `Z-DMZ` |
| | `gi0/15`–`gi0/16` | 接取 VLAN 60 | 保留 | 未部署 |
| `VP-BR-DSW-A01` | `gi0/1` | 經 `VP-BR-EDGE-01` 子介面的幹道 | `VP-BR-EDGE-01` | 允許 110,111,112,113,999 |
| | `gi0/3`–`gi0/5` / `gi0/6`–`gi0/8` / `gi0/9`–`gi0/10` / `gi0/11`–`gi0/12` | 接取 VLAN 110 / 111 / 112 / 113 | 分支工作站、電話、管理 | `gi0/12` = `vpnz-brdc01` 主機 NIC 10.10.113.11 |
| `VP-MO-DSW-A01` | `gi0/1`；`gi0/3`–`gi0/5` / `gi0/6`–`gi0/7` | 經 `VP-MO-EDGE-01` 的幹道；接取 VLAN 120 / 121 | `VP-MO-EDGE-01`；澳門工作站與電話 | 允許 120,121,999 |
| `VP-WC-DSW-A01` | `gi0/1`；`gi0/3`–`gi0/5` / `gi0/6`–`gi0/8` | 經 `VP-WC-EDGE-01` 的幹道；接取 VLAN 130 / 131 | `VP-WC-EDGE-01`；灣仔工作站與整合端點 | 允許 130,131,999 |

廣域網路與周邊連線：主要轉送 `VP-HQ-EDGE-01 gi0/0` ↔ `VP-ISP-EDGE-01 gi0/0`（eBGP 65001↔65000）；後備供應商段 `10.10.100.4/30`（`VP-HQ-EDGE-01` 10.10.100.5 ↔ `VP-ISP-EDGE-01 gi0/1` 10.10.100.6）；outside 網段 `VP-HQ-EDGE-01 gi0/1` 至 ASA outside 198.51.100.1/29；觀塘 WAN1 `gi0/2` ↔ `VP-BR-EDGE-01 gi0/1`（OSPF）；澳門 `gi0/3` ↔ `VP-MO-EDGE-01 gi0/1`（EIGRP）；替代供應商至 `VP-ISP-EDGE-01 gi0/2` 10.10.100.42/30（eBGP 65001↔65002）；ASA dmz 10.10.90.1/24 至 VLAN 90 上的 `VP-HQ-DSW-A04` 接取埠；ASA inside 10.10.50.2/28（VLAN 50 `TRANSIT-EGRESS` `10.10.50.0/28`，可用 .1-.14）至 VLAN 50 上的 `VP-HQ-DSW-A04` 接取埠，下一跳 10.10.50.10。

佈線以 Packet Tracer 的連線工具繪製，並擷取於圖 9.1。由於 Packet Tracer 是模擬器，纜線類型僅屬表面；報告不得聲稱曾使用或測試任何特定的實體介質。

---

### 9.5 基礎裝置設定與標準化

#### 9.5.1 標準範本

十六台裝置中的每一台在配置任何協定之前，均先套用以下基準設定。範例為 `VP-HQ-CORE-01`；主機名稱與管理位址則按裝置替換。

```cisco
! ===== BASELINE TEMPLATE — apply to every Packet Tracer device =====
hostname VP-HQ-CORE-01
ip domain name vertexpeak.fyp.lab
no ip domain lookup
enable algorithm-type scrypt secret <REDACTED-ENABLE-SECRET>
service password-encryption
username adm-net01 privilege 15 algorithm-type scrypt secret <REDACTED>
username adm-net02 privilege 15 algorithm-type scrypt secret <REDACTED>
username svc_monitoring privilege 1 algorithm-type scrypt secret <REDACTED>
! [ASSUMPTION / LIMITATION] No TACACS+ server exists in this project, so
! `group tacacs+` can never succeed and authentication always resolves through
! `local`. AAA is configured; the external AAA server is NOT part of this
! deliverable and the report says so.
aaa new-model
aaa authentication login default group tacacs+ local
aaa authentication login CONSOLE local
aaa authorization exec default local
aaa accounting exec default start-stop group tacacs+
line console 0
 login authentication CONSOLE
 exec-timeout 5 0
 logging synchronous
line vty 0 15
 login authentication default
 transport input ssh
 exec-timeout 5 0
 logging synchronous
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3
crypto key generate rsa general-keys modulus 2048
! 2048 bits is the design minimum; [ASSUMPTION] 4096 is preferred where the
! simulator supports it. Record the actual modulus from
! `show crypto key mypubkey rsa`.
no ip http server
no ip http secure-server
no service pad
no service finger
ip access-list standard ACL-MGMT-IN-10
 remark [permit management only from Z-MGMT 10.20.20.0/24]
 permit 10.20.20.0 0.0.0.255
 remark [permit automation and monitoring from vpnz-mon01]
 permit host 10.10.30.31
 remark [permit read-only AI agent — TB-16]
 permit host 10.10.30.51
 deny   any log
line vty 0 15
 access-class ACL-MGMT-IN-10 in
banner motd ^C
***************************************************************************
*  Vertex Peak Financial Technologies Limited — PROPERTY OF VERTEX PEAK    *
*  Unauthorised access is prohibited and is logged. Authorised users only. *
*  All administrative actions are auditable (GG-Server-Admins/Tier0).      *
***************************************************************************
^C
service timestamps debug datetime msec localtime show-timezone
service timestamps log datetime msec localtime show-timezone
clock timezone HKT 8
ntp authentication-key 1 md5 <REDACTED>
ntp authenticate
ntp trusted-key 1
ntp server 10.10.30.11 key 1 prefer
ntp server 10.10.30.12 key 1
logging on
logging host 10.10.30.31
logging trap informational
logging source-interface Loopback0
logging buffered 16384 informational
snmp-server engineID local <REDACTED-ENGINE-ID>
snmp-server view VIEW-FYP-RO iso included
snmp-server group GRP-FYP-RO v3 priv read VIEW-FYP-RO
snmp-server user svc_monitoring GRP-FYP-RO v3 auth sha <REDACTED> priv aes 128 <REDACTED>
snmp-server host 10.10.30.31 version 3 priv svc_monitoring
snmp-server location "Vertex Peak HQ - Sha Tin"
snmp-server contact "IT Network Engineering Workstream"
snmp-server enable traps snmp linkdown linkup coldstart warmstart authentication
snmp-server enable traps syslog
cdp run
cdp timer 60
cdp holdtime 180
lldp run
ip default-gateway 10.20.20.1
interface Vlan20
 description [to Z-MGMT VLAN20 MGMT-OOB]
 ip address 10.20.20.11 255.255.255.0
 no shutdown
end
write memory
```

#### 9.5.2 強化設定及其各自的重要性

| 設定 | 重要性 |
|---|---|
| `enable algorithm-type scrypt secret` | 純 `enable password` 以可逆方式儲存，並可經 Type 7 編碼還原；scrypt 是單向雜湊，之所以選用而非 MD5，是因為破解 MD5 輕而易舉 |
| 每位管理員具名的 `privilege 15` 帳戶 | 基準文件禁止共用帳戶：每一項管理動作都必須可歸屬於 `adm-{initials}`。每台裝置上有兩個管理員帳戶，另加一個唯讀監控帳戶 |
| 權限 1 的 `svc_monitoring` | 監控身分必須能讀取計數器，除此之外別無其他權限 |
| `service password-encryption` | 對殘餘的明文機密（例如 NTP 金鑰）提供縱深防禦。此設定明確**不**被視為保護；本設計改為依賴不儲存可還原的機密 |
| `aaa new-model` 並配以 `local` 後備 | 集中式策略配以可存續的本機後備，使遺失 AAA 伺服器時不致讓整個環境無法登入自身的裝置 |
| `transport input ssh` | Telnet 以明文傳送憑證；關閉它是網絡裝置上價值最高的傳輸層控制 |
| `ip ssh version 2`、RSA 2048（曾嘗試 4096） | SSH v1 在密碼學上已被破解並已停用；主機金鑰是每一段管理工作階段的根基，而過短的模數構成實際的偽造風險 |
| `ip ssh time-out 60` / `authentication-retries 3` | 限制互動式登入的暴力破解時間窗 |
| `exec-timeout 5 0`、`logging synchronous` | 無人看管的已認證連線是一條被接管的途徑；同步記錄可防止非請求的輸出打亂管理員的命令列，屬變更作業上的完整性控制 |
| `banner motd` | 法律與稽核告示；它聲明存取會被記錄，而若日誌日後被用作證據，這是必要的 |
| `no ip domain lookup` | 防止打錯的命令觸發 DNS 查詢而使 CLI 停滯 |
| `no ip http server`、`no ip http secure-server`、`no service pad`、`no service finger` | 未使用的網頁與舊式管理服務是龐大的攻擊面，且在本設計中毫無作用 |
| `clock timezone HKT 8` 加上已認證的 NTP | 正確時間是一項安全控制：Kerberos 在時差超過五分鐘時失效，而沒有正確時間就無法進行日誌關聯 |
| `logging host 10.10.30.31`、`logging trap informational` | 沒有集中式日誌，被拒絕的封包或失敗的登入不會留下任何證據；此設定同時供給監控線與 AI 線 |
| 僅使用 SNMPv3 `authPriv` | SNMPv2c 的 community string 屬明文，已被基準文件禁止 |
| `access-class ACL-MGMT-IN-10 in` | 將互動式管理限制於 `Z-MGMT`、自動化節點及唯讀 AI 代理 —— 在裝置上執行 TB-07 與 TB-16 |
| `cdp run`、`lldp run` | CDP 是 WSOS 點名的探索工具，對相鄰裝置的文件記錄很有用；它同時也是偵察輔助手段，故已訂明相關政策（§9.13.1） |
| 所有未使用連接埠的 `shutdown`（VLAN 999） | 未受監控 VLAN 上的一個開放連接埠，是進入一棟大樓網絡最廉價的途徑 |
| 受限的 trap 集合（`linkdown`、`linkup`、…） | 全類別的 trap 只是雜訊，而雜訊會摧毀監控線所需的訊號 |
| 設定歸檔 | 每台裝置的設定均匯出為文字檔並提交至 Git；至 `vpnz-mon01:/srv/tftp/` 的 TFTP 已在真實環境上示範 |

---

### 9.6 VLAN、幹道與生成樹

#### 9.6.1 VLAN 規劃的實作

VLAN 識別碼與名稱採用權威基準文件的字串並確切輸入，因為自動化線與監控線正是以這些名稱進行比對。

```cisco
! --- HQ core and HQ access switches ----------------
vlan 10
 name LAN-HQ-CORE
vlan 20
 name MGMT-OOB
vlan 30
 name SRV-HQ-1
vlan 40
 name USER-HQ-STF
vlan 45
 name VOICE-HQ
vlan 50
 name TRANSIT-EGRESS
vlan 60
 name SRV-HQ-2
vlan 70
 name STUDENT-LAB
vlan 80
 name STORAGE-HQ
vlan 90
 name DMZ-HQ
vlan 999
 name UNUSED-BLACKHOLE
! VLAN 1 exists by default and carries no traffic: never a native VLAN, never
! assigned to an access port, never in an allowed list.
! --- VP-BR-DSW-A01: 110 BR-SALES, 111 BR-STAFF, 112 BR-VOICE, 113 BR-MGMT, 999 UNUSED-BLACKHOLE
! --- VP-MO-DSW-A01: 120 MO-LAN, 121 MO-VOICE, 999 UNUSED-BLACKHOLE
! --- VP-WC-DSW-A01: 130 WC-LAN, 131 WC-DEV, 999 UNUSED-BLACKHOLE
! --- Access port template (VLAN 40 user ports, VP-HQ-DSW-A01) ----------
interface range gi0/3-14
 description [to HQ workstation VLAN40 Z-USER]
 switchport mode access
 switchport access vlan 40
 switchport nonegotiate
 switchport port-security
 switchport port-security maximum 2
 switchport port-security mac-address sticky
 switchport port-security violation restrict
 switchport port-security aging time 60
 spanning-tree portfast
 spanning-tree bpduguard enable
 no shutdown
! --- Black-hole every unused port on every switch ----------------------
interface range gi0/15-24
 description [UNUSED - blackholed VLAN999]
 switchport mode access
 switchport access vlan 999
 switchport nonegotiate
 shutdown
```

四項特徵使此規劃站得住腳而非徒具裝飾：(1) **VLAN 40 是 `/23`**（`10.10.40.0/23`），因為 110 名總部員工加上增長空間，無法在 `/24` 中裝進一個乾淨的 DHCP 集區，故兩台核心均承載 `10.10.40.1/23` 與 `10.10.40.2/23`，並在 `10.10.40.254` 上執行 HSRP；(2) **VLAN 90 未以幹道連接至任何使用者交換器，且在兩台核心上均無 SVI** —— `10.10.90.1` 的 ASA 就是 DMZ 閘道，這是 DMZ 邊界的機制，而不僅是意圖；(3) **VLAN 20 位於 `10.20.20.0/24`，刻意置於 `10.10.0.0/16` 之外**，使生產空間中的路由錯誤無法暴露管理網路；(4) **VLAN 70 位於 `10.70.0.0/16`**，同樣互不重疊，其隔離由路由的缺失加上 §9.12 中的明確拒絕條款共同執行。

#### 9.6.2 802.1Q 幹道

每一條幹道均以原生 VLAN **999 `UNUSED-BLACKHOLE`** 承載，絕不使用 VLAN 1，並附有明確的允許 VLAN 清單。

```cisco
! --- VP-HQ-CORE-01 trunk template --------------------------------
interface gi1/0/1
 description [to VP-HQ-CORE-02 Gi1/0/1 VLAN10 Z-CORE]
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40,45,50,60,70,80,90,999
 switchport nonegotiate
 no shutdown
! Repeat on gi1/0/2 (to VP-HQ-EDGE-01, allowed 10,20,30,40,999) and
! gi1/0/3-6 (to VP-HQ-DSW-A01-A04, allowed lists per the table below).
```

| 幹道 | 允許的 VLAN | 該清單的理由 |
|---|---|---|
| 核心對核心（`gi1/0/1`） | 10,20,30,40,45,50,60,70,80,90,999 | 必須承載任一核心所服務的任何 VLAN；這是唯一的跨核心路徑 |
| 核心至 `DSW-A01`/`A02` | 10,40,999 | 那些交換器僅服務使用者 VLAN 40；其他任何 VLAN 只會增加不必要的廣播域 |
| 核心至 `DSW-A03` | 10,20,70,999 | 僅管理與隔離實驗室。**此處不允許任何使用者 VLAN** —— 這使 `Z-MGMT` 遠離使用者接取交換器 |
| 核心至 `DSW-A04` | 10,30,45,50,60,80,90,999 | 伺服器、語音、對外、儲存與 DMZ 網段 |
| 核心至 `VP-HQ-EDGE-01` | 10,20,30,40,999 | 邊緣路由器需要使用者與伺服器 VLAN，以進行 HSRP 追蹤及分階段路由設計 |
| 分支／小型辦公室幹道 | 110–113,999 / 120,121,999 / 130,131,999 | 僅分支 VLAN；**任何總部 VLAN 均不會延伸至分支** —— 站點之間的流量均經路由 |

**為何使用原生 VLAN 999。** 原生 VLAN 中的 802.1Q 訊框以未標籤方式傳送。VLAN 1 在每台 Cisco 交換器上預設存在，且是預設的原生*與*管理 VLAN，這使它成為 VLAN 跳躍及不同網段意外互連的經典途徑。將原生 VLAN 設為一個專用的未使用 VLAN，可從每個真實網段移除未標籤路徑，並且若有兩條不匹配的幹道相接時，會立即產生明顯的警報（CDP 原生 VLAN 不匹配訊息）—— 此診斷手段在 §9.16 中被刻意使用。**為何使用明確的允許清單。** 預設會允許每一個 VLAN，因此新增的 VLAN 會自行傳播到每條幹道；明確的清單使該傳播成為一項決策，並限制生成樹變更的影響範圍。**為何使用 `switchport nonegotiate`。** DTP 會廣播幹道意願；在面向工作站的接取埠，或隔離的 `STUDENT-LAB` 網段上，該廣播等於邀請對方協商建立幹道。

#### 9.6.3 快速生成樹（RSTP / IEEE 802.1w）

**為何使用 RSTP 而非經典 STP。** 四台接取交換器各有雙線連接至兩台核心，因而在每台接取交換器處形成實體迴路。若無生成樹，VLAN 40 上的單一廣播訊框將不斷循環，直到鏈路飽和（§9.16）。經典 802.1D 的收斂時間約為 30–50 秒；IEEE 802.1w 引入 proposal/agreement 交握、同步的埠角色及立即轉送邊緣埠，在真實硬體上把復原縮短至次秒或數秒級的事件。對於失敗測試包含「拔掉一條上行線並量測使用者被中斷多久」的設計而言，RSTP 是恰當的機制。

| 角色 | 意義 | 狀態 | 在此出現的位置 |
|---|---|---|---|
| 根（Root） | 通往根橋的最低成本路徑 | Forwarding | 朝向根橋側的核心上行；在接取交換器上，則是朝向擔任根橋之核心的唯一上行 |
| 指定（Designated） | 網段上的最佳埠，負責轉送並發送 BPDU | Forwarding | 每個網段一個 —— 由核心朝向各接取交換器的下行埠 |
| 替代（Alternate） | 根埠的備份，隨時可接手 | Discarding | 每台接取交換器上的第二條上行 —— 使雙線歸屬發揮作用的埠 |
| 備份（Backup） | 同一橋接器上某個指定埠的備份 | Discarding | 此處預期不會出現；若出現即表示設定錯誤，並已如此記錄 |
| 停用（Disabled） | 管理上關閉或失效 | Down | 已關閉的 VLAN 999 埠 |

RSTP 的三種狀態為 `Discarding`、`Learning` 與 `Forwarding`；經典的 `Blocking` 與 `Listening` 已合併入 `Discarding`，而本章一律使用 `Discarding`。

```cisco
! ===== VP-HQ-CORE-01 — deliberate root bridge for the HQ VLANs =====
spanning-tree mode rapid-pvst
spanning-tree vlan 10,20,30,40,45,50,60,70,80,90,999 root primary
spanning-tree vlan 10,20,30,40,45,50,60,70,80,90,999 priority 4096
spanning-tree portfast bpduguard default
spanning-tree loopguard default
! ===== VP-HQ-CORE-02 — deliberate secondary root =====
spanning-tree mode rapid-pvst
spanning-tree vlan 10,20,30,40,45,50,60,70,80,90,999 root secondary
spanning-tree vlan 10,20,30,40,45,50,60,70,80,90,999 priority 8192
spanning-tree portfast bpduguard default
spanning-tree loopguard default
! ===== All eight access switches =====
spanning-tree mode rapid-pvst
! ===== Access-switch uplink role control — VP-HQ-DSW-A01 =====
interface gi0/1
 description [to VP-HQ-CORE-01 Gi1/0/3 VLAN40 Z-CORE - PRIMARY ROOT PATH]
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,40,999
 spanning-tree vlan 10,40 cost 4
 spanning-tree vlan 10,40 port-priority 64
 spanning-tree guard root
 no shutdown
interface gi0/2
 description [to VP-HQ-CORE-02 Gi1/0/3 VLAN40 Z-CORE - ALTERNATE]
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,40,999
 spanning-tree vlan 10,40 cost 19
 spanning-tree vlan 10,40 port-priority 128
 spanning-tree guard root
 no shutdown
```

| VLAN | 主要根橋（優先值 4096） | 理由 | 次級根橋（8192） |
|---|---|---|---|
| 10 `LAN-HQ-CORE` | `VP-HQ-CORE-01` | 轉送流量會抵達 `VP-HQ-EDGE-01`，而該處纜線接至 `CORE-01`；在此紮根可使轉送路徑維持單一跳點 | `VP-HQ-CORE-02` |
| 20 `MGMT-OOB` | `VP-HQ-CORE-01` | 管理不應依賴被管理的交換器本身；與轉送相同的推理 | `VP-HQ-CORE-02` |
| 30 `SRV-HQ-1` | `VP-HQ-CORE-01` | HSRP 群組 1 的作用中裝置是 `CORE-01`；將 L2 拓撲紮根於同一台交換器，可使 L2 路徑與 L3 閘道位於同一裝置，避免經核心幹道髮夾迴繞 | `VP-HQ-CORE-02` |
| 40 `USER-HQ-STF` | `VP-HQ-CORE-01` | 同 VLAN 30 —— HSRP 群組 2 的作用中裝置是 `CORE-01` | `VP-HQ-CORE-02` |
| 45 `VOICE-HQ` | `VP-HQ-CORE-01` | 語音對延遲敏感；可預測的單一跳點路徑比分擔負載更重要 | `VP-HQ-CORE-02` |
| 50 `TRANSIT-EGRESS` | `VP-HQ-CORE-01` | 最具安全相關性的網段：寧取一條已知的轉送路徑，而非負載分擔的路徑 | `VP-HQ-CORE-02` |
| 60 `SRV-HQ-2` | `VP-HQ-CORE-01` | 保留；為求一致性仍設定根橋，使實際部署任何項目時拓撲已然正確 | `VP-HQ-CORE-02` |
| 70 `STUDENT-LAB` | `VP-HQ-CORE-01` | 該隔離網段的閘道（HSRP 群組 3）是 `CORE-01` | `VP-HQ-CORE-02` |
| 80 `STORAGE-HQ` | `VP-HQ-CORE-01` | iSCSI 具突發性且對延遲敏感；主要路徑避開核心幹道 | `VP-HQ-CORE-02` |
| 90 `DMZ-HQ` | `VP-HQ-CORE-01` | VLAN 90 在兩台核心上均無 SVI；在此紮根僅是使 L2 路徑具確定性 | `VP-HQ-CORE-02` |
| 999 `UNUSED-BLACKHOLE` | — | 不承載任何流量，且其所有埠均已關閉。**未套用任何根橋調校，這是刻意為之** —— 沒有可最佳化之處，而調校的缺席本身也已記錄在案 | — |

成本不對稱（4 對 19）使接取交換器的根埠成為通往*主要*根橋的上行，而非埠編號的偶然結果，並使角色指派具確定性，因而可被除錯。

| 防護 | 套用位置 | 防止 | 違反時的行為 |
|---|---|---|---|
| `spanning-tree portfast` | 所有終端使用者與終端裝置的接取埠 | 工作站、電話或伺服器埠須等待通過 STP 狀態機（這也會導致 DHCP 逾時） | 連接埠立即進入轉送 |
| `spanning-tree bpduguard enable` | 所有終端使用者接取埠，逐埠並全域套用 | 使用者插入交換器、集線器或未經授權的 AP 並注入改變拓撲的 BPDU | 連接埠進入 `err-disabled`，事件記入 syslog；復原須人工進行，因而可稽核 |
| `spanning-tree guard root` | 接取交換器上所有面向核心的下行埠，以及兩台核心面向接取的埠 | 惡意裝置贏得根橋選舉，並將園區流量導引經由其自身 | 連接埠進入 root-inconsistent（丟棄），並在冒犯性 BPDU 停止後自動復原 |
| `spanning-tree loopguard default` | 核心與接取交換器 | 單向鏈路失效，否則會使某個埠誤以為可安全轉送，從而形成迴路 | 連接埠進入 loop-inconsistent（丟棄） |

```text
VP-HQ-DSW-A01# show spanning-tree vlan 40
VLAN0040
  Spanning tree enabled protocol rstp
  Root ID    Priority    4096      Address 0001.64a2.9c01
             Cost        4         Port 1 (GigabitEthernet0/1)
  Bridge ID  Priority    32768  (priority 32768 sys-id-ext 40)
             Address     0002.17b3.8d01
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Root FWD 4         64.1     P2p
Gi0/2               Altn BLK 19        128.2    P2p
Gi0/3               Desg FWD 19        128.3    P2p Edge
Gi0/4               Desg FWD 19        128.4    P2p Edge

! What this proves: Root ID priority 4096 shows CORE-01 won the election by
! configuration, not by accident; Gi0/1 is Root FWD at cost 4 while Gi0/2 is
! Altn BLK, showing the cost/port-priority tuning took effect; the access ports
! show P2p Edge, showing PortFast is active. Packet Tracer may display the
! `Altn` role as `BLK` rather than the 802.1w term `Discarding` -- a rendering
! choice, not a protocol difference. Any convergence time derived from these
! events is a simulation artefact.
```

#### 9.6.4 EtherChannel / LACP —— 已聲明的省略及真實設備的等效設定

**本設計不使用 EtherChannel、LACP 或 PAgP，這是決策而非疏忽。** 基準文件訂明硬體層不得有高可用性 —— 不跨實體機箱使用 LACP —— 而整個 Cisco 環境皆為模擬，故聚合兩條模擬鏈路只會增加設定表面、不會帶來真正的頻寬效益（並無真實轉送），且會誤述實際已示範的內容。

> WSOS 2026 在 `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.` 這條條文中點名 `LACP` 與 `PAgP`。本專案**並未示範 LACP 或 PAgP**，因為 Packet Tracer 8.2.2 中的多層交換器型號不支援 Port-Channel 設定，且專案自身的限制條件排除了 LACP 存在所要提供的實體層備援。鏈路備援改由**配備 RSTP 的雙線歸屬接取交換器**（§9.6.3）及 **HSRP**（§9.7.2）示範。LACP 與 PAgP 已記錄為已聲明的缺口，並列為在真實設備上建議的第一步未來工作，且絕不得出現在已交付功能清單中。

**軌道 B —— 僅適用真實設備，未執行：**

```cisco
! ===== TRACK B — REAL EQUIPMENT ONLY. NOT EXECUTED IN PACKET TRACER. =====
! 2-member LACP port-channel, VP-HQ-CORE-01 to VP-HQ-CORE-02, VLAN 10 transit
interface range gi1/0/1, gi1/0/11          ! VP-HQ-CORE-01 (active side)
 description [to VP-HQ-CORE-02 VLAN10 Z-CORE - LACP PORT-CHANNEL]
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40
 channel-protocol lacp
 channel-group 1 mode active
 no shutdown
interface port-channel 1
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,40
 spanning-tree vlan 10,20,30,40 cost 4
 no shutdown
interface range gi1/0/1, gi1/0/11          ! VP-HQ-CORE-02 (passive side)
 channel-protocol lacp
 channel-group 1 mode passive
! Verification on real equipment: show etherchannel summary;
! show etherchannel 1 port-channel; show lacp neighbor; show interfaces port-channel 1
! PAgP equivalent: `channel-protocol pagp` with `channel-group 1 mode desirable`
! (or `auto` on the passive side). PAgP is Cisco-proprietary and would be used
! only where both ends are Cisco; LACP is preferred because it is the open
! standard and because the WSOS names both.
```

#### 9.6.5 驗證

```text
VP-HQ-CORE-01# show vlan brief
VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Gi1/0/8, Gi1/0/9, Gi1/0/10
10   LAN-HQ-CORE                      active    Gi1/0/1, Gi1/0/2, Gi1/0/3
20   MGMT-OOB                         active
30   SRV-HQ-1                         active
40   USER-HQ-STF                      active
45   VOICE-HQ                         active
50   TRANSIT-EGRESS                   active
60   SRV-HQ-2                         active
70   STUDENT-LAB                      active
80   STORAGE-HQ                       active
90   DMZ-HQ                           active
999  UNUSED-BLACKHOLE                 active    Gi1/0/12, Gi1/0/13
1002 fddi-default                     act/unsup
1003 token-ring-default               act/unsup
1004 fddinet-default                  act/unsup
1005 trnet-default                    act/unsup

VP-HQ-CORE-01# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi1/0/1     on           802.1q         trunking      999
Gi1/0/2     on           802.1q         trunking      999
Gi1/0/3     on           802.1q         trunking      999
Gi1/0/4     on           802.1q         trunking      999
Gi1/0/5     on           802.1q         trunking      999
Gi1/0/6     on           802.1q         trunking      999
Port        Vlans allowed on trunk
Gi1/0/1     10,20,30,40,45,50,60,70,80,90,999
Gi1/0/2     10,20,30,40,999
Gi1/0/3     10,40,999
Gi1/0/4     10,40,999
Gi1/0/5     10,20,70,999
Gi1/0/6     10,30,45,50,60,80,90,999
Port        Vlans in spanning tree forwarding state and not pruned
Gi1/0/1     10,20,30,40,45,50,60,70,80,90,999
Gi1/0/3     10,40,999

VP-HQ-DSW-A01# show spanning-tree summary
Switch is in rapid-pvst mode
Root bridge for: none
PortFast BPDU Guard Default  is enabled
Loopguard Default            is enabled
Name                   Blocking Listening Learning Forwarding STP Active
---------------------- -------- --------- -------- ---------- ----------
VLAN0010               1        0         0        1          2
VLAN0040               1        0         0        4          5

! What to look for: every Native vlan must read 999 -- a 1 anywhere is a
! defect. "Vlans allowed on trunk" must match §9.6.2 exactly; a VLAN appearing
! where it should not (VLAN 40 on the DSW-A03 uplink) is a segmentation defect.
! A VLAN allowed but absent from "spanning tree forwarding state" is being
! blocked by STP on that trunk: expected on the alternate uplink, unexpected on
! the primary. The single Blocking port on VLAN 40 is the design working -- the
! alternate uplink. If ZERO ports are discarding on a VLAN with two uplinks
! from one access switch to two cores, either the second uplink is not trunking
! that VLAN or a protection feature has disabled it (§9.16).
```

---

### 9.7 VLAN 間路由與首跳冗餘

#### 9.7.1 多層交換器上的 SVI

VLAN 間路由由兩台核心多層交換器上的 SVI 執行。總部 VLAN 並不採用單臂路由器（router-on-a-stick）；`VP-HQ-EDGE-01` 的子介面存在，是為了分階段路由設計及 HSRP 追蹤，而非因為邊緣路由器是 VLAN 間的路徑。

| VLAN | `CORE-01` 上的 SVI | `CORE-02` 上的 SVI | HSRP VIP（預設閘道） |
|---|---|---|---|
| 10 `LAN-HQ-CORE` | 10.10.10.2/24 | 10.10.10.3/24 | —（閘道為 `VP-HQ-CORE-01 gi0/1.10` 上的 10.10.10.1） |
| 20 `MGMT-OOB` | 10.20.20.11/24 | 10.20.20.12/24 | —（閘道為 `VP-HQ-CORE-01 gi0/1.20` 上的 10.20.20.1） |
| 30 `SRV-HQ-1` | 10.10.30.1/24 | 10.10.30.2/24 | **10.10.30.254**（HSRP 群組 1） |
| 40 `USER-HQ-STF` | 10.10.40.1/23 | 10.10.40.2/23 | **10.10.40.254**（HSRP 群組 2） |
| 70 `STUDENT-LAB` | 10.70.0.1/24 | 10.70.0.2/24 | **10.70.0.254**（HSRP 群組 3） |
| 80 `STORAGE-HQ` | 10.10.80.1/24 | 10.10.80.2/24 | **10.10.80.254**（HSRP 群組 4） |
| 45 `VOICE-HQ` | 10.10.45.1/24 | — | —（單一閘道；該工具為專用路由器） |
| 50 `TRANSIT-EGRESS` | 10.10.50.1/28 | — | —（對外下一跳為 nftables VIP 10.10.50.10） |
| 60 `SRV-HQ-2` | 10.10.60.1/24 | — | —（保留且未部署） |

基準文件固定了四個 VIP；群組對 VLAN 的指派（1→30、2→40、3→70、4→80）依循基準文件自身 VIP 摘要的順序，並標示為 **[ASSUMPTION]**，因為該處並未述明任何具體的群組編號。

> **基準文件的矛盾已由 Rev 1.1 裁決 C-14 解決。** §4.1 的單一群組 1 無法服務其自身 VIP 摘要所列的四個 SVI。此處實作的四群組對應已**獲批准，並現已成為基準值**：群組 1 對應 VLAN 30、群組 2 對應 VLAN 40、群組 3 對應 VLAN 70、群組 4 對應 VLAN 80。本章實作**四個群組（1–4）**，使每個 VLAN 都有自己的虛擬 MAC（群組 2 → `0000.0c07.ac02`、群組 3 → `.ac03`、群組 4 → `.ac04`，依 HSRPv1 公式推導，並在經 `show standby` 確認前標示為 **[ASSUMPTION]**），而**群組 1 完整保留基準文件的虛擬 MAC 與優先值 150**。

#### 9.7.2 HSRP 設定與故障切換行為

交換器 SVI 選用 HSRP 而非 VRRP，因為它是 Cisco IOS 原生功能且基準文件已予固定；VRRP 則以 Linux 對組上的 Keepalived 形式出現，報告將其呈現為廠商原生與開源之間的刻意分工。GLBP **並未**使用：它可提供真正的逐主機負載平衡，但模擬器無法忠實支援，而聲稱支援將是不誠實的（已聲明的缺口，§9.2.4）。

```cisco
! ===== VP-HQ-CORE-01 — HSRP ACTIVE (priority 150, preempt) =====
interface Vlan30
 description [SRV-HQ-1 HSRP-ACTIVE group1 Z-SERVER]
 ip address 10.10.30.1 255.255.255.0
 standby 1 ip 10.10.30.254
 standby 1 priority 150
 standby 1 preempt delay minimum 30
 standby 1 timers 1 3
 standby 1 authentication md5 key-string <REDACTED-HSRP-KEY>
 standby 1 name HSRP-SRVHQ1
 standby 1 track gi1/0/3 20
 standby 1 track gi1/0/1 30
 no shutdown
interface Vlan40
 description [USER-HQ-STF HSRP-ACTIVE group2 Z-USER]
 ip address 10.10.40.1 255.255.254.0
 standby 2 ip 10.10.40.254
 standby 2 priority 150
 standby 2 preempt delay minimum 30
 standby 2 timers 1 3
 standby 2 authentication md5 key-string <REDACTED-HSRP-KEY>
 standby 2 name HSRP-USERHQ
 standby 2 track gi1/0/3 20
 standby 2 track gi1/0/4 20
 standby 2 track gi1/0/1 30
 no shutdown
! VLAN 70 group 3 (10.70.0.254, name HSRP-LAB) and VLAN 80 group 4
! (10.10.80.254, name HSRP-STORAGE): identical pattern, tracking the
! respective access uplink with decrement 20.

! ===== VP-HQ-CORE-02 — HSRP STANDBY (priority 100) =====
interface Vlan30
 ip address 10.10.30.2 255.255.255.0
 standby 1 ip 10.10.30.254
 standby 1 priority 100
 standby 1 preempt delay minimum 30
 standby 1 timers 1 3
 standby 1 authentication md5 key-string <REDACTED-HSRP-KEY>
 standby 1 name HSRP-SRVHQ1
 standby 1 track gi1/0/3 20
 no shutdown
! VLANs 40, 70 and 80: identical statements with CORE-02's SVI addresses,
! priority 100, groups 2/3/4 and the matching names and tracked uplinks.
```

| 要素 | 設定 | 理由 |
|---|---|---|
| 群組編號 | 1→VLAN 30、2→40、3→70、4→80 | 每個 VLAN 一個群組；單一群組無法服務四個 SVI。群組 1 保留固定的虛擬 MAC `0000.0c07.ac01`。**已由 Rev 1.1 裁決 C-14 批准 —— 屬基準值，並非假設** |
| 作用中／待命優先值 | `CORE-01` 為 150，`CORE-02` 為 100 | 高於預設的 100，故 `CORE-01` 在健康時永遠勝出：此結果是配置出來的，而非選舉產生的。讓待命端維持 100 使意圖顯而易見並保留餘裕 |
| `preempt` | 雙方均啟用，`delay minimum 30` | 搶佔使復原後的 `CORE-01` 取回角色，而非一直滯留為待命。延遲可防止它在路由協定與介面收斂之前搶佔 —— 搶佔過早的裝置會使流量落入黑洞（§9.16） |
| 計時器 | `1 3`（hello 1 秒，hold 3 秒） | `3 10` 的預設值對一個要量測故障切換的設計而言太慢；1 秒 hello 可將偵測控制在三秒之內，同時仍在 HSRP 支援的範圍內 |
| 認證 | 每個群組均使用 MD5 金鑰字串 | 若無認證，該網段上的任何主機都能送出更高優先值的 hello 並奪取虛擬 IP |
| 追蹤 | 接取上行遞減 20，核心幹道遞減 30 | 若 `CORE-01` 失去通往接取交換器的幹道，它就不應再擔任其閘道；這些遞減值使 150 降至 `CORE-02` 的 100 之下，強制立即故障切換，而非形成黑洞 |
| 虛擬 MAC | `0000.0c07.ac01` 群組 1、`.ac02` 群組 2、`.ac03` 群組 3、`.ac04` 群組 4（**[VERIFIED]** —— Rev 1.1 裁決 C-14） | HSRPv1 公式 `0000.0c07.acXX`，其中 XX 為群組的十六進位值。HSRPv2（`0000.0c9f.fXXX`）未使用，以維持模擬器能忠實重現的 HSRPv1 語義 |

**故障切換序列。** 當 `VP-HQ-CORE-01` 失效或失去其上行時：(1) `CORE-02` 停止收到受影響群組的 hello，以 `timers 1 3` 計最多需三秒；(2) 已處於優先值 100 且未見更高優先值 hello 的 `CORE-02`，由 `Standby` 轉為 `Active`，並以虛擬 MAC 回應該虛擬 IP 的 ARP；(3) `CORE-02` 送出無償 ARP（gratuitous ARP），使主機立即更新其快取 —— 已快取虛擬 MAC 的主機無須重新 ARP，這是首跳冗餘協定相較於純路由替代方案的主要優勢；(4) STP 同時重新收斂，`CORE-02` 成為總部各 VLAN 的根橋（因其已是 `root secondary`，故選舉立即完成），而每台接取交換器的替代上行成為其根埠；(5) OSPF 在核心鏈路上重新收斂，`CORE-01` 的公告被撤回，但由於兩台核心公告相同的 VLAN 子網，流量仍可抵達能夠為其路由的核心。

**關於收斂時間的預期，誠實陳述。** 在真實設備上，該轉換會以 hold 計時器（三秒）加上 ARP 更新為界。**在 Packet Tracer 中，所量測的區間屬模擬產物。** 報告將失敗測試呈現為*行為*結果 —— 「VIP 已移轉、接取交換器保持連通、`CORE-02` 上的 `show standby brief` 顯示 `Active`」—— 並聲明模擬器所顯示的經過時間並非真實世界的收斂數據。

#### 9.7.3 驗證

```text
VP-HQ-CORE-01# show standby brief
                     P indicates configured to preempt.
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Vl30        1    150 P Active  local           10.10.30.2      10.10.30.254
Vl40        2    150 P Active  local           10.10.40.2      10.10.40.254
Vl70        3    150 P Active  local           10.70.0.2       10.70.0.254
Vl80        4    150 P Active  local           10.10.80.2      10.10.80.254

VP-HQ-CORE-02# show standby brief
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Vl30        1    100 P Standby 10.10.30.1      local           10.10.30.254
Vl40        2    100 P Standby 10.10.40.1      local           10.10.40.254
Vl70        3    100 P Standby 10.70.0.1       local           10.70.0.254
Vl80        4    100 P Standby 10.10.80.1      local           10.10.80.254

VP-HQ-CORE-01# show standby vlan 40
Vlan40 - Group 2
  State is Active
    8 state changes, last state change 00:42:17
  Virtual IP address is 10.10.40.254
  Active virtual MAC address is 0000.0c07.ac02
    Local virtual MAC address is 0000.0c07.ac02 (v1 default)
  Hello time 1 sec, hold time 3 sec
    Next hello sent in 0.416 secs
  Preemption enabled, delay min 30 secs
  Active router is local
  Standby router is 10.10.40.2, priority 100 (expires in 2.176 sec)
  Priority 150 (configured 150)
    Track interface GigabitEthernet1/0/1 state Up decrement 30
    Track interface GigabitEthernet1/0/3 state Up decrement 20
    Track interface GigabitEthernet1/0/4 state Up decrement 20
  Group name is "HSRP-USERHQ" (default)
  Authentication MD5, key-string

! --- Failover demonstration, in five steps ---------------------------
! Step 1 — baseline: ping 10.10.40.254 replies from a VLAN 40 workstation
!          and the ARP entry shows 0000.0c07.ac02.
! Step 2 — inject the failure:
VP-HQ-CORE-01(config)# interface range vlan 30-40, vlan 70-80
VP-HQ-CORE-01(config-if-range)# shutdown
! Step 3 — observe on the standby:
VP-HQ-CORE-02# show standby brief
!   -> Vl30 Grp 1 Pri 100 P Active 10.10.30.1 local 10.10.30.254
!   -> Vl40 Grp 2 Pri 100 P Active 10.10.40.1 local 10.10.40.254
!   -> Vl70 Grp 3 Pri 100 P Active 10.70.0.1  local 10.70.0.254
!   -> Vl80 Grp 4 Pri 100 P Active 10.10.80.1 local 10.10.80.254
VP-HQ-CORE-02# show standby vlan 40
!   -> State is Active; Active virtual MAC address is 0000.0c07.ac02
!   -> Active router is local; Standby router is unknown
! Step 4 — prove the user never had to change anything: on the workstation,
!          `ipconfig` still shows Default Gateway 10.10.40.254 and
!          `ping 10.10.40.254` replies, now served by VP-HQ-CORE-02.
! Step 5 — restore and prove PREEMPTION:
VP-HQ-CORE-01(config)# interface range vlan 30-40, vlan 70-80
VP-HQ-CORE-01(config-if-range)# no shutdown
!   After the 30-second preempt delay, show standby brief shows
!   Vl40 Grp 2 Pri 150 P Active local -- the VIP returned to the
!   higher-priority router because `preempt` requires it, NOT because the
!   standby gave it up.
```

| 注入的失敗 | 預期結果 | 證據 |
|---|---|---|
| `CORE-01` 的 SVI 關閉 | 四個群組均在 hold 計時器時窗內於 `CORE-02` 上成為 `Active`；使用者預設閘道不變；ping 持續 | 兩台交換器在切換前後的 `show standby brief`；工作站的 `ipconfig` 與 ping |
| `CORE-01` 的接取上行 `gi1/0/3` 失效（已追蹤，遞減 20） | 優先值降至 130 —— 仍高於 100，故**單一上行遺失時不會故障切換**，這是刻意的：失去兩條上行之一不應移動閘道 | `show standby vlan 40` 顯示遞減後的優先值及已追蹤介面為 `Down` |
| 核心幹道 `gi1/0/1` 失效（已追蹤，遞減 30） | 優先值降至 120；仍為作用中。當幹道**與**一條上行同時失效時，優先值降至 100 以下並發生故障切換 —— 此即設計的門檻 | `show standby` 顯示兩項已追蹤介面及由此得出的優先值 |
| `CORE-01` 完全斷電 | 立即故障切換；`CORE-02` 接管所有群組；`CORE-01` 重新上電後於 30 秒後搶佔取回 | 三個時間點的 `show standby brief` |

最後一列區分了兩種失敗類別，也是本設計論證的核心：失去兩條上行之一**不應**移動閘道（那只會增加一次不必要的故障切換事件），而失去核心幹道則必須移動閘道。以不同遞減值進行追蹤，正是把這一區別表達在設定中而非行文之中。

---

### 9.8 OSPF —— 總部至分支的內部路由網域

#### 9.8.1 設計

總部與觀塘的內部路由協定為 **OSPFv2，單一區域 0** —— 本設計的主要 IGP，可直接引述至 `Provide enterprise-wide connectivity using internal and external gateway routing protocols such as OSPF, BGP and EIGRP`。

**區域設計。** 單一區域（area 0）。`VP-HQ-EDGE-01`、`VP-HQ-CORE-01` 與 `VP-HQ-CORE-02` 位於 area 0；觀塘 WAN1 鏈路（10.10.100.32/30）位於 area 0，使 `VP-BR-EDGE-01` 成為骨幹路由器而非區域邊界路由器。**本設計中沒有任何路由器是 ABR，`area range` 未出現於任何設定中，而基準文件對 OSPF area 0 的 area-range 註記已由 Rev 1.1 裁決 C-13 刪除。** 其取捨已述明：單一區域意味著沒有區域間彙總、沒有拓撲隱藏，但它把失敗域限制在 LSA 類型 1 與 2 加上外部路由 —— 正是一個 12 週專案能夠有把握地建置、破壞並記錄的範圍。進階 OSPF（超出單一 ABR 的多區域、NSSA/stub 調校、OSPFv3、MPLS）**未涵蓋**。

> **關於基準文件措辭的說明。** §3.4 將觀塘支線描述為 `OSPF area 0 area-range`，而 §11.3 則將設計描述為 `Single area 0 at HQ + Kwun Tong`。`area range` 是 ABR 命令，在介面全屬同一區域的路由器上不產生作用。本章實作單一區域設計，並將該措辭差異記錄為文件修訂項目以供修訂日誌之用，而非為了使該命令有意義而虛構第二個區域。

**路由器 ID** 取自基準文件 `10.255.0.0/24` 區塊中已分配的 loopback，故該識別碼在介面反覆啟閉之間保持穩定，並與 loopback 一併由 OSPF 公告：`VP-HQ-CORE-01` 10.255.0.11、`VP-HQ-CORE-02` 10.255.0.12、`VP-HQ-EDGE-01` 10.255.0.21（ASBR，`default-information originate`，**唯一的再分佈點**）、`VP-BR-EDGE-01` 10.255.0.31。`VP-MO-EDGE-01`（10.255.0.41）改為執行 EIGRP；`VP-WC-EDGE-01`（10.255.0.51）經 IPsec 使用靜態預設路由；`VP-ISP-EDGE-01`（10.255.0.61）僅使用 eBGP。

**area 0 中的網路：** 四個 loopback；`10.10.10.0/24`、`10.20.20.0/24`、`10.10.30.0/24`、`10.10.40.0/23`、`10.10.45.0/24`、`10.10.50.0/28`、`10.10.60.0/24`、`10.10.80.0/24`；`10.10.100.32/30`（WAN1）；以及 `10.10.110.0/24`–`10.10.113.0/24`。**`10.10.90.0/24` 刻意不由兩台核心公告** —— VLAN 90 由 ASA 擁有。

**刻意的選擇：介面層級設定，而非 `network` 語句。** 本設計以 `ip ospf 1 area 0` 在介面上配置 OSPF，理由有三。(1) `network` 語句是一種萬用字元比對，而打錯的萬用字元會無聲地在無人預期的介面上啟用 OSPF；介面層級設定是明確的，故 `show ip ospf interface brief` 即為完整的稽核。這在 `VP-HQ-CORE-01` 上最為重要，因為過寬的 `network 10.10.0.0 0.0.255.255 area 0` 會悄悄把管理與學生 VLAN 公告進路由網域 —— 這是安全缺陷而非單純打錯字。(2) 它是冪等的且可重複套用，這很重要，因為自動化線以 Git 中的檔案持有裝置設定；插入一條 `network` 語句需要先移除前一條，而長度不一的差異較難審閱。(3) 它把協定狀態保留在介面的其他屬性旁邊，使工程師閱讀 `interface Vlan40` 時，可在一處看到位址、描述、HSRP 與路由協定。凡必須被公告但絕不應形成鄰接關係的介面 —— 面向主機的 SVI 與 loopback —— 均配置為被動介面，這既是控制平面的安全措施，也是擴展性措施。

#### 9.8.2 設定

```cisco
! ===== VP-HQ-CORE-01 — OSPF area 0, interface-level configuration =====
router ospf 1
 router-id 10.255.0.11
 log-adjacency-changes detail
 passive-interface default
 no passive-interface Vlan10
 no passive-interface Loopback0
 auto-cost reference-bandwidth 10000
interface Loopback0
 description [LOOPBACK - OSPF ROUTER-ID Z-CORE]
 ip address 10.255.0.11 255.255.255.255
 ip ospf 1 area 0
 ip ospf network point-to-point
interface Vlan10
 description [LAN-HQ-CORE - OSPF AREA 0 TRANSIT Z-CORE]
 ip address 10.10.10.2 255.255.255.0
 ip ospf 1 area 0
 ip ospf priority 200
 ip ospf cost 10
 ip ospf hello-interval 10
 ip ospf dead-interval 40
 ip ospf network broadcast
 ip ospf authentication message-digest
 ip ospf message-digest-key 10 md5 <REDACTED-OSPF-KEY-10>
! Derived SVIs -- advertised but passive: no adjacencies on host VLANs.
! Vlan20 10.20.20.11/24, Vlan30 10.10.30.1/24, Vlan40 10.10.40.1/23,
! Vlan45 10.10.45.1/24, Vlan50 10.10.50.1/28, Vlan60 10.10.60.1/24,
! Vlan70 10.70.0.1/24, Vlan80 10.10.80.1/24: identical pattern -- address plus
! `ip ospf 1 area 0`, no other OSPF interface command (passive by default).

! ===== VP-HQ-CORE-02 — mirror of CORE-01, lower priority =====
router ospf 1
 router-id 10.255.0.12
 passive-interface default
 no passive-interface Vlan10
 no passive-interface Loopback0
 auto-cost reference-bandwidth 10000
interface Loopback0
 ip address 10.255.0.12 255.255.255.255
 ip ospf 1 area 0
 ip ospf network point-to-point
interface Vlan10
 ip address 10.10.10.3 255.255.255.0
 ip ospf 1 area 0
 ip ospf priority 100
 ip ospf cost 10
 ip ospf hello-interval 10
 ip ospf dead-interval 40
 ip ospf authentication message-digest
 ip ospf message-digest-key 10 md5 <REDACTED-OSPF-KEY-10>
! VLANs 20, 30, 40, 70, 80: ip ospf 1 area 0 declared and left passive.

! ===== VP-HQ-EDGE-01 — OSPF ASBR: HQ LANs plus default origination =====
router ospf 1
 router-id 10.255.0.21
 passive-interface default
 no passive-interface gi0/2
 no passive-interface gi1/0
 no passive-interface Loopback0
 auto-cost reference-bandwidth 10000
 default-information originate always metric 10 metric-type 2
 distance 110
interface gi0/2
 description [to VP-BR-EDGE-01 Gi0/1 WAN1 OSPF AREA 0 Z-WAN]
 ip address 10.10.100.33 255.255.255.252
 ip ospf 1 area 0
 ip ospf network point-to-point
 ip ospf cost 100
 ip ospf hello-interval 10
 ip ospf dead-interval 40
 ip ospf authentication message-digest
 ip ospf message-digest-key 10 md5 <REDACTED-OSPF-KEY-10>
interface Loopback0
 ip address 10.255.0.21 255.255.255.255
 ip ospf 1 area 0
 ip ospf network point-to-point
interface gi1/0
 description [to VP-HQ-CORE-01 TRUNK VLAN10 Z-CORE]
 encapsulation dot1Q 10 native
 ip address 10.10.10.1 255.255.255.0
 ip ospf 1 area 0
 ip ospf priority 50
 ip ospf cost 10
 ip ospf authentication message-digest
 ip ospf message-digest-key 10 md5 <REDACTED-OSPF-KEY-10>
! gi1/1 (VLAN 20, 10.20.20.1/24), gi1/2 (VLAN 30, 10.10.30.253/24) and
! gi1/3 (VLAN 40, 10.10.40.253/23) carry the address plus
! `ip ospf 1 area 0` and are passive.

! ===== VP-BR-EDGE-01 — Kwun Tong branch router, OSPF area 0 spoke =====
router ospf 1
 router-id 10.255.0.31
 passive-interface default
 no passive-interface gi0/1
 no passive-interface Loopback0
 auto-cost reference-bandwidth 10000
interface gi0/1
 description [to VP-HQ-EDGE-01 Gi0/2 WAN1 OSPF AREA 0 Z-WAN]
 ip address 10.10.100.34 255.255.255.252
 ip ospf 1 area 0
 ip ospf network point-to-point
 ip ospf cost 100
 ip ospf hello-interval 10
 ip ospf dead-interval 40
 ip ospf authentication message-digest
 ip ospf message-digest-key 10 md5 <REDACTED-OSPF-KEY-10>
interface Loopback0
 ip address 10.255.0.31 255.255.255.255
 ip ospf 1 area 0
 ip ospf network point-to-point
interface gi0/0.110
 description [BR-SALES Z-USER]
 encapsulation dot1Q 110
 ip address 10.10.110.1 255.255.255.0
 ip ospf 1 area 0
 ip helper-address 10.10.30.11
 ip helper-address 10.10.30.12
interface gi0/0.111
 description [BR-STAFF Z-USER]
 encapsulation dot1Q 111
 ip address 10.10.111.1 255.255.255.0
 ip ospf 1 area 0
 ip helper-address 10.10.30.11
 ip helper-address 10.10.30.12
interface gi0/0.112
 description [BR-VOICE Z-USER]
 encapsulation dot1Q 112
 ip address 10.10.112.1 255.255.255.0
 ip ospf 1 area 0
 ip helper-address 10.10.30.11
interface gi0/0.113
 description [BR-MGMT Z-MGMT]
 encapsulation dot1Q 113
 ip address 10.10.113.1 255.255.255.0
 ip ospf 1 area 0
```

分支沒有本地的 DHCP 權威：`vpnz-dc01` 與 `vpnz-dc02` 經廣域網路服務分支的範圍，而中繼位於分支子介面上。這是承襲自 Microsoft 線的刻意選擇，其後果 —— 若兩台總部 DC 與廣域網路同時失效，分支即失去 DHCP —— 已記錄於 §9.14。

#### 9.8.3 收斂與調校

| 參數 | 值 | 理由 | 若設定錯誤 |
|---|---|---|---|
| `hello-interval` | 廣播網段及點對點廣域網路鏈路均為 10 秒 | 使廣域網路維持 10/40 而非較慢的 30/120，意味著廣域網路失效與區域網路失效在相同時間內被偵測到，簡化測試計畫與失敗敘述；代價是在一條不承載其他流量的 `/30` 上略增 hello 流量 | hello 間隔不匹配會完全阻止鄰接關係形成 —— `show ip ospf neighbor` 不顯示任何項目，而 `debug ip ospf hello` 會回報不匹配（§9.16） |
| `dead-interval` | 40 秒（4 × hello） | 協定本身建議的比例。刻意**不**採用把它設為等於 hello 間隔（一種常見的快速收斂技巧）的做法，因為本設計偏好讀者能夠推理的接近預設行為 | 比 hello 間隔還短的 dead 間隔必定導致鄰接關係反覆啟閉 |
| `ip ospf priority` | `CORE-01 Vlan10` 為 200；`CORE-02 Vlan10` 為 100；`VP-HQ-EDGE-01 gi1/0` 為 50 | VLAN 10 廣播網段上的 DR/BDR 選舉必須可預測：`CORE-01` 為 DR、`CORE-02` 為 BDR、邊緣路由器為 DROther（正確，因為它在該處是葉節點，無須產生網路 LSA） | 優先值 0 使路由器不具 DR 資格 —— 刻意使用時有用，意外設定時危險 |
| 變更後的 DR/BDR | 不隨意執行 `clear ip ospf process` | OSPF 選舉不具搶佔性，故變更優先值不會移動 DR，除非鄰接關係重置。因此優先值在第一次鄰接形成**之前**即已配置；日後的變更則以已記錄的 `clear ip ospf process` 及擷取的變更前後對照來套用 | 變更優先值卻假定 DR 已移動的設計，將悄悄擁有錯誤的拓撲 |
| `auto-cost reference-bandwidth 10000` | 每台 OSPF 路由器均為 10 Gbps | IOS 預設的 100 Mbps 使每一條 100 Mbps 或更快的鏈路成本皆為 1，因而無從區分。在 10 Gbps 下，Gigabit Ethernet 成本為 10、Fast Ethernet 為 100，而廣域網路支線（明確設為成本 100）與區域網路的關係便合理。**此值在每台路由器上都必須相同** | 參考頻寬不一致是 OSPF 路由迴路的經典成因，因為兩台路由器可能各自認為另一條路徑更便宜 |
| `ip ospf cost` | VLAN 10 SVI 為 10；廣域網路支線為 100 | 使總部核心轉送便宜、廣域網路支線昂貴，故總部對總部的流量絕不會穿越廣域網路 | 讓廣域網路支線維持便宜，可能使 OSPF 偏好經分支的路徑 —— 既非最佳又難以察覺 |
| 公告 loopback 路由器 ID | 在 `Loopback0` 上配置 `ip ospf 1 area 0` 及 `ip ospf network point-to-point` | 一個不會因介面啟閉而改變的穩定路由器 ID，加上一個可達的 `/32`；明確的網路類型可阻止 OSPF 把該 loopback 公告為 stub network | 在測試中途改變的路由器 ID 會使證據中的每一份鄰居清單失效 |
| 認證 | 在每一個形成鄰接關係的 OSPF 介面上配置 `ip ospf authentication message-digest` 及 `ip ospf message-digest-key 10 md5` | 若無認證，任何能到達該網段的裝置都能形成鄰接並注入 LSA，從而掌控路由網域。MD5 金鑰鏈是模擬器可靠支援的方式；**SHA-256 是設計上的偏好，已嘗試並標示 `[ASSUMPTION]`** | 金鑰 ID 或金鑰字串不匹配會使鄰接關係停留在 `EXSTART`/`DOWN`（§9.16） |
| `passive-interface default` 配以明確的 `no passive-interface` | 每台 OSPF 路由器 | 反轉預設值是最可靠的方式，可確保沒有新介面意外送出 hello；此作法可引述至 `Apply basic security configuration for control and data plane` | 逐一將介面標為被動會以失效開放（fail open）的方式出錯：被遺忘的介面仍會參與 |
| `default-information originate always` | 僅在 `VP-HQ-EDGE-01` 上，度量 10，度量類型 2 | 總部的互聯網路徑以恰好由一台路由器產生的預設路由來表達。使用 `always` 是因為邊緣自身的預設路由來自 eBGP，而團隊希望即使其中一個 BGP 連線中斷仍能公告它（另一個仍存在）。度量類型 2 使外部成本不計入內部成本，故該預設路由的度量在整個環境中恆定 | 省略它會使每台 OSPF 路由器都沒有預設路由；在兩台路由器上產生它則使路徑不具確定性 |

**與本設計相關的 LSA。** 由於本設計為單一區域，出現的 LSA 類型可以窮盡列舉 —— 對於一個必須記錄其所見的專案而言，這是真正的優勢。

| LSA | 名稱 | 產生者 | 在此承載的內容 |
|---|---|---|---|
| 1 | Router LSA | 每台 OSPF 路由器 | 路由器自身的鏈路與成本（`show ip ospf database router`） |
| 2 | Network LSA | VLAN 10 廣播網段上的 DR —— 優先值 200 的 `VP-HQ-CORE-01` | 連接至該網段的路由器集合（`show ip ospf database network`） |
| 3 | Summary LSA | **未產生** —— 單一區域設計中不存在 ABR | 不存在；其缺席證實了區域設計 |
| 4 | ASBR summary LSA | **未產生**（無 ABR） | 不存在 |
| 5 | AS external LSA | 作為 ASBR 的 `VP-HQ-EDGE-01`：預設路由與再分佈的 EIGRP 前綴 | 標記為 `200` 的澳門 `/24`，加上預設路由 |
| 7 | NSSA external LSA | **未產生** —— 不存在 NSSA | 依設計不存在 |

#### 9.8.4 驗證

```text
VP-HQ-CORE-01# show ip ospf neighbor
Neighbor ID     Pri   State           Dead Time   Address         Interface
10.255.0.12     100   FULL/BDR        00:00:36    10.10.10.3      Vlan10
10.255.0.21      50   FULL/DROTHER    00:00:33    10.10.10.1      Vlan10
10.255.0.31       1   FULL/DR         00:00:38    10.10.100.34    Vlan10

VP-HQ-EDGE-01# show ip ospf neighbor detail
 Neighbor 10.255.0.31, interface address 10.10.100.34
    In the area 0 via interface GigabitEthernet0/2
    Neighbor priority is 1, State is FULL, 6 state changes
    DR is 10.10.100.34  BDR is 10.10.100.33
    Neighbor is up for 00:18:42
    Authentication Sequence: [ 0 ]
 Neighbor 10.255.0.11, interface address 10.10.10.2
    In the area 0 via interface GigabitEthernet1/0
    Neighbor priority is 200, State is FULL, 4 state changes
    DR is 10.10.10.2  BDR is 10.10.10.3

VP-HQ-EDGE-01# show ip ospf database
                Router Link States (Area 0)
Link ID         ADV Router      Age    Seq#       Checksum Link count
10.255.0.11     10.255.0.11     412    0x80000007 0x00A1B2 6
10.255.0.12     10.255.0.12     398    0x80000005 0x00C3D4 5
10.255.0.21     10.255.0.21     421    0x80000008 0x00E5F6 6
10.255.0.31     10.255.0.31     405    0x80000006 0x00A7B8 5
                Net Link States (Area 0)
Link ID         ADV Router      Age    Seq#       Checksum
10.10.10.2      10.255.0.11     412    0x80000003 0x00F1A2
                Type-5 AS External Link States
Link ID         ADV Router      Age    Seq#       Checksum Tag
0.0.0.0         10.255.0.21     421    0x80000002 0x0011AA 0
10.10.120.0     10.255.0.21     419    0x80000002 0x0022BB 200
10.10.121.0     10.255.0.21     417    0x80000002 0x0033CC 200

VP-HQ-EDGE-01# show ip route ospf
Gateway of last resort is 10.10.100.2 to network 0.0.0.0
O     10.10.110.0/24 [110/101] via 10.10.100.34, 00:18:42, GigabitEthernet0/2
O     10.10.111.0/24 [110/101] via 10.10.100.34, 00:18:42, GigabitEthernet0/2
O     10.10.112.0/24 [110/101] via 10.10.100.34, 00:18:42, GigabitEthernet0/2
O     10.10.113.0/24 [110/101] via 10.10.100.34, 00:18:42, GigabitEthernet0/2
O     10.255.0.11/32 [110/11] via 10.10.10.2, 00:18:39, GigabitEthernet1/0
O     10.255.0.12/32 [110/11] via 10.10.10.2, 00:18:39, GigabitEthernet1/0
O     10.255.0.31/32 [110/101] via 10.10.100.34, 00:18:42, GigabitEthernet0/2
```

**應留意的項目。** 每個鄰居都必須是 `FULL`；任何停留在 `INIT`、`2WAY`、`EXSTART` 或 `EXCHANGE` 的狀態都是故障（§9.16）。**在廣播網段上，兩台 DROther 路由器之間的 `2WAY` 是正常的，並非故障** —— 報告必須區分這些情況，因為把它們混為一談是最常見的 OSPF 診斷錯誤。鄰居 ID 是對端的 loopback，這正是「以 loopback 作為路由器 ID」慣例值得付出代價的原因。在資料庫中，四個 Router LSA 與**恰好一個** Network LSA 是 DR 選舉按設定運作的正向證據；**不存在任何 Type-3 或 Type-4 LSA**，這證明了單一區域設計 —— 出現 Type-3 意味著存在計畫外的 ABR，且文件有誤；兩個澳門前綴以 **Tag 200** 的 Type-5 外部路由出現，此即 §9.11 的防迴路機制，故它們的存在正是再分佈按設計運作的證據。分支的 `/24` 帶度量 101（廣域網路成本 100 加上分支子介面的 1），符合刻意的成本調校 —— 度量若為 1 就表示廣域網路成本調校未生效。澳門前綴在此**不會**以 `O` 路由出現；它們是 EIGRP 路由，而這正是設計所要的。

---

### 9.9 EIGRP —— 澳門／舊有網域

#### 9.9.1 設計與誠實的理由

澳門及一個「舊有併購」轉送網段執行 **EIGRP 經典模式，自治系統 100**。EIGRP 可直接引述至標準，故本專案並非在 WSOS 面前為它辯護，而是在良好工程實務面前為它辯護，並且必須誠實地如此做。

**誠實的理由。** 在單一企業內執行兩個內部閘道協定，就全新設計而言是一項缺陷：它使所需的維運知識加倍、使失敗模式加倍、產生一個可能使流量落入黑洞或形成迴路的再分佈邊界，且並未提供任何單一 IGP 所欠缺的能力。沒有稱職的設計者會刻意引入它，而本設計也沒有作此聲稱。它重現的是一個**真實而常見的情境**：某組織併購了一家網絡已在執行 EIGRP 的較小公司，而在併購當下進行遷移的成本與風險超過有限度共存的成本。基準文件正是如此框定 —— 作為一項*舊有共存需求*。由此得出三項後果，且三者均已述明。

1. **第二個協定是被圍堵的，而非被擴展的。** EIGRP 僅存在於恰好兩台裝置 —— `VP-MO-EDGE-01`，以及作為唯一再分佈點的 `VP-HQ-EDGE-01`。它不出現於任何總部核心交換器、任何接取交換器，也不在觀塘路由器上。若它出現在其他任何地方，圍堵的聲明便為虛假。
2. **此共存有已記錄的退場方案。** 正確的最終狀態是將澳門網段遷移至 OSPF area 0 並移除 EIGRP 程序；此已記錄為未來工作。把永久的雙 IGP 呈現為成就，等同把一項負債呈現為功能。
3. **再分佈是單向且附標籤的**（§9.11），這是使共存無須大量測試即可安全的唯一機制。

**AS 編號與模式。** AS 為 **100**，由基準文件固定。使用經典模式（`router eigrp 100`）而非具名模式，因為基準文件將具名模式在模擬器中記錄為 **[UNCERTAIN]**（其進階細節受限），且因為經典模式正是 WSOS 層級 Cisco 課程最先教授者，使讀者無須另作 `address-family` 語法的說明即可跟上設定。其取捨已述明：具名模式是更現代、能力更強的形式，真實部署會偏好採用。**圍堵機制：** 該程序僅存在於上述兩台指名裝置；在這些裝置之內，`passive-interface default` 加上明確的 `no passive-interface` 意味著 hello 僅在面向澳門的鏈路上送出；而該鏈路是一條 `/30` 點對點網段，其上並無其他裝置。

#### 9.9.2 設定

```cisco
! ===== VP-MO-EDGE-01 — Macau representative office, EIGRP AS 100 =====
router eigrp 100
 eigrp router-id 10.255.0.41
 network 10.255.0.41 0.0.0.0
 passive-interface default
 no passive-interface gi0/1
 no passive-interface Loopback0
 metric weights 0 1 0 1 0 0
 log-neighbor-changes
! Classic mode takes its network list from `network` statements, so the two
! Macau subnets are declared explicitly and narrowly. There is deliberately NO
! blanket `network 10.0.0.0` -- that would advertise the WAN link and make
! containment harder to prove.
 network 10.10.120.0 0.0.0.255
 network 10.10.121.0 0.0.0.255
 network 10.10.100.36 0.0.0.3
interface gi0/1
 description [to VP-HQ-EDGE-01 Gi0/3 WAN EIGRP AS100 Z-WAN]
 ip address 10.10.100.38 255.255.255.252
 bandwidth 2048
 delay 2000
! bandwidth in kbps; delay in tens of microseconds, so `delay 2000` is 20 ms
! one-way. These values are the design's declared representation of the Macau
! WAN link and MUST match on both ends, because EIGRP takes the MINIMUM of the
! two neighbours' bandwidth values when computing the metric.
 ip authentication mode eigrp 100 md5
 ip authentication key-chain eigrp 100 KC-EIGRP-WAN
 no shutdown
interface Loopback0
 description [LOOPBACK - EIGRP ROUTER-ID Z-CORE]
 ip address 10.255.0.41 255.255.255.255
interface gi0/0.120
 description [MO-LAN Z-USER]
 encapsulation dot1Q 120
 ip address 10.10.120.1 255.255.255.0
 ip helper-address 10.10.30.11
interface gi0/0.121
 description [MO-VOICE Z-USER]
 encapsulation dot1Q 121
 ip address 10.10.121.1 255.255.255.0
 ip helper-address 10.10.30.11

! ===== VP-HQ-EDGE-01 — the EIGRP side of the single redistribution point =====
router eigrp 100
 eigrp router-id 10.255.0.21
 passive-interface default
 no passive-interface gi0/3
 metric weights 0 1 0 1 0 0
! The HQ prefixes are advertised into EIGRP so Macau can reach HQ, declared
! explicitly one line per subnet. A wildcard summary is deliberately NOT used:
! a summarised advertisement would also carry the management (10.20.20.0/24)
! and lab (10.70.0.0/16) ranges into the legacy domain -- a security defect.
 network 10.10.10.0 0.0.0.255
 network 10.10.30.0 0.0.0.255
 network 10.10.40.0 0.0.1.255
 network 10.10.45.0 0.0.0.255
 network 10.10.50.0 0.0.0.15
 network 10.10.60.0 0.0.0.255
 network 10.10.80.0 0.0.0.255
 network 10.10.110.0 0.0.0.255
 network 10.10.111.0 0.0.0.255
 network 10.10.112.0 0.0.0.255
 network 10.10.113.0 0.0.0.255
interface gi0/3
 description [to VP-MO-EDGE-01 Gi0/1 WAN EIGRP AS100 Z-WAN - AUTH MD5]
 ip address 10.10.100.37 255.255.255.252
 bandwidth 2048
 delay 2000
 ip authentication mode eigrp 100 md5
 ip authentication key-chain eigrp 100 KC-EIGRP-WAN
 no shutdown
! --- EIGRP MD5 authentication, applied on BOTH ends of the WAN link ---
key chain KC-EIGRP-WAN
 key 1
  key-string <REDACTED-EIGRP-KEY>
  accept-lifetime 00:00:00 Jan 1 2026 infinite
  send-lifetime 00:00:00 Jan 1 2026 infinite
```

未經認證的 EIGRP 是真正的弱點：任何能到達該網段的裝置都能形成鄰接並注入路由，而且不同於 OSPF —— 在 OSPF 中惡意的 LSA 至少在連結狀態資料庫中可見 —— 被注入的 EIGRP 路由可能悄悄覆蓋合法路由。**hello 與 hold 計時器保留預設值**（點對點廣域網路網段上為 5 秒 hello、15 秒 hold），理由已述明：澳門是四人站點，而在一個僅為共存才執行的協定上加入非預設計時器，只會增加失敗模式而無相應效益。

#### 9.9.3 度量與調校

EIGRP 的複合度量源自頻寬、延遲、負載、可靠性與 MTU，並以 K 值為五者加權。預設值為 K1 = 1、K2 = 0、K3 = 1、K4 = 0、K5 = 0，故**只有頻寬與延遲會影響度量**；負載與可靠性雖保存在拓撲表中，但不影響路徑選擇，MTU 則未被使用。**本專案讓 `metric weights 0 1 0 1 0 0` 維持預設，並不操作 K 值**，理由有三：(1) 非預設的 K 值會破壞意見不一致的路由器之間的互通性，而 AS 內每個 EIGRP 發言者都必須使用相同的值，否則鄰接關係無法正確形成 —— 在此尚可存活，因為兩台裝置由同一團隊管理，但對任何接手此網絡的人來說都是陷阱；(2) 使用負載與可靠性會使度量隨瞬時狀況變動，從而使路徑選擇不具確定性，事後也無法就拓撲表進行推理，而對於一個以不同時間擷取的 `show` 輸出為證據的專案而言，確定性比最佳化更有價值；(3) WSOS 與 Cisco 課程均把 K 值操作視為進階診斷技術，而非設計工具。

| 參數 | 值 | 理由 | 若設定錯誤 |
|---|---|---|---|
| K 值 | 預設 `0 1 0 1 0 0` | 基於上述三項理由：確定性與互通性 | 鄰居之間的 K 值不匹配會妨礙正確的度量計算 |
| `bandwidth` | 兩端均為 2048 kbps | 所聲明的鏈路容量。EIGRP 採用兩端中**較低**者，故數值一致可使度量對稱且可預測 | 一端高於另一端會產生一個兩台裝置的設定都無法解釋的度量 |
| `delay` | 兩端均為 2000（數十微秒） | 所聲明的單向延遲。當頻寬較大時延遲主導度量，而在此即為 2 Mbps 對上 10 Gbps 參考頻寬的情況 | 延遲不正確會使備份路徑看似更可取 |
| `variance` | **未配置**（預設 1） | 非等成本負載平衡需要一條真正平行的路徑。通往澳門恰好只有一條廣域網路鏈路，故 `variance` 不會產生任何作用，配置它只屬盲目模仿（cargo-cult） | 在沒有第二條路徑的情況下設定 `variance` 不會改變任何事，故風險在於報告具誤導性而非網絡故障 |
| `maximum-paths` | 預設（4） | 只有一條路徑 | 無 |
| `passive-interface default` | 兩台 EIGRP 路由器 | 除廣域網路支線外，任何介面都不送出 hello —— 此即圍堵機制 | 若無此設定，EIGRP 會在澳門的區域網路網段及設計中不存在的總部子介面上形成鄰接 |
| `eigrp router-id` | `10.255.0.41` / `10.255.0.21` | 取自 loopback，與 OSPF 相同，使該識別碼穩定且自我說明 | 路由器 ID 變更會重置鄰接並使已擷取的證據失效 |

#### 9.9.4 驗證

```text
VP-MO-EDGE-01# show ip eigrp neighbors
EIGRP-IPv4 Neighbors for AS(100)
H   Address                 Interface              Hold Uptime   SRTT   RTO  Q  Seq
                                                   (sec)         (ms)       Cnt Num
0   10.10.100.37            Gi0/1                    12 00:21:35   24   200  0  14

VP-MO-EDGE-01# show ip eigrp topology
EIGRP-IPv4 Topology Table for AS(100)/ID(10.255.0.41)
Codes: P - Passive, A - Active, U - Update, Q - Query, R - Reply
P 10.10.120.0/24, 1 successors, FD is 28160
        via Connected, GigabitEthernet0/0.120
P 10.10.121.0/24, 1 successors, FD is 28160
        via Connected, GigabitEthernet0/0.121
P 10.10.100.36/30, 1 successors, FD is 2169856
        via Connected, GigabitEthernet0/1
P 10.10.10.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.30.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.40.0/23, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.50.0/28, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.80.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.110.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.111.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.112.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1
P 10.10.113.0/24, 1 successors, FD is 2297856
        via 10.10.100.37 (2297856/28160), GigabitEthernet0/1

VP-MO-EDGE-01# show ip route eigrp
Gateway of last resort is 10.10.100.37 to network 0.0.0.0
D     10.10.10.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.30.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.40.0/23 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.50.0/28 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.80.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.110.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.111.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.112.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
D     10.10.113.0/24 [90/2297856] via 10.10.100.37, 00:21:35, GigabitEthernet0/1
```

**應留意的項目。****恰好一個** EIGRP 鄰居：兩個就意味著圍堵設計失敗，而報告的單一邊界聲明將為虛假。`Q Cnt` 必須為 0；非零的佇列表示封包排入佇列的速度快於送出，在此會指向鏈路反覆啟閉或雙工不匹配，而非負載。Hold 值必須從所配置的 hold 時間向下計數，介於 1 與 15 之間。每一筆拓撲項目都必須標記為 `P`（Passive）；標記為 `A`（Active）的項目表示路由器失去了後繼者並正在查詢鄰居 —— EIGRP 的標誌性故障（§9.16）。`(FD/AD)` 配對必須滿足 AD < FD 該路由才可行；此處為 28160 < 2297856。注意哪些前綴**不在**其中：`10.20.20.0/24`（管理）與 `10.70.0.0/16`（隔離實驗室）並未出現，而它們的缺席正是明確且狹窄的 `network` 語句發揮作用的證據。內部 EIGRP 的管理距離 **90** 在再分佈點至關重要，因為 90 低於 OSPF 的 110 —— 這正是 §9.11 標籤策略存在的原因。所有路由共用同一度量，因為它們全都經由同一條廣域網路鏈路抵達，且無 K 值或延遲的差異化，這是刻意不操作度量的直接後果。

---

### 9.10 eBGP —— 外部對等連線

#### 9.10.1 設計

| 角色 | AS | 裝置 | 位址 |
|---|---|---|---|
| Vertex Peak（企業） | **AS 65001** | `VP-HQ-EDGE-01` | `gi0/0` 10.10.100.1/30；`gi0/1` 192.0.2.2/30 |
| 主要轉送供應商 | **AS 65000** | `VP-ISP-EDGE-01` | `gi0/0` 10.10.100.2/30；`gi0/2` 10.10.100.42/30 |
| 替代供應商 | **AS 65002** | `VP-ISP-EDGE-01`（第二個連線） | 依基準文件的替代供應商鏈路為 10.10.100.42/30 |
| 灣仔交付辦公室 | **AS 65021** | `VP-WC-EDGE-01` | outside 203.0.113.5/29 |

**單一歸屬或多重歸屬？** 本設計為**多重歸屬至兩個 eBGP 對等端**：基準文件的定址規劃分配了替代供應商子網（`10.10.100.40/30`，「總部邊緣 ↔ ISP 替代對等端（第二個 BGP 連線）」）。它**並非**兩個實體供應商，因為兩個連線都終結於同一台模擬裝置 —— 報告必須如此述明。兩個連線的價值在於它們示範了多重歸屬邊緣上最重要的兩項機制：以 `local-preference` 達成的確定性**對外**路徑選擇，使所有 Vertex Peak 流量在該連線存在期間一律經主要供應商離開，無論供應商如何公告其前綴；以及以次要連線上的 AS-path prepending 達成的確定性**對內**路徑選擇，使模擬供應商偏好經主要路徑回到 Vertex Peak 位址空間。

**此處採用 eBGP 的商業理由。**(1) **位址空間的擁有與可攜性** —— 若只對單一供應商設靜態預設路由，企業的公開前綴將由供應商擁有，且任何供應商變更都需重新編號；有了 eBGP 連線，Vertex Peak 公告自己的前綴（`198.51.100.0/24` 與 `203.0.113.0/29`，在本實驗室中兩者均為 RFC 5737 文件用範圍）並可攜其遷移。(2) **對回程路徑的影響力** —— 經紀商的盡職調查問卷要求一條可稽核且可預測的發布路徑，而決定入向流量使用哪條鏈路的是 BGP 屬性，而非期望。(3) **供應商中斷期間的韌性** —— 兩個連線配以基於屬性的偏好，意味著單一連線失效會使流量轉移而非落入黑洞，此已透過關閉主要連線並擷取前後的 `show ip bgp` 加以示範。

#### 9.10.2 設定

```cisco
! ===== VP-ISP-EDGE-01 — simulated transit provider, AS 65000 =====
router bgp 65000
 bgp router-id 10.255.0.61
 bgp log-neighbor-changes
 bgp deterministic-med
 no bgp default ipv4-unicast
 address-family ipv4 unicast
  ! A real transit provider would carry a full table; a bounded prefix set is
  ! used because Packet Tracer's BGP cannot model scale, and the report says so.
  redistribute static route-map RM-PROVIDER-ORIGINATE
  neighbor 10.10.100.1 remote-as 65001
  neighbor 10.10.100.1 description [to VP-HQ-EDGE-01 gi0/0 - CUSTOMER AS65001]
  neighbor 10.10.100.1 password <REDACTED-BGP-MD5>
  neighbor 10.10.100.1 send-community both
  neighbor 10.10.100.1 maximum-prefix 100 80 restart 15
  neighbor 10.10.100.1 route-map RM-PROV-IN in
  neighbor 10.10.100.1 route-map RM-PROV-OUT-PRIMARY out
  neighbor 10.10.100.1 activate
  neighbor 10.10.100.41 remote-as 65002
  neighbor 10.10.100.41 description [to VP-HQ-EDGE-01 - ALTERNATE AS65002]
  neighbor 10.10.100.41 password <REDACTED-BGP-MD5>
  neighbor 10.10.100.41 send-community both
  neighbor 10.10.100.41 maximum-prefix 100 80 restart 15
  neighbor 10.10.100.41 route-map RM-PROV-IN in
  neighbor 10.10.100.41 route-map RM-PROV-OUT-ALT out
  neighbor 10.10.100.41 activate
 exit-address-family
ip route 192.0.2.0 255.255.255.0 Null0
ip route 203.0.113.0 255.255.255.248 Null0
ip prefix-list PL-PROVIDER-ORIGINATE seq 5 permit 192.0.2.0/24
ip prefix-list PL-PROVIDER-ORIGINATE seq 10 permit 203.0.113.0/29
ip prefix-list PL-PROVIDER-ORIGINATE seq 15 deny 0.0.0.0/0 le 32
route-map RM-PROVIDER-ORIGINATE permit 10
 match ip address prefix-list PL-PROVIDER-ORIGINATE
 set community 65000:100
route-map RM-PROVIDER-ORIGINATE deny 20
! --- inbound: accept ONLY the customer's own aggregate prefixes -------
ip prefix-list PL-CUST-PREFIXES seq 5 permit 198.51.100.0/24
ip prefix-list PL-CUST-PREFIXES seq 10 permit 203.0.113.0/29
ip prefix-list PL-CUST-PREFIXES seq 15 deny 0.0.0.0/0 le 32
route-map RM-PROV-IN permit 10
 match ip address prefix-list PL-CUST-PREFIXES
route-map RM-PROV-IN deny 20
route-map RM-PROV-OUT-PRIMARY permit 10
! --- outbound: AS-path prepend on the alternate so downstream observers
!     prefer the primary path back in ----------------------------------
route-map RM-PROV-OUT-ALT permit 10
 set as-path prepend 65002 65002 65002

! ===== VP-HQ-EDGE-01 — Vertex Peak AS 65001, the enterprise edge =====
router bgp 65001
 bgp router-id 10.255.0.21
 bgp log-neighbor-changes
 bgp deterministic-med
 bgp bestpath as-path multipath-relax
 no bgp default ipv4-unicast
 address-family ipv4 unicast
  ! Only the two documentation-range prefixes are announced. This is the
  ! central design decision: advertise the enterprise's OWN aggregates.
  network 198.51.100.0 mask 255.255.255.0
  network 203.0.113.0 mask 255.255.255.248
  neighbor 10.10.100.2 remote-as 65000
  neighbor 10.10.100.2 description [to VP-ISP-EDGE-01 gi0/0 - PRIMARY AS65000]
  neighbor 10.10.100.2 password <REDACTED-BGP-MD5>
  neighbor 10.10.100.2 timers 10 30
  neighbor 10.10.100.2 send-community both
  neighbor 10.10.100.2 maximum-prefix 200 80 restart 15
  neighbor 10.10.100.2 route-map RM-EDGE-IN-PRIMARY in
  neighbor 10.10.100.2 route-map RM-EDGE-OUT out
  neighbor 10.10.100.2 activate
  neighbor 10.10.100.41 remote-as 65002
  neighbor 10.10.100.41 description [to VP-ISP-EDGE-01 - ALTERNATE AS65002]
  neighbor 10.10.100.41 password <REDACTED-BGP-MD5>
  neighbor 10.10.100.41 timers 10 30
  neighbor 10.10.100.41 send-community both
  neighbor 10.10.100.41 maximum-prefix 200 80 restart 15
  neighbor 10.10.100.41 route-map RM-EDGE-IN-ALT in
  neighbor 10.10.100.41 route-map RM-EDGE-OUT out
  neighbor 10.10.100.41 activate
 exit-address-family
ip route 198.51.100.0 255.255.255.0 Null0
ip route 203.0.113.0 255.255.255.248 Null0
! --- PREFIX POLICY: announce the enterprise's own aggregates and NOTHING else
ip prefix-list PL-EDGE-ANNOUNCE seq 5 permit 198.51.100.0/24
ip prefix-list PL-EDGE-ANNOUNCE seq 10 permit 203.0.113.0/29
! The RFC 1918 ranges are listed here so that their exclusion is explicit and
! auditable. They are NEVER advertised into BGP and never routed internally:
! 10.10.0.0/16 (which subsumes the HQ, branch and small-office space),
! 10.20.0.0/16 and 10.70.0.0/16 are this lab's own ranges, and 172.16.0.0/16
! is reserved head-room in the baseline that must not be allocated or routed.
ip prefix-list PL-EDGE-ANNOUNCE seq 15 deny 10.0.0.0/8 le 32
ip prefix-list PL-EDGE-ANNOUNCE seq 20 deny 172.16.0.0/12 le 32
ip prefix-list PL-EDGE-ANNOUNCE seq 25 deny 192.168.0.0/16 le 32
ip prefix-list PL-EDGE-ANNOUNCE seq 30 deny 0.0.0.0/0 le 32
! Inbound defence in depth: no RFC 1918 space from a provider, no default
! route, and the provider's own documented ranges only.
ip prefix-list PL-EDGE-IN-PRIMARY seq 5 permit 192.0.2.0/24
ip prefix-list PL-EDGE-IN-PRIMARY seq 10 permit 203.0.113.0/29
ip prefix-list PL-EDGE-IN-PRIMARY seq 20 deny 10.0.0.0/8 le 32
ip prefix-list PL-EDGE-IN-PRIMARY seq 25 deny 172.16.0.0/12 le 32
ip prefix-list PL-EDGE-IN-PRIMARY seq 30 deny 192.168.0.0/16 le 32
ip prefix-list PL-EDGE-IN-PRIMARY seq 35 deny 0.0.0.0/0
ip prefix-list PL-EDGE-IN-PRIMARY seq 40 deny 0.0.0.0/0 le 32
ip prefix-list PL-EDGE-IN-ALT seq 5 permit 192.0.2.0/24
ip prefix-list PL-EDGE-IN-ALT seq 10 permit 203.0.113.0/29
ip prefix-list PL-EDGE-IN-ALT seq 40 deny 0.0.0.0/0 le 32
! --- INBOUND ROUTE MAPS: this is where path preference is SET ------------
! The primary provider's routes get a HIGH local preference and every other
! inbound path a deliberately LOWER one. This makes outbound path selection
! independent of AS-path length and of MED, which is the only way to make it
! deterministic when two providers announce the same prefix differently.
route-map RM-EDGE-IN-PRIMARY permit 10
 match ip address prefix-list PL-EDGE-IN-PRIMARY
 set local-preference 200
 set community 65001:100 additive
route-map RM-EDGE-IN-PRIMARY deny 20
route-map RM-EDGE-IN-ALT permit 10
 match ip address prefix-list PL-EDGE-IN-ALT
 set local-preference 100
 set community 65001:200 additive
route-map RM-EDGE-IN-ALT deny 20
! --- OUTBOUND ROUTE MAP: announce only the enterprise aggregates --------
route-map RM-EDGE-OUT permit 10
 match ip address prefix-list PL-EDGE-ANNOUNCE
 set community 65001:1 additive
route-map RM-EDGE-OUT deny 20
```

**為何只公告特定前綴而非全部 —— 核心的設計決策。** 把整份路由表再分佈進 eBGP 是企業邊緣上最糟糕的錯誤，而本設計拒絕如此做，理由有四。(1) **內部前綴絕不該被公告。** 該環境包含 `10.10.0.0/16`、`10.20.0.0/16`（管理）與 `10.70.0.0/16`（刻意隔離的實驗室）；公告它們將使管理網路與實驗室從模擬互聯網可達，並以一條任何防火牆規則都無法撤銷的路由公告抵觸 TB-06、TB-09 與 TB-10，因為該公告會把流量引向一條防火牆並未管束的路徑。為兩個自有彙總而設的一條 `network` 語句，加上一條以 `deny 0.0.0.0/0 le 32` 結尾的對外前綴清單，使此事在結構上不可能發生，而非僅靠謹慎避免。(2) **只能公告企業自身的位址空間** —— 公告他人的前綴至少是設定錯誤，最壞情況則是路由劫持，而該對外清單僅含恰好兩條 permit，故即使從另一連線學到的供應商前綴被洩漏，也會被拒絕。(3) **公告集合應穩定且可審閱** —— 兩個前綴是一份審閱者以肉眼即可核對的策略；再分佈的路由表則是一份無人審閱的策略，意外洩漏正是如此發生。(4) **它符合情境** —— 該公司擁有其公開存在（入口網站、網頁農場、部落格、VPN 前門），全都在這兩個範圍之內，故其他任何東西都無須可達，也沒有其他任何東西被公告。

**`next-hop-self` 使用與不使用之處。** 此處所有 eBGP 連線均為直接連接，故所學路由的下一跳本已可達，在供應商鄰居上並不需要 `next-hop-self`；刻意**不**在它們上面配置，因為加入它會改變 MED／下一跳的比較邏輯而毫無效益。在 AS 65001 內部的任何 iBGP 連線上，它**則**會是必要的 —— 但本設計沒有 iBGP，因為 `VP-HQ-EDGE-01` 是企業 AS 中唯一的 BGP 發言者，而內部可達性是 OSPF 與 EIGRP 的職責。報告必須述明不存在 iBGP，因為假定存在 iBGP 全網狀的讀者會誤讀 `show ip bgp summary`。

**關於灣仔 AS 65021。** 基準文件指派 `VP-WC-EDGE-01` 為 AS 65021。本節記錄其設定*意圖*，但在擬案階段將該連線本身歸類為 **[ASSUMPTION]**：模擬的灣仔路由器能否在承載 IPsec 隧道的同時再承載第三個 BGP 連線，必須在第八週建置時確認並記錄結果。若不能，誠實的立場是灣仔經 IPsec 隧道從總部學習一條靜態預設路由 —— 而這正是基準文件 §3.4 所述的做法 —— 且 AS 65021 仍是一項已記錄但未經示範的設計要素。除非 `VP-WC-EDGE-01` 上的 `show ip bgp summary` 證明如此，報告不得把 AS 65021 列為運作中的 BGP 連線。

#### 9.10.3 路徑選擇

BGP 的最佳路徑演算法是一種嚴格排序的比較。此處只有最初的幾個步驟要緊，但仍逐步走過整個順序，使讀者能看出本設計為何產生其所產生的結果。

| 順序 | 屬性 | 在 AS 65001 中的設計立場 | 在此的效果 |
|---|---|---|---|
| 1 | Weight | **未配置。** Cisco 專有的本機覆寫值；在兩個直接連接且其路徑已因 local preference 而不同的對等端之間，它不增添任何作用 | 無效果 |
| 2 | **Local preference** | **來自 AS 65000 的一切為 200，來自 AS 65002 的一切為 100** | **這正是使對外路徑選擇具確定性的原因。** 兩個連線中都存在的前綴一律經主要供應商離開，且由於 local preference 是*在* AS-path 長度*之前*比較，供應商如何操弄其 AS path 都無法改變此結果 |
| 3 | 本機產生 | 兩條 `network` 語句使 `198.51.100.0/24` 與 `203.0.113.0/29` 成為本機產生 | 確保企業自有的彙總優先於學到的副本 |
| 4 | AS-path 長度 | 對外未加操弄；**替代連線在其送出的內容上前置 `65002 65002 65002`** | 這是為供應商的視角提供對內確定性，而非為 Vertex Peak |
| 5 | Origin code | `network` 語句產生 origin `i` | 不存在衝突，因為未使用將路由再分佈進 BGP 的做法 |
| 6 | MED | **企業端未配置。** 來自兩個不同供應商的 MED 依定義無從比較 | 無效果，並刻意如此述明，使報告不聲稱 BGP 並不遵守的、以 MED 為基礎的偏好 |
| 7 | eBGP 優先於 iBGP | 兩條路徑均為 eBGP | 無效果 |
| 8 | 至下一跳的 IGP 度量 | 兩個供應商都是等成本的直接連接 `/30` | 無效果 |
| 9 | 多路徑／最舊路徑／最低路由器 ID | 啟用 `bgp deterministic-med`，使來自同一 AS 的多條路徑之間的 MED 比較穩定；最舊路徑的決勝條件保留預設 | 屬確定性輔助，並非偏好機制 |

三項選擇使結果具確定性，值得整體述明：**實際發揮作用的是 local preference**，而非 AS-path 長度，因為 AS-path 長度在供應商的控制之下，而 local preference 在 Vertex Peak 的控制之下；**已啟用 `bgp deterministic-med`**，使兩條路徑共用一個鄰接 AS 時，更新的抵達順序不會改變比較結果 —— 若不啟用，MED 比較便取決於抵達順序，同一份設定可能在兩次不同場合產生兩個不同的最佳路徑，從而使證據無法重現；以及**在每個鄰居上配置帶有重啟計時器的 `maximum-prefix`**，使前綴洩漏或連線反覆啟閉無法耗盡路由器記憶體，其門檻刻意設得偏低（100/200），因為模擬的路由表極小，報告並註明真實世界的數值將取決於路由表規模。

#### 9.10.4 驗證

```text
VP-HQ-EDGE-01# show ip bgp summary
BGP router identifier 10.255.0.21, local AS number 65001
BGP table version is 12, main routing table version 12
6 network entries using 864 bytes of memory
7 path entries using 588 bytes of memory
Neighbor        V           AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd
10.10.100.2     4        65000     142     138       12    0    0 00:21:35        3
10.10.100.41    4        65002      98      95       12    0    0 00:14:02        2

VP-HQ-EDGE-01# show ip bgp
BGP table version is 12, local router ID is 10.255.0.21
Status codes: s suppressed, d damped, h history, * valid, > best, i - internal
Origin codes: i - IGP, e - EGP, ? - incomplete
     Network          Next Hop            Metric LocPrf Weight Path
 *>  192.0.2.0/24     10.10.100.2              0    200      0 65000 i
 *   192.0.2.0/24     10.10.100.41             0    100      0 65002 65002 65002 65002 i
 *>  198.51.100.0/24  0.0.0.0                  0    100  32768 i
 *   203.0.113.0/29   10.10.100.2              0    200      0 65000 i
 *>  203.0.113.0/29   10.10.100.41             0    100      0 65002 65002 65002 65002 i
 *>  203.0.113.0/24   0.0.0.0                  0    100  32768 i

VP-HQ-EDGE-01# show ip bgp neighbors 10.10.100.2 advertised-routes
     Network          Next Hop            Metric LocPrf Weight Path
 *>  198.51.100.0/24  0.0.0.0                  0    100  32768 i
 *>  203.0.113.0/24   0.0.0.0                  0    100  32768 i
Total number of prefixes 2

VP-HQ-EDGE-01# show ip route bgp
Gateway of last resort is 10.10.100.2 to network 0.0.0.0
B     192.0.2.0/24 [20/0] via 10.10.100.2, 00:21:35
B     203.0.113.0/29 [20/0] via 10.10.100.2, 00:21:35

! --- Failover demonstration ------------------------------------------
! Step 1 — baseline: both prefixes via 10.10.100.2 (show ip route bgp).
! Step 2 — kill the primary session:
VP-ISP-EDGE-01(config)# router bgp 65000
VP-ISP-EDGE-01(config-router)# address-family ipv4 unicast
VP-ISP-EDGE-01(config-router-af)# neighbor 10.10.100.1 shutdown
! Step 3 — observe on the enterprise edge:
VP-HQ-EDGE-01# show ip bgp summary
!   -> 10.10.100.2 shown with State/PfxRcd = Idle (or Active)
!   -> 10.10.100.41 still Established with its prefix count
VP-HQ-EDGE-01# show ip bgp
!   -> the `*>` best-path marker has MOVED to the 10.10.100.41 entries.
!      No configuration change was made: the algorithm promoted the next-best
!      path, which is the entire point of the exercise.
VP-HQ-EDGE-01# show ip route bgp
!   -> both prefixes now via 10.10.100.41
! Step 4 — restore:
VP-ISP-EDGE-01(config-router-af)# no neighbor 10.10.100.1 shutdown
VP-HQ-EDGE-01# show ip route bgp
!   -> traffic returns to the primary, again with no configuration change on
!      the enterprise edge, because local preference 200 > 100.
```

**應留意的項目。** 在 `show ip bgp summary` 中，`State/PfxRcd` 必須顯示**數字**而非字母狀態 —— 數字表示該連線已達到Established 並接受了那麼多前綴；須警惕的字串為 `Idle`、`Connect`、`Active`、`OpenSent` 與 `OpenConfirm`，各自有其明確成因（§9.16）。`InQ` 與 `OutQ` 必須為 0，且 `Up/Down` 必須持續增加。前綴計數（3 與 2）必須與入向前綴清單所允許者相符；在連線為 Established 的情況下計數為 0，表示入向路由對映拒絕了一切 ——這是一種無聲而危險的故障。在 `show ip bgp` 中，`*>` 標示最佳路徑：對 `192.0.2.0/24` 而言最佳路徑經由`10.10.100.2`，因為 local preference 為 200，替代路徑雖存在但未被選中 —— local preference 正完全如§9.10.3 所述般運作。在同一前綴的比較中，若最佳路徑標記**並未**依循 local preference 規則，則表示路由對映未命中，該輸出是**發現事項，而非成功**：以 `show ip bgp <prefix>` 與 `show route-map RM-EDGE-IN-PRIMARY`深入調查。Weight 32768 標示由兩條 `network` 語句本機產生的路由。替代連線上的 AS-path 顯示四個 `65002`項，而只配置了三個前置，因為供應商自身的 AS 也自然出現一次：在鏈路上的路徑是供應商的 AS 加上前置 ——此類細節報告必須解釋而非略過，因為預期看到三個項目的讀者會以為設定失敗。**在 `advertised-routes` 中，必須恰好出現兩個前綴**：數量更多意味著內部前綴正洩漏給供應商，本設計的核心 BGP 控制已然失敗，且在任何情況下都不得出現 `10.10.x.x`、`10.20.20.x` 或 `10.70.x.x` —— 那屬於 TB-06、TB-09 與 TB-10 的範疇。eBGP 的管理距離 **20** 低於 OSPF 的 110 與 EIGRP 的 90，故經 BGP 學到的路由會覆蓋前往同一前綴的 IGP路由：對外部可達性而言這是正確的，也正是內部前綴絕不可被 BGP 學到的原因。

故障切換測試必須記錄兩項發現。第一，**最佳路徑標記在企業路由器上毫無任何變更的情況下發生移動** —— 這是可取得的最強證明，說明本設計的路徑偏好是演算法及其屬性的性質，而非靜態路由的性質。第二，**Packet Tracer 所顯示的收斂時間屬模擬產物**；真實世界中邊緣的 BGP 故障切換主要取決於 hold 計時器（此處為 `timers 10 30`，即 10 秒 keepalive 與 30 秒 hold）加上供應商的撤回傳播，而該差異值得一句說明，而非編造一個毫秒數字。

---

### 9.11 路由再分佈與迴路防止

#### 9.11.1 唯一的再分佈點

基準文件以絕對措辭固定該策略，而本章確切實作：再分佈發生於**恰好一台裝置，`VP-HQ-EDGE-01`**；路由標籤為 **`100`（OSPF 產生的前綴）與 `200`（EIGRP 產生的前綴）**；再分佈為**每個前綴集單向進行**，禁止無標籤的相互再分佈；而管理距離**保留預設值**，報告述明本設計依賴這些預設值。

`VP-HQ-EDGE-01` 是正確的位置，也是唯一的位置，理由有三：它是唯一同時參與兩種內部協定的裝置；它是唯一也使用 eBGP 的裝置，故三個路由網域在一處交會，可作為一個單位審閱；且它是單一失效點，其失效是*可存續且有界的* —— 若它失效，總部保有 OSPF、觀塘保有 OSPF、澳門保有 EIGRP，只有跨網域的可達性喪失。若也在核心交換器上進行再分佈，將在同一對協定之間產生兩個相互再分佈點，正是教科書式的路由迴路成因。

#### 9.11.2 路由對映與標籤策略

```cisco
! ===== VP-HQ-EDGE-01 — THE SINGLE REDISTRIBUTION POINT =====
! OSPF process 1 (area 0) <--> EIGRP AS 100 <--> BGP AS 65001
! --- 1. Define exactly which prefixes cross the boundary, each way. Prefix
!        lists are used rather than an unfiltered `redistribute`, because an
!        unfiltered redistribution would carry the management (10.20.20.0/24)
!        and isolated-lab (10.70.0.0/16) ranges across the boundary.
ip prefix-list PL-HQ-SUBNETS seq 5  permit 10.10.10.0/24
ip prefix-list PL-HQ-SUBNETS seq 10 permit 10.10.30.0/24
ip prefix-list PL-HQ-SUBNETS seq 15 permit 10.10.40.0/23
ip prefix-list PL-HQ-SUBNETS seq 20 permit 10.10.45.0/24
ip prefix-list PL-HQ-SUBNETS seq 25 permit 10.10.50.0/28
ip prefix-list PL-HQ-SUBNETS seq 30 permit 10.10.60.0/24
ip prefix-list PL-HQ-SUBNETS seq 35 permit 10.10.80.0/24
ip prefix-list PL-HQ-SUBNETS seq 99 deny   0.0.0.0/0 le 32
ip prefix-list PL-BRANCH-SUBNETS seq 5  permit 10.10.110.0/24
ip prefix-list PL-BRANCH-SUBNETS seq 10 permit 10.10.111.0/24
ip prefix-list PL-BRANCH-SUBNETS seq 15 permit 10.10.112.0/24
ip prefix-list PL-BRANCH-SUBNETS seq 20 permit 10.10.113.0/24
ip prefix-list PL-BRANCH-SUBNETS seq 99 deny   0.0.0.0/0 le 32
ip prefix-list PL-MO-SUBNETS seq 5  permit 10.10.120.0/24
ip prefix-list PL-MO-SUBNETS seq 10 permit 10.10.121.0/24
ip prefix-list PL-MO-SUBNETS seq 99 deny   0.0.0.0/0 le 32
! --- 2. OSPF -> EIGRP  (tag 100 : "this prefix came from OSPF"). Only HQ and
!        branch prefixes go to Macau. Tags are set on the way out so that a
!        returning tagged prefix can be identified.
route-map RM-OSPF-TO-EIGRP permit 10
 description [OSPF area 0 prefixes into EIGRP AS 100 - TAG 100]
 match ip address prefix-list PL-HQ-SUBNETS PL-BRANCH-SUBNETS
 set tag 100
 set metric 100000 100 255 1 1500
route-map RM-OSPF-TO-EIGRP deny 20
 description [deny everything else - explicit so the deny is visible in show run]
! --- 3. EIGRP -> OSPF  (tag 200 : "this prefix came from EIGRP"). Only the
!        Macau prefixes enter OSPF. Nothing else.
route-map RM-EIGRP-TO-OSPF permit 10
 description [EIGRP AS 100 prefixes into OSPF area 0 - TAG 200]
 match ip address prefix-list PL-MO-SUBNETS
 set tag 200
route-map RM-EIGRP-TO-OSPF deny 20
 description [deny everything else]
! --- 4. The redistribution statements themselves -----------------------
router ospf 1
 redistribute eigrp 100 subnets route-map RM-EIGRP-TO-OSPF
! `subnets` is mandatory: without it OSPF redistributes only classful networks
! and the four Macau /24s would silently disappear.
router eigrp 100
 redistribute ospf 1 metric 100000 100 255 1 1500 route-map RM-OSPF-TO-EIGRP
! EIGRP requires an explicit seed metric on redistribution; there is no
! default. The seed is (bandwidth kbps, delay, reliability, load, MTU). These
! five values are the design's declared representation, not a measurement, and
! the report says so.
```

#### 9.11.3 管理距離的考量

| 路由來源 | 預設 AD | 在此邊界的後果 |
|---|---|---|
| Connected | 0 | 永遠勝出，本當如此 |
| Static | 1 | 兩個 `Null0` 彙總與任何靜態預設路由優先於每一種動態來源 |
| eBGP | 20 | 供應商路由覆蓋一切動態路由 |
| Internal EIGRP | 90 | **低於（優於）OSPF 的 110。** 本設計中最危險的一個數字 |
| OSPF | 110 | 所學到的 IGP 路由 |
| External EIGRP（再分佈進入 EIGRP） | 170 | 以 `D EX` 形式回到總部邊緣的標籤 100 前綴，將比 OSPF 的 110 *更不*受偏好 —— 這正是使迴路不致釀成災難的機制 |
| iBGP | 200 | 不存在 |

**為何 EIGRP 90 與 OSPF 110 之間的差距要緊，直白說明。** 若澳門前綴被再分佈進 OSPF，*而*這些前綴的副本又以某種方式仍存在於 EIGRP 中，則在此路由器上 EIGRP 副本會勝出，因為 90 < 110，澳門流量便會走上本設計未預期的路徑。緩解方式**並非**更改 AD —— 那會影響該協定在各地、所有路由 —— 而是**標籤**加上**單向方向**：標籤使返回的前綴可被識別，而單向方向意味著 EIGRP 至 OSPF 承載澳門前綴，OSPF 至 EIGRP 僅承載總部與分支前綴，絕不把澳門自身的前綴送回澳門。

另有三項決策及其理由：(1) 在 `VP-HQ-EDGE-01` 上**刻意不配置浮動靜態預設路由** —— 一條 AD 250 的靜態預設路由會位於 eBGP 所學的預設路由之後，並在兩個 BGP 連線皆失效時提供後備，但此處兩個供應商都終結於同一台模擬裝置，故它會與主要路徑在同一時刻失效，給人冗餘的錯誤印象；該省略已記錄為一項發現事項；(2) **靜態路由僅用於兩個 `Null0` 彙總**，使 BGP 的 `network` 語句有東西可公告，絕不用於導引流量；(3) **`default-information originate always` 為度量類型 2、度量 10** —— 類型 2 使外部成本不計入沿路徑的內部成本，故預設路由的度量在整個環境中恆定，路由表也更易閱讀；若存在兩個出口且其外部成本確實不同，類型 1 會更可取，但此處只有一個出口。

#### 9.11.4 為何再分佈僅限於一台裝置 —— 迴路論證

當源自協定 A 的前綴被再分佈進 B，然後又回到 A，且比原始者更受偏好時，兩個協定之間的再分佈便產生迴路。本設計透過四項彼此獨立的控制，在結構上禁止此事；四者全都重要，因為任何單一項均不足以成事。

1. **單一點。** 只有 `VP-HQ-EDGE-01` 進行再分佈，且 OSPF 與 EIGRP 網域之間沒有第二條路徑，故沒有第二次來回往返的機會。
2. **每個前綴集單向。** OSPF→EIGRP 僅承載總部與分支前綴；EIGRP→OSPF 僅承載澳門前綴。兩個方向移動的是互不相交的集合，故沒有任何前綴能同時穿越兩者。
3. **明確的路由標籤。** 每個再分佈的前綴都帶有 `100` 或 `200`。標籤在大多數協定轉換中都能存續，並在 `show ip route` 與連結狀態資料庫中可見，使迴路可藉檢視而非僅憑症狀來偵測。
4. **明確的終止拒絕。** 每個路由對映都以 `deny 20` 作結。若無終止拒絕，該對映的行為將取決於它是用於再分佈還是用於策略 —— 這個細微之處曾造成真實的中斷事故 —— 故該拒絕被明確寫出。

控制平面強化條文 `Apply basic security configuration for control and data plane` 在此以一種值得指名的特定意義獲得滿足：路由再分佈**就是**控制平面設定，而標籤錯誤的再分佈，其作為控制平面攻擊途徑的地位，與未經認證的 OSPF 鄰接同樣確定。

#### 9.11.5 驗證不存在迴路亦不存在非最佳路徑

```text
! --- Test 1: the Macau prefix, seen from the HQ core -----------------
VP-HQ-CORE-01# show ip route 10.10.120.0
Routing entry for 10.10.120.0/24
  Known via "ospf 1", distance 110, metric 30, type extern 2, forward metric 11
  Redistributing via ospf 1
  Last update from 10.10.10.1 on Vlan10, 00:19:52 ago
  Routing Descriptor Blocks:
  * 10.10.10.1, from 10.255.0.21, 00:19:52 ago, via Vlan10
      Route metric is 30, traffic share count is 1
      Route tag 200

! --- Test 2: the same prefix from the branch -------------------------
VP-BR-EDGE-01# show ip route 10.10.120.0
  Known via "ospf 1", distance 110, metric 30, type extern 2, forward metric 111
  Last update from 10.10.100.33 on GigabitEthernet0/1, 00:19:44 ago
  Routing Descriptor Blocks:
  * 10.10.100.33, from 10.255.0.21, 00:19:44 ago, via GigabitEthernet0/1
      Route metric is 30, traffic share count is 1
      Route tag 200

! --- Test 3: the HQ prefix from Macau, proving direction 1 -----------
VP-MO-EDGE-01# show ip route 10.10.30.0
Routing entry for 10.10.30.0/24
  Known via "eigrp 100", distance 170, metric 2297856, type external
  Redistributing via eigrp 100
  Last update from 10.10.100.37 on GigabitEthernet0/1, 00:19:38 ago
  Routing Descriptor Blocks:
  * 10.10.100.37, from 10.10.100.37, 00:19:38 ago, via GigabitEthernet0/1
      Route metric is 2297856, traffic share count is 1
      Route tag 100

! --- Test 4: traceroute evidence that the path is the intended one ---
VP-HQ-CORE-01# traceroute 10.10.120.10
Tracing the route to 10.10.120.10
  1 10.10.10.1 4 msec 2 msec 2 msec
  2 10.10.100.37 12 msec 10 msec 10 msec
  3 10.10.120.10 14 msec 13 msec 14 msec
!  The hop sequence must be HQ core -> HQ edge -> Macau edge -> target.
!  Compare with the reverse direction from VP-MO-EDGE-01 to 10.10.30.11:
!  asymmetric routing is acceptable (both directions are valid paths), but a
!  REVERSED-BACK-WHERE-IT-CAME pattern -- the classic three-hop ping-pong --
!  is a loop symptom.

! --- Test 5: the deliberate-misconfiguration experiment --------------
!  The baseline requires a routing-loop test after a deliberate
!  misconfiguration that the report documents and fixes.
!  (a) Capture Tests 1-4 as the "before" state.
!  (b) Break the tag strategy: remove `set tag 200` from
!      route-map RM-EIGRP-TO-OSPF permit 10.
!  (c) Re-run Test 1: the prefix now appears with `Route tag 0`.
!  (d) Break it further: add `network 10.10.120.0 0.0.0.255 area 0` to
!      router ospf 1 on VP-HQ-EDGE-01. The prefix now exists in OSPF as an
!      INTERNAL route AND as an external route, and the internal one wins --
!      a genuine, reproducible loop pre-condition.
!  (e) Observe: `show ip route 10.10.120.0` shows the internal route with no
!      tag; `show ip ospf database` shows the prefix in both the Router LSA
!      and the Type-5 external LSA.
!  (f) Restore both changes, re-run Tests 1-4, and confirm the before state
!      reproduces exactly.
!  The finding -- that the loop is prevented by the TAG and the DENY terminal
!  and not by the AD alone -- goes into the findings register with both the
!  broken and the repaired outputs. Demonstrating the failure and then
!  correcting it is stronger evidence than a configuration that merely looks
!  correct.
```

| 驗證項目 | 通過的結果 | 失敗的結果及其意義 |
|---|---|---|
| 再分佈前綴上存在標籤 | `Route tag 200`（澳門進入 OSPF）或 `Route tag 100`（總部進入 EIGRP） | `Route tag 0` 表示路由對映的 `set tag` 子句未命中 |
| 再分佈前綴上正確的 AD | OSPF 外部：`distance 110`、`type extern 2`；EIGRP 再分佈：`distance 170`、`type external` | 本應為外部的項目卻顯示 distance 90，表示該前綴被認為原生於澳門 |
| 外部前綴的單一 ASBR | 公告路由器一律為 `10.255.0.21` | 出現第二個公告路由器表示存在第二個再分佈點 |
| 方向正確性 | 澳門中的總部前綴帶標籤 100；總部中的澳門前綴帶標籤 200 | 澳門前綴以*內部*路由形式出現於 `VP-MO-EDGE-01` 的 EIGRP 中，表示它已被再分佈回其自身來源 |
| 無來回往返路徑 | 兩個方向均為單調遞增的跳點序列，無重複裝置 | 同一跳點出現兩次即表示路由迴路 |
| 管理與實驗室範圍絕不跨越邊界 | `10.20.20.0/24` 與 `10.70.0.0/16` 在 `show ip eigrp topology` 中**不存在** | 它們出現即是安全缺陷：隔離實驗室將可從舊有網域到達 |

注意測試 1 中的 `type extern 2`，它證明該前綴是以 OSPF 外部 LSA 抵達，正是再分佈所產生的結果；若同一前綴出現為 OSPF 內部路由，則意味著它是由單一再分佈點以外的某個東西洩漏進 OSPF 資料庫。另請注意，前向度量由核心處的 11 上升至分支處的 111（分支經成本 100 的廣域網路鏈路抵達 ASBR），而**路由度量維持 30** —— 這正是度量類型 2 的效果。

---

### 9.12 ASA 防火牆

#### 9.12.1 設計與位置

`VP-HQ-FW-01` 是一台**執行 ASA 9.16(4) 映像的 Cisco ASA 5506-X**，擔任周邊 **DMZ 邊界**的角色。

| 裝置 | 位置 | 它做什麼 | 它**不**做什麼 |
|---|---|---|---|
| **`VP-HQ-FW-01`（ASA）** | 位於對外轉送（VLAN 50）與 outside 網段之間；DMZ 閘道 | **過濾 DMZ 邊界**：TB-04（DMZ 不得向內部網路發起連線）、TB-05（互聯網至 DMZ，僅限已發布服務）、TB-13（DMZ 至互聯網，僅限對外）、TB-15（DMZ 管理路徑）、TB-06（除 VPN 端點外，互聯網無法觸及任何東西）。為已發布服務執行**靜態 NAT**，為 inside 與 DMZ 的對外流量執行**動態 PAT**，為 IPsec 隧道執行**NAT 豁免**。終結至 `VP-WC-EDGE-01` 的 IPsec IKEv2 站點對站點隧道 | 它不為 `Z-USER`/`Z-SERVER` 執行一般對外過濾 —— 那是 nftables 對組的職責 —— 它也看不到大多數內部流量 |
| **`vpnz-nft01`/`vpnz-nft02`（nftables 高可用對組，VIP 10.10.50.10）** | **內聯**於總部核心與 ASA inside 之間的 VLAN 50 | 從 `Z-SERVER`/`Z-USER` 通往互聯網的**唯一路徑**：依 TB-02/TB-03 進行具狀態的對外過濾、為內部對外流量執行 masquerade NAT、依來源 IP 記錄屬性、終結 WireGuard | 它不擁有 DMZ 邊界，也不終結 IPsec 站點對站點隧道 |

**兩者同時存在的原因，一段話說明。** 這兩台裝置**針對兩種不同的威脅模型，在兩個不同的層次上，把策略實作了兩次**。ASA 是專用的周邊設備，其長處在於它的 DMZ 發布模型、其安全等級預設行為、其成熟的 IPsec 實作及檢查引擎 —— 這是把服務暴露給不受信任網路的正確位置。nftables 對組則是執行於真正虛擬化 Ubuntu 對組上的 Linux 主機防火牆，這是本環境中團隊唯一能示範*實際執行*具狀態規則集、以特定前綴記錄被拒絕流量、並以 Keepalived 證明 VIP 故障切換的部分 —— 也是持有單一份經徹底審閱的對外允許清單的正確位置。把兩者合併，就意味著不是把 DMZ 暴露給一份團隊可任意編輯的 Linux 規則集，就是要求模擬器中縮減版的 ASA 模型承載一項它無法提出證據的對外策略。讓兩者分離，意味著每一項聲明都能以其自身的工具加以驗證。這是*在第二層再做一次策略*，並非重複的功夫。

**NAT 責任的劃分，清楚述明。**(1) **nftables 對組為內部至互聯網的流量執行 NAT**：工作站或伺服器前往模擬互聯網時，其來源位址由對組面向廣域網路介面上的 `masquerade` 轉譯，故 ASA 看到的是已轉譯的流量。(2) **ASA 為 nftables 對組看不到的周邊一切執行 NAT** —— **已發布的 DMZ 服務**經靜態 NAT 由 `198.51.100.0/29` 映射至 `10.10.90.0/24`、**VPN 前門**由 `198.51.100.5` 映射至 `10.10.50.10`，以及任何源自 DMZ 網段的流量。(3) **兩台裝置都不為站點對站點隧道執行 NAT**：NAT 豁免規則的存在，正是為了使隧道流量保持其原始位址，因為一條同時被轉譯的隧道極難排解，且會破壞任何在其承載內容中攜帶位址的協定。

#### 9.12.2 基礎設定

```cisco
! ===== VP-HQ-FW-01 — Cisco ASA 5506-X, ASA 9.16(4) =====
hostname VP-HQ-FW-01
domain-name vertexpeak.fyp.lab
enable password <REDACTED-ENABLE-SECRET>
! --- interfaces and security levels ------------------------------
interface GigabitEthernet1/1
 nameif outside
 security-level 0
 ip address 198.51.100.1 255.255.255.248
 description [to Z-WAN outside segment]
 no shutdown
interface GigabitEthernet1/2
 nameif inside
 security-level 100
 ip address 10.10.50.2 255.255.255.240
 description [to Z-EGRESS nftables pair VIP 10.10.50.10]
 no shutdown
interface GigabitEthernet1/3
 nameif dmz
 security-level 50
 ip address 10.10.90.1 255.255.255.0
 description [to Z-DMZ VLAN90 - ASA IS THE DMZ GATEWAY]
 no shutdown
interface Management1/1
 nameif mgmt
 security-level 100
 ip address 10.20.20.32 255.255.255.0
 no shutdown
! --- the security-level model, stated so the reader knows what is implicit
!  Higher security level -> lower: permitted by default.
!  Lower security level -> higher: DENIED by default unless an ACL permits it.
!  This design RELIES on that default for inside(100)/dmz(50) -> outside(0),
!  and adds explicit ACLs wherever an exception is required. It does NOT rely
!  on it for any DMZ-to-inside or outside-to-anything flow: those are denied
!  explicitly with logging. Where a stricter-than-default control is needed
!  (the DMZ must not initiate toward inside at all, including non-IP frames)
!  an EtherType ACL is used -- see §9.12.6.
! --- routing: no dynamic protocol on the ASA, deliberately ----------
route outside 0.0.0.0 0.0.0.0 198.51.100.6 1   ! the provider edge on the ASA's own /29; Rev 1.1 ruling C-15
!  The outside next hop is the simulated provider address in the DMZ public
!  pool's own /29 (198.51.100.1-.6). See the baseline correction note below.
route inside 10.10.10.0 255.255.255.0 10.10.50.1 1
route inside 10.10.30.0 255.255.255.0 10.10.50.1 1
route inside 10.10.40.0 255.255.254.0 10.10.50.1 1
route inside 10.10.80.0 255.255.255.0 10.10.50.1 1
route inside 10.70.0.0 255.255.255.0 10.10.50.1 1
!  No default route on the inside interface: the internal network is reached as
!  a set of explicit prefixes, so a routing mistake cannot send internal
!  traffic out of the inside interface toward an unknown destination.
! --- DNS, time, logging ---------------------------------------------
dns domain-lookup outside
dns server-group DefaultDNS
 name-server 10.10.30.11
 name-server 10.10.30.12
 domain-name vertexpeak.fyp.lab
clock timezone HKT 8
ntp authentication-key 1 md5 <REDACTED-NTP-KEY>
ntp authenticate
ntp server 10.10.30.11 source inside key 1 prefer
ntp server 10.10.30.12 source inside key 1
logging enable
logging timestamp
logging trap informational
logging host inside 10.10.30.31
logging buffered informational
!  NOTE on log level: `informational` (level 6) does NOT log denied packets,
!  which are level 4 (warnings). The design uses `logging trap informational`
!  for the general stream and relies on the ACL `log warnings` keyword plus
!  explicit `logging message ... level warnings` for the deny evidence TB-04
!  and TB-06 require. Stated because a reader who expects denies at level 6
!  would conclude, wrongly, that nothing was denied.
! --- object definitions (baseline convention OBJ-NET-{ZONE}) --------
object network OBJ-NET-SRV
 subnet 10.10.30.0 255.255.255.0
object network OBJ-NET-STORAGE
 subnet 10.10.80.0 255.255.255.0
object network OBJ-NET-USER
 subnet 10.10.40.0 255.255.254.0
object network OBJ-NET-BRANCH
 subnet 10.10.110.0 255.255.255.0
object network OBJ-NET-MGMT
 subnet 10.20.20.0 255.255.255.0
object network OBJ-NET-LAB
 subnet 10.70.0.0 255.255.255.0
object network OBJ-NET-DMZ
 subnet 10.10.90.0 255.255.255.0
object network OBJ-NET-PUBLIC
 subnet 198.51.100.0 255.255.255.248
object group service OBJ-SVC-PUBLISHED
 service-object tcp destination eq https
 service-object tcp destination eq www
object group service OBJ-SVC-MGMT
 service-object tcp destination eq ssh
 service-object tcp destination eq 3389
 service-object tcp destination eq 5985
 service-object tcp destination eq 5986
 service-object udp destination eq snmp
 service-object udp destination eq syslog
object group service OBJ-SVC-VPN
 service-object udp destination eq isakmp
 service-object udp destination eq 4500
object network OBJ-HOST-REVPROXY-VIP
 host 10.10.90.10
object network OBJ-HOST-WEBA01
 host 10.10.90.21
object network OBJ-HOST-WEBA02
 host 10.10.90.22
object network OBJ-HOST-WP01
 host 10.10.90.25
object network OBJ-HOST-DMZJUMP
 host 10.10.90.27
object network OBJ-HOST-NFTVIP
 host 10.10.50.10
object network OBJ-HOST-WC-PEER
 host 203.0.113.5

! ===== ACL-DMZ-OUT-10 — applied to the dmz interface, direction in =====
! Enforces TB-04 (DMZ must NEVER initiate toward the internal network),
! TB-13 (DMZ may reach the Internet, outbound only), TB-15 (DMZ hosts are
! managed only via the DMZ jump host), TB-05 (return traffic for published
! flows). Order is deliberate: specific permits, then internal-destination
! denies, then an explicit terminal deny-all with log.
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.10 any eq https
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.21 any eq https
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.22 any eq https
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.25 any eq https
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.26 any eq https
access-list ACL-DMZ-OUT-10 extended permit udp host 10.10.90.10 host 10.10.30.11 eq domain
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.10 host 10.10.30.11 eq domain
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.10 host 10.10.30.11 eq 636
access-list ACL-DMZ-OUT-10 extended permit udp host 10.10.90.21 host 10.10.30.11 eq domain
access-list ACL-DMZ-OUT-10 extended permit udp host 10.10.90.25 host 10.10.30.11 eq domain
! --- DMZ management only from the DMZ jump host (TB-15) --------------
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.27 10.10.90.0 255.255.255.0 eq ssh
! --- NTP to the forest time source -----------------------------------
access-list ACL-DMZ-OUT-10 extended permit udp 10.10.90.0 255.255.255.0 host 10.10.30.11 eq ntp
! --- TB-04: explicit DENY, with log, of every DMZ-initiated flow toward the
!     internal zones. The security-level model would drop this traffic anyway;
!     these lines make the policy auditable and produce the evidence TB-04
!     requires. The broad denies are the belt to the braces. -----------
access-list ACL-DMZ-OUT-10 extended deny ip 10.10.90.0 255.255.255.0 10.10.30.0 255.255.255.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip 10.10.90.0 255.255.255.0 10.10.80.0 255.255.255.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip 10.10.90.0 255.255.255.0 10.10.40.0 255.255.254.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip 10.10.90.0 255.255.255.0 10.20.20.0 255.255.255.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip any 10.10.0.0 255.255.0.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip any 10.20.0.0 255.255.0.0 log warnings
access-list ACL-DMZ-OUT-10 extended deny ip any 10.70.0.0 255.255.0.0 log warnings
access-list ACL-DMZ-OUT-10 extended permit tcp host 10.10.90.10 host 10.10.30.51 eq https
access-list ACL-DMZ-OUT-10 extended deny ip any any log warnings

! ===== ACL-OUTSIDE-IN-10 — applied to the outside interface, direction in =====
! Enforces TB-05 (Internet to DMZ, published services only), TB-06 (nothing
! else is Internet-reachable), TB-13 (return traffic to the DMZ hosts).
access-list ACL-OUTSIDE-IN-10 extended permit tcp any host 198.51.100.2 eq https
access-list ACL-OUTSIDE-IN-10 extended permit tcp any host 198.51.100.2 eq www
access-list ACL-OUTSIDE-IN-10 extended permit tcp any host 198.51.100.3 eq https
access-list ACL-OUTSIDE-IN-10 extended permit tcp any host 198.51.100.4 eq https
access-list ACL-OUTSIDE-IN-10 extended permit icmp any host 198.51.100.2 echo
access-list ACL-OUTSIDE-IN-10 extended permit icmp any host 198.51.100.3 echo
access-list ACL-OUTSIDE-IN-10 extended permit icmp any host 198.51.100.4 echo
! --- the VPN front door (TB-11, TB-16; P-15/P-16/P-17) ---------------
access-list ACL-OUTSIDE-IN-10 extended permit udp any host 198.51.100.5 eq isakmp
access-list ACL-OUTSIDE-IN-10 extended permit udp any host 198.51.100.5 eq 4500
access-list ACL-OUTSIDE-IN-10 extended permit udp any host 198.51.100.5 eq 443
access-list ACL-OUTSIDE-IN-10 extended permit udp any host 198.51.100.5 eq 1194
! --- IPsec peer for the site-to-site tunnel -------------------------
access-list ACL-OUTSIDE-IN-10 extended permit udp host 203.0.113.5 host 198.51.100.1 eq isakmp
access-list ACL-OUTSIDE-IN-10 extended permit udp host 203.0.113.5 host 198.51.100.1 eq 4500
access-list ACL-OUTSIDE-IN-10 extended permit esp host 203.0.113.5 host 198.51.100.1
! --- TB-06: explicit deny-and-log of everything else inbound --------
access-list ACL-OUTSIDE-IN-10 extended deny ip any any log warnings

access-group ACL-DMZ-OUT-10 in interface dmz
access-group ACL-OUTSIDE-IN-10 in interface outside
policy-map global_policy
 class inspection_default
  inspect dns preset_dns_map
  inspect icmp
  inspect http
  inspect ftp
  inspect tftp
  inspect sip
  inspect netbios
```

本設計所依賴的兩條隱含規則已述明，以免任何讀者推斷出比實際存在更多的策略：ASA 內建允許**較高安全等級至較低**的規則，被依賴用於 inside(100)→outside(0) 與 dmz(50)→outside(0)；而它**不**被依賴用於任何 DMZ 至 inside 或 outside 至任何對象的流量，那些流量均以記錄方式明確拒絕。

#### 9.12.3 NAT

| 形式 | 使用位置 | 它做什麼 | 為何採用此形式 |
|---|---|---|---|
| **動態 PAT（overload）** | inside → outside、dmz → outside | 多個內部位址共用一個公開位址；ASA 追蹤連接埠映射 | 企業的主機數量遠多於公開位址，且不需要從外部連入內部主機 |
| **靜態 NAT（一對一，含連接埠轉送）** | outside → DMZ 已發布服務 | 固定的公開位址永久映射至固定的 DMZ 主機或 VIP | 已發布服務必須可從外部連入，這是 PAT 無法提供的；靜態 NAT 亦提供穩定映射，可供 DNS 記錄引用 |
| **NAT 豁免（identity NAT）** | inside ↔ IPsec 對等端 `203.0.113.5` | 隧道流量**不**被轉譯 | 被轉譯的隧道會使 crypto ACL 與隧道內的位址出現分歧、破壞在其承載內容中攜帶位址的協定，並使排解問題變成雙變數問題 |

```cisco
! ===== NAT POLICY — VP-HQ-FW-01 =====
! --- Form 1: dynamic PAT for inside and dmz egress ------------------
!  Most internal egress is already NATed by the nftables pair before it
!  reaches the ASA, so this rule is the fallback for traffic sourced from the
!  VLAN 50 transit itself and for the DMZ.
object network OBJ-NET-SRV
 nat (inside,outside) dynamic interface
object network OBJ-NET-DMZ
 nat (dmz,outside) dynamic interface
! --- Form 2: static NAT for the published services ------------------
!  Portal: public 198.51.100.2 -> the Nginx HA VIP 10.10.90.10
object network OBJ-HOST-REVPROXY-VIP
 nat (dmz,outside) static 198.51.100.2
!  Web farm: public 198.51.100.3 -> the IIS pair, port-forwarded. Two hosts
!  cannot share one public address without port separation, so the pair is
!  published through the reverse-proxy VIP in production and these direct
!  mappings exist only for the test that proves a DMZ host is NOT directly
!  reachable (TB-05's "no other DMZ host directly" clause).
object network OBJ-HOST-WEBA01
 nat (dmz,outside) static 198.51.100.3 service tcp https https
object network OBJ-HOST-WEBA02
 nat (dmz,outside) static 198.51.100.3 service tcp 8443 https
!  Blog: public 198.51.100.4 -> the WordPress front door via the proxy VIP
object network OBJ-HOST-WP01
 nat (dmz,outside) static 198.51.100.4 service tcp https https
!  VPN front door, hop 1 of 2 (owner: the ASA): public 198.51.100.5 -> the nftables VIP 10.10.50.10, port
!  Hop 2 (owner: the nftables pair on that VIP) DNATs to vpnz-rras01 (udp 500/4500) and vpnz-lnxra01 (udp 1194);
!  WireGuard terminates on the pair itself. Rev 1.1 ruling C-20.
!  by port: UDP 443 WireGuard, UDP 500/4500 IKEv2, UDP 1194 OpenVPN
object network OBJ-HOST-NFTVIP
 nat (inside,outside) static 198.51.100.5 service udp isakmp isakmp
 nat (inside,outside) static 198.51.100.5 service udp 4500 4500
 nat (inside,outside) static 198.51.100.5 service udp 443 443
 nat (inside,outside) static 198.51.100.5 service udp 1194 1194
! --- Form 3: NAT exemption for the IPsec site-to-site tunnel --------
!  Traffic between the HQ internal ranges and the Wan Chai peer address must
!  transit untranslated, or the crypto ACL and the translated addresses
!  disagree and the tunnel carries traffic for addresses that exist on neither
!  end. These are MANUAL NAT rules, evaluated before Auto NAT -- see below.
object network OBJ-HOST-WC-PEER
 nat (inside,outside) static OBJ-HOST-WC-PEER
nat (inside,outside) source static OBJ-NET-SRV OBJ-NET-SRV destination static OBJ-HOST-WC-PEER OBJ-HOST-WC-PEER no-proxy-arp route-lookup
nat (dmz,outside)    source static OBJ-NET-DMZ OBJ-NET-DMZ destination static OBJ-HOST-WC-PEER OBJ-HOST-WC-PEER no-proxy-arp route-lookup
! --- explicit no-NAT for the return path of the published services ---
!  A request from an internal client to the PUBLIC address of the portal would
!  otherwise be PATed outbound and fail to come back, because the ASA would
!  translate the client's source address while the DMZ server's reply is
!  addressed to the public realm. Hairpin NAT is deliberately NOT implemented;
!  instead internal clients resolve `portal.vertexpeak.fyp.lab` to the DMZ VIP
!  10.10.90.10 directly, which the split-horizon DNS record plan already does.
!  Documented here because a reader will otherwise assume the ASA is broken
!  when an internal client cannot reach its own published address.
```

```text
VP-HQ-FW-01# show nat
Auto NAT Policies (Section 2)
   1 (inside) to (outside) source dynamic OBJ-NET-SRV interface
        translate_hits = 412, untranslate_hits = 398
   2 (dmz) to (outside) source dynamic OBJ-NET-DMZ interface
        translate_hits = 1120, untranslate_hits = 1043
   3 (dmz) to (outside) source static OBJ-HOST-REVPROXY-VIP 198.51.100.2
        translate_hits = 0, untranslate_hits = 96
   4 (inside) to (outside) source static OBJ-HOST-NFTVIP 198.51.100.5 service udp 443 443
        translate_hits = 0, untranslate_hits = 14
Manual NAT Policies (Section 1)
   1 (inside) to (outside) source static OBJ-NET-SRV OBJ-NET-SRV destination static OBJ-HOST-WC-PEER OBJ-HOST-WC-PEER
        translate_hits = 0, untranslate_hits = 0
   2 (dmz) to (outside) source static OBJ-NET-DMZ OBJ-NET-DMZ destination static OBJ-HOST-WC-PEER OBJ-HOST-WC-PEER
        translate_hits = 0, untranslate_hits = 0
```

**應留意的項目。** 對已發布服務而言，`translate_hits` 計算對外轉譯次數，而 `untranslate_hits` 計算被映射回來的入向方向；運作正常的已發布服務會顯示 `untranslate_hits` 隨客戶端連線而增加，而**靜態 NAT 規則上 `translate_hits` 非零但 `untranslate_hits` 為零是一項警訊** —— 有某個東西以錯誤的方向命中該規則。NAT 豁免規則在隧道建立**之前**顯示 0/0 是正確的，並非故障的證據；隧道建立後兩者都應增加。**各區段的順序**很重要：Manual NAT（第 1 區段）**先於** Auto NAT（第 2 區段）被評估，這正是豁免規則採用 Manual NAT 的原因 —— 若它們是 Auto NAT，動態 PAT 規則可能先命中並轉譯隧道流量。該順序是 ASA NAT 最常見的錯誤，也是 §9.16 中的一條項目。

#### 9.12.4 VPN 功能

基準文件指派 ASA 一條**至 `VP-WC-EDGE-01` 的站點對站點 IPsec 隧道**（隧道 `IPSEC-HQ-WC`），僅承載 **VLAN 131**，並述明其目的為*「用於示範 ASA IPsec 並與 WireGuard 作比較。」* 該指派已獲接受並實作，附帶兩項誠實的限定。

**限定 1 —— 隧道在模擬器中示範，模擬器的限制一併接受。** Packet Tracer 的 ASA 支援 IKE 與 IPsec 設定，但**能可靠完成的是使用預共享金鑰的 IKEv1，而搭配憑證的 IKEv2 則不可靠**。設計立場為：正式記錄的設定是搭配預共享金鑰認證的 IKEv2，團隊首先嘗試該者；若無法建立，團隊退回模擬器可用的 IKEv1/PSK 形式，**以一句平實的話述明該替換**，並將真實設備上搭配憑證的 IKEv2 設定作為軌道 B 呈現；且**除非 `show crypto ikev2 sa` 與 `show crypto ipsec sa` 證明如此，本專案不得聲稱已建立可運作的、以憑證為基礎的 IKEv2 ASA 隧道。** 基準文件自身的立場 —— ASA 為「COVERED（附已聲明的限制）」—— 正是此處所遵循者。

```cisco
! ===== IPsec site-to-site — ASA side =====
! DESIGN POSITION: IKEv2 with pre-shared key. Peer: VP-WC-EDGE-01 203.0.113.5
! Interesting traffic: VLAN 131 (10.10.131.0/24) only.
crypto ikev2 policy 10
 encryption aes-256
 integrity sha256
 group 14
 prf sha256
 lifetime seconds 86400
crypto ikev2 enable outside
tunnel-group 203.0.113.5 type ipsec-l2l
tunnel-group 203.0.113.5 ipsec-attributes
 ikev2 local-authentication pre-shared-key <REDACTED-IPsec-PSK>
 ikev2 remote-authentication pre-shared-key <REDACTED-IPsec-PSK>
crypto ipsec ikev2 ipsec-proposal PROPOSAL-IKEV2-FYP
 protocol esp encryption aes-256
 protocol esp integrity sha-256
! --- the crypto ACL: what is "interesting" --------------------------
!  Exactly the Wan Chai dev VLAN <-> the HQ server VLAN and the DMZ. Nothing
!  else is encrypted: the design deliberately does not encrypt everything,
!  because a tunnel carrying everything hides the fact that the internal path
!  is not the production path.
access-list ACL-VPN-IPSEC-S2S-A extended permit ip 10.10.131.0 255.255.255.0 10.10.30.0 255.255.255.0
access-list ACL-VPN-IPSEC-S2S-A extended permit ip 10.10.131.0 255.255.255.0 10.10.90.0 255.255.255.0
crypto map CMAP-OUTSIDE 10 match address ACL-VPN-IPSEC-S2S-A
crypto map CMAP-OUTSIDE 10 set peer 203.0.113.5
crypto map CMAP-OUTSIDE 10 set ikev2 ipsec-proposal PROPOSAL-IKEV2-FYP
crypto map CMAP-OUTSIDE 10 set pfs group14
crypto map CMAP-OUTSIDE 10 set security-association lifetime seconds 3600
crypto map CMAP-OUTSIDE interface outside
! --- the peer side (VP-WC-EDGE-01), DOCUMENTED INTENT ---------------
!  The Cisco IOS form of the same tunnel is: crypto ikev2 proposal; crypto
!  ikev2 policy; crypto ikev2 keyring; crypto ikev2 profile; crypto ipsec
!  profile; interface Tunnel0 with `tunnel protection ipsec profile ...`.
!  The exact IOS syntax supported by the simulated Wan Chai router image must
!  be established in build week 8 and recorded. If the simulator cannot
!  complete the IOS end, the report states that the tunnel was configured on
!  the ASA and that the IOS end was documented but not demonstrated.
! --- What is explicitly NOT claimed for this tunnel -----------------
!  * No certificate-based IKEv2 authentication unless `show crypto ikev2 sa`
!    and the certificate chain both prove it.
!  * No GRE-over-IPsec, no DMVPN, no SSL VPN on the ASA. DMVPN and SSL VPN are
!    named by the standard but are not implemented here and must not appear in
!    a delivered-features list.
!  * No ASA failover pair and no clustering. The tunnel endpoints are single
!    devices and the report says so.
```

**限定 2 —— 基準文件隧道配對中的 WireGuard 那一半不在 ASA 上，而這是正確的。** 權威基準文件本身已標示此問題：*「Cisco 裝置無法終結 WireGuard。」* 其解決方式為：或以第三部 Ubuntu VM（`vpnz-wcwg01`）代表灣仔對等端，或將 WireGuard 記錄為僅供遠端工作者使用的隧道、並在 ASA 上為分支使用 IPsec，且要求團隊擇一並記錄。**本節採納第二個選項作為網絡線的立場**：WireGuard 屬 Linux 側技術，於 Linux 線中報告；而在 Cisco 線之內，分支隧道為 ASA 上的 IPsec。該選擇必須記錄於決策日誌中，且報告絕不得述明有 Cisco 裝置終結 WireGuard。

#### 9.12.5 強化

```cisco
! ===== ASA HARDENING — VP-HQ-FW-01 =====
! --- administrative access: SSH only, from Z-MGMT only ---------------
username adm-net01 password <REDACTED> privilege 15
username adm-net02 password <REDACTED> privilege 15
username svc_monitoring password <REDACTED> privilege 5
!  [ASSUMPTION] The simulated image's `username` command may not support a hash
!  rather than a clear-text password. Where it does not, the value is still
!  never committed to Git and the limitation is recorded.
aaa authentication ssh console LOCAL
aaa authentication enable console LOCAL
aaa authorization command LOCAL
aaa accounting ssh console LOCAL
aaa accounting enable console LOCAL
aaa accounting command privilege 15 LOCAL
crypto key generate rsa modulus 2048
!  2048 is the minimum and 4096 is attempted; the actual modulus is read back
!  with `show crypto key mypubkey rsa`.
ssh version 2
ssh timeout 10
ssh scopy enable
! --- management access restriction -----------------------------------
!  The management interface is on VLAN 20 (Z-MGMT). It is reachable ONLY from
!  the management subnet; Telnet and the web UI are unused.
access-list ACL-MGMT-ACCESS-10 extended permit tcp 10.20.20.0 255.255.255.0 any eq ssh
access-list ACL-MGMT-ACCESS-10 extended permit tcp 10.20.20.0 255.255.255.0 any eq 6516
access-list ACL-MGMT-ACCESS-10 extended permit udp 10.20.20.0 255.255.255.0 any eq snmp
access-list ACL-MGMT-ACCESS-10 extended permit udp host 10.10.30.31 any eq syslog
access-list ACL-MGMT-ACCESS-10 extended deny   ip any any log warnings
ssh 10.20.20.0 255.255.255.0 mgmt
ssh 10.10.30.31 255.255.255.255 mgmt
http 10.20.20.0 255.255.255.0 mgmt
!  ASDM/HTTPS management is enabled only from Z-MGMT; the design of record is
!  CLI management, and ASDM is documented as available and unused. Where the
!  simulated image does not accept the `http` command it is recorded as
!  unavailable rather than worked around.
console timeout 5
banner motd ***************************************************************************
banner motd *  Vertex Peak Financial Technologies Limited - PROPERTY OF VERTEX PEAK   *
banner motd *  Authorised administrative access only. All access and all changes are  *
banner motd *  logged and auditable. Unauthorised access is prohibited.                *
banner motd ***************************************************************************
! --- logging and time ------------------------------------------------
logging enable
logging timestamp
logging trap informational
logging host inside 10.10.30.31
logging message 106023 level warnings
logging message 106100 level warnings
logging message 313001 level warnings
logging message 313004 level warnings
!  These four message IDs are the ASA's deny messages, explicitly set to
!  warnings so that a DENIED FLOW is visible in the syslog stream -- the
!  evidence the trust-boundary tests require.
! --- disabling unused features ---------------------------------------
!  The design disables, or documents as absent, every feature that is not part
!  of this build:
!   * No FirePOWER/SFR module (not modelled in the simulator).
!   * No ASA clustering, no active/standby failover pair (not modelled).
!   * No SSL VPN / AnyConnect and no webvpn / clientless SSL VPN.
!   * No DHCP server or relay on the ASA (DHCP belongs to the AD estate).
!   * No dynamic routing on the ASA (static routes only, as listed).
!   * No SNMPv1/v2c. Where this image supports only v2c, the baseline's
!     prohibition on community strings applies and the design records the gap
!     rather than configuring a community string.
!   * No `shun`. It is not modelled and is not claimed.
snmp-server enable traps snmp authentication linkup linkdown coldstart
snmp-server enable traps syslog
snmp-server host inside 10.10.30.31 version 3 svc_monitoring
snmp-server location "Vertex Peak HQ - perimeter"
snmp-server contact "IT Network Engineering Workstream"
```

#### 9.12.6 驗證

```text
VP-HQ-FW-01# show interface ip brief
Interface                  IP-Address      OK? Method Status                Protocol
GigabitEthernet1/1         198.51.100.1    YES CONFIG up                    up
GigabitEthernet1/2         10.10.50.2      YES CONFIG up                    up
GigabitEthernet1/3         10.10.90.1      YES CONFIG up                    up
Management1/1              10.20.20.32     YES CONFIG up                    up
Internal-Data0/0           unassigned      YES unset  up                    up
Virtual0                   127.1.0.1       YES unset  up                    up

VP-HQ-FW-01# show route
Gateway of last resort is 198.51.100.6 to network 0.0.0.0
C    10.10.50.0 255.255.255.248 is directly connected, inside
L    10.10.50.2 255.255.255.255 is directly connected, inside
C    10.10.90.0 255.255.255.0 is directly connected, dmz
L    10.10.90.1 255.255.255.255 is directly connected, dmz
C    198.51.100.0 255.255.255.248 is directly connected, outside
L    198.51.100.1 255.255.255.255 is directly connected, outside
C    10.20.20.0 255.255.255.0 is directly connected, mgmt
L    10.20.20.32 255.255.255.255 is directly connected, mgmt
S    10.10.10.0 255.255.255.0 [1/0] via 10.10.50.1, inside
S    10.10.30.0 255.255.255.0 [1/0] via 10.10.50.1, inside
S    10.10.40.0 255.255.254.0 [1/0] via 10.10.50.1, inside
S    10.10.80.0 255.255.255.0 [1/0] via 10.10.50.1, inside
S    10.70.0.0 255.255.255.0 [1/0] via 10.10.50.1, inside
S*   0.0.0.0 0.0.0.0 [1/0] via 198.51.100.6, outside

VP-HQ-FW-01# show access-list ACL-DMZ-OUT-10
access-list ACL-DMZ-OUT-10; 6 elements; name hash: 0x9a1c2b3d
access-list ACL-DMZ-OUT-10 line 1 extended permit tcp host 10.10.90.10 any eq https (hitcnt=96)
access-list ACL-DMZ-OUT-10 line 2 extended permit tcp host 10.10.90.21 any eq https (hitcnt=0)
access-list ACL-DMZ-OUT-10 line 3 extended permit tcp host 10.10.90.22 any eq https (hitcnt=0)
access-list ACL-DMZ-OUT-10 line 4 extended permit tcp host 10.10.90.25 any eq https (hitcnt=12)
access-list ACL-DMZ-OUT-10 line 5 extended permit tcp host 10.10.90.26 any eq https (hitcnt=0)
access-list ACL-DMZ-OUT-10 line 6 extended deny ip any 10.10.0.0 255.255.0.0 log warnings (hitcnt=3)
```

**應留意的項目。** 恰好一條指向 **outside** 的候選預設路由（`S*`）；inside 介面上的第二條預設路由會造成路由歧義。inside 介面上有五條靜態路由，每個內部前綴一條，且 inside 介面上**沒有**預設路由。並且**完全沒有動態路由協定** —— 沒有 `O`、沒有 `D`、沒有 `B` —— 故 ASA 不能成為再分佈點，也不能收到惡意路由；預期 ASA 上會有 OSPF 的讀者必須被告知其缺席是刻意的。在 ACL 輸出中，permit 行上的 `hitcnt` 證明該策略確實被使用：若某 ACL 唯一非零的計數器是 deny 行，那就是一個阻擋一切的策略，屬於被當作安全呈現的設定錯誤，而此項檢查必須在模型獲批准之前執行。deny 行上的**非零**計數是**成功**，因為測試情境刻意嘗試 DMZ 至內部的連線並預期其失敗。

| # | 測試 | 來源 → 目的 | 預期 | 證據 |
|---|---|---|---|---|
| 1 | 已發布入口網站可達 | 互聯網 → `https://portal.vertexpeak.example`（198.51.100.2:443） | **成功** | 客戶端成功；`ACL-OUTSIDE-IN-10` permit 的 hitcnt；`show nat` 的 untranslate_hits 上升 |
| 2 | 已發布網頁入口網站可達 | 互聯網 → 198.51.100.3:443 | **成功** | 同上 |
| 3 | 已發布部落格可達 | 互聯網 → 198.51.100.4:443 | **成功** | 同上 |
| 4 | DMZ 主機不可直接觸及 | 互聯網 → 198.51.100.3:22 | **失敗** | 終止拒絕的 hitcnt；至 `vpnz-mon01` 的 syslog 拒絕訊息 |
| 5 | 內部伺服器無法從互聯網觸及（TB-06） | 互聯網 → 10.10.30.11，任何連接埠 | **失敗** | 終止拒絕的 hitcnt；syslog |
| 6 | DMZ 不得向內部伺服器發起連線（TB-04） | DMZ 主機 → 10.10.30.11:445 | **失敗** | `ACL-DMZ-OUT-10` deny 行的 hitcnt 增加；syslog 106023 |
| 7 | DMZ 不得向管理網路發起連線（TB-04） | DMZ 主機 → 10.20.20.11:22 | **失敗** | deny 行的 hitcnt 增加 |
| 8 | DMZ 可為修補而連至互聯網（TB-13） | `vpnz-dmzrev01` → 192.0.2.53:443 | **成功** | permit 行的 hitcnt；`show nat` 的 translate_hits |
| 9 | DMZ 管理僅經跳板主機（TB-15） | `vpnz-dmzjump01` 10.10.90.27 → 10.10.90.21:22 **成功**；任何其他 DMZ 主機 → 同一目標**失敗** | **分流** | hitcnt 僅為跳板主機的流量增加 |
| 10 | IPsec 站點對站點已建立 | `VP-HQ-FW-01` ↔ `VP-WC-EDGE-01` | **成功** | `show crypto ikev2 sa` 與 `show crypto ipsec sa` 顯示已建立的 SA 及非零的 encaps/decaps 計數器 |
| 11 | 隔離實驗室無法觸及 DMZ（TB-09） | 10.70.0.50 → 10.10.90.21:443 | **失敗** | 有兩項獨立理由作為證據：無路由，*以及* 流量會遇到的任何策略中的明確拒絕 |
| 12 | VPN 前門是唯一的入向 VPN 路徑（TB-06） | 互聯網 → 198.51.100.5 UDP 443/500/4500/1194 | 該四個連接埠為**成功**；該位址上其他每個連接埠為**失敗** | permit 行與終止拒絕的 hitcnt |

**EtherType 控制平面 ACL，以及若模擬器拒絕時該如何處理。** TB-04 是絕對的：DMZ 絕不得向內部網路發起連線，*對任何協定皆然*。`dmz` 上的介面 ACL 對所有 IP 流量執行此事，因為每一筆 DMZ 至內部的流量都會對照 `ACL-DMZ-OUT-10` 評估，而該 ACL 的終止行拒絕所有 IP。IP ACL 無法阻擋的是非 IP 流量，這正是嚴格解讀會要求在 inside 介面上也加一條 EtherType ACL 的原因。

```cisco
! ===== TRACK B / STRICTER FORM — EtherType ACL for TB-04 =====
!  An IP ACL cannot restrict non-IP EtherTypes. To enforce "the DMZ must never
!  initiate toward the internal network, for ANY protocol", an EtherType ACL on
!  the INSIDE interface is the correct construct: only the IP and ARP
!  EtherTypes permitted, everything else denied. Whether the simulated ASA
!  accepts this must be tested in build week 7; if it does not, the design
!  falls back to the IP ACL plus the security-level model, and the report
!  states that non-IP EtherTypes are not suppressed in the simulator.
access-list ACL-INSIDE-ETHERTYPE ethertype permit ip
access-list ACL-INSIDE-ETHERTYPE ethertype permit arp
access-list ACL-INSIDE-ETHERTYPE ethertype deny any
access-group ACL-INSIDE-ETHERTYPE in interface inside
```

另有兩項觀察應置於此處，因為它們屬 ASA 特有：ASA **不參與任何動態路由協定**，故它不能成為再分佈點，也不能收到惡意路由；以及其 **`show asp drop` 輸出刻意不用作證據**，因為基準文件記錄此層級的細節在 Packet Tracer 中並不完整 —— drop 層級的證據來自 `show access-list` 的命中計數器與 syslog，而報告應解釋原因。

> **須記錄的基準文件更正項目。** 基準文件 §5.5 將 ASA 的 outside 介面給為 `198.51.100.1/29`，並另外將模擬供應商邊緣給為 `203.0.113.1`，而 §5.4 則述明 IPsec 對等端為 `203.0.113.5`。本小節在 ASA 自身的介面上依循 §5.5，並依 §5.4 所述使用 `203.0.113.5` 作為對端的 IPsec 對等端；outside 的預設下一跳（`198.51.100.6`）依 §5.2 取自 DMZ 公用集區自身的 `/29`。**應在基準文件的下一次修訂中，為 ASA outside 預設路由加入一個單一的相鄰跳點位址**，因為現行文字支援兩種解讀，而被迫使作出選擇的撰寫者不得不在此作出一項已記錄的假設。

---

### 9.13 管理、監控與流量分析

本小節實作 WSOS 點名的要求 `Use network discovery and traffic analysis tools such as CDP, NetFlow, Syslog, SNMP and tcpdump.`。這是一條*應能夠*的條文，故報告必須顯示每一項工具被**使用**，而非僅被配置。若模擬器無法提供某項點名的工具，則述明此事並指名替代工具 —— 絕不悄悄省略。

#### 9.13.1 探索：CDP 與 LLDP

| 裝置類別 | CDP | LLDP | 理由 |
|---|---|---|---|
| 總部核心、接取、分支／小型辦公室交換器與路由器 | **已啟用**（`cdp run`、`lldp run`） | 已啟用 | 這些裝置的鄰接關係正是本專案所記錄與驗證的對象；它們之間的探索就是重點所在 |
| ASA `VP-HQ-FW-01` | 在 inside 與 dmz 上已啟用；**在 outside 上已停用** | 依支援情況 | 面向互聯網介面上的 CDP/LLDP 會向任何能觸及該介面者洩露型號、軟體版本與管理位址 —— 這是一項零成本的小而確實的資訊洩露控制 |
| `VP-ISP-EDGE-01` | 已啟用 | 已啟用 | 供應商裝置為模擬且位於實驗室內；探索有助於記錄對等連線 |
| 面向隔離 `STUDENT-LAB` 網段的連接埠 | 在 VLAN 70 接取埠上**已停用** | 已停用 | 該實驗室是本專案刻意誤用測試的指定來源；不讓它取得探索資訊是其隔離的一部分 |

```cisco
cdp run
cdp timer 60
cdp holdtime 180
lldp run
interface gi0/1
 cdp enable
 lldp transmit
 lldp receive
interface GigabitEthernet1/1          ! ASA, outside interface only
 cdp disable
!  LLDP on the ASA is set with `lldp transmit` / `lldp receive` per interface
!  where the image supports it. The design does not rely on LLDP for any
!  verification, so its absence on the simulator is not a blocker.
```

```text
VP-HQ-CORE-01# show cdp neighbors detail
-------------------------
Device ID: VP-HQ-CORE-02.vertexpeak.fyp.lab
Entry address(es):
  IP address: 10.20.20.12
Platform: Cisco CISCO3925-CHASSIS,  Capabilities: Router Switch IGMP
Interface: GigabitEthernet1/0/1,  Port ID (outgoing port): GigabitEthernet1/0/1
Holdtime : 152 sec
Version :
Cisco IOS Software, Version 15.2
!  The exact version string is captured VERBATIM from the device on build day
!  and pasted into the report's version table. It is NOT typed from memory.
advertisement version: 2
Native VLAN: 999
Duplex: full
Management address(es):
  IP address: 10.20.20.12
-------------------------
Device ID: VP-HQ-EDGE-01.vertexpeak.fyp.lab
Entry address(es):
  IP address: 10.20.20.31
Platform: Cisco CISCO2901/K9,  Capabilities: Router
Interface: GigabitEthernet1/0/2,  Port ID (outgoing port): GigabitEthernet1/0
Native VLAN: 999
```

**應留意的項目。** 每個幹道鄰居上的 `Native VLAN: 999` —— `Native VLAN: 1` 就是 CDP 免費替你偵測到的設定錯誤，這正是 CDP 在此具體而非裝飾性的價值。Platform 行揭露裝置型號，並被擷取作為實際所用型號的證據，這正是基準文件版本擷取紀律所要求的 —— 也是 ASA outside 介面上停用 CDP 的原因。**已記錄拓撲與實際觀察拓撲的比對**是本小節的一項交付成果：一張表列出在全部十六台裝置上由 `show cdp neighbors detail` 取得的每一項鄰接關係，與設計所聲稱的鄰接並列，任何差異都標示為發現事項。這是可取得的最廉價檢查，用以確認設計文件與已建置的網絡一致，並滿足 `The significance of accuracy, checking, and attention to detail in all working practices`。

#### 9.13.2 SNMPv3

**設計立場：僅使用 SNMPv3 的 `authPriv`。SNMPv1 與 SNMPv2c 均被禁止，且環境中任何地方都沒有具意義的 community string**，此可引述至 `Apply basic security configuration for control and data plane`，因為 community string 就是在每個請求中送出的明文密碼。

| 憑證要素 | 值／政策 | 理由 |
|---|---|---|
| 安全等級 | `priv`（認證**與**加密） | `authNoPriv` 保護完整性，但使計數器與拓撲對被動觀察者仍可見；`noAuthNoPriv` 等同於 SNMPv1 |
| 認證協定 | SHA（此映像為 SHA-1；支援時使用 SHA-256） | MD5 認證對新部署已屬過時；協商所得的演算法由 `show snmp user` 讀回並記錄 |
| 隱私協定 | AES-128 | 該映像可用的最強者；實際值一併記錄 |
| 使用者 | `svc_monitoring` | 符合 Microsoft 線服務帳戶慣例的專用唯讀身分；不是共用帳戶，也不是互動式管理憑證 |
| 存取視圖 | `VIEW-FYP-RO`，限於 `iso` | 在結構上即為唯讀，故寫入是透過該視圖即不可得，而不僅是在使用者層級未經授權 |
| 憑證儲存 | Ansible vault 與團隊密碼管理器；**絕不**存於 Git | 與本專案的機密處理規則一致；被提交的憑證會使監控線的安全聲明失效 |
| Trap 集合 | linkdown、linkup、coldstart、warmstart、authentication、syslog | 刻意狹窄的集合；以全類別淹沒收集器會摧毀 AI 線所需的訊號 |

`snmp-server user ... v3 auth sha ... priv aes 128` 是一項關於 Packet Tracer 映像接受什麼的 **[ASSUMPTION]**。若模擬器拒絕 SNMPv3，正確的行動**並非**退回使用 community string 以求示範成功。正確的行動是把該限制記錄為一項發現事項（模擬器能力缺口是正當的學術內容）、保留 SNMPv3 設定作為設計立場與真實設備設定，並改以從 `vpnz-mon01` 經 SNMPv3 輪詢 Linux 與 Windows 環境來提供 SNMP 證據。報告隨後以一句話述明：SNMPv3 的*設計*適用於網絡裝置，而憑證模型的*已執行*證明使用伺服器環境 —— 這是比「交換器經 SNMPv3 受監控」更弱、但為證據所支持的主張。

#### 9.13.3 NetFlow，以及本專案改用什麼

**NetFlow 未被實作，這是已記錄的限制而非選擇。** Packet Tracer 不支援流量匯出；沒有任何設定能從模擬裝置產生流量記錄，而由於 WSOS 明確點名 NetFlow，報告必須直接處理此缺口。

- **軌道 A（已執行）。** 流量分析的角色由三種**確實**可用的機制填補：**SNMPv3 計數器輪詢**（介面入／出位元組數、錯誤與丟棄 —— 與 NetFlow 會給出的位元組計數相同，只是沒有流量粒度）；**Syslog**（事件層級證據，包括每一筆附 5-tuple 的拒絕，正是信任邊界測試所需的證據）；以及**在 Linux 環境上執行 `tcpdump`**，在兩個要緊的位置提供真正的封包層級擷取 —— nftables 對外對組與 DMZ 反向代理。
- **軌道 B（已記錄，未執行）。** 等效的真實設備設定於下方給出，故此缺口是*平台*缺口，而非*設計*缺口。

```cisco
! ===== TRACK B — REAL EQUIPMENT ONLY. NOT EXECUTABLE IN PACKET TRACER. =====
! Classical NetFlow v9 export to the monitoring host vpnz-mon01
ip flow-export destination 10.10.30.31 2055
ip flow-export source Loopback0
ip flow-export version 9
ip flow-export template refresh-rate 20
ip flow-cache timeout active 1
ip flow-cache timeout inactive 15
! Per-interface activation, deliberately NOT global: flow accounting on every
! interface of every device would overwhelm a lab collector and would tell the
! group nothing about the boundaries that matter.
interface gi1/0
 ip route-cache flow
interface Vlan30
 ip route-cache flow
! --- Flexible NetFlow: the modern form a real deployment would use -----
flow record REC-FYP-IPV4
 match ipv4 protocol
 match ipv4 source address
 match ipv4 destination address
 match transport source-port
 match transport destination-port
 match interface input
 collect counter bytes long
 collect counter packets long
 collect timestamp sys-uptime first
 collect timestamp sys-uptime last
flow exporter EXP-FYP-MON01
 destination 10.10.30.31
 source Loopback0
 transport udp 2055
 template data timeout 60
flow monitor MON-FYP-IPV4
 record REC-FYP-IPV4
 exporter EXP-FYP-MON01
 cache timeout active 60
interface gi1/0
 ip flow monitor MON-FYP-IPV4 input
 ip flow monitor MON-FYP-IPV4 output
! Verification on real equipment: show flow exporter;
! show flow monitor MON-FYP-IPV4 cache format table; show flow record REC-FYP-IPV4
```

**`tcpdump` 如何與之互補。** 此組合是刻意的，兩半各自覆蓋對方的盲點：SNMPv3 計數器在整個*模擬*拓撲上提供逐介面的流量與錯誤率，包括沒有 Linux 主機存在的網段（觀塘、澳門、灣仔、廣域網路鏈路）；在 `vpnz-nft01`（`VNET-EGRESS`/`VNET-WAN`）與 `vpnz-dmzrev01` 上執行的 `tcpdump`，則在真實 VM 環境所在的網段上提供真正的封包層級細節 —— 標頭、序號、重傳、TLS 交握失敗原因、ICMP 不可達訊息，以及被拒絕流量的確切 5-tuple；Syslog 則提供事件層級、時間相關的記錄，並包含裝置自身對其為何如此行動的看法。

```bash
# --- tcpdump recipes that produce report-ready evidence ----------------
# 1. Prove the isolated lab cannot reach the DMZ (TB-09).
#    Run on vpnz-nft01, on the interface facing the internal network.
sudo tcpdump -i ens192 -nn -tttt -c 20 \
  'src net 10.70.0.0/24 and dst net 10.10.90.0/24'

# 2. Prove a DMZ host cannot initiate toward the server VLAN (TB-04).
sudo tcpdump -i ens192 -nn -tttt -c 20 \
  'src net 10.10.90.0/24 and dst net 10.10.30.0/24'

# 3. Capture a TLS handshake for the certificate-warning evidence.
sudo tcpdump -i ens192 -nn -s 0 -w /srv/backup/pcap/$(date +%F)_tls_capture.pcap \
  'tcp port 443'

# 4. Write a bounded, human-readable capture for the report appendix.
sudo tcpdump -i ens192 -nn -tttt -c 50 -s 128 \
  'host 10.10.90.10 and tcp port 443' > /var/log/fyp/dump_portal_443.log
```

每次擷取都以 `{date}_{host}_{what}.pcap` 儲存於 `07-evidence/` 之下，而產生該擷取的 `tcpdump` 命令列會引述於圖說中，因為沒有附上命令的擷取不算證據。

#### 9.13.4 NTP 與設定備份

```cisco
! --- NTP client configuration (already in the §9.5 template) ---------
clock timezone HKT 8
ntp authentication-key 1 md5 <REDACTED-NTP-KEY>
ntp authenticate
ntp trusted-key 1
ntp server 10.10.30.11 key 1 prefer
ntp server 10.10.30.12 key 1
ntp access-group peer ACL-NTP-PEERS
ip access-list standard ACL-NTP-PEERS
 permit 10.10.30.11
 permit 10.10.30.12
 deny   any log
!  Correct time is a security control: Kerberos fails beyond five minutes of
!  skew and no log correlation across sixteen devices and nineteen VMs is
!  possible without a common clock. Packet Tracer's time model is simulated,
!  so `show ntp status` on a simulated device cannot be accepted as evidence
!  that the device synchronised. What the project evidences instead is (a) the
!  NTP client configuration and peer ACL, and (b) the authoritative time chain
!  on the real estate: `w32tm /query /status` on a Windows guest and
!  `chronyc sources -v` on a Linux guest, both pointing at 10.10.30.11.
```

```bash
# --- Configuration backup, Mechanism A: TFTP pull --------------------
# On vpnz-mon01, where the TFTP root is /srv/tftp (0755). The IOS side
# initiates the copy; the server serves the file.
!   VP-HQ-CORE-01# copy running-config tftp://10.10.30.31/VP-HQ-CORE-01.cfg
sudo -u git -H git -C /srv/tftp/archive add VP-HQ-CORE-01.cfg
sudo -u git -H git -C /srv/tftp/archive commit -m "config pull $(date -Iseconds) VP-HQ-CORE-01"

# --- Mechanism B: configuration-as-code in Git -----------------------
# Every device's intended configuration is maintained as a text file in
# 03-build/packet-tracer/configs/ (VP-HQ-CORE-01.cfg ... VP-ISP-EDGE-01.cfg,
# sixteen files) and committed. This is the reviewable, diffable artefact --
# it is NOT produced by logging in to the device, because Packet Tracer has no
# SSH server reachable from external tooling and no API.
ls -1 03-build/packet-tracer/configs/
```

**強制的誠實聲明。** 基準文件明確，而本章實質上重述：**沒有任何 Ansible playbook 與 PowerShell 腳本曾登入 Packet Tracer 裝置。** Packet Tracer 不對外部工具暴露 SSH 伺服器，也沒有 API。軌道 A 把 Git 中的設定文字檔視為真實來源，並透過 Packet Tracer 自身的 CLI 與儲存工作流程套用它們；軌道 B 則針對 Linux 與 Windows 環境撰寫並測試 `08-collect-network-configs.yml` 與 `Backup-NetworkDeviceConfig.ps1`，並附一份已記錄的落差分析，明確指出真實裝置會需要什麼（經 SSH 使用 `netmiko`/`napalm`，或廠商 API）。**聲稱某個 playbook 曾配置 Packet Tracer 裝置將屬捏造，而這是本專案最容易失去可信度的方式。**

#### 9.13.5 與自動化線及 AI 線的介面

本小節產出資料；它不消費資料。

| 此處產出的成果 | 消費方 | 方式 |
|---|---|---|
| 全部十六台裝置至 `vpnz-mon01` 的 Syslog | 自動化（第 10 線）與 AI 網絡管理（第 11 線） | Loki 儲存它、Grafana 查詢它，而 AI 代理的 `get_active_alerts` 與 `get_auth_failures` 唯讀工具由此衍生 |
| SNMPv3 計數器與鏈路狀態 trap | AI 網絡管理 | `get_interface_stats` 唯讀工具輪詢 SNMPv3 並回報計數器與錯誤的變化量；基準文件的能力示範 #1（`VP-HQ-DSW-A02 gi0/1` 上的介面錯誤）取決於此路徑 |
| Git 中的裝置設定文字檔 | 網絡自動化 | `08-collect-network-configs.yml` 與 `Backup-NetworkDeviceConfig.ps1` 收集並歸檔它們；漂移偵測會把執行中的設定與其 Git 版本作比較 |
| CDP 鄰居輸出 | 文件記錄與驗證 | 實際觀察拓撲表是一項驗證成果，並非自動化輸入 |
| 附 5-tuple 的信任邊界拒絕事件 | AI 網絡管理，能力示範 #2（暴力破解偵測） | 代理把登入失敗爆發與來源子網相關聯，並提出 ACL 檢查建議；基準文件的範例使用來自 `10.10.70.50`（位於隔離實驗室）的爆發，該位址「根本不應能觸及 DMZ」—— 引用 TB-09 |

唯讀的限制適用於此表中的每一項：AI 代理可以**輪詢**這些來源並以差異形式**提出**變更，但絕不得寫入裝置。該界線定義於 AI 線中，此處不再重述。

---

### 9.14 網絡層的高可用性與韌性

#### 9.14.1 真正具備冗餘的部分

| 層 | 機制 | 能承受的失效 | 證據 |
|---|---|---|---|
| 總部首跳閘道 | **HSRP，四個群組**；`CORE-01` 以 150 作用中並啟用搶佔與介面追蹤，`CORE-02` 待命 | `VP-HQ-CORE-01` 的失效、其幹道鏈路之一的失效，或其接取鏈路（經追蹤）的失效 | §9.7.3 的故障切換序列；切換前後的 `show standby brief` |
| 總部第 2 層拓撲 | **配備 RSTP 的雙線歸屬接取交換器**；每台接取交換器有一條上行處於丟棄的替代角色 | 一條上行的失效、一台核心交換器的失效 | 顯示替代埠的 `show spanning-tree`；拔線測試 |
| 總部內部路由 | **OSPF，由兩個核心發言者公告相同的 VLAN 子網** | 任一核心的失效；另一台重新公告並接管 | 關閉一台核心後的 `show ip ospf neighbor` |
| 總部對外／DMZ 邊界 | **配備 Keepalived VRRP 的 Nftables 高可用對組**（`vrid 51`，VIP 10.10.50.10）—— 真正已配置的 Linux | `vpnz-nft01` 的失效；VIP 移轉至 `vpnz-nft02` | Keepalived 故障切換擷取（Linux 線） |
| 互聯網轉送 | **兩條 eBGP 連線**（AS 65000 主要、AS 65002 替代）配以 local-preference 選擇 | 一個供應商連線的失效 | §9.10.4 的故障切換示範 |
| 站點間路由 | **經觀塘 WAN1 鏈路的 OSPF**；澳門使用 EIGRP AS 100 | 一條廣域網路鏈路的失效僅隔離該站點 | Traceroute 與路由表證據 |
| 分支身分驗證 | **觀塘 RODC**（`vpnz-brdc01`）配以已快取的憑證集（Microsoft 線） | 總部廣域網路中斷時仍允許分支登入 | Microsoft 線，引述於此是因為它改變了廣域網路失效的*後果* |

#### 9.14.2 每個主要元件失效時會發生什麼

| 失效的元件 | 立即影響 | 設計的行為 | 殘餘衝擊，誠實述明 |
|---|---|---|---|
| `VP-HQ-CORE-01` | 停止轉送；四個 SVI 上的 HSRP hello 停止 | 在三秒的 hold 時間內，`CORE-02` 接管全部四個群組，STP 重新收斂並以其為根橋；四台接取交換器均保持連通 | 輕微壅塞：所有總部 VLAN 間流量現在僅經 `CORE-02`。使用者無須任何動作，預設閘道不變 |
| `VP-HQ-CORE-02` | 失去待命閘道與 RSTP 次級根橋 | 不會發生故障切換 —— `CORE-01` 本已作用中且為主要；使用者看不出任何變化 | **此時總部已無閘道冗餘。** 隨後若 `CORE-01` 失效將無從緩解。這是本設計最重要的殘餘暴露 |
| 兩台總部核心交換器 | 完全喪失總部內部路由及所有總部閘道 | 別無他法；沒有第三台裝置 | **總部全面中斷。** 基準文件的非目標「硬體層不提供高可用性」意味著未設計任何機箱層級的保護，報告不得暗示相反 |
| 一條總部接取交換器上行 | STP 在受影響的幹道上封鎖／解除封鎖 | 替代上行成為根埠；該交換器保持可達 | 受影響 VLAN 在重新收斂期間的短暫中斷 —— 在 Packet Tracer 中屬模擬產物 |
| 整台總部接取交換器 | 該交換器的使用者失去服務 | 無故障切換：該交換器對其自身埠而言是單一失效點 | 該樓層的使用者失去連線，直到交換器被更換。已記錄，未緩解 —— 本設計不含交換器層級的堆疊（Packet Tracer 不支援） |
| `VP-HQ-EDGE-01` | 總部失去其廣域網路邊緣、其 eBGP 連線、其 OSPF 預設路由產生能力以及**唯一的再分佈點** | **沒有任何東西會故障切換。** 沒有第二台邊緣路由器 | 觀塘在其自身子網之間保有 OSPF，但無法觸及總部；澳門因 EIGRP 唯一的總部發言者已消失而被隔離；DMZ 失去其互聯網路徑。**這是本設計中最大的網絡層韌性缺口，已明確述明而非粉飾** |
| 一條 eBGP 連線 | 該連線上供應商的前綴被撤回 | 替代連線的路徑由最佳路徑演算法自動提升；企業邊緣無須任何設定變更 | 回程路徑可能改變，而企業自身的公告在兩條連線上持續 |
| 兩條 eBGP 連線 | 總部失去互聯網可達性 | 別無他法 | 已發布的 DMZ 服務從模擬互聯網變成不可達；內部服務不受影響 |
| `VP-HQ-FW-01`（ASA） | DMZ 失去其閘道；周邊失去發布功能與 IPsec | **無故障切換。** 基準文件排除 ASA 故障切換對，模擬器也不為其建模 | 所有已發布服務從外部變成不可達；至灣仔的 IPsec 隧道中斷。內部流量（由 nftables 對組過濾）持續 |
| 一名 nftables 對組成員 | Keepalived VIP 移轉 | 真正的故障切換，以擷取到的 VIP 轉移為證 | VRRP 轉換期間的短暫中斷 |
| **兩名** nftables 成員 | 總部失去從 `Z-USER`/`Z-SERVER` 通往互聯網的唯一路徑 | 別無他法 —— 這是刻意設計的瓶頸點 | 內部對內部的流量持續；所有對外流量停止。這是單一對外架構的刻意後果 |
| 觀塘 WAN1 鏈路 | 分支失去 OSPF 鄰接與總部可達性 | 分支在本地持續運作：工作站保有 8 小時的 DHCP 租約，RODC 繼續提供登入與 DNS | 在快取憑證時窗過後無法取得新的 DHCP 租約與新的認證；分支的檔案存取僅限本地快取。**這正是 Microsoft 線授權在分支設置 RODC 的原因，而 Cisco 線的廣域網路設計唯有與之結合才站得住腳** |
| 澳門廣域網路鏈路 | EIGRP 鄰接中斷；澳門失去所有總部路由 | 澳門僅保有自身的區域網路（VLAN 120、121） | 四名澳門員工僅有本地連線，別無其他。沒有第二條路徑，也未設計任何第二條路徑 |
| 灣仔 IPsec 隧道 | 灣仔失去總部可達性 | WireGuard 路徑（Linux 線）是替代傳輸，而基準文件要求團隊記錄哪一種機制為權威 | 除非兩種傳輸都已測試且皆可用，報告不得聲稱隧道具冗餘 |
| 模擬器中的 TCP/IP 堆疊失效 | 依症狀而定 | 以 §9.16 的目錄加以診斷 | 連同模擬器建置版本記錄為一項發現事項，這是正當的學術內容 |

#### 9.14.3 本設計**不**提供的部分

這份清單的存在，是為了使可用性聲明不致被解讀得比實際更廣：(1) **沒有 LACP/PAgP EtherChannel** —— 模擬器限制加上專案自身的限定條件（§9.6.4）；(2) **沒有 GLBP** —— 標準點名，未獲忠實支援，故未使用（§9.7.2）；(3) **沒有 ASA 故障切換對或叢集** —— 未建模（§9.12.1）；(4) **沒有備援的廣域網路邊緣路由器** —— 單一台 `VP-HQ-EDGE-01` 承載廣域網路、兩條 eBGP 連線及唯一的再分佈點；(5) **沒有備援的分支廣域網路鏈路** —— 觀塘、澳門與灣仔各只有一種傳輸；(6) **沒有 MPLS、SD-WAN、DMVPN 或 GRE** —— 標準點名 DMVPN 與 GRE，兩者皆未實作，且兩者皆不得出現在已交付功能清單中；(7) **沒有任何形式的硬體冗餘** —— 沒有雙電源、沒有雙管理模組、沒有堆疊，此為專案自身的非目標；(8) **沒有 QoS** —— 沒有標記、佇列或整形，故語音品質僅在 VLAN 隔離與 DHCP 選項配置的層級上加以聲稱（§9.2.4）；(9) **本小節中每一項取自 Packet Tracer 的數據都是模擬產物**，並非量測所得的真實世界可用性或收斂數據。

---

### 9.15 證據與螢幕截圖核對清單

HDTN 課題說明表要求學生*「產出組織良好的文件，包含所有與專案相關的發現、手冊、步驟、螢幕擷取、驗證與參考資料。」***WSOS 2026 並不包含任何螢幕擷取要求** —— 字串 `screen`、`capture`、`screenshot` 與 `evidence` 出現零次 —— 故此核對清單背後的義務來自課題說明表，而報告中必須正確作出歸屬。螢幕截圖以 `{date}_{host}_{what}.png` 儲存於 `07-evidence/` 之下，且每一則圖說均採用專案範本 `Figure {n}: {what} — {host} — {command or action} — {date}`。

**平台與清單：****每一台十六台裝置**上完整的 `show version`，並把確切的型號與映像字串抄錄至版本表（§9.4.1）—— 基準文件強制要求的建置日擷取（[O-02]）；`05-full.pkt` 的實體檢視截圖，顯示全部十六台裝置（圖 9.1）；顯示定址架構的邏輯檢視截圖；`01-l2l3-core.pkt` … `05-full.pkt` 的目錄清單，作為分階段進度的證據；以及 Packet Tracer 建置編號（Help → About），用以固定實際使用的模擬器版本。

**基礎設定與強化：**`VP-HQ-CORE-01` 與 `VP-HQ-EDGE-01` 上 `show running-config` 的基礎區段（主機名稱、網域名稱、secret、使用者、AAA）；`show ip ssh` 與 `show crypto key mypubkey rsa`；`show run | include banner` 加上連線時所顯示的登入橫幅；裝置上的 `show logging` 以及 `vpnz-mon01` 上相應的接收行；`show line vty 0 4` 與 `show line console 0`；在一次成功與一次失敗的管理嘗試之後，附命中計數器的 `show ip access-lists ACL-MGMT-IN-10`；以及 `show snmp user` / `show snmp group` 加上收集器端顯示一次 SNMPv3 輪詢 —— 若模擬器拒絕 SNMPv3，則附上該限制的說明。

**VLAN、幹道與 RSTP：**兩台核心與**全部四台**總部接取交換器上的 `show vlan brief`；兩台核心及每條接取交換器上行上的 `show interfaces trunk`，且原生 VLAN 欄位在各處均顯示 `999`；顯示 VLAN 999 關閉埠的 `show interfaces status`；`VP-HQ-CORE-01` 上的 `show spanning-tree vlan 40`，證明其為優先值 4096 的根橋；`VP-HQ-DSW-A01` 上的 `show spanning-tree vlan 40`，證明根與替代角色；`show spanning-tree summary`；**拔線測試**，附拔線前、關閉鏈路時與之後的 `show spanning-tree`；**連接埠安全測試**（在受保護埠上接入第二個 MAC），附 `show port-security interface`；**BPDU-guard 測試**，顯示該埠進入 `err-disabled` 及相應的 syslog 行；**DHCP-snooping 測試**，在接取埠上設置惡意 DHCP 伺服器並顯示被封鎖的 offer；以及可示範時，顯示該埠進入 root-inconsistent 的 root-guard 測試。

**VLAN 間路由與 HSRP：**兩台核心上的 `show ip interface brief`；**兩台**核心上的 `show standby brief`；完整的 `show standby vlan 40`；**三張截圖的故障切換序列**（之前、注入失敗、之後）；故障切換前後的工作站 `ipconfig`，證明預設閘道未改變；跨故障切換的連續 ping，其中斷處可見並標示為模擬產物；以及顯示復原後 VIP 回到 `CORE-01` 的 `show standby brief`，作為搶佔的證明。

**OSPF：**`VP-HQ-CORE-01`、`VP-HQ-CORE-02`、`VP-HQ-EDGE-01` 與 `VP-BR-EDGE-01` 上的 `show ip ospf neighbor`，全部為 FULL；`VP-HQ-CORE-01` 上的 `show ip ospf interface brief`；`VP-HQ-EDGE-01` 上的 `show ip ospf database`，顯示 Router LSA、單一 Network LSA 與 **標籤可見**的 Type-5 外部路由；`VP-HQ-EDGE-01` 與 `VP-BR-EDGE-01` 上的 `show ip route ospf`；一項**鄰接失效示範**（認證金鑰不匹配、無鄰接、以 `debug ip ospf adj` 作為診斷，然後修復）；由 `show ip ospf neighbor` 取得的 DR/BDR 證明；以及從總部伺服器 VLAN 主機至觀塘主機的 `traceroute`。

**EIGRP：**`VP-MO-EDGE-01` 與 `VP-HQ-EDGE-01` 上的 `show ip eigrp neighbors`，顯示恰好一個鄰居且佇列計數為零；`show ip eigrp topology`，其中每一筆項目均為 `P`，且 `10.20.20.0/24` 與 `10.70.0.0/16` **不存在**；`VP-MO-EDGE-01` 上的 `show ip route eigrp`，其中可見管理距離 90；`VP-HQ-EDGE-01` 上的 `show ip protocols`；一項**卡在 Active** 的示範，附 `show ip eigrp topology active` 與復原過程（在可重現時）；以及一項認證測試，使金鑰不匹配導致關係無法形成，然後修復。

**BGP：**`VP-HQ-EDGE-01` 上的 `show ip bgp summary`，兩個連線皆為 Established 並附前綴計數；完整的 `show ip bgp`，其最佳路徑標記在圖說中逐行解釋；`show ip bgp neighbors 10.10.100.2 advertised-routes`，顯示**恰好兩個前綴**；作為對照的 `received-routes` 與 `routes`；顯示管理距離 20 的 `show ip route bgp`；在主要連線關閉前後的一對 `show ip bgp summary` 與 `show ip route bgp`；一項**前綴過濾示範**，以一個未經授權的前綴自入向提供並將拒絕取證；`show route-map RM-EDGE-OUT` 與 `show ip prefix-list PL-EDGE-ANNOUNCE`；以及一項**連線失效示範**（錯誤的 `remote-as` 或密碼），附由此產生的 `show ip bgp summary` 狀態，然後修復。

**再分佈：**`VP-HQ-CORE-01` 上的 `show ip route 10.10.120.0` —— `type extern 2`、**tag 200**、由 `10.255.0.21` 公告；`VP-BR-EDGE-01` 上的同一前綴；`VP-MO-EDGE-01` 上的 `show ip route 10.10.30.0` —— `distance 170`、`type external`、**tag 100**；`show route-map RM-OSPF-TO-EIGRP` 與 `show route-map RM-EIGRP-TO-OSPF` 附命中計數器；刻意錯誤設定的實驗所需的**四張截圖**（移除標籤、觀察到 `Route tag 0`、修復、標籤復原）；兩個方向的 `traceroute` 並附跳點序列註解；以及缺席的證明 —— `VP-MO-EDGE-01` 上的 `show ip eigrp topology` 未出現 `10.20.20.0/24` 與 `10.70.0.0/16`。

**ASA：**`show version`，並抄錄型號與映像字串；`show interface ip brief` 與 `show route`；`show run interface`；`show run object` 與 `show run object-group`；`show access-list ACL-OUTSIDE-IN-10` 與 `show access-list ACL-DMZ-OUT-10`，並附**流量測試之後的命中計數器**；顯示全部三種 NAT 形式的 `show nat`；顯示一筆被拒絕流量及其 5-tuple 以及 `vpnz-mon01` 上相符行的 `show logging`；`show crypto ikev2 sa`（若已退回則為 IKEv1 等效命令）與 `show crypto ipsec sa`，顯示已建立的 SA、非零的封包計數，以及隧道 ping 期間持續增加的計數器；**§9.12.6 流量測試矩陣每一列各一張截圖**（十二列）；以及在 `vpnz-dmzrev01` 上的一次 `tcpdump` 擷取，顯示一筆 DMZ 至內部的嘗試被丟棄，並與 ASA 日誌行相互關聯。

**管理、監控與流量分析：**每台裝置上的 `show cdp neighbors detail`，加上由此建立的實際觀察拓撲表；支援時的 `show lldp neighbors`；一台裝置上的 `show ntp status` 與 `show ntp associations`，加上 `vpnz-mon01` 上的 `chronyc sources -v` 及 Windows 客體上的 `w32tm /query /status`；TFTP 設定提取，附 `vpnz-mon01` 上收到的檔案及設定歸檔的 Git 記錄，顯示附時戳的提取提交；§9.13.3 的四次 `tcpdump` 擷取，並在圖說中引述其命令列；以及一張 NetFlow 限制說明備註的截圖，並交互參照至其軌道 B 設定區塊。

**韌性：**核心交換器失效，附切換前後的 `show standby brief` 與 `show spanning-tree`；邊緣路由器失效，附切換前後的 `show ip bgp summary`、`show ip route` 與一次 `traceroute`，並誠實記錄其後果；觀塘廣域網路鏈路拔線，附拔線前後的 `show ip ospf neighbor` 及分支工作站的連線狀態；以及把 §9.14.3 的已聲明缺口清單重現於報告的限制章節，並附頁碼參照。

---

### 9.16 常見失效模式與疑難排解

本小節的存在，是因為**疑難排解佔 WSOS 2026 的 25 %**，且該標準自身的條文 `Use network package inspection, connectivity checking tools etc to troubleshoot and identity problems in a network.` `[sic]` 使診斷方法成為一等交付成果。每一列都是團隊能夠執行、觀察、診斷並記錄的測試，且每一項都預期至少執行一次，使證據為真實。

| # | 問題 | 症狀 | 診斷命令 | 可能成因 | 解決方式 |
|---|---|---|---|---|---|
| 1 | **幹道未能形成** | 主機無法觸及其閘道；`show interfaces trunk` 顯示 `access` 或 `not-trunking` | `show interfaces <port> switchport`、`show interfaces trunk`、`show interfaces status` | 一端設為 `switchport mode trunk` 而另一端留在 `dynamic auto`/`access`；僅一側有 `nonegotiate`；封裝不匹配 | 在**兩端**均設定 `switchport mode trunk`、在兩端均設定 `switchport nonegotiate`，並確認 `switchport trunk encapsulation dot1q`。此處兩端一律以靜態方式建立幹道，故出現此狀況即表示漏了一行 |
| 2 | **幹道上未允許該 VLAN** | 該 VLAN 存在且其埠已指派，但其中沒有主機能在交換器之外通訊 | `show interfaces trunk`、`show vlan brief`、`show interfaces switchport` | `switchport trunk allowed vlan` 清單漏列該 VLAN —— 這是輸入清單時未加 `add` 的常見後果，因為那會**取代**而非附加 | 以 `switchport trunk allowed vlan add <id>` 加入。省略 `add` 會取代整份清單並悄悄破壞其他 VLAN |
| 3 | **原生 VLAN 不匹配** | `%CDP-4-NATIVE_VLAN_MISMATCH`；一側的管理流量抵達意外網段；STP 記錄 PVID 不相容 | `show cdp neighbors detail`（Native VLAN）、`show interfaces trunk`（Native vlan）、`show spanning-tree` | 一端設為原生 VLAN 999，另一端留在預設的 1 | 在兩端均設定 `switchport trunk native vlan 999`。這正是本設計以 CDP 作為檢查工具的原因；此故障所產生的日誌行值得刻意擷取作為證據 |
| 4 | **生成樹迴路** | 廣播風暴；CPU 負載；MAC 表不斷變動；使用者完全失去連線；輸出速率急升 | `show processes cpu sorted`、`show spanning-tree`、`show interfaces counters`、`show mac address-table count`、`show spanning-tree inconsistentports` | 一條備援鏈路在兩處同時轉送：需要 PortFast 而缺少此設定的埠、被 BPDU 過濾的埠、幹道的允許清單漏掉某個 VLAN 以致 STP 在每條幹道上看到不同拓撲，或 Root Guard 套用在錯誤的埠上 | 先採取緊急行動：關閉一條備援鏈路以止住風暴。然後找出在不該轉送時仍轉送的埠並加以修正。**僅在一側的允許清單漏掉某個 VLAN，是此問題最隱晦的版本，也正是允許清單必須明確的原因** |
| 5 | **HSRP 未進行搶佔** | 復原後的核心從未取回虛擬 IP；`show standby brief` 顯示它儘管優先值為 150 卻無限期停留在 `Standby` | `show standby brief`、`show standby vlan 40`、`show run interface vlan 40` | 復原中的裝置缺少 `standby preempt`；或 30 秒的搶佔延遲超過觀察時窗；或某個受追蹤介面確實仍為 down，使有效優先值低於 100 | 確認存在 `standby 2 preempt delay minimum 30`；在 `show standby` 中讀取有效優先值（`Priority 150 (configured 150)` 這一行顯示追蹤遞減後的值）；確認每個受追蹤介面均為 up。若某個受追蹤介面為 down，追蹤正在正常運作 —— 該修的是鏈路，不是 HSRP |
| 6 | **兩台 HSRP 路由器均為作用中** | 重複的回應；連線時斷時續；ARP 項目在兩個 MAC 位址之間跳動 | 兩台裝置上的 `show standby brief`、詳細的 `show standby`、`debug standby events` | 一個第二層問題使 hello 無法互達 —— 最常見的是兩個 SVI 雖屬同一 HSRP 群組，卻**不在同一 VLAN 的廣播域**（一側的幹道未承載該 VLAN）；或 HSRP 認證不匹配；或群組編號不同 | 確認該 VLAN 已在兩台核心之間以及通往接取交換器處建立幹道；確認四個群組編號（VLAN 30/40/70/80 上的 1/2/3/4）與認證字串相符；比對兩台裝置的 `show standby` 輸出，其中各自顯示對方的觀點 |
| 7 | **OSPF 鄰接卡在 `INIT`** | `show ip ospf neighbor` 顯示 `INIT`；沒有路由交換 | `show ip ospf neighbor`、`debug ip ospf adj`、`show ip ospf interface <int>`、`show run interface <int>` | **單向**的 hello 接收：本機路由器聽到鄰居，反之則否。此處的成因：某個 ACL 丟棄協定 89、跨越幹道的單向可達性、回程路徑中斷，或僅一側配置認證 | 先確認雙向的第二層可達性（在共享網段上使用 `show mac address-table`），然後檢查兩側的 `ip ospf authentication` 與金鑰 ID，其後再尋找過濾 OSPF（協定 89）的 ACL |
| 8 | **OSPF 鄰接卡在 `EXSTART`/`EXCHANGE`** | 狀態不再前進；日誌可能顯示重傳 | `show ip ospf neighbor`、`show ip ospf interface <int>`、`ping <neighbour-ip> size 1500 df-bit` | **MTU 不匹配**：資料庫描述交換需要共同的 MTU，而其中一側較大 | 使兩側的 MTU 相同（`ip mtu`）。若 MTU 是成因，帶 df-bit 的大型 ping 會失敗 |
| 9 | **OSPF 鄰接反覆啟閉** | 鄰居反覆達到 FULL 然後中斷；`%OSPF-5-ADJCHG` 重複出現 | `show ip ospf neighbor`（運行時間重置）、`show log`、`show ip ospf interface`（計時器）、`show interfaces`（錯誤、CRC） | hello 或 dead 計時器不匹配；實體層問題使鄰接重置；雙工不匹配；一側的計時器已調校而另一側留在預設 | 在兩側明確使計時器相符。若計時器相符，檢查介面錯誤計數器 —— 那也是 AI 線第一項能力示範的輸入 |
| 10 | **鄰接為 FULL 但路由不存在** | `show ip ospf neighbor` 健康，但某個前綴從未出現 | `show ip route ospf`、`show ip ospf database`、`show run \| section router ospf`、`show ip ospf interface brief` | 該前綴的介面未參與：沒有 `ip ospf 1 area 0` 語句，或 `passive-interface default` 生效而該介面從未被解除被動，或區域錯誤 | 在該介面加上 `ip ospf 1 area 0`，或在需要鄰接處使用 `no passive-interface <int>`。`show ip ospf interface brief` 恰好列出參與者，是最快的診斷 |
| 11 | **EIGRP 鄰居卡住或未能形成** | `show ip eigrp neighbors` 為空，或鄰居反覆啟閉 | `show ip eigrp neighbors`、`show ip eigrp interfaces`、`debug eigrp packets hello`、`show run interface <int>` | AS 不匹配；K 值不匹配；認證金鑰不匹配或缺少；**該介面為被動**；或共享鏈路上的主要子網位址不匹配 | 比對兩台裝置上的 `show ip protocols`（AS 與 K 值）、比對 key-chain 名稱與金鑰字串、確認廣域網路介面上的 `no passive-interface`，並確認兩個介面位於同一 `/30` |
| 12 | **EIGRP 路由卡在 Active** | `show ip eigrp topology` 對某個前綴顯示 `A`；可能出現 `%DUAL-3-SIA`；該路由最終被移除 | `show ip eigrp topology active`、`show ip eigrp topology <prefix>`、`show ip eigrp neighbors`（Q Cnt）、`show log` | 後繼者遺失且不存在可行後繼者，故路由器向其無法回應的鄰居查詢：查詢期間介面反覆啟閉、鄰居自身正在查詢、路徑遺失且無替代（本設計的正常情況 —— 澳門只有一條路徑），或鄰居不可達 | 若成因是鏈路反覆啟閉，修復該鏈路。若確實是唯一路徑遺失，該路由*本應*進入 Active —— 發現事項在於該轉換及其時序。此處誠實的發現可能是「該路由進入 Active 達 N 秒，因為沒有可行後繼者且沒有第二條路徑：本設計沒有 EIGRP 冗餘」 |
| 13 | **BGP 連線無法建立** | `show ip bgp summary` 顯示 `Active`、`Connect`、`OpenSent` 或 `Idle`；前綴計數為零 | `show ip bgp summary`、`show ip bgp neighbors <ip>`、`debug ip bgp <ip>`、`show tcp brief \| include 179`、`ping <neighbour-ip>` | **`Active`** —— 無法開啟 TCP 179：無通往鄰居的路由、某個 ACL 阻擋 179，或 `remote-as` 錯誤。**`OpenSent`** —— TCP 已建立但 OPEN 被拒絕：AS 不匹配或 BGP 密碼不匹配。**`Idle`** —— 被管理性關閉，或反覆失敗後處於 hold-down | 由外向內逐步處理：先 `ping`（失敗表示路由或 ACL 問題，而非 BGP）；然後 `show tcp brief`（究竟有沒有嘗試建立 TCP 連線？）；再確認 `remote-as` 與鄰居的設定相符；然後比對密碼。`show ip bgp neighbors <ip>` 顯示最後的錯誤與通知 —— 先讀那一段 |
| 14 | **BGP 連線已建立但未學到前綴** | `show ip bgp summary` 顯示 Established，但前綴計數為 **0** | `show ip bgp neighbors <ip> routes`、`received-routes`、`show route-map RM-EDGE-IN-PRIMARY`、`show ip prefix-list PL-EDGE-IN-PRIMARY` | 入向路由對映未命中任何項目、前綴清單有誤，或鄰居僅送出由其 `network` 產生的路由，而對端的 `network` 語句在其路由表中沒有相符的路由 | 在對端確認該 `network` 語句有相符的路由（`show ip route <prefix>`）—— 除非該前綴的路由已存在，BGP 的 `network` 語句不會公告任何東西。在本端則把入向前綴清單對照 `received-routes` 檢查，而這需要 `neighbor ... soft-reconfiguration inbound` —— 這正是即便付出記憶體代價也要在建置期間啟用它的原因 |
| 15 | **BGP 連線已建立但過濾器拒絕一切** | `%BGP-4-INVALID_PREFIX` 或入向前綴上限警告；前綴計數低於預期 | `show ip bgp summary`、`show log \| include BGP`、`show ip prefix-list`、`show route-map` | 入向前綴清單過窄、終止 `deny` 比預期命中更多項目，或超出 `maximum-prefix`（此處意指供應商送出的前綴超過 100/200） | 閱讀日誌取得具體的拒絕原因，然後刻意調整清單並重新檢查 `show ip bgp`。記錄該拒絕是正確行為（本設計*就是希望*拒絕未預期的前綴）還是設定錯誤 |
| 16 | **再分佈迴路／非最佳路徑** | 流量進行兩台裝置的來回往返；`traceroute` 顯示重複的跳點；某個前綴同時以內部路由及 Type-5 外部路由出現於 OSPF 資料庫中 | `show ip route <prefix>`（查看標籤）、`show ip ospf database`、`show ip eigrp topology`、兩個方向的 `traceroute` | 路由標籤缺失或錯誤；某個前綴同時存在於兩個協定中而*內部*形式勝出；未經過濾的相互再分佈；或來自一條誤留的 `redistribute` 語句的第二個再分佈點 | 確認標籤符合設計（離開 OSPF 為 `100`，離開 EIGRP 為 `200`），且路由對映以明確的 `deny` 作結。在每台路由器上執行 `show run \| include redistribute` —— 這是一項十秒鐘的檢查，用以找出第二個再分佈點。然後重新執行 §9.11.5 的驗證組合 |
| 17 | **ASA ACL 未命中** | 預期應被允許的流量被丟棄；預期行的命中計數維持為零，而終止 deny 持續增加 | `show access-list <name>`（逐行 hitcnt）、`packet-tracer input <if> <proto> <src> <sport> <dst> <dport> detailed`、`show logging` | 行的順序 —— 較寬鬆的 deny 排在特定的 permit 之上；介面或方向錯誤；物件群組未如預期解析；或流量抵達的介面與假設不同 | 使用 `packet-tracer`：它依序走過 ASA 的決策路徑並指名確切命中的行，遠比憑推理更快。然後重新排序，使特定的 permit 先於一般性的 deny。**此處每一條 ACL 都以特定規則優先並附明確終止 deny 的方式撰寫，正是為了這個原因** |
| 18 | **ASA NAT 排序／NAT 未生效** | 流量通過 ACL 但抵達時來源位址錯誤；回程路徑失敗；`show nat` 顯示命中錯誤的規則 | `show nat`、`show nat detail`、`packet-tracer`（它會回報 NAT 決策）、`show run nat` | Manual NAT（第 1 區段）先於 Auto NAT（第 2 區段）被評估，而本設計的豁免規則正是 Manual NAT，好讓它們勝出。若豁免被寫成 Auto NAT，就可能先被動態 PAT 規則轉譯 | 由 `show nat` 確認實際命中的是哪個區段與序號；若命中的是錯誤的規則，把預期的規則移到 Manual NAT 或移到其區段內較低的序號。以 `packet-tracer` 確認，它會明確回報轉譯結果 |
| 19 | **ASA 安全等級混淆** | DMZ 至 inside 的流量未被任何 ACL 允許卻仍抵達；或 inside 至 DMZ 意外被封鎖 | `show interface`（安全等級）、`show access-list`、`packet-tracer`、`show run interface` | 安全等級模型預設允許高→低，並在沒有 ACL 時拒絕低→高。假定「沒有 ACL 即為拒絕」的設計者，會在一個方向出錯而在另一個方向正確 | 在兩個方向都套用**明確**的 ACL，對於報告必須提出證據的任何邊界，既不依賴隱含 permit 也不依賴隱含 deny。本設計對 TB-04 與 TB-06 正是如此，並述明僅對 inside→outside 與 dmz→outside 依賴隱含規則 |
| 20 | **流量被路由丟棄，而非被策略丟棄** | 某條流量失敗，而 ACL 命中計數器完全不變 | ASA 與途經路由器上的 `show route <destination>`、`traceroute`、`packet-tracer` | 沒有路由：ASA 的靜態路由涵蓋五個內部前綴，且刻意沒有 inside 預設路由，故新增至設計卻未加入此處的前綴將不可達 —— 而其症狀看起來與防火牆拒絕完全相同 | 在檢查 ACL**之前**先檢查路由表。「沒有路由」與「被拒絕」產生相同的使用者可見症狀，卻有完全不同的修法，而區分兩者是本目錄中最有價值的診斷之一 |
| 21 | **OSPF 路由器 ID 重複** | 鄰居形成後其中一個中斷；出現 `%OSPF-4-DUP_RTRID_NBR` 或「OSPF router with the same ID」錯誤 | `show ip ospf neighbor`、`show log \| include RTRID`、`show ip ospf` | 兩台裝置配置了相同的路由器 ID —— 此處最可能是複製貼上，使 `router-id 10.255.0.11` 留在第二台裝置上 | 在肇事的裝置上設定正確的、由 loopback 衍生的路由器 ID，並在**兩台**裝置上重置 OSPF（`clear ip ospf process`），然後重新驗證。這正是路由器 ID 取自 loopback 而非隨手輸入的原因 |
| 22 | **HSRP 介面追蹤未運作** | 某台核心失去其上行卻仍為 HSRP 作用中，形成黑洞：使用者的流量送往一個無法轉送它的閘道 | `show standby vlan 40`（Track interface 行與狀態）、`show run interface vlan 40` | 漏掉 `standby <grp> track <interface>` 語句，或它們追蹤的是不在轉送路徑上的介面（例如永不失效的 loopback） | 追蹤**承載流量的上行與幹道介面**，並使用足以使有效優先值降至待命端之下的遞減值。以關閉受追蹤介面並在 `show standby` 中觀察優先值下降來驗證 —— 從未如此測試過的追蹤並未獲得證明 |
| 23 | **`err-disabled` 埠且無明顯原因** | 原本可用的接取埠顯示 `err-disabled` 且不承載流量 | `show interfaces status err-disabled`、`show port-security interface <int>`、`show log \| include err-disable`、`show errdisable recovery` | BPDU Guard 被觸發（有人接上交換器或 AP）；連接埠安全違規；鏈路反覆啟閉偵測；或 DHCP-snooping 速率限制違規 | 先從 `show interfaces status err-disabled` 讀取原因 —— 它會指名觸發因素。然後修正成因並復原該埠（`shutdown` / `no shutdown`）。**刻意不配置 `errdisable recovery` 是一項設計決策：自動復原會抹去違規曾發生的證據** |

**有兩項診斷原則值得在報告中述明**，因為它們才是疑難排解領域真正要考驗的東西：(1) **從測試成本最低的層開始著手** —— 在閱讀防火牆 ACL 之前，先 ping；在閱讀路由表之前，先檢查介面狀態；在對 BGP 除錯之前，先確認 TCP 179 可達。上述大多數項目之所以能更快解決，是因為知道該看堆疊中的哪一層，而非知道更多命令。(2) **拒絕與缺少路由對使用者而言看起來完全相同** —— 第 20 項之所以存在，是因為這是分段設計中最常見的診斷錯誤，而兩者的修法（加入路由，或允許該流量）完全不同。報告應述明其自身的測試程序一律在檢查策略之前先檢查路由表。

---

### 9.17 發現事項

本小節是一份記錄「實際觀察行為對照設計行為」的範本。§9 中的每一項都預期至少產生一項發現，而本專案要求**即使結果平淡無奇也必須記錄發現**，因為一份只包含意外狀況的發現清冊並不算清冊。

| 欄位 | 指引 |
|---|---|
| **發現編號** | `F-L3-{nn}` —— 在本線內依序編號，絕不重複使用 |
| **測試案例編號** | 取自可追溯性矩陣的 `TC-L3-{nn}`，使該發現附著於一項已執行的測試，而非附著於一種意見 |
| **小節** | 受測設計的 §9.n 參照 |
| **已驗證的信任邊界列／標準條文** | 例如 `TB-04`，或該測試所支持之 WSOS 條文的逐字引述。每一項實測都必須引用其 TB 列，而每一項 WSOS 聲明都必須引用標準自身的用語 |
| **預期行為** | 設計所預測者，於測試執行**之前**寫下，使該預測無法被調整以迎合結果 |
| **實際觀察行為** | 實際發生的事，引述自命令輸出而非改寫 |
| **證據參照** | `{date}_{host}_{what}.png` 檔名、`.pkt` 檔名，或 `tcpdump` 命令及其擷取檔案 |
| **偏差及其類別** | *無*；*模擬器產物*（Packet Tracer 的呈現或時序差異，並非設計缺陷）；*設計缺陷*（設計有誤且設定已獲更正）；*文件缺陷*（網絡正確而設計文件有誤）；*基準文件缺陷*（權威基準文件本身自相矛盾或不完整 —— 已收集並帶入修訂日誌） |
| **解決方式** | 更改了什麼，或為何什麼也沒改 |
| **成本／時間影響** | 每一項發現都須記錄，因為風險登錄需要證據說明哪些技術確實消耗了時程 |
| **殘餘限制** | 該解決方式**未**修正的任何部分 —— 已聲明的缺口與軌道 B 項目即記錄於此，使它們不會被悄悄遺忘 |

有六項發現在擬案階段已可預見，並記錄於此使清冊一開始便非空白。每一項都是**文件缺陷**或**已聲明的缺口**，而非技術上的意外，且每一項都必須帶入基準文件的修訂日誌，而非在某個章節中悄悄更正。

| 發現編號 | 測試案例 | 小節 | 類別 | 內容 |
|---|---|---|---|---|
| **F-L3-01** | TC-L3-02 | §9.8.1 | **基準文件缺陷** | 基準文件將觀塘支線描述為 `OSPF area 0 area-range`，同時又述明 OSPF 網域為單一 area 0。`area range` 是 ABR 命令，在單一區域設計中不產生作用。實作依循單一區域設計，而該措辭差異已記錄以供修訂 |
| **F-L3-02** | TC-L3-09 | §9.7.2 | **基準文件缺陷 —— 已由 Rev 1.1 裁決 C-14 結案** | 基準文件 §4.1 指定一個 HSRP 群組（群組 1，虛擬 MAC `0000.0c07.ac01`），而其自身的 VIP 摘要卻在四個 VLAN 上列出四個 VIP；單一群組無法服務四個 SVI。實作使用四個群組、保留固定的群組 1 虛擬 MAC，且群組對 VLAN 的對應在基準文件修訂前屬 `[ASSUMPTION]` |
| **F-L3-03** | TC-L3-05 | §9.12.6 | **基準文件缺陷** | 基準文件將 ASA 的 outside 介面給為 `198.51.100.1/29`、模擬供應商邊緣給為 `203.0.113.1`，同時又把 IPsec 對等端置於 `203.0.113.5`，故 ASA 自身的預設路由有兩個站得住腳的下一跳。應在基準文件中為 ASA outside 預設路由加入一個單一的相鄰跳點位址 |
| **F-L3-04** | TC-L3-04 | §9.6.4 | **已聲明的缺口** | LACP 與 PAgP 由 WSOS 2026 點名而未獲示範，因為模擬器的多層交換器型號不支援 Port-Channel 設定，且專案自身的限定條件排除了實體層冗餘。建議作為在真實設備上第一步的未來工作 |
| **F-L3-05** | TC-L3-06 | §9.13.3 | **已聲明的缺口** | NetFlow 由 WSOS 2026 點名，而 Packet Tracer 無法產生。流量分析的角色由 SNMPv3 計數器、Syslog 與 `tcpdump` 填補；真實設備的 Flexible NetFlow 設定僅作為軌道 B 文件提供 |
| **F-L3-06** | TC-L3-08 | §9.10.4 | **模擬器產物** | Packet Tracer 所顯示的 BGP 與 HSRP 收斂時間屬模擬產物並已如此記錄；不得由其中推導任何真實世界的收斂數據。真正算數的發現是行為結果 —— 選中了哪條路徑，以及該選擇在無設定變更下發生改變 |

發現清冊維護於 `06-verification/`，並在最終報告的評估章節中摘要呈現；該處對哪些部分奏效、哪些部分需要已聲明的限制、以及哪些部分完全無法示範的誠實盤點，正是本專案各項聲明已按其證據校準的最強證明。
