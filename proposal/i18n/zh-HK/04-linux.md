## 8. Linux 伺服器管理

本線路負責人：**W2 — Linux 與服務**。參考標準：WorldSkills Occupational Standards 2026，*IT Network Systems Administration*（Skill 2447，WorldSkills Shanghai 2026）；本章依範疇及逐字需求條文引用該標準，並以本專案已驗證的擷取記錄（`research/wsos-2026-2447.md`）為依據。

### 8.1 概覽與目標

官方主題表將本線路命名為*「Linux Server Administrations (e.g., Nginx, Keepalived, nftables, OpenVPN/Wireguard, etc.)」*。本章即為該整條線路的實務手冊：其編寫方式，是讓手上已有設計基準的勝任讀者，無須另行研究即可建置、驗證及疑難排解整個環境中的每一個 Linux 元件。

#### 8.1.1 本線路所交付的項目

| 交付項目 | 實作元件 | 簡報指定的主要技術 |
|---|---|---|
| 具 TLS 終結及健康檢查上游的 DMZ 反向代理 | `vpnz-dmzrev01`、`vpnz-dmzrev02` | Nginx |
| 位於代理後方的 WordPress 內容節點（Nginx + PHP-FPM + MariaDB） | `vpnz-dmzwp01`、`vpnz-dmzwp02` | Nginx、MariaDB |
| DMZ 網頁層的浮動預設閘道 VIP | `vpnz-dmzrev01` / `vpnz-dmzrev02`（`vrid 61`，VIP `10.10.90.10`） | Keepalived |
| 具狀態的出口防火牆、NAT/DNAT 瓶頸點及日誌記錄 | `vpnz-nft01`、`vpnz-nft02`（`vrid 51`，VIP `10.10.50.10`） | nftables、Keepalived |
| 第二套獨立實作的遠端存取 VPN | `vpnz-lnxra01` | OpenVPN、Easy-RSA |
| 通往灣仔的站點對站點及遠端工作者通道 | `vpnz-nft01/02` ↔ `vpnz-wcwg01` 或員工用戶端 | WireGuard |
| DMZ 管理路徑 | `vpnz-dmzjump01` | SSH、已加固的主機 |
| 涵蓋整個 Linux 環境的 Linux 主機加固基準、時間、DNS、備份及日誌記錄 | 全部十部 Ubuntu 客體 | Bash 指令碼、rsync、systemd |

Linux 環境由十部從範本 `UBU2404-TEMPLATE-01` 複製而來的 Ubuntu Server 24.04.3 LTS 客體組成：`vpnz-dmzrev01`、`vpnz-dmzrev02`、`vpnz-dmzwp01`、`vpnz-dmzwp02`、`vpnz-dmzjump01`、`vpnz-nft01`、`vpnz-nft02`、`vpnz-lnxra01`、`vpnz-mon01` 及 `vpnz-ai01`。`vpnz-mon01` 與 `vpnz-ai01` 同時服務自動化及 AI 線路；本章僅涵蓋其作業系統層，其應用角色由其他章節負責。

#### 8.1.2 本線路對應 WSOS 2026 的哪些範疇

範疇 **4 Network and System Operations（25%）** 是本章的主要受益者，而其對應關係異常直接，因為標準本身即點名該技術。此處最相關的逐字需求條文為：

- `Install and manage web hosting services using modern web servers e.g. Apache, Nginx and IIS.`（範疇 4，*shall be able to*，第 12 行）——此條明確點名 **Nginx**，因此反向代理與 WordPress 節點可直接引用。
- `Install and manage IT infrastructure resources monitoring systems`，其巢狀範例為 `Icinga2`、`Nagios`、`Cacti`、`Windows Resource Monitor`（範疇 4，第 8 行）——本專案改用 Prometheus、Grafana 及 Loki，而本章明文說明此替代，而非暗示使用了該等巢狀產品。
- `Install and manage backup systems`，其巢狀範例為 `Windows Server Backup`、`rsync`、`Script based backup, e.g. Bash, Batch or PowerShell`（範疇 4，第 14 行）——Linux 環境採用 **rsync** 及 **Bash 指令碼式備份**，兩者皆為標準所點名；見 §8.9。
- `Setup public key infrastructure services`，其巢狀範例為 `Active Directory Certificate Services`、`OpenSSL`（範疇 4，第 10 行）——Linux 一側採用 **Easy-RSA**，它是 OpenSSL 的前端。本專案必須說明：它是透過 Easy-RSA 驅動 OpenSSL，而非直接撰寫指令碼呼叫 `openssl`。
- `Manage file systems`，其巢狀範例為 `Software RAID`、`mdadm`、`LVM/Dynamic disks`、`File systems such as NTFS, ReFS, EXT4 and NTFS.`（範疇 4，第 16 行）——Ubuntu 客體建構於 **LVM on EXT4** 之上，此點可引用；`mdadm` 軟體 RAID 僅作為已記錄的示範而操作，並非作為正式磁碟區，該限制已在 §8.2 說明。
- `Install and manage network time services` 及 `Install and manage domain name services (Windows DNS, BIND)`（範疇 4，第 5 及第 2 行）——在 Linux 上的實作，是作為 Windows DNS 伺服器的 **chrony** 用戶端及 **systemd-resolved/`resolv.conf`** 用戶端；本專案並**不**執行 BIND，並且明言此事。
- `Install and manage remote network access services`，其巢狀範例為 `SSH`、`Remote Desktop Services`（範疇 4，第 6 行），以及 `Install and manage terminal access services`，其巢狀範例為 `SSH`、`Remote Desktop Services`、`Telnet`（範疇 4，第 13 行）——此處的實作是對整個 Linux 環境進行 SSH 管理；`Telnet` 則刻意不予部署。

本章另使用三道銜接，而每一道都是**由具名條文推論而來，並非引文**：

1. **Keepalived → VRRP。** 標準中完全沒有出現 `Keepalived` 字串（在 2026 年文本及原始 HTML 中各出現 0 次）。標準確實包含 `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.`（範疇 3，第 4 行）。Keepalived *實作* VRRP，而 VRRP 正是該具名通訊協定，因此這道銜接相當有力——但它呈現為「通往具名通訊協定的銜接」，絕不表述為「標準要求使用 Keepalived」。
2. **nftables → 控制平面與資料平面安全。** `nftables` 同樣未出現（0 次）。銜接點為 `Apply basic security configuration for control and data plane`（範疇 3，第 5 行），並由 `Common types of attacks on network protocols and mitigation methods` 及 `Security protocols to secure local and wide area networks` 支持（範疇 3，know/understand，第 10 及第 6 行）。
3. **WireGuard → VPN 條文中的 `etc.`** `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.`（範疇 3，第 6 行）。**該條文點名 OpenVPN，並未點名 WireGuard，只有末尾的 `etc.` 涵蓋它。** 這是三道銜接中最弱的一道，而本專案凡論及 WireGuard 之處，均如此標示。

範疇 **6 Troubleshooting（25%）** 由 §8.12 服務，該節是刻意寫得完整的失效模式目錄；另由 §8.3.6、§8.4.5、§8.5.6 及 §8.6.6 服務，這四節各自是驗證程序而非敘述性文字。範疇 **5 Infrastructure Automation（15%）** 則間接獲得服務：本章每一個組態檔均由來自 `vpnz-mon01` 的 Ansible playbook 套用（`03-nginx-reverseproxy.yml`、`04-keepalived.yml`、`05-nftables-egress.yml`、`06-wireguard.yml`），而每一項 shell 程序均實作為 `04-automation/bash` 中的 Bash 指令碼；兩者皆為標準所點名（`Identify and implement infrastructure as code` → `Ansible.`；`Setup and run routine infrastructure maintenance operations using various scripting\programming languages` → `Bash`）。

**必須保留至最終報告的誠信說明。** WSOS 2026 並無任何關於螢幕擷取畫面的要求（`screen`、`capture`、`screenshot` 及 `evidence` 在標準中各出現 0 次）。§8.11 所要求的每一張螢幕截圖，均是**HDTN 主題表**的要求，該表要求文件須包含*「all findings, manuals, steps, screen captures, verifications, and references」*。本章從不將該擷取清單歸因於 WorldSkills。

### 8.2 基礎伺服器建置與標準化

#### 8.2.1 作業系統與安裝選項

鎖定的平台是 **Ubuntu Server 24.04.3 LTS（Noble Numbat）**，替代方案為最新的 24.04.x 點版本，或小組若偏好則為 Debian 13。設計中除了套件版本之外，沒有任何部分依賴 Ubuntu 專屬行為；這正是為何那些版本在基準的其他處被鎖定，並在此處於建置階段重新驗證。

安裝選項，對每一部客體一體適用：

| 選項 | 值 | 理由 |
|---|---|---|
| 映像檔 | `ubuntu-24.04.3-live-server-amd64.iso`，取自官方 Ubuntu 檔案庫 | 十部客體共用一個映像檔；不使用第三方鏡像站 |
| 安裝程式 | Subiquity，盡可能以非互動方式進行，使用範本上的 autoinstall 資料 | 可重現性；範本只建置一次然後複製 |
| 語言/地區設定 | `en_US.UTF-8`，鍵盤 `us` | 與報告語言一致，並避免日誌中出現控制台逸出字元 |
| 時區 | `Asia/Hong_Kong`（`HKT`，UTC+08:00） | 香港據點；內部由 `systemd-timesyncd`/`chrony` 保留 UTC |
| 檔案系統 | LVM on EXT4，不加密 | EXT4 是 WSOS 點名的檔案系統；LVM 可實現 §8.2.3 所述的磁碟區擴充。刻意**不**使用 LUKS，因為 Hypervisor 主機即信任邊界，而無人值守開機將需要在磁碟上放置金鑰，那比完全不加密更糟。`[假設]` 此取捨在單主機實驗室中可接受；此事必須在報告中說明 |
| 選用套件 | **僅** OpenSSH 伺服器 | 「Install third-party drivers」未勾選；除基底之外不使用 snap（`snapd` 可在不需要的客體上移除） |
| 管理使用者 | `fypadmin`，僅以 SSH 公開金鑰認證，隸屬本機群組 `gg-infra-admins` | 依基準：Linux sudo 群組對應 Windows 的 `GG-Infra-Admins` 群組，管理員以個人帳戶登入，絕不使用 `root`，也絕不使用共用帳戶 |
| cloud-init | 存在（範本由 cloud-init 佈建），但**於首次開機後停用** | 後續組態必須由 Ansible 擁有；若 cloud-init 保持啟用，它會在每次開機時重新套用網路與使用者狀態，兩套機制便會互相衝突。此失效絕不可誤歸因於 Ansible |
| IPv6 | 於核心及 netplan 層停用 | 本設計僅支援 IPv4；IPv6 不在範圍內 |

#### 8.2.2 分割區配置

每一部客體都使用同一種單磁碟配置；這正是使 40 GB 的 DMZ 客體與 100 GB 的監控客體僅在根邏輯磁碟區大小上有所差異的原因。

```text
Disk /dev/sda: 40 GiB (typical DMZ guest)
  sda1   2 MiB        EFI System Partition (FAT32)      -> /boot/efi
  sda2   1 GiB        /boot (ext4)
  sda3   rest         LVM physical volume (pv.1)
      └── ubuntu-vg            (LVM volume group, whole of sda3)
            ├── ubuntu-lv      ext4, root filesystem   -> /
            └── swap_1         swap
```

| 主機 | 根 LV 大小 | Swap | 理由 |
|---|---|---|---|
| `vpnz-dmzrev01/02` | 36 GiB | 2 GiB | Nginx、TLS 素材、日誌 |
| `vpnz-dmzwp01/02` | 38 GiB | 2 GiB | WordPress 上傳檔案及本機 MariaDB 資料目錄 |
| `vpnz-nft01/02` | 36 GiB | 2 GiB | 規則集、封包日誌、keepalived 狀態檔 |
| `vpnz-lnxra01` | 36 GiB | 2 GiB | Easy-RSA PKI；CRL 與已簽發憑證成長緩慢 |
| `vpnz-dmzjump01` | 56 GiB | 2 GiB | 它同時是 Linux 側的備份儲存庫（`/srv/backup/`） |
| `vpnz-mon01` | 92 GiB | 4 GiB | Prometheus TSDB、Loki 區塊、Git 儲存庫、TFTP/SCP 保存庫 |
| `vpnz-ai01` | 56 GiB | 2 GiB | 代理程式日誌、提案、收集器輸出 |

Swap 刻意設得很小，因為在單一主機的薄佈建磁碟上，swap 並不是安全網；它的存在只是讓 `systemd` 能記錄一次記憶體尖峰，而不致觸發 OOM 終止。調整大小則在線上以 LVM 完成：

```bash
# On vpnz-mon01, when the Prometheus TSDB outgrows its logical volume
sudo lvextend -L +20G /dev/ubuntu-vg/ubuntu-lv
sudo resize2fs /dev/ubuntu-vg/ubuntu-lv
df -h /    # verify the new size before continuing
```

`mdadm` 軟體 RAID 是 WSOS 點名的技術，但**並非**已交付設計的一部分：十部客體皆為單磁碟，而 Hypervisor 主機在架構上即是單點失效。允許在一部備用客體上建立軟體 RAID 示範磁碟區作為*實驗*，但必須標示為示範，而非設計的備援功能。

#### 8.2.3 介面命名與位址探索

本專案中，Linux 網路介面名稱**絕不硬式編碼**。撰寫 netplan 之前，必須先從機器讀取名稱：

```bash
ip -br link
ls /sys/class/net
```

在如 `vpnz-nft01` 這類雙 NIC 客體上的預期輸出：

```text
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
ens192           UP             00:50:56:3f:01:01 <BROADCAST,MULTICAST,UP,LOWER_UP>
ens224           UP             00:50:56:3f:01:02 <BROADCAST,MULTICAST,UP,LOWER_UP>
```

`ens192`/`ens224` 是**預期**名稱，但基準要求必須記錄實際名稱。因此下文每一段 YAML 都附帶一行註解，提醒建置者先確認名稱。由於本專案中的每個「VLAN」都是獨立的 Hypervisor 僅主機網路，而非 802.1Q 標籤，所以一張 NIC 恰好對應一個子網路，且任何 Linux 客體上都不存在 VLAN 子介面組態。這是設計上的近似做法，並已如此記錄：**分段成效**是真實的，**機制**則是模擬的。

#### 8.2.4 Netplan 靜態組態

`/etc/netplan/50-cloud-init.yaml` 是正規檔案（權限 `0600`、`root:root`）。以下提供兩個完整範例，因為這兩部主機的角色確實不同。

**範例 1 — `vpnz-nft01`，雙網段出口防火牆。** 兩個介面：一個面向 `Z-EGRESS`（`VNET-EGRESS`，10.10.50.0/28 傳輸網段），另一個面向通道/WAN 模擬網段（`VNET-WAN`，10.10.200.0/24）。出口側不安裝預設路由；預設路由經由 ASA 內部介面 `10.10.50.2` 指向外部，因為 nftables 這對主機內嵌於核心與 ASA 之間，而此 VM 是周邊防火牆之前的最後一個內部跳點。

```yaml
# /etc/netplan/50-cloud-init.yaml  —  vpnz-nft01  (nftables egress firewall, vrid 51, MASTER)
# Confirm interface names with `ip -br link` first; ens192/ens224 are expected, not guaranteed.
network:
  version: 2
  renderer: networkd
  ethernets:
    ens192:                                     # VNET-EGRESS -> Z-EGRESS (10.10.50.0/28 transit)
      dhcp4: false
      dhcp6: false
      accept-ra: false
      addresses:
        - 10.10.50.11/28                        # physical address of vpnz-nft01
      routes:
        - to: 10.10.0.0/16                      # all HQ private space is behind the core
          via: 10.10.50.1                       # VP-HQ-CORE-01 gi0/1.50
          on-link: false
        - to: 10.20.0.0/16                      # management space (Z-MGMT) is routed, never bridged
          via: 10.10.50.1
        - to: 10.70.0.0/16                      # isolated lab space, deliberately reachable by route only
          via: 10.10.50.1
        - to: default                            # everything else goes outward through the ASA inside
          via: 10.10.50.2                       # VP-HQ-FW-01 inside interface
      nameservers:
        addresses: [10.10.30.11, 10.10.30.12]   # the only resolvers permitted on a Linux guest
        search: [vertexpeak.fyp.lab]
    ens224:                                     # VNET-WAN -> transport segment (10.10.200.0/24)
      dhcp4: false
      dhcp6: false
      accept-ra: false
      addresses:
        - 10.10.200.2/24                        # Rev 1.1 ruling C-07: the node's own transport address
                                                # (vpnz-nft02 carries 10.10.200.3/24 on the same NIC role)
      # NOTE: this physical address is NOT the tunnel address. 10.10.200.0/24 carries both the
      # WireGuard TUNNEL network, and 10.10.200.1/24 belongs to the wg0 interface that floats
      # with the keepalived VIP (see §8.7.3), so the prefix is shared by two different objects:
      # the node's own transport address here, and the tunnel address on wg0. That is not a
      # duplicate owner because they are different addresses; it would only become a conflict
      # if the pair forwarded traffic into the rest of 10.10.200.0/24, which the design never does.
      # [RESOLVED by Rev 1.1 ruling C-07] The baseline fixes the tunnel addressing (10.10.200.1/24 floating with the
      # VIP, 10.10.200.5/24 on the Wan Chai peer, 10.10.200.64/26 for remote workers,
      # 10.10.200.200/32 and 10.10.200.201/32 for the management escape hatch), it fixes
      # VNET-WAN as the 10.10.200.0/24 emulation segment, and Rev 1.1 ruling C-07 also fixes the
      # physical address of each node's second NIC: 10.10.200.2 for vpnz-nft01 and 10.10.200.3 for
      # vpnz-nft02, inside 10.10.200.0/24 and not .1, not .5 and not inside .64/26.
      # The build must not re-open this: 10.10.200.2 is the value for vpnz-nft01 and 10.10.200.3 is the value for
      # vpnz-nft02 (the same NIC role on the second node of the pair), and the tunnel address stays 10.10.200.1 on wg0.
      routes:
        - to: 203.0.113.0/24                    # simulated provider / tunnel peer space
          via: 10.10.50.2
```

**範例 2 — `vpnz-dmzrev01`，DMZ 反向代理。** 依清冊有兩個介面（`VNET-DMZ` + `VNET-CORE`），但*服務*介面是 DMZ 那一個，而預設閘道是位於 `10.10.90.1` 的 ASA DMZ 介面。

```yaml
# /etc/netplan/50-cloud-init.yaml  —  vpnz-dmzrev01  (Nginx reverse proxy, vrid 61, MASTER)
network:
  version: 2
  renderer: networkd
  ethernets:
    ens192:                                     # VNET-DMZ -> Z-DMZ (10.10.90.0/24)
      dhcp4: false
      dhcp6: false
      accept-ra: false
      addresses:
        - 10.10.90.28/24                        # host address of vpnz-dmzrev01. 10.10.90.10 is the keepalived
                                                # VIP (see §8.4) and is owned by no node, so the VIP is
                                                # reserved and floating, never a node address
      routes:
        - to: default
          via: 10.10.90.1                       # VP-HQ-FW-01 ASA dmz interface
      nameservers:
        addresses: [10.10.30.11, 10.10.30.12]
        search: [vertexpeak.fyp.lab]
    ens224:                                     # VNET-CORE -> entry VLAN for management reachability only
      dhcp4: false
      dhcp6: false
      addresses:
        - 10.10.10.28/24                        # Rev 1.1 ruling C-07: address inside VLAN 10 LAN-HQ-CORE; the
                                                # baseline places the proxy pair on VLAN 10 as well as the
                                                # DMZ. It is not a policy bypass: TB-04 is still enforced at the ASA and at the nftables pair,
                                                # the default gateway is still 10.10.90.1, and it is used only for management reachability and
                                                # carries no published traffic. State this sentence in the design narrative.
```

套用 netplan 是一項分兩步、經風險管理的作業，因為一份錯誤的 netplan 檔案會使遠端 SSH 工作階段被鎖在外面：

```bash
sudo chmod 600 /etc/netplan/50-cloud-init.yaml   # netplan warns (and may refuse) on world-readable files
sudo netplan generate                            # render to systemd-networkd units without applying
sudo netplan try                                 # apply with a 120-second automatic rollback
# If the session survives, type Enter at the prompt; netplan commits and reports "Configuration accepted."
ip -br a                                         # verify both addresses and both flags UP
ip route show                                    # verify the default route points where you intend
```

#### 8.2.5 主機名稱與 hosts 檔慣例

主機名稱採用設計基準中的正規小寫字串：`vpnz-dmzrev01`、`vpnz-nft02`、`vpnz-lnxra01` 等等——RFC 1123 語法、小寫、不含底線、絕不縮寫、絕不變更大小寫。

```bash
sudo hostnamectl set-hostname vpnz-nft01
hostnamectl status | grep -E 'Static hostname|Operating System|Kernel'
```

預期結果：

```text
    Static hostname: vpnz-nft01
  Operating System: Ubuntu 24.04.3 LTS
            Kernel: Linux 6.8.0-xx-generic
```

`/etc/hosts` 經過標準化，使每一部客體即使 DNS 無法使用，也能解析自身及其直接對等節點——這對 `sudo` 的效能以及 `systemd` 單元的啟動排序都很重要：

```text
127.0.0.1       localhost
127.0.1.1       vpnz-nft01.vertexpeak.fyp.lab vpnz-nft01

# --- project static hosts (subset; full table is the design baseline's static host address table) ---
10.10.30.11     vpnz-dc01.vertexpeak.fyp.lab    vpnz-dc01
10.10.30.12     vpnz-dc02.vertexpeak.fyp.lab    vpnz-dc02
10.10.30.31     vpnz-mon01.vertexpeak.fyp.lab   vpnz-mon01
10.10.30.42     vpnz-lnxra01.vertexpeak.fyp.lab vpnz-lnxra01
10.10.50.10     keepalived-hq                   vpn.vertexpeak.fyp.lab wg.vertexpeak.fyp.lab
10.10.50.11     vpnz-nft01.vertexpeak.fyp.lab   vpnz-nft01
10.10.50.12     vpnz-nft02.vertexpeak.fyp.lab   vpnz-nft02
10.10.90.10     portal.vertexpeak.fyp.lab       www.vertexpeak.fyp.lab blog.vertexpeak.fyp.lab
10.10.90.10     keepalived-hq-web               # the nginx VRRP VIP, owned by no node
10.10.90.28     vpnz-dmzrev01.vertexpeak.fyp.lab vpnz-dmzrev01
10.10.90.29     vpnz-dmzrev02.vertexpeak.fyp.lab vpnz-dmzrev02

# --- IPv6 ---
::1             localhost ip6-localhost ip6-loopback
ff02::1         ip6-allnodes
ff02::2         ip6-allrouters
```

#### 8.2.6 SSH 加固

加固指示詞存放於 drop-in 檔案 `/etc/ssh/sshd_config.d/10-fyp-hardening.conf`（權限 `0644`），以免發行版自帶的 `/etc/ssh/sshd_config` 被分支修改，仍可接收套件更新。在 Ubuntu 24.04 上，OpenSSH 會在主檔案的**頂端**讀取 `Include /etc/ssh/sshd_config.d/*.conf`，因此先取得的值勝出——這正是加固檔必須命名為 `10-` 開頭的原因，也是建置者必須檢查是否存在啟用密碼認證的競爭檔案 `50-cloud-init.conf` 的原因。

```ini
# /etc/ssh/sshd_config.d/10-fyp-hardening.conf
# Vertex Peak FYP — Linux SSH baseline. Applied by 01-hardening-baseline.sh / 02-baseline-linux.yml
# Verify it is actually in force with:  sudo sshd -T | grep -E 'port|permitrootlogin|passwordauthentication'

Port 22
AddressFamily inet
ListenAddress 0.0.0.0

# --- authentication ---
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
AuthenticationMethods publickey
MaxAuthTries 3
MaxSessions 4
LoginGraceTime 30

# --- access restriction (belt and braces with nftables) ---
AllowGroups gg-infra-admins
DenyUsers root

# --- session and forwarding hardening ---
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
PermitTunnel no
GatewayPorts no
PermitUserEnvironment no

# --- protocol hygiene ---
HostbasedAuthentication no
IgnoreRhosts yes
UseDNS no
ClientAliveInterval 300
ClientAliveCountMax 2
LogLevel VERBOSE
Banner none
Subsystem sftp internal-sftp
```

關於兩項刻意決定，報告必須明說而非暗示：

- **使用 `AllowGroups gg-infra-admins`，而非 `AllowUsers`。** 基準的契約將 `AllowGroups gg-infra-admins` 列為此路徑的指示詞。列出四個個人帳戶的 `AllowUsers` 清單同樣有效，甚至可說更嚴格，但第五位管理員到任時，若不在每部主機上逐一編輯便無法延續。該群組是一個**本機**群組，其成員對應 Windows 的 `GG-Infra-Admins` 群組，而無論哪一種做法，成員都恰好是同樣那四位具名管理員。`[假設]` 若小組選擇以 `realmd`/`sssd` 讓 Linux 客體加入網域，本機群組將成為對應群組，而此指示詞不變。
- **在通用客體上使用 `AllowTcpForwarding no`**，並在 `vpnz-dmzjump01` 上有一項已記錄的個別主機例外；該主機*依設計*就是代理主機，因此需要在其自身的 drop-in 中啟用轉送。該例外屬於跳板主機的 runbook，而非標準基準檔案。

金鑰管理：SSH 金鑰為 **Ed25519**，每位管理員產生一組，公開金鑰部分存放於 Ansible 儲存庫的 `files/ssh/authorized_keys/` 之下。私密金鑰絕不存放於 `vpnz-mon01`。

```bash
# One-off, on the administrator's own machine, never on a lab guest:
ssh-keygen -t ed25519 -a 100 -C "adm-xx@vertexpeak.fyp.lab" -f ~/.ssh/id_ed25519_vpnz
ssh-copy-id -i ~/.ssh/id_ed25519_vpnz.pub fypadmin@10.10.50.11
ssh -i ~/.ssh/id_ed25519_vpnz -o PreferredAuthentications=publickey fypadmin@10.10.50.11 'id; uptime'
```

驗證加固確實生效（組態檔可能正確卻未被使用）：

```bash
sudo sshd -T | grep -Ei '^port|permitrootlogin|passwordauthentication|kbdinteractive|allowgroups|permitemptypasswords|logingracetime'
```

預期輸出：

```text
port 22
permitrootlogin no
passwordauthentication no
kbdinteractiveauthentication no
permitemptypasswords no
allowgroups gg-infra-admins
logingracetime 30
```

屆時密碼登入必須明顯失敗——這是 §8.11 的證據項目之一：

```bash
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no fypadmin@10.10.50.11
# expected: Permission denied (publickey).
```

#### 8.2.7 Sudo 政策

Sudo 僅限於 `gg-infra-admins` 群組使用，一律要求輸入密碼，並記錄至一個由監控及 AI 線路取用的專用檔案。

```bash
# /etc/sudoers.d/10-fyp-admins   (mode 0440, validated with visudo -c)
%gg-infra-admins ALL=(ALL:ALL) ALL
Defaults:%gg-infra-admins  timestamp_timeout=5, passwd_tries=3, logfile="/var/log/fyp/sudo.log", log_input, log_output
Defaults  use_pty
Defaults  env_reset, secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```

```bash
sudo visudo -c -f /etc/sudoers.d/10-fyp-admins      # must print "parsed OK"
sudo mkdir -p /var/log/fyp && sudo chmod 0750 /var/log/fyp && sudo chown root:adm /var/log/fyp
```

`log_input` 與 `log_output` 均啟用，以便管理 session 的指令與輸出可被還原——這是 Windows PowerShell 轉錄與指令碼區塊記錄的 Linux 對應作法，而情境敘述中的盡職調查問卷正要求該等記錄；這也是 AI 線路的 `auth-failure-report` 技能與 journald 併同讀取的稽核軌跡。

#### 8.2.8 無人值守的安全性更新

```ini
# /etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
```

```ini
# /etc/apt/apt.conf.d/52-fyp-unattended.conf
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Package-Blacklist {
    "nginx";
    "keepalived";
    "nftables";
    "openvpn";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "";
```

兩項刻意的選擇。**僅限安全性來源**，絕不使用 `-updates`，如此功能變更便無法在建置中途悄悄改變 `nginx.conf` 的語意。**套件黑名單**則涵蓋本專案鎖定組態的四項服務：`nginx`（1.24.0）、`keepalived`（2.2.8）、`nftables`（1.0.9）及 `openvpn`（2.6.x）僅透過經規劃、已建立快照、已驗證的變更來升級，因為悄然的版本變更會使基準鎖定紀律所要求的版本偏差小節失效。**`Automatic-Reboot "false"`** 則是因為實驗室 VM 在證據擷取途中自行重新開機會毀掉一次測試執行；核心更新旗標檔改由監控系統回報。

```bash
sudo systemctl enable --now unattended-upgrades
systemctl status unattended-upgrades --no-pager | head -5
sudo unattended-upgrade --dry-run --debug 2>&1 | tail -20     # see what it would do, change nothing
sudo cat /var/run/reboot-required 2>/dev/null || echo "no reboot pending"
```

#### 8.2.9 時間同步

`chrony` 是每部 Ubuntu 客體上的用戶端。`vpnz-dc01` 是整個 forest 的權威 NTP 來源，並與模擬的供應商解析器（`192.0.2.53`）同步；所有 Linux 機器都與 `10.10.30.11` 同步，並以 `10.10.30.12` 為第二來源。**時間偏差超過五分鐘會破壞 Kerberos**，這也是 §8.12 所記錄的疑難排解情境之一。

```ini
# /etc/chrony/chrony.conf  (project additions; the distro's default pool lines are removed)
# Vertex Peak FYP — Linux time.  Windows DCs are the authoritative sources.
server 10.10.30.11 iburst prefer
server 10.10.30.12 iburst

# Do not step the clock for small offsets; slew instead, so running services are not disturbed.
makestep 1.0 3

# Serve time to the isolated lab segment only if the lab relay needs it (not enabled by default).
# allow 10.70.0.0/24

driftfile /var/lib/chrony/chrony.drift
rtcsync
logdir /var/log/chrony
log measurements statistics tracking
```

```bash
sudo systemctl restart chrony
chronyc tracking          # "System time" offset must be well under 1 second
chronyc sources -v        # both 10.10.30.11 and 10.10.30.12 should show a '*' or '+' state
timedatectl               # "System clock synchronized: yes", "NTP service: active"
```

`vpnz-nft01` 上預期的 `chronyc tracking` 輸出：

```text
Reference ID    : 0A0A1E0B (10.10.30.11)
Stratum         : 2
Ref time (UTC)  : Tue Oct 06 02:14:07 2026
System time     : 0.000031427 seconds fast of NTP time
Last offset     : +0.000021882 seconds
RMS offset      : 0.000047382 seconds
Frequency       : 4.603 ppm fast
Residual freq   : +0.002 ppm
Skew            : 0.016 ppm
Root delay      : 0.000612827 seconds
Root dispersion : 0.000214573 seconds
Update interval : 64.2 seconds
Leap status     : Normal
```

#### 8.2.10 可重複執行的基準檢查清單

本清單是「已複製的 VM」與「可指派角色的客體」之間的關卡。它由 `04-automation/bash/01-hardening-baseline.sh` 執行，並由 `ansible/playbooks/02-baseline-linux.yml` 以冪等方式強制落實。每一行都有一道驗證指令；在主機本身觀察到每一行之前，建置不算完成。

| # | 檢查 | 指令 | 通過條件 |
|---|---|---|---|
| B-01 | DHCP 已關閉，定址為靜態 | `ip -br a` | 僅有預期位址，沒有 `dynamic` 旗標 |
| B-02 | 預設路由符合角色 | `ip route show default` | 與 §8.2.4 就該主機角色所述相符 |
| B-03 | 主機名稱正規 | `hostnamectl --static` | 與基準主機名稱完全一致 |
| B-04 | DNS 解析器僅為兩部 DC | `resolvectl status \| grep -A2 'DNS Servers'` | `10.10.30.11`、`10.10.30.12`，別無其他 |
| B-05 | 未設定公用解析器 | `grep -r nameserver /etc/resolv.conf` | 僅有兩個 DC 位址 |
| B-06 | 時間已同步 | `chronyc tracking` | 偏差 < 1 秒，Leap 狀態為 `Normal` |
| B-07 | SSH 加固已生效 | `sudo sshd -T \| grep permitrootlogin` | `permitrootlogin no` |
| B-08 | 密碼認證被拒絕 | `ssh -o PreferredAuthentications=password ...` | `Permission denied (publickey).` |
| B-09 | Sudo 群組已生效 | `getent group gg-infra-admins` | 恰好是四位具名管理員 |
| B-10 | Sudoers 語法有效 | `sudo visudo -c` | `parsed OK` |
| B-11 | 無人值守升級已啟用 | `systemctl is-enabled unattended-upgrades` | `enabled` |
| B-12 | 核心加固已套用 | `sysctl net.ipv4.conf.all.rp_filter net.ipv4.tcp_syncookies` | `1` 及 `1` |
| B-13 | 已曝露的介面 | `sudo ss -tulpn` | 僅有該主機角色所需的連接埠 |
| B-14 | 沒有未使用的監聽服務 | `systemctl --type=service --state=running` | 與角色的允許清單相符（§8.8） |
| B-15 | AppArmor 已啟用 | `sudo aa-status --enabled && echo OK` | `OK` |
| B-16 | auditd 規則已載入 | `sudo auditctl -l \| wc -l` | 規則數與 §8.8 相符 |
| B-17 | Syslog 轉送可運作 | `logger -p local5.info "fyp-baseline-test-$(hostname)"` 然後檢查 `10.10.30.31` | 該行出現在 `/var/log/remote/{host}.log` |
| B-18 | node_exporter 可連線 | `curl -s http://localhost:9100/metrics \| head -3` | 回傳指標文字 |
| B-19 | 版本證據已擷取 | `dpkg -l \| egrep 'nginx\|keepalived\|nftables\|openvpn\|wireguard-tools'` | 與鎖定清單相符，或記錄其偏差 |
| B-20 | 任何角色組態之前已建立快照 | Hypervisor 快照清單 | 存在名為 `pre-role-{role}-{date}` 的快照 |

### 8.3 Nginx 網頁層

#### 8.3.1 設計

網頁層有兩種截然不同的角色，而將兩者混為一談是這類建置最常見的設計錯誤。

**角色 A — DMZ 反向代理與 TLS 終結器。** `vpnz-dmzrev01` 與 `vpnz-dmzrev02` 是*唯一*向網際網路發佈的 DMZ 主機。它們在浮動 VIP `10.10.90.10` 上監聽 TCP 80（僅作重導向）及 TCP 443，以內部 PKI 簽發的憑證終結 TLS，並重新加密至應用層。由於會重新加密，TLS 在用戶端、代理與來源之間是**端到端**運行；DMZ 這一段並非明文。

**角色 B — 應用/內容節點。** `vpnz-dmzweba01/02`（Windows/IIS）承載代理後方的應用程式，而 `vpnz-dmzwp01/02`（Ubuntu Nginx + PHP-FPM + MariaDB，鎖定 MariaDB 10.11）承載 WordPress 部落格。這些節點在 443 上監聽，但從不直接發佈；公開文件位址 `198.51.100.3` 及 `198.51.100.4` 經周邊防火牆對應至它們，而一般用戶端流量則經由代理抵達。

上游集區由命名契約固定，且必須完全重現：

```nginx
upstream weba_pool { server 10.10.90.21:443; server 10.10.90.22:443; }
upstream wp_pool   { server 10.10.90.25:443; server 10.10.90.26:443; }
```

兩部代理上的監聽器與路由：

| 監聽器 | 名稱 | 後端集區 | 備註 |
|---|---|---|---|
| `:80` | `portal.vertexpeak.example`、`www.vertexpeak.example`、`blog.vertexpeak.example` | — | 301 重導向至對應的 HTTPS 名稱；不透過 HTTP 提供內容 |
| `:443` | `portal.vertexpeak.example` | `weba_pool` | 以 SNI 選擇；HSTS；portal 是已發佈的應用程式 |
| `:443` | `www.vertexpeak.example` | `weba_pool` | 同一集區，但使用獨立 server 區塊，以便日誌與標頭依名稱區分 |
| `:443` | `blog.vertexpeak.example` | `wp_pool` | WordPress 入口 |
| `:443`（僅限 loopback） | `localhost` | — | 供 Prometheus nginx exporter 使用的 `stub_status`；從主機外絕不可達 |
| `:8443`（僅限 loopback） | `monitor` | — | 供 §8.4.3 中 keepalived `track_script` 使用的逐上游健康端點 |

**憑證基礎架構的關係。** 代理上的 TLS 素材並非自我簽署，也不是由公開 CA 簽發——本專案沒有已註冊網域，且刻意禁止使用真實公開位址。內部 PKI 才是來源：`vpnz-dc01` 上的 AD CS 簽發公開名稱憑證（主體 `CN=portal.vertexpeak.example`，SAN 為 `portal.vertexpeak.example` 及 `portal.vertexpeak.fyp.lab`；主體 `CN=blog.vertexpeak.example`，SAN 為 `blog.vertexpeak.example`；主體 `CN=www.vertexpeak.example`，SAN 為 `www.vertexpeak.example` 及 `www.vertexpeak.fyp.lab`），而 `vpnz-lnxra01` 上的 Easy-RSA 則作為獨立的 Linux 側 CA，負責 OpenVPN PKI 及 WireGuard 管理素材。憑證最長有效期為 397 天，偏好值為 90 天並附有已記錄的續期作業。Linux 主機透過 `/usr/local/share/ca-certificates/vp-root-ca.crt` 加上 `update-ca-certificates` 信任內部鏈，對應 Windows 對同一根憑證的 GPO 派送。由於公開名稱是 `.example` 文件用名稱，任何瀏覽器測試都會顯示**名稱不符警告**；報告必須**展示該警告並加以解釋**，而非靜默點擊略過以掩蓋它。

#### 8.3.2 安裝與基礎組態

```bash
sudo apt-get update
sudo apt-get install -y nginx
nginx -v                     # record the exact output; the pin is 1.24.0 (Ubuntu 24.04 package)
dpkg -s nginx | grep -E '^Version|^Status'
```

預期的版本證據：

```text
nginx version: nginx/1.24.0 (Ubuntu)
```

基準刻意使用**發行版自帶的 Nginx**，其版本落後於上游穩定版。此事以選擇的形式說明，而非意外：它保留了 `apt` 修補、保留了版本鎖定，並避免在環境中新增第三方 APT 儲存庫。若某項功能需要更新的版本，已記錄的替代方案是 nginx.org 的 mainline 建置，並記錄版本偏差。

基準的儲存庫佈局以 `conf.d` 為基礎，**不**使用 `sites-available`/`sites-enabled` 機制——但 Ubuntu 套件會在 `sites-enabled` 中附帶一個預設站台，因此建置者必須移除它，否則它將在預設伺服器競爭中勝出：

```bash
sudo rm -f /etc/nginx/sites-enabled/default
ls -l /etc/nginx/sites-enabled/          # expected: the directory exists and is empty
```

全域組態。此處僅顯示與套件內建 `nginx.conf` 之間、與本專案相關的偏差；內建檔案採就地編輯而非整個替換，以便更容易歸因 `nginx -t` 的失敗。

```nginx
# /etc/nginx/nginx.conf  —  vpnz-dmzrev01 / vpnz-dmzrev02   (project-relevant sections)
user  www-data;

# One worker per allocated vCPU (the proxies have 2 vCPU each).
worker_processes  auto;
worker_rlimit_nofile 65535;

pid        /run/nginx.pid;
error_log  /var/log/nginx/error.log warn;

events {
    worker_connections  2048;
    multi_accept        on;
    use                 epoll;
}

http {
    # ---- MIME and defaults ----
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    charset       utf-8;

    # ---- performance ----
    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   30s;
    keepalive_requests  200;
    types_hash_max_size 2048;

    # ---- information disclosure ----
    server_tokens  off;              # suppresses the version string in Server: and error pages

    # ---- body and buffer limits (defence in depth; see §8.3.5) ----
    client_max_body_size        8m;
    client_body_buffer_size     128k;
    client_header_timeout       15s;
    client_body_timeout         20s;
    send_timeout                20s;
    large_client_header_buffers 4 16k;

    # ---- global TLS defaults (per-server blocks override where needed) ----
    ssl_protocols              TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers  off;                 # let the client choose under TLS 1.3 semantics
    ssl_session_cache          shared:SSL:20m;
    ssl_session_timeout        10m;
    ssl_session_tickets        off;
    ssl_stapling               on;
    ssl_stapling_verify        on;
    resolver                   10.10.30.11 10.10.30.12 valid=300s;
    resolver_timeout           5s;

    # ---- log formats ----
    # 'fyp' adds the upstream address/status/time so a proxy decision can be attributed
    # to a specific backend node, which is what the failover and capacity tests need.
    log_format  fyp  '$remote_addr - $remote_user [$time_local] '
                     '"$request" $status $body_bytes_sent '
                     '"$http_referer" "$http_user_agent" '
                     'vhost=$host sni=$ssl_server_name tls=$ssl_protocol/$ssl_cipher '
                     'rt=$request_time urt=$upstream_response_time '
                     'upstream=$upstream_addr ustatus=$upstream_status '
                     'xff="$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  fyp;
    # A promoted log format is useful for WordPress but is OPTIONAL and is off by default
    # because it multiplies log volume on the two content nodes.
    # log_format  fyp_wp  '$remote_addr - $remote_user [$time_local] "$request" $status '
    #                     '$body_bytes_sent rt=$request_time upstream=$upstream_addr';

    # ---- virtual hosts: conf.d is the canonical layout for this project ----
    include /etc/nginx/conf.d/*.conf;

    # ---- local-only status vhost for the Prometheus nginx exporter ----
    server {
        listen       127.0.0.1:443 ssl;
        server_name  localhost;
        ssl_certificate     /etc/nginx/ssl/portal.crt;
        ssl_certificate_key /etc/nginx/ssl/portal.key;

        location = /stub_status {
            stub_status;
            access_log off;
            allow 127.0.0.1;
            deny  all;
        }
        location = /healthz {
            return 200 "ok\n";
            access_log off;
            allow 127.0.0.1;
            deny  all;
        }
    }
}
```

`stub_status` 是 `fyp-availability` 儀表板的資料來源：`Active connections`、`accepts`、`handled`、`requests`、`Reading`、`Writing`、`Waiting`。它僅綁定於 loopback，這是刻意偏離常見的「允許監控子網路」模式——exporter 執行於同一部主機，指標之後才從 `10.10.90.x` 拉取，因此該狀態端點除了來自主機本身之外，永遠看不到任何封包。

上游集區檔案，完全依契約所指定：

```nginx
# /etc/nginx/conf.d/00-upstreams.conf
# Upstream pools are declared ONCE and referenced by name. Do not inline server addresses
# in a proxy_pass: a change would then have to be made in every server block.

upstream weba_pool {
    server 10.10.90.21:443 max_fails=3 fail_timeout=10s;
    server 10.10.90.22:443 max_fails=3 fail_timeout=10s;
    keepalive 16;                 # reuse upstream connections; reduces TLS handshakes to the origin
    keepalive_timeout 60s;
    keepalive_requests 100;
    zone weba_pool_zone 64k;      # shared state so max_fails/fail_timeout are enforced across workers
}

upstream wp_pool {
    server 10.10.90.25:443 max_fails=3 fail_timeout=10s;
    server 10.10.90.26:443 max_fails=3 fail_timeout=10s;
    keepalive 16;
    keepalive_timeout 60s;
    keepalive_requests 100;
    zone wp_pool_zone 64k;
}

# Passive health only. There is deliberately NO nginx plus API and no active health-check module in
# the open-source build, so 'max_fails'/'fail_timeout' plus the keepalived track script of §8.4.3
# are the entire health model. State this limitation in the report.
```

#### 8.3.3 反向代理組態

portal vhost 是參考實作。它存放於 `/etc/nginx/conf.d/10-portal.conf`，權限 `0644`。

```nginx
# /etc/nginx/conf.d/10-portal.conf  —  published application front door
# Public name:  portal.vertexpeak.example   ->  DNAT 198.51.100.2 -> 10.10.90.10 (VIP) -> here
# Backend pool: weba_pool (vpnz-dmzweba01/02, IIS application tier)

# ---- HTTP: nothing is ever served here; one permanent redirect, one comparison ----
server {
    listen      80 default_server;
    listen      [::]:80 default_server;      # harmless even with IPv6 disabled; keeps config portable
    server_name portal.vertexpeak.example www.vertexpeak.example blog.vertexpeak.example;

    # ACME is not used (no public CA), but leaving the path un-redirected costs nothing
    # and documents the decision.
    location ^~ /.well-known/acme-challenge/ { return 404; }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen      443 ssl;
    listen      [::]:443 ssl;
    http2       on;                          # nginx 1.24.0 syntax; see the [ASSUMPTION] note below
    server_name portal.vertexpeak.example;

    # ---- TLS material (see §8.3.4 for the full discussion) ----
    ssl_certificate         /etc/nginx/ssl/chain.crt;   # leaf followed by the issuing CA, then the root
    ssl_certificate_key     /etc/nginx/ssl/portal.key;  # mode 0600, root:root
    ssl_trusted_certificate /etc/nginx/ssl/chain.crt;   # used for OCSP-staple response verification

    # ---- access and error logs, tagged per site ----
    access_log /var/log/nginx/portal.access.log fyp;
    error_log  /var/log/nginx/portal.error.log  warn;

    # ---- security headers (rationale in §8.3.5) ----
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header X-Frame-Options           "SAMEORIGIN" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy        "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy   "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'self'" always;

    # ---- request limits ----
    client_max_body_size 8m;
    client_body_timeout  20s;

    # ---- rate limiting (zones are declared in 30-limits.conf; see §8.3.5) ----
    limit_req  zone=req_per_ip burst=40 nodelay;
    limit_conn conn_per_ip 50;

    # ---- default response if the pool is fully down: fail closed, not open ----
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }

    location / {
        proxy_pass https://weba_pool;

        # SNI to the upstream is REQUIRED because the origin presents a certificate for
        # www.vertexpeak.example and virtual-hosts on it.
        proxy_ssl_server_name on;
        proxy_ssl_name        www.vertexpeak.example;
        proxy_ssl_protocols   TLSv1.2 TLSv1.3;
        proxy_ssl_verify      on;
        proxy_ssl_verify_depth 2;
        proxy_ssl_trusted_certificate /etc/nginx/ssl/vp-root-ca.crt;   # pin to the internal root
        proxy_ssl_session_reuse on;

        # ---- mandatory forwarding headers ----
        proxy_set_header Host              $host;                 # 1. preserve the client's Host
        proxy_set_header X-Real-IP         $remote_addr;          # 2. the immediate client address
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;  # 3. append to any existing chain
        proxy_set_header X-Forwarded-Proto $scheme;               # 4. tells the app the client used HTTPS
        proxy_set_header X-Forwarded-Host  $host;                 # 5. needed for absolute-URL generation
        proxy_set_header X-Forwarded-Port  $server_port;          # 6. 443 when reached over TLS
        proxy_set_header Connection        "";                    # 7. empty -> enables upstream keepalive

        # ---- timeouts: tuned for a request/response web app, not for a streaming service ----
        proxy_connect_timeout 5s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;

        # ---- buffering: on, so a slow client cannot pin an upstream worker ----
        proxy_buffering        on;
        proxy_buffers          16 16k;
        proxy_buffer_size      8k;
        proxy_busy_buffers_size 32k;
        proxy_max_temp_file_size 256m;
        proxy_request_buffering on;

        # ---- do not silently follow application redirects ----
        proxy_redirect off;

        # ---- pass the real client to the app for audit purposes ----
        proxy_set_header X-Request-ID $request_id;
    }

    # Static assets are also served through the proxy in this design, but a health endpoint exists
    # so that keepalived and Prometheus can test the proxy without touching the application.
    location = /healthz {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "portal-proxy-ok $hostname\n";
    }

    # Deny access to obvious junk paths rather than proxying them to the application tier.
    location ~* /\.(git|svn|env|htaccess|htpasswd) {
        deny all;
        access_log off;
    }
}
```

一次性作業，於管理員自己的機器上執行，絕不在實驗室客體上執行：

關於 `http2` 指示詞的 `[假設]`：在 Nginx 1.24.0（Ubuntu 鎖定套件）中，HTTP/2 是以下列獨立的 `http2 on;` 指示詞在 `listen ... ssl` 伺服器中啟用。較舊的 `listen 443 ssl http2;` 形式在 1.24.0 中同樣有效，但在後續版本（1.25.1+）中已被棄用。建置者必須執行 `nginx -t`，若獨立指示詞被拒絕，則退回使用 `listen 443 ssl http2;`。偏好獨立形式的原因是向前相容性，而非當前的正確性；實際被接受的語法必須記錄於建置日誌中。

```nginx
# /etc/nginx/conf.d/20-blog.conf  —  WordPress front door (excerpt: the differences from 10-portal.conf)
server {
    listen      443 ssl;
    http2       on;
    server_name blog.vertexpeak.example;

    ssl_certificate         /etc/nginx/ssl/chain.crt;
    ssl_certificate_key     /etc/nginx/ssl/portal.key;
    ssl_trusted_certificate /etc/nginx/ssl/chain.crt;

    # WordPress uploads are larger than the portal's JSON payloads.
    client_max_body_size 32m;

    location / {
        proxy_pass https://wp_pool;
        proxy_ssl_server_name on;
        proxy_ssl_name        blog.vertexpeak.example;
        proxy_ssl_verify      on;
        proxy_ssl_trusted_certificate /etc/nginx/ssl/vp-root-ca.crt;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection        "";

        # WordPress behind a proxy needs the HTTPS flag or it redirects to http:// in a loop.
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 5s;
        proxy_read_timeout    60s;      # admin-ajax and plugin work can be slow
        proxy_buffering       on;
    }

    # A separate, quieter log for a high-volume content site.
    access_log /var/log/nginx/blog.access.log fyp;
}
```

blog vhost 的結構相同，但有三處差異，而這三處正是 WordPress 來源站的重點：

1. **`proxy_set_header Connection ""` 必須與 upstream 區塊中的 `keepalive` 成對使用。** 只設定其中一項，要麼會停用連線重用，要麼會讓逐跳的 `Connection: close` 標頭留在原處並使重用失效。
2. **一旦上游憑證不受信任、已過期，或以錯誤的 SNI 呈現，`proxy_ssl_verify on` 就會使整個站台失效。** 這是刻意的——中斷的信任鏈必須大聲失敗——但其失效模式是 `502` 並在 `portal.error.log` 中留下 `upstream SSL certificate verify error`，而 §8.12 將此列為疑難排解條目。

速率限制區域的宣告放在另一個小檔案中，使這些區域在任何 `server` 區塊引用它們之前就已存在：

```nginx
# /etc/nginx/conf.d/30-limits.conf
# Declared at http level via conf.d inclusion order: 00-upstreams, 10-portal, 20-blog, 30-limits.
# 'limit_req_zone' is valid in the http context, which conf.d files are included into — so this
# file works, but it MUST be included after nothing and before the server blocks that use it.
# [ASSUMPTION] if the packaged nginx.conf includes conf.d in a different order, move these two
# directives into nginx.conf's http block and delete this file.
limit_req_zone  $binary_remote_addr zone=req_per_ip:10m  rate=20r/s;
limit_conn_zone $binary_remote_addr zone=conn_per_ip:10m;
```

#### 8.3.4 TLS 組態

**素材的來源。** 葉憑證由 AD CS 簽發；鏈檔由葉憑證加上簽發 CA 及根憑證組合而成。在 Linux 一側，根憑證安裝於系統範圍，使 `curl`、`openssl s_client` 及任何 Python 工具均信任它：

```bash
sudo cp 08-references/pki/vp-root-ca.crt /usr/local/share/ca-certificates/vp-root-ca.crt
sudo update-ca-certificates
# Expected: "1 added, 0 removed; done. Running hooks in /etc/ca-certificates/update.d... done."
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt /etc/nginx/ssl/chain.crt
# Expected: /etc/nginx/ssl/chain.crt: OK
```

**憑證路徑（由基準固定）：** `/etc/nginx/ssl/portal.crt`、`/etc/nginx/ssl/portal.key`、`/etc/nginx/ssl/chain.crt`，全部為 `root:root`，其中**金鑰為 `0600`**，憑證與鏈檔為 `0644`。`/etc/nginx/ssl/vp-root-ca.crt` 是為上游驗證而鎖定的信任錨點。`/etc/nginx/.htpasswd-portal`（權限 `0640`）僅為一個已記錄的 basic-auth 測試帳戶而存在，並標示為實驗室控制項，絕非正式環境控制項。

**通訊協定與加密套件。** TLS 1.0 及 1.1 被拒絕；TLS 1.2 為下限，TLS 1.3 為偏好。Ubuntu 24.04 上鎖定的 Nginx 1.24.0 連結 OpenSSL 3.0，支援 TLS 1.3 套件。本設計不硬式編碼 TLS 1.2 加密套件字串，因為發行版/OpenSSL 的預設值（未設定 `ssl_ciphers`，即 `DEFAULT` 政策並配合 `ssl_prefer_server_ciphers off`）已排除歷史上偏弱的套件，並尊重用戶端偏好；這對於與各式員工筆記型電腦及瀏覽器互通是更好的結果。若驗收測試要求明確清單，則備用做法為：

```nginx
# [ASSUMPTION] only if an explicit cipher list is required by the marker:
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers off;
```

此事標示為假設，因為 OpenSSL 3.0 實際曝露的套件名稱必須在已建置的主機上以 `openssl ciphers -v` 讀取並貼入報告，而非憑記憶撰寫。執行環境無法辨識的加密套件名稱會使 `nginx -t` 失敗，那是代價低廉的失敗；被默默接受但比預期更弱的加密套件名稱則不是。

**Session 與 ticket。** `ssl_session_cache shared:SSL:20m` 搭配 10 分鐘逾時，在跨 worker 的情況下提供約 80 000 個可續用 session，且只在 `nginx.conf` 中設定一次。`ssl_session_tickets off` 是刻意的：無狀態 ticket 金鑰在啟動時由各 worker 分別產生且不共用，因此在兩個 worker 加兩部代理節點的情況下，某個 worker 簽發的 ticket 無法由另一個解密。關閉 ticket 會強制走共用 session 快取路徑，那正是本設計想要的行為。

**OCSP stapling。** `ssl_stapling on` 加上 `ssl_stapling_verify on`，再加上指向鏈檔的 `ssl_trusted_certificate`，並在 `resolver` 中指定內部解析器 `10.10.30.11`/`10.10.30.12`。由於內部 AD CS 回應器在實驗室中可能未發佈為 AIA/OCSP 端點，誠實的結果很可能是在 Nginx 錯誤日誌中出現 `Stapling not happening`。本設計仍保持這些指示詞啟用，因為正確的正式環境姿態就是進行 stapling；而應記錄的**發現**是：內部 CA 的 OCSP 回應器不可達，因此未發生 stapling——並以該錯誤日誌行作為證據。這正是 §8.13 存在的目的所要捕捉的「實測與預期之差異」，絕不應以停用指示詞來掩蓋。

**HSTS。** `Strict-Transport-Security: max-age=31536000; includeSubDomains` 僅從 `443` server 區塊送出。在純 HTTP 回應上送出 HSTS 毫無意義，而從一部日後又會提供 HTTP 的實驗室主機送出，則是對測試者自己的瀏覽器自找的服務中斷，因此該標頭刻意採逐 server 設定，絕不設為全域。不使用 `preload`：本專案沒有已註冊網域，而 preload 指示詞將是不實的聲明。

**名稱不符的現實。** `portal.vertexpeak.example` 是 RFC 2606 保留的文件用名稱，沒有任何真實公開 CA 會為它簽發憑證。實驗室為該名稱呈現一張內部 CA 憑證，因此若測試者改為瀏覽 `.fyp.lab` 名稱，瀏覽器將警告憑證鏈僅在內部根憑證已安裝時才受信任，**且**會警告名稱不符。這兩項警告都必須截圖並加以解釋。憑證的 SAN 刻意同時帶有該名稱的 `.example` 及 `.fyp.lab` 兩種形式，這讓一張憑證能同時服務已發佈路徑與分裂視域內部路徑，而不致產生名稱不符。

#### 8.3.5 加固

```nginx
# /etc/nginx/conf.d/40-hardening.conf  —  host-independent hardening directives
# (they are listed here for evidence purposes; the effective directives are also in nginx.conf)
server_tokens off;                 # no version disclosure in Server: header or error pages
```

| 控制項 | 設定 | 存在理由 |
|---|---|---|
| 版本揭露 | `server_tokens off` | 從 `Server:` 標頭及錯誤頁面移除確切的 Nginx 版本。降低單純抓取橫幅資訊的價值；並不因此自稱本身即為安全 |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` | 防止 portal 被攻擊者頁面以框架嵌入 |
| MIME 嗅探 | `X-Content-Type-Options: nosniff` | 阻止瀏覽器重新詮釋已宣告的類型 |
| 傳輸政策 | `Strict-Transport-Security` | 在首次成功之後的一年內強制使用 HTTPS |
| Referrer 洩漏 | `Referrer-Policy: strict-origin-when-cross-origin` | 避免內部路徑出現在第三方 referrer 中 |
| 功能曝露 | `Permissions-Policy` | 拒絕相機、麥克風及地理位置，portal 皆不使用這些功能 |
| 指令碼注入 | `Content-Security-Policy` | `default-src 'self'`，僅允許樣式使用 `'unsafe-inline'`。就 WordPress 而言，此政策需要逐站台調整，而該調整必須記錄，而非悄悄放寬 |
| 請求大小 | `client_max_body_size 8m`（portal）、`32m`（blog） | 請求主體上限是防禦簡易記憶體/磁碟耗竭最廉價的手段。8 MB 對 JSON/HTML 應用程式相當寬裕；32 MB 可涵蓋 WordPress 媒體 |
| 標頭限制 | `large_client_header_buffers 4 16k` | 限制每請求的標頭記憶體；過大的標頭得到 431/400 而非配置記憶體 |
| 速率限制 | `limit_req zone=req_per_ip burst=40 nodelay` | 每個來源 IP 每秒 20 個請求，允許 40 個請求的突發。其設定使合法瀏覽器載入含大量資源的頁面時永不受限，而樸素的洪水攻擊則受限 |
| 並行數 | `limit_conn conn_per_ip 50` | 限制每個來源 IP 的同時連線數 |
| 方法限制 | `if ($request_method !~ ^(GET\|HEAD\|POST)$) { return 405; }` | portal 與 blog 以讀取為主；`PUT`、`DELETE`、`TRACE`、`OPTIONS` 及 `CONNECT` 對這些 vhost 沒有正當用途，因此在應用程式邊緣被拒絕 |
| 路徑拒絕 | `location ~* /\.(git\|svn\|env\|htaccess\|htpasswd)` | 拒絕對版本控制及組態構件的請求，而非將其轉送上游 |
| 資訊洩漏 | `error_page 502 503 504 /50x.html` 搭配 `internal` | 來源站的錯誤頁面與標頭永不轉送至網際網路 |
| 代理信任鎖定 | `proxy_ssl_verify on` + `proxy_ssl_trusted_certificate /etc/nginx/ssl/vp-root-ca.crt` | 代理拒絕與呈現非內部鏈的來源站通訊——這在來源站可能被替換的 DMZ 中是重要控制項 |
| Basic 認證 | `/etc/nginx/.htpasswd-portal`，權限 `0640` | 一個已記錄的實驗室測試帳戶，用以證明未經認證的請求會被挑戰。它**並非**應用程式認證機制，也絕不可如此描述 |

方法限制的實作，其寫法使其不會意外破壞健康檢查：

```nginx
# Place inside the 443 server block, before the location blocks.
if ($request_method !~ ^(GET|HEAD|POST)$) {
    return 405;
}
# TRACE is additionally refused at the firewall layer; both are evidenced separately.
```

#### 8.3.6 驗證

在重新載入任何內容之前，先檢查組態語法：

```bash
sudo nginx -t
```

預期結果：

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

在不中斷連線的情況下重新載入，然後確認執行中的 worker 世代已改變：

```bash
sudo systemctl reload nginx
systemctl status nginx --no-pager | head -4
sudo ss -tlnp | grep -E ':80|:443'
```

從內部主機（DNS 經由 `10.10.30.11` 解析）測試 HTTP 重導向行為與標頭：

```bash
curl -sI http://portal.vertexpeak.fyp.lab/
```

預期結果：

```text
HTTP/1.1 301 Moved Permanently
Server: nginx
Date: Tue, 06 Oct 2026 02:20:11 GMT
Content-Type: text/html
Content-Length: 178
Location: https://portal.vertexpeak.fyp.lab/
Connection: keep-alive
```

```bash
curl -sI --cacert /etc/nginx/ssl/vp-root-ca.crt https://portal.vertexpeak.fyp.lab/
```

預期結果（`Server` 標頭不顯示版本，這即是 `server_tokens` 的證據）：

```text
HTTP/2 200
server: nginx
date: Tue, 06 Oct 2026 02:20:14 GMT
content-type: text/html; charset=utf-8
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
referrer-policy: strict-origin-when-cross-origin
content-security-policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'self'
```

以 `openssl s_client` 檢查 TLS，這同時證明以 SNI 選擇的憑證及協商出的通訊協定：

```bash
openssl s_client -connect 10.10.90.10:443 -servername portal.vertexpeak.example \
  -CAfile /etc/nginx/ssl/vp-root-ca.crt -tls1_2 </dev/null 2>/dev/null | \
  grep -E 'Protocol|Cipher|Verify return code|subject=|issuer='
```

預期結果：

```text
subject=CN = portal.vertexpeak.example
issuer=CN = VP-ISSUING-CA-01, DC = vertexpeak, DC = fyp, DC = lab
---
Protocol  : TLSv1.2
Cipher    : ECDHE-RSA-AES256-GCM-SHA384
Verify return code: 0 (ok)
```

TLS 1.1 的嘗試必須失敗，這是證明通訊協定下限確有其效的負向測試：

```bash
openssl s_client -connect 10.10.90.10:443 -servername portal.vertexpeak.example -tls1_1 </dev/null
# Expected: an SSL alert (protocol version / handshake failure) and no session established.
```

代理標頭的傳遞，這是確認應用層將看到正確用戶端的檢查：

```bash
curl -s -o /dev/null -D - --cacert /etc/nginx/ssl/vp-root-ca.crt \
  -H 'X-Forwarded-For: 203.0.113.99' https://portal.vertexpeak.fyp.lab/healthz
# Then inspect the application tier's log on vpnz-dmzweba01: the client must appear as
# 10.10.90.1x (the proxy's address) with '203.0.113.99, <proxy-ip>' appended in X-Forwarded-For.
```

速率限制與方法限制的證據：

```bash
# Method restriction: expect 405
curl -s -o /dev/null -w '%{http_code}\n' -X TRACE --cacert /etc/nginx/ssl/vp-root-ca.crt https://portal.vertexpeak.fyp.lab/

# Rate limiting: 60 rapid requests, expect a run of 200 followed by 503s
for i in $(seq 1 60); do
  curl -s -o /dev/null -w '%{http_code} ' --cacert /etc/nginx/ssl/vp-root-ca.crt \
    https://portal.vertexpeak.fyp.lab/healthz
done; echo
# Expected: a tail of "503 503 ..." and matching 'limiting requests' entries in portal.error.log
```

Prometheus 可用性指標，用以在監控章節引用之前證明指標路徑存在：

```bash
curl -sk https://127.0.0.1/stub_status
```

預期結果：

```text
Active connections: 3
server accepts handled requests
 128 128 402
Reading: 0 Writing: 1 Waiting: 2
```

### 8.4 以 Keepalived（VRRP）實現高可用性

#### 8.4.1 設計

Keepalived 在本設計中為**兩個由 Linux 持有的閘道**提供**第一跳備援**，所用的是 WSOS 所點名的 VRRP 通訊協定。務必精確說明何者被主張、何者不被主張：

- 標準**並未點名 Keepalived**（在 2026 年文本及原始 HTML 中各出現 0 次）。銜接點為 `Provide network load balancing & fault tolerance at routing and switching levels by using GLBP, HSRP, VRRP, LACP, PAgP, etc.`（範疇 3，第 4 行）——**VRRP 被點名，而 Keepalived 實作 VRRP。** 這是可用的最強銜接，而它呈現為一道銜接。
- 因此本專案執行**兩種不同的第一跳備援技術**，且兩者絕不可合併為單一主張：Cisco 存取層中的 **HSRP**（該處的閘道是交換器，也是 Packet Tracer 的 HSRP 實作可靠之處），以及閘道為 Linux VM 之處的 **Keepalived/VRRP**。兩者皆為刻意選擇。

兩個獨立的 VRRP 實例：

| 實例 | 節點 | 介面 / 網段 | `virtual_router_id` | VIP | 優先權 | 搶佔 |
|---|---|---|---|---|---|---|
| nftables 對組 | `vpnz-nft01`（MASTER）、`vpnz-nft02`（BACKUP） | 承載 `10.10.50.0/28` 的出口網段，介面 `ens192` | **51** | `10.10.50.10` | 150 / 100 | 是，搭配 `preempt_delay` |
| nginx 對組 | `vpnz-dmzrev01`（MASTER）、`vpnz-dmzrev02`（BACKUP） | DMZ 網段 `10.10.90.0/24`，介面 `ens192` | **61** | `10.10.90.10` | 150 / 100 | 是，搭配 `preempt_delay` |

VRID 51 與 61 由命名契約固定，而該契約的理由是充分的：兩個不同的 VRID 絕不在任何可能被橋接的兩個子網路上重複使用。nftables VIP 是*通道前門*——它是為 `203.0.113.2` 所呈現的位址，也是 `198.51.100.5` 已發佈 VPN 服務對應的位址，而在通道層面它同時是 WireGuard 端點位址 `10.10.200.1/24`。nginx VIP 則是*已發佈的網頁前門*，即 `198.51.100.2` 的 DNAT 目標。

**搶佔**在兩個對組上都以延遲方式啟用，因為預期的穩態是由指定的 master 承載流量，而 backup 真正處於閒置待命狀態。若沒有 `preempt_delay`，一部不斷震盪的節點會反覆取回 VIP，而每次取回都意味著一次 gratuitous ARP 風暴，以及對每個用戶端而言的 TLS session 快取冷啟動。

**Track script 正是本設計的要點。** 一個只追蹤介面的 VRRP 實例，會在 Nginx 已崩潰的節點上依然牢牢持有 VIP，從而把一組「高可用性」對組變成一台帶有熱待機的單點失效。因此兩個對組都追蹤一項**服務檢查**：nginx 對組 curl 一個本機健康端點，證明代理能夠服務；nftables 對組則檢查規則集確實已載入且非空。

#### 8.4.2 安裝與 `keepalived.conf`

```bash
sudo apt-get install -y keepalived
keepalived --version
# Expected first line: Keepalived v2.2.8 (01/01/2024)   <- the pinned Ubuntu 24.04 version
```

兩部節點必須能互相認證。基準明確記錄此認證決定：採用 `authentication { auth_type PASS }` 搭配一組預共享字串，而這是**僅主機網段內的實驗室簡化做法**，並非最佳實務。報告中必須誠實說明兩項事實：

1. Keepalived 中的 VRRP 認證使用簡單或 AH 式檢查，其本質是明文組態檔中的共享秘密。以現代意義而言，它並非加密保護，也無法阻止堅定的同網段攻擊者注入通告。
2. 本設計中真正的保護在於：出口與 DMZ 網段不承載使用者流量，且其上的主機已在 nftables 規則集中逐列列舉。

下文的密碼字串是預留位置，由建置者以群組密碼管理員中的值取代。它絕不可用真實形式提交至 Git。

**節點 1 — `vpnz-nft01`，nftables 對組的 master（`vrid 51`）。**

```ini
# /etc/keepalived/keepalived.conf   —   vpnz-nft01   (state MASTER, priority 150)
# VRRP instance VRID 51 on the egress segment; VIP 10.10.50.10 is the tunnel / NAT front door.
# Verify with: sudo keepalived --config-test -f /etc/keepalived/keepalived.conf
#              ip -br a show ens192 ; journalctl -u keepalived -f

global_defs {
    router_id              vpnz-nft01          # must be unique across the whole VRRP domain
    script_user            keepalived_script   # unprivileged account used to run the track scripts
    enable_script_security                     # refuse to run a script that is group/world writable
    vrrp_skip_check_adv_addr
    vrrp_strict                                # enforce RFC 3768 conformance (see the note below)
    vrrp_garp_interval     0.001               # gratuitous ARP pacing: 1 ms between ARPs
    vrrp_gna_interval      0.000001            # unsolicited NA pacing (a small value avoids a burst)
    vrrp_mcast_group4      224.0.0.18          # the standard VRRP IPv4 multicast group
    notification_email {
        netops@vertexpeak.fyp.lab
    }
    notification_email_from keepalived@vpnz-nft01.vertexpeak.fyp.lab
    smtp_server             10.10.30.31        # vpnz-mon01; see the notification note in §8.4.4
    smtp_connect_timeout    10
}

# ----------------------------------------------------------------------------------
# Health check 1: is the firewall actually enforcing a ruleset?
# ----------------------------------------------------------------------------------
vrrp_script chk_nftables {
    script       "/usr/local/bin/vrrp-check-nftables.sh"
    interval     5          # run every 5 seconds
    timeout      3          # a run that exceeds 3 s is a failure
    weight       -30        # failure DROPS priority by 30 (150 -> 120), it does not remove the VIP
    rise         2          # two consecutive successes to be considered healthy again
    fall         2          # two consecutive failures to be considered failed
    user         root       # required because 'nft list ruleset' needs privileges
}

# ----------------------------------------------------------------------------------
# Health check 2: can the box still forward? A test route lookup plus interface liveness.
# ----------------------------------------------------------------------------------
vrrp_script chk_egress_link {
    script       "/usr/local/bin/vrrp-check-egress.sh"
    interval     10
    timeout      4
    weight       -60        # losing the egress path drops priority to 90, i.e. below the peer's 100
    rise         2
    fall         2
    user         root
}

vrrp_instance VI_EGRESS {
    state                  MASTER
    interface              ens192                # the 10.10.50.0/28 segment; confirm with ip -br link
    virtual_router_id      51                   # FIXED by the naming contract
    priority               150                  # MASTER; the backup node uses 100
    advert_int             1                    # 1 s advertisements -> ~3 s to detect a dead master
    preempt_delay          30                   # wait 30 s before reclaiming the VIP after a restart
    smtp_alert

    authentication {
        auth_type          PASS
        auth_pass          CHANGE_ME_VRRP_51      # replace from the password manager; never commit this
    }

    # The VIP is the ONLY address that moves. Both nodes keep their own physical address
    # (vpnz-nft01 = 10.10.50.11, vpnz-nft02 = 10.10.50.12).
    virtual_ipaddress {
        10.10.50.10/28 dev ens192
    }

    # Addresses advertised as reachable through this instance. Adding the tunnel-local address
    # keeps the WireGuard / NAT front door consistent with the VIP.
    virtual_ipaddress_excluded {
        10.10.200.1/24 dev ens224
    }

    track_script {
        chk_nftables
        chk_egress_link
    }

    # A notify script records every state transition, which is the primary failover evidence.
    notify /usr/local/bin/vrrp-notify.sh
}
```

**節點 2 — `vpnz-nft02`，nftables 對組的 backup。** 該檔案除四個值之外完全相同，且由*同一個* Ansible Jinja2 範本（`templates/keepalived.conf.j2`）搭配不同的主機變數產生，因此兩部節點永不漂移。

```ini
# /etc/keepalived/keepalived.conf   —   vpnz-nft02   (state BACKUP, priority 100)
global_defs {
    router_id              vpnz-nft02          # DIFFERENT from the master
    script_user            keepalived_script
    enable_script_security
    vrrp_skip_check_adv_addr
    vrrp_strict
    vrrp_garp_interval     0.001
    vrrp_gna_interval      0.000001
    vrrp_mcast_group4      224.0.0.18
    notification_email { netops@vertexpeak.fyp.lab }
    notification_email_from keepalived@vpnz-nft02.vertexpeak.fyp.lab
    smtp_server             10.10.30.31
    smtp_connect_timeout    10
}

vrrp_script chk_nftables {
    script   "/usr/local/bin/vrrp-check-nftables.sh"
    interval 5
    timeout  3
    weight   -30
    rise     2
    fall     2
    user     root
}
vrrp_script chk_egress_link {
    script   "/usr/local/bin/vrrp-check-egress.sh"
    interval 10
    timeout  4
    weight   -60
    rise     2
    fall     2
    user     root
}

vrrp_instance VI_EGRESS {
    state                  BACKUP              # DIFFERENT
    interface              ens192
    virtual_router_id      51                  # SAME VRID — this is what makes them a pair
    priority               100                 # DIFFERENT (lower)
    advert_int             1
    preempt_delay          30
    smtp_alert

    authentication {
        auth_type          PASS
        auth_pass          CHANGE_ME_VRRP_51    # MUST be byte-identical to the master's value
    }

    virtual_ipaddress {
        10.10.50.10/28 dev ens192
    }
    virtual_ipaddress_excluded {
        10.10.200.1/24 dev ens224
    }
    track_script {
        chk_nftables
        chk_egress_link
    }
    notify /usr/local/bin/vrrp-notify.sh
}
```

**nginx 對組。** `vpnz-dmzrev01`（MASTER，優先權 150）與 `vpnz-dmzrev02`（BACKUP，優先權 100）使用相同結構，搭配 `virtual_router_id 61`、位於 `10.10.90.0/24` 網段上的 `interface ens192`，以及 `virtual_ipaddress { 10.10.90.10/24 dev ens192; }`——而 master 自身的位址是 `10.10.90.28`、backup 的是 `10.10.90.29`，因此該對組以一般非持有者 VRRP 模式運行（Rev 1.1 裁定 C-02）。它們追蹤 Nginx 服務而非規則集。

```ini
# /etc/keepalived/keepalived.conf   —   vpnz-dmzrev01   (VRID 61, MASTER, priority 150)
# On vpnz-dmzrev02 change: router_id -> vpnz-dmzrev02, state -> BACKUP, priority -> 100.
# Everything else, including the VRID and the auth_pass, MUST stay identical.

global_defs {
    router_id              vpnz-dmzrev01
    script_user            keepalived_script
    enable_script_security
    vrrp_skip_check_adv_addr
    vrrp_strict
    vrrp_garp_interval     0.001
    vrrp_gna_interval      0.000001
    vrrp_mcast_group4      224.0.0.18
    notification_email { netops@vertexpeak.fyp.lab }
    notification_email_from keepalived@vpnz-dmzrev01.vertexpeak.fyp.lab
    smtp_server             10.10.30.31
    smtp_connect_timeout    10
}

vrrp_script chk_nginx {
    script   "/usr/local/bin/vrrp-check-nginx.sh"
    interval 3          # the web tier is the customer-facing service: check more often
    timeout  2
    weight   -60        # 150 -> 90, below the backup's 100, so a broken master LOSES the VIP
    rise     2
    fall     2
    user     root       # needs to read the local TLS health endpoint over 443
}

vrrp_script chk_upstream_pool {
    script   "/usr/local/bin/vrrp-check-pool.sh"
    interval 10
    timeout  5
    weight   -20        # a degraded-but-serving proxy keeps the VIP; a totally dead pool does not
    rise     3
    fall     2
    user     root
}

vrrp_instance VI_WEB {
    state                  MASTER
    interface              ens192
    virtual_router_id      61                   # FIXED by the naming contract
    priority               150
    advert_int             1
    preempt_delay          30
    smtp_alert

    authentication {
        auth_type          PASS
        auth_pass          CHANGE_ME_VRRP_61
    }

    virtual_ipaddress {
        10.10.90.10/24 dev ens192
    }

    track_script {
        chk_nginx
        chk_upstream_pool
    }

    notify /usr/local/bin/vrrp-notify.sh
}
```

兩項容易弄錯、值得明確說明的組態事實：

- **`vrrp_strict`** 會啟用嚴格的 RFC 遵循。在某些 Keepalived 建置中，它也會在該介面上隱式加入一條針對 VRRP 通訊協定封包的 `DROP` 規則；在本設計中這無害，因為該介面僅供 VRRP 及轉送流量使用——但若建置者觀察到 VRRP 通告被封鎖，診斷方法為 `iptables -L -n | grep -i vrrp`（Keepalived 可能安裝自己的過濾器），而修正方式應予記錄而非猜測。`[假設]` `vrrp_strict` 在此建置中不與 nftables 規則集衝突；此事必須在對組建置的第一天確認。
- **`state MASTER`/`BACKUP` 是起始偏好，而非保證。** 有了 `preempt_delay` 及 150/100 的優先權，預期的穩態是確定性的，但*實際*的 master 取決於 VRRP 選舉的結果，而唯一權威的陳述方式是在兩部節點上執行 `ip -br a` 以及 `journalctl` 的轉換行。因此下文每一步驗證都是讀取狀態，而非假設狀態。

#### 8.4.3 健康檢查指令碼

三個指令碼都存放於 `/usr/local/bin`，擁有者為 `root:root`，權限為 `0755`（可執行，且**不**可由群組或其他使用者寫入，`enable_script_security` 會強制此事）。每個指令碼在健康時結束碼為 `0`，不健康時為非零，並印出一行診斷至日誌。

```bash
#!/usr/bin/env bash
# /usr/local/bin/vrrp-check-nginx.sh
# Purpose : prove that THIS node can serve HTTPS through its own Nginx before it is allowed to
#           hold the web VIP. A process-name check is not enough: nginx can be running with a
#           broken config, an expired certificate or an unreachable upstream pool.
# Exit    : 0 = healthy, 1 = unhealthy
set -euo pipefail

HOST_FQDN="$(hostname -f)"
ENDPOINT="https://${HOST_FQDN}/healthz"
CAFILE="/etc/nginx/ssl/vp-root-ca.crt"
TIMEOUT=2

result="$(curl -s -o /dev/null -w '%{http_code}' \
            --max-time "${TIMEOUT}" --cacert "${CAFILE}" \
            --resolve "${HOST_FQDN}:443:127.0.0.1" \
            "${ENDPOINT}" 2>/dev/null || true)"

if [[ "${result}" != "200" ]]; then
    logger -t vrrp-check-nginx -p daemon.warning \
        "UNHEALTHY: ${ENDPOINT} returned '${result}' (expected 200)"
    exit 1
fi

# Second, independent signal: is the worker process actually present?
if ! pgrep -x nginx >/dev/null 2>&1; then
    logger -t vrrp-check-nginx -p daemon.warning "UNHEALTHY: no nginx process found"
    exit 1
fi

exit 0
```

關於此指令碼的三點設計說明。它使用 `--resolve` 強制請求送往**本機** socket，同時仍呈現正確的 SNI 與 Host 標頭，因此 DNS 故障或 VIP 故障不會使檢查因錯誤的原因而失敗。它以 `--cacert` 驗證憑證鏈，因此過期或簽發錯誤的憑證會使該節點變為不健康——這對交班決策而言是正確行為。它以可辨識的日誌行以非零結束碼退出，因此失敗原因會在任何人大舉猜測之前先出現在 `journalctl` 中。

```bash
#!/usr/bin/env bash
# /usr/local/bin/vrrp-check-pool.sh
# Purpose : is there at least ONE healthy application-tier node behind this proxy?
#           Prevents a proxy that can answer /healthz from holding the VIP while every
#           real request would 502.
# Exit    : 0 = at least one upstream answers, 1 = no upstream answers
set -euo pipefail

CAFILE="/etc/nginx/ssl/vp-root-ca.crt"
declare -A POOLS=(
  [weba]="10.10.90.21 10.10.90.22"
  [wp]="10.10.90.25 10.10.90.26"
)

healthy_total=0
for pool in "${!POOLS[@]}"; do
    healthy=0
    for ip in ${POOLS[$pool]}; do
        code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 \
                 --cacert "${CAFILE}" --resolve "upstream.local:443:${ip}" \
                 "https://upstream.local/" 2>/dev/null || true)"
        # Any HTTP status means the origin answered TLS and spoke HTTP. A 301/403/404 is a
        # healthy origin; only 000 (no response) is unhealthy.
        if [[ -n "${code}" && "${code}" != "000" ]]; then
            healthy=$((healthy + 1))
        fi
    done
    logger -t vrrp-check-pool -p daemon.info "pool ${pool}: ${healthy} healthy of 2"
    healthy_total=$((healthy_total + healthy))
done

if [[ "${healthy_total}" -eq 0 ]]; then
    logger -t vrrp-check-pool -p daemon.warning "UNHEALTHY: no upstream answered in any pool"
    exit 1
fi
exit 0
```

```bash
#!/usr/bin/env bash
# /usr/local/bin/vrrp-check-nftables.sh
# Purpose : prove the firewall host is actually enforcing a rule set before it holds the
#           egress VIP. A firewall that has flushed its ruleset and defaulted to ACCEPT is
#           worse than a firewall that is down, because nothing alarms.
# Exit    : 0 = healthy, 1 = unhealthy
set -euo pipefail

TABLE="inet fyp_filter"

if ! nft list table ${TABLE} >/dev/null 2>&1; then
    logger -t vrrp-check-nftables -p daemon.warning "UNHEALTHY: ${TABLE} is not loaded"
    exit 1
fi

rules="$(nft -a list table ${TABLE} 2>/dev/null | grep -c '^[[:space:]]*[a-z].*' || true)"
if [[ "${rules}" -lt 20 ]]; then
    logger -t vrrp-check-nftables -p daemon.warning \
        "UNHEALTHY: ${TABLE} contains only ${rules} rule lines (expected >= 20)"
    exit 1
fi

# The policies must still be drop. A ruleset that is present but permissive is the exact
# failure this check exists to catch.
for ch in input forward; do
    pol="$(nft list chain ${TABLE} ${ch} 2>/dev/null | grep -o 'policy [a-z]*' | awk '{print $2}' || true)"
    if [[ "${pol}" != "drop" ]]; then
        logger -t vrrp-check-nftables -p daemon.warning \
            "UNHEALTHY: chain ${ch} policy is '${pol}', expected 'drop'"
        exit 1
    fi
done

exit 0
```

```bash
#!/usr/bin/env bash
# /usr/local/bin/vrrp-check-egress.sh
# Purpose : prove the firewall host still has a usable path outward and a usable path inward.
#           Checks the neighbour reachability of the core (inward) and the ASA (outward).
# Exit    : 0 = healthy, 1 = unhealthy
set -euo pipefail

for peer in 10.10.50.1 10.10.50.2; do      # VP-HQ-CORE-01 gi0/1.50 and VP-HQ-FW-01 inside
    if ! ping -c 2 -W 1 -I ens192 "${peer}" >/dev/null 2>&1; then
        logger -t vrrp-check-egress -p daemon.warning "UNHEALTHY: no ICMP reply from ${peer}"
        exit 1
    fi
done

# IP forwarding must be on or this node cannot serve as a gateway at all.
if [[ "$(cat /proc/sys/net/ipv4/ip_forward)" != "1" ]]; then
    logger -t vrrp-check-egress -p daemon.warning "UNHEALTHY: net.ipv4.ip_forward is not 1"
    exit 1
fi

exit 0
```

通知指令碼，由兩個對組共用。這正是把無聲的容錯移轉變成可監控事件的機制：

```bash
#!/usr/bin/env bash
# /usr/local/bin/vrrp-notify.sh
# Called by keepalived as: vrrp-notify.sh <GROUP|INSTANCE> <name> <STATE>
set -euo pipefail
TYPE="${1:-UNKNOWN}"; NAME="${2:-UNKNOWN}"; STATE="${3:-UNKNOWN}"
HOST="$(hostname -s)"
MSG="${HOST} keepalived ${TYPE} ${NAME} entered state ${STATE}"

logger -t vrrp-notify -p daemon.notice "${MSG}"
# Written to a durable file as well, because the failover evidence must survive a journal rotation.
printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${MSG}" >> /var/log/fyp/keepalived-transitions.log

# Forward to the syslog receiver on vpnz-mon01 so the transition lands in Loki and can be
# alerted on. Notifications are a local UDP send; nothing depends on the SMTP path below.
printf '<%d>%s %s\n' "$(( 16*8 + 5 ))" "${HOST}" "${MSG}" > /dev/udp/10.10.30.31/514 || true
exit 0
```

#### 8.4.4 容錯移轉行為與調校

| 參數 | 使用值 | 它實際控制什麼 |
|---|---|---|
| `advert_int` | `1`（秒） | master 通告的頻率。backup 在約 `3 × advert_int + skew` 之後宣告 master 已死，因此本設計預期每個對組的偵測延遲為**約 3 秒**。更短意味著更快的失效偵測與更多 VRRP 交談；1 秒是標準折衷，也是報告引用的值 |
| `priority` | master 150 / backup 100，皆大於 0 | 決定兩部節點皆可見時的選舉結果。優先權相同而位址不同時，由最高的主要 IP 決定，這是脆弱的依賴方式——因此明確保留 50 點差距 |
| `preempt_delay` | `30`（秒） | 防止剛重新開機的 master 立即取回 VIP。若無此設定，一部從當機中復原的節點會造成第二次、可避免的容錯移轉 |
| track script 上的 `weight` | `-30`（nftables 檢查）、`-60`（出口連結）、`-60`（nginx）、`-20`（上游集區） | **算術**比意圖更重要：nftables master 150 − 30 = 120，仍高於 backup 的 100，因此 master 上規則集檢查失敗本身並**不會**觸發容錯移轉。nginx master 150 − 60 = 90，**低於** backup 的 100，會觸發交班。此不對稱是刻意的：損壞的網頁代理必須失去 VIP，而規則集檢查失敗雖嚴重到必須告警，卻不足以自動把出口閘道交給可能具有相同缺陷的對等節點 |
| `rise` / `fall` | `2` / `2`（nftables、nginx）、`3` / `2`（上游集區）、`2` / `2`（出口） | 被追蹤狀態翻轉之前所需的連續成功/失敗次數。nginx 檢查上的 `fall 2` 搭配 `interval 3` 意味著代理必須失敗兩次（約 6 秒）才會移除權重，這可抑制單一請求的瞬斷。集區檢查上的 `rise 3` 則防止一部震盪的來源站立即把代理標記為健康 |
| `vrrp_garp_interval` | `0.001`（1 毫秒） | 轉換期間 gratuitous ARP 訊框之間的間隔節奏。零間隔會以核心所能的最快速度送出，在真實網段上可能使小型交換器的控制平面佇列溢位。對少量 ARP 而言，1 毫秒對用戶端實際上等同瞬時，且對交換器友善 |
| `vrrp_gna_interval` | `0.000001` | 未經請求的 IPv6 鄰居通告的間隔節奏。本設計已停用 IPv6，因此此項僅為組態可攜性而存在——而誠實的說明是：它在此處因此沒有可量測的效果 |
| `smtp_alert` | 已啟用，`smtp_server 10.10.30.31` | Keepalived 內建的轉換時郵件通知。`[假設]` `vpnz-mon01` 在基準設計中不執行 SMTP 監聽器，因此 `smtp_alert` 很可能記錄連線失敗，而**持久的通知路徑是 `vrrp-notify.sh` 中的 `logger`/檔案/UDP-syslog 路徑**，報告即依賴此路徑。若小組加入郵件轉送器，此事必須重新驗證；若否，停用 `smtp_alert` 並依賴 `notify` 是較乾淨的組態，而無論哪一種情況都必須記錄該發現 |

**Gratuitous ARP 行為及其對驗證的意義。** 當一部節點成為 master 時，它會以廣播 gratuitous ARP 來宣告 VIP，使上游交換器更新其 MAC 表。在本實驗室中，「交換器」是 Hypervisor 的虛擬網路，因此可觀察到的結果是用戶端對 `10.10.90.10` 的 ARP 快取改變了 MAC。這正是 §8.4.5 的容錯移轉測試所利用的機制：交班之後，同一網段上任何客體執行 `ip neigh show 10.10.90.10` 都必須顯示**新的** master MAC；若仍顯示舊的，表示 ARP 更新並未發生，用戶端將把流量送入黑洞——這是一個真實且具教示意義的失效模式，記錄於 §8.12。

#### 8.4.5 驗證

以下程序是作為證據所要求的確切順序。請在 **nginx 對組的 master**（`vpnz-dmzrev01`）上執行，並在 backup 上開啟第二個 SSH session，在用戶端主機上開啟第三個。

**步驟 1 — 建立基準狀態。**

```bash
# On vpnz-dmzrev01 AND vpnz-dmzrev02:
ip -br a show ens192
journalctl -u keepalived --since '-5min' --no-pager | tail -20
```

master 上的預期結果：

```text
ens192           UP             10.10.90.28/24 10.10.90.10/24
```
（請注意 VIP `10.10.90.10` **除了**節點自身位址之外亦出現），並在 journal 中：

```text
Oct 06 02:31:04 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Entering MASTER STATE
Oct 06 02:31:04 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) setting protocol VIPs
Oct 06 02:31:04 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Sending gratuitous ARP on ens192 for 10.10.90.10
Oct 06 02:31:04 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Received advert from 10.10.90.29 with lower priority 100
```

backup 上的預期結果：

```text
ens192           UP             10.10.90.29/24
```
以及：

```text
Oct 06 02:31:04 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) Entering BACKUP STATE
```

`[已由 Rev 1.1 裁定 C-02 解決]` 本註記所標示的衝突已修正：`vpnz-dmzrev01 = 10.10.90.28`、`vpnz-dmzrev02 = 10.10.90.29`，而 `10.10.90.10` **僅**為 keepalived VIP，且不屬於任何節點。因此該對組以一般、非持有者 VRRP 模式運行，且容錯移轉證據毫不含糊：測試之前，master 上的 `ip -br a` 顯示 `10.10.90.28/24` 加上 VIP `10.10.90.10/24`，backup 僅顯示 `10.10.90.29/24`；交班之後，VIP 出現在前 backup 上，並從前 master 上消失。先前關於持有者位址的告誡，以及要求判斷哪個位址位於哪部節點的指示，均已撤回，但事前擷取仍必須執行，因為該擷取正是「確實發生移動」的證據。原始註記開頭為：基準記錄 `vpnz-dmzrev01 = 10.10.90.10 (VIP 10.10.90.10)` 及 `vpnz-dmzrev02 = 10.10.90.11`。這意味著 master 的*自身*位址就是該對組所通告的 VIP 位址，這是合法的——即 VRRP 持有者位址——但它會略微改變容錯移轉的語意：在 master 上，`ip -br a` 只會顯示該位址一次（持有者模式）而非兩次，因此「VIP 已移動」的證據是測試前 `10.10.90.10` 在 backup 上的**不存在**，以及測試後的**存在**。建置者必須在任何容錯移轉測試之前，記錄這兩個位址分別出現在哪部節點上，否則證據將無法解讀。

**步驟 2 — 啟動連續性探測。** 單一次 `curl` 什麼也證明不了；迴圈才能證明服務在轉換期間持續可用。

```bash
# On a client host that can reach the DMZ VIP (e.g. the hypervisor host or vpnz-dmzjump01):
while true; do
  printf '%s %s\n' "$(date -u +%H:%M:%S)" \
    "$(curl -s -o /dev/null -w '%{http_code} %{time_total}s' \
        --cacert /etc/nginx/ssl/vp-root-ca.crt -H 'Host: portal.vertexpeak.example' \
        https://10.10.90.10/healthz || echo FAIL)"
  sleep 0.5
done | tee /var/log/fyp/failover-continuity.log
```

**步驟 3 — 破壞 master 的 Nginx。** 這正是 track script 存在的目的所要捕捉的*服務*失效，也是更有意思的測試。

```bash
# On vpnz-dmzrev01 (the current master):
sudo systemctl stop nginx
sudo /usr/local/bin/vrrp-check-nginx.sh ; echo "exit=$?"
```

停止之後應立即出現的預期結果：

```text
Oct 06 02:35:12 vpnz-dmzrev01 vrrp-check-nginx[2244]: UNHEALTHY: https://vpnz-dmzrev01.vertexpeak.fyp.lab/healthz returned '000' (expected 200)
exit=1
```

**步驟 4 — 觀察 VIP 離開 master。** 由於 `chk_nginx` 具有 `interval 3`、`fall 2` 及 `weight -60`，轉換應在約 6–8 秒內發生，而 `preempt_delay` 在交出的方向上並不適用。

```bash
ip -br a show ens192 ; echo '---' ; journalctl -u keepalived -f
```

`vpnz-dmzrev01` 上的預期結果：

```text
Oct 06 02:35:18 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Track script chk_nginx is FAULT state, priority 90
Oct 06 02:35:18 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Entering BACKUP STATE
Oct 06 02:35:18 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) removing VIPs.
```

以及新的介面狀態，其中 VIP 已消失：

```text
ens192           UP             10.10.90.29/24
```

`vpnz-dmzrev02` 上的預期結果：

```text
Oct 06 02:35:18 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) Receive advertisement timeout
Oct 06 02:35:18 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) Entering MASTER STATE
Oct 06 02:35:18 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) setting protocol VIPs
Oct 06 02:35:18 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) Sending gratuitous ARP on ens192 for 10.10.90.10
```

```bash
# On vpnz-dmzrev02:
ip -br a show ens192
# Expected: ens192 UP 10.10.90.29/24 10.10.90.10/24   <- the backup's own address plus the VIP that has arrived
```

**步驟 5 — 確認用戶端跟隨了這次移動。** 這一步區分了「VIP 已移動」與「服務仍可達」。

```bash
# On the client host:
ip neigh show 10.10.90.10
arping -c 3 -I <client-iface> 10.10.90.10
tail -5 /var/log/fyp/failover-continuity.log
```

用戶端的預期時間軸——一段以偵測間隔為界的短暫失效窗口，隨後復原：

```text
02:35:17 200 0.0041s
02:35:17 200 0.0038s
02:35:18 000 3.0012s     <- FAIL: VIP in transit
02:35:19 000 3.0010s
02:35:19 200 0.0092s     <- recovered against vpnz-dmzrev02
02:35:20 200 0.0044s
```

**這才是報告必須呈現的誠實結果**：配備服務 track script 的 Keepalived VRRP 對組不會提供零停機；它提供的是**約為偵測間隔加上 ARP 收斂時間的有限中斷**，在此處約為 3–8 秒。宣稱「無停機」將是不實的，而附有日誌的量測數字，是比含糊斷言更強的學術成果。連續性日誌、兩段 `journalctl` 摘錄、兩份 `ip -br a` 輸出，以及 `ip neigh` 輸出，是本次測試所要求的五張螢幕截圖。

**步驟 6 — 復原 master 並觀察回切。**

```bash
# On vpnz-dmzrev01:
sudo systemctl start nginx
sudo /usr/local/bin/vrrp-check-nginx.sh ; echo "exit=$?"
systemctl status nginx --no-pager | head -4
# Watch for the FAULT track script returning to OK and the priority going back to 150
journalctl -u keepalived -f
```

預期結果：

```text
Oct 06 02:38:02 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Track script chk_nginx is OK, priority 150
```

然後，在 `preempt_delay 30` 期滿之後（30 秒——這是刻意等待，用以防止震盪節點反覆衝擊 VIP）：

```text
Oct 06 02:38:32 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Entering MASTER STATE
Oct 06 06:38:32 vpnz-dmzrev01 Keepalived_vrrp[1187]: (VI_WEB) Sending gratuitous ARP on ens192 for 10.10.90.10
Oct 06 02:38:33 vpnz-dmzrev02 Keepalived_vrrp[1092]: (VI_WEB) Entering BACKUP STATE
```

```bash
# On the client: the continuity log should show a second, similar interruption at fail-back.
grep -n ' 000 ' /var/log/fyp/failover-continuity.log
# Expected: two short blocks of 000 lines, one at the failover and one at the fail-back.
```

**步驟 7 — 在 nftables 對組上重複整個流程。** 程序在 `vpnz-nft01`/`vpnz-nft02` 上完全相同，但受測服務是規則集而非 Nginx，且用戶端測試是轉送流量而非 HTTPS 請求：

```bash
# On vpnz-nft01 (master of vrid 51):
sudo nft flush ruleset                       # simulate the catastrophic loss of the ruleset
sudo /usr/local/bin/vrrp-check-nftables.sh ; echo "exit=$?"
# Expected log line:
#   vrrp-check-nftables[...]: UNHEALTHY: inet fyp_filter is not loaded
#   exit=1
journalctl -u keepalived -n 20 --no-pager
# Expected: "Track script chk_nftables is FAULT state, priority 120"
# NOTE: priority 120 is still above the peer's 100, so the VIP does NOT move. This is the designed
# asymmetric behaviour described in §8.4.4 and must be captured as evidence of intent, not as a bug.

# Restore immediately, then force a genuine failover to prove the VIP can move at all:
sudo nft -f /etc/nftables.conf
sudo systemctl stop keepalived               # cleanest way to force a real handover
# On vpnz-nft02: expect "(VI_EGRESS) Entering MASTER STATE" and the VIP 10.10.50.10 to appear.
ip -br a show ens192
```

乾淨地停止 `keepalived` 會使 master *撤回*其通告，而非停止送出通告，因此 backup 幾乎立即升格（一份優先權 0 的通告）。那比逾時路徑更快，並產生不同的 journal 行——`(VI_EGRESS) Sent 0 priority advert`——此事值得擷取，因為它證明此實作能區分有序關機與當機。

**本小節的證據摘要**（每一項都是具名螢幕截圖，依 HDTN 簡報的螢幕擷取要求——並非 WorldSkills 的要求）：(1) 測試前 master 上的 `ip -br a`；(2) 測試前 backup 上的 `ip -br a`；(3) `systemctl stop nginx` 及失敗的 track-script 執行；(4) 顯示雙向狀態轉換的 `journalctl -u keepalived`；(5) 新 master 上顯示 VIP 的 `ip -br a`；(6) 顯示中斷窗口的連續性 `curl` 日誌；(7) 證明 ARP 快取已跟隨的 `ip neigh show 10.10.90.10`；(8) 以 `nft flush ruleset` 對 nftables 對組重複的同一流程。

### 8.5 nftables 防火牆與邊界路由

#### 8.5.1 設計

nftables 對組 `vpnz-nft01` / `vpnz-nft02` **內嵌**於總部核心與 ASA 周邊防火牆之間，位於傳輸網段 `10.10.50.0/28`（VLAN 50 `TRANSIT-EGRESS`，`Z-EGRESS`）上。它的位置正是本設計的要點：來自 `Z-USER` 或 `Z-SERVER` 朝網際網路的每一個封包都必須穿越它，因此它是唯一的瓶頸點，出口流量在此被過濾、歸因至來源、進行網路位址轉譯並記錄。每部節點都有兩張 NIC（`VNET-EGRESS` 及 `VNET-WAN`）——依 Rev 1.1 裁定 C-07，WAN 側 NIC 在 `vpnz-nft01` 上承載 `10.10.200.2/24`，在 `vpnz-nft02` 上承載 `10.10.200.3/24`——這是對真實線上串接式（bump-in-the-wire）部署所能取得最忠實的近似；誠實的表述是：分段成效是真實的，而機制是模擬的。

這是**刻意的雙防火牆設計**：ASA `VP-HQ-FW-01` 擁有 DMZ 邊界與公開邊緣，而 nftables 對組在其內部第二層重新套用政策。這並非意外重複，必須呈現為第二次套用同一政策。此分工同時也是可用工具所造成的設計結果：Packet Tracer 的 ASA 能強制執行 DMZ ACL 與 NAT，但無法記錄至檔案、無法以 `sets` 執行具狀態過濾，也無法由 Ansible 驅動指令碼——因此需要這些特性的政策部分由 Linux 對組承載。

**信任區與本裝置的職責**（取自規範性信任邊界表）：

| 規則 ID | 從 → 至 | 判定 | nftables 如何實作 |
|---|---|---|---|
| TB-01 | `Z-USER`（VLAN 10/30/40）→ `Z-SERVER`（VLAN 60/80） | REVIEW | 非本裝置：該流量留在核心內部，永不抵達 `Z-EGRESS`。此處載明是為了使裝置之間的界線毫不含糊 |
| TB-02 | `Z-USER` → 網際網路 | REVIEW | `forward` chain，`iifname "ens192"` 從 `10.10.40.0/23` 至 `wan4`：TCP 80/443、至兩部 DC 的 DNS、至兩部 DC 的 NTP、ICMP；其餘全部記錄並丟棄，並加上 `NFT-DROP: TB-02 ` 前綴 |
| TB-03 | `Z-SERVER` → 網際網路 | REVIEW | `10.10.30.0/24` 及 `10.10.80.0/24` → `wan4`：TCP 443（修補、Git）、NTP、至兩部 DC 的 DNS、ICMP。依來源 IP 歸因並記錄 |
| TB-04 | `Z-DMZ` → `Z-SERVER` / `Z-USER` | **DENY** | 明確的已記錄丟棄，前綴 `NFT-DROP: TB-04 `，且置於**任何**可能匹配 DMZ 來源的允許規則**之前** |
| TB-05 | 網際網路 → `Z-DMZ` | REVIEW | NAT prerouting 僅對 `198.51.100.2:80,443` 進行 DNAT，然後 forward 允許 `dmz4` 的 443/80 |
| TB-06 | 網際網路 → `Z-SERVER` / `Z-USER` | **DENY** | `lan4` 中沒有任何前綴被通告、DNAT 或從 `wan4` 允許；全捕捉的已記錄丟棄即為執行機制 |
| TB-07 | `Z-MGMT` → 每個區域 | PERMIT | `iifname "ens192"` 從 `mgmt4` 至任何 `lan4`：TCP 22、3389、5985、5986、6516，UDP 161、514。管理流量被允許，來自管理區的其他流量則不被允許 |
| TB-08 | 每個區域 → `Z-MGMT` | REVIEW | 僅允許從已列舉的裝置位址至 `vpnz-mon01` 的 UDP 514（syslog）及 UDP 161/162（SNMP） |
| TB-09 / TB-10 | `Z-STUDENT` → 任何目標 / 網際網路 | **DENY** | `10.70.0.0/16` 在任何集合中都沒有前綴，也沒有經由本裝置的路由；全捕捉丟棄即為執行機制，並在一條明確的早期規則上加上前綴 `NFT-DROP: TB-09 `，使拒絕可歸因 |
| TB-11 / TB-12 | `Z-REMOTE` → `Z-SERVER` / `Z-MGMT` | REVIEW / **DENY** | VPN 集區前綴出現在 `vpn4` 中；`vpn4 → mgmt4` 有一條明確的已記錄丟棄，前綴 `NFT-DROP: TB-12 ` |
| TB-13 | `Z-DMZ` → 網際網路 | REVIEW | `iifname "ens192"` 從 `dmz4` → `wan4`：僅 TCP 443 及 DNS，且僅來自三個已列舉的 DMZ 來源位址 |
| TB-14 | `Z-WAN` 分支路由器 → `Z-MGMT` | **DENY** | `wan4 → mgmt4` 在任何地方均不被允許；明確的已記錄丟棄，前綴 `NFT-DROP: TB-14 ` |
| TB-15 | `Z-MGMT` → `Z-DMZ` 以供管理 | REVIEW | DMZ 主機的管理僅能經由 `vpnz-dmzjump01`（`10.10.90.27`）；本對組僅允許 `mgmt4 → 10.10.90.27` 的 22 埠 |
| TB-16 | `vpnz-ai01` → 受監控裝置 | REVIEW | 從 `10.10.30.51` 至已列舉管理埠的唯讀輪詢；規則集中不存在任何寫入路徑 |

**NAT 摘要。** 對已發佈服務（僅使用文件用位址，取自 RFC 5737 範圍）進行 prerouting DNAT，在輸出路徑上進行 postrouting masquerade，使內部位址永不被曝露，且**刻意不設定 hairpin NAT**——內部用戶端存取已發佈名稱時，會經由分裂視域 DNS 將其解析至內部 VIP（`10.10.90.10`），因此 hairpin 規則只會是毫無作用的組態，徒然使設計晦澀難解。

#### 8.5.2 完整規則集

規則集是置於一個 `inet` 表 `fyp_filter` 中的單一 ruleset，正如命名契約所固定。它被拆分為 `/etc/nftables.d/` 下的多個 include 片段，以便各節能獨立審閱——但這些片段僅被 `include`，**絕不獨立載入**，因為 nftables 是以表為單位原子操作：單獨載入一個片段會清空並取代作者無意觸及的規則。每個片段宣告自己的 chain，且僅*新增*規則至 `10-sets.nft` 中所宣告的 chain。

```nftables
# --- 1 of 6 -------------------------------------------------------------------
# /etc/nftables.d/10-sets.nft  —  table, chains, sets and named sets
# Loaded by /etc/nftables.conf via `include "/etc/nftables.d/*.nft"`. NEVER load this file alone.
# Verify with:  nft -c -f /etc/nftables.conf   then   nft list ruleset

flush ruleset                 # start from a known-empty state; the file is the single source of truth

table inet fyp_filter {
    # ---- named sets: service groups referenced by rule, so a port change is a one-line edit ----
    set svc_web       { type inet_service;  elements = { 80, 443 } }                      # HTTP/HTTPS
    set svc_mgmt      { type inet_service;  elements = { 22, 3389, 5985, 5986, 6516 } }   # SSH/RDP/WinRM/WAC
    set svc_dns       { type inet_service;  elements = { 53 } }                           # DNS, tcp+udp
    set svc_syslog    { type inet_service;  elements = { 514 } }                          # syslog receiver

    # ---- IPv4 sets: the identity of every zone that this device must reason about ----
    set mgmt4 {
        type ipv4_addr; flags interval;
        elements = {
            10.20.20.0/24,      # VLAN 20 MGMT-OOB : hypervisor host, switch management, vpnz-jump01
            10.10.30.31         # vpnz-mon01 : automation and monitoring control node
        }
        comment "Z-MGMT : the highest restricted zone"
    }
    set lan4 {
        type ipv4_addr; flags interval;
        elements = {
            10.10.10.0/24,      # VLAN 10 LAN-HQ-CORE
            10.10.30.0/24,      # VLAN 30 SRV-HQ-1
            10.10.40.0/23,      # VLAN 40 USER-HQ-STF
            10.10.45.0/24,      # VLAN 45 VOICE-HQ
            10.10.80.0/24,      # VLAN 80 STORAGE-HQ
            10.10.110.0/24,     # Kwun Tong
            10.10.111.0/24,
            10.10.112.0/24,
            10.10.113.0/24,
            10.10.120.0/24,     # Macau
            10.10.121.0/24,
            10.10.130.0/24,     # Wan Chai
            10.10.131.0/24
        }
        comment "all internal LAN space that may legitimately reach the Internet"
    }
    set dmz4 {
        type ipv4_addr; flags interval;
        elements = {
            10.10.90.0/24       # VLAN 90 DMZ-HQ : the whole DMZ, internally untrusted
        }
        comment "Z-DMZ : externally reachable, internally untrusted"
    }
    set vpn4 {
        type ipv4_addr; flags interval;
        elements = {
            10.10.201.0/24,     # RRAS IKEv2 remote-access pool
            10.10.202.0/24,     # OpenVPN pool
            10.10.200.64/26     # WireGuard remote-worker pool
        }
        comment "Z-REMOTE : authenticated remote access pools"
    }
    set wan4 {
        type ipv4_addr; flags interval;
        elements = {
            0.0.0.0/0
        }
        comment "Z-WAN : the Internet. Kept as a named set so the direction of a rule is readable"
    }

    # ---- server identities used by the permit rules (exact, from the static host table) ----
    set dns_servers   { type ipv4_addr; elements = { 10.10.30.11, 10.10.30.12 } }
    set ntp_servers   { type ipv4_addr; elements = { 10.10.30.11, 10.10.30.12 } }
    set log_receiver  { type ipv4_addr; elements = { 10.10.30.31 } }
    set dmz_mgmt_path { type ipv4_addr; elements = { 10.10.90.27 } }   # vpnz-dmzjump01
    set dmz_egress_ok { type ipv4_addr; elements = { 10.10.90.28, 10.10.90.29, 10.10.90.21, 10.10.90.22 } }

    # ---- the blocklist: addressed dynamically by fail2ban-style tooling and by the AI line ----
    set blocklist {
        type ipv4_addr;
        flags timeout, dynamic;
        timeout 1h;
        comment "sources to drop outright; entries added by tooling, never hand-edited in production"
    }

    # ---- conntrack helpers (a named set of the helper names is not needed; declared per rule) ----

    # =============================================================================
    # CHAINS
    # =============================================================================
    # input: traffic addressed TO this firewall host.
    # priority filter + policy drop: the default is to refuse everything not explicitly permitted.
    chain input {
        type filter hook input priority filter; policy drop;

        # 1. Loopback is always permitted: systemd-resolved, nginx stub_status and local tooling need it.
        iifname "lo" counter accept comment "loopback"

        # 2. Stateful shortcut. Without this, return traffic for permitted outbound connections
        #    would be dropped by the policy and every service would appear broken.
        ct state established,related counter accept comment "existing flows in either direction"
        ct state invalid counter drop comment "invalid conntrack state - drop before anything else reads it"

        # 3. Ping the firewall itself, rate limited. Useful for the keepalived track script and for
        #    monitoring; unlimited ICMP is an amplification and exhaustion vector.
        ip protocol icmp icmp type { echo-request } limit rate 10/second burst 20 packets \
            counter accept comment "rate-limited ICMP echo to the firewall"

        # 4. Blocklisted sources are refused before any service rule can be reached.
        ip saddr @blocklist counter log prefix "NFT-DROP: BLOCKLIST in " level warn counter drop

        # 5. Management plane. SSH from Z-MGMT and from the monitoring control node only; the
        #    per-host sshd AllowGroups directive is the second control.
        iifname "ens192" ip saddr @mgmt4 tcp dport 22 ct state new \
            counter accept comment "TB-07 SSH administration from the management zone"

        # 6. Syslog from every managed device, and SNMP polling from the monitoring node only.
        udp dport 514 ip saddr @mgmt4 counter accept comment "TB-08 syslog from mgmt"
        iifname "ens192" udp dport 514 counter accept comment "TB-08 syslog from the internal estate"
        ip saddr 10.10.30.31 udp dport 161 counter accept comment "TB-08 SNMPv3 polling from vpnz-mon01"
        udp dport 162 ip saddr 10.10.30.31 counter accept comment "TB-08 SNMP traps to vpnz-mon01"

        # 7. NTP as a client of the domain controllers only.
        ip saddr @ntp_servers udp dport 123 counter accept comment "time from the authoritative DCs"

        # 8. DNS responses for the firewall host's own resolution (queries are permitted in output).
        ip saddr @dns_servers ct state established counter accept comment "DNS replies from the DCs"

        # 9. WireGuard on the two ports the design uses: UDP 443 for the site and remote tunnels and
        #    UDP 51820 for the documented out-of-band management escape hatch. TB-06 permits exactly
        #    these because they are the only Internet-reachable services on this pair.
        udp dport 443 iifname "ens224" counter accept comment "WG-HQ-WC and WireGuard remote workers"
        udp dport 51820 iifname "ens224" ip saddr 10.10.30.31 counter accept comment "MGMT-TUNNEL from vpnz-mon01"

        # 10. VRRP protocol traffic between the pair. VRRP is IP protocol 112 and uses multicast
        #     224.0.0.18; it must never be permitted from outside the pair's own segment.
        iifname "ens192" ip protocol vrrp ip saddr { 10.10.50.11, 10.10.50.12 } \
            counter accept comment "VRRP advertisements and priority-0 withdraws between the pair"
        ip protocol vrrp ip saddr != { 10.10.50.11, 10.10.50.12 } \
            counter log prefix "NFT-DROP: VRRP-SPOOF " level warn counter drop

        # 11. Everything else to the firewall is dropped AND logged, so an unlisted service attempt
        #     leaves a trace instead of disappearing.
        counter log prefix "NFT-DROP: INPUT " level warn counter drop
    }

    # forward: traffic TRANSITING this device. This is the core of the design.
    chain forward {
        type filter hook forward priority filter; policy drop;

        # --- stateful baseline (must be first: see the pitfalls in §8.5.7) ---
        ct state established,related counter accept comment "return traffic for permitted flows"
        ct state invalid counter log prefix "NFT-DROP: INVALID " level warn counter drop

        # --- blocklist is consulted before any zone policy ---
        ip saddr @blocklist counter log prefix "NFT-DROP: BLOCKLIST fwd " level warn counter drop

        # =========================================================================
        # FORBIDDEN DIRECTIONS, logged FIRST so they can never be shadowed by a permit.
        # Each has a DISTINGUISHABLE log prefix, which is what makes the denial
        # attributable to a single TB row in the evidence capture.
        # =========================================================================

        # TB-04 : the DMZ must never initiate toward the internal network, for any protocol.
        iifname "ens192" ip saddr @dmz4 ip daddr @lan4 \
            counter log prefix "NFT-DROP: TB-04 " level warn counter drop

        # TB-06 : the Internet must never reach a server or a user host. Only the two VPN endpoints
        #         and the reverse proxy are Internet-reachable, and those arrive by DNAT to the DMZ.
        iifname "ens224" ip saddr @wan4 ip daddr @lan4 \
            counter log prefix "NFT-DROP: TB-06 " level warn counter drop

        # TB-09 : the isolated student/lab segment is denied everything off-segment by design.
        ip saddr 10.70.0.0/16 ip daddr != 10.70.0.0/24 \
            counter log prefix "NFT-DROP: TB-09 " level warn counter drop

        # TB-12 : VPN users are never administrators of infrastructure.
        ip saddr @vpn4 ip daddr @mgmt4 \
            counter log prefix "NFT-DROP: TB-12 " level warn counter drop

        # TB-14 : branch routers must not reach the management zone.
        iifname "ens224" ip daddr @mgmt4 \
            counter log prefix "NFT-DROP: TB-14 " level warn counter drop

        # =========================================================================
        # PERMITTED DIRECTIONS
        # =========================================================================

        # --- TB-07 : management zone may administer everything, on management protocols only ---
        iifname "ens192" ip saddr @mgmt4 tcp dport @svc_mgmt counter accept comment "TB-07 management protocols"
        iifname "ens192" ip saddr @mgmt4 icmp type { echo-request } counter accept comment "TB-07 ICMP for reachability tests"

        # --- TB-15 : DMZ management is possible only through vpnz-dmzjump01 ---
        iifname "ens192" ip saddr @mgmt4 ip daddr @dmz_mgmt_path tcp dport 22 \
            counter accept comment "TB-15 the only management path into the DMZ is the jump host"

        # --- TB-01 : user and server zones reaching server services ---
        ip saddr { 10.10.40.0/23, 10.10.10.0/24 } ip daddr @dns_servers udp dport 53 counter accept comment "TB-01 DNS udp"
        ip saddr { 10.10.40.0/23, 10.10.10.0/24 } ip daddr @dns_servers tcp dport 53 counter accept comment "TB-01 DNS tcp"
        ip saddr { 10.10.40.0/23, 10.10.10.0/24 } ip daddr @dns_servers tcp dport { 88, 389, 445 } counter accept comment "TB-01 Kerberos, LDAP, SMB to the DCs"
        ip saddr { 10.10.40.0/23, 10.10.10.0/24 } ip daddr 10.10.30.31 tcp dport 443 counter accept comment "TB-01 HTTPS to the monitoring host"
        ip saddr { 10.10.40.0/23, 10.10.10.0/24 } ip daddr @dns_servers tcp dport 53 counter accept comment "TB-01 zone transfer path (AXFR restricted to the DCs at the server)"

        # --- TB-11 : VPN clients reach server services, and RDP only to the platform tier ---
        ip saddr @vpn4 ip daddr @dns_servers udp dport 53 counter accept comment "TB-11 DNS for VPN clients"
        ip saddr @vpn4 ip daddr @dns_servers tcp dport { 53, 88, 389, 445 } counter accept comment "TB-11 directory and file services"
        ip saddr @vpn4 ip daddr { 10.10.30.11, 10.10.30.12, 10.10.30.21 } tcp dport 3389 counter accept comment "TB-11 RDP to the platform tier for the professional-services group"

        # --- TB-05 : the Internet reaches the DMZ web tier only, over the published ports ---
        iifname "ens224" ip saddr @wan4 ip daddr @dmz4 tcp dport @svc_web counter accept comment "TB-05 published portal and blog"
        iifname "ens224" ip saddr @wan4 ip daddr @dmz4 icmp type { echo-request } limit rate 10/second burst 20 packets counter accept comment "TB-05 rate-limited ICMP to the DMZ"

        # --- TB-13 : the DMZ fetches patches and resolves names, outbound only, from named hosts ---
        iifname "ens192" ip saddr @dmz_egress_ok ip daddr @wan4 tcp dport 443 counter accept comment "TB-13 DMZ package and patch retrieval"
        iifname "ens192" ip saddr @dmz_egress_ok ip daddr @dns_servers udp dport 53 counter accept comment "TB-13 DMZ DNS"
        iifname "ens192" ip saddr @dmz_egress_ok ip daddr @dns_servers tcp dport 53 counter accept comment "TB-13 DMZ DNS over TCP"

        # --- TB-02 : user zones to the Internet, on the four permitted protocols only ---
        iifname "ens192" ip saddr 10.10.40.0/23 ip daddr @wan4 tcp dport { 80, 443 } ct state new counter accept comment "TB-02 user web browsing"
        iifname "ens192" ip saddr 10.10.40.0/23 ip daddr @dns_servers udp dport 53 counter accept comment "TB-02 user DNS via the internal resolver"
        iifname "ens192" ip saddr 10.10.40.0/23 ip daddr @wan4 icmp type { echo-request } counter accept comment "TB-02 ICMP echo"
        iifname "ens192" ip saddr 10.10.40.0/23 ip daddr @wan4 counter log prefix "NFT-DROP: TB-02 " level warn counter drop

        # --- TB-03 : server zones to the Internet for patching and Git, attributed and logged ---
        ip saddr { 10.10.30.0/24, 10.10.80.0/24 } ip daddr @wan4 tcp dport 443 counter accept comment "TB-03 package, patch and Git"
        ip saddr { 10.10.30.0/24, 10.10.80.0/24 } ip daddr @dns_servers udp dport 53 counter accept comment "TB-03 DNS via the DCs"
        ip saddr { 10.10.30.0/24, 10.10.80.0/24 } ip daddr @wan4 icmp type { echo-request } counter accept comment "TB-03 ICMP echo"
        ip saddr { 10.10.30.0/24, 10.10.80.0/24 } ip daddr @wan4 counter log prefix "NFT-DROP: TB-03 " level warn counter drop

        # --- TB-16 : the AI agent polls read-only, and can never write ---
        ip saddr 10.10.30.51 ip daddr @mgmt4 tcp dport 22 counter accept comment "TB-16 read-only SSH polling from the agent"
        ip saddr 10.10.30.51 tcp dport { 161, 5986, 443 } counter accept comment "TB-16 read-only SNMP, WinRM and HTTPS polling"
        ip saddr 10.10.30.51 tcp dport != { 161, 5986, 443, 22 } counter log prefix "NFT-DROP: TB-16-WRITE " level warn counter drop comment "any other port from the agent is a policy violation"

        # --- intra-zone transit through the pair (for the DMZ management path and VRRP-adjacent traffic) ---
        iifname "ens192" oifname "ens192" ip saddr @dmz4 ip daddr @dmz4 counter accept comment "intra-DMZ transit, no policy relaxation"

        # =========================================================================
        # CATCH-ALL: nothing that reached this point was permitted by policy.
        # =========================================================================
        counter log prefix "NFT-DROP: FORWARD " level warn counter drop
    }

    # =========================================================================
    # NAT
    # =========================================================================
    chain nat_prerouting {
        type nat hook prerouting priority dstnat; policy accept;

        # TB-05 : published portal. 198.51.100.2:80,443 -> the reverse-proxy VIP 10.10.90.10.
        # Every DNAT target below is taken from the public addressing table; no real public address
        # exists anywhere in this project.
        iifname "ens224" ip daddr 198.51.100.2 tcp dport { 80, 443 } \
            dnat to 10.10.90.10 comment "portal.vertexpeak.example -> nginx VIP"

        # TB-05 : published www. 198.51.100.3:443 -> the IIS application tier node 1.
        # Node 2 is reached through the proxy pool, not by a second public address, so the
        # published surface stays one address per service.
        iifname "ens224" ip daddr 198.51.100.3 tcp dport 443 \
            dnat to 10.10.90.21 comment "www.vertexpeak.example -> vpnz-dmzweba01"

        # TB-05 : published blog. 198.51.100.4:443 -> WordPress node 1.
        iifname "ens224" ip daddr 198.51.100.4 tcp dport 443 \
            dnat to 10.10.90.25 comment "blog.vertexpeak.example -> vpnz-dmzwp01"

        # TB-06 : the VPN front door. 198.51.100.5 -> the nftables VIP, then by port to the host.
        iifname "ens224" ip daddr 198.51.100.5 udp dport 1194 \
            dnat to 10.10.30.42:1194 comment "198.51.100.5:1194/udp -> vpnz-lnxra01 OpenVPN"
        iifname "ens224" ip daddr 198.51.100.5 udp dport 4500 \
            dnat to 10.10.30.41:4500 comment "198.51.100.5:4500/udp -> vpnz-rras01 IKEv2 NAT-T"
        iifname "ens224" ip daddr 198.51.100.5 udp dport 500 \
            dnat to 10.10.30.41:500 comment "198.51.100.5:500/udp -> vpnz-rras01 IKEv2"

        # WireGuard is NOT DNAT'd: the tunnel terminates on the VIP owner itself
        # (10.10.50.10, floating between 10.10.50.11 and 10.10.50.12), so its UDP 443 is handled
        # by the input chain above. Documenting the absence prevents a future "missing rule" bug.
    }

    chain nat_postrouting {
        type nat hook postrouting priority srcnat; policy accept;

        # Outbound masquerade toward the ASA. Every internal address is hidden behind the
        # egress path, so no internal prefix is ever exposed to the WAN side.
        oifname "ens224" ip saddr @lan4 masquerade comment "TB-02/TB-03 egress masquerade for LAN sources"
        oifname "ens224" ip saddr @dmz4  masquerade comment "TB-13 egress masquerade for DMZ patch retrieval, from the enumerated hosts only"
    }

    # ---- chain used by rules that need a scoped, rate-limited drop log ----
    # DECLARED HERE, in the same fragment as the other chains, and NOT in the logging fragment.
    # nftables parses a ruleset in order, so a chain must exist before any rule can jump to it;
    # keeping all chain declarations in one place removes that ordering constraint entirely.
    # The RULES for this chain live in 90-logging.nft, which is loaded after this file.
    chain log_dropped {
        limit rate 10/minute burst 20 packets \
            log prefix "NFT-DROP: RATELIMITED " level warn
        counter drop
    }
}
```

將各部分串接起來的 include 檔案，同時也是 systemd 所載入的檔案：

```nftables
# /etc/nftables.conf  —  Vertex Peak FYP egress firewall
# Applied by:  sudo nft -c -f /etc/nftables.conf      (syntax check, no change)
#              sudo nft -f /etc/nftables.conf         (apply)
# Persisted by: systemctl enable --now nftables       (loads this file at boot)
#              plus the project's atomic wrapper  04-automation/bash/02-nftables-apply.sh
#                                                    which arms a revert timer before applying

#!/usr/sbin/nft -f

include "/etc/nftables.d/10-sets.nft"        # table, chains, sets (must be first: it declares them)
include "/etc/nftables.d/20-filter-input.nft"
include "/etc/nftables.d/30-filter-forward.nft"
include "/etc/nftables.d/40-nat.nft"
include "/etc/nftables.d/90-logging.nft"     # log rate limits and the log_dropped chain
```

關於片段拆分的 `[假設]`：這五個檔名由基準的組態路徑表固定，但基準**並未**說明哪些規則位於哪個片段。上述分配（sets、input、forward、nat、logging）是自然的解讀，也是 Ansible role `roles/nftables/` 應從 `templates/nftables.conf.j2` 產生的結果。若小組選擇不同的拆分方式，基準必須修訂——片段的*名稱*是契約，*內容*則不是。

#### 8.5.3 套用與持久化

```bash
# 1. Syntax check. This parses the whole file, including every include, and changes nothing.
#    Run it after EVERY edit. It is the single highest-value habit in this sub-section.
sudo nft -c -f /etc/nftables.conf
# Expected on success: no output and exit status 0.
# Expected on failure: a file, line and column, e.g.
#   /etc/nftables.d/30-filter-forward.nft:118:9-18: Error: unknown keyword
echo "exit=$?"
```

```bash
# 2. Apply. Because the file begins with `flush ruleset`, this is atomic per table and is fully
#    declarative: whatever was loaded before is replaced.
sudo nft -f /etc/nftables.conf
sudo nft list ruleset | head -20
```

```bash
# 3. Persistence at boot. `systemctl enable --now nftables` both applies the file now and loads
#    it at every boot via /lib/systemd/system/nftables.service, which runs
#    `/usr/sbin/nft -f /etc/nftables.conf`. There is no separate save step and no nftables.dump:
#    the file IS the state.
sudo systemctl enable --now nftables
systemctl status nftables --no-pager | head -6
systemctl is-enabled nftables        # expected: enabled
```

```bash
# 4. Prove persistence rather than assuming it: flush, reboot, and check that the ruleset returned.
sudo nft flush ruleset
sudo nft list ruleset | wc -l        # expected: 0
sudo reboot
# After the reboot:
sudo nft list ruleset | head -5
systemctl is-active nftables         # expected: active
```

**鎖死風險及其緩解。** 這是整個 Linux 環境中唯一能使遠端 VM 永久無法連線的組態：`input` chain 中的一個錯誤會丟棄管理員自身的 SSH session，而若該規則集同時也是開機規則集，該錯誤便會在重新開機後存續。兩項防護為強制要求，且兩者都必須作為證據展示。

第一，具回退計時器的原子套用包裝器，這正是基準所點名的緩解措施（`04-automation/bash/02-nftables-apply.sh`，設定一個 `at` 式的回退）：

```bash
#!/usr/bin/env bash
# 04-automation/bash/02-nftables-apply.sh
# Apply a candidate ruleset with an automatic rollback if the operator does not confirm.
# Usage: sudo ./02-nftables-apply.sh /etc/nftables.conf [revert-seconds]
set -euo pipefail

CANDIDATE="${1:-/etc/nftables.conf}"
REVERT_SECONDS="${2:-120}"
STAMP="$(date +%Y%m%d-%H%M%S)"
CONFIRM="/tmp/nft-apply-confirm.$$"

# 1. Always have a rollback artefact before touching anything.
sudo nft list ruleset > "/etc/nftables.d/rollback-${STAMP}.nft"
echo "[i] rollback captured: /etc/nftables.d/rollback-${STAMP}.nft"

# 2. Syntax check the candidate. Never apply a file that does not parse.
sudo nft -c -f "${CANDIDATE}" || { echo "[!] syntax check FAILED, nothing applied"; exit 1; }

# 3. Arm the revert. cmd_at/atd must be installed (apt install at && systemctl enable --now atd).
sudo systemd-run --on-active="${REVERT_SECONDS}s" --unit="nft-revert-${STAMP}" \
  /bin/bash -c "test -f '${CONFIRM}' || nft -f '/etc/nftables.d/rollback-${STAMP}.nft'"
echo "[i] auto-revert armed for ${REVERT_SECONDS}s (unit nft-revert-${STAMP})"

# 4. Apply.
sudo nft -f "${CANDIDATE}"
echo "[i] applied. Open a NEW ssh session and verify before confirming:"
echo "      sudo nft list ruleset | head"
echo "      ping -c2 10.10.50.1"

# 5. Confirm within the window.
read -r -p "Keep this ruleset? [y/N] " ans
if [[ "${ans}" =~ ^[Yy]$ ]]; then
    touch "${CONFIRM}"
    sudo systemctl stop "nft-revert-${STAMP}.timer" 2>/dev/null || true
    echo "[i] confirmed: ruleset retained."
else
    sudo nft -f "/etc/nftables.d/rollback-${STAMP}.nft"
    echo "[i] reverted."
fi
```

第二，一條**不依賴網路的主控台路徑**。Hypervisor 自身的 VM 主控台無論 Linux 規則集做了什麼都仍然可用，因此當規則集已把 SSH 鎖在外面時，復原程序為：在 `vpnz-nft01` 上開啟 Hypervisor 主控台，以 `fypadmin` 登入，並執行 `sudo nft -f /etc/nftables.d/rollback-<stamp>.nft`——或者，若不存在回退檔，則執行 `sudo systemctl stop nftables && sudo nft flush ruleset`。此緩解措施必須在建置週中**刻意示範一次**並加以擷取；從未實際演練過的緩解措施只是主張，而非控制項。

#### 8.5.4 IP 轉送與核心調校

nftables 對組若沒有 `net.ipv4.ip_forward`，連一個封包都無法轉送。這些設定存放於 `/etc/sysctl.d/99-fyp-hardening.conf`（權限 `0644`），這是基準所固定的路徑。

```ini
# /etc/sysctl.d/99-fyp-hardening.conf
# Vertex Peak FYP — kernel parameters.
# Apply with:  sudo sysctl --system        (reloads every file in /etc/sysctl.d/ in lexical order)
# Verify with: sysctl -a | grep -E 'ip_forward|rp_filter|syncookies|accept_redirects'

# ---------------------------------------------------------------------------
# ROUTING (nftables pair only — these two lines must NOT be present on non-router hosts)
# ---------------------------------------------------------------------------
# net.ipv4.ip_forward = 1        # uncomment ONLY on vpnz-nft01, vpnz-nft02, vpnz-dmzjump01 (if routing)
# net.ipv6.conf.all.forwarding = 0

# ---------------------------------------------------------------------------
# ANTI-SPOOFING
# ---------------------------------------------------------------------------
# Strict reverse-path filtering: drop a packet whose source address is not reachable
# back through the interface it arrived on. This is the single most valuable sysctl on a
# multi-homed firewall host, because it defeats simple source-address spoofing.
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.ens192.rp_filter = 1
net.ipv4.conf.ens224.rp_filter = 1

# ---------------------------------------------------------------------------
# ICMP AND REDIRECT HYGIENE
# ---------------------------------------------------------------------------
net.ipv4.conf.all.accept_redirects = 0            # a firewall must never accept an ICMP redirect
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.all.send_redirects = 0              # and must never generate one either
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0         # source routing is obsolete and abusable
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1          # no smurf amplification
net.ipv4.icmp_ignore_bogus_error_responses = 1    # do not log garbage from broken devices
net.ipv4.icmp_ratelimit = 100                     # 100 ms between rate-limited ICMP messages
net.ipv4.icmp_ratemask = 6168

# ---------------------------------------------------------------------------
# TCP STACK HARDENING
# ---------------------------------------------------------------------------
net.ipv4.tcp_syncookies = 1                       # survive a SYN flood without dropping the listener
net.ipv4.tcp_rfc1337 = 1                          # drop RST in TIME_WAIT (a real attack primitive)
net.ipv4.tcp_timestamps = 0                       # removes a known uptime/leak side channel
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.ip_local_port_range = 10240 65000        # avoid well-known ports for ephemeral use
net.ipv4.conf.all.log_martians = 1                # log impossible source addresses

# ---------------------------------------------------------------------------
# CONNECTION TRACKING
# ---------------------------------------------------------------------------
# 131072 concurrent tracked flows. On a workstation-class VM this is generous, and it is set
# explicitly so that the conntrack table becomes a documented, monitored quantity rather than
# a surprise under a deliberate flood test.
net.netfilter.nf_conntrack_max = 131072
net.netfilter.nf_conntrack_tcp_timeout_established = 3600
net.netfilter.nf_conntrack_tcp_timeout_time_wait = 30
net.netfilter.nf_conntrack_generic_timeout = 120

# ---------------------------------------------------------------------------
# KERNEL PROTECTIONS
# ---------------------------------------------------------------------------
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 1
kernel.randomize_va_space = 2
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
net.ipv4.conf.all.promisc = 0
```

```bash
sudo sysctl --system | tail -20
sysctl net.ipv4.ip_forward net.ipv4.conf.all.rp_filter net.netfilter.nf_conntrack_max
# Expected:
#   net.ipv4.ip_forward = 1
#   net.ipv4.conf.all.rp_filter = 1
#   net.netfilter.nf_conntrack_max = 131072
```

`[假設]`：`net.netfilter.*` 參數只有在 `nf_conntrack` 模組載入之後才可寫入，實務上即表示在 `nftables` 或 `conntrack` 已啟動之後。若 `sysctl --system` 回報 `cannot stat /proc/sys/net/netfilter/nf_conntrack_max`，表示在開機的那個時間點該模組尚未載入；修正方式是將 `nf_conntrack` 加入 `/etc/modules-load.d/` 並重新執行，或接受一則開機時警告，並由一個排序在 `nftables.service` 之後的 `systemd` 單元設定該值。建置者必須記錄實際需要哪一種做法。

#### 8.5.5 日誌記錄與可觀測性

nftables 的日誌訊息會送往核心日誌；在搭配 systemd-journald 的 Ubuntu Server 上，這意味著 journal 中的 **`kernel` facility**，並從那裡送往 `/var/log/kern.log`（若 `rsyslog` 正在寫入該檔案）。它們在每種組態下都**不會**預設出現在 `/var/log/syslog` 中，因此診斷時必須指明正確的位置。

```bash
# Live view of nftables drops. The kernel ring buffer is the immediate source.
sudo journalctl -k -f | grep --line-buffered 'NFT-'

# Same messages from the file, when rsyslog is configured to write them.
sudo tail -f /var/log/kern.log | grep --line-buffered 'NFT-'

# Or read the kernel ring directly, which also works while journald is being restarted.
sudo dmesg -wT | grep --line-buffered 'NFT-'
```

由於每一條丟棄規則都帶有**可辨識的前綴**，單一次 `grep` 即可證明某一特定信任邊界列：

```bash
# TB-04 : the DMZ tried to initiate toward the internal network
sudo journalctl -k --since '-15min' | grep 'NFT-DROP: TB-04'

# TB-06 : something on the Internet tried to reach a server or user host
sudo journalctl -k --since '-15min' | grep 'NFT-DROP: TB-06'

# TB-12 : a VPN client tried to reach the management zone
sudo journalctl -k --since '-15min' | grep 'NFT-DROP: TB-12'

# Anything at all that was dropped, with a per-prefix count — useful as a one-line health read
sudo journalctl -k --since '-1h' | grep -o 'NFT-DROP: [A-Z0-9-]*' | sort | uniq -c | sort -rn
```

單一日誌行的預期形式（前綴之後的確切措辭由核心提供，絕不可憑記憶撰寫——請從主機擷取）：

```text
2026-10-06T02:47:11.482913+08:00 vpnz-nft01 kernel: NFT-DROP: TB-04 IN=ens192 OUT=ens192 MAC=00:50:56:3f:01:0a SRC=10.10.90.21 DST=10.10.30.11 LEN=60 TOS=0x00 PREC=0x00 TTL=63 ID=0 DF PROTO=TCP SPT=44212 DPT=445 WINDOW=64240 RES=0x00 SYN URGP=0
```

**集中化。** 本對組將核心訊息轉送至監控主機，使拒絕記錄在防火牆對組被重建後仍然留存：

```ini
# /etc/rsyslog.d/50-fyp-forward.conf
# Forward everything, but tag the security-relevant facility so it can be routed and alerted on.
# UDP is used because the baseline fixes 514/udp as the transport; the loss window on a
# same-subnet lab link is acceptable and is stated as a limitation.
*.* action(type="omfwd" target="10.10.30.31" port="514" protocol="udp"
           queue.type="LinkedList" queue.size="10000" queue.saveOnShutdown="on"
           action.resumeRetryCount="-1")

# A dedicated rule so nftables drops can be filtered on the receiver without parsing prefixes.
:msg, contains, "NFT-DROP" action(type="omfwd" target="10.10.30.31" port="514" protocol="udp")
```

```bash
sudo systemctl restart rsyslog
systemctl status rsyslog --no-pager | head -4
# On vpnz-mon01, confirm receipt:
sudo tail -5 /var/log/remote/vpnz-nft01.log
logger -t fyp-test 'NFT-DROP: TEST log-path check'
sudo tail -1 /var/log/remote/vpnz-nft01.log
```

**此事如何回饋監控與 AI 線路。** 三個取用者，且每一個都是具體的資料路徑而非願景：

1. **Prometheus/Grafana（`fyp-security` 儀表板）。** 本對組上各有一個 `node_exporter` textfile collector 執行小型指令碼，每 60 秒統計各前綴的 `NFT-DROP:` 出現次數，並將 `fyp_nft_drops_total{prefix="TB-04"} 12` 寫入 `/var/lib/node_exporter/textfile_collector/nft_drops.prom`。Prometheus 抓取 9100 埠（鎖定的 `node_exporter` 1.8.x），儀表板繪製逐規則 ID 的丟棄率，這正是使一次拒絕成為可見趨勢、而非埋沒於檔案中某一行的方法。
2. **Loki。** 轉送至 `vpnz-mon01` 的 syslog 由 Loki（3.x）收取，並將前綴擷取為標籤，因此 Grafana 面板可顯示最近十次 `TB-06` 嘗試及其來源位址。
3. **AI 線路的唯讀工具介面。** `vpnz-ai01` 上的 `interface-health` 與 `alert-triage` 技能只從本裝置讀取兩樣東西：介面計數器的 SNMPv3 輪詢，以及符合 `NFT-DROP` 的 journald/rsyslog 行。代理程式**沒有任何能觸及裝置的 shell**，也沒有寫入路徑；四工具介面就是其全部能力。任何代理程式就防火牆日誌所產出的內容，都必須附帶 `SVCP-` 告誡：代理程式能描述拒絕趨勢，但無法確認意圖，且它草擬的每一份提案都標示為*已提案——須經人工核准*。

#### 8.5.6 驗證

**步驟 1 — 規則集就是預期的內容。**

```bash
sudo nft list ruleset | head -60
sudo nft list tables
# Expected: table inet fyp_filter
sudo nft -a list table inet fyp_filter | grep -c '^'      # rule count, recorded as a build fact
```

開頭數行的預期形狀：

```text
table inet fyp_filter {
	set svc_web {
		type inet_service
		elements = { 80, 443 }
	}
	set mgmt4 {
		type ipv4_addr
		flags interval
		comment "Z-MGMT : the highest restricted zone"
		elements = { 10.10.20.0/24, ... }
```

**步驟 2 — 政策為丟棄。** 一份存在但政策為寬鬆的規則集，正是本測試存在的目的所要捕捉的失效：

```bash
sudo nft list chain inet fyp_filter input   | grep policy
sudo nft list chain inet fyp_filter forward | grep policy
# Expected:
#   type filter hook input priority filter; policy drop;
#   type filter hook forward priority filter; policy drop;
```

**步驟 3 — conntrack 表反映真實流量。**

```bash
sudo conntrack -L | head -20
sudo conntrack -C                       # current tracked flow count
sudo conntrack -L -p udp --dport 443 2>/dev/null | head -5    # WireGuard flows
sudo conntrack -L -p tcp --dport 1194 2>/dev/null | head -5
```

一條經 masquerade 的輸出流量的預期 `conntrack -L` 行（NAT 轉譯在 `src=`/`dst=` 及 `reply` 欄位中可見）：

```text
tcp      6 431997 ESTABLISHED src=10.10.30.42 dst=203.0.113.9 sport=44120 dport=443 src=10.10.50.11 dst=203.0.113.9 sport=44120 dport=443 [ASSURED] mark=0 use=1
```

請注意 masquerade 的證據：`src` 已從內部的 `10.10.30.42` 改寫為防火牆自身的 `10.10.50.11`。

**步驟 4 — 從外部進行的 DNAT 測試。** 在單一 Hypervisor 主機內模擬外部用戶端最穩健的方式，是使用**搭配 veth 對組的 network namespace**，因為它提供真正獨立的 IP 堆疊與真正獨立的 conntrack 視圖。替代做法是在 `VNET-WAN` 上放置第二部 VM，那更簡單但會消耗 RAM。

```bash
# On vpnz-lnxra01 (or any guest with the iproute2 suite), create an external "client" namespace.
sudo ip netns add ext
sudo ip link add veth-ext type veth peer name veth-ext-br
sudo ip link set veth-ext-br netns ext
# Both ends are in the WAN-emulation subnet space used by the design:
sudo ip addr add 198.51.100.60/29 dev veth-ext
sudo ip link set veth-ext up
sudo ip -n ext addr add 198.51.100.61/29 dev veth-ext-br
sudo ip -n ext link set veth-ext-br up
sudo ip -n ext link set lo up
# Direct the namespace's traffic for the published addresses at the real firewall.
sudo ip -n ext route add 198.51.100.0/29 dev veth-ext-br
sudo ip -n ext route add default via 198.51.100.1

# Test 1: the published portal. Expect a TLS handshake through the DNAT.
sudo ip netns exec ext curl -skI --max-time 5 https://198.51.100.2/healthz
```

預期結果：

```text
HTTP/2 200
server: nginx
strict-transport-security: max-age=31536000; includeSubDomains
```

```bash
# Test 2: prove the DNAT translation, not just the successful response.
sudo conntrack -L -d 10.10.90.10 2>/dev/null | head -5
# Expected: a flow whose DST was rewritten to the DMZ VIP.
#   tcp 6 431997 ESTABLISHED src=198.51.100.61 dst=10.10.90.10 sport=40122 dport=443 ...
# On vpnz-nft01, the dnat chain counters also move:
sudo nft -a list chain inet fyp_filter nat_prerouting | grep -A1 '198.51.100.2'
```

```bash
# Test 3: an UNPUBLISHED port from outside must be dropped, not merely refused.
sudo ip netns exec ext curl -sk --max-time 5 https://198.51.100.2:8443/ ; echo "exit=$?"
# Expected: exit=28 (timeout) — a timeout, not an immediate connection refused, because the
# packet was dropped rather than answered. The distinction matters: a RST would prove the
# packet reached a listener.
sudo journalctl -k --since '-2min' | grep 'NFT-DROP: TB-05\|NFT-DROP: FORWARD'
```

**步驟 5 — 一項必須被丟棄的禁止路徑測試。** 兩個方向，各帶可辨識的前綴。兩者都是「針對小組自有實驗室網段的自我導向測試」，這是本專案運作所依循的倫理約束，且兩者都必須事先記錄。

```bash
# TB-04 : DMZ must never initiate toward the internal server zone.
# Run from a DMZ host (vpnz-dmzwp01) toward a server host (vpnz-dc01), on SMB.
ssh fypadmin@10.10.90.25 'timeout 4 bash -c "</dev/tcp/10.10.30.11/445" ; echo "exit=$?"'
# Expected: exit=124 (timeout) and no session. Then on vpnz-nft01:
sudo journalctl -k --since '-2min' | grep 'NFT-DROP: TB-04'
```

預期的日誌行：

```text
vpnz-nft01 kernel: NFT-DROP: TB-04 IN=ens192 OUT=ens192 SRC=10.10.90.25 DST=10.10.30.11 PROTO=TCP SPT=53104 DPT=445 SYN
```

```bash
# TB-06 : the Internet must never reach a server. Same namespace, aimed at the DC.
sudo ip netns exec ext curl -sk --max-time 5 https://10.10.30.11/ ; echo "exit=$?"
# Expected: exit=28, and on vpnz-nft01:
sudo journalctl -k --since '-2min' | grep 'NFT-DROP: TB-06'
```

```bash
# TB-12 : a VPN client must never reach the management zone.
# From a connected OpenVPN client with an address in 10.10.202.0/24:
ping -c 3 -W 2 10.20.20.10 ; echo "exit=$?"
# Expected: 100% packet loss. And on vpnz-nft01:
sudo journalctl -k --since '-2min' | grep 'NFT-DROP: TB-12'
```

```bash
# The definitive proof that the drop was policy and not a routing accident: an allowed flow
# from the same source to a permitted destination must succeed at the same moment.
sudo ip netns exec ext curl -skI --max-time 5 https://198.51.100.2/healthz   # 200
sudo ip netns exec ext curl -sk  --max-time 5 https://10.10.30.11/           # timeout
# Same source, same device, one permitted and one denied: that pair of results is the evidence.
```

**步驟 6 — 負載下的計數器與速率限制行為。**

```bash
# Confirm that rules are actually being matched (a rule with counters that never move is dead config).
sudo nft -a list table inet fyp_filter | grep -E 'packets [0-9]+' | head -20

# Flood a denied path and confirm the DROP counter and the log line both appear.
sudo ip netns exec ext bash -c 'for i in $(seq 1 50); do timeout 1 bash -c "</dev/tcp/10.10.30.11/445" 2>/dev/null; done'
sudo nft -a list chain inet fyp_filter forward | grep 'TB-06'
sudo journalctl -k --since '-5min' | grep -c 'NFT-DROP: TB-06'
```

值得標示的 `[假設]`：樸素洪水攻擊所產生的日誌量很大，而核心自身的 `printk` 速率限制（`net.core.message_cost`、`kernel.printk_ratelimit`）會**在** nftables 自身的 `limit rate` 生效**之前**悄悄抑制部分行。可觀察到的結果是：`NFT-DROP:` 行的數量**低於**計數器所顯示的丟棄封包數。那是預期的核心行為，並非規則損壞；報告應並列呈現這兩個數字並解釋其差距，而非把日誌行數當作封包數呈現。

**步驟 7 — 回退控制項。** 藉由刻意破壞 input chain 並從 Hypervisor 主控台復原，證明鎖死復原機制確實有效：

```bash
# On vpnz-nft01, with the recovery procedure already written down and the console open:
sudo nft add rule inet fyp_filter input iifname "ens192" ip saddr 10.10.50.1 drop
# The SSH session from the core side should now be at risk; from a second session:
sudo nft list chain inet fyp_filter input | tail -3
# Recover via the hypervisor console (not SSH):
#   sudo nft -f /etc/nftables.d/rollback-<stamp>.nft
sudo nft list chain inet fyp_filter input | tail -3   # the injected rule is gone
```

#### 8.5.7 常見錯誤

以下是本設計中實際耗費大量時間的陷阱，大致依發生頻率排序。

| # | 錯誤 | 症狀 | 發生原因 | 正確做法 |
|---|---|---|---|---|
| M-01 | 缺少 `ct state established,related accept`（或將它放在與政策相關的規則之後） | 第一個封包一切正常，然後即失效；回程被封包丟棄；「防火牆隨機破壞網頁瀏覽」 | `policy drop` 同樣適用於*回程*方向，因此若無具狀態捷徑，每個回覆都會被丟棄 | 將具狀態 accept 置於 `input` 與 `forward` 兩者中的**最前面**，在任何允許或拒絕之前 |
| M-02 | 使用 `iif` 而非 `iifname`（或 `oif` 而非 `oifname`） | 在 VM 上 `nft -c -f` 失敗並出現 `Could not process rule: No such file or directory`，或該規則默默永不匹配 | `iif`/`oif` 需要**介面索引**，它不會跨重新開機保持穩定，且在 hosts 之間也不同；`iifname`/`oifname` 則匹配名稱 | 一律使用 `iifname`/`oifname`，並搭配以 `ip -br link` 讀取到的真實裝置名稱 |
| M-03 | 規則順序：廣泛的允許置於特定拒絕*之前* | 被禁止的流量成功通過，且永遠不出現 `NFT-DROP:` 行 | nftables 由 chain 頂端向下評估，第一個終止性判定勝出；`accept` 在 chain 內即為終止 | 將所有 DENY 規則置於允許規則**之前**，然後才是全捕捉丟棄。上文的規則集刻意如此，並在註解中說明 |
| M-04 | DNAT 規則置於 `forward` 而非 `nat prerouting` | `nft -c -f` 回傳語法/位置錯誤，或 DNAT 被默默忽略 | DNAT 是 NAT hook 的操作，無法在 filter chain 中表達 | DNAT 屬於 `type nat hook prerouting priority dstnat` |
| M-05 | 在 `prerouting` 中使用 `masquerade`，或在 `postrouting` 中使用 `dnat` | 規則在載入時被拒絕，或轉譯套用於錯誤方向 | srcnat 與 dstnat 是不同的 hook，可取得的資訊也不同 | `dnat` → `nat prerouting`；`masquerade` → `nat postrouting` |
| M-06 | 編輯 `/etc/nftables.d/` 下的片段，並以 `nft -f` 載入**該片段** | 規則集有一半消失；其他 chain 不見 | 載入含有 `flush ruleset`（或重新定義表）的檔案，會取代整個表的狀態 | 一律套用最上層的 `/etc/nftables.conf`；片段是 include，不是單元 |
| M-07 | 將 `flush ruleset` 留在片段中，而非只留在最上層檔案 | 套用該片段會抹除主機的其他規則；容器或 libvirt 橋接規則消失 | `flush ruleset` 是全域的，並非僅限於 `inet fyp_filter` | `flush ruleset` 只出現**一次**，位於 `/etc/nftables.conf` 中、在宣告該表之前 |
| M-08 | 忘記 `net.ipv4.ip_forward = 1` | 規則集載入、計數器變動，但什麼都沒有被轉送；對本機位址 `ping` 可用，經由該主機 `ping` 則不可 | Linux 預設不轉送 | 僅在路由器主機上的 `/etc/sysctl.d/99-fyp-hardening.conf` 中設定，並以 `sysctl net.ipv4.ip_forward` 驗證 |
| M-09 | 在多網段主機上搭配非對稱路由使用 `rp_filter = 1` | 僅在某一個介面上間歇性丟棄；`log_martians` 塞滿看似合法的位址 | 嚴格的逆向路徑過濾會丟棄來源無法經由抵達介面可達的封包，而這在某些非對稱設計中確實成立 | 本設計保留嚴格 rp_filter（本對組為對稱），而若日後引入非對稱路由，則使用 `rp_filter = 2`（寬鬆），而非 0 |
| M-10 | 介面名稱依教學文硬式編碼（`eth0`、`ens33`、`enp0s3`） | 規則載入但永不匹配；從未如預期般允許或拒絕任何流量 | 介面命名不會跨映像檔與 Hypervisor 保持穩定 | 在主機上以 `ip -br link` 讀取真實名稱並用於規則集，然後記錄於 runbook |
| M-11 | 日誌規則未設速率限制 | 拒絕洪水塞滿 `/var/log`，並在小型 VM 上使檔案系統達到 100 %、服務停止 | 每個封包都會產生一行日誌 | 為每個前綴使用不同的 `limit rate`（如 `log_dropped` chain 所做），並就丟棄計數器告警，而非依賴日誌量 |
| M-12 | 僅從主機本身測試 | 規則集「有效」，但沒有任何用戶端能通過封包 | 本機產生的流量走 `output` chain，而本設計將其維持寬鬆，因此永不會實際行使 `forward` 或 DNAT 路徑 | 一律從 namespace 或對等 VM 測試穿越流量 |
| M-13 | 編輯之後假設 `nftables.service` 單元已載入該檔案 | 重新開機後新規則缺失，而 `nft -f` 之後卻存在 | 編輯檔案不會重新載入任何東西；且若該單元未啟用，開機時什麼都不會載入 | `sudo nft -c -f`，然後 `sudo nft -f`，然後 `systemctl enable --now nftables`，最後**重新開機並驗證** |
| M-14 | 本對組的兩部節點執行不同規則集 | 容錯移轉看似「破壞了防火牆」：某些流量在一部節點上可用、另一部不可用 | 僅在其中一部節點上手動編輯 | 以同一範本（`templates/nftables.conf.j2`）搭配各節點自身的主機變數產生兩者，並將兩部節點上渲染輸出的差異比對列為檢查清單項目 |
| M-15 | 說謊的 `comment` 字串 | 審閱者相信了一條已不再符合規則的註解 | 註解不受任何機制驗證 | 將註解視為文件，每當規則變更時都必須重新閱讀；§8.5.2 中的規則編號註解正是為了讓審閱者能追溯規則 → 信任邊界列 → 測試案例 |

### 8.6 OpenVPN

#### 8.6.1 設計

OpenVPN 是本專案中**第二套、獨立實作的遠端存取技術**，它執行於 `vpnz-lnxra01`（10.10.30.42，VLAN 30 `SRV-HQ-1`，`Z-SERVER`）。其目的刻意是比較性的：`vpnz-rras01` 上的 RRAS 搭配 IKEv2 示範 Microsoft 的、以憑證及 NPS 授權的路線，而 OpenVPN 則以完全不同的 PKI、不同的傳輸、不同的用戶端及不同的管理模型示範同樣的業務成果。比較章節屬於 Microsoft 線路，此處僅**交叉引用，不予重複**：IKEv2 伺服器、NPS/RADIUS 政策及 Windows 自動連線 VPN 設定檔記載於 Microsoft 伺服器網路章節；本小節僅記載 Linux 一側。

**OpenVPN 是本線路中 WSOS 明確點名的兩項技術之一。** 該逐字條文為 `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.`（範疇 3，第 6 行）。OpenVPN 無須任何銜接或推論，這正是報告可直接引用它的原因——對比之下，WireGuard 僅依靠該 `etc.`。

| 設計要素 | 值 | 來源 |
|---|---|---|
| 伺服器主機 | `vpnz-lnxra01`、`10.10.30.42` | 靜態主機位址表 |
| 服務埠與傳輸 | UDP 1194 | 埠與通訊協定對照表，`P-17` |
| 可達性 | 已發佈位址 `198.51.100.5`，經兩次轉譯：ASA 執行第一次靜態 PAT 至 nftables VIP `10.10.50.10`，而 nftables 對組在該 VIP 上 DNAT 至 `10.10.30.42:1194`（Rev 1.1 裁定 C-20）；內部名稱 `vpn.vertexpeak.fyp.lab` 為分裂視域而解析至 `10.10.50.10` | 公眾定址表；DNS 記錄計畫 |
| 通道網路 | `10.10.202.0/24` | VPN 與通道定址 |
| 用戶端位址集區 | `10.10.202.10 – 10.10.202.120` | VPN 與通道定址 |
| PKI | 同一主機上的 Easy-RSA 3.1.x；CA 與私密金鑰位於 `/etc/openvpn/easy-rsa/pki`（權限 `0700`，**絕不**提交至 Git） | 版本鎖定清單；組態路徑 |
| 伺服器憑證 | 由 Easy-RSA 簽發，`CN=server-vpnz-lnxra01` | 憑證主體與 SAN |
| 用戶端憑證 | 由 Easy-RSA 簽發，`CN=client-{staffid}` | 憑證主體與 SAN |
| 授權 | Windows 群組 `GG-VPN-Users`；`GG-VPN-ProfServices` 另可取得至平台層的 RDP。強制執行由 nftables 的 `vpn4` 集合加上憑證負責；OpenVPN **不**主張具備完整的 LDAP/NPS 授權路徑 | 群組設計；信任邊界 TB-11 |
| 伺服器組態路徑 | `/etc/openvpn/server/server.conf` | 組態路徑 |
| 用戶端與 CCD 路徑 | `/etc/openvpn/client/`、`/etc/openvpn/ccd/`（權限 `0700`） | 組態路徑 |

**分割通道與全通道——此決定，且是刻意的決定。** 就 OpenVPN 而言，本設計採用**帶明確路由清單的分割通道**：僅推送公司前綴，而一般網際網路流量繼續使用用戶端自身的連線。原因是該分割清單恰好就是用戶端*被授權*可達的子網路集合，因此所推送的路由表與防火牆政策是同一物件的兩次表達，這使其可稽核。這與 Microsoft IKEv2 服務不同；在該服務上，基準**停用**分割通道，因為盡職調查要求為經常出差的銷售人員要求一條可稽核的路徑。兩項決定都是刻意的，兩者都必須說明；報告不得將其一呈現為對另一者的更正。此比較正是這兩套實作存在的目的所要產出的實質發現之一：*全通道以頻寬與延遲為代價，換取集中式的出口控制與歸因；分割通道以失去對用戶端其他流量的可見性為代價，換取明確、最小的授權集合。*

推送至 OpenVPN 用戶端的路由：

| 前綴 | 推送原因 | 對應政策 |
|---|---|---|
| `10.10.30.0/24` | 伺服器 VLAN：DNS、目錄、檔案服務、監控主機 | TB-11 |
| `10.10.0.0/16` | 總部 LAN 空間整體（VLAN 10/40/45/80） | TB-11 |
| `10.10.90.0/24` | DMZ，因為專業服務群組需要已發佈的 portal 進行整合測試 | TB-11 及 TB-13（DMZ 不得反向發起） |

**不推送：** `10.20.0.0/16`（管理）、`10.70.0.0/16`（隔離實驗室）、`10.10.80.0/24`（iSCSI 儲存），以及 `0.0.0.0/0`（絕不——未設定全通道）。這些「不存在」與「存在」同樣是設計的一部分，而 §8.6.6 的驗證對兩者都進行測試。

#### 8.6.2 以 Easy-RSA 建立 PKI

Easy-RSA 3.1.x 安裝自 Ubuntu 24.04 檔案庫（鎖定清單記錄其在 Noble 中的存在已獲驗證；來自 tarball 的 3.0.8 版是已記錄的備用方案）。

```bash
sudo apt-get install -y easy-rsa openvpn
dpkg -s easy-rsa | grep -E '^Version|^Status'
ls -l /usr/share/easy-rsa/
# Expected: easyrsa, openssl-easyrsa.cnf, x509-types/  (the packaged CA toolkit)
```

**PKI 目錄佈局**——建立於 `/etc/openvpn/easy-rsa/` 之下（權限 `0700`、`root:root`），這是基準所固定的路徑。以下佈局是 Easy-RSA 3 自身的佈局，必須重現而非自行發揮：

```text
/etc/openvpn/easy-rsa/                 0700 root:root
├── vars                               the project's settings file (see below); mode 0600
├── easyrsa                            copied from /usr/share/easy-rsa/easyrsa
├── openssl-easyrsa.cnf                copied from the package
├── x509-types/                        copied from the package (ca, server, client, crl, ...)
└── pki/                               0700 root:root — THE PRIVATE MATERIAL
    ├── ca.crt                         the CA certificate — published to clients
    ├── private/
    │   ├── ca.key                     0600 — the CA private key. NEVER leaves this host
    │   ├── server-vpnz-lnxra01.key
    │   ├── client-alice.key
    │   └── ...
    ├── issued/
    │   ├── server-vpnz-lnxra01.crt
    │   └── client-alice.crt
    ├── reqs/                          certificate signing requests
    ├── crl.pem                        the certificate revocation list — copied to the server dir
    ├── index.txt                      the CA database (which certificate is which, and revoked)
    └── serial
```

`vars` 組態。基準的決定是 **2048 位元金鑰，時間允許則用 4096 位元**。本設計採用 2048 位元預設值並附明確理由，而 4096 位元變體則記錄為替代方案。

```bash
# /etc/openvpn/easy-rsa/vars     (mode 0600). Sourced by easyrsa at run time.
set_var EASYRSA_ALGO            "rsa"        # alternative: "ec" for ECDSA — see the note below
set_var EASYRSA_KEY_SIZE        2048         # 4096 if the group has the time; see the trade-off note
set_var EASYRSA_DIGEST          "sha512"     # SHA-256 is the floor; SHA-512 is used here
set_var EASYRSA_CA_EXPIRE       3650         # 10 years — the issuing-CA lifetime in the baseline's PKI
set_var EASYRSA_CERT_EXPIRE     825          # ~27 months for client certificates: they are rarely hardware-backed
set_var EASYRSA_CRL_DAYS        180          # CRL validity; must be regenerated well before it lapses
set_var EASYRSA_REQ_COUNTRY     "HK"
set_var EASYRSA_REQ_PROVINCE    "Hong Kong"
set_var EASYRSA_REQ_CITY        "Sha Tin"
set_var EASYRSA_REQ_ORG         "Vertex Peak Financial Technologies Limited"
set_var EASYRSA_REQ_EMAIL       "netops@vertexpeak.fyp.lab"
set_var EASYRSA_REQ_OU          "Network Engineering Workstream"
set_var EASYRSA_NS_SUPPORT      "no"         # modern CN-only naming; no Netscape extensions
set_var EASYRSA_DN              "cn_only"    # subject is CN only, which is what OpenVPN actually matches on
```

**必須出現在報告中的取捨說明。** 選擇 2048 位元 RSA 金鑰而非 4096 位元，是因為該通道是單一主機上的實驗室示範，握手成本並非限制條件；在沒有附帶威脅模型的 2-vCPU VM 上，4096 位元會為每一次通道握手增加 CPU 成本，因為這些憑證僅供實驗室使用，且該 CA 並未發佈。2048 位元的選擇必須呈現為**一項刻意、已記錄的規模決策，並附明述的限制**，而非可用的最佳安全性。值得記錄的誠實替代配對是 ECDSA `secp384r1`（`EASYRSA_ALGO ec` + `EASYRSA_CURVE secp384r1`），它以更快的握手提供更強的基礎演算法，且 Easy-RSA 指令語法完全相同——它未成為主要選擇的唯一原因，是必須先確認鎖定的 Ubuntu OpenVPN 用戶端套件與內建 Windows 用戶端都接受該套件，而該確認是小組尚未完成的工作。

**依序建立 PKI，並附預期輸出。**

```bash
cd /etc/openvpn/easy-rsa

# 1. Initialise the directory structure. Easy-RSA refuses to overwrite an existing PKI,
#    which is the correct safety behaviour.
sudo ./easyrsa init-pki
# Expected: "init-pki complete; you may now create a CA or requests."
#           "Your newly created PKI dir is: /etc/openvpn/easy-rsa/pki"

# 2. Build the CA. This is a self-signed root and it is the trust anchor for the whole tunnel PKI.
sudo ./easyrsa --batch build-ca nopass
# Expected: "CA creation complete and you may now import and sign cert requests."
# 'nopass' is used because the server must be able to start unattended.
# [ASSUMPTION] this deliberately leaves ca.key unencrypted on disk. The mitigation is the 0700
# directory and the fact that the host is a lab VM; if the group prefers a passphrase-protected
# CA key the server must be given the passphrase via a systemd credential, which is more work.

# 3. Server certificate, with the CN fixed by the certificate-subject table.
sudo ./easyrsa --batch build-server-full server-vpnz-lnxra01 nopass
# Expected: "Note: using Easy-RSA configuration from: /etc/openvpn/easy-rsa/vars"
#           "Certificate created at: /etc/openvpn/easy-rsa/pki/issued/server-vpnz-lnxra01.crt"

# 4. One client certificate per named user. The CN is what the firewall and the CCD key on.
sudo ./easyrsa --batch build-client-full client-alice nopass
sudo ./easyrsa --batch build-client-full client-bob   nopass
sudo ./easyrsa --batch build-client-full client-carol nopass
sudo ./easyrsa --batch build-client-full client-revocation-test nopass

# 5. The CRL. REQUIRED from day one, not only when a revocation happens: OpenVPN's
#    'crl-verify' directive cannot start without a CRL file present.
sudo ./easyrsa gen-crl
# Expected: "An updated CRL has been created."
#           "CRL file: /etc/openvpn/easy-rsa/pki/crl.pem"

# 6. Diffie-Hellman parameters.
#    DECISION: ECDH is used instead of classic DH, and the reason is concrete rather than stylistic.
#    'dh none' with the ECDHE TLS 1.3/1.2 suites gives forward secrecy with no dh.pem file at all,
#    which removes a large file, avoids a multi-minute 'gen-dh' run on a 2-vCPU VM, and cannot be
#    weakened by a low-quality DH parameter set. The alternative — classic DH — is retained below
#    as the fallback because it is what most tutorials show.
sudo ./easyrsa gen-dh          # ONLY if 'dh' is used instead of 'dh none' (see §8.6.3)
```

**關於 `dh none` 與 TLS 1.3 的誠實說明。** `dh none` 之所以有效，正是因為 OpenVPN 與 TLS 1.3 的預設 `tls-cipher`/`tls-ciphersuites` 協商使用 ECDHE 金鑰交換，完全不消耗 `dh` 參數。若小組日後鎖定非 ECDHE 的 TLS 1.2 套件，`dh none` 便無法建立 session，而 `dh.pem` 將成為必需。這正是值得寫下來的相依關係：組態變更與 DH 決定相互耦合，而該耦合很容易被忽略。

在已交付的設計中並未執行 `gen-dh`，但備用指令及其理由已記錄於上，使需要傳統 DH 的讀者不致無所適從。`[假設]`：若使用 `dh.pem`，預期 `gen-dh` 在 2-vCPU 客體上需時數分鐘；請計時並記錄，因為那是一項正當的建置成本資料點。

撤銷，於 §8.6.6 驗證：

```bash
# Revoke a client certificate and republish the CRL. Both steps are required:
# 'revoke' marks the certificate in index.txt, 'gen-crl' produces the new crl.pem.
sudo ./easyrsa --batch revoke client-revocation-test
sudo ./easyrsa gen-crl
sudo chmod 0644 /etc/openvpn/easy-rsa/pki/crl.pem
sudo cp /etc/openvpn/easy-rsa/pki/crl.pem /etc/openvpn/server/crl.pem
sudo apt-get install -y tlsdate >/dev/null 2>&1 || true   # not required; recorded only to show the intent
```

必須在已建置主機上檢查的 `[假設]`：某些 OpenVPN 封裝要求 CRL **可由降權後的使用者**讀取（因為伺服器在 `user nobody` 生效之後才讀取它），這就是上述權限在 `/etc/openvpn/server/` 下的複本上放寬為 `0644` 的原因。若伺服器記錄 `Cannot open CRL file`，此權限就是首先要檢查的地方——而修正方式是更改該複本的權限，絕不是更改 PKI 目錄本身的 `0700` 權限。

#### 8.6.3 伺服器組態

```ini
# /etc/openvpn/server/server.conf        —   vpnz-lnxra01
# OpenVPN 2.6.x (Ubuntu 24.04 package). Verify the running version with: openvpn --version
# Start with:  sudo systemctl restart openvpn-server@server
# Follow with: sudo journalctl -u openvpn-server@server -f
#
# NOTE ON THE UNIT NAME: OpenVPN 2.6 on Ubuntu uses the instance template
# 'openvpn-server@<name>.service', and the instance name is the basename of the .conf file
# found in /etc/openvpn/server/. With the file named 'server.conf' the unit name is
# 'openvpn-server@server'. [ASSUMPTION] confirmed against the installed package on the build
# host, because the older 'openvpn@server' unit name is what most documentation still shows.

##############################################
# NETWORK
##############################################
port            1194
proto           udp
dev             tun
dev-type        tun
topology        subnet          # REQUIRED and must match on both ends; 'net30' is the legacy default
                                # and mixing the two produces a tunnel that routes nothing.

# The tunnel network is fixed by the design: 10.10.202.0/24
server          10.10.202.0 255.255.255.0

# The client pool. Addresses outside it are reserved (the server takes .1, and .121-.254 are
# deliberately left unallocated so that a future second service can be assigned a contiguous range).
ifconfig-pool   10.10.202.10 10.10.202.120

# Per-client configuration directory. The filename must equal the certificate CN.
client-config-dir /etc/openvpn/ccd

# Do NOT route between clients. Two staff laptops have no reason to exchange traffic, and
# 'client-to-client' would bypass the nftables forward chain entirely, creating a path that no
# firewall rule and no log can see. This is a security decision, not a default.
;client-to-client

# Duplicate certificate use is refused: each certificate may have exactly one live session.
;duplicate-cn

# Remove the route to the tunnel network when the client disconnects, cleanly.
;route-nopull

##############################################
# PKI AND TLS
##############################################
ca              /etc/openvpn/server/ca.crt
cert            /etc/openvpn/server/server-vpnz-lnxra01.crt
key             /etc/openvpn/server/server-vpnz-lnxra01.key
dh              none            # ECDHE only — see the discussion in §8.6.2. Fallback: 'dh /etc/openvpn/server/dh.pem'

# TLS control-channel protection.
# tls-crypt is PREFERRED and is what this design uses: it encrypts AND authenticates the control
# channel, so an observer cannot even see the handshake, and it makes the server unresponsive to
# unauthenticated probes. It replaces BOTH tls-auth and a separate --auth digest on the control channel.
tls-crypt       /etc/openvpn/server/tls-crypt.key
# The fallback, if a distributed client cannot be updated to carry a tls-crypt key, is:
#   tls-auth    /etc/openvpn/server/ta.key 0
# tls-auth only *signs* the control channel with an HMAC; the handshake packets remain visible.
# Argument 0 = server; clients must use 1. Getting that direction backwards makes the tunnel fail
# with 'TLS Error: cannot locate HMAC in incoming packet'.

# Protocol floor and cipher suites for the control channel.
tls-version-min 1.2
tls-cipher      TLS-ECDHE-RSA-WITH-AES-256-GCM-SHA384:TLS-ECDHE-ECDSA-WITH-AES-256-GCM-SHA384
tls-ciphersuites TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256

# Data channel. OpenVPN 2.6 prefers the 'data-ciphers' name; 'cipher' is deprecated but is
# still accepted, so BOTH are set to remove ambiguity across client versions.
data-ciphers    AES-256-GCM:AES-128-GCM:CHACHA20-POLY1305
data-ciphers-fallback AES-256-GCM
cipher          AES-256-GCM
auth            SHA512

# Certificate verification.
# remote-cert-tls server is set on CLIENTS (see §8.6.4); on the server the equivalent control is
# that every client must present a certificate signed by this CA.
verify-client-cert require

# Revocation. Mandatory: a lost laptop's certificate must be able to be cancelled.
crl-verify      /etc/openvpn/server/crl.pem

# Refuse a client certificate that is not actually a client certificate.
# NOTE: 'remote-cert-ku' (key usage) is deliberately NOT set here. It requires a numeric
# key-usage value such as 'remote-cert-ku a0', and writing the directive without a value is a
# configuration error that OpenVPN rejects at start-up. The key-usage check is therefore left to
# the CA's x509-types/client definition, which is where Easy-RSA enforces it at signing time.
# 'username-as-common-name' is also NOT used: it requires a username/password authentication
# method to be configured, and this design authenticates every user by certificate alone, so the
# certificate CN is already the client identity.
verify-x509-name server-vpnz-lnxra01 name

##############################################
# ROUTING AND PUSHED OPTIONS
##############################################
# Keep the pushed options inside the tunnel, but enable the pool and the route list.
push "topology subnet"

# --- the authorised route list: exactly what TB-11 permits, nothing more ---
push "route 10.10.30.0 255.255.255.0"
push "route 10.10.0.0 255.255.0.0"
push "route 10.10.90.0 255.255.255.0"
# NOT pushed and must never be pushed:
#   10.20.0.0/16  management  (TB-12 denies it)
#   10.70.0.0/16  isolated lab (TB-09/TB-10 deny it)
#   10.10.80.0/24 iSCSI storage
#   0.0.0.0/0     full tunnel is NOT used for OpenVPN; see §8.6.1

# --- DNS: the two domain controllers only. No public resolver is ever pushed. ---
push "dhcp-option DNS 10.10.30.11"
push "dhcp-option DNS 10.10.30.12"
push "dhcp-option DOMAIN vertexpeak.fyp.lab"
push "dhcp-option SEARCH fyp.lab"
push "dhcp-option DOMAIN-ROUTE vertexpeak.fyp.lab"
push "dhcp-option DOMAIN-ROUTE fyp.lab"

# A redirect-gateway line would make this a full tunnel. It is deliberately absent.
;push "redirect-gateway def1 bypass-dhcp"

# Keep the session alive across a roaming client's network change.
keepalive       10 60

##############################################
# PRIVILEGES AND HARDENING
##############################################
# Drop privileges immediately after the tunnel device is created and the socket is bound.
# 'nobody'/'nogroup' exist on Ubuntu 24.04 by default.
user            nobody
group           nogroup
persist-key
persist-tun

# Refuse to accept a cipher or digest that the client selects outside the configured sets.
# (Removing 'ncp-disable' is what enables OpenVPN 2.6's Negotiable Crypto Parameters.)
;ncp-disable

# Limit the damage a broken client can do.
max-clients     120         # matches the size of the 10.10.202.10-.120 pool
# [ASSUMPTION] on the exact syntax: 'connect-freq' requires a count PLUS a seconds argument
# (n = number of new connections, s = seconds per minute, and s must divide 60). The form below
# is the documented shape; confirm it against `openvpn --help` on the installed 2.6.x package
# before relying on it, because a malformed directive stops the service from starting.
connect-freq    5 60        # at most 5 new connections per 60 s across ALL clients
;connect-freq-initial 20 60 # the alternative directive for a separate initial-window limit

# Explicitly refuse the legacy, weak options. Each of these is a real misconfiguration seen in
# tutorials: 'comp-lzo' is obsolete and can be used in a compression oracle; 'push comp-lzo' would
# spread it to every client.
;comp-lzo
;push "comp-lzo"
allow-compression no         # OpenVPN 2.6 setting: refuse any compression negotiation

# No scripts, no plugins, no client-side up/down execution.
script-security 2
;plugin
;client-connect
;client-disconnect

##############################################
# LOGGING
##############################################
# 'verb 3' is the right level for normal operation: enough to see the handshake and the assigned
# address, not enough to flood the journal with per-packet noise. 'verb 6' is for diagnosis only.
verb            3
mute            20
status          /var/log/openvpn/status.log 30
status-version  2
log-append      /var/log/openvpn/openvpn.log
```

該檔案中有兩項決定值得明確辯護，因為審閱者一定會問。

**`client-to-client` 已停用。** 啟用它會讓兩部已連線的員工筆記型電腦互相可達，而流量永不會進入 nftables 的 `forward` chain，因為 OpenVPN 會在內部路由該封包。那將產生一條**沒有任何防火牆規則、也沒有任何日誌行**的通訊路徑——正是信任邊界表存在的目的所要防止的那種隱形通道。代價是兩位遠端工作者之間的點對點應用程式將無法經由此通道運作；那是已接受的限制，並已如此記錄。

**`allow-compression no` 已設定，且 `comp-lzo` 不存在。** VPN 中的壓縮是眾所周知的資訊洩漏基礎手法，而 OpenVPN 2.6 正是因此才更改預設值。明確設定該指示詞，意味著此姿態在組態中可見，而非由版本預設值暗示。

#### 8.6.4 用戶端組態與封裝

用戶端範本以非機密檔案的形式保留於儲存庫中，而逐使用者的構件由指令碼產生，使任何步驟都不必手工完成。本設計使用**內嵌憑證**，因為單一 `.ovpn` 檔案在派送與撤銷上遠比一個含五個檔案的目錄容易——也因為該檔案之後可連同一份關於其內容的已記錄警告一併交出。

```ini
# 04-automation/bash/openvpn/client-template.ovpn     (repository file; contains NO key material)
# Per-user .ovpn files are produced from this template by 99-gen-client-ovpn.sh below.
client
dev tun
proto udp
remote 198.51.100.5 1194          # the published VPN front door; DNAT'd to vpnz-lnxra01:1194
resolv-retry infinite
nobind

# Privilege drop on the client side where the platform supports it.
persist-key
persist-tun

# ---- PKI, all inline. The markers below are replaced by the generator script. ----
<ca>
-----BEGIN CERTIFICATE-----
__CA_CERT__
-----END CERTIFICATE-----
</ca>

<cert>
-----BEGIN CERTIFICATE-----
__CLIENT_CERT__
-----END CERTIFICATE-----
</cert>

<key>
-----BEGIN PRIVATE KEY-----
__CLIENT_KEY__
-----END PRIVATE KEY-----
</key>

<tls-crypt>
-----BEGIN OpenVPN Static key V1-----
__TLS_CRYPT_KEY__
-----END OpenVPN Static key V1-----
</tls-crypt>

# ---- verification and hardening on the client side ----
remote-cert-tls server            # REQUIRED: refuse a server that is not a TLS server certificate.
                                  # Without it, a rogue server with any valid client certificate
                                  # signed by the same CA could impersonate the VPN endpoint.
verify-x509-name server-vpnz-lnxra01 name    # pin the exact server CN
tls-version-min 1.2
data-ciphers AES-256-GCM:AES-128-GCM:CHACHA20-POLY1305
auth SHA512
auth-nocache                      # never cache credentials in memory; matters for the password path

# Do not silently accept a redirect pushed by the server: the client's route list is the
# authorised set, and a server-side push must not be able to widen it.
pull-filter ignore "redirect-gateway"
pull-filter ignore "route 0.0.0.0"

# ---- logging (client side) ----
verb 3
;verb 6
mute 20
```

請注意這項刻意的反轉：用戶端上的 `remote-cert-tls server` 是阻止 **rogue server（流氓伺服器）** 攻擊的控制項，而它在伺服器上毫無意義。這是 OpenVPN 用戶端組態中最常被遺漏的一行，也是為什麼單憑一張被竊取的用戶端憑證不足以重新導向使用者的流量。

產生指令碼，即本小節的具體交付項目：

```bash
#!/usr/bin/env bash
# 04-automation/bash/openvpn/99-gen-client-ovpn.sh
# Build one self-contained .ovpn file for a named client from the Easy-RSA PKI.
# Usage: sudo ./99-gen-client-ovpn.sh client-alice
#
# SECURITY: the output file contains a PRIVATE KEY. Write it to an encrypted medium, hand it over
# with a recorded acknowledgement, and never commit it. The repository .gitignore must contain
# '*.ovpn' and 'pki/'.
set -euo pipefail

CLIENT="${1:?usage: $0 client-<staffid>}"
EASYRSA_DIR="/etc/openvpn/easy-rsa"
OUT_DIR="/srv/ovpn-out"                 # 0700, deliberately outside the Git working tree
TEMPLATE="/opt/fyp/templates/client-template.ovpn"
TLS_CRYPT="/etc/openvpn/server/tls-crypt.key"

mkdir -p "${OUT_DIR}" && chmod 0700 "${OUT_DIR}"

# Fail early with a clear message rather than producing a broken file.
for f in "${EASYRSA_DIR}/pki/issued/${CLIENT}.crt" \
         "${EASYRSA_DIR}/pki/private/${CLIENT}.key" \
         "${EASYRSA_DIR}/pki/ca.crt" \
         "${TEMPLATE}" "${TLS_CRYPT}"; do
    [[ -r "$f" ]] || { echo "[!] missing required file: $f" >&2; exit 1; }
done

OUT="${OUT_DIR}/${CLIENT}.ovpn"
cp "${TEMPLATE}" "${OUT}"

# Inline substitution. 'sed' is used with a delimiter that cannot appear in base64 ('|'), and the
# substitution is done from files so that no secret ever reaches the shell's argument list or history.
replace_block() {   # $1 = placeholder, $2 = source file
    local ph="$1" src="$2"
    awk -v ph="${ph}" -v src="${src}" '
        { if (index($0, ph) > 0) { while ((getline line < src) > 0) print line; next } print }
    ' "${OUT}" > "${OUT}.tmp" && mv "${OUT}.tmp" "${OUT}"
}

replace_block "__CA_CERT__"       "${EASYRSA_DIR}/pki/ca.crt"
replace_block "__CLIENT_CERT__"   "${EASYRSA_DIR}/pki/issued/${CLIENT}.crt"
replace_block "__CLIENT_KEY__"    "${EASYRSA_DIR}/pki/private/${CLIENT}.key"
replace_block "__TLS_CRYPT_KEY__" "${TLS_CRYPT}"

chmod 0600 "${OUT}"

echo "[i] generated ${OUT}"
echo "[i] SHA-256 of the file (record this in the handover log):"
sha256sum "${OUT}"
echo "[i] REMINDER: this file is a private key. Revoke with:"
echo "      cd ${EASYRSA_DIR} && ./easyrsa --batch revoke ${CLIENT} && ./easyrsa gen-crl"
```

此做法的兩項誠實限制必須在報告中說明。將私密金鑰內嵌於單一檔案，意味著該檔案是可攜式憑證：持有者即可連線，直到憑證被撤銷**且** CRL 已重新產生並重新載入為止。而內嵌 `tls-crypt` 金鑰則意味著該金鑰現在存在於每個用戶端上——對共享的控制通道秘密而言尚可，但必須理解：它並非逐用戶端的控制。

#### 8.6.5 加固

| 控制項 | 設定 | 它實際防護什麼，及其限制 |
|---|---|---|
| 控制通道加密與認證 | `tls-crypt`（偏好）、`/etc/openvpn/server/tls-crypt.key` | 加密並認證整個控制通道。觀察者無法看見握手、無法依封包模式指紋辨識該 VPN，且**未經認證的探測完全得不到回應**——伺服器不是一個 TLS 橫幅。這嚴格強於 `tls-auth` |
| 備用方案 | 伺服器上 `tls-auth ta.key 0`，用戶端上 `1` | 為控制封包加入 HMAC，使偽造或重播的封包被拒絕，但握手仍然**可見**。僅在用戶端無法更新時使用；方向參數（`0`/`1`）必須相符，否則通道失敗並出現 `TLS Error: cannot locate HMAC in incoming packet` |
| 控制通道套件 | `tls-version-min 1.2` + 明確的 `tls-cipher`/`tls-ciphersuites` | 排除具有已知弱點的歷史 CBC 套件，並在可用處強制使用 AEAD 套件 |
| 資料通道加密 | `data-ciphers AES-256-GCM:...` 搭配 `data-ciphers-fallback AES-256-GCM` | AES-GCM 是認證加密：以單一基礎演算法同時提供機密性與完整性。`data-ciphers` 明確設定，使此姿態不依賴 OpenVPN 的版本預設值 |
| 控制通道摘要 | `auth SHA512` | 適用於以 HMAC 為基礎的控制路徑；SHA-1 被拒絕 |
| 壓縮 | `allow-compression no`，不使用 `comp-lzo` | 移除壓縮預言機類攻擊。代價是文字密集流量的頻寬增加，而在實驗室通道上這無關緊要 |
| 自用戶端一側確認伺服器身分 | `remote-cert-tls server` + `verify-x509-name server-vpnz-lnxra01 name` | 防止 rogue server 呈現由同一 CA 簽發、但實為*用戶端*憑證的憑證。沒有這一行，單靠 CA 並不足夠 |
| 憑證要求 | `verify-client-cert require` | 未呈現憑證的用戶端在任何使用者層決定之前即被拒絕 |
| 撤銷 | `crl-verify /etc/openvpn/server/crl.pem` + `easyrsa gen-crl` | **取消遺失用戶端的唯一方法。** 在運作上也是最弱的一環，見下文 |
| 防止憑證重複使用 | **不**設定 `duplicate-cn` | 單一憑證無法由兩個同時 session 使用 |
| 降權 | `user nobody` / `group nogroup`、`persist-key`、`persist-tun` | OpenVPN 行程中的記憶體安全漏洞不會讓攻擊者取得 root。這是該檔案中價值最高的一行加固設定 |
| 連線洪水 | `connect-freq 5 60`、`max-clients 120` | 限制連線洪水嘗試造成的損害，並避免集區被耗盡 |
| 不使用用戶端指令碼 | 不使用 `client-connect`/`client-disconnect`，`script-security 2` | 移除一整個遠端程式碼執行面 |
| CCD | `/etc/openvpn/ccd/` 權限 `0700`，以憑證 CN 為索引 | 逐用戶端覆寫，例如將 `client-carol` 固定至某一位址，使防火牆規則能指名她 |

**已遺失但未撤銷的用戶端憑證——必須明說的風險。** 整個 PKI 設計歸結為一項運作事實：**用戶端憑證是一種壽命很長的不記名憑證。** 若筆記型電腦遺失、被竊，或只是在合約結束時未歸還，該憑證仍持續有效，直到 (a) CRL 重新產生且伺服器重新載入它，或 (b) 憑證自身的到期日過去。本設計以三層措施緩解此事，且必須對殘餘風險誠實：

1. `crl-verify` 自第一天即啟用，因此撤銷是一項受支援的作業，而非需要重新設計。
2. 執行一次已記錄的撤銷演練作為證據：撤銷 `client-revocation-test`、執行 `gen-crl`、伺服器重新載入，並展示該已撤銷用戶端失敗——且**事前**與**事後**的連線嘗試都要擷取。
3. 用戶端憑證於 825 天後到期而非永不到期，這即使從未執行撤銷也能界定曝露窗口。

必須寫下來的殘餘風險：在筆記型電腦遺失到撤銷完成之間（撤銷需要有人察覺、取得權限並執行兩道指令），該憑證仍可使用。CRL 自身的 180 天有效期另加一項要求——未重新整理的 CRL 會到期，而視組態而定，伺服器屆時可能拒絕**所有**用戶端，這是個令人印象深刻且已列於 §8.12 的失效模式。正確的運作控制項是一項排程工作，在有效期內充分提前重新產生 CRL 並重新載入服務，且此事必須出現在運作日誌中。

#### 8.6.6 驗證

**步驟 1 — 以詳細程度啟動伺服器並讀取日誌。** 對執行中的服務使用 `--verb 3` 是正常運作；診斷執行則在備用埠上以前景方式呼叫，以免干擾線上服務：

```bash
# Diagnostic foreground run (does not conflict with the service if a different port is used):
sudo openvpn --config /etc/openvpn/server/server.conf --verb 3 --dev tun9 --port 11940
# Expected startup lines:
#   Note: --dev tun9 is a non-standard device; use it only for this test
#   OpenVPN 2.6.9 x86_64-pc-linux-gnu [SSL (OpenSSL)] [LZO] [LZ4] [EPOLL] [PKCS11] [MH/PKTINFO] [AEAD]
#   library versions: OpenSSL 3.0.x, LZO 2.10
#   TUN/TAP device tun9 opened
#   /sbin/ip link set dev tun9 up mtu 1500
#   /sbin/ip addr add dev tun9 10.10.202.1/24 broadcast 10.10.202.255
#   Could not determine IPv4/IPv6 protocol. Using AF_INET
#   UDPv4 link local (bound): [AF_INET][undef]:11940
#   Initialization Sequence Completed
```

然後停止該前景執行（`Ctrl-C`），並驗證**真正的**服務，那才是真正要緊的：

```bash
sudo systemctl restart openvpn-server@server
sudo systemctl status openvpn-server@server --no-pager | head -12
sudo journalctl -u openvpn-server@server -n 30 --no-pager
```

預期的健康狀態：

```text
● openvpn-server@server.service - OpenVPN service for server
     Loaded: loaded (/usr/lib/systemd/system/openvpn-server@.service; enabled; preset: enabled)
     Active: active (running) since Tue 2026-10-06 03:02:11 HKT; 8s ago
   Main PID: 3311 (openvpn)
     Status: "Initialization Sequence Completed"
```

`Status: "Initialization Sequence Completed"` 這一行就是單行健康讀數，也是監控應解析的內容。

**步驟 2 — 連線曾被撤銷後又復原的用戶端，並檢查日誌中預期的握手。**

```bash
# On the client host (a laptop or a second VM):
sudo openvpn --config /etc/openvpn/client/client-alice.ovpn --verb 3
```

在 `verb 3` 下用戶端一側的預期行：

```text
TLS: Initial packet from [AF_INET]198.51.100.5:1194, sid=...
VERIFY OK: depth=1, CN=VP-ISSUING-CA-01... / CN=Easy-RSA CA
VERIFY OK: depth=0, CN=server-vpnz-lnxra01
Control Channel: TLSv1.3, cipher TLS_AES_256_GCM_SHA384, peer certificate: CN=server-vpnz-lnxra01
[server-vpnz-lnxra01] Peer Connection Initiated with [AF_INET]198.51.100.5:1194
PUSH: Received control message: 'PUSH_REPLY,topology subnet,route 10.10.30.0 255.255.255.0,route 10.10.0.0 255.255.0.0,route 10.10.90.0 255.255.255.0,dhcp-option DNS 10.10.30.11,dhcp-option DNS 10.10.30.12,dhcp-option DOMAIN vertexpeak.fyp.lab,ifconfig 10.10.202.10 255.255.255.0'
/sbin/ip addr add dev tun0 local 10.10.202.10 peer 10.10.202.11
Initialization Sequence Completed
```

以及對應的伺服器一側行：

```text
10.10.202.10:41234 peer info: IV_VER=2.6.9
10.10.202.10:41234 [client-alice] Peer Connection Initiated with [AF_INET]198.51.100.60:41234
client-alice/10.10.202.10:41234 MULTI_sva: pool returned IPv4=10.10.202.10
```

**步驟 3 — 證明路由表與設計相符，且僅有設計中的內容。**

```bash
ip route show | grep -E 'tun0|10\.10\.'
```

預期結果——只有那三個被推送的前綴，別無其他：

```text
10.10.0.0/16 via 10.10.202.11 dev tun0
10.10.30.0/24 via 10.10.202.11 dev tun0
10.10.90.0/24 via 10.10.202.11 dev tun0
10.10.202.0/24 dev tun0 proto kernel scope link src 10.10.202.10
```

`default` 或 `0.0.0.0/1` 路由的**不存在**，正是證明該通道為分割而非全通道的依據——而這項「不存在」是所要求的螢幕截圖之一。

**步驟 4 — 穿越通道的 ping，然後是負向測試。**

```bash
ping -c 4 10.10.30.11            # the DC: must succeed
ping -c 4 10.10.90.10            # the DMZ VIP: must succeed (TB-11 permits 443; ICMP is a separate question)
curl -skI --max-time 5 https://10.10.90.10/healthz    # the published service through the tunnel
```

預期結果：

```text
PING 10.10.30.11 (10.10.30.11) 56(84) bytes of data.
64 bytes from 10.10.30.11: icmp_seq=1 ttl=63 time=1.42 ms
64 bytes from 10.10.30.11: icmp_seq=2 ttl=63 time=1.18 ms
64 bytes from 10.10.30.11: icmp_seq=3 ttl=63 time=1.35 ms
64 bytes from 10.10.30.11: icmp_seq=4 ttl=63 time=1.21 ms
--- 10.10.30.11 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
```

負向測試才是證明政策有效的測試，每一項都必須執行：

```bash
# The management zone must be unreachable (TB-12). Expect 100% loss, not "connection refused".
ping -c 3 -W 2 10.20.20.10 ; echo "exit=$?"

# The isolated lab must be unreachable (TB-09/TB-10).
ping -c 3 -W 2 10.70.0.50 ; echo "exit=$?"

# The iSCSI storage network must be unreachable.
ping -c 3 -W 2 10.10.80.21 ; echo "exit=$?"

# And the corresponding server-side evidence on vpnz-nft01:
sudo journalctl -k --since '-5min' | grep -E 'NFT-DROP: TB-12|NFT-DROP: TB-09'
```

值得為閱讀證據者指出的 `socket` 行為：ICMP `100% packet loss` 並帶**逾時**，表示該封包被政策丟棄；而 `Destination Port Unreachable` 或立即拒絕，則表示該封包*已抵達*某部主機。此區別即是「防火牆發揮了作用」與「路由缺失」之間的差異，報告應說明實際觀察到的是哪一種。

**步驟 5 — 撤銷測試，這是與安全相關的結果。**

```bash
# 1. Confirm the client currently connects.
sudo openvpn --config /etc/openvpn/client/client-revocation-test.ovpn --verb 3 &
sleep 12
ip -br a show tun0          # expected: tun0 UP 10.10.202.1xx/24
sudo pkill -f client-revocation-test.ovpn

# 2. Revoke and regenerate.
cd /etc/openvpn/easy-rsa
sudo ./easyrsa --batch revoke client-revocation-test
sudo ./easyrsa gen-crl
sudo chmod 0644 pki/crl.pem
sudo cp pki/crl.pem /etc/openvpn/server/crl.pem
sudo systemctl restart openvpn-server@server

# 3. Reconnect: must fail.
sudo openvpn --config /etc/openvpn/client/client-revocation-test.ovpn --verb 3
```

用戶端一側的預期失敗：

```text
VERIFY OK: depth=0, CN=client-revocation-test
VERIFY CRL: depth=0, /CN=client-revocation-test
VERIFY ERROR: depth=0, error=certificate revoked: CN=client-revocation-test
TLS_ERROR: BIO read tls_read_plaintext error: error:0A000418:SSL routines::tlsv1 alert unknown ca
TLS Error: TLS object -> incoming plaintext read error
SIGTERM[hard,tls-error] received, process exiting
```

伺服器一側的預期行：

```text
198.51.100.60:43812 VERIFY ERROR: depth=0, serial=0A:1B:..., CN=client-revocation-test
198.51.100.60:43812 CRL CHECK FAILED: CN=client-revocation-test is REVOKED
198.51.100.60:43812 TLS Error: TLS handshake failed
```

以及使此測試具有意義的控制項：一個**未被撤銷**的用戶端在同一時刻仍必須能夠連線。一場讓所有東西都停止運作的撤銷測試，對 CRL 什麼也證明不了。

**步驟 6 — 伺服器主機上的通道介面與 conntrack 視圖。**

```bash
ip -br a show tun0
ip route show | grep tun0
sudo ss -lunp | grep 1194
sudo conntrack -L -p udp --dport 1194 | head -5
cat /var/log/openvpn/status.log
```

預期的狀態檔（version 2 格式），這是證明「誰在何時連線過」最有用的一份單一構件：

```text
OpenVPN CLIENT LIST
Updated,Tue Oct  6 03:14:22 2026
Common Name,Real Address,Bytes Received,Bytes Sent,Connected Since
client-alice,198.51.100.60:41234,18432,15221,Tue Oct  6 03:12:41 2026
client-bob,203.0.113.77:50911,2048,1893,Tue Oct  6 03:13:02 2026
ROUTING TABLE
Virtual Address,Common Name,Real Address,Last Ref
10.10.202.10,client-alice,198.51.100.60:41234,Tue Oct  6 03:14:19 2026
10.10.202.11,client-bob,203.0.113.77:50911,Tue Oct  6 03:14:20 2026
GLOBAL STATS
Max bcast/mcast queue length,0
END
```
### 8.7 WireGuard

#### 8.7.1 設計，以及關於分支互通的誠實工程討論

WireGuard 在本設計中有三種角色，而其中只有一種沒有爭議。

| 角色 | 端點 | 內部定址 | 狀態 |
|---|---|---|---|
| `WG-HQ-WC`——總部與灣仔之間的站點對站點 | `vpnz-nft01`/`vpnz-nft02`（VIP `10.10.50.10`，對外呈現為 `203.0.113.2:443`）↔ 灣仔對等節點 | A = `10.10.200.1/24`，B = `10.10.200.5/24` | **已由 Rev 1.1 / OD-01 決定：選項 A——由 `vpnz-wcwg01` 終結通道；`VP-WC-EDGE-01` 僅終結 IPsec。** 見下文 |
| `WG-REMOTE-POOL`——遠端工作者 | 同一個總部 VIP ↔ 員工筆記型電腦 | `10.10.200.64/26`（可用 `10.10.200.65–126`） | 直接了當，且不受分支決定影響 |
| `MGMT-TUNNEL`——頻外管理逃生通道 | `vpnz-nft01` ↔ `vpnz-mon01` | `10.10.200.200/32` 及 `10.10.200.201/32` | 記錄為緊急路徑；**必須在安全測試期間停用，並就其不存在提出證據** |

**這項尚未關閉的決定，誠實說明。** 本設計的灣仔對等節點是 `VP-WC-EDGE-01`，它是一部**在 Packet Tracer 中模擬的 Cisco IOS 裝置**——而 Cisco 路由器無法終結 WireGuard。這不是本專案技術能力或 Packet Tracer 的限制；這是關於該技術的一項陳述：WireGuard 是 Linux 核心（及使用者空間）實作，沒有任何主流 Cisco IOS 版本能終結它。基準將此事記錄為一項須於第 6 週結束前關閉的待辦項目，並有兩個候選解決方案：

**選項 A——以第三部 Ubuntu VM 代表灣仔的加密閘道。** 一部新的客體 `vpnz-wcwg01`（2 vCPU / 2 GB / 20 GB，連接至 `VNET-WAN`，內部位址 `10.10.200.5`，並且是基準主機名稱清單中所述的那部選用額外主機）終結 WireGuard，並代表該分支的加密閘道。Cisco `VP-WC-EDGE-01` 路由器為 BGP/OSPF/IPsec 的故事繼續存在於 Packet Tracer 中，而誠實的陳述是：**WireGuard 端點是由一部扮演分支閘道角色的 Linux VM 模擬**，而通往 ASA 的 IPsec 通道才是真正由 Cisco 代表的站點對站點機制。

**選項 B——WireGuard 僅作為遠端工作者通道，分支則使用 ASA 上的 IPsec。** *（未採用：Rev 1.1 裁定 OD-01 選擇選項 A。保留此段是為了讓替代方案及其後果被記錄下來，而非默默捨棄。）* 站點對站點需求由 `IPSEC-HQ-WC` 滿足（IKEv2，UDP 500/4500，ASA `VP-HQ-FW-01` 外部 `198.51.100.1` 至 `VP-WC-EDGE-01` 外部 `203.0.113.5`），那是真正 Cisco 對 Cisco 的機制，且已是本設計中「僅供 VLAN 131 使用的選用傳輸」。屆時 WireGuard 便**僅**在總部對組與員工筆記型電腦之間示範，該處的對等節點是真正的 WireGuard 用戶端，完全不產生 Cisco 互通的問題。

**建議，並說明其取捨。** 建議採用**選項 A，即 `vpnz-wcwg01` 這部 Ubuntu 對等節點**，理由有四：

1. **它使站點對站點的 WireGuard 主張保持真實。** 在選項 B 之下，本專案中唯一的 WireGuard 對等節點是員工筆記型電腦，而本設計自身的表格將 `WG-HQ-WC` 描述為*主要的辦公室間通道*。捨棄站點通道將使基準所述的主要用途未獲實作，並需要修訂基準。
2. **它保留同類對同類的比較。** 本專案為兩套小型辦公室機制所提出的敘述動機就是比較：ASA 上的 IKEv2 對比 Linux 上的 WireGuard。唯有兩條通道都真正在兩個閘道之間建立起來，該比較才存在。
3. **它在總部對組上實際操作多對等節點的 WireGuard。** 在同一介面上有兩個對等節點（分支閘道與遠端集區），且其 `AllowedIPs` 重疊但互異，這正是有意思的組態錯誤所在之處——也正是本專案疑難排解範疇的領域。
4. **它只花費 2 GB RAM 及一部 VM。** 該環境已執行 19 部 VM，且有兩班制備用方案應對記憶體壓力；一部 2 GB 客體在工程時間上是兩個選項中最廉價的，因為選項 B 需要在三個章節中改寫灣仔的故事。

選項 A 誠實的**代價**必須同時說明：灣仔閘道是一部*代替*分支路由器的 Linux VM，因此 Cisco 對 Linux 的站點對站點路徑**並未**被示範，報告不得主張 WireGuard 能與 Cisco IOS 互通。分支一側的通道加密端點並非 Cisco 裝置。那句話屬於與建議相同的那一段，而非腳註。

無論選擇哪一個選項，都必須在決策日誌中就 WireGuard 站點對站點對等節點的待辦項目加以記錄，該選擇必須反映在版本/介面表中，且**本設計在任何情況下都不得主張 WireGuard 運行於 Cisco 裝置上**。

**本小節的銜接與誠信。** `WireGuard` 在 WSOS 2026 中完全沒有出現（在文本及原始 HTML 中各出現 0 次）。標準唯一給予的授權，是 `Provide network connectivity between remote branches using VPN technologies such as IPSec, SSL VPN, Direct Access, OpenVPN, DMVPN, GRE, etc.` 末尾的 `etc.`（範疇 3，第 6 行）——而**同一行中所點名的 OpenVPN，已在本章其他處實作。** 因此 WireGuard 呈現為本線路三道銜接中最弱的一道，是小組基於工程理由（核心空間效能、最小的組態面、現代密碼學）而選擇，而非因為標準要求它。

#### 8.7.2 金鑰產生與管理

WireGuard 認證僅使用非對稱金鑰。私密金鑰**就是**身分：沒有憑證、沒有 CA、沒有撤銷清單、沒有到期日。在產生第一把金鑰之前就必須理解其後果，因為它們徹底改變了運作模型：

- **外洩的私密金鑰無法撤銷。** 唯一的補救措施是在每個對等節點上停止信任對應的**公開**金鑰——這意味著要在其他每一個端點上編輯對等組態，而非呼叫撤銷服務。
- **沒有到期日。** 第一天產生的金鑰在被移除之前一直有效。
- **`AllowedIPs` 同時是路由表與存取控制。** 對等節點被授權的前綴，恰好就是通道將路由給它的前綴。沒有獨立的 ACL。

```bash
# WireGuard tools. The pin is wireguard-tools 1.0.20210914 with the in-kernel module.
sudo apt-get install -y wireguard wireguard-tools
wg --version
# Expected: wireguard-tools v1.0.20210914 - https://git.zx2c4.com/wireguard-tools/
modinfo wireguard | head -3
# Expected: filename: /lib/modules/<ver>/kernel/drivers/net/wireguard/wireguard.ko
# If the kernel module is absent, the documented fallback is the userspace Go implementation
# (wireguard-go), which is slower and must be recorded as a deviation.
```

**`umask 077` 紀律。** 每一次金鑰操作都在一個 umask 已禁止群組與其他使用者存取的 shell 中進行，使即使只是短暫以預設權限建立的情況都不可能發生。在產生*之後*才做這件事並不等同，因為存在一段金鑰可被所有人讀取的窗口。

```bash
# Generate a key pair with the umask set BEFORE anything is written.
sudo -i
mkdir -p /etc/wireguard && chmod 0700 /etc/wireguard && cd /etc/wireguard
umask 077
wg genkey > privatekey-hq
wg pubkey < privatekey-hq > publickey-hq
# A preshared key adds a symmetric layer on top of the public-key handshake. It is optional but
# cheap, and it is recommended for the site-to-site peer.
wg genpsk > psk-hq-wc
chmod 0600 privatekey-hq psk-hq-wc ; chmod 0644 publickey-hq
ls -l /etc/wireguard
# Expected:
#   -rw------- 1 root root 45 Oct  6 03:20 privatekey-hq
#   -rw------- 1 root root 45 Oct  6 03:20 psk-hq-wc
#   -rw-r--r-- 1 root root 45 Oct  6 03:20 publickey-hq
```

驗證 umask 確實發揮作用，因為權限錯誤的金鑰檔是最常見的 WireGuard 組態錯誤：

```bash
stat -c '%a %U:%G %n' /etc/wireguard/*
# Expected: 600 for privatekey-* and psk-*, 644 for publickey-*
```

**金鑰儲存與輪換政策。**

| 項目 | 規則 |
|---|---|
| 位置 | `/etc/wireguard/`，權限 `0700`，擁有者 `root:root` |
| 私密金鑰與 PSK | 權限 `0600`，**絕不**提交至 Git |
| 公開金鑰 | 權限 `0644`；它們可安全公開，並記錄於本設計的金鑰表中 |
| `.gitignore` | 必須包含 `wg*.conf`、`*.key`、`privatekey*`、`psk*`、`*.pem`、`pki/`——且必須以一次刻意的測試提交來驗證 |
| 主機之間的傳輸 | 經由 SSH 複製，或首次啟動時透過 Hypervisor 主控台貼上；**絕不**透過聊天、電子郵件或 Git 提交 |
| 輪換觸發條件 | 專案結束時；任何疑似曝露之後；每當有對等節點退役時；以及在建置期間進行一次已記錄的演練，使該程序確知其可行 |
| 輪換方法 | 在該對等節點上產生新的金鑰對，將新的公開金鑰加入其他每一對等節點的 `AllowedIPs` 項目，並使用**較窄**的允許 IP 集合，驗證後再移除舊的公開金鑰。依此順序先加入後移除，使通道永不中斷。先移除的輪換會造成服務中斷 |
| 輪換做不到的事 | 它無法集中撤銷任何東西。每個對等節點都必須編輯。因此對等節點的數量本身就是與安全相關的量，這也是為何遠端工作者集區應在擴大之前先予檢視 |

#### 8.7.3 介面與對等節點組態

**端點 A——總部一側，位於 `vpnz-nft01`**（在 `vpnz-nft02` 上亦相同，使用其自身的私密金鑰，但對等節點相同）。

```ini
# /etc/wireguard/wg0.conf     —   vpnz-nft01     mode 0600 root:root
# The WireGuard interface is the VPN front door for the site tunnel and the remote-worker pool.
# Tunnel network: 10.10.200.0/24 (site) and 10.10.200.64/26 (remote workers).
# Start:        sudo systemctl enable --now wg-quick@wg0
# Inspect:      sudo wg show ; sudo wg show all dump ; ip -br a show wg0
# SECURITY: this file contains a private key. It is in .gitignore and must never be committed.

[Interface]
# The tunnel-local address. 10.10.200.1/24 is the address that FLOATS WITH THE VIP: the same
# configuration exists on vpnz-nft02 (10.10.50.12) so that whichever node is VRRP master presents
# the same tunnel endpoint address. The floating tunnel address must be declared in the keepalived
# 'virtual_ipaddress_excluded' block as well, or the tunnel address will exist on both nodes.
Address    = 10.10.200.1/24
ListenPort = 443          # UDP 443 as fixed by the design; chosen because it traverses restrictive
                          # hotel and airport networks that block UDP 1194 and 500/4500.
PrivateKey = <contents of /etc/wireguard/privatekey-hq>

# Routing table discipline. Policy routing with a dedicated table keeps VPN routes out of the main
# table so that a mistake in AllowedIPs cannot black-hole ordinary traffic.
Table = off               # we install routes explicitly below rather than letting wg-quick do it
# PostUp/PostDown run as root when the interface comes up and goes down.
PostUp   = ip -4 rule add from 10.10.200.0/24 lookup 51820 priority 100
PostUp   = ip -4 rule add from 10.10.200.64/26 lookup 51820 priority 100
PostUp   = ip -4 route add 10.10.210.0/24 dev wg0 table 51820
PostUp   = ip -4 route add 10.10.200.64/26 dev wg0 table 51820
PostDown = ip -4 rule del from 10.10.200.0/24 lookup 51820 priority 100 || true
PostDown = ip -4 rule del from 10.10.200.64/26 lookup 51820 priority 100 || true
PostDown = ip -4 route flush table 51820 || true

# Optional: an fwmark tags every encapsulated packet so a routing rule can send it out the
# correct egress interface and so that a loop back into the tunnel is impossible.
# FwMark = 0x51820
#   With FwMark set, add:  ip rule add fwmark 0x51820 lookup 51820 priority 100

# Reduce the interface MTU to leave room for the encapsulation overhead.
# 1420 is the value in the WireGuard documentation for a 1500-byte path; it is conservative and
# prevents the classic "ping works, TCP stalls" symptom caused by fragmentation.
MTU = 1420

# ---------------------------------------------------------------
# PEER 1 — the Wan Chai site peer (Option A: vpnz-wcwg01, the Ubuntu peer)
# ---------------------------------------------------------------
[Peer]
# Public key of the Wan Chai endpoint. Generated on that host with 'wg genkey | wg pubkey'.
PublicKey    = <public key of vpnz-wcwg01>
PresharedKey = <contents of /etc/wireguard/psk-hq-wc>       # adds a symmetric layer to the handshake

# AllowedIPs is BOTH the route list and the access control for this peer.
# ONLY the two Wan Chai subnets are listed. 0.0.0.0/0 is deliberately absent: a site-to-site
# peer must never be allowed to route arbitrary traffic through this interface.
AllowedIPs   = 10.10.130.0/24, 10.10.131.0/24

# The Wan Chai peer's public address. The design fixes 203.0.113.5 for VP-WC-EDGE-01's outside
# interface; with Option A the Ubuntu peer carries the same address so the tunnel endpoint
# matches the design's addressing regardless of which option was chosen.
# Port 443 on both ends keeps the tunnel symmetric and firewall-friendly.
Endpoint     = 203.0.113.5:443

# Keepalive is set ONLY on this side. Behind NAT, the peer's map needs to stay open; if BOTH
# sides send keepalives the internet sees twice the traffic for no benefit. The baseline's rule is
# "PersistentKeepalive = 25 on the client side only", and here the HQ pair is the client.
PersistentKeepalive = 25

# ---------------------------------------------------------------
# PEER 2 — the remote-worker pool
# ---------------------------------------------------------------
[Peer]
# The remote-worker peers are added ONE PER CLIENT, not as a single shared entry, because
# AllowedIPs is per-peer access control: a shared key would let one laptop use another's address.
# The example below is the template; the real file carries one block per issued laptop.
PublicKey    = <public key of the staff laptop 'laptop-alice'>
AllowedIPs   = 10.10.200.65/32         # a SINGLE /32 per client, never a range
# No Endpoint line: remote workers are behind unpredictable NATs, so the HQ side learns the
# observed endpoint from the first authenticated packet. This is the correct pattern, and an
# Endpoint line here would be wrong.
# PersistentKeepalive is NOT set on the HQ side for these peers: the laptops send it.
```

分支對等節點（選項 A）上的對等檔案，它是鏡像，且值得完整說明，因為此不對稱是刻意的：

```ini
# /etc/wireguard/wg0.conf     —   vpnz-wcwg01 (the Wan Chai encrypting peer)    mode 0600
[Interface]
Address    = 10.10.200.5/24          # fixed by the tunnel addressing table
ListenPort = 443
PrivateKey = <private key generated on vpnz-wcwg01>
Table      = off
PostUp   = ip -4 route add 10.10.0.0/16 dev wg0
PostUp   = ip -4 route add 10.10.90.0/24 dev wg0
PostDown = ip -4 route del 10.10.0.0/16 dev wg0 || true
PostDown = ip -4 route del 10.10.90.0/24 dev wg0 || true
MTU = 1420

[Peer]
# The HQ side. The public key is the HQ pair's key.
PublicKey    = <public key of vpnz-nft01/nft02>
PresharedKey = <the SAME psk as on the HQ side — a mismatch here fails the handshake silently>
# Only the two HQ prefixes the branch is authorised to reach. Management (10.20.0.0/16) and the
# isolated lab (10.70.0.0/16) are absent, which mirrors TB-14 and TB-12.
AllowedIPs   = 10.10.0.0/16, 10.10.90.0/24, 10.10.200.0/24

# The HQ endpoint. 203.0.113.2 is the address the design presents for the HQ tunnel endpoints,
# mapped to the nftables VIP 10.10.50.10. Using the VIP rather than a node address is what makes
# the tunnel survive a keepalived failover.
Endpoint     = 203.0.113.2:443
PersistentKeepalive = 25
```

兩項絕不可遺漏的說明。第一，**`Endpoint = 203.0.113.2:443` 必須指向 VIP，而非 `10.10.50.11`。** 指向節點位址意味著每次容錯移轉時通道都會斷掉，而那正是本小節與 §8.4 之間、讀者否則將會忽略的耦合。同一規則適用於 nginx VIP：`vpnz-dmzrev01` 是 `10.10.90.28`，而非 VIP `10.10.90.10`（Rev 1.1 裁定 C-02），因此任何將 `10.10.90.10` 當作節點位址的組態都是錯的。第二，**`PresharedKey` 在兩端必須逐位元組完全相同。** 不一致會產生永不完成的握手，且沒有明確的錯誤訊息，而它已列於 §8.12 的失效模式清單中。

#### 8.7.4 路由與防火牆互動

**nftables 對 WireGuard 介面的處理。** 通道要能運作，必須滿足三件事，而每一件都對應規則集中的一條規則或介面組態中的一項設定：

1. **UDP 監聽埠必須被允許輸入。** `input` chain 中的 `udp dport 443 iifname "ens224"` 正是讓封裝後的封包得以抵達的規則。
2. **穿越流量必須與通道介面相關聯。** WireGuard 在 `wg0` 上交付已解密的封包，因此 `forward` chain 必須把該通道視為一個介面。這正是**`iifname` 與 `oifname` 在本設計中比任何其他地方都更重要**之處：`wg0` 是虛擬介面，其*索引*會在介面重新建立時改變，因此使用數值索引的 `iif` 會在重新啟動後默默停止匹配，而 `iifname "wg0"` 則保持穩定。因此 `forward` chain 帶有針對該通道的介面範圍規則，而那些規則必須出現在 `ct state` 捷徑**之後**、全捕捉丟棄**之前**。
3. **除非設計有意為之，否則不得對通道流量套用 NAT。** 在本設計中，VPN 集區是可路由的內部位址（`10.10.200.64/26` 是被路由而非被 masquerade），因為 VPN 的要點正是保留來源位址以供歸因。為 `wg0` 加入 `masquerade` 規則會隱藏通道用戶端的身分，因此刻意不存在——而當路由行為異常時想把它當作「修正」加入的誘惑，正是 §8.12 中的失效模式之一。

規則集的相關新增內容（此處為清晰起見分開顯示；在已交付的檔案中它們屬於 `30-filter-forward.nft`）：

```nftables
# --- WireGuard interface handling in the forward chain ---
# The tunnel is an interface-level source of truth: traffic arriving on wg0 is authenticated
# by WireGuard itself and carries the peer's tunnel address.
iifname "wg0" ip saddr 10.10.200.0/24 ip daddr @lan4 counter accept \
    comment "WG-HQ-WC: the branch peer reaches the internal prefixes it is authorised for"
iifname "wg0" ip saddr 10.10.200.64/26 ip daddr @lan4 counter accept \
    comment "WG-REMOTE-POOL: remote workers reach the same service set as the branch peer"
iifname "wg0" counter log prefix "NFT-DROP: WG-FORWARD " level warn counter drop \
    comment "anything arriving on the tunnel that is not from an authorised prefix is dropped and logged"

# --- outbound into the tunnel: the replies and the branch-originated requests ---
oifname "wg0" ip daddr { 10.10.130.0/24, 10.10.131.0/24 } counter accept \
    comment "traffic destined for the Wan Chai subnets goes into the tunnel, not out to the WAN"

# --- the management escape hatch must be called out so it can be proven absent during the test ---
udp dport 51820 iifname "ens224" ip saddr 10.10.30.31 counter accept comment "MGMT-TUNNEL (disabled for the security test)"
```

**`fwmark` / 政策路由技巧。** 若通道端點與通道自身的傳輸都可經由同一條預設路由抵達，就可能產生路由迴圈：送往 `203.0.113.5` 的封包本身可能被路由*進入* `wg0`。有兩種機制可防止此情況，而本設計將兩者都記錄下來，使無論採用哪一種都是決定而非意外。

```bash
# Mechanism 1 (used here) — a dedicated routing table plus source-based rules.
# Traffic FROM the tunnel's own inner prefixes is looked up in table 51820, which contains only
# the tunnel routes; everything else uses the main table. wg-quick's 'Table = off' plus explicit
# PostUp rules implement exactly this.
ip -4 rule show
# Expected:
#   100:	from 10.10.200.0/24 lookup 51820
#   100:	from 10.10.200.64/26 lookup 51820
ip -4 route show table 51820
# Expected:
#   10.10.210.0/24 dev wg0 scope link
#   10.10.200.64/26 dev wg0 scope link

# Mechanism 2 (documented alternative) — an fwmark on encapsulated packets.
# Uncomment 'FwMark = 0x51820' in wg0.conf and add the matching rule:
#   ip rule add fwmark 0x51820 lookup 51820 priority 100
# The advantage of fwmark is that it identifies the ENCAPSULATED packets specifically, which is
# more precise than identifying traffic by source prefix. Its cost is one more piece of state to
# explain and to get wrong.
```

遠端工作者集區的路由還需要一件容易遺漏的部分：集區位址（`10.10.200.64/26`）必須**被路由回通道內**，否則對遠端工作者的回覆會被送往預設閘道並被丟棄。那正是 `PostUp = ip -4 route add 10.10.200.64/26 dev wg0 table 51820` 的作用，而忘記它的症狀是握手成功但完全沒有資料傳輸——記錄於 §8.12。

#### 8.7.5 驗證

**步驟 1 — 介面及其對等節點。**

```bash
sudo systemctl enable --now wg-quick@wg0
systemctl status wg-quick@wg0 --no-pager | head -6
sudo wg show
```

預期結果：

```text
interface: wg0
  public key: <HQ public key, base64>
  private key: (hidden)
  listening port: 443

peer: <vpnz-wcwg01 public key>
  preshared key: (hidden)
  endpoint: 203.0.113.5:443
  allowed ips: 10.10.130.0/24, 10.10.131.0/24
  latest handshake: 34 seconds ago
  transfer: 18.42 KiB received, 21.07 KiB sent
  persistent keepalive: every 25 seconds

peer: <laptop-alice public key>
  allowed ips: 10.10.200.65/32
  latest handshake: 2 minutes, 11 seconds ago
  transfer: 4.11 KiB received, 6.02 KiB sent
```

**步驟 2 — 機器可讀的狀態，這是監控或 Ansible 檢查應解析的內容。**

```bash
sudo wg show all dump
```

預期結果（以 tab 分隔；欄位順序完全如所示）：

```text
wg0	<HQ-private>	<HQ-public>	443	off
wg0	<wcwg01-public>	(none)	203.0.113.5:443	10.10.130.0/24,10.10.131.0/24	1759720...	18432	21072	25
wg0	<alice-public>	(none)	(none)	10.10.200.65/32	0	4110	6021	0
```

`latest handshake` 欄位是健康訊號：**完全沒有握手的對等節點**（在 dump 中顯示為 `0`）從未完成密碼學握手，這指向金鑰、PSK 或可達性問題；而**握手已是數分鐘前、但傳輸量非零的對等節點**則運作正常，只是閒置。區分這兩種狀態是本小節中最有用的單一疑難排解技巧，而解析檢查為：

```bash
# A one-line liveness test suitable for a monitoring check or an Ansible assertion.
sudo wg show all dump | awk -F'\t' 'NR>1 && $5!="(none)" { now=systime(); if ($6==0 || now-$6>180) print "STALE: peer " $4 " handshake " $6; else print "OK: peer " $4 }'
```

**步驟 3 — 握手確認與介面狀態。**

```bash
ip -br a show wg0
ip route show table 51820
ip -4 rule show
sudo ss -lunp | grep 443
```

預期結果：

```text
wg0              UNKNOWN        10.10.200.1/24
```

```text
10.10.200.64/26 dev wg0 scope link
10.10.210.0/24 dev wg0 scope link
```

```text
100:	from 10.10.200.0/24 lookup 51820
100:	from 10.10.200.64/26 lookup 51820
```

```text
UNCONN 0      0         0.0.0.0:443      0.0.0.0:*    users:(("wg-0-wg0",pid=...))
```

**步驟 4 — 連線性與範圍證據。** 從分支對等節點的角度進行正向與負向測試各一：

```bash
# On vpnz-wcwg01 (the Wan Chai peer):
ping -c 4 10.10.30.11        # a server in the authorised set: must succeed
ping -c 4 10.10.90.10        # the DMZ VIP: must succeed
ping -c 4 10.20.20.10        # Z-MGMT: must FAIL (TB-14 denies the branch router access)
ping -c 4 10.70.0.50         # Z-STUDENT: must FAIL (TB-09/TB-10)
```

預期結果：

```text
PING 10.10.30.11 (10.10.30.11) 56(84) bytes of data.
64 bytes from 10.10.30.11: icmp_seq=1 ttl=63 time=3.11 ms
...
4 packets transmitted, 4 received, 0% packet loss, time 3003ms

PING 10.20.20.10 (10.20.20.10) 56(84) bytes of data.
--- 10.20.20.10 ping statistics ---
4 packets transmitted, 0 received, 100% packet loss, time 3061ms
```

以及防火牆上對應的丟棄：

```bash
sudo journalctl -k --since '-5min' | grep 'NFT-DROP: TB-14'
# Expected:
#   vpnz-nft01 kernel: NFT-DROP: TB-14 IN=ens224 ... SRC=10.10.130.1 DST=10.20.20.10 PROTO=ICMP ...
```

**步驟 5 — 管理逃生通道必須可證明已停用。**

```bash
# The documented control: disable the MGMT-TUNNEL before the security test and evidence its absence.
sudo wg set wg1 peer <mon01-public-key> remove 2>/dev/null || true
sudo ip link del wg1 2>/dev/null || true
ip -br a show | grep -c wg1        # expected: 0
sudo wg show all dump | grep -c '10.10.200.200'   # expected: 0
```

**步驟 6 — 以 `iperf3` 進行吞吐量合理性檢查。** WSOS 並未點名 `iperf3`（標準點名的是 `tcpdump`、`NetFlow`、`Syslog`、`SNMP` 及 `CDP`），因此本測試的正當性在於它是一項專案工程檢查，而非標準要求——且必須如此標示。

```bash
# On the HQ side as server:
sudo apt-get install -y iperf3
iperf3 -s
# On the branch peer as client, through the tunnel:
iperf3 -c 10.10.200.1 -t 15 -P 4
```

結果的預期形式（以下數字僅示範其*形狀*，必須以來自主機的實測值取代——絕不可照抄）：

```text
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID]   Interval         Transfer     Bitrate         Retr
[SUM]   0.00-15.00  sec   168 MBytes  93.9 Mbits/sec    12             sender
[SUM]   0.00-15.00  sec   167 MBytes  93.4 Mbits/sec                  receiver
```

報告中任何吞吐量數字都必須伴隨三條解讀規則：(a) 這是**單一機器上的僅主機虛擬網路**，因此該數字量測的是 Hypervisor 的虛擬交換器與 CPU，而非真實分支頻寬；(b) WireGuard 通道在 2-vCPU 客體上受 CPU 限制，因此該數字既是網路量測也是 CPU 量測；(c) 該數字絕不可呈現為真實世界的 WAN 吞吐量。正確的表述是*「針對模擬鏈路的吞吐量量測，用以確認該通道確實在傳送流量，並在相同條件下比較兩套小型辦公室機制」*——那是一項真實且可辯護的成果，而宣稱 94 Mbit/s 的分支鏈路則不是。

### 8.8 Linux 伺服器基準加固

以下控制項由 `04-automation/bash/01-hardening-baseline.sh` 套用至每一部 Ubuntu 客體，並由 `ansible/playbooks/02-baseline-linux.yml`（`roles/common/`）以冪等方式強制落實。每一列都陳述一個具體值、容納它的檔案，以及理由——因為沒有理據的加固表，是一份在口試中無人能辯護的檢查清單。

#### 8.8.1 SSH 與本機存取

| 控制項 | 設定 | 檔案 / 機制 | 理據 |
|---|---|---|---|
| Root 登入 | `PermitRootLogin no` | `/etc/ssh/sshd_config.d/10-fyp-hardening.conf` | 沒有共用帳戶，沒有無法歸因的管理行為。管理員使用 `adm-{initials}` 並以 `sudo` 提權，而該行為會被記錄 |
| 密碼認證 | `PasswordAuthentication no`、`KbdInteractiveAuthentication no` | 同上 | 經網路傳送的密碼可被取代；金鑰不能。同時移除對外路徑上的整個暴力破解面 |
| 認證方法 | `AuthenticationMethods publickey` | 同上 | 即使用戶端提出密碼，也明確拒絕以密碼作為替代方案 |
| 空密碼 | `PermitEmptyPasswords no` | 同上 | 封閉意外出現「無密碼帳戶」的漏洞 |
| 存取限制 | `AllowGroups gg-infra-admins` | 同上 | 具名群組而非共用帳戶；本機群組對應 Windows 的 `GG-Infra-Admins` 群組，使兩個平台上存在同樣那四位管理員 |
| 拒絕 root 群組 | `DenyUsers root` | 同上 | 第二道獨立拒絕，以防日後某次編輯放寬了 `PermitRootLogin` |
| 失敗嘗試上限 | `MaxAuthTries 3` | 同上 | 界定金鑰猜測迴圈 |
| Session 上限 | `MaxSessions 4` | 同上 | 防止單一已認證 session 開啟無上限的多工通道 |
| 登入寬限 | `LoginGraceTime 30` | 同上 | 未經認證的連線無法無限期佔用一個位置——即針對 `sshd` 的典型 DoS |
| 轉送 | `X11Forwarding no`、`AllowAgentForwarding no`、`AllowTcpForwarding no`、`PermitTunnel no`、`GatewayPorts no` | 同上 | 每一項轉送功能都是一種橫向移動的途徑。例外以逐主機方式在另一個 drop-in 中授予（DMZ 跳板主機需要 `AllowTcpForwarding yes`，而那是記錄為例外，而非內建於基準中） |
| 環境變數注入 | `PermitUserEnvironment no` | 同上 | 防止 `~/.ssh/environment` 設定 `sudo` 可能採納的變數 |
| 以主機為基礎的認證 | `HostbasedAuthentication no`、`IgnoreRhosts yes` | 同上 | 移除歷史上的 `.rhosts` 信任模型 |
| 反向查詢 | `UseDNS no` | 同上 | 避免 DNS 緩慢時登入停滯，並移除認證期間對解析器的依賴 |
| 死 session 回收 | `ClientAliveInterval 300`、`ClientAliveCountMax 2` | 同上 | 被棄置的 session 在約 10 分鐘後關閉，而非永遠開著 |
| 日誌層級 | `LogLevel VERBOSE` | 同上 | 記錄每次登入所用的**金鑰指紋**，這使「誰用哪把金鑰登入」得以回答。這是 AI 線路 `auth-failure-report` 技能的資料來源 |
| SFTP | `Subsystem sftp internal-sftp` | 同上 | 使用行程內 SFTP 伺服器；沒有需要持續修補的獨立執行檔 |
| Sudo 權限 | `%gg-infra-admins ALL=(ALL:ALL) ALL` | `/etc/sudoers.d/10-fyp-admins`（0440） | 群組層級的最小權限；以 `visudo -c -f` 驗證 |
| Sudo session 逾時 | `timestamp_timeout=5` | 同上 | 五分鐘的憑證快取而非預設的 15 分鐘，使被棄置的 session 較不易被提權 |
| Sudo 稽核 | `logfile="/var/log/fyp/sudo.log"`、`log_input`、`log_output` | 同上 | 記錄每一項特權動作的指令**及其輸出**——即盡職調查問卷所要求的 PowerShell 轉錄的 Linux 對應作法。由 `logrotate` 收集並轉送至監控主機 |
| PTY 強制 | `Defaults use_pty` | 同上 | 若無此設定，`sudo` 的子行程可能在其父行程結束後存活，且對該 session 的終端機不可見 |

#### 8.8.2 核心參數

完整檔案見 §8.5.4；下表說明哪些參數要緊及其原因，包括那些依主機角色而定的參數。

| 參數 | 值 | 理據 |
|---|---|---|
| `net.ipv4.ip_forward` | 僅在 `vpnz-nft01/02` 上為 `1`，其他處為 `0` | 防火牆主機必須轉送；網頁伺服器絕不可成為路由器。將其全域設為 1 會讓一部遭入侵的 DMZ 主機變成路由器 |
| `net.ipv4.conf.all.rp_filter` | `1` | 丟棄來源無法經由抵達介面反向可達的封包——這是可用的最廉價反偽造控制項 |
| `net.ipv4.tcp_syncookies` | `1` | 在 SYN 洪水中存活而不失去監聽器 |
| `net.ipv4.tcp_rfc1337` | `1` | 丟棄處於 `TIME_WAIT` 的 RST 封包，封閉一個真實的連線重置手法 |
| `net.ipv4.tcp_timestamps` | `0` | 移除一個可指紋辨識運作時間的側通道。`[假設]` 這可能與 PAWS 及極快速的鏈路重用產生互動；在僅主機的實驗室網段上其影響為零，但該互動必須說明 |
| `net.ipv4.conf.all.accept_redirects` | `0` | 伺服器絕不可接受告知它改用其他閘道的 ICMP 重導向——那是一種中間人手法 |
| `net.ipv4.conf.all.send_redirects` | `0` | 且絕不可產生重導向 |
| `net.ipv4.conf.all.accept_source_route` | `0` | 來源路由已過時且可被濫用 |
| `net.ipv4.icmp_echo_ignore_broadcasts` | `1` | 沒有 smurf/tribe 放大攻擊 |
| `net.ipv4.conf.all.log_martians` | `1` | 使偽造流量可見而非默默被丟棄——這使 `rp_filter` 控制項**可被觀察**，對驗證章節而言很重要 |
| `net.ipv4.ip_local_port_range` | `10240 65000` | 使臨時埠遠離低位範圍，避免與服務埠衝突並在規則審閱時造成混淆 |
| `net.netfilter.nf_conntrack_max` | `131072` | 明確且受監控的上限，而非某個版本的預設值 |
| `kernel.dmesg_restrict` | `1` | 非特權使用者無法讀取核心環形緩衝區，其中含有可能洩露拓撲的 nftables 日誌行 |
| `kernel.kptr_restrict` | `2` | 隱藏核心指標，移除一個可破解 KASLR 的資訊洩漏 |
| `kernel.yama.ptrace_scope` | `1` | 行程僅能由自身子孫行程追蹤——阻止跨使用者的憑證記憶體竊取 |
| `kernel.randomize_va_space` | `2` | 完整 ASLR |
| `fs.protected_hardlinks`、`fs.protected_symlinks` | `1` | 阻止典型的 `/tmp` 符號連結與硬連結提權 |

#### 8.8.3 檔案權限與擁有權

| 路徑 | 權限 | 擁有者 | 理據 |
|---|---|---|---|
| `/etc/ssh/sshd_config.d/10-fyp-hardening.conf` | `0644` | `root:root` | 所有人可讀（它不是秘密），僅 root 可寫。在某些建置中 `sshd` 會拒絕群組/所有人可寫的組態 |
| `/etc/netplan/50-cloud-init.yaml` | `0600` | `root:root` | Netplan 會就所有人可讀的檔案提出警告，且該檔案載有完整的定址細節 |
| `/etc/sudoers.d/10-fyp-admins` | `0440` | `root:root` | `sudo` 拒絕在 sudoers 檔可被群組/所有人寫入的情況下執行；這是硬性失敗，不是警告 |
| `/etc/nginx/ssl/*.key`、`/etc/nginx/ssl/portal.key` | `0600` | `root:root` | TLS 私密金鑰。Nginx 在降權至 `www-data` 之前以 root 讀取它們 |
| `/etc/nginx/ssl/*.crt`、`chain.crt` | `0644` | `root:root` | 公開素材 |
| `/etc/nginx/.htpasswd-portal` | `0640` | `root:www-data` | Nginx 必須在降權後讀取它；其他任何人皆不可 |
| `/etc/keepalived/keepalived.conf` | `0644` | `root:root` | 內含 VRRP 共享秘密；僅主機網段與該檔案的非所有人可寫權限即為控制項，而該秘密是實驗室簡化做法 |
| `/etc/nftables.conf`、`/etc/nftables.d/*.nft` | `0644` | `root:root` | 規則集中沒有憑證；可讀使審閱者及 Ansible 的 `--diff` 能讀取它 |
| `/etc/wireguard/wg0.conf`、`privatekey*`、`psk*` | `0600` | `root:root` | **私密金鑰。** 同時列於 `.gitignore` 中。`wg-quick` 會就所有人可讀的金鑰檔提出警告 |
| `/etc/openvpn/easy-rsa/` | `0700` | `root:root` | 整個 PKI 目錄；`pki/private/` 子樹絕不可被其他任何人讀取 |
| `/etc/openvpn/easy-rsa/vars` | `0600` | `root:root` | 不含任何金鑰素材，但含有 CA 預設值 |
| `/etc/openvpn/server/*.key`、`/etc/openvpn/server/crl.pem` | `0600` / `0644` | `root:root` | 伺服器金鑰維持 `0600`；CRL 複本為 `0644`，因為伺服器在降權至 `nobody` 之後才讀取它（見 §8.6.2） |
| `/etc/openvpn/ccd/` | `0700` | `root:root` | 逐用戶端覆寫 |
| `/etc/openvpn/client/*.ovpn` | `0600` | `root:root` | 這些檔案依設計含有私密金鑰 |
| `/var/log/fyp/` | `0750` | `root:adm` | 指令碼與 sudo 日誌；可由 `adm` 群組讀取，監控即使用該群組 |
| `/srv/backup/`（位於 `vpnz-dmzjump01`） | `0700` | `root:root` | restic 儲存庫 |
| `/opt/openclaw/` | `0755` | `root:root`；`logs/agent.jsonl` 為 `0640` | 執行期目錄可讀；代理程式稽核日誌不可讀 |
| `/usr/local/bin` 中的自訂指令碼 | `0755` | `root:root` | 可執行但僅 root 可寫——為 keepalived 的 `enable_script_security` 所要求 |

週期性稽核，其本身就是該表為真實而非願景的證據：

```bash
# Find world-writable files outside the known-safe locations (e.g. /tmp, /var/tmp).
sudo find / -xdev -type f -perm -0002 -not -path '/proc/*' -not -path '/sys/*' \
     -not -path '/tmp/*' -not -path '/var/tmp/*' -not -path '/var/mail/*' 2>/dev/null | tee /var/log/fyp/world-writable.txt
wc -l /var/log/fyp/world-writable.txt     # expected: 0

# Find secrets with the wrong mode. Any output here is a defect.
sudo find /etc/wireguard /etc/openvpn /etc/nginx/ssl -type f \( -name '*.key' -o -name 'privatekey*' -o -name 'psk*' \) \
     ! -perm 600 -exec ls -l {} \;      # expected: no output
```

#### 8.8.4 auditd 規則

`auditd` 提供獨立的、核心層級的記錄，使用者空間行程無法編輯它——這正是它與日誌檔不同之處，也是它成為 AI 線路唯讀證據正確來源的原因。

```bash
sudo apt-get install -y auditd audispd-plugins
sudo systemctl enable --now auditd
```

```ini
# /etc/audit/rules.d/99-fyp.rules   —   loaded by augenrules into /etc/audit/audit.rules
# Immutable bit: set LAST, and it stays set until reboot. Removing it requires a reboot,
# which is exactly the property that makes an audit trail trustworthy.

# ---- identity and privilege ----
-w /etc/passwd   -p wa -k fyp_identity
-w /etc/shadow   -p wa -k fyp_identity
-w /etc/group    -p wa -k fyp_identity
-w /etc/sudoers  -p wa -k fyp_sudoers
-w /etc/sudoers.d/ -p wa -k fyp_sudoers

# ---- SSH and authentication ----
-w /etc/ssh/sshd_config                 -p wa -k fyp_sshd
-w /etc/ssh/sshd_config.d/              -p wa -k fyp_sshd
-w /root/.ssh/                          -p wa -k fyp_sshkeys

# ---- the firewall and the tunnels: the configuration that can lock the host out ----
-w /etc/nftables.conf    -p wa -k fyp_nftables
-w /etc/nftables.d/      -p wa -k fyp_nftables
-w /etc/keepalived/keepalived.conf -p wa -k fyp_keepalived
-w /etc/wireguard/       -p wa -k fyp_wireguard
-w /etc/openvpn/         -p wa -k fyp_openvpn

# ---- PKI material ----
-w /etc/openvpn/easy-rsa/pki -p wa -k fyp_pki
-w /etc/nginx/ssl            -p wa -k fyp_tls

# ---- privilege escalation and process execution by administrators ----
-a always,exit -F arch=b64 -S execve -F auid>=1000 -F auid!=-1 -k fyp_exec
-a always,exit -F arch=b64 -S setuid  -F auid>=1000 -F auid!=-1 -k fyp_setuid

# ---- network configuration change ----
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k fyp_network
-w /etc/hostname  -p wa -k fyp_network
-w /etc/hosts     -p wa -k fyp_network
-w /etc/netplan/  -p wa -k fyp_network
-w /etc/resolv.conf -p wa -k fyp_network

# ---- kernel module and time change (anything that could hide activity) ----
-a always,exit -F arch=b64 -S init_module -S finit_module -k fyp_module
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k fyp_time
-w /etc/chrony/chrony.conf -p wa -k fyp_time

# ---- make the rules immutable. MUST be the last line in the file. ----
-e 2
```

```bash
sudo augenrules --load
sudo auditctl -s | grep -E 'enabled|pid'
# Expected: enabled 2   (2 = immutable/locked)
sudo auditctl -l | wc -l              # rule count, recorded as a build fact
sudo ausearch -k fyp_nftables -ts recent | tail -5
```

`-k` 鍵的選擇，是為了讓 AI 線路的 `alert-triage` 技能能查詢*語意*類別（`fyp_nftables`、`fyp_sshkeys`），而非原始系統呼叫編號。`ausearch -k <key>` 是唯讀操作，而那是該代理程式被允許的唯一一種存取。

#### 8.8.5 服務最小化

原則是：主機不應執行它不需要的任何東西，因為每個監聽 socket 都是攻擊面，每個執行中的常駐程式都是一項修補義務。逐角色的允許清單是一項建置產物，且它受到檢查，而非被假設。

| 主機角色 | 必須執行中的服務 | 刻意不存在者及理由 |
|---|---|---|
| `vpnz-nft01/02` | `nftables`、`keepalived`、`wg-quick@wg0`、`ssh`、`systemd-networkd`、`chrony`、`rsyslog`、`node_exporter`、`unattended-upgrades`、`auditd`、`apparmor` | 沒有網頁伺服器、沒有資料庫、沒有郵件、沒有列印（`cups`）、沒有 `avahi`、沒有 `ModemManager` |
| `vpnz-dmzrev01/02` | `nginx`、`keepalived`、`ssh`、`systemd-networkd`、`chrony`、`rsyslog`、`node_exporter`、`unattended-upgrades`、`auditd`、`apparmor` | 沒有資料庫、沒有 `php-fpm`（那屬於 WordPress 節點）、沒有郵件 |
| `vpnz-dmzwp01/02` | `nginx`、`php8.3-fpm`、`mariadb-server`、`ssh`、`chrony`、`rsyslog`、`node_exporter`、`unattended-upgrades`、`auditd`、`apparmor` | MariaDB 必須僅綁定 `127.0.0.1`（如埠對照表所述）——在 DMZ 介面上監聽 `3306` 是一項發現，而非一項組態選擇 |
| `vpnz-lnxra01` | `openvpn-server@server`、`ssh`、`chrony`、`rsyslog`、`node_exporter`、`unattended-upgrades`、`auditd`、`apparmor`，以及它自身的 `nftables` 主機防火牆 | 沒有網頁伺服器、沒有資料庫 |
| `vpnz-dmzjump01` | `ssh`（附轉送例外）、`rsyslog`、`chrony`、`node_exporter`、`unattended-upgrades`、`auditd`、`apparmor` | 沒有網頁伺服器。它是備份儲存庫主機，也是唯一的 DMZ 管理路徑，因此其自身的加固是 DMZ 主機中最嚴格的 |
| `vpnz-mon01` | `prometheus`、`grafana-server`、`loki`、`rsyslog`、`ssh`、`chrony`、`node_exporter`、`unattended-upgrades`、`auditd`、`apparmor`，以及按需使用的 `ansible`/`git` | 除 Grafana 之外沒有網頁伺服器；Git 服務經由 SSH 而非 HTTP 曝露，除非日後有理由加入網頁介面 |
| `vpnz-ai01` | 代理程式執行期、`ssh`（唯讀使用）、`chrony`、`rsyslog`、`node_exporter`、`unattended-upgrades`、`auditd`、`apparmor` | **沒有任何能觸及裝置的 shell**，除經由四個已宣告的唯讀工具之外。這是核心護欄，且必須被示範，而非被主張 |

```bash
# The per-host check: every listening socket must be justifiable from the table above.
sudo ss -tulpn
# Compare against docs/role-allowlist-<host>.txt, which is committed with the runbook.
# Expected output on vpnz-nft01 (form, not an invention — capture the real addresses and PIDs):
#   Netid State  Local Address:Port  Process
#   udp   UNCONN 0.0.0.0:443         users:(("wg-0-wg0"...))
#   udp   UNCONN 0.0.0.0:514?        (no - the firewall does not listen for syslog)
#   tcp   LISTEN 0.0.0.0:22          users:(("sshd",pid=...))
#   tcp   LISTEN 127.0.0.1:9100      users:(("node_exporter",pid=...))
#   udp   UNCONN 0.0.0.0:112         (VRRP is not a socket; it is IP protocol 112)
```

```bash
# Disable and mask services that must never run on a server.
for svc in cups avahi-daemon avahi-daemon.socket ModemManager bluetooth apache2; do
    sudo systemctl disable --now "${svc}" 2>/dev/null || true
    sudo systemctl mask "${svc}" 2>/dev/null || true
done
# 'mask' rather than 'disable': a masked unit cannot be started even as a dependency of something
# else, which 'disable' does not prevent.

# Purge the ones that are pure attack surface on a server.
sudo apt-get purge -y cups avahi-daemon
```

#### 8.8.6 AppArmor 與 SELinux 狀態

| 平台 | 機制 | 本設計中的狀態 | 報告中必須有的陳述 |
|---|---|---|---|
| Ubuntu 24.04 客體 | **AppArmor** | **已啟用，僅使用發行版預設設定檔** | 本設計以出廠的 complain/enforce 模式執行 AppArmor。**未撰寫任何自訂設定檔。** 此事必須陳述為一項刻意的限制，而非暗示為完整的強制存取控制 |
| Ubuntu 24.04 客體 | SELinux | **未安裝** | SELinux 不是 Ubuntu 的預設。它不存在，而其不存在已予陳述 |
| Windows Server 客體 | 兩者皆非 | 不適用 | Windows 上的對等控制項是 GPO 基準，記載於 Microsoft 章節 |

```bash
sudo aa-status --enabled && echo "AppArmor enabled"
sudo aa-status | head -20          # profiles loaded, enforce vs complain counts
sudo aa-status | grep -c 'enforce' # recorded as a build fact per host
systemctl is-enabled apparmor
getenforce 2>/dev/null || echo "SELinux not installed (expected on Ubuntu)"
```

預期的開頭數行：

```text
AppArmor enabled
apparmor module is loaded.
NN profiles are loaded.
NN profiles are in enforce mode.
...
processes are unconfined but have a profile defined.
```

值得記錄的 `[假設]`：Nginx 與 OpenVPN 在 Ubuntu 上都附帶 AppArmor 設定檔。當本專案把 `nginx.conf` 改為 `conf.d` 佈局，並將 TLS 素材指向 `/etc/nginx/ssl/` 時，出廠的 `usr.sbin.nginx` 樣式設定檔可能拒絕讀取新路徑。可觀察到的症狀是 Nginx 錯誤日誌中出現 `502` 並帶 `Permission denied`，**且** journal 中出現 AppArmor 拒絕（`apparmor="DENIED" operation="open"`）；若分析者只讀一份日誌，這是一個確實令人困惑的組合。正確的解決方式是 (a) 在 `/etc/apparmor.d/local/` 中擴充該設定檔並以 `apparmor_parser -r` 重新載入，或 (b) 就該設定檔刻意改為 complain 模式並記錄理由。兩者皆可接受；默默停用 AppArmor 則不可，而此失效模式已列於 §8.12。

### 8.9 Linux 環境的備份與復原

#### 8.9.1 標準要求什麼，以及本設計因此做什麼

WSOS 直接點名此項要求：`Install and manage backup systems`，其巢狀範例為 `Windows Server Backup`、`rsync`、`Script based backup, e.g. Bash, Batch or PowerShell`（範疇 4，第 14 行）。Linux 環境實作**三個具名機制中的兩個**：**`rsync`** 作為傳輸，以及一個 **Bash 指令碼**作為編排。基準所點名的 restic 工具（`04-automation/bash/04-backup-restic.sh`，儲存庫位於 `vpnz-dmzjump01` 上的 `/srv/backup/`）在其上提供快照語意；若 restic 無法取得或無法在可用時間內建置，已記錄的備用方案是單純的 `rsync --link-dest` 快照輪換，它完全由 Bash 與 `rsync` 構成，因此仍然滿足該具名要求。

**範圍界線必須明說，正如基準所要求。** 這是**組態與證據備份**，而非完整的 VM 或 Hypervisor 層級備份。本專案沒有 Hypervisor 備份授權、沒有映像層級的擷取，也沒有裸機還原。所備份的是那些否則將需數週才能重建的素材：組態檔、PKI 素材、憑證、規則集、playbook 與指令碼原始碼，以及證據樹。重建一部客體的方式是重新複製 `UBU2404-TEMPLATE-01` 並重新執行 Ansible playbook——這正是*組態*備份才是真正要緊之事的原因。

#### 8.9.2 備份什麼、從哪裡、到哪裡

| 備份工作 | 目標主機 | 來源路徑 | 目的地 | 頻率 | 保留 |
|---|---|---|---|---|---|
| `BKP-LINUX-ETC-DAILY` | 全部十部 Ubuntu 客體 | `/etc/nginx/`、`/etc/keepalived/`、`/etc/nftables.conf`、`/etc/nftables.d/`、`/etc/wireguard/`、`/etc/openvpn/`、`/etc/ssh/sshd_config.d/`、`/etc/sysctl.d/`、`/etc/netplan/`、`/etc/rsyslog.d/`、`/etc/apt/apt.conf.d/`、`/etc/chrony/`、`/etc/sudoers.d/`、`/etc/audit/rules.d/` | `vpnz-dmzjump01:/srv/backup/linux/<host>/` | 每日 02:15 | 14 份每日、8 份每週、6 份每月 |
| `BKP-LINUX-PKI-WEEKLY` | `vpnz-lnxra01` | `/etc/openvpn/easy-rsa/pki/`（**整個 PKI，包括 `ca.key`**） | `vpnz-dmzjump01:/srv/backup/pki/`，且儲存庫加密 | 每週日 02:30，並在**每一次**憑證簽發或撤銷之後 | 12 份 |
| `BKP-LINUX-DATA-DAILY` | `vpnz-dmzwp01/02` | MariaDB 邏輯傾印與 WordPress 上傳目錄，透過 `mysqldump --single-transaction` 經壓縮管線處理 | `vpnz-dmzjump01:/srv/backup/wordpress/` | 每日 02:45 | 14 份每日 |
| `BKP-AUTOMATION-DAILY` | `vpnz-mon01` | Git 儲存庫、`04-automation/` 原始碼、`06-verification/` 記錄、`07-evidence/` 螢幕截圖、prometheus/grafana provisioning | `vpnz-dmzjump01:/srv/backup/repo/` **以及**由小組持有的第二個媒體 | 每日 03:00 | 30 份每日、12 份每週 |
| `BKP-LOGS-WEEKLY` | 全部客體 | `/var/log/fyp/`、nftables 與 OpenVPN 日誌、稽核軌跡摘錄 | `vpnz-dmzjump01:/srv/backup/logs/` | 每週日 03:15 | 8 份每週 |
| `BKP-RULESET-ON-CHANGE` | `vpnz-nft01/02`、`vpnz-dmzrev01/02` | 以工具自身匯出（`nft list ruleset`、`nginx -T`）擷取的線上渲染後組態 | `vpnz-mon01:/srv/tftp/` 組態保存庫，由自動化線路拉取 | 每次 Ansible 執行時，以及變更前按需執行 | 30 個版本 |

基準將工作命名慣例定為 `BKP-{TARGET}-{FREQ}`，而上表即採用它。有兩項工作值得評論。`BKP-LINUX-PKI-WEEKLY` 是唯一一項**遺失即無法復原**的備份：若 `ca.key` 遺失，每一張用戶端憑證都將變得無法撤銷且無法使用，唯一的補救是重建整個 PKI 並重新簽發所有憑證。因此該工作寫入兩個目的地。`BKP-LOGS-WEEKLY` 存在，是因為日誌就是證據：一張沒有背後日誌行的拒絕螢幕截圖只是斷言，而驗證章節不會接受它。

#### 8.9.3 它如何執行

傳輸是經由 SSH、使用專用金鑰的 `rsync`，由一個帶 `set -euo pipefail` 與日誌檔的 Bash 指令碼呼叫。restic 層加入去重與快照；備用方案是 `rsync --link-dest`。

```bash
#!/usr/bin/env bash
# 04-automation/bash/04-backup-restic.sh
# Vertex Peak FYP — Linux configuration and evidence backup.
# Run as root from cron/timer. Idempotent. Logs to /var/log/fyp/backup-YYYY-MM-DD.log.
# Exit: 0 = all sources succeeded, 1 = at least one source failed (partial success is reported,
#       not hidden — a backup job that reports success on a partial copy is worse than no backup).
set -euo pipefail

HOST="$(hostname -s)"
DEST_HOST="10.10.90.27"                 # vpnz-dmzjump01 — the backup repository host
DEST_BASE="/srv/backup/linux"
KEY="/root/.ssh/id_ed25519_backup"
STAMP="$(date +%Y-%m-%d_%H%M)"
LOGDIR="/var/log/fyp"; LOG="${LOGDIR}/backup-$(date +%Y-%m-%d).log"
RSYNC_OPTS=(-aHAX --numeric-ids --delete-delay --partial --info=stats2
            --exclude='*.sock' --exclude='*/cache/*')

mkdir -p "${LOGDIR}"
exec > >(tee -a "${LOG}") 2>&1
echo "=== ${HOST} backup start ${STAMP} ==="

# Sources are declared as an array so that a missing path is an error, not a silent skip.
SOURCES=(
  /etc/nginx /etc/keepalived /etc/nftables.conf /etc/nftables.d
  /etc/wireguard /etc/openvpn /etc/ssh/sshd_config.d /etc/sysctl.d
  /etc/netplan /etc/rsyslog.d /etc/apt/apt.conf.d /etc/chrony
  /etc/sudoers.d /etc/audit/rules.d
)
fail=0
for src in "${SOURCES[@]}"; do
    if [[ ! -e "${src}" ]]; then
        echo "[!] SKIP (absent on this host, which may be correct): ${src}"
        continue
    fi
    echo "[i] rsync ${src} -> ${DEST_HOST}:${DEST_BASE}/${HOST}/"
    if ! rsync "${RSYNC_OPTS[@]}" -e "ssh -i ${KEY} -o BatchMode=yes -o StrictHostKeyChecking=accept-new" \
            "${src}" "root@${DEST_HOST}:${DEST_BASE}/${HOST}/"; then
        echo "[!] FAILED: ${src}"
        fail=1
    fi
done

# A restic snapshot on top, when restic is available. This gives point-in-time restore and a
# documented retention policy that Rsync alone cannot express.
if command -v restic >/dev/null 2>&1 && [[ -n "${RESTIC_PASSWORD_FILE:-}" ]]; then
    restic -r "sftp:root@${DEST_HOST}:/srv/backup/restic" \
        --password-file "${RESTIC_PASSWORD_FILE}" \
        backup "${SOURCES[@]}" --tag "host=${HOST}" --host "${HOST}" || fail=1
    restic -r "sftp:root@${DEST_HOST}:/srv/backup/restic" \
        --password-file "${RESTIC_PASSWORD_FILE}" \
        forget --keep-daily 14 --keep-weekly 8 --keep-monthly 6 --prune || fail=1
else
    echo "[i] restic unavailable or unconfigured; rsync copy above is the backup of record"
fi

echo "=== ${HOST} backup finished $(date +%Y-%m-%d_%H%M) fail=${fail} ==="
exit "${fail}"
```

WordPress 節點上的 **MariaDB** 工作是唯一需要應用程式感知者，因為複製使用中的 InnoDB 資料目錄會產生損壞的備份：

```bash
# /usr/local/bin/backup-wordpress.sh  (excerpt — the database steps)
# A consistent logical dump. --single-transaction gives a consistent snapshot without locking
# the tables, which is the correct method for InnoDB and the wrong method for MyISAM.
mysqldump --defaults-extra-file=/root/.my.cnf --single-transaction --quick --routines --triggers \
    --databases wordpress | gzip -9 > "/var/backups/wordpress-$(date +%F).sql.gz"

# Uploads are files, so rsync is correct. They are NOT in the dump.
rsync -aHAX /var/www/html/wp-content/uploads/ "root@10.10.90.27:/srv/backup/wordpress/uploads/"

# Integrity check: a gzip stream that fails -t is a corrupt backup and must fail the job.
gzip -t "/var/backups/wordpress-$(date +%F).sql.gz" || { echo "[!] dump is corrupt"; exit 1; }
```

排程使用 `systemd` timer 而非 `cron`，因為 timer 提供狀態、journal 條目以及 `Persistent=true`（VM 關機期間錯過的執行會補跑）：

```ini
# /etc/systemd/system/fyp-backup.service
[Unit]
Description=Vertex Peak FYP Linux configuration backup
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/fyp-backup.sh
User=root
Nice=10
IOSchedulingClass=idle

# /etc/systemd/system/fyp-backup.timer
[Unit]
Description=Daily FYP configuration backup

[Timer]
OnCalendar=*-*-* 02:15:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fyp-backup.timer
systemctl list-timers fyp-backup.timer --no-pager
sudo systemctl start fyp-backup.service         # a manual run to prove it works end to end
journalctl -u fyp-backup.service -n 40 --no-pager
sudo systemctl status fyp-backup.service --no-pager | grep -E 'Active|Main PID|status='
```

#### 8.9.4 還原測試，這是唯一要緊的證據

**從未還原過的備份不是備份。** 還原測試是一項強制且需記錄的演練，並須有計時結果，而誠實的發現正是出現在此處。以下程序完整執行一次，其逐字記錄提交至 `06-verification/`。

```bash
# ---------- RESTORE TEST RT-01 : a single configuration file ----------
# 1. Confirm the file exists in the backup:  ssh root@10.10.90.27 'ls -l /srv/backup/linux/vpnz-nft01/etc/nftables.conf'
# 2. Simulate the loss on a host that is NOT the current master. vpnz-nft02 (BACKUP of vrid 51)
#    is chosen so the test cannot affect service:   sudo mv /etc/nftables.conf /etc/nftables.conf.lost
# 3. Restore:  sudo /usr/local/bin/fyp-restore.sh --host vpnz-nft02 --path /etc/nftables.conf
#    (which is: rsync -aHAX --numeric-ids root@10.10.90.27:/srv/backup/linux/vpnz-nft02/etc/nftables.conf /etc/)
sudo nft -c -f /etc/nftables.conf && echo "syntax OK"    # verify it is CORRECT, not merely present
sudo chmod 0644 /etc/nftables.conf && sudo chown root:root /etc/nftables.conf
rm -f /etc/nftables.conf.lost

# ---------- RESTORE TEST RT-02 : the whole NGINX tree on a proxy node ----------
# Safety net first: take a hypervisor snapshot of vpnz-dmzrev01 BEFORE the test.
sudo mv /etc/nginx /etc/nginx.broken && sudo systemctl restart nginx   # expected: fails to start
sudo rsync -aHAX root@10.10.90.27:/srv/backup/linux/vpnz-dmzrev01/etc/nginx/ /etc/nginx/
sudo nginx -t && sudo systemctl restart nginx
curl -skI --cacert /etc/nginx/ssl/vp-root-ca.crt https://127.0.0.1/healthz | head -1   # HTTP/2 200

# ---------- RESTORE TEST RT-03 : a single file from the restic snapshot ----------
restic -r sftp:root@10.10.90.27:/srv/backup/restic --password-file /root/.restic-pass snapshots
restic -r sftp:root@10.10.90.27:/srv/backup/restic --password-file /root/.restic-pass \
    restore latest --target /tmp/restore-test --include /etc/keepalived/keepalived.conf
diff /tmp/restore-test/etc/keepalived/keepalived.conf /etc/keepalived/keepalived.conf && echo "identical"
```

每次還原測試都必須產出的記錄：

| 欄位 | RT-01 | RT-02 | RT-03 |
|---|---|---|---|
| 使用的備份工作 | `BKP-LINUX-ETC-DAILY` | `BKP-LINUX-ETC-DAILY` | `BKP-LINUX-ETC-DAILY`（restic 層） |
| 來源主機 | `vpnz-nft02` | `vpnz-dmzrev01` | `vpnz-nft01` |
| 被銷毀的內容 | `/etc/nftables.conf` | 整個 `/etc/nginx` 樹 | `/etc/keepalived/keepalived.conf` |
| 還原所需時間 | *實測* | *實測* | *實測* |
| 所執行的驗證 | `nft -c -f` 加上線上規則集比對 | `nginx -t` 加上服務回應 `200` | `diff` 完全相同 |
| 結果 | *通過或失敗，附日誌* | *通過或失敗，附日誌* | *通過或失敗，附日誌* |
| 學到什麼 | *自由文字——這即是發現* | | |

此演練的預期**發現**，以及它值得做的原因：還原很快（一個組態檔很小），但**驗證**才是緩慢的部分，而每次還原都需要一個服務專屬的驗證步驟，那是 `rsync` 無從得知的——規則集用 `nft -c -f`，網頁伺服器用 `nginx -t`，VRRP 組態用 `keepalived --config-test`，通道用 `openvpn --config ... --test-crypto`。籠統的「我們還原了檔案」主張並不足夠。該觀察應作為此演練的一項真實成果寫入報告。

### 8.10 時間、DNS 與 NTP 一致性

時間與名稱解析是會破壞其他一切的兩項靜默相依關係，而本設計將兩者都明確固定。

**DNS。** 每部 Linux 主機都依序經由 `10.10.30.11` 然後 `10.10.30.12` 解析，且**不經由任何其他解析器**。任何 Linux 客體上都未設定公用解析器——不作為第三順位，也不作為備用。原因是公用解析器會讓實驗室主機解析出本應由內部分裂視域區域回答的 `.example` 名稱，產生極難診斷的靜默不一致。兩部 DC 上的條件式轉送器（`vertexpeak.example` 的轉送器指向 `192.0.2.53`）是通往模擬公眾命名空間的唯一路徑，而該路徑僅存在於兩部 DC 上。

```bash
# Verify: exactly two resolvers, in the right order, on every guest.
resolvectl status | grep -A3 'DNS Servers'
cat /etc/resolv.conf
```

預期結果：

```text
Global
         Protocols: -LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported
  resolv.conf mode: stub
Current DNS Server: 10.10.30.11
       DNS Servers: 10.10.30.11 10.10.30.12
        DNS Domain: vertexpeak.fyp.lab
```

```text
# /etc/resolv.conf — expected content (managed by systemd-resolved or netplan, never hand-edited)
nameserver 10.10.30.11
nameserver 10.10.30.12
search vertexpeak.fyp.lab fyp.lab
options timeout:2 attempts:2
```

同一部主機上的名稱解析證明，涵蓋內部名稱與分裂視域公開名稱：

```bash
dig +short vpnz-dc01.vertexpeak.fyp.lab     # expected: 10.10.30.11
dig +short portal.vertexpeak.fyp.lab        # expected: 10.10.90.10
dig +short portal.vertexpeak.example        # expected: 192.0.2.x via the conditional forwarder,
                                            # or NXDOMAIN inside the lab — record which
resolvectl query vpnz-mon01.vertexpeak.fyp.lab
```

兩項會造成真實事故、因此必須檢查而非假設的組態事實。**`systemd-resolved` 與手工編輯的 `/etc/resolv.conf` 會互相衝突**，且該檔案可能是指向 `/run/systemd/resolve/stub-resolv.conf` 的符號連結；手動編輯會在下一次網路事件時被默默還原，因此 §8.2.4 中的 netplan `nameservers` 區塊是設定解析器的唯一正確位置。**`/etc/nsswitch.conf` 的順序要緊**：在 `hosts: files dns` 之下，§8.2.5 的靜態 `/etc/hosts` 項目優先於 DNS，這正是使 `keepalived-hq` 與 `portal.vertexpeak.fyp.lab` 在 DNS 啟動之前即可解析的原因——但這也意味著一筆過時的 `/etc/hosts` 項目會覆寫正確的 DNS 記錄並產生令人困惑的失敗。基於此原因，這兩個檔案都在備份集合中，也都在 auditd 監看清單中。

**時間。** 此鏈路毫不含糊，且必須完全重現，因為超過五分鐘的偏差會破壞 Kerberos，並產生看似完全屬於其他問題的症狀（認證失敗、DFS 複寫錯誤、無法對齊的日誌關聯）。

| 層 | 主機 | 來源 | 機制 |
|---|---|---|---|
| 模擬供應商 | `192.0.2.53` / `192.0.2.54` | 模擬的網際網路 | 僅存在於 Packet Tracer 中 |
| Forest 權威 | `vpnz-dc01`（其次 `vpnz-dc02`） | `192.0.2.53` | Windows Time 服務，對該網域具權威性 |
| Windows 成員 | 全部 Windows 客體 | `vertexpeak.fyp.lab`（即兩部 DC） | 網域階層 |
| **Linux 客體** | 全部十部 Ubuntu 主機 | **`10.10.30.11`，然後 `10.10.30.12`** | `chrony`，組態見 §8.2.9 |
| Linux 作為*伺服器* | `vpnz-mon01` 可服務隔離實驗室網段 | — | 已記錄但預設**未啟用** |

```bash
# Cross-platform consistency check: compare the Linux view with the Windows authority.
# On any Linux host:
chronyc tracking | grep -E 'Reference ID|System time|Leap status'
timedatectl | grep -E 'Time zone|System clock synchronized|NTP service'
date -u +%Y-%m-%dT%H:%M:%SZ

# On vpnz-dc01 (Windows):
#   w32tm /query /status
#   w32tm /stripchart /computer:vpnz-dc01 /samples:3 /dataonly
```

預期的 Linux 輸出形式：

```text
Reference ID    : 0A0A1E0B (10.10.30.11)
System time     : 0.0000314 seconds fast of NTP time
Leap status     : Normal
               Time zone: Asia/Hong_Kong (HKT, +0800)
System clock synchronized: yes
              NTP service: active
```

一致性要求是：**Linux 相對 DC 的偏差遠低於一秒**，且在同一張螢幕截圖中並列讀取時，Linux 主機與 Windows 主機所報告的 UTC 時間須在一秒之內一致。該配對螢幕截圖是 §8.11 所要求的證據項目之一，因為它正是證明兩個平台時鐘已對齊的構件——這使疑難排解章節中的跨平台日誌關聯成為正當作法，而非一廂情願。

```bash
# A skew test that deliberately stresses the requirement, on a spare guest only.
# Windows hosts must never be manually skewed in this project; a Linux guest in an isolated
# namespace is the safe place to demonstrate it.
sudo date -s "$(date -d '+6 minutes' '+%Y-%m-%d %H:%M:%S')"
sudo systemctl restart chrony
sleep 30
chronyc tracking | grep -E 'System time|Leap'
# Expected: chrony slews or steps the clock back toward the reference and reports "Normal" again.
# A forced 'makestep 1.0 3' means the correction happens on the first three updates.
```

### 8.11 證據與螢幕截圖檢查清單

**HDTN 主題表要求文件包含「screen captures」**——該要求來自簡報，而 WSOS 2026 並未包含它（`screen`、`capture`、`screenshot` 及 `evidence` 在標準中各出現 0 次）。因此以下每一項都是簡報要求，且其中任何一項都不得呈現為 WorldSkills 的要求。螢幕截圖存放於 `C:\FYP\07-evidence\` 之下，使用命名慣例 `{date}_{host}_{what}.png`（例如 `2026-10-06_vpnz-dmzrev01_keepalived-failover.png`），而每個標題都依循範本 `Figure {n}: {what} — {host} — {command or action} — {date}`。

**8.2 — 基礎建置與標準化**
- `netplan try` / `netplan generate` 被接受，並附產生的 `ip -br a` 輸出。
- `vpnz-nft01` 上的 `ip route show`，顯示經由 `10.10.50.2` 的預設路由及經由 `10.10.50.1` 的內部路由。
- `hostnamectl status` 顯示正規主機名稱。
- 螢幕上確切的 `netplan` YAML（`/etc/netplan/50-cloud-init.yaml`），且 `ls -l` 中可見 `0600` 權限。
- `sudo sshd -T` 輸出，證明 `permitrootlogin no`、`passwordauthentication no`、`allowgroups gg-infra-admins`。
- 一次**失敗的**密碼登入嘗試，顯示 `Permission denied (publickey).`
- `getent group gg-infra-admins` 顯示恰好那四位管理員。
- `sudo visudo -c` 回傳 `parsed OK`。
- `systemctl status unattended-upgrades` 及一段 `unattended-upgrade --dry-run` 摘錄。
- `chronyc tracking` 與 `timedatectl` 顯示已同步。
- 鎖定套件的 `dpkg -l` 輸出，即版本證據。
- `sudo aa-status` 顯示 AppArmor 已啟用及其設定檔計數。
- `sudo auditctl -l` 顯示已載入的規則數。
- 已完成的 B-01…B-20 基準檢查清單，逐主機簽署並註明日期。

**8.3 — Nginx 網頁層**
- `nginx -v` 與 `dpkg -s nginx` 版本輸出。
- `sudo nginx -t` 回傳 `syntax is ok` / `test is successful`。
- `curl -sI http://portal.vertexpeak.fyp.lab/` 顯示 `301` 及 `Location:` 標頭。
- `curl -sI --cacert ... https://portal.vertexpeak.fyp.lab/` 顯示 `HTTP/2 200` 及完整的安全標頭組。
- `Server:` 標頭顯示**沒有版本字串**（即 `server_tokens off` 的證據），以特寫擷取。
- `openssl s_client` 輸出顯示主體、簽發者、`Protocol: TLSv1.2`/`TLSv1.3`、加密套件，以及 `Verify return code: 0 (ok)`。
- TLS 1.1 嘗試失敗（通訊協定下限的負向測試）。
- 瀏覽器中的**名稱不符警告**，並在標題中寫明解釋。
- 速率限制產生 `503`，並在 `portal.error.log` 中出現對應的 `limiting requests` 行。
- 方法限制產生的 `405`（`curl -X TRACE`）。
- `curl -sk https://127.0.0.1/stub_status` 顯示計數器。
- 一項歸因於後端節點的代理決策，在 `portal.access.log` 中可見為 `upstream=10.10.90.2x:443 ustatus=200`。
- `sudo ss -tlnp` 顯示監聽器。
- `/etc/nginx/conf.d/` 目錄清單，且 `sites-enabled/` 為空。

**8.4 — Keepalived**
- 測試之前**兩部** nginx 對組節點上的 `ip -br a show ens192`（事前狀態）。
- `keepalived --config-test -f /etc/keepalived/keepalived.conf`（或 `keepalived -t`）回傳無誤。
- master 上的 `systemctl stop nginx`，加上失敗的 `vrrp-check-nginx.sh` 執行。
- master 上的 `journalctl -u keepalived`，顯示 `Track script chk_nginx is FAULT state, priority 90` 及 `Entering BACKUP STATE`。
- backup 上的 `journalctl -u keepalived`，顯示 `Receive advertisement timeout` 及 `Entering MASTER STATE`。
- 新 master 上的 `ip -br a show ens192` 顯示 VIP 存在，舊 master 上則顯示其消失。
- 連續的 `curl` 日誌，並標示中斷窗口（起訖時間）。
- `ip neigh show 10.10.90.10` 證明 ARP 快取已跟隨此次移動。
- 回切流程：track script 回復為 `OK, priority 150`，然後在 30 秒的 `preempt_delay` 之後顯示 `Entering MASTER STATE`。
- **nftables 對組**（`vrid 51`）的同一流程：`sudo nft flush ruleset`、失敗的 `vrrp-check-nftables.sh`、`FAULT state, priority 120` 行，以及刻意以 `systemctl stop keepalived` 進行的交班及 `Sent 0 priority advert` 行。
- 兩份 `keepalived.conf` 並列，顯示相同的 VRID 及相異的 `router_id`、`state` 與 `priority`。
- 來自 `vrrp-notify.sh` 的 `/var/log/fyp/keepalived-transitions.log`。

**8.5 — nftables**
- `sudo nft -c -f /etc/nftables.conf` 產生**無任何輸出**（語法檢查成功），並可見其結束狀態。
- `sudo nft list tables` 顯示 `table inet fyp_filter`。
- `sudo nft list ruleset`——完整規則集，必要時分節呈現，且須清晰可讀。
- `sudo nft list chain inet fyp_filter input` 與 `... forward` 顯示 `policy drop`。
- `sudo nft list sets` 顯示各集合及其元素。
- 帶非零封包計數的規則計數器（證明規則被匹配，而非死規則）。
- `sudo conntrack -L` 顯示一條來源已被改寫的 masquerade 流量。
- **namespace DNAT 測試**：模擬外部用戶端執行 `curl -skI https://198.51.100.2/healthz` 回傳 `200`。
- 對應的 `conntrack` 條目，顯示 DNAT 至 `10.10.90.10`。
- 從外部對未發佈埠的請求逾時，加上 `NFT-DROP: FORWARD` / `TB-05` 日誌行。
- **TB-04** 拒絕：DMZ 主機無法抵達 `10.10.30.11:445`，並在旁顯示 `NFT-DROP: TB-04 ` 日誌行。
- **TB-06** 拒絕：外部 namespace 無法抵達 `10.10.30.11`，附 `NFT-DROP: TB-06 `。
- **TB-12** 拒絕：VPN 用戶端無法抵達 `10.20.20.10`，附 `NFT-DROP: TB-12 `。
- 同一來源的允許/拒絕配對置於同一張螢幕截圖中（「是政策，不是路由」的證明）。
- 在刻意洪水攻擊後，各前綴的 `grep -c` 計數。
- `ip_forward`、`rp_filter`、`syncookies`、`nf_conntrack_max` 的 `sysctl` 輸出。
- 回退示範：注入錯誤規則、從主控台復原、該規則消失。
- `systemctl status nftables` 以及一次**重新開機**的結果，證明持久化。

**8.6 — OpenVPN**
- `openvpn --version` 與 `dpkg -s openvpn` 版本輸出。
- `ls -l /etc/openvpn/easy-rsa/` 顯示 `0700`，並可見 `pki/` 子樹。
- `init-pki`、`build-ca`、`build-server-full`、`build-client-full` 及 `gen-crl` 的成功訊息。
- `cat /etc/openvpn/easy-rsa/vars` 顯示演算法、金鑰長度、摘要及有效期。
- 以 `openssl x509 -in pki/ca.crt -noout -subject -issuer -dates` 顯示的 CA 憑證。
- `systemctl status openvpn-server@server` 顯示 `Status: "Initialization Sequence Completed"`。
- 伺服器啟動日誌在 `verb 3` 下顯示 `Initialization Sequence Completed`。
- 一次成功的用戶端連線日誌，顯示 `VERIFY OK: depth=0, CN=server-vpnz-lnxra01` 及 `PUSH_REPLY`。
- 用戶端的 `ip route show | grep tun0`，證明那三個被推送的前綴且**沒有預設路由**。
- 經由通道 `ping` 到 `10.10.30.11` 成功。
- 負向測試：`10.20.20.10`、`10.70.0.50` 及 `10.10.80.21` 全部失敗，並附 `TB-12`/`TB-09` 日誌行。
- `/var/log/openvpn/status.log` 顯示已連線用戶端表。
- **撤銷測試**：被撤銷用戶端一側的 `VERIFY ERROR: ... certificate revoked` 行**以及**伺服器一側的 `CRL CHECK FAILED` 行，**以及**同一時刻一個未被撤銷的用戶端仍能連線。

**8.7 — WireGuard**
- `wg --version` 與 `modinfo wireguard`。
- `stat -c '%a %U:%G %n' /etc/wireguard/*` 顯示私密金鑰與 PSK 上為 `600`。
- 總部一側的 `sudo wg show` 顯示兩個對等節點及其 `latest handshake` 與 `transfer` 值。
- `sudo wg show all dump` 的原始 tab 分隔形式。
- `ip -br a show wg0` 與 `ip -4 rule show` 及 `ip route show table 51820`。
- 從分支對等節點 `ping` 到 `10.10.30.11` 及 `10.10.90.10` 成功。
- 從分支對等節點的負向測試：`10.20.20.10`（TB-14）與 `10.70.0.50` 失敗，並附 `NFT-DROP: TB-14 ` 日誌行。
- 管理逃生通道顯示為**不存在**（`ip -br a | grep -c wg1` 回傳 0）。
- `iperf3` 結果，並在標題中說明這是僅主機的模擬鏈路，而非真實世界的 WAN 吞吐量。
- 決策日誌條目，為灣仔 WireGuard 對等節點記錄選項 A 或選項 B，並附關於 Cisco 互通的誠實陳述。

**8.8 — 基準加固**
- 針對所有人可寫檔案的 `find` 掃描回傳**空結果**。
- 針對權限錯誤的秘密檔案的 `find` 掃描回傳**空結果**。
- `sudo ss -tulpn` 與逐主機角色允許清單的比對。
- `sudo ausearch -k fyp_nftables -ts recent` 顯示一筆稽核記錄。
- `sudo auditctl -s | grep enabled` 顯示 `2`（不可變更）。
- `sudo aa-status` 及其 enforce/complain 計數。

**8.9 — 備份與復原**
- systemd timer 清單顯示 `fyp-backup.timer` 已排程。
- 一次已完成的備份執行日誌，附逐來源的 `rsync` 結果。
- `vpnz-dmzjump01` 上目的地樹的清單，附大小與日期。
- `restic snapshots` 輸出（若使用 restic 層）。
- 全部三次還原測試（RT-01、RT-02、RT-03），附**銷毀前**、**還原指令**及**還原後驗證**畫格，以及計時結果表。

**8.10 — 時間、DNS 與 NTP**
- `resolvectl status` 顯示恰好兩部 DNS 伺服器且順序正確。
- 針對內部名稱及 `.example` 名稱的 `dig +short`。
- `chronyc tracking` 與 `chronyc sources -v` 顯示兩部 DC。
- **配對時鐘螢幕截圖**：在同一分鐘內擷取 Linux 主機上的 `date -u` 與 `vpnz-dc01` 上的 `w32tm /query /status`（或 `Get-Date -AsUTC`），顯示兩者在一秒內一致。
- 刻意的偏差測試：施加偏差，然後復原後的 `chronyc tracking`。

**8.12 及 8.13 — 疑難排解與發現**
- 對**每一個**已演練的失效模式，記錄症狀、診斷指令及解決方式，並附前後證據。
- 針對每一項實測與預期之差異（包括從未解決者）的發現日誌條目（範本見 §8.13）。

### 8.12 常見失效模式與疑難排解

本小節直接服務 WSOS 的**疑難排解範疇（25%）**，其編寫方式使每一條目皆可據以行動而無須另行研究。診斷欄位點名的是能將該原因與其他可能*區分開來*的指令，而那正是該範疇真正在評量的技能。

| # | 症狀 | 可能原因 | 診斷指令 | 解決方式 |
|---|---|---|---|---|
| T-01 | 對 Linux 客體的 `ssh` 逾時；`ping` 同樣失敗 | `netplan` 位址錯誤、YAML 中的介面名稱錯誤，或缺少回程路由。靜默的 `netplan` 失敗最為常見 | 在主機上，經由 **Hypervisor 主控台**：`ip -br a`、`ip route`、`networkctl status ens192`、`journalctl -u systemd-networkd -n 50` | 以來自 `ip -br link` 的真實介面名稱修正 YAML，然後 `sudo netplan try`。若客體不可達而主控台是唯一途徑，那本身就是支持 `netplan try` 紀律的論據 |
| T-02 | `ssh` 有回應，但每次登入都被拒絕並出現 `Permission denied (publickey)`，即使金鑰正確 | 該使用者不在 `gg-infra-admins` 中而被 `AllowGroups` 拒絕；或金鑰檔權限錯誤；或 `~/.ssh` 為 `0777` | `journalctl -u ssh -n 40`、`sudo sshd -T \| grep allowgroups`、`getent group gg-infra-admins`、`ls -ld ~/.ssh ~/.ssh/authorized_keys`，然後從用戶端 `ssh -vvv` | 將該使用者加入群組，`chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`，並檢查 `PubkeyAuthentication yes` 是否確實生效 |
| T-03 | 網頁 VIP 已啟用，但 `curl` 回傳 `502 Bad Gateway` | 代理的 Nginx 正在執行，但上游集區不可達，或 `proxy_ssl_verify` 正在拒絕來源站憑證 | 從代理主機本身執行 `curl -skI https://10.10.90.2x/`；`tail -50 /var/log/nginx/portal.error.log \| grep -i 'upstream\|ssl'`；`openssl s_client -connect 10.10.90.21:443 -servername www.vertexpeak.example -CAfile /etc/nginx/ssl/vp-root-ca.crt` | 若 TLS 檢查失敗，在代理上以 `update-ca-certificates` 安裝內部根憑證；若來源站確實已停，`vrrp-check-pool.sh` 應已降低優先權——請驗證它確實如此，因為若否，則 track script 並未運作，那才是真正的缺陷 |
| T-04 | 在瀏覽器中 `curl https://portal...` 回傳**名稱不符**或**簽發者不受信任**錯誤，但使用 `--cacert` 時可運作 | 瀏覽器不信任內部 CA，且 `.example` 名稱不符合真實公開憑證 | `openssl s_client -connect ... -servername portal.vertexpeak.example \| openssl x509 -noout -subject -ext subjectAltName` | 在瀏覽器的信任存放區中安裝 `vp-root-ca.crt`，或使用同一張憑證所帶的 `.fyp.lab` SAN。**這是實驗室的預期狀況，並非缺陷**——請截圖並加以解釋 |
| T-05 | 加入 HTTP/2 指示詞後 Nginx 無法啟動 | 已安裝的建置不接受 `http2 on;` 獨立形式，或同一行 `listen` 同時使用了舊式 `http2` 參數 | `sudo nginx -t`（錯誤訊息會指出檔案與行號） | 僅使用其中一種形式，絕不並用：`listen 443 ssl;` 加 `http2 on;`，或單獨的 `listen 443 ssl http2;`。記錄已建置版本接受哪一種形式 |
| T-06 | `nginx -t` 通過，但某個站台回傳**預設**頁面或錯誤的 vhost | `/etc/nginx/sites-enabled/default` 仍存在，或兩個 server 區塊都聲稱 `default_server`，或未送出 SNI | `sudo nginx -T \| grep -n 'server_name\|default_server\|root '`（`-T` 旗標會傾印*實際生效*的組態） | 移除套件附帶的預設站台；僅保留一個 `default_server`；以 `curl --resolve` 測試，使 Host 標頭與 SNI 明確 |
| T-07 | VIP 存在於某節點上，但用戶端仍抵達舊節點，或流量被送入黑洞 | gratuitous ARP 未被吸收，因此用戶端的 ARP/鄰居快取仍持有舊 MAC | 用戶端上的 `ip neigh show 10.10.90.10`、`arping -c 3 10.10.90.10`；在該節點上 `ip -br a` 及 `journalctl -u keepalived` 尋找 `Sending gratuitous ARP` 行 | 等待快取過期，或強制更新（`ip neigh flush to 10.10.90.10`）。若每次容錯移轉都發生，請檢查 `vrrp_garp_interval` 是否已設定，以及 Hypervisor 的虛擬網路是否在過濾 ARP |
| T-08 | VRRP 對組的兩部節點都聲稱持有 VIP，或兩者皆無 | `auth_pass` 值不同、`router_id` 重複，或兩部節點優先權相同 | 兩部節點上的 `journalctl -u keepalived -n 60`；`sudo tcpdump -ni ens192 -c 20 vrrp`（VRRP 為 IP 通訊協定 112） | 使 `router_id` 唯一、`auth_pass` 逐位元組相同，並將優先權設為 150/100。`tcpdump` 只顯示來自一部節點的通告，即是「對等節點並未送出」的決定性測試 |
| T-09 | 某個 `vrrp_script` 從未導致容錯移轉 | `weight` 的算術未跨越對等節點的優先權，或 `enable_script_security` 正默默拒絕執行該指令碼 | `journalctl -u keepalived \| grep -i 'script\|Track script'`、`ls -l /usr/local/bin/vrrp-check-*.sh`，並手動執行該指令碼以確認其結束碼 | 修正權重算術，使必須觸發交班的檢查滿足 `priority + weight < peer priority`；將指令碼設為 `0755` 且 `root:root`；並注意 nftables 檢查是**刻意**使用 `weight -30` 而不觸發容錯移轉 |
| T-10 | nftables 丟棄了本應被允許的流量，且日誌前綴為 `NFT-DROP: FORWARD` | 缺少該確切來源/目的配對的允許規則，或允許規則被置於已匹配的拒絕規則**之後**，或 `iifname` 指名的介面錯誤 | `sudo nft -a list chain inet fyp_filter forward`、`sudo conntrack -L \| grep <addr>`、`sudo journalctl -k \| grep 'NFT-DROP: FORWARD' \| tail -20` | 加入該特定允許規則，置於全捕捉之前，並以 `ip -br link` 確認介面名稱。使用 `nft -a` 取得規則 handle，使確切匹配的規則可在報告中引用 |
| T-11 | 一條轉送流量僅在一個方向可運作 | 缺少 `ct state established,related accept` 規則，或它被置於某條拒絕規則之後；或回程路徑的路由缺失（`rp_filter` 默默丟棄） | `sudo conntrack -L \| grep <flow>`、`sysctl net.ipv4.conf.all.rp_filter`、`sudo journalctl -k \| grep -i martian`、`ip route get <client-ip> from <server-ip>` | 將具狀態捷徑還原為第一條規則；檢查 `log_martians` 輸出，因為 `rp_filter` 的丟棄會記錄為 martian，否則便不可見 |
| T-12 | 某個 WireGuard 對等節點完全沒有握手 | 金鑰或 `PresharedKey` 不符、`Endpoint` 錯誤、對側未在監聽，或防火牆丟棄 UDP 443 | `sudo wg show`、`sudo tcpdump -ni ens224 udp port 443`、`sudo ss -lunp \| grep 443`，並將 `wg pubkey < privatekey` 與對等節點所設定的公開金鑰比對 | 以私密金鑰推導公開金鑰來驗證，而非目視；確認兩個 `PresharedKey` 值相符；確認兩端的 nftables input chain 都允許 `udp dport 443` |
| T-13 | WireGuard 握手成功，對等節點出現在 `wg show` 中，但**沒有流量流動** | 缺少該對等節點通道位址的回程路由，或 `AllowedIPs` 未涵蓋所測試的前綴，或 MTU 過大以致只有大封包遺失 | `ip route get 10.10.200.65`、`ip route show table 51820`、`sudo wg show`，以及 `ping -M do -s 1372 10.10.200.1` 測試 MTU | 將路由加回通道內（`ip route add 10.10.200.64/26 dev wg0 table 51820`）；確認 `AllowedIPs` 恰好涵蓋所測試的前綴；設定 `MTU = 1420` 並重測。「ping 可用，`scp` 停滯」的變體即是典型的 MTU 症狀 |
| T-14 | WireGuard 通道在重新開機後存續，但每次 keepalived 容錯移轉都斷掉 | 對等節點的 `Endpoint` 指向**節點**位址（`10.10.50.11`）而非 **VIP**（`10.10.50.10` / `203.0.113.2`）；或第二部節點上未啟用 `wg0` | 在分支對等節點上：`sudo wg show`（所顯示的端點位址即為實際使用的那一個）；在總部節點上：交班後的 `ip -br a show wg0` | 將對等節點的 `Endpoint` 改為 VIP，在**兩部**節點上啟用 `wg-quick@wg0`，並在 keepalived 的 `virtual_ipaddress_excluded` 中宣告該通道位址，使其隨 VIP 浮動 |
| T-15 | OpenVPN 用戶端連線並取得位址，但無法抵達任何目標 | 被推送的路由未被套用（用戶端忽略了推送），或伺服器的 `ip_forward` 關閉，或內部網路上缺少通往 `10.10.202.0/24` 的回程路由 | 在用戶端上：`ip route show \| grep tun0`。在伺服器上：`sysctl net.ipv4.ip_forward`、`ip route show \| grep 10.10.202`，以及 `sudo journalctl -k \| grep 'NFT-DROP'` | 在 `vpnz-lnxra01` 上啟用 `ip_forward`，確保通往 `10.10.202.0/24` 的內部路由指向 `10.10.30.42`，並確認用戶端未以 `pull-filter` 過濾 `PUSH_REPLY` |
| T-16 | OpenVPN 用戶端全部同時被拒絕，而先前一直可用 | CRL 已**過期**（`EASYRSA_CRL_DAYS` 已過），或該 CRL 檔無法被降權後的使用者讀取 | `openssl crl -in /etc/openvpn/server/crl.pem -noout -nextupdate -lastupdate`、`ls -l /etc/openvpn/server/crl.pem`、`journalctl -u openvpn-server@server \| grep -i crl` | 重新產生並重新發佈：`./easyrsa gen-crl`，複製至 `/etc/openvpn/server/crl.pem`，設定權限 `0644`，重新啟動服務。然後加入行事曆提醒——過期的 CRL 是一場已排定的服務中斷 |
| T-17 | 某個特定用戶端無法再連線，其他用戶端卻可以 | 該用戶端的憑證已被撤銷且 CRL 正在被強制執行，或其憑證已過期 | 伺服器：`openssl crl -in /etc/openvpn/server/crl.pem -noout -text \| grep -A2 'Serial Number'`；`grep <CN> /etc/openvpn/easy-rsa/pki/index.txt`；用戶端：`openssl x509 -in <cert> -noout -dates` | 若撤銷是刻意的，則無須任何動作——該控制項發揮了作用，而該日誌行即為證據。若非刻意，則簽發新憑證。**絕不**以停用 `crl-verify` 來「修正」此事 |
| T-18 | `nft -f` 成功，但重新開機後規則消失 | `nftables.service` 未啟用，或開機時有其他東西清空了規則集（容器執行期、DHCP 用戶端 hook，或另一個單元） | `systemctl is-enabled nftables`、重新開機後的 `systemctl status nftables`、`journalctl -b \| grep -i nft` | `sudo systemctl enable --now nftables`，然後重新開機並再次驗證。若另有單元正在清空，以 `journalctl -b \| grep -i 'flush\|nftables'` 找出它，並使 `nftables.service` 排序於其後 |
| T-19 | 規則集變更後防火牆主機不可達，且 SSH 無法重新建立 | `input` chain 的錯誤，且被套用至開機規則集，因此能在重新開機後存續 | 唯一可靠的診斷是 Hypervisor 主控台 | 從主控台復原：`sudo nft -f /etc/nftables.d/rollback-<stamp>.nft`，或 `sudo systemctl stop nftables && sudo nft flush ruleset`。然後以 `02-nftables-apply.sh` 及其回退計時器重新套用修正後的檔案。**這正是每次套用之前都先建立回退構件的原因** |
| T-20 | 跨平台的 Kerberos 認證失敗，且日誌時間戳記無法對齊 | 時鐘偏差超過五分鐘，或某部 Linux 主機經由與 DC 所公佈不同的 DNS 伺服器解析 | `chronyc tracking`、`timedatectl`、與 `vpnz-dc01` 上 `w32tm /query /status` 相比的 `date -u`；`resolvectl status`；`dig +short vpnz-dc01.vertexpeak.fyp.lab` | 將 `chrony` 指向 `10.10.30.11`/`10.10.30.12`，套用修正並重測。偏差是原因的情況，遠比症狀所暗示的更常見 |
| T-21 | `nginx` 對一個確實存在的靜態路徑回傳 `403 Forbidden` | 檔案系統權限、AppArmor 拒絕，或 SELinux 式的情境問題（在 Ubuntu 上不適用） | 對該檔案及每一層父目錄執行 `ls -l`、`namei -l /path/to/file`、`sudo journalctl -k \| grep -i 'apparmor.*DENIED'` | 修正擁有權/權限使 `www-data` 能讀取該路徑，或擴充 AppArmor 本機設定檔並重新載入。journal 是決定性的證據，這也是為何兩份日誌都必須讀取 |
| T-22 | 多網段防火牆主機上間歇性的單向封包遺失，並出現「martian」日誌行 | 嚴格的 `rp_filter` 丟棄非對稱回程流量，或某位址位於錯誤的介面上 | `sudo journalctl -k \| grep -i martian`、`sysctl net.ipv4.conf.all.rp_filter`、從相反方向執行的 `ip route get <dst>` | 在拓撲對稱處（如本例）保留嚴格 `rp_filter`。若刻意引入非對稱，則使用 `rp_filter = 2`（寬鬆），並將該變更記錄為一項設計決定，絕不默默設為 `0` |

使用本表的兩條後設規則，值得說明，因為它們正是區分勝任的疑難排解者與快速者的關鍵。**先讀日誌再改組態**——在本環境中，以上每一項症狀都有對應的日誌行，而未讀日誌就做出的變更，會毀掉原本足以證明原因的證據。以及**一次只改一件事**：同時改動規則集、優先權與 track script 的容錯移轉測試，會產生無人能解讀的結果，且該測試必須從已知狀態重新執行。

### 8.13 發現

主題表要求文件包含「all findings」，而 WSOS 本身也將文件化列為一項明確義務（`Prepare a technical document reflecting the solution in detail for agreement and sign-off`，範疇 6，第 7 行；`The purpose of documenting the completion of the installation or up-grade`，範疇 6，第 6 行）。因此發現日誌是本線路的一級交付項目，而非副產品。它以 `06-verification/findings-linux.md` 維護，每項觀察一條，於建置期間逐筆附加，而非事後重建。

每一項發現都記錄於此範本中：

```text
FIND-L2-NN — <one-line title>

- Date and host:           2026-10-06, vpnz-dmzrev02
- Sub-section:             §8.4 Keepalived
- Test case ID:            TC-L2-02 (and the TB row, if a trust boundary is involved)
- EXPECTED (from the design baseline):
    A VRRP pair with a service track script moves the VIP within ~3 s of the lost
    service, and clients see a bounded interruption of about the detection interval.
- OBSERVED (what actually happened):
    The VIP moved 6.2 s after 'systemctl stop nginx'. The continuity probe failed for
    2 requests (~1.0 s at 0.5 s intervals) and recovered against vpnz-dmzrev02.
- EVIDENCE:
    Figure 12: keepalived transition on the master — vpnz-dmzrev01 — journalctl -u keepalived — 2026-10-06
    Figure 13: failover continuity log — client — curl loop — 2026-10-06
    Log: 07-evidence/2026-10-06_vpnz-dmzrev01_keepalived-transitions.log
- DIFFERENCE AND WHY IT MATTERS:
    Detection took about twice the theoretical minimum (interval 3 s x fall 2 = 6 s),
    which is exactly as designed, but 'high availability' did NOT mean zero downtime.
    Any claim of uninterrupted service would be false.
- CAUSE (if established) / UNKNOWN IF NOT:
    Cause established: chk_nginx has interval=3 and fall=2, so two consecutive failures
    are required before the weight is removed.
- RESOLUTION OR ACCEPTANCE:
    Accepted as a design property and documented as a measured figure. The alternative
    (interval 1, fall 1) was rejected because it would make the pair flap on a single
    slow HTTP response; the trade-off is recorded.
- FOLLOW-UP / OWNER:
    None. W2.
- STATUS:                  CLOSED (accepted) | OPEN | WONTFIX-with-reason
```

使該日誌可信、且必須在報告中說明的紀律：

1. **每一項發現都引用一個測試案例 ID，且涉及信任邊界時引用該信任邊界列。** 一堆軼事不是發現日誌；一堆可追溯的觀察才是。
2. **偏差被記錄，而非被粉飾。** 若執行中的 `keepalived` 版本不是 2.2.8，或 Packet Tracer ASA 映像字串與基準不同，或 HTTP/2 指示詞語法需要備用形式，那就寫下來，並附上基準鎖定紀律所要求的版本偏差小節。
3. **未達預期是比隱藏它更強的成果。** 當 Nginx 的 OCSP stapling 因內部 CA 的回應器不可達而未發生時，發現是：stapling 已設定、經驗證確認未發生，以及原因——而不是該指示詞被悄悄移除。同樣原則適用於 AI 線路中的偽陽性或幻覺：記錄該失敗即是學術成果。
4. **發現回饋至驗證章節與風險登記冊。** 揭示新失效機制的發現會被加入 §8.12 及專案風險登記冊；帶有後續負責人的未結發現，由交付排程的第 11 週驗證關卡追蹤至結案。

